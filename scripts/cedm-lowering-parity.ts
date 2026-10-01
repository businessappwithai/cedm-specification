#!/usr/bin/env bun
/**
 * The CEDM lowering, compared across its implementations.
 *
 * A CEDM model is lowered into a model document by `language/cedm` in
 * TypeScript and by `crates/appwithai-gen/src/cedm.rs` in Rust — natively and
 * built for `wasm32-wasip1`, where the WebAssembly build runs the Rust port and
 * nothing else. Generation parity compares what each generator emits; this
 * compares what each *reads*, document for document, so a divergence is
 * reported as the construct that differs rather than as a file it happened to
 * reach.
 *
 *   bun scripts/cedm-lowering-parity.ts <model.cedm.yaml>...
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createFileLibrary, readCedmModel } from "../packages/generator/src/model-cedm";

const ROOT = path.resolve(import.meta.dir, "..");
const models = process.argv.slice(2);
if (!models.length) {
  console.error("usage: bun scripts/cedm-lowering-parity.ts <model.cedm.yaml>...");
  process.exit(2);
}

/** The first path at which two values differ, for a readable report. */
function firstDifference(left: unknown, right: unknown, at = ""): string | undefined {
  if (isDeepStrictEqual(left, right)) return undefined;
  if (
    left &&
    right &&
    typeof left === "object" &&
    typeof right === "object" &&
    Array.isArray(left) === Array.isArray(right)
  ) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      const found = firstDifference(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
        `${at}/${key}`
      );
      if (found) return found;
    }
  }
  return `${at || "/"}: ${JSON.stringify(left)?.slice(0, 160)} ≠ ${JSON.stringify(right)?.slice(0, 160)}`;
}

function rust(args: string[], label: string): { document: unknown; libraryEntities: string[] } {
  const run = spawnSync(args[0] as string, args.slice(1), { cwd: ROOT, encoding: "utf-8" });
  if (run.status !== 0) {
    throw new Error(`${label} failed:\n${run.stderr || run.stdout}`);
  }
  return JSON.parse(run.stdout);
}

let failures = 0;
for (const model of models) {
  const file = path.resolve(ROOT, model);
  const text = readFileSync(file, "utf-8");
  const read = readCedmModel(text, {
    library: createFileLibrary({ root: ROOT, modelDirectory: path.dirname(file) }),
    check: false,
  });
  const errors = read.diagnostics.filter((d) => d.severity === "error");
  if (!read.document || errors.length) {
    console.error(`!! ${model}: the TypeScript reader refuses it: ${JSON.stringify(errors)}`);
    failures++;
    continue;
  }
  const typescript = {
    document: JSON.parse(JSON.stringify(read.document)),
    libraryEntities: read.libraryEntities,
  };

  const legs: Array<[string, string[]]> = [
    ["Rust", ["cargo", "run", "-q", "-p", "appwithai-gen", "--", "lower", "-i", file]],
  ];
  if (process.env.CEDM_PARITY_WASM !== "0") {
    legs.push([
      "WebAssembly",
      ["node", "--no-warnings", "scripts/appwithai-wasm.mjs", "lower", "-i", file],
    ]);
  }
  for (const [label, command] of legs) {
    try {
      const other = rust(command, label);
      const difference =
        firstDifference(typescript.document, other.document) ??
        firstDifference(typescript.libraryEntities, other.libraryEntities, "/libraryEntities");
      if (difference) {
        console.error(`!! ${model}: TypeScript and ${label} lower it differently at ${difference}`);
        failures++;
      } else {
        console.log(`   ok — ${model}: TypeScript and ${label} lower it identically`);
      }
    } catch (error) {
      console.error(`!! ${model}: ${error instanceof Error ? error.message : String(error)}`);
      failures++;
    }
  }
}

if (failures) {
  console.error(`FAILED: ${failures} lowering(s) diverged.`);
  process.exit(1);
}
console.log(`PASSED: ${models.length} CEDM model(s) lowered identically.`);
