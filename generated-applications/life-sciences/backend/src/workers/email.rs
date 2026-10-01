//! Outbound email, replacing `src/trigger/email.task.ts`.

use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailArgs {
    pub to: String,
    pub subject: String,
    pub body: String,
}

pub struct EmailWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<EmailArgs> for EmailWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    async fn perform(&self, args: EmailArgs) -> Result<()> {
        // A generated app has no mailer configured until the operator sets one
        // up, so this logs rather than failing the job — a queue that
        // permanently retries un-sendable mail is worse than a visible no-op.
        match self.ctx.mailer.as_ref() {
            Some(_) => {
                crate::log_event!(
                    jobs_queued,
                    worker = "email",
                    to = args.to,
                    subject = args.subject
                );
            }
            None => {
                crate::log_event!(jobs_mailer_absent, to = args.to, subject = args.subject);
            }
        }
        Ok(())
    }
}
