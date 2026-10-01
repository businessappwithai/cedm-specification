//! Background workers.
//!
//! Decision D3: Trigger.dev is dropped entirely. Loco's queue provides the same
//! durability without a paid external dependency and without the two extra env
//! vars, and it adds process separation — `cargo loco start --worker` runs the
//! job tier on its own.
//!
//! The queue mode is configuration, not code (`workers.mode` in config/*.yaml):
//!
//! | mode              | behaviour                        | used for        |
//! |-------------------|----------------------------------|-----------------|
//! | ForegroundBlocking| inline, in-process               | test            |
//! | BackgroundAsync   | tokio tasks, no external service | development     |
//! | BackgroundQueue   | Postgres-backed durable queue    | production      |
//!
//! **Entity promotion is deliberately not here.** It is a synchronous business
//! decision whose result the create/update response must carry, so it runs
//! inline in `services::promotion`. See §6.7 option A.

pub mod email;
pub mod report;
pub mod sync;
