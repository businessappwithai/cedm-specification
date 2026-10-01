//! `/api/dashboards` — twin of `src/routes/api/dashboards/**`, widgets included.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, put},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use super::{
    owned::{audit, gate},
    support::{find_by_id, list_page, parse_body, reread},
};
use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        js,
        pagination::{Page, PageQuery},
        response,
        time::now_iso,
    },
    permissions::ownership::Owned,
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
    match list_page(pool(&ctx), "dashboard_layouts", None, "created_at DESC", page).await {
        Ok((items, total)) => Ok(response::ok(
            json!({ "items": items, "meta": page.meta_with_pages(total) }),
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching dashboards",
            e,
            "SERVER_ERROR",
            "Failed to fetch dashboards",
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
    match find_by_id(pool(&ctx), "dashboard_layouts", &id).await {
        Ok(Some(r)) => Ok(response::ok(r)),
        Ok(None) => Ok(response::error(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            "Dashboard not found",
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching dashboard",
            e,
            "SERVER_ERROR",
            "Failed to fetch dashboard",
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
        return Ok(server("Failed to create dashboard"));
    };
    let layout = js::present(body.get("layout")).or_else(|| body.get("layoutConfig"));
    if !js::truthy(body.get("name")) || !js::truthy(layout) {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "Missing required fields",
        ));
    }
    let is_public = js::present(body.get("is_public"))
        .or_else(|| js::present(body.get("isPublic")))
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let r = sqlx::query(
        "INSERT INTO dashboard_layouts (id, name, description, layout_config, is_public, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)",
    )
    .bind(&id)
    .bind(body.get("name").and_then(js::text))
    .bind(js::truthy(body.get("description")).then(|| body.get("description").and_then(js::text)).flatten())
    .bind(layout.map(js::stringify))
    .bind(is_public)
    .bind(&session.user.id)
    .bind(&now)
    .execute(pool(&ctx))
    .await;
    Ok(match r {
        Ok(_) => response::ok_with(StatusCode::CREATED, json!({ "id": id })),
        Err(e) => response::server_error(
            "Error creating dashboard",
            e,
            "SERVER_ERROR",
            "Failed to create dashboard",
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
        return Ok(server("Failed to update dashboard"));
    };
    let db = pool(&ctx);
    match gate(db, Owned::Dashboard, "dashboard", &id, &session.user.id, false).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error updating dashboard",
                e,
                "SERVER_ERROR",
                "Failed to update dashboard",
            ))
        }
    }
    let layout = js::present(body.get("layout_config")).or_else(|| body.get("layoutConfig"));
    let r = sqlx::query(
        "UPDATE dashboard_layouts SET name = COALESCE($2, name), \
           description = CASE WHEN $3 THEN $4 ELSE description END, layout_config = COALESCE($5, layout_config), \
           is_public = CASE WHEN $6 THEN $7 ELSE is_public END, updated_at = $8 WHERE id = $1",
    )
    .bind(&id)
    .bind(js::present(body.get("name")).and_then(js::text))
    .bind(body.get("description").is_some())
    .bind(body.get("description").and_then(js::text))
    .bind(js::truthy(layout).then(|| layout.map(js::stringify)).flatten())
    .bind(body.get("is_public").is_some())
    .bind(body.get("is_public").and_then(Value::as_bool))
    .bind(now_iso())
    .execute(db)
    .await;
    if let Err(e) = r {
        return Ok(response::server_error(
            "Error updating dashboard",
            e,
            "SERVER_ERROR",
            "Failed to update dashboard",
        ));
    }
    audit(db, &session.user.id, "update", "dashboard", &id, None).await;
    match reread(db, "dashboard_layouts", &id).await {
        Ok(r) => Ok(response::ok(r)),
        Err(e) => Ok(response::server_error(
            "Error updating dashboard",
            e,
            "SERVER_ERROR",
            "Failed to update dashboard",
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
    match gate(db, Owned::Dashboard, "dashboard", &id, &session.user.id, true).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error deleting dashboard",
                e,
                "SERVER_ERROR",
                "Failed to delete dashboard",
            ))
        }
    }
    if let Err(e) = sqlx::query("DELETE FROM dashboard_layouts WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        return Ok(response::server_error(
            "Error deleting dashboard",
            e,
            "SERVER_ERROR",
            "Failed to delete dashboard",
        ));
    }
    audit(db, &session.user.id, "delete", "dashboard", &id, None).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

// ── widgets ──────────────────────────────────────────────────────────────────

async fn dashboard_exists(db: &sqlx::PgPool, id: &str) -> Result<bool, sqlx::Error> {
    Ok(
        sqlx::query_scalar::<_, String>("SELECT id FROM dashboard_layouts WHERE id = $1")
            .bind(id)
            .fetch_optional(db)
            .await?
            .is_some(),
    )
}

async fn widgets_list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let db = pool(&ctx);
    let fail = |e: sqlx::Error| {
        response::server_error(
            "Error fetching dashboard widgets",
            e,
            "SERVER_ERROR",
            "Failed to fetch dashboard widgets",
        )
    };
    match dashboard_exists(db, &id).await {
        Ok(true) => {}
        Ok(false) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Dashboard not found",
            ))
        }
        Err(e) => return Ok(fail(e)),
    }
    match sqlx::query("SELECT * FROM dashboard_widgets WHERE dashboard_id = $1")
        .bind(&id)
        .fetch_all(db)
        .await
    {
        Ok(rows) => Ok(response::ok(json!({ "items": pg_rows_to_json(&rows) }))),
        Err(e) => Ok(fail(e)),
    }
}

/// Widget writes change the dashboard, so they pass the dashboard's owner
/// gate too (D-12); Node checks only that the dashboard exists.
/// `missing_ok` lets a missing dashboard fall through to the route's own 404
/// ("Widget not found" for PUT/DELETE, as in Node).
async fn widget_gate(
    db: &sqlx::PgPool,
    id: &str,
    user: &str,
    missing_ok: bool,
) -> Result<Option<Response>, sqlx::Error> {
    gate(db, Owned::Dashboard, "dashboard", id, user, missing_ok).await
}

async fn widgets_add(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let fail = || server("Failed to add widget");
    match widget_gate(db, &id, &session.user.id, false).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    if !js::truthy(body.get("widgetType")) {
        return Ok(response::error(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "widgetType is required",
        ));
    }
    let wid = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let r = sqlx::query(
        "INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, report_id, chart_id, position_config, widget_config, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)",
    )
    .bind(&wid)
    .bind(&id)
    .bind(body.get("widgetType").and_then(js::text))
    .bind(js::present(body.get("reportId")).and_then(js::text))
    .bind(js::present(body.get("chartId")).and_then(js::text))
    .bind(js::stringify(js::present(body.get("positionConfig")).unwrap_or(&json!({}))))
    .bind(js::truthy(body.get("widgetConfig")).then(|| body.get("widgetConfig").map(js::stringify)).flatten())
    .bind(&now)
    .execute(db)
    .await;
    if r.is_err() {
        return Ok(fail());
    }
    match reread(db, "dashboard_widgets", &wid).await {
        Ok(w) => Ok(response::ok_with(StatusCode::CREATED, w)),
        Err(_) => Ok(fail()),
    }
}

async fn widget_exists(db: &sqlx::PgPool, id: &str, wid: &str) -> Result<bool, sqlx::Error> {
    Ok(sqlx::query_scalar::<_, String>(
        "SELECT id FROM dashboard_widgets WHERE id = $1 AND dashboard_id = $2",
    )
    .bind(wid)
    .bind(id)
    .fetch_optional(db)
    .await?
    .is_some())
}

async fn widget_update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path((id, wid)): Path<(String, String)>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let fail = || server("Failed to update widget");
    match widget_gate(db, &id, &session.user.id, true).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    match widget_exists(db, &id, &wid).await {
        Ok(true) => {}
        Ok(false) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Widget not found",
            ))
        }
        Err(_) => return Ok(fail()),
    }
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    let pos = body.get("positionConfig");
    let cfg = body.get("widgetConfig");
    let r = sqlx::query(
        "UPDATE dashboard_widgets SET position_config = CASE WHEN $3 THEN $4 ELSE position_config END, \
           widget_config = CASE WHEN $5 THEN $6 ELSE widget_config END, updated_at = $7 \
         WHERE id = $1 AND dashboard_id = $2",
    )
    .bind(&wid)
    .bind(&id)
    .bind(pos.is_some())
    .bind(pos.map(js::stringify))
    .bind(cfg.is_some())
    .bind(js::truthy(cfg).then(|| cfg.map(js::stringify)).flatten())
    .bind(now_iso())
    .execute(db)
    .await;
    if r.is_err() {
        return Ok(fail());
    }
    match reread(db, "dashboard_widgets", &wid).await {
        Ok(w) => Ok(response::ok(w)),
        Err(_) => Ok(fail()),
    }
}

async fn widget_delete(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path((id, wid)): Path<(String, String)>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let fail = || server("Failed to delete widget");
    match widget_gate(db, &id, &session.user.id, true).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    match widget_exists(db, &id, &wid).await {
        Ok(true) => {}
        Ok(false) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Widget not found",
            ))
        }
        Err(_) => return Ok(fail()),
    }
    Ok(
        match sqlx::query("DELETE FROM dashboard_widgets WHERE id = $1 AND dashboard_id = $2")
            .bind(&wid)
            .bind(&id)
            .execute(db)
            .await
        {
            Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
            Err(_) => fail(),
        },
    )
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/dashboards")
        .add("/", get(list).post(create))
        .add("/{id}", get(show).put(update).delete(destroy))
        .add("/{id}/widgets", get(widgets_list).post(widgets_add))
        .add("/{id}/widgets/{widget}", put(widget_update).delete(widget_delete))
}
