//! `src/lib/email/email-service.ts`: `renderTemplate` and `sendEmail`, over
//! the same `SMTP_*` / `EMAIL_FROM*` environment variables.
use lettre::{
    message::{header::ContentType, Attachment, Mailbox, MultiPart, SinglePart},
    transport::smtp::{
        authentication::Credentials,
        client::{Tls, TlsParameters},
    },
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use regex::Regex;
use serde_json::{Map, Value};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendResult {
    pub success: bool,
    pub error: Option<String>,
    pub message_id: Option<String>,
}

/// `String(value ?? "")` for a JSON value.
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::String(s) => s.clone(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n
            .as_f64()
            .map_or_else(|| n.to_string(), crate::monitoring::js::number_to_string),
        Value::Array(a) => a.iter().map(js_string).collect::<Vec<_>>().join(","),
        Value::Object(_) => "[object Object]".into(),
    }
}

/// JS truthiness, for `{{#if var}}`.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// `renderTemplate(template, variables, queryResults)`: `{{key}}` for each
/// variable, then `{{queryResults}}` as an HTML table of at most 10 rows,
/// then `{{column}}` from the first row, then `{{#if var}}…{{/if}}`.
#[must_use]
pub fn render_template(
    template: &str,
    variables: &Map<String, Value>,
    rows: Option<&[Map<String, Value>]>,
) -> String {
    let mut out = template.to_string();
    for (k, v) in variables {
        out = out.replace(&format!("{{{{{k}}}}}"), &js_string(v));
    }
    if let Some(rows) = rows.filter(|r| !r.is_empty()) {
        let columns: Vec<&String> = rows[0].keys().collect();
        if out.contains("{{queryResults}}") {
            let mut t = String::from("<table class=\"data-table\">\n<thead>\n<tr>\n");
            t += &columns
                .iter()
                .map(|c| format!("<th>{c}</th>"))
                .collect::<Vec<_>>()
                .join("\n");
            t += "\n</tr>\n</thead>\n<tbody>\n";
            for row in rows.iter().take(10) {
                t += "<tr>\n";
                t += &columns
                    .iter()
                    .map(|c| format!("<td>{}</td>", row.get(*c).map(js_string).unwrap_or_default()))
                    .collect::<Vec<_>>()
                    .join("\n");
                t += "\n</tr>\n";
            }
            if rows.len() > 10 {
                t += &format!(
                    "<tr><td colspan=\"{}\" style=\"text-align: center; color: #6b7280;\">... and {} more rows</td></tr>",
                    columns.len(),
                    rows.len() - 10
                );
            }
            t += "\n</tbody>\n</table>";
            out = out.replacen("{{queryResults}}", &t, 1);
        }
        for c in &columns {
            out = out.replace(
                &format!("{{{{{c}}}}}"),
                &rows[0].get(*c).map(js_string).unwrap_or_default(),
            );
        }
    }
    static COND: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let cond =
        COND.get_or_init(|| Regex::new(r"\{\{#if (\w+)\}\}([\s\S]*?)\{\{/if\}\}").expect("static regex"));
    cond.replace_all(&out, |c: &regex::Captures<'_>| {
        if truthy(variables.get(&c[1])) {
            c[2].to_string()
        } else {
            String::new()
        }
    })
    .into_owned()
}

fn env(name: &str, default: &str) -> String {
    std::env::var(name)
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.to_string())
}

fn transport() -> Result<AsyncSmtpTransport<Tokio1Executor>, String> {
    let host = env("SMTP_HOST", "localhost");
    let port: u16 = env("SMTP_PORT", "587").parse().unwrap_or(587);
    let secure = std::env::var("SMTP_SECURE").is_ok_and(|v| v == "true");
    // nodemailer with `secure: false` still upgrades with STARTTLS whenever
    // the server offers it; a plain connection would send credentials and
    // alert bodies in the clear, and providers that require STARTTLS on 587
    // would refuse the login. `secure: true` is implicit TLS.
    let tls = TlsParameters::new(host.clone()).map_err(|e| e.to_string())?;
    let builder = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&host).tls(if secure {
        Tls::Wrapper(tls)
    } else {
        Tls::Opportunistic(tls)
    });
    let mut builder = builder.port(port);
    let user = env("SMTP_USER", "");
    if !user.is_empty() {
        builder = builder.credentials(Credentials::new(user, env("SMTP_PASS", "")));
    }
    Ok(builder.build())
}

fn from_mailbox() -> Result<Mailbox, String> {
    let from = env("EMAIL_FROM", "noreply@example.com");
    let s = match std::env::var("EMAIL_FROM_NAME").ok().filter(|v| !v.is_empty()) {
        Some(name) => format!("{name} <{from}>"),
        None => from,
    };
    s.parse()
        .map_err(|e: lettre::address::AddressError| e.to_string())
}

/// A file attached to a message: name, content type, bytes.
#[derive(Debug, Clone)]
pub struct FileAttachment {
    pub filename: String,
    pub content_type: String,
    pub bytes: Vec<u8>,
}

/// `sendEmail(to, {subject, htmlBody}, variables, queryResults)`. Never
/// returns an error: failures come back as `success: false`, as in Node.
pub async fn send_email(
    to: &[String],
    subject: &str,
    html_body: &str,
    variables: &Map<String, Value>,
    rows: Option<&[Map<String, Value>]>,
) -> SendResult {
    send_email_with(to, subject, html_body, variables, rows, &[]).await
}

/// `sendEmail` with its fifth argument, `attachments`.
pub async fn send_email_with(
    to: &[String],
    subject: &str,
    html_body: &str,
    variables: &Map<String, Value>,
    rows: Option<&[Map<String, Value>]>,
    attachments: &[FileAttachment],
) -> SendResult {
    let result = async {
        let html = render_template(html_body, variables, rows);
        let subject = render_template(subject, variables, None);
        let mut msg = Message::builder().from(from_mailbox()?).subject(subject);
        for addr in to {
            msg = msg.to(addr
                .parse()
                .map_err(|e: lettre::address::AddressError| e.to_string())?);
        }
        let msg = if attachments.is_empty() {
            msg.header(ContentType::TEXT_HTML).body(html)
        } else {
            let mut parts = MultiPart::mixed().singlepart(SinglePart::html(html));
            for a in attachments {
                let ct = ContentType::parse(&a.content_type).map_err(|e| e.to_string())?;
                parts = parts.singlepart(Attachment::new(a.filename.clone()).body(a.bytes.clone(), ct));
            }
            msg.multipart(parts)
        }
        .map_err(|e| e.to_string())?;
        let response = transport()?.send(msg).await.map_err(|e| e.to_string())?;
        Ok::<_, String>(response.message().collect::<Vec<_>>().join(" "))
    }
    .await;
    match result {
        Ok(id) => SendResult {
            success: true,
            error: None,
            message_id: Some(id),
        },
        Err(e) => {
            tracing::error!(error = %e, "Error sending email");
            SendResult {
                success: false,
                error: Some(e),
                message_id: None,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn vars(v: Value) -> Map<String, Value> {
        v.as_object().unwrap().clone()
    }

    #[test]
    fn variables_and_conditionals() {
        let out = render_template(
            "Hi {{name}} {{name}}{{#if extra}} [{{extra}}]{{/if}}{{#if none}}X{{/if}}",
            &vars(json!({"name": "Ada", "extra": "x", "none": ""})),
            None,
        );
        assert_eq!(out, "Hi Ada Ada [x]");
    }

    #[test]
    fn query_results_table_caps_at_ten() {
        let rows: Vec<Map<String, Value>> = (0..12)
            .map(|i| vars(json!({"id": i, "name": format!("n{i}")})))
            .collect();
        let out = render_template("{{queryResults}}|{{name}}", &Map::new(), Some(&rows));
        assert_eq!(out.matches("<tr>\n").count(), 11); // header + 10 rows
        assert!(out.contains("... and 2 more rows"));
        assert!(out.ends_with("|n0"));
    }
}
