//! The state machines the *model* drew, and whether the API enforces them.
//!
//! Generated: 2026-10-01T05:18:31.745Z
//! Project: maintenance
//!
//! `requests/rbac.rs` proves the topology guard works by seeding an edge of its
//! own. This proves the edges the model declared actually reached the database
//! — the same distinction as `model_rules.rs`: a diagram the generator compiled
//! and never seeded leaves a status column accepting any string, and every
//! other suite passes, because none of them tries an illegitimate move.

//! This model declares no state machines, so there is
//! nothing to assert. The file is still emitted: `tests/requests/mod.rs`
//! declares the module unconditionally, and a missing one does not compile.
