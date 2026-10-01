//! `cargo loco task seed_business` — demonstration records for the model's
//! own entities.
//!
//! A freshly migrated application has a complete dictionary and empty business
//! tables, so every list opens on nothing and no lookup has anything to offer.
//! This is what puts rows behind them.
//!
//! Nothing in the file is invented: a column bound to an enum takes one of
//! that enum's declared values, a status column backing a state machine takes
//! the machine's initial state, and a foreign key takes the id of a row the
//! same file inserted above it. Referential integrity is left switched on, so
//! a seed that got the order wrong fails here rather than filling the tables
//! with references to nothing.
//!
//! **Seeding installs; it does not overwrite.** Ids are deterministic and every
//! statement is `ON CONFLICT DO NOTHING`, so re-running adds nothing and a
//! record somebody edited keeps their edit.
//!
//! Generated: 2026-10-01T05:19:06.044Z
//! Project: quality

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;

/// The generated records. Regenerate rather than edit.
const BUSINESS_SQL: &str = include_str!("../../seed/business.sql");

pub struct SeedBusiness;

#[async_trait]
impl Task for SeedBusiness {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_business".to_string(),
            detail: "Install demonstration records for the model's entities".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One call for the whole file. A foreign key that does not resolve
        // aborts the lot rather than leaving half the entities populated and
        // half of them empty, which would look like a generator that skipped
        // some tables rather than a seed with its order wrong.
        ctx.db.execute_unprepared(BUSINESS_SQL).await?;

        println!("✓ Demonstration records installed");
        Ok(())
    }
}
