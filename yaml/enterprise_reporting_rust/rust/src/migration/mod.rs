//! Schema ownership.
//!
//! While the Node backend is alive, `src/lib/db/bootstrap.ts` owns the config
//! database schema and both services run the same idempotent DDL
//! (MIGRATION_PLAN.md §2.2). The baseline migration is therefore generated from
//! bootstrap.ts (`bun rust/parity/extract-baseline.ts`), never hand-edited, and
//! is safe to run against a database Node has already bootstrapped.
use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(Baseline), Box::new(CronTicks)]
    }
}

/// The DDL `bootstrapSchema()` runs: every table, the post-hoc `ALTER`s and the
/// indexes. All of it is `IF NOT EXISTS`, so order of first boot between Node
/// and Rust does not matter.
pub const BASELINE_SQL: &str = include_str!("../../migration/sql/0001_baseline.sql");

pub struct Baseline;

impl MigrationName for Baseline {
    fn name(&self) -> &str {
        "m20260923_000001_bootstrap_baseline"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Baseline {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.get_connection().execute_unprepared(BASELINE_SQL).await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // The baseline is shared with the Node service; dropping it from here
        // would take the other backend's data with it.
        Err(DbErr::Migration(
            "the bootstrap baseline is shared with the Node backend and is never rolled back".to_string(),
        ))
    }
}

/// Rust-owned: the minutes `cron_tick` has claimed, so a second scheduler
/// replica is a no-op (MIGRATION_PLAN.md §6.3). Not part of the Node schema.
pub struct CronTicks;

impl MigrationName for CronTicks {
    fn name(&self) -> &str {
        "m20260923_000002_ers_cron_ticks"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for CronTicks {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE TABLE IF NOT EXISTS ers_cron_ticks (minute TIMESTAMPTZ PRIMARY KEY)")
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ers_cron_ticks")
            .await?;
        Ok(())
    }
}
