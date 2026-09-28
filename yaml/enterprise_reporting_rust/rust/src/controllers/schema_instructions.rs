//! `/api/schema-instructions` — REST twins of the server functions in
//! `src/server-fns/schema-instructions.ts` (MIGRATION_PLAN.md §6.2). Each
//! body is exactly what the server function returns, so the forwarder in
//! `src/lib/api/backend.ts` hands it back unchanged — `{ success: false,
//! error }` included, with 200, as the server functions return it.
use axum::{
    body::Bytes,
    extract::{Path, State},
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::PgPool;

use super::support::parse_body;
use crate::{
    auth::CurrentSession,
    common::{db::pg_rows_to_json, db::pool, js, response, time::now_iso},
    permissions::ownership::is_admin,
    security::audit::{log_audit, AuditEntry},
};

fn fail(message: &str) -> Response {
    response::raw(
        axum::http::StatusCode::OK,
        &json!({ "success": false, "error": message }),
    )
}

/// `GET /api/schema-instructions/{dataSourceId}` — `getSchemaInstructions`.
async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(ds_id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let db = pool(&ctx);
    let run = async {
        let exists = sqlx::query("SELECT id FROM data_sources WHERE id = $1")
            .bind(&ds_id)
            .fetch_optional(db)
            .await?
            .is_some();
        if !exists {
            return Ok::<_, sqlx::Error>(None);
        }
        let fields = sqlx::query("SELECT * FROM schema_field_instructions WHERE data_source_id = $1")
            .bind(&ds_id)
            .fetch_all(db)
            .await?;
        let tables = sqlx::query("SELECT * FROM schema_table_instructions WHERE data_source_id = $1")
            .bind(&ds_id)
            .fetch_all(db)
            .await?;
        Ok(Some((pg_rows_to_json(&fields), pg_rows_to_json(&tables))))
    };
    match run.await {
        Ok(Some((f, t))) => Ok(response::raw(
            axum::http::StatusCode::OK,
            &json!({ "success": true, "data": { "fieldInstructions": f, "tableInstructions": t } }),
        )),
        Ok(None) => Ok(fail("Data source not found")),
        Err(e) => Ok(response::server_error(
            "schema instructions",
            e,
            "SERVER_ERROR",
            "Failed to load schema instructions",
        )),
    }
}

/// `(column, body key)`; a key absent from the body leaves the column alone
/// (Kysely skips `undefined`).
type Cols = &'static [(&'static str, &'static str)];

const FIELD_UPDATE: Cols = &[
    ("description", "description"),
    ("llm_instructions", "llmInstructions"),
    ("example_values", "exampleValues"),
    ("constraints", "constraints"),
    ("business_meaning", "businessMeaning"),
];

const FIELD_INSERT: Cols = &[
    ("data_source_id", "dataSourceId"),
    ("table_name", "tableName"),
    ("field_name", "fieldName"),
    ("field_type", "fieldType"),
    ("is_nullable", "isNullable"),
    ("is_primary_key", "isPrimaryKey"),
    ("is_foreign_key", "isForeignKey"),
    ("foreign_key_table", "foreignKeyTable"),
    ("foreign_key_field", "foreignKeyField"),
    ("description", "description"),
    ("llm_instructions", "llmInstructions"),
    ("example_values", "exampleValues"),
    ("constraints", "constraints"),
    ("business_meaning", "businessMeaning"),
];

const TABLE_UPDATE: Cols = &[
    ("description", "description"),
    ("llm_instructions", "llmInstructions"),
    ("example_queries", "exampleQueries"),
    ("business_domain", "businessDomain"),
];

const TABLE_INSERT: Cols = &[
    ("data_source_id", "dataSourceId"),
    ("table_name", "tableName"),
    ("description", "description"),
    ("llm_instructions", "llmInstructions"),
    ("example_queries", "exampleQueries"),
    ("business_domain", "businessDomain"),
];

fn is_bool_column(c: &str) -> bool {
    c.starts_with("is_")
}

fn present(cols: Cols, input: &Value) -> Vec<(&'static str, &Value)> {
    cols.iter()
        .filter_map(|(c, k)| input.get(*k).map(|v| (*c, v)))
        .collect()
}

fn bind_all<'q>(
    mut q: sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments>,
    values: &[(&'static str, &'q Value)],
) -> sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments> {
    for (c, v) in values {
        q = if is_bool_column(c) {
            q.bind(if v.is_null() {
                None
            } else {
                Some(js::truthy(Some(v)))
            })
        } else {
            q.bind(js::text(v))
        };
    }
    q
}

/// Update by id, or insert with a new id — the shape both save functions share.
async fn save(
    db: &PgPool,
    table: &'static str,
    user: &str,
    input: &Value,
    update_cols: Cols,
    insert_cols: Cols,
) -> Result<(), sqlx::Error> {
    let now = now_iso();
    if let Some(id) = input.get("id").filter(|v| js::truthy(Some(v))).and_then(js::text) {
        let values = present(update_cols, input);
        let mut sql = format!("UPDATE {table} SET updated_at = $2, updated_by = $3");
        for (i, (c, _)) in values.iter().enumerate() {
            sql.push_str(&format!(", {c} = ${}", i + 4));
        }
        sql.push_str(" WHERE id = $1");
        let q = sqlx::query(sqlx::AssertSqlSafe(sql))
            .bind(id)
            .bind(&now)
            .bind(user);
        bind_all(q, &values).execute(db).await?;
    } else {
        let values = present(insert_cols, input);
        let mut cols = String::from("id, created_at, updated_at, created_by, updated_by");
        let mut params = String::from("$1, $2, $2, $3, $3");
        for (i, (c, _)) in values.iter().enumerate() {
            cols.push_str(&format!(", {c}"));
            params.push_str(&format!(", ${}", i + 4));
        }
        let sql = format!("INSERT INTO {table} ({cols}) VALUES ({params})");
        let q = sqlx::query(sqlx::AssertSqlSafe(sql))
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(&now)
            .bind(user);
        bind_all(q, &values).execute(db).await?;
    }
    Ok(())
}

fn s(input: &Value, k: &str) -> String {
    input
        .get(k)
        .and_then(js::text)
        .unwrap_or_else(|| "undefined".into())
}

async fn audit(db: &PgPool, user: &str, action: &str, resource_type: &str, id: &str, details: Value) {
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type,
            resource_id: Some(id),
            details: Some(details),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
}

/// The admin gate. Node reads `users.is_admin`, a column that does not
/// exist, so it refuses everyone; this asks `isAdmin(userId)` (D-21).
async fn admin_or_refusal(db: &PgPool, user: &str) -> Option<Response> {
    match is_admin(db, user).await {
        Ok(true) => None,
        Ok(false) => Some(fail("Only administrators can manage schema instructions")),
        Err(e) => Some(fail(&e.to_string())),
    }
}

/// `POST /api/schema-instructions/field` — `saveFieldInstruction`.
async fn save_field(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    if let Some(r) = admin_or_refusal(db, &session.user.id).await {
        return Ok(r);
    }
    let Some(input) = parse_body(&body) else {
        return Ok(fail("Failed to save"));
    };
    if let Err(e) = save(
        db,
        "schema_field_instructions",
        &session.user.id,
        &input,
        FIELD_UPDATE,
        FIELD_INSERT,
    )
    .await
    {
        tracing::error!(error = %e, "[Schema Instructions] Save failed");
        return Ok(fail(&crate::datasources::db_error_message(&e)));
    }
    let details = json!({ "tableName": input.get("tableName"), "fieldName": input.get("fieldName") });
    match input.get("id").filter(|v| js::truthy(Some(v))).and_then(js::text) {
        Some(id) => {
            audit(
                db,
                &session.user.id,
                "update",
                "schema_field_instruction",
                &id,
                details,
            )
            .await
        }
        None => {
            let rid = format!(
                "{}/{}/{}",
                s(&input, "dataSourceId"),
                s(&input, "tableName"),
                s(&input, "fieldName")
            );
            audit(
                db,
                &session.user.id,
                "create",
                "schema_field_instruction",
                &rid,
                details,
            )
            .await;
        }
    }
    Ok(response::raw(
        axum::http::StatusCode::OK,
        &json!({ "success": true, "data": input }),
    ))
}

/// `POST /api/schema-instructions/table` — `saveTableInstruction`.
async fn save_table(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    if let Some(r) = admin_or_refusal(db, &session.user.id).await {
        return Ok(r);
    }
    let Some(input) = parse_body(&body) else {
        return Ok(fail("Failed to save"));
    };
    if let Err(e) = save(
        db,
        "schema_table_instructions",
        &session.user.id,
        &input,
        TABLE_UPDATE,
        TABLE_INSERT,
    )
    .await
    {
        tracing::error!(error = %e, "[Schema Instructions] Save failed");
        return Ok(fail(&crate::datasources::db_error_message(&e)));
    }
    let id = input.get("id").filter(|v| js::truthy(Some(v))).and_then(js::text);
    let rid = id
        .clone()
        .unwrap_or_else(|| format!("{}/{}", s(&input, "dataSourceId"), s(&input, "tableName")));
    let action = if id.is_some() { "update" } else { "create" };
    audit(
        db,
        &session.user.id,
        action,
        "schema_table_instruction",
        &rid,
        json!({ "tableName": input.get("tableName") }),
    )
    .await;
    Ok(response::raw(
        axum::http::StatusCode::OK,
        &json!({ "success": true, "data": input }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/schema-instructions")
        .add("/field", post(save_field))
        .add("/table", post(save_table))
        .add("/{dataSourceId}", get(list))
}
