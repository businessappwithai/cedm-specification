//! `GET /api/filters` — twin of `src/routes/api/filters.ts`.
use axum::{extract::State, http::StatusCode, response::Response, routing::get};
use loco_rs::prelude::*;
use serde_json::Value;

use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        response,
    },
};

/// Node parity: unpaginated and unordered (MIGRATION_PLAN.md §9, P-5) —
/// filter definitions are configuration, not user data.
async fn list(CurrentSession(session): CurrentSession, State(ctx): State<AppContext>) -> Result<Response> {
    if session.is_none() {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            "Not authenticated",
        ));
    }
    Ok(
        match sqlx::query("SELECT * FROM filter_definitions")
            .fetch_all(pool(&ctx))
            .await
        {
            Ok(rows) => response::ok(Value::Array(pg_rows_to_json(&rows))),
            Err(e) => {
                tracing::error!(error = %e, "Error fetching filters");
                response::error_no_code(StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch filters")
            }
        },
    )
}

pub fn routes() -> Routes {
    Routes::new().prefix("api/filters").add("/", get(list))
}
