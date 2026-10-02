//! `cargo loco task seed_system` — install the settable configuration keys.
//!
//! The rows are what an operator may change without a redeploy, and what the
//! admin screen lists. Every one but the two the model names is seeded empty:
//! `services::system_config` falls through an empty row to Loco's own
//! `settings` block, so applying this file changes no behaviour at all.
//!
//! **Seeding installs; it does not overwrite.** Each statement is
//! `ON CONFLICT DO NOTHING` over a deterministic id and a unique `config_key`,
//! so regenerating an application never discards a value somebody set through
//! the admin screen — which is the whole point of the table.
//!
//! Generated: 2026-10-02T17:26:16.918Z
//! Project: travel

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;

/// The generated settings. Regenerate rather than edit.
const SYSTEM_SQL: &str = include_str!("../../seed/system.sql");

pub struct SeedSystem;

#[async_trait]
impl Task for SeedSystem {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_system".to_string(),
            detail: "Install the settable configuration keys into sys_system".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One call for the whole file, so a failure part-way leaves the table
        // untouched rather than half seeded.
        ctx.db.execute_unprepared(SYSTEM_SQL).await?;

        let installed: Option<(i64,)> =
            sqlx::query_as("SELECT COUNT(*) FROM sys_system WHERE is_active")
                .fetch_optional(ctx.db.get_postgres_connection_pool())
                .await
                .map_err(|err| Error::Message(format!("counting settings: {err}")))?;

        println!(
            "✓ Configuration installed ({} active key(s) in sys_system)",
            installed.map_or(0, |row| row.0)
        );
        Ok(())
    }
}
