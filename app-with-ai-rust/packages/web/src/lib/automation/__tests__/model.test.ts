import { describe, expect, it } from "vitest";
import {
  type Automation,
  emptyAutomation,
  newCondition,
  newHook,
  newStep,
  validateAutomation,
  valuesAvailableAt,
} from "../model";
import { AutomationDocumentError, automationFromYaml, automationToYaml } from "../yaml";

/** Write an automation as its document and read it back. */
const reopen = (automation: Automation) => automationFromYaml(automationToYaml(automation));

/**
 * A realistic automation: the one the builder was designed around.
 *
 * "When an Order is created, only if Order.total is greater than 1000, then
 * look up a rule table, set a field, and create an Invoice."
 */
function sampleAutomation(): Automation {
  const a = emptyAutomation("Order");
  a.name = "Order fulfilment";
  a.trigger = { entity: "Order", event: "created" };

  a.conditions = [{ ...newCondition(), field: "order.total", operator: "gt", value: "1000" }];

  const decision = newStep("Decision");
  decision.resultName = "tier";
  decision.props = { ruleTable: "Discount tier" };

  const update = newStep("UpdateEntity");
  update.resultName = "";
  update.props = { entity: "Order", field: "priority", value: "high" };

  const create = newStep("CreateEntity");
  create.resultName = "invoiceId";
  create.props = { entity: "Invoice" };

  a.steps = [decision, update, create];
  return a;
}

describe("automationToYaml / automationFromYaml", () => {
  it("round-trips the trigger, checks and steps", () => {
    const reopened = reopen(sampleAutomation());

    expect(reopened.name).toBe("Order fulfilment");
    expect(reopened.trigger).toEqual({ entity: "Order", event: "created" });

    expect(reopened.conditions).toHaveLength(1);
    expect(reopened.conditions[0]).toMatchObject({
      field: "order.total",
      operator: "gt",
      value: "1000",
    });

    expect(reopened.steps.map((s) => s.type)).toEqual(["Decision", "UpdateEntity", "CreateEntity"]);
    expect(reopened.steps.map((s) => s.resultName)).toEqual(["tier", "", "invoiceId"]);
    expect(reopened.steps[0]?.props.ruleTable).toBe("Discount tier");
    expect(reopened.steps[1]?.props).toMatchObject({
      entity: "Order",
      field: "priority",
      value: "high",
    });
  });

  it("keeps step order, because order is the whole semantics", () => {
    const reopened = reopen(sampleAutomation());
    expect(reopened.steps.map((s) => s.props.entity ?? s.props.ruleTable)).toEqual([
      "Discount tier",
      "Order",
      "Invoice",
    ]);
  });

  it("writes the same bytes for the same automation, so a save diffs only what changed", () => {
    const once = automationToYaml(sampleAutomation());
    expect(automationToYaml(automationFromYaml(once))).toBe(once);
  });

  it("is a versioned document naming the automation, not the screen's state", () => {
    const text = automationToYaml(sampleAutomation());
    expect(text.split("\n")[0]).toBe('automation: "1.0"');
    // The in-memory id and when it was last touched belong to the screen.
    expect(text).not.toMatch(/^id:/m);
    expect(text).not.toMatch(/updatedAt/);
  });

  it("maps every trigger event back to the event it came from", () => {
    for (const event of [
      "created",
      "beforeCreated",
      "updated",
      "beforeUpdated",
      "deleted",
      "beforeDeleted",
    ] as const) {
      const a = emptyAutomation("Order");
      a.trigger = { entity: "Order", event };
      expect(reopen(a).trigger.event).toBe(event);
    }
  });

  it("refuses a step type it does not know, naming the step", () => {
    const text = automationToYaml(sampleAutomation()).replace("type: Decision", "type: Mystery");
    expect(() => automationFromYaml(text)).toThrow(AutomationDocumentError);
    expect(() => automationFromYaml(text)).toThrow(/steps\[0\]\.type: Mystery/);
  });

  it("keeps a check's value as the text it was, whatever it looks like", () => {
    const a = sampleAutomation();
    a.conditions = [{ ...newCondition(), field: "order.status", operator: "eq", value: "1e3" }];
    expect(reopen(a).conditions[0]).toMatchObject({ value: "1e3" });
  });

  it("refuses a document that names no entity rather than guessing one", () => {
    const text = automationToYaml(sampleAutomation()).replace("entity: Order\n", "entity: \"\"\n");
    expect(() => automationFromYaml(text)).toThrow(/needs `trigger\.entity`/);
  });
});

describe("valuesAvailableAt", () => {
  const fields = { Order: ["id", "total", "status"] };

  it("offers the trigger record's fields to the first step", () => {
    const available = valuesAvailableAt(sampleAutomation(), 0, fields);
    expect(available.map((v) => v.path)).toEqual(["order.id", "order.total", "order.status"]);
  });

  it("never offers a step's own result to itself", () => {
    const a = sampleAutomation();
    const paths = valuesAvailableAt(a, 0, fields).map((v) => v.path);
    expect(paths).not.toContain("tier");
  });

  it("offers an earlier step's result to a later one", () => {
    const a = sampleAutomation();
    const paths = valuesAvailableAt(a, 2, fields).map((v) => v.path);
    expect(paths).toContain("tier");
  });

  it("never offers a later step's result to an earlier one", () => {
    const a = sampleAutomation();
    const paths = valuesAvailableAt(a, 1, fields).map((v) => v.path);
    expect(paths).not.toContain("invoiceId");
  });

  it("skips steps that name no result", () => {
    const a = sampleAutomation();
    const paths = valuesAvailableAt(a, 3, fields).map((v) => v.path);
    expect(paths).toContain("tier");
    expect(paths).toContain("invoiceId");
    expect(paths).toHaveLength(5);
  });

  it("expands a rule table step into one path per outcome", () => {
    const a = sampleAutomation();
    const decision = a.steps[0];
    if (!decision) throw new Error("fixture lost its decision step");
    decision.table = {
      hitPolicy: "first",
      inputs: [],
      outputs: [
        { id: "o1", name: "Discount", field: "discount_pct" },
        { id: "o2", name: "Approval", field: "approval_required" },
      ],
      rules: [],
    };
    const paths = valuesAvailableAt(a, 1, fields).map((v) => v.path);
    expect(paths).toContain("tier.discount_pct");
    expect(paths).toContain("tier.approval_required");
  });
});

describe("validateAutomation", () => {
  it("passes a complete automation", () => {
    expect(validateAutomation(sampleAutomation())).toEqual([]);
  });

  it("asks for at least one thing to do", () => {
    const a = sampleAutomation();
    a.steps = [];
    expect(validateAutomation(a).map((p) => p.target)).toContain("steps");
  });

  it("names the check that has no field", () => {
    const a = sampleAutomation();
    const check = a.conditions[0];
    if (!check) throw new Error("fixture lost its check");
    check.field = "";
    const problem = validateAutomation(a).find((p) => p.target === check.id);
    expect(problem?.message).toMatch(/which field/i);
  });

  it("wants a value for an operator that takes one", () => {
    const a = sampleAutomation();
    const check = a.conditions[0];
    if (!check) throw new Error("fixture lost its check");
    check.value = "";
    expect(validateAutomation(a).find((p) => p.target === check.id)?.message).toMatch(
      /needs a value/i
    );
  });

  it("does not want a value for an operator that takes none", () => {
    const a = sampleAutomation();
    const check = a.conditions[0];
    if (!check) throw new Error("fixture lost its check");
    check.operator = "isEmpty";
    check.value = "";
    expect(validateAutomation(a).some((p) => p.target === check.id)).toBe(false);
  });

  it("catches two steps saving their answer under the same name", () => {
    const a = sampleAutomation();
    const [decision, , create] = a.steps;
    if (!decision || !create) throw new Error("fixture lost a step");
    create.resultName = decision.resultName;
    expect(validateAutomation(a).find((p) => p.target === create.id)?.message).toMatch(
      /both save their answer/i
    );
  });

  it("names the step and what it is missing", () => {
    const a = sampleAutomation();
    const decision = a.steps[0];
    if (!decision) throw new Error("fixture lost its decision step");
    decision.props = {};
    expect(validateAutomation(a).find((p) => p.target === decision.id)?.message).toBe(
      "Step 1 is missing a rule table to look up."
    );
  });

  it("asks for a name and a record type on a fresh automation", () => {
    const a = emptyAutomation("");
    a.name = "";
    const targets = validateAutomation(a).map((p) => p.target);
    expect(targets).toContain("name");
    expect(targets).toContain("trigger");
  });
});

/**
 * A hook is its own workflow: one handler, and the steps that follow it. The
 * builder once stopped at the rungs and the stored form dropped steps, so an
 * author could add them and watch them vanish on save.
 */
describe("a hook workflow carries its own steps", () => {
  function hookWorkflow(): Automation {
    const a = emptyAutomation("Course", "hook");
    a.name = "beforeUpdateCourse";
    a.trigger = { entity: "Course", event: "created" };
    a.hooks = [newHook("beforeUpdate")];
    const hook = a.hooks[0];
    if (hook) hook.handler = "beforeUpdateCourse";

    const update = newStep("UpdateEntity");
    update.props = { entity: "Course", field: "status", value: "published" };
    a.steps = [update];
    a.conditions = [{ ...newCondition(), field: "course.status", operator: "eq", value: "draft" }];
    return a;
  }

  it("keeps the handler and the steps through a round trip", () => {
    const reopened = reopen(hookWorkflow());
    expect(reopened.kind).toBe("hook");
    expect(reopened.hooks.map((h) => `${h.event}:${h.handler}`)).toEqual([
      "beforeUpdate:beforeUpdateCourse",
    ]);
    expect(reopened.steps).toHaveLength(1);
    expect(reopened.steps[0]?.props).toMatchObject({ field: "status", value: "published" });
    expect(reopened.conditions[0]).toMatchObject({ field: "course.status", value: "draft" });
  });

  it("does not require steps on a hook that only has handlers", () => {
    const a = emptyAutomation("Course", "hook");
    a.name = "beforeCreateCourse";
    a.hooks = [newHook("beforeCreate")];
    const hook = a.hooks[0];
    if (hook) hook.handler = "beforeCreateCourse";
    a.steps = [];
    expect(validateAutomation(a).filter((p) => p.target === "steps")).toEqual([]);
  });

  it("still validates the steps a hook does carry", () => {
    const a = hookWorkflow();
    const step = a.steps[0];
    if (!step) throw new Error("fixture lost its step");
    step.props = { entity: "Course" };
    expect(validateAutomation(a).some((p) => p.target === step.id)).toBe(true);
  });
});
