/**
 * Compare what the `eml` CLI generated from a Mermaid model with what it
 * generates from the YAML model that replaced it.
 *
 * Byte-identical files match. A file that is not byte-identical matches only
 * for one of the reasons below, each of which is a property of the old Mermaid
 * reader rather than of the model, and each of which is named in the result:
 *
 * - **order** — the CLI's Mermaid parser listed entities (and so relationships,
 *   README lines and Kysely interfaces) in order of first mention in the
 *   drawing; a YAML model lists them in declaration order, which is the order
 *   the generator always used. Accepted only in listings (README.md,
 *   KYSELY_TYPES.md) and in a migration that declares no foreign key; the file
 *   must hold the same lines.
 * - **timestamp** — a Kysely migration is named `<Date.now()>_create_tables.ts`;
 *   the name differs on every run and the contents must not.
 * - **reader fields** — the serialised model (`eml.model.json`, `src/model.js`)
 *   is the CLI's internal model. The Mermaid parser also recorded how a thing
 *   was drawn (`shape`, the cardinality `operator`, the rule's `raw` text, a
 *   relationship `foreignKey` it named after the wrong end, `[*]` pseudo-
 *   transitions) and nothing reads those; a YAML model records what a rule node
 *   *is* (`type`), a state machine's `initial` and `final`, and its reports.
 *   A workflow's `hooks`/`guards`/`triggers` are per-entity copies of the
 *   model's lists that each reader attached differently. Everything the
 *   runtime reads — entities, attributes, rules as `jdmType` graphs, the
 *   model's hooks, workflow states and transitions, enums — must be equal.
 * - **unread access rules** — this CLI's Mermaid parser read `%%guard` and
 *   not `%%rbac`, so a model's `%%rbac` rules never reached its model file.
 *   The YAML model carries them; nothing in the node-rest runtime enforces
 *   `guards` either way. When the Mermaid run did read any, they must agree.
 * - **rounded rule node** — `G(Calculate)` in a Mermaid rule was a
 *   `functionNode` to the CLI's parser and an `expressionNode` to the
 *   generator's; the YAML carries the generator's reading, which is what every
 *   generated application compiled. A node the Mermaid drew with the `rounded`
 *   shape may therefore move from `functionNode` to `expressionNode`, and no
 *   other node may change. The node-rest runtime evaluates the two identically
 *   (`runtime/src/rules.js`).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { differences, walk } from "./lib";

/**
 * The one change the node-rest runtime needed: a YAML model states where a
 * state machine starts (`initial`), where a drawing drew `[*] --> s`. The
 * Mermaid run's copy is taken through the same change before comparing.
 */
const RUNTIME_WORKFLOWS_PATCH: [string, string] = [
  "      initial: initial ?? wf.states?.[0] ?? null,",
  "      // A YAML model states the start (`initial`); a drawing drew it as `[*] --> s`.\n      initial: wf.initial ?? initial ?? wf.states?.[0] ?? null,",
];

/**
 * Text a generator writes that named the model's old file format. Each pair is
 * the Mermaid-era wording and its replacement, applied to the Mermaid run's
 * file before comparing; nothing else in a file may differ.
 */
export const WORDING: Array<[string, string]> = [
  ["an EML (.mmd) model by the Enterprise Reporting EML CLI", "an EML model (.eml.yaml) by the Enterprise Reporting EML CLI"],
];

export interface OutputComparison {
  ok: boolean;
  identical: number;
  explained: string[];
  failures: string[];
}

const MIGRATION = /src\/lib\/db\/migrations\/\d+_create_tables\.ts$/;
const TIMESTAMP = /\/\d{10,}_create_tables\.ts$/;

function sortedLines(text: string): string {
  return text.split("\n").sort().join("\n");
}

function readModelFile(path: string): any {
  const text = readFileSync(path, "utf8");
  if (path.endsWith(".json")) return JSON.parse(text);
  // `export const MODEL = {…};` then `export const ENUMS = {…};`, each a JSON literal.
  const exported: Record<string, unknown> = {};
  for (const match of text.matchAll(/^export const (\w+) = (\{[\s\S]*?^\});$/gm))
    exported[match[1]!] = JSON.parse(match[2]!);
  return exported.MODEL ? { ...(exported.MODEL as object), ENUMS: exported.ENUMS } : exported;
}

/** The serialised model, reduced to what the runtime and generators read. */
function runtimeView(model: any, rounded: Set<string>, dropGuards = false): any {
  const clone = JSON.parse(JSON.stringify(model));
  if (dropGuards) delete clone.guards;
  delete clone.diagnostics;
  if (!clone.reports?.length) delete clone.reports;
  for (const relationship of clone.relationships ?? []) {
    delete relationship.operator;
    delete relationship.foreignKey;
  }
  // A state machine's start and end: `[*] --> s` / `s --> [*]` in the drawing,
  // `initial` / `final` in a YAML model. A workflow's `hooks`, `guards` and
  // `triggers` are copies of the model's own lists, filtered by entity, which
  // each reader attached to different workflows; the runtime reads the model's
  // lists (`src/hooks.js`, `MODEL.hooks`), and those are compared.
  for (const workflow of clone.workflows ?? []) {
    delete workflow.hooks;
    delete workflow.guards;
    delete workflow.triggers;
    if (!Array.isArray(workflow.transitions)) continue;
    const start = workflow.transitions.find((t: any) => t.from === "[*]");
    const ends = workflow.transitions.filter((t: any) => t.to === "[*]").map((t: any) => t.from);
    if (start && workflow.initial === undefined) workflow.initial = start.to;
    if (ends.length && !workflow.final?.length) workflow.final = ends;
    if (workflow.kind === "state" && !workflow.final) workflow.final = [];
    workflow.transitions = workflow.transitions.filter((t: any) => t.from !== "[*]" && t.to !== "[*]");
  }
  for (const rule of clone.rules ?? []) {
    delete rule.raw;
    for (const node of rule.nodes ?? []) {
      delete node.shape;
      delete node.type;
      if (rounded.has(`${rule.name}/${node.id}`) && node.jdmType === "functionNode")
        node.jdmType = "expressionNode";
    }
  }
  const strip = (value: any): any =>
    Array.isArray(value)
      ? value.map(strip).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([key]) => key !== "line")
              .map(([key, entry]) => [key, strip(entry)])
          )
        : value;
  return strip(clone);
}

/**
 * Rule nodes the Mermaid drew as `rounded`, as `<rule>/<node>`. Read from the
 * Mermaid run's own serialised model, which records each node's shape.
 */
export function roundedNodes(mermaidModelFile: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!mermaidModelFile || !existsSync(mermaidModelFile)) return out;
  const model = readModelFile(mermaidModelFile);
  for (const rule of model.rules ?? [])
    for (const node of rule.nodes ?? []) if (node.shape === "rounded") out.add(`${rule.name}/${node.id}`);
  return out;
}

export function compareOutputs(mermaidDir: string, yamlDir: string, rounded: Set<string>): OutputComparison {
  const result: OutputComparison = { ok: true, identical: 0, explained: [], failures: [] };
  const key = (dir: string, file: string) => relative(dir, file).replace(TIMESTAMP, "/<timestamp>_create_tables.ts");
  const mermaidFiles = new Map(walk(mermaidDir, () => true).map((f) => [key(mermaidDir, f), f]));
  const yamlFiles = new Map(walk(yamlDir, () => true).map((f) => [key(yamlDir, f), f]));

  for (const name of new Set([...mermaidFiles.keys(), ...yamlFiles.keys()])) {
    const a = mermaidFiles.get(name);
    const b = yamlFiles.get(name);
    if (!a || !b) {
      result.failures.push(`${name}: only in the ${a ? "Mermaid" : "YAML"} output`);
      continue;
    }
    let left = readFileSync(a, "utf8");
    if (name.endsWith("src/workflows.js") && left.includes(RUNTIME_WORKFLOWS_PATCH[0])) {
      left = left.replace(...RUNTIME_WORKFLOWS_PATCH);
      result.explained.push(`${name}: reads a state machine's \`initial\` (the runtime's one change)`);
    }
    const right = readFileSync(b, "utf8");
    for (const [from, to] of WORDING)
      if (left.includes(from) && right.includes(to)) {
        left = left.replaceAll(from, to);
        result.explained.push(`${name}: names the model as .eml.yaml`);
      }
    if (left === right) {
      if (MIGRATION.test(relative(mermaidDir, a)) && relative(mermaidDir, a) !== relative(yamlDir, b))
        result.explained.push(`${name}: timestamp in the file name`);
      result.identical += 1;
      continue;
    }
    if (name.endsWith("eml.model.json") || name.endsWith("src/model.js")) {
      const mermaidModel = readModelFile(a);
      const yamlModel = readModelFile(b);
      // Access rules the Mermaid parser never read (it knew `%%guard`, not
      // `%%rbac`): carried by the YAML model, enforced by nothing in the
      // node-rest runtime. When the Mermaid run did read some, they must agree.
      const unread = !(mermaidModel.guards?.length) && yamlModel.guards?.length > 0;
      const diff = differences(runtimeView(mermaidModel, rounded, unread), runtimeView(yamlModel, rounded, unread), 60);
      if (diff.length) result.failures.push(`${name}:\n        ${diff.join("\n        ")}`);
      else
        result.explained.push(
          `${name}: reader fields and order only${unread ? `; carries ${yamlModel.guards.length} %%rbac access rule(s) the Mermaid parser did not read` : ""}`
        );
      continue;
    }
    if (name.endsWith(".jdm.json")) {
      const rule = JSON.parse(left).name;
      const fixed = JSON.parse(left);
      for (const node of fixed.nodes ?? []) {
        const id = String(node.id).replace(/^node-/, "");
        if (rounded.has(`${rule}/${id}`) && node.type === "functionNode") node.type = "expressionNode";
      }
      const diff = differences(fixed, JSON.parse(right));
      if (diff.length) result.failures.push(`${name}:\n        ${diff.join("\n        ")}`);
      else result.explained.push(`${name}: rounded node(s) are expressionNode, as the generator compiled them`);
      continue;
    }
    // Order is immaterial only in listings, and in a migration that declares no
    // foreign key (whose CREATE TABLE statements are then independent).
    const orderFree =
      /(^|\/)(README\.md|KYSELY_TYPES\.md)$/.test(name) ||
      (MIGRATION.test(name.replace("<timestamp>", "0")) && !/REFERENCES|FOREIGN KEY/i.test(left + right));
    if (orderFree && sortedLines(left) === sortedLines(right)) {
      result.explained.push(`${name}: same lines, entity order differs`);
      continue;
    }
    result.failures.push(`${name}: contents differ`);
  }
  result.ok = result.failures.length === 0;
  return result;
}
