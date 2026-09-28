//! `createReportSchema` (`src/lib/schemas/reports.ts`) with zod's messages and
//! its `error.flatten()` shape, which the 422 body carries.
use serde_json::{json, Map, Value};

fn zod_type(v: &Value) -> &'static str {
    match v {
        Value::Null => "null",
        Value::Bool(_) => "boolean",
        Value::Number(_) => "number",
        Value::String(_) => "string",
        Value::Array(_) => "array",
        Value::Object(_) => "object",
    }
}

/// JavaScript `.length`: UTF-16 code units.
fn js_len(s: &str) -> usize {
    s.encode_utf16().count()
}

fn is_uuid(s: &str) -> bool {
    static RE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
    RE.get_or_init(|| {
        regex::Regex::new(r"(?i)^[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}$")
            .expect("static regex")
    })
    .is_match(s)
}

#[derive(Default)]
struct Issues {
    form: Vec<String>,
    fields: Map<String, Value>,
}

impl Issues {
    fn field(&mut self, key: &str, msg: String) {
        let e = self.fields.entry(key.to_string()).or_insert_with(|| json!([]));
        if let Some(a) = e.as_array_mut() {
            a.push(Value::String(msg));
        }
    }
}

fn check_string(
    issues: &mut Issues,
    body: &Map<String, Value>,
    key: &str,
    required: bool,
    min: Option<(usize, &str)>,
    max: (usize, &str),
) {
    match body.get(key) {
        None if required => issues.field(key, "Required".into()),
        None => {}
        Some(Value::String(s)) => {
            if let Some((n, m)) = min {
                if js_len(s) < n {
                    issues.field(key, m.into());
                }
            }
            if js_len(s) > max.0 {
                issues.field(key, max.1.into());
            }
        }
        Some(other) => issues.field(key, format!("Expected string, received {}", zod_type(other))),
    }
}

/// `Ok(body)` or `Err(flattened)` exactly as zod's `safeParse(...).error.flatten()`.
///
/// # Errors
/// The flattened issues.
pub fn validate_create_report(body: &Value) -> Result<&Map<String, Value>, Value> {
    let Some(obj) = body.as_object() else {
        return Err(
            json!({ "formErrors": [format!("Expected object, received {}", zod_type(body))], "fieldErrors": {} }),
        );
    };
    let mut issues = Issues::default();
    check_string(
        &mut issues,
        obj,
        "name",
        true,
        Some((1, "Name is required")),
        (255, "Name too long"),
    );
    check_string(
        &mut issues,
        obj,
        "description",
        false,
        None,
        (1000, "Description too long"),
    );
    match obj.get("savedQueryId") {
        None => {}
        Some(Value::String(s)) if is_uuid(s) => {}
        Some(Value::String(_)) => issues.field("savedQueryId", "Invalid UUID format".into()),
        Some(other) => issues.field(
            "savedQueryId",
            format!("Expected string, received {}", zod_type(other)),
        ),
    }
    match obj.get("columnConfig") {
        None | Some(Value::Array(_)) => {}
        Some(other) => issues.field(
            "columnConfig",
            format!("Expected array, received {}", zod_type(other)),
        ),
    }
    match obj.get("exportFormats") {
        None => {}
        Some(Value::Array(items)) => {
            for item in items {
                match item {
                    Value::String(s) if matches!(s.as_str(), "csv" | "xlsx" | "pdf") => {}
                    Value::String(s) => issues.field(
                        "exportFormats",
                        format!("Invalid enum value. Expected 'csv' | 'xlsx' | 'pdf', received '{s}'"),
                    ),
                    other => issues.field(
                        "exportFormats",
                        format!("Expected 'csv' | 'xlsx' | 'pdf', received {}", zod_type(other)),
                    ),
                }
            }
        }
        Some(other) => issues.field(
            "exportFormats",
            format!("Expected array, received {}", zod_type(other)),
        ),
    }
    if issues.form.is_empty() && issues.fields.is_empty() {
        Ok(obj)
    } else {
        Err(json!({ "formErrors": issues.form, "fieldErrors": issues.fields }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn err(v: Value) -> String {
        validate_create_report(&v).unwrap_err().to_string()
    }

    /// Each expectation is zod's own output (see rust/parity/cases.json).
    #[test]
    fn messages_match_zod() {
        assert_eq!(
            err(json!({})),
            r#"{"formErrors":[],"fieldErrors":{"name":["Required"]}}"#
        );
        assert_eq!(
            err(json!({"name": ""})),
            r#"{"formErrors":[],"fieldErrors":{"name":["Name is required"]}}"#
        );
        assert_eq!(
            err(json!({"name": 5})),
            r#"{"formErrors":[],"fieldErrors":{"name":["Expected string, received number"]}}"#
        );
        assert_eq!(
            err(json!({"name": "x".repeat(256)})),
            r#"{"formErrors":[],"fieldErrors":{"name":["Name too long"]}}"#
        );
        assert_eq!(
            err(json!({"name": "a", "savedQueryId": "nope"})),
            r#"{"formErrors":[],"fieldErrors":{"savedQueryId":["Invalid UUID format"]}}"#
        );
        assert_eq!(
            err(json!({"name": "a", "exportFormats": ["csv", "doc"]})),
            r#"{"formErrors":[],"fieldErrors":{"exportFormats":["Invalid enum value. Expected 'csv' | 'xlsx' | 'pdf', received 'doc'"]}}"#
        );
        assert_eq!(
            err(json!({"name": "a", "columnConfig": "x"})),
            r#"{"formErrors":[],"fieldErrors":{"columnConfig":["Expected array, received string"]}}"#
        );
        assert_eq!(
            err(Value::Null),
            r#"{"formErrors":["Expected object, received null"],"fieldErrors":{}}"#
        );
        assert!(validate_create_report(
            &json!({"name": "ok", "savedQueryId": "7b1f2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d"})
        )
        .is_ok());
    }
}
