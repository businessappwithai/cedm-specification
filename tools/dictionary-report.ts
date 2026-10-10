#!/usr/bin/env bun
/**
 * Report how much of the Application Dictionary the specification supplies.
 *
 * For every dictionary slot named in specification/dictionary-mapping.yaml, count
 * the entities (or attributes) that state it. Exit status is 1 when a *required*
 * slot is empty — the same condition tools/validate.ts reports as DICT-*, shown
 * here as a coverage figure.
 *
 *     bun tools/dictionary-report.ts
 */

import "./lib/cli";
import { kindClass, kindClasses, LUCIDE } from "./lib/dictionary";
import { loadEntities } from "./lib/library";
import { fixed, str } from "./lib/text";
import type { Spec } from "./lib/yaml";

const entities = loadEntities().map((file) => file.entity);
const n = entities.length;
const attrs = entities.flatMap((e) => (e.attributes ?? []).map((a: Spec) => [e, a]));
const rels = entities.flatMap((e) => (e.relationships ?? []).map((r: Spec) => [e, r]));
const enums = attrs.filter(([, a]) => a.values?.length);
const attrHelp = (a: Spec) =>
  a.help && typeof a.help === "object" && !Array.isArray(a.help) ? a.help : {};
const countIf = <T>(items: T[], test: (item: T) => unknown) => items.filter(test).length;

const pct = (k: number, total: number) =>
  `${String(k).padStart(5)} / ${String(total).padEnd(5)} ${fixed(total ? (100 * k) / total : 100, 1).padStart(5)}%`;

const rows: Array<[string, number, number]> = [
  ["window.icon        (ui.icon)", countIf(entities, (e) => LUCIDE.has(e.ui?.icon)), n],
  ["window.description (help.summary)", countIf(entities, (e) => e.help?.summary), n],
  [
    "window.help        (businessMeaning|purpose)",
    countIf(entities, (e) => e.help?.businessMeaning || e.help?.purpose),
    n,
  ],
  ["window.kind class  (resolves)", countIf(entities, (e) => kindClasses(e.kind).length), n],
  [
    "field.summary      (attribute help)",
    countIf(attrs, ([, a]) => attrHelp(a).summary),
    attrs.length,
  ],
  [
    "field.usage        (attribute help)",
    countIf(attrs, ([, a]) => attrHelp(a).usage),
    attrs.length,
  ],
  ["field help on references (relationship help)", countIf(rels, ([, r]) => r.help), rels.length],
  [
    "list value meanings (every value of an enum)",
    countIf(enums, ([, a]) => {
      const have = new Set(Object.keys(attrHelp(a).valueSemantics ?? {}).map(str));
      return a.values.every((v: unknown) => have.has(str(v)));
    }),
    enums.length,
  ],
  ["enumeration tables (one per enumerated attribute)", enums.length, enums.length],
];

const classes = new Map<string, number>();
for (const e of entities) classes.set(kindClass(e.kind), (classes.get(kindClass(e.kind)) ?? 0) + 1);

console.log(
  `CEDM → Application Dictionary coverage: ${n} entities, ${attrs.length} attributes, ${rels.length} relationships, ${enums.length} enumerations`
);
for (const [label, k, total] of rows) console.log(`  ${label.padEnd(52)}${pct(k, total)}`);
console.log(
  `  kind classes: ${[...classes.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([c, k]) => `${c} ${k}`)
    .join(", ")}`
);
process.exit(rows.every(([, k, total]) => k === total) ? 0 : 1);
