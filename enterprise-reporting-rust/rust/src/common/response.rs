//! The `{ success, data | error }` envelopes the Node routes return, and the
//! `json()` helper's exact content type (`src/lib/server/response.ts`).
use axum::{
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use serde_json::{json, Value};

fn respond(status: StatusCode, body: &Value) -> Response {
    (
        status,
        [(header::CONTENT_TYPE, "application/json")],
        body.to_string(),
    )
        .into_response()
}

/// `{ success: true, data }` with 200.
#[must_use]
pub fn ok(data: Value) -> Response {
    respond(StatusCode::OK, &json!({ "success": true, "data": data }))
}

/// `{ success: true, data }` with a chosen status (201 on create).
#[must_use]
pub fn ok_with(status: StatusCode, data: Value) -> Response {
    respond(status, &json!({ "success": true, "data": data }))
}

/// An arbitrary JSON body (health, and routes that do not use the envelope).
#[must_use]
pub fn raw(status: StatusCode, body: &Value) -> Response {
    respond(status, body)
}

/// `{ success: false, error: { code, message } }`.
#[must_use]
pub fn error(status: StatusCode, code: &str, message: &str) -> Response {
    respond(
        status,
        &json!({ "success": false, "error": { "code": code, "message": message } }),
    )
}

/// `{ success: false, error: { message } }` — several Node routes omit `code`
/// (e.g. `/api/queries`), and the envelope is the contract.
#[must_use]
pub fn error_no_code(status: StatusCode, message: &str) -> Response {
    respond(
        status,
        &json!({ "success": false, "error": { "message": message } }),
    )
}

/// The 401 most routes return.
#[must_use]
pub fn unauthorized() -> Response {
    error(StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Not authenticated")
}

/// Log an internal failure and return the route's generic 500. The detail goes
/// to the log, never to the client — as the Node routes do.
pub fn server_error<E: std::fmt::Display>(context: &str, err: E, code: &str, message: &str) -> Response {
    tracing::error!(error = %err, "{context}");
    error(StatusCode::INTERNAL_SERVER_ERROR, code, message)
}
