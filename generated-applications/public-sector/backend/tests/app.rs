//! The integration-test binary for public-sector.
//!
//! Cargo turns every top-level file in `tests/` into its own test binary. This
//! is the only one, so `support` and `requests` are ordinary modules that all
//! the suites share — rather than the copy-per-file the alternative would need.
//!
//! Everything here boots the real application through
//! `loco_rs::testing::request`, which builds the same axum router
//! `cargo loco start` serves. The suites therefore exercise the middleware
//! stack, the JWT extractors and the Application Dictionary exactly as a
//! deployed instance would — no server process, no separate toolchain.
//!
//! Generated: 2026-10-09T08:32:27.239Z
//! Project: public-sector

mod requests;
mod support;
