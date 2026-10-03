//! NL report generation (`src/lib/report-generation/`): the generation
//! worker, its chart and RBAC checks, and the artifact retention cleanup.
pub mod chart;
pub mod cleanup;
pub mod rbac;
pub mod worker;
