//! `data:export` (`src/lib/jobs/workers/export-worker.ts`). Same deliberate
//! differences as the report worker: `decideQueryRun` gate (D-2); `xlsx`/`pdf`
//! from `crate::render` (D-22).
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::{
    output::{output_dir, render_file, to_csv},
    report::JobResult,
};
use crate::{
    common::db::pool,
    datasources::{get_connection, DataSourceRow},
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportJobData {
    pub query_id: String,
    pub user_id: String,
    #[serde(default = "default_format")]
    pub format: String,
    #[serde(default)]
    pub parameters: Option<Value>,
}

fn default_format() -> String {
    "csv".into()
}

pub struct ExportWorker {
    pub ctx: AppContext,
}

async fn run(ctx: &AppContext, data: &ExportJobData) -> std::result::Result<(String, usize), String> {
    let db = pool(ctx);
    let (sql, ds_id): (String, String) =
        sqlx::query_as("SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1")
            .bind(&data.query_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Query not found: {}", data.query_id))?;
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
    if !matches!(data.format.as_str(), "csv" | "xlsx" | "pdf") {
        return Err(format!("Unsupported format: {}", data.format));
    }
    let conn = get_connection(&ds).await.map_err(|e| e.to_string())?;
    let rows = conn.fetch_json(&sql).await.map_err(|e| e.to_string())?;
    let dir = output_dir();
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let stamp = chrono::Utc::now().timestamp_millis();
    let path = dir.join(format!("export_{}_{stamp}.{}", data.query_id, data.format));
    if data.format == "csv" {
        // Node writes no CSV for an empty result and still reports the path.
        if !rows.is_empty() {
            tokio::fs::write(&path, to_csv(&rows, false))
                .await
                .map_err(|e| e.to_string())?;
        }
    } else {
        let bytes = render_file(&data.format, &rows, None)?;
        tokio::fs::write(&path, bytes).await.map_err(|e| e.to_string())?;
    }
    Ok((path.to_string_lossy().into_owned(), rows.len()))
}

pub async fn process(ctx: &AppContext, data: &ExportJobData) -> JobResult {
    let start = std::time::Instant::now();
    match run(ctx, data).await {
        Ok((path, rows)) => JobResult {
            success: true,
            output_location: Some(path),
            row_count: Some(rows),
            duration: start.elapsed().as_millis(),
            error: None,
        },
        Err(e) => {
            tracing::error!(error = %e, "Export job failed");
            JobResult {
                success: false,
                output_location: None,
                row_count: None,
                duration: start.elapsed().as_millis(),
                error: Some(e),
            }
        }
    }
}

#[async_trait]
impl BackgroundWorker<ExportJobData> for ExportWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    fn class_name() -> String {
        "data:export".to_string()
    }

    async fn perform(&self, args: ExportJobData) -> Result<()> {
        let result = process(&self.ctx, &args).await;
        tracing::info!(result = %serde_json::to_string(&result).unwrap_or_default(), "data:export finished");
        Ok(())
    }
}
