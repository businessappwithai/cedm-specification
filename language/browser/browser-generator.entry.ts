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
  validate,
  fix,
  readModelYaml,
  checkAndFix,
  serializeModelDocument,
  canonicalDocument,
  LANGUAGE_VERSION,
};
