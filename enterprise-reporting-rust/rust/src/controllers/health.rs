use axum::{http::StatusCode, response::Response, routing::get};
use loco_rs::prelude::*;
use serde_json::json;

use crate::common::{response, time::now_iso};

async fn health() -> Result<Response> {
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "status": "ok", "timestamp": now_iso() }),
    ))
}

pub fn routes() -> Routes {
    Routes::new().prefix("api/health").add("/", get(health))
}
