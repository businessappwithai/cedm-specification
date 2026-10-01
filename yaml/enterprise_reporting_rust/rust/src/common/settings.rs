//! Process-level secrets and switches, read from the same environment variables
//! the Node service reads. Both services must agree on `AUTH_SECRET` (session
//! cookie signatures) and `ENCRYPTION_KEY` (data-source configs); a mismatch
//! reads as "signed out" or "data source cannot be opened".

/// Better Auth's minimum; the Node service refuses to boot below it.
pub const MIN_AUTH_SECRET_LEN: usize = 32;

/// `AUTH_SECRET`, validated. Missing or short is an error, as in
/// `src/lib/auth/better-auth.ts`.
///
/// # Errors
/// When the variable is unset or shorter than 32 characters.
pub fn auth_secret() -> Result<String, String> {
    match std::env::var("AUTH_SECRET") {
        Ok(s) if s.len() >= MIN_AUTH_SECRET_LEN => Ok(s),
        _ => Err(
            "[FATAL] AUTH_SECRET env var is missing or too short (minimum 32 characters). \
             It must be the same value the Node service uses."
                .to_string(),
        ),
    }
}

#[must_use]
pub fn is_production() -> bool {
    std::env::var("NODE_ENV").is_ok_and(|v| v == "production")
        || std::env::var("LOCO_ENV").is_ok_and(|v| v == "production")
}

/// `WORKER_CONCURRENCY`, default 5, as `worker-runner.ts`.
#[must_use]
pub fn worker_concurrency() -> u32 {
    std::env::var("WORKER_CONCURRENCY")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(5)
}
