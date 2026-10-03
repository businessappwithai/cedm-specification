//! `evaluateThreshold` as `monitoring-worker.ts` defines it — the one that
//! runs. (`src/lib/monitoring/threshold-engine.ts` has a different evaluator
//! with different escalation rules, but nothing imports it.)
use serde::Serialize;
use serde_json::{Map, Value};

use super::js::{number, number_to_string, to_fixed};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Status {
    Pass,
    Breach,
    Escalate,
    NoData,
    Error,
}

impl Status {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Pass => "PASS",
            Self::Breach => "BREACH",
            Self::Escalate => "ESCALATE",
            Self::NoData => "NO_DATA",
            Self::Error => "ERROR",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Evaluation {
    pub status: Status,
    pub actual_value: Option<f64>,
    pub threshold_value: f64,
    pub operator: String,
    pub delta_from_previous: Option<f64>,
    /// `WARNING` or `CRITICAL` on a breach.
    pub breach_severity: Option<&'static str>,
    pub message: String,
}

/// The rule fields the evaluation reads.
#[derive(Debug, Clone)]
pub struct ThresholdRule {
    pub metric_column: String,
    pub threshold_operator: String,
    pub threshold_value: f64,
    pub threshold_upper_bound: Option<f64>,
    pub escalation_threshold_pct: f64,
}

#[must_use]
pub fn evaluate_threshold(
    rows: &[Map<String, Value>],
    rule: &ThresholdRule,
    previous: Option<f64>,
) -> Evaluation {
    let base = |status, message: String| Evaluation {
        status,
        actual_value: None,
        threshold_value: rule.threshold_value,
        operator: rule.threshold_operator.clone(),
        delta_from_previous: None,
        breach_severity: None,
        message,
    };

    let Some(first) = rows.first() else {
        return base(Status::NoData, "No data returned from report query".into());
    };
    let wanted = rule.metric_column.to_lowercase();
    let Some((_, raw)) = first.iter().find(|(k, _)| k.to_lowercase() == wanted) else {
        let available = first.keys().cloned().collect::<Vec<_>>().join(", ");
        return base(
            Status::NoData,
            format!(
                "Metric column '{}' not found in result (available: {available})",
                rule.metric_column
            ),
        );
    };

    let actual = number(raw);
    if actual.is_nan() {
        let shown = match raw {
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        return base(
            Status::NoData,
            format!(
                "Metric column '{}' value '{shown}' could not be parsed as a number",
                rule.metric_column
            ),
        );
    }

    let delta = previous
        .filter(|p| *p != 0.0)
        .map(|p| ((actual - p) / p.abs()) * 100.0);

    let t = rule.threshold_value;
    let breach = match rule.threshold_operator.as_str() {
        "gt" => actual > t,
        "gte" => actual >= t,
        "lt" => actual < t,
        "lte" => actual <= t,
        #[allow(clippy::float_cmp)]
        "eq" => actual == t,
        #[allow(clippy::float_cmp)]
        "neq" => actual != t,
        "between" => match rule.threshold_upper_bound {
            Some(u) => !(actual >= t && actual <= u),
            None => actual < t,
        },
        _ => false,
    };

    let ev = |status, severity, message| Evaluation {
        status,
        actual_value: Some(actual),
        threshold_value: t,
        operator: rule.threshold_operator.clone(),
        delta_from_previous: delta,
        breach_severity: severity,
        message,
    };
    let (a, ts, op) = (
        number_to_string(actual),
        number_to_string(t),
        &rule.threshold_operator,
    );

    if !breach {
        return ev(
            Status::Pass,
            None,
            format!("Metric value {a} satisfies threshold condition ({op} {ts})"),
        );
    }

    let deviation = (t != 0.0).then(|| (((actual - t) / t.abs()) * 100.0).abs());
    let esc = rule.escalation_threshold_pct;
    if let Some(d) = deviation.filter(|d| *d > esc) {
        return ev(
            Status::Escalate,
            Some("CRITICAL"),
            format!(
                "CRITICAL: Metric value {a} breaches threshold ({op} {ts}) by {}% — exceeds escalation threshold of {}%",
                to_fixed(d, 1),
                number_to_string(esc)
            ),
        );
    }
    let by = deviation
        .map(|d| format!(" by {}%", to_fixed(d, 1)))
        .unwrap_or_default();
    ev(
        Status::Breach,
        Some("WARNING"),
        format!("WARNING: Metric value {a} breaches threshold ({op} {ts}){by}"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn rule(op: &str, t: f64) -> ThresholdRule {
        ThresholdRule {
            metric_column: "Total".into(),
            threshold_operator: op.into(),
            threshold_value: t,
            threshold_upper_bound: None,
            escalation_threshold_pct: 20.0,
        }
    }

    fn rows(v: Value) -> Vec<Map<String, Value>> {
        vec![v.as_object().unwrap().clone()]
    }

    #[test]
    fn no_rows_is_no_data() {
        let e = evaluate_threshold(&[], &rule("gt", 1.0), None);
        assert_eq!(
            (e.status, e.message.as_str()),
            (Status::NoData, "No data returned from report query")
        );
    }

    #[test]
    fn column_match_is_case_insensitive_and_numeric_strings_parse() {
        let e = evaluate_threshold(&rows(json!({"total": "105.50"})), &rule("gt", 100.0), None);
        assert_eq!(e.status, Status::Breach);
        assert_eq!(
            e.message,
            "WARNING: Metric value 105.5 breaches threshold (gt 100) by 5.5%"
        );
    }

    #[test]
    fn escalation_is_deviation_from_threshold() {
        let e = evaluate_threshold(&rows(json!({"TOTAL": 150})), &rule("gt", 100.0), Some(140.0));
        assert_eq!(e.status, Status::Escalate);
        assert_eq!(e.breach_severity, Some("CRITICAL"));
        assert!(e
            .message
            .ends_with("by 50.0% — exceeds escalation threshold of 20%"));
        assert!((e.delta_from_previous.unwrap() - 7.142_857).abs() < 1e-5);
    }

    #[test]
    fn pass_message() {
        let e = evaluate_threshold(&rows(json!({"total": 5})), &rule("gt", 100.0), None);
        assert_eq!(e.status, Status::Pass);
        assert_eq!(e.message, "Metric value 5 satisfies threshold condition (gt 100)");
    }

    #[test]
    fn missing_column_lists_available() {
        let e = evaluate_threshold(&rows(json!({"a": 1, "b": 2})), &rule("gt", 1.0), None);
        assert_eq!(
            e.message,
            "Metric column 'Total' not found in result (available: a, b)"
        );
    }

    #[test]
    fn null_metric_is_zero_like_javascript_number() {
        // Number(null) is 0 — not NO_DATA — and 0 vs "lt 1" deviates 100%.
        let e = evaluate_threshold(&rows(json!({"total": null})), &rule("lt", 1.0), None);
        assert_eq!((e.status, e.actual_value), (Status::Escalate, Some(0.0)));
    }

    #[test]
    fn between_breaches_outside_the_band() {
        let mut r = rule("between", 10.0);
        r.threshold_upper_bound = Some(20.0);
        assert_eq!(
            evaluate_threshold(&rows(json!({"total": 15})), &r, None).status,
            Status::Pass
        );
        assert_ne!(
            evaluate_threshold(&rows(json!({"total": 25})), &r, None).status,
            Status::Pass
        );
    }
}
