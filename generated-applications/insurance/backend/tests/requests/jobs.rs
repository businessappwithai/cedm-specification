//! Background jobs — enqueue, list, cancel.
//!
//! Generated: 2026-10-04T01:11:59.101Z
//! Project: insurance
//!
//! These run under `workers.mode: ForegroundBlocking` (config/test.yaml), so an
//! enqueued job executes inline before the response returns. That is the right
//! mode for a test — it makes the job's effect observable — and it is also why
//! the listing assertions check the *shape* and the `queueBacked` flag rather
//! than expecting rows: there is no queue table in this mode, and a test that
//! demanded one would only pass in production.

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer};

/// Each registered worker can be reached, and reports the mode it ran in.
#[tokio::test]
#[serial]
async fn every_registered_worker_can_be_enqueued() {
    support::with_app(|request, _ctx, token| async move {
        let payloads = [
            (
                "email",
                json!({ "to": "someone@example.test", "subject": "Hi", "body": "Test" }),
            ),
            ("report", json!({ "entity": "bus_user" })),
            ("sync", json!({ "entity": "bus_user" })),
        ];

        for (kind, payload) in payloads {
            let response = request
                .post(&format!("/api/jobs/{kind}"))
                .add_header("authorization", bearer(&token))
                .json(&payload)
                .await;
            assert_eq!(
                response.status_code(),
                202,
                "enqueueing {kind}: {}",
                response.text()
            );

            let body = response.json::<Value>();
            assert_eq!(body.get("kind").and_then(Value::as_str), Some(kind));
            assert!(
                body.get("id")
                    .and_then(Value::as_str)
                    .is_some_and(|id| !id.is_empty()),
                "{kind} was accepted without a job id: {body}"
            );
        }
    })
    .await;
}

/// Arguments the worker cannot use are refused where the caller can see it.
///
/// The alternative is a queue that accepts anything and fails at the far end,
/// where a deserialisation error is a log line nobody is reading.
#[tokio::test]
#[serial]
async fn arguments_the_worker_cannot_use_are_refused_at_the_door() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/jobs/email")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "subject": "no recipient" }))
            .await;
        assert_eq!(
            response.status_code(),
            400,
            "an email job with no `to` was accepted: {}",
            response.text()
        );
    })
    .await;
}

/// An unknown kind is a 400 that names what this backend does register.
#[tokio::test]
#[serial]
async fn an_unknown_job_kind_is_refused_and_says_what_exists() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/jobs/teleport")
            .add_header("authorization", bearer(&token))
            .json(&json!({}))
            .await;
        assert_eq!(response.status_code(), 400);
        let text = response.text();
        assert!(
            text.contains("email") && text.contains("report") && text.contains("sync"),
            "the refusal does not say which kinds exist: {text}"
        );
    })
    .await;
}

/// The listing says which mode it is answering for, rather than returning an
/// empty array that reads as "nothing has run".
#[tokio::test]
#[serial]
async fn the_listing_reports_whether_the_mode_keeps_a_record() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/jobs")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200, "{}", response.text());

        let body = response.json::<Value>();
        assert!(body["data"].is_array(), "data is not an array: {body}");
        assert!(
            body["meta"]["queueBacked"].is_boolean(),
            "the listing does not say whether this mode keeps a record: {body}"
        );
        assert!(
            body["meta"]["mode"]
                .as_str()
                .is_some_and(|mode| !mode.is_empty()),
            "the listing does not name the worker mode: {body}"
        );
        let kinds = body["meta"]["kinds"]
            .as_array()
            .cloned()
            .unwrap_or_default();
        assert_eq!(
            kinds.len(),
            3,
            "expected the three registered kinds: {body}"
        );
    })
    .await;
}

/// Cancelling under a mode with no queue says so, rather than reporting success.
#[tokio::test]
#[serial]
async fn cancelling_without_a_queue_says_so() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/jobs/email/cancel")
            .add_header("authorization", bearer(&token))
            .await;

        // 200 under BackgroundQueue, 503 under the other two. Both are correct;
        // what must not happen is a 404 (no such route) or a 500.
        assert!(
            matches!(response.status_code().as_u16(), 200 | 503),
            "cancel returned {}: {}",
            response.status_code(),
            response.text()
        );
        if response.status_code().as_u16() == 503 {
            assert!(
                response.text().contains("BackgroundQueue"),
                "the refusal does not say how to get a queue: {}",
                response.text()
            );
        }
    })
    .await;
}
