//! Liveness and readiness.
//!
//! Generated: 2026-10-09T08:30:58.718Z
//! Project: enterprise

use serde_json::Value;
use serial_test::serial;

use crate::support;

#[tokio::test]
#[serial]
async fn reports_ok_from_api_me_health() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/me/health").await;
        assert_eq!(response.status_code(), 200);

        let body = response.json::<Value>();
        assert_eq!(body.get("status").and_then(Value::as_str), Some("ok"));
        // A process that answers before it can reach the database is not
        // healthy — this is the distinction the endpoint exists to make.
        assert_eq!(body.get("database").and_then(Value::as_bool), Some(true));
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_an_unauthenticated_me() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/me").await;
        assert_eq!(response.status_code(), 401);
    })
    .await;
}
