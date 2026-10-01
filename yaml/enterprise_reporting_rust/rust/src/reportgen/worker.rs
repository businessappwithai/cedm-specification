//! `executeReportGeneration` (`src/lib/report-generation/report-generation-worker.ts`):
//! load the NL report definition, re-check RBAC, run its SQL, build the chart
//! and the Excel/PDF/CSV artifacts, record them, notify the owner and mail
//! the recipients.
//!
//! Deliberate differences (MIGRATION_PLAN.md §9): the SQL is also gated on
//! `decideQueryRun` for the definition's owner (D-2); the chart is drawn
//! natively rather than by ECharts (D-23); XLSX/PDF are equivalent, not
//! byte-identical (D-22).
use std::time::{Duration, Instant};

use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};

use super::{chart, rbac};
use crate::{
    common::db::pool,
    datasources::{get_connection, DataSourceRow},
    email::{send_email_with, FileAttachment},
    monitoring::alerts::create_notification,
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    render::{cell_text, pdf, xlsx},
    security::audit::{log_audit, AuditEntry},
    workers::output::output_dir,
};

fn env_int(name: &str, default: i64) -> i64 {
    std::env::var(name)
        .ok()
        .and_then(|v| crate::common::pagination::js_parse_int(&v))
        .unwrap_or(default)
}

/// `new Date().toISOString().slice(0, 19).replace("T", " ")`.
fn iso_now() -> String {
    chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationParams {
    pub report_definition_id: String,
    /// `manual` or `scheduled`.
    pub triggered_by: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactOut {
    pub format: String,
    pub file_path: String,
    pub file_size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GenerationResult {
    pub status: String,
    pub execution_id: String,
    pub artifacts: Vec<ArtifactOut>,
    pub row_count: usize,
    pub execution_ms: u128,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

struct Definition {
    id: String,
    title: String,
    created_by: String,
    data_source_id: String,
    generated_sql: String,
    metrics: Vec<String>,
    dimensions: Vec<String>,
    chart_type: String,
    formats: Vec<Value>,
    recipients: Vec<Value>,
    snapshot: Value,
}

fn parse<T: serde::de::DeserializeOwned>(raw: Option<&str>, default: &str) -> Result<T, String> {
    let s = raw.filter(|s| !s.is_empty()).unwrap_or(default);
    serde_json::from_str(s).map_err(|e| e.to_string())
}

async fn load(db: &PgPool, id: &str) -> Result<Definition, String> {
    let row = sqlx::query("SELECT * FROM nl_report_definitions WHERE id = $1")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Report definition not found: {id}"))?;
    let text = |k: &str| row.try_get::<Option<String>, _>(k).ok().flatten();
    Ok(Definition {
        id: id.to_string(),
        title: text("title").unwrap_or_default(),
        created_by: text("created_by").unwrap_or_default(),
        data_source_id: text("data_source_id").unwrap_or_default(),
        generated_sql: text("generated_sql").unwrap_or_default(),
        metrics: parse(text("metric_columns").as_deref(), "[]")?,
        dimensions: parse(text("dimension_columns").as_deref(), "[]")?,
        chart_type: text("chart_type").unwrap_or_else(|| "bar".into()),
        formats: parse(text("output_formats").as_deref(), "[\"csv\"]")?,
        recipients: parse(text("recipient_config").as_deref(), "[]")?,
        snapshot: parse(text("rbac_snapshot").as_deref(), "{}")?,
    })
}

async fn set_status(db: &PgPool, id: &str, status: &str, stamp: bool) {
    let q = if stamp {
        sqlx::query("UPDATE nl_report_definitions SET last_run_status = $2, last_run_at = CAST($3 AS TIMESTAMP) WHERE id = $1")
            .bind(id)
            .bind(status)
            .bind(iso_now())
    } else {
        sqlx::query("UPDATE nl_report_definitions SET last_run_status = $2 WHERE id = $1")
            .bind(id)
            .bind(status)
    };
    if let Err(e) = q.execute(db).await {
        tracing::error!(error = %e, "report-generation status update failed");
    }
}

/// `validateRBACForReport`, then the access gate (D-2).
async fn validate(db: &PgPool, d: &Definition) -> Result<(), String> {
    let active: Option<Option<bool>> = sqlx::query_scalar("SELECT is_active FROM users WHERE id = $1")
        .bind(&d.created_by)
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?;
    if !matches!(active, Some(Some(true))) {
        return Err("User account is inactive".into());
    }
    let roles: Vec<String> = sqlx::query_scalar(
        "SELECT r.name FROM user_roles ur INNER JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1",
    )
    .bind(&d.created_by)
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())?;
    let admin = roles.iter().any(|n| {
        let n = n.to_lowercase();
        n == "admin" || n == "administrator" || n.starts_with("admin")
    });
    if !admin {
        if d.snapshot
            .get("userId")
            .is_some_and(|u| crate::common::js::truthy(Some(u)))
        {
            rbac::detect_drift(db, &d.snapshot, &d.created_by)
                .await
                .map_err(|details| format!("RBAC drift detected: {details}"))?;
        }
        rbac::check_columns(&d.generated_sql, &d.data_source_id, &d.snapshot)?;
    }
    match decide_query_run(db, &d.created_by, &d.generated_sql, &d.data_source_id).await {
        QueryRunDecision::Ok => Ok(()),
        QueryRunDecision::Refused(m) => Err(m),
    }
}

/// `executeReportSQL`: the definition's SQL wrapped in a row limit, under a
/// timeout.
async fn execute_sql(
    db: &PgPool,
    d: &Definition,
) -> Result<(Vec<Map<String, Value>>, Vec<String>, u128), String> {
    let ds: DataSourceRow =
        sqlx::query_as("SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1")
            .bind(&d.data_source_id)
            .fetch_optional(db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Data source not found: {}", d.data_source_id))?;
    let conn = get_connection(&ds).await.map_err(|e| e.to_string())?;
    let limit = env_int("REPORT_ROW_LIMIT", 10000);
    let timeout_ms = env_int("REPORT_QUERY_TIMEOUT_MS", 30000);
    let trailing = regex::Regex::new(r";\s*$").map_err(|e| e.to_string())?;
    let clean = trailing.replace(&d.generated_sql, "");
    let sql = format!("SELECT * FROM ({clean}) AS __rpt__ LIMIT {}", limit + 1);
    let start = Instant::now();
    let rows = tokio::time::timeout(
        Duration::from_millis(u64::try_from(timeout_ms).unwrap_or(30000)),
        conn.fetch_json(&sql),
    )
    .await
    .map_err(|_| format!("Query timeout after {timeout_ms}ms"))?
    .map_err(|e| crate::datasources::db_error_message(&e))?;
    let ms = start.elapsed().as_millis();
    let mut rows: Vec<Map<String, Value>> = rows.into_iter().filter_map(|r| r.as_object().cloned()).collect();
    rows.truncate(usize::try_from(limit).unwrap_or(usize::MAX));
    let columns = rows
        .first()
        .map(|r| r.keys().cloned().collect())
        .unwrap_or_default();
    Ok((rows, columns, ms))
}

/// `toLocaleDateString()` (en-US) and `n.toLocaleString()`.
fn generated_line(rows: usize) -> String {
    let date = chrono::Local::now().format("%-m/%-d/%Y");
    let digits = rows.to_string();
    let mut grouped = String::new();
    for (i, c) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i).is_multiple_of(3) {
            grouped.push(',');
        }
        grouped.push(c);
    }
    format!("Generated: {date} — {grouped} rows")
}

fn table(rows: &[Map<String, Value>], columns: &[String]) -> Vec<Vec<Value>> {
    rows.iter()
        .map(|r| {
            columns
                .iter()
                .map(|c| r.get(c).cloned().unwrap_or(Value::Null))
                .collect()
        })
        .collect()
}

fn build_excel(
    rows: &[Map<String, Value>],
    columns: &[String],
    title: &str,
    chart: Option<&chart::ChartData>,
) -> Result<Vec<u8>, String> {
    let mut wb = rust_xlsxwriter::Workbook::new();
    if let Some(c) = chart {
        chart::add_xlsx_sheet(&mut wb, c, title, &generated_line(rows.len())).map_err(|e| e.to_string())?;
    }
    let theme = xlsx::Theme {
        header_bold: true,
        header_text: Some(0x00FF_FFFF),
        header_fill: Some(0x001F_3864),
        ..xlsx::Theme::default()
    };
    xlsx::add_table(
        &mut wb,
        "Data",
        columns,
        &table(rows, columns),
        &theme,
        xlsx::Widths::Header,
    )
    .map_err(|e| e.to_string())?;
    wb.save_to_buffer().map_err(|e| e.to_string())
}

fn build_pdf(
    rows: &[Map<String, Value>],
    columns: &[String],
    title: &str,
    chart: Option<&chart::ChartData>,
) -> Vec<u8> {
    let mut doc = pdf::Pdf::a4(true);
    doc.font(false, 18.0);
    doc.text(14.0, 20.0, title, (0, 0, 0));
    doc.font(false, 10.0);
    doc.text(14.0, 28.0, &generated_line(rows.len()), (0, 0, 0));
    match chart {
        Some(c) => chart::draw_pdf(&mut doc, c, (14.0, 38.0, 267.0, 133.0)),
        None => {
            doc.font(false, 11.0);
            doc.text(
                14.0,
                50.0,
                "Chart not available for this report.",
                (120, 120, 120),
            );
        }
    }
    doc.add_page();
    let text: Vec<Vec<String>> = rows
        .iter()
        .map(|r| {
            columns
                .iter()
                .map(|c| r.get(c).map(cell_text).unwrap_or_default())
                .collect()
        })
        .collect();
    let style = pdf::TableStyle {
        margin: 14.0,
        font_size: 8.0,
        pad: 2.0,
        head_fill: (31, 56, 100),
        head_text: (255, 255, 255),
        alt_fill: (240, 244, 250),
        body_text: (80, 80, 80),
    };
    pdf::draw_table(&mut doc, 20.0, columns, &text, &style);
    doc.finish()
}

fn build_csv(rows: &[Map<String, Value>], columns: &[String]) -> Vec<u8> {
    let esc = |s: String| {
        if s.contains(',') || s.contains('"') || s.contains('\n') {
            format!("\"{}\"", s.replace('"', "\"\""))
        } else {
            s
        }
    };
    let mut lines = vec![columns
        .iter()
        .map(|c| esc(c.clone()))
        .collect::<Vec<_>>()
        .join(",")];
    for r in rows {
        lines.push(
            columns
                .iter()
                .map(|c| esc(r.get(c).map(cell_text).unwrap_or_default()))
                .collect::<Vec<_>>()
                .join(","),
        );
    }
    lines.join("\n").into_bytes()
}

fn extension(format: &str) -> &str {
    if format == "excel" {
        "xlsx"
    } else {
        format
    }
}

async fn notify(db: &PgPool, d: &Definition, execution_id: &str, error: Option<&str>) {
    let (kind, title, message) = match error {
        None => (
            "success",
            format!("Report Ready: {}", d.title),
            format!(
                "Your report \"{}\" has been generated and is ready to download.",
                d.title
            ),
        ),
        Some(e) => (
            "error",
            format!("Report Failed: {}", d.title),
            format!("Report \"{}\" failed: {e}", d.title),
        ),
    };
    let meta = json!({ "executionId": execution_id, "reportTitle": d.title });
    if let Err(e) = create_notification(db, &d.created_by, kind, &title, &message, Some(&meta)).await {
        tracing::error!(error = %e, "report-generation notification failed");
    }
}

const EMAIL_HTML: &str = "\n        <h2>{{reportTitle}}</h2>\n        <p>{{bodyMessage}}</p>\n        <p><small>Execution ID: {{executionId}}</small></p>\n      ";

async fn email(db: &PgPool, d: &Definition, artifacts: &[(String, Vec<u8>)], execution_id: &str) {
    let mut to = Vec::new();
    for entry in &d.recipients {
        let value = entry.get("value").and_then(Value::as_str).unwrap_or_default();
        match entry.get("type").and_then(Value::as_str) {
            Some("email") => to.push(value.to_string()),
            Some("userId") => {
                let found: Option<Option<String>> =
                    sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
                        .bind(value)
                        .fetch_optional(db)
                        .await
                        .ok()
                        .flatten();
                if let Some(Some(e)) = found.filter(|e| e.as_deref().is_some_and(|x| !x.is_empty())) {
                    to.push(e);
                }
            }
            _ => {}
        }
    }
    if to.is_empty() {
        return;
    }
    let total: usize = artifacts.iter().map(|(_, b)| b.len()).sum();
    let attach =
        i64::try_from(total).unwrap_or(i64::MAX) <= env_int("REPORT_EMAIL_MAX_ATTACHMENT_BYTES", 10_485_760);
    let slug: String = d
        .title
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
        .collect::<String>()
        .to_lowercase();
    let files: Vec<FileAttachment> = if attach {
        artifacts
            .iter()
            .map(|(f, b)| FileAttachment {
                filename: format!("{slug}.{}", extension(f)),
                content_type: match f.as_str() {
                    "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "pdf" => "application/pdf",
                    _ => "text/csv",
                }
                .into(),
                bytes: b.clone(),
            })
            .collect()
    } else {
        Vec::new()
    };
    let body = if attach {
        let names: Vec<String> = artifacts.iter().map(|(f, _)| f.to_uppercase()).collect();
        format!(
            "Your report \"{}\" is attached in {} format.",
            d.title,
            names.join(", ")
        )
    } else {
        format!(
            "Your report \"{}\" is ready. The files are too large to attach — please download them from the application.",
            d.title
        )
    };
    let mut vars = Map::new();
    vars.insert("reportTitle".into(), json!(d.title));
    vars.insert("bodyMessage".into(), json!(body));
    vars.insert("executionId".into(), json!(execution_id));
    let r = send_email_with(
        &to,
        &format!("Report: {}", d.title),
        EMAIL_HTML,
        &vars,
        None,
        &files,
    )
    .await;
    if !r.success {
        tracing::warn!(error = ?r.error, "report-generation email failed");
    }
}

#[allow(clippy::too_many_lines)]
async fn run(
    db: &PgPool,
    p: &GenerationParams,
    execution_id: &str,
    def: &mut Option<Definition>,
    start: Instant,
) -> Result<GenerationResult, String> {
    let result = |status: &str, artifacts, rows, error: Option<String>| GenerationResult {
        status: status.into(),
        execution_id: execution_id.into(),
        artifacts,
        row_count: rows,
        execution_ms: start.elapsed().as_millis(),
        error_message: error,
    };
    let d = def.insert(load(db, &p.report_definition_id).await?);
    set_status(db, &d.id, "running", true).await;

    if let Err(reason) = validate(db, d).await {
        set_status(db, &d.id, "permission_revoked", false).await;
        notify(db, d, execution_id, Some(&reason)).await;
        return Ok(result("PERMISSION_REVOKED", Vec::new(), 0, Some(reason)));
    }

    let (rows, columns, sql_ms) = execute_sql(db, d).await?;
    if rows.is_empty() {
        set_status(db, &d.id, "no_data", false).await;
        notify(db, d, execution_id, Some("Query returned no data")).await;
        return Ok(result("NO_DATA", Vec::new(), 0, None));
    }

    let chart_data = chart::select(&rows, &columns, &d.chart_type, &d.metrics, &d.dimensions);
    let mut built: Vec<(String, Vec<u8>)> = Vec::new();
    for f in &d.formats {
        match f.as_str() {
            Some("excel") => built.push((
                "excel".into(),
                build_excel(&rows, &columns, &d.title, chart_data.as_ref())?,
            )),
            Some("pdf") => built.push((
                "pdf".into(),
                build_pdf(&rows, &columns, &d.title, chart_data.as_ref()),
            )),
            Some("csv") => built.push(("csv".into(), build_csv(&rows, &columns))),
            _ => {}
        }
    }

    let dir = output_dir().join("reports").join(&d.id).join(execution_id);
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let mut persisted = Vec::new();
    for (format, bytes) in &built {
        let path = dir.join(format!("report.{}", extension(format)));
        tokio::fs::write(&path, bytes).await.map_err(|e| e.to_string())?;
        let path_s = path.to_string_lossy().into_owned();
        sqlx::query(
            "INSERT INTO generated_report_artifacts (id, report_definition_id, execution_id, created_by, format, file_path, \
               file_size_bytes, row_count, chart_type, execution_ms, status, triggered_by, sql_executed, created_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'complete', $11, $12, CAST($13 AS TIMESTAMP))",
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(&d.id)
        .bind(execution_id)
        .bind(&d.created_by)
        .bind(format)
        .bind(&path_s)
        .bind(i64::try_from(bytes.len()).unwrap_or(i64::MAX))
        .bind(i32::try_from(rows.len()).unwrap_or(i32::MAX))
        .bind(&d.chart_type)
        .bind(i32::try_from(sql_ms).unwrap_or(i32::MAX))
        .bind(&p.triggered_by)
        .bind(&d.generated_sql)
        .bind(iso_now())
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;
        persisted.push(ArtifactOut {
            format: format.clone(),
            file_path: path_s,
            file_size_bytes: bytes.len(),
        });
    }

    set_status(db, &d.id, "complete", true).await;
    notify(db, d, execution_id, None).await;
    email(db, d, &built, execution_id).await;

    let details = json!({
        "triggeredBy": p.triggered_by,
        "formats": d.formats,
        "rowCount": rows.len(),
        "executionMs": start.elapsed().as_millis(),
        "chartRendered": chart_data.is_some(),
    });
    if let Err(e) = log_audit(
        db,
        AuditEntry {
            user_id: Some(&d.created_by),
            action: "report:generated",
            resource_type: "nl_report_definition",
            resource_id: Some(&d.id),
            details: Some(details),
            ..Default::default()
        },
    )
    .await
    {
        tracing::error!(error = %e, "Audit log error");
    }
    let limit = usize::try_from(env_int("REPORT_ROW_LIMIT", 10000)).unwrap_or(usize::MAX);
    let status = if rows.len() >= limit {
        "ROW_LIMIT_HIT"
    } else {
        "COMPLETE"
    };
    Ok(result(status, persisted, rows.len(), None))
}

/// Run one generation. Never errors: a failure is a `FAILED` result, and the
/// definition is marked `failed` when it was loaded.
pub async fn execute(db: &PgPool, p: &GenerationParams) -> GenerationResult {
    let start = Instant::now();
    let execution_id = uuid::Uuid::new_v4().to_string();
    let mut def = None;
    match run(db, p, &execution_id, &mut def, start).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "[report-generation-worker] Failed");
            if let Some(d) = &def {
                set_status(db, &d.id, "failed", false).await;
                notify(db, d, &execution_id, Some(&e)).await;
            }
            GenerationResult {
                status: "FAILED".into(),
                execution_id,
                artifacts: Vec::new(),
                row_count: 0,
                execution_ms: start.elapsed().as_millis(),
                error_message: Some(e),
            }
        }
    }
}

/// The queue worker the scheduler enqueues due definitions on.
pub struct ReportGenerationWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<GenerationParams> for ReportGenerationWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    fn class_name() -> String {
        "report-generation:execute".to_string()
    }

    async fn perform(&self, args: GenerationParams) -> Result<()> {
        let r = execute(pool(&self.ctx), &args).await;
        tracing::info!(
            report = %args.report_definition_id,
            status = %r.status,
            rows = r.row_count,
            "[scheduler] report generation finished"
        );
        Ok(())
    }
}
