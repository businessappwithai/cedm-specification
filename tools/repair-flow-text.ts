#!/usr/bin/env bun
/**
 * Repair prose that a YAML flow mapping split at its commas.
 *
 * An entity file written as
 *
 *     - {id: SALES-ORDER-006, rule: requires customer, currency, product and tax context.}
 *
 * is not one rule: in a flow mapping a comma ends the value, so YAML reads
 * `rule: requires customer` and then two keys, `currency` and `product and tax
 * context.`, each with a null value. The text is silently cut short, and every
 * reader — the validator, the generators, a person reading the parsed model —
 * sees the truncated rule.
 *
 * This tool rejoins the fragments (each null-valued key that follows a text value
 * is the continuation of that text, in order) and rewrites the line with the text
 * quoted, leaving every other line of the file byte for byte as it was. A value
 * that is not text is written back exactly as it was spelled. A line it cannot
 * reconstruct is reported, not guessed at.
 *
 *     bun tools/repair-flow-text.ts            # repair in place, print a summary
 *     bun tools/repair-flow-text.ts --check    # report only; exit 1 if anything is split
 */

import "./lib/cli";
import { readFileSync, writeFileSync } from "node:fs";
import { isMap, isScalar, isSeq, type Node, parseDocument } from "yaml";
import { entityPaths, relative } from "./lib/library";
import type { Spec } from "./lib/yaml";

const PLAIN = /^[A-Za-z0-9_][A-Za-z0-9_ ./()'+-]*$/;
const RESERVED = new Set(["true", "false", "null", "yes", "no", "on", "off", "~"]);
const LINE = /^(?<indent>\s*)(?<dash>- )?(?:(?<key>[A-Za-z_][\w-]*): )?(?<body>\{.*\})\s*$/;

/** A text written back: plain when it reads back as itself everywhere, JSON-quoted otherwise. */
function text(value: string): string {
  if (PLAIN.test(value) && !RESERVED.has(value.toLowerCase()) && !/^[0-9.]+$/.test(value))
    return value;
  return JSON.stringify(value);
}

const isNull = (node: unknown) => node === null || (isScalar(node) && node.value === null);

/** Whether a node (at any depth) carries a fragment of split text. */
function isSplit(node: unknown): boolean {
  if (isMap(node)) return node.items.some((pair) => isNull(pair.value) || isSplit(pair.value));
  if (isSeq(node)) return node.items.some(isSplit);
  return false;
}

/** The node as flow text, with each null-valued key folded back into the text before it. */
function flow(node: unknown, source: string): string {
  if (isMap(node)) {
    const parts: Array<[string, string, boolean]> = [];
    for (const pair of node.items) {
      const key = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
      const last = parts.at(-1);
      if (isNull(pair.value) && last?.[2]) {
        last[1] = `${last[1]}, ${key}`;
        continue;
      }
      if (isNull(pair.value)) throw new Error("fragments with no text before them");
      const isText = isScalar(pair.value) && typeof pair.value.value === "string";
      parts.push([
        key,
        isText ? String((pair.value as Spec).value) : flow(pair.value, source),
        isText,
      ]);
    }
    return `{${parts.map(([k, v, isText]) => `${k}: ${isText ? text(v) : v}`).join(", ")}}`;
  }
  if (isSeq(node)) return `[${node.items.map((item) => flow(item, source)).join(", ")}]`;
  if (isScalar(node)) {
    if (typeof node.value === "string") return text(node.value);
    const range = (node as Node).range;
    return range ? source.slice(range[0], range[1]) : String(node.value);
  }
  return String(node);
}

/** The repaired line, or null when the line holds no split text. */
export function repairLine(line: string): string | null {
  const match = LINE.exec(line);
  if (!match?.groups) return null;
  const body = match.groups.body as string;
  const document = parseDocument(body, { uniqueKeys: false });
  if (document.errors.length || !isSplit(document.contents)) return null;
  const prefix =
    (match.groups.indent ?? "") +
    (match.groups.dash ?? "") +
    (match.groups.key ? `${match.groups.key}: ` : "");
  return prefix + flow(document.contents, body);
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  let repaired = 0;
  let unrepairable = 0;
  let files = 0;
  for (const file of entityPaths()) {
    const lines = readFileSync(file, "utf-8").split("\n");
    let changed = false;
    lines.forEach((line, number) => {
      let fixed: string | null;
      try {
        fixed = repairLine(line);
      } catch (error) {
        console.log(
          `${relative(file)}:${number + 1}: cannot repair: ${error instanceof Error ? error.message : error}`
        );
        unrepairable++;
        return;
      }
      if (fixed === null) return;
      repaired++;
      if (check) {
        console.log(`${relative(file)}:${number + 1}: text split at a comma`);
        return;
      }
      lines[number] = fixed;
      changed = true;
    });
    if (changed) {
      files++;
      writeFileSync(file, lines.join("\n"));
    }
  }
  console.log(
    `${repaired} line(s) ${check ? "split" : "repaired"} in ${check ? "checked" : files} file(s); ${unrepairable} unrepairable`
  );
  process.exit((check && repaired) || unrepairable ? 1 : 0);
}
