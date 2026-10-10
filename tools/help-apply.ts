#!/usr/bin/env bun
/**
 * Write authored help into the entity files.
 *
 * A batch is a plain-text file, one block per entity, so prose never needs YAML
 * quoting:
 *
 *     @ Account
 *     s: What the entity is, in a sentence or two.
 *     b: The business meaning.
 *     u: When and how it is used.
 *     c: How it connects to the entities around it.
 *     l: How it moves through its lifecycle.
 *     x: A concrete example.
 *     a accountType
 *     s: What the field stores.
 *     u: How it is filled, read and validated.
 *     v ASSET: What this value means.
 *     v LIABILITY: ...
 *     r parentAccount
 *     s: What the relationship says.
 *     u: How it is used.
 *     n: What its cardinality means.
 *     w: Its part in a process.
 *
 * Keys — entity: s summary, b businessMeaning, u usage, c relationshipContext,
 * l lifecycle, x example, d distinctions, p workflowContext, y synonyms.
 * Attribute: s summary, u usage, b businessMeaning, c relationshipContext,
 * g validationGuidance, e examples (semicolon-separated), v <VALUE> valueSemantics.
 * Relationship: s summary, u usage, n cardinalityMeaning, w workflowRole, t context.
 * A line that starts with two spaces continues the previous text; a line that
 * starts with `//` is a comment.
 *
 * An authored block *replaces* that item's help. What it leaves out is dropped if
 * it was template filler (tools/help-shapes.ts) and kept if it was real prose.
 * Nothing is written unless every block in every batch is complete.
 *
 *     bun tools/help-apply.ts batch.txt [more.txt ...] [--dry-run]
 */

import "./lib/cli";
import { readFileSync } from "node:fs";
import { type Document, isMap, isScalar, type Pair, type YAMLMap } from "yaml";
import { type EntityDocument, entityFilesByName, fail, items, openEntity } from "./lib/edit";
import { fillerRows, legacyShapes, scan, shape } from "./lib/help-shapes";
import { repr, splitWords, str } from "./lib/text";
import { type Spec, writeDocument } from "./lib/yaml";

const ENTITY_KEYS: Record<string, string> = {
  s: "summary",
  b: "businessMeaning",
  u: "usage",
  c: "relationshipContext",
  l: "lifecycle",
  x: "example",
  d: "distinctions",
  p: "workflowContext",
  y: "synonyms",
};
const ATTR_KEYS: Record<string, string> = {
  s: "summary",
  u: "usage",
  b: "businessMeaning",
  c: "relationshipContext",
  g: "validationGuidance",
  e: "examples",
};
const REL_KEYS: Record<string, string> = {
  s: "summary",
  u: "usage",
  n: "cardinalityMeaning",
  w: "workflowRole",
  t: "context",
};
const ALWAYS_DROP = new Set(["requiredMeaning", "optionalMeaning"]);

type Help = Record<string, Spec>;
interface Block {
  help: Help;
  attrs: Map<string, Help>;
  rels: Map<string, Help>;
}

/** A batch file's blocks: {entity: {help, attrs, rels}}. */
export function parseBatch(text: string, file = "batch"): Map<string, Block> {
  const out = new Map<string, Block>();
  let entity: string | null = null;
  let target: Help | null = null;
  let kind: "entity" | "attr" | "rel" = "entity";
  let last: [Help, string] | null = null;
  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1;
    if (!raw.trim() || raw.trimStart().startsWith("//")) return;
    if (raw.startsWith("  ") && last) {
      const [holder, key] = last;
      holder[key] = `${holder[key]} ${raw.trim()}`.trim();
      return;
    }
    const line = raw.trimEnd();
    if (line.startsWith("@ ")) {
      entity = line.slice(2).trim();
      out.set(entity, { help: {}, attrs: new Map(), rels: new Map() });
      target = (out.get(entity) as Block).help;
      kind = "entity";
      last = null;
      return;
    }
    if (entity === null || target === null)
      fail(`${file}:${number}: text before the first '@ Entity'`);
    const block = out.get(entity) as Block;
    let m = /^([ar]) (\w+)\s*$/.exec(line);
    if (m) {
      const bucket = m[1] === "a" ? block.attrs : block.rels;
      const name = m[2] as string;
      if (!bucket.has(name)) bucket.set(name, {});
      target = bucket.get(name) as Help;
      kind = m[1] === "a" ? "attr" : "rel";
      last = null;
      return;
    }
    m = /^v ([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (m && kind === "attr") {
      target.valueSemantics ??= {};
      target.valueSemantics[m[1] as string] = (m[2] as string).trim();
      last = [target.valueSemantics, m[1] as string];
      return;
    }
    m = /^([a-z]):\s*(.*)$/.exec(line);
    if (m) {
      const table = { entity: ENTITY_KEYS, attr: ATTR_KEYS, rel: REL_KEYS }[kind];
      const key = table[m[1] as string];
      if (!key) fail(`${file}:${number}: key ${repr(m[1])} is not valid for a ${kind}`);
      target[key] = (m[2] as string).trim();
      last = [target, key];
      return;
    }
    fail(`${file}:${number}: cannot read ${repr(line.slice(0, 60))}`);
  });
  return out;
}

/**
 * Make `node.help` hold `help`, in its order, reusing every node whose value is
 * unchanged — so text that is re-applied as it was keeps its quoting and the
 * file does not change.
 */
function syncHelp(document: Document, node: YAMLMap, help: Help): void {
  const current = node.get("help", true);
  if (!isMap(current)) {
    node.set("help", document.createNode(help));
    return;
  }
  syncMap(document, current, help);
}

function syncMap(document: Document, map: YAMLMap, value: Help): void {
  const existing = new Map<string, Pair>();
  for (const pair of map.items as Pair[]) {
    existing.set(isScalar(pair.key) ? String(pair.key.value) : String(pair.key), pair);
  }
  map.items = Object.entries(value).map(([key, item]) => {
    const pair = existing.get(key);
    if (pair) {
      if (item && typeof item === "object" && !Array.isArray(item) && isMap(pair.value)) {
        syncMap(document, pair.value, item);
        return pair;
      }
      if (isScalar(pair.value) && pair.value.value === item) return pair;
      pair.value = document.createNode(item);
      return pair;
    }
    return document.createPair(key, item);
  });
}

const normal = (text: unknown) => splitWords(str(text)).join(" ");

/** The new help mapping: authored keys, plus real prose the author did not replace. */
function merge(old: unknown, authored: Help, badTexts: Set<string>): Help {
  const next: Help = {};
  for (const [key, value] of Object.entries(authored)) {
    next[key] = value && typeof value === "object" && !Array.isArray(value) ? { ...value } : value;
  }
  if (old && typeof old === "object" && !Array.isArray(old)) {
    for (const [key, value] of Object.entries<Spec>(old)) {
      if (key === "valueSemantics" && value && typeof value === "object") {
        // Authored values win; real prose for the others stays.
        const kept = Object.fromEntries(
          Object.entries(value).filter(([, t]) => !badTexts.has(normal(t)))
        );
        const merged = { ...kept, ...(next.valueSemantics ?? {}) };
        if (Object.keys(merged).length) {
          const order = [
            ...Object.keys(value),
            ...Object.keys(merged).filter((v) => !(v in value)),
          ];
          next.valueSemantics = Object.fromEntries(
            order.filter((v) => v in merged).map((v) => [v, merged[v]])
          );
        }
        continue;
      }
      if (key in next || ALWAYS_DROP.has(key) || key === "valueSemantics") continue;
      // Real prose the author did not replace stays; template text goes,
      // whatever key it sits under.
      if (typeof value === "string" && badTexts.has(normal(value))) continue;
      next[key] = value;
    }
  }
  return next;
}

export function main(argv: string[]): number {
  const dry = argv.includes("--dry-run");
  const files = argv.filter((a) => !a.startsWith("--"));
  if (!files.length) fail("usage: bun tools/help-apply.ts batch.txt [...] [--dry-run]");
  const batches = new Map<string, Block>();
  for (const file of files) {
    for (const [name, block] of parseBatch(readFileSync(file, "utf-8"), file)) {
      if (batches.has(name)) fail(`${name} is authored twice`);
      batches.set(name, block);
    }
  }
  const byName = entityFilesByName();
  const opened = new Map<string, EntityDocument>();
  const problems: string[] = [];
  const legacy = legacyShapes();
  for (const [name, block] of batches) {
    const file = byName.get(name);
    if (!file) {
      problems.push(`${name}: no such entity`);
      continue;
    }
    const doc = openEntity(file);
    opened.set(name, doc);
    const entity = doc.entity;
    const plain = entity.toJSON();
    const kind = plain.kind;
    const attrs = new Map(
      items(entity, "attributes").map((node) => [node.get("name") as string, node])
    );
    const rels = new Map(
      items(entity, "relationships").map((node) => [node.get("name") as string, node])
    );
    const related = (plain.relationships ?? []).map((r: Spec) => r.target);

    const fillerSet = (old: Spec, own: string | null, targets: unknown[]) => {
      const bad = new Set<string>();
      if (old && typeof old === "object") {
        for (const [key, value] of Object.entries<Spec>(old)) {
          if (key === "valueSemantics" && value && typeof value === "object") {
            for (const [val, text] of Object.entries(value)) {
              if (
                typeof text === "string" &&
                legacy.has(shape(text, name, val, [own, ...targets] as string[], kind))
              )
                bad.add(normal(text));
            }
          } else if (
            typeof value === "string" &&
            legacy.has(shape(value, name, own, targets as string[], kind))
          ) {
            bad.add(normal(value));
          }
        }
      }
      return bad;
    };
    const setHelp = (node: YAMLMap, help: Help) => syncHelp(doc.document, node, help);

    const entityHelp = merge(plain.help, block.help, fillerSet(plain.help, null, related));
    setHelp(entity, entityHelp);
    if (!entityHelp.summary || !(entityHelp.businessMeaning || entityHelp.purpose)) {
      problems.push(`${name}: entity help needs s (summary) and b (businessMeaning) — DICT-003`);
    }
    for (const [attrName, authored] of block.attrs) {
      const node = attrs.get(attrName);
      if (!node) {
        problems.push(`${name}.${attrName}: no such attribute`);
        continue;
      }
      const attr = node.toJSON();
      if (authored.examples) {
        authored.examples = String(authored.examples)
          .split(";")
          .map((e) => e.trim())
          .filter(Boolean);
      }
      const help = merge(attr.help, authored, fillerSet(attr.help, attrName, [attr.target]));
      setHelp(node, help);
      for (const need of ["summary", "usage"]) {
        if (!help[need]) problems.push(`${name}.${attrName}: no ${need} (DICT-006 needs both)`);
      }
      const want = new Set<string>((attr.values ?? []).map(str));
      const have = new Set(Object.keys(help.valueSemantics ?? {}));
      if (want.size && (want.size !== have.size || [...want].some((v) => !have.has(v)))) {
        const missing = [...want].filter((v) => !have.has(v)).sort();
        const extra = [...have].filter((v) => !want.has(v)).sort();
        problems.push(
          `${name}.${attrName}: valueSemantics must cover exactly ${repr([...want].sort())} (missing ${repr(missing)}, extra ${repr(extra)}); add 'v VALUE: ...' lines`
        );
      }
    }
    for (const [relName, authored] of block.rels) {
      const node = rels.get(relName);
      if (!node) {
        problems.push(`${name}.${relName}: no such relationship`);
        continue;
      }
      const rel = node.toJSON();
      const help = merge(rel.help, authored, fillerSet(rel.help, relName, [rel.target]));
      setHelp(node, help);
      for (const need of ["summary", "usage"]) {
        if (!help[need]) problems.push(`${name}.${relName}: relationship has no ${need}`);
      }
      if (!(help.cardinalityMeaning || help.workflowRole || help.context)) {
        problems.push(
          `${name}.${relName}: relationship says nothing about cardinality or its role in a process`
        );
      }
    }
  }
  if (problems.length) {
    console.log(problems.join("\n"));
    return 1;
  }
  if (dry) return 0;
  for (const { path, document } of opened.values()) writeDocument(path, document);
  const left = new Map<string, string[]>();
  for (const row of fillerRows(scan().rows)) {
    const entity = row.where.split(".")[0]?.split("[")[0] as string;
    if (batches.has(entity))
      left.set(entity, [...(left.get(entity) ?? []), `${row.where}.${row.key}`]);
  }
  for (const name of batches.keys()) {
    const rest = left.get(name);
    console.log(
      `${name}: ${rest ? `${rest.length} filler left: ${rest.slice(0, 6).join(", ")}` : "clean"}`
    );
  }
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
