/**
 * A model's business rules → GoRules JDM decision graphs.
 *
 * A rule is a decision graph bound to an entity's lifecycle event. It compiles
 * to the representation the generated application's rules engine evaluates and
 * its admin editor edits, so a rule drawn in the design phase is the rule that
 * runs.
 *
 * The compilers live here rather than in the web app because the generator is
 * what consumes them; the web app imports them from `@appwithai/generator/rules`.
 */

export * from "./jdm-converter";

import type { RuleAction, RuleDeclaration } from "../model/records";
import { type JdmGraph, ruleGraphToJdm } from "./jdm-converter";

/** A rule, compiled and ready to seed into `sys_rule_definitions`. */
export interface CompiledRule {
  /** The rule's name, used as the seeded rule's identity. */
  name: string;
  /** Table the rule is bound to, e.g. `bus_sample`. */
  tableName: string;
  entity: string;
  /** The lifecycle event it runs on, e.g. `beforeCreate`. */
  event: string;
  /** CRUD operation the rules engine keys on: CREATE / UPDATE / DELETE / ALL. */
  operation: "CREATE" | "UPDATE" | "DELETE" | "ALL";
  priority: number;
  /** The JDM decision graph, serialised. */
  jdmContent: string;
}

/** Map a lifecycle event onto the operation the rules engine evaluates against. */
export function eventToOperation(event: string): CompiledRule["operation"] {
  const normalized = event.toLowerCase();
  if (normalized.includes("create")) return "CREATE";
  if (normalized.includes("update")) return "UPDATE";
  if (normalized.includes("delete")) return "DELETE";
  return "ALL";
}

/** `Sample` → `bus_sample`, matching the ERD's table naming. */
function toTableName(entity: string): string {
  const snake = entity
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}

/** A side-effecting action a rule emits, as the rules engine runs it. */
export interface CompiledRuleAction {
  name: string;
  type: string;
  /** Zen expression over the record; `true` fires on every write. */
  when: string;
  props: Record<string, string>;
}

/** An action as the rules engine runs it: no condition means always. */
function withDefaultCondition(action: RuleAction): CompiledRuleAction {
  return { name: action.name, type: action.type, when: action.when ?? "true", props: action.props };
}

/** Quote a value for a zen decision-table output cell. */
function zenLiteral(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`;
}

/* -------------------------------------------------------------------------- */
/*  Decision tables authored in the editor                                      */
/* -------------------------------------------------------------------------- */

/** A decision table as the rule editor authors it and the model stores it. */
export interface EditorDecisionTable {
  hitPolicy?: "first" | "collect";
  inputs?: Array<{ id: string; name?: string; field?: string }>;
  outputs?: Array<{ id: string; name?: string; field?: string }>;
  rules?: Array<Record<string, string>>;
}

/** A cell that zen should read as a value rather than an identifier reference. */
function isBareLiteral(value: string): boolean {
  return (
    value === "true" ||
    value === "false" ||
    value === "null" ||
    (value !== "" && !Number.isNaN(Number(value)))
  );
}

function isQuoted(value: string): boolean {
  return (
    value.length >= 2 &&
    (value.startsWith("'") || value.startsWith('"')) &&
    value.endsWith(value[0] as string)
  );
}

/**
 * The editor stores what the user typed; zen evaluates expressions.
 *
 * An output of `validation-error` is a subtraction of two identifiers to zen,
 * and an input of `hot` is a reference to an undefined variable. Both have to
 * be quoted. Numbers, booleans and already-quoted cells are left alone.
 */
function zenCell(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (value === "") return "";
  if (isQuoted(value) || isBareLiteral(value)) return value;
  return zenLiteral(value);
}

/**
 * Input cells may carry a leading comparison, matching the editor's own
 * evaluator. `>= 70` stays a unary comparison; a bare `hot` becomes `'hot'`;
 * an explicit `= hot` drops the operator, because zen reads a bare value as
 * equality and `= 'hot'` is not valid unary syntax.
 */
function zenInputCell(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (value === "") return "";
  const match = value.match(/^(>=|<=|!=|=|>|<)\s*(.*)$/);
  if (!match) return zenCell(value);
  const [, operator, operand] = match as unknown as [string, string, string];
  const cell = zenCell(operand);
  if (!cell) return "";
  return operator === "=" ? cell : `${operator} ${cell}`;
}

/**
 * Compile the editor's table into the one JDM shape the rules engine reads.
 *
 * Every declared column is written into every row: zen-engine yields no result
 * at all for a row with a missing cell, so an omitted column would silently
 * disable the whole rule.
 */
export function buildEditorDecisionTable(ruleName: string, table: EditorDecisionTable): JdmGraph {
  const inputs = (table.inputs ?? []).filter((column) => (column.field ?? "").trim() !== "");
  const outputs = (table.outputs ?? []).filter((column) => (column.field ?? "").trim() !== "");

  const rows = (table.rules ?? []).map((row, index) => {
    const compiled: Record<string, string> = { _id: row._id || `${ruleName}-${index + 1}` };
    for (const column of inputs) compiled[column.id] = zenInputCell(row[column.id]);
    for (const column of outputs) compiled[column.id] = zenCell(row[column.id]);
    return compiled;
  });

  const tableId = `${ruleName}-table`;
  return {
    nodes: [
      { id: "input", name: "Input", type: "inputNode" },
      {
        id: tableId,
        name: ruleName,
        type: "decisionTableNode",
        content: {
          hitPolicy: table.hitPolicy === "collect" ? ("collect" as const) : ("first" as const),
          inputs: inputs.map((column) => ({
            id: column.id,
            name: column.name ?? column.id,
            field: column.field ?? "",
          })),
          outputs: outputs.map((column) => ({
            id: column.id,
            name: column.name ?? column.id,
            field: column.field ?? "",
          })),
          rules: rows,
        },
      },
      { id: "output", name: "Output", type: "outputNode" },
    ],
    edges: [
      { id: "edge-1", sourceId: "input", targetId: tableId },
      { id: "edge-2", sourceId: tableId, targetId: "output" },
    ],
  };
}

/**
 * The model's action names, in the vocabulary the generated runtime reads.
 *
 * The two are not the same list and never were. A model spells a refusal
 * `validation-error`; the Loco backend's `promotion.rs` looks for `prevent`,
 * and everything else — `trigger-workflow`, `cascade-update`, `create-record`
 * — it already spells the runtime's way. So a compiled `validation-error` row
 * matched, was handed to `run_action`, fell through to the `other` arm, and was
 * logged as an unknown action: a rule written to refuse a write let every write
 * through, and said so only in a `tracing::warn!` nobody reads.
 *
 * `prevent` is checked before any side effect runs, so the translation is what
 * makes a `validation-error` action a refusal rather than a comment.
 */
const RUNTIME_ACTION: Record<string, string> = {
  "validation-error": "prevent",
};

/**
 * A transform's target, as the runtime wants it.
 *
 * A model writes `field` and `value` as two separate properties; the runtime
 * reads one `transformData` object of column → value, which is the shape
 * `JdmViolation` already deserialises and `to_action_config` already forwards.
 * Emitting neither left every transform with an empty config, so the action
 * arrived with nothing to write.
 */
function transformDataCell(action: CompiledRuleAction): string {
  const field = (action.props.field ?? "").trim();
  if (action.type !== "transform" || !field) return zenLiteral("");
  return zenLiteral(JSON.stringify({ [field]: action.props.value ?? "" }));
}

/**
 * A GoRules decision table, one row per action.
 *
 * The node-graph form a rule's graph compiles to carries no outputs, so the
 * rules engine finds no actions in it and a model-declared rule can decide but
 * never act. A decision table is the shape the engine reads `action`,
 * `message`, `ruleId` and `workflowName` from, so a section that declares
 * actions is compiled as one.
 *
 * `hitPolicy: "collect"` because several rows may match one write — a rule that
 * escalates *and* stamps a field is ordinary.
 */
export function buildActionDecisionTable(
  ruleName: string,
  actions: CompiledRuleAction[]
): JdmGraph {
  // Every declared output column has to appear in every row, blank when the
  // action does not use it. zen-engine yields *no result at all* for a row with
  // a missing cell — not a row with an empty field — so an omitted column made
  // the whole rule silently evaluate to nothing.
  // The output columns are the fields `JdmViolation` deserialises, in the
  // generated backend's `services/rules_engine.rs` — `cascade-update` and
  // `create-record` need structured payloads and there was no column to carry
  // them, so both could be declared and would arrive empty.
  //
  // The `action` cell is written in the *runtime's* vocabulary rather than
  // the model's; see RUNTIME_ACTION.
  const cells = [
    (action: CompiledRuleAction) => zenLiteral(RUNTIME_ACTION[action.type] ?? action.type),
    (action: CompiledRuleAction) =>
      zenLiteral(action.props.message ?? `${ruleName}: ${action.name}`),
    () => zenLiteral(ruleName),
    (action: CompiledRuleAction) => zenLiteral(action.props.workflow ?? ""),
    (action: CompiledRuleAction) => zenLiteral(action.props.targetEntity ?? ""),
    (action: CompiledRuleAction) => zenLiteral(action.props.linkField ?? ""),
    // JSON objects, written as a string. `as_object()` in the engine tolerates
    // either, and a string is what fits in a decision-table cell.
    (action: CompiledRuleAction) => zenLiteral(action.props.updateData ?? ""),
    (action: CompiledRuleAction) => zenLiteral(action.props.createData ?? ""),
    transformDataCell,
  ];

  const rows = actions.map((action) => {
    const row: Record<string, string> = {
      _id: `${ruleName}-${action.name}`,
      i1: action.when,
    };
    cells.forEach((cell, index) => {
      row[`o${index + 1}`] = cell(action);
    });
    return row;
  });

  return {
    nodes: [
      { id: "input", name: "Input", type: "inputNode" },
      {
        id: `${ruleName}-table`,
        name: ruleName,
        type: "decisionTableNode",
        content: {
          hitPolicy: "collect" as const,
          inputs: [{ id: "i1", name: "Record", field: "" }],
          outputs: [
            { id: "o1", name: "Action", field: "action" },
            { id: "o2", name: "Message", field: "message" },
            { id: "o3", name: "Rule ID", field: "ruleId" },
            { id: "o4", name: "Workflow Name", field: "workflowName" },
            { id: "o5", name: "Target Entity", field: "targetEntity" },
            { id: "o6", name: "Link Field", field: "linkField" },
            { id: "o7", name: "Update Data", field: "updateData" },
            { id: "o8", name: "Create Data", field: "createData" },
            { id: "o9", name: "Transform Data", field: "transformData" },
          ],
          rules: rows,
        },
      },
      { id: "output", name: "Output", type: "outputNode" },
    ],
    edges: [
      { id: "edge-1", sourceId: "input", targetId: `${ruleName}-table` },
      { id: "edge-2", sourceId: `${ruleName}-table`, targetId: "output" },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Reading an edited table back into the model's actions                      */
/* -------------------------------------------------------------------------- */

/**
 * The reverse of `RUNTIME_ACTION`: what the table editor shows, in the model's
 * words.
 *
 * A table compiled from a rule's actions carries the runtime's `prevent`; the
 * model it came from says `validation-error`. Translating back is how the
 * enhance page edits a rule's actions without changing their meaning.
 */
const MODEL_ACTION: Record<string, string> = {
  prevent: "validation-error",
};

/** Cells the editor shows are zen literals: `'prevent'`. Read the text back. */
function unquoteCell(value: string | undefined): string {
  const text = (value ?? "").trim();
  if (
    text.length >= 2 &&
    (text.startsWith("'") || text.startsWith('"')) &&
    text.endsWith(text[0] as string)
  ) {
    return text.slice(1, -1).replace(/\\'/g, "'");
  }
  return text;
}

/** The cell a row carries for the output column with this field. */
function outputCell(
  table: EditorDecisionTable,
  row: Record<string, string>,
  field: string
): string {
  const column = (table.outputs ?? []).find(
    (candidate) => (candidate.field ?? "").trim() === field
  );
  return column ? unquoteCell(row[column.id]) : "";
}

/** Action names are identifiers; the row's `_id` is the name to keep stable. */
function actionNameFromId(ruleName: string, id: string | undefined, index: number): string {
  const raw = (id ?? "").trim();
  // `buildActionDecisionTable` prefixes every row id with the rule name.
  const prefix = `${ruleName}-`;
  const withoutRule = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  const cleaned = withoutRule.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) && cleaned ? cleaned : `action${index + 1}`;
}

/**
 * The inverse of `buildActionDecisionTable`.
 *
 * The enhance page shows a rule's actions as the decision table the generated
 * application's rule editor uses. An edit made there has to land back in the
 * model as actions the checker and compiler read, so each row is walked back to
 * one action: the input columns join into `when`, and the output cells become
 * its properties.
 *
 * The runtime vocabulary is translated back to the model's — `prevent` is
 * written `validation-error` — so the round trip is the identity on an unedited
 * rule, down to the order of each action's properties.
 */
export function tableToRuleActions(ruleName: string, table: EditorDecisionTable): RuleAction[] {
  const actions: RuleAction[] = [];
  (table.rules ?? []).forEach((row, index) => {
    const runtimeType = outputCell(table, row, "action");
    const type = MODEL_ACTION[runtimeType] ?? runtimeType;
    if (!type) return;

    const whens = (table.inputs ?? [])
      .map((column) => unquoteCell(row[column.id]))
      .filter(Boolean);
    const when = whens.length ? whens.join(" and ") : "true";

    const name = actionNameFromId(ruleName, row._id, index);
    // `buildActionDecisionTable` invents a message for every row that has none
    // (`<rule>: <action>`). It is not part of the model, so reading it back
    // would add a property the author never wrote.
    const messageCell = outputCell(table, row, "message");
    const message = messageCell === `${ruleName}: ${name}` ? "" : messageCell;
    const workflow = outputCell(table, row, "workflowName");
    const field = outputCell(table, row, "field");
    const value = outputCell(table, row, "value");
    const targetEntity = outputCell(table, row, "targetEntity");
    const linkField = outputCell(table, row, "linkField");

    const props: Record<string, string> = {};
    if (workflow) props.workflow = workflow;
    if (message) props.message = message;
    if (field) props.field = field;
    if (value) props.value = value;
    if (targetEntity) props.targetEntity = targetEntity;
    if (linkField) props.linkField = linkField;

    // A compiled transform carries its payload in `transformData`; a table the
    // author typed may carry only that, so read the target back out of it.
    if (type === "transform" && !field) {
      const payload = outputCell(table, row, "transformData");
      if (payload) {
        try {
          const pair = Object.entries(JSON.parse(payload) as Record<string, unknown>)[0];
          if (pair) {
            props.field = pair[0];
            props.value = String(pair[1]);
          }
        } catch {
          // Not JSON; leave the action without a target rather than guess one.
        }
      }
    }

    actions.push({ name, type, when, props });
  });
  return actions;
}

/**
 * Compile a model's rules into JDM decision graphs.
 *
 * What a rule compiles *from* follows one precedence: an editor-authored
 * decision table, then its actions, then its decision graph. A rule with none
 * of those — no table and no nodes — compiles to nothing and is skipped, and one
 * that will not compile is warned about and skipped rather than fatal: one
 * malformed rule should not stop an application from being generated.
 */
export function compileRuleDeclarations(
  declarations: RuleDeclaration[],
  onWarn: (message: string) => void = () => {}
): CompiledRule[] {
  const compiled: CompiledRule[] = [];

  for (const declaration of declarations) {
    if (!declaration.entity) {
      onWarn(`Rule "${declaration.name}" declares no entity; skipping.`);
      continue;
    }

    try {
      // A table authored in the editor takes precedence over the graph: the
      // editor keeps only a placeholder graph beside it, and compiling that
      // yields a rule that decides nothing.
      const editorTable = declaration.decisionTable ?? null;
      if (!editorTable && !declaration.nodes.length) {
        onWarn(`Rule "${declaration.name}" has no nodes; skipping.`);
        continue;
      }

      // A rule that declares actions compiles to a decision table: that is the
      // only JDM shape the rules engine reads actions out of.
      let jdm: JdmGraph;
      if (editorTable) {
        jdm = buildEditorDecisionTable(declaration.name, editorTable);
      } else if (declaration.actions.length) {
        jdm = buildActionDecisionTable(
          declaration.name,
          declaration.actions.map(withDefaultCondition)
        );
      } else {
        jdm = ruleGraphToJdm(declaration.nodes, declaration.edges);
      }
      compiled.push({
        name: declaration.name,
        entity: declaration.entity,
        tableName: toTableName(declaration.entity),
        event: declaration.event,
        operation: eventToOperation(declaration.event),
        priority: declaration.priority ?? 100,
        jdmContent: JSON.stringify(jdm),
      });
    } catch (error) {
      onWarn(
        `Rule "${declaration.name}" could not be compiled: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return compiled;
}
