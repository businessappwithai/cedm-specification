#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
//! Database migrations for regulatory.
//!
//! The DDL is deliberately raw SQL rather than SeaORM's schema DSL. The
//! generated Postgres schema is a contract shared with the `tanstackjs-nestjs`
//! stack — a database created by either backend must be servable by the other
//! — and raw SQL is the only way to guarantee that mechanically. The static
//! `sys_*` DDL is extracted verbatim from the TypeScript migrations; see
//! `sql/` and docs/MIGRATION-LOCO-ASTRYX.md §6.14.

pub use sea_orm_migration::prelude::*;

mod m0000_auth_users;
mod m0001_sys_tables;
mod m0002_bus_tables;
mod m0003_workflow_support;
mod m0004_workflow_definitions;
mod m0005_sys_category;
mod m0006_audit_log;
mod m0007_audit_hash_chain;
mod m0008_model_managed_workflows;
mod m0009_sys_access_control;
mod m0010_dictionary_role_scope;
mod m0011_sys_report_designs;
mod m0012_sys_note;
mod m0013_workflow_definition_source;
mod m0014_sys_system;
mod m0015_sys_report;
mod m0016_sys_window_icon;
mod m0017_workflow_definition_yaml;
mod m0018_sys_column_ref_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m0000_auth_users::Migration),
            Box::new(m0001_sys_tables::Migration),
            Box::new(m0002_bus_tables::Migration),
            Box::new(m0003_workflow_support::Migration),
            Box::new(m0004_workflow_definitions::Migration),
            Box::new(m0005_sys_category::Migration),
            Box::new(m0006_audit_log::Migration),
            Box::new(m0007_audit_hash_chain::Migration),
            Box::new(m0008_model_managed_workflows::Migration),
            Box::new(m0009_sys_access_control::Migration),
            Box::new(m0010_dictionary_role_scope::Migration),
            Box::new(m0011_sys_report_designs::Migration),
            Box::new(m0012_sys_note::Migration),
            Box::new(m0013_workflow_definition_source::Migration),
            Box::new(m0014_sys_system::Migration),
            Box::new(m0015_sys_report::Migration),
            Box::new(m0016_sys_window_icon::Migration),
            Box::new(m0017_workflow_definition_yaml::Migration),
            Box::new(m0018_sys_column_ref_table::Migration),
        ]
    }
}
