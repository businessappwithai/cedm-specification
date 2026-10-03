#!/usr/bin/env bun
/**
 * Verify the repository copies, converted to YAML models, against their
 * originals. See lib.ts for the inputs.
 *
 *   bun scripts/verify-yaml-conversion/verify.ts --mermaid <dir>
 *       [--copy <name>]... [--only <section>]... [--json <file>] [--verbose]
 *
 * Exits 0 only when every check passes.
 */
import { writeFileSync } from "node:fs";
import { verifyApplications } from "./application";
import { verifyBrowser } from "./browser";
import { verifyEnterpriseCli } from "./enterprise";
import { COPIES, type Check, type Copy, requireDir } from "./lib";
import { verifyModels } from "./models";
import { verifyPacks } from "./pack";

const args = process.argv.slice(2);
const value = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const values = (flag: string) => args.flatMap((arg, i) => (args[i - 1] === flag ? [arg] : []));
const only = values("--only");
const wanted = (section: string) => only.length === 0 || only.includes(section);
const copies = (values("--copy").length ? values("--copy") : [...COPIES]) as Copy[];

const mermaid = requireDir(value("--mermaid"), "--mermaid");

const sections: Array<[string, () => Check[] | Promise<Check[]>]> = [
  ["models", () => verifyModels(mermaid, copies)],
  ["enterprise", () => (copies.includes("enterprise-reporting-rust") ? verifyEnterpriseCli(mermaid) : [])],
  ["browser", () => verifyBrowser(mermaid, copies)],
  ["pack", async () => (copies.includes("app-and-report-with-ai-rust") ? await verifyPacks(mermaid) : [])],
  ["application", async () => (copies.includes("app-with-ai-rust") ? await verifyApplications(mermaid) : [])],
];

const checks: Check[] = [];
for (const [name, section] of sections) {
  if (!wanted(name)) continue;
  const started = Date.now();
  const result = await section();
  checks.push(...result);
  const failed = result.filter((c) => !c.ok).length;
  console.log(
    `\n== ${name}: ${result.length - failed}/${result.length} match (${((Date.now() - started) / 1000).toFixed(1)}s)`
  );
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
