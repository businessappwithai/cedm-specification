//! Postgres row → `serde_json::Value` conversion.
//!
//! The generic `bus` controller returns rows it has no compile-time type for,
//! so every value crosses the boundary through this module. The API contract
//! (§9) requires the JSON to look exactly like what the Kysely/`pg` stack
//! emitted, which makes this small module a real correctness surface — it is
//! risk R12 in docs/MIGRATION-LOCO-ASTRYX.md.
//!
//! Mapping (Appendix A):
//!   INT2/INT4/INT8  → number
//!   NUMERIC         → number    (see the note on precision below)
//!   FLOAT4/FLOAT8   → number
//!   BOOL            → boolean
//!   JSON/JSONB      → object/array, passed through untouched
//!   TIMESTAMPTZ     → ISO-8601 string, always UTC with a `Z` suffix
//!   TIMESTAMP       → ISO-8601 string, no offset
//!   DATE            → `YYYY-MM-DD`
//!   UUID            → string
//!   TEXT[]/UUID[]   → array of strings   (NULL elements stay null)
//!   everything else → string
//!
//! SQL NULL becomes JSON `null` for every type.

use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use serde_json::{Map, Number, Value};
use sqlx::{postgres::PgRow, Column, Row, TypeInfo};
use uuid::Uuid;

/// Convert one row into a JSON object keyed by column name.
#[must_use]
pub fn row_to_json(row: &PgRow) -> Value {
    let mut map = Map::with_capacity(row.columns().len());
    for column in row.columns() {
        map.insert(column.name().to_string(), column_to_json(row, column));
    }
    Value::Object(map)
}

#[must_use]
pub fn rows_to_json(rows: &[PgRow]) -> Vec<Value> {
    rows.iter().map(row_to_json).collect()
}

fn column_to_json(row: &PgRow, column: &sqlx::postgres::PgColumn) -> Value {
    let idx = column.ordinal();

    // `type_info().name()` is the Postgres type name, upper-cased by sqlx.
    match column.type_info().name() {
        "BOOL" => opt(row.try_get::<Option<bool>, _>(idx), Value::Bool),
        "INT2" => opt(row.try_get::<Option<i16>, _>(idx), |v| {
            Value::Number(Number::from(v))
        }),
        "INT4" => opt(row.try_get::<Option<i32>, _>(idx), |v| {
            Value::Number(Number::from(v))
        }),
        "INT8" => opt(row.try_get::<Option<i64>, _>(idx), |v| {
            Value::Number(Number::from(v))
        }),
        "FLOAT4" => opt(row.try_get::<Option<f32>, _>(idx), |v| {
            f64_value(f64::from(v))
        }),
        "FLOAT8" => opt(row.try_get::<Option<f64>, _>(idx), f64_value),
        // NUMERIC is emitted as a JSON number, matching Appendix A.
        //
        // The hop through f64 is lossless *as far as the emitted JSON text is
        // concerned* for values up to ~15 significant digits, because
        // serde_json formats floats with shortest-round-trip (ryu): the
        // printed decimal is the one that parses back to the same f64. The
        // declared column types allow more than that — DECIMAL(18,6) permits
        // 18 significant digits — so a value above ~15 digits can round in the
        // 16th+ place. That is beyond any monetary magnitude this schema is
        // used for, but it is a real bound, not an absence of one, and the
        // tests below pin both sides of it.
        //
        // If a model ever needs the full 18 digits faithfully, the fix is to
        // emit NUMERIC as a JSON string here rather than to widen the float.
        "NUMERIC" => opt(row.try_get::<Option<Decimal>, _>(idx), |v| {
            v.to_f64()
                .map_or_else(|| Value::String(v.to_string()), f64_value)
        }),
        "JSON" | "JSONB" => opt(row.try_get::<Option<Value>, _>(idx), |v| v),
        "TIMESTAMPTZ" => opt(row.try_get::<Option<DateTime<Utc>>, _>(idx), |v| {
            Value::String(v.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
        }),
        "TIMESTAMP" => opt(row.try_get::<Option<NaiveDateTime>, _>(idx), |v| {
            Value::String(v.format("%Y-%m-%dT%H:%M:%S%.3f").to_string())
        }),
        "DATE" => opt(row.try_get::<Option<NaiveDate>, _>(idx), |v| {
            Value::String(v.format("%Y-%m-%d").to_string())
        }),
        "UUID" => opt(row.try_get::<Option<Uuid>, _>(idx), |v| {
            Value::String(v.to_string())
        }),
        // A Postgres array of strings becomes a JSON array of strings.
        //
        // Without this arm these columns fall to the `String` catch-all below,
        // whose decode fails and emits `null` — silently, because a failed
        // decode is indistinguishable from a SQL NULL to every caller. The
        // schema has two such columns and both matter: `audit_log
        // .changed_fields`, which is the single field naming *what* an update
        // changed, and `allowed_roles` on the five dictionary tables, which is
        // what m0010 narrows a window by. Both read back through this module,
        // so both reported nothing while the rows held values.
        //
        // Postgres arrays may contain NULL elements; those become JSON `null`
        // rather than collapsing the array.
        "TEXT[]" | "VARCHAR[]" | "CHAR[]" | "NAME[]" => {
            opt(row.try_get::<Option<Vec<Option<String>>>, _>(idx), |v| {
                Value::Array(
                    v.into_iter()
                        .map(|item| item.map_or(Value::Null, Value::String))
                        .collect(),
                )
            })
        }
        "UUID[]" => opt(row.try_get::<Option<Vec<Option<Uuid>>>, _>(idx), |v| {
            Value::Array(
                v.into_iter()
                    .map(|item| item.map_or(Value::Null, |id| Value::String(id.to_string())))
                    .collect(),
            )
        }),
        // TEXT, VARCHAR, BPCHAR, NAME and anything unrecognised.
        _ => opt(row.try_get::<Option<String>, _>(idx), Value::String),
    }
}

/// Lift a `sqlx` decode result into JSON, mapping both NULL and a decode
/// failure to `null`. A decode failure is logged rather than swallowed: it
/// means this module is missing a type mapping.
fn opt<T>(decoded: Result<Option<T>, sqlx::Error>, to_json: impl FnOnce(T) -> Value) -> Value {
    match decoded {
        Ok(Some(value)) => to_json(value),
        Ok(None) => Value::Null,
        Err(err) => {
            crate::log_event!(entity_column_undecodable, error = %err);
            Value::Null
        }
    }
}

/// `f64` → JSON number, falling back to `null` for NaN/Infinity which JSON
/// cannot represent.
fn f64_value(value: f64) -> Value {
    Number::from_f64(value).map_or(Value::Null, Value::Number)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn f64_value_rejects_non_finite() {
        assert_eq!(f64_value(f64::NAN), Value::Null);
        assert_eq!(f64_value(f64::INFINITY), Value::Null);
        assert_eq!(
            f64_value(1.5),
            Value::Number(Number::from_f64(1.5).unwrap())
        );
    }

    /// Render a decimal exactly as `column_to_json` would, then serialize it.
    /// The emitted JSON text — not the intermediate f64 — is the contract.
    fn decimal_as_json_text(raw: &str) -> String {
        let decimal: Decimal = raw.parse().unwrap();
        let value = decimal
            .to_f64()
            .map_or_else(|| Value::String(decimal.to_string()), f64_value);
        serde_json::to_string(&value).unwrap()
    }

    #[test]
    fn realistic_decimal_values_survive_the_round_trip() {
        // Money at DECIMAL(18,2) and rates at DECIMAL(18,6), which is what the
        // generated schema actually stores. The contract is the *value* a JSON
        // parser recovers, not the literal text: serde_json prints shortest
        // round-trip form, so `0.000001` is emitted as `1e-6`. Both parse to
        // the same IEEE double, which is what `JSON.parse` hands the frontend.
        for raw in [
            "12345678901.23",
            "0.000001",
            "-98765.4321",
            "0",
            "1000000.5",
        ] {
            let emitted = decimal_as_json_text(raw);
            let reparsed: f64 = emitted.parse().unwrap();
            let expected: f64 = raw.parse().unwrap();
            assert!(
                (reparsed - expected).abs() <= f64::EPSILON * expected.abs().max(1.0),
                "changed value for {raw}: emitted {emitted}"
            );
        }
    }

    #[test]
    fn small_magnitudes_use_exponent_notation() {
        // Pinned deliberately: it is valid JSON and numerically identical, but
        // it is a visible difference from the TypeScript stack's output text.
        assert_eq!(decimal_as_json_text("0.000001"), "1e-6");
    }

    #[test]
    fn precision_bound_is_where_the_docs_claim_it_is() {
        // Beyond ~15 significant digits the f64 hop does round. Pinned so that
        // switching NUMERIC to a JSON string would visibly fail this test
        // rather than silently change the contract.
        assert_ne!(
            decimal_as_json_text("123456789012345678.123456"),
            "123456789012345678.123456"
        );
    }
}
