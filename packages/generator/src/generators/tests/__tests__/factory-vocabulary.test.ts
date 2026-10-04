/**
 * The test factory builds payloads from the model's vocabulary, not its own.
 *
 * `factory.ts` invented a status vocabulary — `active`, `pending`, `closed`,
 * `draft` — and used it for any column whose name matched `/status|state$/`.
 * No model declares those words. An `enum` is a closed list the generated
 * application enforces: the column gets a `sys_ref_list` reference, the form
 * renders a dropdown, and the API refuses a value outside it. So the guess was
 * not "a less realistic value", it was an invalid one, and where the entity had
 * a state machine it put the record in a state the diagram never drew — every
 * guard then finds no edge out of it and every rule keyed on a real status
 * value never fires.
 *
 * `model.ts` has carried the declared values all along, keyed by the reference
 * id the generator allocated. Nothing mapped a *column* to its enum, so the
 * factory could not have looked one up even if it had tried. `FieldMeta` now
 * carries `enumReferenceId` and the factory resolves it against `modelEnums` —
 * one copy of the values, in the file whose whole purpose is to be the model's
 * own word.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { readYamlFixture } from "../../../model/__tests__/compile-yaml";
import { generateApplication } from "../../../index";

/** A column bound to an `enum`, and a second entity with a state machine. */
const MODEL = `eml: "1.0"
enums:
  - name: MemberStatus
    values: [active, lapsed, suspended]
  - name: BookingStatus
    values: [held, attended, cancelled]
entities:
  - name: Member
    attributes:
      - name: id
        type: string
        pk: true
      - name: full_name
        type: string
      - name: status
        type: string
        enum: MemberStatus
  - name: Booking
    attributes:
      - name: id
        type: string
        pk: true
      - name: member_id
        type: string
        fk: true
      - name: status
        type: string
        enum: BookingStatus
relationships:
  - from: Member
    fromCardinality: exactly-one
    to: Booking
    toCardinality: zero-or-more
    label: holds
stateMachines:
  - name: BookingLifecycle
    entity: Booking
    states: [held, attended, cancelled]
    initial: held
    transitions:
      - from: held
        to: attended
        trigger: attend
      - from: held
        to: cancelled
        trigger: cancel
`;

let generated: { entities: string; factory: string; model: string } | undefined;

async function harness() {
  if (generated) return generated;
  const out = await fs.mkdtemp("/tmp/factory-vocabulary-");
  await generateApplication({
    document: readYamlFixture(MODEL),
    modelText: MODEL,
    projectName: "vocab",
    outputDir: out,
    skipFrontend: true,
    skipCliScaffold: true,
  });
  const read = (name: string) => fs.readFile(path.join(out, "tests", "harness", name), "utf-8");
  generated = {
    entities: await read("entities.ts"),
    factory: await read("factory.ts"),
    model: await read("model.ts"),
  };
  return generated;
}

describe("the generated test factory", () => {
  it("binds a column to the enum the model bound it to", async () => {
    const { entities, model } = await harness();

    // The reference id is the join between the two files, so it has to appear
    // on the column *and* on the enum — a binding to an id `model.ts` does not
    // carry resolves to nothing and silently falls back to guessing.
    const binding = entities.match(/name: "status",[\s\S]*?enumReferenceId: (\d+),/);
    expect(binding?.[1]).toBeDefined();
    expect(model).toContain(`referenceId: ${binding?.[1]}`);
  });

  it("carries the declared values, and only those, in model.ts", async () => {
    const { model } = await harness();
    expect(model).toContain('values: ["active", "lapsed", "suspended"]');
    expect(model).toContain('values: ["held", "attended", "cancelled"]');
  });

  it("consults the declared vocabulary before any name heuristic", async () => {
    const { factory } = await harness();

    // The guessed words are still there for a status column the model bound to
    // no enum — but they must be unreachable for one it did.
    const declaredAt = factory.indexOf("const declared = declaredValues(field)");
    const heuristicsAt = factory.indexOf("for (const [pattern, generate] of BY_NAME)");
    expect(declaredAt).toBeGreaterThan(-1);
    expect(heuristicsAt).toBeGreaterThan(-1);
    expect(declaredAt).toBeLessThan(heuristicsAt);
  });

  it("starts a record where the state machine says records start", async () => {
    const { factory } = await harness();
    // An arbitrary pick from the enum is valid for the dropdown and wrong for
    // the lifecycle: only the initial state is both.
    expect(factory).toContain("field.name === machine.statusField");
    expect(factory).toContain("record[field.name] = machine.initial");
  });

  it("leaves a column the model bound to no enum alone", async () => {
    const { entities } = await harness();
    const fullName = entities.match(/name: "full_name",[\s\S]*?\},/)?.[0] ?? "";
    expect(fullName).not.toContain("enumReferenceId");
  });
});
