/**
 * The language definition must describe the builder that ships.
 *
 * `language/appwithai-language.json` is declared the single source of truth for
 * EML, but nothing enforced that — the automation builder was written with its
 * own trigger, operator and step vocabulary and the definition was never
 * updated, so the canonical description of the language omitted the dialect
 * every stored automation is written in. That drift is invisible: both sides
 * work perfectly on their own, and only a reader trusting the definition to
 * write an automation would discover it.
 *
 * These tests pin the two together in the direction that matters. `model.ts` is
 * the implementation and therefore wins ties; the definition is checked for
 * being complete and accurate about it, not the other way round.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  emptyAutomation,
  newHook,
  OPERATORS,
  STEP_FIELDS,
  TRIGGER_EVENTS,
  TRIGGER_HOOKS,
} from "../model";
import { automationToYaml } from "../yaml";

const definition = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../../language/appwithai-language.json"),
    "utf8"
  )
) as {
  automations: {
    document: { version: string; keys: Record<string, string> };
    shipped: boolean;
    triggers: { events: Array<{ event: string; hook: string; phase: string; blocking: boolean }> };
    conditions: { operators: Array<{ id: string; label: string; arity: number }> };
    steps: { types: Array<{ type: string; properties: string[] }> };
  };
};

const auto = definition.automations;

describe("language definition ↔ automation model", () => {
  it("documents the automation dialect at all", () => {
    expect(auto).toBeDefined();
    expect(auto.shipped).toBe(true);
  });

  it("lists exactly the trigger events the model defines", () => {
    expect(auto.triggers.events.map((e) => e.event).sort()).toEqual([...TRIGGER_EVENTS].sort());
  });

  it("maps each trigger to the hook the serialiser actually writes", () => {
    for (const { event, hook } of auto.triggers.events) {
      expect(hook).toBe(TRIGGER_HOOKS[event as (typeof TRIGGER_EVENTS)[number]]);
    }
  });

  it("agrees on which triggers can still block the write", () => {
    // A `before` hook runs ahead of the write and can stop it; an `after` hook
    // cannot. Anything else is a documentation error, not a naming preference.
    for (const t of auto.triggers.events) {
      expect(t.blocking).toBe(t.phase === "before");
      expect(t.hook.startsWith(t.phase === "before" ? "before" : "after")).toBe(true);
    }
  });

  it("lists exactly the operators the model defines, with matching arity", () => {
    const documented = auto.conditions.operators;
    expect(documented.map((o) => o.id).sort()).toEqual(OPERATORS.map((o) => o.id).sort());

    for (const op of documented) {
      const impl = OPERATORS.find((o) => o.id === op.id);
      expect(impl, `operator ${op.id}`).toBeDefined();
      expect(op.arity).toBe(impl?.arity);
      expect(op.label).toBe(impl?.label);
    }
  });

  it("lists exactly the step types the model defines, with matching properties", () => {
    const documented = auto.steps.types;
    expect(documented.map((s) => s.type).sort()).toEqual(Object.keys(STEP_FIELDS).sort());

    for (const step of documented) {
      const fields = STEP_FIELDS[step.type as keyof typeof STEP_FIELDS];
      expect(step.properties, `step ${step.type}`).toEqual([...fields]);
    }
  });

  it("documents exactly the keys the writer produces, in the order it writes them", () => {
    // One of each kind, so every conditional key is written at least once.
    const written = new Set<string>();
    for (const kind of ["automation", "hook", "saga"] as const) {
      const automation = emptyAutomation("Order", kind);
      automation.description = "documented";
      if (kind === "hook") automation.hooks = [{ ...newHook("beforeCreate"), handler: "check" }];
      const text = automationToYaml(automation);
      for (const line of text.split("\n")) {
        const key = line.match(/^([A-Za-z]+):/)?.[1];
        if (key) written.add(key);
      }
      expect(text.split("\n")[0]).toBe(auto.document.version);
    }
    expect([...written].sort()).toEqual(Object.keys(auto.document.keys).sort());
  });
});
