#!/usr/bin/env bun
/**
 * Validate the CEDM YAML domain specification.
 *
 * The validator checks implementation-neutral CEDM contracts:
 * - every specification file parses
 * - registry coverage and duplicate entity names
 * - entity identity requirements
 * - relationship targets, cardinality and self-references
 * - reference target names in attributes
 * - invariant structure
 * - lifecycle state/transition consistency
 * - the Application Dictionary rules (DICT-*, ENUM-*), help filler (HELP-001),
 *   business logic (BL-*) and reference data (REF-*)
 *
 *     bun tools/validate.ts
 */

import "./lib/cli";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { staleness as enumerationStaleness } from "./build-enumerations";
import * as dictlib from "./lib/dictionary";
import { fillerRows, scan } from "./lib/help-shapes";
import { entityPaths, REGISTRY, ROOT, readRootYaml, snake, yamlFiles } from "./lib/library";
import { head, repr, str } from "./lib/text";
import { parseYaml, type Spec } from "./lib/yaml";

const SELF_REFERENCE_ACYCLIC = /cycl|acyclic|ancestor|descendant|own parent|circular/i;
const ENTITY_NAME = /^[A-Z][A-Za-z0-9]*$/;
const IDENTIFIER = /^[A-Z0-9-]+$/;
const CARDINALITIES = new Set(["0..1", "1", "0..*", "1..*"]);
const CARDINALITY_PATTERN = /^(?:0|[1-9][0-9]*)\.\.(?:1|\*)$/;

const errors: string[] = [];
const warnings: string[] = [];

type Entities = Map<string, { path: string; entity: Spec }>;

function loadYaml(file: string): Spec {
  try {
    return parseYaml(readFileSync(file, "utf-8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${file}: invalid YAML: ${message.split("\n")[0]}`);
    return {};
  }
}

const isMap = (value: unknown): value is Record<string, Spec> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const sorted = (values: Iterable<string>) => [...values].sort();
const difference = <T>(a: Set<T>, b: Set<T>) => new Set([...a].filter((x) => !b.has(x)));

/**
 * Paths whose mapping holds text a flow mapping cut at a comma.
 *
 * The signature is a null-valued key straight after a text value: in
 * `{rule: a, b}` YAML reads `b` as a key with no value. A null that follows
 * anything else (`key: null` on a value object's identity) is deliberate.
 */
function splitText(value: unknown, where = "entity"): string[] {
  const found: string[] = [];
  if (isMap(value)) {
    const items = Object.values(value);
    if (items.some((item, i) => i > 0 && item === null && typeof items[i - 1] === "string")) {
      found.push(where);
    }
    for (const [key, item] of Object.entries(value)) {
      if (item !== null) found.push(...splitText(item, `${where}.${key}`));
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      found.push(...splitText(item, `${where}[${index}]`));
    });
  }
  return found;
}

/** The DICT-* and ENUM-* rules of specification/dictionary-mapping.yaml. */
function dictionaryChecks(entities: Entities): void {
  const mapping = loadYaml(path.join(ROOT, "specification", "dictionary-mapping.yaml"));
  const help = mapping.help ?? {};
  const known = new Set<string>([
    ...Object.keys(dictlib.HELP_ALIASES),
    ...Object.values(dictlib.HELP_ALIASES),
    ...(help.carriedKeys?.keys ?? []),
    ...(help.windowSlots ?? []),
    ...(help.tabSlots ?? []),
    ...(help.fieldSlots ?? []),
  ]);
  const enumerationTables = new Map<string, string>();
  for (const [name, { entity }] of entities) {
    const kind = entity.kind;
    if (dictlib.kindClasses(kind).length < 1) {
      errors.push(`${name}: DICT-002 kind ${repr(kind)} resolves to no class`);
    }
    const ui = entity.ui ?? {};
    const icon = ui.icon;
    if (!icon) errors.push(`${name}: DICT-001 ui.icon is required`);
    else if (!dictlib.LUCIDE.has(icon)) {
      errors.push(
        `${name}: DICT-001 ui.icon ${repr(icon)} is not a lucide 0.312 icon (tools/lucide-icons.txt)`
      );
    }
    const entityHelp = entity.help ?? {};
    if (!entityHelp.summary || !(entityHelp.businessMeaning || entityHelp.purpose)) {
      errors.push(`${name}: DICT-003 help needs summary and businessMeaning (or purpose)`);
    }
    for (const key of Object.keys(entityHelp)) {
      if (!known.has(key)) errors.push(`${name}: DICT-004 unknown help key ${repr(key)}`);
    }
    if (ui.group && !dictlib.GROUPS.includes(ui.group)) {
      errors.push(`${name}: DICT-008 ui.group ${repr(ui.group)} is not in groups.order`);
    }
    const attributeNames = new Set((entity.attributes ?? []).map((a: Spec) => a.name));
    const label = ui.recordLabel;
    for (const part of typeof label === "string" ? [label] : (label ?? [])) {
      if (!attributeNames.has(part)) {
        errors.push(
          `${name}: DICT-009 ui.recordLabel names ${repr(part)}, which the entity does not declare`
        );
      }
    }
    for (const attr of entity.attributes ?? []) {
      const where = `${name}.${str(attr.name)}`;
      const attrHelp = isMap(attr.help) ? attr.help : {};
      if (!attrHelp.summary || !attrHelp.usage)
        errors.push(`${where}: DICT-006 help needs summary and usage`);
      for (const key of Object.keys(attrHelp)) {
        if (!known.has(key)) errors.push(`${where}: DICT-004 unknown help key ${repr(key)}`);
      }
      const values = attr.values;
      if (attr.type === "enum" && !values?.length) {
        errors.push(`${where}: ENUM-001 an enum attribute declares values`);
      }
      if (values?.length) {
        const table = `bus_${snake(dictlib.enumerationName(name, attr.name))}`;
        if (enumerationTables.has(table)) {
          errors.push(`${where}: ENUM-003 table ${table} is also ${enumerationTables.get(table)}`);
        }
        enumerationTables.set(table, where);
        const have = new Set(Object.keys(attrHelp.valueSemantics ?? {}).map(str));
        const want = new Set<string>(values.map(str));
        if (have.size !== want.size || [...have].some((v) => !want.has(v))) {
          errors.push(
            `${where}: DICT-005 valueSemantics differs from values (missing ${repr(sorted(difference(want, have)))}, extra ${repr(sorted(difference(have, want)))})`
          );
        }
      }
    }
    for (const rel of entity.relationships ?? []) {
      if (!rel.help) warnings.push(`${name}.${str(rel.name)}: DICT-007 relationship has no help`);
    }
  }
  for (const [table, where] of enumerationTables) {
    for (const name of entities.keys()) {
      if (`bus_${snake(name)}` === table) {
        errors.push(`${where}: DICT-010 enumeration table ${table} collides with entity ${name}`);
      }
    }
  }
  const stale = enumerationStaleness([...entities.values()].map(({ entity }) => entity));
  if (stale) errors.push(`ENUM-002 ${stale}`);

  const filler = fillerRows(scan([...entities.values()].map(({ entity }) => entity)).rows);
  for (const row of filler.slice(0, 50)) {
    errors.push(`HELP-001 ${row.where}.${row.key}: template text: ${head(row.value, 90)}`);
  }
  if (filler.length > 50)
    errors.push(`HELP-001: ${filler.length - 50} more template-text findings`);
}

const TOKEN =
  /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<str>"(?:[^"\\]|\\.)*")|(?<op>==|!=|<=|>=|<|>|\(|\))|(?<word>[A-Za-z_][A-Za-z0-9_]*))/y;
const KEYWORDS = new Set(["and", "or", "not", "null", "true", "false"]);
type Token = [kind: string, text: string];

/** The tokens of a `violatedWhen` expression, or null when it is not one the rules engine reads. */
function tokens(expression: string): Token[] | null {
  let position = 0;
  const out: Token[] = [];
  while (position < expression.length) {
    if (!expression.slice(position).trim()) break;
    TOKEN.lastIndex = position;
    const m = TOKEN.exec(expression);
    if (!m?.groups) return null;
    position = TOKEN.lastIndex;
    const kind = (["num", "str", "op", "word"] as const).find((k) => m.groups?.[k] !== undefined);
    if (!kind) return null;
    out.push([kind, m.groups[kind] as string]);
  }
  return out;
}

/** BL-001…BL-011 of specification/business-logic.yaml (BL-012…BL-014: workflowChecks). */
function businessLogicChecks(entities: Entities): void {
  const seenIds = new Map<string, string>();
  for (const [name, { entity }] of entities) {
    const attrs = new Map<string, Spec>((entity.attributes ?? []).map((a: Spec) => [a.name, a]));
    const columns = new Set([
      ...[...attrs.keys()].map(snake),
      "id",
      "created_at",
      "updated_at",
      "version",
    ]);
    // A to-one relationship is a foreign key column on this entity.
    for (const r of entity.relationships ?? []) {
      if (["1", "0..1"].includes(str(r.cardinality))) columns.add(`${snake(r.name)}_id`);
    }
    const life = entity.lifecycle;
    let states = new Set<string>();
    let initial: unknown = null;
    const statusAttr =
      ["status", "state", "stage"].find((a) => attrs.get(a)?.values?.length) ?? null;
    if (isMap(life)) {
      const governed = life.attribute || statusAttr;
      const values: string[] = (attrs.get(governed)?.values ?? []).map(str);
      states = new Set((life.states ?? []).map(str));
      const valueSet = new Set(values);
      if (states.size !== valueSet.size || [...states].some((s) => !valueSet.has(s))) {
        errors.push(
          `${name}: BL-001 lifecycle states differ from ${str(governed)} values (missing ${repr(sorted(difference(valueSet, states)))}, extra ${repr(sorted(difference(states, valueSet)))})`
        );
      }
      initial = life.initial || (life.states ?? [null])[0];
      const terminal = new Set<string>((life.terminal ?? []).map(str));
      if (!states.has(initial as string))
        errors.push(`${name}: BL-002 lifecycle initial ${repr(initial)} is not a state`);
      for (const t of difference(terminal, states))
        errors.push(`${name}: BL-002 terminal ${repr(t)} is not a state`);
      const pairs = new Set<string>();
      const graph = new Map<string, Set<string>>();
      for (const t of life.transitions ?? []) {
        const a = str(t.from);
        const b = str(t.to);
        if (!states.has(a) || !states.has(b)) {
          errors.push(
            `${name}: BL-003 transition ${a}→${b} names a state the lifecycle does not declare`
          );
          continue;
        }
        if (pairs.has(`${a}\u0000${b}`))
          errors.push(`${name}: BL-003 transition ${a}→${b} is declared twice`);
        pairs.add(`${a}\u0000${b}`);
        graph.set(a, (graph.get(a) ?? new Set()).add(b));
        if (terminal.has(a))
          errors.push(`${name}: BL-004 terminal state ${a} has an outgoing transition to ${b}`);
      }
      const reachable = (from: string) => {
        const seen = new Set([from]);
        const todo = [from];
        while (todo.length) {
          for (const next of graph.get(todo.pop() as string) ?? []) {
            if (!seen.has(next)) {
              seen.add(next);
              todo.push(next);
            }
          }
        }
        return seen;
      };
      const reach = reachable(initial as string);
      for (const state of sorted(difference(states, reach))) {
        errors.push(`${name}: BL-005 state ${state} is not reachable from ${str(initial)}`);
      }
      if (terminal.size) {
        for (const state of sorted(difference(states, terminal))) {
          if (![...reachable(state)].some((s) => terminal.has(s))) {
            errors.push(`${name}: BL-006 state ${state} cannot reach a terminal state`);
          }
        }
      }
    } else if (statusAttr) {
      warnings.push(`${name}: BL-011 ${statusAttr} has values and the entity states no lifecycle`);
    }

    for (const inv of entity.invariants ?? []) {
      const ident = str(inv.id);
      if (seenIds.has(ident) && seenIds.get(ident) !== name) {
        errors.push(`${name}: BL-007 invariant id ${ident} is also used by ${seenIds.get(ident)}`);
      }
      seenIds.set(ident, name);
      const when = inv.violatedWhen;
      if (when === undefined || when === null) continue;
      if (!inv.message)
        errors.push(`${name}.${ident}: BL-007 an executable invariant needs a message`);
      const toks = tokens(str(when));
      if (toks === null) {
        errors.push(
          `${name}.${ident}: BL-008 violatedWhen is not an expression the rules engine reads: ${repr(when)}`
        );
        continue;
      }
      for (const [kind, word] of toks) {
        if (kind === "word" && !KEYWORDS.has(word) && !columns.has(word)) {
          errors.push(
            `${name}.${ident}: BL-008 violatedWhen names ${repr(word)}, which is not a column of ${name}`
          );
        }
      }
      const attrSnakes = new Set([...attrs.keys()].map(snake));
      const attrBySnake = (column: string) => [...attrs.keys()].find((a) => snake(a) === column);
      toks.forEach(([kind, op], i) => {
        if (
          kind !== "op" ||
          !["<", "<=", ">", ">="].includes(op) ||
          i === 0 ||
          toks[i - 1]?.[0] !== "word"
        )
          return;
        const column = toks[i - 1]?.[1] as string;
        if (attrs.has(column) || attrSnakes.has(snake(column))) {
          const spec = attrs.get(attrBySnake(column) ?? "") ?? {};
          if (!str(when).includes(`${column} != null`) && spec.required !== true) {
            errors.push(
              `${name}.${ident}: BL-008 compares ${column} without first guarding it against null`
            );
          }
        }
      });
      // A state named in a comparison is a state the lifecycle declares.
      for (let i = 0; i < toks.length - 2; i++) {
        const [kind, word] = toks[i] as Token;
        const [opKind, op] = toks[i + 1] as Token;
        const [litKind, lit] = toks[i + 2] as Token;
        if (
          kind === "word" &&
          ["status", "state", "stage"].includes(word) &&
          opKind === "op" &&
          op === "==" &&
          litKind === "str" &&
          states.size
        ) {
          const literal = lit.replace(/^"+|"+$/g, "");
          if (!states.has(literal)) {
            errors.push(
              `${name}.${ident}: BL-009 names state ${repr(literal)}, which the lifecycle does not declare`
            );
          }
          if (initial !== null && literal === initial) {
            errors.push(
              `${name}.${ident}: BL-010 applies to the initial state ${str(initial)}, so a new record could not be created`
            );
          }
        }
      }
    }
  }
}

/** The columns a generated table holds for an entity: what an expression or a step may name. */
function columnsOf(entity: Spec): Set<string> {
  const columns = new Set<string>(["id", "created_at", "updated_at", "version"]);
  for (const a of entity.attributes ?? []) columns.add(snake(a.name));
  for (const r of entity.relationships ?? []) {
    if (["1", "0..1"].includes(str(r.cardinality))) columns.add(`${snake(r.name)}_id`);
  }
  return columns;
}

const STEP_TYPES = new Set<string>(
  (
    readRootYaml("language/appwithai-language.json")?.workflowConstructs?.stepNodes?.types ?? []
  ).map((t: Spec) => t.name)
);
const ENTITY_STEPS = new Set(["CreateEntity", "UpdateEntity", "DeleteEntity"]);
const HOOK_EVENTS = new Set<string>(
  (readRootYaml("language/appwithai-language.json")?.hooks?.types ?? []).map((t: Spec) => t.type)
);

/**
 * BL-012…BL-014: an entity's `workflows`. Each lowers to a saga and a rule whose
 * `trigger-workflow` action starts it when `when` holds of a written record, so
 * what a workflow names has to exist in the application it is generated into.
 */
function workflowChecks(entities: Entities): void {
  for (const [name, { entity }] of entities) {
    const own = columnsOf(entity);
    const names = new Set<string>();
    for (const workflow of entity.workflows ?? []) {
      const where = `${name}.${str(workflow.name)}`;
      if (names.has(workflow.name)) errors.push(`${where}: BL-013 workflow name is declared twice`);
      names.add(workflow.name);
      if (!workflow.when || !workflow.steps?.length) {
        warnings.push(
          `${where}: BL-012 a workflow with no when or no steps never runs; it is documentation`
        );
        continue;
      }
      if (workflow.event !== undefined && HOOK_EVENTS.size && !HOOK_EVENTS.has(workflow.event)) {
        errors.push(
          `${where}: BL-013 event ${repr(workflow.event)} is not a write event (${[...HOOK_EVENTS].join(", ")})`
        );
      }
      const toks = tokens(str(workflow.when));
      if (toks === null)
        errors.push(
          `${where}: BL-013 when is not an expression the rules engine reads: ${repr(workflow.when)}`
        );
      for (const [kind, word] of toks ?? []) {
        const column = word.startsWith("_previous_") ? word.slice("_previous_".length) : word;
        if (kind === "word" && !KEYWORDS.has(word) && !own.has(column)) {
          errors.push(
            `${where}: BL-013 when names ${repr(word)}, which is not a column of ${name}`
          );
        }
      }
      for (const step of workflow.steps) {
        const at = `${where}.${str(step.id)}`;
        if (!STEP_TYPES.has(step.type)) {
          errors.push(
            `${at}: BL-013 step type ${repr(step.type)} is not one of ${repr([...STEP_TYPES])}`
          );
          continue;
        }
        if (!ENTITY_STEPS.has(step.type)) continue;
        const targetName = step.properties?.entity;
        const target = entities.get(targetName)?.entity;
        if (!target) {
          errors.push(
            `${at}: BL-013 names entity ${repr(targetName)}, which the library does not define`
          );
          continue;
        }
        const columns = columnsOf(target);
        const attrs = new Map<string, Spec>(
          (target.attributes ?? []).map((a: Spec) => [snake(a.name), a])
        );
        for (const [field, value] of Object.entries<Spec>(step.properties?.fields ?? {})) {
          if (!columns.has(field)) {
            errors.push(
              `${at}: BL-013 sets ${repr(field)}, which is not a column of ${targetName}`
            );
            continue;
          }
          const text = str(value);
          // `{{column}}` reads the record that started the workflow.
          for (const [, placeholder] of text.matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g)) {
            if (!own.has(placeholder as string)) {
              errors.push(
                `${at}: BL-013 ${field} reads {{${placeholder}}}, which is not a column of ${name}`
              );
            }
          }
          const values = attrs.get(field)?.values;
          if (values?.length && !text.includes("{{") && !values.map(str).includes(text)) {
            errors.push(
              `${at}: BL-013 sets ${targetName}.${field} to ${repr(text)}, which is not one of ${repr(values)}`
            );
          }
        }
      }
    }
  }

  // BL-014: an application that records transactions runs at least one workflow.
  const catalog = readRootYaml("domains/application-catalog.yaml")?.catalog ?? {};
  const capabilities = new Map<string, string[]>(
    (readRootYaml("domains/capability-catalog.yaml")?.catalog?.capabilities ?? []).map(
      (c: Spec) => [c.id, c.entities ?? []]
    )
  );
  for (const application of catalog.applications ?? []) {
    const members = new Set<string>([
      ...(application.entities ?? []),
      ...(application.capabilities ?? []).flatMap((id: string) => capabilities.get(id) ?? []),
    ]);
    const present = [...members].map((m) => entities.get(m)?.entity).filter(Boolean);
    const transactions = present.filter((e) => dictlib.kindClass(e.kind) === "transaction");
    if (transactions.length && !present.some((e) => e.workflows?.length)) {
      errors.push(
        `${application.domain}: BL-014 records transactions (${transactions.map((e) => e.name).join(", ")}) and none of its entities runs a workflow`
      );
    }
  }
}

/** REF-001…REF-004 of specification/reference-data.yaml. */
function referenceDataChecks(entities: Entities): void {
  const loaded = new Map<string, Spec>();
  for (const [name, { entity }] of entities) {
    const ref = entity.referenceData;
    if (!ref) continue;
    const data = loadYaml(path.join(ROOT, "domain", ref)).referenceData ?? {};
    if (data.entity !== name) {
      errors.push(`${name}: REF-001 ${ref} holds the rows of ${repr(data.entity)}`);
      continue;
    }
    loaded.set(name, data);
  }
  for (const [name, data] of loaded) {
    const entity = entities.get(name)?.entity;
    const attrs = new Map<string, Spec>((entity.attributes ?? []).map((a: Spec) => [a.name, a]));
    const rels = new Map<string, Spec>((entity.relationships ?? []).map((r: Spec) => [r.name, r]));
    const key = data.key;
    const seen = new Set<unknown>();
    for (const row of data.rows ?? []) {
      if (!(key in row)) {
        errors.push(`${name}: REF-001 a row has no ${str(key)}`);
        continue;
      }
      const id = row[key];
      if (seen.has(id)) errors.push(`${name}: REF-001 ${str(key)} ${repr(id)} appears twice`);
      seen.add(id);
      for (const [field, value] of Object.entries<Spec>(row)) {
        if (rels.has(field)) {
          const target = rels.get(field).target;
          const targetData = loaded.get(target);
          if (targetData) {
            const keys = new Set(targetData.rows.map((r: Spec) => r[targetData.key]));
            if (!keys.has(value))
              errors.push(
                `${name} ${str(id)}: REF-002 ${field} ${repr(value)} is not a row of ${target}`
              );
          }
        } else if (attrs.has(field)) {
          const spec = attrs.get(field);
          if (
            typeof value === "string" &&
            spec.maxLength &&
            Array.from(value).length > Number(spec.maxLength)
          ) {
            errors.push(
              `${name} ${str(id)}: REF-003 ${field} is ${Array.from(value).length} long; the attribute allows ${str(spec.maxLength)}`
            );
          }
          const values = spec.values;
          if (values?.length && !values.map(str).includes(str(value))) {
            errors.push(
              `${name} ${str(id)}: REF-003 ${field} ${repr(value)} is not one of ${repr(values)}`
            );
          }
        } else {
          errors.push(
            `${name} ${str(id)}: REF-003 ${field} is not an attribute or relationship of ${name}`
          );
        }
      }
      for (const [attrName, spec] of attrs) {
        if (spec.required === true && !(attrName in row) && attrName !== entity.identity?.key) {
          errors.push(`${name} ${str(id)}: REF-003 required ${attrName} is missing`);
        }
      }
    }
  }
  // REF-004: narrowedBy names references of the entity, and the target has its own key to each.
  for (const [name, { entity }] of entities) {
    const rels = new Map<string, Spec>((entity.relationships ?? []).map((r: Spec) => [r.name, r]));
    const refs = new Set<string>([
      ...(entity.attributes ?? [])
        .filter((a: Spec) => a.type === "reference")
        .map((a: Spec) => a.name),
      ...rels.keys(),
    ]);
    for (const holder of [...(entity.relationships ?? []), ...(entity.attributes ?? [])]) {
      for (const control of holder.narrowedBy ?? []) {
        if (!refs.has(control)) {
          errors.push(
            `${name}.${holder.name}: REF-004 narrowedBy names ${repr(control)}, which is not a reference of ${name}`
          );
          continue;
        }
        const controlled = (
          rels.get(control) ?? (entity.attributes ?? []).find((a: Spec) => a.name === control)
        )?.target;
        const target = entities.get(holder.target ?? "")?.entity;
        if (
          target &&
          controlled &&
          !(target.relationships ?? []).some(
            (r: Spec) => r.target === controlled && ["1", "0..1"].includes(str(r.cardinality))
          )
        ) {
          errors.push(
            `${name}.${holder.name}: REF-004 ${holder.target} has no key to ${controlled}, so ${control} cannot narrow it`
          );
        }
      }
    }
  }
}

function finish(entityCount: number, fileCount: number): number {
  console.log(`CEDM validation: ${entityCount} entities, ${fileCount} YAML files`);
  for (const warning of warnings) console.log(`WARNING: ${warning}`);
  for (const error of errors) console.log(`ERROR: ${error}`);
  if (errors.length) {
    console.log(`FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
    return 1;
  }
  console.log(`PASSED: 0 errors, ${warnings.length} warning(s)`);
  return 0;
}

function main(): number {
  if (!existsSync(REGISTRY)) {
    console.log(`ERROR: Missing registry: ${REGISTRY}`);
    return 1;
  }
  const registered = loadYaml(REGISTRY).registry?.entities ?? [];
  if (!Array.isArray(registered)) {
    console.log("ERROR: registry.entities must be a list");
    return 1;
  }

  // Every specification file must at least be YAML: a catalog that does not
  // parse is one no tool can read, and nothing else here would notice. The
  // files at the repository root count too (cedm.yaml once shipped a line
  // that did not parse and nothing noticed).
  for (const directory of ["specification", "domains", "schema", "applications"]) {
    for (const file of yamlFiles(path.join(ROOT, directory))) loadYaml(file);
  }
  for (const file of yamlFiles(ROOT)) loadYaml(file);

  const files = entityPaths();
  const entities: Entities = new Map();
  for (const file of files) {
    const document = loadYaml(file);
    const entity = document.entity;
    if (!isMap(entity)) {
      errors.push(`${file}: missing entity object`);
      continue;
    }
    const name = entity.name;
    if (typeof name !== "string" || !ENTITY_NAME.test(name)) {
      errors.push(`${file}: invalid entity.name`);
      continue;
    }
    if (entities.has(name)) errors.push(`Duplicate entity name: ${name}`);
    entities.set(name, { path: file, entity });

    // The file is named for its entity: SalesOrderLine lives in sales-order-line.yaml.
    const expected = `${name.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, "-").toLowerCase()}.yaml`;
    if (path.basename(file) !== expected) {
      errors.push(
        `${name}: file is ${path.basename(file)}; an entity named ${name} lives in ${expected}`
      );
    }

    for (const where of splitText(entity)) {
      errors.push(
        `${file}: ${where} has text split at a comma by a YAML flow mapping ` +
          "(quote it; tools/repair-flow-text.ts repairs this)"
      );
    }

    const identity = entity.identity ?? {};
    if (entity.kind !== "value_object" && !identity.key)
      errors.push(`${name}: identity.key is required`);
    if (identity.immutable !== true) errors.push(`${name}: identity.immutable must be true`);

    const identifier = document.specification?.identifier;
    if (!identifier || !IDENTIFIER.test(str(identifier)))
      errors.push(`${name}: invalid specification.identifier`);

    const attributes = entity.attributes ?? [];
    if (!Array.isArray(attributes)) errors.push(`${name}: attributes must be a list`);
    else {
      for (const attr of attributes) {
        if (!isMap(attr) || !attr.name || !attr.type) {
          errors.push(`${name}: every attribute requires name and type`);
          continue;
        }
        if (attr.type === "reference" && !attr.target)
          errors.push(`${name}.${attr.name}: reference requires target`);
      }
    }

    const relationships = entity.relationships ?? [];
    if (!Array.isArray(relationships)) errors.push(`${name}: relationships must be a list`);
    else {
      for (const rel of relationships) {
        if (!isMap(rel)) {
          errors.push(`${name}: invalid relationship entry`);
          continue;
        }
        if (!rel.target) errors.push(`${name}: relationship target is required`);
        const cardinality = rel.cardinality;
        if (
          !CARDINALITIES.has(cardinality) &&
          !(typeof cardinality === "string" && CARDINALITY_PATTERN.test(cardinality))
        ) {
          errors.push(
            `${name}.${rel.name ?? "<unnamed>"}: invalid cardinality ${repr(cardinality)}`
          );
        }
      }
    }

    const invariants = entity.invariants ?? [];
    for (const rule of Array.isArray(invariants) ? invariants : []) {
      if (!isMap(rule) || !rule.id || !rule.rule)
        errors.push(`${name}: every invariant requires id and rule`);
    }

    const lifecycle = entity.lifecycle;
    if (lifecycle) {
      const stateSet = new Set(lifecycle.states ?? []);
      for (const transition of lifecycle.transitions ?? []) {
        if (!stateSet.has(transition.from))
          errors.push(`${name}: transition.from is not a declared state: ${str(transition.from)}`);
        if (!stateSet.has(transition.to))
          errors.push(`${name}: transition.to is not a declared state: ${str(transition.to)}`);
      }
    }
  }

  dictionaryChecks(entities);
  businessLogicChecks(entities);
  workflowChecks(entities);
  referenceDataChecks(entities);

  const registeredSet = new Set<string>(registered);
  const actualSet = new Set(entities.keys());
  for (const name of sorted(difference(actualSet, registeredSet)))
    errors.push(`Entity file is not registered: ${name}`);
  for (const name of sorted(difference(registeredSet, actualSet)))
    errors.push(`Registry entity has no entity file: ${name}`);

  // Resolve references after all entity names are known.
  for (const [name, { entity }] of entities) {
    for (const attr of entity.attributes ?? []) {
      if (attr.type === "reference" && !entities.has(attr.target)) {
        errors.push(`${name}.${str(attr.name)}: dangling reference target ${repr(attr.target)}`);
      }
    }
    for (const rel of entity.relationships ?? []) {
      const target = rel.target;
      if (!entities.has(target))
        errors.push(`${name}.${str(rel.name)}: dangling relationship target ${repr(target)}`);
      if (
        target === name &&
        !(entity.invariants ?? []).some((inv: Spec) =>
          SELF_REFERENCE_ACYCLIC.test(str(inv.rule ?? ""))
        )
      ) {
        errors.push(
          `${name}.${str(rel.name)}: self-reference needs an invariant stating the ` +
            "hierarchy is acyclic (no cycle, own parent or own ancestor)"
        );
      }
    }
  }

  return finish(entities.size, files.length);
}

process.exit(main());
