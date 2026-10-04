//! The questions the model declared in `reports`, and the queries that
//! answer them.
//!
//! Each row in `sys_report` carries SQL authored in the model document (`reports`).
//! Running one is the only place in this application where stored text becomes
//! a statement, so most of what follows is about that.
//!
//! Not to be confused with the report *designs* under `/api/sys/report-designs`,
//! which render one record as a printable document. This is analysis over the
//! whole database.
//!
//! Generated: 2026-10-04T01:12:44.605Z
//! Project: regulatory

use axum::{
    extract::{Path, State},
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::{AssertSqlSafe, Column, Row};
use std::time::Instant;

use crate::errors::{AppError, AppResult};
use crate::services::row_json::row_to_json;

/// The most rows a report will return.
///
/// A report is a question a person reads, not an export. A model is free to
/// declare a query with no LIMIT — most do, because the interesting ones are
/// already narrowed by their WHERE clause — and on a seeded database that is
/// fine. On a real one, "every row of bus_transaction" is a query that ends the
/// tab rather than answering anything. The cap is applied as an outer LIMIT so
/// the report's own ordering still decides *which* rows, and the response says
/// when it bit.
const MAX_ROWS: i64 = 5000;

/// A report may only read, checked again here.
///
/// The generator refuses a non-SELECT at compile time, so a statement that is
/// not a query cannot reach `seed/reports.sql`. This is the second check, and
/// it is not redundant: `sys_report` is an ordinary table, and anything that
/// can write to it — a later migration, a restored backup, an operator with
/// database access — could otherwise put a statement here that this handler
/// would run with the application's own credentials.
fn assert_read_only(text: &str) -> Result<(), AppError> {
    let body = strip_trailing_semicolon(text);
    let head = body.trim_start().to_ascii_lowercase();
    let opens_a_query = ["with", "select"].iter().any(|keyword| {
        head.strip_prefix(keyword).is_some_and(|rest| {
            // A query named `selection_of(...)` is not a SELECT.
            rest.chars()
                .next()
                .is_none_or(|ch| !ch.is_alphanumeric() && ch != '_')
        })
    });
    if !opens_a_query {
        return Err(AppError::BadRequest(
            "A report query must be a SELECT or a WITH query.".to_string(),
        ));
    }

    // A semicolon outside quotes means a second statement is hiding behind the
    // first: `SELECT 1; DROP TABLE bus_account` passes the test above.
    // Semicolons *inside* string literals are ordinary characters, so this
    // tracks quoting rather than searching for the byte.
    let chars: Vec<char> = body.chars().collect();
    let mut quote: Option<char> = None;
    let mut index = 0;
    while index < chars.len() {
        let ch = chars[index];
        match quote {
            Some(open) => {
                if ch == open {
                    // Doubling is how both SQL quote styles escape themselves.
                    if chars.get(index + 1) == Some(&open) {
                        index += 1;
                    } else {
                        quote = None;
                    }
                }
            }
            None => {
                if ch == '\'' || ch == '"' {
                    quote = Some(ch);
                } else if ch == ';' {
                    return Err(AppError::BadRequest(
                        "A report query must be a single statement.".to_string(),
                    ));
                }
            }
        }
        index += 1;
    }
    Ok(())
}

fn strip_trailing_semicolon(sql: &str) -> &str {
    let trimmed = sql.trim_end();
    trimmed.strip_suffix(';').unwrap_or(trimmed).trim_end()
}

/// One report as the screen sees it — everything but the query.
///
/// `sql_text` is deliberately absent. The list feeds a menu; handing the query
/// to the browser would put the application's schema in front of anyone who can
/// open the reports page, and nothing on that screen needs it.
fn describe(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id": row.get::<uuid::Uuid, _>("sys_report_id").to_string(),
        "name": row.get::<String, _>("name"),
        "title": row.get::<String, _>("title"),
        "entityName": row.get::<Option<String>, _>("entity_name"),
        "tableName": row.get::<Option<String>, _>("table_name"),
        "chart": row.get::<Option<String>, _>("chart"),
        "xAxis": row.get::<Option<String>, _>("x_axis"),
        "yAxis": row.get::<Option<String>, _>("y_axis"),
        "help": row.get::<Option<String>, _>("help"),
        "sortOrder": row.get::<i32, _>("sort_order"),
    })
}

const DESCRIBE_COLUMNS: &str = "sys_report_id, name, title, entity_name, table_name, chart, \
                                x_axis, y_axis, help, sort_order";

/// `GET /api/reports` — every report the model declared, in declaration order.
#[utoipa::path(
    get, path = "/api/reports", tag = "reports",
    security(("bearer" = [])),
    responses((status = 200, description = "The model's reports, without their queries")),
)]
pub async fn list(_auth: auth::JWT, State(ctx): State<AppContext>) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let rows = sqlx::query(AssertSqlSafe(format!(
        "SELECT {DESCRIBE_COLUMNS} FROM sys_report ORDER BY sort_order, name"
    )))
    .fetch_all(pool)
    .await
    .map_err(|err| AppError::Internal(anyhow::anyhow!("listing reports: {err}")))?;

    let described: Vec<Value> = rows.iter().map(describe).collect();
    Ok(Json(json!({ "data": described, "meta": { "total": described.len() } })).into_response())
}

/// `GET /api/reports/{name}` — one report, without its query.
#[utoipa::path(
    get, path = "/api/reports/{name}", tag = "reports",
    security(("bearer" = [])),
    params(("name" = String, Path, description = "The report's declared name")),
    responses(
        (status = 200, description = "The report's description"),
        (status = 404, description = "No report of that name"),
    ),
)]
pub async fn show(
    _auth: auth::JWT,
    Path(name): Path<String>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let row = sqlx::query(AssertSqlSafe(format!(
        "SELECT {DESCRIBE_COLUMNS} FROM sys_report WHERE name = $1"
    )))
    .bind(&name)
    .fetch_optional(pool)
    .await
    .map_err(|err| AppError::Internal(anyhow::anyhow!("reading report: {err}")))?
    .ok_or_else(|| AppError::NotFound(format!("No report named \"{name}\".")))?;

    Ok(Json(describe(&row)).into_response())
}

/// `GET /api/reports/{name}/run` — run a report and return its rows.
///
/// The query is wrapped rather than concatenated with a LIMIT: a model's query
/// may legitimately end in `ORDER BY`, `LIMIT`, a CTE or a comment, and
/// appending to any of those changes what it means. As a subquery it keeps
/// whatever it already says and the cap applies outside it.
#[utoipa::path(
    get, path = "/api/reports/{name}/run", tag = "reports",
    security(("bearer" = [])),
    params(("name" = String, Path, description = "The report's declared name")),
    responses(
        (status = 200, description = "`{ report, columns, rows, rowCount, truncated, durationMs }`"),
        (status = 400, description = "The stored query is not a single read, or it failed"),
        (status = 404, description = "No report of that name"),
    ),
)]
pub async fn run(
    _auth: auth::JWT,
    Path(name): Path<String>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let row = sqlx::query(AssertSqlSafe(format!(
        "SELECT {DESCRIBE_COLUMNS}, sql_text FROM sys_report WHERE name = $1"
    )))
    .bind(&name)
    .fetch_optional(pool)
    .await
    .map_err(|err| AppError::Internal(anyhow::anyhow!("reading report: {err}")))?
    .ok_or_else(|| AppError::NotFound(format!("No report named \"{name}\".")))?;

    let sql_text: String = row.get("sql_text");
    assert_read_only(&sql_text)?;

    let started = Instant::now();
    // One more than the cap, so a full page can be told from a truncated one
    // without a second count(*) over the same query.
    let capped = format!(
        "SELECT * FROM ({}) AS report_body LIMIT {}",
        strip_trailing_semicolon(&sql_text),
        MAX_ROWS + 1
    );

    let mut result = sqlx::query(AssertSqlSafe(capped))
        .fetch_all(pool)
        .await
        // The query came from the model, so a failure here is a defect in the
        // document rather than in the request. Say which report and what the
        // database said — an author cannot fix "500 Internal Server Error".
        .map_err(|err| AppError::BadRequest(format!("Report \"{name}\" failed: {err}")))?;

    let truncated = i64::try_from(result.len()).unwrap_or(i64::MAX) > MAX_ROWS;
    if truncated {
        result.truncate(usize::try_from(MAX_ROWS).unwrap_or(usize::MAX));
    }

    // The driver's column list is in the order the report's SELECT declares,
    // which is the order it renders in. This used to be read off the first row's
    // JSON keys, and a `serde_json::Map` is sorted: every report came back with
    // its columns alphabetical, so crm's "source, leads, qualified, converted"
    // rendered as "converted, leads, qualified, source".
    let columns: Vec<String> = result
        .first()
        .map(|row| {
            row.columns()
                .iter()
                .map(|column| column.name().to_string())
                .collect()
        })
        .unwrap_or_default();

    let rows: Vec<Value> = result.iter().map(row_to_json).collect();
    let duration_ms = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);

    Ok(Json(json!({
        "report": describe(&row),
        "columns": columns,
        "rows": rows,
        "rowCount": rows.len(),
        "truncated": truncated,
        "durationMs": duration_ms,
    }))
    .into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("reports")
        .add("/", get(list))
        // `{name}/run` before `{name}`: a static segment declared after a
        // parameter on the same level is shadowed by it.
        .add("/{name}/run", get(run))
        .add("/{name}", get(show))
}
