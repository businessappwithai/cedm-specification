//! `/api/notifications`.
//!
//! `GET /api/notifications` is the Node route, which returns an empty list
//! for everyone (MIGRATION_PLAN.md §9, P-6). The real reads and writes were
//! the `src/server-fns/notifications.ts` server functions; they are REST here
//! (`/inbox`, `/{id}/read`, `/read-all`, `DELETE /{id}`) with the server
//! functions' return shapes, so the forwarder in `src/lib/api/backend.ts`
//! passes them through unchanged. A server function answers 200 with
//! `success: false` rather than a 401, and so do these.
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{delete, get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        response,
    },
};

async fn legacy_list(CurrentSession(session): CurrentSession) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "success": true, "data": [] }),
    ))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct InboxQuery {
    include_read: Option<String>,
}

fn body(v: Value) -> Response {
    response::raw(StatusCode::OK, &v)
}

/// `fetchNotificationsFn({ includeRead })`: newest 50.
async fn inbox(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<InboxQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(body(
            json!({ "success": false, "data": [], "error": "Unauthorized" }),
        ));
    };
    let include_read = q.include_read.as_deref() == Some("true");
    let rows = sqlx::query(
        "SELECT * FROM notifications WHERE user_id = $1 AND ($2 OR is_read = false) ORDER BY created_at DESC LIMIT 50",
    )
    .bind(&session.user.id)
    .bind(include_read)
    .fetch_all(pool(&ctx))
    .await;
    Ok(match rows {
        Ok(r) => body(json!({ "success": true, "data": pg_rows_to_json(&r) })),
        Err(e) => body(json!({ "success": false, "data": [], "error": e.to_string() })),
    })
}

async fn mark_read(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(body(json!({ "success": false, "error": "Unauthorized" })));
    };
    let r = sqlx::query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2")
        .bind(&id)
        .bind(&session.user.id)
        .execute(pool(&ctx))
        .await;
    Ok(body(match r {
        Ok(_) => json!({ "success": true }),
        Err(e) => json!({ "success": false, "error": e.to_string() }),
    }))
}

async fn mark_all_read(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(body(json!({ "success": false, "error": "Unauthorized" })));
    };
    let r = sqlx::query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false")
        .bind(&session.user.id)
        .execute(pool(&ctx))
        .await;
    Ok(body(match r {
        Ok(_) => json!({ "success": true }),
        Err(e) => json!({ "success": false, "error": e.to_string() }),
    }))
}

async fn remove(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(body(json!({ "success": false, "error": "Unauthorized" })));
    };
    let r = sqlx::query("DELETE FROM notifications WHERE id = $1 AND user_id = $2")
        .bind(&id)
        .bind(&session.user.id)
        .execute(pool(&ctx))
        .await;
    Ok(body(match r {
        Ok(_) => json!({ "success": true }),
        Err(e) => json!({ "success": false, "error": e.to_string() }),
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/notifications")
        .add("/", get(legacy_list))
        .add("/inbox", get(inbox))
        .add("/read-all", post(mark_all_read))
        .add("/{id}/read", post(mark_read))
        .add("/{id}", delete(remove))
}
