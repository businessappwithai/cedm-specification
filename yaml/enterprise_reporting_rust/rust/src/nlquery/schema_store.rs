//! `getSchemaContext` / `introspectAndCacheSchema`
//! (`src/lib/mastra/schema-store.ts`): a data source's introspected schema,
//! five sample rows per table and an LLM-readable description of both,
//! cached in `ds_schema_cache` (one row per data source).
use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, TimeZone, Utc};
use serde_json::{json, Map, Value};
use sqlx::{postgres::PgRow, AssertSqlSafe, Column as _, PgPool, Row, TypeInfo, ValueRef};

use crate::{
    common::{db::pg_row_to_json, js},
    datasources::introspection::{introspect_postgres, SchemaInfo},
};

pub struct SchemaContext {
    pub schema_info: Value,
    pub sample_data: Value,
    pub schema_text: String,
}

/// `Date.prototype.toString()` in the process's time zone:
/// `Wed Sep 23 2026 10:00:00 GMT+0000 (Coordinated Universal Time)`. The
/// parenthesised name is ICU's long zone name in Node; here it is that name
/// for UTC and the zone's abbreviation otherwise.
#[must_use]
pub fn js_date_string(t: DateTime<Utc>) -> String {
    let local = t.with_timezone(&Local);
    let offset = local.format("%z").to_string();
    let name = if offset == "+0000" {
        "Coordinated Universal Time".to_string()
    } else {
        std::env::var("TZ").unwrap_or_else(|_| local.format("%Z").to_string())
    };
    format!("{} GMT{offset} ({name})", local.format("%a %b %d %Y %H:%M:%S"))
}

/// `String(v)` for one sample value of a node-pg row, and a string quoted and
/// cut to 50 UTF-16 units, as `buildSchemaText` prints it.
fn sample_text(row: &PgRow, idx: usize, value: &Value) -> String {
    let ty = row
        .try_get_raw(idx)
        .ok()
        .filter(|r| !r.is_null())
        .map(|r| r.type_info().name().to_ascii_uppercase());
    let date = match ty.as_deref() {
        Some("TIMESTAMPTZ") => row.try_get::<DateTime<Utc>, _>(idx).ok(),
        Some("TIMESTAMP") => row
            .try_get::<NaiveDateTime, _>(idx)
            .ok()
            .and_then(|n| Local.from_local_datetime(&n).earliest())
            .map(|t| t.with_timezone(&Utc)),
        Some("DATE") => row
            .try_get::<NaiveDate, _>(idx)
            .ok()
            .and_then(|d| d.and_hms_opt(0, 0, 0))
            .and_then(|n| Local.from_local_datetime(&n).earliest())
            .map(|t| t.with_timezone(&Utc)),
        _ => None,
    };
    if let Some(d) = date {
        return js_date_string(d);
    }
    match value {
        Value::Null => "NULL".into(),
        Value::String(s) => format!(
            "'{}'",
            String::from_utf16_lossy(&s.encode_utf16().take(50).collect::<Vec<_>>())
        ),
        Value::Object(_) => "[object Object]".into(),
        Value::Array(items) => items
            .iter()
            .map(|v| match v {
                Value::Null => String::new(),
                Value::Object(_) => "[object Object]".into(),
                Value::String(s) => s.clone(),
                other => js::stringify(other),
            })
            .collect::<Vec<_>>()
            .join(","),
        other => js::stringify(other),
    }
}

fn str_of(v: &Value, k: &str) -> String {
    v.get(k).and_then(Value::as_str).unwrap_or_default().to_string()
}

/// `buildSchemaText(schemaInfo, sampleData)`, given the sample rows already
/// rendered as `k=v` lines per table.
fn build_schema_text(
    info: &Value,
    samples: &Map<String, Value>,
    sample_lines: &Map<String, Value>,
) -> String {
    let mut parts: Vec<String> = vec!["=== DATABASE SCHEMA ===\n".into()];
    let empty = Vec::new();
    let tables = info.get("tables").and_then(Value::as_array).unwrap_or(&empty);
    for t in tables {
        let name = str_of(t, "name");
        let schema = str_of(t, "schema");
        parts.push(format!(
            "TABLE: {}{name}",
            if schema.is_empty() {
                String::new()
            } else {
                format!("{schema}.")
            }
        ));
        parts.push("Columns:".into());
        for c in t.get("columns").and_then(Value::as_array).unwrap_or(&empty) {
            let mut constraints: Vec<String> = Vec::new();
            if c.get("isPrimaryKey").and_then(Value::as_bool) == Some(true) {
                constraints.push("PRIMARY KEY".into());
            }
            if c.get("nullable").and_then(Value::as_bool) != Some(true) {
                constraints.push("NOT NULL".into());
            }
            if let Some(d) = c
                .get("defaultValue")
                .and_then(Value::as_str)
                .filter(|d| !d.is_empty())
            {
                constraints.push(format!("DEFAULT {d}"));
            }
            let cs = if constraints.is_empty() {
                String::new()
            } else {
                format!(" [{}]", constraints.join(", "))
            };
            parts.push(format!("  - {}: {}{cs}", str_of(c, "name"), str_of(c, "type")));
        }
        let pk: Vec<&str> = t
            .get("primaryKey")
            .and_then(Value::as_array)
            .map(|a| a.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default();
        if !pk.is_empty() {
            parts.push(format!("Primary Key: ({})", pk.join(", ")));
        }
        let fks = t.get("foreignKeys").and_then(Value::as_array).unwrap_or(&empty);
        if !fks.is_empty() {
            parts.push("Foreign Keys:".into());
            for fk in fks {
                parts.push(format!(
                    "  - {} -> {}({})",
                    str_of(fk, "column"),
                    str_of(fk, "referencedTable"),
                    str_of(fk, "referencedColumn")
                ));
            }
        }
        let count = samples.get(&name).and_then(Value::as_array).map_or(0, Vec::len);
        if count > 0 {
            parts.push(format!("Sample Data ({count} rows):"));
            for line in sample_lines
                .get(&name)
                .and_then(Value::as_array)
                .unwrap_or(&empty)
                .iter()
                .take(3)
            {
                parts.push(format!("  {}", line.as_str().unwrap_or_default()));
            }
        }
        parts.push(String::new());
    }
    let views = info.get("views").and_then(Value::as_array).unwrap_or(&empty);
    if !views.is_empty() {
        parts.push("=== VIEWS ===\n".into());
        for v in views {
            let schema = str_of(v, "schema");
            parts.push(format!(
                "VIEW: {}{}",
                if schema.is_empty() {
                    String::new()
                } else {
                    format!("{schema}.")
                },
                str_of(v, "name")
            ));
            if let Some(d) = v
                .get("definition")
                .and_then(Value::as_str)
                .filter(|d| !d.is_empty())
            {
                let cut: String = String::from_utf16_lossy(&d.encode_utf16().take(500).collect::<Vec<_>>());
                parts.push(format!("Definition: {cut}"));
            }
            let cols = v.get("columns").and_then(Value::as_array).unwrap_or(&empty);
            if !cols.is_empty() {
                parts.push("Columns:".into());
                for c in cols {
                    parts.push(format!("  - {}: {}", str_of(c, "name"), str_of(c, "type")));
                }
            }
            parts.push(String::new());
        }
    }
    let mut rels = Vec::new();
    for t in tables {
        for fk in t.get("foreignKeys").and_then(Value::as_array).unwrap_or(&empty) {
            rels.push(format!(
                "{}.{} -> {}.{}",
                str_of(t, "name"),
                str_of(fk, "column"),
                str_of(fk, "referencedTable"),
                str_of(fk, "referencedColumn")
            ));
        }
    }
    if !rels.is_empty() {
        parts.push("=== TABLE RELATIONSHIPS ===\n".into());
        parts.extend(rels);
        parts.push(String::new());
    }
    parts.join("\n")
}

/// `introspectAndCacheSchema(dataSource)`.
///
/// # Errors
/// On an introspection or config-database error.
pub async fn introspect_and_cache(
    config: &PgPool,
    ds_id: &str,
    user: &PgPool,
) -> Result<SchemaContext, sqlx::Error> {
    let info: SchemaInfo = introspect_postgres(user).await?;
    let info_json = serde_json::to_value(&info).unwrap_or(Value::Null);
    let mut samples = Map::new();
    let mut lines = Map::new();
    for t in &info.tables {
        let quoted = format!("\"{}\"", t.name.replace('"', "\"\""));
        match sqlx::query(AssertSqlSafe(format!("select * from {quoted} limit $1")))
            .bind(5_i64)
            .fetch_all(user)
            .await
        {
            Ok(rows) => {
                let mut json_rows = Vec::new();
                let mut text_rows = Vec::new();
                for r in &rows {
                    let v = pg_row_to_json(r);
                    let entries = r
                        .columns()
                        .iter()
                        .enumerate()
                        .map(|(i, c)| {
                            format!(
                                "{}={}",
                                c.name(),
                                sample_text(r, i, v.get(c.name()).unwrap_or(&Value::Null))
                            )
                        })
                        .collect::<Vec<_>>()
                        .join(", ");
                    text_rows.push(json!(entries));
                    json_rows.push(v);
                }
                samples.insert(t.name.clone(), Value::Array(json_rows));
                lines.insert(t.name.clone(), Value::Array(text_rows));
            }
            Err(e) => {
                tracing::warn!(table = %t.name, error = %e, "Failed to fetch sample data");
                samples.insert(t.name.clone(), json!([]));
            }
        }
    }
    let text = build_schema_text(&info_json, &samples, &lines);
    let now = crate::common::time::now_iso()
        .replace('T', " ")
        .chars()
        .take(19)
        .collect::<String>();
    sqlx::query(
        "INSERT INTO ds_schema_cache (id, data_source_id, schema_metadata, sample_data, embedding_data, \
            last_introspected_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6, $6) \
         ON CONFLICT (data_source_id) DO UPDATE SET schema_metadata = EXCLUDED.schema_metadata, \
            sample_data = EXCLUDED.sample_data, embedding_data = EXCLUDED.embedding_data, \
            last_introspected_at = EXCLUDED.last_introspected_at, updated_at = EXCLUDED.updated_at",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(ds_id)
    .bind(js::stringify(&info_json))
    .bind(js::stringify(&Value::Object(samples.clone())))
    .bind(&text)
    .bind(&now)
    .execute(config)
    .await?;
    Ok(SchemaContext {
        schema_info: info_json,
        sample_data: Value::Object(samples),
        schema_text: text,
    })
}

/// `getSchemaContext(dataSource)`: the cache, or a fresh introspection.
///
/// # Errors
/// On a database error, or a cached row that does not parse.
pub async fn get_schema_context(
    config: &PgPool,
    ds_id: &str,
    user: &PgPool,
) -> Result<SchemaContext, String> {
    let cached = sqlx::query(
        "SELECT schema_metadata, sample_data, embedding_data FROM ds_schema_cache WHERE data_source_id = $1",
    )
    .bind(ds_id)
    .fetch_optional(config)
    .await
    .map_err(|e| e.to_string())?;
    if let Some(r) = cached {
        let info: Value =
            serde_json::from_str(&r.get::<String, _>("schema_metadata")).map_err(|e| e.to_string())?;
        let samples: Value = match r
            .get::<Option<String>, _>("sample_data")
            .filter(|s| !s.is_empty())
        {
            Some(s) => serde_json::from_str(&s).map_err(|e| e.to_string())?,
            None => json!({}),
        };
        let text = match r
            .get::<Option<String>, _>("embedding_data")
            .filter(|s| !s.is_empty())
        {
            Some(t) => t,
            // Rebuilt from the cached JSON: sample dates are already strings.
            None => {
                let mut lines = Map::new();
                if let Some(obj) = samples.as_object() {
                    for (k, rows) in obj {
                        let rendered: Vec<Value> = rows
                            .as_array()
                            .map(|a| {
                                a.iter()
                                    .map(|row| {
                                        json!(row
                                            .as_object()
                                            .map(|o| o
                                                .iter()
                                                .map(|(c, v)| format!(
                                                    "{c}={}",
                                                    match v {
                                                        Value::Null => "NULL".to_string(),
                                                        Value::String(s) => format!(
                                                            "'{}'",
                                                            String::from_utf16_lossy(
                                                                &s.encode_utf16()
                                                                    .take(50)
                                                                    .collect::<Vec<_>>()
                                                            )
                                                        ),
                                                        Value::Object(_) => "[object Object]".into(),
                                                        other => js::stringify(other),
                                                    }
                                                ))
                                                .collect::<Vec<_>>()
                                                .join(", "))
                                            .unwrap_or_default())
                                    })
                                    .collect()
                            })
                            .unwrap_or_default();
                        lines.insert(k.clone(), Value::Array(rendered));
                    }
                }
                build_schema_text(&info, samples.as_object().unwrap_or(&Map::new()), &lines)
            }
        };
        return Ok(SchemaContext {
            schema_info: info,
            sample_data: samples,
            schema_text: text,
        });
    }
    introspect_and_cache(config, ds_id, user)
        .await
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn js_date_to_string_in_utc() {
        if std::env::var("TZ").is_ok_and(|t| t != "UTC") {
            return;
        }
        let t = Utc.with_ymd_and_hms(2026, 9, 23, 10, 0, 0).unwrap();
        assert_eq!(
            js_date_string(t),
            "Wed Sep 23 2026 10:00:00 GMT+0000 (Coordinated Universal Time)"
        );
    }

    #[test]
    fn schema_text() {
        let info = json!({"tables": [{"name": "orders", "schema": "public", "columns": [
            {"name": "id", "type": "integer", "nullable": false, "defaultValue": "nextval('x')"},
            {"name": "note", "type": "text", "nullable": true, "defaultValue": null}],
            "primaryKey": ["id"], "foreignKeys": [{"column": "c", "referencedTable": "cust", "referencedColumn": "id"}]}],
            "views": []});
        let text = build_schema_text(&info, &Map::new(), &Map::new());
        assert_eq!(
            text,
            "=== DATABASE SCHEMA ===\n\nTABLE: public.orders\nColumns:\n  - id: integer [NOT NULL, DEFAULT nextval('x')]\n  - note: text\nPrimary Key: (id)\nForeign Keys:\n  - c -> cust(id)\n\n=== TABLE RELATIONSHIPS ===\n\norders.c -> cust.id\n"
        );
    }
}
