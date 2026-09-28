/**
 * The generated application's call sites and the spec, held together.
 *
 * The Rust compiler already covers one direction: `crate::log_event!(foo, …)`
 * naming an arm the catalogue does not define is a compile error in the
 * generated crate. But that error costs a generate and a three-minute `cargo
 * check` to see, and it arrives in a project rather than in this repository —
 * so the same mistake is caught here in three seconds instead.
 *
 * The other direction is the one nothing else can see: a template that still
 * writes `tracing::warn!(…)` with a level and a sentence compiles perfectly,
 * says something reasonable, and is simply absent from the catalogue. That is
 * how a specification stops being one.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { buildGeneratedLoggingModule, generatedEvents, macroArm } from "../generated-spec";

const BACKEND_SRC = join(
  import.meta.dirname,
  "../../../templates/tanstack-astryx-loco/backend/src"
);

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (entry.endsWith(".hbs") || entry.endsWith(".rs")) found.push(full);
  }
  return found;
}

const templates = walk(BACKEND_SRC);

describe("the generated application logs against the catalogue", () => {
  it("has templates to check, or it is proving nothing", () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it("names only events the spec declares", () => {
    const declared = new Set(generatedEvents().map((event) => macroArm(event.id)));
    const unknown: string[] = [];

    for (const file of templates) {
      const text = readFileSync(file, "utf-8");
      for (const match of text.matchAll(/log_event!\(\s*([a-z0-9_]+)/g)) {
        const arm = match[1] as string;
        if (!declared.has(arm)) unknown.push(`${relative(BACKEND_SRC, file)}: ${arm}`);
      }
    }

    expect(unknown, "these call sites name an event log-spec.json does not declare").toEqual([]);
  });

  it("leaves no call site writing a level and a sentence of its own", () => {
    // The macro expands to `::tracing::<level>!`, so the catalogue's own
    // generated module is the one file that may contain the raw form — and it
    // is generated, not a template, so it is not scanned here at all.
    const raw: string[] = [];
    for (const file of templates) {
      const text = readFileSync(file, "utf-8");
      for (const match of text.matchAll(/(?<!::)tracing::(info|warn|error|debug|trace)!/g)) {
        raw.push(`${relative(BACKEND_SRC, file)}: tracing::${match[1]}!`);
      }
    }

    expect(
      raw,
      "these write a level and a sentence directly; name an event in log-spec.json instead"
    ).toEqual([]);
  });

  it("declares an arm for every generated event, and each arm twice", () => {
    // Two arms per event: one for a call with fields and one without. A single
    // arm with an optional tail expands to `error!(event = "x", , "message")`
    // when there are no fields, which does not compile — and an event with
    // nothing to say beyond having happened is half the catalogue.
    const module = buildGeneratedLoggingModule("acme");
    for (const event of generatedEvents()) {
      const arm = macroArm(event.id);
      // Counted as arm definitions rather than as occurrences of the name: the
      // module's own doc comment shows a call, and matching that too made this
      // assert three where the macro has two.
      const arms = module
        .split("\n")
        .filter(
          (line) =>
            line.trim() === `(${arm}) => {` || line.trim() === `(${arm}, $($field:tt)+) => {`
        );
      expect(arms, `${event.id} should have two macro arms`).toHaveLength(2);
      expect(module).toContain(`event = "${event.id}"`);
    }
  });

  it("emits a fatal event at error, the loudest level tracing has", () => {
    const module = buildGeneratedLoggingModule("acme");
    for (const event of generatedEvents()) {
      if (event.level !== "fatal") continue;
      expect(module).toContain(`::tracing::error!(event = "${event.id}"`);
    }
  });
});
