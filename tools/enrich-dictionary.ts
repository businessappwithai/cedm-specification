#!/usr/bin/env bun
/**
 * Fill the gaps `dictionary-report.ts` finds in the entity files.
 *
 * Adds, where absent and never over what an author wrote: `ui.icon`, help for an
 * attribute or relationship that has none, and `help.valueSemantics` for an
 * enumerated attribute that lacks it. Edits the text, inserting lines, so the
 * rest of the file stays exactly as written. A re-run changes nothing; `--check`
 * exits 1 when a file would change.
 *
 * What it writes is a placeholder an author should replace: the HELP-001 check
 * (tools/help-shapes.ts) does not flag it, so review the diff.
 *
 *     bun tools/enrich-dictionary.ts [--check]
 */

import "./lib/cli";
import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "yaml";
import { iconFor, lowerWords, valueMeaning } from "./lib/dictionary";
import { entityPaths } from "./lib/library";
import { applySpans, blockEnd, indentOf, type Span, topKey } from "./lib/lines";
import { isBlockPlainSafe } from "./lib/scalar";
import { str } from "./lib/text";
import { parseYaml, type Spec } from "./lib/yaml";

const CARDINALITY: Record<string, string> = {
  "0..1": "at most one",
  "1": "exactly one",
  "0..*": "any number of",
  "1..*": "at least one",
};
const WHAT: Record<string, string> = {
  uuid: "an identifier",
  date: "a calendar date",
  datetime: "a point in time",
  boolean: "a yes/no indicator",
  integer: "a whole number",
  decimal: "a number",
  money: "a monetary amount",
  reference: "a link to another record",
};

type Help = Record<string, Spec>;

function attributeHelp(entity: string, attr: Spec): Help {
  const label = lowerWords(attr.name);
  const holder = lowerWords(entity);
  const out: Help = {
    summary: `The ${label} of the ${holder}: ${WHAT[str(attr.type)] ?? "a value"} the business records on it.`,
    usage: `Entered or maintained when a ${holder} is created or changed; shown on its form and available to search and reports.`,
    relationshipContext: `Read together with the ${holder}'s other fields and its relationships; it is not meaningful on its own.`,
  };
  return out;
}

function relationshipHelp(entity: string, rel: Spec): Help {
  const holder = lowerWords(entity);
  const target = lowerWords(rel.target);
  const n = CARDINALITY[str(rel.cardinality)] ?? str(rel.cardinality);
  return {
    summary: `Links a ${holder} to ${target}, the ${lowerWords(rel.name)} it relates to.`,
    usage: `Chosen from the existing ${target} records when the ${holder} is created or edited.`,
    cardinalityMeaning: `A ${holder} has ${n} ${target} in this role.`,
    context: `Lets the ${holder} be found from, and reported with, its ${target}.`,
  };
}

/** The scalar as YAML text: plain when every reader takes it back as itself, quoted when not. */
function q(text: string): string {
  return isBlockPlainSafe(text) ? text : JSON.stringify(text);
}

function block(mapping: Help, indent: number): string[] {
  const pad = " ".repeat(indent);
  const out: string[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    if (value && typeof value === "object")
      out.push(`${pad}${q(key)}:`, ...block(value, indent + 2));
    else out.push(`${pad}${q(key)}: ${q(str(value))}`);
  }
  return out;
}

/** The attribute or relationship with what it lacks added; deep-equal to `item` if nothing. */
function enrichedItem(entity: string, section: string, item: Spec): Spec {
  const out = structuredClone(item);
  if (!out.help)
    out.help =
      section === "attributes" ? attributeHelp(entity, out) : relationshipHelp(entity, out);
  const values = section === "attributes" ? out.values : undefined;
  if (values?.length) {
    out.help.valueSemantics ??= {};
    for (const value of values) {
      out.help.valueSemantics[str(value)] ??= valueMeaning(entity, out.name, str(value));
    }
  }
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function enrichText(text: string): string {
  const entity = parseYaml(text).entity;
  const name: string = entity.name;
  const lines = text.split("\n");
  const spans: Span[] = [];

  if (!entity.ui?.icon) {
    if (entity.ui) throw new Error(`${name}: has a ui block with no icon; add it by hand`);
    const at = topKey(lines, "identity");
    if (at === undefined) throw new Error(`${name}: no identity block to place ui before`);
    spans.push([at, at, block({ ui: { icon: iconFor(name, entity.kind) } }, 2)]);
  }

  for (const section of ["attributes", "relationships"]) {
    const itemsOf: Spec[] = entity[section] ?? [];
    const first = topKey(lines, section);
    if (first === undefined) continue;
    let end = first + 1;
    while (
      end < lines.length &&
      (!lines[end]?.trim() || indentOf(lines[end] as string) > 2 || lines[end]?.startsWith("  - "))
    )
      end++;
    while (end > first + 1 && !lines[end - 1]?.trim()) end--;
    const body: number[] = [];
    for (let i = first + 1; i < end; i++)
      if (/^\s*- (name:|\{\s*name:)/.test(lines[i] as string)) body.push(i);
    if (!body.length) continue;
    const ipad = indentOf(lines[body[0] as number] as string);
    const starts = body.filter((i) => indentOf(lines[i] as string) === ipad);
    const kpad = ipad + 2;
    if (starts.length !== itemsOf.length)
      throw new Error(`${name}: ${section} lines and items disagree`);
    starts.forEach((start, index) => {
      const item = itemsOf[index];
      let stop = index + 1 < starts.length ? (starts[index + 1] as number) : end;
      while (stop > start + 1 && !lines[stop - 1]?.trim()) stop--;
      const flow =
        /^\s*- \{/.test(lines[start] as string) ||
        lines.slice(start, stop).some((line) => line.startsWith(`${" ".repeat(kpad)}help: {`));
      const enriched = enrichedItem(name, section, item);
      if (same(enriched, item)) return;
      if (flow) {
        // A flow-style item cannot take a line inserted into it; it is
        // rewritten whole, in block style, and nothing else is touched.
        const dumped = stringify([enriched], { lineWidth: 0, indentSeq: true })
          .trimEnd()
          .split("\n");
        spans.push([start, stop, dumped.map((l) => (l ? " ".repeat(ipad) + l : l))]);
        return;
      }
      if (!item.help) {
        spans.push([stop, stop, block({ help: enriched.help }, kpad)]);
        return;
      }
      const have = new Set(Object.keys(item.help.valueSemantics ?? {}).map(str));
      const added = Object.fromEntries(
        Object.entries(enriched.help.valueSemantics).filter(([k]) => !have.has(k))
      );
      if (have.size) {
        const at =
          lines.slice(start, stop).findIndex((l) => l.trim() === "valueSemantics:") + start;
        const end2 = blockEnd(lines, at, indentOf(lines[at] as string));
        spans.push([end2, end2, block(added, indentOf(lines[at] as string) + 2)]);
      } else {
        const at = lines.slice(start, stop).indexOf(`${" ".repeat(kpad)}help:`) + start;
        const end2 = blockEnd(lines, at, kpad);
        spans.push([end2, end2, block({ valueSemantics: added }, kpad + 2)]);
      }
    });
  }
  return applySpans(lines, spans).join("\n");
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const changed: string[] = [];
  for (const file of entityPaths()) {
    const text = readFileSync(file, "utf-8");
    const out = enrichText(text);
    if (out === text) continue;
    changed.push(file);
    if (check) continue;
    try {
      parseYaml(out);
    } catch (error) {
      console.error(
        `${file}: the enriched text does not parse, nothing written: ${String(error).split("\n")[0]}`
      );
      process.exit(2);
    }
    writeFileSync(file, out);
  }
  console.log(`${changed.length} entity file(s) ${check ? "need enrichment" : "enriched"}`);
  process.exit(check && changed.length ? 1 : 0);
}
