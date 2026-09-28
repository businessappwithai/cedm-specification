//! `/api/reports` — twin of `src/routes/api/reports*.ts`.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, put},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use super::support::{
    active_data_source, find_by_id, has_limit, list_page, parse_body, reread, strip_trailing_semicolon,
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
    datasources::get_connection,
    permissions::{
        ownership::{can_modify, is_admin, Owned, WriteDecision},
        runnable_query::{decide_query_run, QueryRunDecision},
    },
    reporting::{record_link, validation::validate_create_report},
    security::audit::{log_audit, AuditEntry},
};

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
    match list_page(pool(&ctx), "report_definitions", None, "created_at DESC", page).await {
        Ok((items, total)) => Ok(response::ok(
            json!({ "items": items, "meta": page.meta_with_pages(total) }),
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching reports",
            e,
            "SERVER_ERROR",
            "Failed to fetch reports",
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
    match find_by_id(pool(&ctx), "report_definitions", &id).await {
        Ok(Some(r)) => Ok(response::ok(r)),
        Ok(None) => Ok(response::error(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            "Report not found",
        )),
        Err(e) => Ok(response::server_error(
            "Error fetching report",
            e,
            "SERVER_ERROR",
            "Failed to fetch report",
        )),
    }
}

/// `GET /api/reports/:id/data` — a page of the report's rows from the user's
/// database, gated on `decideQueryRun` at run time.
async fn data(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let page = Page::from_query(&q, 50, Some(1000));
    let db = pool(&ctx);
    // Node returns the underlying error's message on a 500 here.
    let server = |msg: String| response::error(StatusCode::INTERNAL_SERVER_ERROR, "SERVER_ERROR", &msg);

    let saved_query_id = match sqlx::query_scalar::<_, Option<String>>(
        "SELECT saved_query_id FROM report_definitions WHERE id = $1",
    )
    .bind(&id)
    .fetch_optional(db)
    .await
    {
        Ok(Some(sq)) => sq,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Report not found",
            ))
        }
        Err(e) => return Ok(server(e.to_string())),
    };
    let Some(saved_query_id) = saved_query_id.filter(|s| !s.is_empty()) else {
        return Ok(response::ok(
            json!({ "rows": [], "totalRows": 0, "pageIndex": page.page, "pageSize": page.page_size }),
        ));
    };

    let (sql_content, data_source_id) = match sqlx::query_as::<_, (String, String)>(
        "SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1",
    )
    .bind(&saved_query_id)
    .fetch_optional(db)
    .await
    {
        Ok(Some(q)) => q,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Saved query not found",
            ))
        }
        Err(e) => return Ok(server(e.to_string())),
    };
    let data_source = match active_data_source(db, &data_source_id).await {
        Ok(Some(ds)) => ds,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Data source not found or inactive",
            ))
        }
        Err(e) => return Ok(server(e.to_string())),
    };

    if let QueryRunDecision::Refused(message) =
        decide_query_run(db, &session.user.id, &sql_content, &data_source_id).await
    {
        return Ok(response::error(StatusCode::FORBIDDEN, "FORBIDDEN", &message));
    }

    let conn = match get_connection(&data_source).await {
        Ok(c) => c,
        Err(e) => return Ok(server(e.to_string())),
    };
    let clean = strip_trailing_semicolon(&sql_content);

    // The count is best effort, as in Node: a failure leaves it at 0.
    let total_rows = conn
        .fetch_json(&format!("SELECT COUNT(*) as total FROM ({clean}) as count_query"))
        .await
        .ok()
        .and_then(|rows| rows.into_iter().next())
        .and_then(|r| r.get("total").map(crate::monitoring::js::number))
        .filter(|n| n.is_finite())
        .map_or(0, |n| n as i64);

    // Node parity (P-1): a stored LIMIT disables pagination.
    let sql = if has_limit(clean) {
        clean.to_string()
    } else {
        format!("{clean} LIMIT {} OFFSET {}", page.page_size, page.offset())
    };
    match conn.fetch_json(&sql).await {
        Ok(rows) => Ok(response::ok(json!({
            "rows": rows,
            "totalRows": total_rows,
            "pageIndex": page.page,
            "pageSize": page.page_size,
        }))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching report data");
            Ok(server(e.to_string()))
        }
    }
}

const FORBIDDEN_NOT_OWNER: &str = "You can only change the configuration of reports you created.";

fn server(message: &str) -> Response {
    response::error(StatusCode::INTERNAL_SERVER_ERROR, "SERVER_ERROR", message)
}

async fn audit(db: &sqlx::PgPool, user: &str, action: &str, id: &str, details: Option<Value>) {
    let entry = AuditEntry {
        user_id: Some(user),
        action,
        resource_type: "report",
        resource_id: Some(id),
        details,
        ..Default::default()
    };
    if let Err(e) = log_audit(db, entry).await {
        tracing::error!(error = %e, "audit log failed");
    }
}

/// The owner-or-admin gate every report write passes (MIGRATION_PLAN.md §9,
/// D-12). `Some(response)` means stop and return it.
async fn gate(
    db: &sqlx::PgPool,
    id: &str,
    user: &str,
    missing_ok: bool,
) -> Result<Option<Response>, sqlx::Error> {
    Ok(match can_modify(db, Owned::Report, id, user).await? {
        WriteDecision::Allowed => None,
        WriteDecision::NotFound if missing_ok => None,
        WriteDecision::NotFound => Some(response::error(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            "Report not found",
        )),
        WriteDecision::Forbidden => Some(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            FORBIDDEN_NOT_OWNER,
        )),
    })
}

/// `POST /api/reports`.
async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(server("Failed to create report"));
    };
    let obj = match validate_create_report(&body) {
        Ok(o) => o,
        Err(details) => {
            return Ok(response::raw(
                StatusCode::UNPROCESSABLE_ENTITY,
                &json!({ "success": false, "error": { "code": "INVALID_INPUT", "message": "Validation failed", "details": details } }),
            ))
        }
    };
    let db = pool(&ctx);
    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let opt_json = |k: &str| js::present(obj.get(k)).map(js::stringify);
    let inserted = sqlx::query(
        "INSERT INTO report_definitions (id, name, description, saved_query_id, column_config, filter_config, sort_config, \
           pagination_config, export_formats, color_theme, is_public, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, false, false, NULL, NULL, $10, $11, $11)",
    )
    .bind(&id)
    .bind(obj.get("name").and_then(Value::as_str))
    .bind(obj.get("description").and_then(Value::as_str))
    .bind(obj.get("savedQueryId").and_then(Value::as_str))
    .bind(js::stringify(obj.get("columnConfig").unwrap_or(&json!([]))))
    .bind(if js::truthy(obj.get("filterConfig")) { opt_json("filterConfig") } else { None })
    .bind(if js::truthy(obj.get("sortConfig")) { opt_json("sortConfig") } else { None })
    .bind(if js::truthy(obj.get("paginationConfig")) { opt_json("paginationConfig") } else { None })
    .bind(opt_json("exportFormats").unwrap_or_else(|| r#"["csv","xlsx","pdf"]"#.to_string()))
    .bind(&session.user.id)
    .bind(&now)
    .execute(db)
    .await;
    if let Err(e) = inserted {
        tracing::error!(error = %e, "Error creating report");
        return Ok(server("Failed to create report"));
    }
    let name = obj.get("name").cloned().unwrap_or(Value::Null);
    audit(db, &session.user.id, "create", &id, Some(json!({ "name": name }))).await;
    match reread(db, "report_definitions", &id).await {
        Ok(r) => Ok(response::ok_with(StatusCode::CREATED, r)),
        Err(e) => Ok(response::server_error(
            "Error creating report",
            e,
            "SERVER_ERROR",
            "Failed to create report",
        )),
    }
}

/// `PUT /api/reports/:id` — every field optional, JSON fields replaced only
/// when truthy (Node's `x ? JSON.stringify(x) : existing`).
async fn update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let fail = || server("Failed to update report");
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    let db = pool(&ctx);
    match gate(db, &id, &session.user.id, false).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error updating report",
                e,
                "SERVER_ERROR",
                "Failed to update report",
            ))
        }
    }
    let g = |k: &str| body.get(k);
    let json_if_truthy = |k: &str| js::truthy(g(k)).then(|| g(k).map(js::stringify)).flatten();
    let updated = sqlx::query(
        "UPDATE report_definitions SET \
           name = COALESCE($2, name), \
           description = CASE WHEN $3 THEN $4 ELSE description END, \
           saved_query_id = CASE WHEN $5 THEN $6 ELSE saved_query_id END, \
           column_config = COALESCE($7, column_config), filter_config = COALESCE($8, filter_config), \
           sort_config = COALESCE($9, sort_config), pagination_config = COALESCE($10, pagination_config), \
           export_formats = COALESCE($11, export_formats), filename_template = COALESCE($12, filename_template), \
           color_theme = COALESCE($13, color_theme), updated_at = $14 \
         WHERE id = $1",
    )
    .bind(&id)
    .bind(js::present(g("name")).and_then(js::text))
    .bind(g("description").is_some())
    .bind(g("description").and_then(js::text))
    .bind(g("savedQueryId").is_some())
    .bind(g("savedQueryId").and_then(js::text))
    .bind(json_if_truthy("columnConfig"))
    .bind(json_if_truthy("filterConfig"))
    .bind(json_if_truthy("sortConfig"))
    .bind(json_if_truthy("paginationConfig"))
    .bind(json_if_truthy("exportFormats"))
    .bind(json_if_truthy("filenameTemplate"))
    .bind(json_if_truthy("colorTheme"))
    .bind(now_iso())
    .execute(db)
    .await;
    if let Err(e) = updated {
        tracing::error!(error = %e, "Error updating report");
        return Ok(fail());
    }
    audit(db, &session.user.id, "update", &id, None).await;
    match reread(db, "report_definitions", &id).await {
        Ok(r) => Ok(response::ok(r)),
        Err(e) => Ok(response::server_error(
            "Error updating report",
            e,
            "SERVER_ERROR",
            "Failed to update report",
        )),
    }
}

/// `PATCH /api/reports/:id` — the colour theme only.
async fn patch(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let fail = || server("Failed to update report");
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    let db = pool(&ctx);
    match gate(db, &id, &session.user.id, false).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error patching report",
                e,
                "SERVER_ERROR",
                "Failed to update report",
            ))
        }
    }
    let theme = body.get("colorTheme");
    let r = sqlx::query(
        "UPDATE report_definitions SET color_theme = CASE WHEN $2 THEN $3 ELSE color_theme END, updated_at = $4 WHERE id = $1",
    )
    .bind(&id)
    .bind(theme.is_some())
    .bind(theme.map(js::stringify))
    .bind(now_iso())
    .execute(db)
    .await;
    if let Err(e) = r {
        tracing::error!(error = %e, "Error patching report");
        return Ok(fail());
    }
    audit(db, &session.user.id, "update", &id, None).await;
    match reread(db, "report_definitions", &id).await {
        Ok(r) => Ok(response::ok(r)),
        Err(e) => Ok(response::server_error(
            "Error patching report",
            e,
            "SERVER_ERROR",
            "Failed to update report",
        )),
    }
}

/// `DELETE /api/reports/:id`. A missing report deletes nothing and succeeds,
/// as in Node.
async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    match gate(db, &id, &session.user.id, true).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            return Ok(response::server_error(
                "Error deleting report",
                e,
                "SERVER_ERROR",
                "Failed to delete report",
            ))
        }
    }
    if let Err(e) = sqlx::query("DELETE FROM report_definitions WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        return Ok(response::server_error(
            "Error deleting report",
            e,
            "SERVER_ERROR",
            "Failed to delete report",
        ));
    }
    audit(db, &session.user.id, "delete", &id, None).await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

// ── /api/reports/:id/filters — bare JSON, `{ error }` envelopes ─────────────

fn plain_error(status: StatusCode, message: &str) -> Response {
    response::raw(status, &json!({ "error": message }))
}

/// Node's `canConfigureReport` gate for filter links: 404/403 with its messages.
async fn filter_gate(db: &sqlx::PgPool, id: &str, user: &str) -> Result<Option<Response>, sqlx::Error> {
    Ok(match can_modify(db, Owned::Report, id, user).await? {
        WriteDecision::Allowed => None,
        WriteDecision::NotFound => Some(plain_error(StatusCode::NOT_FOUND, "Report not found")),
        WriteDecision::Forbidden => Some(plain_error(StatusCode::FORBIDDEN, FORBIDDEN_NOT_OWNER)),
    })
}

async fn filters_list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(plain_error(StatusCode::UNAUTHORIZED, "Unauthorized"));
    }
    let rows = sqlx::query(
        "SELECT rf.id, rf.report_id, rf.filter_id, rf.target_column, rf.filter_order, fd.name AS filter_name, \
                fd.description, fd.data_source_id, fd.filter_query, fd.display_field, fd.value_field \
         FROM report_filters AS rf INNER JOIN filter_definitions AS fd ON rf.filter_id = fd.id \
         WHERE rf.report_id = $1 ORDER BY rf.filter_order ASC",
    )
    .bind(&id)
    .fetch_all(pool(&ctx))
    .await;
    Ok(match rows {
        Ok(r) => response::raw(StatusCode::OK, &Value::Array(pg_rows_to_json(&r))),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching report filters");
            plain_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch report filters",
            )
        }
    })
}

async fn filters_add(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(plain_error(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let fail = || plain_error(StatusCode::INTERNAL_SERVER_ERROR, "Failed to add report filter");
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    if !js::truthy(body.get("filter_id")) || !js::truthy(body.get("target_column")) {
        return Ok(plain_error(StatusCode::BAD_REQUEST, "Missing required fields"));
    }
    let db = pool(&ctx);
    match filter_gate(db, &id, &session.user.id).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(e) => {
            tracing::error!(error = %e, "Error adding report filter");
            return Ok(fail());
        }
    }
    let result = async {
        let max: Option<i32> = sqlx::query_scalar("SELECT MAX(filter_order) FROM report_filters WHERE report_id = $1")
            .bind(&id)
            .fetch_one(db)
            .await?;
        let next = max.unwrap_or(-1) + 1;
        let link = json!({
            "id": uuid::Uuid::new_v4().to_string(),
            "report_id": id,
            "filter_id": body.get("filter_id").cloned().unwrap_or(Value::Null),
            "target_column": body.get("target_column").cloned().unwrap_or(Value::Null),
            "filter_order": next,
            "created_at": now_iso(),
        });
        sqlx::query("INSERT INTO report_filters (id, report_id, filter_id, target_column, filter_order, created_at) VALUES ($1, $2, $3, $4, $5, $6)")
            .bind(link["id"].as_str())
            .bind(&id)
            .bind(js::text(&link["filter_id"]))
            .bind(js::text(&link["target_column"]))
            .bind(next)
            .bind(link["created_at"].as_str())
            .execute(db)
            .await?;
        Ok::<_, sqlx::Error>(link)
    }
    .await;
    Ok(match result {
        Ok(link) => response::raw(StatusCode::CREATED, &link),
        Err(e) => {
            tracing::error!(error = %e, "Error adding report filter");
            fail()
        }
    })
}

async fn filters_clear(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(plain_error(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let fail = || {
        plain_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to delete report filters",
        )
    };
    let db = pool(&ctx);
    match filter_gate(db, &id, &session.user.id).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    Ok(
        match sqlx::query("DELETE FROM report_filters WHERE report_id = $1")
            .bind(&id)
            .execute(db)
            .await
        {
            Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
            Err(_) => fail(),
        },
    )
}

async fn filter_link_exists(db: &sqlx::PgPool, id: &str, link: &str) -> Result<bool, sqlx::Error> {
    Ok(
        sqlx::query_scalar::<_, String>("SELECT id FROM report_filters WHERE id = $1 AND report_id = $2")
            .bind(link)
            .bind(id)
            .fetch_optional(db)
            .await?
            .is_some(),
    )
}

/// A JSON value Postgres would accept for an INT column: an integer, an
/// integral float, or a string holding one.
fn int_like(v: &Value) -> Option<i32> {
    let n = match v {
        Value::Number(n) => n
            .as_i64()
            .or_else(|| n.as_f64().filter(|f| f.fract() == 0.0).map(|f| f as i64)),
        Value::String(s) => s.trim().parse::<i64>().ok(),
        _ => None,
    }?;
    i32::try_from(n).ok()
}

async fn filter_link_update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path((id, link)): Path<(String, String)>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(plain_error(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let fail = || {
        plain_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to update report filter",
        )
    };
    let db = pool(&ctx);
    match filter_gate(db, &id, &session.user.id).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    let Some(body) = parse_body(&body) else {
        return Ok(fail());
    };
    match filter_link_exists(db, &id, &link).await {
        Ok(true) => {}
        Ok(false) => return Ok(plain_error(StatusCode::NOT_FOUND, "Report filter not found")),
        Err(_) => return Ok(fail()),
    }
    let target = body.get("target_column");
    let order = body.get("filter_order");
    // Kysely with an empty `set({})` emits invalid SQL; Node answers 500.
    if target.is_none() && order.is_none() {
        return Ok(fail());
    }
    // Node hands the value to Postgres, which accepts 2, 2.0 and "2" for an
    // INT column and refuses anything else; so does this.
    let filter_order = match order {
        None | Some(Value::Null) => None,
        Some(v) => match int_like(v) {
            Some(n) => Some(n),
            None => return Ok(fail()),
        },
    };
    let r = sqlx::query(
        "UPDATE report_filters SET target_column = CASE WHEN $3 THEN $4 ELSE target_column END, \
           filter_order = CASE WHEN $5 THEN $6 ELSE filter_order END WHERE id = $1 AND report_id = $2",
    )
    .bind(&link)
    .bind(&id)
    .bind(target.is_some())
    .bind(target.and_then(js::text))
    .bind(order.is_some())
    .bind(filter_order)
    .execute(db)
    .await;
    Ok(match r {
        Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
        Err(_) => fail(),
    })
}

async fn filter_link_delete(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path((id, link)): Path<(String, String)>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(plain_error(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let fail = || {
        plain_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to delete report filter",
        )
    };
    let db = pool(&ctx);
    match filter_gate(db, &id, &session.user.id).await {
        Ok(Some(stop)) => return Ok(stop),
        Ok(None) => {}
        Err(_) => return Ok(fail()),
    }
    match filter_link_exists(db, &id, &link).await {
        Ok(true) => {}
        Ok(false) => return Ok(plain_error(StatusCode::NOT_FOUND, "Report filter not found")),
        Err(_) => return Ok(fail()),
    }
    Ok(
        match sqlx::query("DELETE FROM report_filters WHERE id = $1 AND report_id = $2")
            .bind(&link)
            .bind(&id)
            .execute(db)
            .await
        {
            Ok(_) => response::raw(StatusCode::OK, &json!({ "success": true })),
            Err(_) => fail(),
        },
    )
}

// ── record link — the getReportRecordLink / setReportRecordLink server fns ──

/// `GET /api/reports/:id/record-link` → `{ config }`, as the server function
/// returns it.
async fn record_link_get(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::unauthorized());
    }
    let raw: Option<Option<String>> =
        match sqlx::query_scalar("SELECT record_link_config FROM report_definitions WHERE id = $1")
            .bind(&id)
            .fetch_optional(pool(&ctx))
            .await
        {
            Ok(r) => r,
            Err(e) => {
                return Ok(response::server_error(
                    "record link",
                    e,
                    "SERVER_ERROR",
                    "Failed to fetch record link",
                ))
            }
        };
    let config = record_link::parse_record_link_config(raw.flatten().as_deref());
    Ok(response::raw(StatusCode::OK, &json!({ "config": config })))
}

/// `PUT /api/reports/:id/record-link` with `{ link: {...} | null }`.
/// Administrators only; the template is validated before it is stored.
async fn record_link_set(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    match is_admin(db, &session.user.id).await {
        Ok(true) => {}
        Ok(false) => {
            return Ok(response::error(
                StatusCode::FORBIDDEN,
                "FORBIDDEN",
                "Only administrators can configure record links",
            ))
        }
        Err(e) => {
            return Ok(response::server_error(
                "record link",
                e,
                "SERVER_ERROR",
                "Failed to save record link",
            ))
        }
    }
    let invalid = |m: &str| response::error(StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION", m);
    let Some(body) = parse_body(&body) else {
        return Ok(invalid("Body must be JSON"));
    };
    let link = body.get("link").cloned().unwrap_or(Value::Null);
    let (stored, details, config) = if link.is_null() {
        (None, json!({ "operation": "clearRecordLink" }), Value::Null)
    } else {
        let config: record_link::RecordLinkConfig = match serde_json::from_value(link) {
            Ok(c) => c,
            Err(e) => return Ok(invalid(&e.to_string())),
        };
        if let Err(m) = record_link::validate_url_template(&config.url_template) {
            return Ok(invalid(&m));
        }
        if config.id_column.trim().is_empty() {
            return Ok(invalid("Choose the column holding the record's id."));
        }
        (
            Some(record_link::serialize_record_link_config(&config)),
            json!({ "operation": "setRecordLink", "enabled": config.enabled, "urlTemplate": config.url_template }),
            serde_json::to_value(&config).unwrap_or(Value::Null),
        )
    };
    if let Err(e) =
        sqlx::query("UPDATE report_definitions SET record_link_config = $2, updated_at = $3 WHERE id = $1")
            .bind(&id)
            .bind(stored)
            .bind(now_iso())
            .execute(db)
            .await
    {
        return Ok(response::server_error(
            "record link",
            e,
            "SERVER_ERROR",
            "Failed to save record link",
        ));
    }
    audit(db, &session.user.id, "update", &id, Some(details)).await;
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "success": true, "config": config }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/reports")
        .add("/", get(list).post(create))
        .add("/{id}", get(show).put(update).patch(patch).delete(destroy))
        .add("/{id}/data", get(data))
        .add(
            "/{id}/filters",
            get(filters_list).post(filters_add).delete(filters_clear),
        )
        .add(
            "/{id}/filters/{link}",
            put(filter_link_update).delete(filter_link_delete),
        )
        .add("/{id}/record-link", get(record_link_get).put(record_link_set))
}

#[cfg(test)]
mod tests {
    use super::int_like;
    use serde_json::json;

    /// Review finding: "2" and 2.0 used to become NULL (a 500 on a NOT NULL column).
    #[test]
    fn filter_order_accepts_what_postgres_accepts() {
        assert_eq!(int_like(&json!(2)), Some(2));
        assert_eq!(int_like(&json!(2.0)), Some(2));
        assert_eq!(int_like(&json!("2")), Some(2));
        assert_eq!(int_like(&json!(2.5)), None);
        assert_eq!(int_like(&json!("two")), None);
        assert_eq!(int_like(&json!(true)), None);
    }
}
