import { describe, expect, it } from "vitest";
import { LIFECYCLE_COLUMN_NAMES } from "../../../../../../language/yaml/checker";
import { statusFieldFor } from "../transitions-seed";

/**
 * The column a state machine drives is decided once, here, for the
 * transitions seed, the access seed, the business seed and the generated test
 * suites — a guard reading one column while the edge names another is inert.
 */
describe("statusFieldFor", () => {
  const columns = new Map<string, string[]>([
    ["bus_deal", ["name", "status"]],
    ["bus_opportunity", ["name", "stage"]],
    ["bus_ticket", ["subject", "state"]],
    ["bus_order", ["stage", "status"]],
    ["bus_task", ["title"]],
  ]);

  it("drives the lifecycle column the entity declares", () => {
    expect(statusFieldFor("bus_deal", columns)).toBe("status");
    expect(statusFieldFor("bus_ticket", columns)).toBe("state");
    // crm's Opportunity: compiled onto `workflow_status` when only `status`
    // counted, so the stage topology guarded a column nothing writes to.
    expect(statusFieldFor("bus_opportunity", columns)).toBe("stage");
  });

  it("takes the language's order when an entity declares more than one", () => {
    expect(statusFieldFor("bus_order", columns)).toBe("status");
  });

  it("falls back to workflow_status when there is none, or no such table", () => {
    expect(statusFieldFor("bus_task", columns)).toBe("workflow_status");
    expect(statusFieldFor("bus_ghost", columns)).toBe("workflow_status");
  });

  it("accepts the column sets the business seed builds", () => {
    const sets = new Map([["bus_opportunity", new Set(["stage"])]]);
    expect(statusFieldFor("bus_opportunity", sets)).toBe("stage");
  });

  it("reads the list EML500 checks a machine's entity against", () => {
    // The Rust generator mirrors this order in `workflows::LIFECYCLE_COLUMNS`.
    expect([...LIFECYCLE_COLUMN_NAMES]).toEqual(["status", "state", "stage"]);
  });
});
