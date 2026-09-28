import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModelYaml } from "@appwithai/generator/model-yaml";
import { emptyDecisionTable } from "../../workflow/bpmn-model";
import { readRules, slugifyRuleName, writeRules } from "../rules";

const ROOT = path.resolve(__dirname, "../../../../../..");
const MODELS = [
  "examples/drug-discovery.eml.yaml",
  "language/yaml/examples/crm.eml.yaml",
  "language/yaml/examples/dance-studio.eml.yaml",
  "language/yaml/examples/helpdesk.eml.yaml",
];
const load = (file: string) => readModelYaml(readFileSync(path.join(ROOT, file), "utf-8")).document!;

describe("readRules / writeRules", () => {
  for (const file of MODELS) {
    it(`writes ${path.basename(file)}'s rules back exactly as declared when nothing is edited`, () => {
      const rules = load(file).rules ?? [];
      expect(writeRules(readRules(rules, emptyDecisionTable))).toEqual(rules);
    });
  }

  it("covers the corpus's two kinds; a table rule is covered by its own round trip below", () => {
    const kinds = new Set(
      MODELS.flatMap((file) => readRules(load(file).rules, emptyDecisionTable).map((r) => r.kind))
    );
    expect([...kinds].sort()).toEqual(["actions", "graph"]);
  });

  it("shows actions as a table in the model's own words and keeps the columns in use", () => {
    const rule = readRules(load("language/yaml/examples/crm.eml.yaml").rules, emptyDecisionTable).find(
      (r) => r.kind === "actions"
    )!;
    const action = rule.table.outputs.find((c) => c.field === "action")!;
    expect(rule.table.rules.every((row) => !String(row[action.id]).startsWith("'"))).toBe(true);
    expect(rule.table.outputs.some((c) => c.field === "ruleId")).toBe(false);
  });

  it("writes a new rule as a table rule, reads it back as one, and keeps an edit to it", () => {
    const table = {
      hitPolicy: "first" as const,
      inputs: [{ id: "i1", name: "Amount", field: "amount" }],
      outputs: [{ id: "o1", name: "Action", field: "action" }],
      rules: [{ _id: "big", i1: "> 100000", o1: "validation-error" }],
    };
    const [created] = writeRules([
      {
        key: "new",
        name: slugifyRuleName("Flag large orders"),
        entity: "Opportunity",
        event: "beforeCreate",
        table,
        kind: "table",
      },
    ]);
    expect(created).toMatchObject({ name: "flagLargeOrders", nodes: [], edges: [] });
    expect(created?.decisionTable).toEqual(table);

    const [read] = readRules([created!], emptyDecisionTable);
    expect(read?.kind).toBe("table");
    expect(writeRules([read!])).toEqual([created]);

    const edited = { ...read!, table: { ...read!.table, hitPolicy: "collect" as const } };
    expect(writeRules([edited])[0]?.decisionTable?.hitPolicy).toBe("collect");
  });

  it("writes an edited actions rule back as actions, keeping its graph", () => {
    const rule = readRules(load("language/yaml/examples/crm.eml.yaml").rules, emptyDecisionTable).find(
      (r) => r.kind === "actions"
    )!;
    const action = rule.table.outputs.find((c) => c.field === "action")!;
    const table = { ...rule.table, rules: rule.table.rules.slice(0, 1) };
    const [written] = writeRules([{ ...rule, table }]);
    expect(written?.actions).toHaveLength(1);
    expect(written?.actions?.[0]?.type).toBe(rule.table.rules[0]?.[action.id]);
    expect(written?.nodes).toEqual(rule.source!.nodes);
    expect(written?.decisionTable).toBeUndefined();
  });
});
