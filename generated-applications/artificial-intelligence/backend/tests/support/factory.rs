//! Payload construction.
//!
//! Builds a create payload the API will accept for any entity in the registry,
//! including resolving the parent rows its foreign keys need. This is what lets
//! one generic CRUD suite cover every entity in the model.
//!
//! Values are readable and ordered within a run — a monotonic counter, not
//! randomness — and carry a per-run token so they never collide with the rows
//! an earlier run left behind.
//!
//! Generated: 2026-10-01T09:30:58.992Z
//! Project: artificial-intelligence

#![allow(dead_code)]

use serde_json::{json, Map, Value};
use std::collections::HashSet;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;

use loco_rs::TestServer;

use super::bearer;
use super::entities::{parent_of, EntityMeta, FieldMeta, FieldType};

static COUNTER: AtomicU64 = AtomicU64::new(0);
static RUN: OnceLock<(String, u64)> = OnceLock::new();

/// A value nothing else in the run will produce.
fn unique() -> u64 {
    COUNTER.fetch_add(1, Ordering::Relaxed)
}

/// A token and numeric offset unique to this test *run*.
///
/// The counter alone is not enough. It restarts at zero in every process while
/// the test database keeps the rows from the run before, so the second run of a
/// suite reproduces the first run's values exactly and every uniquely
/// constrained column answers 409 — which surfaces as "could not create the
/// record", nowhere near the factory that caused it. The run token is what
/// makes a suite re-runnable against a database it has already written to.
fn run() -> &'static (String, u64) {
    RUN.get_or_init(|| {
        let raw = uuid::Uuid::new_v4();
        let token = raw.simple().to_string()[..8].to_string();
        // Kept under eight digits so it still fits a `numeric(10,2)`, which is
        // what a model that says "decimal" usually becomes. Uniqueness within a
        // run comes from the counter; the offset only has to move each run into
        // a different part of the range.
        let offset = (raw.as_u128() as u64) % 100_000 * 100;
        (token, offset)
    })
}

/// A value for one field, shaped by its type.
///
/// Types are not cosmetic here: the backend binds `Date` and `DateTime`
/// columns as real temporal values, and Postgres rejects text for those — so a
/// factory that sent strings everywhere would fail on any entity with a date.
pub fn value_for(field: &FieldMeta) -> Value {
    let (token, offset) = run();
    let n = unique() + offset;
    match field.field_type {
        FieldType::Integer => json!(i64::try_from(n).unwrap_or(1) + 1),
        FieldType::Decimal => json!(n as f64 + 0.5),
        FieldType::Boolean => json!(n.is_multiple_of(2)),
        FieldType::Date => json!("2026-06-01"),
        FieldType::DateTime => json!("2026-06-01T09:30:00Z"),
        FieldType::Json => json!({ "generated": n }),
        // A reference with no resolved parent still has to be a UUID or the
        // API rejects the shape before it ever checks the row exists.
        FieldType::Reference => json!("00000000-0000-4000-8000-000000000000"),
        FieldType::String | FieldType::Text => json!(format!("e2e-{}-{token}-{n}", field.name)),
    }
}

/// A create payload with every required field populated and no foreign keys.
///
/// Useful on its own only for entities with no mandatory parents; everything
/// else wants [`create_with_parents`].
pub fn build_record(entity: &EntityMeta) -> Map<String, Value> {
    let mut payload = Map::new();
    for field in entity.writable_fields() {
        if field.field_type == FieldType::Reference {
            continue;
        }
        payload.insert(field.name.to_string(), value_for(field));
    }
    payload
}

/// A payload that omits one required field, for the "does it reject this?" case.
///
/// Returns `None` when the entity has no required scalar to withhold — there is
/// nothing to assert, and inventing a case would test the factory rather than
/// the API.
pub fn build_invalid_record(entity: &EntityMeta) -> Option<Map<String, Value>> {
    let omitted = entity
        .required_fields()
        .find(|f| f.field_type != FieldType::Reference)?;

    let mut payload = build_record(entity);
    payload.remove(omitted.name);
    Some(payload)
}

/// Create a record, first creating whatever parents its foreign keys need.
///
/// Recursion terminates on cycles — an entity whose parent chain leads back to
/// itself — detected by the set of routes already on the stack. A plain depth
/// limit would look equivalent and is not: the chain a model needs is as long
/// as its deepest foreign-key path, and a fixed cap truncates legitimate ones
/// on an empty database, leaving a mandatory FK unset and failing the create
/// with a validation error about a record that was never malformed.
pub async fn create_with_parents(
    request: &TestServer,
    token: &str,
    entity: &EntityMeta,
    overrides: &[(&str, Value)],
) -> Option<Value> {
    let mut in_flight: HashSet<&'static str> = HashSet::new();
    create_tracked(request, token, entity, overrides, &mut in_flight).await
}

async fn create_tracked(
    request: &TestServer,
    token: &str,
    entity: &EntityMeta,
    overrides: &[(&str, Value)],
    in_flight: &mut HashSet<&'static str>,
) -> Option<Value> {
    if !in_flight.insert(entity.route) {
        return None;
    }
    let created = create_inner(request, token, entity, overrides, in_flight).await;
    in_flight.remove(entity.route);
    created
}

async fn create_inner(
    request: &TestServer,
    token: &str,
    entity: &EntityMeta,
    overrides: &[(&str, Value)],
    in_flight: &mut HashSet<&'static str>,
) -> Option<Value> {
    let mut payload = build_record(entity);

    for fk in entity.foreign_keys() {
        let Some(parent) = parent_of(fk) else {
            continue;
        };
        if let Some(id) = any_record_id(request, token, parent, in_flight).await {
            payload.insert(fk.name.to_string(), json!(id));
        }
    }

    for (key, value) in overrides {
        payload.insert((*key).to_string(), value.clone());
    }

    let response = request
        .post(&format!("/api/bus/{}", entity.route))
        .add_header("authorization", bearer(token))
        .json(&Value::Object(payload.clone()))
        .await;

    if response.status_code() == 201 {
        return Some(response.json::<Value>());
    }

    // Some models reject an optional combination the factory invented. Retry
    // with only what the entity actually requires before giving up — the same
    // fallback the TypeScript harness used.
    let mut minimal: Map<String, Value> = payload
        .iter()
        .filter(|(key, _)| {
            entity.writable_fields().any(|f| {
                f.name == key.as_str() && (f.required || f.field_type == FieldType::Reference)
            })
        })
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    for (key, value) in overrides {
        minimal.insert((*key).to_string(), value.clone());
    }

    let retry = request
        .post(&format!("/api/bus/{}", entity.route))
        .add_header("authorization", bearer(token))
        .json(&Value::Object(minimal))
        .await;

    (retry.status_code() == 201).then(|| retry.json::<Value>())
}

/// An existing row's id for `entity`, creating one if the table is empty.
async fn any_record_id(
    request: &TestServer,
    token: &str,
    entity: &EntityMeta,
    in_flight: &mut HashSet<&'static str>,
) -> Option<String> {
    let listed = request
        .get(&format!("/api/bus/{}?limit=1", entity.route))
        .add_header("authorization", bearer(token))
        .await;

    if listed.status_code() == 200 {
        if let Some(id) = super::rows(&listed.json::<Value>())
            .first()
            .and_then(|row| row.get("id"))
            .and_then(Value::as_str)
        {
            return Some(id.to_string());
        }
    }

    let created = Box::pin(create_tracked(request, token, entity, &[], in_flight)).await?;
    created
        .get("id")
        .and_then(Value::as_str)
        .map(ToString::to_string)
}
