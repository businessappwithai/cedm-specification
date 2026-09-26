/**
 * The person-role list is stated once and mirrored seven times. This pins them.
 *
 * `foreignKeys.personRoleColumns.names` in `appwithai-language.json` is the
 * canonical answer to "which column names a person by the role they played
 * rather than by an entity" — `assigned_to`, `pi_id`, `owner_id`. Every
 * component that resolves a lookup needs it, and several of them cannot read
 * the definition at run time: `bus-entity.types.ts` is imported by the browser
 * bundle, and the generated backend and its suites are Rust and bun sources
 * that ship without it. So each keeps a copy.
 *
 * Seven hand-maintained copies drift, and they had: the generated bun harness
 * was missing `remediation_owner`, so a record whose only lookup was that
 * column got a raw UUID in the suite while every other component resolved it.
 * Nothing failed — the harness simply treated the column as ordinary.
 *
 * This reads the definition and asserts each copy lists exactly those names, so
 * the next divergence fails here rather than in one component's behaviour.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(import.meta.dirname, "../../../../..");

const DEFINITION = JSON.parse(
  readFileSync(path.join(ROOT, "language/appwithai-language.json"), "utf-8")
) as { foreignKeys: { personRoleColumns: { names: string[] } } };

/** Every file holding a copy, and the identifier that introduces it. */
const MIRRORS: Array<{ label: string; file: string; anchor: string }> = [
  {
    label: "packages/core — the browser-safe copy",
    file: "packages/core/src/types/bus-entity.types.ts",
    anchor: "PERSON_ROLE_COLUMN_NAMES",
  },
  {
    label: "the Rust generator",
    file: "crates/appwithai-gen/src/bus.rs",
    anchor: "PERSON_ROLE_COLUMN_NAMES: &[&str]",
  },
  {
    label: "the generated backend's dictionary service",
    file: "packages/generator/templates/tanstack-astryx-loco/backend/src/services/dictionary.rs.hbs",
    anchor: "PERSON_ROLE_COLUMNS",
  },
  {
    label: "the generated Rust request suite",
    file: "packages/generator/templates/tanstack-astryx-loco/backend/tests/support/entities.rs.hbs",
    anchor: "PERSON_ROLE_COLUMNS",
  },
  {
    label: "the generated bun harness",
    file: "packages/generator/templates/tanstack-astryx-loco/tests/harness/harness.ts.hbs",
    anchor: "PERSON_ROLE_COLUMNS",
  },
  {
    label: "the business-data seed",
    file: "packages/generator/templates/common/seeds/business-data.ts.hbs",
    anchor: "FK_COLUMN_TABLE_MAP",
  },
];

/**
 * The names the declaration starting at `anchor` lists.
 *
 * Deliberately shallow. Every copy is a multi-line literal — a Rust slice, a TS
 * `Set`, a TS `Record` — so the block is the text from the bracket that opens a
 * new line to the one that closes it, and a name is either a quoted element or
 * a bare key. A parser per language would be four parsers, and the property
 * under test is set membership, which does not need one.
 *
 * Only the "is every canonical name present" direction is asserted. The reverse
 * would need to tell a list element from a map value from a Rust type in the
 * same regex, and the drift that actually bit was an omission: the generated
 * bun harness silently lacked `remediation_owner`.
 */
function listedNames(source: string, anchor: string): Set<string> {
  const start = source.indexOf(anchor);
  expect(start, `${anchor} not found`).toBeGreaterThan(-1);

  // The literal that opens a line — `&[` and `= [` both end their line here.
  const open = source.slice(start).search(/[[{]\s*\n/);
  expect(open, `${anchor} is not followed by a multi-line literal`).toBeGreaterThan(-1);
  const body = source.slice(start + open + 1);
  const close = body.search(/^\s*[\]}]/m);
  const block = body.slice(0, close === -1 ? body.length : close);

  return new Set(
    [...block.matchAll(/^\s*["']?([a-z][a-z0-9_]*)["']?\s*[,:]/gm)].map((m) => m[1] as string)
  );
}

describe("the person-role column list", () => {
  const canonical = DEFINITION.foreignKeys.personRoleColumns.names;

  it("is not empty, or every assertion below is vacuous", () => {
    expect(canonical.length).toBeGreaterThan(0);
  });

  for (const mirror of MIRRORS) {
    it(`is mirrored exactly in ${mirror.label}`, () => {
      const source = readFileSync(path.join(ROOT, mirror.file), "utf-8");
      const listed = listedNames(source, mirror.anchor);
      const missing = canonical.filter((name) => !listed.has(name));
      expect(missing, `${mirror.file} omits ${missing.join(", ")}`).toEqual([]);
    });
  }
});
