#!/usr/bin/env bun
/**
 * Validate every model this repository carries, and hold the two copies of the
 * published examples to each other.
 *
 * Two things this catches that nothing else does:
 *
 *   1. A language change that makes the reader reject a model that used to
 *      pass. The reader is the contract every authoring surface is held to —
 *      the `eml` CLI, the generator, the modelling tool and the published
 *      `html/model-yaml.js` all run it — so a model here failing it is the
 *      language contradicting its own examples.
 *   2. `examples/*.eml.yaml` and `html/models/*.eml.yaml` drifting. They are the
 *      same files checked in twice: one set is what the CLIs and `start.sh`
 *      read, the other is what the published guide serves. Editing one and not
 *      the other is silent until someone downloads the stale copy.
 *
 * The reader is the one at the root of this repository (`parseModelYaml`'s
 * `readModelYaml`: YAML syntax, the JSON Schema, the full language checker).
 * Errors fail the check; warnings and notes are reported and do not.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { readModelYaml } from "../../../../packages/generator/src/model-yaml/index.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const MODEL_DIRS = ["examples", "html/models"];

function models(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith(".eml.yaml"))
    .sort()
    .map((f) => path.join(dir, f));
}

let failed = 0;

// --- 1. Every model validates ------------------------------------------------
const all = MODEL_DIRS.flatMap(models);
if (all.length === 0) {
  console.error("No models found — check-models is checking nothing, which is worse than failing.");
  process.exit(1);
}

for (const model of all) {
  const read = readModelYaml(readFileSync(path.join(ROOT, model), "utf8"));
  const count = (severity: string) =>
    read.diagnostics.filter((d) => d.severity === severity).length;
  const errors = count("error");
  const summary = `${errors} errors, ${count("warning")} warnings, ${count("info")} notes`;
  if (read.ok && errors === 0) {
    console.log(`  ok    ${model}  (${summary})`);
  } else {
    failed++;
    console.error(`  FAIL  ${model}  (${summary})`);
    for (const d of read.diagnostics.filter((d) => d.severity === "error"))
      console.error(`        ${model}:${d.line}:${d.column} ${d.code} ${d.message}`);
  }
}

// --- 2. The two copies of the published examples agree -----------------------
for (const published of models("html/models")) {
  const name = path.basename(published);
  const source = `examples/${name}`;
  if (!existsSync(path.join(ROOT, source))) {
    failed++;
    console.error(`  FAIL  ${published} has no counterpart in examples/`);
    continue;
  }
  const a = readFileSync(path.join(ROOT, published), "utf8");
  const b = readFileSync(path.join(ROOT, source), "utf8");
  if (a === b) {
    console.log(`  ok    ${name} identical in html/models and examples`);
  } else {
    failed++;
    console.error(
      `  FAIL  ${published} and ${source} differ — they are the same file checked in twice`
    );
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(`\n${all.length} model(s) valid.`);
