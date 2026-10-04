//! The rate limiter, driven over HTTP through a router of its own.
//!
//! It is not driven through the application, and that is deliberate.
//! `config/test.yaml` switches both budgets off, because the generated suites
//! produce volumes in seconds that no human session produces in an hour — the
//! bulk-seed suite alone creates thousands of records through HTTP as one
//! caller — so a budget there would be testing the limiter rather than the
//! application, and every unrelated suite would start failing with a 429 whose
//! cause none of them names.
//!
//! So this suite does what `requests/rbac.rs` does with its own rules: it
//! builds the conditions it needs. The middleware is layered over a two-route
//! router with a budget small enough to cross inside one test, and driven with
//! `tower`'s `oneshot`. What is exercised is the real `enforce` — the same
//! function `app.rs` layers onto the real router — including the key it derives
//! from the request, the scope it picks from the path, the 429 it builds and
//! the headers it writes.
//!
//! Generated: 2026-10-04T01:12:44.630Z
//! Project: regulatory

use std::{net::SocketAddr, sync::Arc};

use axum::{
    body::Body,
    extract::ConnectInfo,
    http::{Request, StatusCode},
    routing::{get, post},
    Router,
};
use tower::ServiceExt;

use regulatory::common::rate_limit::{enforce, Limiter};

/// A router carrying the middleware, a business route and a credential route.
fn app(general: u32, auth: u32) -> Router {
    let limiter = Arc::new(Limiter::with_budgets(general, auth));
    Router::new()
        .route("/api/bus/thing", get(|| async { "ok" }))
        .route("/api/me/health", get(|| async { "ok" }))
        .route("/api/auth/login", post(|| async { "ok" }))
        .layer(axum::middleware::from_fn_with_state(limiter, enforce))
}

/// A request carrying a peer address, which is what an anonymous caller is
/// counted by. Without it every anonymous caller shares the `unknown` bucket
/// and two "different" callers in a test would be the same one.
fn from(address: &str, method: &str, path: &str) -> Request<Body> {
    let mut request = Request::builder()
        .method(method)
        .uri(path)
        .body(Body::empty())
        .expect("the test request is well-formed");
    let peer: SocketAddr = format!("{address}:54321")
        .parse()
        .expect("the test address is well-formed");
    request.extensions_mut().insert(ConnectInfo(peer));
    request
}

#[tokio::test]
async fn a_caller_over_its_budget_is_refused_with_429() {
    let router = app(2, 2);

    for _ in 0..2 {
        let response = router
            .clone()
            .oneshot(from("10.1.0.1", "GET", "/api/bus/thing"))
            .await
            .expect("the router answers");
        assert_eq!(response.status(), StatusCode::OK);
    }

    let refused = router
        .clone()
        .oneshot(from("10.1.0.1", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");
    assert_eq!(refused.status(), StatusCode::TOO_MANY_REQUESTS);

    // Retry-After is what a client obeys. Without it a refusal says only "no",
    // and a client that retries immediately turns one refusal into a loop.
    let headers = refused.headers();
    assert!(headers.contains_key("retry-after"), "no Retry-After");
    assert_eq!(
        headers
            .get("ratelimit-remaining")
            .and_then(|value| value.to_str().ok()),
        Some("0")
    );
    assert_eq!(
        headers
            .get("ratelimit-limit")
            .and_then(|value| value.to_str().ok()),
        Some("2")
    );
}

#[tokio::test]
async fn a_served_response_says_how_much_budget_is_left() {
    let router = app(5, 5);

    let response = router
        .oneshot(from("10.1.0.2", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");

    assert_eq!(response.status(), StatusCode::OK);
    // On the way through, not only at the wall: a client that can read its
    // remaining budget can slow down before it is refused.
    assert_eq!(
        response
            .headers()
            .get("ratelimit-remaining")
            .and_then(|value| value.to_str().ok()),
        Some("4")
    );
    assert!(
        !response.headers().contains_key("retry-after"),
        "Retry-After on a served response says the opposite of what happened"
    );
}

#[tokio::test]
async fn one_caller_exhausting_its_budget_does_not_refuse_another() {
    let router = app(1, 1);

    let first = router
        .clone()
        .oneshot(from("10.1.0.3", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");
    assert_eq!(first.status(), StatusCode::OK);

    let again = router
        .clone()
        .oneshot(from("10.1.0.3", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");
    assert_eq!(again.status(), StatusCode::TOO_MANY_REQUESTS);

    // The control that matters as much as the refusal: a limit that refuses
    // everyone once anyone is over is an outage, not a limit.
    let other = router
        .oneshot(from("10.1.0.4", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");
    assert_eq!(other.status(), StatusCode::OK);
}

#[tokio::test]
async fn the_credential_budget_is_spent_separately_from_the_general_one() {
    let router = app(10, 1);

    let signin = router
        .clone()
        .oneshot(from("10.1.0.5", "POST", "/api/auth/login"))
        .await
        .expect("the router answers");
    assert_eq!(signin.status(), StatusCode::OK);

    let guessing_again = router
        .clone()
        .oneshot(from("10.1.0.5", "POST", "/api/auth/login"))
        .await
        .expect("the router answers");
    assert_eq!(guessing_again.status(), StatusCode::TOO_MANY_REQUESTS);

    // Two budgets sharing one counter is one budget. A caller who has used up
    // its sign-in allowance must still be able to use the application.
    let business = router
        .oneshot(from("10.1.0.5", "GET", "/api/bus/thing"))
        .await
        .expect("the router answers");
    assert_eq!(business.status(), StatusCode::OK);
}

#[tokio::test]
async fn the_readiness_probe_is_never_refused() {
    let router = app(1, 1);

    // An orchestrator polls this every few seconds from the same address as
    // everything else behind the proxy. Counting it would let the probe
    // exhaust the budget of whoever shares that address.
    for _ in 0..20 {
        let response = router
            .clone()
            .oneshot(from("10.1.0.6", "GET", "/api/me/health"))
            .await
            .expect("the router answers");
        assert_eq!(response.status(), StatusCode::OK);
    }
}

#[tokio::test]
async fn a_budget_of_zero_serves_everything() {
    let router = app(0, 0);

    // What `config/test.yaml` sets, so this is also the assertion that the
    // suites above it are running against an application with no limit.
    for _ in 0..50 {
        let response = router
            .clone()
            .oneshot(from("10.1.0.7", "POST", "/api/auth/login"))
            .await
            .expect("the router answers");
        assert_eq!(response.status(), StatusCode::OK);
    }
}

#[tokio::test]
async fn a_forged_forwarded_header_does_not_buy_a_fresh_bucket() {
    let router = app(1, 1);

    let mut first = from("10.1.0.8", "GET", "/api/bus/thing");
    first.headers_mut().insert(
        "x-forwarded-for",
        "203.0.113.1".parse().expect("a well-formed header"),
    );
    let served = router
        .clone()
        .oneshot(first)
        .await
        .expect("the router answers");
    assert_eq!(served.status(), StatusCode::OK);

    // A different forwarded address, the same peer. `trust_proxy` is off, so
    // the header is ignored and the second request lands in the first one's
    // bucket. Believing it would let any client hand itself a fresh budget per
    // request, which is the whole of the sign-in limit undone.
    let mut second = from("10.1.0.8", "GET", "/api/bus/thing");
    second.headers_mut().insert(
        "x-forwarded-for",
        "203.0.113.2".parse().expect("a well-formed header"),
    );
    let refused = router.oneshot(second).await.expect("the router answers");
    assert_eq!(refused.status(), StatusCode::TOO_MANY_REQUESTS);
}
