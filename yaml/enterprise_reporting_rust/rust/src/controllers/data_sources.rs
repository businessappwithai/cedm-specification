//! `/api/data-sources` — twin of `src/routes/api/data-sources/**` and
//! `DataSourceService` (`src/lib/services/data-source.service.ts`).
//!
//! `connection_config` never leaves the server except, since D-16, to the
//! owner or an admin on `GET /{id}`, with the password removed. PostgreSQL
//! only (MIGRATION_PLAN.md §7): the SQLite `upload` route stays on Node, and
//! MySQL / SQL Server data sources can be stored but not tested or inspected.
//!
//! These routes use the bare `{ error: { message } }` envelope, as Node does.
use std::time::Duration;

use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use sqlx::PgPool;

use super::support::{is_admin_by_role_name, parse_body};
use crate::{
    auth::{CurrentSession, Session},
    common::{
        db::{pg_row_to_json, pg_rows_to_json, pool},
        js, response,
        time::now_iso,
    },
    datasources::{
        connection_manager::{close_connection, test_connection},
        db_error_message, get_connection,
        introspection::{introspect_postgres, to_value},
        network_target::check_data_source_host,
        DataSourceRow, UserDb,
    },
    metadata::entities,
    permissions::has_permission,
    security::{
        audit::{log_audit, AuditEntry},
        encryption::{decrypt, encrypt},
    },
};

fn err(status: StatusCode, message: &str) -> Response {
    response::raw(status, &json!({ "error": { "message": message } }))
}

fn unauthorized() -> Response {
    err(StatusCode::UNAUTHORIZED, "Unauthorized")
}

fn internal(message: &str) -> Response {
    err(StatusCode::INTERNAL_SERVER_ERROR, message)
}

fn not_found() -> Response {
    err(StatusCode::NOT_FOUND, "Data source not found")
}

/// Audit without failing the request, as Node's `.catch(console.error)`.
async fn audit(db: &PgPool, user: &str, action: &str, id: &str, details: Value) {
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type: "data_source",
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

/// `checkPermission`: an admin role (by name) or the creator.
fn owner_or_admin(session: &Session, created_by: Option<&str>) -> bool {
    is_admin_by_role_name(&session.user.roles) || created_by == Some(session.user.id.as_str())
}

/// `normaliseClientType`.
fn normalise_client_type(t: &str) -> &str {
    match t {
        "postgres" | "postgresql" => "pg",
        other => other,
    }
}

fn is_pg(t: &str) -> bool {
    matches!(t, "pg" | "postgres" | "postgresql")
}

/// `parsePostgresConnectionString`: a WHATWG-parsable URL, kept whole. The
/// message is Bun's `new URL()` error inside Node's.
fn parse_pg_connection_string(cs: &str) -> Result<Value, String> {
    url::Url::parse(cs)
        .map(|_| json!({ "connectionString": cs }))
        .map_err(|_| format!("Invalid PostgreSQL connection string: \"{cs}\" cannot be parsed as a URL."))
}

/// Every host a config could connect to: `host`, and a connection string's
/// host, which the connection manager prefers when both are present. All of
/// them are checked, so a public `host` cannot vouch for a private
/// connection string.
fn config_hosts(cfg: &Value) -> Vec<String> {
    let mut hosts = Vec::new();
    if let Some(h) = cfg
        .get("host")
        .and_then(Value::as_str)
        .filter(|h| !h.trim().is_empty())
    {
        hosts.push(h.to_string());
    }
    if let Some(h) = cfg
        .get("connectionString")
        .and_then(Value::as_str)
        .and_then(|cs| url::Url::parse(cs).ok())
        .and_then(|u| u.host_str().map(|h| h.trim_matches(['[', ']']).to_string()))
    {
        hosts.push(h);
    }
    hosts
}

/// D-17: the network-target check the test route makes, applied to every
/// config that is stored as well.
async fn check_target(cfg: &Value) -> Result<(), Response> {
    for host in config_hosts(cfg) {
        check_data_source_host(Some(&host))
            .await
            .map_err(|reason| err(StatusCode::FORBIDDEN, &reason))?;
    }
    Ok(())
}

/// D-16: what the owner or an admin sees of a stored config — no password,
/// and a connection string's password masked.
fn redact_config(mut cfg: Value) -> Value {
    if let Some(o) = cfg.as_object_mut() {
        o.shift_remove("password");
        if let Some(cs) = o.get("connectionString").and_then(Value::as_str) {
            if let Ok(mut u) = url::Url::parse(cs) {
                if u.password().is_some() && u.set_password(Some("********")).is_ok() {
                    o.insert("connectionString".into(), Value::String(u.to_string()));
                }
            }
        }
    }
    cfg
}

/// `DataSourceService.getById` without the config.
fn output(row: &Value) -> Value {
    let g = |k: &str| row.get(k).cloned().unwrap_or(Value::Null);
    let or = |k: &str, d: Value| match row.get(k) {
        None | Some(Value::Null) => d,
        Some(v) => v.clone(),
    };
    json!({
        "id": g("id"),
        "name": g("name"),
        "description": g("description"),
        "client_type": g("client_type"),
        "is_active": g("is_active"),
        "is_editable": or("is_editable", json!(false)),
        "is_deleted": or("is_deleted", json!(false)),
        "created_at": g("created_at"),
        "updated_at": g("updated_at"),
        "created_by": or("created_by", json!("")),
    })
}

async fn find_live(db: &PgPool, id: &str) -> Result<Option<Value>, sqlx::Error> {
    Ok(
        sqlx::query("SELECT * FROM data_sources WHERE id = $1 AND is_deleted = false")
            .bind(id)
            .fetch_optional(db)
            .await?
            .as_ref()
            .map(pg_row_to_json),
    )
}

#[derive(Debug, Deserialize)]
struct ListQuery {
    inspected: Option<String>,
}

/// `GET /api/data-sources`.
async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<ListQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let db = pool(&ctx);
    // Node parity (MIGRATION_PLAN.md §9, P-5): unpaginated.
    let sql = if q.inspected.as_deref() == Some("true") {
        "SELECT * FROM data_sources WHERE is_deleted = false AND is_inspected = true ORDER BY name ASC"
    } else {
        "SELECT * FROM data_sources WHERE is_deleted = false ORDER BY name ASC"
    };
    let rows = match sqlx::query(sql).fetch_all(db).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "Data sources list error");
            return Ok(internal(&e.to_string()));
        }
    };
    let items: Vec<Value> = pg_rows_to_json(&rows)
        .into_iter()
        .map(|mut v| {
            if let Some(o) = v.as_object_mut() {
                o.shift_remove("connection_config");
            }
            v
        })
        .collect();
    let count = items.len();

    let pool_for_audit = db.clone();
    tokio::spawn(async move {
        if let Err(e) = log_audit(
            &pool_for_audit,
            AuditEntry {
                action: "view",
                resource_type: "data_source",
                details: Some(json!({ "operation": "listDataSources", "count": count })),
                ..Default::default()
            },
        )
        .await
        {
            tracing::error!(error = %e, "Audit log error");
        }
    });

    Ok(response::ok(
        json!({ "items": items, "meta": { "total": count } }),
    ))
}

fn non_empty_str<'a>(body: &'a Value, key: &str) -> Option<&'a str> {
    body.get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

/// `POST /api/data-sources` — `DataSourceService.create`.
async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(internal("Internal server error"));
    };
    // D-17: creating a data source is managing one — the test route's
    // permission — and the target is checked before it is stored.
    if !has_permission(
        &session.user.permissions,
        &session.user.roles,
        "data_source",
        "create",
    ) {
        return Ok(err(
            StatusCode::FORBIDDEN,
            "You do not have permission to manage data sources",
        ));
    }
    let Some(name) = non_empty_str(&body, "name") else {
        return Ok(internal("Data source name is required"));
    };
    let Some(client_type) = non_empty_str(&body, "clientType") else {
        return Ok(internal("Database type is required"));
    };
    let Some(config) = body
        .get("connectionConfig")
        .filter(|v| v.is_object() || v.is_array())
    else {
        return Ok(internal("Connection configuration is required"));
    };
    let mut final_config = config.clone();
    if let Some(cs) = config.get("connectionString").and_then(Value::as_str) {
        if is_pg(client_type) {
            match parse_pg_connection_string(cs) {
                Ok(c) => final_config = c,
                Err(m) => return Ok(internal(&m)),
            }
        }
    }
    if let Err(r) = check_target(&final_config).await {
        return Ok(r);
    }
    let encrypted = match encrypt(&js::stringify(&final_config)) {
        Ok(e) => e,
        Err(e) => return Ok(internal(&e.to_string())),
    };
    let description = body
        .get("description")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let db = pool(&ctx);
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    if let Err(e) = sqlx::query(
        "INSERT INTO data_sources (id, name, description, client_type, connection_config, is_active, is_editable, \
           is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, true, false, false, NULL, NULL, $6, $7, $7)",
    )
    .bind(&id)
    .bind(name)
    .bind(description)
    .bind(normalise_client_type(client_type))
    .bind(&encrypted)
    .bind(&session.user.id)
    .bind(&now)
    .execute(db)
    .await
    {
        tracing::error!(error = %e, "Data sources create error");
        return Ok(internal(&db_error_message(&e)));
    }
    audit(
        db,
        &session.user.id,
        "create",
        &id,
        json!({ "name": body.get("name"), "clientType": body.get("clientType") }),
    )
    .await;
    match find_live(db, &id).await {
        Ok(Some(row)) => Ok(response::raw(
            StatusCode::CREATED,
            &json!({ "success": true, "item": output(&row) }),
        )),
        Ok(None) => Ok(internal("Failed to create data source")),
        Err(e) => Ok(internal(&e.to_string())),
    }
}

/// `GET /api/data-sources/{id}`.
async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    let row = match find_live(db, &id).await {
        Ok(Some(r)) => r,
        Ok(None) => return Ok(not_found()),
        Err(e) => return Ok(internal(&e.to_string())),
    };
    let mut out = output(&row);
    // D-16: Node returns the decrypted config, password included, to any
    // signed-in user. Here only the owner or an admin sees it, redacted.
    if owner_or_admin(&session, row.get("created_by").and_then(Value::as_str)) {
        let parsed = row
            .get("connection_config")
            .and_then(Value::as_str)
            .and_then(|c| decrypt(c).ok())
            .and_then(|p| serde_json::from_str::<Value>(&p).ok());
        match parsed {
            Some(cfg) => {
                if let Some(o) = out.as_object_mut() {
                    o.insert("connection_config".into(), redact_config(cfg));
                }
            }
            None => tracing::error!("Failed to decrypt connection config"),
        }
    }
    let pool_for_audit = db.clone();
    let (user, name) = (session.user.id.clone(), row.get("name").cloned());
    tokio::spawn(async move {
        audit(
            &pool_for_audit,
            &user,
            "view",
            &id,
            json!({ "operation": "getDataSource", "name": name }),
        )
        .await;
    });
    Ok(response::raw(StatusCode::OK, &out))
}

/// The existing row a write needs, after the owner-or-admin gate.
async fn gate(db: &PgPool, session: &Session, id: &str) -> std::result::Result<Value, Response> {
    let row = match find_live(db, id).await {
        Ok(Some(r)) => r,
        Ok(None) => return Err(not_found()),
        Err(e) => return Err(internal(&e.to_string())),
    };
    if owner_or_admin(session, row.get("created_by").and_then(Value::as_str)) {
        Ok(row)
    } else {
        Err(err(StatusCode::FORBIDDEN, "Forbidden"))
    }
}

/// The stored config, decrypted.
fn stored_config(row: &Value) -> Option<Value> {
    let plain = decrypt(row.get("connection_config")?.as_str()?).ok()?;
    serde_json::from_str(&plain).ok()
}

/// D-15: a config sent without a password keeps the stored one. The edit
/// form sends none unless the user types a new one ("Leave empty to keep
/// current"); Node stored the config as sent and the password was gone.
fn keep_stored_password(new_cfg: &mut Value, stored: Option<Value>) {
    let Some(o) = new_cfg.as_object_mut() else { return };
    if o.contains_key("connectionString") {
        return;
    }
    let absent = match o.get("password") {
        None | Some(Value::Null) => true,
        Some(Value::String(s)) => s.is_empty(),
        Some(_) => false,
    };
    if !absent {
        return;
    }
    let Some(stored) = stored else { return };
    // Only for the same target: a password is a credential for one server
    // and account, and carrying it over to a new host would hand it to
    // whoever runs that host (an admin who may not see it could otherwise
    // retrieve it by repointing the data source at their own server).
    let same = |k: &str| o.get(k).and_then(js::text) == stored.get(k).and_then(js::text);
    if !["host", "port", "database", "user"].into_iter().all(same) {
        return;
    }
    if let Some(pw) = stored.get("password").cloned().filter(|p| !p.is_null()) {
        o.insert("password".into(), pw);
    }
}

/// `DataSourceService.update`.
async fn apply_update(db: &PgPool, session: &Session, id: &str, row: &Value, input: &Value) -> Response {
    let mut sets: Vec<(&'static str, Value)> = Vec::new();
    if let Some(name) = input.get("name") {
        let trimmed = name.as_str().map(str::trim).unwrap_or_default();
        if trimmed.is_empty() {
            return internal("Data source name cannot be empty");
        }
        sets.push(("name", json!(trimmed)));
    }
    if let Some(d) = input.get("description") {
        let v = if js::truthy(Some(d)) {
            js::text(d).map_or(Value::Null, |s| json!(s.trim()))
        } else {
            Value::Null
        };
        sets.push(("description", v));
    }
    if let Some(a) = input.get("isActive") {
        sets.push((
            "is_active",
            json!(a.as_bool().unwrap_or_else(|| js::truthy(Some(a)))),
        ));
    }
    if let Some(cfg) = input.get("connectionConfig").filter(|v| js::truthy(Some(v))) {
        if !(cfg.is_object() || cfg.is_array()) {
            return internal("Invalid connection configuration");
        }
        let mut final_config = cfg.clone();
        if let Some(cs) = cfg.get("connectionString").and_then(Value::as_str) {
            if row.get("client_type").and_then(Value::as_str) == Some("pg") {
                match parse_pg_connection_string(cs) {
                    Ok(c) => final_config = c,
                    Err(m) => return internal(&m),
                }
            }
        }
        keep_stored_password(&mut final_config, stored_config(row));
        if let Err(r) = check_target(&final_config).await {
            return r;
        }
        match encrypt(&js::stringify(&final_config)) {
            Ok(e) => sets.push(("connection_config", json!(e))),
            Err(e) => return internal(&e.to_string()),
        }
    }

    let mut sql = String::from("UPDATE data_sources SET updated_at = $2");
    for (i, (col, _)) in sets.iter().enumerate() {
        sql.push_str(&format!(", {col} = ${}", i + 3));
    }
    sql.push_str(" WHERE id = $1");
    let mut q = sqlx::query(sqlx::AssertSqlSafe(sql)).bind(id).bind(now_iso());
    for (col, v) in &sets {
        q = match (*col, v) {
            ("is_active", v) => q.bind(v.as_bool()),
            (_, Value::Null) => q.bind(None::<String>),
            (_, v) => q.bind(v.as_str().map(str::to_string)),
        };
    }
    if let Err(e) = q.execute(db).await {
        tracing::error!(error = %e, "Data source update error");
        return internal(&db_error_message(&e));
    }
    let fields: Vec<&str> = sets.iter().map(|(c, _)| *c).collect();
    audit(db, &session.user.id, "update", id, json!({ "fields": fields })).await;
    close_connection(id).await;
    response::raw(StatusCode::OK, &json!({ "success": true }))
}

async fn update_with(
    ctx: &AppContext,
    session: Option<Session>,
    id: &str,
    body: &[u8],
    put: bool,
) -> Response {
    let Some(session) = session else {
        return unauthorized();
    };
    let db = pool(ctx);
    let row = match gate(db, &session, id).await {
        Ok(r) => r,
        Err(r) => return r,
    };
    let Some(mut body) = parse_body(body) else {
        return internal("Internal server error");
    };
    // PUT accepts the snake_case spelling too, as in Node.
    if put && js::truthy(body.get("connection_config")) && !js::truthy(body.get("connectionConfig")) {
        let c = body.get("connection_config").cloned();
        if let (Some(o), Some(c)) = (body.as_object_mut(), c) {
            o.insert("connectionConfig".into(), c);
        }
    }
    apply_update(db, &session, id, &row, &body).await
}

/// `PUT /api/data-sources/{id}`.
async fn put(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    Ok(update_with(&ctx, session, &id, &body, true).await)
}

/// `PATCH /api/data-sources/{id}`.
async fn patch(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    Ok(update_with(&ctx, session, &id, &body, false).await)
}

/// `DELETE /api/data-sources/{id}` — a soft delete.
async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    if let Err(r) = gate(db, &session, &id).await {
        return Ok(r);
    }
    let now = now_iso();
    if let Err(e) = sqlx::query(
        "UPDATE data_sources SET is_deleted = true, deleted_at = $2, deleted_by = $3, updated_at = $2 WHERE id = $1",
    )
    .bind(&id)
    .bind(&now)
    .bind(&session.user.id)
    .execute(db)
    .await
    {
        return Ok(internal(&db_error_message(&e)));
    }
    audit(
        db,
        &session.user.id,
        "delete",
        &id,
        json!({ "operation": "soft_delete" }),
    )
    .await;
    close_connection(&id).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `POST /api/data-sources/test`.
async fn test(CurrentSession(session): CurrentSession, body: Bytes) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(internal("Test connection failed"));
    };
    let Some(config) = body.get("connectionConfig").filter(|v| !v.is_null()) else {
        // Node reads `body.connectionConfig.host` first and throws.
        return Ok(internal("Test connection failed"));
    };
    if !has_permission(
        &session.user.permissions,
        &session.user.roles,
        "data_source",
        "create",
    ) {
        return Ok(err(
            StatusCode::FORBIDDEN,
            "You do not have permission to manage data sources",
        ));
    }
    if let Err(r) = check_target(config).await {
        return Ok(r);
    }
    let client_type = body.get("clientType").and_then(Value::as_str).unwrap_or_default();
    let (connected, message, latency) = test_connection(client_type, config).await;
    let mut data = Map::new();
    data.insert("connected".into(), json!(connected));
    data.insert("message".into(), json!(message));
    if let Some(l) = latency {
        data.insert("latency".into(), json!(u64::try_from(l).unwrap_or(u64::MAX)));
    }
    Ok(response::raw(StatusCode::OK, &json!({ "data": data })))
}

/// The inspect route's user-facing rewording of a connection failure.
fn inspect_error_message(message: &str) -> String {
    if message.contains("ETIMEDOUT") || message.contains("timed out") {
        "Connection timeout: The database server is not responding. This usually means the server is unreachable or the network is blocking the connection.".into()
    } else if message.contains("ECONNREFUSED") || message.contains("Connection refused") {
        "Connection refused: The database server rejected the connection. Verify the host, port, and credentials."
            .into()
    } else if message.contains("timeout") {
        "Schema introspection timeout: The database took too long to respond.".into()
    } else if message.contains("connect") {
        "Failed to connect to the database. The server may be unreachable or the network may be restricted."
            .into()
    } else if message.is_empty() {
        "Failed to inspect schema".into()
    } else {
        message.to_string()
    }
}

/// `POST /api/data-sources/{id}/inspect` — import every table and view as a
/// hidden, inactive metadata entity (existing ones are left alone).
async fn inspect(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    let row = match find_live(db, &id).await {
        Ok(Some(r)) => r,
        Ok(None) => return Ok(not_found()),
        Err(e) => return Ok(internal(&inspect_error_message(&e.to_string()))),
    };
    if !owner_or_admin(&session, row.get("created_by").and_then(Value::as_str)) {
        return Ok(err(StatusCode::FORBIDDEN, "Forbidden"));
    }
    let ds = DataSourceRow {
        id: id.clone(),
        name: row
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        client_type: row
            .get("client_type")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        connection_config: row
            .get("connection_config")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
    };
    let conn = match get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => return Ok(internal(&inspect_error_message(&e.to_string()))),
    };
    let UserDb::Pg(user_pool) = &conn else {
        return Ok(internal(&format!(
            "Schema inspection for {} data sources is not served by the Rust backend (PostgreSQL only)",
            ds.client_type
        )));
    };
    let schema = match tokio::time::timeout(Duration::from_secs(300), introspect_postgres(user_pool)).await {
        Ok(Ok(s)) => s,
        Ok(Err(e)) => return Ok(internal(&inspect_error_message(&db_error_message(&e)))),
        Err(_) => return Ok(internal(&inspect_error_message("timeout"))),
    };

    let with_type = |v: Value, t: &str| {
        let mut v = v;
        if let Some(o) = v.as_object_mut() {
            o.insert("entity_type".into(), json!(t));
        }
        v
    };
    let entities: Vec<Value> = schema
        .tables
        .iter()
        .map(|t| with_type(to_value(t), "table"))
        .chain(schema.views.iter().map(|v| with_type(to_value(v), "view")))
        .collect();

    match import_entities(db, &id, &session.user.id, &entities).await {
        Ok(created) => Ok(response::raw(
            StatusCode::OK,
            &json!({
                "success": true,
                "data": {
                    "entities_count": created,
                    "total_entities": entities.len(),
                    "message": format!("Schema inspection completed. {created} new entities imported."),
                },
            }),
        )),
        Err(e) => Ok(internal(&inspect_error_message(&db_error_message(&e)))),
    }
}

async fn import_entities(
    db: &PgPool,
    ds_id: &str,
    user: &str,
    entities: &[Value],
) -> Result<u32, sqlx::Error> {
    let now = now_iso();
    let mut created = 0;
    for e in entities {
        let name = e.get("name").and_then(Value::as_str).unwrap_or_default();
        let schema = e.get("schema").and_then(Value::as_str).filter(|s| !s.is_empty());
        let existing = sqlx::query(
            "SELECT id FROM metadata_entity_header WHERE data_source_id = $1 AND entity_name = $2 \
               AND entity_schema IS NOT DISTINCT FROM $3",
        )
        .bind(ds_id)
        .bind(name)
        .bind(schema)
        .fetch_optional(db)
        .await?;
        if existing.is_some() {
            continue;
        }
        let header_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO metadata_entity_header (id, data_source_id, entity_name, entity_schema, entity_type, \
               schema_metadata, is_active, is_hidden, created_by, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, false, true, $7, $8, $8)",
        )
        .bind(&header_id)
        .bind(ds_id)
        .bind(name)
        .bind(schema)
        .bind(e.get("entity_type").and_then(Value::as_str))
        .bind(js::stringify(e))
        .bind(user)
        .bind(&now)
        .execute(db)
        .await?;
        for col in e.get("columns").and_then(Value::as_array).into_iter().flatten() {
            let s = |k: &str| col.get(k).and_then(Value::as_str).filter(|v| !v.is_empty());
            sqlx::query(
                "INSERT INTO metadata_entity_field (id, entity_header_id, field_name, data_type, is_nullable, \
                   is_primary_key, is_foreign_key, foreign_key_table, foreign_key_column, default_value, \
                   is_display_field, is_searchable, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, true, $11, $11)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(&header_id)
            .bind(s("name"))
            .bind(col.get("type").and_then(Value::as_str))
            .bind(col.get("nullable") != Some(&Value::Bool(false)))
            // PostgreSQL introspection sets none of these on a column, so
            // Node's `col.isPrimaryKey || false` etc. are always false / null.
            .bind(js::truthy(col.get("isPrimaryKey")))
            .bind(js::truthy(col.get("isForeignKey")))
            .bind(s("foreignKeyTable"))
            .bind(s("foreignKeyColumn"))
            .bind(s("defaultValue"))
            .bind(&now)
            .execute(db)
            .await?;
        }
        created += 1;
    }
    let at = now_iso();
    sqlx::query(
        "UPDATE data_sources SET is_inspected = true, last_inspected_at = $2, updated_at = $2 WHERE id = $1",
    )
    .bind(ds_id)
    .bind(&at)
    .execute(db)
    .await?;
    Ok(created)
}

#[derive(Debug, Deserialize)]
struct EntitiesQuery {
    include_fields: Option<String>,
    active_only: Option<String>,
}

/// `GET /api/data-sources/{id}/entities` — at most 500, as in Node.
async fn entity_list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<EntitiesQuery>,
) -> Result<Response> {
    let fail = |status: StatusCode, m: &str| response::error_no_code(status, m);
    if session.is_none() {
        return Ok(fail(StatusCode::UNAUTHORIZED, "Unauthorized"));
    }
    let db = pool(&ctx);
    match sqlx::query("SELECT id FROM data_sources WHERE id = $1 AND is_deleted = false")
        .bind(&id)
        .fetch_optional(db)
        .await
    {
        Ok(Some(_)) => {}
        Ok(None) => return Ok(fail(StatusCode::NOT_FOUND, "Data source not found")),
        Err(e) => return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())),
    }
    let include_hidden = q.active_only.as_deref() == Some("false");
    let (mut list, total) = match entities::list(db, &id, include_hidden, 1, 500).await {
        Ok(r) => r,
        Err(e) => return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())),
    };
    if q.include_fields.as_deref() == Some("true") {
        let mut with_fields = Vec::with_capacity(list.len());
        for e in &list {
            let eid = e.get("id").and_then(Value::as_str).unwrap_or_default();
            match entities::get_by_id(db, eid).await {
                Ok(Some(full)) => with_fields.push(full),
                Ok(None) => {}
                Err(e) => return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())),
            }
        }
        list = with_fields;
    }
    Ok(response::ok(json!({ "entities": list, "total": total })))
}

/// `GET /api/data-sources/{id}/usage` — Node's stub, zeros for any live
/// data source (MIGRATION_PLAN.md §9, P-8).
async fn usage(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let zeros = json!({ "queries": 0, "reports": 0, "charts": 0 });
    match sqlx::query("SELECT id FROM data_sources WHERE id = $1 AND is_deleted = false")
        .bind(&id)
        .fetch_optional(pool(&ctx))
        .await
    {
        Ok(None) => Ok(not_found()),
        // Node answers success with zeros on an error too.
        Ok(Some(_)) | Err(_) => Ok(response::ok(zeros)),
    }
}

/// An `/active` row without its ciphertext (D-18).
fn active_row(row: &sqlx::postgres::PgRow) -> Value {
    let mut v = pg_row_to_json(row);
    if let Some(o) = v.as_object_mut() {
        o.shift_remove("connection_config");
    }
    v
}

/// `GET /api/data-sources/active` — the first active data source.
async fn active_get(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    // Node takes element 0 of an unordered select; `name` makes it stable.
    match sqlx::query(
        "SELECT * FROM data_sources WHERE is_active = true AND is_deleted = false ORDER BY name ASC LIMIT 1",
    )
    .fetch_optional(pool(&ctx))
    .await
    {
        Ok(row) => Ok(response::ok(
            json!({ "activeDataSource": row.as_ref().map_or(Value::Null, active_row) }),
        )),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching active data source");
            Ok(response::error_no_code(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch active data source",
            ))
        }
    }
}

/// `POST /api/data-sources/active` — validate a choice of active data source.
async fn active_post(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let failed = || {
        response::error_no_code(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to set active data source",
        )
    };
    let Some(body) = parse_body(&body) else {
        return Ok(failed());
    };
    let Some(ds_id) = body
        .get("dataSourceId")
        .filter(|v| js::truthy(Some(v)))
        .and_then(js::text)
    else {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "dataSourceId is required",
        ));
    };
    match sqlx::query("SELECT * FROM data_sources WHERE id = $1 AND is_active = true AND is_deleted = false")
        .bind(&ds_id)
        .fetch_optional(pool(&ctx))
        .await
    {
        Ok(Some(row)) => Ok(response::ok(json!({ "activeDataSource": active_row(&row) }))),
        Ok(None) => Ok(response::error_no_code(
            StatusCode::NOT_FOUND,
            "Data source not found",
        )),
        Err(_) => Ok(failed()),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/data-sources")
        .add("/", get(list).post(create))
        .add("/active", get(active_get).post(active_post))
        .add("/test", post(test))
        .add("/{id}", get(show).put(put).patch(patch).delete(destroy))
        .add("/{id}/inspect", post(inspect))
        .add("/{id}/entities", get(entity_list))
        .add("/{id}/usage", get(usage))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_passwords() {
        let c = redact_config(json!({"host": "h", "password": "secret"}));
        assert_eq!(c, json!({"host": "h"}));
        let c = redact_config(json!({"connectionString": "postgresql://u:secret@h:5432/db"}));
        assert_eq!(
            c,
            json!({"connectionString": "postgresql://u:********@h:5432/db"})
        );
    }

    #[test]
    fn keeps_the_stored_password_only_for_the_same_target() {
        let stored = json!({"host": "db", "port": 5432, "database": "d", "user": "u", "password": "secret"});
        let mut same = json!({"host": "db", "port": 5432, "database": "d", "user": "u"});
        keep_stored_password(&mut same, Some(stored.clone()));
        assert_eq!(same["password"], "secret");
        let mut moved =
            json!({"host": "attacker.example", "port": 5432, "database": "d", "user": "u", "password": ""});
        keep_stored_password(&mut moved, Some(stored.clone()));
        assert_eq!(moved["password"], "");
        let mut typed = json!({"host": "db", "port": 5432, "database": "d", "user": "u", "password": "new"});
        keep_stored_password(&mut typed, Some(stored));
        assert_eq!(typed["password"], "new");
    }

    #[test]
    fn checks_every_host_a_config_names() {
        assert_eq!(config_hosts(&json!({"host": "db.example"})), vec!["db.example"]);
        assert_eq!(
            config_hosts(
                &json!({"host": "8.8.8.8", "connectionString": "postgresql://u:p@169.254.169.254/db"})
            ),
            vec!["8.8.8.8", "169.254.169.254"]
        );
        assert!(config_hosts(&json!({"filename": "x.db"})).is_empty());
    }

    #[test]
    fn rejects_unparsable_connection_strings() {
        assert!(parse_pg_connection_string("not a url").is_err());
        assert_eq!(
            parse_pg_connection_string("postgresql://h/db").unwrap(),
            json!({"connectionString": "postgresql://h/db"})
        );
    }
}
