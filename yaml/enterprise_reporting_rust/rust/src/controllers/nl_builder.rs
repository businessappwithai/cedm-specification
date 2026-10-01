//! REST twins of the NL builder's server functions
//! (`src/server-fns/admin-builder.ts`): turn a description into SQL through
//! Mastra or llama.cpp with pgvector and knowledge-graph context, preview it,
//! and save it as a report or chart. Administrators only.
//!
//! Deliberate differences (MIGRATION_PLAN.md §9): the preview runs through
//! `decideQueryRun` and the read-only transaction (D-35) — Node ran the
//! model's SQL on the read-write connection — and the schema the model is
//! given is the data source's real one (D-36).
use axum::{
    body::Bytes,
    extract::State,
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::PgPool;

use super::support::parse_body;
use crate::{
    auth::CurrentSession,
    common::{db::pool, js, response, time::now_iso},
    datasources::{get_connection, DataSourceRow, UserDb},
    graph::rag,
    nlquery::agents,
    permissions::{
        ownership::is_admin,
        runnable_query::{decide_query_run, QueryRunDecision},
    },
    security::audit::{log_audit, AuditEntry},
};

fn fail(status: StatusCode, message: &str) -> Response {
    response::error_no_code(status, message)
}

/// `requireAuth()` then `isAdmin`: the admin's id, or the refusal.
async fn admin(
    db: &PgPool,
    session: Option<&crate::auth::Session>,
) -> Result<std::result::Result<String, Response>> {
    let Some(s) = session else {
        return Ok(Err(fail(StatusCode::UNAUTHORIZED, "UNAUTHORIZED")));
    };
    if !is_admin(db, &s.user.id)
        .await
        .map_err(|e| Error::string(&e.to_string()))?
    {
        return Ok(Err(fail(StatusCode::FORBIDDEN, "FORBIDDEN")));
    }
    Ok(Ok(s.user.id.clone()))
}

async fn audit(db: &PgPool, user: &str, action: &str, resource_type: &str, id: &str, details: Value) {
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type,
            resource_id: Some(id),
            details: Some(details),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
}

/// `nlToSql(description, dataSource)`: Mastra, then llama.cpp.
async fn nl_to_sql(
    db: &PgPool,
    ds_id: &str,
    user: &PgPool,
    nl: &str,
) -> std::result::Result<(String, Value), String> {
    let schema = agents::schema_metadata(ds_id, user).await;
    let mut context = agents::context_prompt(db, ds_id, "admin", &js::stringify(&schema))
        .await
        .unwrap_or_default();
    if let Ok(g) = rag::get_graph_context(ds_id, nl, 8).await {
        let section = rag::format_graph_context(&g);
        if !section.is_empty() {
            context = if context.is_empty() {
                section
            } else {
                format!("{context}\n\n{section}")
            };
        }
    }
    if agents::is_mastra_available().await {
        if let Some(r) = agents::translate_via_mastra(nl, &schema, &context).await {
            if let Some(sql) = r.get("sql").and_then(Value::as_str).filter(|s| !s.is_empty()) {
                let confidence = r
                    .get("confidence")
                    .filter(|c| !c.is_null())
                    .cloned()
                    .unwrap_or(json!(0.8));
                return Ok((sql.to_string(), confidence));
            }
        }
    }
    if agents::is_llama_reasoning_available().await {
        if let Some(sql) = agents::translate_via_llama(nl, &schema).await {
            return Ok((sql, json!(0.7)));
        }
    }
    Err("No NL→SQL backend available. Start Mastra or llama.cpp first.".into())
}

/// `nlBuildPreview` → `POST /api/nl-builder/preview`: `{ nlDescription, dataSourceId }`.
async fn preview(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let me = match admin(db, session.as_ref()).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let b = parse_body(&body).unwrap_or(Value::Null);
    let nl = b
        .get("nlDescription")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let ds_id = b
        .get("dataSourceId")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let ds: Option<DataSourceRow> = sqlx::query_as(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1 AND is_active = true",
    )
    .bind(&ds_id)
    .fetch_optional(db)
    .await
    .map_err(|e| Error::string(&e.to_string()))?;
    #[allow(clippy::result_large_err)] // loco_rs::Error is what every handler returns
    let answer = |v: Value| Ok(response::raw(StatusCode::OK, &v));
    let Some(ds) = ds else {
        return answer(json!({ "success": false, "error": "Data source not found" }));
    };
    let user = match get_connection(&ds).await {
        Ok(UserDb::Pg(p)) => p,
        Ok(UserDb::MySql(_)) => {
            return answer(json!({ "success": false, "error": "PostgreSQL data sources only" }))
        }
        Err(e) => return answer(json!({ "success": false, "error": e.to_string() })),
    };
    let (sql, confidence) = match nl_to_sql(db, &ds_id, &user, &nl).await {
        Ok(x) => x,
        Err(e) => return answer(json!({ "success": false, "error": e })),
    };
    let trimmed = sql.trim_end();
    let limited = format!("{} LIMIT 20", trimmed.strip_suffix(';').unwrap_or(trimmed));
    // D-35: gated and read-only.
    let outcome = match decide_query_run(db, &me, &limited, &ds_id).await {
        QueryRunDecision::Refused(m) => Err(m),
        QueryRunDecision::Ok => UserDb::Pg(user).fetch_json(&limited).await.map_err(|e| {
            e.as_database_error()
                .map_or_else(|| e.to_string(), |d| d.message().to_string())
        }),
    };
    match outcome {
        Ok(rows) => {
            let columns: Vec<String> = rows
                .first()
                .and_then(Value::as_object)
                .map(|o| o.keys().cloned().collect())
                .unwrap_or_default();
            audit(
                db,
                &me,
                "preview",
                "nl_builder",
                &ds_id,
                json!({ "nlDescription": nl, "sql": sql, "rowCount": rows.len() }),
            )
            .await;
            answer(
                json!({ "success": true, "sql": sql, "confidence": confidence, "columns": columns, "rows": rows }),
            )
        }
        Err(m) => {
            answer(json!({ "success": false, "error": format!("SQL execution failed: {m}"), "sql": sql }))
        }
    }
}

async fn insert_saved_query(
    db: &PgPool,
    id: &str,
    b: &Value,
    user: &str,
    now: &str,
) -> std::result::Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO saved_queries (id, name, description, data_source_id, sql_content, is_validated, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, true, $6, $7, $7)",
    )
    .bind(id)
    .bind(b.get("name").and_then(Value::as_str))
    .bind(b.get("description").and_then(Value::as_str))
    .bind(b.get("dataSourceId").and_then(Value::as_str))
    .bind(b.get("sql").and_then(Value::as_str))
    .bind(user)
    .bind(now)
    .execute(db)
    .await
    .map(|_| ())
}

/// `nlSaveReport` → `POST /api/nl-builder/save-report`.
async fn save_report(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let me = match admin(db, session.as_ref()).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let b = parse_body(&body).unwrap_or(Value::Null);
    let saved_query_id = uuid::Uuid::new_v4().to_string();
    let report_id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let formats = b
        .get("exportFormats")
        .cloned()
        .unwrap_or(json!(["csv", "xlsx", "pdf"]));
    let run = async {
        insert_saved_query(db, &saved_query_id, &b, &me, &now).await?;
        sqlx::query(
            "INSERT INTO report_definitions (id, name, description, saved_query_id, column_config, export_formats, \
                is_public, is_deleted, created_by, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, '[]', $5, false, false, $6, $7, $7)",
        )
        .bind(&report_id)
        .bind(b.get("name").and_then(Value::as_str))
        .bind(b.get("description").and_then(Value::as_str))
        .bind(&saved_query_id)
        .bind(js::stringify(&formats))
        .bind(&me)
        .bind(&now)
        .execute(db)
        .await
        .map(|_| ())
    };
    if let Err(e) = run.await {
        return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()));
    }
    audit(
        db,
        &me,
        "create",
        "report",
        &report_id,
        json!({ "name": b.get("name"), "source": "nl_builder", "savedQueryId": saved_query_id }),
    )
    .await;
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "success": true, "reportId": report_id, "savedQueryId": saved_query_id }),
    ))
}

/// `nlSaveChart` → `POST /api/nl-builder/save-chart`.
async fn save_chart(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let db = pool(&ctx);
    let me = match admin(db, session.as_ref()).await? {
        Ok(u) => u,
        Err(r) => return Ok(r),
    };
    let b = parse_body(&body).unwrap_or(Value::Null);
    let saved_query_id = uuid::Uuid::new_v4().to_string();
    let chart_id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let config = b
        .get("chartConfig")
        .filter(|c| !c.is_null())
        .cloned()
        .unwrap_or(json!({}));
    let run = async {
        insert_saved_query(db, &saved_query_id, &b, &me, &now).await?;
        sqlx::query(
            "INSERT INTO chart_definitions (id, name, description, saved_query_id, chart_type, chart_config, data_mapping, \
                refresh_interval, color_theme, is_public, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, '{\"xAxis\":{\"field\":\"\"},\"yAxis\":[]}', NULL, NULL, false, false, NULL, NULL, $7, $8, $8)",
        )
        .bind(&chart_id)
        .bind(b.get("name").and_then(Value::as_str))
        .bind(b.get("description").and_then(Value::as_str))
        .bind(&saved_query_id)
        .bind(b.get("chartType").and_then(Value::as_str))
        .bind(js::stringify(&config))
        .bind(&me)
        .bind(&now)
        .execute(db)
        .await
        .map(|_| ())
    };
    if let Err(e) = run.await {
        return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()));
    }
    audit(
        db,
        &me,
        "create",
        "chart",
        &chart_id,
        json!({ "name": b.get("name"), "source": "nl_builder", "chartType": b.get("chartType"), "savedQueryId": saved_query_id }),
    )
    .await;
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "success": true, "chartId": chart_id, "savedQueryId": saved_query_id }),
    ))
}

/// `nlBuilderListDataSources` → `GET /api/nl-builder/data-sources`.
async fn data_sources(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let db = pool(&ctx);
    if let Err(r) = admin(db, session.as_ref()).await? {
        return Ok(r);
    }
    let rows = sqlx::query(
        "SELECT id, name, client_type, description FROM data_sources WHERE is_active = true AND is_deleted = false ORDER BY name",
    )
    .fetch_all(db)
    .await
    .map_err(|e| Error::string(&e.to_string()))?;
    Ok(response::raw(
        StatusCode::OK,
        &json!(crate::common::db::pg_rows_to_json(&rows)),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/nl-builder")
        .add("/preview", post(preview))
        .add("/save-report", post(save_report))
        .add("/save-chart", post(save_chart))
        .add("/data-sources", get(data_sources))
}
