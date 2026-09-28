/**
 * The designer's step palette must say what the language says.
 *
 * `templates/.../lib/workflow/step-types.ts` is a checked-in file that ships
 * into every generated app, and `workflowConstructs.stepNodes` in
 * `appwithai-language.json` is what the backend's executor is written
 * against. They were two hand-maintained lists once and drifted in both
 * directions: the palette offered `Agent`, which the executor rejects with a
 * 400, and lacked `Decision`, which the executor had gained.
 *
 * A rendered template would tie them together by construction, but a `.hbs`
 * does not resolve as a module — which broke every piece of tooling that walks
 * the template tree, the generated-app parity tests included. A checked-in
 * file plus this test gives the same guarantee and keeps the tree importable.
 *
 * A step marked `shipped: false` is declared but not executed. It must not be
 * offered: the executor fails a run containing one rather than skipping it,
 * because skipping reported success for outcomes that never happened.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getStepNodeTypes } from "../../model/language-maps";

const STEP_TYPES_FILE = path.join(
  import.meta.dirname,
  "../../../templates/tanstack-astryx-loco/frontend/src/lib/workflow/step-types.ts"
);

/**
 * The string members of an exported array literal, in order.
 *
 * Anchored on the `=` rather than the first `[`, because a type annotation
 * gets there first: `UNSHIPPED_STEP_TYPES: readonly string[] = [...]` has a
 * bracket pair before the array, and reading that one found no members and
 * made the assertion pass against an empty list.
 */
function arrayMembers(source: string, name: string): string[] {
  const start = source.indexOf(`export const ${name}`);
  expect(start, `${name} is not exported`).toBeGreaterThan(-1);
  const open = source.indexOf("[", source.indexOf("=", start));
  const close = source.indexOf("]", open);
  return [...source.slice(open, close).matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
}

describe("generated step palette", () => {
  const source = readFileSync(STEP_TYPES_FILE, "utf-8");
  const declared = getStepNodeTypes();

  it("reads the language definition at all", () => {
    // A missing definition makes every assertion below vacuously true.
    expect(declared.length).toBeGreaterThan(0);
  });

  it("offers exactly the step types the language ships", () => {
    expect(arrayMembers(source, "STEP_TYPES")).toEqual(
      declared.filter((type) => type.shipped).map((type) => type.name)
    );
  });

  it("names the unshipped types rather than offering them", () => {
    const unshipped = declared.filter((type) => !type.shipped).map((type) => type.name);
    expect(arrayMembers(source, "UNSHIPPED_STEP_TYPES")).toEqual(unshipped);

    const offered = new Set(arrayMembers(source, "STEP_TYPES"));
    for (const name of unshipped) {
      expect(offered.has(name), `${name} is not shipped but is offered`).toBe(false);
    }
  });

  it("carries each shipped type's purpose", () => {
    for (const type of declared.filter((item) => item.shipped)) {
      // Quoted at the source, since this is TypeScript rather than prose.
      const escaped = type.purpose.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      expect(source, `${type.name} has no purpose line`).toContain(`${type.name}: "${escaped}"`);
    }
  });
});
