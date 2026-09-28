//! `GET /api/help/articles[?q=]` — twin of `src/routes/api/help/articles.ts`.
use axum::{
    extract::{Query, State},
    response::Response,
    routing::get,
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::Value;

use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        response,
    },
};

#[derive(Debug, Deserialize)]
struct HelpQuery {
    q: Option<String>,
}

fn field(v: &Value, k: &str) -> String {
    v.get(k)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_lowercase()
}

async fn articles(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<HelpQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let q = q.q.unwrap_or_default().to_lowercase();
    let rows =
        match sqlx::query("SELECT * FROM help_articles WHERE is_published = true ORDER BY sort_order ASC")
            .fetch_all(pool(&ctx))
            .await
        {
            Ok(r) => r,
            Err(e) => {
                return Ok(response::server_error(
                    "Error fetching help articles",
                    e,
                    "SERVER_ERROR",
                    "Failed to fetch help articles",
                ))
            }
        };
    // Node filters in memory over the (small, fixed) article set; so does this.
    let items: Vec<Value> = pg_rows_to_json(&rows)
        .into_iter()
        .filter(|a| {
            q.is_empty()
                || field(a, "title").contains(&q)
                || field(a, "keywords").contains(&q)
                || field(a, "summary").contains(&q)
        })
        .collect();
    Ok(response::ok(Value::Array(items)))
}

pub fn routes() -> Routes {
    Routes::new().prefix("api/help").add("/articles", get(articles))
}
