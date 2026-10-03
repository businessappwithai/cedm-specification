//! Issuing Better Auth sessions: the parts of `better-auth` 1.7 that
//! `src/lib/auth/better-auth.ts` configures and this application uses —
//! email/password sign-in, sign-out and `get-session` — reproduced so that a
//! session issued here is indistinguishable from one issued by Node.
//!
//! What has to agree, byte for byte, for the two to share sessions:
//!
//! - **the row**: `auth_sessions` with a 32-character alphanumeric `id` and
//!   `token`, `expires_at` seven days out (one day for "don't remember me"),
//!   and the caller's IP and user agent;
//! - **the cookie**: `ers.session_token` (`__Secure-` prefixed when the base URL
//!   is HTTPS) holding `encodeURIComponent(token + "." + base64(HMAC-SHA256))`,
//!   `Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`;
//! - **the checks around it**: the trusted-origin check on cookie-bearing
//!   POSTs, the Fetch-Metadata CSRF check on sign-in, and the per-IP, per-path
//!   rate limit with this configuration's rules.
//!
//! The rate limiter is Better Auth's `memory` store: per process. Two backends
//! serving `/api/auth/*` at once would each allow the full budget, so the
//! routes are served by one or the other (MIGRATION_PLAN.md §9, D-29).
use std::{
    collections::HashMap,
    net::IpAddr,
    sync::{LazyLock, Mutex},
};

use axum::http::HeaderMap;
use base64::Engine;
use chrono::{DateTime, TimeZone, Utc};
use hmac::{Hmac, Mac};
use percent_encoding::{AsciiSet, NON_ALPHANUMERIC};
use rand::Rng;
use serde_json::{json, Value};
use sha2::Sha256;
use sqlx::{PgPool, Row};

use super::session::COOKIE_PREFIX;
use crate::common::{settings, time::iso};

/// `session.expiresIn`: seven days.
pub const SESSION_EXPIRES_IN: i64 = 60 * 60 * 24 * 7;
/// `session.updateAge`: a session is extended once it is a day old.
pub const SESSION_UPDATE_AGE: i64 = 60 * 60 * 24;
/// A "don't remember me" session lasts a day.
const DONT_REMEMBER_EXPIRES_IN: i64 = 60 * 60 * 24;

/// `encodeURIComponent`'s unreserved set.
const URI_COMPONENT: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'_')
    .remove(b'.')
    .remove(b'!')
    .remove(b'~')
    .remove(b'*')
    .remove(b'\'')
    .remove(b'(')
    .remove(b')');

/// `BETTER_AUTH_URL`, else `APP_URL`, else the dev server.
#[must_use]
pub fn base_url() -> String {
    ["BETTER_AUTH_URL", "APP_URL"]
        .iter()
        .find_map(|k| std::env::var(k).ok().filter(|v| !v.is_empty()))
        .unwrap_or_else(|| "http://localhost:4050".into())
}

/// Better Auth marks cookies `Secure` and prefixes them `__Secure-` when the
/// base URL is HTTPS.
#[must_use]
pub fn secure_cookies() -> bool {
    base_url().starts_with("https://")
}

fn cookie_name(name: &str) -> String {
    let prefix = if secure_cookies() { "__Secure-" } else { "" };
    format!("{prefix}{COOKIE_PREFIX}.{name}")
}

/// `isDevelopment() || isTest()` — where Better Auth falls back to 127.0.0.1
/// for a request with no usable forwarded address.
fn is_dev_or_test() -> bool {
    match std::env::var("NODE_ENV") {
        Ok(v) => v == "development" || v == "test",
        Err(_) => !settings::is_production(),
    }
}

/// The origin (`scheme://host[:port]`) of an absolute URL.
#[must_use]
pub fn origin_of(url: &str) -> Option<String> {
    let u = url::Url::parse(url).ok()?;
    match u.origin() {
        o @ url::Origin::Tuple(..) => Some(o.ascii_serialization()),
        url::Origin::Opaque(_) => None,
    }
}

/// `trustedOrigins`: the base URL's origin, `CORS_ORIGIN`, the localhost
/// development origins outside production, and `BETTER_AUTH_TRUSTED_ORIGINS`.
#[must_use]
pub fn trusted_origins() -> Vec<String> {
    let mut out: Vec<String> = origin_of(&base_url()).into_iter().collect();
    if let Ok(list) = std::env::var("CORS_ORIGIN") {
        out.extend(
            list.split(',')
                .map(|o| o.trim().to_string())
                .filter(|o| !o.is_empty()),
        );
    }
    if let Ok(list) = std::env::var("BETTER_AUTH_TRUSTED_ORIGINS") {
        out.extend(list.split(',').map(str::to_string).filter(|o| !o.is_empty()));
    }
    if !settings::is_production() {
        out.extend(
            [
                "http://localhost:4050",
                "http://127.0.0.1:4050",
                "http://localhost:3000",
            ]
            .map(String::from),
        );
    }
    out
}

/// Better Auth's `wildcardMatch`: `*` any run, `?` one character.
fn wildcard(pattern: &str, text: &str) -> bool {
    let (p, t): (Vec<char>, Vec<char>) = (pattern.chars().collect(), text.chars().collect());
    let (mut pi, mut ti, mut star, mut mark) = (0usize, 0usize, None, 0usize);
    while ti < t.len() {
        if pi < p.len() && (p[pi] == '?' || p[pi] == t[ti]) {
            pi += 1;
            ti += 1;
        } else if pi < p.len() && p[pi] == '*' {
            star = Some(pi);
            mark = ti;
            pi += 1;
        } else if let Some(s) = star {
            pi = s + 1;
            mark += 1;
            ti = mark;
        } else {
            return false;
        }
    }
    p[pi..].iter().all(|c| *c == '*')
}

/// `matchesOriginPattern` for http(s) URLs.
fn matches_origin(url: &str, pattern: &str) -> bool {
    let Some(origin) = origin_of(url) else {
        return false;
    };
    if pattern.contains('*') || pattern.contains('?') {
        if pattern.contains("://") {
            return wildcard(pattern, &origin);
        }
        let host = url::Url::parse(url)
            .ok()
            .and_then(|u| u.host_str().map(str::to_string));
        return host.is_some_and(|h| wildcard(pattern, &h));
    }
    origin == pattern
}

/// Is `url` a trusted origin? Relative paths count only where Better Auth
/// allows them (callback URLs).
#[must_use]
pub fn is_trusted(url: &str, allow_relative: bool) -> bool {
    if url.starts_with('/') {
        return allow_relative && !url.starts_with("//") && !url.contains('\\');
    }
    trusted_origins().iter().any(|p| matches_origin(url, p))
}

/// A Better Auth error: `{ message, code }` with its status.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthError {
    pub status: u16,
    pub code: &'static str,
    pub message: String,
}

impl AuthError {
    #[must_use]
    pub fn new(status: u16, code: &'static str, message: &str) -> Self {
        Self {
            status,
            code,
            message: message.to_string(),
        }
    }

    #[must_use]
    pub fn body(&self) -> Value {
        json!({ "message": self.message, "code": self.code })
    }
}

fn header<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name).and_then(|v| v.to_str().ok())
}

/// `validateOrigin`: a cookie-bearing (or, with `force`, any) request must
/// name a trusted `Origin` (or `Referer`).
///
/// # Errors
/// `MISSING_OR_NULL_ORIGIN` or `INVALID_ORIGIN`, both 403.
pub fn validate_origin(headers: &HeaderMap, force: bool) -> Result<(), AuthError> {
    if !(force || headers.contains_key(axum::http::header::COOKIE)) {
        return Ok(());
    }
    let origin = header(headers, "origin");
    let claimed = origin
        .filter(|o| !o.is_empty())
        .or_else(|| header(headers, "referer"))
        .unwrap_or_default();
    let inferred = (origin == Some("null") && header(headers, "sec-fetch-site") == Some("same-origin"))
        .then(|| origin_of(&base_url()))
        .flatten();
    let to_check = inferred.as_deref().unwrap_or(claimed);
    if to_check.is_empty() || to_check == "null" {
        return Err(AuthError::new(
            403,
            "MISSING_OR_NULL_ORIGIN",
            "Missing or null Origin",
        ));
    }
    if !trusted_origins().iter().any(|p| matches_origin(to_check, p)) {
        return Err(AuthError::new(403, "INVALID_ORIGIN", "Invalid origin"));
    }
    Ok(())
}

/// `validateFormCsrf` (sign-in): with no cookie, Fetch Metadata decides — a
/// cross-site navigation is refused, any other browser request must carry a
/// trusted origin, and a non-browser caller (no metadata) passes.
///
/// # Errors
/// A 403 naming the check that failed.
pub fn validate_form_csrf(headers: &HeaderMap) -> Result<(), AuthError> {
    if headers.contains_key(axum::http::header::COOKIE) {
        return validate_origin(headers, false);
    }
    let get = |n| header(headers, n).map(str::trim).filter(|v| !v.is_empty());
    let (site, mode, dest) = (
        get("sec-fetch-site"),
        get("sec-fetch-mode"),
        get("sec-fetch-dest"),
    );
    if site.is_none() && mode.is_none() && dest.is_none() {
        return Ok(());
    }
    if site == Some("cross-site") && mode == Some("navigate") {
        return Err(AuthError::new(
            403,
            "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED",
            "Cross-site navigation login blocked. This request appears to be a CSRF attack.",
        ));
    }
    validate_origin(headers, true)
}

/// `getIP`: the one address in `X-Forwarded-For` (a list is not trusted
/// without configured proxies), else 127.0.0.1 in development, else none.
#[must_use]
pub fn client_ip(headers: &HeaderMap) -> Option<String> {
    if let Some(v) = header(headers, "x-forwarded-for") {
        let ips: Vec<&str> = v.split(',').map(str::trim).filter(|s| !s.is_empty()).collect();
        if let [one] = ips.as_slice() {
            if let Ok(ip) = one.parse::<IpAddr>() {
                return Some(normalize_ip(ip));
            }
        }
    }
    is_dev_or_test().then(|| "127.0.0.1".to_string())
}

/// `normalizeIP`: IPv4 (and IPv4-mapped IPv6) as dotted quad; IPv6 reduced to
/// its /64 subnet, written as eight zero-padded groups, so one host cannot
/// rotate through addresses.
fn normalize_ip(ip: IpAddr) -> String {
    match ip {
        IpAddr::V4(v4) => v4.to_string(),
        IpAddr::V6(v6) => {
            if let Some(v4) = v6.to_ipv4_mapped() {
                return v4.to_string();
            }
            let s = v6.segments();
            (0..8)
                .map(|i| format!("{:04x}", if i < 4 { s[i] } else { 0 }))
                .collect::<Vec<_>>()
                .join(":")
        }
    }
}

// ── Rate limiting ────────────────────────────────────────────────────────────

struct Entry {
    count: u32,
    last_ms: i64,
    expires_ms: i64,
}

const MAX_ENTRIES: usize = 100_000;

static MEMORY: LazyLock<Mutex<HashMap<String, Entry>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

/// `(window seconds, max)` for a path under `/api/auth`: the configured
/// default (60/60), Better Auth's built-in special rules, then this
/// configuration's `customRules`.
#[must_use]
pub fn rule_for(path: &str) -> (i64, u32) {
    let mut rule = (60, 60);
    if ["/sign-in", "/sign-up", "/change-password", "/change-email"]
        .iter()
        .any(|p| path.starts_with(p))
    {
        rule = (10, 3);
    } else if matches!(
        path,
        "/request-password-reset"
            | "/send-verification-email"
            | "/email-otp/send-verification-otp"
            | "/email-otp/request-password-reset"
    ) || path.starts_with("/forget-password")
    {
        rule = (60, 3);
    }
    match path {
        "/sign-in/email" => (60, 5),
        "/sign-up/email" | "/forget-password" => (60, 3),
        "/reset-password" => (60, 5),
        _ => rule,
    }
}

/// One request against the limit. `Err(seconds)` is the `X-Retry-After`.
///
/// # Errors
/// When the caller is over the limit.
pub fn consume(ip: Option<&str>, path: &str, now_ms: i64) -> Result<(), i64> {
    let (window, max) = rule_for(path);
    let window_ms = window * 1000;
    let key = format!("{}|{path}", ip.unwrap_or("no-trusted-ip"));
    let mut memory = MEMORY.lock().unwrap_or_else(std::sync::PoisonError::into_inner);
    memory.retain(|_, e| now_ms < e.expires_ms);
    // Better Auth's MEMORY_STORE_MAX_ENTRIES: a client rotating forwarded
    // addresses must not grow this without bound.
    if memory.len() >= MAX_ENTRIES {
        let overflow = memory.len() + 1 - MAX_ENTRIES;
        let victims: Vec<String> = memory.keys().take(overflow).cloned().collect();
        for k in victims {
            memory.remove(&k);
        }
    }
    let next = match memory.get(&key) {
        None => 1,
        Some(e) if now_ms - e.last_ms >= window_ms => 1,
        Some(e) if e.count >= max => {
            // Integer ceiling of the milliseconds left, as Math.ceil(ms / 1000).
            let left = e.last_ms + window_ms - now_ms;
            return Err((left + 999).div_euclid(1000));
        }
        Some(e) => e.count + 1,
    };
    memory.insert(
        key,
        Entry {
            count: next,
            last_ms: now_ms,
            expires_ms: now_ms + window_ms,
        },
    );
    Ok(())
}

// ── Cookies ──────────────────────────────────────────────────────────────────

/// `generateId(size)`: `a-zA-Z0-9`, uniformly.
#[must_use]
pub fn generate_id(size: usize) -> String {
    const ALPHABET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    (0..size)
        .map(|_| ALPHABET[rng.gen_range(0..ALPHABET.len())] as char)
        .collect()
}

/// better-call `signCookieValue`, as the cookie carries it.
#[must_use]
pub fn signed_cookie_value(value: &str, secret: &str) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(value.as_bytes());
    let sig = base64::engine::general_purpose::STANDARD.encode(mac.finalize().into_bytes());
    percent_encoding::utf8_percent_encode(&format!("{value}.{sig}"), URI_COMPONENT).to_string()
}

fn serialize_cookie(name: &str, value: &str, max_age: Option<i64>) -> String {
    let mut c = format!("{name}={value}");
    if let Some(m) = max_age {
        c.push_str(&format!("; Max-Age={m}"));
    }
    c.push_str("; Path=/; HttpOnly");
    if secure_cookies() {
        c.push_str("; Secure");
    }
    c.push_str("; SameSite=Lax");
    c
}

/// The `Set-Cookie` values sign-in writes.
#[must_use]
pub fn session_cookies(token: &str, dont_remember: bool, secret: &str) -> Vec<String> {
    let mut out = vec![serialize_cookie(
        &cookie_name("session_token"),
        &signed_cookie_value(token, secret),
        (!dont_remember).then_some(SESSION_EXPIRES_IN),
    )];
    if dont_remember {
        out.push(serialize_cookie(
            &cookie_name("dont_remember"),
            &signed_cookie_value("true", secret),
            None,
        ));
    }
    out
}

/// `deleteSessionCookie`: the token, the (unused) cookie cache and the
/// "don't remember" marker, all expired.
#[must_use]
pub fn expired_cookies() -> Vec<String> {
    ["session_token", "session_data", "dont_remember"]
        .iter()
        .map(|n| serialize_cookie(&cookie_name(n), "", Some(0)))
        .collect()
}

/// The cookie-cache cookie alone, expired: `get-session` clears a stale one
/// because this configuration does not use the cache.
#[must_use]
pub fn expired_session_data_cookie() -> String {
    serialize_cookie(&cookie_name("session_data"), "", Some(0))
}

/// The signed value of cookie `name` (prefix applied), verified.
#[must_use]
pub fn signed_cookie(cookie_header: &str, name: &str, secret: &str) -> Option<String> {
    let raw = super::session::read_cookie(cookie_header, &cookie_name(name))?;
    super::session::verify_signed_token(raw, secret)
}

// ── Rows ─────────────────────────────────────────────────────────────────────

/// `new Date(value)` for the `VARCHAR` timestamps of `users`, then its JSON
/// (`null` for an invalid date).
fn js_date_json(v: Option<String>) -> Value {
    let Some(s) = v else { return Value::Null };
    if let Ok(t) = DateTime::parse_from_rfc3339(&s) {
        return json!(iso(t.with_timezone(&Utc)));
    }
    for fmt in ["%Y-%m-%d %H:%M:%S%.f", "%Y-%m-%dT%H:%M:%S%.f"] {
        if let Ok(n) = chrono::NaiveDateTime::parse_from_str(&s, fmt) {
            if let Some(t) = chrono::Local.from_local_datetime(&n).earliest() {
                return json!(iso(t.with_timezone(&Utc)));
            }
        }
    }
    Value::Null
}

/// Better Auth's user output, in its field order.
#[must_use]
pub fn user_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "name": row.get::<Option<String>, _>("display_name"),
        "email": row.get::<String, _>("email"),
        "emailVerified": row.get::<Option<bool>, _>("email_verified").unwrap_or(false),
        "image": row.get::<Option<String>, _>("avatar_url"),
        "createdAt": js_date_json(row.get("created_at")),
        "updatedAt": js_date_json(row.get("updated_at")),
        "is_active": row.get::<Option<bool>, _>("is_active"),
        "id": row.get::<String, _>("id"),
    })
}

/// An `auth_sessions` row as Better Auth outputs it.
#[derive(Debug, Clone)]
pub struct SessionRow {
    pub id: String,
    pub token: String,
    pub user_id: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

impl SessionRow {
    #[must_use]
    pub fn json(&self) -> Value {
        json!({
            "expiresAt": iso(self.expires_at),
            "token": self.token,
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
            "ipAddress": self.ip_address,
            "userAgent": self.user_agent,
            "userId": self.user_id,
            "id": self.id,
        })
    }

    fn from_row(r: &sqlx::postgres::PgRow) -> Self {
        Self {
            id: r.get("s_id"),
            token: r.get("token"),
            user_id: r.get("user_id"),
            expires_at: r.get("expires_at"),
            created_at: r.get("s_created_at"),
            updated_at: r.get("s_updated_at"),
            ip_address: r.get("ip_address"),
            user_agent: r.get("user_agent"),
        }
    }
}

/// Now, at JavaScript's millisecond precision, so what is stored and what is
/// returned are the same instant.
#[must_use]
pub fn now_ms() -> DateTime<Utc> {
    let now = Utc::now();
    Utc.timestamp_millis_opt(now.timestamp_millis())
        .single()
        .unwrap_or(now)
}

/// `internalAdapter.createSession`.
///
/// # Errors
/// On a database error.
pub async fn create_session(
    pool: &PgPool,
    user_id: &str,
    dont_remember: bool,
    ip: Option<&str>,
    user_agent: Option<&str>,
) -> Result<SessionRow, sqlx::Error> {
    let now = now_ms();
    let lifetime = if dont_remember {
        DONT_REMEMBER_EXPIRES_IN
    } else {
        SESSION_EXPIRES_IN
    };
    let row = SessionRow {
        id: generate_id(32),
        token: generate_id(32),
        user_id: user_id.to_string(),
        expires_at: now + chrono::Duration::seconds(lifetime),
        created_at: now,
        updated_at: now,
        ip_address: Some(ip.unwrap_or_default().to_string()),
        user_agent: Some(user_agent.unwrap_or_default().to_string()),
    };
    sqlx::query(
        "INSERT INTO auth_sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&row.id)
    .bind(&row.user_id)
    .bind(&row.token)
    .bind(row.expires_at)
    .bind(&row.ip_address)
    .bind(&row.user_agent)
    .bind(row.created_at)
    .bind(row.updated_at)
    .execute(pool)
    .await?;
    Ok(row)
}

const SESSION_SELECT: &str = "SELECT s.id AS s_id, s.token, s.user_id, s.expires_at, s.created_at AS s_created_at, \
            s.updated_at AS s_updated_at, s.ip_address, s.user_agent, \
            u.id, u.email, u.display_name, u.avatar_url, u.email_verified, u.is_active, u.created_at, u.updated_at \
     FROM auth_sessions s INNER JOIN users u ON u.id = s.user_id WHERE s.token = $1";

/// `internalAdapter.findSession`: the row and its user's output, expired or not.
///
/// # Errors
/// On a database error.
pub async fn find_session(
    pool: &PgPool,
    token: &str,
) -> Result<Option<(SessionRow, Value, bool)>, sqlx::Error> {
    let row = sqlx::query(SESSION_SELECT)
        .bind(token)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| {
        let active = r.get::<Option<bool>, _>("is_active").unwrap_or(true);
        (SessionRow::from_row(&r), user_json(&r), active)
    }))
}

/// Extend a session by `expiresIn` from now. `None` if the row has gone.
///
/// # Errors
/// On a database error.
pub async fn extend_session(pool: &PgPool, token: &str) -> Result<Option<SessionRow>, sqlx::Error> {
    let now = now_ms();
    let updated = sqlx::query("UPDATE auth_sessions SET expires_at = $2, updated_at = $3 WHERE token = $1")
        .bind(token)
        .bind(now + chrono::Duration::seconds(SESSION_EXPIRES_IN))
        .bind(now)
        .execute(pool)
        .await?;
    if updated.rows_affected() == 0 {
        return Ok(None);
    }
    Ok(find_session(pool, token).await?.map(|(s, _, _)| s))
}

/// Should `get-session` extend this session? Once it is `updateAge` old.
#[must_use]
pub fn needs_refresh(expires_at: DateTime<Utc>, now: DateTime<Utc>) -> bool {
    expires_at - chrono::Duration::seconds(SESSION_EXPIRES_IN) + chrono::Duration::seconds(SESSION_UPDATE_AGE)
        <= now
}

/// zod v4's `z.email()` pattern:
/// `^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$`
/// (the two look-aheads, which `regex` does not have, checked by hand).
#[must_use]
pub fn is_valid_email(s: &str) -> bool {
    static RE: LazyLock<regex::Regex> = LazyLock::new(|| {
        regex::Regex::new(r"^([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$")
            .expect("static pattern")
    });
    !s.starts_with('.') && !s.contains("..") && RE.is_match(s)
}

/// bcrypt cost for new hashes: `BCRYPT_COST`, default 12 (`bcrypt-cost.ts`).
#[must_use]
pub fn bcrypt_cost() -> u32 {
    std::env::var("BCRYPT_COST")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(12)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signed_value_matches_node() {
        // From a Node sign-in with AUTH_SECRET = parity secret.
        let secret = "parity-secret-0123456789abcdef0123456789abcdef";
        let v = signed_cookie_value("tl7pB2cI0WnZ680GHuz1rvErICQnIFTC", secret);
        assert_eq!(
            v,
            "tl7pB2cI0WnZ680GHuz1rvErICQnIFTC.7uAkLYRPBy7c1SSQhPmWFGynRBKIY%2B2aUh3N8O%2FR28M%3D"
        );
        assert_eq!(
            super::super::session::verify_signed_token(&v, secret).as_deref(),
            Some("tl7pB2cI0WnZ680GHuz1rvErICQnIFTC")
        );
    }

    #[test]
    fn email_pattern() {
        for ok in ["admin@admin.com", "a.b+c@x-y.example.org", "o'neil@ex.io"] {
            assert!(is_valid_email(ok), "{ok}");
        }
        for bad in [
            "a@b.c",
            "not-an-email",
            ".a@b.co",
            "a..b@c.co",
            "a.@b.co",
            "a@-b.co",
            "",
        ] {
            assert!(!is_valid_email(bad), "{bad}");
        }
    }

    #[test]
    fn rules() {
        assert_eq!(rule_for("/sign-in/email"), (60, 5));
        assert_eq!(rule_for("/sign-in/social"), (10, 3));
        assert_eq!(rule_for("/get-session"), (60, 60));
        assert_eq!(rule_for("/forget-password/x"), (60, 3));
    }

    #[test]
    fn limiter_window_slides_and_reports_retry() {
        let path = "/sign-in/email";
        let ip = Some("203.0.113.9");
        let t0 = 1_000_000;
        for i in 0..5 {
            assert!(consume(ip, path, t0 + i * 1000).is_ok());
        }
        // The window is measured from the last allowed request (t0 + 4s).
        assert_eq!(consume(ip, path, t0 + 10_000), Err(54));
        assert!(consume(ip, path, t0 + 64_000).is_ok());
        assert!(consume(Some("203.0.113.10"), path, t0 + 10_000).is_ok());
    }

    #[test]
    fn forwarded_for() {
        let mut h = HeaderMap::new();
        h.insert("x-forwarded-for", "198.51.100.7".parse().unwrap());
        assert_eq!(client_ip(&h).as_deref(), Some("198.51.100.7"));
        h.insert("x-forwarded-for", "2001:db8:1:2:3:4:5:6".parse().unwrap());
        assert_eq!(
            client_ip(&h).as_deref(),
            Some("2001:0db8:0001:0002:0000:0000:0000:0000")
        );
    }

    #[test]
    fn globbing() {
        assert!(wildcard("https://*.example.com", "https://app.example.com"));
        assert!(!wildcard("https://*.example.com", "https://example.org"));
        assert!(matches_origin(
            "http://localhost:4050/login?x=1",
            "http://localhost:4050"
        ));
        assert!(!matches_origin("http://localhost:4051", "http://localhost:4050"));
    }

    #[test]
    fn refresh_after_a_day() {
        let now = Utc::now();
        let fresh = now + chrono::Duration::seconds(SESSION_EXPIRES_IN - 10);
        let old = now + chrono::Duration::seconds(SESSION_EXPIRES_IN - SESSION_UPDATE_AGE - 1);
        assert!(!needs_refresh(fresh, now));
        assert!(needs_refresh(old, now));
    }
}
