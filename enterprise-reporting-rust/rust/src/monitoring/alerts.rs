//! `dispatchAlerts` and its helpers from `monitoring-worker.ts`.
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};

use super::{
    evaluate::Evaluation,
    js::{number_to_string, to_fixed},
};
use crate::{common::time::now_iso, email};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct AlertRecipient {
    #[serde(rename = "type")]
    pub kind: String,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DispatchResult {
    pub channel: String,
    pub success: bool,
    pub recipient_count: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// The rule fields dispatch reads.
#[derive(Debug, Clone)]
pub struct AlertRule {
    pub id: String,
    pub name: String,
    pub alert_channels: Vec<String>,
    pub alert_recipients: Vec<AlertRecipient>,
    pub webhook_url: Option<String>,
}

fn ip_is_internal(ip: std::net::IpAddr) -> bool {
    use std::net::IpAddr;
    match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()
                || v4.is_private()
                || v4.is_link_local()
                || v4.is_unspecified()
                || v4.is_broadcast()
                || v4.octets()[0] == 0
                // 100.64.0.0/10, carrier-grade NAT
                || (v4.octets()[0] == 100 && (64..128).contains(&v4.octets()[1]))
        }
        IpAddr::V6(v6) => {
            v6.is_loopback()
                || v6.is_unspecified()
                || (v6.segments()[0] & 0xfe00) == 0xfc00 // unique local fc00::/7
                || (v6.segments()[0] & 0xffc0) == 0xfe80 // link local fe80::/10
                || v6.to_ipv4_mapped().is_some_and(|m| ip_is_internal(IpAddr::V4(m)))
        }
    }
}

/// `isPrivateOrLoopback(url)` — the webhook SSRF guard. Unparseable is unsafe.
///
/// The URL is parsed with a WHATWG parser — the one the HTTP client uses —
/// so the host checked is the host that will be connected to. Splitting the
/// string by hand let `http://127.0.0.1\@example.com/` (a backslash is a
/// slash to a WHATWG parser), `http://2130706433/` and `http://0177.0.0.1/`
/// (both 127.0.0.1) through, which Node's `new URL()` normalises and blocks.
#[must_use]
pub fn is_private_or_loopback(url: &str) -> bool {
    use reqwest::Url;
    use url::Host;
    let Ok(parsed) = Url::parse(url) else {
        return true;
    };
    if !matches!(parsed.scheme(), "http" | "https") {
        return true;
    }
    match parsed.host() {
        None => true,
        Some(Host::Ipv4(v4)) => ip_is_internal(v4.into()),
        Some(Host::Ipv6(v6)) => ip_is_internal(v6.into()),
        Some(Host::Domain(d)) => {
            let d = d.trim_end_matches('.').to_ascii_lowercase();
            d == "localhost" || d.ends_with(".localhost")
        }
    }
}

/// [`is_private_or_loopback`], plus every address the host resolves to. A
/// public name pointing at `127.0.0.1` is the same request to loopback. (Node
/// checks the name only.)
pub async fn webhook_target_blocked(url: &str) -> bool {
    if is_private_or_loopback(url) {
        return true;
    }
    let Ok(parsed) = reqwest::Url::parse(url) else {
        return true;
    };
    // host_str keeps IPv6 brackets, so "host:port" parses either way.
    let (Some(host), Some(port)) = (parsed.host_str(), parsed.port_or_known_default()) else {
        return true;
    };
    let target = format!("{host}:{port}");
    let resolved = tokio::net::lookup_host(target).await;
    match resolved {
        Ok(addrs) => {
            let addrs: Vec<_> = addrs.collect();
            addrs.is_empty() || addrs.iter().any(|a| ip_is_internal(a.ip()))
        }
        Err(_) => true,
    }
}

/// `(user_id, email)` for the recipients: named users plus members of named
/// roles, active users only, users first and no duplicates.
///
/// # Errors
/// On a database error.
pub async fn resolve_recipients(
    pool: &PgPool,
    recipients: &[AlertRecipient],
) -> Result<Vec<(String, String)>, sqlx::Error> {
    let user_ids: Vec<String> = recipients
        .iter()
        .filter(|r| r.kind == "user")
        .map(|r| r.id.clone())
        .collect();
    let role_ids: Vec<String> = recipients
        .iter()
        .filter(|r| r.kind == "role")
        .map(|r| r.id.clone())
        .collect();
    let mut out: Vec<(String, String)> = Vec::new();
    if !user_ids.is_empty() {
        for r in sqlx::query("SELECT id, email FROM users WHERE id = ANY($1) AND is_active = true")
            .bind(&user_ids)
            .fetch_all(pool)
            .await?
        {
            out.push((r.get("id"), r.get("email")));
        }
    }
    if !role_ids.is_empty() {
        for r in sqlx::query(
            "SELECT DISTINCT users.id, users.email FROM user_roles \
             INNER JOIN roles ON roles.id = user_roles.role_id \
             INNER JOIN users ON users.id = user_roles.user_id \
             WHERE roles.id = ANY($1) AND users.is_active = true",
        )
        .bind(&role_ids)
        .fetch_all(pool)
        .await?
        {
            let id: String = r.get("id");
            if !out.iter().any(|(u, _)| *u == id) {
                out.push((id, r.get("email")));
            }
        }
    }
    Ok(out)
}

/// `createNotification` (`src/lib/notifications.ts`).
///
/// # Errors
/// On a database error.
pub async fn create_notification(
    pool: &PgPool,
    user_id: &str,
    kind: &str,
    title: &str,
    message: &str,
    metadata: Option<&Value>,
) -> Result<String, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO notifications (id, user_id, type, title, message, metadata) VALUES ($1, $2, $3, $4, $5, $6)")
        .bind(&id)
        .bind(user_id)
        .bind(kind)
        .bind(title)
        .bind(message)
        .bind(metadata.map(Value::to_string))
        .execute(pool)
        .await?;
    Ok(id)
}

const ALERT_HTML: &str = include_str!("alert_email.html");

fn severity_colours(critical: bool) -> [(&'static str, &'static str); 3] {
    if critical {
        [
            ("__HEADER__", "#dc2626"),
            ("__BADGE_BG__", "#fee2e2"),
            ("__BADGE_FG__", "#991b1b"),
        ]
    } else {
        [
            ("__HEADER__", "#d97706"),
            ("__BADGE_BG__", "#fef3c7"),
            ("__BADGE_FG__", "#92400e"),
        ]
    }
}

/// # Errors
/// On a database error while resolving recipients.
pub async fn dispatch_alerts(
    pool: &PgPool,
    rule: &AlertRule,
    ev: &Evaluation,
    execution_id: &str,
) -> Result<Vec<DispatchResult>, sqlx::Error> {
    let mut results = Vec::new();
    let users = resolve_recipients(pool, &rule.alert_recipients).await?;
    let triggered_at = now_iso();
    let mut payload = json!({
        "ruleId": rule.id,
        "ruleName": rule.name,
        "executionId": execution_id,
        "status": ev.status.as_str(),
        "severity": ev.breach_severity,
        "actualValue": ev.actual_value,
        "thresholdValue": ev.threshold_value,
        "message": ev.message,
        "triggeredAt": triggered_at,
    });
    // Node's `severity: undefined` is dropped by JSON.stringify, not written as null.
    if ev.breach_severity.is_none() {
        if let Some(o) = payload.as_object_mut() {
            o.shift_remove("severity");
        }
    }
    let fail = |channel: &str, error: &str| DispatchResult {
        channel: channel.into(),
        success: false,
        recipient_count: 0,
        error: Some(error.into()),
    };

    for channel in &rule.alert_channels {
        match channel.as_str() {
            "email" => {
                let emails: Vec<String> = users
                    .iter()
                    .map(|(_, e)| e.clone())
                    .filter(|e| !e.is_empty())
                    .collect();
                if emails.is_empty() {
                    results.push(fail("email", "No email recipients resolved"));
                    continue;
                }
                let critical = ev.breach_severity == Some("CRITICAL");
                let mut html = ALERT_HTML.to_string();
                for (k, v) in severity_colours(critical) {
                    html = html.replace(k, v);
                }
                let mut vars = Map::new();
                vars.insert("ruleName".into(), json!(rule.name));
                vars.insert("status".into(), json!(ev.status.as_str()));
                vars.insert(
                    "actualValue".into(),
                    json!(ev
                        .actual_value
                        .map_or_else(|| "N/A".to_string(), number_to_string)),
                );
                vars.insert(
                    "thresholdValue".into(),
                    json!(number_to_string(ev.threshold_value)),
                );
                vars.insert(
                    "deviationPct".into(),
                    json!(ev.delta_from_previous.map(|d| to_fixed(d, 1)).unwrap_or_default()),
                );
                vars.insert("message".into(), json!(ev.message));
                vars.insert("triggeredAt".into(), json!(triggered_at));
                let subject = format!(
                    "[{}] Monitoring Alert: {}",
                    if critical { "CRITICAL" } else { "WARNING" },
                    rule.name
                );
                let sent = email::send_email(&emails, &subject, &html, &vars, None).await;
                results.push(DispatchResult {
                    channel: "email".into(),
                    success: sent.success,
                    recipient_count: emails.len(),
                    error: sent.error,
                });
            }
            "in_app" => {
                if users.is_empty() {
                    results.push(fail("in_app", "No in-app recipients resolved"));
                    continue;
                }
                let kind = if ev.breach_severity == Some("CRITICAL") {
                    "error"
                } else {
                    "warning"
                };
                let title = format!("Monitoring Alert: {}", rule.name);
                let (mut ok, mut last_err) = (0usize, None);
                for (uid, _) in &users {
                    match create_notification(pool, uid, kind, &title, &ev.message, Some(&payload)).await {
                        Ok(_) => ok += 1,
                        Err(e) => last_err = Some(e.to_string()),
                    }
                }
                results.push(DispatchResult {
                    channel: "in_app".into(),
                    success: ok > 0,
                    recipient_count: ok,
                    error: last_err,
                });
            }
            "webhook" => {
                let Some(url) = rule.webhook_url.as_deref().filter(|u| !u.is_empty()) else {
                    results.push(fail("webhook", "No webhook URL configured"));
                    continue;
                };
                if webhook_target_blocked(url).await {
                    results.push(fail(
                        "webhook",
                        "Webhook URL resolves to a private/loopback address (SSRF blocked)",
                    ));
                    continue;
                }
                let client = reqwest::Client::builder()
                    .timeout(std::time::Duration::from_secs(5))
                    .redirect(reqwest::redirect::Policy::none())
                    .build();
                let sent = match client {
                    Ok(c) => c
                        .post(url)
                        .header("User-Agent", "enterprise-reporting-monitor/1.0")
                        .json(&payload)
                        .send()
                        .await
                        .map_err(|e| e.to_string()),
                    Err(e) => Err(e.to_string()),
                };
                results.push(match sent {
                    Ok(r) if r.status().is_success() => DispatchResult {
                        channel: "webhook".into(),
                        success: true,
                        recipient_count: 1,
                        error: None,
                    },
                    Ok(r) => fail(
                        "webhook",
                        &format!("Webhook returned HTTP {}", r.status().as_u16()),
                    ),
                    Err(e) => fail("webhook", &e),
                });
            }
            _ => {}
        }
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::is_private_or_loopback;

    #[test]
    fn ssrf_guard() {
        for u in [
            "http://localhost/x",
            "http://127.0.0.5/",
            "https://10.1.2.3/hook",
            "http://172.16.0.1",
            "http://172.31.255.255:8080/",
            "http://192.168.1.1",
            "http://169.254.169.254/latest/meta-data",
            "http://[::1]/",
            "not a url",
        ] {
            assert!(is_private_or_loopback(u), "{u}");
        }
        for u in [
            "https://hooks.example.com/x",
            "http://172.32.0.1/",
            "https://user:pw@example.org:8443/p",
        ] {
            assert!(!is_private_or_loopback(u), "{u}");
        }
    }
}
