/**
 * `%%entity <E> icon:` reaches `sys_table.icon`.
 *
 * The directive was validated and dropped: the checker knew the key, the
 * definition listed it, and neither generator read it — so an entity drawn with
 * a stethoscope in the model came out with the column's `DEFAULT 'Table'`, the
 * same as one that named nothing.
 *
 * Two things are asserted together, because either alone would pass while the
 * feature did nothing: that the parser reads the directive, and that the value
 * survives into the seed the generated application actually applies.
 *
 * The Rust mirror is `crates/appwithai-gen/src/model.rs`, and `bun run parity`
 * is what says the two agree.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { entityToBusEntity } from "@appwithai/core/types";
import { buildDictionarySeedSql } from "../tanstack-astryx-loco/dictionary-seed";
import { MermaidParser } from "../../parsers/mermaid.parser";

const MODEL_PATH = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.mmd");
const MODEL = readFileSync(MODEL_PATH, "utf8");

function parse(source: string) {
  return new MermaidParser().parse(source);
}

describe("%%entity … icon:", () => {
  it("reads the icon off the corpus model", () => {
    const declared = MODEL.split("\n").filter((line) =>
      /^\s*%%entity\s+\w+\s+icon\s*:/.test(line)
    ).length;
    expect(declared).toBeGreaterThan(0);

    const { entities } = parse(MODEL);
    const withIcon = entities.filter((entity) => entity.icon);
    expect(withIcon).toHaveLength(declared);

    const compound = entities.find((entity) => entity.name === "Compound");
    // `flask-conical` rather than `flask`: lucide has no `flask`, and the
    // definition names that as the common trap. If this ever reads `flask`,
    // the model is wrong rather than the parser.
    expect(compound?.icon).toBe("flask-conical");
  });

  it("does not read a directive out of the middle of a prose comment", () => {
    const source = [
      "erDiagram",
      "    Patient {",
      "        string id PK",
      "    }",
      "%%entity Patient icon: stethoscope",
      "%% the %%entity Patient icon: not-this one is prose",
    ].join("\n");
    const patient = parse(source).entities.find((entity) => entity.name === "Patient");
    expect(patient?.icon).toBe("stethoscope");
  });

  it("leaves an entity that declares none without one", () => {
    // `sys_table.icon` defaults to 'Table' in m0001. Filling the gap with a
    // guess here would be a derivation the Rust side has to mirror exactly, and
    // the parity gate would be the only thing holding the two together.
    const source = "erDiagram\n    Patient {\n        string id PK\n    }\n";
    expect(parse(source).entities[0]?.icon).toBeUndefined();
  });

  it("carries the icon into the dictionary seed, and only for those that declare one", () => {
    const { entities } = parse(MODEL);
    const busEntities = entities.map((entity) => entityToBusEntity(entity));
    const sql = buildDictionarySeedSql({
      projectName: "icons",
      entities: busEntities,
      categories: [],
      modelEnums: [],
    });

    const declared = busEntities.filter((entity) => entity.icon);
    for (const entity of declared) {
      expect(sql, `${entity.tableName} should carry its icon`).toContain(`'${entity.icon}'`);
    }

    // The column list widens only for the rows that have something to put in
    // it, so a model declaring no icon emits exactly the seed it did before
    // this key was read.
    const withIcon = (sql.match(/INSERT INTO sys_table \(sys_table_id, table_name, name, description, icon,/g) ?? []).length;
    expect(withIcon).toBe(declared.length);
  });
});
