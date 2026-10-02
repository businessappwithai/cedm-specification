//! Natural-language querying — `POST /api/ai/query` (decision D5).
//!
//! **The add-on is deliberately unconfigured in `config/test.yaml`**, so this
//! suite runs with no model server present and asserts the behaviour that does
//! not need one: the guard, the 503, and the request validation that happens
//! before any call is made. That covers everything an untrusted caller can
//! reach without a model.
//!
//! What it cannot cover here is the model's own output. That is pinned by unit
//! tests in `src/services/nl_query.rs` — plan parsing, the limit clamp, the
//! code-fence unwrap, and the assertion that a plan has nowhere to put SQL —
//! because those need no network at all. Between the two, the only untested
//! path is a live completion, which no CI run should depend on.
//!
//! Generated: 2026-10-02T01:02:22.858Z
//! Project: automotive

use serial_test::serial;

use crate::support::{self, bearer};

/// The endpoint must refuse to work rather than half-work.
///
/// With no `ai_base_url`/`ai_model` the handler answers 503 before it builds a
/// prompt or touches the dictionary. The failure this guards against is the
/// opposite: an add-on that silently returns an empty result set when it is not
/// configured, which reads as "no matching records" — a wrong answer rather
/// than a missing feature.
#[tokio::test]
#[serial]
async fn an_unconfigured_add_on_answers_503_rather_than_an_empty_result() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/ai/query")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({ "query": "how many records are there" }))
            .await;

        assert_eq!(
            response.status_code(),
            503,
            "an unconfigured add-on must say so: {}",
            response.text()
        );
        assert!(
            response.text().contains("not configured"),
            "the message should name the cause: {}",
            response.text()
        );
    })
    .await;
}

/// An empty question is rejected before the add-on's configuration is read.
///
/// Ordering matters here and is asserted rather than assumed: validating the
/// request first means a caller gets the same 400 whether or not a model is
/// wired up, so the error does not change meaning when the add-on is turned on.
#[tokio::test]
#[serial]
async fn an_empty_question_is_a_400_not_a_503() {
    support::with_app(|request, _ctx, token| async move {
        for empty in ["", "   "] {
            let response = request
                .post("/api/ai/query")
                .add_header("authorization", bearer(&token))
                .json(&serde_json::json!({ "query": empty }))
                .await;

            assert_eq!(
                response.status_code(),
                400,
                "an empty question is a bad request, not a missing service: {}",
                response.text()
            );
        }
    })
    .await;
}

/// A question long enough to be a denial-of-wallet is refused.
#[tokio::test]
#[serial]
async fn an_over_long_question_is_refused() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/ai/query")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({ "query": "a".repeat(5_000) }))
            .await;

        assert_eq!(
            response.status_code(),
            400,
            "an over-long question must not reach the model: {}",
            response.text()
        );
    })
    .await;
}

/// A body without the field is a 400 from the extractor, not a 500.
#[tokio::test]
#[serial]
async fn a_malformed_body_is_rejected() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/ai/query")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({ "question": "wrong field name" }))
            .await;

        assert!(
            response.status_code() == 400 || response.status_code() == 422,
            "a body missing `query` should be a client error, got {}: {}",
            response.status_code(),
            response.text()
        );
    })
    .await;
}
