/**
 * Repeat-while-a-rule-holds.
 *
 * The loop is the only construct in the builder that can fail to terminate, and
 * an automation runs inside the write that triggered it — so a loop that cannot
 * end does not spin a harmless background job, it holds a transaction open.
 * That makes two things worth pinning hardest: the check survives a round trip
 * exactly, and the model refuses the shapes that could never stop.
 */

import { describe, expect, it } from "vitest";
import {
  type Automation,
  type AutomationStep,
  emptyAutomation,
  loopIsContiguous,
  loopsOf,
  newLoop,
  stepsInLoop,
  validateAutomation,
  valuesAvailableAt,
} from "../model";
import { automationFromYaml, automationToYaml } from "../yaml";

function update(field: string, value: string, loopId?: string): AutomationStep {
  return {
    id: `st_${field}_${loopId ?? "out"}`,
    type: "UpdateEntity",
    resultName: "",
    props: { entity: "Sample", field, value },
    loopId,
  };
}

/** A well-formed loop: the body writes the field the check reads. */
function looping(): Automation {
  const a = emptyAutomation("Sample");
  a.name = "Drain the backlog";
  a.trigger.event = "updated";
  const loop = newLoop(a.loops);
  loop.condition = { id: "c1", field: "retry_count", operator: "lt", value: "5" };
  loop.maxPasses = "10";
  a.loops.push(loop);
  a.steps.push(update("retry_count", "{{L1.iteration}}", loop.id));
  a.steps.push(update("status", "drained"));
  return a;
}

describe("storing a loop", () => {
  const document = automationToYaml(looping());

  it("writes the check and its give-up limit on the loop", () => {
    expect(document).toContain(
      ["loops:", "  - id: L1", "    condition:", "      id: c1", "      field: retry_count",
        "      operator: lt", '      value: "5"', '    maxPasses: "10"'].join("\n")
    );
  });

  it("marks each member with the loop it belongs to, and only the members", () => {
    expect(document.match(/loopId: L1/g)).toHaveLength(1);
  });
});

describe("reading a loop back", () => {
  const back = automationFromYaml(automationToYaml(looping()));

  it("recovers the give-up limit", () => {
    expect(loopsOf(back)[0]?.maxPasses).toBe("10");
  });

  it("recovers the check exactly", () => {
    expect(loopsOf(back)[0]?.condition).toMatchObject({
      field: "retry_count",
      operator: "lt",
      value: "5",
    });
  });

  it("recovers which steps are inside", () => {
    expect(stepsInLoop(back, "L1")).toHaveLength(1);
    expect(back.steps).toHaveLength(2);
    expect(back.steps[1]?.loopId).toBeUndefined();
  });

  it("survives a second round trip unchanged", () => {
    const once = automationToYaml(back);
    expect(automationToYaml(automationFromYaml(once))).toBe(once);
  });

  it("refuses a membership naming a loop that was never declared", () => {
    // A step in a repeat with no check would execute once and look like it
    // repeated; the document is refused rather than opened that way.
    const orphan = automationToYaml(looping()).replace("loopId: L1", "loopId: Lnope");
    expect(() => automationFromYaml(orphan)).toThrow(/steps\[0\]\.loopId: Lnope/);
  });

  it("keeps a loop that has no members, and validation says so", () => {
    const a = looping();
    for (const step of a.steps) step.loopId = undefined;
    const reopened = automationFromYaml(automationToYaml(a));
    expect(loopsOf(reopened)).toHaveLength(1);
    expect(validateAutomation(reopened).map((p) => p.message)).toContain(
      "Repeat L1 has no steps in it. Add one, or remove the repeat."
    );
  });
});

describe("what the model refuses", () => {
  it("a loop whose check nothing inside can change", () => {
    // The body writes `status`, the check reads `retry_count`. It would read the
    // same every pass, so the loop either never runs or runs to the limit.
    const a = looping();
    a.steps[0] = update("status", "spinning", "L1");
    const problems = validateAutomation(a);
    expect(
      problems.some((p) => p.target === "L1" && /Nothing inside repeat L1 changes/.test(p.message))
    ).toBe(true);
    expect(problems.some((p) => p.message.includes("10 passes"))).toBe(true);
  });

  it("a loop with no check at all", () => {
    const a = looping();
    (loopsOf(a)[0] as { condition: { field: string } }).condition.field = "";
    expect(
      validateAutomation(a).some((p) => p.target === "L1" && /never stop/.test(p.message))
    ).toBe(true);
  });

  it("a check that needs a value but has none", () => {
    const a = looping();
    (loopsOf(a)[0] as { condition: { value: string } }).condition.value = "";
    expect(
      validateAutomation(a).some((p) => p.target === "L1" && /needs a value/.test(p.message))
    ).toBe(true);
  });

  it("members split apart by an outside step", () => {
    const a = looping();
    a.steps = [
      update("retry_count", "1", "L1"),
      update("status", "middle"),
      update("retry_count", "2", "L1"),
    ];
    expect(loopIsContiguous(a, "L1")).toBe(false);
    expect(
      validateAutomation(a).some((p) => p.target === "L1" && /between them/.test(p.message))
    ).toBe(true);
  });

  it("a repeat with no give-up limit", () => {
    // There is no default: an unbounded repeat is the one thing that can hold a
    // write open, so the author has to state what "too many" means here.
    const a = looping();
    (loopsOf(a)[0] as { maxPasses: string }).maxPasses = "";
    expect(
      validateAutomation(a).some((p) => p.target === "L1" && /how many passes/.test(p.message))
    ).toBe(true);
  });

  it("a limit that is not a whole number", () => {
    const a = looping();
    (loopsOf(a)[0] as { maxPasses: string }).maxPasses = "lots";
    expect(
      validateAutomation(a).some(
        (p) => p.target === "L1" && /whole number of passes/.test(p.message)
      )
    ).toBe(true);
  });

  it("a limit below one pass", () => {
    const a = looping();
    (loopsOf(a)[0] as { maxPasses: string }).maxPasses = "0";
    expect(
      validateAutomation(a).some((p) => p.target === "L1" && /at least 1 pass/.test(p.message))
    ).toBe(true);
  });

  it("accepts the well-formed one", () => {
    expect(validateAutomation(looping())).toEqual([]);
  });

  it("treats a non-UpdateEntity member as able to change anything", () => {
    // A REST call or a Decision can change the world in ways this cannot see,
    // so only the case it is certain about is reported.
    const a = looping();
    a.steps[0] = {
      id: "rest",
      type: "REST",
      resultName: "",
      props: { method: "POST", url: "https://example.com/x", body: "" },
      loopId: "L1",
    };
    expect(validateAutomation(a).filter((p) => p.target === "L1")).toEqual([]);
  });
});

describe("what a step inside a loop can reference", () => {
  it("offers the pass number", () => {
    const a = looping();
    const paths = valuesAvailableAt(a, 0, { Sample: ["retry_count"] }).map((v) => v.path);
    expect(paths).toContain("L1.iteration");
  });

  it("does not offer it to a step outside the loop", () => {
    const a = looping();
    const paths = valuesAvailableAt(a, 1, { Sample: ["retry_count"] }).map((v) => v.path);
    expect(paths).not.toContain("L1.iteration");
  });
});

describe("an automation stored before loops existed", () => {
  it("writes and validates without a `loops` field", () => {
    // Rows written before loops existed have no `loops` field at all.
    const legacy = emptyAutomation("Sample") as Automation & { loops?: unknown };
    legacy.steps.push(update("status", "x"));
    legacy.loops = undefined as never;
    expect(automationToYaml(legacy as Automation)).toContain("loops: []");
    expect(validateAutomation(legacy as Automation)).toEqual([]);
  });

  it("reads a document with no `loops` key as having none", () => {
    const text = automationToYaml(looping())
      .replace(/loops:\n(?:  .*\n)+/, "")
      .replace(/ *loopId: L1\n/, "");
    expect(loopsOf(automationFromYaml(text))).toEqual([]);
  });
});
