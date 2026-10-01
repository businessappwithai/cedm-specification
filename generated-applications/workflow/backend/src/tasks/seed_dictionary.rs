//! `cargo loco task seed_dictionary` — populate the Application Dictionary.
//!
//! The Rust counterpart of the TypeScript stack's `01_sys_references` +
//! `02_sys_dictionary` + `02b_entity_categories` seeds. Those three run as
//! Kysely scripts; there is no TypeScript here, so the generator emits their
//! combined output as `seed/dictionary.sql` and this task applies it.
//!
//! **Why this is not a migration.** The dictionary describes the business
//! tables, and administrators are expected to edit it at runtime — reordering a
//! field, rewording help, revoking a role's access. Migrations run once and are
//! recorded as applied; a seed is re-runnable. Putting the dictionary in a
//! migration would mean a regenerated model could never top up the dictionary
//! of a database that had already migrated.
//!
//! The SQL is embedded with `include_str!`, so the binary carries its own seed
//! and `cargo loco task seed_dictionary` works from any working directory —
//! including inside a container that ships only the compiled binary.

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;

/// The generated dictionary rows. Regenerate rather than edit.
const DICTIONARY_SQL: &str = include_str!("../../seed/dictionary.sql");

pub struct SeedDictionary;

#[async_trait]
impl Task for SeedDictionary {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_dictionary".to_string(),
            detail: "Populate sys_* Application Dictionary metadata for workflow".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One `execute_unprepared` for the whole file: Postgres' simple query
        // protocol runs the statements in a single implicit transaction, so a
        // failure part-way leaves the dictionary untouched rather than half
        // seeded. This is the same call the migrations use.
        ctx.db.execute_unprepared(DICTIONARY_SQL).await?;

        let counts: Vec<(String, i64)> = sqlx::query_as(
            r"SELECT 'sys_reference', COUNT(*) FROM sys_reference
              UNION ALL SELECT 'sys_table',  COUNT(*) FROM sys_table
              UNION ALL SELECT 'sys_column', COUNT(*) FROM sys_column
              UNION ALL SELECT 'sys_window', COUNT(*) FROM sys_window
              UNION ALL SELECT 'sys_tab',    COUNT(*) FROM sys_tab
              UNION ALL SELECT 'sys_field',  COUNT(*) FROM sys_field
              UNION ALL SELECT 'sys_role',   COUNT(*) FROM sys_role
              UNION ALL SELECT 'sys_access', COUNT(*) FROM sys_access",
        )
        .fetch_all(ctx.db.get_postgres_connection_pool())
        .await
        .map_err(|err| Error::Message(format!("dictionary seed verification failed: {err}")))?;

        println!("Application Dictionary seeded:");
        for (table, count) in counts {
            println!("  {table:<14} {count}");
        }

        Ok(())
    }
}
