//! One record's trail and its notes.
//!
//! Generated: 2026-10-01T16:41:37.832Z
//! Project: common
//!
//! Two things a person looking at a record wants that the CRUD routes cannot
//! give them: what has happened to it, and what colleagues have said about it.
//!
//! **Why not `/api/audit?entity_id=`.** The audit routes are the compliance
//! surface — the whole trail, every table, plus chain verification — and they
//! are administrator-only for good reason. "What happened to *this* invoice" is
//! an ordinary question for anyone who may read invoices, so it is gated on that
//! entity's own `read` rather than on being an administrator. Same rows, a
//! narrower question, a proportionate permission.
//!
//! **Why notes are not audit entries.** `audit_log` records what the system
//! observed and must not be editable; a note is somebody's sentence about the
//! same record. Putting them in one table would make the history writable,
//! which is the one thing an audit trail may not be. `sys_note` is append-only
//! — no update path, no delete path — because a note that can be quietly
//! rewritten is worth about as much as a conversation nobody remembers.

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
use crate::models::_entities::users;
use crate::services::authz;
use crate::services::dictionary::DictionaryCache;

/// Resolve the entity and check the caller may read it.
///
/// The dictionary resolves the name, so `/api/records/compound/…` and
/// `/api/records/bus_compound/…` both work and both land on the physical table
/// the guard is asked about — the same resolution `/api/bus/*` does, and the
/// reason there is no second copy of the pluralise-the-URL bypass class here.
async fn readable_table(
    ctx: &AppContext,
    dictionary: &DictionaryCache,
    user: &users::Model,
    entity: &str,
) -> AppResult<String> {
    let table = dictionary.resolve(entity).await?;
    let pool = ctx.db.get_postgres_connection_pool();
    let principal = authz::principal(pool, user).await?;
    authz::require_operation(pool, &principal, table.as_str(), authz::Operation::Read).await?;
    Ok(table.as_str().to_string())
}

/// `GET /api/records/{entity}/{id}/history` — the audit trail for one record.
#[utoipa::path(
    get, path = "/api/records/{entity}/{id}/history", tag = "records",
    security(("bearer" = [])),
    params(
        ("entity" = String, Path, description = "Dictionary table or entity name"),
        ("id" = String, Path, description = "Record id"),
        ("limit" = Option<i64>, Query, description = "Page size, clamped to 1..=500 (default 100)"),
    ),
    responses(
        (status = 200, description = "`{ data, meta }` — entries newest first"),
        (status = 403, description = "The caller may not read this entity"),
        (status = 404, description = "No such entity in the dictionary"),
    ),
)]
pub async fn history(
    auth: auth::JWTWithUser<users::Model>,
    Path((entity, id)): Path<(String, String)>,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
    SharedStore(dictionary): SharedStore<DictionaryCache>,
) -> AppResult<Response> {
    let table = readable_table(&ctx, &dictionary, &auth.user, &entity).await?;
    let limit = params
        .get("limit")
        .and_then(|value| value.parse::<i64>().ok())
        .unwrap_or(100)
        .clamp(1, 500);

    let pool = ctx.db.get_postgres_connection_pool();
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM audit_log WHERE entity_type = $1 AND entity_id = $2",
    )
    .bind(&table)
    .bind(&id)
    .fetch_one(pool)
    .await?;

    let rows = sqlx::query(
        r"SELECT * FROM audit_log
           WHERE entity_type = $1 AND entity_id = $2
           ORDER BY timestamp DESC
           LIMIT $3",
    )
    .bind(&table)
    .bind(&id)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(Json(json!({
        "data": crate::services::row_json::rows_to_json(&rows),
        "meta": { "total": total, "limit": limit, "entity": table, "recordId": id },
    }))
    .into_response())
}

/// `GET /api/records/{entity}/{id}/notes` — what people have said, newest first.
#[utoipa::path(
    get, path = "/api/records/{entity}/{id}/notes", tag = "records",
    security(("bearer" = [])),
    params(
        ("entity" = String, Path, description = "Dictionary table or entity name"),
        ("id" = String, Path, description = "Record id"),
    ),
    responses(
        (status = 200, description = "`[{ id, note, userName, userEmail, createdAt }]`"),
        (status = 403, description = "The caller may not read this entity"),
    ),
)]
pub async fn notes(
    auth: auth::JWTWithUser<users::Model>,
    Path((entity, id)): Path<(String, String)>,
    State(ctx): State<AppContext>,
    SharedStore(dictionary): SharedStore<DictionaryCache>,
) -> AppResult<Response> {
    let table = readable_table(&ctx, &dictionary, &auth.user, &entity).await?;

    let rows = sqlx::query(
        r"SELECT * FROM sys_note
           WHERE table_name = $1 AND record_id = $2
           ORDER BY created_at DESC",
    )
    .bind(&table)
    .bind(&id)
    .fetch_all(ctx.db.get_postgres_connection_pool())
    .await?;

    Ok(Json(crate::services::row_json::rows_to_json(&rows)).into_response())
}

/// `POST /api/records/{entity}/{id}/notes` — add one.
///
/// Reading the record is enough to comment on it. Requiring write access would
/// silence exactly the people worth hearing from — a reviewer who may look at a
/// batch record and not change it is the one with something to say about it.
#[utoipa::path(
    post, path = "/api/records/{entity}/{id}/notes", tag = "records",
    security(("bearer" = [])),
    params(
        ("entity" = String, Path, description = "Dictionary table or entity name"),
        ("id" = String, Path, description = "Record id"),
    ),
    request_body(content = serde_json::Value, description = "`{ \"note\": \"…\" }`"),
    responses(
        (status = 201, description = "The stored note"),
        (status = 400, description = "Empty or missing `note`"),
        (status = 403, description = "The caller may not read this entity"),
    ),
)]
pub async fn add_note(
    auth: auth::JWTWithUser<users::Model>,
    Path((entity, id)): Path<(String, String)>,
    State(ctx): State<AppContext>,
    SharedStore(dictionary): SharedStore<DictionaryCache>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let table = readable_table(&ctx, &dictionary, &auth.user, &entity).await?;

    let note = payload
        .get("note")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|note| !note.is_empty())
        .ok_or_else(|| AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec!["'note' is required".to_string()],
        })?;

    // The author is taken from the token, never from the body. A note whose
    // attribution the caller chooses is not attribution.
    let row = sqlx::query(
        r"INSERT INTO sys_note (
               sys_note_id, table_name, record_id, note, user_id, user_name, user_email, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
           RETURNING *",
    )
    .bind(&table)
    .bind(&id)
    .bind(note)
    .bind(auth.user.sys_user_id.map(|id| id.to_string()))
    .bind(&auth.user.name)
    .bind(&auth.user.email)
    .fetch_one(ctx.db.get_postgres_connection_pool())
    .await?;

    let stored = crate::services::row_json::rows_to_json(std::slice::from_ref(&row));
    Ok((
        StatusCode::CREATED,
        Json(stored.into_iter().next().unwrap_or(Value::Null)),
    )
        .into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("records")
        .add("/{entity}/{id}/history", get(history))
        .add("/{entity}/{id}/notes", get(notes))
        .add("/{entity}/{id}/notes", post(add_note))
}
