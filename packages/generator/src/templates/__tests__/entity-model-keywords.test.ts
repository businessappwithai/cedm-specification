/**
 * A column called `type` (or `ref`, `match`, …) must reach the generated SeaORM
 * model as a raw identifier.
 *
 * `pub type: String` is a syntax error, so a model with one such column in one
 * entity produced a crate that does not compile — found on `inventory`'s
 * `HandlingUnit.type`, and invisible to every corpus model because none of them
 * has such a column.
 */
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { TemplateLoader } from "../loader";

const TEMPLATE_ROOT = path.resolve(__dirname, "../../../templates/tanstack-astryx-loco");

const attribute = (name: string) => ({
  name,
  type: "string",
  required: true,
  isForeignKey: false,
});

async function render(names: string[]): Promise<string> {
  const loader = new TemplateLoader(TEMPLATE_ROOT);
  const template = await loader.load("backend/src/models/_entities/bus_entity.rs.hbs");
  return template({
    now: "now",
    project: { name: "demo" },
    entity: {
      name: "HandlingUnit",
      tableName: "bus_handling_unit",
      primaryKey: "id",
      attributes: [attribute("id"), ...names.map(attribute)],
    },
  });
}

describe("bus entity model", () => {
  it("writes a Rust keyword column as a raw identifier and keeps the column name", async () => {
    const out = await render(["type", "ref", "match"]);
    expect(out).toContain('#[sea_orm(column_name = "type")]');
    expect(out).toMatch(/pub r#type: String,/);
    expect(out).toMatch(/pub r#ref: String,/);
    expect(out).toMatch(/pub r#match: String,/);
    expect(out).not.toMatch(/pub type:/);
  });

  it("leaves an ordinary column alone", async () => {
    const out = await render(["name", "kind"]);
    expect(out).toMatch(/pub name: String,/);
    expect(out).toMatch(/pub kind: String,/);
    expect(out).not.toContain("r#name");
  });
});
