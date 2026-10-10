#!/usr/bin/env bun
/**
 * Find help that exists but is incomplete, or too thin to say anything.
 *
 *     bun tools/help-audit.ts [--thin] [Entity ...]
 *
 * Always checks: an entity has summary, businessMeaning and usage; an attribute has
 * summary and usage; a relationship has summary, usage and a statement of cardinality
 * or role; an enumeration has a meaning for every value.
 *
 * --thin also lists texts too short to carry information: an attribute whose summary
 * and usage together are under 14 words, a relationship under 12 across summary,
 * usage and cardinality, an enum value meaning under 4 words.
 */

import "./lib/cli";
import { loadEntities } from "./lib/library";
import { splitWords, str } from "./lib/text";
import type { Spec } from "./lib/yaml";

const count = (...texts: unknown[]) =>
  texts.reduce<number>((n, t) => n + (t ? splitWords(str(t)).length : 0), 0);

export function audit(entity: Spec, thin: boolean): string[] {
  const n = entity.name;
  const out: string[] = [];
  const h = entity.help ?? {};
  for (const key of ["summary", "usage"]) if (!h[key]) out.push(`${n}: entity help has no ${key}`);
  if (!(h.businessMeaning || h.purpose)) out.push(`${n}: entity help has no businessMeaning`);
  for (const a of entity.attributes ?? []) {
    const ah = a.help ?? {};
    for (const key of ["summary", "usage"]) if (!ah[key]) out.push(`${n}.${a.name}: no ${key}`);
    const words = count(ah.summary, ah.usage);
    if (thin && words < 14) out.push(`${n}.${a.name}: thin (${words} words)`);
    if (a.values?.length) {
      const vs = ah.valueSemantics ?? {};
      const keys = new Set(Object.keys(vs).map(str));
      for (const v of a.values) {
        if (!keys.has(str(v))) out.push(`${n}.${a.name}: no meaning for ${str(v)}`);
        else if (thin && count(vs[str(v)]) < 4) out.push(`${n}.${a.name}[${str(v)}]: thin`);
      }
    }
  }
  for (const r of entity.relationships ?? []) {
    const rh = r.help ?? {};
    for (const key of ["summary", "usage"])
      if (!rh[key]) out.push(`${n}.${r.name}: relationship has no ${key}`);
    if (!(rh.cardinalityMeaning || rh.workflowRole || rh.context)) {
      out.push(`${n}.${r.name}: relationship says nothing about cardinality or role`);
    }
    if (thin && count(rh.summary, rh.usage, rh.cardinalityMeaning, rh.workflowRole) < 12) {
      out.push(`${n}.${r.name}: thin relationship`);
    }
  }
  return out;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const thin = argv.includes("--thin");
  const only = new Set(argv.filter((a) => !a.startsWith("--")));
  let total = 0;
  for (const { entity } of loadEntities()) {
    if (only.size && !only.has(entity.name)) continue;
    for (const line of audit(entity, thin)) {
      console.log(line);
      total++;
    }
  }
  console.log(`${total} finding(s)`);
  process.exit(total ? 1 : 0);
}
