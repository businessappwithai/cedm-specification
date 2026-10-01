//! The rules the *model* declared, and whether they reached the application.
//!
//! Generated: 2026-10-01T04:35:27.803Z
//! Project: regulatory
//!
//! Every other rules suite creates a rule through the API and then checks that
//! the API has it — which proves the endpoint round-trips and nothing else. A
//! rule that the generator compiled, wrote to `seed/rules.sql`, and
//! never applied would pass all of them: `sys_rule_definitions` existed, the
//! controller read it, the admin editor edited it, and for a long time nothing
//! ever put a model's row in it.
//!
//! So this asserts against the **model**, not against what the application
//! happens to contain. The expectations below are rendered from
//! `compiledRules`, the same list the seed is written from — which is the point
//! the assertion can be made at all: a rule dropped anywhere between the
//! rule and the database leaves the seed short, and this suite names it.

//! This model declares no rules, so there is nothing to assert.
//! The file is still emitted: `tests/requests/mod.rs` declares the module
//! unconditionally, and a missing one does not compile.
