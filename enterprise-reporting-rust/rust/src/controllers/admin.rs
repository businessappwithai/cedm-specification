//! `/api/admin/*` — twins of `src/routes/api/admin/{users,roles,permissions,
//! logs-permissions}.ts`, the REST twins of the user and role server functions
//! in `src/server-fns/admin.ts`, and the role routes the roles screen calls.
//!
//! Every route needs an administrator (`isAdmin`: a role named admin or
//! administrator, or one carrying `*` or `admin:*`), except changing your own
//! password.
//!
//! Server-function twins answer with the function's return value and, on
//! failure, `{ success: false, error: { message } }` carrying the message the
//! function throws, which the forwarder re-throws. They audit a failure the
//! way `withErrorHandler` does.
//!
//! Deliberate differences (MIGRATION_PLAN.md §9):
//! - D-28: creating a user writes its `auth_accounts` credential. Node writes
//!   only `users.password_hash`, which Better Auth never reads, so a new user
//!   cannot sign in until the next restart's bootstrap backfill copies it.
//! - D-32: changing your own password keeps the session you changed it from.
//!   Node deletes every session of the user, the caller's included.
//! - D-33: `POST /roles`, `PUT`/`DELETE /roles/{id}` and
//!   `GET`/`POST /roles/{id}/permissions` exist. The roles screen calls them
//!   and Node has none of them, so creating, editing or deleting a role there
//!   fails.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};

use super::support::parse_body;
use crate::{
    auth::{better_auth as ba, CurrentSession, Session},
    common::{db::pg_rows_to_json, db::pool, response, time::now_iso},
    permissions::ownership::is_admin,
    security::audit::{log_audit, AuditEntry},
};

fn db_err(e: &sqlx::Error) -> Error {
    Error::string(&e.to_string())
}

/// The Node admin routes' refusals: `{ success: false, error: { message } }`.
fn refuse(status: StatusCode, message: &str) -> Response {
    response::error_no_code(status, message)
}

/// Signed in and an administrator, or the route's 401/403.
async fn require_admin(
    db: &PgPool,
    session: Option<&Session>,
) -> Result<std::result::Result<String, Response>> {
    let Some(s) = session else {
        return Ok(Err(refuse(StatusCode::UNAUTHORIZED, "Not authenticated")));
    };
    if !is_admin(db, &s.user.id).await.map_err(|e| db_err(&e))? {
        return Ok(Err(refuse(StatusCode::FORBIDDEN, "Insufficient permissions")));
    }
    Ok(Ok(s.user.id.clone()))
}

// ── Node route twins ─────────────────────────────────────────────────────────

/// `GET /api/admin/users` — every user, newest first, credential columns never
/// selected. Unpaginated as in Node (P-16).
async fn users(State(ctx): State<AppContext>, CurrentSession(session): CurrentSession) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    match sqlx::query(
        "SELECT id, email, display_name, avatar_url, email_verified, is_active, created_at, updated_at \
         FROM users ORDER BY created_at DESC",
    )
    .fetch_all(db)
    .await
    {
        Ok(rows) => Ok(response::ok(json!(pg_rows_to_json(&rows)))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching users");
            Ok(refuse(StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch users"))
        }
    }
}

/// `GET /api/admin/roles` — every role, as stored.
async fn roles(State(ctx): State<AppContext>, CurrentSession(session): CurrentSession) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    match sqlx::query("SELECT * FROM roles").fetch_all(db).await {
        Ok(rows) => Ok(response::ok(json!(pg_rows_to_json(&rows)))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching roles");
            Ok(refuse(StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch roles"))
        }
    }
}

/// `GET /api/admin/permissions` — every resource grant with its role's name.
async fn list_grants(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    match sqlx::query(
        "SELECT rp.id, rp.resource_type, rp.resource_id, rp.role_id, r.name AS role_name, rp.permission_level, rp.created_at \
         FROM resource_permissions rp LEFT JOIN roles r ON r.id = rp.role_id ORDER BY rp.created_at DESC",
    )
    .fetch_all(db)
    .await
    {
        Ok(rows) => Ok(response::ok(json!(pg_rows_to_json(&rows)))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching permissions");
            Ok(refuse(StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch permissions"))
        }
    }
}

fn non_empty_str<'a>(b: &'a Value, key: &str) -> Option<&'a str> {
    b.get(key).and_then(Value::as_str).filter(|s| !s.is_empty())
}

/// `POST /api/admin/permissions` — grant a role a level on one resource.
async fn create_grant(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    let Some(b) = parse_body(&body) else {
        return Ok(refuse(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to create permission",
        ));
    };
    let (Some(rt), Some(rid), Some(role), Some(level)) = (
        non_empty_str(&b, "resourceType"),
        non_empty_str(&b, "resourceId"),
        non_empty_str(&b, "roleId"),
        non_empty_str(&b, "permissionLevel"),
    ) else {
        return Ok(refuse(
            StatusCode::BAD_REQUEST,
            "resourceType, resourceId, roleId, and permissionLevel are required",
        ));
    };
    let id = uuid::Uuid::new_v4().to_string();
    let r = sqlx::query(
        "INSERT INTO resource_permissions (id, resource_type, resource_id, role_id, permission_level, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(rt)
    .bind(rid)
    .bind(role)
    .bind(level)
    .bind(now_iso())
    .execute(db)
    .await;
    Ok(match r {
        Ok(_) => response::ok(json!({ "id": id })),
        Err(e) => {
            tracing::error!(error = %e, "Error creating permission");
            refuse(StatusCode::INTERNAL_SERVER_ERROR, "Failed to create permission")
        }
    })
}

/// `DELETE /api/admin/permissions` — `{ id }` in the body.
async fn delete_grant(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    let Some(b) = parse_body(&body) else {
        return Ok(refuse(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to delete permission",
        ));
    };
    let Some(id) = non_empty_str(&b, "id") else {
        return Ok(refuse(StatusCode::BAD_REQUEST, "id is required"));
    };
    Ok(
        match sqlx::query("DELETE FROM resource_permissions WHERE id = $1")
            .bind(id)
            .execute(db)
            .await
        {
            Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
            Err(e) => {
                tracing::error!(error = %e, "Error deleting permission");
                refuse(StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete permission")
            }
        },
    )
}

/// The logs-permissions routes' refusals carry a code.
fn coded(status: StatusCode, code: &str, message: &str) -> Response {
    response::error(status, code, message)
}

async fn require_admin_coded(
    db: &PgPool,
    session: Option<&Session>,
) -> Result<std::result::Result<(), Response>> {
    let Some(s) = session else {
        return Ok(Err(coded(
            StatusCode::UNAUTHORIZED,
            "UNAUTHORIZED",
            "Not authenticated",
        )));
    };
    if !is_admin(db, &s.user.id).await.map_err(|e| db_err(&e))? {
        return Ok(Err(coded(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            "Insufficient permissions",
        )));
    }
    Ok(Ok(()))
}

/// `GET /api/admin/logs-permissions`. Node parity (P-17): `app_settings` is in
/// no schema, so this fails with PostgreSQL's message; and were the table
/// there, `value === "true" || true` would answer `true` whatever it held.
async fn logs_permissions(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin_coded(db, session.as_ref()).await? {
        return Ok(r);
    }
    Ok(
        match sqlx::query("SELECT * FROM app_settings WHERE key = 'logs_visible_to_users'")
            .fetch_optional(db)
            .await
        {
            Ok(_) => response::ok(json!({ "logsVisibleToUsers": true })),
            Err(e) => coded(StatusCode::INTERNAL_SERVER_ERROR, "ERROR", &pg_message(&e)),
        },
    )
}

/// `PUT /api/admin/logs-permissions` (P-17: fails the same way).
async fn set_logs_permissions(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin_coded(db, session.as_ref()).await? {
        return Ok(r);
    }
    let Some(b) = parse_body(&body) else {
        return Ok(coded(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERROR",
            "Unexpected end of JSON input",
        ));
    };
    let visible = crate::common::js::truthy(b.get("logsVisibleToUsers"));
    let now = now_iso();
    let r = async {
        let mut tx = db.begin().await?;
        sqlx::query("DELETE FROM app_settings WHERE key = 'logs_visible_to_users'")
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO app_settings (key, value, created_at, updated_at) VALUES ('logs_visible_to_users', $1, $2, $2)",
        )
        .bind(if visible { "true" } else { "false" })
        .bind(&now)
        .execute(&mut *tx)
        .await?;
        tx.commit().await
    }
    .await;
    Ok(match r {
        Ok(()) => response::raw(StatusCode::OK, &json!({ "success": true })),
        Err(e) => coded(StatusCode::INTERNAL_SERVER_ERROR, "ERROR", &pg_message(&e)),
    })
}

/// PostgreSQL's own message, as node-pg's `error.message` carries it.
fn pg_message(e: &sqlx::Error) -> String {
    e.as_database_error()
        .map_or_else(|| e.to_string(), |d| d.message().to_string())
}

// ── Server-function twins ────────────────────────────────────────────────────

/// Where a server function records its failures (`withErrorHandler`'s context).
struct FnContext {
    action: &'static str,
    resource_type: &'static str,
    details: Value,
}

impl FnContext {
    fn op(operation: &str, extra: &[(&str, Value)]) -> Self {
        let mut d = Map::new();
        d.insert("operation".into(), json!(operation));
        for (k, v) in extra {
            if !v.is_null() {
                d.insert((*k).into(), v.clone());
            }
        }
        Self {
            action: "execute",
            resource_type: "setting",
            details: Value::Object(d),
        }
    }
}

/// A server function's failure: audited as `withErrorHandler` does, answered
/// with the message it throws.
async fn fn_fail(db: &PgPool, user_id: &str, cx: &FnContext, status: StatusCode, message: &str) -> Response {
    let mut details = Map::new();
    details.insert(
        "error".into(),
        json!(message.chars().take(200).collect::<String>()),
    );
    details.insert("code".into(), json!("UNHANDLED_ERROR"));
    details.insert("action".into(), json!(cx.action));
    if let Value::Object(extra) = &cx.details {
        for (k, v) in extra {
            details.insert(k.clone(), v.clone());
        }
    }
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user_id),
            action: "execute",
            resource_type: cx.resource_type,
            details: Some(Value::Object(details)),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "[Audit Log Failure]");
    }
    refuse(status, message)
}

/// `requireAuth()` then `isAdmin`: `Err` is the response to send.
async fn fn_admin(
    db: &PgPool,
    session: Option<&Session>,
    cx: &FnContext,
) -> Result<std::result::Result<String, Response>> {
    let Some(s) = session else {
        return Ok(Err(refuse(StatusCode::UNAUTHORIZED, "UNAUTHORIZED")));
    };
    if !is_admin(db, &s.user.id).await.map_err(|e| db_err(&e))? {
        return Ok(Err(fn_fail(
            db,
            &s.user.id,
            cx,
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
        )
        .await));
    }
    Ok(Ok(s.user.id.clone()))
}

async fn audit(
    db: &PgPool,
    user_id: &str,
    action: &str,
    resource_type: &str,
    id: &str,
    details: Option<Value>,
) {
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user_id),
            action,
            resource_type,
            resource_id: Some(id),
            details,
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
}

#[derive(Debug, Deserialize)]
struct PageQuery {
    page: Option<i64>,
    #[serde(rename = "pageSize")]
    page_size: Option<i64>,
}

/// `listUsers` → `GET /api/admin/users/page?page=&pageSize=`.
async fn list_users(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext {
        action: "listUsers",
        resource_type: "user",
        details: json!({ "operation": "list" }),
    };
    let user = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let page = q.page.unwrap_or(0).max(0);
    let page_size = q.page_size.unwrap_or(20).clamp(1, 100);
    let run = async {
        let rows = sqlx::query(
            "SELECT id, email, display_name, avatar_url, is_active, created_at, updated_at FROM users \
             ORDER BY created_at DESC OFFSET $1 LIMIT $2",
        )
        .bind(page * page_size)
        .bind(page_size)
        .fetch_all(db)
        .await?;
        let mut items = pg_rows_to_json(&rows);
        for item in &mut items {
            let id = item["id"].as_str().unwrap_or_default().to_string();
            let roles = sqlx::query(
                "SELECT r.id, r.name FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1",
            )
            .bind(&id)
            .fetch_all(db)
            .await?;
            item["roles"] = json!(pg_rows_to_json(&roles));
        }
        let total: i64 = sqlx::query_scalar("SELECT COUNT(id) FROM users")
            .fetch_one(db)
            .await?;
        Ok::<_, sqlx::Error>((items, total))
    };
    Ok(match run.await {
        Ok((items, total)) => response::raw(
            StatusCode::OK,
            &json!({
                "items": items,
                "meta": {
                    "total": total,
                    "page": page,
                    "pageSize": page_size,
                    "totalPages": (total + page_size - 1) / page_size,
                },
            }),
        ),
        Err(e) => fn_fail(db, &user, &cx, StatusCode::INTERNAL_SERVER_ERROR, &pg_message(&e)).await,
    })
}

/// `getUser` → `GET /api/admin/users/{id}`.
async fn get_user(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("getUser", &[("userId", json!(id))]);
    let user = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let rows = sqlx::query(
        "SELECT id, email, display_name, avatar_url, is_active, created_at, updated_at FROM users WHERE id = $1",
    )
        .bind(&id)
        .fetch_all(db)
        .await
        .map_err(|e| db_err(&e))?;
    Ok(match pg_rows_to_json(&rows).into_iter().next() {
        Some(u) => response::raw(StatusCode::OK, &u),
        None => fn_fail(db, &user, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await,
    })
}

fn str_ids(v: Option<&Value>) -> Option<Vec<String>> {
    v.and_then(Value::as_array)
        .map(|a| a.iter().filter_map(|x| x.as_str().map(str::to_string)).collect())
}

async fn assign_roles(
    tx: &mut sqlx::PgConnection,
    user_id: &str,
    role_ids: &[String],
) -> std::result::Result<(), sqlx::Error> {
    for role in role_ids {
        sqlx::query("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(role)
            .bind(now_iso())
            .execute(&mut *tx)
            .await?;
    }
    Ok(())
}

/// `createUser` → `POST /api/admin/users`: `{ email, password, displayName,
/// isActive?, roleIds? }` (already through the server function's schema).
async fn create_user(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let b = parse_body(&body).unwrap_or(Value::Null);
    let email = b
        .get("email")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_lowercase();
    let cx = FnContext::op("createUser", &[("email", json!(email))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let password = b
        .get("password")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let display_name = b
        .get("displayName")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    if !ba::is_valid_email(&email) || password.chars().count() < 8 || display_name.is_empty() {
        return Ok(fn_fail(db, &admin, &cx, StatusCode::UNPROCESSABLE_ENTITY, "Invalid input").await);
    }
    let exists: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
        .bind(&email)
        .fetch_optional(db)
        .await
        .map_err(|e| db_err(&e))?;
    if exists.is_some() {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::CONFLICT,
            "CONFLICT: User with this email already exists",
        )
        .await);
    }
    let is_active = b.get("isActive").and_then(Value::as_bool).unwrap_or(true);
    let role_ids = str_ids(b.get("roleIds")).unwrap_or_default();
    let cost = ba::bcrypt_cost();
    let hash = tokio::task::spawn_blocking(move || bcrypt::hash(password, cost))
        .await
        .map_err(|e| Error::string(&e.to_string()))?
        .map_err(|e| Error::string(&e.to_string()))?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let run = async {
        let mut tx = db.begin().await?;
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, display_name, avatar_url, is_active, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, NULL, $5, $6, $6)",
        )
        .bind(&id)
        .bind(&email)
        .bind(&hash)
        .bind(&display_name)
        .bind(is_active)
        .bind(&now)
        .execute(&mut *tx)
        .await?;
        // D-28: the credential Better Auth reads, so the user can sign in now.
        sqlx::query(
            "INSERT INTO auth_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) \
             VALUES ($1, $2, $2, 'credential', $3, NOW(), NOW())",
        )
        .bind(format!("cred_{id}"))
        .bind(&id)
        .bind(&hash)
        .execute(&mut *tx)
        .await?;
        assign_roles(&mut tx, &id, &role_ids).await?;
        tx.commit().await
    };
    if let Err(e) = run.await {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::INTERNAL_SERVER_ERROR,
            &pg_message(&e),
        )
        .await);
    }
    audit(
        db,
        &admin,
        "create",
        "user",
        &id,
        Some(json!({ "email": email, "displayName": display_name })),
    )
    .await;
    Ok(response::raw(StatusCode::OK, &json!({ "id": id })))
}

/// `updateUser` → `PUT /api/admin/users/{id}`: `{ email?, displayName?,
/// isActive?, roleIds? }`.
async fn update_user(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("updateUser", &[("userId", json!(id))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let b = parse_body(&body).unwrap_or(Value::Null);
    let exists: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE id = $1")
        .bind(&id)
        .fetch_optional(db)
        .await
        .map_err(|e| db_err(&e))?;
    if exists.is_none() {
        return Ok(fn_fail(db, &admin, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await);
    }
    let email = b.get("email").and_then(Value::as_str).map(str::to_lowercase);
    let display_name = b.get("displayName").and_then(Value::as_str);
    let is_active = b.get("isActive").and_then(Value::as_bool);
    let role_ids = str_ids(b.get("roleIds"));
    let run = async {
        let mut tx = db.begin().await?;
        sqlx::query(
            "UPDATE users SET updated_at = $2, email = COALESCE($3, email), \
                display_name = COALESCE($4, display_name), is_active = COALESCE($5, is_active) WHERE id = $1",
        )
        .bind(&id)
        .bind(now_iso())
        .bind(&email)
        .bind(display_name)
        .bind(is_active)
        .execute(&mut *tx)
        .await?;
        if let Some(roles) = &role_ids {
            sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
                .bind(&id)
                .execute(&mut *tx)
                .await?;
            assign_roles(&mut tx, &id, roles).await?;
        }
        tx.commit().await
    };
    if let Err(e) = run.await {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::INTERNAL_SERVER_ERROR,
            &pg_message(&e),
        )
        .await);
    }
    let details = email.map(|e| json!({ "email": e })).unwrap_or_else(|| json!({}));
    audit(db, &admin, "update", "user", &id, Some(details)).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `deleteUser` → `DELETE /api/admin/users/{id}`. Never yourself.
async fn delete_user(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("deleteUser", &[("userId", json!(id))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    if id == admin {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::FORBIDDEN,
            "FORBIDDEN: Cannot delete your own account",
        )
        .await);
    }
    let exists: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE id = $1")
        .bind(&id)
        .fetch_optional(db)
        .await
        .map_err(|e| db_err(&e))?;
    if exists.is_none() {
        return Ok(fn_fail(db, &admin, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await);
    }
    let run = async {
        let mut tx = db.begin().await?;
        sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
            .bind(&id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(&id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await
    };
    if let Err(e) = run.await {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::INTERNAL_SERVER_ERROR,
            &pg_message(&e),
        )
        .await);
    }
    audit(db, &admin, "delete", "user", &id, None).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `changePassword` → `POST /api/admin/users/{id}/password`:
/// `{ currentPassword, newPassword }`. An administrator, or the user.
async fn change_password(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("changePassword", &[("userId", json!(id))]);
    let Some(s) = session.as_ref() else {
        return Ok(refuse(StatusCode::UNAUTHORIZED, "UNAUTHORIZED"));
    };
    let me = s.user.id.clone();
    if me != id && !is_admin(db, &me).await.map_err(|e| db_err(&e))? {
        return Ok(fn_fail(db, &me, &cx, StatusCode::FORBIDDEN, "FORBIDDEN").await);
    }
    let b = parse_body(&body).unwrap_or(Value::Null);
    let current = b
        .get("currentPassword")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let new = b
        .get("newPassword")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    if current.chars().count() < 8 || new.chars().count() < 8 || current == new {
        return Ok(fn_fail(db, &me, &cx, StatusCode::UNPROCESSABLE_ENTITY, "Invalid input").await);
    }
    let credential = sqlx::query(
        "SELECT id, password FROM auth_accounts WHERE user_id = $1 AND provider_id = 'credential' LIMIT 1",
    )
    .bind(&id)
    .fetch_optional(db)
    .await
    .map_err(|e| db_err(&e))?;
    let Some((cred_id, hash)) = credential
        .and_then(|r| {
            r.get::<Option<String>, _>("password")
                .map(|p| (r.get::<String, _>("id"), p))
        })
        .filter(|(_, p)| !p.is_empty())
    else {
        return Ok(fn_fail(db, &me, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await);
    };
    let ok = tokio::task::spawn_blocking(move || bcrypt::verify(current, &hash).unwrap_or(false))
        .await
        .unwrap_or(false);
    if !ok {
        return Ok(fn_fail(
            db,
            &me,
            &cx,
            StatusCode::UNAUTHORIZED,
            "UNAUTHORIZED: Current password is incorrect",
        )
        .await);
    }
    let cost = ba::bcrypt_cost();
    let new_hash = tokio::task::spawn_blocking(move || bcrypt::hash(new, cost))
        .await
        .map_err(|e| Error::string(&e.to_string()))?
        .map_err(|e| Error::string(&e.to_string()))?;
    // D-32: changing your own password keeps the session you are using.
    let keep = if me == id {
        let cookies = headers
            .get_all(header::COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok())
            .collect::<Vec<_>>()
            .join("; ");
        crate::common::settings::auth_secret()
            .ok()
            .and_then(|secret| ba::signed_cookie(&cookies, "session_token", &secret))
    } else {
        None
    };
    let run = async {
        let mut tx = db.begin().await?;
        sqlx::query("UPDATE auth_accounts SET password = $2, updated_at = NOW() WHERE id = $1")
            .bind(&cred_id)
            .bind(&new_hash)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM auth_sessions WHERE user_id = $1 AND token IS DISTINCT FROM $2")
            .bind(&id)
            .bind(&keep)
            .execute(&mut *tx)
            .await?;
        tx.commit().await
    };
    if let Err(e) = run.await {
        return Ok(fn_fail(db, &me, &cx, StatusCode::INTERNAL_SERVER_ERROR, &pg_message(&e)).await);
    }
    audit(
        db,
        &me,
        "update",
        "user",
        &id,
        Some(json!({ "operation": "changePassword" })),
    )
    .await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// A role row with `permissions` parsed, as `listRoles`/`getRole` return it.
/// `JSON.parse` of a malformed value throws, and so does this.
fn parse_role(mut role: Value) -> std::result::Result<Value, String> {
    if let Some(Value::String(p)) = role.get("permissions") {
        let parsed: Value = serde_json::from_str(p).map_err(|e| e.to_string())?;
        role["permissions"] = parsed;
    }
    Ok(role)
}

/// `listRoles` → `GET /api/admin/roles/parsed`.
async fn list_roles(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("listRoles", &[]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let rows = sqlx::query("SELECT * FROM roles ORDER BY name ASC")
        .fetch_all(db)
        .await
        .map_err(|e| db_err(&e))?;
    match pg_rows_to_json(&rows)
        .into_iter()
        .map(parse_role)
        .collect::<std::result::Result<Vec<_>, _>>()
    {
        Ok(list) => Ok(response::raw(StatusCode::OK, &json!(list))),
        Err(m) => Ok(fn_fail(db, &admin, &cx, StatusCode::INTERNAL_SERVER_ERROR, &m).await),
    }
}

/// `getRole` → `GET /api/admin/roles/{id}`.
async fn get_role(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("getRole", &[("roleId", json!(id))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let row = super::support::find_by_id(db, "roles", &id)
        .await
        .map_err(|e| db_err(&e))?;
    Ok(match row.map(parse_role) {
        Some(Ok(r)) => response::raw(StatusCode::OK, &r),
        Some(Err(m)) => fn_fail(db, &admin, &cx, StatusCode::INTERNAL_SERVER_ERROR, &m).await,
        None => fn_fail(db, &admin, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await,
    })
}

/// A role's `permissions` as the two callers send them: an array (the server
/// function) or its JSON text (the roles screen). Stored as JSON text.
fn permissions_text(v: Option<&Value>) -> std::result::Result<Option<String>, String> {
    let list = match v {
        None | Some(Value::Null) => return Ok(None),
        Some(Value::String(s)) => {
            serde_json::from_str::<Value>(s).map_err(|_| "Invalid permissions".to_string())?
        }
        Some(other) => other.clone(),
    };
    match list {
        Value::Array(items) if items.iter().all(Value::is_string) => {
            Ok(Some(Value::Array(items).to_string()))
        }
        _ => Err("Invalid permissions".into()),
    }
}

fn check_role_fields(
    name: Option<&str>,
    description: Option<&str>,
    require_name: bool,
) -> std::result::Result<(), String> {
    match name {
        None if require_name => return Err("Name is required".into()),
        Some("") => return Err("Name is required".into()),
        Some(n) if n.chars().count() > 255 => return Err("Name too long".into()),
        _ => {}
    }
    if description.is_some_and(|d| d.chars().count() > 1000) {
        return Err("Description too long".into());
    }
    Ok(())
}

/// `createRole` → `POST /api/admin/roles` (also the roles screen's create,
/// D-33): `{ name, description?, permissions }` → `{ id }`.
async fn create_role(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let b = parse_body(&body).unwrap_or(Value::Null);
    let name = b.get("name").and_then(Value::as_str);
    let cx = FnContext::op("createRole", &[("name", json!(name))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let description = b.get("description").and_then(Value::as_str);
    let perms = match check_role_fields(name, description, true)
        .and_then(|()| permissions_text(b.get("permissions")))
    {
        Ok(p) => p.unwrap_or_else(|| "[]".into()),
        Err(m) => return Ok(fn_fail(db, &admin, &cx, StatusCode::UNPROCESSABLE_ENTITY, &m).await),
    };
    let id = uuid::Uuid::new_v4().to_string();
    let r = sqlx::query(
        "INSERT INTO roles (id, name, description, permissions, created_at) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(&id)
    .bind(name)
    .bind(description)
    .bind(&perms)
    .bind(now_iso())
    .execute(db)
    .await;
    if let Err(e) = r {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::INTERNAL_SERVER_ERROR,
            &pg_message(&e),
        )
        .await);
    }
    audit(db, &admin, "create", "role", &id, Some(json!({ "name": name }))).await;
    Ok(response::raw(StatusCode::OK, &json!({ "id": id })))
}

/// `updateRole` → `PUT /api/admin/roles/{id}` (also the screen's edit, D-33).
async fn update_role(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("updateRole", &[("roleId", json!(id))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let b = parse_body(&body).unwrap_or(Value::Null);
    let name = b.get("name").and_then(Value::as_str);
    let description = b.get("description").and_then(Value::as_str);
    let perms = match check_role_fields(name, description, false)
        .and_then(|()| permissions_text(b.get("permissions")))
    {
        Ok(p) => p,
        Err(m) => return Ok(fn_fail(db, &admin, &cx, StatusCode::UNPROCESSABLE_ENTITY, &m).await),
    };
    if super::support::find_by_id(db, "roles", &id)
        .await
        .map_err(|e| db_err(&e))?
        .is_none()
    {
        return Ok(fn_fail(db, &admin, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await);
    }
    if name.is_some() || description.is_some() || perms.is_some() {
        let r = sqlx::query(
            "UPDATE roles SET name = COALESCE($2, name), description = COALESCE($3, description), \
                permissions = COALESCE($4, permissions) WHERE id = $1",
        )
        .bind(&id)
        .bind(name)
        .bind(description)
        .bind(&perms)
        .execute(db)
        .await;
        if let Err(e) = r {
            return Ok(fn_fail(
                db,
                &admin,
                &cx,
                StatusCode::INTERNAL_SERVER_ERROR,
                &pg_message(&e),
            )
            .await);
        }
    }
    let details = name.map(|n| json!({ "name": n })).unwrap_or_else(|| json!({}));
    audit(db, &admin, "update", "role", &id, Some(details)).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `deleteRole` → `DELETE /api/admin/roles/{id}`: refused while assigned.
async fn delete_role(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
) -> Result<Response> {
    let db = pool(&ctx);
    let cx = FnContext::op("deleteRole", &[("roleId", json!(id))]);
    let admin = match fn_admin(db, session.as_ref(), &cx).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    if super::support::find_by_id(db, "roles", &id)
        .await
        .map_err(|e| db_err(&e))?
        .is_none()
    {
        return Ok(fn_fail(db, &admin, &cx, StatusCode::NOT_FOUND, "NOT_FOUND").await);
    }
    let in_use: i64 = sqlx::query_scalar("SELECT COUNT(role_id) FROM user_roles WHERE role_id = $1")
        .bind(&id)
        .fetch_one(db)
        .await
        .map_err(|e| db_err(&e))?;
    if in_use > 0 {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::CONFLICT,
            "IN_USE: Cannot delete role that is assigned to users",
        )
        .await);
    }
    if let Err(e) = sqlx::query("DELETE FROM roles WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        return Ok(fn_fail(
            db,
            &admin,
            &cx,
            StatusCode::INTERNAL_SERVER_ERROR,
            &pg_message(&e),
        )
        .await);
    }
    audit(db, &admin, "delete", "role", &id, None).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// Resources the roles screen offers grants on. A picker, so bounded.
const RESOURCE_PICKER_LIMIT: i64 = 1000;

/// `GET /api/admin/roles/{id}/permissions` (D-33): the role's resource grants
/// and the reports, charts and dashboards it could be granted.
async fn role_grants(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = require_admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    if super::support::find_by_id(db, "roles", &id)
        .await
        .map_err(|e| db_err(&e))?
        .is_none()
    {
        return Ok(refuse(StatusCode::NOT_FOUND, "Role not found"));
    }
    let grants = sqlx::query("SELECT * FROM resource_permissions WHERE role_id = $1 ORDER BY created_at")
        .bind(&id)
        .fetch_all(db)
        .await
        .map_err(|e| db_err(&e))?;
    let mut resources = Map::new();
    for (key, table, kind) in [
        ("reports", "report_definitions", "report"),
        ("charts", "chart_definitions", "chart"),
        ("dashboards", "dashboard_layouts", "dashboard"),
    ] {
        let rows: Vec<(String, String)> = sqlx::query_as(sqlx::AssertSqlSafe(format!(
            "SELECT id, name FROM {table} WHERE is_deleted IS NOT TRUE ORDER BY name LIMIT {RESOURCE_PICKER_LIMIT}"
        )))
        .fetch_all(db)
        .await
        .map_err(|e| db_err(&e))?;
        resources.insert(
            key.into(),
            json!(rows
                .into_iter()
                .map(|(rid, name)| json!({ "id": rid, "title": name, "type": kind }))
                .collect::<Vec<_>>()),
        );
    }
    Ok(response::ok(json!({
        "resourcePermissions": pg_rows_to_json(&grants),
        "resources": resources,
    })))
}

const RESOURCE_TYPES: &[&str] = &["report", "chart", "dashboard", "data_source", "query", "job"];
const LEVELS: &[&str] = &["view", "edit", "admin", "delete", "execute"];

/// `POST /api/admin/roles/{id}/permissions` (D-33): replace the role's resource
/// grants with `{ permissions: [{ resource_type, resource_id, permission_level }] }`.
async fn set_role_grants(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let admin = match require_admin(db, session.as_ref()).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    if super::support::find_by_id(db, "roles", &id)
        .await
        .map_err(|e| db_err(&e))?
        .is_none()
    {
        return Ok(refuse(StatusCode::NOT_FOUND, "Role not found"));
    }
    let b = parse_body(&body).unwrap_or(Value::Null);
    let Some(list) = b.get("permissions").and_then(Value::as_array) else {
        return Ok(refuse(StatusCode::BAD_REQUEST, "permissions must be an array"));
    };
    let mut grants = Vec::with_capacity(list.len());
    for p in list {
        let (Some(rt), Some(rid), Some(level)) = (
            non_empty_str(p, "resource_type"),
            non_empty_str(p, "resource_id"),
            non_empty_str(p, "permission_level"),
        ) else {
            return Ok(refuse(
                StatusCode::BAD_REQUEST,
                "Each permission needs resource_type, resource_id and permission_level",
            ));
        };
        if !RESOURCE_TYPES.contains(&rt) || !LEVELS.contains(&level) {
            return Ok(refuse(
                StatusCode::BAD_REQUEST,
                "Invalid resource type or permission level",
            ));
        }
        grants.push((rt.to_string(), rid.to_string(), level.to_string()));
    }
    let now = now_iso();
    let run = async {
        let mut tx = db.begin().await?;
        sqlx::query("DELETE FROM resource_permissions WHERE role_id = $1")
            .bind(&id)
            .execute(&mut *tx)
            .await?;
        for (rt, rid, level) in &grants {
            sqlx::query(
                "INSERT INTO resource_permissions (id, resource_type, resource_id, role_id, permission_level, created_at) \
                 VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(rt)
            .bind(rid)
            .bind(&id)
            .bind(level)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        }
        tx.commit().await
    };
    if let Err(e) = run.await {
        tracing::error!(error = %e, "Error saving role permissions");
        return Ok(refuse(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to save role permissions",
        ));
    }
    audit(
        db,
        &admin,
        "update",
        "role",
        &id,
        Some(json!({ "operation": "setResourcePermissions", "count": grants.len() })),
    )
    .await;
    Ok(response::ok(json!({ "count": grants.len() })))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/admin")
        .add("/users", get(users).post(create_user))
        .add("/users/page", get(list_users))
        .add("/users/{id}", get(get_user).put(update_user).delete(delete_user))
        .add("/users/{id}/password", post(change_password))
        .add("/roles", get(roles).post(create_role))
        .add("/roles/parsed", get(list_roles))
        .add("/roles/{id}", get(get_role).put(update_role).delete(delete_role))
        .add("/roles/{id}/permissions", get(role_grants).post(set_role_grants))
        .add(
            "/permissions",
            get(list_grants).post(create_grant).delete(delete_grant),
        )
        .add(
            "/logs-permissions",
            get(logs_permissions).put(set_logs_permissions),
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permissions_accept_array_or_text() {
        assert_eq!(
            permissions_text(Some(&json!(["a:b"]))).unwrap().as_deref(),
            Some(r#"["a:b"]"#)
        );
        assert_eq!(
            permissions_text(Some(&json!(r#"["x:*"]"#))).unwrap().as_deref(),
            Some(r#"["x:*"]"#)
        );
        assert_eq!(permissions_text(None).unwrap(), None);
        assert!(permissions_text(Some(&json!("nope"))).is_err());
        assert!(permissions_text(Some(&json!([1]))).is_err());
    }

    #[test]
    fn role_fields() {
        assert!(check_role_fields(None, None, true).is_err());
        assert!(check_role_fields(None, None, false).is_ok());
        assert!(check_role_fields(Some(""), None, false).is_err());
        assert!(check_role_fields(Some("x"), Some(&"d".repeat(1001)), true).is_err());
    }
}
