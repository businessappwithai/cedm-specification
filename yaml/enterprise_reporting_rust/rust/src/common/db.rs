//! Database access for the config DB and the JSON shape of a row.
//!
//! Rows are converted the way node-pg converts them with no custom type
//! parsers installed — which is what the Node service does, so that is what the
//! frontend is written against (MIGRATION_PLAN.md §4.4). In particular `int8`
//! and `numeric` are **strings**, and timestamps are ISO strings with
//! millisecond precision and a `Z`.
use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use loco_rs::app::AppContext;
use rust_decimal::Decimal;
use serde_json::{Map, Value};
use sqlx::{
    mysql::MySqlRow,
    postgres::{PgPool, PgRow},
    Column, Row, TypeInfo, ValueRef,
};

use crate::common::time::{iso, naive_iso};

/// The sqlx pool underneath Loco's SeaORM connection.
#[must_use]
pub fn pool(ctx: &AppContext) -> &PgPool {
    ctx.db.get_postgres_connection_pool()
}

fn bytes_to_node_buffer(bytes: &[u8]) -> Value {
    serde_json::json!({ "type": "Buffer", "data": bytes })
}

/// An f32 as the number its shortest decimal text parses to in JavaScript.
fn f32_as_js(v: f32) -> Value {
    v.to_string()
        .parse::<f64>()
        .ok()
        .and_then(serde_json::Number::from_f64)
        .map_or(Value::Null, Value::Number)
}

/// One PostgreSQL value, as node-pg would hand it to `JSON.stringify`.
fn pg_value(row: &PgRow, idx: usize) -> Value {
    let Ok(raw) = row.try_get_raw(idx) else {
        return Value::Null;
    };
    if raw.is_null() {
        return Value::Null;
    }
    let ty = raw.type_info().name().to_ascii_uppercase();
    macro_rules! get {
        ($t:ty) => {
            row.try_get::<$t, _>(idx).ok()
        };
    }
    match ty.as_str() {
        "BOOL" => get!(bool).map_or(Value::Null, Value::Bool),
        "INT2" => get!(i16).map_or(Value::Null, Value::from),
        "INT4" => get!(i32).map_or(Value::Null, Value::from),
        // node-pg returns int8 as a string (it can exceed 2^53).
        "INT8" => get!(i64).map_or(Value::Null, |v| Value::String(v.to_string())),
        "OID" => get!(sqlx::postgres::types::Oid).map_or(Value::Null, |v| Value::from(v.0)),
        // node-pg parses float4's text form ("1.1"); widening the f32 would
        // give 1.100000023841858.
        "FLOAT4" => get!(f32).map_or(Value::Null, f32_as_js),
        "FLOAT8" => get!(f64).map_or(Value::Null, |v| {
            serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number)
        }),
        // numeric keeps its scale as a string: DECIMAL(20,4) 20 → "20.0000".
        "NUMERIC" => get!(Decimal).map_or(Value::Null, |v| Value::String(v.to_string())),
        "TIMESTAMPTZ" => get!(DateTime<Utc>).map_or(Value::Null, |v| Value::String(iso(v))),
        "TIMESTAMP" => get!(NaiveDateTime).map_or(Value::Null, |v| Value::String(naive_iso(v))),
        // node-pg parses DATE as local midnight; the service runs in UTC.
        "DATE" => get!(NaiveDate).map_or(Value::Null, |v| {
            Value::String(naive_iso(v.and_hms_opt(0, 0, 0).unwrap_or_default()))
        }),
        "JSON" | "JSONB" => get!(Value).unwrap_or(Value::Null),
        "UUID" => get!(uuid::Uuid).map_or(Value::Null, |v| Value::String(v.to_string())),
        "BYTEA" => get!(Vec<u8>).map_or(Value::Null, |v| bytes_to_node_buffer(&v)),
        "TEXT[]" | "VARCHAR[]" | "NAME[]" => get!(Vec<String>).map_or(Value::Null, |v| {
            Value::Array(v.into_iter().map(Value::String).collect())
        }),
        "INT4[]" => get!(Vec<i32>).map_or(Value::Null, |v| {
            Value::Array(v.into_iter().map(Value::from).collect())
        }),
        _ => get!(String).map_or(Value::Null, Value::String),
    }
}

/// A PostgreSQL row as a JSON object, columns in select order.
#[must_use]
pub fn pg_row_to_json(row: &PgRow) -> Value {
    let mut map = Map::new();
    for (idx, col) in row.columns().iter().enumerate() {
        map.insert(col.name().to_string(), pg_value(row, idx));
    }
    Value::Object(map)
}

#[must_use]
pub fn pg_rows_to_json(rows: &[PgRow]) -> Vec<Value> {
    rows.iter().map(pg_row_to_json).collect()
}

/// One MySQL value, as mysql2 (the Node driver) hands it over by default:
/// DECIMAL as a string, BIGINT as a number, DATETIME as a Date.
fn mysql_value(row: &MySqlRow, idx: usize) -> Value {
    let Ok(raw) = row.try_get_raw(idx) else {
        return Value::Null;
    };
    if raw.is_null() {
        return Value::Null;
    }
    let ty = raw.type_info().name().to_ascii_uppercase();
    macro_rules! get {
        ($t:ty) => {
            row.try_get::<$t, _>(idx).ok()
        };
    }
    match ty.as_str() {
        "BOOLEAN" | "TINYINT" | "SMALLINT" | "MEDIUMINT" | "INT" | "BIGINT" => get!(i64)
            .map(Value::from)
            .or_else(|| get!(bool).map(|b| Value::from(i64::from(b))))
            .unwrap_or(Value::Null),
        "TINYINT UNSIGNED" | "SMALLINT UNSIGNED" | "MEDIUMINT UNSIGNED" | "INT UNSIGNED"
        | "BIGINT UNSIGNED" => get!(u64).map_or(Value::Null, Value::from),
        "FLOAT" => get!(f32).map_or(Value::Null, f32_as_js),
        "DOUBLE" => get!(f64).map_or(Value::Null, |v| {
            serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number)
        }),
        "DECIMAL" => get!(Decimal).map_or(Value::Null, |v| Value::String(v.to_string())),
        "DATETIME" => get!(NaiveDateTime).map_or(Value::Null, |v| Value::String(naive_iso(v))),
        "TIMESTAMP" => get!(DateTime<Utc>).map_or(Value::Null, |v| Value::String(iso(v))),
        "DATE" => get!(NaiveDate).map_or(Value::Null, |v| {
            Value::String(naive_iso(v.and_hms_opt(0, 0, 0).unwrap_or_default()))
        }),
        "JSON" => get!(Value).unwrap_or(Value::Null),
        "BLOB" | "TINYBLOB" | "MEDIUMBLOB" | "LONGBLOB" | "BINARY" | "VARBINARY" => {
            get!(Vec<u8>).map_or(Value::Null, |v| bytes_to_node_buffer(&v))
        }
        _ => get!(String).map_or(Value::Null, Value::String),
    }
}

#[must_use]
pub fn mysql_row_to_json(row: &MySqlRow) -> Value {
    let mut map = Map::new();
    for (idx, col) in row.columns().iter().enumerate() {
        map.insert(col.name().to_string(), mysql_value(row, idx));
    }
    Value::Object(map)
}

#[cfg(test)]
mod tests {
    use super::f32_as_js;

    #[test]
    fn float4_prints_like_node_pg() {
        assert_eq!(f32_as_js(1.1).to_string(), "1.1");
        assert_eq!(f32_as_js(-0.25).to_string(), "-0.25");
    }
}
