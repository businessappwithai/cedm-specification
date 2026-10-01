//! `evaluate_rule rule_id=<id>` — run one monitoring evaluation in the
//! foreground and print the outcome. The operator's "run it now", and what the
//! parity harness uses to compare a Node and a Rust evaluation of one rule.
use loco_rs::prelude::*;

use crate::workers::monitoring_evaluate::{execute_monitoring_evaluation, MonitoringEvaluatePayload};

pub struct EvaluateRule;

#[async_trait]
impl Task for EvaluateRule {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "evaluate_rule".to_string(),
            detail: "Evaluate one monitoring rule now: evaluate_rule rule_id=<id>".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let rule_id = vars.cli_arg("rule_id")?.to_string();
        let outcome = execute_monitoring_evaluation(
            ctx,
            &MonitoringEvaluatePayload {
                rule_id,
                triggered_by: Some("manual".into()),
            },
        )
        .await
        .map_err(|e| Error::string(&e))?;
        println!("{}", serde_json::to_string(&outcome).unwrap_or_default());
        Ok(())
    }
}
