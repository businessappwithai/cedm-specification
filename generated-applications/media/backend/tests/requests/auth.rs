//! Authentication — the login every other suite depends on.
//!
//! Generated: 2026-10-02T09:01:52.398Z
//! Project: media

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, ADMIN_EMAIL, ADMIN_PASSWORD};

#[tokio::test]
#[serial]
async fn logs_in_as_the_seeded_administrator() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request
            .post("/api/auth/login")
            .json(&json!({ "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD }))
            .await;

        assert_eq!(response.status_code(), 200);
        let body = response.json::<Value>();
        assert!(body.get("token").and_then(Value::as_str).is_some());
        assert_eq!(
            body.pointer("/user/email").and_then(Value::as_str),
            Some(ADMIN_EMAIL)
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn keeps_the_session_across_requests() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/me")
            .add_header("authorization", bearer(&token))
            .await;

        assert_eq!(response.status_code(), 200);
        assert!(response.json::<Value>().get("user").is_some());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_a_wrong_password() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request
            .post("/api/auth/login")
            .json(&json!({ "email": ADMIN_EMAIL, "password": "definitely-not-the-password" }))
            .await;

        assert!(response.status_code().is_client_error());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_an_unknown_account() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request
            .post("/api/auth/login")
            .json(&json!({ "email": "nobody@nowhere.invalid", "password": "whatever-123" }))
            .await;

        // Deliberately the same answer as a wrong password: distinguishing them
        // would turn the endpoint into an account enumerator.
        assert!(response.status_code().is_client_error());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn registers_a_new_account_and_signs_it_in() {
    support::with_app(|request, _ctx, _token| async move {
        let email = format!("e2e-{}@example.test", uuid::Uuid::new_v4());

        let created = request
            .post("/api/auth/register")
            .json(&json!({ "email": &email, "password": "hunter2-hunter2", "name": "E2E User" }))
            .await;
        assert_eq!(created.status_code(), 201);

        // Registration does not sign you in — it returns the created user and
        // no token. An explicit login is what has to work.
        let signed_in = request
            .post("/api/auth/login")
            .json(&json!({ "email": &email, "password": "hunter2-hunter2" }))
            .await;
        assert_eq!(signed_in.status_code(), 200);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn changes_a_password_only_with_the_current_one() {
    support::with_app(|request, _ctx, token| async move {
        let wrong = request
            .post("/api/auth/change-password")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "currentPassword": "not-it", "newPassword": "a-new-password" }))
            .await;

        // A token left on a shared machine must not be enough to lock its
        // owner out.
        assert!(wrong.status_code().is_client_error());
    })
    .await;
}
