/**
 * The enhance page shows a rule's `actions` as the decision table the
 * generated application's rule editor edits. An edit made there is written back
 * into the model as actions, so the two ends have to agree: what
 * `buildActionDecisionTable` compiles, `tableToRuleActions` must read back as
 * the actions that produced it.
 *
 * The failure this guards against is silent: the round trip still saves, but
 * an action comes back with the runtime's `prevent` instead of the model's
 * `validation-error`, or a transform loses its target, and the rule quietly
 * changes what it does. So the property held here is the identity on an
 * unedited rule.
 */

import { describe, expect, it } from "vitest";
import type { RuleAction } from "../../model/records";
import { buildActionDecisionTable, tableToRuleActions } from "../index";

const RULE_NAME = "paymentRecording";

const ACTIONS: RuleAction[] = [
  {
    name: "requireCardReference",
    type: "validation-error",
    when: 'method == "card" and reference == null',
    props: { message: "A card payment needs its authorisation code." },
  },
  {
    name: "requireTransferReference",
    type: "validation-error",
    when: 'method == "bank_transfer" and reference == null',
    props: { message: "A bank transfer needs its bank reference." },
  },
  {
    name: "stampCashReference",
    type: "transform",
    when: "method == cash",
    props: { field: "reference", value: "counted-into-till" },
  },
  {
    name: "startReconciliation",
    type: "trigger-workflow",
    when: 'method == "bank_transfer"',
    props: { workflow: "BankReconciliation", message: "Kick off reconciliation" },
  },
];

function table() {
  const graph = buildActionDecisionTable(
    RULE_NAME,
    ACTIONS.map((action) => ({ ...action, when: action.when ?? "true" }))
  );
  const node = graph.nodes.find((n) => n.type === "decisionTableNode");
  if (!node?.content) throw new Error("no decision table node");
  return node.content;
}

describe("reading a rule's actions back out of the compiled table", () => {
  it("returns the actions it was compiled from, unchanged", () => {
    expect(tableToRuleActions(RULE_NAME, table())).toEqual(ACTIONS);
  });

  it("translates the runtime's prevent back to the model's validation-error", () => {
    const [first] = tableToRuleActions(RULE_NAME, table());
    expect(first?.type).toBe("validation-error");
  });

  it("keeps a transform's field and value", () => {
    const transform = tableToRuleActions(RULE_NAME, table()).find(
      (action) => action.name === "stampCashReference"
    );
    expect(transform?.props).toEqual({ field: "reference", value: "counted-into-till" });
  });

  it("joins several input columns with `and` rather than dropping them", () => {
    // The editor lets an author add a second condition column. An action
    // carries one `when`, so the two have to meet there instead of the extra
    // one going missing on save.
    const withSecondInput = table();
    withSecondInput.inputs?.push({ id: "i2", name: "Method", field: "method" });
    for (const row of withSecondInput.rules ?? []) row.i2 = "check";
    const [first] = tableToRuleActions(RULE_NAME, withSecondInput);
    expect(first?.when).toBe('method == "card" and reference == null and check');
  });

  it("does not invent a message the model never wrote", () => {
    // The compiler fills a blank message with `<rule>: <action>` so the runtime
    // always has something to show; that default is not part of the model.
    const transform = tableToRuleActions(RULE_NAME, table()).find(
      (action) => action.type === "transform"
    );
    expect(transform?.props.message).toBeUndefined();
  });

  it("reads a transform's target out of its payload when the table carries only that", () => {
    const typed = table();
    const fieldColumn = typed.outputs?.find((column) => column.field === "field");
    expect(fieldColumn).toBeUndefined();
    const transform = tableToRuleActions(RULE_NAME, typed).find(
      (action) => action.name === "stampCashReference"
    );
    expect(transform?.props.field).toBe("reference");
  });
});
