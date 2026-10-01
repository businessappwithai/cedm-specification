//! `cargo loco task seed_workflows` — install the model's saga workflows.
//!
//! A `kind: saga` section in the model compiles to a BPMN process; the
//! generator writes them all to `seed/workflows.sql` and this task applies it.
//!
//! **Why this is a seed rather than a migration**, for the same reason the
//! dictionary is: it is re-runnable. A model that gains a workflow, or changes
//! one, must be able to top up a database that has already migrated — which a
//! migration, recorded as applied, could never do.
//!
//! The definitions are upserted by name and marked `is_model_managed`. That
//! flag is what keeps regeneration from quietly destroying work: the Workflow
//! Designer shows a model-managed definition read-only, so nobody edits one
//! only to have the next generation overwrite it. A workflow drawn in the
//! designer carries no flag and is never touched here.

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;

/// The generated workflow definitions. Regenerate rather than edit.
const WORKFLOWS_SQL: &str = include_str!("../../seed/workflows.sql");

/// The moves the model's state machines declare.
///
/// Applied by this task rather than its own because the two are halves of one
/// idea: a definition says what runs, an edge says what may happen. Both are
/// `include_str!`, so both are always emitted even for a model that declares
/// neither.
const TRANSITIONS_SQL: &str = include_str!("../../seed/transitions.sql");

pub struct SeedWorkflows;

#[async_trait]
impl Task for SeedWorkflows {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_workflows".to_string(),
            detail: "Install model-declared workflows and state-machine edges".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One call for the whole file, so a failure part-way leaves the table
        // untouched rather than half seeded — as the dictionary seed does.
        ctx.db.execute_unprepared(WORKFLOWS_SQL).await?;
        ctx.db.execute_unprepared(TRANSITIONS_SQL).await?;

        let (definitions, edges): (i64, i64) = sqlx::query_as(
            r"SELECT (SELECT COUNT(*) FROM sys_workflow_definitions WHERE is_model_managed),
                     (SELECT COUNT(*) FROM sys_workflow_transitions WHERE is_active)",
        )
        .fetch_one(ctx.db.get_postgres_connection_pool())
        .await
        .map_err(|err| Error::Message(format!("workflow seed verification failed: {err}")))?;

        println!(
            "Model-declared workflows installed: {definitions} definition(s), \
             {edges} state-machine edge(s)"
        );
        Ok(())
    }
}
