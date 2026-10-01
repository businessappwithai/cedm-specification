//! `/api/logs` — twin of `src/routes/api/logs/{index,components,users}.ts`.
//! (`/api/logs/search` ranks by embedding similarity and moves with the NL
//! pipeline in Phase 5.)
use std::collections::HashMap;

use axum::{
    body::Bytes,
    extract::{Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};

use super::support::{is_admin_by_role_name, parse_body};
use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        js,
        pagination::{js_parse_int, max_page_size},
        response,
        time::now_iso,
    },
};

fn error(message: &str) -> Response {
    response::error(StatusCode::INTERNAL_SERVER_ERROR, "ERROR", message)
}

async fn write(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(error("Unexpected end of JSON input"));
    };
    let r = sqlx::query(
        "INSERT INTO logs (id, timestamp, level, message, component, user_id, metadata, error_stack) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(now_iso())
    .bind(body.get("level").and_then(js::text))
    .bind(body.get("message").and_then(js::text))
    .bind(body.get("component").and_then(js::text))
    .bind(&session.user.id)
    .bind(js::truthy(body.get("metadata")).then(|| body.get("metadata").map(js::stringify)).flatten())
    .bind(body.get("errorStack").and_then(js::text))
    .execute(pool(&ctx))
    .await;
    Ok(match r {
        Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
        Err(e) => error(&e.to_string()),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogsQuery {
    level: Option<String>,
    component: Option<String>,
    user_id: Option<String>,
    limit: Option<String>,
    offset: Option<String>,
}

fn epoch_ms(v: &Value) -> i64 {
    v.as_str()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map_or(i64::MIN, |d| d.timestamp_millis())
}

/// The caller's application logs merged with their audit trail, newest first.
///
/// Node parity (MIGRATION_PLAN.md §9, P-7): `offset` is applied twice — once
/// in SQL to the application logs and again to the merged list — so any page
/// after the first is short or empty, and `totalCount` is the size of what was
/// fetched rather than of the logs. Both are fixed together, later.
async fn read(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<LogsQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let limit = q
        .limit
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(100)
        .clamp(1, max_page_size());
    let offset = q.offset.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
    let is_admin = is_admin_by_role_name(&session.user.roles);
    let who = match q.user_id.as_deref().filter(|u| !u.is_empty()) {
        Some(u) if is_admin => u.to_string(),
        _ => session.user.id.clone(),
    };
    let level = q.level.as_deref().filter(|l| !l.is_empty() && *l != "info");
    let component = q.component.as_deref().filter(|c| !c.is_empty());

    let result = async {
        let app = sqlx::query(
            "SELECT * FROM logs WHERE user_id = $1 AND ($2::text IS NULL OR level = $2) AND ($3::text IS NULL OR component = $3) \
             ORDER BY timestamp DESC LIMIT $4 OFFSET $5",
        )
        .bind(&who)
        .bind(level)
        .bind(component)
        .bind(limit)
        .bind(offset)
        .fetch_all(db)
        .await?;
        let audit = sqlx::query(
            "SELECT * FROM audit_log WHERE user_id = $1 AND ($2::text IS NULL OR resource_type = $2) ORDER BY created_at DESC LIMIT $3",
        )
        .bind(&who)
        .bind(component)
        .bind(limit)
        .fetch_all(db)
        .await?;
        Ok::<_, sqlx::Error>((pg_rows_to_json(&app), pg_rows_to_json(&audit)))
    }
    .await;
    let (app, audit) = match result {
        Ok(r) => r,
        Err(e) => return Ok(error(&e.to_string())),
    };
    let total = app.len() + audit.len();

    let mut merged: Vec<Map<String, Value>> = Vec::with_capacity(total);
    for row in &app {
        let mut o = row.as_object().cloned().unwrap_or_default();
        o.insert("user_email".into(), Value::Null);
        merged.push(o);
    }
    for a in &audit {
        let s = |k: &str| a.get(k).and_then(Value::as_str).unwrap_or_default().to_string();
        let rid = a
            .get("resource_id")
            .and_then(Value::as_str)
            .filter(|r| !r.is_empty());
        let message = format!(
            "{} {}{}",
            s("action"),
            s("resource_type"),
            rid.map(|r| format!(" ({}…)", r.chars().take(8).collect::<String>()))
                .unwrap_or_default()
        );
        let mut o = Map::new();
        o.insert("id".into(), json!(format!("audit-{}", s("id"))));
        o.insert(
            "timestamp".into(),
            a.get("created_at").cloned().unwrap_or(Value::Null),
        );
        o.insert("level".into(), json!("info"));
        o.insert("message".into(), json!(message));
        o.insert(
            "component".into(),
            a.get("resource_type").cloned().unwrap_or(Value::Null),
        );
        o.insert("user_id".into(), a.get("user_id").cloned().unwrap_or(Value::Null));
        o.insert("user_email".into(), Value::Null);
        o.insert(
            "metadata".into(),
            a.get("details").cloned().unwrap_or(Value::Null),
        );
        o.insert("error_stack".into(), Value::Null);
        merged.push(o);
    }
    // Stable, like Array#sort.
    merged.sort_by_key(|o| std::cmp::Reverse(epoch_ms(o.get("timestamp").unwrap_or(&Value::Null))));
    let start = usize::try_from(offset).unwrap_or(usize::MAX).min(merged.len());
    let end = start
        .saturating_add(usize::try_from(limit).unwrap_or(0))
        .min(merged.len());
    let mut page: Vec<Map<String, Value>> = merged[start..end].to_vec();

    let mut emails: HashMap<String, String> = HashMap::new();
    for log in &mut page {
        let email = match log
            .get("user_id")
            .filter(|u| !u.is_null() && u.as_str() != Some(""))
        {
            None => "system".to_string(),
            Some(uid) => {
                let uid = js::text(uid).unwrap_or_default();
                if !emails.contains_key(&uid) {
                    let e: Option<String> = sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
                        .bind(&uid)
                        .fetch_optional(db)
                        .await
                        .ok()
                        .flatten();
                    emails.insert(uid.clone(), e.unwrap_or_else(|| "unknown".into()));
                }
                emails[&uid].clone()
            }
        };
        log.insert("user_email".into(), json!(email));
    }
    let shown = page.len();
    Ok(response::ok(json!({
        "logs": page,
        "pagination": { "limit": limit, "offset": offset, "totalCount": total, "hasMore": (offset as usize) + shown < total },
    })))
}

async fn components(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    if !is_admin_by_role_name(&session.user.roles) {
        return Ok(response::ok(json!([])));
    }
    Ok(
        match sqlx::query_scalar::<_, String>("SELECT DISTINCT component FROM logs ORDER BY component")
            .fetch_all(pool(&ctx))
            .await
        {
            Ok(c) => response::ok(json!(c)),
            Err(e) => error(&e.to_string()),
        },
    )
}

async fn users(CurrentSession(session): CurrentSession, State(ctx): State<AppContext>) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    if !is_admin_by_role_name(&session.user.roles) {
        return Ok(response::ok(json!([])));
    }
    let rows = sqlx::query(
        "SELECT DISTINCT ON (logs.user_id) logs.user_id AS id, users.email FROM logs \
         INNER JOIN users ON logs.user_id = users.id ORDER BY logs.user_id",
    )
    .fetch_all(pool(&ctx))
    .await;
    Ok(match rows {
        Ok(r) => response::ok(Value::Array(pg_rows_to_json(&r))),
        Err(e) => error(&e.to_string()),
    })
}

/// `POST /api/logs/search` — the caller's logs ranked by cosine similarity
/// of their stored `message_vector` to the query's embedding.
///
/// Node loads every one of the caller's logs and ranks them in memory; this
/// streams them and keeps only the best `limit`, which returns the same
/// results without holding the table in memory. Node parity (MIGRATION_PLAN.md
/// §9, P-13): nothing writes `message_vector`, so this finds nothing until a
/// writer does.
async fn search(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    use futures_util::TryStreamExt;
    use sqlx::Row;

    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(error("Unexpected end of JSON input"));
    };
    let Some(query) = body
        .get("query")
        .filter(|q| js::truthy(Some(q)))
        .and_then(js::text)
    else {
        return Ok(response::error(
            StatusCode::BAD_REQUEST,
            "INVALID_INPUT",
            "Query is required",
        ));
    };
    let as_num = |k: &str, d: f64| {
        let v = body.get(k);
        if js::truthy(v) {
            v.map_or(d, crate::monitoring::js::number)
        } else {
            d
        }
    };
    let limit = as_num("limit", 10.0).min(100.0);
    let threshold = as_num("threshold", 0.5);
    let q = crate::embeddings::log_embedding(&query, "search", "info");

    let mut stream = sqlx::query(
        "SELECT id, timestamp, level, message, component, user_id, message_vector FROM logs WHERE user_id = $1",
    )
    .bind(&session.user.id)
    .fetch(pool(&ctx));
    // (similarity, arrival order, row) — only rows at or above the threshold.
    let mut hits: Vec<(f64, usize, Value)> = Vec::new();
    let mut n = 0usize;
    loop {
        let row = match stream.try_next().await {
            Ok(Some(r)) => r,
            Ok(None) => break,
            Err(e) => return Ok(error(&e.to_string())),
        };
        n += 1;
        let similarity = row
            .try_get::<Option<String>, _>("message_vector")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_str::<Vec<f64>>(&v).ok())
            .map_or(0.0, |v| crate::embeddings::cosine(&q, &v));
        if similarity >= threshold {
            let g = |k: &str| row.try_get::<Option<String>, _>(k).ok().flatten();
            let sim = serde_json::from_str::<Value>(&crate::monitoring::js::number_to_string(similarity))
                .unwrap_or(Value::Null);
            hits.push((
                similarity,
                n,
                json!({
                    "id": g("id"), "timestamp": g("timestamp"), "level": g("level"), "message": g("message"),
                    "component": g("component"), "user_id": g("user_id"), "similarity": sim,
                }),
            ));
            // Keep memory bounded: only the best `limit` can be returned.
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let keep = limit.floor() as usize;
            if limit > 0.0 && hits.len() > keep * 2 + 64 {
                hits.sort_by(|a, b| {
                    b.0.partial_cmp(&a.0)
                        .unwrap_or(std::cmp::Ordering::Equal)
                        .then(a.1.cmp(&b.1))
                });
                hits.truncate(keep);
            }
        }
    }
    // A stable descending sort, then `slice(0, limit)` (a negative limit
    // counts from the end, as `slice` does).
    hits.sort_by(|a, b| {
        b.0.partial_cmp(&a.0)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.1.cmp(&b.1))
    });
    #[allow(clippy::cast_possible_truncation, clippy::cast_precision_loss)]
    let end = if limit < 0.0 {
        (hits.len() as f64 + limit.ceil()).max(0.0) as usize
    } else {
        (limit.floor() as usize).min(hits.len())
    };
    let results: Vec<Value> = hits.into_iter().take(end).map(|(_, _, v)| v).collect();
    let total = results.len();
    Ok(response::ok(
        json!({ "query": query, "results": results, "total": total }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/logs")
        .add("/", get(read).post(write))
        .add("/components", get(components))
        .add("/users", get(users))
        .add("/search", post(search))
}
