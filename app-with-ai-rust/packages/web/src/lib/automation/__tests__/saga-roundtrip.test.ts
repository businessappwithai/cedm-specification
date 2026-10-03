/**
 * Sagas through the automation ladder.
 *
 * A saga is the ordered steps an automation already has, started by a business
 * rule or by a write rather than by one lifecycle event. How it starts is its
 * own `sagaTrigger` and `sagaOperation`, and the single-trigger shape has
 * nowhere else to put them: reading a saga into it once mapped the operation
 * onto the nearest lifecycle event and dropped both, so a rule-triggered saga
 * came back as "runs when created" and saving it said so.
 *
 * The property worth holding is that a saga survives the trip: write it, read
 * it, write it again, and nothing about how it starts has changed.
 */

import { describe, expect, it } from "vitest";
import { type Automation, emptyAutomation, newStep } from "../model";
import { automationFromYaml, automationToYaml } from "../yaml";

/** The five shapes the CRM model's sagas take. */
const SHAPES: Array<Pick<Automation, "name" | "sagaTrigger" | "sagaOperation"> & { entity: string }> =
  [
    { name: "LeadConversion", entity: "Lead", sagaTrigger: "rule", sagaOperation: "CREATE" },
    { name: "QuoteApprovalEscalation", entity: "Quote", sagaTrigger: "rule", sagaOperation: "CREATE" },
    { name: "ClosedWonHandoff", entity: "Opportunity", sagaTrigger: "automatic", sagaOperation: "UPDATE" },
    { name: "RenewalPlaybook", entity: "Contract", sagaTrigger: "automatic", sagaOperation: "UPDATE" },
    { name: "CriticalCaseEscalation", entity: "SupportCase", sagaTrigger: "automatic", sagaOperation: "CREATE" },
  ];

function saga(shape: (typeof SHAPES)[number]): Automation {
  const a = emptyAutomation(shape.entity, "saga");
  a.name = shape.name;
  a.sagaTrigger = shape.sagaTrigger;
  a.sagaOperation = shape.sagaOperation;
  const step = newStep("UpdateEntity");
  step.props = { field: "status", value: "handed_off" };
  a.steps = [step];
  return a;
}

describe("a saga through its document", () => {
  it("keeps how every CRM saga starts", () => {
    for (const shape of SHAPES) {
      const back = automationFromYaml(automationToYaml(saga(shape)));
      expect(back.kind, shape.name).toBe("saga");
      expect(back.trigger.entity, shape.name).toBe(shape.entity);
      expect({ trigger: back.sagaTrigger, operation: back.sagaOperation }, shape.name).toEqual({
        trigger: shape.sagaTrigger,
        operation: shape.sagaOperation,
      });
    }
  });

  it("writes how it starts even when that is the default", () => {
    // A document that left the defaults out would read the same today and
    // silently change meaning if a default ever did.
    const text = automationToYaml(saga(SHAPES[4]!));
    expect(text).toContain("sagaTrigger: automatic");
    expect(text).toContain("sagaOperation: CREATE");
  });

  it("reads a saga document that omits both as automatic on create", () => {
    const text = automationToYaml(saga(SHAPES[0]!))
      .replace(/sagaTrigger: .*\n/, "")
      .replace(/sagaOperation: .*\n/, "");
    const back = automationFromYaml(text);
    expect(back.sagaTrigger).toBe("automatic");
    expect(back.sagaOperation).toBe("CREATE");
  });

  it("refuses a start the language does not have", () => {
    const text = automationToYaml(saga(SHAPES[0]!)).replace("sagaTrigger: rule", "sagaTrigger: cron");
    expect(() => automationFromYaml(text)).toThrow(/sagaTrigger: cron/);
  });

  it("leaves a hook workflow without saga keys", () => {
    const hook = emptyAutomation("Account", "hook");
    const text = automationToYaml(hook);
    expect(text).not.toContain("sagaTrigger");
    expect(automationFromYaml(text).sagaTrigger).toBeUndefined();
  });
});
