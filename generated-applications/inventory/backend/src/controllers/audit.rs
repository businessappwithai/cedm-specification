//! Audit trail queries and chain verification.

use axum::{
    extract::{Path, Query, State},
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde_json::json;
use sqlx::AssertSqlSafe;
use std::collections::HashMap;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::services::audit::AuditService;

/// `GET /api/audit` — most recent entries first, which is what /admin/audit renders.
///
/// Every filter the audit screen offers is bound as a parameter, and the
/// response is the `{ data, meta }` envelope that screen's pagination reads —
/// it computes its page count from `meta.total` and `meta.limit`, so a bare
/// array leaves it stuck on one page.
#[utoipa::path(
    get, path = "/api/audit", tag = "audit",
    security(("bearer" = [])),
    params(
        ("limit" = Option<i64>, Query, description = "Page size, clamped to 1..=1000 (default 100)"),
        ("page" = Option<i64>, Query, description = "1-based page number"),
        ("offset" = Option<i64>, Query, description = "Row offset; overrides `page` when given"),
        ("entity_type" = Option<String>, Query, description = "Filter to one table, e.g. `bus_compound`"),
        ("entity_id" = Option<String>, Query, description = "Filter to one record"),
        ("action" = Option<String>, Query, description = "`create`, `update` or `delete`"),
        ("user_email" = Option<String>, Query, description = "Filter to one actor"),
        ("source" = Option<String>, Query, description = "Originating subsystem"),
        ("success" = Option<bool>, Query, description = "Only successful or only failed writes"),
        ("search" = Option<String>, Query, description = "Case-insensitive match across entity, actor and action"),
        ("from" = Option<String>, Query, description = "Inclusive lower bound; RFC 3339 or `YYYY-MM-DD`"),
        ("to" = Option<String>, Query, description = "Inclusive upper bound; RFC 3339 or `YYYY-MM-DD`"),
    ),
    responses((status = 200, description = "`{ data, meta }` — entries newest first")),
)]
pub async fn list(
    _auth: auth::JWT,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let limit: i64 = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(100)
        .clamp(1, 1000);
    let page: i64 = params
        .get("page")
        .and_then(|v| v.parse().ok())
        .unwrap_or(1)
        .max(1);
    let offset: i64 = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or((page - 1) * limit)
        .max(0);

    let pool = ctx.db.get_postgres_connection_pool();

    let entity_type = params
        .get("entity_type")
        .or_else(|| params.get("entityType"))
        .filter(|v| !v.is_empty());
    let entity_id = params.get("entity_id").filter(|v| !v.is_empty());
    let action = params.get("action").filter(|v| !v.is_empty());
    let user_email = params.get("user_email").filter(|v| !v.is_empty());
    let source = params.get("source").filter(|v| !v.is_empty());
    let success = params
        .get("success")
        .filter(|v| !v.is_empty())
        .and_then(|v| v.parse::<bool>().ok());
    let search = params
        .get("search")
        .filter(|v| !v.is_empty())
        .map(|v| format!("%{v}%"));
    let from = timestamp(params.get("from"));
    let to = timestamp(params.get("to"));

    // One predicate list, applied to both the page and the count, so the
    // footer's "N of M" cannot disagree with the rows above it.
    const PREDICATES: &str = r"
           WHERE ($1::text        IS NULL OR entity_type = $1)
             AND ($2::text        IS NULL OR entity_id   = $2)
             AND ($3::text        IS NULL OR action      = $3)
             AND ($4::text        IS NULL OR user_email  = $4)
             AND ($5::text        IS NULL OR source      = $5)
             AND ($6::bool        IS NULL OR success     = $6)
             AND ($7::timestamptz IS NULL OR timestamp  >= $7)
             AND ($8::timestamptz IS NULL OR timestamp  <= $8)
             AND ($9::text        IS NULL OR entity_type ILIKE $9
                                          OR entity_id   ILIKE $9
                                          OR user_email  ILIKE $9
                                          OR user_name   ILIKE $9
                                          OR action      ILIKE $9)";

    let total: i64 = sqlx::query_scalar(AssertSqlSafe(format!(
        "SELECT COUNT(*) FROM audit_log{PREDICATES}"
    )))
    .bind(entity_type)
    .bind(entity_id)
    .bind(action)
    .bind(user_email)
    .bind(source)
    .bind(success)
    .bind(from)
    .bind(to)
    .bind(search.as_deref())
    .fetch_one(pool)
    .await?;

    let rows = sqlx::query(AssertSqlSafe(format!(
        "SELECT * FROM audit_log{PREDICATES} ORDER BY timestamp DESC LIMIT $10 OFFSET $11"
    )))
    .bind(entity_type)
    .bind(entity_id)
    .bind(action)
    .bind(user_email)
    .bind(source)
    .bind(success)
    .bind(from)
    .bind(to)
    .bind(search.as_deref())
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(Json(json!({
        "data": crate::services::row_json::rows_to_json(&rows),
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": if limit == 0 { 0 } else { (total + limit - 1) / limit },
        }
    }))
    .into_response())
}

/// `GET /api/audit/entity-types` — the distinct values, for the filter dropdown.
///
/// Read from the log rather than from `sys_table` on purpose: the useful list is
/// what has actually been written, not what could be.
#[utoipa::path(
    get, path = "/api/audit/entity-types", tag = "audit",
    security(("bearer" = [])),
    responses((status = 200, description = "The entity types present in the log, sorted")),
)]
pub async fn entity_types(_auth: auth::JWT, State(ctx): State<AppContext>) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let rows: Vec<(String,)> = sqlx::query_as(
        r"SELECT DISTINCT entity_type FROM audit_log
           WHERE entity_type IS NOT NULL AND entity_type <> ''
           ORDER BY entity_type",
    )
    .fetch_all(pool)
    .await?;

    let types: Vec<String> = rows.into_iter().map(|(t,)| t).collect();
    Ok(Json(types).into_response())
}

/// `GET /api/audit/{id}/verify` — recompute one entry's hash in place.
///
/// The chain-wide verify answers "has anything been tampered with"; this one
/// answers "is *this* row still what it was", which is the question the detail
/// dialog asks when an operator is looking at a single suspicious change.
#[utoipa::path(
    get, path = "/api/audit/{id}/verify", tag = "audit",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The audit entry's UUID")),
    responses(
        (status = 200, description = "Whether this entry still hashes to its stored value"),
        (status = 404, description = "No such entry"),
    ),
)]
pub async fn verify_entry(
    _auth: auth::JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let audit = ctx
        .shared_store
        .get::<AuditService>()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("audit service not initialised")))?;
    Ok(Json(audit.verify_entry(id).await?).into_response())
}

/// Parse a filter date, accepting both a full RFC3339 timestamp and the bare
/// `YYYY-MM-DD` a date input produces.
fn timestamp(raw: Option<&String>) -> Option<chrono::DateTime<chrono::Utc>> {
    let raw = raw.map(String::as_str).filter(|v| !v.is_empty())?;
    if let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(raw) {
        return Some(parsed.with_timezone(&chrono::Utc));
    }
    chrono::NaiveDate::parse_from_str(raw, "%Y-%m-%d")
        .ok()
        .and_then(|date| date.and_hms_opt(0, 0, 0))
        .map(|naive| chrono::DateTime::from_naive_utc_and_offset(naive, chrono::Utc))
}

/// `GET /api/audit/verify` — recompute the hash chain end to end.
///
/// This is the replacement for the immudb consistency proof (decision D4).
#[utoipa::path(
    get, path = "/api/audit/verify", tag = "audit",
    security(("bearer" = [])),
    responses((status = 200, description = "Chain verification result, and the first break if there is one")),
)]
pub async fn verify(_auth: auth::JWT, State(ctx): State<AppContext>) -> AppResult<Response> {
    let audit = ctx
        .shared_store
        .get::<AuditService>()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("audit service not initialised")))?;
    Ok(Json(audit.verify_chain().await?).into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("audit")
        .add("/", get(list))
        .add("/verify", get(verify))
        .add("/entity-types", get(entity_types))
        .add("/{id}/verify", get(verify_entry))
}
