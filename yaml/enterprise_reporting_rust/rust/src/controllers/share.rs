//! The last three kinds of Node server function with callers, as REST twins:
//!
//! - the public share pages' loaders (`src/routes/share/{report,chart,dashboard}/$id.tsx`):
//!   `GET /api/share/{kind}/{id}` → `{ data: row | null }`, no session needed,
//!   `is_public` rows only, named columns only;
//! - the dashboard's `getDashboardStatsFn` (`src/routes/_authed/dashboard.tsx`):
//!   `GET /api/dashboard/stats`;
//! - `POST /api/data-sources/upload` (`src/routes/api/data-sources/upload.ts`),
//!   which checks a file's name and stores nothing (P-19).
//!
//! Deliberate difference (MIGRATION_PLAN.md §9, D-37): the dashboard stats
//! need a session. Node's function has no check at all, so anyone who can
//! reach the server reads every table's row count and the latest audit-log
//! entries.
use axum::{
    extract::{multipart::MultipartRejection, Multipart, Path, State},
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::{AssertSqlSafe, PgPool};

use crate::{
    auth::CurrentSession,
    common::{db::pg_rows_to_json, db::pool, response},
};

/// The columns a share link may expose, per kind. A closed set: the table
/// name is never request input.
fn shareable(kind: &str) -> Option<(&'static str, &'static str)> {
    match kind {
        "report" => Some(("report_definitions", "id, name, description")),
        "dashboard" => Some(("dashboard_layouts", "id, name, description")),
        "chart" => Some(("chart_definitions", "id, name, description, chart_type")),
        _ => None,
    }
}

async fn shared(State(ctx): State<AppContext>, Path((kind, id)): Path<(String, String)>) -> Result<Response> {
    let Some((table, columns)) = shareable(&kind) else {
        return Ok(response::error_no_code(StatusCode::NOT_FOUND, "Not found"));
    };
    let rows = sqlx::query(AssertSqlSafe(format!(
        "SELECT {columns} FROM {table} WHERE id = $1 AND is_public = true LIMIT 1"
    )))
    .bind(&id)
    .fetch_all(pool(&ctx))
    .await
    .map_err(|e| Error::string(&e.to_string()))?;
    let row = pg_rows_to_json(&rows).into_iter().next().unwrap_or(Value::Null);
    Ok(response::raw(StatusCode::OK, &json!({ "data": row })))
}

async fn count(db: &PgPool, table: &'static str) -> i64 {
    sqlx::query_scalar::<_, i64>(AssertSqlSafe(format!("SELECT count(*) FROM {table}")))
        .fetch_one(db)
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, "Error counting {table}");
            0
        })
}

async fn stats(CurrentSession(session): CurrentSession, State(ctx): State<AppContext>) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let db = pool(&ctx);
    let (reports, charts, dashboards, queries, filters, data_sources, users, roles) = tokio::join!(
        count(db, "report_definitions"),
        count(db, "chart_definitions"),
        count(db, "dashboard_layouts"),
        count(db, "saved_queries"),
        count(db, "filter_definitions"),
        count(db, "data_sources"),
        count(db, "users"),
        count(db, "roles"),
    );
    let jobs: i64 =
        sqlx::query_scalar("SELECT count(*) FROM job_definitions WHERE schedule_cron IS NOT NULL")
            .fetch_one(db)
            .await
            .unwrap_or(0);
    let mut executions = sqlx::query(
        "SELECT id, status, started_at, completed_at, created_at, error_message FROM job_executions \
         ORDER BY created_at DESC LIMIT 30",
    )
    .fetch_all(db)
    .await
    .map(|r| pg_rows_to_json(&r))
    .unwrap_or_default();
    executions.reverse();
    let activity = sqlx::query(
        "SELECT id, action, resource_type, resource_id, created_at FROM audit_log ORDER BY created_at DESC LIMIT 6",
    )
    .fetch_all(db)
    .await
    .map(|r| pg_rows_to_json(&r))
    .unwrap_or_default();
    Ok(response::raw(
        StatusCode::OK,
        &json!({
            "reports": reports,
            "charts": charts,
            "dashboards": dashboards,
            "queries": queries,
            "filters": filters,
            "dataSources": data_sources,
            "users": users,
            "roles": roles,
            "jobs": jobs,
            "recentExecutions": executions,
            "recentActivity": activity,
        }),
    ))
}

/// `POST /api/data-sources/upload` (P-19: nothing is stored).
async fn upload(
    CurrentSession(session): CurrentSession,
    form: std::result::Result<Multipart, MultipartRejection>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let failed = || {
        response::error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "SERVER_ERROR",
            "Failed to upload data source",
        )
    };
    let Ok(mut form) = form else {
        return Ok(failed());
    };
    let mut name: Option<String> = None;
    loop {
        match form.next_field().await {
            Ok(Some(field)) => {
                if field.name() == Some("file") && name.is_none() {
                    name = Some(field.file_name().unwrap_or("blob").to_string());
                }
                if field.bytes().await.is_err() {
                    return Ok(failed());
                }
            }
            Ok(None) => break,
            Err(_) => return Ok(failed()),
        }
    }
    let Some(name) = name else {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "No file provided",
        ));
    };
    let lower = name.to_lowercase();
    if ![".db", ".sqlite", ".sqlite3"].iter().any(|e| lower.ends_with(e)) {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "Invalid file type. Please upload a SQLite database file (.db, .sqlite, .sqlite3)",
        ));
    }
    Ok(response::ok_with(
        StatusCode::CREATED,
        json!({
            "filename": name,
            "message": "File accepted. The database will be referenced by this name.",
        }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api")
        .add("/share/{kind}/{id}", get(shared))
        .add("/dashboard/stats", get(stats))
        .add("/data-sources/upload", post(upload))
}
