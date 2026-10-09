//! Shared test harness.
//!
//! The TypeScript suites this replaces drove a running server over HTTP. These
//! drive the app in-process through `loco_rs::testing::request`, which is the
//! same axum router `cargo loco start` mounts — so the coverage is unchanged
//! while the toolchain, the port juggling and the "is the backend up yet?"
//! polling all disappear.
//!
//! Generated: 2026-10-09T06:46:28.851Z
//! Project: telecommunications

#![allow(dead_code)]

pub mod entities;
pub mod factory;

use loco_rs::app::Hooks;
use loco_rs::prelude::*;
use loco_rs::testing::request::request as boot_request;
use loco_rs::TestServer;
use serde_json::Value;
use std::sync::Once;

use telecommunications::app::App;

/// The seeded administrator. Matches `tasks::ensure_admin`, which is what the
/// `seed` hook runs — change one and this fails loudly rather than silently
/// logging in as nobody.
pub const ADMIN_EMAIL: &str = "admin@admin.com";
pub const ADMIN_PASSWORD: &str = "admin";

static SEEDED: Once = Once::new();

/// Boot the app, make sure the dictionary exists, and hand the suite an
/// authenticated server.
///
/// The dictionary is the load-bearing part: it is applied by a *task*, not a
/// migration, and without it every `/api/bus/*` route 404s because the generic
/// controller has no table registry to resolve against. `Hooks::seed` runs both
/// that and the administrator, and both are idempotent, so calling it here is
/// safe on a database that already has them.
pub async fn with_app<F, Fut>(callback: F)
where
    F: FnOnce(TestServer, AppContext, String) -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    boot_request::<App, _, _>(|request, ctx| async move {
        seed_once(&ctx).await;
        let token = login(&request).await;
        clear_test_rules(&ctx).await;
        callback(request, ctx, token).await;
    })
    .await;
}

/// Seed the dictionary once per test binary rather than once per test.
///
/// `Once` only guards the *decision*; the seed itself is idempotent, so a race
/// would be harmless — this is purely to keep 40-odd suites from re-running the
/// same few hundred inserts.
async fn seed_once(ctx: &AppContext) {
    let mut needs_seed = false;
    SEEDED.call_once(|| {
        needs_seed = true;
    });
    if needs_seed {
        <App as Hooks>::seed(ctx, std::path::Path::new("."))
            .await
            .expect("could not seed the application dictionary");
    }
}

/// Deactivate any rule a previous test authored.
///
/// The rules suites write rules that match every row, and a test that fails an
/// assertion never reaches its own cleanup — so one real failure used to fire
/// on every later write in the binary and bury its own cause under a dozen
/// unrelated ones. Clearing on entry makes each test independent of whatever
/// the last one did or failed to undo.
///
/// The access rules get the same treatment. `requests::rbac` authors operation
/// rules of its own and sets the model's aside while it probes a table, so on
/// entry every test sees exactly the rules the model declared: the suite's
/// leftovers removed and the model's back in force.
///
/// Straight to the database rather than through the API: this is setup, and it
/// must work even when the thing under test does not.
async fn clear_test_rules(ctx: &AppContext) {
    use sea_orm::ConnectionTrait;
    for statement in [
        "UPDATE sys_rule_definitions SET is_active = false WHERE rule_name LIKE 'e2e-%'",
        "DELETE FROM sys_operation_access WHERE is_model_managed = FALSE",
        "UPDATE sys_operation_access SET is_active = TRUE, updated_at = NOW() \
         WHERE is_model_managed = TRUE AND is_active = FALSE",
    ] {
        let _ = ctx.db.execute_unprepared(statement).await;
    }
}

/// Sign in as the administrator and return the bearer token.
///
/// Panics rather than returning an error: every suite needs this, and a failure
/// means the app was not seeded, which no individual assertion could explain
/// more clearly.
pub async fn login(request: &TestServer) -> String {
    let response = request
        .post("/api/auth/login")
        .json(&serde_json::json!({ "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD }))
        .await;

    assert_eq!(
        response.status_code(),
        200,
        "login failed for {ADMIN_EMAIL} — was the app seeded? body: {}",
        response.text()
    );

    response
        .json::<Value>()
        .get("token")
        .and_then(Value::as_str)
        .expect("login returned no token")
        .to_string()
}

/// `Authorization: Bearer …`, the header every authenticated route wants.
pub fn bearer(token: &str) -> String {
    format!("Bearer {token}")
}

/// `If-Match` for a record as it was read: `"v{version}"`.
///
/// Every entity is optimistic unless its model says otherwise, so an update
/// names the version it was read at — the generated frontend does the same.
/// A record with no version (one that came from a list of another shape) is
/// sent as `*`, a deliberate overwrite.
pub fn if_match(record: &Value) -> String {
    record
        .get("version")
        .and_then(Value::as_i64)
        .map_or_else(|| "*".to_string(), |version| format!("\"v{version}\""))
}

/// The rows out of a `{ data, meta }` list response.
pub fn rows(body: &Value) -> Vec<Value> {
    body.get("data")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
}

/// `meta.total` from a list response.
pub fn total(body: &Value) -> u64 {
    body.get("meta")
        .and_then(|m| m.get("total"))
        .and_then(Value::as_u64)
        .unwrap_or(0)
}
