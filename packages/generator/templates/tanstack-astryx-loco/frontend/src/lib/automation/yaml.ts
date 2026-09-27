/**
 * Automations, stored as YAML.
 *
 * The application's model is written in YAML, so an automation built here is
 * stored the same way: as the YAML document of the automation's own model — a
 * trigger, conditions, loops, ordered steps — in
 * `sys_workflow_definitions.definition_yaml`. The backend checks the document's
 * shape before it stores it. Every automation is stored this way: migration
 * m0017 converted the rows an earlier release had written otherwise.
 */

import { parse, stringify } from "yaml";
import {
  type Automation,
  type AutomationHook,
  type AutomationKind,
  type AutomationStatus,
  type AutomationStep,
  type Condition,
  type DecisionTable,
  type HookEvent,
  HOOK_EVENTS,
  type Loop,
  loopsOf,
  newId,
  type SagaOperation,
  type SagaTrigger,
  STEP_TYPES,
  type StepType,
  TRIGGER_EVENTS,
  type TriggerEvent,
} from "./model";

/** The document version this application writes and reads. */
export const AUTOMATION_DOCUMENT_VERSION = "1.0";

const KINDS: readonly AutomationKind[] = ["automation", "hook", "saga"];
const STATUSES: readonly AutomationStatus[] = ["draft", "live", "paused"];
const SAGA_TRIGGERS: readonly SagaTrigger[] = ["automatic", "rule"];
const SAGA_OPERATIONS: readonly SagaOperation[] = ["CREATE", "UPDATE", "DELETE", "ALL"];

function conditionDocument(condition: Condition) {
  return {
    id: condition.id,
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
  };
}

/**
 * The automation as its YAML document.
 *
 * Keys in a fixed order and nothing that belongs to the screen rather than the
 * automation (its in-memory id, when it was last touched), so saving the same
 * automation twice writes the same bytes.
 */
export function automationToYaml(automation: Automation): string {
  const document = {
    automation: AUTOMATION_DOCUMENT_VERSION,
    name: automation.name,
    ...(automation.description ? { description: automation.description } : {}),
    kind: automation.kind,
    trigger: { entity: automation.trigger.entity, event: automation.trigger.event },
    ...(automation.kind === "saga"
      ? {
          sagaTrigger: automation.sagaTrigger ?? "automatic",
          sagaOperation: automation.sagaOperation ?? "CREATE",
        }
      : {}),
    conditions: automation.conditions.map(conditionDocument),
    loops: loopsOf(automation).map((loop) => ({
      id: loop.id,
      condition: conditionDocument(loop.condition),
      maxPasses: loop.maxPasses,
    })),
    steps: automation.steps.map((step) => ({
      id: step.id,
      type: step.type,
      resultName: step.resultName,
      props: { ...step.props },
      ...(step.loopId ? { loopId: step.loopId } : {}),
      ...(step.table ? { table: step.table } : {}),
    })),
    hooks: automation.hooks.map((hook) => ({
      id: hook.id,
      event: hook.event,
      handler: hook.handler,
      ...(hook.field ? { field: hook.field } : {}),
    })),
    status: automation.status,
  };
  return stringify(document, { lineWidth: 0 });
}

/** Why a stored document could not be read, naming the key at fault. */
export class AutomationDocumentError extends Error {
  constructor(reason: string) {
    super(`This automation's stored YAML ${reason}`);
    this.name = "AutomationDocumentError";
  }
}

type Mapping = Record<string, unknown>;

function isMapping(value: unknown): value is Mapping {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, key: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  throw new AutomationDocumentError(`has a \`${key}\` that is not text`);
}

function list(document: Mapping, key: string): unknown[] {
  const value = document[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value))
    throw new AutomationDocumentError(`has a \`${key}:\` that is not a list`);
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], key: string): T {
  const read = text(value, key);
  if (!(allowed as readonly string[]).includes(read)) {
    throw new AutomationDocumentError(
      `has \`${key}: ${read}\`; expected one of ${allowed.join(", ")}`
    );
  }
  return read as T;
}

function readCondition(value: unknown, key: string): Condition {
  if (!isMapping(value))
    throw new AutomationDocumentError(`has a \`${key}\` that is not a mapping`);
  return {
    id: text(value.id, `${key}.id`) || newId("cond"),
    field: text(value.field, `${key}.field`),
    operator: text(value.operator, `${key}.operator`),
    value: text(value.value, `${key}.value`),
  };
}

function readProps(value: unknown, key: string): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (!isMapping(value))
    throw new AutomationDocumentError(`has a \`${key}\` that is not a mapping`);
  const props: Record<string, string> = {};
  for (const [name, entry] of Object.entries(value)) props[name] = text(entry, `${key}.${name}`);
  return props;
}

/**
 * Read an automation's YAML document. Throws `AutomationDocumentError`, naming
 * the key at fault, for a document that is not one.
 */
export function automationFromYaml(source: string): Automation {
  let document: unknown;
  try {
    document = parse(source, { uniqueKeys: true });
  } catch (error) {
    throw new AutomationDocumentError(
      `is not YAML: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`
    );
  }
  if (!isMapping(document)) throw new AutomationDocumentError("is not a YAML mapping");

  const version = text(document.automation, "automation");
  if (version !== AUTOMATION_DOCUMENT_VERSION) {
    throw new AutomationDocumentError(
      version
        ? `is version ${version}; this application reads version ${AUTOMATION_DOCUMENT_VERSION}`
        : "has no `automation:` version key"
    );
  }

  const kind = oneOf(document.kind, KINDS, "kind");
  if (!isMapping(document.trigger)) throw new AutomationDocumentError("has no `trigger:` mapping");
  const entity = text(document.trigger.entity, "trigger.entity");
  if (!entity) throw new AutomationDocumentError("needs `trigger.entity`");

  const loops: Loop[] = list(document, "loops").map((value, index) => {
    const key = `loops[${index}]`;
    if (!isMapping(value))
      throw new AutomationDocumentError(`has a \`${key}\` that is not a mapping`);
    return {
      id: text(value.id, `${key}.id`) || newId("loop"),
      condition: readCondition(value.condition, `${key}.condition`),
      maxPasses: text(value.maxPasses, `${key}.maxPasses`),
    };
  });

  const steps: AutomationStep[] = list(document, "steps").map((value, index) => {
    const key = `steps[${index}]`;
    if (!isMapping(value))
      throw new AutomationDocumentError(`has a \`${key}\` that is not a mapping`);
    const loopId = text(value.loopId, `${key}.loopId`);
    return {
      id: text(value.id, `${key}.id`) || newId("step"),
      type: oneOf(value.type, STEP_TYPES as readonly StepType[], `${key}.type`),
      resultName: text(value.resultName, `${key}.resultName`),
      props: readProps(value.props, `${key}.props`),
      ...(loopId ? { loopId } : {}),
      ...(isMapping(value.table) ? { table: value.table as unknown as DecisionTable } : {}),
    };
  });

  const hooks: AutomationHook[] = list(document, "hooks").map((value, index) => {
    const key = `hooks[${index}]`;
    if (!isMapping(value))
      throw new AutomationDocumentError(`has a \`${key}\` that is not a mapping`);
    const field = text(value.field, `${key}.field`);
    return {
      id: text(value.id, `${key}.id`) || newId("hook"),
      event: oneOf(value.event, HOOK_EVENTS as readonly HookEvent[], `${key}.event`),
      handler: text(value.handler, `${key}.handler`),
      ...(field ? { field } : {}),
    };
  });

  const description = text(document.description, "description");
  return {
    id: newId("auto"),
    name: text(document.name, "name"),
    ...(description ? { description } : {}),
    kind,
    trigger: {
      entity,
      event: oneOf(
        document.trigger.event,
        TRIGGER_EVENTS as readonly TriggerEvent[],
        "trigger.event"
      ),
    },
    conditions: list(document, "conditions").map((value, index) =>
      readCondition(value, `conditions[${index}]`)
    ),
    loops,
    steps,
    hooks,
    ...(kind === "saga"
      ? {
          sagaTrigger: oneOf(document.sagaTrigger ?? "automatic", SAGA_TRIGGERS, "sagaTrigger"),
          sagaOperation: oneOf(
            document.sagaOperation ?? "CREATE",
            SAGA_OPERATIONS,
            "sagaOperation"
          ),
        }
      : {}),
    status: oneOf(document.status ?? "draft", STATUSES, "status"),
  };
}

/** A stored `sys_workflow_definitions` row, as the list endpoint returns it. */
export interface StoredAutomationRow {
  id: string;
  name: string;
  entity_name?: string;
  definition_yaml?: string | null;
}

/**
 * The automation a stored row holds, named as the row names it. A row with no
 * document is refused by name rather than opened empty: saving an empty one
 * would overwrite whatever the row was meant to hold.
 */
export function readStoredAutomation(row: StoredAutomationRow): Automation {
  if (!row.definition_yaml) {
    throw new AutomationDocumentError(`for "${row.name}" is missing`);
  }
  return { ...automationFromYaml(row.definition_yaml), name: row.name };
}
