/**
 * The automation model — one sentence, three parts.
 *
 * "When an Order is created, only if Order.total is greater than 1000, then
 * look up a rule table, set a field, and create an Invoice."
 *
 * That sentence is the whole model. A trigger, a flat list of conditions that
 * must all pass, and an ordered list of steps. There is deliberately no graph
 * here: the executor runs steps in order and stops at the first failure, so a
 * list is the honest representation and the one the builder can draw as a
 * ladder without inventing layout the author never asked for.
 *
 * Storage is YAML: `lib/automation/yaml.ts` writes this model as its own
 * document, the way the application's model is written.
 */

import {
  type DecisionTable,
  emptyDecisionTable,
  STEP_TYPES,
  type StepType,
} from "../workflow/bpmn-model";

export type { DecisionTable, StepType };
export { emptyDecisionTable, STEP_TYPES };

/* -------------------------------------------------------------------------- */
/*  Triggers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The events an automation can start from.
 *
 * These are the entity lifecycle hooks the generated services already fire, so
 * a trigger is not a new concept — it is the hook, named the way someone
 * describing their business would name it.
 */
export const TRIGGER_EVENTS = [
  "created",
  "beforeCreated",
  "updated",
  "beforeUpdated",
  "deleted",
  "beforeDeleted",
] as const;

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number];

/** How each event reads in the builder, and what it means for the write. */
export const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  created: "is created",
  beforeCreated: "is about to be created",
  updated: "is updated",
  beforeUpdated: "is about to be updated",
  deleted: "is deleted",
  beforeDeleted: "is about to be deleted",
};

export const TRIGGER_HINTS: Record<TriggerEvent, string> = {
  created: "Runs after the record is written. The record already exists.",
  beforeCreated: "Runs before the record is written, so it can still block the write.",
  updated: "Runs after the change is saved.",
  beforeUpdated: "Runs before the change is saved, so it can still block it.",
  deleted: "Runs after the record is removed.",
  beforeDeleted: "Runs before the record is removed, so it can still block it.",
};

/** The hook name each trigger maps to on the generated service. */
export const TRIGGER_HOOKS: Record<TriggerEvent, string> = {
  created: "afterCreate",
  beforeCreated: "beforeCreate",
  updated: "afterUpdate",
  beforeUpdated: "beforeUpdate",
  deleted: "afterDelete",
  beforeDeleted: "beforeDelete",
};

export interface Trigger {
  /** The entity this automation watches, e.g. "Order". */
  entity: string;
  event: TriggerEvent;
}

/* -------------------------------------------------------------------------- */
/*  Conditions                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Comparison operators, worded as a check reads rather than as an expression.
 *
 * `arity: 0` means the operator takes no value — "is empty" has nothing on the
 * right-hand side, and the builder hides the value box for it rather than
 * leaving an input that must stay blank to be correct.
 */
export const OPERATORS = [
  { id: "eq", label: "is", arity: 1 },
  { id: "neq", label: "is not", arity: 1 },
  { id: "gt", label: "is greater than", arity: 1 },
  { id: "gte", label: "is greater than or equal to", arity: 1 },
  { id: "lt", label: "is less than", arity: 1 },
  { id: "lte", label: "is less than or equal to", arity: 1 },
  { id: "contains", label: "contains", arity: 1 },
  { id: "startsWith", label: "starts with", arity: 1 },
  { id: "isEmpty", label: "is empty", arity: 0 },
  { id: "isNotEmpty", label: "is not empty", arity: 0 },
  { id: "changed", label: "changed", arity: 0 },
] as const;

export type OperatorId = (typeof OPERATORS)[number]["id"];

export function operatorLabel(id: string): string {
  return OPERATORS.find((o) => o.id === id)?.label ?? id;
}

export function operatorArity(id: string): number {
  return OPERATORS.find((o) => o.id === id)?.arity ?? 1;
}

export interface Condition {
  id: string;
  /** Dotted path read from the run context, e.g. "order.total". */
  field: string;
  operator: OperatorId | string;
  /** Ignored when the operator takes no value. */
  value: string;
}

/* -------------------------------------------------------------------------- */
/*  Steps                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How each step type reads in the ladder and what it is for.
 *
 * The vocabulary is the executor's — Decision, CreateEntity, UpdateEntity,
 * DeleteEntity, Formula, REST — relabelled so the palette answers "what do I
 * want to happen" rather than "which node class is this".
 */
export const STEP_LABELS: Record<StepType, string> = {
  Decision: "Look up a rule table",
  CreateEntity: "Create a record",
  UpdateEntity: "Update a field",
  DeleteEntity: "Delete a record",
  Formula: "Work out a value",
  REST: "Call a web service",
};

export const STEP_HINTS: Record<StepType, string> = {
  Decision: "Ask a table of rules for an answer, then use it in a later step.",
  CreateEntity: "Insert a row and remember its id for later steps.",
  UpdateEntity: "Write one field, on this record or a related one.",
  DeleteEntity: "Soft delete by default, so the audit trail still resolves.",
  Formula: "Set, copy, add, subtract, multiply or divide.",
  REST: "POST to an external URL and keep the response.",
};

/** A single glyph per step type. Kept text so it renders without an icon font. */
export const STEP_GLYPHS: Record<StepType, string> = {
  Decision: "▤",
  CreateEntity: "✚",
  UpdateEntity: "✎",
  DeleteEntity: "✕",
  Formula: "ƒ",
  REST: "↗",
};

export interface AutomationStep {
  id: string;
  type: StepType;
  /**
   * What later steps call this step's result. Empty means the step produces
   * nothing worth naming (a delete, usually).
   */
  resultName: string;
  /** Type-specific configuration. Keys are documented per type in STEP_FIELDS. */
  props: Record<string, string>;
  /**
   * The loop this step belongs to, if any. At most one: loops do not nest, so
   * a step is either inside exactly one repeat or outside them all.
   */
  loopId?: string;
  /** Only set on Decision steps that own an inline table rather than a shared one. */
  table?: DecisionTable;
}

/** Which property fields each step type shows, in the order they read. */
export const STEP_FIELDS: Record<StepType, readonly string[]> = {
  Decision: ["ruleTable", "inputs"],
  CreateEntity: ["entity", "values"],
  UpdateEntity: ["entity", "field", "value"],
  DeleteEntity: ["entity", "target"],
  Formula: ["operation", "left", "right"],
  REST: ["method", "url", "body"],
};

/* -------------------------------------------------------------------------- */
/*  Loops                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Repeat while a rule holds — the steps run again and again until the check
 * fails.
 *
 * The check is re-evaluated before every pass against the record *as it stands
 * then*, which is the point: a step inside the loop changes the record, and
 * that change is what eventually ends the loop.
 *
 * This is genuinely unbounded, and an automation runs inside the write that
 * triggered it — so a check that never fails does not spin a harmless
 * background job, it holds a database transaction open until something times
 * out. `maxPasses` is the backstop, and every loop must state its own. It is
 * not a second way to say "how many times": reaching it means the automation
 * was wrong, so the run is marked failed and says so, rather than finishing
 * quietly as though the loop had ended on its own.
 */
export interface Loop {
  id: string;
  /** Re-checked before each pass. The loop ends the first time it fails. */
  condition: Condition;
  /**
   * Passes after which this loop is abandoned and the run reported as failed.
   *
   * Required, and deliberately per-loop rather than a constant: how many passes
   * is "obviously too many" is a property of the work, not of the engine. A
   * retry loop that should give up after 5 and a reconciliation that legitimately
   * runs 800 cannot share one number without the ceiling being meaningless for
   * one of them.
   *
   * Held as a string because it is bound to a text input; validation is what
   * turns it into a number.
   */
  maxPasses: string;
}

/**
 * Smallest sensible ceiling. There is no upper bound — the author owns the
 * number, and capping it here would be the hardcoded limit this replaced.
 */
export const LOOP_MIN_PASSES = 1;

/**
 * A tolerant read of `loops`.
 *
 * Automations stored before loops existed have no such field, and they are the
 * majority of what is in any database today. Defaulting here rather than at
 * each call site means an old record opens and serialises unchanged instead of
 * throwing in whichever function reaches it first.
 */
export function loopsOf(automation: Automation): Loop[] {
  return automation.loops ?? [];
}

/** The steps belonging to a loop, in ladder order. */
export function stepsInLoop(automation: Automation, loopId: string): AutomationStep[] {
  return automation.steps.filter((step) => step.loopId === loopId);
}

/** The loop a step sits in, if any. */
export function loopOf(automation: Automation, step: AutomationStep): Loop | undefined {
  return step.loopId ? loopsOf(automation).find((l) => l.id === step.loopId) : undefined;
}

/**
 * A loop's members must sit together in the ladder.
 *
 * The list is the running order, so members split by an outside step would mean
 * the workflow runs A, (something else), B and repeats only part of it — a
 * shape the drawn subgraph could not honestly represent either.
 */
export function loopIsContiguous(automation: Automation, loopId: string): boolean {
  const positions = automation.steps
    .map((step, i) => (step.loopId === loopId ? i : -1))
    .filter((i) => i >= 0);
  if (positions.length === 0) return true;
  const first = positions[0] as number;
  return positions.every((position, offset) => position === first + offset);
}

/* -------------------------------------------------------------------------- */
/*  The automation                                                             */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Hook rungs — the multi-trigger case                                        */
/* -------------------------------------------------------------------------- */

/**
 * The thirteen lifecycle events, in the order they run.
 *
 * Wider than `TRIGGER_EVENTS`, which names only the six an automation can
 * *start* from. A hook workflow binds handlers to any of these, including the
 * read and list points that have no "when this happens, then do that" reading.
 */
export const HOOK_EVENTS = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate",
] as const;

export type HookEvent = (typeof HOOK_EVENTS)[number];

export const HOOK_EVENT_HINTS: Record<HookEvent, string> = {
  beforeCreate: "Runs before a record is written — hash a password, set a default.",
  afterCreate: "Runs once the record exists — send a welcome email, emit an event.",
  beforeUpdate: "Validate or transform before the write.",
  afterUpdate: "Audit the change, invalidate a cache.",
  beforeDelete: "Block the delete if the record is still referenced.",
  afterDelete: "Clean up related rows or files.",
  beforeRead: "Guard a single-record read.",
  afterRead: "Redact or enrich a record on the way out.",
  beforeQuery: "Scope the query — tenant filters, injected conditions.",
  afterQuery: "Post-process the rows that came back.",
  beforeList: "Adjust filtering, sorting or pagination.",
  afterList: "Post-process a page of results.",
  customValidate: "Cross-field or business validation on any write.",
};

/**
 * One named handler bound to one lifecycle event.
 *
 * This is the rung a hook workflow is made of, and the reason `trigger` alone
 * could not carry it: `ContactHygiene` binds twelve handlers across
 * beforeCreate, customValidate, afterUpdate and beforeList. That is not one
 * automation with twelve steps — it is twelve triggers, each with its own
 * handler, sharing a name and an entity. A single `trigger` field can only say
 * one of them, so reading such a workflow through the automation shape dropped
 * every handler.
 */
export interface AutomationHook {
  id: string;
  event: HookEvent;
  /** Generated function name — the handler the backend will call. */
  handler: string;
  /** Optional field the hook is scoped to. */
  field?: string;
}

/**
 * Which shape an automation is.
 *
 * `automation` is the original sentence: one trigger, conditions, ordered
 * steps. `hook` is the multi-trigger list above. `saga` is the same ordered
 * steps as an automation, started by a rule rather than by a lifecycle event.
 * They share a rail, a ladder and an inspector; they differ in what a rung
 * means and in how the run begins.
 */
export type AutomationKind = "automation" | "hook" | "saga";

/** How a saga is started. `rule` means a business rule's trigger-workflow action names it. */
export type SagaTrigger = "automatic" | "rule";
export type SagaOperation = "CREATE" | "UPDATE" | "DELETE" | "ALL";

export type AutomationStatus = "draft" | "live" | "paused";

export interface Automation {
  id: string;
  name: string;
  description?: string;
  kind: AutomationKind;
  trigger: Trigger;
  conditions: Condition[];
  /** Bounded repeats. A step joins one by carrying its id in `loopId`. */
  loops: Loop[];
  steps: AutomationStep[];
  /**
   * The rungs, when `kind` is `hook`. Each carries its own event, so
   * `trigger.event` is not meaningful for a hook workflow — only
   * `trigger.entity` is, because every hook binds to the same record type.
   */
  hooks: AutomationHook[];
  /**
   * How a saga starts, when `kind` is `saga`.
   *
   * They are the saga's own `trigger` and `operation`, carried here rather than
   * inferred from `trigger`. Reading a saga into the single-trigger shape
   * mapped `operation` onto a lifecycle event and threw both away: a
   * `trigger: rule` saga came back as "runs when created", and saving it said
   * so.
   */
  sagaTrigger?: SagaTrigger;
  sagaOperation?: SagaOperation;
  status: AutomationStatus;
  updatedAt?: string;
}

export function isHookWorkflow(automation: Automation): boolean {
  return automation.kind === "hook";
}

export function newHook(event: HookEvent = "beforeCreate"): AutomationHook {
  return { id: newId("hook"), event, handler: "", field: "" };
}

export function describeHook(hook: AutomationHook): string {
  return `${hook.event} → ${hook.handler || "(unnamed)"}${hook.field ? ` · ${hook.field}` : ""}`;
}

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}${Date.now().toString(36)}`;
}

export function emptyAutomation(entity: string, kind: AutomationKind = "automation"): Automation {
  return {
    id: newId("auto"),
    name:
      kind === "hook"
        ? "Untitled process"
        : kind === "saga"
          ? "Untitled process"
          : "Untitled automation",
    kind,
    trigger: { entity, event: "created" },
    conditions: [],
    loops: [],
    steps: [],
    hooks: kind === "hook" ? [newHook()] : [],
    ...(kind === "saga" ? { sagaTrigger: "rule" as const, sagaOperation: "CREATE" as const } : {}),
    status: "draft",
  };
}

export function newCondition(): Condition {
  return { id: newId("cond"), field: "", operator: "eq", value: "" };
}

/**
 * A new loop, named `L1`, `L2`, … rather than with the opaque id every other
 * object gets. The id is what an author types in `{{L1.iteration}}` and what
 * they read in the serialised model, so it has to be short and predictable.
 */
export function newLoop(existing: Loop[]): Loop {
  let n = existing.length + 1;
  while (existing.some((loop) => loop.id === `L${n}`)) n += 1;
  // Empty rather than pre-filled: the ceiling is a decision about this
  // particular loop, and a default would be accepted unread by most authors.
  return { id: `L${n}`, condition: newCondition(), maxPasses: "" };
}

/** How a loop reads on its card: "Repeat while status is open". */
export function describeLoop(loop: Loop): string {
  const check = loop.condition.field
    ? describeCondition(loop.condition)
    : "a check that is not set yet";
  return `Repeat while ${check}`;
}

export function newStep(type: StepType): AutomationStep {
  return {
    id: newId("step"),
    type,
    resultName: defaultResultName(type),
    props: {},
    ...(type === "Decision" ? {} : {}),
  };
}

function defaultResultName(type: StepType): string {
  switch (type) {
    case "Decision":
      return "decision";
    case "CreateEntity":
      return "createdId";
    case "Formula":
      return "value";
    case "REST":
      return "response";
    default:
      return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  Reading an automation back as a sentence                                   */
/* -------------------------------------------------------------------------- */

/** The trigger line, as the WHEN card shows it. */
export function describeTrigger(t: Trigger): string {
  return `${article(t.entity)} ${t.entity} ${TRIGGER_LABELS[t.event] ?? t.event}`;
}

/** One condition, as the IF card shows it. */
export function describeCondition(c: Condition): string {
  const op = operatorLabel(c.operator);
  return operatorArity(c.operator) === 0
    ? `${c.field || "a field"} ${op}`
    : `${c.field || "a field"} ${op} ${c.value || "…"}`;
}

/** One step, as the THEN card shows it. */
export function describeStep(s: AutomationStep): string {
  const p = s.props;
  switch (s.type) {
    case "Decision":
      return `Look up ${p.ruleTable || "a rule table"}${s.resultName ? ` → ${s.resultName}` : ""}`;
    case "CreateEntity":
      return `Create ${article(p.entity || "record")} ${p.entity || "record"}${
        s.resultName ? ` → ${s.resultName}` : ""
      }`;
    case "UpdateEntity":
      return `Set ${p.entity && p.field ? `${p.entity}.${p.field}` : p.field || "a field"} to ${
        p.value || "…"
      }`;
    case "DeleteEntity":
      return `Delete ${article(p.entity || "record")} ${p.entity || "record"}`;
    case "Formula":
      return `${p.operation || "Set"} ${p.left || "…"}${p.right ? ` and ${p.right}` : ""}${
        s.resultName ? ` → ${s.resultName}` : ""
      }`;
    case "REST":
      return `${p.method || "POST"} to ${p.url || "a URL"}${
        s.resultName ? ` → ${s.resultName}` : ""
      }`;
    default:
      return STEP_LABELS[s.type] ?? s.type;
  }
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

/* -------------------------------------------------------------------------- */
/*  Values available at a point in the run                                     */
/* -------------------------------------------------------------------------- */

export interface AvailableValue {
  /** The reference an author types, without braces, e.g. "tier.discount_pct". */
  path: string;
  type: string;
  /** Where it came from, shown beside the path. */
  origin: string;
}

/**
 * Everything a step at `index` may reference.
 *
 * Only values produced *above* the step are returned, so the picker can never
 * offer a reference to a step that has not run yet — the single most common way
 * a hand-written workflow breaks in production.
 */
export function valuesAvailableAt(
  automation: Automation,
  index: number,
  entityFields: Record<string, string[]> = {}
): AvailableValue[] {
  const out: AvailableValue[] = [];
  const entity = automation.trigger.entity;
  const root = entity.toLowerCase();

  for (const field of entityFields[entity] ?? []) {
    out.push({ path: `${root}.${field}`, type: "field", origin: entity });
  }
  if (out.length === 0) {
    out.push({ path: `${root}.id`, type: "uuid", origin: entity });
  }

  // Only offered to steps actually inside the repeat — outside it the pass
  // number has no meaning, and a picker that offers it anyway teaches the
  // wrong model of when a loop variable exists.
  const own = automation.steps[index];
  const loop = own ? loopOf(automation, own) : undefined;
  if (loop) {
    out.push({
      path: `${loop.id}.iteration`,
      type: "number",
      origin: `repeat ${loop.id}`,
    });
  }

  automation.steps.slice(0, Math.max(0, index)).forEach((step, i) => {
    if (!step.resultName) return;
    const origin = `step ${i + 1}`;
    if (step.type === "Decision") {
      const outputs = step.table?.outputs ?? [];
      if (outputs.length === 0) {
        out.push({ path: step.resultName, type: "answer", origin });
      }
      for (const o of outputs) {
        out.push({ path: `${step.resultName}.${o.field || o.name}`, type: "answer", origin });
      }
    } else {
      out.push({ path: step.resultName, type: stepResultType(step.type), origin });
    }
  });

  return out;
}

function stepResultType(type: StepType): string {
  switch (type) {
    case "CreateEntity":
      return "uuid";
    case "Formula":
      return "value";
    case "REST":
      return "response";
    default:
      return "value";
  }
}

/* -------------------------------------------------------------------------- */
/*  Validation — stated as the author would fix it                             */
/* -------------------------------------------------------------------------- */

export interface Problem {
  /** Which card the problem belongs to, so the ladder can mark it. */
  target: string;
  message: string;
}

export function validateAutomation(automation: Automation): Problem[] {
  const problems: Problem[] = [];

  if (!automation.name.trim()) {
    problems.push({ target: "name", message: "Give the automation a name." });
  }
  if (!automation.trigger.entity.trim()) {
    problems.push({ target: "trigger", message: "Pick the record type this watches." });
  }

  // A hook workflow is its rungs. It has no conditions, loops or steps to
  // check, so validate the handlers and stop.
  if (automation.kind === "hook") {
    if (automation.hooks.length === 0) {
      problems.push({ target: "hooks", message: "Add at least one lifecycle step." });
    }
    const seen = new Set<string>();
    for (const hook of automation.hooks) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(hook.handler)) {
        problems.push({
          target: hook.id,
          message: `"${hook.handler || "(unnamed)"}" is not a valid handler name — letters, digits and underscore, not starting with a digit.`,
        });
      }
      const key = `${hook.event}:${hook.handler}`;
      if (seen.has(key)) {
        problems.push({
          target: hook.id,
          message: `${hook.event} ${hook.handler} is listed twice, so it would run twice.`,
        });
      }
      seen.add(key);
    }
    return problems;
  }

  for (const c of automation.conditions) {
    if (!c.field.trim()) {
      problems.push({ target: c.id, message: "This check does not say which field to look at." });
    } else if (operatorArity(c.operator) === 1 && !c.value.trim()) {
      problems.push({
        target: c.id,
        message: `"${c.field} ${operatorLabel(c.operator)}" needs a value to compare against.`,
      });
    }
  }

  if (automation.steps.length === 0) {
    problems.push({ target: "steps", message: "Add at least one thing for this to do." });
  }

  const named = new Set<string>();
  automation.steps.forEach((step, i) => {
    for (const field of STEP_FIELDS[step.type] ?? []) {
      if (field === "inputs" || field === "values" || field === "body") continue;
      // A Decision may carry its own table instead of naming a saved rule —
      // the shape every saga in the example models uses — and an UpdateEntity
      // with no record type writes the record that triggered the run. Demanding
      // either told authors their working process was broken.
      if (field === "ruleTable" && step.table) continue;
      if (field === "entity" && step.type === "UpdateEntity") continue;
      if (!(step.props[field] ?? "").trim()) {
        problems.push({
          target: step.id,
          message: `Step ${i + 1} is missing ${humanField(field)}.`,
        });
      }
    }
    if (step.resultName) {
      if (named.has(step.resultName)) {
        problems.push({
          target: step.id,
          message: `Two steps both save their answer as "${step.resultName}". Rename one.`,
        });
      }
      named.add(step.resultName);
    }
  });

  for (const loop of loopsOf(automation)) {
    const members = stepsInLoop(automation, loop.id);
    if (members.length === 0) {
      problems.push({
        target: loop.id,
        message: `Repeat ${loop.id} has no steps in it. Add one, or remove the repeat.`,
      });
      continue;
    }

    if (!loopIsContiguous(automation, loop.id)) {
      problems.push({
        target: loop.id,
        message: `The steps in repeat ${loop.id} have something else between them. Move them together.`,
      });
    }

    const check = loop.condition;
    if (!check.field.trim()) {
      problems.push({
        target: loop.id,
        message: `Repeat ${loop.id} does not say what to check, so it would never stop.`,
      });
    } else if (operatorArity(check.operator) === 1 && !check.value.trim()) {
      problems.push({
        target: loop.id,
        message: `"${check.field} ${operatorLabel(check.operator)}" needs a value to compare against.`,
      });
    }

    const max = loop.maxPasses.trim();
    if (!max) {
      problems.push({
        target: loop.id,
        message: `Say how many passes ${loop.id} may run before it gives up. There is no default.`,
      });
    } else {
      const n = Number(max);
      if (!Number.isInteger(n)) {
        problems.push({
          target: loop.id,
          message: `"${max}" is not a whole number of passes for repeat ${loop.id}.`,
        });
      } else if (n < LOOP_MIN_PASSES) {
        problems.push({
          target: loop.id,
          message: `Repeat ${loop.id} must be allowed at least ${LOOP_MIN_PASSES} pass.`,
        });
      }
    }

    // A check on a field no step in the loop writes cannot change between
    // passes, so the loop either never runs or runs until the safety limit
    // aborts it. Both are bugs, and both are invisible until it is live.
    if (check.field.trim() && !membersCanChange(members, check.field)) {
      problems.push({
        target: loop.id,
        message:
          `Nothing inside repeat ${loop.id} changes "${check.field}", so the check will ` +
          `read the same every pass. Add a step that updates it, or the repeat will run ` +
          `until it is cut off at its limit of ${loop.maxPasses || "?"} passes.`,
      });
    }
  }

  return problems;
}

/**
 * Does any step in the loop write the field the loop checks?
 *
 * Deliberately shallow — it matches an `UpdateEntity` on the field by name and
 * treats every other step type as opaque. A `REST` call or a `Decision` can
 * change the world in ways this cannot see, so this only ever reports the case
 * it is certain about: a loop whose body contains no write to that field at all.
 */
function membersCanChange(members: AutomationStep[], field: string): boolean {
  const bare = field.includes(".") ? (field.split(".").pop() as string) : field;
  return members.some((step) => {
    if (step.type !== "UpdateEntity") return true;
    const written = (step.props.field ?? "").trim();
    return written === "" || written === bare || written === field;
  });
}

function humanField(field: string): string {
  switch (field) {
    case "ruleTable":
      return "a rule table to look up";
    case "entity":
      return "a record type";
    case "field":
      return "a field to write";
    case "value":
      return "a value to write";
    case "operation":
      return "an operation";
    case "left":
      return "a value to work from";
    case "url":
      return "a URL";
    case "method":
      return "a method";
    case "target":
      return "a record to delete";
    default:
      return field;
  }
}
