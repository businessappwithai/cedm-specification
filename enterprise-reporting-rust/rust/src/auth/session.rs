//! Reading Better Auth sessions (MIGRATION_PLAN.md §4.2).
//!
//! Rust does not issue sessions yet — sign-in stays on the Node service until
//! Phase 6 — but it accepts the same cookie, so one sign-in works against both
//! backends. The seam matches `src/lib/auth/session.ts`: a `Session` with a
//! `SessionUser { id, email, name, roles, permissions }`, where roles and
//! permissions are read from `roles`/`user_roles` **on every request**. A role
//! revoked at 09:00 is gone at 09:00, not when a token expires.
use axum::{extract::FromRequestParts, http::request::Parts};
use base64::Engine;
use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use loco_rs::app::AppContext;
use serde::Serialize;
use sha2::Sha256;
use sqlx::{PgPool, Row};

use crate::common::{settings, time::iso};

/// Better Auth's `advanced.cookiePrefix` in `src/lib/auth/better-auth.ts`.
/// Deliberately distinct from the generated application's `<project>_app`.
pub const COOKIE_PREFIX: &str = "ers";
pub const SESSION_COOKIE_NAME: &str = "ers.session_token";
/// The name Better Auth uses when served over HTTPS.
pub const SECURE_SESSION_COOKIE_NAME: &str = "__Secure-ers.session_token";

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SessionUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Session {
    pub user: SessionUser,
    pub expires: String,
}

/// The value of cookie `name`, matched **whole, at a cookie boundary**.
///
/// The Node service once matched `/session_token=([^;]+)/` unanchored; the
/// generated application's `crm_app.session_token` arrived first and its value
/// was used — signed in, session valid, every permission gone.
#[must_use]
pub fn read_cookie<'a>(cookie_header: &'a str, name: &str) -> Option<&'a str> {
    cookie_header.split(';').find_map(|pair| {
        let pair = pair.trim_start();
        let (k, v) = pair.split_once('=')?;
        (k == name && !v.is_empty()).then_some(v)
    })
}

/// The session cookie's raw value: the `__Secure-` spelling wins when both are
/// present, as it is the one set by the HTTPS origin.
#[must_use]
pub fn read_session_cookie(cookie_header: &str) -> Option<&str> {
    read_cookie(cookie_header, SECURE_SESSION_COOKIE_NAME)
        .or_else(|| read_cookie(cookie_header, SESSION_COOKIE_NAME))
}

/// Verify a Better Auth signed cookie value and return the bare token.
///
/// The value is `encodeURIComponent(token + "." + base64(HMAC-SHA256(secret, token)))`
/// (better-call `signCookieValue`). Returns `None` for an unsigned value or a
/// bad signature: a forged token never reaches the database.
#[must_use]
pub fn verify_signed_token(raw_cookie_value: &str, secret: &str) -> Option<String> {
    let decoded = percent_encoding::percent_decode_str(raw_cookie_value)
        .decode_utf8()
        .ok()?;
    // The token itself never contains '.', the base64 signature never does
    // either, so the last '.' separates them.
    let (token, signature) = decoded.rsplit_once('.')?;
    if token.is_empty() || signature.len() != 44 || !signature.ends_with('=') {
        return None;
    }
    let sig = base64::engine::general_purpose::STANDARD.decode(signature).ok()?;
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).ok()?;
    mac.update(token.as_bytes());
    mac.verify_slice(&sig).ok()?;
    Some(token.to_string())
}

/// Roles and the permissions they carry, read live. A role whose
/// `permissions` JSON does not parse contributes nothing rather than failing —
/// one malformed role must not lock its members out.
///
/// # Errors
/// On a database error.
pub async fn load_roles_and_permissions(
    pool: &PgPool,
    user_id: &str,
) -> Result<(Vec<String>, Vec<String>), sqlx::Error> {
    let rows = sqlx::query(
        "SELECT roles.name, roles.permissions FROM roles \
         INNER JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    let mut roles = Vec::with_capacity(rows.len());
    let mut raw_permissions = Vec::with_capacity(rows.len());
    for r in &rows {
        roles.push(r.get::<String, _>("name"));
        raw_permissions.push(r.get::<String, _>("permissions"));
    }
    Ok((roles, merge_permissions(&raw_permissions)))
}

/// Union of the roles' permission arrays, first occurrence order kept
/// (`Array.from(new Set(...))`).
#[must_use]
pub fn merge_permissions(raw: &[String]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for json in raw {
        let parsed: Vec<String> = serde_json::from_str::<serde_json::Value>(json)
            .ok()
            .and_then(|v| v.as_array().cloned())
            .map(|a| {
                a.into_iter()
                    .filter_map(|x| x.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();
        for p in parsed {
            if !out.contains(&p) {
                out.push(p);
            }
        }
    }
    out
}

/// Resolve a bare session token: the row has to exist, belong to an active
/// user and be unexpired.
///
/// # Errors
/// On a database error.
pub async fn verify_session(pool: &PgPool, token: &str) -> Result<Option<Session>, sqlx::Error> {
    if token.is_empty() {
        return Ok(None);
    }
    let row = sqlx::query(
        "SELECT users.id AS id, users.email AS email, users.display_name AS display_name, \
                auth_sessions.expires_at AS expires_at \
         FROM auth_sessions INNER JOIN users ON users.id = auth_sessions.user_id \
         WHERE auth_sessions.token = $1 AND users.is_active = true",
    )
    .bind(token)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let expires_at: DateTime<Utc> = row.get("expires_at");
    if expires_at <= Utc::now() {
        return Ok(None);
    }
    let id: String = row.get("id");
    let (roles, permissions) = load_roles_and_permissions(pool, &id).await?;
    Ok(Some(Session {
        user: SessionUser {
            email: row.get("email"),
            name: row.get("display_name"),
            id,
            roles,
            permissions,
        },
        expires: iso(expires_at),
    }))
}

/// Resolve the session for a request's `Cookie` header.
pub async fn session_from_cookie_header(pool: &PgPool, cookie_header: &str) -> Option<Session> {
    let raw = read_session_cookie(cookie_header)?;
    let secret = settings::auth_secret().ok()?;
    let token = verify_signed_token(raw, &secret)?;
    match verify_session(pool, &token).await {
        Ok(s) => s,
        Err(e) => {
            tracing::error!(error = %e, "Failed to resolve session");
            None
        }
    }
}

/// Axum extractor: the caller's session, or `None` when signed out. Never
/// rejects, so each handler returns its own route's 401 envelope exactly as
/// the Node twin does.
#[derive(Debug, Clone)]
pub struct CurrentSession(pub Option<Session>);

impl FromRequestParts<AppContext> for CurrentSession {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, ctx: &AppContext) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get_all(axum::http::header::COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok())
            .collect::<Vec<_>>()
            .join("; ");
        if header.is_empty() {
            return Ok(Self(None));
        }
        let pool = crate::common::db::pool(ctx);
        Ok(Self(session_from_cookie_header(pool, &header).await))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sign(token: &str, secret: &str) -> String {
        let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(token.as_bytes());
        let sig = base64::engine::general_purpose::STANDARD.encode(mac.finalize().into_bytes());
        percent_encoding::utf8_percent_encode(&format!("{token}.{sig}"), percent_encoding::NON_ALPHANUMERIC)
            .to_string()
    }

    #[test]
    fn does_not_match_suffix_cookie() {
        let h = "crm_app.session_token=theirs; ers.session_token=ours";
        assert_eq!(read_session_cookie(h), Some("ours"));
        assert_eq!(read_session_cookie("crm_app.session_token=theirs"), None);
    }

    #[test]
    fn secure_prefix_is_read() {
        assert_eq!(read_session_cookie("__Secure-ers.session_token=v"), Some("v"));
    }

    #[test]
    fn signature_round_trip() {
        let secret = "0123456789abcdef0123456789abcdef";
        let cookie = sign("abcDEF123", secret);
        assert_eq!(verify_signed_token(&cookie, secret).as_deref(), Some("abcDEF123"));
    }

    #[test]
    fn forged_or_unsigned_token_rejected() {
        let secret = "0123456789abcdef0123456789abcdef";
        let cookie = sign("abcDEF123", "a-different-secret-of-32-characters!");
        assert_eq!(verify_signed_token(&cookie, secret), None);
        assert_eq!(verify_signed_token("abcDEF123", secret), None);
    }

    #[test]
    fn malformed_permissions_ignored() {
        let merged = merge_permissions(&[
            r#"["report:view","chart:view"]"#.into(),
            "not json".into(),
            r#"["report:view","job:*"]"#.into(),
        ]);
        assert_eq!(merged, vec!["report:view", "chart:view", "job:*"]);
    }
}
