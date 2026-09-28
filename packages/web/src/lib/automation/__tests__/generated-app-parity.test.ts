/**
 * The generated app and this one must behave identically.
 *
 * The builder ships twice — once here, once copied into every generated
 * project — and the copy is what a customer actually uses. A drift between them
 * shows up as an automation that opens correctly in the modelling tool and
 * wrongly in the app it was generated for, which is the worst place to find it.
 *
 * It drifted once: the generated copy stopped validating the steps a hook
 * workflow carries, and nothing here noticed, because the behaviour check below
 * never built a hook. So the first check is the strictest one available — the
 * two copies are the same bytes — and the behaviour checks cover every kind,
 * so that a copy made deliberately different still has to agree on what it does.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as generated from "../../../../../generator/templates/tanstack-astryx-loco/frontend/src/lib/automation/model";
import * as generatedRules from "../../../../../generator/templates/tanstack-astryx-loco/frontend/src/lib/automation/rule-content";
import * as generatedYaml from "../../../../../generator/templates/tanstack-astryx-loco/frontend/src/lib/automation/yaml";
import * as web from "../model";
import * as webRules from "../rule-content";
import * as webYaml from "../yaml";

const TEMPLATE = path.resolve(
  __dirname,
  "../../../../../generator/templates/tanstack-astryx-loco/frontend/src/lib/automation"
);
const HERE = path.resolve(__dirname, "..");

const ENTITIES = [
  "Compound",
  "Experiment",
  "Sample",
  "ChemicalInventory",
  "Instrument",
  "DeviationReport",
  "CAPA",
  "StabilityTest",
];

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** One automation of each kind per `n`, all plain data. */
function automations(seed: number, count: number): web.Automation[] {
  const rand = makeRandom(seed);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)] as T;
  const out: web.Automation[] = [];
  for (let n = 1; n <= count; n++) {
    const entity = pick(ENTITIES);
    const kind = (["automation", "hook", "saga"] as const)[n % 3] as web.AutomationKind;
    const loop: web.Loop = {
      id: `l${n}`,
      condition: { id: `lc${n}`, field: `${entity.toLowerCase()}.status`, operator: "neq", value: "done" },
      maxPasses: String(1 + (n % 9)),
    };
    out.push({
      id: `a${n}`,
      name: `Parity ${n}`,
      kind,
      trigger: { entity, event: pick(web.TRIGGER_EVENTS) },
      conditions: [
        { id: `c${n}`, field: `${entity.toLowerCase()}.status`, operator: "eq", value: `state-${n}` },
      ],
      loops: kind === "automation" ? [loop] : [],
      steps: web.STEP_TYPES.map((type, i) => ({
        id: `s${n}_${i}`,
        type,
        resultName: `r${n}_${i}`,
        props: { ruleTable: "Assay tier", entity, field: "status", value: `v${i}`, url: "u" },
        ...(kind === "automation" && i === 1 ? { loopId: loop.id } : {}),
      })),
      hooks:
        kind === "hook"
          ? [
              { id: `h${n}a`, event: pick(web.HOOK_EVENTS), handler: `handle${n}` },
              { id: `h${n}b`, event: "customValidate", handler: `check${n}`, field: "status" },
            ]
          : [],
      ...(kind === "saga"
        ? { sagaTrigger: n % 2 ? "rule" : "automatic", sagaOperation: "UPDATE" }
        : {}),
      status: pick(["draft", "live", "paused"] as const),
    });
  }
  return out;
}

describe("the copy shipped to generated apps", () => {
  it("is the same file as the modelling tool's, byte for byte", () => {
    for (const file of ["model.ts", "yaml.ts", "rule-content.ts"]) {
      expect(readFileSync(path.join(TEMPLATE, file), "utf-8"), file).toBe(
        readFileSync(path.join(HERE, file), "utf-8")
      );
    }
  });

  it("declares the same step types, triggers and operators", () => {
    expect(generated.STEP_TYPES).toEqual(web.STEP_TYPES);
    expect(generated.TRIGGER_EVENTS).toEqual(web.TRIGGER_EVENTS);
    expect(generated.OPERATORS).toEqual(web.OPERATORS);
    expect(generated.STEP_LABELS).toEqual(web.STEP_LABELS);
    expect(generated.STEP_HINTS).toEqual(web.STEP_HINTS);
    expect(generated.TRIGGER_LABELS).toEqual(web.TRIGGER_LABELS);
    expect(generated.TRIGGER_HOOKS).toEqual(web.TRIGGER_HOOKS);
    expect(generated.STEP_FIELDS).toEqual(web.STEP_FIELDS);
    expect(generated.HOOK_EVENTS).toEqual(web.HOOK_EVENTS);
  });

  it("writes 300 automations of every kind to byte-identical YAML", () => {
    const mismatches: string[] = [];
    for (const automation of automations(775533, 300)) {
      const fromWeb = webYaml.automationToYaml(automation);
      const fromGenerated = generatedYaml.automationToYaml(
        automation as unknown as generated.Automation
      );
      if (fromWeb !== fromGenerated) mismatches.push(automation.name);
    }
    expect(mismatches).toEqual([]);
  });

  it("reads each of those documents back into the same automation", () => {
    const shape = (a: web.Automation | generated.Automation) => {
      const { id: _id, ...rest } = a;
      return JSON.stringify(rest);
    };
    const mismatches: string[] = [];
    for (const automation of automations(918273, 300)) {
      const text = webYaml.automationToYaml(automation);
      const a = webYaml.automationFromYaml(text);
      const b = generatedYaml.automationFromYaml(text);
      if (shape(a) !== shape(b)) mismatches.push(automation.name);
      // And the round trip is lossless: writing what was read gives the same bytes.
      if (webYaml.automationToYaml(a) !== text) mismatches.push(`${automation.name} (round trip)`);
    }
    expect(mismatches).toEqual([]);
  });

  it("validates every one of them to the same problems", () => {
    for (const automation of automations(55, 90)) {
      const a = web
        .validateAutomation(automation)
        .map((p) => p.message)
        .sort();
      const b = generated
        .validateAutomation(automation as unknown as generated.Automation)
        .map((p) => p.message)
        .sort();
      expect(b, automation.name).toEqual(a);
    }
  });

  it("validates a broken automation to the same problems", () => {
    const broken: web.Automation = {
      id: "x",
      name: "",
      kind: "automation",
      trigger: { entity: "", event: "created" },
      conditions: [{ id: "c", field: "", operator: "eq", value: "" }],
      loops: [],
      steps: [{ id: "s", type: "Decision", resultName: "", props: {} }],
      hooks: [],
      status: "draft",
    };

    const a = web
      .validateAutomation(broken)
      .map((p) => p.message)
      .sort();
    const b = generated
      .validateAutomation(broken as unknown as generated.Automation)
      .map((p) => p.message)
      .sort();

    expect(b).toEqual(a);
    expect(a.length).toBeGreaterThan(0);
  });

  it("offers the same values at the same point in a run", () => {
    const automation: web.Automation = {
      id: "a",
      name: "Values",
      kind: "automation",
      trigger: { entity: "Experiment", event: "updated" },
      conditions: [],
      loops: [],
      steps: [
        { id: "s1", type: "Decision", resultName: "tier", props: { ruleTable: "Assay tier" } },
        { id: "s2", type: "CreateEntity", resultName: "capaId", props: { entity: "CAPA" } },
        { id: "s3", type: "REST", resultName: "reply", props: { url: "u", method: "POST" } },
      ],
      hooks: [],
      status: "draft",
    };
    const fields = { Experiment: ["id", "status", "run_count"] };

    for (let i = 0; i <= automation.steps.length; i++) {
      const a = web.valuesAvailableAt(automation, i, fields).map((v) => v.path);
      const b = generated
        .valuesAvailableAt(automation as unknown as generated.Automation, i, fields)
        .map((v) => v.path);
      expect(b).toEqual(a);
    }
  });

  it("treats stored rule content the same way", () => {
    const table = {
      hitPolicy: "first" as const,
      inputs: [{ id: "i1", name: "Purity", field: "Compound.purity" }],
      outputs: [{ id: "o1", name: "Tier", field: "tier" }],
      rules: [{ _id: "r1", i1: "> 95", o1: "A" }],
    };
    const legacy = { name: "Old", nodes: [] };

    expect(generatedRules.isDecisionTable(table)).toBe(webRules.isDecisionTable(table));
    expect(generatedRules.isDecisionTable(legacy)).toBe(webRules.isDecisionTable(legacy));
    expect(generatedRules.asDecisionTable(table)).toEqual(webRules.asDecisionTable(table));
    expect(generatedRules.wouldReplaceStoredContent(legacy)).toBe(
      webRules.wouldReplaceStoredContent(legacy)
    );
  });
});
