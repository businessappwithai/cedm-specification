//! Background jobs — enqueue one, see what the queue holds, cancel a kind.
//!
//! Generated: 2026-10-09T08:32:48.564Z
//! Project: retail
//!
//! `app.rs` has always registered three workers — email, report, sync — and
//! there was no way to enqueue any of them and no way to see whether one ran.
//! Three workers nobody can reach is a dangling half-feature: the code is
//! carried, compiled and connected, and does nothing.
//!
//! **What the queue can answer depends on the mode**, and this says so rather
//! than pretending otherwise. `config/*.yaml` sets `workers.mode`:
//!
//! * `BackgroundQueue` — Loco's Postgres queue. Jobs are rows in
//!   `pg_loco_queue`, so listing and cancelling mean something. Production.
//! * `BackgroundAsync` — the job is spawned in-process. It runs, but nothing
//!   records it, so there is nothing to list. Development.
//! * `ForegroundBlocking` — the job runs inline before the response. Tests.
//!
//! Enqueueing works in all three; listing reports `queueBacked: false` in the
//! other two rather than an empty list that looks like "nothing ran".

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::errors::{AppError, AppResult};
use crate::workers::{
    email::{EmailArgs, EmailWorker},
    report::{ReportArgs, ReportWorker},
    sync::{SyncArgs, SyncWorker},
};

/// The worker kinds this backend registers, as the URL spells them.
const KINDS: [&str; 3] = ["email", "report", "sync"];

/// `POST /api/jobs/{kind}` — enqueue one job.
///
/// The body is the worker's own argument struct. It is deserialised into that
/// struct rather than passed through as JSON, so a payload missing a field the
/// worker needs is refused here — where the caller sees it — instead of at the
/// far end of a queue, where a deserialisation failure is a log line.
#[utoipa::path(
    post, path = "/api/jobs/{kind}", tag = "jobs",
    security(("bearer" = [])),
    params(("kind" = String, Path, description = "`email`, `report` or `sync`")),
    request_body(content = serde_json::Value, description = "The worker's arguments"),
    responses(
        (status = 202, description = "`{ id, kind, mode }` — accepted for processing"),
        (status = 400, description = "Unknown kind, or arguments the worker cannot use"),
    ),
)]
pub async fn enqueue(
    _auth: auth::JWT,
    Path(kind): Path<String>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let bad_args = |err: serde_json::Error| AppError::Validation {
        message: "Validation failed".to_string(),
        errors: vec![format!("{kind} job arguments: {err}")],
    };

    let id = match kind.as_str() {
        "email" => {
            let args: EmailArgs = serde_json::from_value(payload).map_err(bad_args)?;
            EmailWorker::perform_later(&ctx, args).await
        }
        "report" => {
            let args: ReportArgs = serde_json::from_value(payload).map_err(bad_args)?;
            ReportWorker::perform_later(&ctx, args).await
        }
        "sync" => {
            let args: SyncArgs = serde_json::from_value(payload).map_err(bad_args)?;
            SyncWorker::perform_later(&ctx, args).await
        }
        other => {
            return Err(AppError::BadRequest(format!(
                "unknown job kind '{other}'; this backend registers: {}",
                KINDS.join(", ")
            )))
        }
    }
    .map_err(|err| AppError::Internal(anyhow::anyhow!("enqueueing {kind}: {err}")))?;

    // 202, not 201: in queue mode nothing has happened yet, and saying
    // "created" about work that has not run is the kind of small lie that
    // makes a client stop polling.
    Ok((
        StatusCode::ACCEPTED,
        Json(json!({ "id": id, "kind": kind, "mode": worker_mode(&ctx) })),
    )
        .into_response())
}

/// `GET /api/jobs?status=&limit=` — what the queue holds.
#[utoipa::path(
    get, path = "/api/jobs", tag = "jobs",
    security(("bearer" = [])),
    params(
        ("status" = Option<String>, Query, description = "`queued`, `processing`, `completed`, `failed` or `cancelled`"),
        ("limit" = Option<i64>, Query, description = "Page size, clamped to 1..=500 (default 100)"),
    ),
    responses((status = 200, description = "`{ data, meta }`; `meta.queueBacked` is false when the mode keeps no record")),
)]
pub async fn list(
    _auth: auth::JWT,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let limit = params
        .get("limit")
        .and_then(|value| value.parse::<i64>().ok())
        .unwrap_or(100)
        .clamp(1, 500);
    let status = params.get("status").filter(|value| !value.is_empty());

    // Loco's Postgres queue owns this table. Reading it directly rather than
    // through `Queue::dump`, which writes a file — a listing endpoint should
    // not touch the filesystem to answer a question the database already has.
    let rows = sqlx::query(
        r"SELECT id, name, status, run_at, created_at, updated_at, task_data
            FROM pg_loco_queue
           WHERE ($1::text IS NULL OR status = $1)
           ORDER BY created_at DESC
           LIMIT $2",
    )
    .bind(status)
    .bind(limit)
    .fetch_all(ctx.db.get_postgres_connection_pool())
    .await;

    // The table exists only under `BackgroundQueue`. Its absence is not an
    // error — it is the honest answer "this mode keeps no record", and an empty
    // list without that flag would read as "nothing has run".
    let (data, queue_backed) = match rows {
        Ok(rows) => (crate::services::row_json::rows_to_json(&rows), true),
        Err(_) => (Vec::new(), false),
    };

    Ok(Json(json!({
        "data": data,
        "meta": {
            "queueBacked": queue_backed,
            "mode": worker_mode(&ctx),
            "limit": limit,
            "kinds": KINDS,
        },
    }))
    .into_response())
}

/// `POST /api/jobs/{kind}/cancel` — cancel the queued jobs of one kind.
///
/// By kind, not by id, because that is what Loco's queue offers
/// (`Queue::cancel_jobs` takes a job *name*). Pretending to cancel one job by
/// giving the route an id it then ignored would be worse than the honest shape.
#[utoipa::path(
    post, path = "/api/jobs/{kind}/cancel", tag = "jobs",
    security(("bearer" = [])),
    params(("kind" = String, Path, description = "`email`, `report` or `sync`")),
    responses(
        (status = 200, description = "`{ cancelled: <kind> }`"),
        (status = 400, description = "Unknown kind"),
        (status = 503, description = "This worker mode has no queue to cancel from"),
    ),
)]
pub async fn cancel(
    _auth: auth::JWT,
    Path(kind): Path<String>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    if !KINDS.contains(&kind.as_str()) {
        return Err(AppError::BadRequest(format!(
            "unknown job kind '{kind}'; this backend registers: {}",
            KINDS.join(", ")
        )));
    }

    let Some(queue) = ctx.queue_provider.as_ref() else {
        return Err(AppError::ServiceUnavailable(format!(
            "worker mode is {} — there is no queue to cancel from. Set workers.mode to \
             BackgroundQueue in config/*.yaml.",
            worker_mode(&ctx)
        )));
    };

    // Loco names a job after its worker type, not after the URL segment.
    let job_name = match kind.as_str() {
        "email" => "EmailWorker",
        "report" => "ReportWorker",
        _ => "SyncWorker",
    };
    queue
        .cancel_jobs(job_name)
        .await
        .map_err(|err| AppError::Internal(anyhow::anyhow!("cancelling {kind} jobs: {err}")))?;

    Ok(Json(json!({ "cancelled": kind, "jobName": job_name })).into_response())
}

/// The configured worker mode, as a string the client can show.
fn worker_mode(ctx: &AppContext) -> String {
    format!("{:?}", ctx.config.workers.mode)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("jobs")
        .add("/", get(list))
        // Static-looking segments are all worker kinds, so there is no
        // ambiguity to order around — but cancel is added first anyway, since
        // `/{kind}/cancel` and `/{kind}` are different arities.
        .add("/{kind}/cancel", post(cancel))
        .add("/{kind}", post(enqueue))
}
