//! `email:batch` (`src/lib/jobs/workers/email-batch-worker.ts`): run a report
//! query, write it as an attachment, run a recipient query, and send the
//! template to every recipient with the attachment and that recipient's
//! mapped columns.
//!
//! Deliberate difference (MIGRATION_PLAN.md §9, D-2): **both** stored queries
//! are gated on `decideQueryRun` for the requesting user. The Node worker ran
//! them unchecked — the recipient query included, which reads addresses out
//! of the user database.
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use super::output::{output_dir, render_file, to_csv};
use crate::{
    common::{db::pool, time::now_iso},
    datasources::{get_connection, DataSourceRow},
    email::{send_email_with, FileAttachment},
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    security::audit::{log_audit, AuditEntry},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailBatchJobData {
    pub query_id: String,
    pub email_template_id: String,
    pub recipient_query_id: String,
    pub recipient_email_column: String,
    pub user_id: String,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default)]
    pub report_name: Option<String>,
    #[serde(default)]
    pub parameters: Option<Value>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailBatchResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_count: Option<usize>,
    pub duration: u128,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub emails_sent: usize,
}

/// A saved query's rows, after the run gate, from its own data source.
async fn run_saved_query(ctx: &AppContext, user: &str, id: &str, what: &str) -> Result<Vec<Value>, String> {
    let db = pool(ctx);
    let (sql, ds_id): (String, String) =
        sqlx::query_as("SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1")
            .bind(id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("{what} query not found: {id}"))?;
    let ds: DataSourceRow =
        sqlx::query_as("SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1")
            .bind(&ds_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("{what} data source not found"))?;
    if let QueryRunDecision::Refused(m) = decide_query_run(db, user, &sql, &ds_id).await {
        return Err(m);
    }
    let conn = get_connection(&ds).await.map_err(|e| e.to_string())?;
    conn.fetch_json(&sql).await.map_err(|e| e.to_string())
}

fn content_type(format: &str) -> &'static str {
    match format {
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pdf" => "application/pdf",
        _ => "text/csv",
    }
}

async fn run(
    ctx: &AppContext,
    data: &EmailBatchJobData,
    sent: &mut usize,
) -> Result<(String, usize, usize, usize), String> {
    let format = data.format.as_deref().unwrap_or("csv");
    let report_name = data.report_name.as_deref().unwrap_or("Report");

    let report_rows = run_saved_query(ctx, &data.user_id, &data.query_id, "Report").await?;
    let dir = output_dir();
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let stamp = chrono::Utc::now().timestamp_millis();
    let spaced = regex::Regex::new(r"\s+").map_err(|e| e.to_string())?;
    let filename = format!("{}_{stamp}.{format}", spaced.replace_all(report_name, "_"));
    let path = dir.join(&filename);
    let bytes = match format {
        "csv" => to_csv(&report_rows, true).into_bytes(),
        "xlsx" | "pdf" => render_file(format, &report_rows, Some(report_name))?,
        other => return Err(format!("Unsupported format: {other}")),
    };
    tokio::fs::write(&path, &bytes).await.map_err(|e| e.to_string())?;
    let path_s = path.to_string_lossy().into_owned();

    let template: (String, String, Option<String>, Option<String>) =
        sqlx::query_as("SELECT subject, body, html_body, column_mappings FROM email_templates WHERE id = $1")
            .bind(&data.email_template_id)
            .fetch_optional(pool(ctx))
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Email template not found: {}", data.email_template_id))?;
    let (subject, body, html_body, mappings) = template;
    let mappings: Map<String, Value> = match mappings.filter(|m| !m.is_empty()) {
        Some(m) => serde_json::from_str(&m).map_err(|e| e.to_string())?,
        None => Map::new(),
    };

    let recipients = run_saved_query(ctx, &data.user_id, &data.recipient_query_id, "Recipient").await?;
    if recipients.is_empty() {
        return Err("No recipients found from recipient query".into());
    }
    let column = &data.recipient_email_column;
    if !crate::common::js::truthy(recipients[0].get(column)) {
        return Err(format!(
            "Email column '{column}' not found in recipient query results"
        ));
    }

    let attachment = FileAttachment {
        filename,
        content_type: content_type(format).into(),
        bytes,
    };
    let html = html_body.unwrap_or(body);
    let mut failed = 0usize;
    let total = recipients.len();
    for (i, recipient) in recipients.iter().enumerate() {
        let to = crate::render::cell_text(recipient.get(column).unwrap_or(&Value::Null));
        let mut vars = Map::new();
        for (placeholder, col) in &mappings {
            let col = col.as_str().unwrap_or_default();
            vars.insert(
                placeholder.clone(),
                recipient.get(col).cloned().unwrap_or(Value::Null),
            );
        }
        vars.insert("_recipientNumber".into(), json!(i + 1));
        vars.insert("_totalRecipients".into(), json!(total));
        vars.insert("_reportName".into(), json!(report_name));
        vars.insert("_generatedAt".into(), json!(now_iso()));
        let r = send_email_with(
            std::slice::from_ref(&to),
            &subject,
            &html,
            &vars,
            None,
            std::slice::from_ref(&attachment),
        )
        .await;
        if r.success {
            *sent += 1;
        } else {
            failed += 1;
            tracing::info!(to = %to, error = ?r.error, "email:batch send failed");
        }
    }
    Ok((path_s, report_rows.len(), total, failed))
}

/// Run the job and audit it; never errors (the result says how it went).
pub async fn process(ctx: &AppContext, data: &EmailBatchJobData) -> EmailBatchResult {
    let start = std::time::Instant::now();
    let mut sent = 0usize;
    let outcome = run(ctx, data, &mut sent).await;
    let details = match &outcome {
        Ok((path, rows, recipients, failed)) => json!({
            "emailsSent": sent,
            "failedRecipients": failed,
            "attachmentPath": path,
            "reportRows": rows,
            "recipientCount": recipients,
        }),
        Err(e) => json!({ "error": e, "emailsSent": sent }),
    };
    if let Err(e) = log_audit(
        pool(ctx),
        AuditEntry {
            user_id: Some(&data.user_id),
            action: "email_batch",
            resource_type: "job",
            resource_id: Some(&data.query_id),
            details: Some(details),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
    match outcome {
        Ok((path, rows, _, _)) => EmailBatchResult {
            success: true,
            output_location: Some(path),
            row_count: Some(rows),
            duration: start.elapsed().as_millis(),
            error: None,
            emails_sent: sent,
        },
        Err(e) => EmailBatchResult {
            success: false,
            output_location: None,
            row_count: None,
            duration: start.elapsed().as_millis(),
            error: Some(e),
            emails_sent: sent,
        },
    }
}

pub struct EmailBatchWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<EmailBatchJobData> for EmailBatchWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    fn class_name() -> String {
        "email:batch".to_string()
    }

    async fn perform(&self, args: EmailBatchJobData) -> Result<()> {
        let result = process(&self.ctx, &args).await;
        tracing::info!(result = %serde_json::to_string(&result).unwrap_or_default(), "email:batch finished");
        Ok(())
    }
}
