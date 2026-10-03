/**
 * Reading a model for the `eml` CLI.
 *
 * A model is a YAML document (`*.eml.yaml`). It is read and validated by the
 * language's own reader — YAML syntax, the JSON Schema, the full checker —
 * which reports every finding at the YAML line and column it concerns, and
 * only a document that passes is turned into the CLI's model.
 *
 * The reader lives in the repository's generator package and needs `yaml` and
 * `ajv`; it is imported on demand so that a failure to find it names what to
 * install rather than failing at module load.
 */

import { cardinalityKind, loadLanguageDefinition, normalizeType } from "../../index.ts";
import type {
  ModelDocument,
  RelationshipDocument,
  RuleDocument,
  StateMachineDocument,
} from "../../yaml/document.ts";
import type {
  CanonicalType,
  Diagnostic,
  EmlAttribute,
  EmlEntity,
  EmlHook,
  EmlModel,
  EmlReport,
  EmlRule,
  EmlWorkflow,
  HookType,
  JdmNodeRole,
  ParsedCondition,
  RuleNode,
} from "./model.ts";
import { foreignKeyName, stripQuotes, toSnakeCase } from "./util.ts";

const READER_MODULE = "../../../packages/generator/src/model-yaml/index.ts";
const CEDM_READER_MODULE = "../../../packages/generator/src/model-cedm/index.ts";

interface ReaderDiagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  line: number;
  column: number;
  hint?: string;
}

interface ModelYamlReader {
  readModelYaml(text: string): { ok: boolean; document?: unknown; diagnostics: ReaderDiagnostic[] };
  checkAndFix(text: string): {
    text: string;
    applied: Array<{ code: string; description: string }>;
    diagnostics: ReaderDiagnostic[];
    ok: boolean;
  };
}

async function reader(): Promise<ModelYamlReader> {
  try {
    return (await import(READER_MODULE)) as ModelYamlReader;
  } catch (error) {
    throw new Error(
      "Reading a model needs the repository's model reader and its dependencies " +
        `(run \`bun install\` at the repository root): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function toDiagnostic(d: ReaderDiagnostic): Diagnostic {
  return {
    severity: d.severity,
    code: d.code,
    message: d.message,
    line: d.line,
    column: d.column,
    ...(d.hint ? { fix: d.hint } : {}),
  };
}

/** `*.eml.yaml`, `*.yaml` and `*.yml` are models; anything else is not. */
export function isModelPath(file: string): boolean {
  return /\.ya?ml$/i.test(file);
}

interface CedmReader {
  isCedmModelText(text: string): boolean;
  createFileLibrary(options: { modelDirectory?: string }): unknown;
  readCedmModel(
    text: string,
    options: { library: unknown }
  ): { ok: boolean; document?: unknown; diagnostics: ReaderDiagnostic[] };
}

async function cedmReader(): Promise<CedmReader> {
  try {
    return (await import(CEDM_READER_MODULE)) as CedmReader;
  } catch (error) {
    throw new Error(
      "Reading a CEDM model needs the repository's model reader and its dependencies " +
        `(run \`bun install\` at the repository root): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface ReadModel {
  /** The text that was validated: the file, or the file with its fixes applied. */
  text: string;
  /** Every finding still standing, at the YAML line and column it concerns. */
  diagnostics: Diagnostic[];
  /** The corrections applied, when self-correction was asked for. */
  fixes: Diagnostic[];
  ok: boolean;
  document?: ModelDocument;
}

/**
 * Read and validate a model's text. With `autofix`, the mechanically
 * repairable findings are corrected in the text first — in memory, never in
 * the file — and each correction is reported.
 */
export async function readModel(
  text: string,
  options: { autofix: boolean; file?: string }
): Promise<ReadModel> {
  // A CEDM application model: schema, imports and lowering, then the model
  // document it lowers to is what every command below reads. Its findings are
  // at the CEDM line they came from; there is nothing to auto-fix in it.
  const cedm = await cedmReader();
  if (cedm.isCedmModelText(text)) {
    const { dirname } = await import("node:path");
    const library = cedm.createFileLibrary({
      ...(options.file ? { modelDirectory: dirname(options.file) } : {}),
    });
    const result = cedm.readCedmModel(text, { library });
    return {
      text,
      diagnostics: result.diagnostics.map(toDiagnostic),
      fixes: [],
      ok: result.ok && result.document !== undefined,
      document: result.ok ? (result.document as ModelDocument) : undefined,
    };
  }

  const yaml = await reader();
  let current = text;
  let fixes: Diagnostic[] = [];
  if (options.autofix) {
    const fixed = yaml.checkAndFix(text);
    current = fixed.text;
    fixes = fixed.applied.map((fix) => ({
      severity: "info",
      code: fix.code,
      message: fix.description,
      fix: "applied",
    }));
  }
  const result = yaml.readModelYaml(current);
  return {
    text: current,
    diagnostics: result.diagnostics.map(toDiagnostic),
    fixes,
    ok: result.ok && result.document !== undefined,
    document: result.ok ? (result.document as ModelDocument) : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  The document → the CLI's model                                              */
/* -------------------------------------------------------------------------- */

const MANAGED_COLUMNS = new Set([
  "id",
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
]);

function attributeOf(raw: ModelDocument["entities"][number]["attributes"][number]): EmlAttribute {
  const length = raw.type.match(/\((\d+)\)/);
  const rawType = raw.type.replace(/\(\d+\)/, "").trim();
  const isPrimaryKey = raw.pk === true;
  return {
    name: raw.name,
    type: normalizeType(rawType) as CanonicalType,
    rawType,
    ...(length ? { maxLength: Number(length[1]) } : {}),
    required: raw.optional !== true && !isPrimaryKey,
    unique: raw.unique === true || isPrimaryKey,
    isPrimaryKey,
    isForeignKey: raw.fk === true,
    ...(raw.enum ? { enumRef: raw.enum } : {}),
    ...(raw.help ? { description: raw.help } : {}),
  };
}

/**
 * The generator's rule for the generated key: an entity that declares no `id`
 * and no unique or primary `*_id` column is keyed on an `id` the generator
 * adds. The CLI's runtime is keyed the same way, so a record created through
 * either has the key the other expects.
 */
function entityOf(raw: ModelDocument["entities"][number]): EmlEntity {
  const attributes = raw.attributes.map(attributeOf);
  const keyed = attributes.some(
    (a) => a.name === "id" || (a.name.endsWith("_id") && (a.isPrimaryKey || a.unique))
  );
  if (!keyed) {
    attributes.unshift({
      name: "id",
      type: "string",
      rawType: "uuid",
      required: true,
      unique: true,
      isPrimaryKey: true,
      isForeignKey: false,
    });
    // A declared natural key is a unique column beside the generated one.
    for (const attribute of attributes.slice(1)) {
      if (attribute.isPrimaryKey) attribute.isPrimaryKey = false;
    }
  }
  const primary = attributes.find((a) => a.isPrimaryKey) ?? attributes.find((a) => a.name === "id");
  return {
    name: raw.name,
    tableName: toSnakeCase(raw.name),
    attributes,
    primaryKey: primary?.name ?? "id",
    timestamps: !attributes.some((a) => MANAGED_COLUMNS.has(a.name) && a.name !== "id"),
    ...(raw.audited !== undefined ? { audited: raw.audited } : {}),
    ...(raw.softDelete !== undefined ? { softDelete: raw.softDelete } : {}),
    ...(raw.prefix ? { prefix: raw.prefix } : {}),
    ...(raw.label ? { label: raw.label } : {}),
    ...(raw.help ? { help: raw.help } : {}),
  };
}

/**
 * The foreign key is named for the entity it references: the source of a
 * one-to-many, the target of everything else — the generator's own rule
 * (`generateForeignKey` in packages/generator/src/model/compile-erd.ts).
 */
function relationshipOf(raw: RelationshipDocument): EmlModel["relationships"][number] {
  const kind = cardinalityKind(raw.fromCardinality, raw.toCardinality);
  if (!kind) {
    // The schema admits only the pairs the language defines, so this is a
    // document that was never validated.
    throw new Error(
      `Relationship ${raw.from} → ${raw.to} pairs ${raw.fromCardinality} with ${raw.toCardinality}, which the language does not define.`
    );
  }
  const label = raw.label ?? `${raw.from.toLowerCase()}_${raw.to.toLowerCase()}`;
  const referenced = kind === "oneToMany" ? raw.from : raw.to;
  return {
    name: label.replace(/\s+/g, "_").toLowerCase(),
    source: raw.from,
    target: raw.to,
    cardinality: kind,
    foreignKey: foreignKeyName(referenced),
  };
}

/** What each node type compiles to, from the language definition. */
function jdmRoles(): Map<string, JdmNodeRole> {
  return new Map(
    loadLanguageDefinition().ruleNodes.types.map((entry) => [entry.type, entry.jdmType])
  );
}

function fieldSlug(text: string): string {
  return toSnakeCase(
    text
      .replace(/[^A-Za-z0-9_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
  );
}

/**
 * A machine-readable comparison from a decision node's label, when it is one:
 * `Order Amount > 1000` → `{ field: order_amount, op: ">", value: 1000 }`. A
 * label that is not a simple comparison has no condition, and the runtime takes
 * the node's first branch and records that it could not decide.
 */
export function parseCondition(label: string): ParsedCondition | undefined {
  const cleaned = label.replace(/\?$/, "").trim();
  const comparison = cleaned.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);
  if (comparison) {
    const [, field = "", op = "", rawValue = ""] = comparison;
    const text = stripQuotes(rawValue).replace(/[$,]/g, "");
    const number = Number(text);
    const value: string | number | boolean = Number.isNaN(number)
      ? text === "true"
        ? true
        : text === "false"
          ? false
          : text
      : number;
    return { field: fieldSlug(field), op: op as ParsedCondition["op"], value, raw: cleaned };
  }
  const contains = cleaned.match(/^(.+?)\s+contains\s+(.+)$/i);
  if (contains) {
    const [, field = "", value = ""] = contains;
    return { field: fieldSlug(field), op: "contains", value: stripQuotes(value), raw: cleaned };
  }
  return undefined;
}

function ruleOf(raw: RuleDocument, roles: Map<string, JdmNodeRole>): EmlRule {
  const nodes: RuleNode[] = raw.nodes.map((node) => {
    const jdmType = roles.get(node.type);
    if (!jdmType)
      throw new Error(`Rule ${raw.name}: node ${node.id} has unknown type "${node.type}".`);
    const condition = node.type === "decision" ? parseCondition(node.label) : undefined;
    return {
      id: node.id,
      label: node.label,
      type: node.type,
      jdmType,
      ...(condition ? { condition } : {}),
    };
  });
  return {
    name: raw.name,
    entity: raw.entity,
    event: raw.event,
    ...(raw.priority !== undefined ? { priority: raw.priority } : {}),
    nodes,
    edges: raw.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      ...(edge.label ? { label: edge.label } : {}),
    })),
  };
}

function stateMachineOf(raw: StateMachineDocument, model: EmlModel): EmlWorkflow {
  const initial = raw.initial ?? raw.states[0];
  return {
    name: raw.name,
    entity: raw.entity,
    kind: "state",
    hooks: model.hooks.filter((hook) => hook.entity === raw.entity),
    states: [...raw.states],
    ...(initial ? { initial } : {}),
    final: [...(raw.final ?? [])],
    transitions: raw.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      ...(t.trigger ? { event: t.trigger } : {}),
    })),
    guards: model.guards.filter((guard) => guard.entity === raw.entity),
    triggers: model.triggers.filter((trigger) => trigger.entity === raw.entity),
  };
}

/** Build the CLI's model from a validated model document. */
export function toEmlModel(document: ModelDocument): EmlModel {
  const roles = jdmRoles();
  const hooks: EmlHook[] = (document.hooks ?? []).map((hook) => ({
    type: hook.event as HookType,
    handler: hook.handler,
    entity: hook.entity,
    fields: [...(hook.fields ?? [])],
  }));
  const model: EmlModel = {
    meta: {
      ...(document.name ? { name: document.name } : {}),
      ...(document.version ? { version: document.version } : {}),
      ...(document.description ? { description: document.description } : {}),
    },
    entities: document.entities.map(entityOf),
    relationships: (document.relationships ?? []).map(relationshipOf),
    enums: (document.enums ?? []).map((e) => ({ name: e.name, values: [...e.values] })),
    indexes: document.entities.flatMap((entity) =>
      (entity.indexes ?? []).map((index) => ({
        entity: entity.name,
        columns: [...index.columns],
        unique: index.unique === true,
      }))
    ),
    rules: (document.rules ?? []).map((rule) => ruleOf(rule, roles)),
    reports: (document.reports ?? []).map(
      (report): EmlReport => ({
        name: report.name,
        title: report.title ?? report.name.replace(/[_-]+/g, " "),
        ...(report.entity ? { entity: report.entity } : {}),
        ...(report.chart ? { chart: report.chart as NonNullable<EmlReport["chart"]> } : {}),
        ...(report.x ? { x: report.x } : {}),
        ...(report.y ? { y: report.y } : {}),
        ...(report.help ? { help: report.help } : {}),
        sql: report.sql,
      })
    ),
    workflows: [],
    hooks,
    guards: (document.rbac ?? []).map((rule) => ({
      roles: [...rule.roles],
      entity: rule.entity,
      op: rule.action,
    })),
    triggers: (document.triggers ?? []).map((trigger) => ({
      source: trigger.source,
      handler: trigger.handler,
      entity: trigger.entity,
    })),
  };

  for (const flow of document.hookFlows ?? []) {
    const declared = new Set(
      flow.nodes
        .filter((node) => node.event && node.handler)
        .map((node) => `${node.event}:${node.handler}`)
    );
    model.workflows.push({
      name: flow.name,
      entity: flow.entity,
      kind: "hook",
      hooks: hooks.filter(
        (hook) => hook.entity === flow.entity && declared.has(`${hook.type}:${hook.handler}`)
      ),
      states: [],
      transitions: [],
      guards: [],
      triggers: [],
    });
  }
  for (const machine of document.stateMachines ?? []) {
    model.workflows.push(stateMachineOf(machine, model));
  }
  for (const saga of document.sagas ?? []) {
    model.workflows.push({
      name: saga.name,
      entity: saga.entity,
      kind: "saga",
      hooks: [],
      states: [],
      transitions: [],
      guards: [],
      triggers: [],
    });
  }
  return model;
}
