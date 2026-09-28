//! `/api/monitoring/rules` — twin of `src/routes/api/monitoring/rules.ts`,
//! `rules.$id.ts` and `rules.$id.executions.ts`.
//!
//! Scheduling is the Rust scheduler's (`cron_tick` polls the rules every
//! minute), so nothing here calls Trigger.dev: `trigger_schedule_id` stays
//! null, as it does in a Node installation without Trigger.dev.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::get,
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Value};

use super::support::{is_admin_by_role_name, parse_body};
use crate::{
    auth::{CurrentSession, Session},
    common::{
        db::{pg_row_to_json, pg_rows_to_json, pool},
        js,
        pagination::js_parse_int,
        response,
    },
    monitoring::js::number,
    reportgen::rbac::resolve_context,
    security::audit::{log_audit, AuditEntry},
    workers::monitoring_evaluate::{execute_monitoring_evaluation, MonitoringEvaluatePayload},
};

#[derive(Debug, Deserialize)]
struct RulesQuery {
    page: Option<String>,
    #[serde(rename = "pageSize")]
    page_size: Option<String>,
    status: Option<String>,
}

const COLUMNS: &str = "monitoring_rules.id, monitoring_rules.name, monitoring_rules.description, \
    monitoring_rules.data_source_id, data_sources.name AS data_source_name, monitoring_rules.metric_column, \
    monitoring_rules.threshold_operator, monitoring_rules.threshold_value, monitoring_rules.threshold_upper_bound, \
    monitoring_rules.escalation_threshold_pct, monitoring_rules.cron_expression, monitoring_rules.timezone, \
    monitoring_rules.alert_channels, monitoring_rules.alert_recipients, monitoring_rules.webhook_url, \
    monitoring_rules.notify_on_pass, monitoring_rules.notify_on_no_data, monitoring_rules.is_active, \
    monitoring_rules.is_paused, monitoring_rules.pause_reason, monitoring_rules.trigger_schedule_id, \
    monitoring_rules.last_executed_at, monitoring_rules.last_execution_status, monitoring_rules.last_metric_value, \
    monitoring_rules.consecutive_breaches, monitoring_rules.total_executions, monitoring_rules.total_alerts_sent, \
    monitoring_rules.created_by, monitoring_rules.created_at, monitoring_rules.updated_at";

fn parse_json_column(raw: Option<&Value>, fallback: Value) -> Value {
    match raw {
        None | Some(Value::Null) => fallback,
        Some(Value::String(s)) => serde_json::from_str(s).unwrap_or(fallback),
        Some(other) => other.clone(),
    }
}

fn js_bool(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

fn num(v: f64) -> Value {
    serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number)
}

/// `deserializeRule` as `rules.ts` has it (with `status`, `schedule_cron`
/// and `last_run_at`).
fn deserialize_rule(row: Value) -> Value {
    deserialize(row, true)
}

/// `deserializeRule`: the row spread, then the overrides in Node's order.
/// `rules.$id.ts` has its own, without the three listing extras.
fn deserialize(mut row: Value, listing: bool) -> Value {
    let Some(o) = row.as_object_mut() else { return row };
    let is_active = js_bool(o.get("is_active"));
    let is_paused = js_bool(o.get("is_paused"));
    let status = if is_paused {
        "paused"
    } else if is_active {
        "active"
    } else {
        "error"
    };
    let alert_channels = parse_json_column(o.get("alert_channels"), json!([]));
    let alert_recipients = parse_json_column(o.get("alert_recipients"), json!([]));
    let rbac_snapshot = parse_json_column(o.get("rbac_snapshot"), json!({}));
    let notify_on_pass = js_bool(o.get("notify_on_pass"));
    let notify_on_no_data = js_bool(o.get("notify_on_no_data"));
    let schedule_cron = o.get("cron_expression").cloned().unwrap_or(Value::Null);
    let last_run_at = o.get("last_executed_at").cloned().unwrap_or(Value::Null);
    let threshold_value = num(number(o.get("threshold_value").unwrap_or(&Value::Null)));
    let upper = o
        .get("threshold_upper_bound")
        .filter(|v| !v.is_null())
        .map(|v| num(number(v)));
    let esc = num(match o.get("escalation_threshold_pct") {
        None | Some(Value::Null) => 20.0,
        Some(v) => number(v),
    });

    o.insert("alert_channels".into(), alert_channels);
    o.insert("alert_recipients".into(), alert_recipients);
    o.insert("rbac_snapshot".into(), rbac_snapshot);
    o.insert("notify_on_pass".into(), json!(notify_on_pass));
    o.insert("notify_on_no_data".into(), json!(notify_on_no_data));
    o.insert("is_active".into(), json!(is_active));
    o.insert("is_paused".into(), json!(is_paused));
    if listing {
        o.insert("status".into(), json!(status));
        o.insert("schedule_cron".into(), schedule_cron);
        o.insert("last_run_at".into(), last_run_at);
    }
    o.insert("threshold_value".into(), threshold_value);
    // `undefined` drops the key from JSON.stringify.
    match upper {
        Some(u) => {
            o.insert("threshold_upper_bound".into(), u);
        }
        None => {
            o.shift_remove("threshold_upper_bound");
        }
    }
    o.insert("escalation_threshold_pct".into(), esc);
    row
}

async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<RulesQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::raw(
            StatusCode::UNAUTHORIZED,
            &json!({ "error": "Unauthorized" }),
        ));
    };
    let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
    let page_size = q
        .page_size
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(20)
        .clamp(1, 100);
    let status = q.status.as_deref().unwrap_or("active");
    let is_admin = is_admin_by_role_name(&session.user.roles);
    let db = pool(&ctx);

    let mut conditions: Vec<&str> = Vec::new();
    if !is_admin {
        conditions.push("monitoring_rules.created_by = $3");
    }
    match status {
        "active" => {
            conditions.push("monitoring_rules.is_active = true AND monitoring_rules.is_paused = false")
        }
        "paused" => conditions.push("monitoring_rules.is_paused = true"),
        _ => {}
    }
    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", conditions.join(" AND "))
    };
    let sql = format!(
        "SELECT {COLUMNS} FROM monitoring_rules LEFT JOIN data_sources ON data_sources.id = monitoring_rules.data_source_id\
         {where_clause} ORDER BY monitoring_rules.created_at DESC LIMIT $1 OFFSET $2"
    );

    let result = async {
        // Node parity: the total counts every rule, unfiltered (§9).
        let total: i64 = sqlx::query_scalar("SELECT COUNT(monitoring_rules.id) FROM monitoring_rules")
            .fetch_one(db)
            .await?;
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(page_size)
            .bind(page * page_size);
        if !is_admin {
            query = query.bind(&session.user.id);
        }
        let rows = query.fetch_all(db).await?;
        Ok::<_, sqlx::Error>((total, rows))
    }
    .await;

    match result {
        Ok((total, rows)) => {
            let rules: Vec<Value> = pg_rows_to_json(&rows).into_iter().map(deserialize_rule).collect();
            Ok(response::raw(
                StatusCode::OK,
                &json!({ "rules": rules, "total": total, "page": page, "pageSize": page_size }),
            ))
        }
        Err(e) => Ok(response::raw(
            StatusCode::INTERNAL_SERVER_ERROR,
            &json!({ "error": e.to_string() }),
        )),
    }
}

fn error(status: StatusCode, message: &str) -> Response {
    response::raw(status, &json!({ "error": message }))
}

fn unauthorized() -> Response {
    error(StatusCode::UNAUTHORIZED, "Unauthorized")
}

fn db_error(e: &sqlx::Error) -> Response {
    error(
        StatusCode::INTERNAL_SERVER_ERROR,
        &crate::datasources::db_error_message(e),
    )
}

/// `new Date().toISOString().slice(0, 19).replace("T", " ")`.
fn ts_now() -> String {
    chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

async fn audit(
    db: &sqlx::PgPool,
    user: &str,
    action: &str,
    id: &str,
    details: Option<Value>,
) -> Result<(), sqlx::Error> {
    log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type: "monitoring_rule",
            resource_id: Some(id),
            details,
            ..Default::default()
        },
    )
    .await
}

/// `body[k] === undefined || null || ""`.
fn missing(v: Option<&Value>) -> bool {
    matches!(v, None | Some(Value::Null)) || v.and_then(Value::as_str) == Some("")
}

/// `POST /api/monitoring/rules`.
#[allow(clippy::too_many_lines)]
async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let Some(b) = parse_body(&body) else {
        return Ok(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to create monitoring rule",
        ));
    };
    for field in [
        "name",
        "dataSourceId",
        "metricColumn",
        "thresholdOperator",
        "thresholdValue",
        "cronExpression",
        "alertChannels",
    ] {
        if missing(b.get(field)) {
            return Ok(error(
                StatusCode::BAD_REQUEST,
                &format!("Missing required field: {field}"),
            ));
        }
    }
    let db = pool(&ctx);
    let user = session.user.id.clone();
    let snapshot = match resolve_context(db, &user).await {
        Ok(s) => s,
        Err(e) => return Ok(error(StatusCode::INTERNAL_SERVER_ERROR, &e)),
    };
    let text = |k: &str| b.get(k).and_then(js::text);
    let now = ts_now();
    let id = uuid::Uuid::new_v4().to_string();
    let result = async {
        let mut report_id = text("reportDefinitionId").filter(|s| !s.is_empty());
        if report_id.is_none() && js::truthy(b.get("sql")) {
            let query_id = uuid::Uuid::new_v4().to_string();
            let rid = uuid::Uuid::new_v4().to_string();
            let name = format!("[Monitor] {}", text("name").unwrap_or_default());
            sqlx::query(
                "INSERT INTO saved_queries (id, name, description, data_source_id, sql_content, is_validated, created_by, created_at, updated_at) \
                 VALUES ($1, $2, 'Auto-generated monitoring query', $3, $4, true, $5, $6, $6)",
            )
            .bind(&query_id)
            .bind(&name)
            .bind(text("dataSourceId"))
            .bind(text("sql"))
            .bind(&user)
            .bind(&now)
            .execute(db)
            .await?;
            sqlx::query(
                "INSERT INTO report_definitions (id, name, description, saved_query_id, column_config, pagination_config, export_formats, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, '[]', '{\"pageSize\":10000}', '[\"csv\"]', $5, $6, $6)",
            )
            .bind(&rid)
            .bind(&name)
            .bind(b.get("description").and_then(js::text))
            .bind(&query_id)
            .bind(&user)
            .bind(&now)
            .execute(db)
            .await?;
            report_id = Some(rid);
        }
        let Some(report_id) = report_id else {
            return Ok(None);
        };
        let recipients = match b.get("alertRecipients") {
            None | Some(Value::Null) => json!([{ "type": "user", "id": user }]),
            Some(v) => v.clone(),
        };
        let or_null = |k: &str| b.get(k).filter(|v| !v.is_null()).and_then(js::text);
        sqlx::query(
            "INSERT INTO monitoring_rules (id, name, description, report_definition_id, data_source_id, created_by, metric_column, \
               threshold_operator, threshold_value, threshold_upper_bound, escalation_threshold_pct, cron_expression, timezone, \
               alert_channels, alert_recipients, webhook_url, notify_on_pass, notify_on_no_data, rbac_snapshot, rbac_snapshot_version, \
               is_active, is_paused, original_nl_request, adk_intent_id, consecutive_breaches, total_executions, total_alerts_sent, \
               created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CAST($9 AS DECIMAL), CAST($10 AS DECIMAL), CAST($11 AS DECIMAL), $12, $13, \
               $14, $15, $16, $17, $18, $19, 1, true, false, $20, $21, 0, 0, 0, CAST($22 AS TIMESTAMP), CAST($22 AS TIMESTAMP))",
        )
        .bind(&id)
        .bind(text("name"))
        .bind(or_null("description"))
        .bind(&report_id)
        .bind(text("dataSourceId"))
        .bind(&user)
        .bind(text("metricColumn"))
        .bind(text("thresholdOperator"))
        .bind(text("thresholdValue"))
        .bind(or_null("thresholdUpperBound"))
        .bind(or_null("escalationThresholdPct").unwrap_or_else(|| "20".into()))
        .bind(text("cronExpression"))
        .bind(or_null("timezone").unwrap_or_else(|| "UTC".into()))
        .bind(js::stringify(&b["alertChannels"]))
        .bind(js::stringify(&recipients))
        .bind(or_null("webhookUrl"))
        .bind(js::truthy(b.get("notifyOnPass")))
        .bind(b.get("notifyOnNoData") != Some(&Value::Bool(false)))
        .bind(js::stringify(&snapshot))
        .bind(or_null("originalNlRequest"))
        .bind(or_null("adkIntentId"))
        .bind(&now)
        .execute(db)
        .await?;
        let row = sqlx::query("SELECT * FROM monitoring_rules WHERE id = $1").bind(&id).fetch_one(db).await?;
        audit(
            db,
            &user,
            "monitoring:rule_created",
            &id,
            Some(json!({ "name": b.get("name"), "dataSourceId": b.get("dataSourceId") })),
        )
        .await?;
        Ok::<_, sqlx::Error>(Some(pg_row_to_json(&row)))
    }
    .await;
    Ok(match result {
        Ok(Some(rule)) => response::raw(StatusCode::CREATED, &json!({ "rule": deserialize_rule(rule) })),
        Ok(None) => error(
            StatusCode::BAD_REQUEST,
            "Either reportDefinitionId or sql must be provided",
        ),
        Err(e) => db_error(&e),
    })
}

/// The rule, after the owner-or-admin check every `rules/{id}` route makes.
async fn owned_rule(db: &sqlx::PgPool, session: &Session, id: &str) -> std::result::Result<Value, Response> {
    let row = sqlx::query("SELECT * FROM monitoring_rules WHERE id = $1")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| db_error(&e))?
        .ok_or_else(|| error(StatusCode::NOT_FOUND, "Not found"))?;
    let rule = pg_row_to_json(&row);
    let owner = rule.get("created_by").and_then(Value::as_str) == Some(session.user.id.as_str());
    if owner || is_admin_by_role_name(&session.user.roles) {
        Ok(rule)
    } else {
        Err(error(StatusCode::FORBIDDEN, "Forbidden"))
    }
}

async fn reread(db: &sqlx::PgPool, id: &str) -> std::result::Result<Value, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM monitoring_rules WHERE id = $1")
        .bind(id)
        .fetch_one(db)
        .await?;
    Ok(deserialize(pg_row_to_json(&row), false))
}

/// `GET /api/monitoring/rules/{id}`.
async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    Ok(match owned_rule(pool(&ctx), &session, &id).await {
        Ok(rule) => response::raw(StatusCode::OK, &json!({ "rule": deserialize(rule, false) })),
        Err(r) => r,
    })
}

/// `PUT /api/monitoring/rules/{id}`.
async fn update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    if let Err(r) = owned_rule(db, &session, &id).await {
        return Ok(r);
    }
    let Some(b) = parse_body(&body) else {
        return Ok(error(StatusCode::INTERNAL_SERVER_ERROR, "Error"));
    };
    // (column, body key, SQL type) in Node's order.
    let fields: [(&str, &str, &str); 12] = [
        ("name", "name", "TEXT"),
        ("description", "description", "TEXT"),
        ("metric_column", "metricColumn", "TEXT"),
        ("threshold_operator", "thresholdOperator", "TEXT"),
        ("threshold_value", "thresholdValue", "DECIMAL"),
        ("threshold_upper_bound", "thresholdUpperBound", "DECIMAL"),
        ("escalation_threshold_pct", "escalationThresholdPct", "DECIMAL"),
        ("alert_channels", "alertChannels", "JSON"),
        ("alert_recipients", "alertRecipients", "JSON"),
        ("webhook_url", "webhookUrl", "TEXT"),
        ("notify_on_pass", "notifyOnPass", "BOOL"),
        ("notify_on_no_data", "notifyOnNoData", "BOOL"),
    ];
    let mut sql = String::from("UPDATE monitoring_rules SET updated_at = CAST($2 AS TIMESTAMP)");
    let mut values: Vec<Option<String>> = Vec::new();
    let mut updated_fields = vec!["updated_at"];
    for (col, key, ty) in fields {
        let Some(v) = b.get(key) else { continue };
        updated_fields.push(col);
        let n = values.len() + 3;
        let (expr, val) = match ty {
            "DECIMAL" => (format!("CAST(${n} AS DECIMAL)"), js::text(v)),
            "JSON" => (format!("${n}"), Some(js::stringify(v))),
            "BOOL" => (
                format!("CAST(${n} AS BOOLEAN)"),
                Some(js::truthy(Some(v)).to_string()),
            ),
            _ => (format!("${n}"), js::text(v)),
        };
        sql.push_str(&format!(", {col} = {expr}"));
        values.push(val);
    }
    sql.push_str(" WHERE id = $1");
    let run = async {
        let mut q = sqlx::query(sqlx::AssertSqlSafe(sql)).bind(&id).bind(ts_now());
        for v in &values {
            q = q.bind(v.clone());
        }
        q.execute(db).await?;
        let rule = reread(db, &id).await?;
        audit(
            db,
            &session.user.id,
            "monitoring:rule_updated",
            &id,
            Some(json!({ "updatedFields": updated_fields })),
        )
        .await?;
        Ok::<_, sqlx::Error>(rule)
    };
    Ok(match run.await {
        Ok(rule) => response::raw(StatusCode::OK, &json!({ "rule": rule })),
        Err(e) => db_error(&e),
    })
}

/// `DELETE /api/monitoring/rules/{id}`.
async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    let rule = match owned_rule(db, &session, &id).await {
        Ok(r) => r,
        Err(r) => return Ok(r),
    };
    let run = async {
        sqlx::query("DELETE FROM monitoring_rules WHERE id = $1")
            .bind(&id)
            .execute(db)
            .await?;
        audit(
            db,
            &session.user.id,
            "monitoring:rule_deleted",
            &id,
            Some(json!({ "name": rule.get("name") })),
        )
        .await
    };
    Ok(match run.await {
        Ok(()) => response::raw(StatusCode::OK, &json!({ "success": true })),
        Err(e) => db_error(&e),
    })
}

#[derive(Debug, Deserialize)]
struct ActionQuery {
    action: Option<String>,
}

/// `PATCH /api/monitoring/rules/{id}?action=pause|resume|run`.
async fn act(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<ActionQuery>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    if let Err(r) = owned_rule(db, &session, &id).await {
        return Ok(r);
    }
    let user = session.user.id.clone();
    let run = async {
        match q.action.as_deref() {
            Some("pause") => {
                let reason = parse_body(&body)
                    .and_then(|b| b.get("reason").filter(|v| !v.is_null()).and_then(js::text));
                sqlx::query("UPDATE monitoring_rules SET is_paused = true, pause_reason = $2, updated_at = CAST($3 AS TIMESTAMP) WHERE id = $1")
                    .bind(&id)
                    .bind(reason)
                    .bind(ts_now())
                    .execute(db)
                    .await?;
                audit(db, &user, "monitoring:rule_paused", &id, None).await?;
            }
            Some("resume") => {
                sqlx::query("UPDATE monitoring_rules SET is_paused = false, pause_reason = NULL, updated_at = CAST($2 AS TIMESTAMP) WHERE id = $1")
                    .bind(&id)
                    .bind(ts_now())
                    .execute(db)
                    .await?;
                audit(db, &user, "monitoring:rule_resumed", &id, None).await?;
            }
            Some("run") => {
                let payload = MonitoringEvaluatePayload {
                    rule_id: id.clone(),
                    triggered_by: Some("manual".into()),
                };
                let result = match execute_monitoring_evaluation(&ctx, &payload).await {
                    Ok(r) => serde_json::to_value(&r).unwrap_or(Value::Null),
                    Err(e) => return Ok(Err(e)),
                };
                audit(
                    db,
                    &user,
                    "monitoring:rule_updated",
                    &id,
                    Some(json!({ "operation": "manual_run", "status": result.get("status") })),
                )
                .await?;
                let rule = reread(db, &id).await?;
                return Ok(Ok(json!({ "result": result, "rule": rule })));
            }
            _ => return Ok(Err(String::new())),
        }
        Ok::<_, sqlx::Error>(Ok(json!({ "rule": reread(db, &id).await? })))
    };
    Ok(match run.await {
        Ok(Ok(body)) => response::raw(StatusCode::OK, &body),
        Ok(Err(e)) if e.is_empty() => error(
            StatusCode::BAD_REQUEST,
            "Invalid action. Use ?action=pause, ?action=resume, or ?action=run",
        ),
        Ok(Err(e)) => error(StatusCode::INTERNAL_SERVER_ERROR, &e),
        Err(e) => db_error(&e),
    })
}

/// `GET /api/monitoring/rules/{id}/executions`.
async fn executions(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    Query(q): Query<RulesQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let db = pool(&ctx);
    if let Err(r) = owned_rule(db, &session, &id).await {
        return Ok(r);
    }
    let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
    let page_size = q
        .page_size
        .as_deref()
        .and_then(js_parse_int)
        .unwrap_or(20)
        .clamp(1, 100);
    let run = async {
        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(id) FROM monitoring_executions WHERE monitoring_rule_id = $1")
                .bind(&id)
                .fetch_one(db)
                .await?;
        let rows = sqlx::query(
            "SELECT * FROM monitoring_executions WHERE monitoring_rule_id = $1 ORDER BY executed_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(&id)
        .bind(page_size)
        .bind(page * page_size)
        .fetch_all(db)
        .await?;
        Ok::<_, sqlx::Error>((total, pg_rows_to_json(&rows)))
    };
    let (total, rows) = match run.await {
        Ok(r) => r,
        Err(e) => return Ok(db_error(&e)),
    };
    let executions: Vec<Value> = rows
        .into_iter()
        .map(|mut e| {
            if let Some(o) = e.as_object_mut() {
                let arr = parse_json_column(o.get("alert_channels_used"), json!([]));
                o.insert("alert_channels_used".into(), arr);
                let arr = parse_json_column(o.get("alert_recipients_sent"), json!([]));
                o.insert("alert_recipients_sent".into(), arr);
                let d = js_bool(o.get("alert_dispatched"));
                o.insert("alert_dispatched".into(), json!(d));
                for k in ["metric_value", "previous_metric_value", "delta_pct"] {
                    let v = match o.get(k) {
                        None | Some(Value::Null) => Value::Null,
                        Some(v) => num(number(v)),
                    };
                    o.insert(k.into(), v);
                }
            }
            e
        })
        .collect();
    Ok(response::raw(
        StatusCode::OK,
        &json!({ "executions": executions, "total": total, "page": page, "pageSize": page_size }),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/monitoring")
        .add("/rules", get(list).post(create))
        .add("/rules/{id}", get(show).put(update).delete(destroy).patch(act))
        .add("/rules/{id}/executions", get(executions))
}
