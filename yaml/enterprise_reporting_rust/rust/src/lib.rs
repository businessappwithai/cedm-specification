//! Enterprise Reporting backend on Loco.rs.
//!
//! This crate is the Rust port of the Node backend (TanStack Start API routes,
//! server functions, Trigger.dev workers and the on-premise cron runner). See
//! `MIGRATION_PLAN.md` for the plan and the compatibility contracts every
//! module here is written against.

pub mod app;
pub mod auth;
pub mod bootstrap;
pub mod common;
pub mod controllers;
pub mod datasources;
pub mod email;
pub mod embeddings;
pub mod graph;
pub mod metadata;
pub mod migration;
pub mod monitoring;
pub mod nlquery;
pub mod permissions;
pub mod render;
pub mod reportgen;
pub mod reporting;
pub mod security;
pub mod sql;
pub mod tasks;
pub mod workers;
