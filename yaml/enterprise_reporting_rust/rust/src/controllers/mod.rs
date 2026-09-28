//! One module per `/api/<area>`. Each handler reproduces its Node twin's
//! status codes and envelope exactly (MIGRATION_PLAN.md §4.1); where a Node
//! route has a quirk, the handler says so and the plan's §9 lists it.
pub mod adk;
pub mod admin;
pub mod auth;
pub mod charts;
pub mod copilotkit;
pub mod dashboards;
pub mod data_sources;
pub mod filters;
pub mod health;
pub mod help;
pub mod jobs;
pub mod logs;
pub mod metadata;
pub mod monitoring;
pub mod nl_builder;
pub mod nl_query;
pub mod notifications;
pub mod owned;
pub mod queries;
pub mod report_export;
pub mod report_generation;
pub mod reports;
pub mod schema_instructions;
pub mod settings;
pub mod share;
pub mod sql;
pub mod support;
