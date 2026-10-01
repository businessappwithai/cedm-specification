//! One line per request, on the way out.
//!
//! Loco installs a `TraceLayer` that opens an `http-request` **span** carrying
//! the method, URI and request id. A span is not an event: it decorates the
//! events emitted inside it and records nothing by itself, and `tower-http`'s
//! own completion event is `DEBUG`, which `config/production.yaml` filters out
//! at `info`. So a production deployment logged no record of a request having
//! been served at all — four requests produced seven lines, every one of them
//! either a SQL statement or an error, and none of them saying that a request
//! finished or how long it took.
//!
//! This is the missing line. It is a layer around the whole router rather than
//! anything per-handler, and that placement is the point: a 401 from the JWT
//! extractor, a 403 from `authz`, a 404 for a route that does not exist and a
//! panic caught upstream are all produced *below* this layer, so all of them
//! are seen. The NestJS sibling learned the same thing the hard way — its
//! equivalent is a Fastify `onResponse` hook and never a Nest interceptor,
//! because an interceptor runs after the guards and therefore sees no refusal
//! at all.
//!
//! A 404 for a route the router does not know carries no request id, and that
//! is correct rather than a gap: Loco's id middleware is layered onto the
//! routes, and an unmatched request never reaches them. The line says `none`
//! instead of inventing one, because an id that correlates with nothing is
//! worse than an honest absence.
//!
//! **The query string is deliberately not logged.** `?email=…&status=…` is
//! business data, and the log specification's rule is that a field's value
//! never reaches a log line. The path alone answers what was served; the
//! filters that were applied are the caller's business.
//!
//! Generated: 2026-10-01T05:17:24.775Z
//! Project: container-logistics

use std::time::Instant;

use axum::{extract::Request, middleware::Next, response::Response};
use loco_rs::controller::middleware::request_id::LocoRequestId;

/// What a request id is called when the id middleware did not run.
const NO_REQUEST_ID: &str = "none";

/// The header Loco's request-id middleware writes onto the response.
const X_REQUEST_ID: &str = "x-request-id";

/// Emit one catalogued event per request, chosen by the status class.
///
/// Three events rather than one carrying a status field, because they are three
/// different things to whoever reads them: a completion is traffic, a refusal
/// is a client being told no, and a failure is this application breaking. They
/// carry the same fields, so one query can still read all three together.
pub async fn log_request(request: Request, next: Next) -> Response {
    let method = request.method().to_string();
    // `uri().path()`, never `uri()` — see the note above on the query string.
    let path = request.uri().path().to_string();
    // Read on the way in *and* on the way out, because which one carries the id
    // depends on layer order and this layer is deliberately outermost. Loco
    // applies its own middlewares beneath `after_routes`, so its request-id
    // layer inserts the extension below this one — invisible here — and the id
    // only becomes reachable as the `x-request-id` header it puts on the
    // response. Reading the extension first keeps this correct if that order
    // ever reverses, which is exactly when a silently empty id would be hardest
    // to notice.
    let extension_id = request
        .extensions()
        .get::<LocoRequestId>()
        .map(|id| id.get().to_string());

    let started = Instant::now();
    let response = next.run(request).await;

    let request_id = extension_id.unwrap_or_else(|| {
        response
            .headers()
            .get(X_REQUEST_ID)
            .and_then(|value| value.to_str().ok())
            .map_or_else(|| NO_REQUEST_ID.to_string(), ToString::to_string)
    });

    let status = response.status();
    // Converted rather than cast: a request held open for longer than a u64 of
    // milliseconds is not a number anyone needs exactly, and a wrapped one
    // reads as a suspiciously fast request rather than a stuck one.
    let duration_ms = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);
    let code = status.as_u16();

    if status.is_server_error() {
        crate::log_event!(
            request_failed,
            method = method,
            path = path,
            status = code,
            durationMs = duration_ms,
            requestId = request_id
        );
    } else if status.is_client_error() {
        crate::log_event!(
            request_refused,
            method = method,
            path = path,
            status = code,
            durationMs = duration_ms,
            requestId = request_id
        );
    } else {
        crate::log_event!(
            request_completed,
            method = method,
            path = path,
            status = code,
            durationMs = duration_ms,
            requestId = request_id
        );
    }

    response
}
