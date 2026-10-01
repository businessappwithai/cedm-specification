//! Long-running report generation, replacing `src/trigger/report.task.ts`.

use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportArgs {
    pub entity: String,
    pub requested_by: Option<String>,
}

pub struct ReportWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<ReportArgs> for ReportWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    async fn perform(&self, args: ReportArgs) -> Result<()> {
        // Report *content* is application-specific and intentionally left to
        // the generated project; what the generator provides is the wiring.
        crate::log_event!(jobs_queued, worker = "report", entity = args.entity);
        Ok(())
    }
}
