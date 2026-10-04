//! `sys_workflow_states` and `sys_table.concurrency_mode` — what closes a record, and how two edits of one are reconciled.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!(
                "../sql/m0020_workflow_states_and_concurrency.up.sql"
            ))
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(include_str!(
                "../sql/m0020_workflow_states_and_concurrency.down.sql"
            ))
            .await?;
        Ok(())
    }
}
