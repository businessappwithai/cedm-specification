/**
 * A lookup whose target is stated rather than derived from its column name —
 * the reference a CEDM model writes as `deliveryLocation → Location` — reaches
 * every place a lookup's table is decided: the dictionary seed (m0018's
 * `sys_column.ref_table_name`), both generated test harnesses, and a parent
 * link. A model with no such reference generates exactly what it always did;
 * `bun run parity` and the corpus gates hold that.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { compileModelDocument, readModelYaml } from "../../model-yaml";
import { generateApplication } from "../index";

const MODEL = `eml: "1.0"
name: Refs
entities:
  - name: Location
    attributes:
      - {name: id, type: uuid, pk: true}
      - {name: name, type: string}
  - name: Shipment
    attributes:
      - {name: id, type: uuid, pk: true}
      - {name: number, type: string}
      - {name: delivery_location_id, type: string, fk: true, references: Location, optional: true}
  - name: ShipmentLine
    parent: Shipment
    attributes:
      - {name: id, type: uuid, pk: true}
      - {name: qty, type: decimal}
      - {name: consignment_id, type: string, fk: true, references: Shipment}
relationships:
  - {from: Location, fromCardinality: exactly-one, to: Shipment, toCardinality: zero-or-more, label: delivery_location}
  - {from: Shipment, fromCardinality: exactly-one, to: ShipmentLine, toCardinality: zero-or-more, label: lines}
`;

function quietly<T>(run: () => Promise<T>): Promise<T> {
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  return run().finally(() => {
    console.log = log;
    console.warn = warn;
  });
}

describe("an explicit lookup target", () => {
  let output: string | undefined;
  afterAll(async () => {
    if (output) await fs.rm(output, { recursive: true, force: true });
  });

  it("is refused when it names an entity the model does not declare", () => {
    const read = readModelYaml(MODEL.replace("references: Location", "references: Depot"));
    expect(read.diagnostics.map((d) => d.code)).toContain("EML118");
    expect(read.ok).toBe(false);
  });

  it("makes the column a lookup, and links a line item on it", () => {
    const read = readModelYaml(MODEL);
    expect(read.ok, JSON.stringify(read.diagnostics.filter((d) => d.severity === "error"))).toBe(
      true
    );
    const model = compileModelDocument(read.document!);
    const line = model.entities.find((entity) => entity.name === "ShipmentLine");
    expect(line?.parentEntity).toBe("Shipment");
    expect(line?.parentLinkColumn).toBe("consignment_id");
    const shipment = model.entities.find((entity) => entity.name === "Shipment");
    expect(shipment?.attributes.find((a) => a.name === "delivery_location_id")?.references).toBe(
      "Location"
    );
  });

  it("is stored by the seed and read by both harnesses", async () => {
    const read = readModelYaml(MODEL);
    output = await fs.mkdtemp("/tmp/explicit-references-");
    const directory = output;
    await quietly(() =>
      generateApplication({
        projectName: "refs",
        skipCliScaffold: true,
        document: read.document!,
        modelText: MODEL,
        outputDir: directory,
      })
    );
    const seed = await fs.readFile(path.join(directory, "backend/seed/dictionary.sql"), "utf-8");
    expect(seed).toMatch(
      /UPDATE sys_column SET ref_table_name = 'bus_location' WHERE sys_column_id = '/
    );
    expect(seed).toMatch(
      /UPDATE sys_column SET ref_table_name = 'bus_shipment' WHERE sys_column_id = '/
    );
    expect(seed.match(/ref_table_name/g)).toHaveLength(2);

    const rust = await fs.readFile(
      path.join(directory, "backend/tests/support/entities.rs"),
      "utf-8"
    );
    expect(rust).toContain('ref_table: Some("bus_location")');
    const bun = await fs.readFile(path.join(directory, "tests/harness/entities.ts"), "utf-8");
    expect(bun).toContain('references: "Location"');

    const migrations = await fs.readFile(
      path.join(directory, "backend/migration/src/lib.rs"),
      "utf-8"
    );
    expect(migrations).toContain("m0018_sys_column_ref_table::Migration");
  }, 120_000);
});
