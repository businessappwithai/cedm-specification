//! `/api/sql` — twin of `src/routes/api/sql/{execute,validate,schema.$dataSourceId}.ts`.
//!
//! PostgreSQL data sources only (MIGRATION_PLAN.md §7, Phase 3 scope).
use std::sync::OnceLock;
use std::time::Instant;

use axum::{
    body::Bytes,
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use regex::Regex;
use serde_json::{json, Map, Value};

use super::support::{active_data_source, parse_body, strip_trailing_semicolon};
use crate::{
    auth::CurrentSession,
    common::{db::pool, js, pagination::max_page_size, response},
    datasources::{
        get_connection,
        introspection::{introspect_postgres, to_value},
        UserDb,
    },
    metadata::sync::sync_data_source,
    monitoring::js::{number, number_from_str},
    permissions::query_access::validate_query_access,
    security::audit::{log_audit, AuditEntry},
    sql::{validate::validate_sql, validator::is_read_only_query},
};

/// `sqlEditorConfig.serverPageSize` / `.maxClientRows`.
const PAGE_SIZE: f64 = 100.0;
const MAX_CLIENT_ROWS: i64 = 5000;

fn re(cell: &'static OnceLock<Regex>, pattern: &str) -> &'static Regex {
    cell.get_or_init(|| Regex::new(pattern).expect("static regex"))
}

fn limit_re() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    re(&R, r"(?i)\bLIMIT\s+(\d+)")
}

fn top_re() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    re(&R, r"(?i)\bTOP\s+\d+")
}

fn offset_re() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    re(&R, r"(?i)\bOFFSET\s+\d+")
}

/// `validatePageSize`: clamp to `[1, MAX_PAGE_SIZE]`.
fn validate_page_size(n: f64) -> f64 {
    #[allow(clippy::cast_precision_loss)]
    let max = max_page_size() as f64;
    if n < 1.0 {
        1.0
    } else if n > max {
        max
    } else {
        n
    }
}

/// `x || fallback` for a numeric body field.
fn number_or(v: Option<&Value>, fallback: f64) -> f64 {
    if js::truthy(v) {
        v.map_or(fallback, number)
    } else {
        fallback
    }
}

fn js_num(n: f64) -> String {
    crate::monitoring::js::number_to_string(n)
}

/// The statement Node actually runs: its own LIMIT/OFFSET when it has none,
/// an OFFSET appended to a bare LIMIT, and any LIMIT clamped to the page cap.
fn paged_sql(sql: &str, limit: f64, offset: f64) -> String {
    let mut s = sql.trim().to_string();
    let has_limit = limit_re().is_match(&s);
    if !has_limit && !top_re().is_match(&s) {
        if s.ends_with(';') {
            s.pop();
        }
        s = format!("{s} LIMIT {} OFFSET {}", js_num(limit), js_num(offset));
    } else if has_limit && !offset_re().is_match(&s) && offset > 0.0 {
        if s.ends_with(';') {
            s.pop();
        }
        s = format!("{s} OFFSET {}", js_num(offset));
    }
    let clamp = limit_re().captures(&s).and_then(|c| {
        #[allow(clippy::cast_precision_loss)]
        let user = c[1].parse::<u64>().map_or(f64::INFINITY, |v| v as f64);
        let valid = validate_page_size(user);
        (valid != user).then_some(valid)
    });
    if let Some(valid) = clamp {
        s = limit_re()
            .replace(&s, format!("LIMIT {}", js_num(valid)).as_str())
            .into_owned();
    }
    s
}

/// `inferType` over the first five rows.
fn infer_type(rows: &[Value], col: &str) -> &'static str {
    let non_null: Vec<&Value> = rows
        .iter()
        .take(5)
        .filter_map(|r| r.get(col))
        .filter(|v| !v.is_null() && v.as_str() != Some(""))
        .collect();
    if non_null.is_empty() {
        return "string";
    }
    let numeric = non_null.iter().all(|v| match v {
        Value::Number(_) => true,
        Value::String(s) => !number_from_str(s).is_nan() && !s.trim().is_empty(),
        _ => false,
    });
    if numeric {
        return "number";
    }
    if non_null.iter().all(|v| v.is_boolean()) {
        return "boolean";
    }
    "string"
}

fn execution_error(message: &str) -> Response {
    response::error(StatusCode::INTERNAL_SERVER_ERROR, "EXECUTION_ERROR", message)
}

/// `POST /api/sql/execute`.
async fn execute(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(execution_error("Invalid JSON body"));
    };
    let sql = match body.get("sql") {
        Some(v) if js::truthy(Some(v)) => v.as_str().unwrap_or_default().to_string(),
        _ => {
            return Ok(response::error(
                StatusCode::BAD_REQUEST,
                "INVALID_INPUT",
                "SQL content is required",
            ))
        }
    };
    let ds_id = match body.get("dataSourceId") {
        Some(v) if js::truthy(Some(v)) => js::text(v).unwrap_or_default(),
        _ => {
            return Ok(response::error(
                StatusCode::BAD_REQUEST,
                "INVALID_INPUT",
                "Data source ID is required",
            ))
        }
    };
    if !is_read_only_query(&sql) {
        tracing::warn!(user = %session.user.id, data_source = %ds_id, "Non-SELECT query attempted");
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            "Only SELECT queries are allowed in the SQL editor",
        ));
    }
    let db = pool(&ctx);
    let ds = match active_data_source(db, &ds_id).await {
        Ok(Some(ds)) => ds,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Data source not found",
            ))
        }
        Err(e) => return Ok(execution_error(&e.to_string())),
    };
    let access = validate_query_access(db, &session.user.id, &sql, &ds_id).await;
    if !access.allowed {
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            access
                .reason
                .as_deref()
                .unwrap_or("You do not have access to every table in this query"),
        ));
    }
    let conn = match get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => return Ok(execution_error(&e.to_string())),
    };

    // Best effort, as in Node: a count that fails is a total of 0.
    let count_sql = format!(
        "SELECT COUNT(*) as total FROM ({}) as count_query",
        strip_trailing_semicolon(&sql)
    );
    let total: f64 = match conn.fetch_json(&count_sql).await {
        Ok(rows) => rows
            .first()
            .and_then(|r| r.get("total"))
            .map(number)
            .filter(|n| !n.is_nan())
            .unwrap_or(0.0),
        Err(e) => {
            tracing::debug!(error = %e, "Could not count total rows (non-blocking)");
            0.0
        }
    };

    let limit = validate_page_size(number_or(body.get("limit"), PAGE_SIZE));
    let offset = number_or(body.get("offset"), 0.0);
    let limited = paged_sql(&sql, limit, offset);

    let started = Instant::now();
    let rows = match conn.fetch_json(&limited).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, user = %session.user.id, "SQL execution failed");
            return Ok(execution_error(&crate::datasources::db_error_message(&e)));
        }
    };
    let execution_time = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);

    let columns: Vec<Value> = rows
        .first()
        .and_then(Value::as_object)
        .map(|first| {
            first
                .keys()
                .map(|name| json!({ "name": name, "type": infer_type(&rows, name) }))
                .collect()
        })
        .unwrap_or_default();

    let preview: String = sql.chars().take(500).collect();
    let row_count = rows.len();
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(&session.user.id),
            action: "execute",
            resource_type: "query",
            resource_id: Some(&ds_id),
            details: Some(json!({ "sql": preview, "rowCount": row_count, "executionTime": execution_time })),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }

    #[allow(clippy::cast_precision_loss)]
    let has_more = total > 0.0 && offset + (row_count as f64) < total;
    let num = |n: f64| serde_json::from_str::<Value>(&js_num(n)).unwrap_or(Value::Null);
    Ok(response::ok(json!({
        "columns": columns,
        "rows": rows,
        "rowCount": row_count,
        "totalRows": num(total),
        "executionTime": execution_time,
        "truncated": row_count >= 100,
        "pagination": {
            "limit": 100,
            "offset": num(offset),
            "totalRows": num(total),
            "hasMore": has_more,
            "serverSide": true,
            "maxClientRows": MAX_CLIENT_ROWS,
        },
    })))
}

/// `POST /api/sql/validate`.
async fn validate(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let Some(body) = parse_body(&body) else {
        return Ok(response::error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "VALIDATION_ERROR",
            "Invalid JSON body",
        ));
    };
    let sql = match body.get("sql") {
        Some(Value::String(s)) if !s.is_empty() => s.clone(),
        _ => {
            return Ok(response::error(
                StatusCode::BAD_REQUEST,
                "INVALID_INPUT",
                "SQL content is required",
            ))
        }
    };
    let mut dialect = "sqlite3".to_string();
    if let Some(id) = body
        .get("dataSourceId")
        .filter(|v| js::truthy(Some(v)))
        .and_then(js::text)
    {
        match sqlx::query_scalar::<_, String>("SELECT client_type FROM data_sources WHERE id = $1")
            .bind(&id)
            .fetch_optional(pool(&ctx))
            .await
        {
            Ok(Some(ct)) => dialect = ct,
            Ok(None) => {}
            Err(e) => {
                return Ok(response::server_error(
                    "SQL validation error",
                    &e,
                    "VALIDATION_ERROR",
                    &e.to_string(),
                ))
            }
        }
    }
    Ok(response::ok(to_value(&validate_sql(&sql, &dialect))))
}

/// `GET /api/sql/schema/{dataSourceId}` — introspect, sync the metadata
/// layer (failures swallowed, as in Node), and return the schema.
async fn schema(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(ds_id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let introspection_error =
        |m: &str| response::error(StatusCode::INTERNAL_SERVER_ERROR, "INTROSPECTION_ERROR", m);
    let ds = match active_data_source(db, &ds_id).await {
        Ok(Some(ds)) => ds,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Data source not found or not active",
            ))
        }
        Err(e) => return Ok(introspection_error(&e.to_string())),
    };
    let conn = match get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => return Ok(introspection_error(&e.to_string())),
    };
    let UserDb::Pg(user_pool) = &conn else {
        return Ok(introspection_error(&format!(
            "Schema introspection for {} data sources is not served by the Rust backend (PostgreSQL only)",
            ds.client_type
        )));
    };
    let info = match introspect_postgres(user_pool).await {
        Ok(i) => i,
        Err(e) => return Ok(introspection_error(&crate::datasources::db_error_message(&e))),
    };
    let sync = match sync_data_source(db, &ds_id, Some(&session.user.id), &info).await {
        Ok(r) => Some(r),
        Err(e) => {
            tracing::error!(error = %e, "[Schema Sync] Failed to sync metadata");
            None
        }
    };

    let mut data: Map<String, Value> = match to_value(&info) {
        Value::Object(m) => m,
        _ => Map::new(),
    };
    // PostgreSQL introspection logs nothing in Node either.
    data.insert("logs".into(), json!([]));
    if info.tables.is_empty() && info.views.is_empty() {
        return Ok(response::raw(
            StatusCode::OK,
            &json!({
                "success": true,
                "data": data,
                "warning": "No tables or views found in this database. The database may be empty or you may not have permission to access the tables.",
            }),
        ));
    }
    if let Some(r) = sync {
        data.insert(
            "metadataSync".into(),
            json!({
                "entitiesCreated": r.entities_created,
                "entitiesUpdated": r.entities_updated,
                "fieldsCreated": r.fields_created,
                "fieldsUpdated": r.fields_updated,
            }),
        );
    }
    Ok(response::ok(Value::Object(data)))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/sql")
        .add("/execute", post(execute))
        .add("/validate", post(validate))
        .add("/schema/{dataSourceId}", get(schema))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pages_like_node() {
        assert_eq!(paged_sql("SELECT 1;", 100.0, 0.0), "SELECT 1 LIMIT 100 OFFSET 0");
        assert_eq!(
            paged_sql("SELECT 1 LIMIT 5", 100.0, 10.0),
            "SELECT 1 LIMIT 5 OFFSET 10"
        );
        assert_eq!(paged_sql("SELECT 1 LIMIT 5", 100.0, 0.0), "SELECT 1 LIMIT 5");
        assert_eq!(
            paged_sql("SELECT 1 limit 5000", 100.0, 0.0),
            "SELECT 1 LIMIT 1000"
        );
        assert_eq!(
            paged_sql("SELECT TOP 5 x FROM t", 100.0, 0.0),
            "SELECT TOP 5 x FROM t"
        );
    }

    #[test]
    fn infers_types_like_node() {
        let rows = vec![json!({"a": "12.5", "b": true, "c": "x", "d": null, "e": 3})];
        assert_eq!(infer_type(&rows, "a"), "number");
        assert_eq!(infer_type(&rows, "b"), "boolean");
        assert_eq!(infer_type(&rows, "c"), "string");
        assert_eq!(infer_type(&rows, "d"), "string");
        assert_eq!(infer_type(&rows, "e"), "number");
    }
}
