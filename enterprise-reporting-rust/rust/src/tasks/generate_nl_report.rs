//! `generate_nl_report id:<definition id> [triggered_by:manual]` — run one
//! NL report generation in the foreground and print its result.
use loco_rs::prelude::*;

use crate::{
    common::db::pool,
    reportgen::worker::{execute, GenerationParams},
};

pub struct GenerateNlReport;

#[async_trait]
impl Task for GenerateNlReport {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "generate_nl_report".to_string(),
            detail: "Run an NL report definition now: generate_nl_report id:<id> [triggered_by:manual]"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let params = GenerationParams {
            report_definition_id: vars.cli_arg("id")?.to_string(),
            triggered_by: vars
                .cli_arg("triggered_by")
                .map_or_else(|_| "manual".to_string(), ToString::to_string),
        };
        println!(
            "{}",
            serde_json::to_string(&execute(pool(ctx), &params).await).unwrap_or_default()
        );
        Ok(())
    }
}
