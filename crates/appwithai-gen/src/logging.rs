//! The generated application's event catalogue, derived from the canonical spec.
//!
//! The TypeScript original is `packages/generator/src/logging/generated-spec.ts`,
//! and the two must agree byte for byte; `bun run parity` is what says they do.
//!
//! **The catalogue is read, not copied.** Both generators load
//! `packages/core/src/logging/log-spec.json` and emit from it. A table of
//! events written out here would be a third copy of a catalogue that already
//! has to agree in two places, and the whole point of a specification is that
//! there is one of it.

use std::path::Path;

use anyhow::{Context, Result};
use serde::Deserialize;

use crate::language::walk_up_for;

/// Where the specification lives, relative to any ancestor of the working dir.
const SPEC_PATH: &str = "packages/core/src/logging/log-spec.json";

#[derive(Debug, Deserialize)]
struct Spec {
    channels: Vec<Channel>,
    events: Vec<Event>,
}

#[derive(Debug, Deserialize)]
struct Channel {
    name: String,
    surfaces: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct Event {
    id: String,
    channel: String,
    level: String,
    message: String,
}

/// Load the specification, or fail.
///
/// Deliberately not falling back to a built-in catalogue the way `language.rs`
/// does. A missing language definition degrades to a smaller vocabulary and the
/// generator still emits something usable; a missing *log* catalogue would emit
/// a crate whose call sites name macro arms that are not there, and the failure
/// would surface as thirty compile errors in the generated project rather than
/// as one sentence here.
fn load(start: &Path) -> Result<Spec> {
    let path = walk_up_for(start, SPEC_PATH)
        .with_context(|| format!("could not find {SPEC_PATH} above {}", start.display()))?;
    let text =
        std::fs::read_to_string(&path).with_context(|| format!("reading {}", path.display()))?;
    serde_json::from_str(&text).with_context(|| format!("parsing {}", path.display()))
}

/// `rules.action.unknown` → `rules_action_unknown`, a legal macro matcher.
fn macro_arm(event_id: &str) -> String {
    event_id.replace(['.', '-'], "_")
}

/// `tracing`'s macro for a spec level.
///
/// `tracing` has five levels and the spec has six. A fatal event is emitted at
/// error carrying its own id, which is what actually distinguishes it: a sixth
/// level would need a subscriber that filters on it, and Loco's does not.
fn tracing_macro(level: &str) -> &str {
    if level == "fatal" {
        "error"
    } else {
        level
    }
}

/// A Rust string literal.
fn rust_string(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

/// `src/common/logging.rs` — the catalogue as a macro.
pub fn build_generated_logging_module(project_name: &str, start: &Path) -> Result<String> {
    let spec = load(start)?;
    let generated: std::collections::HashSet<&str> = spec
        .channels
        .iter()
        .filter(|channel| {
            channel
                .surfaces
                .iter()
                .any(|surface| surface == "generated")
        })
        .map(|channel| channel.name.as_str())
        .collect();
    let events: Vec<&Event> = spec
        .events
        .iter()
        .filter(|event| generated.contains(event.channel.as_str()))
        .collect();

    let mut out: Vec<String> = Vec::new();
    out.push("//! The event catalogue this application logs against.".to_string());
    out.push("//!".to_string());
    out.push(format!(
        "//! Derived from the log specification for {project_name}. Regenerate rather"
    ));
    out.push("//! than edit: this file is generated from".to_string());
    out.push(
        "//! `packages/core/src/logging/log-spec.json`, which is where an event's".to_string(),
    );
    out.push(
        "//! level and message are decided, and a change made here is lost on the next".to_string(),
    );
    out.push("//! run and disagrees with the catalogue in the meantime.".to_string());
    out.push("//!".to_string());
    out.push("//! A call site names what happened rather than a level and a sentence:".to_string());
    out.push("//!".to_string());
    out.push("//! ```ignore".to_string());
    out.push("//! log_event!(rules_action_unknown, action = other);".to_string());
    out.push("//! ```".to_string());
    out.push("//!".to_string());
    out.push(
        "//! Every line carries an `event` field, so a query can ask for one kind of".to_string(),
    );
    out.push(
        "//! event without matching on wording that is free to change. The transport is"
            .to_string(),
    );
    out.push(
        "//! Loco's own subscriber — this adds a vocabulary, not a second logger.".to_string(),
    );
    out.push(String::new());
    out.push("/// Emit a catalogued event through `tracing`.".to_string());
    out.push("///".to_string());
    out.push("/// The macro is exported at the crate root, so call sites write".to_string());
    out.push("/// `crate::log_event!(...)` from anywhere in the crate.".to_string());
    out.push("#[macro_export]".to_string());
    out.push("macro_rules! log_event {".to_string());

    for event in &events {
        let arm = macro_arm(&event.id);
        let level = tracing_macro(&event.level);
        let id = rust_string(&event.id);
        let message = rust_string(&event.message);

        out.push(format!("    // {} — {}", event.channel, event.level));
        out.push(format!("    ({arm}) => {{"));
        out.push(format!(
            "        ::tracing::{level}!(event = {id}, {message})"
        ));
        out.push("    };".to_string());
        out.push(format!("    ({arm}, $($field:tt)+) => {{"));
        out.push(format!(
            "        ::tracing::{level}!(event = {id}, $($field)+, {message})"
        ));
        out.push("    };".to_string());
    }

    out.push("}".to_string());
    out.push(String::new());
    out.push(
        "/// Every event id this catalogue defines, for the suite that checks it.".to_string(),
    );
    out.push("///".to_string());
    out.push(
        "/// A list rather than a doc comment: a test can read it, and a catalogue".to_string(),
    );
    out.push("/// nothing can enumerate is one nothing can hold to the spec.".to_string());
    out.push(format!("pub const EVENT_IDS: [&str; {}] = [", events.len()));
    for event in &events {
        out.push(format!("    {},", rust_string(&event.id)));
    }
    out.push("];".to_string());
    out.push(String::new());

    Ok(out.join("\n"))
}

/// `src/common/mod.rs`. One line, so it is stated here rather than templated.
pub const COMMON_MOD_RS: &str =
    "//! Cross-cutting pieces the rest of the crate uses.\n\npub mod http_log;\npub mod logging;\npub mod rate_limit;\n";
