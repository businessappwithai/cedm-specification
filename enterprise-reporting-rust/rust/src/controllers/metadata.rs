//! `/api/metadata/entities` — twin of `src/routes/api/metadata/**` and
//! `EntityService` (`src/lib/metadata/entity-service.ts`).
//!
//! These routes use the bare `{ error: { message } }` envelope. Writes need a
//! metadata permission here (D-19); Node checks only for a session.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, post, put},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use super::support::parse_body;
use crate::{
    auth::{CurrentSession, Session},
    common::{db::pg_row_to_json, db::pool, js, response, time::now_iso},
    metadata::entities,
    permissions::has_permission,
    security::audit::{log_audit, AuditEntry},
};

fn err(status: StatusCode, message: &str) -> Response {
    response::raw(status, &json!({ "error": { "message": message } }))
}

fn unauthorized() -> Response {
    err(StatusCode::UNAUTHORIZED, "Unauthorized")
}

fn internal(e: &sqlx::Error) -> Response {
    tracing::error!(error = %e, "metadata route error");
    err(
        StatusCode::INTERNAL_SERVER_ERROR,
        &crate::datasources::db_error_message(e),
    )
}

/// D-19: `MetadataPermissions.canEdit` / `canAdmin`, which Node defines and
/// never calls from these routes.
fn allowed(session: &Session, action: &str) -> Option<Response> {
    let u = &session.user;
    let ok = has_permission(&u.permissions, &u.roles, "metadata_entity", action)
        || (action == "edit" && has_permission(&u.permissions, &u.roles, "metadata_entity", "admin"));
    (!ok).then(|| {
        err(
            StatusCode::FORBIDDEN,
            &format!("No {action} permission on metadata_entity"),
        )
    })
}

/// One `SET col = CAST($n AS type)` per present key, plus `updated_at`, and
/// the row back — Kysely's `.set({...}).returningAll()` with undefined keys
/// skipped.
async fn update_returning(
    db: &PgPool,
    table: &'static str,
    columns: &[(&'static str, &'static str)],
    input: &Value,
    where_sql: &'static str,
    keys: &[&str],
) -> Result<Option<Value>, sqlx::Error> {
    let present: Vec<(&str, &str, &Value)> = columns
        .iter()
        .filter_map(|(c, ty)| input.get(*c).map(|v| (*c, *ty, v)))
        .collect();
    let base = keys.len();
    let mut sql = format!("UPDATE {table} SET updated_at = ${}", base + 1);
    for (i, (c, ty, _)) in present.iter().enumerate() {
        sql.push_str(&format!(", {c} = CAST(${} AS {ty})", base + 2 + i));
    }
    sql.push_str(&format!(" WHERE {where_sql} RETURNING *"));
    let mut q = sqlx::query(sqlx::AssertSqlSafe(sql));
    for k in keys {
        q = q.bind(*k);
    }
    q = q.bind(now_iso());
    for (_, _, v) in &present {
        q = q.bind(js::text(v));
    }
    Ok(q.fetch_optional(db).await?.as_ref().map(pg_row_to_json))
}

const FIELD_COLUMNS: &[(&str, &str)] = &[
    ("description", "text"),
    ("is_display_field", "boolean"),
    ("is_searchable", "boolean"),
    ("display_order", "integer"),
    ("relationship_ui_type", "varchar"),
];

#[derive(Debug, Deserialize)]
struct ListQuery {
    data_source_id: Option<String>,
    include_hidden: Option<String>,
}

/// `GET /api/metadata/entities?data_source_id=` — first 50, as Node's
/// `EntityService.list` default.
async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<ListQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let Some(ds) = q.data_source_id.filter(|s| !s.is_empty()) else {
        return Ok(err(StatusCode::BAD_REQUEST, "data_source_id is required"));
    };
    let include_hidden = q.include_hidden.as_deref() == Some("true");
    match entities::list(pool(&ctx), &ds, include_hidden, 1, 50).await {
        Ok((list, total)) => Ok(response::raw(
            StatusCode::OK,
            &json!({ "data": { "entities": list, "total": total } }),
        )),
        Err(e) => Ok(internal(&e)),
    }
}

/// `GET /api/metadata/entities/{id}`.
async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    match entities::get_by_id(pool(&ctx), &id).await {
        Ok(Some(e)) => Ok(response::ok(e)),
        Ok(None) => Ok(err(StatusCode::NOT_FOUND, "Entity not found")),
        Err(e) => Ok(internal(&e)),
    }
}

async fn audit(db: &PgPool, user: &str, action: &str, id: &str, details: Value) -> Result<(), sqlx::Error> {
    log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type: "metadata_entity",
            resource_id: Some(id),
            details: Some(details),
            ..Default::default()
        },
    )
    .await
}

/// `PUT /api/metadata/entities/{id}` — description, `is_active`, `is_hidden`.
async fn update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    if let Some(r) = allowed(&session, "edit") {
        return Ok(r);
    }
    let Some(body) = parse_body(&body) else {
        return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"));
    };
    let db = pool(&ctx);
    let cols = &[
        ("description", "text"),
        ("is_active", "boolean"),
        ("is_hidden", "boolean"),
    ];
    match update_returning(db, "metadata_entity_header", cols, &body, "id = $1", &[&id]).await {
        Ok(Some(row)) => {
            // Node audits `Object.keys({ description, is_active, is_hidden })`:
            // all three, whichever were sent.
            let details = json!({ "updated_fields": ["description", "is_active", "is_hidden"] });
            if let Err(e) = audit(db, &session.user.id, "update", &id, details).await {
                return Ok(internal(&e));
            }
            Ok(response::ok(row))
        }
        Ok(None) => Ok(err(StatusCode::NOT_FOUND, "Entity not found")),
        Err(e) => Ok(internal(&e)),
    }
}

/// `DELETE /api/metadata/entities/{id}`. The fields stay, as in Node — the
/// table has no cascade (MIGRATION_PLAN.md §9, P-9).
async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    if let Some(r) = allowed(&session, "admin") {
        return Ok(r);
    }
    let db = pool(&ctx);
    match sqlx::query("DELETE FROM metadata_entity_header WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            if let Err(e) = audit(
                db,
                &session.user.id,
                "delete",
                &id,
                json!({ "deleted": "entity_metadata" }),
            )
            .await
            {
                return Ok(internal(&e));
            }
            Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
        }
        Ok(_) => Ok(err(StatusCode::NOT_FOUND, "Entity not found")),
        Err(e) => Ok(internal(&e)),
    }
}

/// `GET /api/metadata/entities/{id}/fields`.
async fn fields(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    match entities::fields(pool(&ctx), &id).await {
        Ok(f) => Ok(response::ok(json!(f))),
        Err(e) => Ok(internal(&e)),
    }
}

/// `PUT /api/metadata/entities/{id}/fields/{fieldId}`.
async fn update_field(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path((id, field_id)): Path<(String, String)>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    if let Some(r) = allowed(&session, "edit") {
        return Ok(r);
    }
    let Some(body) = parse_body(&body) else {
        return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"));
    };
    match update_returning(
        pool(&ctx),
        "metadata_entity_field",
        FIELD_COLUMNS,
        &body,
        "id = $1 AND entity_header_id = $2",
        &[&field_id, &id],
    )
    .await
    {
        Ok(Some(row)) => Ok(response::ok(row)),
        Ok(None) => Ok(err(StatusCode::NOT_FOUND, "Field not found")),
        Err(e) => Ok(internal(&e)),
    }
}

/// `POST /api/metadata/entities/{id}/fields/batch`. Each update may be flat
/// (`{ id, description, … }`, what Node reads) or nested (`{ id, data: {…} }`,
/// what Node's own type declares and one caller sends) — D-20.
async fn batch(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    if let Some(r) = allowed(&session, "edit") {
        return Ok(r);
    }
    let Some(body) = parse_body(&body) else {
        return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"));
    };
    let updates = match body.get("updates") {
        Some(Value::Array(a)) if !a.is_empty() => a.clone(),
        _ => return Ok(err(StatusCode::BAD_REQUEST, "updates array is required")),
    };
    let db = pool(&ctx);
    let mut results = Vec::new();
    for u in &updates {
        let field_id = u.get("id").and_then(js::text).unwrap_or_default();
        let input = u.get("data").filter(|d| d.is_object()).unwrap_or(u);
        match update_returning(
            db,
            "metadata_entity_field",
            FIELD_COLUMNS,
            input,
            "id = $1 AND entity_header_id = $2",
            &[&field_id, &id],
        )
        .await
        {
            Ok(Some(row)) => results.push(row),
            Ok(None) => {}
            Err(e) => return Ok(internal(&e)),
        }
    }
    Ok(response::ok(json!(results)))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/metadata/entities")
        .add("/", get(list))
        .add("/{id}", get(show).put(update).delete(destroy))
        .add("/{id}/fields", get(fields))
        .add("/{id}/fields/batch", post(batch))
        .add("/{id}/fields/{fieldId}", put(update_field))
}
