/**
 * The generated application's event catalogue, derived from the canonical spec.
 *
 * `packages/core/src/logging/log-spec.json` states what this product logs. The
 * generated backend is a Rust crate and cannot read it: a JSON catalogue parsed
 * at startup, to say what `tracing` already says, would be a translation layer
 * rather than a shared contract. So the catalogue is *derived* into Rust here,
 * at generation time — **not** written as a template, because a template is a
 * second copy and two copies of a catalogue drift.
 *
 * Channels whose `surfaces` do not include `generated` are filtered out: the
 * pipeline's own events have no meaning inside a generated application, and a
 * catalogue offering them would invite a call site that can never fire.
 *
 * What comes out is one `log_event!` macro over `tracing`. Loco already
 * installs a subscriber and already writes JSON — a second logger would be a
 * second destination and two half-flushed streams — so this adds a vocabulary,
 * not a transport. A call site names an event:
 *
 *     log_event!(rules_action_unknown, action = other);
 *
 * and the level, the message and the `event` field come from the spec. The
 * level has to be resolved at generation time because `tracing`'s macros take
 * it as a literal, which is the whole reason this is generated rather than
 * looked up at run time.
 */

import { logSpec } from "@appwithai/core/logging";

/** `rules.action.unknown` → `rules_action_unknown`, a legal macro matcher. */
export function macroArm(eventId: string): string {
  return eventId.replace(/[.-]/g, "_");
}

/** The channels a generated application actually has. */
function generatedChannels(): string[] {
  return logSpec.channels
    .filter((channel) => channel.surfaces.includes("generated"))
    .map((channel) => channel.name);
}

/** The events a generated application may emit, in catalogue order. */
export function generatedEvents() {
  const channels = new Set(generatedChannels());
  return logSpec.events.filter((event) => channels.has(event.channel));
}

/** `tracing`'s macro for a spec level. `fatal` has no counterpart; it is an error. */
function tracingMacro(level: string): string {
  // `tracing` has five levels and the spec has six. A fatal event is emitted at
  // error with its own id, which is what actually distinguishes it — inventing
  // a sixth level would mean a subscriber that filters on it, and Loco's does
  // not.
  return level === "fatal" ? "error" : level;
}

/** A Rust string literal: the messages are ours, but quoting them is not optional. */
function rustString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * `src/common/logging.rs` — the catalogue as a macro.
 *
 * Two arms per event rather than one with an optional tail: `tracing`'s macros
 * reject the empty expansion a single arm would produce for an event with no
 * fields (`error!(event = "x", , "message")`), and an event with no fields is
 * not the rare case — half the catalogue's failures have nothing useful to say
 * beyond having happened.
 */
export function buildGeneratedLoggingModule(projectName: string): string {
  const events = generatedEvents();
  const out: string[] = [];

  out.push("//! The event catalogue this application logs against.");
  out.push("//!");
  out.push(`//! Derived from the log specification for ${projectName}. Regenerate rather`);
  out.push("//! than edit: this file is generated from");
  out.push("//! `packages/core/src/logging/log-spec.json`, which is where an event's");
  out.push("//! level and message are decided, and a change made here is lost on the next");
  out.push("//! run and disagrees with the catalogue in the meantime.");
  out.push("//!");
  out.push("//! A call site names what happened rather than a level and a sentence:");
  out.push("//!");
  out.push("//! ```ignore");
  out.push("//! log_event!(rules_action_unknown, action = other);");
  out.push("//! ```");
  out.push("//!");
  out.push("//! Every line carries an `event` field, so a query can ask for one kind of");
  out.push("//! event without matching on wording that is free to change. The transport is");
  out.push("//! Loco's own subscriber — this adds a vocabulary, not a second logger.");
  out.push("");
  out.push("/// Emit a catalogued event through `tracing`.");
  out.push("///");
  out.push("/// The macro is exported at the crate root, so call sites write");
  out.push("/// `crate::log_event!(...)` from anywhere in the crate.");
  out.push("#[macro_export]");
  out.push("macro_rules! log_event {");

  for (const event of events) {
    const arm = macroArm(event.id);
    const level = tracingMacro(event.level);
    const id = rustString(event.id);
    const message = rustString(event.message);

    out.push(`    // ${event.channel} — ${event.level}`);
    out.push(`    (${arm}) => {`);
    out.push(`        ::tracing::${level}!(event = ${id}, ${message})`);
    out.push("    };");
    out.push(`    (${arm}, $($field:tt)+) => {`);
    out.push(`        ::tracing::${level}!(event = ${id}, $($field)+, ${message})`);
    out.push("    };");
  }

  out.push("}");
  out.push("");
  out.push("/// Every event id this catalogue defines, for the suite that checks it.");
  out.push("///");
  out.push("/// A list rather than a doc comment: a test can read it, and a catalogue");
  out.push("/// nothing can enumerate is one nothing can hold to the spec.");
  out.push(`pub const EVENT_IDS: [&str; ${events.length}] = [`);
  for (const event of events) {
    out.push(`    ${rustString(event.id)},`);
  }
  out.push("];");
  out.push("");

  return out.join("\n");
}

export default buildGeneratedLoggingModule;
