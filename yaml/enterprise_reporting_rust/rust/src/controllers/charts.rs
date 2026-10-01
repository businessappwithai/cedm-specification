//! `/api/charts` — twin of `src/routes/api/charts/**`.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::get,
};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use super::{
    owned::{audit, gate},
    support::{
        active_data_source, find_by_id, has_limit, list_page, parse_body, reread, strip_trailing_semicolon,
    },
};
use crate::{
    auth::CurrentSession,
    common::{
        db::pool,
        js,
        pagination::{js_parse_int, Page, PageQuery},
        response,
        time::now_iso,
    },
    datasources::get_connection,
    permissions::{
        ownership::Owned,
        runnable_query::{decide_query_run, QueryRunDecision},
    },
};

fn server(message: &str) -> Response {
    response::error(StatusCode::INTERNAL_SERVER_ERROR, "SERVER_ERROR", message)
}

async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let page = Page::from_query(&q, 20, None);
    // Node parity (MIGRATION_PLAN.md §9, P-3): no is_deleted / ownership filter.
    match list_page(pool(&ctx), "chart_definitions", None, "created_at DESC", page).await {
        Ok((items, total)) => Ok(response::ok(
            json!({ "items": items, "meta": page.meta_with_pages(total) }),
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching charts",
            e,
            "SERVER_ERROR",
            "Failed to fetch charts",
        )),
    }
}

async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    match find_by_id(pool(&ctx), "chart_definitions", &id).await {
        Ok(Some(r)) => Ok(response::ok(r)),
        Ok(None) => Ok(response::error(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            "Chart not found",
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching chart",
            e,
            "SERVER_ERROR",
            "Failed to fetch chart",
        )),
    }
}

async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(server("Failed to create chart"));
    };
    if !js::truthy(body.get("name"))
        || !js::truthy(body.get("chart_type"))
        || !js::truthy(body.get("chart_config"))
    {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "Missing required fields: name, chart_type, chart_config",
        ));
    }
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let mapping = match body.get("data_mapping") {
        m if js::truthy(m) => js::stringify(m.unwrap_or(&Value::Null)),
        _ => r#"{"xAxis":{"field":""},"yAxis":[]}"#.to_string(),
    };
    let r = sqlx::query(
        "INSERT INTO chart_definitions (id, name, description, chart_type, chart_config, saved_query_id, data_mapping, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)",
    )
    .bind(&id)
    .bind(body.get("name").and_then(js::text))
    .bind(js::truthy(body.get("description")).then(|| body.get("description").and_then(js::text)).flatten())
    .bind(body.get("chart_type").and_then(js::text))
    .bind(body.get("chart_config").map(js::stringify))
    .bind(js::truthy(body.get("saved_query_id")).then(|| body.get("saved_query_id").and_then(js::text)).flatten())
    .bind(mapping)
    .bind(&session.user.id)
    .bind(&now)
    .execute(pool(&ctx))
    .await;
    Ok(match r {
        Ok(_) => response::ok_with(StatusCode::CREATED, json!({ "id": id })),
        Err(e) => response::server_error(
            "Error creating chart",
            e,
            "SERVER_ERROR",
            "Failed to create chart",
        ),
    })
}

async fn update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(server("Failed to update chart"));
    };
    let db = pool(&ctx);
    match gate(db, Owned::Chart, "chart", &id, &session.user.id, false).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error updating chart",
                e,
                "SERVER_ERROR",
                "Failed to update chart",
            ))
        }
    }
    let g = |k: &str| body.get(k);
    let json_if_truthy = |k: &str| js::truthy(g(k)).then(|| g(k).map(js::stringify)).flatten();
    let r = sqlx::query(
        "UPDATE chart_definitions SET name = COALESCE($2, name), \
           description = CASE WHEN $3 THEN $4 ELSE description END, chart_type = COALESCE($5, chart_type), \
           chart_config = COALESCE($6, chart_config), data_mapping = COALESCE($7, data_mapping), \
           saved_query_id = CASE WHEN $8 THEN $9 ELSE saved_query_id END, \
           refresh_interval = COALESCE($10, refresh_interval), updated_at = $11 WHERE id = $1",
    )
    .bind(&id)
    .bind(js::present(g("name")).and_then(js::text))
    .bind(g("description").is_some())
    .bind(g("description").and_then(js::text))
    .bind(js::present(g("chart_type")).and_then(js::text))
    .bind(json_if_truthy("chart_config"))
    .bind(json_if_truthy("data_mapping"))
    .bind(g("saved_query_id").is_some())
    .bind(g("saved_query_id").and_then(js::text))
    .bind(
        js::present(g("refresh_interval"))
            .and_then(|v| v.as_i64().or_else(|| v.as_str().and_then(js_parse_int)))
            .and_then(|n| i32::try_from(n).ok()),
    )
    .bind(now_iso())
    .execute(db)
    .await;
    if let Err(e) = r {
        return Ok(response::server_error(
            "Error updating chart",
            e,
            "SERVER_ERROR",
            "Failed to update chart",
        ));
    }
    audit(db, &session.user.id, "update", "chart", &id, None).await;
    match reread(db, "chart_definitions", &id).await {
        Ok(r) => Ok(response::ok(r)),
        Err(e) => Ok(response::server_error(
            "Error updating chart",
            e,
            "SERVER_ERROR",
            "Failed to update chart",
        )),
    }
}

async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    match gate(db, Owned::Chart, "chart", &id, &session.user.id, true).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error deleting chart",
                e,
                "SERVER_ERROR",
                "Failed to delete chart",
            ))
        }
    }
    if let Err(e) = sqlx::query("DELETE FROM chart_definitions WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        return Ok(response::server_error(
            "Error deleting chart",
            e,
            "SERVER_ERROR",
            "Failed to delete chart",
        ));
    }
    audit(db, &session.user.id, "delete", "chart", &id, None).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `GET /api/charts/:id/data` — the chart's rows, gated on `decideQueryRun`.
async fn data(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let fail = |m: String| response::error(StatusCode::INTERNAL_SERVER_ERROR, "SERVER_ERROR", &m);
    let sq: Option<Option<String>> =
        match sqlx::query_scalar("SELECT saved_query_id FROM chart_definitions WHERE id = $1")
            .bind(&id)
            .fetch_optional(db)
            .await
        {
            Ok(r) => r,
            Err(e) => return Ok(fail(e.to_string())),
        };
    let Some(sq) = sq else {
        return Ok(response::error(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            "Chart not found",
        ));
    };
    let Some(sq) = sq.filter(|s| !s.is_empty()) else {
        return Ok(response::ok(
            json!({ "rows": [], "totalRows": 0, "pageIndex": 0, "pageSize": 1000 }),
        ));
    };
    let (sql, ds_id) = match sqlx::query_as::<_, (String, String)>(
        "SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1",
    )
    .bind(&sq)
    .fetch_optional(db)
    .await
    {
        Ok(Some(r)) => r,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Saved query not found",
            ))
        }
        Err(e) => return Ok(fail(e.to_string())),
    };
    let ds = match active_data_source(db, &ds_id).await {
        Ok(Some(d)) => d,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Data source not found or inactive",
            ))
        }
        Err(e) => return Ok(fail(e.to_string())),
    };
    if let QueryRunDecision::Refused(m) = decide_query_run(db, &session.user.id, &sql, &ds_id).await {
        return Ok(response::error(StatusCode::FORBIDDEN, "FORBIDDEN", &m));
    }
    let conn = match get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => return Ok(fail(e.to_string())),
    };
    // Node: parseInt(pageSize || "1000"), no cap; a stored LIMIT wins (P-1).
    let page_size = q
        .page_size
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(1000)
        .max(1);
    let raw = strip_trailing_semicolon(&sql);
    let limited = if has_limit(raw) {
        raw.to_string()
    } else {
        format!("{raw} LIMIT {page_size}")
    };
    match conn.fetch_json(&limited).await {
        Ok(rows) => {
            let n = rows.len();
            Ok(response::ok(
                json!({ "rows": rows, "totalRows": n, "pageIndex": 0, "pageSize": page_size }),
            ))
        }
        Err(e) => Ok(fail(e.to_string())),
    }
}

/// `GET /api/charts/:id/filters` — Node returns an empty list.
async fn filters(CurrentSession(session): CurrentSession) -> Result<Response> {
    if session.is_none() {
        return Ok(response::raw(
            StatusCode::UNAUTHORIZED,
            &json!({ "error": "Unauthorized" }),
        ));
    }
    Ok(response::raw(StatusCode::OK, &json!([])))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/charts")
        .add("/", get(list).post(create))
        .add("/{id}", get(show).put(update).delete(destroy))
        .add("/{id}/data", get(data))
        .add("/{id}/filters", get(filters))
}
