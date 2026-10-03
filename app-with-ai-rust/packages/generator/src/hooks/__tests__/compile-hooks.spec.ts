/**
 * The model's `hooks` → the handlers the generated backend dispatches to.
 *
 * Each case is a way a declaration the checker would report can still reach
 * the compiler — a model generated with the checker off, or a document edited
 * after it was checked — and what the compiler does with it instead of
 * emitting a crate that does not build.
 */
import { describe, expect, it } from "vitest";
import { compileYaml } from "../../model/__tests__/compile-yaml";
import type { HookDeclaration } from "../../model/records";
import { compileHookDeclarations, hooksByEntity } from "../index";

const ENTITIES = ["Compound", "Experiment", "ChemicalInventory"];

const hook = (
  event: string,
  handler: string,
  entity: string,
  fields?: string[]
): HookDeclaration => (fields ? { event, handler, entity, fields } : { event, handler, entity });

function compile(declarations: HookDeclaration[]) {
  const warnings: string[] = [];
  const hooks = compileHookDeclarations(declarations, ENTITIES, (m) => warnings.push(m));
  return { hooks, warnings };
}

describe("compileHookDeclarations", () => {
  it("compiles a declaration to its event, handler and entity", () => {
    const { hooks } = compile([hook("beforeCreate", "generateInchiKey", "Compound")]);

    expect(hooks).toHaveLength(1);
    expect(hooks[0]).toMatchObject({
      entity: "Compound",
      type: "beforeCreate",
      handler: "generateInchiKey",
      order: 0,
    });
    expect(hooks[0]?.field).toBeUndefined();
  });

  it("scopes the handler to the first column the declaration names", () => {
    const { hooks } = compile([
      hook("customValidate", "validateSmiles", "Compound", ["smiles", "inchi_key"]),
    ]);
    expect(hooks[0]?.field).toBe("smiles");
  });

  it("drops a hook on an entity the model does not declare", () => {
    const { hooks, warnings } = compile([hook("beforeCreate", "doThing", "Nonexistent")]);
    expect(hooks).toHaveLength(0);
    expect(warnings[0]).toContain("unknown entity");
  });

  it("drops a hook bound to an event that is not a lifecycle event", () => {
    const { hooks, warnings } = compile([hook("whenever", "doThing", "Compound")]);
    expect(hooks).toHaveLength(0);
    expect(warnings[0]).toContain("unknown event");
  });

  it("keeps the first of two identical declarations", () => {
    const { hooks, warnings } = compile([
      hook("beforeCreate", "stamp", "Compound"),
      hook("beforeCreate", "stamp", "Compound"),
    ]);
    expect(hooks).toHaveLength(1);
    expect(warnings[0]).toContain("declared twice");
  });

  it("refuses one handler name serving two events on the same entity", () => {
    // Both would become the same exported function in the entity's module.
    const { hooks, warnings } = compile([
      hook("beforeCreate", "stamp", "Compound"),
      hook("beforeUpdate", "stamp", "Compound"),
    ]);
    expect(hooks).toHaveLength(1);
    expect(hooks[0]?.type).toBe("beforeCreate");
    expect(warnings[0]).toContain("its own handler name");
  });

  it("allows the same handler name on different entities", () => {
    const { hooks } = compile([
      hook("beforeCreate", "stamp", "Compound"),
      hook("beforeCreate", "stamp", "Experiment"),
    ]);
    expect(hooks).toHaveLength(2);
  });

  it("numbers each entity's hooks in declaration order, and groups by entity", () => {
    const { hooks } = compile([
      hook("beforeCreate", "one", "Compound"),
      hook("beforeUpdate", "two", "Experiment"),
      hook("afterCreate", "three", "Compound"),
    ]);

    const grouped = hooksByEntity(hooks);
    expect([...grouped.keys()].sort()).toEqual(["Compound", "Experiment"]);
    expect(grouped.get("Compound")?.map((h) => [h.handler, h.order])).toEqual([
      ["one", 0],
      ["three", 1],
    ]);
  });

  it("is what a model's `hooks` compile to", () => {
    const model = compileYaml(`eml: "1.0"
entities:
  - name: Compound
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: inchi_key, type: string }
hooks:
  - { entity: Compound, event: beforeCreate, handler: generateInchiKey, fields: [inchi_key] }
  - { entity: Compound, event: afterCreate, handler: indexForSearch }
`);
    expect(model.hooks.map((h) => [h.type, h.handler, h.field])).toEqual([
      ["beforeCreate", "generateInchiKey", "inchi_key"],
      ["afterCreate", "indexForSearch", undefined],
    ]);
  });
});

/**
 * The generated registry and the generated `getHooks` must agree on how an
 * entity identifier is normalised, because the identifier reaching the service
 * is whatever the caller used: the REST route sends `bus_compound`, the UI
 * sends `chemical-inventory`, the model says `ChemicalInventory`. This is a
 * copy of the function the generator emits — if it changes there, it changes
 * here, and this test says what it has to keep satisfying.
 */
function hookKey(entity: string): string {
  const flat = entity.toLowerCase().replace(/^bus_/, "").replace(/[_-]/g, "");
  return flat.endsWith("s") && !flat.endsWith("ss") ? flat.slice(0, -1) : flat;
}

describe("hookKey", () => {
  it("resolves every spelling of a single-word entity to one key", () => {
    const keys = ["Compound", "compound", "compounds", "bus_compound", "bus_compounds"].map(
      hookKey
    );
    expect(new Set(keys).size).toBe(1);
  });

  it("resolves every spelling of a multi-word entity to one key", () => {
    const keys = [
      "ChemicalInventory",
      "chemical-inventory",
      "chemical_inventory",
      "bus_chemical_inventory",
    ].map(hookKey);
    expect(new Set(keys).size).toBe(1);
  });

  it("keeps a double-s ending intact", () => {
    expect(hookKey("Address")).toBe("address");
    expect(hookKey("bus_address")).toBe("address");
  });

  it("keeps distinct entities distinct", () => {
    expect(hookKey("Compound")).not.toBe(hookKey("CompoundAlias"));
  });
});
