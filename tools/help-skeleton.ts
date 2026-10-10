#!/usr/bin/env bun
/**
 * Print what an entity declares, and which of its help is still template filler.
 *
 *     bun tools/help-skeleton.ts Account Address        # by entity name
 *     bun tools/help-skeleton.ts --next 8               # the next 8 entities with filler
 *     bun tools/help-skeleton.ts --todo                 # names of every entity with filler left
 *
 * A key marked `*` is filler; author it in a batch file and apply it with
 * tools/help-apply.ts.
 */

import "./lib/cli";
import { fillerRows, scan } from "./lib/help-shapes";
import { loadEntities } from "./lib/library";
import { head, repr, str } from "./lib/text";
import type { Spec } from "./lib/yaml";

const { rows } = scan();
const bad = new Set(fillerRows(rows).map((row) => `${row.where}\u0000${row.key}`));
const isBad = (where: string, key: string) => bad.has(`${where}\u0000${key}`);
const flags = (where: string, help: Spec) =>
  Object.keys(help ?? {})
    .map((k) => `${k}${isBad(where, k) ? "*" : ""}`)
    .join(" ");

function show(entity: Spec): void {
  const n = entity.name;
  console.log(`## ${n}  kind=${str(entity.kind)}  icon=${str(entity.ui?.icon)}`);
  console.log(`   ${head(str(entity.description), 220)}`);
  console.log(`   EH: ${flags(n, entity.help)}`);
  for (const [key, value] of Object.entries(entity.help ?? {})) {
    if (!isBad(n, key)) console.log(`      keep ${key}: ${head(str(value), 70)}`);
  }
  for (const a of entity.attributes ?? []) {
    const bits = [str(a.type ?? "?")];
    for (const flag of ["required", "unique", "immutable"]) if (a[flag]) bits.push(flag);
    for (const k of [
      "maxLength",
      "default",
      "target",
      "min",
      "max",
      "precision",
      "scale",
      "unit",
    ]) {
      if (a[k] !== undefined && a[k] !== null) bits.push(`${k}=${str(a[k])}`);
    }
    if (a.values?.length) bits.push(`values=${a.values.map(str).join(",")}`);
    const where = `${n}.${a.name}`;
    console.log(`   A ${a.name} [${bits.join(" ")}]  ${flags(where, a.help)}`);
    for (const [key, value] of Object.entries<Spec>(a.help ?? {})) {
      if (key === "valueSemantics" && value && typeof value === "object") {
        for (const v of Object.keys(value)) {
          if (!isBad(`${where}[${v}]`, "valueSemantics")) console.log(`      keep vs[${v}]`);
        }
      } else if (!isBad(where, key)) console.log(`      keep ${key}: ${head(str(value), 70)}`);
    }
  }
  for (const r of entity.relationships ?? []) {
    const where = `${n}.${r.name}`;
    console.log(
      `   R ${r.name} -> ${str(r.target)} ${str(r.cardinality)} ${str(r.ownership)}  ${flags(where, r.help)}`
    );
    for (const [key, value] of Object.entries(r.help ?? {})) {
      if (!isBad(where, key)) console.log(`      keep ${key}: ${head(str(value), 70)}`);
    }
  }
  const stars = Object.keys(entity.help ?? {}).filter((k) => isBad(n, k)).length;
  if (stars >= 2) {
    for (const inv of entity.invariants ?? [])
      console.log(`   I ${str(inv.id)}: ${head(str(inv.rule), 120)}`);
  }
  const lc = entity.lifecycle;
  if (lc) {
    const edges = (lc.transitions ?? []).map((t: Spec) => `${str(t.from)}>${str(t.to)}`).join(" ");
    console.log(
      `   L ${str(lc.attribute)} initial=${str(lc.initial)} terminal=${repr(lc.terminal)} ${edges}`
    );
  }
  console.log();
}

const argv = process.argv.slice(2);
const entities = new Map(loadEntities().map(({ entity }) => [entity.name as string, entity]));
const todo = [
  ...new Set([...bad].map((id) => id.split("\u0000")[0]?.split(".")[0]?.split("[")[0] as string)),
].sort();
if (argv.includes("--todo")) {
  if (todo.length) console.log(todo.join("\n"));
  process.exit(0);
}
const names = argv.includes("--next")
  ? todo.slice(0, Number(argv[argv.indexOf("--next") + 1] ?? 8))
  : argv.filter((a) => !a.startsWith("--"));
for (const name of names) {
  const entity = entities.get(name);
  if (!entity) console.log(`?? no entity ${name}`);
  else show(entity);
}
