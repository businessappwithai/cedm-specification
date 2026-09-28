//! The JavaScript semantics write paths depend on, so that what Rust stores
//! is byte-for-byte what Node stores.
use serde_json::Value;

use crate::monitoring::js::number_to_string;

/// `JSON.stringify(v)`. Same as serde's compact output except numbers: JS
/// writes `1.0` as `1` (it parsed it into the same double).
#[must_use]
pub fn stringify(v: &Value) -> String {
    let mut out = String::new();
    write(v, &mut out);
    out
}

fn write(v: &Value, out: &mut String) {
    match v {
        Value::Number(n) if n.is_f64() => {
            out.push_str(&n.as_f64().map_or_else(|| n.to_string(), number_to_string))
        }
        Value::Array(a) => {
            out.push('[');
            for (i, x) in a.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                write(x, out);
            }
            out.push(']');
        }
        Value::Object(o) => {
            out.push('{');
            for (i, (k, x)) in o.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&Value::String(k.clone()).to_string());
                out.push(':');
                write(x, out);
            }
            out.push('}');
        }
        other => out.push_str(&other.to_string()),
    }
}

/// JavaScript truthiness of a parsed body value (absent is `None`).
#[must_use]
pub fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// A body value bound into a text column, as node-pg would send it:
/// `null` stays NULL, strings as-is, anything else as its JS string.
#[must_use]
pub fn text(v: &Value) -> Option<String> {
    match v {
        Value::Null => None,
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.as_f64().map_or_else(|| n.to_string(), number_to_string)),
        Value::Bool(b) => Some(b.to_string()),
        other => Some(stringify(other)),
    }
}

/// `a ?? b` over body fields: the value unless absent or null.
#[must_use]
pub fn present(v: Option<&Value>) -> Option<&Value> {
    v.filter(|x| !x.is_null())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn stringify_like_javascript() {
        let v: Value = serde_json::from_str(r#"{"b":1.0,"a":[1.5,2,{"x":"y\"z"}],"n":null}"#).unwrap();
        assert_eq!(stringify(&v), r#"{"b":1,"a":[1.5,2,{"x":"y\"z"}],"n":null}"#);
        assert_eq!(
            stringify(&json!({"xAxis":{"field":""},"yAxis":[]})),
            r#"{"xAxis":{"field":""},"yAxis":[]}"#
        );
    }

    #[test]
    fn truthiness() {
        assert!(!truthy(None));
        assert!(!truthy(Some(&json!(""))));
        assert!(!truthy(Some(&json!(0))));
        assert!(truthy(Some(&json!([]))));
        assert!(truthy(Some(&json!({}))));
    }
}
