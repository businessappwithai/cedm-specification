//! `/api/jobs` — twin of `src/routes/api/jobs.ts`, `jobs/executions.ts` and
//! `jobs/status.ts`.
use std::collections::HashMap;

use axum::{
    body::Bytes,
    extract::{Query, State},
    http::StatusCode,
    response::Response,
    routing::get,
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Value};

use super::support::{list_page, parse_body};
use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        js,
        pagination::{js_parse_int, Page, PageQuery},
        response,
        time::now_iso,
    },
};

async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let page = Page::from_query(&q, 50, Some(1000));
    match list_page(
        pool(&ctx),
        "job_definitions",
        Some("is_deleted = false"),
        "created_at DESC",
        page,
    )
    .await
    {
        Ok((items, total)) => Ok(response::ok(json!({ "items": items, "meta": page.meta(total) }))),
        Err(e) => Ok(response::server_error(
            "Error fetching jobs",
            e,
            "SERVER_ERROR",
            "Failed to fetch jobs",
        )),
    }
}

/// `POST /api/jobs`.
async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let failed = || {
        response::error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "SERVER_ERROR",
            "Failed to create job",
        )
    };
    let Some(body) = parse_body(&body) else {
        return Ok(failed());
    };
    if !js::truthy(body.get("name")) || !js::truthy(body.get("target_id")) {
        return Ok(response::error(
            StatusCode::BAD_REQUEST,
            "INVALID_INPUT",
            "Name and target ID are required",
        ));
    }
    // Destructuring defaults apply to `undefined` only: an explicit null
    // job_type reaches the NOT NULL column and fails, as in Node.
    let job_type = match body.get("job_type") {
        None => Some("report".to_string()),
        Some(v) => js::text(v),
    };
    let is_active = match body.get("is_active") {
        None => Some(true),
        Some(Value::Null) => None,
        Some(v) => Some(v.as_bool().unwrap_or_else(|| js::truthy(Some(v)))),
    };
    let json_or_null = |k: &str| js::truthy(body.get(k)).then(|| js::stringify(&body[k]));
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let inserted = sqlx::query(
        "INSERT INTO job_definitions (id, name, job_type, target_id, schedule_cron, parameters, notification_config, \
           is_active, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NULL, NULL, $9, $10, $10)",
    )
    .bind(&id)
    .bind(body.get("name").and_then(js::text))
    .bind(job_type)
    .bind(body.get("target_id").and_then(js::text))
    .bind(body.get("schedule_cron").and_then(js::text))
    .bind(json_or_null("parameters"))
    .bind(json_or_null("notification_config"))
    .bind(is_active)
    .bind(&session.user.id)
    .bind(&now)
    .execute(pool(&ctx))
    .await;
    match inserted {
        Ok(_) => Ok(response::ok_with(StatusCode::CREATED, json!({ "id": id }))),
        Err(e) => {
            tracing::error!(error = %e, "Error creating job");
            Ok(failed())
        }
    }
}

#[derive(Debug, Deserialize)]
struct ExecQuery {
    limit: Option<String>,
}

/// `GET /api/jobs/executions` — the latest `limit` (default 20, at most 100).
async fn executions(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<ExecQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let failed = || {
        response::error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "SERVER_ERROR",
            "Failed to fetch job executions",
        )
    };
    // `Math.min(parseInt(limit || "20"), 100)`: NaN or a negative limit is
    // a database error in Node, and the same generic 500 here.
    let raw = q.limit.filter(|s| !s.is_empty()).unwrap_or_else(|| "20".into());
    let Some(limit) = js_parse_int(&raw).map(|n| n.min(100)).filter(|n| *n >= 0) else {
        return Ok(failed());
    };
    match sqlx::query("SELECT * FROM job_executions ORDER BY created_at DESC LIMIT $1")
        .bind(limit)
        .fetch_all(pool(&ctx))
        .await
    {
        Ok(rows) => Ok(response::ok(json!({ "items": pg_rows_to_json(&rows) }))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching job executions");
            Ok(failed())
        }
    }
}

/// `GET /api/jobs/status` — execution counts in the old BullMQ vocabulary.
async fn status(CurrentSession(session): CurrentSession, State(ctx): State<AppContext>) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let counts: Vec<(String, i64)> =
        match sqlx::query_as("SELECT status, COUNT(id) FROM job_executions GROUP BY status")
            .fetch_all(pool(&ctx))
            .await
        {
            Ok(r) => r,
            Err(e) => {
                tracing::error!(error = %e, "Error fetching job status");
                return Ok(response::error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "SERVER_ERROR",
                    "Failed to fetch job status",
                ));
            }
        };
    let m: HashMap<String, i64> = counts.into_iter().collect();
    let n = |k: &str| m.get(k).copied().unwrap_or(0);
    Ok(response::ok(json!({
        "waiting": n("pending"),
        "active": n("running"),
        "completed": n("completed"),
        "failed": n("failed"),
        "delayed": n("cancelled"),
    })))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/jobs")
        .add("/", get(list).post(create))
        .add("/executions", get(executions))
        .add("/status", get(status))
}
