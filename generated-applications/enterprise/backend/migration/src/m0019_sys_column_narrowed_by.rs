//! `sys_column.narrowed_by` — the columns of a record that narrow a lookup's choices.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!("../sql/m0019_sys_column_narrowed_by.up.sql"))
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!("../sql/m0019_sys_column_narrowed_by.down.sql"))
            .await?;
        Ok(())
    }
}
