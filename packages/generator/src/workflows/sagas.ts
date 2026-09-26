/**
 * EML saga parsing — `%%workflow ... kind: saga` sections and their `%%step`
 * directives.
 *
 * It reads the language rather than emitting anything, so every contract it
 * enforces — which step types exist, what each one requires — is looked up in
 * `language/appwithai-language.json`, never restated here — and read through
 * `parsers/language-maps`, not `language/index`, because that is the loader
 * that walks up for the definition. `language/index` resolves it as a sibling
 * of its own module, which is correct when the checker runs from source and
 * wrong for the bundled CLI, where `import.meta.url` is `dist/cli/` and no
 * JSON has ever lived. `language/` is kept byte-identical to the reference
 * repository, so the adaptation belongs on this side of that boundary; the
 * sibling keeps its equivalents in `workflows/steps.ts` for the same reason.
 *
 * Turning a parsed saga into BPMN stays in `saga.ts`, where the output format
 * belongs.
 */

import type { SagaDeclaration, SagaStepDeclaration } from "../model/records";
import { getStepNode } from "../parsers/language-maps";

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

/**
 * Split a `%%step` line's `key: value` pairs.
 *
 * The `(?!\/\/)` is what keeps a URL whole: `url: https://host/path` would
 * otherwise split at `https:`, leaving a REST step compiled with no url at all
 * and the executor called with `undefined`. Kept identical to `parseStepProps`
 * in `language/checker.ts` — a checker and a compiler that disagree about a
 * directive is worse than either being wrong alone.
 */
const PROP_SPLIT = /\s+(?=[A-Za-z_]\w*:(?!\/\/))/;

export function parseStepProperties(rest: string): Record<string, string> {
  const properties: Record<string, string> = {};
  const trimmed = rest.trim();
  if (!trimmed) return properties;

  for (const chunk of trimmed.split(PROP_SPLIT)) {
    const at = chunk.indexOf(":");
    if (at <= 0) continue;
    const key = chunk.slice(0, at).trim();
    if (key) properties[key] = chunk.slice(at + 1).trim();
  }
  return properties;
}

/** One `%%step` line, bound to a flowchart node by its id. */
export interface SagaStep {
  /** Flowchart node id — the binding, and where sequence comes from. */
  nodeId: string;
  nodeType: string;
  /** The node's label in the flowchart, used as the BPMN task name. */
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

/** `%%workflow <Name> entity: <Entity> kind: saga` */
const WORKFLOW_RE = /^%%workflow\s+(\S+)\s+(.*)$/;
/** `%%step <nodeId> <NodeType> <rest>` */
const STEP_RE = /^%%step\s+(\S+)\s+(\S+)\s*(.*)$/;
/** `%%meta <key>: <value>` */
const META_RE = /^%%meta\s+([A-Za-z][\w-]*)\s*:\s*(.*)$/;

/** Node labels, so a BPMN task carries the name that is drawn on the diagram. */
function parseNodeLabels(lines: string[]): Map<string, string> {
  const labels = new Map<string, string>();
  // `A([Start])`, `B[Do a thing]`, `C{Choice}`, `D((Event))`, `E(Task)`
  const shape = /(^|\s|>)([A-Za-z_]\w*)\s*(\(\[|\[|\{|\(\(|\()([^\]})]*)/g;

  for (const line of lines) {
    if (line.trim().startsWith("%%")) continue;
    for (const match of line.matchAll(shape)) {
      const id = match[2]!;
      const label = match[4]!.trim();
      if (label && !labels.has(id)) labels.set(id, label);
    }
  }
  return labels;
}

/**
 * Node ids in edge order.
 *
 * The flowchart's arrows are the sequence — that is the whole point of binding
 * a step to a node id rather than numbering the directives. Nodes are emitted
 * in the order they are first reached, following `-->` from left to right, so
 * a branch reads the way it is drawn.
 */
function parseEdgeOrder(lines: string[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const push = (id: string): void => {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    // The guard has to admit every arrow the split below knows about. It used
    // to test `--` only, so a flowchart drawn entirely with `==>` never reached
    // the split: the order came back empty, the saga's steps silently fell back
    // to the order the `%%step` directives happen to be written in, and no
    // diagnostic fired — which is exactly what binding a step to a node id is
    // meant to stop being load-bearing.
    if (trimmed.startsWith("%%")) continue;
    if (!trimmed.includes("--") && !trimmed.includes("==")) continue;

    // Strip edge labels (`-->|Yes|`) before splitting, so they are not mistaken
    // for node ids.
    const cleaned = trimmed.replace(/\|[^|]*\|/g, " ");
    const parts = cleaned.split(/-{2,}>|-{2,}|={2,}>/);
    for (const part of parts) {
      const id = /^\s*([A-Za-z_]\w*)/.exec(part)?.[1];
      if (id) push(id);
    }
  }

  return order;
}

/** One `kind: saga` section as written, before any step is checked. */
interface SagaBlock {
  name: string;
  entity: string;
  /** Attributes on the `%%workflow` line: `entity`, `kind`, `trigger`, `operation`. */
  attrs: Record<string, string>;
  meta: Record<string, string>;
  labels: Map<string, string>;
  /** Node ids in the order the flowchart's edges first reach them. */
  order: string[];
  /** Every `%%step`, in declaration order, including ones that will be refused. */
  rawSteps: SagaStepDeclaration[];
}

/** Each `%%workflow … kind: saga` section: from its directive to the next `%%workflow`. */
function sagaBlocks(source: string): SagaBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: SagaBlock[] = [];

  // Section boundaries: each `%%workflow` opens one and closes the previous.
  const starts: number[] = [];
  lines.forEach((line, index) => {
    if (WORKFLOW_RE.test(line.trim())) starts.push(index);
  });

  for (const [position, start] of starts.entries()) {
    const end = starts[position + 1] ?? lines.length;
    const block = lines.slice(start, end);
    const header = WORKFLOW_RE.exec(block[0]!.trim());
    if (!header) continue;

    const attrs = parseStepProperties(header[2] ?? "");
    if ((attrs["kind"] ?? "").toLowerCase() !== "saga") continue;

    const meta: Record<string, string> = {};
    for (const line of block) {
      const match = META_RE.exec(line.trim());
      if (match) meta[match[1]!] = match[2]!.trim();
    }

    const labels = parseNodeLabels(block);
    const rawSteps: SagaStepDeclaration[] = [];
    for (const line of block) {
      const match = STEP_RE.exec(line.trim());
      if (!match) continue;
      const [, nodeId, nodeType, rest] = match as unknown as [string, string, string, string];
      rawSteps.push({
        id: nodeId,
        type: nodeType,
        label: labels.get(nodeId) ?? nodeId,
        properties: parseStepProperties(rest ?? ""),
      });
    }

    blocks.push({
      name: header[1]!,
      entity: attrs["entity"] ?? "",
      attrs,
      meta,
      labels,
      order: parseEdgeOrder(block),
      rawSteps,
    });
  }

  return blocks;
}

/**
 * A saga's trigger or operation as the model states it.
 *
 * The language puts both on the `%%workflow` line
 * (`kind: saga trigger: automatic operation: UPDATE`), which is where the
 * checker and the composer read them. Older models wrote them as `%%meta`
 * lines inside the section, and those are still read — but the directive, the
 * documented form, wins. The generators used to read only `%%meta`, so a saga
 * declared the documented way compiled as something its author never wrote.
 */
function declaredSetting(block: SagaBlock, key: "trigger" | "operation"): string | undefined {
  return block.attrs[key] ?? block.meta[key];
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
 * is the same operation spelled another way, exactly as `%%rbac` reads it; a
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

/** "no node in the flowchart" — the one check only a drawn saga can fail. */
function unreachableStep(block: SagaBlock, nodeId: string): SagaDiagnostic | null {
  if (block.order.includes(nodeId) || block.labels.has(nodeId)) return null;
  return {
    workflow: block.name,
    nodeId,
    message: `no node "${nodeId}" in the flowchart — the step will never run`,
  };
}

/**
 * Read every saga section into a declaration, without checking its steps.
 *
 * Steps are listed in the order the saga runs them — the order its edges reach
 * their nodes, with any step on no edge after, in declaration order — so a
 * declaration states outright what the flowchart draws. Which steps are refused
 * is `compileSagaDeclarations`' question. The diagnostics returned are the ones
 * only a flowchart can raise: a step on a node the diagram never draws.
 */
export function readSagaDirectives(source: string): {
  declarations: SagaDeclaration[];
  diagnostics: SagaDiagnostic[];
} {
  const declarations: SagaDeclaration[] = [];
  const diagnostics: SagaDiagnostic[] = [];

  for (const block of sagaBlocks(source)) {
    const rank = (id: string) => {
      const index = block.order.indexOf(id);
      return index === -1 ? Number.POSITIVE_INFINITY : index;
    };
    const steps = block.rawSteps
      .map((step, position) => ({ step, position }))
      .sort((a, b) => rank(a.step.id) - rank(b.step.id) || a.position - b.position)
      .map(({ step }) => step);

    const reported = new Set<string>();
    for (const step of block.rawSteps) {
      if (reported.has(step.id)) continue;
      reported.add(step.id);
      const diagnostic = unreachableStep(block, step.id);
      if (diagnostic) diagnostics.push(diagnostic);
    }

    const operation = declaredSetting(block, "operation");
    const trigger = declaredSetting(block, "trigger");
    declarations.push({
      name: block.name,
      entity: block.entity,
      ...(operation !== undefined ? { operation } : {}),
      ...(trigger !== undefined ? { trigger } : {}),
      ...(block.meta["description"] !== undefined
        ? { description: block.meta["description"] }
        : {}),
      steps,
    });
  }

  return { declarations, diagnostics };
}

/**
 * Compile every saga section in an EML document.
 *
 * Steps run in the order the flowchart's edges reach them; a step whose type
 * the language does not declare, or on a node that already has one, is dropped
 * with a diagnostic.
 */
export function parseSagas(source: string): SagaParseResult {
  const workflows: SagaWorkflow[] = [];
  const diagnostics: SagaDiagnostic[] = [];

  for (const block of sagaBlocks(source)) {
    const { name, entity, meta, rawSteps } = block;
    if (!entity) {
      diagnostics.push({ workflow: name, message: "saga declares no entity" });
    }
    const order = block.order;

    const byNode = acceptSagaSteps(name, rawSteps, diagnostics, (nodeId) => {
      const diagnostic = unreachableStep(block, nodeId);
      if (diagnostic) diagnostics.push(diagnostic);
    });

    const steps: SagaStep[] = [];
    for (const nodeId of order) {
      const step = byNode.get(nodeId);
      if (step) {
        steps.push(step);
        byNode.delete(nodeId);
      }
    }
    steps.push(...byNode.values());

    if (steps.length === 0) {
      diagnostics.push({
        workflow: name,
        message: "saga has no %%step directives, so it compiles to an empty process",
      });
    }

    workflows.push({
      name,
      entity,
      operation: sagaOperation(declaredSetting(block, "operation")),
      trigger: sagaTrigger(declaredSetting(block, "trigger")),
      description: meta["description"],
      steps,
    });
  }

  return { workflows, diagnostics };
}

/**
 * The steps of a saga that can run, keyed by node, in declaration order.
 *
 * A step of an unknown type is dropped, and so is a second step on a node that
 * already has one; a step missing a property its type requires is kept and
 * reported, because the checker (EML241–EML249) is what refuses it. `afterEach`
 * runs once per accepted step, after its own checks, so a syntax can add the
 * checks only it can make.
 */
function acceptSagaSteps(
  workflow: string,
  declared: SagaStepDeclaration[],
  diagnostics: SagaDiagnostic[],
  afterEach: (nodeId: string) => void = () => {}
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
        message: `node "${nodeId}" already has a step; the second is ignored`,
      });
      continue;
    }

    for (const missing of missingStepProps(nodeType, step.properties)) {
      diagnostics.push({ workflow, nodeId, message: `${nodeType} is missing ${missing}` });
    }
    afterEach(nodeId);

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
 * Compile saga declarations read from the YAML model language.
 *
 * The same checks `parseSagas` makes, except that steps run in the order they
 * are listed: a YAML saga states its order outright rather than drawing it.
 * The trigger and operation are normalised by `sagaTrigger` / `sagaOperation`,
 * so both syntaxes share one vocabulary and one pair of defaults.
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
        message: "saga has no %%step directives, so it compiles to an empty process",
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
