//! Application Dictionary tables (`sys_*`).
//!
//! The SQL is extracted verbatim from the TypeScript stack's
//! `001_create_sys_tables.ts` so both backends produce the same schema.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!("../sql/m0001_sys_tables.up.sql"))
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!("../sql/m0001_sys_tables.down.sql"))
            .await?;
        Ok(())
    }
}
