#!/usr/bin/env bun
/**
 * Every gate the specification is held to, in one run.
 *
 *     bun tools/check.ts            # run them all, report each, exit 1 if any failed
 *     bun tools/check.ts --verbose  # also print each gate's output
 *
 * A derivation tool's `--check` is a gate too: the library is kept in the state
 * a re-run of every tool leaves it in, so a tool run later changes nothing it
 * did not have to. Forty-two entity files once drifted out of that state
 * because nothing ran the checks; this is what runs them.
 */

import "./lib/cli";
import path from "node:path";
import { ROOT } from "./lib/library";

/** The Bun running this script, so a pinned version is the one every gate runs on. */
const BUN = process.execPath;

const GATES: Array<[name: string, command: string[]]> = [
  ["validate (DICT, ENUM, BL, REF, HELP-001)", [BUN, "tools/validate.ts"]],
  ["lifecycles", [BUN, "tools/lifecycle-lint.ts"]],
  ["help completeness", [BUN, "tools/help-audit.ts", "--thin"]],
  ["dictionary coverage", [BUN, "tools/dictionary-report.ts"]],
  ["enumeration registry", [BUN, "tools/build-enumerations.ts", "--check"]],
  ["derived business logic", [BUN, "tools/derive-business-logic.ts", "--check"]],
  ["derived workflows", [BUN, "tools/derive-workflows.ts", "--check"]],
  ["dictionary enrichment", [BUN, "tools/enrich-dictionary.ts", "--check"]],
  ["flow text", [BUN, "tools/repair-flow-text.ts", "--check"]],
  ["restated required flags", [BUN, "tools/help-strip.ts", "--check"]],
  ["applications in sync and complete", [BUN, "scripts/build-domain-applications.ts", "--check"]],
  ["YAML only", ["bash", "scripts/check-yaml-only.sh"]],
];

const verbose = process.argv.includes("--verbose");
let failed = 0;
for (const [name, command] of GATES) {
  const started = performance.now();
  const run = Bun.spawnSync(command, {
    cwd: ROOT,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const output = `${run.stdout.toString()}${run.stderr.toString()}`.trimEnd();
  const ok = run.exitCode === 0;
  if (!ok) failed++;
  const last = output.split("\n").at(-1) ?? "";
  console.log(`${ok ? "ok  " : "FAIL"}  ${name.padEnd(36)} ${seconds.padStart(5)}s  ${last}`);
  if (!ok || verbose) {
    for (const line of output.split("\n").slice(ok ? 0 : -40)) console.log(`        ${line}`);
  }
}
console.log(
  failed
    ? `\n${failed} of ${GATES.length} gates failed (${path.relative(process.cwd(), ROOT) || "."}).`
    : `\nAll ${GATES.length} gates pass.`
);
process.exit(failed ? 1 : 0);
