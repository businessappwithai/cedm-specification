/**
 * A model's sagas → the processes the generated application runs.
 *
 * Every contract enforced here — which step types exist, what each one
 * requires — is looked up in `language/appwithai-language.json`, never restated,
 * and read through `model/language-maps`, the loader that finds the definition
 * from the bundled CLI as well as from source.
 *
 * Turning a compiled saga into BPMN stays in `saga.ts`, where the output format
 * belongs.
 */

import type { SagaDeclaration, SagaStepDeclaration } from "../model/records";
import { getStepNode } from "../model/language-maps";

/** Whether the language declares a saga step type by this name. */
function isStepNodeType(value: string): boolean {
  return getStepNode(value) !== undefined;
}

/**
 * The properties a step declares but does not supply.
 *
 * `required` is every key that must be present; `oneOf` is a group of which at
 * least one member must be — `source` or `value` on an `UpdateEntity`, say.
 * Both come from the step's own contract in the language definition.
 */
function missingStepProps(type: string, props: Record<string, string>): string[] {
  const spec = getStepNode(type);
  if (!spec) return [`unknown step type "${type}"`];

  const has = (key: string): boolean => (props[key] ?? "").trim().length > 0;
  const missing = spec.required.filter((key) => !has(key));
  for (const group of spec.oneOf ?? []) {
    if (!group.some(has)) missing.push(group.join(" or "));
  }
  return missing;
}

/** One step of a saga. */
export interface SagaStep {
  /** The step's id — its BPMN task id, and how the run log names it. */
  nodeId: string;
  nodeType: string;
  /** The step's label, used as the BPMN task name; its id when it has none. */
  label: string;
  properties: Record<string, string>;
}

export interface SagaWorkflow {
  name: string;
  /** ERD entity the workflow is bound to. */
  entity: string;
  /** The write that runs it: `CREATE` (the default), `UPDATE`, `DELETE` or `ALL`. */
  operation: string;
  /** What starts the run: `automatic` (the default) or `rule`. */
  trigger: string;
  description?: string;
  steps: SagaStep[];
}

export interface SagaDiagnostic {
  workflow: string;
  nodeId?: string;
  message: string;
}

export interface SagaParseResult {
  workflows: SagaWorkflow[];
  diagnostics: SagaDiagnostic[];
}

const OPERATION_ALIASES: Record<string, string> = {
  create: "CREATE",
  insert: "CREATE",
  add: "CREATE",
  update: "UPDATE",
  edit: "UPDATE",
  write: "UPDATE",
  modify: "UPDATE",
  delete: "DELETE",
  remove: "DELETE",
  destroy: "DELETE",
  all: "ALL",
  any: "ALL",
  "*": "ALL",
};

/**
 * The write a saga runs on, in the vocabulary the runtime matches against
 * (`CREATE`, `UPDATE`, `DELETE`, `ALL`). An alias — `INSERT`, `edit`, `*` —
 * is the same operation spelled another way, exactly as an access rule reads it; a
 * value that is none of them is kept, upper-cased, for the checker to report.
 * The language's default is `CREATE`.
 */
export function sagaOperation(declared: string | undefined): string {
  if (declared === undefined || declared.trim() === "") return "CREATE";
  return OPERATION_ALIASES[declared.trim().toLowerCase()] ?? declared.trim().toUpperCase();
}

/**
 * What starts a saga: `automatic` (every matching write — the language's
 * default) or `rule` (only a rule's `trigger-workflow` action).
 */
export function sagaTrigger(declared: string | undefined): string {
  if (declared === undefined || declared.trim() === "") return "automatic";
  return declared.trim().toLowerCase();
}

/**
 * The steps of a saga that can run, keyed by id, in the order listed.
 *
 * A step of an unknown type is dropped, and so is a second step with an id
 * already used; a step missing a property its type requires is kept and
 * reported, because the checker (EML262) is what refuses it.
 */
function acceptSagaSteps(
  workflow: string,
  declared: SagaStepDeclaration[],
  diagnostics: SagaDiagnostic[]
): Map<string, SagaStep> {
  const byNode = new Map<string, SagaStep>();

  for (const step of declared) {
    const { id: nodeId, type: nodeType } = step;
    if (!isStepNodeType(nodeType)) {
      diagnostics.push({ workflow, nodeId, message: `unknown step type "${nodeType}"` });
      continue;
    }
    if (byNode.has(nodeId)) {
      diagnostics.push({
        workflow,
        nodeId,
        message: `step id "${nodeId}" is used twice; the second step is ignored`,
      });
      continue;
    }

    for (const missing of missingStepProps(nodeType, step.properties)) {
      diagnostics.push({ workflow, nodeId, message: `${nodeType} is missing ${missing}` });
    }

    byNode.set(nodeId, {
      nodeId,
      nodeType,
      label: step.label ?? nodeId,
      properties: { ...step.properties },
    });
  }

  return byNode;
}

/**
 * Compile a model's sagas. Steps run in the order they are listed. The trigger
 * and operation are normalised by `sagaTrigger` / `sagaOperation`, so a saga
 * that leaves either out gets the language's default.
 */
export function compileSagaDeclarations(declarations: SagaDeclaration[]): SagaParseResult {
  const workflows: SagaWorkflow[] = [];
  const diagnostics: SagaDiagnostic[] = [];

  for (const declaration of declarations) {
    const { name, entity } = declaration;
    if (!entity) {
      diagnostics.push({ workflow: name, message: "saga declares no entity" });
    }

    const steps = [...acceptSagaSteps(name, declaration.steps, diagnostics).values()];
    if (steps.length === 0) {
      diagnostics.push({
        workflow: name,
        message: "saga has no steps, so it compiles to an empty process",
      });
    }

    workflows.push({
      name,
      entity,
      operation: sagaOperation(declaration.operation),
      trigger: sagaTrigger(declaration.trigger),
      description: declaration.description,
      steps,
    });
  }

  return { workflows, diagnostics };
}
