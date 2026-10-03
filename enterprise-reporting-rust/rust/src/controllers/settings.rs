//! `/api/settings/email` — twin of `src/routes/api/settings/email.ts`.
//!
//! Node parity (MIGRATION_PLAN.md §9, P-10): `verify` only checks that the
//! variables are set, and `test` never sends — it answers "not configured"
//! whatever the configuration.
use axum::{body::Bytes, http::StatusCode, response::Response, routing::get};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use super::support::parse_body;
use crate::{auth::CurrentSession, common::response, monitoring::js::number_from_str};

fn env(k: &str) -> String {
    std::env::var(k).unwrap_or_default()
}

fn configured() -> bool {
    !env("SMTP_HOST").is_empty() && !env("SMTP_USER").is_empty()
}

/// `Number(process.env.SMTP_PORT || 587)`, NaN as JSON `null`.
fn port() -> Value {
    let raw = env("SMTP_PORT");
    let n = if raw.is_empty() {
        587.0
    } else {
        number_from_str(&raw)
    };
    serde_json::Number::from_f64(n).map_or(Value::Null, |x| {
        if n.fract() == 0.0 && n.abs() < 9e15 {
            #[allow(clippy::cast_possible_truncation)]
            let whole = n as i64;
            json!(whole)
        } else {
            Value::Number(x)
        }
    })
}

async fn show(CurrentSession(session): CurrentSession) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let or = |k: &str, d: &str| {
        let v = env(k);
        if v.is_empty() {
            d.to_string()
        } else {
            v
        }
    };
    Ok(response::ok(json!({
        "smtp": {
            "host": env("SMTP_HOST"),
            "port": port(),
            "secure": env("SMTP_SECURE") == "true",
            "user": env("SMTP_USER"),
            "configured": configured(),
        },
        "sender": {
            "from": or("EMAIL_FROM", "noreply@example.com"),
            "fromName": env("EMAIL_FROM_NAME"),
        },
        "connectionPooling": {
            "maxConnections": 5,
            "maxMessagesPerConnection": 100,
            "autoReuse": true,
        },
    })))
}

/// `{ success: false, error }` with 200, as Node answers these actions.
fn refusal(code: &str, message: &str) -> Response {
    response::raw(
        StatusCode::OK,
        &json!({ "success": false, "error": { "code": code, "message": message } }),
    )
}

async fn action(CurrentSession(session): CurrentSession, body: Bytes) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let Some(body) = parse_body(&body) else {
        return Ok(response::error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "SERVER_ERROR",
            "Failed to process request",
        ));
    };
    match body.get("action").and_then(Value::as_str) {
        Some("verify") if !configured() => Ok(refusal(
            "NOT_CONFIGURED",
            "SMTP not configured. Set SMTP_HOST and SMTP_USER environment variables.",
        )),
        Some("verify") => Ok(response::ok(
            json!({ "verified": true, "message": "SMTP configuration is valid" }),
        )),
        Some("test") if !crate::common::js::truthy(body.get("to")) => Ok(refusal(
            "INVALID_INPUT",
            "Recipient email address is required",
        )),
        Some("test") => Ok(refusal(
            "NOT_CONFIGURED",
            "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable email sending.",
        )),
        _ => Ok(response::error(
            StatusCode::BAD_REQUEST,
            "INVALID_ACTION",
            "Unknown action",
        )),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/settings/email")
        .add("/", get(show).post(action))
}
