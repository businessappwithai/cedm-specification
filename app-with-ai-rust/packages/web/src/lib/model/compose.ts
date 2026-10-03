/**
 * What a project generates from: its model, plus what its automations add.
 *
 * The model document is what the author wrote. Some of what the tool lets
 * people build elsewhere is model too — a saga built in the automations screen
 * is a saga, a hook workflow's rungs and a service's hooks are hooks — and the
 * generated application compiles those from the model and nowhere else. So
 * generation reads one document: the model with those declarations added.
 *
 * Composition adds, it never edits. A declaration the model already makes
 * identically is not added twice; one that would contradict the model — a
 * saga under a name the model already uses for another — is a problem that
 * stops generation, because either choice would build something nobody wrote.
 * Anything an automation says that a model declaration cannot hold (a saga's
 * conditions and repeats) is reported, never dropped in silence.
 *
 * Plain automations — one trigger, checks, steps — are not model constructs:
 * they run in the generated application from its automations screen, and are
 * not composed.
 */

import type {
  HookDocument,
  ModelDocument,
  SagaDocument,
  SagaStepDocument,
} from "@appwithai/generator/model-yaml";
import { type Automation, type AutomationStep, describeStep, loopsOf } from "../automation/model";

/** A service's hook as the enhance screen stores it in `hook_definitions`. */
export interface ServiceHookDefinition {
  type: string;
  name: string;
  entity?: string;
  enabled?: boolean;
  order?: number;
  parameters?: Array<{ name: string }>;
}

/** Something composition had to say. `error` stops generation. */
export interface CompositionIssue {
  severity: "error" | "warning";
  /** Which automation or service the issue is about. */
  source: string;
  message: string;
}

export interface CompositionSource {
  /** Automation documents, already read — the `workflows` rows of type automation. */
  automations: Automation[];
  /** Each service's hooks, keyed by the service (entity) name. */
  serviceHooks: Array<{ service: string; hooks: ServiceHookDefinition[] }>;
}

export interface Composition {
  document: ModelDocument;
  /** Whether anything was added; when not, the model's own text is what generates. */
  added: { sagas: number; hooks: number };
  issues: CompositionIssue[];
}

const REFERENCE = /^\{\{\s*([A-Za-z_][\w.]*)\s*\}\}$/;

/** The step's value when it is a bare reference to an earlier result, `{{name}}`. */
function referenceOf(value: string | undefined): string | undefined {
  return value ? REFERENCE.exec(value.trim())?.[1] : undefined;
}

/**
 * An automation step as a saga step. The two dialects name the same things
 * differently — an automation's `values` is a saga's `fields`, a Formula's
 * `left`/`right` are `source`-or-`value` and `operand`, a reference to another
 * step's result is `{{name}}` in one and a `source`/`targetSource` key in the
 * other — and this is the one place that translates.
 */
export function sagaStepOf(step: AutomationStep): SagaStepDocument {
  const props = { ...step.props };
  const take = (key: string) => {
    const value = props[key];
    delete props[key];
    return value?.trim() ? value : undefined;
  };
  const properties: Record<string, string> = {};
  const put = (key: string, value: string | undefined) => {
    if (value !== undefined && value !== "") properties[key] = value;
  };

  switch (step.type) {
    case "Formula": {
      put("target", step.resultName);
      put("operation", take("operation"));
      const left = take("left");
      const reference = referenceOf(left);
      if (reference) put("source", reference);
      else put("value", left);
      put("operand", take("right"));
      break;
    }
    case "Decision":
      put("as", step.resultName);
      if (step.table) put("decisionTable", JSON.stringify(step.table));
      put("rule", take("ruleTable"));
      break;
    case "CreateEntity":
      put("as", step.resultName);
      put("entity", take("entity"));
      put("fields", take("values"));
      break;
    case "UpdateEntity": {
      put("as", step.resultName);
      put("entity", take("entity"));
      put("field", take("field"));
      const value = take("value");
      const reference = referenceOf(value);
      if (reference) put("source", reference);
      else put("value", value);
      put("targetSource", referenceOf(take("target")));
      break;
    }
    case "DeleteEntity": {
      put("as", step.resultName);
      put("entity", take("entity"));
      const target = take("target");
      const reference = referenceOf(target);
      if (reference) put("targetSource", reference);
      else put("targetField", target);
      break;
    }
    case "REST":
      put("as", step.resultName);
      put("method", take("method"));
      put("url", take("url"));
      put("bodyTemplate", take("body"));
      break;
  }
  // Anything with no counterpart keeps its own name rather than vanishing.
  for (const [key, value] of Object.entries(props)) put(key, value?.trim() ? value : undefined);

  return {
    id: step.id,
    type: step.type,
    label: describeStep(step),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

/** A saga automation as the model's saga. */
export function sagaOf(automation: Automation): { saga: SagaDocument; issues: CompositionIssue[] } {
  const issues: CompositionIssue[] = [];
  const source = automation.name;
  if (automation.conditions.length) {
    issues.push({
      severity: "warning",
      source,
      message: `${automation.conditions.length} check(s) are not part of a saga and are not generated; a saga runs its steps whenever it starts.`,
    });
  }
  if (loopsOf(automation).length) {
    issues.push({
      severity: "warning",
      source,
      message: "A saga's steps run once each; its repeats are not generated.",
    });
  }
  return {
    saga: {
      name: identifierOf(automation.name),
      ...(identifierOf(automation.name) !== automation.name ? { title: automation.name } : {}),
      entity: automation.trigger.entity,
      operation: automation.sagaOperation ?? "CREATE",
      trigger: automation.sagaTrigger ?? "automatic",
      ...(automation.description ? { description: automation.description } : {}),
      steps: automation.steps.map(sagaStepOf),
    },
    issues,
  };
}

/** A saga is named by an identifier; a title is whatever the author typed. */
export function identifierOf(title: string): string {
  const words = title.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  const joined = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  return /^[A-Za-z]/.test(joined) ? joined : `Saga${joined}`;
}

const hookKey = (hook: HookDocument) =>
  `${hook.entity}|${hook.event}|${hook.handler}|${(hook.fields ?? []).join(",")}`;

/** The model with every saga and hook the project's automations and services add. */
export function composeModel(model: ModelDocument, source: CompositionSource): Composition {
  const issues: CompositionIssue[] = [];
  const sagas = [...(model.sagas ?? [])];
  const hooks = [...(model.hooks ?? [])];
  const sagaNames = new Map(sagas.map((saga) => [saga.name, JSON.stringify(saga)]));
  const hookKeys = new Set(hooks.map(hookKey));
  const added = { sagas: 0, hooks: 0 };
  const entities = new Set(model.entities.map((entity) => entity.name));

  const addHook = (hook: HookDocument, from: string) => {
    if (!entities.has(hook.entity)) {
      issues.push({
        severity: "error",
        source: from,
        message: `hook ${hook.event} ${hook.handler} is on "${hook.entity}", which the model does not declare`,
      });
      return;
    }
    const key = hookKey(hook);
    if (hookKeys.has(key)) return;
    hookKeys.add(key);
    hooks.push(hook);
    added.hooks += 1;
  };

  for (const automation of source.automations) {
    if (automation.kind === "saga") {
      const { saga, issues: found } = sagaOf(automation);
      issues.push(...found);
      if (!entities.has(saga.entity)) {
        issues.push({
          severity: "error",
          source: automation.name,
          message: `the saga starts on "${saga.entity}", which the model does not declare`,
        });
        continue;
      }
      const existing = sagaNames.get(saga.name);
      if (existing === JSON.stringify(saga)) continue;
      if (existing) {
        issues.push({
          severity: "error",
          source: automation.name,
          message: `the model already declares a different saga named ${saga.name}; rename one of them`,
        });
        continue;
      }
      sagaNames.set(saga.name, JSON.stringify(saga));
      sagas.push(saga);
      added.sagas += 1;
    } else if (automation.kind === "hook") {
      for (const hook of automation.hooks) {
        addHook(
          {
            entity: automation.trigger.entity,
            event: hook.event,
            handler: hook.handler,
            ...(hook.field ? { fields: [hook.field] } : {}),
          },
          automation.name
        );
      }
    }
  }

  for (const { service, hooks: definitions } of source.serviceHooks) {
    const ordered = [...definitions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const definition of ordered) {
      if (definition.enabled === false) continue;
      const fields = (definition.parameters ?? []).map((parameter) => parameter.name);
      addHook(
        {
          entity: definition.entity || service,
          event: definition.type,
          handler: definition.name,
          ...(fields.length ? { fields } : {}),
        },
        `${service} hooks`
      );
    }
  }

  return {
    document: {
      ...model,
      ...(hooks.length ? { hooks } : {}),
      ...(sagas.length ? { sagas } : {}),
    },
    added,
    issues,
  };
}
