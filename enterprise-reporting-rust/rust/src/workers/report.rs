//! `report:generate` (`src/lib/jobs/workers/report-worker.ts`).
//!
//! Differences from Node, both deliberate and listed in MIGRATION_PLAN.md §9:
//! the stored SQL is gated on `decideQueryRun` for the requesting user (D-2 —
//! the Node worker ran it unchecked). `xlsx`/`pdf` come from `crate::render`
//! (D-22).
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use super::output::{output_dir, render_file, to_csv};
use crate::{
    common::db::pool,
    datasources::{get_connection, DataSourceRow},
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    security::audit::{log_audit, AuditEntry},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportJobData {
    pub report_id: String,
    pub user_id: String,
    #[serde(default)]
    pub parameters: Option<Value>,
    #[serde(default)]
    pub format: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct JobResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_count: Option<usize>,
    pub duration: u128,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub struct ReportWorker {
    pub ctx: AppContext,
}

async fn run(ctx: &AppContext, data: &ReportJobData) -> std::result::Result<(String, usize), String> {
    let db = pool(ctx);
    let format = data.format.as_deref().unwrap_or("csv");
    let report: Option<(String, Option<String>)> =
        sqlx::query_as("SELECT name, saved_query_id FROM report_definitions WHERE id = $1")
            .bind(&data.report_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?;
    let (name, saved_query_id) = report.ok_or_else(|| format!("Report not found: {}", data.report_id))?;
    let saved_query_id = saved_query_id
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "Report has no associated query".to_string())?;
    let (sql, ds_id): (String, String) =
        sqlx::query_as("SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1")
            .bind(&saved_query_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Query not found".to_string())?;
    let ds: DataSourceRow =
        sqlx::query_as("SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1")
            .bind(&ds_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Data source not found".to_string())?;

    if let QueryRunDecision::Refused(m) = decide_query_run(db, &data.user_id, &sql, &ds_id).await {
        return Err(m);
    }
    if !matches!(format, "csv" | "xlsx" | "pdf") {
        return Err(format!("Unsupported format: {format}"));
    }

    let conn = get_connection(&ds).await.map_err(|e| e.to_string())?;
    let rows = conn.fetch_json(&sql).await.map_err(|e| e.to_string())?;
    let dir = output_dir();
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let stamp = chrono::Utc::now().timestamp_millis();
    let path = dir.join(format!("report_{}_{stamp}.{format}", data.report_id));
    let bytes = if format == "csv" {
        to_csv(&rows, true).into_bytes()
    } else {
        render_file(format, &rows, Some(&name))?
    };
    tokio::fs::write(&path, bytes).await.map_err(|e| e.to_string())?;
    Ok((path.to_string_lossy().into_owned(), rows.len()))
}

/// Run the job and audit it; never errors (the result says how it went), as
/// the Trigger.dev task never threw.
pub async fn process(ctx: &AppContext, data: &ReportJobData) -> JobResult {
    let start = std::time::Instant::now();
    let format = data.format.clone().unwrap_or_else(|| "csv".into());
    let outcome = run(ctx, data).await;
    let db = pool(ctx);
    let audit = match &outcome {
        Ok((path, rows)) => AuditEntry {
            user_id: Some(&data.user_id),
            action: "export",
            resource_type: "report",
            resource_id: Some(&data.report_id),
            details: Some(json!({ "format": format, "rowCount": rows, "outputPath": path })),
            ..Default::default()
        },
        Err(e) => AuditEntry {
            user_id: Some(&data.user_id),
            action: "execute",
            resource_type: "report",
            resource_id: Some(&data.report_id),
            details: Some(json!({ "error": e })),
            ..Default::default()
        },
    };
    if let Err(e) = log_audit(db, audit).await {
        tracing::error!(error = %e, "audit log failed");
    }
    match outcome {
        Ok((path, rows)) => JobResult {
            success: true,
            output_location: Some(path),
            row_count: Some(rows),
            duration: start.elapsed().as_millis(),
            error: None,
        },
        Err(e) => JobResult {
            success: false,
            output_location: None,
            row_count: None,
            duration: start.elapsed().as_millis(),
            error: Some(e),
        },
    }
}

#[async_trait]
impl BackgroundWorker<ReportJobData> for ReportWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    fn class_name() -> String {
        "report:generate".to_string()
    }

    async fn perform(&self, args: ReportJobData) -> Result<()> {
        let result = process(&self.ctx, &args).await;
        tracing::info!(result = %serde_json::to_string(&result).unwrap_or_default(), "report:generate finished");
        Ok(())
    }
}
