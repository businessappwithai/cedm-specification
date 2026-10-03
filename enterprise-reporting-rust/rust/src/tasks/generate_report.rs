//! `generate_report report_id:<id> user_id:<id> [format:csv]` — run the
//! `report:generate` job in the foreground and print its result.
use loco_rs::prelude::*;

use crate::workers::report::{process, ReportJobData};

pub struct GenerateReport;

#[async_trait]
impl Task for GenerateReport {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "generate_report".to_string(),
            detail: "Run report:generate now: generate_report report_id:<id> user_id:<id> [format:csv]"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let data = ReportJobData {
            report_id: vars.cli_arg("report_id")?.to_string(),
            user_id: vars.cli_arg("user_id")?.to_string(),
            parameters: None,
            format: vars.cli_arg("format").ok().map(ToString::to_string),
        };
        println!(
            "{}",
            serde_json::to_string(&process(ctx, &data).await).unwrap_or_default()
        );
        Ok(())
    }
}
