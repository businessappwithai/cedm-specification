//! External-system sync, replacing `src/trigger/sync.task.ts`.

use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncArgs {
    pub entity: String,
    pub record_id: Option<String>,
}

pub struct SyncWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<SyncArgs> for SyncWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    async fn perform(&self, args: SyncArgs) -> Result<()> {
        crate::log_event!(jobs_queued, worker = "sync", entity = args.entity, record = ?args.record_id);
        Ok(())
    }
}
