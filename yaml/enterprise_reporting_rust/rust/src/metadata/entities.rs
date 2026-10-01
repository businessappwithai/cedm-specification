//! `EntityService.list` / `getById` (`src/lib/metadata/entity-service.ts`).
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::common::db::pg_rows_to_json;

/// Entities of a data source, `entity_name ASC`, paged (1-based `page`).
/// Without `include_hidden`, only active and not hidden ones.
///
/// # Errors
/// On a database error.
pub async fn list(
    pool: &PgPool,
    data_source_id: &str,
    include_hidden: bool,
    page: i64,
    limit: i64,
) -> Result<(Vec<Value>, i64), sqlx::Error> {
    let filter = if include_hidden {
        "data_source_id = $1"
    } else {
        "data_source_id = $1 AND is_active = true AND is_hidden = false"
    };
    let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
        "SELECT * FROM metadata_entity_header WHERE {filter} ORDER BY entity_name ASC LIMIT $2 OFFSET $3"
    )))
    .bind(data_source_id)
    .bind(limit)
    .bind((page - 1) * limit)
    .fetch_all(pool)
    .await?;
    let total: i64 = sqlx::query_scalar(sqlx::AssertSqlSafe(format!(
        "SELECT count(*) FROM metadata_entity_header WHERE {filter}"
    )))
    .bind(data_source_id)
    .fetch_one(pool)
    .await?;
    Ok((pg_rows_to_json(&rows), total))
}

/// The fields of an entity, `display_order ASC`.
///
/// # Errors
/// On a database error.
pub async fn fields(pool: &PgPool, entity_id: &str) -> Result<Vec<Value>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT * FROM metadata_entity_field WHERE entity_header_id = $1 ORDER BY display_order ASC",
    )
    .bind(entity_id)
    .fetch_all(pool)
    .await?;
    Ok(pg_rows_to_json(&rows))
}

/// The entity with its `fields`, or `None`.
///
/// # Errors
/// On a database error.
pub async fn get_by_id(pool: &PgPool, id: &str) -> Result<Option<Value>, sqlx::Error> {
    let Some(mut entity) =
        crate::controllers::support::find_by_id(pool, "metadata_entity_header", id).await?
    else {
        return Ok(None);
    };
    let f = fields(pool, id).await?;
    if let Some(o) = entity.as_object_mut() {
        o.insert("fields".into(), json!(f));
    }
    Ok(Some(entity))
}
