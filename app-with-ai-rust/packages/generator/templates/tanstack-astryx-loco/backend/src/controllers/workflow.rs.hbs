//! Workflow definitions and runs.
//!
//! `sys_workflow_definitions` holds BPMN documents bound to an entity plus a
//! CRUD operation. This exposes them and lets one be validated or executed.
//!
//! **Every handler here takes `auth::JWT`, including the reads.** A workflow is
//! not dictionary metadata: its steps are `CreateEntity`, `UpdateEntity`,
//! `DeleteEntity` and `REST`, so anyone who can define and run one can write to
//! any `bus_*` table and make the server issue arbitrary outbound HTTP — without
//! ever presenting the token `/api/bus/*` demands. Leaving these open made the
//! bus guard decorative. The reads are guarded too because a definition
//! describes the business process in full; unlike `sys_*`, nothing renders
//! before login from it.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;
use crate::services::dictionary::DictionaryCache;
use crate::services::workflow::{parse_tasks, WorkflowContext, WorkflowExecutor};

#[utoipa::path(
    get, path = "/api/workflow", tag = "workflow",
    security(("bearer" = [])),
    params(
        ("entityName" = Option<String>, Query, description = "Filter to one entity"),
        ("kind" = Option<String>, Query, description = "`bpmn` for diagrams, `automation` for automations built in the app"),
    ),
    responses((status = 200, description = "Definitions. `isModelManaged` marks one declared in the model — read-only here, because regenerating would overwrite an edit made through this API.")),
)]
pub async fn list(
    _auth: auth::JWT,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let entity = params.get("entityName").map(String::as_str);
    // `bpmn` for diagrams, `automation` for what the automations screen builds.
    let kind = params.get("kind").map(String::as_str);

    let rows = sqlx::query(
        r"SELECT * FROM sys_workflow_definitions
           WHERE ($1::text IS NULL OR entity_name = $1)
             AND ($2::text IS NULL OR kind = $2)
           ORDER BY name",
    )
    .bind(entity)
    .bind(kind)
    .fetch_all(pool)
    .await?;

    Ok(Json(crate::services::row_json::rows_to_json(&rows)).into_response())
}

/// `GET /api/workflow/{id}` — one definition.
#[utoipa::path(
    get, path = "/api/workflow/{id}", tag = "workflow",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "Workflow definition id")),
    responses(
        (status = 200, description = "The definition, BPMN XML included"),
        (status = 404, description = "No such definition"),
    ),
)]
pub async fn get_one(
    _auth: auth::JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let row = sqlx::query("SELECT * FROM sys_workflow_definitions WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Workflow {id} not found")))?;

    Ok(Json(crate::services::row_json::row_to_json(&row)).into_response())
}

/// `POST /api/workflow` — store a new definition.
#[utoipa::path(
    post, path = "/api/workflow", tag = "workflow",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ name, entityName, bpmnXml }` for a BPMN diagram, or `{ kind: \"automation\", name, entityName, definition }` for an automation, whose `definition` is the automation's YAML document. Either is checked at write time, so an unusable definition is refused here rather than at the business write that would have triggered it"),
    responses(
        (status = 201, description = "The stored definition"),
        (status = 400, description = "Missing field, an unknown kind, BPMN that does not parse, or an automation definition that is not an automation YAML document"),
    ),
)]
pub async fn create(
    _auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let name = required_str(&payload, "name")?;
    let entity_name = required_str(&payload, "entityName")?;

    match payload.get("kind").and_then(Value::as_str).unwrap_or("bpmn") {
        "bpmn" => {}
        "automation" => return create_automation(&ctx, &payload, &name, &entity_name).await,
        other => {
            return Err(AppError::BadRequest(format!(
                "Unknown workflow kind \"{other}\": expected \"bpmn\" or \"automation\""
            )))
        }
    }
    let bpmn_xml = required_str(&payload, "bpmnXml")?;

    // Reject a definition that cannot be parsed at write time rather than
    // discovering it when a business write triggers it.
    parse_tasks(&bpmn_xml)?;

    let operation = payload
        .get("operation")
        .and_then(Value::as_str)
        .unwrap_or("ALL");
    let description = payload.get("description").and_then(Value::as_str);

    let pool = ctx.db.get_postgres_connection_pool();
    let row = sqlx::query(
        r"INSERT INTO sys_workflow_definitions
            (name, entity_name, operation, bpmn_xml, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *",
    )
    .bind(&name)
    .bind(&entity_name)
    .bind(operation)
    .bind(&bpmn_xml)
    .bind(description)
    .fetch_one(pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(crate::services::row_json::row_to_json(&row)),
    )
        .into_response())
}

/// The version of the automation document this application reads.
const AUTOMATION_DOCUMENT_VERSION: &str = "1.0";

/// Hold an automation's YAML document to its shape before it is stored.
///
/// The automations screen writes the document; this is the last place a
/// malformed one can be refused before a later read of it fails in the UI. It
/// checks what every reader relies on — the version, a known kind, the entity
/// the trigger watches, and that the lists are lists — not every field of every
/// step, which the builder validates as the author edits.
fn validate_automation_definition(definition: &str) -> AppResult<()> {
    let document: serde_yaml::Value = serde_yaml::from_str(definition)
        .map_err(|error| AppError::BadRequest(format!("The automation is not YAML: {error}")))?;
    let invalid = |reason: &str| AppError::BadRequest(format!("The automation {reason}"));

    let map = document
        .as_mapping()
        .ok_or_else(|| invalid("must be a YAML mapping"))?;
    let field = |key: &str| map.get(serde_yaml::Value::from(key));

    match field("automation").and_then(serde_yaml::Value::as_str) {
        Some(AUTOMATION_DOCUMENT_VERSION) => {}
        Some(other) => {
            return Err(invalid(&format!(
                "is version {other}; this application reads version {AUTOMATION_DOCUMENT_VERSION}"
            )))
        }
        None => return Err(invalid("has no `automation:` version key")),
    }
    match field("kind").and_then(serde_yaml::Value::as_str) {
        Some("automation" | "hook" | "saga") => {}
        _ => return Err(invalid("needs `kind:` automation, hook or saga")),
    }
    let entity = field("trigger")
        .and_then(serde_yaml::Value::as_mapping)
        .and_then(|trigger| trigger.get(serde_yaml::Value::from("entity")))
        .and_then(serde_yaml::Value::as_str);
    if entity.is_none_or(str::is_empty) {
        return Err(invalid("needs `trigger.entity`"));
    }
    for list in ["conditions", "loops", "steps", "hooks"] {
        if field(list).is_some_and(|value| !value.is_sequence()) {
            return Err(invalid(&format!("has a `{list}:` that is not a list")));
        }
    }
    Ok(())
}

/// Store an automation the automations screen built, as its YAML document.
async fn create_automation(
    ctx: &AppContext,
    payload: &Value,
    name: &str,
    entity_name: &str,
) -> AppResult<Response> {
    let definition = required_str(payload, "definition")?;
    validate_automation_definition(&definition)?;

    let operation = payload
        .get("operation")
        .and_then(Value::as_str)
        .unwrap_or("ALL");
    let description = payload.get("description").and_then(Value::as_str);

    let row = sqlx::query(
        r"INSERT INTO sys_workflow_definitions
            (name, entity_name, operation, kind, definition_yaml, description)
          VALUES ($1, $2, $3, 'automation', $4, $5)
          RETURNING *",
    )
    .bind(name)
    .bind(entity_name)
    .bind(operation)
    .bind(&definition)
    .bind(description)
    .fetch_one(ctx.db.get_postgres_connection_pool())
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(crate::services::row_json::row_to_json(&row)),
    )
        .into_response())
}

/// `PUT|PATCH /api/workflow/{id}` — save an edited definition.
///
/// The Workflow Designer's edit screen has always called this. Without it the
/// route did not exist, so "Save Changes" answered 405 and every edit to a
/// stored workflow was silently lost — the one thing that screen is for.
///
/// Fields are optional so a PATCH can rename a workflow without resubmitting
/// the diagram. A supplied `bpmnXml` is parsed before it is stored, the same
/// way `create` does it: a definition that cannot be parsed must be refused at
/// write time, not when a business write triggers it.
/// `PUT`/`PATCH /api/workflow/{id}` — change a definition.
#[utoipa::path(
    put, path = "/api/workflow/{id}", tag = "workflow",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "Workflow definition id")),
    request_body(content = serde_json::Value, description = "The fields to change. An automation's `definition` (its YAML document) and a diagram's `bpmnXml` are checked before they are stored"),
    responses(
        (status = 200, description = "The updated definition"),
        (status = 400, description = "BPMN that does not parse, or a model-managed definition — those are edited in the model and regenerated, because the next generation would overwrite an edit made here"),
        (status = 404, description = "No such definition"),
    ),
)]
pub async fn update(
    _auth: auth::JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();

    let existing: Option<(bool, String)> =
        sqlx::query_as("SELECT is_model_managed, name FROM sys_workflow_definitions WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

    let Some((is_managed, existing_name)) = existing else {
        return Err(AppError::NotFound(format!("Workflow {id} not found")));
    };

    // Same reasoning as `remove`: the next generation would overwrite the edit,
    // so refuse it here instead of losing someone's work without warning.
    if is_managed {
        return Err(AppError::BadRequest(format!(
            "Workflow \"{existing_name}\" is declared in the model. Edit its `kind: saga` section and regenerate."
        )));
    }

    let bpmn_xml = payload.get("bpmnXml").and_then(Value::as_str);
    if let Some(xml) = bpmn_xml {
        parse_tasks(xml)?;
    }
    let definition = payload.get("definition").and_then(Value::as_str);
    if let Some(yaml) = definition {
        validate_automation_definition(yaml)?;
    }

    let row = sqlx::query(
        r"UPDATE sys_workflow_definitions
             SET name        = COALESCE($2, name),
                 entity_name = COALESCE($3, entity_name),
                 operation   = COALESCE($4, operation),
                 bpmn_xml    = COALESCE($5, bpmn_xml),
                 description = COALESCE($6, description),
                 is_active   = COALESCE($7, is_active),
                 definition_yaml = COALESCE($8, definition_yaml),
                 updated_at  = NOW()
           WHERE id = $1
       RETURNING *",
    )
    .bind(id)
    .bind(payload.get("name").and_then(Value::as_str))
    .bind(payload.get("entityName").and_then(Value::as_str))
    .bind(payload.get("operation").and_then(Value::as_str))
    .bind(bpmn_xml)
    .bind(payload.get("description").and_then(Value::as_str))
    .bind(payload.get("isActive").and_then(Value::as_bool))
    .bind(definition)
    .fetch_one(pool)
    .await?;

    Ok(Json(crate::services::row_json::row_to_json(&row)).into_response())
}

/// `DELETE /api/workflow/{id}` — drop a definition.
#[utoipa::path(
    delete, path = "/api/workflow/{id}", tag = "workflow",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "Workflow definition id")),
    responses(
        (status = 204, description = "Deleted"),
        (status = 400, description = "A model-managed definition — remove its `kind: saga` section and regenerate"),
        (status = 404, description = "No such definition"),
    ),
)]
pub async fn remove(
    _auth: auth::JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();

    // A model-declared workflow belongs to the model. Deleting it here would
    // appear to work and then reappear on the next generation, so refuse it and
    // say where the definition actually lives.
    let managed: Option<(bool, String)> =
        sqlx::query_as("SELECT is_model_managed, name FROM sys_workflow_definitions WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

    if let Some((true, name)) = managed {
        return Err(AppError::BadRequest(format!(
            "Workflow \"{name}\" is declared in the model. Remove its `kind: saga` section and regenerate."
        )));
    }

    let result = sqlx::query("DELETE FROM sys_workflow_definitions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Workflow {id} not found")));
    }
    Ok(StatusCode::NO_CONTENT.into_response())
}

/// `POST /api/workflow/{id}/execute` — run a definition against one record.
#[utoipa::path(
    post, path = "/api/workflow/{id}/execute", tag = "workflow",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "Workflow definition id")),
    request_body(content = serde_json::Value, description = "`{ entityId, entityData, decision }` — the run context every step reads from"),
    responses(
        (status = 200, description = "`{ status, tasksExecuted, vars }`"),
        (status = 400, description = "A step failed; the run aborted and is recorded as failed"),
        (status = 404, description = "No such definition"),
    ),
)]
pub async fn execute(
    _auth: auth::JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let definition: Option<(String, Option<String>)> =
        sqlx::query_as("SELECT entity_name, bpmn_xml FROM sys_workflow_definitions WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;
    let (entity_name, bpmn_xml) =
        definition.ok_or_else(|| AppError::NotFound(format!("Workflow {id} not found")))?;
    // An automation is stored as its YAML document and has no diagram; this
    // endpoint runs BPMN, so say so rather than failing to decode a NULL.
    let bpmn_xml = bpmn_xml.ok_or_else(|| {
        AppError::BadRequest(format!(
            "Workflow {id} is an automation, not a BPMN diagram, and cannot be executed here"
        ))
    })?;

    let executor = ctx
        .shared_store
        .get::<WorkflowExecutor>()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("workflow executor not initialised")))?;

    let tasks = parse_tasks(&bpmn_xml)?;
    let mut run = WorkflowContext {
        entity_name,
        entity_id: payload
            .get("entityId")
            .and_then(Value::as_str)
            .map(ToString::to_string),
        entity_data: payload
            .get("entityData")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default(),
        decision: payload
            .get("decision")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default(),
        vars: serde_json::Map::new(),
    };

    let started = chrono::Utc::now();
    let outcome = executor.run(&tasks, &mut run).await;

    // Every run is recorded, successful or not — sys_workflow_runs is the
    // operator's only view into what a workflow actually did.
    let status = if outcome.is_ok() { "completed" } else { "failed" };
    let error = outcome.as_ref().err().map(ToString::to_string);
    let _ = sqlx::query(
        r"INSERT INTO sys_workflow_runs
            (entity_name, entity_id, operation, status, error_details, created_at, completed_at)
          VALUES ($1, $2, 'TRIGGER', $3, $4, $5, NOW())",
    )
    .bind(&run.entity_name)
    .bind(run.entity_id.as_deref().and_then(|id| Uuid::parse_str(id).ok()))
    .bind(status)
    .bind(error.as_deref())
    .bind(started)
    .execute(pool)
    .await;

    outcome?;
    Ok(Json(json!({
        "status": status,
        "tasksExecuted": tasks.len(),
        "vars": run.vars,
    }))
    .into_response())
}

/// `GET /api/workflows/transitions?table=&from=` — the moves that exist.
///
/// A form that offers every value a status column could hold offers moves the
/// state machine does not draw, and the update is then refused with a
/// validation error after the user has committed to it. This is the list to
/// build the control from: ask for a table and the record's current state, get
/// back exactly the moves that will be accepted.
///
/// Open to any signed-in caller, deliberately. It describes the machine, not
/// the data — the same line `/api/sys/*` reads draw between a description and
/// the thing described. Whether *this* caller may cross a given edge is
/// `sys_transition_access`, and it is answered when the write arrives.
///
/// `from` is optional: without it the whole machine comes back, which is what
/// a designer screen wants.
#[utoipa::path(
    get, path = "/api/workflows/transitions", tag = "workflow",
    security(("bearer" = [])),
    params(
        ("table" = Option<String>, Query, description = "Physical table, e.g. `bus_deal`"),
        ("from" = Option<String>, Query, description = "Current state; omit for the whole machine"),
    ),
    responses((status = 200, description = "`[{ tableName, statusField, from, to, transition }]`")),
)]
pub async fn transitions(
    _auth: auth::JWT,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let table = params.get("table").or_else(|| params.get("tableName"));
    let from = params.get("from").or_else(|| params.get("fromState"));

    let rows: Vec<(String, String, String, String, Option<String>)> = sqlx::query_as(
        r"SELECT table_name, status_field, from_state, to_state, transition_name
            FROM sys_workflow_transitions
           WHERE ($1::text IS NULL OR table_name = $1)
             AND ($2::text IS NULL OR from_state = $2)
             AND COALESCE(is_active, true) = true
           ORDER BY table_name, from_state, to_state",
    )
    .bind(table)
    .bind(from)
    .fetch_all(ctx.db.get_postgres_connection_pool())
    .await?;

    let moves: Vec<Value> = rows
        .into_iter()
        .map(|(table_name, status_field, from_state, to_state, transition)| {
            json!({
                "tableName": table_name,
                "statusField": status_field,
                "from": from_state,
                "to": to_state,
                "transition": transition,
            })
        })
        .collect();
    Ok(Json(moves).into_response())
}

/// `GET /api/workflows/runs` — the execution log the admin screen polls.
///
/// A bare array in creation order, newest first, because that screen refreshes
/// every five seconds and reads it as `WorkflowRun[]`.
#[utoipa::path(
    get, path = "/api/workflows/runs", tag = "workflow",
    security(("bearer" = [])),
    params(
        ("entityName" = Option<String>, Query, description = "Filter by entity"),
        ("status" = Option<String>, Query, description = "Filter by run status"),
        ("limit" = Option<i64>, Query, description = "Max rows (default 100, cap 1000)"),
    ),
    responses((status = 200, description = "The run log, newest first — a bare array, not the `{ data, meta }` envelope")),
)]
pub async fn runs(
    _auth: auth::JWT,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();

    let limit = params
        .get("limit")
        .and_then(|v| v.parse::<i64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(100)
        .min(1000);

    let rows = sqlx::query(
        r"SELECT * FROM sys_workflow_runs
           WHERE ($1::text IS NULL OR entity_name = $1)
             AND ($2::text IS NULL OR status      = $2)
             AND ($3::text IS NULL OR operation   = $3)
           ORDER BY created_at DESC
           LIMIT $4",
    )
    .bind(params.get("entityName").or_else(|| params.get("entity_name")))
    .bind(params.get("status"))
    .bind(params.get("operation"))
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(Json(crate::services::row_json::rows_to_json(&rows)).into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("workflow")
        .add("/", get(list))
        .add("/", post(create))
        .add("/{id}", get(get_one))
        .add("/{id}", put(update))
        .add("/{id}", patch(update))
        .add("/{id}", delete(remove))
        .add("/{id}/execute", post(execute))
}

/// `/api/workflows/runs`, mounted separately.
///
/// The plural is not a typo to fix: `/api/workflow` is a definition and
/// `/api/workflows/runs` is the run log, and both spellings are already in the
/// frontend. Loco's `Routes::prefix` is a single segment, so the second prefix
/// needs its own `Routes`.
/// `GET /api/workflows/entity/{entity_name}/{entity_id}` — one record's runs.
///
/// The run log narrowed to a single record, which is the question an operator
/// actually has: not "what has this application run" but "what happened to
/// *this* order". `/runs` answers the first and cannot answer the second — it
/// filters by entity name, not by id.
///
/// Gated on that entity's own `read`, not on being an administrator. A run
/// row names the record and carries `mutations_applied`, so reading a
/// record's runs is reading what was done to the record; anyone who may not
/// read the record may not read that either. Without the check this would be
/// a way around the guard on `/api/bus/*`, which is the same hole the
/// workflow controller had before it was guarded at all.
#[utoipa::path(
    get, path = "/api/workflows/entity/{entity_name}/{entity_id}", tag = "workflow",
    security(("bearer" = [])),
    params(
        ("entity_name" = String, Path, description = "Dictionary table or entity name"),
        ("entity_id" = String, Path, description = "Record id"),
        ("limit" = Option<i64>, Query, description = "Page size, clamped to 1..=500 (default 100)"),
    ),
    responses(
        (status = 200, description = "Runs for this record, newest first"),
        (status = 403, description = "The caller may not read this entity"),
        (status = 404, description = "No such entity in the dictionary"),
    ),
)]
pub async fn entity_runs(
    auth: auth::JWTWithUser<users::Model>,
    Path((entity_name, entity_id)): Path<(String, String)>,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
    SharedStore(dictionary): SharedStore<DictionaryCache>,
) -> AppResult<Response> {
    let table = dictionary.resolve(&entity_name).await?;
    let pool = ctx.db.get_postgres_connection_pool();
    let principal = crate::services::authz::principal(pool, &auth.user).await?;
    crate::services::authz::require_operation(
        pool,
        &principal,
        table.as_str(),
        crate::services::authz::Operation::Read,
    )
    .await?;

    let limit = params
        .get("limit")
        .and_then(|v| v.parse::<i64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(100)
        .min(500);

    // `entity_name` is matched against the physical table the dictionary
    // resolved, not against what the caller typed: the runs were written with
    // the table name, and `/workflows/entity/companies/…` must find them.
    let rows = sqlx::query(
        r"SELECT * FROM sys_workflow_runs
           WHERE entity_name = $1 AND entity_id = $2::uuid
           ORDER BY created_at DESC
           LIMIT $3",
    )
    .bind(table.as_str())
    .bind(&entity_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(Json(crate::services::row_json::rows_to_json(&rows)).into_response())
}

pub fn run_routes() -> Routes {
    Routes::new()
        .prefix("workflows")
        .add("/runs", get(runs))
        .add("/transitions", get(transitions))
        .add("/entity/{entity_name}/{entity_id}", get(entity_runs))
}

/// `/api/workflow-definitions` — the designer's spelling of `/api/workflow`.
///
/// Same handlers, second URL. The workflow designer screens were written
/// against this name and the rules editor links to it; aliasing costs one route
/// table and breaks nothing.
pub fn definition_routes() -> Routes {
    Routes::new()
        .prefix("workflow-definitions")
        .add("/", get(list))
        .add("/", post(create))
        .add("/{id}", get(get_one))
        .add("/{id}", put(update))
        .add("/{id}", patch(update))
        .add("/{id}", delete(remove))
        .add("/{id}/execute", post(execute))
}

fn required_str(payload: &Value, key: &str) -> AppResult<String> {
    payload
        .get(key)
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .map(ToString::to_string)
        .ok_or_else(|| AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec![format!("{key} is required")],
        })
}
