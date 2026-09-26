/**
 * The `%%hook` emission layer.
 *
 * Two properties matter here and neither is visible to the parity gate, which
 * only proves the two generators agree with *each other*:
 *
 * 1. Every declared hook reaches a handler **and** a registry call. A handler
 *    that exists but is never called is the bug this feature was written to
 *    fix, and it looks exactly like a working one from the outside.
 * 2. A handler module is written once. Regenerating a project must not delete
 *    an implementation someone wrote, and a hook declared later must still
 *    arrive.
 *
 * The registry's *shape* is asserted too, because it is not cosmetic: clippy's
 * `single_match` rejects a one-arm `match`, the generated backend is expected
 * to pass `-D warnings`, and how many entities declare a given event is a
 * property of the model rather than something the generator chooses.
 */

import { describe, expect, it } from "vitest";
import type { CompiledHook } from "../../../hooks";
import {
  appendMissingHandlers,
  buildHookHandlerModule,
  buildHookHandlersMod,
  buildHookRegistry,
  HOOK_RUST_CONTRACTS,
} from "../hook-handlers";
import { HOOK_TYPES } from "../../../hooks";

const hook = (
  entity: string,
  type: CompiledHook["type"],
  handler: string,
  order = 0,
  field?: string
): CompiledHook => ({ entity, type, handler, order, field });

describe("buildHookHandlerModule", () => {
  it("emits one function per declared hook, in declaration order", () => {
    const module = buildHookHandlerModule("Compound", [
      hook("Compound", "beforeCreate", "generateInchiKey", 0),
      hook("Compound", "afterCreate", "indexForSearch", 1),
    ]);

    expect(module).toContain("pub async fn generate_inchi_key(data: &mut Map<String, Value>)");
    expect(module).toContain("pub async fn index_for_search(record: &Value)");
    expect(module.indexOf("generate_inchi_key")).toBeLessThan(module.indexOf("index_for_search"));
  });

  it("carries the field a directive scoped the hook to into the doc comment", () => {
    const module = buildHookHandlerModule("Compound", [
      hook("Compound", "customValidate", "validateSmiles", 0, "smiles"),
    ]);
    expect(module).toContain("Scoped by the model to `smiles`");
  });

  it("says in the header that the file is not rewritten", () => {
    // The whole contract of this file is that the next run leaves it alone.
    // Someone editing it has to be able to learn that from the file itself.
    const module = buildHookHandlerModule("Compound", []);
    expect(module).toContain("written");
    expect(module).toContain("once");
  });
});

describe("appendMissingHandlers", () => {
  const existing = buildHookHandlerModule("Compound", [
    hook("Compound", "beforeCreate", "generateInchiKey", 0),
  ]).replace("let _ = data;\n    Ok(())", 'data.insert("k".into(), Value::Null);\n    Ok(())');

  it("returns null when the module already defines every declared hook", () => {
    const result = appendMissingHandlers(
      "Compound",
      [hook("Compound", "beforeCreate", "generateInchiKey", 0)],
      existing
    );
    expect(result).toBeNull();
  });

  it("appends only the hooks the module does not define, keeping the bodies", () => {
    const result = appendMissingHandlers(
      "Compound",
      [
        hook("Compound", "beforeCreate", "generateInchiKey", 0),
        hook("Compound", "afterCreate", "indexForSearch", 1),
      ],
      existing
    );

    // Narrowed rather than asserted: a null here means the append did not
    // happen at all, and the duplicate check below would then be vacuous.
    if (result === null) throw new Error("a newly declared hook must be appended");

    // The hand-written body survives — this is the property that makes
    // regeneration safe.
    expect(result).toContain('data.insert("k".into(), Value::Null);');
    expect(result).toContain("pub async fn index_for_search");
    // ...and the existing handler is not duplicated.
    expect(result.match(/pub async fn generate_inchi_key/g)).toHaveLength(1);
  });
});

describe("buildHookRegistry", () => {
  it("calls every declared handler", () => {
    const registry = buildHookRegistry([
      hook("Compound", "beforeCreate", "generateInchiKey", 0),
      hook("Compound", "afterCreate", "indexForSearch", 1),
      hook("DeviationReport", "afterCreate", "notifyQualityTeam", 0),
    ]);

    expect(registry).toContain("handlers::compound::generate_inchi_key(data).await?");
    expect(registry).toContain("handlers::compound::index_for_search(record).await?");
    expect(registry).toContain("handlers::deviation_report::notify_quality_team(record).await?");
  });

  it("declares a dispatch function for every hook type, even with no hooks at all", () => {
    // The bus controller calls all of them unconditionally, so a model with no
    // `%%hook` still has to produce a crate that compiles.
    const registry = buildHookRegistry([]);
    for (const type of HOOK_TYPES) {
      const fn = type.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      expect(registry).toContain(`pub async fn ${fn}(entity: &str,`);
    }
  });

  it("uses `if` rather than a one-arm `match` — clippy's single_match is denied", () => {
    const registry = buildHookRegistry([
      hook("Experiment", "beforeUpdate", "snapshotPreviousState", 0),
    ]);
    expect(registry).toContain('if key(entity) == "experiment" {');
    expect(registry).not.toContain("_ => {}");
  });

  it("uses a `match` once two entities declare the same event", () => {
    const registry = buildHookRegistry([
      hook("Compound", "beforeCreate", "generateInchiKey", 0),
      hook("DeviationReport", "beforeCreate", "timestampAnomaly", 0),
    ]);
    expect(registry).toContain("match key(entity).as_str() {");
    expect(registry).toContain("_ => {}");
  });

  it("short-circuits `beforeDelete`, so one refusal blocks the delete", () => {
    const registry = buildHookRegistry([hook("Compound", "beforeDelete", "blockIfReferenced", 0)]);
    expect(registry).toContain("if !handlers::compound::block_if_referenced(id).await? {");
    expect(registry).toContain("return Ok(false);");
  });

  it("normalises the entity spelling the caller used", () => {
    // `bus_compound`, `compound` and `Compound` all reach the same handlers, or
    // a hook would fire from the REST route and not from the UI's.
    const registry = buildHookRegistry([hook("ChemicalInventory", "afterCreate", "notify", 0)]);
    expect(registry).toContain('"chemicalinventory"');
    expect(registry).toContain('entity.strip_prefix("bus_")');
  });

  it("forwards exactly the parameters each contract declares", () => {
    // The registry's call has to match the handler's signature; deriving one
    // from the other by reformatting is how the two drift apart.
    //
    // Split at top level only: `data: &mut Map<String, Value>` is one
    // parameter, and a naive split on "," reads the generic's comma as a
    // second one.
    const topLevelParams = (params: string): string[] => {
      const out: string[] = [];
      let depth = 0;
      let current = "";
      for (const ch of params) {
        if (ch === "<") depth += 1;
        else if (ch === ">") depth -= 1;
        if (ch === "," && depth === 0) {
          out.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim()) out.push(current);
      return out.map((p) => p.trim().split(":")[0]?.trim() ?? "");
    };

    for (const type of HOOK_TYPES) {
      const contract = HOOK_RUST_CONTRACTS[type];
      expect(contract.call.split(",").map((c) => c.trim())).toEqual(
        topLevelParams(contract.params)
      );
    }
  });
});

describe("buildHookHandlersMod", () => {
  it("declares a module per entity, sorted", () => {
    const mod = buildHookHandlersMod(["Experiment", "Compound", "DeviationReport"]);
    expect(mod).toContain("pub mod compound;");
    expect(mod).toContain("pub mod deviation_report;");
    expect(mod).toContain("pub mod experiment;");
    expect(mod.indexOf("compound")).toBeLessThan(mod.indexOf("deviation_report"));
  });

  it("is still valid Rust for a model with no hooks", () => {
    const mod = buildHookHandlersMod([]);
    expect(mod).not.toContain("pub mod ;");
    expect(mod).toContain("No `%%hook` directive in this model.");
  });
});
