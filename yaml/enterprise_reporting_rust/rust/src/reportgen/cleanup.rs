//! `cleanupExpiredReportArtifacts` (`src/lib/report-generation/report-cleanup.ts`):
//! delete artifacts older than `REPORT_ARTIFACT_RETENTION_DAYS` (default
//! 90) — the file, its now-empty execution and definition directories, and
//! the row.
use std::path::Path;

use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub deleted_files: usize,
    pub deleted_records: usize,
    pub errors: Vec<String>,
}

async fn is_empty_dir(dir: &Path) -> bool {
    match tokio::fs::read_dir(dir).await {
        Ok(mut it) => matches!(it.next_entry().await, Ok(None)),
        Err(_) => false,
    }
}

/// Never errors; failures are listed in `errors`.
pub async fn cleanup_expired(db: &PgPool) -> CleanupResult {
    let days = std::env::var("REPORT_ARTIFACT_RETENTION_DAYS")
        .ok()
        .and_then(|v| crate::common::pagination::js_parse_int(&v))
        .unwrap_or(90);
    let cutoff = (chrono::Utc::now() - chrono::Duration::days(days))
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();
    let mut r = CleanupResult::default();
    let expired: Vec<(String, String)> = match sqlx::query_as(
        "SELECT id, file_path FROM generated_report_artifacts WHERE created_at < CAST($1 AS TIMESTAMP)",
    )
    .bind(&cutoff)
    .fetch_all(db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => {
            r.errors.push(format!("Cleanup failed: {e}"));
            return r;
        }
    };
    if expired.is_empty() {
        return r;
    }
    tracing::info!(
        "[report-cleanup] Found {} expired artifact(s) older than {days} days",
        expired.len()
    );
    let mut dirs = std::collections::BTreeSet::new();
    for (_, path) in &expired {
        match tokio::fs::remove_file(path).await {
            Ok(()) => {
                r.deleted_files += 1;
                if let Some(d) = Path::new(path).parent() {
                    dirs.insert(d.to_path_buf());
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => r.errors.push(format!("Failed to delete {path}: {e}")),
        }
    }
    for dir in dirs {
        if is_empty_dir(&dir).await && tokio::fs::remove_dir(&dir).await.is_ok() {
            if let Some(parent) = dir.parent() {
                if is_empty_dir(parent).await {
                    let _ = tokio::fs::remove_dir(parent).await;
                }
            }
        }
    }
    let ids: Vec<String> = expired.into_iter().map(|(id, _)| id).collect();
    for batch in ids.chunks(500) {
        match sqlx::query("DELETE FROM generated_report_artifacts WHERE id = ANY($1)")
            .bind(batch)
            .execute(db)
            .await
        {
            Ok(_) => r.deleted_records += batch.len(),
            Err(e) => {
                r.errors.push(format!("Cleanup failed: {e}"));
                break;
            }
        }
    }
    tracing::info!(
        "[report-cleanup] Deleted {} file(s), {} record(s), {} error(s)",
        r.deleted_files,
        r.deleted_records,
        r.errors.len()
    );
    r
}
