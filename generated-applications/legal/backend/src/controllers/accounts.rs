//! `/api/accounts` — who can sign in, and what they hold.
//!
//! Generated: 2026-10-09T08:31:37.561Z
//! Project: legal
//!
//! **Why this is not `/api/sys/users`.** An account is two rows: `users`, the
//! credential store Loco's JWT auth reads, and `sys_user`, the dictionary
//! identity every access check reads, tied together by `users.sys_user_id`.
//! The generic `sys` endpoint writes one table at a time, so a user created
//! through it either could not sign in (no credential) or reached nothing (no
//! identity), and it cannot hash a password at all. This controller writes the
//! pair together, in one transaction, so neither half can exist without the
//! other.
//!
//! **Master role only.** Granting a role is granting access, so every verb
//! here goes through [`authz::require_account_admin`], the same gate that
//! guards dictionary writes.
//!
//! **The last administrator cannot be removed.** Deactivating, locking or
//! deleting the only active master account, or taking the master role off it,
//! would leave an application nobody can administer — and the only way back is
//! a shell on the server. Every mutation therefore runs under an advisory lock
//! and checks, after it has been applied, that an active master account still
//! exists; if the change removed the last one it is rolled back with a 409.
//! Checking the *result* rather than predicting it is what keeps the rule
//! correct for changes that touch several things at once, and the lock is what
//! stops two administrators each removing the other.
//!
//! **A disabled account stops working at once, tokens notwithstanding.** A JWT
//! is stateless and cannot be revoked, so the account's state is read on every
//! request instead: `authz::principal` resolves no roles for an inactive or
//! locked account, `/api/auth/login` refuses it, and `/api/auth/me` stops
//! recognising it.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::{PgConnection, PgPool, Row};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;
use crate::services::audit::{AuditEntry, AuditOperation, AuditService};
use crate::services::authz;

/// Serialises every account mutation. Any constant will do; this one is not
/// used by any other lock in the application (the audit chain has its own).
const ACCOUNT_LOCK: i64 = 0x0041_4343_4F55_4E54;

/// The credential column is NOT NULL on `sys_user` but is not the credential in
/// this stack — `users.password` is. See `tasks/ensure_admin.rs`.
const SYS_USER_PASSWORD_DISABLED: &str = "!";

const MIN_PASSWORD_LENGTH: usize = 8;
const MAX_PAGE_SIZE: i64 = 200;
const DEFAULT_PAGE_SIZE: i64 = 50;

/// One account as every verb returns it. Never carries a credential.
const ACCOUNT_SELECT: &str = r"
    SELECT s.sys_user_id,
           u.pid,
           s.name,
           s.email,
           COALESCE(s.is_active, false)           AS is_active,
           COALESCE(s.is_locked, false)           AS is_locked,
           COALESCE(s.is_system_user, false)      AS is_system_user,
           COALESCE(s.login_failure_count, 0)     AS login_failure_count,
           s.login_date,
           s.created_at,
           s.updated_at,
           (u.id IS NOT NULL)                     AS can_sign_in,
           COALESCE(
               jsonb_agg(
                   jsonb_build_object(
                       'id', r.sys_role_id,
                       'name', r.name,
                       'isMaster', COALESCE(r.is_master_role, false))
                   ORDER BY r.name)
               FILTER (WHERE r.sys_role_id IS NOT NULL),
               '[]'::jsonb)                       AS roles
      FROM sys_user s
      LEFT JOIN users u ON u.sys_user_id = s.sys_user_id
      LEFT JOIN sys_user_roles ur
             ON ur.sys_user_id = s.sys_user_id AND COALESCE(ur.is_active, true) = true
      LEFT JOIN sys_role r ON r.sys_role_id = ur.sys_role_id";

const ACCOUNT_GROUP: &str = " GROUP BY s.sys_user_id, u.pid, u.id";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateParams {
    pub name: String,
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub role_ids: Vec<Uuid>,
    #[serde(default = "default_true")]
    pub is_active: bool,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateParams {
    pub name: Option<String>,
    pub email: Option<String>,
    pub is_active: Option<bool>,
    pub is_locked: Option<bool>,
    /// The complete set of roles the account should hold. Absent leaves roles
    /// alone; an empty list takes them all away.
    pub role_ids: Option<Vec<Uuid>>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordParams {
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRoleParams {
    pub name: String,
    pub description: Option<String>,
    #[serde(default)]
    pub is_master_role: bool,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRoleParams {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_master_role: Option<bool>,
    pub is_active: Option<bool>,
}

const fn default_true() -> bool {
    true
}

fn invalid(errors: Vec<String>) -> AppError {
    AppError::Validation {
        message: "Validation failed".to_string(),
        errors,
    }
}

fn not_found() -> AppError {
    AppError::NotFound("No such account".to_string())
}

/// Resolve the caller and refuse anyone who is not a master-role administrator.
async fn admin_caller(pool: &PgPool, auth: &auth::JWTWithUser<users::Model>) -> AppResult<()> {
    authz::require_account_admin(&authz::principal(pool, &auth.user).await?)
}

fn clean_email(raw: &str) -> Result<String, String> {
    let email = raw.trim().to_lowercase();
    let well_formed = email.len() <= 255
        && email.split_once('@').is_some_and(|(local, domain)| {
            !local.is_empty()
                && domain.contains('.')
                && !domain.starts_with('.')
                && !domain.ends_with('.')
        })
        && !email.chars().any(char::is_whitespace);
    if well_formed {
        Ok(email)
    } else {
        Err("email must be a valid address".to_string())
    }
}

fn clean_name(raw: &str) -> Result<String, String> {
    let name = raw.trim();
    if name.is_empty() {
        Err("name is required".to_string())
    } else if name.chars().count() > 100 {
        Err("name must be at most 100 characters".to_string())
    } else {
        Ok(name.to_string())
    }
}

fn check_password(password: &str) -> Result<(), String> {
    if password.chars().count() < MIN_PASSWORD_LENGTH {
        Err(format!(
            "password must be at least {MIN_PASSWORD_LENGTH} characters"
        ))
    } else {
        Ok(())
    }
}

fn account_json(row: &sqlx::postgres::PgRow) -> AppResult<Value> {
    let roles: Value = row.try_get("roles")?;
    Ok(json!({
        "id": row.try_get::<Uuid, _>("sys_user_id")?,
        "pid": row.try_get::<Option<Uuid>, _>("pid")?,
        "name": row.try_get::<String, _>("name")?,
        "email": row.try_get::<String, _>("email")?,
        "isActive": row.try_get::<bool, _>("is_active")?,
        "isLocked": row.try_get::<bool, _>("is_locked")?,
        "isSystemUser": row.try_get::<bool, _>("is_system_user")?,
        "canSignIn": row.try_get::<bool, _>("can_sign_in")?,
        "loginFailureCount": row.try_get::<i32, _>("login_failure_count")?,
        "lastLogin": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("login_date")?,
        "createdAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("created_at")?,
        "updatedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("updated_at")?,
        "roles": roles,
    }))
}

async fn load_account(conn: &mut PgConnection, id: Uuid) -> AppResult<Option<Value>> {
    let sql = format!("{ACCOUNT_SELECT} WHERE s.sys_user_id = $1{ACCOUNT_GROUP}");
    let row = sqlx::query(sqlx::AssertSqlSafe(sql))
        .bind(id)
        .fetch_optional(conn)
        .await?;
    row.as_ref().map(account_json).transpose()
}

/// Accounts that can administer: active, unlocked, able to sign in, and holding
/// an active master role. The set the last-administrator rule protects.
async fn active_masters(conn: &mut PgConnection) -> AppResult<i64> {
    let count: i64 = sqlx::query_scalar(
        r"SELECT COUNT(DISTINCT s.sys_user_id)
            FROM sys_user s
            JOIN users u            ON u.sys_user_id = s.sys_user_id
            JOIN sys_user_roles ur  ON ur.sys_user_id = s.sys_user_id
                                   AND COALESCE(ur.is_active, true) = true
            JOIN sys_role r         ON r.sys_role_id = ur.sys_role_id
                                   AND COALESCE(r.is_master_role, false) = true
                                   AND COALESCE(r.is_active, true) = true
           WHERE COALESCE(s.is_active, false) = true
             AND COALESCE(s.is_locked, false) = false",
    )
    .fetch_one(conn)
    .await?;
    Ok(count)
}

/// Roles must exist and be active; anything else is the caller's mistake.
async fn check_roles(conn: &mut PgConnection, wanted: &[Uuid]) -> AppResult<Vec<Uuid>> {
    let mut seen = HashSet::new();
    let unique: Vec<Uuid> = wanted
        .iter()
        .copied()
        .filter(|id| seen.insert(*id))
        .collect();
    if unique.is_empty() {
        return Ok(unique);
    }
    let found: Vec<Uuid> = sqlx::query_scalar(
        r"SELECT sys_role_id FROM sys_role
           WHERE sys_role_id = ANY($1) AND COALESCE(is_active, true) = true",
    )
    .bind(&unique)
    .fetch_all(conn)
    .await?;
    let found: HashSet<Uuid> = found.into_iter().collect();
    let missing: Vec<String> = unique
        .iter()
        .filter(|id| !found.contains(id))
        .map(|id| format!("role {id} does not exist or is not active"))
        .collect();
    if missing.is_empty() {
        Ok(unique)
    } else {
        Err(invalid(missing))
    }
}

/// Make the account hold exactly `roles`, leaving a grant that is already
/// there untouched (so its `created_at` stays the date it was first given).
async fn sync_roles(
    conn: &mut PgConnection,
    sys_user_id: Uuid,
    roles: &[Uuid],
    actor: &str,
) -> AppResult<()> {
    sqlx::query(
        r"DELETE FROM sys_user_roles WHERE sys_user_id = $1 AND NOT (sys_role_id = ANY($2))",
    )
    .bind(sys_user_id)
    .bind(roles)
    .execute(&mut *conn)
    .await?;
    for role in roles {
        sqlx::query(
            r"INSERT INTO sys_user_roles (
                   sys_user_roles_id, sys_user_id, sys_role_id,
                   entity_type, is_active, created_by, updated_by, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, 'U', TRUE, $3, $3, NOW(), NOW())
               ON CONFLICT (sys_user_id, sys_role_id)
               DO UPDATE SET is_active = TRUE, updated_by = $3, updated_at = NOW()",
        )
        .bind(sys_user_id)
        .bind(role)
        .bind(actor)
        .execute(&mut *conn)
        .await?;
    }
    sqlx::query(
        r"UPDATE sys_user
             SET default_sys_role_id = (
                   SELECT ur.sys_role_id FROM sys_user_roles ur
                    JOIN sys_role r ON r.sys_role_id = ur.sys_role_id
                   WHERE ur.sys_user_id = $1 ORDER BY r.name LIMIT 1)
           WHERE sys_user_id = $1",
    )
    .bind(sys_user_id)
    .execute(&mut *conn)
    .await?;
    Ok(())
}

async fn lock_accounts(conn: &mut PgConnection) -> AppResult<()> {
    sqlx::query("SELECT pg_advisory_xact_lock($1)")
        .bind(ACCOUNT_LOCK)
        .execute(conn)
        .await?;
    Ok(())
}

/// Fail — and so roll the transaction back — if a change that left the
/// application with no administrator was applied.
async fn ensure_administrator_remains(conn: &mut PgConnection, before: i64) -> AppResult<()> {
    if before > 0 && active_masters(conn).await? == 0 {
        return Err(AppError::Conflict(
            "That would leave the application with no active administrator. \
             Make another account an administrator first."
                .to_string(),
        ));
    }
    Ok(())
}

async fn record(
    ctx: &AppContext,
    caller: &users::Model,
    operation: AuditOperation,
    id: Uuid,
    before: Option<Value>,
    after: Option<Value>,
) {
    if let Some(audit) = ctx.shared_store.get::<AuditService>() {
        audit
            .record(&AuditEntry {
                entity_type: "sys_user".to_string(),
                entity_id: Some(id.to_string()),
                operation,
                before,
                after,
                user_id: caller.sys_user_id.map(|id| id.to_string()),
                user_email: Some(caller.email.clone()),
            })
            .await;
    }
}

/// `GET /api/accounts` — a page of accounts, with the roles each holds.
#[utoipa::path(
    get, path = "/api/accounts", tag = "accounts",
    security(("bearer" = [])),
    params(
        ("search" = Option<String>, Query, description = "Matches name or email, case-insensitively"),
        ("limit" = Option<i64>, Query, description = "Page size, at most 200 (default 50)"),
        ("offset" = Option<i64>, Query, description = "Rows to skip"),
    ),
    responses(
        (status = 200, description = "`{ data, total, limit, offset }`"),
        (status = 401, description = "No token"),
        (status = 403, description = "Requires the master role"),
    ),
)]
pub async fn list(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Query(params): Query<HashMap<String, String>>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;

    let limit = params
        .get("limit")
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(DEFAULT_PAGE_SIZE)
        .clamp(1, MAX_PAGE_SIZE);
    let offset = params
        .get("offset")
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(0)
        .max(0);
    // `%` and `_` in what the person typed are literals, not wildcards.
    let pattern = params
        .get("search")
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| {
            format!(
                "%{}%",
                s.replace('\\', "\\\\")
                    .replace('%', "\\%")
                    .replace('_', "\\_")
            )
        });

    let total: i64 = sqlx::query_scalar(
        r"SELECT COUNT(*) FROM sys_user s
           WHERE ($1::text IS NULL OR s.name ILIKE $1 OR s.email ILIKE $1)",
    )
    .bind(pattern.as_deref())
    .fetch_one(pool)
    .await?;

    let sql = format!(
        "{ACCOUNT_SELECT} WHERE ($1::text IS NULL OR s.name ILIKE $1 OR s.email ILIKE $1)\
         {ACCOUNT_GROUP} ORDER BY lower(s.name), s.sys_user_id LIMIT $2 OFFSET $3"
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(sql))
        .bind(pattern.as_deref())
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;
    let data = rows
        .iter()
        .map(account_json)
        .collect::<AppResult<Vec<_>>>()?;

    Ok(
        Json(json!({ "data": data, "total": total, "limit": limit, "offset": offset }))
            .into_response(),
    )
}

/// `GET /api/accounts/{id}` — one account.
#[utoipa::path(
    get, path = "/api/accounts/{id}", tag = "accounts",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The account's `sys_user_id`")),
    responses(
        (status = 200, description = "The account"),
        (status = 403, description = "Requires the master role"),
        (status = 404, description = "No such account"),
    ),
)]
pub async fn show(
    auth: auth::JWTWithUser<users::Model>,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    let mut conn = pool.acquire().await?;
    let account = load_account(&mut conn, id).await?.ok_or_else(not_found)?;
    Ok(Json(account).into_response())
}

/// `POST /api/accounts` — create a user who can sign in.
#[utoipa::path(
    post, path = "/api/accounts", tag = "accounts",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ name, email, password, roleIds?, isActive?, description? }`"),
    responses(
        (status = 201, description = "The new account"),
        (status = 400, description = "Invalid payload, or a role that does not exist"),
        (status = 403, description = "Requires the master role"),
        (status = 409, description = "That email is already in use"),
    ),
)]
pub async fn create(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateParams>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;

    let mut errors = Vec::new();
    let name = clean_name(&params.name).map_err(|e| errors.push(e)).ok();
    let email = clean_email(&params.email).map_err(|e| errors.push(e)).ok();
    if let Err(e) = check_password(&params.password) {
        errors.push(e);
    }
    let (Some(name), Some(email)) = (name, email) else {
        return Err(invalid(errors));
    };
    if !errors.is_empty() {
        return Err(invalid(errors));
    }

    let hashed = loco_rs::hash::hash_password(&params.password)
        .map_err(|err| AppError::Internal(anyhow::anyhow!(err)))?;
    let actor = auth.user.email.clone();

    let mut tx = pool.begin().await?;
    lock_accounts(&mut tx).await?;
    let roles = check_roles(&mut tx, &params.role_ids).await?;

    // Both tables key on email, so one check covers the pair and gives the
    // caller a sentence instead of a constraint name.
    let taken: bool = sqlx::query_scalar(
        r"SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = $1)
              OR EXISTS (SELECT 1 FROM sys_user WHERE lower(email) = $1)",
    )
    .bind(&email)
    .fetch_one(&mut *tx)
    .await?;
    if taken {
        return Err(AppError::Conflict(
            "An account with that email already exists".to_string(),
        ));
    }

    let sys_user_id: Uuid = sqlx::query_scalar(
        r"INSERT INTO sys_user (
               sys_user_id, name, email, password_hash, description,
               is_system_user, is_sales_rep, login_failure_count, is_locked,
               is_account_verified, entity_type, is_active,
               created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4,
                   FALSE, FALSE, 0, FALSE, TRUE, 'U', $5, $6, $6, NOW(), NOW())
           RETURNING sys_user_id",
    )
    .bind(&name)
    .bind(&email)
    .bind(SYS_USER_PASSWORD_DISABLED)
    .bind(params.description.as_deref())
    .bind(params.is_active)
    .bind(&actor)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        r"INSERT INTO users (pid, email, password, api_key, name, sys_user_id)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)",
    )
    .bind(&email)
    .bind(&hashed)
    .bind(format!("lo-{}", Uuid::new_v4()))
    .bind(&name)
    .bind(sys_user_id)
    .execute(&mut *tx)
    .await?;

    sync_roles(&mut tx, sys_user_id, &roles, &actor).await?;
    let account = load_account(&mut tx, sys_user_id)
        .await?
        .ok_or_else(not_found)?;
    tx.commit().await?;

    record(
        &ctx,
        &auth.user,
        AuditOperation::Create,
        sys_user_id,
        None,
        Some(account.clone()),
    )
    .await;
    Ok((StatusCode::CREATED, Json(account)).into_response())
}

/// `PATCH /api/accounts/{id}` — rename, change email, activate, lock, regrant.
#[utoipa::path(
    patch, path = "/api/accounts/{id}", tag = "accounts",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The account's `sys_user_id`")),
    request_body(content = serde_json::Value, description = "Any of `{ name, email, isActive, isLocked, roleIds, description }`; `roleIds` replaces the whole set"),
    responses(
        (status = 200, description = "The account as it now stands"),
        (status = 400, description = "Invalid payload, or a role that does not exist"),
        (status = 403, description = "Requires the master role"),
        (status = 404, description = "No such account"),
        (status = 409, description = "Email in use, would remove the last administrator, or would lock you out"),
    ),
)]
pub async fn update(
    auth: auth::JWTWithUser<users::Model>,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateParams>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;

    let mut errors = Vec::new();
    let name = params
        .name
        .as_deref()
        .map(clean_name)
        .transpose()
        .map_err(|e| errors.push(e))
        .ok()
        .flatten();
    let email = params
        .email
        .as_deref()
        .map(clean_email)
        .transpose()
        .map_err(|e| errors.push(e))
        .ok()
        .flatten();
    if !errors.is_empty() {
        return Err(invalid(errors));
    }

    let is_self = auth.user.sys_user_id == Some(id);
    // Switching yourself off ends your own session mid-edit and, unless
    // someone else can undo it, ends the application's administration with it.
    if is_self && (params.is_active == Some(false) || params.is_locked == Some(true)) {
        return Err(AppError::Conflict(
            "You cannot deactivate or lock your own account".to_string(),
        ));
    }
    let actor = auth.user.email.clone();

    let mut tx = pool.begin().await?;
    lock_accounts(&mut tx).await?;
    let before_account = load_account(&mut tx, id).await?.ok_or_else(not_found)?;
    let masters_before = active_masters(&mut tx).await?;

    if let Some(email) = &email {
        let taken: bool = sqlx::query_scalar(
            r"SELECT EXISTS (SELECT 1 FROM users
                              WHERE lower(email) = $1 AND sys_user_id IS DISTINCT FROM $2)
                  OR EXISTS (SELECT 1 FROM sys_user
                              WHERE lower(email) = $1 AND sys_user_id <> $2)",
        )
        .bind(email)
        .bind(id)
        .fetch_one(&mut *tx)
        .await?;
        if taken {
            return Err(AppError::Conflict(
                "An account with that email already exists".to_string(),
            ));
        }
    }

    sqlx::query(
        r"UPDATE sys_user
             SET name        = COALESCE($2, name),
                 email       = COALESCE($3, email),
                 description = COALESCE($4, description),
                 is_active   = COALESCE($5, is_active),
                 is_locked   = COALESCE($6, is_locked),
                 -- Unlocking is a fresh start; leaving the count would make the
                 -- next failed attempt look like the nth.
                 login_failure_count = CASE WHEN $6 = FALSE THEN 0 ELSE login_failure_count END,
                 updated_by  = $7,
                 updated_at  = NOW()
           WHERE sys_user_id = $1",
    )
    .bind(id)
    .bind(name.as_deref())
    .bind(email.as_deref())
    .bind(params.description.as_deref())
    .bind(params.is_active)
    .bind(params.is_locked)
    .bind(&actor)
    .execute(&mut *tx)
    .await?;

    // The credential row mirrors the identity's name and email; it is the one
    // sign-in looks up, so the two must not drift.
    sqlx::query(
        r"UPDATE users SET name = COALESCE($2, name), email = COALESCE($3, email), updated_at = NOW()
           WHERE sys_user_id = $1",
    )
    .bind(id)
    .bind(name.as_deref())
    .bind(email.as_deref())
    .execute(&mut *tx)
    .await?;

    if let Some(wanted) = &params.role_ids {
        let roles = check_roles(&mut tx, wanted).await?;
        sync_roles(&mut tx, id, &roles, &actor).await?;
    }

    ensure_administrator_remains(&mut tx, masters_before).await?;
    let account = load_account(&mut tx, id).await?.ok_or_else(not_found)?;
    tx.commit().await?;

    record(
        &ctx,
        &auth.user,
        AuditOperation::Update,
        id,
        Some(before_account),
        Some(account.clone()),
    )
    .await;
    Ok(Json(account).into_response())
}

/// `POST /api/accounts/{id}/reset-password` — set someone else's password.
#[utoipa::path(
    post, path = "/api/accounts/{id}/reset-password", tag = "accounts",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The account's `sys_user_id`")),
    request_body(content = serde_json::Value, description = "`{ password }`"),
    responses(
        (status = 200, description = "Password replaced"),
        (status = 400, description = "Password too short"),
        (status = 403, description = "Requires the master role"),
        (status = 404, description = "No such account, or it has no credential to reset"),
    ),
)]
pub async fn reset_password(
    auth: auth::JWTWithUser<users::Model>,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<ResetPasswordParams>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    check_password(&params.password).map_err(|e| invalid(vec![e]))?;

    let hashed = loco_rs::hash::hash_password(&params.password)
        .map_err(|err| AppError::Internal(anyhow::anyhow!(err)))?;
    let updated = sqlx::query(
        r"UPDATE users SET password = $2, reset_token = NULL, reset_sent_at = NULL, updated_at = NOW()
           WHERE sys_user_id = $1",
    )
    .bind(id)
    .bind(&hashed)
    .execute(pool)
    .await?
    .rows_affected();
    if updated == 0 {
        return Err(not_found());
    }
    // A reset is also how an administrator helps someone back in after repeated
    // failures, so it clears the count. It does not unlock: that is a decision
    // of its own, made on the account.
    sqlx::query(
        "UPDATE sys_user SET login_failure_count = 0, updated_at = NOW() WHERE sys_user_id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;

    // The entry names the account, never the password.
    record(
        &ctx,
        &auth.user,
        AuditOperation::Update,
        id,
        None,
        Some(json!({ "passwordReset": true })),
    )
    .await;
    Ok(Json(json!({ "success": true })).into_response())
}

/// `DELETE /api/accounts/{id}` — remove the account and its credential.
#[utoipa::path(
    delete, path = "/api/accounts/{id}", tag = "accounts",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The account's `sys_user_id`")),
    responses(
        (status = 200, description = "Deleted"),
        (status = 403, description = "Requires the master role"),
        (status = 404, description = "No such account"),
        (status = 409, description = "Your own account, a built-in account, or the last administrator"),
    ),
)]
pub async fn remove(
    auth: auth::JWTWithUser<users::Model>,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    if auth.user.sys_user_id == Some(id) {
        return Err(AppError::Conflict(
            "You cannot delete your own account".to_string(),
        ));
    }

    let mut tx = pool.begin().await?;
    lock_accounts(&mut tx).await?;
    let before_account = load_account(&mut tx, id).await?.ok_or_else(not_found)?;
    if before_account["isSystemUser"] == Value::Bool(true) {
        return Err(AppError::Conflict(
            "Built-in accounts cannot be deleted; deactivate it instead".to_string(),
        ));
    }
    let masters_before = active_masters(&mut tx).await?;

    sqlx::query("DELETE FROM users WHERE sys_user_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    // `sys_user_roles` goes with it (ON DELETE CASCADE); `supervisor_id` on
    // anyone this person supervised is set to NULL.
    sqlx::query("DELETE FROM sys_user WHERE sys_user_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    ensure_administrator_remains(&mut tx, masters_before).await?;
    tx.commit().await?;

    record(
        &ctx,
        &auth.user,
        AuditOperation::Delete,
        id,
        Some(before_account),
        None,
    )
    .await;
    Ok(Json(json!({ "success": true })).into_response())
}

const ROLE_SELECT: &str = r"
    SELECT r.sys_role_id,
           r.name,
           r.description,
           COALESCE(r.is_master_role, false) AS is_master_role,
           COALESCE(r.is_active, false)      AS is_active,
           (SELECT COUNT(*) FROM sys_user_roles ur
             WHERE ur.sys_role_id = r.sys_role_id
               AND COALESCE(ur.is_active, true) = true) AS user_count
      FROM sys_role r";

fn role_json(row: &sqlx::postgres::PgRow) -> AppResult<Value> {
    Ok(json!({
        "id": row.try_get::<Uuid, _>("sys_role_id")?,
        "name": row.try_get::<String, _>("name")?,
        "description": row.try_get::<Option<String>, _>("description")?,
        "isMasterRole": row.try_get::<bool, _>("is_master_role")?,
        "isActive": row.try_get::<bool, _>("is_active")?,
        "userCount": row.try_get::<i64, _>("user_count")?,
    }))
}

async fn load_role(conn: &mut PgConnection, id: Uuid) -> AppResult<Option<Value>> {
    let sql = format!("{ROLE_SELECT} WHERE r.sys_role_id = $1");
    let row = sqlx::query(sqlx::AssertSqlSafe(sql))
        .bind(id)
        .fetch_optional(conn)
        .await?;
    row.as_ref().map(role_json).transpose()
}

/// `GET /api/accounts/roles` — every role, with how many accounts hold it.
#[utoipa::path(
    get, path = "/api/accounts/roles", tag = "accounts",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "`{ data }`, ordered by name"),
        (status = 403, description = "Requires the master role"),
    ),
)]
pub async fn list_roles(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    let sql = format!("{ROLE_SELECT} ORDER BY lower(r.name)");
    let rows = sqlx::query(sqlx::AssertSqlSafe(sql))
        .fetch_all(pool)
        .await?;
    let data = rows.iter().map(role_json).collect::<AppResult<Vec<_>>>()?;
    Ok(Json(json!({ "data": data })).into_response())
}

/// `POST /api/accounts/roles` — define a role.
///
/// A new role holds no access: windows are granted to it afterwards, in the
/// dictionary, and until then its members reach nothing.
#[utoipa::path(
    post, path = "/api/accounts/roles", tag = "accounts",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ name, description?, isMasterRole?, isActive? }`"),
    responses(
        (status = 201, description = "The new role"),
        (status = 400, description = "Invalid payload"),
        (status = 403, description = "Requires the master role"),
        (status = 409, description = "A role with that name exists"),
    ),
)]
pub async fn create_role(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateRoleParams>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    let name = clean_role_name(&params.name).map_err(|e| invalid(vec![e]))?;
    let actor = auth.user.email.clone();

    let mut tx = pool.begin().await?;
    lock_accounts(&mut tx).await?;
    let id: Uuid = sqlx::query_scalar(
        r"INSERT INTO sys_role (
               sys_role_id, name, description, user_level, is_master_role,
               is_can_export, is_can_report, is_personal_lock, is_personal_access,
               max_query_records, is_show_accounting,
               entity_type, is_active, created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'U', $3,
                   TRUE, TRUE, FALSE, FALSE, 0, FALSE,
                   'U', $4, $5, $5, NOW(), NOW())
           RETURNING sys_role_id",
    )
    .bind(&name)
    .bind(params.description.as_deref())
    .bind(params.is_master_role)
    .bind(params.is_active)
    .bind(&actor)
    .fetch_one(&mut *tx)
    .await
    .map_err(role_name_taken)?;
    let role = load_role(&mut tx, id).await?.ok_or_else(not_found)?;
    tx.commit().await?;
    record_role(
        &ctx,
        &auth.user,
        AuditOperation::Create,
        id,
        None,
        Some(role.clone()),
    )
    .await;
    Ok((StatusCode::CREATED, Json(role)).into_response())
}

/// `PATCH /api/accounts/roles/{id}` — rename, describe, activate, or change
/// whether the role is a master role.
#[utoipa::path(
    patch, path = "/api/accounts/roles/{id}", tag = "accounts",
    security(("bearer" = [])),
    params(("id" = String, Path, description = "The role's `sys_role_id`")),
    request_body(content = serde_json::Value, description = "Any of `{ name, description, isMasterRole, isActive }`"),
    responses(
        (status = 200, description = "The role as it now stands"),
        (status = 400, description = "Invalid payload"),
        (status = 403, description = "Requires the master role"),
        (status = 404, description = "No such role"),
        (status = 409, description = "Name in use, or it would leave no active administrator"),
    ),
)]
pub async fn update_role(
    auth: auth::JWTWithUser<users::Model>,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateRoleParams>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    admin_caller(pool, &auth).await?;
    let name = params
        .name
        .as_deref()
        .map(clean_role_name)
        .transpose()
        .map_err(|e| invalid(vec![e]))?;
    let actor = auth.user.email.clone();

    let mut tx = pool.begin().await?;
    lock_accounts(&mut tx).await?;
    let before = load_role(&mut tx, id).await?.ok_or_else(not_found)?;
    let masters_before = active_masters(&mut tx).await?;
    sqlx::query(
        r"UPDATE sys_role
             SET name           = COALESCE($2, name),
                 description    = COALESCE($3, description),
                 is_master_role = COALESCE($4, is_master_role),
                 is_active      = COALESCE($5, is_active),
                 updated_by     = $6,
                 updated_at     = NOW()
           WHERE sys_role_id = $1",
    )
    .bind(id)
    .bind(name.as_deref())
    .bind(params.description.as_deref())
    .bind(params.is_master_role)
    .bind(params.is_active)
    .bind(&actor)
    .execute(&mut *tx)
    .await
    .map_err(role_name_taken)?;
    // Demoting or deactivating the role the last administrator holds is the
    // same loss as removing the grant from the account.
    ensure_administrator_remains(&mut tx, masters_before).await?;
    let role = load_role(&mut tx, id).await?.ok_or_else(not_found)?;
    tx.commit().await?;
    record_role(
        &ctx,
        &auth.user,
        AuditOperation::Update,
        id,
        Some(before),
        Some(role.clone()),
    )
    .await;
    Ok(Json(role).into_response())
}

fn clean_role_name(raw: &str) -> Result<String, String> {
    let name = raw.trim();
    if name.is_empty() {
        Err("name is required".to_string())
    } else if name.chars().count() > 100 {
        Err("name must be at most 100 characters".to_string())
    } else {
        Ok(name.to_string())
    }
}

/// `sys_role.name` is unique; say so in words.
fn role_name_taken(err: sqlx::Error) -> AppError {
    match AppError::from(err) {
        AppError::Conflict(_) => {
            AppError::Conflict("A role with that name already exists".to_string())
        }
        other => other,
    }
}

async fn record_role(
    ctx: &AppContext,
    caller: &users::Model,
    operation: AuditOperation,
    id: Uuid,
    before: Option<Value>,
    after: Option<Value>,
) {
    if let Some(audit) = ctx.shared_store.get::<AuditService>() {
        audit
            .record(&AuditEntry {
                entity_type: "sys_role".to_string(),
                entity_id: Some(id.to_string()),
                operation,
                before,
                after,
                user_id: caller.sys_user_id.map(|id| id.to_string()),
                user_email: Some(caller.email.clone()),
            })
            .await;
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("accounts")
        .add("/", get(list))
        .add("/", post(create))
        // Roles live under the same prefix so they share its gate. The static
        // `roles` segments are registered before the `{id}` ones; matchit
        // prefers a static segment, but the order keeps that obvious.
        .add("/roles", get(list_roles))
        .add("/roles", post(create_role))
        .add("/roles/{id}", patch(update_role))
        // `{id}/reset-password` before `{id}`: see `controllers::report`.
        .add("/{id}/reset-password", post(reset_password))
        .add("/{id}", get(show))
        .add("/{id}", patch(update))
        .add("/{id}", delete(remove))
}
