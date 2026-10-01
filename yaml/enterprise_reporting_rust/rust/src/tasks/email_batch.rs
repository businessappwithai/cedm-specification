//! `email_batch query_id:<id> template_id:<id> recipient_query_id:<id>
//! column:<email column> user_id:<id> [format:csv] [report_name:<name>]` —
//! run the `email:batch` job in the foreground and print its result.
use loco_rs::prelude::*;

use crate::workers::email_batch::{process, EmailBatchJobData};

pub struct EmailBatch;

#[async_trait]
impl Task for EmailBatch {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "email_batch".to_string(),
            detail:
                "Run email:batch now: email_batch query_id:<id> template_id:<id> recipient_query_id:<id> \
                     column:<email column> user_id:<id> [format:csv] [report_name:<name>]"
                    .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let opt = |k: &str| vars.cli_arg(k).ok().map(ToString::to_string);
        let data = EmailBatchJobData {
            query_id: vars.cli_arg("query_id")?.to_string(),
            email_template_id: vars.cli_arg("template_id")?.to_string(),
            recipient_query_id: vars.cli_arg("recipient_query_id")?.to_string(),
            recipient_email_column: vars.cli_arg("column")?.to_string(),
            user_id: vars.cli_arg("user_id")?.to_string(),
            format: opt("format"),
            report_name: opt("report_name"),
            parameters: None,
        };
        println!(
            "{}",
            serde_json::to_string(&process(ctx, &data).await).unwrap_or_default()
        );
        Ok(())
    }
}
