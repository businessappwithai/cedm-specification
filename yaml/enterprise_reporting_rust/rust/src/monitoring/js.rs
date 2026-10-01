//! The two JavaScript coercions the monitoring code leans on, reproduced so
//! a rule evaluates to the same number on both backends.
use serde_json::Value;

/// `Number(s)` for a string: trimmed; empty is 0; decimal, exponent,
/// `Infinity` and `0x`/`0o`/`0b` literals parse; anything else is NaN.
#[must_use]
pub fn number_from_str(s: &str) -> f64 {
    let t = s.trim();
    if t.is_empty() {
        return 0.0;
    }
    let (sign, body) = match t.as_bytes()[0] {
        b'-' => (-1.0, &t[1..]),
        b'+' => (1.0, &t[1..]),
        _ => (1.0, t),
    };
    if body == "Infinity" {
        return sign * f64::INFINITY;
    }
    let radix = |prefix: &str, r: u32| {
        body.strip_prefix(prefix)
            .or_else(|| body.strip_prefix(&prefix.to_uppercase()))
            .map(|d| u64::from_str_radix(d, r).map_or(f64::NAN, |v| v as f64))
    };
    // Prefixed literals take no sign in JS: Number("-0x10") is NaN.
    for (p, r) in [("0x", 16), ("0o", 8), ("0b", 2)] {
        if let Some(v) = radix(p, r) {
            return if sign < 0.0 || t.starts_with('+') {
                f64::NAN
            } else {
                v
            };
        }
    }
    let valid = !body.is_empty()
        && body
            .chars()
            .all(|c| c.is_ascii_digit() || matches!(c, '.' | 'e' | 'E' | '+' | '-'))
        && body
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_digit() || c == '.');
    if !valid {
        return f64::NAN;
    }
    body.parse::<f64>().map_or(f64::NAN, |v| sign * v)
}

/// `Number(v)` for a JSON value from a result row.
#[must_use]
pub fn number(v: &Value) -> f64 {
    match v {
        Value::Null => 0.0,
        Value::Bool(b) => f64::from(u8::from(*b)),
        Value::Number(n) => n.as_f64().unwrap_or(f64::NAN),
        Value::String(s) => number_from_str(s),
        Value::Array(a) if a.is_empty() => 0.0,
        Value::Array(a) if a.len() == 1 => number(&a[0]),
        _ => f64::NAN,
    }
}

/// `String(n)` for the finite numbers messages print.
#[must_use]
pub fn number_to_string(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n.is_infinite() {
        return if n > 0.0 {
            "Infinity".into()
        } else {
            "-Infinity".into()
        };
    }
    if n == n.trunc() && n.abs() < 1e21 {
        return format!("{n:.0}");
    }
    let s = format!("{n}");
    s
}

/// `n.toFixed(d)`: round the exact binary value half away from zero.
/// `format!("{:.1}", 12.25)` gives "12.2" (half to even); JavaScript gives
/// "12.3". 12.25 is exact in binary, so this is a real midpoint.
#[must_use]
pub fn to_fixed(n: f64, d: usize) -> String {
    use rust_decimal::{Decimal, RoundingStrategy};
    if !n.is_finite() || n.abs() >= 1e21 {
        return number_to_string(n);
    }
    match (Decimal::from_f64_retain(n), u32::try_from(d)) {
        (Some(dec), Ok(dp)) => {
            let rounded = dec.round_dp_with_strategy(dp, RoundingStrategy::MidpointAwayFromZero);
            format!("{rounded:.d$}")
        }
        _ => format!("{n:.d$}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn coercions_match_javascript() {
        assert_eq!(number(&json!("20.0000")), 20.0);
        assert_eq!(number(&json!(" 7 ")), 7.0);
        assert_eq!(number(&json!("")), 0.0);
        assert_eq!(number(&json!(null)), 0.0);
        assert_eq!(number(&json!(true)), 1.0);
        assert!(number(&json!("12abc")).is_nan());
        assert_eq!(number(&json!("1e3")), 1000.0);
        assert_eq!(number(&json!("0x10")), 16.0);
        assert!(number(&json!({"a":1})).is_nan());
    }

    #[test]
    fn printing_matches_javascript() {
        assert_eq!(number_to_string(42.0), "42");
        assert_eq!(number_to_string(42.5), "42.5");
        assert_eq!(number_to_string(-3.0), "-3");
        assert_eq!(to_fixed(12.345, 1), "12.3");
        // Review finding: exact halves round away from zero, as in JS.
        assert_eq!(to_fixed(12.25, 1), "12.3");
        assert_eq!(to_fixed(-12.25, 1), "-12.3");
        assert_eq!(to_fixed(0.125, 2), "0.13");
        // 1.005 is 1.00499… in binary, so JS gives "1.00" too.
        assert_eq!(to_fixed(1.005, 2), "1.00");
        assert_eq!(to_fixed(50.0, 1), "50.0");
    }
}
