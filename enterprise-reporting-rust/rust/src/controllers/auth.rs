//! `/api/auth/*` — the parts of Better Auth's HTTP surface this application
//! uses (`sign-in/email`, `sign-out`, `get-session`), `/api/auth/permissions`
//! (`src/routes/api/auth/permissions.ts`), and `/api/auth/session`, the REST
//! twin of the `getSessionFn` server functions.
//!
//! Every other path under `/api/auth` (sign-up, password reset, OAuth, …)
//! stays on Node: `routes.json` names only these, so the proxy sends nothing
//! else here.
//!
//! The Better Auth routes run their checks in the library's order — rate
//! limit, body and content type, trusted origin, schema, CSRF, handler — so a
//! request that fails two of them gets the same refusal from either backend.
//!
//! Deliberate differences (MIGRATION_PLAN.md §9):
//! - D-30: a deactivated account cannot sign in, and `get-session` does not
//!   return its sessions. Better Auth never reads `users.is_active`.
//! - D-31: `/api/auth/permissions` returns the resource grants of the caller's
//!   own roles (every grant for an admin). Node returns every role's grants to
//!   anyone signed in, and the client then honours another role's grant.
use axum::{
    body::{Body, Bytes},
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use sqlx::Row;

use crate::{
    auth::{
        better_auth::{self as ba, AuthError},
        session::{read_session_cookie, verify_signed_token},
        CurrentSession,
    },
    common::{db::pg_rows_to_json, db::pool, settings, time::iso},
};

/// A Better Auth JSON response.
fn respond(status: u16, body: &Value, cookies: &[String], extra: &[(&str, String)]) -> Response {
    let mut b = Response::builder()
        .status(StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR))
        .header(header::CONTENT_TYPE, "application/json");
    for c in cookies {
        b = b.header(header::SET_COOKIE, c);
    }
    for (k, v) in extra {
        b = b.header(*k, v);
    }
    b.body(Body::from(body.to_string()))
        .unwrap_or_else(|_| Response::new(Body::empty()))
}

fn refuse(e: &AuthError) -> Response {
    respond(e.status, &e.body(), &[], &[])
}

/// better-call's 429: no content type, `X-Retry-After`.
fn too_many(retry: i64) -> Response {
    Response::builder()
        .status(StatusCode::TOO_MANY_REQUESTS)
        .header("x-retry-after", retry.to_string())
        .body(Body::from(
            json!({ "message": "Too many requests. Please try again later." }).to_string(),
        ))
        .unwrap_or_else(|_| Response::new(Body::empty()))
}

/// `Some(429)` when the caller is over the limit for `path`.
fn rate_limit(headers: &HeaderMap, path: &str) -> Option<Response> {
    let ip = ba::client_ip(headers);
    ba::consume(ip.as_deref(), path, chrono::Utc::now().timestamp_millis())
        .err()
        .map(too_many)
}

fn cookie_header(headers: &HeaderMap) -> String {
    headers
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .collect::<Vec<_>>()
        .join("; ")
}

/// better-call `getBody`: the content type must be allowed, JSON must parse,
/// a form becomes an object of strings.
fn read_body(headers: &HeaderMap, bytes: &[u8], allowed: &[&str]) -> std::result::Result<Value, AuthError> {
    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();
    let normalized = content_type.to_lowercase();
    let base = normalized
        .split(';')
        .next()
        .unwrap_or_default()
        .trim()
        .to_string();
    if !allowed.iter().any(|a| base == *a || base.contains(a)) {
        let list = allowed.join(", ");
        let message = if normalized.is_empty() {
            format!("Content-Type is required. Allowed types: {list}")
        } else {
            format!("Content-Type \"{content_type}\" is not allowed. Allowed types: {list}")
        };
        return Err(AuthError::new(415, "UNSUPPORTED_MEDIA_TYPE", &message));
    }
    let is_json =
        regex::Regex::new(r"^application/([a-z0-9.+-]*\+)?json").is_ok_and(|re| re.is_match(&normalized));
    if is_json {
        return serde_json::from_slice(bytes)
            .map_err(|_| AuthError::new(400, "BAD_REQUEST", "Invalid JSON in request body"));
    }
    if normalized.contains("application/x-www-form-urlencoded") {
        let map: Map<String, Value> = url::form_urlencoded::parse(bytes)
            .map(|(k, v)| (k.into_owned(), Value::String(v.into_owned())))
            .collect();
        return Ok(Value::Object(map));
    }
    Ok(Value::String(String::from_utf8_lossy(bytes).into_owned()))
}

/// JavaScript's name for a value's type, as zod reports it.
fn js_type(v: Option<&Value>) -> &'static str {
    match v {
        None => "undefined",
        Some(Value::Null) => "null",
        Some(Value::Bool(_)) => "boolean",
        Some(Value::Number(_)) => "number",
        Some(Value::String(_)) => "string",
        Some(Value::Array(_)) => "array",
        Some(Value::Object(_)) => "object",
    }
}

/// The sign-in body schema: `email`, `password` strings, `callbackURL`
/// optional string, `rememberMe` optional boolean. Issues joined as better-call
/// formats them.
fn validate_sign_in(body: &Value) -> std::result::Result<(), AuthError> {
    let fail = |m: String| AuthError::new(400, "VALIDATION_ERROR", &m);
    let Some(o) = body.as_object() else {
        return Err(fail(format!(
            "[body] Invalid input: expected object, received {}",
            js_type(Some(body))
        )));
    };
    let mut issues = Vec::new();
    for (key, want, optional) in [
        ("email", "string", false),
        ("password", "string", false),
        ("callbackURL", "string", true),
        ("rememberMe", "boolean", true),
    ] {
        let got = o.get(key);
        let ok = js_type(got) == want || (optional && got.is_none());
        if !ok {
            issues.push(format!(
                "[body.{key}] Invalid input: expected {want}, received {}",
                js_type(got)
            ));
        }
    }
    if issues.is_empty() {
        Ok(())
    } else {
        Err(fail(issues.join("; ")))
    }
}

/// The router-level origin middleware for a POST: the origin check on a
/// cookie-bearing request, then any callback URL in the body.
fn origin_middleware(headers: &HeaderMap, body: &Value) -> std::result::Result<(), AuthError> {
    ba::validate_origin(headers, false)?;
    if let Some(cb) = body
        .get("callbackURL")
        .filter(|v| crate::common::js::truthy(Some(v)))
    {
        let Some(url) = cb.as_str() else {
            return Err(AuthError::new(
                400,
                "BAD_REQUEST",
                "Invalid callbackURL: expected a string",
            ));
        };
        if !ba::is_trusted(url, true) {
            return Err(AuthError::new(403, "INVALID_CALLBACK_URL", "Invalid callbackURL"));
        }
    }
    Ok(())
}

fn invalid_credentials() -> AuthError {
    AuthError::new(401, "INVALID_EMAIL_OR_PASSWORD", "Invalid email or password")
}

/// bcrypt on a blocking thread: a cost-12 hash is ~250 ms of CPU.
async fn bcrypt_verify(password: String, hash: String) -> bool {
    tokio::task::spawn_blocking(move || bcrypt::verify(password, &hash).unwrap_or(false))
        .await
        .unwrap_or(false)
}

async fn bcrypt_burn(password: String) {
    let cost = ba::bcrypt_cost();
    let _ = tokio::task::spawn_blocking(move || bcrypt::hash(password, cost)).await;
}

/// `POST /api/auth/sign-in/email`.
async fn sign_in(State(ctx): State<AppContext>, headers: HeaderMap, bytes: Bytes) -> Result<Response> {
    if let Some(r) = rate_limit(&headers, "/sign-in/email") {
        return Ok(r);
    }
    let body = match read_body(
        &headers,
        &bytes,
        &["application/x-www-form-urlencoded", "application/json"],
    ) {
        Ok(b) => b,
        Err(e) => return Ok(refuse(&e)),
    };
    if let Err(e) = origin_middleware(&headers, &body)
        .and_then(|()| validate_sign_in(&body))
        .and_then(|()| ba::validate_form_csrf(&headers))
    {
        return Ok(refuse(&e));
    }
    let email = body["email"].as_str().unwrap_or_default().to_string();
    let password = body["password"].as_str().unwrap_or_default().to_string();
    if !ba::is_valid_email(&email) {
        return Ok(refuse(&AuthError::new(400, "INVALID_EMAIL", "Invalid email")));
    }
    let Ok(secret) = settings::auth_secret() else {
        return Ok(refuse(&AuthError::new(
            500,
            "INTERNAL_SERVER_ERROR",
            "Internal Server Error",
        )));
    };
    let db = pool(&ctx);
    let row = sqlx::query(
        "SELECT u.id, u.email, u.display_name, u.avatar_url, u.email_verified, u.is_active, u.created_at, \
                u.updated_at, a.password \
         FROM users u INNER JOIN auth_accounts a \
           ON a.user_id = u.id AND a.provider_id = 'credential' AND a.account_id = u.id \
         WHERE u.email = $1 LIMIT 1",
    )
    .bind(email.to_lowercase())
    .fetch_optional(db)
    .await
    .map_err(|e| Error::string(&e.to_string()))?;
    let Some(row) = row else {
        // Hash anyway, so "no such account" costs what a wrong password does.
        bcrypt_burn(password).await;
        return Ok(refuse(&invalid_credentials()));
    };
    let Some(hash) = row.get::<Option<String>, _>("password").filter(|h| !h.is_empty()) else {
        bcrypt_burn(password).await;
        return Ok(refuse(&invalid_credentials()));
    };
    if !bcrypt_verify(password, hash).await {
        return Ok(refuse(&invalid_credentials()));
    }
    // D-30: checked after the password, so it discloses nothing to a guesser.
    if row.get::<Option<bool>, _>("is_active") == Some(false) {
        return Ok(refuse(&invalid_credentials()));
    }
    let user = ba::user_json(&row);
    let user_id: String = row.get("id");
    let dont_remember = body.get("rememberMe") == Some(&Value::Bool(false));
    let ip = ba::client_ip(&headers);
    let ua = headers.get(header::USER_AGENT).and_then(|v| v.to_str().ok());
    let session = ba::create_session(db, &user_id, dont_remember, ip.as_deref(), ua)
        .await
        .map_err(|e| Error::string(&e.to_string()))?;
    let cookies = ba::session_cookies(&session.token, dont_remember, &secret);
    let callback = body.get("callbackURL").and_then(Value::as_str);
    let mut out = Map::new();
    out.insert("redirect".into(), json!(callback.is_some()));
    out.insert("token".into(), json!(session.token));
    if let Some(cb) = callback {
        out.insert("url".into(), json!(cb));
    }
    out.insert("user".into(), user);
    let extra: Vec<(&str, String)> = callback
        .map(|cb| ("location", cb.to_string()))
        .into_iter()
        .collect();
    Ok(respond(200, &Value::Object(out), &cookies, &extra))
}

/// `POST /api/auth/sign-out`: delete the session row and expire the cookies.
async fn sign_out(State(ctx): State<AppContext>, headers: HeaderMap, bytes: Bytes) -> Result<Response> {
    if let Some(r) = rate_limit(&headers, "/sign-out") {
        return Ok(r);
    }
    let body = match read_body(&headers, &bytes, &["application/json"]) {
        Ok(b) => b,
        Err(e) => return Ok(refuse(&e)),
    };
    if let Err(e) = origin_middleware(&headers, &body) {
        return Ok(refuse(&e));
    }
    let cookies = cookie_header(&headers);
    if let (Some(raw), Ok(secret)) = (read_session_cookie(&cookies), settings::auth_secret()) {
        if let Some(token) = verify_signed_token(raw, &secret) {
            if let Err(e) = sqlx::query("DELETE FROM auth_sessions WHERE token = $1")
                .bind(&token)
                .execute(pool(&ctx))
                .await
            {
                tracing::error!(error = %e, "Failed to delete session from database");
            }
        }
    }
    Ok(respond(
        200,
        &json!({ "success": true }),
        &ba::expired_cookies(),
        &[],
    ))
}

#[derive(Debug, Deserialize)]
struct GetSessionQuery {
    #[serde(rename = "disableRefresh")]
    disable_refresh: Option<String>,
}

fn no_store() -> Vec<(&'static str, String)> {
    vec![
        ("cache-control", "no-store".into()),
        ("pragma", "no-cache".into()),
    ]
}

/// `GET /api/auth/get-session`.
async fn get_session(
    State(ctx): State<AppContext>,
    headers: HeaderMap,
    Query(q): Query<GetSessionQuery>,
) -> Result<Response> {
    if let Some(r) = rate_limit(&headers, "/get-session") {
        return Ok(r);
    }
    let Ok(secret) = settings::auth_secret() else {
        return Ok(refuse(&AuthError::new(
            500,
            "FAILED_TO_GET_SESSION",
            "Failed to get session",
        )));
    };
    let cookies = cookie_header(&headers);
    // A cookie-cache cookie is cleared: this configuration does not use one.
    let mut set: Vec<String> = Vec::new();
    if crate::auth::session::read_cookie(
        &cookies,
        &format!(
            "{}ers.session_data",
            if ba::secure_cookies() { "__Secure-" } else { "" }
        ),
    )
    .is_some()
    {
        set.push(ba::expired_session_data_cookie());
    }
    let Some(token) = ba::signed_cookie(&cookies, "session_token", &secret) else {
        return Ok(respond(200, &Value::Null, &set, &no_store()));
    };
    let db = pool(&ctx);
    let found = ba::find_session(db, &token)
        .await
        .map_err(|e| Error::string(&e.to_string()))?;
    let now = ba::now_ms();
    let Some((session, user, _)) = found.filter(|(s, _, active)| s.expires_at >= now && *active) else {
        // Gone, expired or (D-30) deactivated: sign the browser out. An expired
        // row is deleted, as Better Auth does.
        sqlx::query("DELETE FROM auth_sessions WHERE token = $1 AND expires_at < $2")
            .bind(&token)
            .bind(now)
            .execute(db)
            .await
            .map_err(|e| Error::string(&e.to_string()))?;
        set.extend(ba::expired_cookies());
        return Ok(respond(200, &Value::Null, &set, &no_store()));
    };
    let dont_remember = ba::signed_cookie(&cookies, "dont_remember", &secret).is_some();
    let disable_refresh = q
        .disable_refresh
        .as_deref()
        .is_some_and(|v| !v.is_empty() && v != "false");
    if !dont_remember && !disable_refresh && ba::needs_refresh(session.expires_at, now) {
        let Some(updated) = ba::extend_session(db, &token)
            .await
            .map_err(|e| Error::string(&e.to_string()))?
        else {
            let e = AuthError::new(401, "FAILED_TO_GET_SESSION", "Failed to get session");
            return Ok(respond(401, &e.body(), &ba::expired_cookies(), &no_store()));
        };
        set.extend(ba::session_cookies(&updated.token, false, &secret));
        return Ok(respond(
            200,
            &json!({ "session": updated.json(), "user": user }),
            &set,
            &no_store(),
        ));
    }
    Ok(respond(
        200,
        &json!({ "session": session.json(), "user": user }),
        &set,
        &no_store(),
    ))
}

/// `GET /api/auth/session` — the REST twin of `getSessionFn`
/// (`getSessionFromHeaders`): `{ session: Session | null }`. It extends a day-old
/// session in the database as Better Auth's in-process `getSession` does.
async fn session_twin(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
    headers: HeaderMap,
) -> Result<Response> {
    let Some(mut s) = session else {
        return Ok(respond(200, &json!({ "session": null }), &[], &no_store()));
    };
    let cookies = cookie_header(&headers);
    if let Ok(secret) = settings::auth_secret() {
        if let Some(token) = ba::signed_cookie(&cookies, "session_token", &secret) {
            let db = pool(&ctx);
            if let Ok(Some((row, _, _))) = ba::find_session(db, &token).await {
                let dont_remember = ba::signed_cookie(&cookies, "dont_remember", &secret).is_some();
                if !dont_remember && ba::needs_refresh(row.expires_at, ba::now_ms()) {
                    if let Ok(Some(updated)) = ba::extend_session(db, &token).await {
                        s.expires = iso(updated.expires_at);
                    }
                }
            }
        }
    }
    Ok(respond(200, &json!({ "session": s }), &[], &no_store()))
}

/// `GET /api/auth/permissions`.
async fn permissions(
    State(ctx): State<AppContext>,
    CurrentSession(session): CurrentSession,
) -> Result<Response> {
    let empty = json!({
        "userId": "",
        "roles": [],
        "rolePermissions": [],
        "resourcePermissions": [],
        "isAdmin": false,
    });
    let Some(session) = session else {
        return Ok(respond(200, &empty, &[], &[]));
    };
    let db = pool(&ctx);
    let roles = sqlx::query(
        "SELECT roles.* FROM roles INNER JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = $1",
    )
    .bind(&session.user.id)
    .fetch_all(db)
    .await
    .map_err(|e| Error::string(&e.to_string()))?;
    let mut role_permissions: Vec<Value> = Vec::new();
    let mut role_ids: Vec<String> = Vec::new();
    let mut role_list = Vec::new();
    let mut named_admin = false;
    for r in &roles {
        let id: String = r.get("id");
        let name: String = r.get("name");
        let raw: Option<String> = r.get("permissions");
        // `flatMap(JSON.parse)`: an array spreads, anything else is one item,
        // and a parse failure contributes nothing.
        match raw.as_deref().map(serde_json::from_str::<Value>) {
            Some(Ok(Value::Array(items))) => role_permissions.extend(items),
            Some(Ok(other)) => role_permissions.push(other),
            _ => {}
        }
        let lower = name.to_lowercase();
        named_admin |= lower == "admin" || lower == "administrator";
        role_list.push(json!({ "id": id, "name": name, "permissions": raw }));
        role_ids.push(id);
    }
    let mut unique: Vec<Value> = Vec::new();
    for p in role_permissions {
        if !unique.contains(&p) {
            unique.push(p);
        }
    }
    let is_admin = named_admin
        || unique
            .iter()
            .any(|p| matches!(p.as_str(), Some("*" | "*:*" | "admin:*")));
    // D-31: only the caller's own roles' grants (all of them for an admin).
    let grants = if is_admin {
        sqlx::query("SELECT * FROM resource_permissions")
            .fetch_all(db)
            .await
    } else {
        sqlx::query("SELECT * FROM resource_permissions WHERE role_id = ANY($1)")
            .bind(&role_ids)
            .fetch_all(db)
            .await
    }
    .map(|rows| pg_rows_to_json(&rows))
    .unwrap_or_default();
    Ok(respond(
        200,
        &json!({
            "userId": session.user.id,
            "roles": role_list,
            "rolePermissions": unique,
            "resourcePermissions": grants,
            "isAdmin": is_admin,
        }),
        &[],
        &[],
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/auth")
        .add("/sign-in/email", post(sign_in))
        .add("/sign-out", post(sign_out))
        .add("/get-session", get(get_session))
        .add("/session", get(session_twin))
        .add("/permissions", get(permissions))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sign_in_schema_messages() {
        let e = validate_sign_in(&json!({ "email": "a@b.co" })).unwrap_err();
        assert_eq!(
            e.message,
            "[body.password] Invalid input: expected string, received undefined"
        );
        let e = validate_sign_in(&json!({ "email": 1, "password": "x", "rememberMe": "no" })).unwrap_err();
        assert_eq!(
            e.message,
            "[body.email] Invalid input: expected string, received number; \
             [body.rememberMe] Invalid input: expected boolean, received string"
        );
        let e = validate_sign_in(&json!(null)).unwrap_err();
        assert_eq!(e.message, "[body] Invalid input: expected object, received null");
        assert!(validate_sign_in(&json!({ "email": "a", "password": "b" })).is_ok());
    }

    #[test]
    fn media_types() {
        let mut h = HeaderMap::new();
        let e = read_body(&h, b"{}", &["application/json"]).unwrap_err();
        assert_eq!(
            e.message,
            "Content-Type is required. Allowed types: application/json"
        );
        h.insert(header::CONTENT_TYPE, "text/plain".parse().unwrap());
        let e = read_body(&h, b"{}", &["application/json"]).unwrap_err();
        assert_eq!(
            e.message,
            "Content-Type \"text/plain\" is not allowed. Allowed types: application/json"
        );
        h.insert(
            header::CONTENT_TYPE,
            "application/json; charset=utf-8".parse().unwrap(),
        );
        assert_eq!(
            read_body(&h, b"{\"a\":1}", &["application/json"]).unwrap(),
            json!({ "a": 1 })
        );
        assert_eq!(
            read_body(&h, b"", &["application/json"]).unwrap_err().code,
            "BAD_REQUEST"
        );
        h.insert(
            header::CONTENT_TYPE,
            "application/x-www-form-urlencoded".parse().unwrap(),
        );
        assert_eq!(
            read_body(
                &h,
                b"email=a%40b.co&password=x",
                &["application/x-www-form-urlencoded"]
            )
            .unwrap(),
            json!({ "email": "a@b.co", "password": "x" })
        );
    }
}
