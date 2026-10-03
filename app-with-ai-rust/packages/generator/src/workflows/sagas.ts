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
  /** `ALL` unless a `%%meta operation:` narrows it. */
  operation: string;
  /** What starts the run — `rule` by default. */
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

/**
 * Every saga in an EML document, with its steps in flowchart order.
 *
 * Sections are delimited by `%%workflow`; a document may hold several.
 */
export function parseSagas(source: string): SagaParseResult {
  const lines = source.split(/\r?\n/);
  const workflows: SagaWorkflow[] = [];
  const diagnostics: SagaDiagnostic[] = [];

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

    const name = header[1]!;
    const entity = attrs["entity"] ?? "";
    if (!entity) {
      diagnostics.push({ workflow: name, message: "saga declares no entity" });
    }

    const meta: Record<string, string> = {};
    for (const line of block) {
      const match = META_RE.exec(line.trim());
      if (match) meta[match[1]!] = match[2]!.trim();
    }

    const labels = parseNodeLabels(block);
    const order = parseEdgeOrder(block);

    const byNode = new Map<string, SagaStep>();
    for (const line of block) {
      const match = STEP_RE.exec(line.trim());
      if (!match) continue;

      const [, nodeId, nodeType, rest] = match as unknown as [string, string, string, string];
      if (!isStepNodeType(nodeType)) {
        diagnostics.push({
          workflow: name,
          nodeId,
          message: `unknown step type "${nodeType}"`,
        });
        continue;
      }
      if (byNode.has(nodeId)) {
        diagnostics.push({
          workflow: name,
          nodeId,
          message: `node "${nodeId}" already has a step; the second is ignored`,
        });
        continue;
      }

      const properties = parseStepProperties(rest ?? "");
      for (const missing of missingStepProps(nodeType, properties)) {
        diagnostics.push({
          workflow: name,
          nodeId,
          message: `${nodeType} is missing ${missing}`,
        });
      }
      if (!order.includes(nodeId) && !labels.has(nodeId)) {
        diagnostics.push({
          workflow: name,
          nodeId,
          message: `no node "${nodeId}" in the flowchart — the step will never run`,
        });
      }

      byNode.set(nodeId, {
        nodeId,
        nodeType,
        label: labels.get(nodeId) ?? nodeId,
        properties,
      });
    }

    // Flowchart order first; any step whose node is missing from the edges
    // still runs, after the ones that are placed.
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
      operation: (meta["operation"] ?? "ALL").toUpperCase(),
      trigger: meta["trigger"] ?? "rule",
      description: meta["description"],
      steps,
    });
  }

  return { workflows, diagnostics };
}
