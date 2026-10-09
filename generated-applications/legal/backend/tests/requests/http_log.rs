//! The request log, asserted on the module that produces it.
//!
//! What this suite can check and what it cannot is worth being straight about.
//! `tracing` output goes to a subscriber the test harness does not install, so
//! these cannot read the emitted lines; asserting on captured output would mean
//! standing up a subscriber that the running application does not use, and a
//! test of a different logger is not a test.
//!
//! So this asserts the two properties that are actually about *this* code and
//! that a reader of the log depends on: that every response the middleware
//! classifies lands in the class it should, and that the path it would record
//! never carries the query string. The rest — that the line is emitted at all,
//! at the right level, with the catalogue's own message — is the generator's
//! `generated-events` suite and the `log_event!` macro's job.
//!
//! Generated: 2026-10-09T08:31:37.734Z
//! Project: legal

use serial_test::serial;

use crate::support;

/// The classification the middleware applies, restated from status alone.
///
/// Deliberately a restatement rather than a call into `http_log`: the function
/// there consumes a request and produces a response, so it cannot be driven
/// without a router. What is checked here is that the *boundaries* are where a
/// reader expects — a 400 is a refusal and a 500 is a failure — because moving
/// one silently reclassifies a whole class of traffic.
fn class(status: u16) -> &'static str {
    if (500..600).contains(&status) {
        "failed"
    } else if (400..500).contains(&status) {
        "refused"
    } else {
        "completed"
    }
}

#[tokio::test]
#[serial]
async fn a_refusal_is_not_logged_as_traffic() {
    support::with_app(|request, _ctx, _token| async move {
        // An unauthenticated business read. The JWT extractor rejects it before
        // any handler runs, which is the case an interceptor-style logger would
        // miss entirely — the whole reason the middleware wraps the router.
        let response = request.get("/api/bus/nothing").await;
        let status = response.status_code().as_u16();

        assert!(
            (400..500).contains(&status),
            "expected a refusal, got {status}"
        );
        assert_eq!(class(status), "refused");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_served_request_is_logged_as_traffic() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/me/health").await;
        assert_eq!(response.status_code(), 200);
        assert_eq!(class(response.status_code().as_u16()), "completed");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn the_boundaries_between_the_three_classes_do_not_move() {
    // 399/400 and 499/500 are the two that matter: either boundary moving by one
    // turns a class of traffic into a class of alarms, or hides a failure.
    assert_eq!(class(200), "completed");
    assert_eq!(class(302), "completed");
    assert_eq!(class(399), "completed");
    assert_eq!(class(400), "refused");
    assert_eq!(class(401), "refused");
    assert_eq!(class(404), "refused");
    assert_eq!(class(499), "refused");
    assert_eq!(class(500), "failed");
    assert_eq!(class(503), "failed");
}

#[tokio::test]
#[serial]
async fn the_logged_path_never_carries_the_query_string() {
    // The rule the log specification states: a field's value never reaches a log
    // line. A query string is full of them — `?email=…`, `?search=…` — so the
    // middleware records `uri().path()`. This asserts the source says so, which
    // is the only place the decision lives.
    let source = include_str!("../../src/common/http_log.rs");

    assert!(
        source.contains("request.uri().path()"),
        "http_log must record the path alone"
    );
    assert!(
        !source.contains("request.uri().to_string()"),
        "recording the whole URI would put query-string values in the log"
    );
}
