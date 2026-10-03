//! `monitoring:evaluate` — `executeMonitoringEvaluation` from
//! `src/lib/jobs/workers/monitoring-worker.ts`.
//!
//! One deliberate difference (MIGRATION_PLAN.md §9, D-2): the report's stored
//! SQL is gated on `decideQueryRun` for the rule's owner before it runs. The
//! Node worker checked only data-source-level `resource_permissions`, so a
//! rule could read tables its owner's `ds_entity_permissions` deny.
use chrono::{NaiveDateTime, Timelike, Utc};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use sqlx::PgPool;

use crate::{
    common::db::{pg_row_to_json, pool},
    datasources::{get_connection, DataSourceRow},
    monitoring::{
        alerts::{create_notification, dispatch_alerts, AlertRecipient, AlertRule},
        evaluate::{evaluate_threshold, Status, ThresholdRule},
        js::number,
    },
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    security::audit::{log_audit, AuditEntry},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitoringEvaluatePayload {
    pub rule_id: String,
    #[serde(default)]
    pub triggered_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationOutcome {
    pub status: String,
    pub metric_value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// `isoNow()` in this worker: `YYYY-MM-DD HH:MM:SS` for TIMESTAMP columns.
fn now_ts() -> NaiveDateTime {
    Utc::now()
        .naive_utc()
        .with_nanosecond(0)
        .unwrap_or_else(|| Utc::now().naive_utc())
}

#[derive(Debug, Clone)]
struct Rule {
    id: String,
    name: String,
    report_definition_id: String,
    data_source_id: String,
    created_by: String,
    threshold: ThresholdRule,
    alerts: AlertRule,
    notify_on_pass: bool,
    notify_on_no_data: bool,
    is_active: bool,
    is_paused: bool,
    consecutive_breaches: i64,
    total_executions: i64,
    total_alerts_sent: i64,
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

fn str_of(o: &Map<String, Value>, k: &str) -> String {
    o.get(k).and_then(Value::as_str).unwrap_or_default().to_string()
}

fn json_col<T: for<'de> Deserialize<'de>>(o: &Map<String, Value>, k: &str) -> Option<T> {
    o.get(k)
        .and_then(Value::as_str)
        .and_then(|s| serde_json::from_str(s).ok())
}

/// `loadMonitoringRule`: the row with DECIMALs through `Number()` and the JSON
/// columns parsed (a malformed one falls back to empty).
async fn load_rule(db: &PgPool, id: &str) -> std::result::Result<Option<Rule>, sqlx::Error> {
    let Some(row) = sqlx::query("SELECT * FROM monitoring_rules WHERE id = $1")
        .bind(id)
        .fetch_optional(db)
        .await?
    else {
        return Ok(None);
    };
    let v = pg_row_to_json(&row);
    let Some(o) = v.as_object() else { return Ok(None) };
    let n = |k: &str, default: f64| match o.get(k) {
        None | Some(Value::Null) => default,
        Some(x) => number(x),
    };
    Ok(Some(Rule {
        id: str_of(o, "id"),
        name: str_of(o, "name"),
        report_definition_id: str_of(o, "report_definition_id"),
        data_source_id: str_of(o, "data_source_id"),
        created_by: str_of(o, "created_by"),
        threshold: ThresholdRule {
            metric_column: str_of(o, "metric_column"),
            threshold_operator: str_of(o, "threshold_operator"),
            threshold_value: n("threshold_value", 0.0),
            threshold_upper_bound: o
                .get("threshold_upper_bound")
                .filter(|x| !x.is_null())
                .map(number),
            escalation_threshold_pct: n("escalation_threshold_pct", 20.0),
        },
        alerts: AlertRule {
            id: str_of(o, "id"),
            name: str_of(o, "name"),
            alert_channels: json_col(o, "alert_channels").unwrap_or_default(),
            alert_recipients: json_col::<Vec<AlertRecipient>>(o, "alert_recipients").unwrap_or_default(),
            webhook_url: o.get("webhook_url").and_then(Value::as_str).map(String::from),
        },
        notify_on_pass: js_bool(o.get("notify_on_pass")),
        notify_on_no_data: js_bool(o.get("notify_on_no_data")),
        is_active: js_bool(o.get("is_active")),
        is_paused: js_bool(o.get("is_paused")),
        consecutive_breaches: n("consecutive_breaches", 0.0) as i64,
        total_executions: n("total_executions", 0.0) as i64,
        total_alerts_sent: n("total_alerts_sent", 0.0) as i64,
    }))
}

/// `validateRBACForExecution`: `Ok(())` to proceed, `Err((drift_type, detail))` to pause.
async fn validate_rbac(
    db: &PgPool,
    user_id: &str,
    data_source_id: &str,
) -> std::result::Result<std::result::Result<(), (String, String)>, sqlx::Error> {
    let revoked = |d: String| Ok(Err(("PERMISSION_REVOKED".to_string(), d)));
    let active: Option<Option<bool>> = sqlx::query_scalar("SELECT is_active FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(db)
        .await?;
    if !matches!(active, Some(Some(true))) {
        return revoked(format!("User {user_id} is no longer active"));
    }
    let role_ids: Vec<String> = sqlx::query_scalar("SELECT role_id FROM user_roles WHERE user_id = $1")
        .bind(user_id)
        .fetch_all(db)
        .await?;
    if role_ids.is_empty() {
        return revoked(format!("User {user_id} has no roles assigned"));
    }
    let names: Vec<String> = sqlx::query_scalar("SELECT name FROM roles WHERE id = ANY($1)")
        .bind(&role_ids)
        .fetch_all(db)
        .await?;
    if names.iter().any(|n| n.to_lowercase().starts_with("admin")) {
        return Ok(Ok(()));
    }
    let level: Option<String> = sqlx::query_scalar(
        "SELECT permission_level FROM resource_permissions WHERE resource_type = 'data_source' AND resource_id = $1 AND role_id = ANY($2) LIMIT 1",
    )
    .bind(data_source_id)
    .bind(&role_ids)
    .fetch_optional(db)
    .await?;
    let Some(level) = level else {
        return revoked(format!(
            "No resource permission found for data source {data_source_id}"
        ));
    };
    let rank = |l: &str| {
        ["view", "edit", "execute", "admin"]
            .iter()
            .position(|x| *x == l)
            .map_or(-1, |p| p as i64)
    };
    if rank(&level) < rank("execute") {
        return revoked(format!(
            "Permission level '{level}' is insufficient (need execute or admin)"
        ));
    }
    Ok(Ok(()))
}

struct SqlRun {
    rows: Vec<Map<String, Value>>,
    execution_ms: i32,
    sql: String,
}

/// `executeReportSQL`. A failing query yields no rows (→ NO_DATA), as in
/// Node; only a missing data source is an error. The access gate (D-2) is an
/// error too, so the execution records why it did not run.
async fn execute_report_sql(db: &PgPool, rule: &Rule) -> std::result::Result<SqlRun, (String, &'static str)> {
    let start = std::time::Instant::now();
    let ms = |s: std::time::Instant| i32::try_from(s.elapsed().as_millis()).unwrap_or(i32::MAX);
    let empty = |sql: String| SqlRun {
        rows: vec![],
        execution_ms: ms(start),
        sql,
    };

    let sq: Option<Option<String>> =
        sqlx::query_scalar("SELECT saved_query_id FROM report_definitions WHERE id = $1")
            .bind(&rule.report_definition_id)
            .fetch_optional(db)
            .await
            .map_err(|e| (e.to_string(), "sql_execution"))?;
    let Some(saved_query_id) = sq.flatten().filter(|s| !s.is_empty()) else {
        tracing::warn!(report = %rule.report_definition_id, "report definition has no saved query — producing NO_DATA");
        return Ok(empty(String::new()));
    };
    let q: Option<String> = sqlx::query_scalar("SELECT sql_content FROM saved_queries WHERE id = $1")
        .bind(&saved_query_id)
        .fetch_optional(db)
        .await
        .map_err(|e| (e.to_string(), "sql_execution"))?;
    let Some(sql) = q else {
        return Ok(empty(String::new()));
    };
    let ds: Option<DataSourceRow> = sqlx::query_as(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1 AND is_active = true",
    )
    .bind(&rule.data_source_id)
    .fetch_optional(db)
    .await
    .map_err(|e| (e.to_string(), "sql_execution"))?;
    let Some(ds) = ds else {
        return Err((
            format!("Data source {} not found or inactive", rule.data_source_id),
            "sql_execution",
        ));
    };

    if let QueryRunDecision::Refused(m) =
        decide_query_run(db, &rule.created_by, &sql, &rule.data_source_id).await
    {
        return Err((m, "access_check"));
    }

    let conn = match get_connection(&ds).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, "executeReportSQL failed");
            return Ok(empty(sql));
        }
    };
    let limited = format!("SELECT * FROM ({sql}) AS __monitoring_subquery__ LIMIT 10000");
    match conn.fetch_json(&limited).await {
        Ok(rows) => Ok(SqlRun {
            rows: rows.into_iter().filter_map(|r| r.as_object().cloned()).collect(),
            execution_ms: ms(start),
            sql,
        }),
        Err(e) => {
            tracing::error!(error = %e, "executeReportSQL failed");
            Ok(empty(sql))
        }
    }
}

/// What the read-only half of an evaluation decided.
enum Prepared {
    Skipped,
    Drift {
        rule: Box<Rule>,
        drift: String,
        detail: String,
    },
    Evaluated {
        rule: Box<Rule>,
        previous: Option<f64>,
        run: SqlRun,
        sql_error: Option<(String, &'static str)>,
        ev: crate::monitoring::evaluate::Evaluation,
    },
}

/// The read-only half: load the rule, check its owner's permissions, run the
/// report SQL (itself in a rolled-back read-only transaction) and evaluate.
/// Nothing here writes or notifies, so it is safe to retry.
async fn prepare(db: &PgPool, payload: &MonitoringEvaluatePayload) -> std::result::Result<Prepared, String> {
    let err = |e: sqlx::Error| e.to_string();
    let start = std::time::Instant::now();
    let rule = load_rule(db, &payload.rule_id)
        .await
        .map_err(err)?
        .ok_or_else(|| format!("Monitoring rule {} not found", payload.rule_id))?;
    if !rule.is_active || rule.is_paused {
        return Ok(Prepared::Skipped);
    }
    if let Err((drift, detail)) = validate_rbac(db, &rule.created_by, &rule.data_source_id)
        .await
        .map_err(err)?
    {
        return Ok(Prepared::Drift {
            rule: Box::new(rule),
            drift,
            detail,
        });
    }
    let previous: Option<f64> = sqlx::query(
        "SELECT metric_value FROM monitoring_executions WHERE monitoring_rule_id = $1 ORDER BY executed_at DESC LIMIT 1",
    )
    .bind(&rule.id)
    .fetch_optional(db)
    .await
    .map_err(err)?
    .map(|r| pg_row_to_json(&r))
    .and_then(|v| v.get("metric_value").filter(|m| !m.is_null()).map(number));

    let (run, sql_error) = match execute_report_sql(db, &rule).await {
        Ok(r) => (r, None),
        Err((e, phase)) => (
            SqlRun {
                rows: vec![],
                execution_ms: i32::try_from(start.elapsed().as_millis()).unwrap_or(i32::MAX),
                sql: String::new(),
            },
            Some((e, phase)),
        ),
    };
    let mut ev = evaluate_threshold(&run.rows, &rule.threshold, previous);
    if let Some((e, _)) = &sql_error {
        ev.status = Status::Error;
        ev.message = format!("SQL execution failed: {e}");
    }
    Ok(Prepared::Evaluated {
        rule: Box::new(rule),
        previous,
        run,
        sql_error,
        ev,
    })
}

/// `delta_pct` is `DECIMAL(8,4)`: anything at or beyond ±10000 % overflows it.
/// Node let that fail the insert after the alerts had gone out, so the
/// evaluation was never recorded. Here the delta is stored as NULL instead
/// (MIGRATION_PLAN.md §9, D-9).
fn storable_delta(delta: Option<f64>) -> Option<f64> {
    delta.filter(|d| d.is_finite() && d.abs() < 10_000.0)
}

/// The writing half: alerts, the execution row, the rule's counters and the
/// audit entry. Run exactly once per evaluation — a retry of this would send
/// every alert again.
async fn commit(
    db: &PgPool,
    payload: &MonitoringEvaluatePayload,
    prepared: Prepared,
) -> std::result::Result<EvaluationOutcome, String> {
    let err = |e: sqlx::Error| e.to_string();
    let (rule, previous, run, sql_error, ev) = match prepared {
        Prepared::Skipped => {
            return Ok(EvaluationOutcome {
                status: "SKIPPED".into(),
                metric_value: None,
                error: None,
            });
        }
        Prepared::Drift { rule, drift, detail } => {
            sqlx::query(
                "UPDATE monitoring_rules SET is_paused = true, pause_reason = $2, updated_at = $3 WHERE id = $1",
            )
            .bind(&rule.id)
            .bind(format!("RBAC drift detected: {drift} — {detail}"))
            .bind(now_ts())
            .execute(db)
            .await
            .map_err(err)?;
            let _ = create_notification(
                db,
                &rule.created_by,
                "error",
                &format!("Monitoring Rule Paused: {}", rule.name),
                &format!("Rule paused due to permission change ({drift}): {detail}"),
                Some(&json!({ "ruleId": rule.id, "driftType": drift })),
            )
            .await;
            log_audit(db, AuditEntry {
                user_id: Some(&rule.created_by),
                action: "execute",
                resource_type: "data_source",
                resource_id: Some(&rule.data_source_id),
                details: Some(json!({ "operation": "monitoring_rbac_drift", "ruleId": rule.id, "driftType": drift, "detail": detail })),
                ..Default::default()
            })
            .await
            .map_err(err)?;
            return Ok(EvaluationOutcome {
                status: "RBAC_DRIFT".into(),
                metric_value: None,
                error: None,
            });
        }
        Prepared::Evaluated {
            rule,
            previous,
            run,
            sql_error,
            ev,
        } => (rule, previous, run, sql_error, ev),
    };

    let should_alert = matches!(ev.status, Status::Breach | Status::Escalate)
        || (ev.status == Status::Pass && rule.notify_on_pass)
        || (ev.status == Status::NoData && rule.notify_on_no_data);
    let mut results = Vec::new();
    if should_alert && !rule.alerts.alert_channels.is_empty() {
        match dispatch_alerts(db, &rule.alerts, &ev, &uuid::Uuid::new_v4().to_string()).await {
            Ok(r) => results = r,
            Err(e) => tracing::error!(error = %e, "dispatchAlerts failed"),
        }
    }
    let dispatched = results.iter().any(|r| r.success);
    let mut channels: Vec<String> = Vec::new();
    for r in results.iter().filter(|r| r.success) {
        if !channels.contains(&r.channel) {
            channels.push(r.channel.clone());
        }
    }
    let now = now_ts();

    sqlx::query(
        "INSERT INTO monitoring_executions (id, monitoring_rule_id, executed_at, execution_ms, rows_returned, sql_executed, \
           metric_value, previous_metric_value, delta_pct, evaluation_status, evaluation_detail, alert_dispatched, \
           alert_channels_used, alert_recipients_sent, alert_sent_at, error_message, error_phase, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, $13, $14, $15, $16, $3)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(&rule.id)
    .bind(now)
    .bind(run.execution_ms)
    .bind(i32::try_from(run.rows.len()).unwrap_or(i32::MAX))
    .bind(run.sql.chars().take(65535).collect::<String>())
    .bind(ev.actual_value)
    .bind(previous)
    .bind(storable_delta(ev.delta_from_previous))
    .bind(ev.status.as_str())
    .bind(dispatched)
    .bind(serde_json::to_string(&channels).unwrap_or_default())
    .bind(serde_json::to_string(&rule.alerts.alert_recipients.iter().map(|r| r.id.clone()).collect::<Vec<_>>()).unwrap_or_default())
    .bind(dispatched.then_some(now))
    .bind(sql_error.as_ref().map(|(e, _)| e.clone()))
    .bind(sql_error.as_ref().map(|(_, p)| (*p).to_string()))
    .execute(db)
    .await
    .map_err(err)?;

    let breach = matches!(ev.status, Status::Breach | Status::Escalate);
    let sent_now = i64::try_from(results.iter().filter(|r| r.success).count()).unwrap_or(0);
    sqlx::query(
        "UPDATE monitoring_rules SET total_executions = $2, last_executed_at = $3, last_execution_status = $4, \
           last_metric_value = $5, consecutive_breaches = $6, total_alerts_sent = $7, updated_at = $3 WHERE id = $1",
    )
    .bind(&rule.id)
    .bind(i32::try_from(rule.total_executions + 1).unwrap_or(i32::MAX))
    .bind(now)
    .bind(ev.status.as_str())
    .bind(ev.actual_value)
    .bind(i32::try_from(if breach { rule.consecutive_breaches + 1 } else { 0 }).unwrap_or(i32::MAX))
    .bind(i32::try_from(rule.total_alerts_sent + if dispatched { sent_now } else { 0 }).unwrap_or(i32::MAX))
    .execute(db)
    .await
    .map_err(err)?;

    log_audit(
        db,
        AuditEntry {
            user_id: Some(&rule.created_by),
            action: "execute",
            resource_type: "data_source",
            resource_id: Some(&rule.data_source_id),
            details: Some(json!({
                "operation": "monitoring_evaluation",
                "ruleId": rule.id,
                "ruleName": rule.name,
                "status": ev.status.as_str(),
                "metricValue": ev.actual_value,
                "alertDispatched": dispatched,
                "triggeredBy": payload.triggered_by.as_deref().unwrap_or("schedule"),
            })),
            ..Default::default()
        },
    )
    .await
    .map_err(err)?;

    Ok(EvaluationOutcome {
        status: ev.status.as_str().into(),
        metric_value: ev.actual_value,
        error: sql_error.map(|(e, _)| e),
    })
}

/// Evaluate one rule now: [`prepare`] then [`commit`], no retries.
///
/// # Errors
/// When the rule does not exist, or on a config-database error.
pub async fn execute_monitoring_evaluation(
    ctx: &AppContext,
    payload: &MonitoringEvaluatePayload,
) -> std::result::Result<EvaluationOutcome, String> {
    let db = pool(ctx);
    let prepared = prepare(db, payload).await?;
    commit(db, payload, prepared).await
}

pub struct MonitoringEvaluateWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<MonitoringEvaluatePayload> for MonitoringEvaluateWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    fn class_name() -> String {
        "monitoring:evaluate".to_string()
    }

    /// Trigger.dev retried this task 3× with 5 s→60 s backoff. Only the
    /// read-only half is retried here: once alerts may have gone out, the
    /// evaluation is committed once and never re-run.
    async fn perform(&self, args: MonitoringEvaluatePayload) -> Result<()> {
        let db = pool(&self.ctx);
        let mut delay = std::time::Duration::from_secs(5);
        let mut attempt = 1;
        let prepared = loop {
            match prepare(db, &args).await {
                Ok(p) => break p,
                Err(e) if e.ends_with("not found") || attempt == 3 => {
                    return Err(Error::string(&format!(
                        "monitoring:evaluate {}: {e}",
                        args.rule_id
                    )));
                }
                Err(e) => {
                    tracing::warn!(rule = %args.rule_id, attempt, error = %e, "monitoring:evaluate failed, retrying");
                    tokio::time::sleep(delay).await;
                    delay = (delay * 2).min(std::time::Duration::from_secs(60));
                    attempt += 1;
                }
            }
        };
        match commit(db, &args, prepared).await {
            Ok(outcome) => {
                tracing::info!(rule = %args.rule_id, status = %outcome.status, value = ?outcome.metric_value, "monitoring:evaluate");
                Ok(())
            }
            Err(e) => Err(Error::string(&format!(
                "monitoring:evaluate {} (not retried): {e}",
                args.rule_id
            ))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::storable_delta;

    #[test]
    fn delta_that_overflows_decimal_8_4_is_stored_as_null() {
        assert_eq!(storable_delta(Some(12.5)), Some(12.5));
        assert_eq!(storable_delta(Some(9_999.99)), Some(9_999.99));
        assert_eq!(storable_delta(Some(10_000.0)), None);
        assert_eq!(storable_delta(Some(-250_000.0)), None);
        assert_eq!(storable_delta(Some(f64::INFINITY)), None);
        assert_eq!(storable_delta(None), None);
    }
}
