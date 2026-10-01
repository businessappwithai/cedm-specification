//! `report_cleanup` — delete NL report artifacts past their retention now
//! (`cron_tick` also runs it at 02:00 UTC) and print what was removed.
use loco_rs::prelude::*;

use crate::{common::db::pool, reportgen::cleanup::cleanup_expired};

pub struct ReportCleanup;

#[async_trait]
impl Task for ReportCleanup {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "report_cleanup".to_string(),
            detail: "Delete NL report artifacts older than REPORT_ARTIFACT_RETENTION_DAYS (default 90)"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!(
            "{}",
            serde_json::to_string(&cleanup_expired(pool(ctx)).await).unwrap_or_default()
        );
        Ok(())
    }
}
