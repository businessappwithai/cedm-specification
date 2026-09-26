/**
 * The compiled row is asserted against the *runtime's* action union, never
 * against the compiler's own output.
 *
 * EML and the generated Loco backend do not share an action vocabulary, and
 * two of the three types EML ships were inert because of it:
 *
 * - `validation-error` is EML's word for a refusal; `promotion.rs` looks for
 *   `prevent`. A compiled `validation-error` row matched, was handed to
 *   `run_action`, fell through to the `other` arm and was logged as unknown —
 *   so a rule written to refuse a write let every write through.
 * - `transform` had no payload column at all, so `JdmViolation.transform_data`
 *   — which the runtime already deserialises — arrived empty, and the action
 *   had nothing to write even once it had somewhere to write it.
 *
 * A test that reads back what `buildActionDecisionTable` produced cannot see
 * either failure: the compiler was perfectly self-consistent. These assert the
 * literal strings `services/promotion.rs` matches on.
 */

import { describe, expect, it } from "vitest";
import { buildActionDecisionTable, parseRuleActions } from "../index";

/** The `action_type` values `promotion.rs::run_action` matches on. */
const RUNTIME_ACTIONS = new Set([
  "prevent",
  "transform",
  "trigger-workflow",
  "cascade-update",
  "create-record",
]);

function table(directives: string) {
  const actions = parseRuleActions(directives);
  const graph = buildActionDecisionTable("quoteDiscountApproval", actions);
  const node = graph.nodes.find((n) => n.type === "decisionTableNode");
  return { node, rows: node?.content?.rules ?? [] };
}

/** The cell id carrying a named output column. */
function cellId(node: ReturnType<typeof table>["node"], field: string): string {
  const column = node?.content?.outputs?.find((o) => o.field === field);
  if (!column) throw new Error(`no output column for ${field}`);
  return column.id;
}

describe("a compiled %%action row", () => {
  it("writes a refusal in the word the runtime refuses on", () => {
    const { node, rows } = table(
      "%%action refuseDiscount validation-error when: discount_percent > 40 message: Reprice the quote"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[cellId(node, "action")]).toBe("'prevent'");
  });

  it("leaves the types EML already spells the runtime's way alone", () => {
    const { node, rows } = table(
      "%%action escalate trigger-workflow when: amount > 1000 workflow: Approval"
    );
    expect(rows[0]?.[cellId(node, "action")]).toBe("'trigger-workflow'");
    expect(rows[0]?.[cellId(node, "workflowName")]).toBe("'Approval'");
  });

  it("names only actions the runtime implements", () => {
    const { node, rows } = table(`
%%action refuseDiscount validation-error when: discount_percent > 40 message: No
%%action stampTier transform when: amount > 50000 field: tier value: strategic
%%action escalate trigger-workflow when: amount > 1000 workflow: Approval
`);
    const id = cellId(node, "action");
    for (const row of rows) {
      const emitted = String(row[id]).replace(/^'|'$/g, "");
      expect(RUNTIME_ACTIONS.has(emitted), `${emitted} is not a runtime action`).toBe(true);
    }
  });

  it("folds a transform's field and value into the one object the runtime reads", () => {
    const { node, rows } = table(
      "%%action stampTier transform when: amount > 50000 field: tier value: strategic"
    );
    expect(rows[0]?.[cellId(node, "action")]).toBe("'transform'");
    expect(rows[0]?.[cellId(node, "transformData")]).toBe('\'{"tier":"strategic"}\'');
  });

  it("leaves transformData empty for an action that is not a transform", () => {
    const { node, rows } = table(
      "%%action escalate trigger-workflow when: amount > 1000 workflow: Approval"
    );
    expect(rows[0]?.[cellId(node, "transformData")]).toBe("''");
  });

  it("writes every declared column on every row", () => {
    // zen-engine yields no result at all for a row with a missing cell, so an
    // omitted column disables the whole rule rather than one of its outputs.
    const { node, rows } = table(`
%%action refuseDiscount validation-error when: discount_percent > 40 message: No
%%action stampTier transform when: amount > 50000 field: tier value: strategic
`);
    const ids = (node?.content?.outputs ?? []).map((o) => o.id);
    for (const row of rows) {
      for (const id of ids) expect(row[id]).toBeDefined();
    }
  });
});
