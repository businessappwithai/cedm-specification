//! The hook registry: which handler runs on which entity, for each event.
//!
//! Generated wiring — rewritten on every run, so a hook added to the
//! model is always picked up. The handler bodies in `handlers/` are not
//! rewritten; see that module's header.
//!
//! A dispatch function with no arm for an entity is a no-op, which is what
//! makes it safe for the generic bus controller to call all of these
//! unconditionally on every request.

pub mod handlers;

use crate::errors::AppResult;
#[allow(unused_imports)]
use serde_json::{Map, Value};
#[allow(unused_imports)]
use std::collections::HashMap;
#[allow(unused_imports)]
use uuid::Uuid;

/// Normalise whatever spelling the caller used to the model's entity name.
///
/// `bus_compound`, `compound`, `Compound` and `chemical-inventory` all have
/// to reach the same handlers, or a hook would fire from one route and not
/// another.
fn key(entity: &str) -> String {
    let trimmed = entity.strip_prefix("bus_").unwrap_or(entity);
    trimmed
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_lowercase())
        .collect()
}

/// `beforeCreate` — Runs before the insert. Mutate `data` to change what is written.
pub async fn before_create(entity: &str, data: &mut Map<String, Value>) -> AppResult<()> {
    let _ = (entity, data);
    Ok(())
}

/// `afterCreate` — Runs after the insert, on the stored row. Side effects only.
pub async fn after_create(entity: &str, record: &Value) -> AppResult<()> {
    let _ = (entity, record);
    Ok(())
}

/// `beforeUpdate` — Runs before the update. Mutate `data` to change what is written.
pub async fn before_update(entity: &str, id: Uuid, data: &mut Map<String, Value>) -> AppResult<()> {
    let _ = (entity, id, data);
    Ok(())
}

/// `afterUpdate` — Runs after the update, on the stored row. Side effects only.
pub async fn after_update(entity: &str, record: &Value) -> AppResult<()> {
    let _ = (entity, record);
    Ok(())
}

/// `beforeDelete` — Runs before the delete. Return `Ok(false)` to block it.
pub async fn before_delete(entity: &str, id: Uuid) -> AppResult<bool> {
    let _ = (entity, id);
    Ok(true)
}

/// `afterDelete` — Runs after the delete, on the row as it was. Clean up related state.
pub async fn after_delete(entity: &str, record: &Value) -> AppResult<()> {
    let _ = (entity, record);
    Ok(())
}

/// `beforeRead` — Runs before a single record is fetched. Return an error to refuse.
pub async fn before_read(entity: &str, id: Uuid) -> AppResult<()> {
    let _ = (entity, id);
    Ok(())
}

/// `afterRead` — Runs after a single record is fetched. Mutate it to shape the response.
pub async fn after_read(entity: &str, record: &mut Value) -> AppResult<()> {
    let _ = (entity, record);
    Ok(())
}

/// `beforeQuery` — Runs before the list query. Mutate `params` to scope or filter it.
pub async fn before_query(entity: &str, params: &mut HashMap<String, String>) -> AppResult<()> {
    let _ = (entity, params);
    Ok(())
}

/// `afterQuery` — Runs on the rows the list query returned, before `afterList`.
pub async fn after_query(entity: &str, rows: &mut Vec<Value>) -> AppResult<()> {
    let _ = (entity, rows);
    Ok(())
}

/// `beforeList` — Runs before the list query, after `beforeQuery`. Return an error to refuse.
pub async fn before_list(entity: &str, params: &HashMap<String, String>) -> AppResult<()> {
    let _ = (entity, params);
    Ok(())
}

/// `afterList` — Runs on the page of rows about to be returned.
pub async fn after_list(entity: &str, rows: &mut Vec<Value>) -> AppResult<()> {
    let _ = (entity, rows);
    Ok(())
}

/// `customValidate` — Runs on create and on update. Return an `AppError::Validation` to refuse.
pub async fn custom_validate(entity: &str, data: &Map<String, Value>) -> AppResult<()> {
    let _ = (entity, data);
    Ok(())
}
