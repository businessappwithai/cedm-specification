/**
 * A model's business rules as the rule editor edits them, and back.
 *
 * A rule decides in one of three ways, and the compiler takes the first it
 * finds (`compileRuleDeclarations` in `@appwithai/generator/rules`):
 *
 * 1. its `decisionTable` — edited here as the table it is;
 * 2. its `actions` — compiled to a decision table, so they are edited as that
 *    table here and written back as actions (`tableToRuleActions`), the round
 *    trip being the identity on an unedited rule;
 * 3. its decision graph (`nodes`/`edges`) — which is not a table, so it is
 *    shown in the model viewer and edited in the YAML, never flattened into a
 *    table by guesswork.
 *
 * Nothing here touches text: the page applies the rules it gets back as the
 * model's `rules` section (`lib/model/sections.ts`).
 */

import type { DecisionTable as ModelDecisionTable, RuleDocument } from "@appwithai/generator/model-yaml";
import { buildActionDecisionTable, tableToRuleActions } from "@appwithai/generator/rules";
import { asDecisionTable } from "../automation/rule-content";
import type { DecisionRow, DecisionTable } from "../workflow/bpmn-model";

export type RuleKind = "table" | "actions" | "graph";

export interface EditableRule {
  /** Stable across renames, so React keeps the row it is editing. */
  key: string;
  name: string;
  title?: string;
  entity: string;
  event: string;
  priority?: number;
  /** The table the editor shows; for a graph rule, empty and not written back. */
  table: DecisionTable;
  kind: RuleKind;
  /** The rule as the model declares it; absent for a rule added here. */
  source?: RuleDocument;
}

export const RULE_EVENTS = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "customValidate",
] as const;

/** A rule's name from what the author typed: camelCase, letters and digits. */
export function slugifyRuleName(value: string): string {
  const cleaned = value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
  return /^[A-Za-z]/.test(cleaned) ? cleaned : `rule${cleaned}`;
}

/** A zen cell as the text an author reads: `'prevent'` → `prevent`. */
function unquoteZenCell(value: string): string {
  const text = value.trim();
  if (
    text.length >= 2 &&
    (text.startsWith("'") || text.startsWith('"')) &&
    text.endsWith(text[0] as string)
  ) {
    return text.slice(1, -1).replace(/\\'/g, "'");
  }
  return text;
}

/** The runtime's `prevent` is the model's `validation-error` — the word an author writes. */
const RUNTIME_TO_MODEL_ACTION: Record<string, string> = { prevent: "validation-error" };

/**
 * A rule's actions as the table the editor shows.
 *
 * `buildActionDecisionTable` quotes every cell and spells actions in the
 * runtime's vocabulary. The cells are read back as plain text, `prevent` is
 * translated, and the columns no row uses are dropped — a two-action rule
 * opens as Action and Message, not nine wide columns.
 */
export function actionsTable(rule: RuleDocument): DecisionTable {
  const table = asDecisionTable(
    buildActionDecisionTable(
      rule.name,
      (rule.actions ?? []).map((action) => ({
        name: action.name,
        type: action.type,
        when: action.when ?? "true",
        props: action.props ?? {},
      }))
    )
  );
  const rules = table.rules.map((row) => {
    const next: DecisionRow = { _id: row._id };
    for (const column of [...table.inputs, ...table.outputs]) {
      const raw = unquoteZenCell(row[column.id] ?? "");
      next[column.id] = column.field === "action" ? (RUNTIME_TO_MODEL_ACTION[raw] ?? raw) : raw;
    }
    return next;
  });
  // `ruleId` repeats the rule's own name on every row; other columns are kept
  // only while some row uses them.
  const outputs = table.outputs.filter(
    (column) => column.field !== "ruleId" && rules.some((row) => (row[column.id] ?? "").trim())
  );
  return { ...table, rules, outputs };
}

/** The model's table as the editor's (which may add per-column options). */
function editorTable(table: ModelDecisionTable): DecisionTable {
  return {
    hitPolicy: table.hitPolicy === "collect" ? "collect" : "first",
    inputs: (table.inputs ?? []).map((c) => ({ id: c.id, name: c.name ?? c.id, field: c.field ?? "" })),
    outputs: (table.outputs ?? []).map((c) => ({ id: c.id, name: c.name ?? c.id, field: c.field ?? "" })),
    rules: (table.rules ?? []).map((row, index) => ({ _id: row._id ?? `r${index + 1}`, ...row })),
  };
}

/** The editor's table as the model writes it: no editor-only keys. */
function modelTable(table: DecisionTable): ModelDecisionTable {
  const column = (c: DecisionTable["inputs"][number]) => ({ id: c.id, name: c.name, field: c.field });
  return {
    hitPolicy: table.hitPolicy,
    inputs: table.inputs.map(column),
    outputs: table.outputs.map(column),
    rules: table.rules.map((row) => ({ ...row })),
  };
}

export function readRules(rules: RuleDocument[] | undefined, emptyTable: () => DecisionTable): EditableRule[] {
  return (rules ?? []).map((rule) => {
    const kind: RuleKind = rule.decisionTable ? "table" : rule.actions?.length ? "actions" : "graph";
    return {
      key: `rule:${rule.name}`,
      name: rule.name,
      ...(rule.title ? { title: rule.title } : {}),
      entity: rule.entity,
      event: rule.event,
      ...(rule.priority !== undefined ? { priority: rule.priority } : {}),
      table:
        kind === "table"
          ? editorTable(rule.decisionTable!)
          : kind === "actions"
            ? actionsTable(rule)
            : emptyTable(),
      kind,
      source: rule,
    };
  });
}

/**
 * The rules to write back. A graph rule is written exactly as the model
 * declared it; an actions rule keeps its graph and gets its actions from the
 * table; a table rule keeps its graph and gets the table.
 */
export function writeRules(edited: EditableRule[]): RuleDocument[] {
  return edited.map((rule) => {
    const base: RuleDocument = {
      ...(rule.source ?? { nodes: [], edges: [] }),
      name: rule.name,
      entity: rule.entity,
      event: rule.event,
    } as RuleDocument;
    if (rule.title && rule.title !== rule.name) base.title = rule.title;
    else delete base.title;
    if (rule.priority !== undefined) base.priority = rule.priority;

    if (rule.kind === "graph") return base;
    if (rule.kind === "actions") {
      const { decisionTable: _table, ...rest } = base;
      return {
        ...rest,
        actions: tableToRuleActions(rule.source?.name ?? rule.name, rule.table).map((action) => ({
          name: action.name,
          type: action.type,
          ...(action.when ? { when: action.when } : {}),
          ...(Object.keys(action.props).length ? { props: action.props } : {}),
        })),
      };
    }
    const { actions: _actions, ...rest } = base;
    return { ...rest, decisionTable: modelTable(rule.table) };
  });
}
