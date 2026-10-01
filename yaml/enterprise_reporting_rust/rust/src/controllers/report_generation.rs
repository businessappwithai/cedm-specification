//! `/api/report-generation` — twin of
//! `src/routes/api/report-generation/{definitions,definitions.$id,artifacts.$id}.ts`.
//!
//! `POST /definitions` stays on Node: its dry-run branch calls the in-process
//! Mastra report-builder agent, which moves with the NL work (Phase 5), and a
//! route is served by one backend or the other.
//!
//! Deliberate differences (MIGRATION_PLAN.md §9): the list shows an admin
//! every definition and applies `since` / `titleLike` to the rows as well as
//! the total (D-24); reading, changing, running or deleting a definition —
//! and listing its artifacts — needs its creator or an admin (D-25).
use axum::{
    body::{Body, Bytes},
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::Response,
    routing::get,
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use sqlx::PgPool;

use super::support::parse_body;
use crate::{
    auth::{CurrentSession, Session},
    common::{
        db::{pg_row_to_json, pg_rows_to_json, pool},
        js,
        pagination::js_parse_int,
    },
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    reportgen::worker::{execute, GenerationParams},
};

fn err(status: StatusCode, message: &str) -> Response {
    crate::common::response::raw(status, &json!({ "error": message }))
}

fn ok(body: &Value) -> Response {
    crate::common::response::raw(StatusCode::OK, body)
}

/// Admin by role name, as these routes spell it (`admin`, `administrator`,
/// or anything starting `admin`).
fn is_admin(session: &Session) -> bool {
    session.user.roles.iter().any(|r| {
        let n = r.to_lowercase();
        n == "admin" || n == "administrator" || n.starts_with("admin")
    })
}

#[derive(Debug, Deserialize)]
struct ListQuery {
    page: Option<String>,
    #[serde(rename = "pageSize")]
    page_size: Option<String>,
    history: Option<String>,
    since: Option<String>,
    #[serde(rename = "titleLike")]
    title_like: Option<String>,
}

const LIST_COLUMNS: &str = "rd.id, rd.title, rd.created_by, rd.data_source_id, rd.nl_query, rd.generated_sql, \
    rd.metric_columns, rd.dimension_columns, rd.filter_config, rd.date_range_from, rd.date_range_to, rd.chart_type, \
    rd.output_formats, rd.recipient_config, rd.schedule_cron, rd.schedule_enabled, rd.last_run_at, rd.last_run_status, \
    rd.created_at, rd.updated_at, ds.name AS data_source_name";

/// `deserializeDefinition`: the JSON columns parsed in place.
fn deserialize(mut row: Value) -> Result<Value, String> {
    let Some(o) = row.as_object_mut() else {
        return Ok(row);
    };
    let parse = |v: Option<&Value>, default: &str| -> Result<Value, String> {
        let s = v
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .unwrap_or(default);
        serde_json::from_str(s).map_err(|e| e.to_string())
    };
    for (k, d) in [
        ("metric_columns", "[]"),
        ("dimension_columns", "[]"),
        ("output_formats", "[\"csv\"]"),
        ("recipient_config", "[]"),
    ] {
        let v = parse(o.get(k), d)?;
        o.insert(k.into(), v);
    }
    let filter = match o.get("filter_config") {
        Some(v) if js::truthy(Some(v)) => parse(Some(v), "null")?,
        _ => Value::Null,
    };
    o.insert("filter_config".into(), filter);
    let enabled = js::truthy(o.get("schedule_enabled"));
    o.insert("schedule_enabled".into(), json!(enabled));
    Ok(row)
}

/// `GET /api/report-generation/definitions`.
async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<ListQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
    let page_size = q
        .page_size
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(20)
        .clamp(1, 100);

    let mut conds: Vec<String> = Vec::new();
    let mut binds: Vec<String> = Vec::new();
    if !is_admin(&session) {
        binds.push(session.user.id.clone());
        conds.push(format!("rd.created_by = ${}", binds.len()));
    }
    if let Some(since) = q.since.as_deref().filter(|s| !s.is_empty()) {
        let days = js_parse_int(&since.replacen('d', "", 1)).unwrap_or(0);
        if days > 0 {
            let from = (chrono::Utc::now() - chrono::Duration::days(days))
                .format("%Y-%m-%d %H:%M:%S")
                .to_string();
            binds.push(from);
            conds.push(format!("rd.created_at >= CAST(${} AS TIMESTAMP)", binds.len()));
        }
    }
    if let Some(t) = q.title_like.as_deref().filter(|s| !s.is_empty()) {
        binds.push(format!("%{t}%"));
        conds.push(format!("rd.title LIKE ${}", binds.len()));
    }
    let where_sql = if conds.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", conds.join(" AND "))
    };
    let from = "FROM nl_report_definitions rd LEFT JOIN data_sources ds ON ds.id = rd.data_source_id";
    let run = async {
        let mut count = sqlx::query_scalar::<_, i64>(sqlx::AssertSqlSafe(format!(
            "SELECT COUNT(rd.id) {from}{where_sql}"
        )));
        for b in &binds {
            count = count.bind(b);
        }
        let total = count.fetch_one(db).await?;
        let mut rows_q = sqlx::query(sqlx::AssertSqlSafe(format!(
            "SELECT {LIST_COLUMNS} {from}{where_sql} ORDER BY rd.created_at DESC LIMIT {page_size} OFFSET {}",
            page * page_size
        )));
        for b in &binds {
            rows_q = rows_q.bind(b);
        }
        let rows = rows_q.fetch_all(db).await?;
        Ok::<_, sqlx::Error>((total, pg_rows_to_json(&rows)))
    };
    let (total, rows) = match run.await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "report-generation list failed");
            return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"));
        }
    };
    let mut definitions = Vec::with_capacity(rows.len());
    for r in rows {
        match deserialize(r) {
            Ok(d) => definitions.push(d),
            Err(e) => {
                tracing::error!(error = %e, "report-generation definition is not valid JSON");
                return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"));
            }
        }
    }
    if q.history.as_deref() == Some("true") {
        for d in &mut definitions {
            let id = d
                .get("id")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let n: i64 = sqlx::query_scalar(
                "SELECT COUNT(id) FROM generated_report_artifacts WHERE report_definition_id = $1",
            )
            .bind(&id)
            .fetch_one(db)
            .await
            .unwrap_or(0);
            if let Some(o) = d.as_object_mut() {
                o.insert("artifactCount".into(), json!(n));
            }
        }
    }
    Ok(ok(
        &json!({ "definitions": definitions, "total": total, "page": page, "pageSize": page_size }),
    ))
}

/// The definition's creator, or `None` when it does not exist.
async fn owner(db: &PgPool, id: &str) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar("SELECT created_by FROM nl_report_definitions WHERE id = $1")
        .bind(id)
        .fetch_optional(db)
        .await
}

/// D-25: the creator or an admin. `Some(response)` means stop.
async fn gate(db: &PgPool, session: &Session, id: &str) -> Option<Response> {
    match owner(db, id).await {
        Ok(None) => Some(err(StatusCode::NOT_FOUND, "Not found")),
        Ok(Some(by)) if by == session.user.id || is_admin(session) => None,
        Ok(Some(_)) => Some(err(StatusCode::FORBIDDEN, "Forbidden")),
        Err(e) => {
            tracing::error!(error = %e, "report-generation lookup failed");
            Some(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"))
        }
    }
}

/// `GET /api/report-generation/definitions/{id}`.
async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    if let Some(r) = gate(db, &session, &id).await {
        return Ok(r);
    }
    match sqlx::query(
        "SELECT rd.*, ds.name AS data_source_name FROM nl_report_definitions rd \
         LEFT JOIN data_sources ds ON ds.id = rd.data_source_id WHERE rd.id = $1",
    )
    .bind(&id)
    .fetch_optional(db)
    .await
    {
        Ok(Some(row)) => Ok(ok(&json!({ "definition": pg_row_to_json(&row) }))),
        Ok(None) => Ok(err(StatusCode::NOT_FOUND, "Not found")),
        Err(_) => Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
    }
}

#[derive(Debug, Deserialize)]
struct PatchQuery {
    action: Option<String>,
}

/// `PATCH /api/report-generation/definitions/{id}` — edit the schedule,
/// recipients, formats or title; or `?action=run` to generate now.
async fn patch(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<PatchQuery>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    if let Some(r) = gate(db, &session, &id).await {
        return Ok(r);
    }
    if q.action.as_deref() == Some("run") {
        let status: Option<Option<String>> =
            sqlx::query_scalar("SELECT last_run_status FROM nl_report_definitions WHERE id = $1")
                .bind(&id)
                .fetch_optional(db)
                .await
                .ok()
                .flatten();
        if matches!(status, Some(Some(ref s)) if s == "running") {
            return Ok(err(StatusCode::CONFLICT, "Report is already running"));
        }
        let result = execute(
            db,
            &GenerationParams {
                report_definition_id: id,
                triggered_by: "manual".into(),
            },
        )
        .await;
        return Ok(ok(&json!({ "result": result })));
    }
    let Some(body) = parse_body(&body) else {
        return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"));
    };
    let mut sets: Vec<(&str, Option<String>, bool)> = Vec::new();
    if let Some(v) = body.get("scheduleCron") {
        sets.push(("schedule_cron", js::text(v), false));
    }
    if let Some(v) = body.get("scheduleEnabled") {
        sets.push(("schedule_enabled", Some(js::truthy(Some(v)).to_string()), true));
    }
    if let Some(v) = body.get("recipients") {
        sets.push(("recipient_config", Some(js::stringify(v)), false));
    }
    if let Some(v) = body.get("outputFormats") {
        sets.push(("output_formats", Some(js::stringify(v)), false));
    }
    if let Some(v) = body.get("title") {
        sets.push(("title", js::text(v), false));
    }
    if !sets.is_empty() {
        let mut sql = String::from("UPDATE nl_report_definitions SET updated_at = CAST($2 AS TIMESTAMP)");
        for (i, (col, _, boolean)) in sets.iter().enumerate() {
            if *boolean {
                sql.push_str(&format!(", {col} = CAST(${} AS BOOLEAN)", i + 3));
            } else {
                sql.push_str(&format!(", {col} = ${}", i + 3));
            }
        }
        sql.push_str(" WHERE id = $1");
        let mut qy = sqlx::query(sqlx::AssertSqlSafe(sql))
            .bind(&id)
            .bind(chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string());
        for (_, v, _) in &sets {
            qy = qy.bind(v.clone());
        }
        if let Err(e) = qy.execute(db).await {
            tracing::error!(error = %e, "report-generation update failed");
            return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"));
        }
    }
    match sqlx::query("SELECT * FROM nl_report_definitions WHERE id = $1")
        .bind(&id)
        .fetch_optional(db)
        .await
    {
        Ok(row) => Ok(ok(&match row {
            Some(r) => json!({ "definition": pg_row_to_json(&r) }),
            None => json!({}),
        })),
        Err(_) => Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
    }
}

/// `DELETE /api/report-generation/definitions/{id}`. The artifacts stay until
/// the retention cleanup removes them, as in Node (P-12).
async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    if let Some(r) = gate(db, &session, &id).await {
        return Ok(r);
    }
    match sqlx::query("DELETE FROM nl_report_definitions WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        Ok(_) => Ok(ok(&json!({ "success": true }))),
        Err(_) => Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
    }
}

#[derive(Debug, Deserialize)]
struct ArtifactQuery {
    download: Option<String>,
    format: Option<String>,
    page: Option<String>,
    #[serde(rename = "pageSize")]
    page_size: Option<String>,
}

fn mime(format: &str) -> &'static str {
    match format {
        "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pdf" => "application/pdf",
        "csv" => "text/csv",
        _ => "application/octet-stream",
    }
}

/// `report_<date>_<hh-mm-ss>.<ext>` from an artifact's `created_at`.
fn suggested_name(created_at: &str, format: &str) -> String {
    let ext = if format == "excel" { "xlsx" } else { format };
    let date = created_at.get(..10).unwrap_or_default();
    let time = created_at.get(11..19).unwrap_or_default().replace(':', "-");
    format!("report_{date}_{time}.{ext}")
}

/// `GET /api/report-generation/artifacts/{id}` — `id` is an artifact with
/// `?download=true&format=…`, otherwise a report definition whose runs are
/// listed.
async fn artifacts(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<ArtifactQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    let admin = is_admin(&session);
    if q.download.as_deref() == Some("true") && q.format.as_deref().is_some_and(|f| !f.is_empty()) {
        let artifact = match sqlx::query("SELECT * FROM generated_report_artifacts WHERE id = $1")
            .bind(&id)
            .fetch_optional(db)
            .await
        {
            Ok(Some(r)) => pg_row_to_json(&r),
            Ok(None) => return Ok(err(StatusCode::NOT_FOUND, "Artifact not found")),
            Err(_) => return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
        };
        let s = |k: &str| {
            artifact
                .get(k)
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string()
        };
        if !admin && s("created_by") != session.user.id {
            return Ok(err(StatusCode::FORBIDDEN, "Forbidden"));
        }
        if !admin {
            let ds: Option<String> =
                sqlx::query_scalar("SELECT data_source_id FROM nl_report_definitions WHERE id = $1")
                    .bind(s("report_definition_id"))
                    .fetch_optional(db)
                    .await
                    .ok()
                    .flatten();
            if let Some(ds) = ds {
                let access =
                    sqlx::query("SELECT 1 FROM ds_user_roles WHERE data_source_id = $1 AND user_id = $2")
                        .bind(&ds)
                        .bind(&session.user.id)
                        .fetch_optional(db)
                        .await
                        .ok()
                        .flatten();
                if access.is_none() {
                    return Ok(err(StatusCode::FORBIDDEN, "Data source access revoked"));
                }
            }
        }
        let Ok(bytes) = tokio::fs::read(s("file_path")).await else {
            return Ok(err(StatusCode::NOT_FOUND, "File not found on disk"));
        };
        let format = s("format");
        let len = bytes.len();
        return Ok(Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime(&format))
            .header(
                header::CONTENT_DISPOSITION,
                format!(
                    "attachment; filename=\"{}\"",
                    suggested_name(&s("created_at"), &format)
                ),
            )
            .header(header::CONTENT_LENGTH, len.to_string())
            .body(Body::from(bytes))
            .unwrap_or_else(|_| err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")));
    }

    // D-25: the runs of a definition are its creator's or an admin's to list.
    // A definition that no longer exists lists only for an admin.
    if !admin {
        match owner(db, &id).await {
            Ok(Some(by)) if by == session.user.id => {}
            Ok(Some(_)) => return Ok(err(StatusCode::FORBIDDEN, "Forbidden")),
            Ok(None) => {
                let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
                let page_size = q
                    .page_size
                    .as_deref()
                    .and_then(js_parse_int)
                    .unwrap_or(20)
                    .clamp(1, 100);
                return Ok(ok(
                    &json!({ "executions": [], "total": 0, "page": page, "pageSize": page_size }),
                ));
            }
            Err(_) => return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
        }
    }
    let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
    let page_size = q
        .page_size
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(20)
        .clamp(1, 100);
    let rows = match sqlx::query(
        "SELECT * FROM generated_report_artifacts WHERE report_definition_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(&id)
    .bind(page_size)
    .bind(page * page_size)
    .fetch_all(db)
    .await
    {
        Ok(r) => pg_rows_to_json(&r),
        Err(_) => return Ok(err(StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")),
    };
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(id) FROM generated_report_artifacts WHERE report_definition_id = $1",
    )
    .bind(&id)
    .fetch_one(db)
    .await
    .unwrap_or(0);
    let mut executions: Vec<Map<String, Value>> = Vec::new();
    for a in &rows {
        let g = |k: &str| a.get(k).cloned().unwrap_or(Value::Null);
        let exec = g("execution_id");
        let idx = match executions
            .iter()
            .position(|e| e.get("executionId") == Some(&exec))
        {
            Some(i) => i,
            None => {
                let mut e = Map::new();
                e.insert("executionId".into(), exec.clone());
                e.insert("createdAt".into(), g("created_at"));
                e.insert("status".into(), g("status"));
                e.insert("rowCount".into(), g("row_count"));
                e.insert("executionMs".into(), g("execution_ms"));
                e.insert("triggeredBy".into(), g("triggered_by"));
                e.insert("artifacts".into(), json!([]));
                executions.push(e);
                executions.len() - 1
            }
        };
        let format = a.get("format").and_then(Value::as_str).unwrap_or_default();
        let artifact_id = a.get("id").and_then(Value::as_str).unwrap_or_default();
        let created = a.get("created_at").and_then(Value::as_str).unwrap_or_default();
        if let Some(list) = executions[idx].get_mut("artifacts").and_then(Value::as_array_mut) {
            list.push(json!({
                "id": artifact_id,
                "format": format,
                "fileSizeBytes": g("file_size_bytes"),
                "downloadUrl": format!("/api/report-generation/artifacts/{artifact_id}?download=true&format={format}"),
                "filename": suggested_name(created, format),
            }));
        }
    }
    Ok(ok(
        &json!({ "executions": executions, "total": total, "page": page, "pageSize": page_size }),
    ))
}

/// The PostgreSQL message of a failed query, as node-pg's `error.message`.
fn db_message(e: &sqlx::Error) -> String {
    e.as_database_error()
        .map_or_else(|| e.to_string(), |d| d.message().to_string())
}

/// `new Date().toISOString().slice(0, 19).replace("T", " ")`.
fn iso_now_plain() -> String {
    crate::common::time::now_iso()
        .chars()
        .take(19)
        .collect::<String>()
        .replace('T', " ")
}

/// The dry run: NL → SQL through the report-builder agent, then a ten-row
/// preview, retried once with the error fed back when the SQL fails.
///
/// Deliberate difference (MIGRATION_PLAN.md §9, D-35): the preview is the
/// caller's query, so it goes through `decideQueryRun` and the read-only
/// transaction. Node ran whatever the model wrote on the data source's
/// read-write connection, for any signed-in user, which let anyone read any
/// table by asking for it — and would have run a write the model produced.
#[allow(clippy::too_many_lines)]
async fn dry_run(db: &PgPool, session: &Session, b: &Value) -> Response {
    for field in ["dataSourceId", "nlQuery"] {
        if !js::truthy(b.get(field)) {
            return err(
                StatusCode::BAD_REQUEST,
                &format!("Missing required field: {field}"),
            );
        }
    }
    let ds_id = js::text(&b["dataSourceId"]).unwrap_or_default();
    let nl = js::text(&b["nlQuery"]).unwrap_or_default();
    let failed = |m: String| err(StatusCode::INTERNAL_SERVER_ERROR, &format!("Dry-run failed: {m}"));
    let entities = match sqlx::query(
        "SELECT e.entity_name, e.description AS entity_description, f.field_name, f.data_type, \
                f.description AS field_description, f.is_foreign_key, f.foreign_key_table, f.foreign_key_column \
         FROM metadata_entity_header AS e LEFT JOIN metadata_entity_field AS f ON f.entity_header_id = e.id \
         WHERE e.data_source_id = $1 AND e.is_active = true",
    )
    .bind(&ds_id)
    .fetch_all(db)
    .await
    {
        Ok(r) => r,
        Err(e) => return failed(db_message(&e)),
    };
    let mut order: Vec<String> = Vec::new();
    let mut tables: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    let mut descs: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    let mut fk_order: Vec<String> = Vec::new();
    let mut fks: std::collections::HashMap<String, Vec<(String, String, String)>> =
        std::collections::HashMap::new();
    for row in &entities {
        use sqlx::Row;
        let Some(entity) = row
            .get::<Option<String>, _>("entity_name")
            .filter(|e| !e.is_empty())
        else {
            continue;
        };
        if !tables.contains_key(&entity) {
            tables.insert(entity.clone(), Vec::new());
            order.push(entity.clone());
            if let Some(d) = row
                .get::<Option<String>, _>("entity_description")
                .filter(|d| !d.is_empty())
            {
                descs.insert(entity.clone(), d);
            }
        }
        if let Some(field) = row
            .get::<Option<String>, _>("field_name")
            .filter(|f| !f.is_empty())
        {
            // `?? "text"`: only a missing type becomes text; an empty one stays empty.
            let ty = row
                .get::<Option<String>, _>("data_type")
                .unwrap_or_else(|| "text".into());
            let mut entry = format!("{field} ({ty})");
            if let Some(d) = row
                .get::<Option<String>, _>("field_description")
                .filter(|d| !d.is_empty())
            {
                entry.push_str(&format!(" -- {d}"));
            }
            tables.entry(entity.clone()).or_default().push(entry);
            let is_fk = row.get::<Option<bool>, _>("is_foreign_key").unwrap_or(false);
            if let Some(ref_table) = row
                .get::<Option<String>, _>("foreign_key_table")
                .filter(|t| is_fk && !t.is_empty())
            {
                if !fks.contains_key(&entity) {
                    fk_order.push(entity.clone());
                }
                let ref_col = row
                    .get::<Option<String>, _>("foreign_key_column")
                    .unwrap_or_else(|| "id".into());
                fks.entry(entity.clone())
                    .or_default()
                    .push((field, ref_table, ref_col));
            }
        }
    }
    let schema_text = order
        .iter()
        .map(|t| {
            let desc = descs
                .get(t)
                .map(|d| format!("\nDescription: {d}"))
                .unwrap_or_default();
            format!("Table: {t}{desc}\nColumns: {}", tables[t].join(", "))
        })
        .collect::<Vec<_>>()
        .join("\n\n");
    let ds = match sqlx::query_as::<_, crate::datasources::DataSourceRow>(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1",
    )
    .bind(&ds_id)
    .fetch_optional(db)
    .await
    {
        Ok(Some(d)) => d,
        Ok(None) => return err(StatusCode::NOT_FOUND, "Data source not found"),
        Err(e) => return failed(db_message(&e)),
    };
    let conn = match crate::datasources::get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => return failed(e.to_string()),
    };
    let mut direct: Vec<String> = Vec::new();
    let mut multi: Vec<String> = Vec::new();
    for a in &fk_order {
        for (col_ab, b_table, ref_col) in &fks[a] {
            direct.push(format!(
                "{a} JOIN {b_table} ON {a}.{col_ab}::uuid = {b_table}.{ref_col}"
            ));
            for (col_bc, c_table, ref_col_c) in fks.get(b_table).map(Vec::as_slice).unwrap_or_default() {
                if c_table != a {
                    multi.push(format!(
                        "{a} → {c_table} (via {b_table}): JOIN {b_table} ON {a}.{col_ab}::uuid = {b_table}.{ref_col} JOIN {c_table} ON {b_table}.{col_bc}::uuid = {c_table}.{ref_col_c}"
                    ));
                }
            }
        }
    }
    let join_section = [
        (!multi.is_empty()).then(|| {
            format!(
                "MULTI-HOP JOIN PATHS — YOU MUST USE THESE EXACT PATHS FOR CROSS-TABLE QUERIES:\n{}",
                multi.iter().take(20).cloned().collect::<Vec<_>>().join("\n")
            )
        }),
        (!direct.is_empty()).then(|| {
            format!(
                "DIRECT FK JOINS (all varchar→uuid, ::uuid cast required):\n{}",
                direct.iter().take(25).cloned().collect::<Vec<_>>().join("\n")
            )
        }),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join("\n\n");
    let schema_with_relations = if join_section.is_empty() {
        schema_text
    } else {
        format!("{join_section}\n\n{schema_text}")
    };
    let report = match crate::nlquery::agents::report_builder_agent(
        &nl,
        "PostgreSQL database. Use ONLY tables and columns listed in the DATABASE SCHEMA. Cast varchar *_id columns to ::uuid when joining to uuid id columns.",
        &schema_with_relations,
        Some("all time — do NOT add any date/time filter unless the user's query explicitly mentions a time period (e.g. 'last 7 days', 'this month', 'Q1 2026'). If no time period is mentioned, omit WHERE clauses on date columns entirely."),
    )
    .await
    {
        Ok(r) => r,
        Err(m) => return failed(m),
    };
    // D-35: the caller's query, gated and read-only.
    let preview = |sql: String| {
        let conn = &conn;
        let ds_id = &ds_id;
        async move {
            let clean = regex::Regex::new(r";\s*$")
                .map(|re| re.replace(&sql, "").into_owned())
                .unwrap_or(sql);
            let wrapped = format!("SELECT * FROM ({clean}) AS _preview LIMIT 10");
            if let QueryRunDecision::Refused(m) =
                decide_query_run(db, &session.user.id, &wrapped, ds_id).await
            {
                return Err((true, m));
            }
            conn.fetch_json(&wrapped)
                .await
                .map_err(|e| (false, db_message(&e)))
        }
    };
    let mut generated = report.sql.clone();
    let rows = match preview(generated.clone()).await {
        Ok(r) => r,
        Err((true, m)) => return err(StatusCode::FORBIDDEN, &m),
        Err((false, sql_err)) => {
            let col = regex::Regex::new(r"column [\w.]*?\.?(\w+) does not exist")
                .ok()
                .and_then(|re| re.captures(&sql_err).map(|c| c[1].to_string()))
                .unwrap_or_default();
            let relevant: Vec<String> = if col.is_empty() {
                multi.iter().take(5).cloned().collect()
            } else {
                let stem = col.strip_suffix("_id").unwrap_or(&col).to_string();
                multi.iter().filter(|p| p.contains(&stem)).cloned().collect()
            };
            let fix_hint = format!(
                "\nCRITICAL FIX REQUIRED: The previous SQL had a wrong column/join. {}\nDo NOT guess column names. Only use columns that appear in the DATABASE SCHEMA above.",
                if relevant.is_empty() {
                    "Check MULTI-HOP JOIN PATHS in the schema.".to_string()
                } else {
                    format!("Use these exact join paths:\n{}", relevant.join("\n"))
                }
            );
            let retry = match crate::nlquery::agents::report_builder_agent(
                &nl,
                &format!(
                    "PostgreSQL database. Use ONLY tables and columns in the DATABASE SCHEMA. Cast varchar *_id columns to ::uuid when joining.\nPREVIOUS SQL FAILED: {generated}\nERROR: {sql_err}{fix_hint}"
                ),
                &schema_with_relations,
                Some("current period"),
            )
            .await
            {
                Ok(r) => r,
                Err(m) => return failed(m),
            };
            generated = retry.sql;
            match preview(generated.clone()).await {
                Ok(r) => r,
                Err((true, m)) => return err(StatusCode::FORBIDDEN, &m),
                Err((false, m)) => return failed(m),
            }
        }
    };
    let columns: Vec<String> = rows
        .first()
        .and_then(Value::as_object)
        .map(|o| o.keys().cloned().collect())
        .unwrap_or_default();
    ok(&json!({
        "generatedSQL": generated,
        "previewRows": rows,
        "previewColumns": columns,
        "intent": {
            "intentType": "report_generation",
            "reportTitle": nl,
            "dataSourceHint": ds_id,
            "metrics": if report.metric_column.is_empty() { json!([]) } else { json!([report.metric_column]) },
            "dimensions": [],
            "filters": [],
            "outputFormats": ["csv"],
            "recipients": [],
            "schedule": null,
            "chartType": "bar",
        },
    }))
}

/// `POST /api/report-generation/definitions`: a dry run, or create a
/// definition (snapshotting the caller's RBAC context) and, unless it is
/// scheduled without `runNow`, run it at once.
async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(err(StatusCode::UNAUTHORIZED, "Unauthorized"));
    };
    let db = pool(&ctx);
    let Some(b) = parse_body(&body) else {
        return Ok(err(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Unexpected end of JSON input",
        ));
    };
    if js::truthy(b.get("dryRun")) {
        return Ok(dry_run(db, &session, &b).await);
    }
    for field in [
        "title",
        "dataSourceId",
        "nlQuery",
        "generatedSQL",
        "outputFormats",
    ] {
        if !js::truthy(b.get(field)) {
            return Ok(err(
                StatusCode::BAD_REQUEST,
                &format!("Missing required field: {field}"),
            ));
        }
    }
    let snapshot = crate::reportgen::rbac::resolve_context(db, &session.user.id)
        .await
        .map_err(|e| Error::string(&e))?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = iso_now_plain();
    let stringify_or = |k: &str, d: Value| js::stringify(b.get(k).filter(|v| !v.is_null()).unwrap_or(&d));
    let text_or_null = |k: &str| b.get(k).filter(|v| !v.is_null()).and_then(js::text);
    let cron = text_or_null("scheduleCron");
    sqlx::query(
        "INSERT INTO nl_report_definitions (id, title, created_by, data_source_id, nl_query, generated_sql, \
            metric_columns, dimension_columns, filter_config, date_range_from, date_range_to, chart_type, \
            output_formats, recipient_config, schedule_cron, schedule_timezone, schedule_enabled, rbac_snapshot, \
            rbac_snapshot_version, last_run_status, last_run_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11::date, $12, $13, $14, $15, $16, $17, $18, 1, \
            NULL, NULL, $19::timestamp, $19::timestamp)",
    )
    .bind(&id)
    .bind(js::text(&b["title"]))
    .bind(&session.user.id)
    .bind(js::text(&b["dataSourceId"]))
    .bind(js::text(&b["nlQuery"]))
    .bind(js::text(&b["generatedSQL"]))
    .bind(stringify_or("metricColumns", json!([])))
    .bind(stringify_or("dimensionColumns", json!([])))
    .bind(js::truthy(b.get("filterConfig")).then(|| js::stringify(&b["filterConfig"])))
    .bind(text_or_null("dateRangeFrom"))
    .bind(text_or_null("dateRangeTo"))
    .bind(text_or_null("chartType").unwrap_or_else(|| "bar".into()))
    .bind(js::stringify(&b["outputFormats"]))
    .bind(stringify_or("recipients", json!([])))
    .bind(&cron)
    .bind(text_or_null("scheduleTimezone").unwrap_or_else(|| "UTC".into()))
    .bind(cron.as_deref().is_some_and(|c| !c.is_empty()))
    .bind(js::stringify(&snapshot))
    .bind(&now)
    .execute(db)
    .await
    .map_err(|e| Error::string(&db_message(&e)))?;
    if !js::truthy(b.get("scheduleCron")) || js::truthy(b.get("runNow")) {
        let result = execute(
            db,
            &GenerationParams {
                report_definition_id: id.clone(),
                triggered_by: "manual".into(),
            },
        )
        .await;
        return Ok(crate::common::response::raw(
            StatusCode::CREATED,
            &json!({ "definition": { "id": id }, "result": result }),
        ));
    }
    Ok(crate::common::response::raw(
        StatusCode::CREATED,
        &json!({ "definition": { "id": id } }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/report-generation")
        .add("/definitions", get(list).post(create))
        .add("/definitions/{id}", get(show).patch(patch).delete(destroy))
        .add("/artifacts/{id}", get(artifacts))
}
