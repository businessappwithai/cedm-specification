//! Record links (`src/lib/reporting/record-link.ts`): a report row opens as
//! a record in another application. The URL template is admin-supplied and
//! ends up in an `href` rendered for every viewer, so the scheme is
//! allow-listed — site-relative or http(s) — and re-validated on read.
use serde::{Deserialize, Serialize};

pub const PLACEHOLDER: &str = "{id}";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordLinkConfig {
    pub enabled: bool,
    pub id_column: String,
    pub url_template: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_in_new_tab: Option<bool>,
}

/// The template as a browser will read it: the URL parser deletes every tab,
/// CR and LF before resolving, so `"/\t/evil.example/{id}"` would pass a `//`
/// check and still open another site. Validation and building both use this.
fn normalize(template: &str) -> String {
    template
        .chars()
        .filter(|c| !matches!(c, '\t' | '\n' | '\r'))
        .collect::<String>()
        .trim()
        .to_string()
}

/// `validateUrlTemplate`: `Ok(())` or the message Node shows.
///
/// # Errors
/// With the user-facing reason.
pub fn validate_url_template(template: &str) -> Result<(), String> {
    let normalized = normalize(template);
    let trimmed = normalized.as_str();
    if trimmed.chars().any(|c| c.is_ascii_control()) {
        return Err("The URL contains control characters.".into());
    }
    if trimmed.is_empty() {
        return Err("Enter a URL.".into());
    }
    if !trimmed.contains(PLACEHOLDER) {
        return Err(format!(
            "The URL must contain {PLACEHOLDER}, which is replaced with the record's id."
        ));
    }
    if let Some(rest) = trimmed.strip_prefix('/') {
        // `//x` and `/\x` both resolve to another origin in a browser.
        if rest.starts_with('/') || rest.starts_with('\\') {
            return Err(
                "A URL starting with // or /\\ points at another site. Write it in full, with https://."
                    .into(),
            );
        }
        return Ok(());
    }
    let Ok(parsed) = url::Url::parse(&trimmed.replace(PLACEHOLDER, "1")) else {
        return Err("That is not a valid URL.".into());
    };
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(format!(
            "Only http:// and https:// links are allowed (got {}).",
            parsed.scheme()
        ));
    }
    Ok(())
}

/// `encodeURIComponent`.
fn encode_uri_component(s: &str) -> String {
    const KEEP: &percent_encoding::AsciiSet = &percent_encoding::NON_ALPHANUMERIC
        .remove(b'-')
        .remove(b'_')
        .remove(b'.')
        .remove(b'!')
        .remove(b'~')
        .remove(b'*')
        .remove(b'\'')
        .remove(b'(')
        .remove(b')');
    percent_encoding::utf8_percent_encode(s, KEEP).to_string()
}

/// `buildRecordUrl`: `None` when disabled, the id is empty, or the stored
/// template no longer validates.
#[must_use]
pub fn build_record_url(config: &RecordLinkConfig, id: Option<&str>) -> Option<String> {
    if !config.enabled {
        return None;
    }
    let id = id.filter(|i| !i.is_empty())?;
    validate_url_template(&config.url_template).ok()?;
    Some(normalize(&config.url_template).replace(PLACEHOLDER, &encode_uri_component(id)))
}

/// `parseRecordLinkConfig`: tolerant of stored rows; `None` if unusable.
#[must_use]
pub fn parse_record_link_config(raw: Option<&str>) -> Option<RecordLinkConfig> {
    let v: serde_json::Value = serde_json::from_str(raw?).ok()?;
    let url_template = v.get("urlTemplate")?.as_str()?.to_string();
    let id_column = v.get("idColumn")?.as_str()?.to_string();
    Some(RecordLinkConfig {
        enabled: v.get("enabled") == Some(&serde_json::Value::Bool(true)),
        id_column,
        url_template,
        label: v
            .get("label")
            .and_then(serde_json::Value::as_str)
            .filter(|l| !l.trim().is_empty())
            .map(String::from),
        open_in_new_tab: Some(v.get("openInNewTab") != Some(&serde_json::Value::Bool(false))),
    })
}

/// `serializeRecordLinkConfig`.
#[must_use]
pub fn serialize_record_link_config(c: &RecordLinkConfig) -> String {
    serde_json::json!({
        "enabled": c.enabled,
        "idColumn": c.id_column.trim(),
        "urlTemplate": normalize(&c.url_template),
        "label": c.label.as_deref().map(str::trim).filter(|l| !l.is_empty()),
        "openInNewTab": c.open_in_new_tab != Some(false),
    })
    .as_object()
    .map(|o| {
        // JSON.stringify drops `label: undefined`.
        let mut o = o.clone();
        if o.get("label").is_some_and(serde_json::Value::is_null) {
            o.shift_remove("label");
        }
        serde_json::Value::Object(o).to_string()
    })
    .unwrap_or_default()
}

/// Port of `src/lib/reporting/__tests__/record-link.test.ts`.
#[cfg(test)]
mod tests {
    use super::*;

    fn base() -> RecordLinkConfig {
        RecordLinkConfig {
            enabled: true,
            id_column: "id".into(),
            url_template: "/app/bus_account/{id}".into(),
            label: None,
            open_in_new_tab: None,
        }
    }

    #[test]
    fn accepts_relative_and_http() {
        assert!(validate_url_template("/app/bus_account/{id}").is_ok());
        assert!(validate_url_template("https://crm.example.com/record/{id}").is_ok());
        assert!(validate_url_template("http://internal.example.com/record/{id}").is_ok());
    }

    #[test]
    fn requires_placeholder_and_content() {
        assert!(validate_url_template("https://example.com/records")
            .unwrap_err()
            .contains("{id}"));
        assert!(validate_url_template("   ").is_err());
    }

    #[test]
    fn rejects_schemes_that_execute_or_forge_a_document() {
        for t in [
            "javascript:alert(1)/*{id}*/",
            "JavaScript:alert(1)/*{id}*/",
            "  javascript:alert(1)/*{id}*/",
            "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=={id}",
            "vbscript:msgbox(1){id}",
            "file:///etc/passwd/{id}",
        ] {
            assert!(validate_url_template(t).is_err(), "{t}");
        }
    }

    #[test]
    fn rejects_protocol_relative_in_both_spellings() {
        assert!(validate_url_template("//evil.example.com/{id}")
            .unwrap_err()
            .contains("another site"));
        assert!(validate_url_template("/\\evil.example.com/{id}")
            .unwrap_err()
            .contains("another site"));
    }

    /// Review finding: a tab or newline hid `//` from the check.
    #[test]
    fn rejects_protocol_relative_hidden_behind_tab_or_newline() {
        for t in [
            "/\t/evil.example.com/{id}",
            "/\n/evil.example.com/{id}",
            "/\r\n\\evil.example.com/{id}",
        ] {
            assert!(validate_url_template(t).is_err(), "{t:?}");
        }
        assert!(validate_url_template("/app/\u{0}/{id}").is_err());
        let c = RecordLinkConfig {
            url_template: "/app/\torders/{id}".into(),
            ..base()
        };
        assert_eq!(build_record_url(&c, Some("7")).as_deref(), Some("/app/orders/7"));
    }

    #[test]
    fn builds_encoded_urls_and_revalidates() {
        assert_eq!(
            build_record_url(&base(), Some("42")).as_deref(),
            Some("/app/bus_account/42")
        );
        assert_eq!(
            build_record_url(&base(), Some("a b/c?d#e")).as_deref(),
            Some("/app/bus_account/a%20b%2Fc%3Fd%23e")
        );
        assert_eq!(
            build_record_url(
                &RecordLinkConfig {
                    enabled: false,
                    ..base()
                },
                Some("42")
            ),
            None
        );
        assert_eq!(build_record_url(&base(), None), None);
        assert_eq!(build_record_url(&base(), Some("")), None);
        let bad = RecordLinkConfig {
            url_template: "javascript:alert(1)/*{id}*/".into(),
            ..base()
        };
        assert_eq!(build_record_url(&bad, Some("42")), None);
    }

    #[test]
    fn parse_serialize_round_trip() {
        let c = RecordLinkConfig {
            enabled: true,
            id_column: "account_id".into(),
            url_template: "https://example.com/{id}".into(),
            label: Some("Open in CRM".into()),
            open_in_new_tab: Some(false),
        };
        assert_eq!(
            parse_record_link_config(Some(&serialize_record_link_config(&c))),
            Some(c)
        );
        assert_eq!(parse_record_link_config(Some("not json")), None);
        assert_eq!(parse_record_link_config(Some(r#"{"enabled":true}"#)), None);
    }
}
