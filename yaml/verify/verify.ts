#!/usr/bin/env bun
/**
 * Verify the repositories under `yaml/` against their Mermaid originals.
 *
 *   bun yaml/verify/verify.ts --mermaid <dir> --reference <checkout> [--only <section>]... [--json <file>]
 *
 * See `lib.ts` for the two inputs and `README.md` for what each section proves.
 * Exits 0 only when every check passes.
 */
import { writeFileSync } from "node:fs";
import { type Check, requireDir } from "./lib";
import { verifyEnterpriseCli } from "./enterprise";
import { verifyModels } from "./models";

const args = process.argv.slice(2);
const value = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const only = args.flatMap((arg, i) => (args[i - 1] === "--only" ? [arg] : []));
const wanted = (section: string) => only.length === 0 || only.includes(section);

const mermaid = requireDir(value("--mermaid"), "--mermaid");

const sections: Array<[string, () => Check[] | Promise<Check[]>]> = [
  ["models", () => verifyModels(mermaid, requireDir(value("--reference"), "--reference"))],
  ["enterprise", () => verifyEnterpriseCli(mermaid)],
];

const checks: Check[] = [];
for (const [name, section] of sections) {
  if (!wanted(name)) continue;
  const started = Date.now();
  const result = await section();
  checks.push(...result);
  const failed = result.filter((c) => !c.ok).length;
  console.log(`\n== ${name}: ${result.length - failed}/${result.length} match (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  for (const check of result) {
    console.log(`  ${check.ok ? "✓" : "✗"} ${check.subject}`);
    if (!check.ok || args.includes("--verbose")) for (const line of check.detail ?? []) console.log(`      ${line}`);
  }
}
const json = value("--json");
if (json) writeFileSync(json, `${JSON.stringify(checks, null, 2)}\n`);
const failed = checks.filter((c) => !c.ok);
console.log(`\n${failed.length ? "FAILED" : "OK"} — ${checks.length - failed.length} of ${checks.length} checks match`);
process.exit(failed.length ? 1 : 0);
