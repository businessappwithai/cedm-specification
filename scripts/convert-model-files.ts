#!/usr/bin/env bun
/**
 * Convert Mermaid (EML) model files to YAML model files.
 *
 *   bun scripts/convert-model-files.ts <file.mmd>... [--out-dir <dir>] [--json]
 *
 * Each file goes through exactly the conversion `bun run convert:stored-models`
 * applies to a stored model (`packages/web/src/lib/server/stored-models/convert.ts`):
 * the Mermaid reader of 18f5792, the upgrade to today's language, the author's
 * comments carried as YAML comments, and a read-back by today's reader. Nothing
 * here reads Mermaid itself.
 *
 * The output is written beside the input (or into --out-dir) as `<stem>.eml.yaml`,
 * where the stem is the file name without `.mmd` and without a trailing `.eml`.
 * A file that does not convert is reported and nothing is written for it; the
 * exit code is 1 when any file failed.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { convertModel } from "../packages/web/src/lib/server/stored-models/convert";

export function yamlNameFor(file: string): string {
  return `${basename(file).replace(/\.mmd$/i, "").replace(/\.eml$/i, "")}.eml.yaml`;
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const outIndex = args.indexOf("--out-dir");
const outDir = outIndex >= 0 ? args[outIndex + 1] : undefined;
const files = args.filter(
  (arg, index) => !arg.startsWith("--") && (outIndex < 0 || index !== outIndex + 1)
);
if (!files.length) {
  console.error("usage: bun scripts/convert-model-files.ts <file.mmd>... [--out-dir <dir>] [--json]");
  process.exit(2);
}

const results: Array<{ input: string; output?: string; ok: boolean; error?: string; notes: string[] }> = [];
for (const input of files) {
  const conversion = convertModel(readFileSync(input, "utf-8"));
  if (!conversion.ok) {
    results.push({ input, ok: false, error: conversion.error, notes: conversion.notes });
    continue;
  }
  const directory = outDir ?? dirname(input);
  mkdirSync(directory, { recursive: true });
  const output = join(directory, yamlNameFor(input));
  writeFileSync(output, conversion.yaml);
  results.push({ input, output, ok: true, notes: conversion.notes });
}

if (json) console.log(JSON.stringify(results, null, 2));
else
  for (const result of results) {
    console.log(`${result.ok ? "converted" : "FAILED   "} ${result.input}${result.output ? ` → ${result.output}` : ""}`);
    if (result.error) console.log(`  ${result.error}`);
    for (const note of result.notes) console.log(`  · ${note}`);
  }
process.exit(results.every((result) => result.ok) ? 0 : 1);
