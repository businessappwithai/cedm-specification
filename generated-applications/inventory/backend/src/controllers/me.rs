//! `/api/me` — what the signed-in caller is allowed to see.
//!
//! Two consumers, both of which break without it:
//!
//! * The dashboard builds its navigation from `windows`, so an empty or absent
//!   response renders a signed-in user an empty app.
//! * The stack-agnostic `tests/` harness probes `/api/me/health` for readiness
//!   and asserts on `/api/me/permissions` in the users-and-roles suite, so this
//!   is part of the cross-stack contract (§9), not a convenience.
//!
//! Permissions are read from `sys_access`, which is the Compiere model: a role
//! is granted or excluded per window, and a *master* role skips the table
//! entirely. Deriving them here rather than storing a flattened copy means an
//! administrator's grant takes effect on the next request.

use axum::{
    extract::State,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};

use crate::errors::AppResult;
use crate::models::_entities::users;
use crate::services::authz::{self, Principal};
use crate::services::system_config::SystemConfig;

/// `GET /api/me/health` — liveness for a caller that has not signed in.
///
/// Deliberately unauthenticated and deliberately not `/_health`: the test
/// harness and any reverse proxy in front of the app probe the API prefix, and
/// a probe that needs a token cannot tell "starting up" from "not logged in".
#[utoipa::path(
    get, path = "/api/me/health", tag = "auth",
    responses((status = 200, description = "`{ status, database, name, description, version }` — the app is up, whether its database answers, and how the app identifies itself")),
)]
pub async fn health(
    State(ctx): State<AppContext>,
    SharedStore(config): SharedStore<SystemConfig>,
) -> AppResult<Response> {
    // A connection check, not just a process check — the app answers requests
    // long before it can serve one, and reporting healthy in that window is
    // what makes a deploy look successful while every request 500s.
    let pool = ctx.db.get_postgres_connection_pool();
    let database = sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(pool)
        .await
        .is_ok();

    // The application's own name and purpose, resolved through `sys_system` so
    // renaming it is an edit on the admin screen rather than a regeneration.
    // They sit on the probe because that is the one endpoint a client can read
    // before signing in, and the sidebar needs the name on the login page.
    //
    // Neither is a secret: the name is rendered to anyone who opens the app,
    // and the description is the model's own summary, which the generated
    // manual publishes. A sensitive value never reaches here — `is_sensitive`
    // rows are not read by this handler at all.
    // The compiled defaults come from the crate manifest rather than from a
    // second copy rendered into this file: `Cargo.toml` already carries both,
    // and a model name or description containing a quote would otherwise have
    // to be escaped correctly in two places instead of none.
    let settings = ctx.config.settings.as_ref();
    let name = config
        .get(settings, "app_name", env!("CARGO_PKG_NAME"))
        .await;
    let description = config
        .get(settings, "app_description", env!("CARGO_PKG_DESCRIPTION"))
        .await;

    Ok(Json(json!({
        "status": if database { "ok" } else { "degraded" },
        "database": database,
        "name": name,
        "description": description,
        "version": env!("CARGO_PKG_VERSION"),
    }))
    .into_response())
}

/// `GET /api/me` — the current user, same body as `/api/auth/me`.
#[utoipa::path(
    get, path = "/api/me", tag = "auth",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "The signed-in user"),
        (status = 401, description = "No or invalid token"),
    ),
)]
pub async fn current(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let role = auth.user.role_name(&ctx.db).await;
    Ok(Json(json!({
        "user": crate::models::users::UserResponse::new(&auth.user, role)
    }))
    .into_response())
}

/// `GET /api/me/permissions` — role, master flag, and the windows to show.
#[utoipa::path(
    get, path = "/api/me/permissions", tag = "auth",
    security(("bearer" = [])),
    responses((status = 200, description = "Routes and operations this user may reach")),
)]
pub async fn permissions(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let role = auth.user.role_name(&ctx.db).await;

    // The same resolution the request guards use, rather than a second query
    // that answers the same question differently. It used to read
    // `is_master_role` here with `.unwrap_or(false)`, which reports a failed
    // query as "holds no master role" — quietly demoting an administrator to
    // an empty dashboard, and indistinguishable from the real thing.
    let principal = authz::principal(pool, &auth.user).await?;

    Ok(Json(json!({
        "role": role,
        "isMaster": principal.is_master,
        "windows": granted_windows(pool, &principal).await?,
    }))
    .into_response())
}

/// `GET /api/me/dashboard` — the dashboard, scoped to this caller.
///
/// Everything the front page draws, in one request: the categories with the
/// entities inside them, the admin windows this caller may open, and who the
/// caller is as far as the dictionary is concerned.
///
/// **The entities are the ones this caller may actually read.** The dashboard
/// used to be built from `/api/sys/categories/with-entities`, which is an
/// unscoped dictionary read — so every account was offered a card for every
/// entity in the application, and the three gates then answered 403 on the ones
/// it did not hold. A dashboard that offers nine entities and refuses them
/// cannot be told from a broken one, and the reverse of the same mistake is the
/// one `services/authz.rs` already documents: hiding a window used to hide only
/// the menu entry. The menu and the API now answer from the same rows.
///
/// **Line items are not places to navigate to.** An entity with `parent:
/// <Parent>` gives the child no window of its own and puts its tab inside the
/// parent's at `tab_level` 1, so it is reached by opening a parent record. The
/// `NOT EXISTS` below reads that off `sys_tab` rather than re-deriving it, so
/// this screen and the detail screen cannot disagree about what a line item is.
///
/// It is on `/api/me` rather than `/api/sys` deliberately. The dictionary's
/// reads are open — the sign-in page builds its navigation from them before
/// anyone has a token — and a caller-scoped read sitting in that namespace
/// would be the one endpoint there that answers differently per caller.
#[utoipa::path(
    get, path = "/api/me/dashboard", tag = "auth",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "`{ data, windows, role, isMaster }` — categories with the entities this caller may read"),
        (status = 401, description = "No or invalid token"),
    ),
)]
pub async fn dashboard(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    let role = auth.user.role_name(&ctx.db).await;
    let principal = authz::principal(pool, &auth.user).await?;

    let categories = sqlx::query(
        r"SELECT sys_category_id, name, code, description, icon, color, seq_no
            FROM sys_category
           WHERE COALESCE(is_active, true) = true
           ORDER BY seq_no NULLS LAST, name",
    )
    .fetch_all(pool)
    .await?;

    // Each entity is offered as the window it opens in: the screens label a
    // card, a menu entry and a heading with the window's own name, description,
    // help and icon, never with the dictionary table's. A table with no window
    // has no screen, so it is not offered.
    let tables = sqlx::query(
        r"SELECT * FROM (
             SELECT DISTINCT ON (t.sys_table_id)
                    t.*,
                    w.sys_window_id AS window_id,
                    w.name          AS window_name,
                    w.description   AS window_description,
                    w.help          AS window_help,
                    w.icon          AS window_icon
               FROM sys_table t
               JOIN sys_tab    tb ON tb.sys_table_id = t.sys_table_id AND tb.tab_level = 0
               JOIN sys_window w  ON w.sys_window_id = tb.sys_window_id
                                 AND COALESCE(w.is_active, true) = true
              WHERE COALESCE(t.is_active, true) = true
                AND t.table_name LIKE 'bus\_%'
                AND NOT EXISTS (
                      SELECT 1 FROM sys_tab tl
                       WHERE tl.sys_table_id = t.sys_table_id
                         AND tl.tab_level > 0)
              ORDER BY t.sys_table_id, tb.seq_no NULLS LAST
           ) entity
           ORDER BY entity.window_name",
    )
    .fetch_all(pool)
    .await?;
    let tables: Vec<Value> = crate::services::row_json::rows_to_json(&tables);

    let candidates: Vec<String> = tables
        .iter()
        .filter_map(|t| t.get("table_name").and_then(Value::as_str))
        .map(ToString::to_string)
        .collect();
    let readable = authz::readable_tables(pool, &principal, &candidates).await?;
    let visible: Vec<&Value> = tables
        .iter()
        .filter(|t| {
            t.get("table_name")
                .and_then(Value::as_str)
                .is_some_and(|name| readable.iter().any(|r| r == name))
        })
        .collect();

    let mut groups: Vec<Value> = Vec::with_capacity(categories.len() + 1);
    let mut claimed: Vec<String> = Vec::new();

    for category in &categories {
        let mut group = crate::services::row_json::row_to_json(category);
        let id = group
            .get("sys_category_id")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let entities: Vec<Value> = visible
            .iter()
            .filter(|t| t.get("sys_category_id").and_then(Value::as_str) == Some(id.as_str()))
            .map(|t| (*t).clone())
            .collect();
        for entity in &entities {
            if let Some(name) = entity.get("table_name").and_then(Value::as_str) {
                claimed.push(name.to_string());
            }
        }

        // A category whose every entity belongs to another role is not an empty
        // category, it is somebody else's — and a heading over nothing tells a
        // scoped reader nothing they can act on. An administrator is looking at
        // the dictionary itself, where an empty category is one waiting to be
        // filled, so for them it stays.
        if entities.is_empty() && !principal.is_master {
            continue;
        }

        if let Some(object) = group.as_object_mut() {
            object.insert("entities".into(), Value::Array(entities));
        }
        groups.push(group);
    }

    let uncategorised: Vec<Value> = visible
        .iter()
        .filter(|t| {
            t.get("table_name")
                .and_then(Value::as_str)
                .is_none_or(|name| !claimed.iter().any(|c| c == name))
        })
        .map(|t| (*t).clone())
        .collect();

    // Always last, whatever it is called: an entity nobody has filed is still
    // an entity, and leaving it out would make it invisible until an
    // administrator got round to categorising it.
    if !uncategorised.is_empty() {
        groups.push(json!({
            "sys_category_id": Value::Null,
            "name": "Uncategorised",
            "code": "UNCATEGORISED",
            "description": Value::Null,
            "icon": Value::Null,
            "color": Value::Null,
            "entities": uncategorised,
        }));
    }

    Ok(Json(json!({
        "data": groups,
        "windows": granted_windows(pool, &principal).await?,
        "role": role,
        "isMaster": principal.is_master,
    }))
    .into_response())
}

/// The windows this principal may open, as the screens render them.
///
/// Shared by `/api/me/permissions` and `/api/me/dashboard` so the two cannot
/// disagree about what a caller may reach — they are the same question asked by
/// two screens, and answering it twice is how one of them comes to show a
/// window the other hides.
///
/// A master role sees every window; anyone else sees what `sys_access` grants
/// and has not excluded. `is_read_only` rides along so a window can be rendered
/// without its write affordances.
async fn granted_windows(pool: &PgPool, principal: &Principal) -> AppResult<Vec<Value>> {
    let rows = if principal.is_master {
        sqlx::query(
            r"SELECT w.sys_window_id, w.name, w.description, w.icon, w.entity_type,
                     false AS is_read_only,
                     (SELECT t.table_name
                        FROM sys_tab  tb
                        JOIN sys_table t ON t.sys_table_id = tb.sys_table_id
                       WHERE tb.sys_window_id = w.sys_window_id
                       ORDER BY tb.seq_no NULLS LAST
                       LIMIT 1) AS table_name
                FROM sys_window w
               WHERE COALESCE(w.is_active, true) = true
               ORDER BY w.name",
        )
        .fetch_all(pool)
        .await?
    } else {
        // No dictionary identity means no roles, so no grants — and no query to
        // run, because binding a NULL user id would match nothing anyway.
        let Some(sys_user_id) = principal.sys_user_id else {
            return Ok(Vec::new());
        };
        sqlx::query(
            r"SELECT DISTINCT ON (w.sys_window_id)
                     w.sys_window_id, w.name, w.description, w.icon, w.entity_type,
                     COALESCE(a.is_read_only, false) AS is_read_only,
                     (SELECT t.table_name
                        FROM sys_tab  tb
                        JOIN sys_table t ON t.sys_table_id = tb.sys_table_id
                       WHERE tb.sys_window_id = w.sys_window_id
                       ORDER BY tb.seq_no NULLS LAST
                       LIMIT 1) AS table_name
                FROM sys_window w
                JOIN sys_access    a ON a.sys_window_id = w.sys_window_id
                JOIN sys_user_roles ur ON ur.sys_role_id = a.sys_role_id
                JOIN sys_role       sr ON sr.sys_role_id = ur.sys_role_id
                JOIN sys_user       su ON su.sys_user_id = ur.sys_user_id
               WHERE ur.sys_user_id = $1
                 AND COALESCE(ur.is_active, true) = true
                 AND COALESCE(sr.is_active, true) = true
                 AND COALESCE(su.is_active, false) = true
                 AND COALESCE(su.is_locked, false) = false
                 AND COALESCE(w.is_active, true) = true
                 AND COALESCE(a.is_active, true) = true
                 AND COALESCE(a.is_exclude, false) = false
               ORDER BY w.sys_window_id, a.is_read_only
             ",
        )
        .bind(sys_user_id)
        .fetch_all(pool)
        .await?
    };

    Ok(rows
        .iter()
        .map(|row| {
            let entity_type: Option<String> = row.try_get("entity_type").ok().flatten();
            let description: Option<String> = row.try_get("description").ok().flatten();
            let table_name: Option<String> = row.try_get("table_name").ok().flatten();
            let is_system = entity_type.as_deref() == Some("S");

            json!({
                "sys_window_id": row
                    .try_get::<uuid::Uuid, _>("sys_window_id")
                    .ok()
                    .map(|id| id.to_string()),
                "name": row.try_get::<Option<String>, _>("name").ok().flatten(),
                "route": route_for(is_system, description.as_deref(), table_name.as_deref()),
                "icon": row.try_get::<Option<String>, _>("icon").ok().flatten(),
                "category": if is_system { "admin" } else { "business" },
                "is_read_only": row
                    .try_get::<Option<bool>, _>("is_read_only")
                    .ok()
                    .flatten()
                    .unwrap_or(false),
            })
        })
        .collect())
}

/// Where clicking a window takes you.
///
/// System windows store their route in `description` — that is how the
/// dictionary seed writes them, because an admin screen is a hand-built page
/// with no `bus_` table behind it. A business window is named by its first
/// tab's table, minus the `bus_` prefix, which is exactly the segment
/// `/api/bus/{entity}` accepts.
fn route_for(
    is_system: bool,
    description: Option<&str>,
    table_name: Option<&str>,
) -> Option<String> {
    if is_system {
        return description
            .filter(|d| d.starts_with('/'))
            .map(ToString::to_string);
    }
    let table = table_name?;
    Some(format!("/{}", table.strip_prefix("bus_").unwrap_or(table)))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("me")
        // `/health` before `/` so the readiness probe never needs a token.
        .add("/health", get(health))
        .add("/", get(current))
        .add("/permissions", get(permissions))
        .add("/dashboard", get(dashboard))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_windows_route_to_their_stored_path() {
        assert_eq!(
            route_for(true, Some("/admin/rules"), None).as_deref(),
            Some("/admin/rules")
        );
        // A system window whose description is prose, not a path, has no route
        // rather than a broken one.
        assert_eq!(route_for(true, Some("Manage rules"), None), None);
    }

    #[test]
    fn business_windows_route_by_their_table() {
        assert_eq!(
            route_for(false, Some("Manage Compound records"), Some("bus_compound")).as_deref(),
            Some("/compound")
        );
        // A window with no tab has nowhere to go.
        assert_eq!(route_for(false, None, None), None);
    }
}
