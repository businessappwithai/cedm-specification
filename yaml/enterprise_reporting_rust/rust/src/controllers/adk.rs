//! `POST /api/adk/analyze-intent` — twin of `src/routes/api/adk/analyze-intent.ts`,
//! which runs `runADKPipeline` (`src/lib/adk/pipeline.ts`) in dry-run mode:
//! classify the request, check the caller may execute on the data source,
//! introspect the schema they may see, have the Mastra supervisor (or, if it
//! is unreachable, the NL→SQL tool) draft a monitoring rule, and return it as
//! a preview. Nothing is persisted but the `adk_intents` trace row.
use axum::{body::Bytes, extract::State, http::StatusCode, response::Response, routing::post};
use loco_rs::prelude::*;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};

use super::support::parse_body;
use crate::{
    auth::CurrentSession,
    common::{db::pool, response},
    datasources::{get_connection, DataSourceRow, UserDb},
    nlquery::{agents, schema_store},
    permissions::has_permission,
    security::audit::{log_audit, AuditEntry},
};

fn iso_now_plain() -> String {
    crate::common::time::now_iso()
        .chars()
        .take(19)
        .collect::<String>()
        .replace('T', " ")
}

async fn audit(db: &PgPool, user: &str, action: &str, resource_type: &str, id: Option<&str>, details: Value) {
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(user),
            action,
            resource_type,
            resource_id: id,
            details: Some(details),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
}

async fn update_intent(db: &PgPool, id: &str, status: &str, error: &str) {
    if let Err(e) =
        sqlx::query("UPDATE adk_intents SET pipeline_status = $2, error_message = $3 WHERE id = $1")
            .bind(id)
            .bind(status)
            .bind(error)
            .execute(db)
            .await
    {
        tracing::error!(error = %e, "Failed to update ADK intent");
    }
}

/// `canAccessResource(ctx, "data_source", id, "execute")` for a non-admin.
async fn can_execute(
    db: &PgPool,
    roles: &[String],
    permissions: &[String],
    ds_id: &str,
) -> Result<bool, sqlx::Error> {
    if has_permission(permissions, roles, "data_source", "execute") {
        return Ok(true);
    }
    let role_ids: Vec<String> = sqlx::query_scalar("SELECT id FROM roles WHERE name = ANY($1)")
        .bind(roles)
        .fetch_all(db)
        .await?;
    if role_ids.is_empty() {
        return Ok(false);
    }
    let level: Option<String> = sqlx::query_scalar(
        "SELECT permission_level FROM resource_permissions WHERE resource_type = 'data_source' \
         AND resource_id = $1 AND role_id = ANY($2) LIMIT 1",
    )
    .bind(ds_id)
    .bind(&role_ids)
    .fetch_optional(db)
    .await?;
    let rank = |l: &str| ["view", "edit", "execute", "admin"].iter().position(|x| *x == l);
    Ok(level
        .as_deref()
        .and_then(rank)
        .is_some_and(|g| rank("execute").is_some_and(|r| g >= r)))
}

/// `executeSchemaIntrospect`: the tables (and, where restricted, columns) the
/// user may see, as compact `table(col:type, …)` lines.
async fn introspect(
    db: &PgPool,
    ds_id: &str,
    user_id: &str,
) -> Result<(Value, Vec<String>, String, String), String> {
    let ds: Option<DataSourceRow> = sqlx::query_as(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1 AND is_active = true",
    )
    .bind(ds_id)
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())?;
    let Some(ds) = ds else {
        return Err(format!("Data source {ds_id} not found or inactive"));
    };
    let entities = crate::reportgen::rbac::accessible_entities(db, user_id, ds_id).await?;
    let allowed: Vec<String> = entities.iter().map(|(n, _, _)| n.clone()).collect();
    let UserDb::Pg(user) = get_connection(&ds).await.map_err(|e| e.to_string())? else {
        return Err("PostgreSQL data sources only".into());
    };
    let ctx = schema_store::get_schema_context(db, ds_id, &user).await?;
    let empty = Vec::new();
    let mut tables = Vec::new();
    for t in ctx
        .schema_info
        .get("tables")
        .and_then(Value::as_array)
        .unwrap_or(&empty)
    {
        let name = t.get("name").and_then(Value::as_str).unwrap_or_default();
        if !allowed.is_empty() && !allowed.iter().any(|a| a == name) {
            continue;
        }
        let mut cols: Vec<Value> = t
            .get("columns")
            .and_then(Value::as_array)
            .unwrap_or(&empty)
            .iter()
            .map(|c| {
                let mut o = serde_json::Map::new();
                o.insert("name".into(), c.get("name").cloned().unwrap_or(Value::Null));
                o.insert("type".into(), c.get("type").cloned().unwrap_or(Value::Null));
                if let Some(n) = c.get("nullable") {
                    o.insert("nullable".into(), n.clone());
                }
                Value::Object(o)
            })
            .collect();
        if let Some((_, Some(restrictions), _)) = entities.iter().find(|(n, _, _)| n == name) {
            if let Ok(list) = serde_json::from_str::<Vec<String>>(restrictions) {
                if !list.is_empty() {
                    cols.retain(|c| {
                        c.get("name")
                            .and_then(Value::as_str)
                            .is_some_and(|n| list.iter().any(|l| l == n))
                    });
                }
            }
        }
        let mut o = serde_json::Map::new();
        o.insert("name".into(), json!(name));
        if let Some(s) = t.get("schema") {
            o.insert("schema".into(), s.clone());
        }
        o.insert("columns".into(), Value::Array(cols));
        tables.push(Value::Object(o));
    }
    let text = tables
        .iter()
        .map(|t| {
            let cols = t["columns"]
                .as_array()
                .unwrap_or(&empty)
                .iter()
                .map(|c| {
                    format!(
                        "{}:{}",
                        c["name"].as_str().unwrap_or_default(),
                        c["type"].as_str().unwrap_or_default()
                    )
                })
                .collect::<Vec<_>>()
                .join(", ");
            format!("{}({cols})", t["name"].as_str().unwrap_or_default())
        })
        .collect::<Vec<_>>()
        .join("\n");
    Ok((Value::Array(tables), allowed, text, ds.client_type))
}

/// The dry-run pipeline. `(status, body)`.
#[allow(clippy::too_many_lines)]
async fn pipeline(db: &PgPool, nl: &str, user_id: &str, ds_id: &str, session_id: Option<&str>) -> Value {
    let start = std::time::Instant::now();
    let mut intent_id: Option<String> = None;
    let run = async {
        let (intent, classification_ms) = agents::classify_intent(nl, user_id, Some(ds_id)).await;
        audit(
            db,
            user_id,
            "adk:intent_classified",
            "adk_intent",
            None,
            json!({ "intentType": intent["intentType"], "confidence": intent["confidence"] }),
        )
        .await;
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO adk_intents (id, user_id, session_id, raw_nl_request, request_source, intent_type, confidence, \
                adk_intent_json, pipeline_status, report_definition_id, monitoring_rule_id, error_message, \
                classification_ms, total_pipeline_ms, created_at) \
             VALUES ($1, $2, $3, $4, 'text', $5, $6::numeric, $7, 'pending', NULL, NULL, NULL, $8, NULL, $9::timestamp)",
        )
        .bind(&id)
        .bind(user_id)
        .bind(session_id)
        .bind(nl)
        .bind(intent["intentType"].as_str().unwrap_or("ambiguous"))
        .bind(crate::common::js::stringify(&intent["confidence"]))
        .bind(crate::common::js::stringify(&intent))
        .bind(i32::try_from(classification_ms).unwrap_or(i32::MAX))
        .bind(iso_now_plain())
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;
        intent_id = Some(id.clone());

        let confidence = intent["confidence"].as_f64().unwrap_or(0.0);
        if confidence < 0.5 || intent["intentType"] == "ambiguous" {
            update_intent(db, &id, "partial", "Low confidence — clarification required").await;
            return Ok::<Value, String>(json!({
                "success": false,
                "intentId": id,
                "adkIntent": intent,
                "clarificationNeeded": true,
                "clarificationPrompt": "I need a bit more detail. Please specify: what metric to track, the threshold condition (e.g. 'if revenue drops below $50,000'), and when to run (e.g. 'every Monday').",
            }));
        }

        let role_rows = sqlx::query(
            "SELECT roles.name, roles.permissions FROM user_roles INNER JOIN roles ON roles.id = user_roles.role_id \
             WHERE user_roles.user_id = $1",
        )
        .bind(user_id)
        .fetch_all(db)
        .await
        .map_err(|e| e.to_string())?;
        let roles: Vec<String> = role_rows.iter().map(|r| r.get("name")).collect();
        let permissions: Vec<String> = role_rows
            .iter()
            .flat_map(|r| {
                serde_json::from_str::<Vec<String>>(&r.get::<String, _>("permissions")).unwrap_or_default()
            })
            .collect();
        let admin = roles.iter().any(|r| r.to_lowercase() == "admin");
        if !admin
            && !can_execute(db, &roles, &permissions, ds_id)
                .await
                .map_err(|e| e.to_string())?
        {
            update_intent(
                db,
                &id,
                "failed",
                "RBAC: User does not have execute permission on the selected data source",
            )
            .await;
            return Ok(json!({
                "success": false,
                "intentId": id,
                "adkIntent": intent,
                "error": "You do not have execute permission on the selected data source.",
            }));
        }

        let snapshot = crate::reportgen::rbac::resolve_context(db, user_id).await?;
        let (tables, allowed, schema_text, ds_type) = introspect(db, ds_id, user_id).await?;
        audit(
            db,
            user_id,
            "adk:schema_introspected",
            "data_source",
            Some(ds_id),
            json!({ "tableCount": tables.as_array().map_or(0, Vec::len) }),
        )
        .await;
        let units: Vec<u16> = schema_text.encode_utf16().collect();
        let truncated = if units.len() > 4000 {
            format!(
                "{}\n... (schema truncated for LLM context)",
                String::from_utf16_lossy(&units[..4000])
            )
        } else {
            schema_text
        };

        let supervisor = match agents::mastra_supervisor(&json!({
            "nlRequest": nl,
            "userId": user_id,
            "dataSourceId": ds_id,
            "dataSourceType": ds_type,
            "schemaText": truncated,
            "allowedTableNames": allowed,
            "rbacSnapshot": snapshot,
            "sessionId": session_id,
        }))
        .await
        {
            Ok(v) => v,
            Err(e) => {
                tracing::warn!(error = %e, "[ADK] Mastra supervisor unreachable, falling back to direct SQL generation");
                let sql = agents::sql_generate(nl, &truncated, &ds_type).await?;
                let pick = |k: &str, d: Value| intent.get(k).cloned().unwrap_or(d);
                json!({
                    "success": sql["sql"].as_str().is_some_and(|s| !s.is_empty()),
                    "intent": {
                        "intent_type": intent["intentType"],
                        "confidence": intent["confidence"],
                        "metric": pick("metric", json!("value")),
                        "schedule_cron": pick("scheduleCron", json!("0 8 * * 1")),
                        "threshold_operator": pick("thresholdOperator", json!("lt")),
                        "threshold_value": pick("thresholdValue", json!(0)),
                        "alert_channels": pick("alertChannels", json!(["email", "in_app"])),
                    },
                    "reportDefinition": {
                        "sql": sql["sql"],
                        "metric_column": pick("metric", json!("value")),
                        "explanation": sql["explanation"],
                        "confidence": sql["confidence"],
                        "warnings": sql["warnings"],
                    },
                    "monitoringRule": {
                        "name": format!("Monitor: {}", intent.get("metric").and_then(Value::as_str).unwrap_or("metric")),
                        "description": intent["rawRequest"],
                        "threshold_operator": pick("thresholdOperator", json!("lt")),
                        "threshold_value": pick("thresholdValue", json!(0)),
                        "escalation_threshold_pct": 20,
                        "alert_channels": pick("alertChannels", json!(["email", "in_app"])),
                        "notify_on_pass": false,
                        "notify_on_no_data": true,
                    },
                    "schedule": {
                        "cron_expression": pick("scheduleCron", json!("0 8 * * 1")),
                        "timezone": "UTC",
                        "description": pick("scheduleNatural", json!("Every Monday")),
                    },
                })
            }
        };

        if supervisor.get("clarificationNeeded").and_then(Value::as_bool) == Some(true) {
            update_intent(db, &id, "partial", "Supervisor requested clarification").await;
            let mut out =
                json!({ "success": false, "intentId": id, "adkIntent": intent, "clarificationNeeded": true });
            if let Some(p) = supervisor.get("clarificationPrompt") {
                out["clarificationPrompt"] = p.clone();
            }
            return Ok(out);
        }
        let sql = supervisor
            .pointer("/reportDefinition/sql")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if supervisor.get("success") != Some(&json!(true)) || sql.is_empty() {
            let error = supervisor.get("error").and_then(Value::as_str);
            update_intent(db, &id, "partial", error.unwrap_or("SQL generation failed")).await;
            return Ok(json!({
                "success": false,
                "intentId": id,
                "adkIntent": intent,
                "error": error.unwrap_or("Could not generate valid SQL for the requested metric."),
            }));
        }
        audit(
            db,
            user_id,
            "adk:sql_generated",
            "adk_intent",
            Some(&id),
            json!({ "metricColumn": supervisor.pointer("/reportDefinition/metric_column") }),
        )
        .await;
        let rule = &supervisor["monitoringRule"];
        let schedule = &supervisor["schedule"];
        let preview = json!({
            "name": rule["name"],
            "description": rule["description"],
            "sql": sql,
            "metricColumn": supervisor.pointer("/reportDefinition/metric_column"),
            "thresholdOperator": rule["threshold_operator"],
            "thresholdValue": rule["threshold_value"],
            "escalationThresholdPct": rule["escalation_threshold_pct"],
            "cronExpression": schedule["cron_expression"],
            "timezone": schedule["timezone"],
            "scheduleDescription": schedule["description"],
            "alertChannels": rule["alert_channels"],
            "notifyOnPass": rule["notify_on_pass"],
            "notifyOnNoData": rule["notify_on_no_data"],
        });
        update_intent(db, &id, "partial", "dry-run: awaiting user confirmation").await;
        Ok(json!({ "success": true, "intentId": id, "adkIntent": intent, "preview": preview }))
    };
    match run.await {
        Ok(v) => v,
        Err(e) => {
            if let Some(id) = &intent_id {
                let ms = i32::try_from(start.elapsed().as_millis()).unwrap_or(i32::MAX);
                if let Err(err) = sqlx::query(
                    "UPDATE adk_intents SET pipeline_status = 'failed', error_message = $2, total_pipeline_ms = $3 WHERE id = $1",
                )
                .bind(id)
                .bind(&e)
                .bind(ms)
                .execute(db)
                .await
                {
                    tracing::error!(error = %err, "Failed to update ADK intent");
                }
            }
            audit(
                db,
                user_id,
                "adk:pipeline_failed",
                "adk_intent",
                intent_id.as_deref(),
                json!({ "error": e }),
            )
            .await;
            let mut out = json!({ "success": false });
            if let Some(id) = intent_id {
                out["intentId"] = json!(id);
            }
            out["error"] = json!(e);
            out
        }
    }
}

async fn analyze_intent(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::raw(
            StatusCode::UNAUTHORIZED,
            &json!({ "error": "Unauthorized" }),
        ));
    };
    let Some(b) = parse_body(&body) else {
        return Ok(response::raw(
            StatusCode::INTERNAL_SERVER_ERROR,
            &json!({ "success": false, "error": "Unexpected end of JSON input" }),
        ));
    };
    let nl = b
        .get("nlRequest")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or_default();
    if nl.is_empty() {
        return Ok(response::raw(
            StatusCode::BAD_REQUEST,
            &json!({ "error": "nlRequest is required and must be non-empty" }),
        ));
    }
    let Some(ds_id) = b
        .get("dataSourceId")
        .filter(|v| crate::common::js::truthy(Some(v)))
        .and_then(crate::common::js::text)
    else {
        return Ok(response::raw(
            StatusCode::BAD_REQUEST,
            &json!({ "error": "dataSourceId is required" }),
        ));
    };
    let db = pool(&ctx);
    audit(
        db,
        &session.user.id,
        "adk:intent_received",
        "adk_intent",
        None,
        json!({ "dataSourceId": ds_id, "requestLength": b["nlRequest"].as_str().map_or(0, |s| s.encode_utf16().count()) }),
    )
    .await;
    let session_id = b.get("sessionId").and_then(Value::as_str);
    let result = pipeline(db, nl, &session.user.id, &ds_id, session_id).await;
    let status =
        if result["success"] == json!(true) || result.get("clarificationNeeded") == Some(&json!(true)) {
            StatusCode::OK
        } else {
            StatusCode::UNPROCESSABLE_ENTITY
        };
    Ok(response::raw(status, &result))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/adk")
        .add("/analyze-intent", post(analyze_intent))
}
