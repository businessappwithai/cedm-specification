//! `cron_tick` — the Rust replacement for `startOnPremiseCronRunner`
//! (`src/lib/monitoring/monitoring-scheduler.ts`).
//!
//! Loco's scheduler (`config/*.yaml` → `scheduler.jobs.cron_tick`, every
//! minute at second 0) runs this task. It finds the monitoring rules whose
//! cron expression matches the current minute, using the Node matcher's exact
//! semantics (`monitoring::cron`), and enqueues one `monitoring:evaluate` job
//! per rule on the Postgres queue.
//!
//! Unlike the Node runner, a minute is processed **once** however many
//! scheduler replicas run: the minute is claimed in `ers_cron_ticks`
//! (Rust-owned table, migration 0002) before anything is enqueued
//! (MIGRATION_PLAN.md §6.3 and §9, D-1).
//!
//! It also enqueues one `report-generation:execute` job per scheduled NL
//! report definition that is due (and not already running), and at 02:00 UTC
//! runs the artifact retention cleanup — the Node runner's other two duties.
//! `job_definitions.schedule_cron` is fired by neither backend (§6.3).
use chrono::{DateTime, Timelike, Utc};
use loco_rs::prelude::*;

use crate::{
    common::db::pool,
    monitoring::cron::cron_matches,
    reportgen::{
        cleanup::cleanup_expired,
        worker::{GenerationParams, ReportGenerationWorker},
    },
    workers::monitoring_evaluate::{MonitoringEvaluatePayload, MonitoringEvaluateWorker},
};

pub struct CronTick;

/// The minute being processed, seconds zeroed (`now.setUTCSeconds(0, 0)`).
/// `at=<RFC 3339>` replays a specific minute, for the parity replay test.
fn minute(vars: &task::Vars) -> std::result::Result<DateTime<Utc>, String> {
    let t = match vars.cli_arg("at") {
        Ok(s) => DateTime::parse_from_rfc3339(s)
            .map_err(|e| format!("at: {e}"))?
            .with_timezone(&Utc),
        Err(_) => Utc::now(),
    };
    Ok(t.with_second(0).and_then(|t| t.with_nanosecond(0)).unwrap_or(t))
}

/// The ids of the active, unpaused rules due at `at`.
///
/// # Errors
/// On a database error.
pub async fn due_monitoring_rules(
    db: &sqlx::PgPool,
    at: DateTime<Utc>,
) -> std::result::Result<Vec<String>, sqlx::Error> {
    let rules: Vec<(String, String, Option<String>)> = sqlx::query_as(
        "SELECT id, cron_expression, timezone FROM monitoring_rules WHERE is_active = true AND is_paused = false",
    )
    .fetch_all(db)
    .await?;
    Ok(rules
        .into_iter()
        .filter(|(_, cron, tz)| cron_matches(cron, at, tz.as_deref().unwrap_or("UTC")))
        .map(|(id, _, _)| id)
        .collect())
}

#[async_trait]
impl Task for CronTick {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "cron_tick".to_string(),
            detail: "Enqueue monitoring evaluations and scheduled NL reports due this minute (run every minute by the scheduler)"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let db = pool(ctx);
        let at = minute(vars).map_err(|e| Error::string(&e))?;
        let dry_run = vars.cli_arg("dry_run").is_ok_and(|v| v == "true");

        if !dry_run {
            let claimed = sqlx::query(
                "INSERT INTO ers_cron_ticks (minute) VALUES ($1) ON CONFLICT (minute) DO NOTHING",
            )
            .bind(at)
            .execute(db)
            .await
            .map_err(|e| Error::string(&e.to_string()))?
            .rows_affected();
            if claimed == 0 {
                tracing::info!(minute = %at, "[cron_tick] minute already processed by another scheduler");
                return Ok(());
            }
        }

        let due = due_monitoring_rules(db, at)
            .await
            .map_err(|e| Error::string(&e.to_string()))?;
        if !due.is_empty() {
            tracing::info!(count = due.len(), minute = %at, "[cron_tick] monitoring rule(s) due");
        }
        for rule_id in &due {
            if dry_run {
                println!("{rule_id}");
                continue;
            }
            MonitoringEvaluateWorker::perform_later(
                ctx,
                MonitoringEvaluatePayload {
                    rule_id: rule_id.clone(),
                    triggered_by: Some("on_premise_cron".into()),
                },
            )
            .await?;
        }

        let nl_due: Vec<(String, String, Option<String>, Option<String>)> = sqlx::query_as(
            "SELECT id, schedule_cron, schedule_timezone, last_run_status FROM nl_report_definitions \
             WHERE schedule_enabled = true AND schedule_cron IS NOT NULL",
        )
        .fetch_all(db)
        .await
        .unwrap_or_default();
        let nl_ready: Vec<&String> = nl_due
            .iter()
            .filter(|(_, cron, tz, status)| {
                status.as_deref() != Some("running") && cron_matches(cron, at, tz.as_deref().unwrap_or("UTC"))
            })
            .map(|(id, ..)| id)
            .collect();
        if !nl_ready.is_empty() {
            tracing::info!(count = nl_ready.len(), minute = %at, "[cron_tick] scheduled report(s) due");
        }
        for id in nl_ready {
            if dry_run {
                println!("report:{id}");
                continue;
            }
            ReportGenerationWorker::perform_later(
                ctx,
                GenerationParams {
                    report_definition_id: id.clone(),
                    triggered_by: "scheduled".into(),
                },
            )
            .await?;
        }

        // Nightly artifact retention cleanup at 02:00 UTC.
        if !dry_run && at.hour() == 2 && at.minute() == 0 {
            let r = cleanup_expired(db).await;
            if r.deleted_records > 0 || !r.errors.is_empty() {
                tracing::info!(
                    files = r.deleted_files,
                    records = r.deleted_records,
                    errors = r.errors.len(),
                    "[cron_tick] artifact cleanup"
                );
            }
        }

        // Keep a day of claimed minutes.
        let _ = sqlx::query("DELETE FROM ers_cron_ticks WHERE minute < now() - interval '1 day'")
            .execute(db)
            .await;
        Ok(())
    }
}
