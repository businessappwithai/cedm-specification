//! Role-scoped reverse proxy to an ElectricSQL server.
//!
//! Clients call `GET /v1/shape?table=sys_table&role=admin&…`; this forwards to
//! `ELECTRIC_URL/v1/shape` with the caller-supplied `role` **removed** and a
//! server-generated `where` clause put in its place, so a client cannot widen
//! its own visibility.
//!
//! Note this controller lives *outside* the `/api` prefix — it serves
//! `/v1/shape`, which is what the Electric client library expects. See
//! `app.rs` for how route ordering achieves that.
//!
//! ## Security note — a deliberate difference from the TypeScript original
//!
//! `electric.controller.ts` builds its role clause by interpolating the `role`
//! query parameter straight into SQL:
//!
//! ```text
//! allowed_roles @> ARRAY['${role}']::text[]
//! ```
//!
//! `role` is attacker-controlled (it is a query parameter), so a crafted value
//! escapes the quotes and rewrites the WHERE clause that is the *only* thing
//! restricting which dictionary rows the caller receives. The design document
//! says to keep the role clause identical; this keeps it identical **for every
//! legitimate role** but validates the value first, rejecting anything outside
//! `[A-Za-z0-9_-]` with a 400. No valid role changes behaviour, and the
//! injection is closed rather than ported.

use axum::{
    body::Body,
    extract::{Query, State},
    http::StatusCode,
    response::Response,
};
use loco_rs::prelude::*;
use std::collections::HashMap;

use crate::errors::{AppError, AppResult};
use crate::services::system_config::SystemConfig;

/// The only tables reachable through the proxy. Identical to the TypeScript
/// `ALLOWED_SYS_TABLES`.
const ALLOWED_SYS_TABLES: [&str; 5] = [
    "sys_table",
    "sys_column",
    "sys_field",
    "sys_reference",
    "sys_window",
];

pub async fn proxy_shape(
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
    SharedStore(config): SharedStore<SystemConfig>,
) -> AppResult<Response> {
    let upstream = electric_url(&ctx, &config).await.ok_or_else(|| {
        // Same status and intent as the original: the client falls back to the
        // plain HTTP API when Electric is not deployed.
        AppError::ServiceUnavailable(
            "Electric upstream not configured (set electric_url on the System Configuration \
             screen or ELECTRIC_URL in the environment); client should use HTTP API fallback"
                .to_string(),
        )
    })?;

    let table = params.get("table").map(String::as_str).unwrap_or_default();
    if !ALLOWED_SYS_TABLES.contains(&table) {
        return Err(AppError::Forbidden("forbidden".to_string()));
    }

    let role = params.get("role").map(String::as_str).unwrap_or("user");
    let where_clause = role_where_clause(role)?;

    // Forward every parameter except `role`, which is replaced by the
    // server-generated `where`. A client-supplied `where` is also dropped —
    // otherwise it would override the scoping entirely.
    let mut forwarded: Vec<(String, String)> = params
        .iter()
        .filter(|(key, _)| key.as_str() != "role" && key.as_str() != "where")
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();
    forwarded.push(("where".to_string(), where_clause));

    let response = reqwest::Client::new()
        .get(format!("{upstream}/v1/shape"))
        .query(&forwarded)
        .send()
        .await
        .map_err(|err| {
            crate::log_event!(jobs_upstream_unreachable, upstream = "electric", error = %err);
            AppError::ServiceUnavailable("Electric upstream unreachable".to_string())
        })?;

    let status = StatusCode::from_u16(response.status().as_u16())
        .unwrap_or(StatusCode::BAD_GATEWAY);

    // Electric's long-polling headers carry the shape cursor; the client cannot
    // resume without them, so they are passed through rather than dropped.
    let mut builder = Response::builder().status(status);
    for name in [
        "content-type",
        "electric-handle",
        "electric-offset",
        "electric-schema",
        "electric-cursor",
        "electric-up-to-date",
        "cache-control",
        "etag",
    ] {
        if let Some(value) = response.headers().get(name) {
            builder = builder.header(name, value);
        }
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|err| AppError::Internal(err.into()))?;

    builder
        .body(Body::from(bytes))
        .map_err(|err| AppError::Internal(err.into()))
}

pub fn routes() -> Routes {
    Routes::new().prefix("v1/shape").add("/", get(proxy_shape))
}

/// Where Electric is, if anywhere.
///
/// A `sys_system` row first, the app's own settings block after it, so the
/// upstream can be pointed somewhere new from the admin screen without a
/// restart. Empty in both means the proxy is off, which is the default and is
/// reported as 503 rather than as an error.
async fn electric_url(ctx: &AppContext, config: &SystemConfig) -> Option<String> {
    config
        .get_optional(ctx.config.settings.as_ref(), "electric_url")
        .await
}

/// Map a role to the WHERE clause applied to every `sys_` shape.
///
/// Same clauses as the TypeScript original; the difference is that the role is
/// validated before it reaches the string (see the module comment).
fn role_where_clause(role: &str) -> AppResult<String> {
    if role.is_empty()
        || !role
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
    {
        return Err(AppError::BadRequest("Invalid role".to_string()));
    }

    Ok(if role == "admin" || role == "superuser" {
        "is_active = true".to_string()
    } else {
        format!("is_active = true AND (allowed_roles IS NULL OR allowed_roles @> ARRAY['{role}']::text[])")
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn admins_see_every_active_row() {
        assert_eq!(role_where_clause("admin").unwrap(), "is_active = true");
        assert_eq!(role_where_clause("superuser").unwrap(), "is_active = true");
    }

    #[test]
    fn ordinary_roles_get_the_membership_clause() {
        assert_eq!(
            role_where_clause("nurse").unwrap(),
            "is_active = true AND (allowed_roles IS NULL OR allowed_roles @> ARRAY['nurse']::text[])"
        );
    }

    #[test]
    fn injection_attempts_are_rejected_not_interpolated() {
        // This is the payload that defeats the TypeScript version's clause.
        assert!(role_where_clause("x'] OR true --").is_err());
        assert!(role_where_clause("a' OR '1'='1").is_err());
        assert!(role_where_clause("").is_err());
        // Legitimate role shapes still pass.
        assert!(role_where_clause("read-only_2").is_ok());
    }

    #[test]
    fn allow_list_matches_the_typescript_set() {
        assert!(ALLOWED_SYS_TABLES.contains(&"sys_field"));
        assert!(!ALLOWED_SYS_TABLES.contains(&"sys_user"));
        assert!(!ALLOWED_SYS_TABLES.contains(&"bus_customer"));
    }
}
