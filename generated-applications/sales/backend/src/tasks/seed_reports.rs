//! `cargo loco task seed_reports` — install the model's own questions.
//!
//! One row in `sys_report` per report the model declared. A model
//! that declares none installs nothing and says so, rather than inventing a
//! report: the reports screen is then empty, which is the truth about that
//! model.
//!
//! **Seeding installs; it does not overwrite.** Each statement is
//! `ON CONFLICT DO NOTHING` over a deterministic id and a unique name, so
//! regenerating an application never discards a report somebody edited in the
//! database — and never duplicates one.
//!
//! Runs last among the seeds, because the queries read the business tables that
//! every seed before it has filled. Nothing here executes those queries; that
//! ordering matters only so the reports have something to answer with when
//! somebody opens one.
//!
//! Generated: 2026-10-01T16:23:21.282Z
//! Project: sales

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;

/// The generated reports. Regenerate rather than edit.
const REPORTS_SQL: &str = include_str!("../../seed/reports.sql");

pub struct SeedReports;

#[async_trait]
impl Task for SeedReports {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_reports".to_string(),
            detail: "Install the model's reports into sys_report".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One call for the whole file, so a failure part-way leaves the table
        // untouched rather than half seeded.
        ctx.db.execute_unprepared(REPORTS_SQL).await?;

        let installed: Option<(i64,)> = sqlx::query_as("SELECT COUNT(*) FROM sys_report")
            .fetch_optional(ctx.db.get_postgres_connection_pool())
            .await
            .map_err(|err| Error::Message(format!("counting reports: {err}")))?;

        let count = installed.map_or(0, |row| row.0);
        if count == 0 {
            println!("✓ No reports declared (this model declares none)");
        } else {
            println!("✓ Reports installed ({count} report(s) in sys_report)");
        }
        Ok(())
    }
}
