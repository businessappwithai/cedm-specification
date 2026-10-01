//! SeaORM models.
//!
//! `sys_*` and auth tables get real, compile-time-typed entities: their shape
//! is fixed by the dictionary design and known at generation time. `bus_*`
//! tables deliberately do not — their shape comes from the user's ERD and the
//! runtime contract is inherently dynamic, so they are reached through
//! `services::dynamic_repo` instead (§5.2, decision 2).

pub mod _entities;
pub mod users;
