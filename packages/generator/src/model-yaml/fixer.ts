/**
 * Mechanical repairs to a model, applied to its YAML text.
 *
 * Some diagnostics have exactly one right answer — a column the generator adds
 * anyway, a foreign key missing its `_id`, a table with no key — and asking an
 * author to make the edit by hand only adds a chance to make it wrongly. These
 * are repaired here. Everything else is left to the author: a fix that has to
 * guess what the model meant is not a fix.
 *
 * The repair edits the YAML document node by node, so an author's comments,
 * ordering and layout survive it; only the constructs being repaired change.
 *
 *   fixModelYaml(text)   one round of repairs
 *   checkAndFix(text)    repair, re-check and repeat until nothing more can be fixed
 */

import { isMap, isSeq, parseDocument, type Document, type YAMLMap, type YAMLSeq } from "yaml";
import { MANAGED_COLUMN_NAMES } from "../../../../language/yaml/checker";
import type { DocumentPath, ModelDocument } from "./document";
import { type ModelDiagnostic, readModelYaml } from "./validate";

/** The diagnostics this module repairs. */
export const AUTO_FIXABLE_CODES = new Set([
  "EML001", // no name → a name from the file, else from the first entity
  "EML103", // a column the generator adds anyway → remove it
  "EML112", // a column declared twice → keep the first, with the stronger constraints
  "EML114", // a foreign key not ending in _id → rename it, and every reference to it
  "EML117", // no primary key → add an `id` key first
  "EML287", // a camelCase identifier in a rule condition → the snake_case column
  "EML421", // a state machine with no initial state → its first state
  "EML422", // a state machine with no final state → the states nothing leaves
]);

export interface AppliedFix {
  code: string;
  path: DocumentPath;
  description: string;
}

export interface FixOutcome {
  text: string;
  applied: AppliedFix[];
}

export interface FixOptions {
  /** The model's file name, from which a missing name is derived. */
  fileName?: string;
}

const FORMAT = {
  lineWidth: 0,
  blockQuote: "literal",
  indentSeq: true,
  flowCollectionPadding: false,
} as const;

function snakeCase(identifier: string): string {
  return identifier.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/** `drug-discovery.eml.yaml` → `Drug Discovery`. */
function nameFromFile(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, "").replace(/(\.eml)?\.ya?ml$/i, "");
  return base
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

class Repair {
  readonly applied: AppliedFix[] = [];

  constructor(
    readonly yaml: Document,
    readonly model: ModelDocument,
    readonly options: FixOptions
  ) {}

  private seq(path: DocumentPath): YAMLSeq | undefined {
    const node = this.yaml.getIn(path, true);
    return isSeq(node) ? node : undefined;
  }

  private map(path: DocumentPath): YAMLMap | undefined {
    const node = this.yaml.getIn(path, true);
    return isMap(node) ? node : undefined;
  }

  private done(code: string, path: DocumentPath, description: string): void {
    this.applied.push({ code, path, description });
  }

  apply(diagnostic: ModelDiagnostic): void {
    switch (diagnostic.code) {
      case "EML001":
        return this.name();
      case "EML103":
        return this.managedColumn(diagnostic.path);
      case "EML112":
        return this.duplicateColumn(diagnostic.path);
      case "EML114":
        return this.foreignKeySuffix(diagnostic.path);
      case "EML117":
        return this.primaryKey(diagnostic.path);
      case "EML287":
        return this.snakeCaseCondition(diagnostic.path);
      case "EML421":
        return this.initialState(diagnostic.path);
      case "EML422":
        return this.finalStates(diagnostic.path);
    }
  }

  private name(): void {
    if (this.model.name !== undefined) return;
    const name = this.options.fileName
      ? nameFromFile(this.options.fileName)
      : `${this.model.entities[0]?.name ?? "Model"} App`;
    // After `eml`, where the language puts it.
    const root = this.yaml.contents;
    if (!isMap(root)) return;
    const pair = this.yaml.createPair("name", name);
    const at = root.items.findIndex((item) => String((item.key as { value?: unknown })?.value ?? item.key) === "eml");
    root.items.splice(at + 1, 0, pair);
    this.done("EML001", ["name"], `named the model "${name}"`);
  }

  /** `["entities", e, "attributes", a]` → the entity and column it names. */
  private column(path: DocumentPath): { entity: number; attribute: number } | undefined {
    if (path[0] !== "entities" || path[2] !== "attributes") return undefined;
    const entity = path[1];
    const attribute = path[3];
    return typeof entity === "number" && typeof attribute === "number"
      ? { entity, attribute }
      : undefined;
  }

  private managedColumn(path: DocumentPath): void {
    const at = this.column(path);
    const attributes = at && this.seq(["entities", at.entity, "attributes"]);
    if (!at || !attributes) return;
    const name = this.model.entities[at.entity]?.attributes[at.attribute]?.name;
    if (!name || !MANAGED_COLUMN_NAMES.has(name.toLowerCase())) return;
    attributes.items.splice(at.attribute, 1);
    this.done("EML103", path, `removed ${this.model.entities[at.entity]!.name}.${name}, which the generator adds itself`);
  }

  private duplicateColumn(path: DocumentPath): void {
    const at = this.column(path);
    const attributes = at && this.seq(["entities", at.entity, "attributes"]);
    const entity = at && this.model.entities[at.entity];
    if (!at || !attributes || !entity) return;
    const duplicate = entity.attributes[at.attribute];
    if (!duplicate) return;
    const firstIndex = entity.attributes.findIndex((candidate) => candidate.name === duplicate.name);
    if (firstIndex < 0 || firstIndex === at.attribute) return;
    const first = this.map(["entities", at.entity, "attributes", firstIndex]);
    if (!first) return;

    // The first declaration keeps its place and its type; the constraints merge
    // towards the stronger, as the compiler merges them.
    if (duplicate.pk) first.set("pk", true);
    if (duplicate.fk) first.set("fk", true);
    if (duplicate.unique) first.set("unique", true);
    if (!duplicate.optional && first.get("optional") === true) first.delete("optional");
    for (const key of ["enum", "help", "comment"] as const) {
      if (duplicate[key] !== undefined && !first.has(key)) first.set(key, duplicate[key]);
    }
    attributes.items.splice(at.attribute, 1);
    this.done("EML112", path, `merged the second ${entity.name}.${duplicate.name} into the first`);
  }

  private foreignKeySuffix(path: DocumentPath): void {
    const at = this.column(path);
    const entity = at && this.model.entities[at.entity];
    const attribute = at && entity?.attributes[at.attribute];
    if (!at || !entity || !attribute || attribute.name.endsWith("_id")) return;
    const renamed = `${attribute.name}_id`;
    this.yaml.setIn(["entities", at.entity, "attributes", at.attribute, "name"], renamed);

    // Every place the model names the column by its old name names it by its new one.
    (entity.indexes ?? []).forEach((index, i) => {
      index.columns.forEach((column, c) => {
        if (column === attribute.name) {
          this.yaml.setIn(["entities", at.entity, "indexes", i, "columns", c], renamed);
        }
      });
    });
    (this.model.hooks ?? []).forEach((hook, h) => {
      if (hook.entity !== entity.name) return;
      (hook.fields ?? []).forEach((field, f) => {
        if (field === attribute.name) this.yaml.setIn(["hooks", h, "fields", f], renamed);
      });
    });
    this.done("EML114", path, `renamed ${entity.name}.${attribute.name} to ${renamed}`);
  }

  private primaryKey(path: DocumentPath): void {
    const index = path[0] === "entities" ? path[1] : undefined;
    const entity = typeof index === "number" ? this.model.entities[index] : undefined;
    const attributes = typeof index === "number" && this.seq(["entities", index, "attributes"]);
    if (!entity || !attributes || entity.attributes.some((attribute) => attribute.pk)) return;
    const existing = entity.attributes.findIndex((attribute) => attribute.name === "id");
    if (existing >= 0) {
      this.yaml.setIn(["entities", index, "attributes", existing, "pk"], true);
      this.done("EML117", path, `made ${entity.name}.id the primary key`);
      return;
    }
    attributes.items.unshift(this.yaml.createNode({ name: "id", type: "uuid", pk: true }));
    this.done("EML117", path, `added the key ${entity.name}.id`);
  }

  private snakeCaseCondition(path: DocumentPath): void {
    const [rules, r, actions, a] = path;
    if (rules !== "rules" || actions !== "actions" || typeof r !== "number" || typeof a !== "number") {
      return;
    }
    const when = this.model.rules?.[r]?.actions?.[a]?.when;
    if (!when) return;
    const rewritten = when.replace(/\b[a-z][A-Za-z0-9]*\b/g, (identifier) =>
      /[a-z][A-Z]/.test(identifier) ? snakeCase(identifier) : identifier
    );
    if (rewritten === when) return;
    this.yaml.setIn(["rules", r, "actions", a, "when"], rewritten);
    this.done("EML287", [...path, "when"], `rewrote the condition as "${rewritten}"`);
  }

  private stateMachine(path: DocumentPath): number | undefined {
    return path[0] === "stateMachines" && typeof path[1] === "number" ? path[1] : undefined;
  }

  private initialState(path: DocumentPath): void {
    const index = this.stateMachine(path);
    const machine = index === undefined ? undefined : this.model.stateMachines?.[index];
    const first = machine?.states[0];
    if (index === undefined || !machine || machine.initial !== undefined || !first) return;
    this.yaml.setIn(["stateMachines", index, "initial"], first);
    this.done("EML421", [...path, "initial"], `started ${machine.name} in "${first}", its first state`);
  }

  private finalStates(path: DocumentPath): void {
    const index = this.stateMachine(path);
    const machine = index === undefined ? undefined : this.model.stateMachines?.[index];
    if (index === undefined || !machine || machine.final?.length) return;
    // A state nothing leaves is where a record's lifecycle ends. A machine in
    // which every state has a way out ends in its last state.
    const leaving = new Set(machine.transitions.map((transition) => transition.from));
    const sinks = machine.states.filter((state) => !leaving.has(state));
    const final = sinks.length ? sinks : [machine.states[machine.states.length - 1]!];
    const node = this.yaml.createNode(final);
    node.flow = true;
    this.yaml.setIn(["stateMachines", index, "final"], node);
    this.done("EML422", [...path, "final"], `ended ${machine.name} in ${final.join(", ")}`);
  }
}

/** Document order: segment by segment, indexes compared as numbers. */
function comparePaths(left: DocumentPath, right: DocumentPath): number {
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const a = left[i]!;
    const b = right[i]!;
    if (a === b) continue;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  }
  return left.length - right.length;
}

/**
 * One round of repairs: every auto-fixable diagnostic the model currently has,
 * applied to its YAML. Returns the text unchanged when there is nothing to fix
 * or the text is not a model document.
 */
export function fixModelYaml(text: string, options: FixOptions = {}): FixOutcome {
  const read = readModelYaml(text);
  if (!read.document) return { text, applied: [] };

  const yaml = parseDocument(text, { keepSourceTokens: false });
  const repair = new Repair(yaml, read.document, options);

  // Removals shift the indexes after them, so work from the last path to the first.
  const fixable = read.diagnostics
    .filter((diagnostic) => AUTO_FIXABLE_CODES.has(diagnostic.code))
    .sort((left, right) => comparePaths(right.path, left.path));
  for (const diagnostic of fixable) repair.apply(diagnostic);

  return repair.applied.length
    ? { text: yaml.toString(FORMAT), applied: repair.applied }
    : { text, applied: [] };
}

export interface CheckAndFixResult {
  text: string;
  applied: AppliedFix[];
  /** What is still wrong once nothing more can be repaired. */
  diagnostics: ModelDiagnostic[];
  ok: boolean;
}

/**
 * Check, repair and re-check until the model has nothing left that can be
 * repaired mechanically — the loop an author (or an assistant) runs before
 * handing a model over.
 */
export function checkAndFix(text: string, options: FixOptions = {}): CheckAndFixResult {
  let current = text;
  const applied: AppliedFix[] = [];
  for (let round = 0; round < 8; round++) {
    const outcome = fixModelYaml(current, options);
    if (!outcome.applied.length) break;
    applied.push(...outcome.applied);
    current = outcome.text;
  }
  const result = readModelYaml(current);
  return { text: current, applied, diagnostics: result.diagnostics, ok: result.ok };
}
