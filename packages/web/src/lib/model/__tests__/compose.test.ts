/**
 * Composition: the model plus the sagas and hooks the project's automations
 * and services add — the one document generation reads.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileModelDocument,
  readModelYaml,
  serializeModelDocument,
} from "@appwithai/generator/model-yaml";
import { type Automation, emptyAutomation, newCondition, newHook, newStep } from "../../automation/model";
import { composeModel, identifierOf, sagaStepOf } from "../compose";

const MODEL = path.resolve(__dirname, "../../../../../../examples/drug-discovery.eml.yaml");
const document = (() => {
  const read = readModelYaml(readFileSync(MODEL, "utf-8"));
  if (!read.document) throw new Error("drug-discovery.eml.yaml does not read");
  return read.document;
})();

function escalation(): Automation {
  const a = emptyAutomation("DeviationReport", "saga");
  a.name = "Escalate open deviations";
  a.sagaTrigger = "rule";
  a.sagaOperation = "UPDATE";
  const days = newStep("Formula");
  days.resultName = "dueDays";
  days.props = { operation: "multiply", left: "{{baseDays}}", right: "7" };
  const capa = newStep("CreateEntity");
  capa.resultName = "capaId";
  capa.props = { entity: "CAPA", values: '{"title":"Escalated"}' };
  const mark = newStep("UpdateEntity");
  mark.props = { field: "status", value: "escalated", target: "{{capaId}}" };
  a.steps = [days, capa, mark];
  return a;
}

describe("sagaStepOf", () => {
  it("translates each step into the saga dialect the generator compiles", () => {
    const [days, capa, mark] = escalation().steps.map(sagaStepOf);
    expect(days).toMatchObject({
      type: "Formula",
      properties: { target: "dueDays", operation: "multiply", source: "baseDays", operand: "7" },
    });
    expect(capa).toMatchObject({
      type: "CreateEntity",
      properties: { as: "capaId", entity: "CAPA", fields: '{"title":"Escalated"}' },
    });
    expect(mark).toMatchObject({
      type: "UpdateEntity",
      properties: { field: "status", value: "escalated", targetSource: "capaId" },
    });
  });

  it("writes a Decision's own table as the table, and a named one as the rule", () => {
    const own = newStep("Decision");
    own.resultName = "tier";
    own.table = {
      hitPolicy: "first",
      inputs: [{ id: "i1", name: "Severity", field: "severity" }],
      outputs: [{ id: "o1", name: "Tier", field: "tier" }],
      rules: [{ _id: "r1", i1: "'critical'", o1: "1" }],
    };
    expect(JSON.parse(sagaStepOf(own).properties?.decisionTable ?? "")).toEqual(own.table);
    const named = newStep("Decision");
    named.props = { ruleTable: "Assay tier" };
    expect(sagaStepOf(named).properties).toEqual({ as: named.resultName, rule: "Assay tier" });
  });

  it("keeps a property with no counterpart under its own name", () => {
    const step = newStep("REST");
    step.props = { url: "https://example.test/hook", method: "POST", retries: "3" };
    expect(sagaStepOf(step).properties).toMatchObject({ url: "https://example.test/hook", retries: "3" });
  });
});

describe("composeModel", () => {
  it("returns the model unchanged when nothing adds to it", () => {
    const composed = composeModel(document, { automations: [], serviceHooks: [] });
    expect(composed.added).toEqual({ sagas: 0, hooks: 0 });
    expect(composed.issues).toEqual([]);
    expect(serializeModelDocument(composed.document)).toBe(serializeModelDocument(document));
  });

  it("adds a saga automation as a saga the generator compiles", () => {
    const composed = composeModel(document, { automations: [escalation()], serviceHooks: [] });
    expect(composed.added.sagas).toBe(1);
    expect(composed.issues).toEqual([]);

    // The composed document is still a valid model, and the saga reaches the compiler.
    const read = readModelYaml(serializeModelDocument(composed.document));
    expect(read.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const compiled = compileModelDocument(read.document!);
    const saga = compiled.sagas?.find((s) => s.name === "EscalateOpenDeviations");
    expect(saga).toMatchObject({ entity: "DeviationReport", trigger: "rule", operation: "UPDATE" });
    expect(saga?.steps.map((step) => step.nodeType)).toEqual([
      "Formula",
      "CreateEntity",
      "UpdateEntity",
    ]);
    // And the compiler found nothing missing: each step carries what its type requires.
    expect(saga?.steps[0]?.properties).toMatchObject({ target: "dueDays", operation: "multiply" });
  });

  it("says what a saga cannot carry instead of dropping it silently", () => {
    const a = escalation();
    a.conditions = [{ ...newCondition(), field: "severity", operator: "eq", value: "critical" }];
    const composed = composeModel(document, { automations: [a], serviceHooks: [] });
    expect(composed.issues).toEqual([
      expect.objectContaining({ severity: "warning", source: a.name }),
    ]);
    expect(composed.added.sagas).toBe(1);
  });

  it("refuses a saga that reuses a name the model gives a different saga", () => {
    const existing = document.sagas?.[0];
    if (!existing) throw new Error("drug-discovery declares a saga");
    const a = escalation();
    a.name = existing.name;
    const composed = composeModel(document, { automations: [a], serviceHooks: [] });
    expect(composed.issues).toEqual([
      expect.objectContaining({ severity: "error", message: expect.stringContaining("rename") }),
    ]);
    expect(composed.document.sagas).toEqual(document.sagas);
  });

  it("adds a hook workflow's rungs and a service's enabled hooks, each once", () => {
    const hooks = emptyAutomation("Compound", "hook");
    hooks.name = "Compound hygiene";
    hooks.hooks = [
      { ...newHook("beforeCreate"), handler: "normaliseSmiles", field: "smiles" },
      { ...newHook("afterUpdate"), handler: "reindexCompound" },
    ];
    const composed = composeModel(document, {
      automations: [hooks],
      serviceHooks: [
        {
          service: "Compound",
          hooks: [
            { type: "afterUpdate", name: "reindexCompound", enabled: true, order: 1 },
            { type: "beforeDelete", name: "guardRegistered", enabled: true, order: 0 },
            { type: "afterCreate", name: "notifyChemist", enabled: false, order: 2 },
          ],
        },
      ],
    });
    expect(composed.issues).toEqual([]);
    const added = composed.document.hooks?.slice(document.hooks?.length ?? 0);
    expect(added).toEqual([
      { entity: "Compound", event: "beforeCreate", handler: "normaliseSmiles", fields: ["smiles"] },
      { entity: "Compound", event: "afterUpdate", handler: "reindexCompound" },
      { entity: "Compound", event: "beforeDelete", handler: "guardRegistered" },
    ]);
  });

  it("refuses a hook on an entity the model does not declare", () => {
    const composed = composeModel(document, {
      automations: [],
      serviceHooks: [{ service: "Invoice", hooks: [{ type: "beforeCreate", name: "stamp" }] }],
    });
    expect(composed.issues[0]).toMatchObject({ severity: "error", source: "Invoice hooks" });
    expect(composed.added.hooks).toBe(0);
  });

  it("does not compose a plain automation: it runs from the application's automations screen", () => {
    const plain = emptyAutomation("Sample");
    plain.steps = [newStep("UpdateEntity")];
    const composed = composeModel(document, { automations: [plain], serviceHooks: [] });
    expect(composed.added).toEqual({ sagas: 0, hooks: 0 });
  });
});

describe("identifierOf", () => {
  it("turns a title into the identifier a saga is named by", () => {
    expect(identifierOf("Escalate open deviations")).toBe("EscalateOpenDeviations");
    expect(identifierOf("closed-won handoff!")).toBe("ClosedWonHandoff");
    expect(identifierOf("2nd review")).toBe("Saga2ndReview");
  });
});
