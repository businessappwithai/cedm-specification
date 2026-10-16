/**
 * The generated request-test module names must be unique for any entity name.
 *
 * Every entity gets `crud_<name>` and `rules_<name>`, and the suite has shared
 * modules of its own. A shared module called `rules_workflow` collided with the
 * module for an entity called Workflow, and the whole test crate failed to
 * compile (E0428) — found on the `workflow` application, invisible to every
 * corpus model.
 */
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { TemplateLoader } from "../loader";

const TEMPLATE_ROOT = path.resolve(__dirname, "../../../templates/tanstack-astryx-loco");

async function moduleNames(entityTables: string[]): Promise<string[]> {
  const loader = new TemplateLoader(TEMPLATE_ROOT);
  const template = await loader.load("backend/tests/requests/mod.rs.hbs");
  const out = template({
    now: "now",
    project: { name: "demo" },
    entities: entityTables.map((tableName) => ({ name: tableName, tableName })),
  });
  return [...out.matchAll(/^mod ([a-z0-9_]+);/gm)].map((m) => m[1] as string);
}

describe("generated request-test modules", () => {
  it("never defines a module twice, whatever an entity is called", async () => {
    // Names an entity could plausibly have that match a shared module's stem.
    const names = await moduleNames([
      "bus_workflow",
      "bus_rules",
      "bus_ai",
      "bus_auth",
      "bus_system_config",
      "bus_rate_limit",
      "bus_reports",
      "bus_records",
      "bus_permissions",
      "bus_openapi",
    ]);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    expect(duplicates).toEqual([]);
  });

  it("keeps the shared workflow-rules module out of the entity namespace", async () => {
    const names = await moduleNames(["bus_workflow"]);
    expect(names).toContain("rules_workflow"); // the Workflow entity's own
    expect(names).toContain("workflow_rules"); // the shared suite
  });
});
