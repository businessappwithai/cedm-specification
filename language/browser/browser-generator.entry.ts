/**
 * A YAML model, read and compiled, for the browser generators the published
 * sites carry — as one file a web page can load.
 *
 * The website (`yaml/businessappwithairust`) and the orchestrator's guide
 * (`yaml/app-and-report-with-ai-rust/common/html`) each vendor a browser build
 * of the application generator: `appwithai-wasm.js` (the in-tab application)
 * and `appwithai-fullstack.js` (the deployable project). Those bundles compile
 * a model themselves and never read a file: `generateWasmApp(model, …)` and the
 * pipeline behind `generateFullStack` take a compiled model. This module is
 * where that model comes from.
 *
 * A model is read and validated by the language's own reader — YAML syntax,
 * the JSON Schema, the full checker, every finding at its YAML line — and
 * compiled by the repository's one compiler (`compileModelDocument`). Nothing
 * here reads or writes Mermaid.
 *
 * The browser bundles were built before the compiler's model settled, and
 * name a few things differently. `toGeneratorModel` is the translation, and it
 * is total and mechanical — no decision about what the model means is taken
 * here:
 *
 * - a saga step is `{ nodeId, type, label, props }` there and
 *   `{ nodeId, nodeType, label, properties }` here;
 * - a rule with actions compiles to a decision table whose output columns are
 *   the rules runtime's vocabulary. The bundles' runtime reads `field` and
 *   `value` columns (o5, o6) and has no `updateData`/`createData`; the table is
 *   rewritten into that vocabulary, cell for cell, from the model's own
 *   actions;
 * - the compiler records a workflow's `tableName` and the model's
 *   `description`, which the bundles do not read.
 *
 * `yaml/verify` holds the translation to account: for every model the sites
 * publish, the model built here is identical — key order included — to the
 * one each vendored bundle compiled from the Mermaid model it replaced, and the
 * applications generated from the two are compared file by file.
 */

import languageDefinition from "../appwithai-language.json";
import {
  type LanguageDefinitionShape,
  setLanguageMapsDefinition,
} from "../../packages/generator/src/model/language-maps";
import type { ParsedModel } from "../../packages/generator/src/model/compile";
import { deriveAccess } from "../../packages/generator/src/rbac/roles";
import type { ModelDocument } from "../../packages/generator/src/model-yaml/document";
import {
  canonicalDocument,
  checkAndFix,
  compileModelDocument,
  readModelYaml,
  serializeModelDocument,
} from "../../packages/generator/src/model-yaml/index";
import { type LanguageDefinition, setLanguageDefinition } from "../index";

setLanguageDefinition(languageDefinition as unknown as LanguageDefinition);
setLanguageMapsDefinition(languageDefinition as unknown as LanguageDefinitionShape);

/** The language version the diagnostics are written against. */
export const LANGUAGE_VERSION: string = languageDefinition.language.version;

export { canonicalDocument, checkAndFix, readModelYaml, serializeModelDocument };

type Json = Record<string, any>;

/** Quote a value for a zen decision-table output cell — as both compilers do. */
function zenLiteral(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`;
}

/** The action table's columns in the compiler's vocabulary, in order. */
const COMPILER_ACTION_COLUMNS = [
  "action",
  "message",
  "ruleId",
  "workflowName",
  "targetEntity",
  "linkField",
  "updateData",
  "createData",
  "transformData",
];

/** The same table's columns as the browser bundles' rules runtime reads them. */
const BUNDLE_ACTION_OUTPUTS = [
  { id: "o1", name: "Action", field: "action" },
  { id: "o2", name: "Message", field: "message" },
  { id: "o3", name: "Rule ID", field: "ruleId" },
  { id: "o4", name: "Workflow Name", field: "workflowName" },
  { id: "o5", name: "Field", field: "field" },
  { id: "o6", name: "Value", field: "value" },
  { id: "o7", name: "Target Entity", field: "targetEntity" },
  { id: "o8", name: "Link Field", field: "linkField" },
  { id: "o9", name: "Transform Data", field: "transformData" },
];

/**
 * A compiled action table, rewritten in the bundles' column vocabulary. Rows,
 * their conditions and every shared cell are the compiler's; `field` and
 * `value` come from the model's own action properties, which is where the
 * bundles' compiler took them from.
 */
function actionTableForBundle(jdmContent: string, actions: Json[]): string {
  const graph = JSON.parse(jdmContent);
  const table = graph.nodes?.[1];
  const outputs: Json[] | undefined = table?.content?.outputs;
  if (
    !outputs ||
    outputs.length !== COMPILER_ACTION_COLUMNS.length ||
    outputs.some((column, index) => column.field !== COMPILER_ACTION_COLUMNS[index])
  ) {
    return jdmContent;
  }
  const byId = new Map(actions.map((action) => [action.name, action]));
  const ruleName = table.name;
  table.content.outputs = BUNDLE_ACTION_OUTPUTS.map((column) => ({ ...column }));
  table.content.rules = table.content.rules.map((row: Json) => {
    const action = byId.get(String(row._id).slice(`${ruleName}-`.length)) ?? {};
    const props: Json = action.props ?? {};
    return {
      _id: row._id,
      i1: row.i1,
      o1: row.o1,
      o2: row.o2,
      o3: row.o3,
      o4: row.o4,
      o5: zenLiteral(String(props.field ?? "")),
      o6: zenLiteral(String(props.value ?? "")),
      o7: row.o5,
      o8: row.o6,
      o9: row.o9,
    };
  });
  return JSON.stringify(graph);
}

/**
 * The compiled model, in the shape the vendored browser generators read.
 * See the module comment for each difference.
 */
export function toGeneratorModel(document: ModelDocument, model: ParsedModel): Json {
  const actionsByRule = new Map(
    (document.rules ?? []).map((rule) => [rule.name, (rule.actions ?? []) as Json[]])
  );
  const compiled = JSON.parse(JSON.stringify(model)) as Json;
  return {
    entities: compiled.entities,
    relationships: compiled.relationships,
    categories: compiled.categories,
    enums: compiled.enums,
    rules: compiled.rules.map((rule: Json) => ({
      ...rule,
      jdmContent: actionsByRule.get(rule.name)?.length
        ? actionTableForBundle(rule.jdmContent, actionsByRule.get(rule.name)!)
        : rule.jdmContent,
    })),
    hooks: compiled.hooks,
    workflows: compiled.workflows.map(({ tableName: _tableName, ...workflow }: Json) => workflow),
    sagas: compiled.sagas.map((saga: Json) => ({
      name: saga.name,
      entity: saga.entity,
      trigger: saga.trigger,
      operation: saga.operation,
      steps: saga.steps.map((step: Json) => ({
        nodeId: step.nodeId,
        type: step.nodeType,
        label: step.label,
        props: step.properties,
      })),
    })),
    rbac: compiled.rbac,
    reports: compiled.reports,
  };
}

/* -------------------------------------------------------------------------- */
/*  The model viewers                                                          */
/* -------------------------------------------------------------------------- */

/** What each step type must, may, and publishes — the viewers' saga ladder. */
function decisionPublishes(props: Json): string[] {
  const allowed = String(props.publish ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  if (allowed.length > 0) return allowed;
  const inline = String(props.decisionTable ?? "").trim();
  if (!inline) return [];
  try {
    const table = JSON.parse(inline);
    return (table.outputs ?? [])
      .map((output: Json) => output?.field?.trim())
      .filter((field: unknown) => Boolean(field));
  } catch {
    return [];
  }
}

const STEP_CONTRACTS: Record<
  string,
  { required: string[]; oneOf?: string[][]; publishes?: (props: Json) => string[] }
> = {
  UpdateEntity: { required: ["field"], oneOf: [["source", "value"]] },
  CreateEntity: {
    required: ["entity", "fields"],
    publishes: (props) => {
      const explicit = String(props.as ?? "").trim();
      if (explicit) return [explicit];
      const table = String(props.entity ?? "").trim();
      return table ? [`${table.replace(/^bus_/, "")}Id`] : [];
    },
  },
  DeleteEntity: { required: [] },
  Decision: { required: [], oneOf: [["decisionTable", "rule"]], publishes: decisionPublishes },
  Formula: {
    required: ["target", "operation"],
    publishes: (props) => (String(props.target ?? "").trim() ? [String(props.target).trim()] : []),
  },
  REST: { required: ["url"] },
  Agent: { required: ["agentId"] },
};

function missingProperties(step: Json): string[] {
  const contract = STEP_CONTRACTS[step.type];
  if (!contract) return [];
  const missing = contract.required.filter((key) => !String(step.props[key] ?? "").trim());
  for (const group of contract.oneOf ?? []) {
    if (!group.some((key) => String(step.props[key] ?? "").trim())) missing.push(group.join(" or "));
  }
  return missing;
}

/** The enum-bound column a state machine's states live in, when one matches. */
function resolveStatusColumn(workflow: Json, entity: Json | undefined): Json {
  if (!entity) return {};
  const states = new Set(workflow.states.map((state: Json) => state.name));
  if (states.size === 0) return {};
  let best: Json | undefined;
  for (const attribute of entity.attributes) {
    if (!attribute.enumValues?.length) continue;
    const overlap = attribute.enumValues.filter((value: string) => states.has(value)).length;
    if (overlap === 0) continue;
    if (!best || overlap > best.overlap) {
      best = { column: attribute.name, values: attribute.enumValues, overlap };
    }
  }
  return best ? { column: best.column, values: best.values } : {};
}

/** A rule node's `type`, as the viewers draw it. */
const VIEWER_ROLE: Record<string, string> = {
  start: "start",
  end: "end",
  decision: "decision",
  function: "compute",
  expression: "action",
};

function eventOperation(event: string | undefined): string {
  const normalized = (event ?? "").toLowerCase();
  if (normalized.includes("create")) return "CREATE";
  if (normalized.includes("update")) return "UPDATE";
  if (normalized.includes("delete")) return "DELETE";
  return "ALL";
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
}

/**
 * The model as the viewers draw it: the compiled model, each entity with its
 * category, the roles that may read it and how connected it is; each rule as
 * its graph and actions; each state machine with its status column and the
 * roles on its edges; each saga step with what it is missing and publishes;
 * and the roles the access rules derive.
 */
export function viewerModel(document: ModelDocument, model: Json): Json {
  const entityByName = new Map<string, Json>(model.entities.map((entity: Json) => [entity.name, entity]));
  const categoryOf = new Map<string, string>();
  for (const category of model.categories)
    for (const name of category.entities) categoryOf.set(name, category.name);
  const readableBy = new Map<string, string[]>();
  for (const rule of model.rbac.operations)
    if (rule.operation === "read") readableBy.set(rule.entity, rule.roles);
  const degree = new Map<string, number>();
  for (const relationship of model.relationships) {
    degree.set(relationship.sourceEntity, (degree.get(relationship.sourceEntity) ?? 0) + 1);
    degree.set(relationship.targetEntity, (degree.get(relationship.targetEntity) ?? 0) + 1);
  }
  const entities = model.entities.map((entity: Json) => ({
    ...entity,
    category: categoryOf.get(entity.name),
    readableBy: readableBy.get(entity.name) ?? [],
    degree: degree.get(entity.name) ?? 0,
  }));

  const compiledByName = new Map<string, Json>(model.rules.map((rule: Json) => [rule.name, rule]));
  const rules = (document.rules ?? []).map((rule) => {
    const compiled = compiledByName.get(rule.name);
    return {
      name: rule.name,
      title: rule.title,
      entity: rule.entity,
      event: rule.event,
      operation: compiled?.operation ?? eventOperation(rule.event),
      priority: compiled?.priority ?? rule.priority ?? 100,
      tableName: compiled?.tableName,
      nodes: (rule.nodes ?? []).map((node) => ({
        id: node.id,
        label: node.label,
        role: VIEWER_ROLE[node.type] ?? "action",
      })),
      edges: (rule.edges ?? []).map((edge, index) => ({
        id: `e${index}_${edge.from}_${edge.to}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
      })),
      actions: (rule.actions ?? []).map((action) => ({
        name: action.name,
        type: action.type,
        when: action.when?.trim() || "true",
        props: { ...(action.props ?? {}) },
      })),
      compiled: Boolean(compiled),
    };
  });

  const titleOf = new Map<string, string | undefined>([
    ...(document.stateMachines ?? []).map((machine) => [machine.name, machine.title] as const),
    ...(document.sagas ?? []).map((saga) => [saga.name, saga.title] as const),
  ]);
  const transitionRoles = new Map<string, Record<string, string[]>>();
  for (const rule of model.rbac.transitions) {
    const forEntity = transitionRoles.get(rule.entity) ?? {};
    for (const edge of rule.edges) forEntity[`${edge.from}>${edge.to}`] = rule.roles;
    transitionRoles.set(rule.entity, forEntity);
  }
  const workflows = model.workflows.map((workflow: Json) => {
    const entity = entityByName.get(workflow.entity);
    const { column, values } = resolveStatusColumn(workflow, entity);
    const declared = new Set(values ?? []);
    return {
      ...workflow,
      title: titleOf.get(workflow.name),
      statusColumn: column,
      declaredValues: values,
      undeclaredStates: declared.size
        ? workflow.states.map((state: Json) => state.name).filter((name: string) => !declared.has(name))
        : [],
      transitionRoles: transitionRoles.get(workflow.entity) ?? {},
    };
  });
  const sagas = model.sagas.map((saga: Json) => ({
    ...saga,
    title: titleOf.get(saga.name),
    steps: saga.steps.map((step: Json) => ({
      ...step,
      missing: missingProperties(step),
      publishes: STEP_CONTRACTS[step.type]?.publishes?.(step.props) ?? [],
    })),
  }));
  const meta: Json = {};
  if (document.name) meta.name = document.name;
  if (document.version) meta.version = document.version;
  if (document.description) meta.description = document.description;
  const access = deriveAccess(model.rbac, {
    projectId: slug(meta.name ?? "model"),
    entities: model.entities.map((entity: Json) => entity.name),
  });
  return {
    meta,
    entities,
    relationships: model.relationships,
    categories: model.categories,
    enums: model.enums,
    rules,
    workflows,
    sagas,
    hooks: model.hooks,
    rbac: model.rbac,
    access,
    warnings: [],
    stats: {
      entities: entities.length,
      fields: entities.reduce((total: number, entity: Json) => total + entity.attributes.length, 0),
      relationships: model.relationships.length,
      enums: model.enums.length,
      rules: rules.length,
      hooks: model.hooks.length,
      stateMachines: workflows.length,
      sagas: sagas.length,
      roles: access.roles.length,
      accessRules: model.rbac.operations.length + model.rbac.transitions.length,
    },
  };
}

/**
 * Read a model for the viewers: `{ ok, model, diagnostics }`. A model with
 * errors is still drawn when it reads as a document, so an author can see what
 * they have while fixing it; one that does not read has no model.
 */
export function readModelForViewer(text: string): { ok: boolean; model?: Json; diagnostics: Json[] } {
  const read = readModelYaml(text);
  if (!read.document) return { ok: false, diagnostics: read.diagnostics };
  const compiled = compileModelDocument(read.document, { warn: () => {} });
  return {
    ok: read.ok,
    model: viewerModel(read.document, toGeneratorModel(read.document, compiled)),
    diagnostics: read.diagnostics,
  };
}

export interface CompiledForBrowser {
  /** True when the model has no errors and was compiled. */
  ok: boolean;
  /** The validated document, when it read. */
  document?: ModelDocument;
  /** The model for `generateWasmApp` / `generateFullStack({ model })`. */
  model?: Json;
  /** Every finding, at its YAML line and column. */
  diagnostics: ReturnType<typeof readModelYaml>["diagnostics"];
}

/**
 * Read, validate and compile model text for a browser generator. A model with
 * errors is not compiled: `ok` is false and the diagnostics say why.
 */
export function compileForBrowser(text: string): CompiledForBrowser {
  const read = readModelYaml(text);
  if (!read.ok || !read.document) return { ok: false, diagnostics: read.diagnostics };
  const model = compileModelDocument(read.document, { warn: () => {} });
  return {
    ok: true,
    document: read.document,
    model: toGeneratorModel(read.document, model),
    diagnostics: read.diagnostics,
  };
}

/** Validate model text: `{ ok, document, diagnostics }`. */
export const validate = readModelYaml;

/** Repair what can be repaired mechanically and re-check. */
export const fix = checkAndFix;

(globalThis as Record<string, unknown>).EMLYamlGenerator = {
  compileForBrowser,
  toGeneratorModel,
  readModelForViewer,
  viewerModel,
  validate,
  fix,
  readModelYaml,
  checkAndFix,
  serializeModelDocument,
  canonicalDocument,
  LANGUAGE_VERSION,
};
