/**
 * E4 — the reporting platform's `eml` CLI. For each example, and for both of
 * its stacks, the original CLI over the original model and the copy's CLI over
 * the YAML model generate the same code, apart from the differences
 * `compare-output.ts` names, each a property of the old reader rather than of
 * the model.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareOutputs, roundedNodes } from "./compare-output";
import { type Check, ROOT, run } from "./lib";

const MODELS = ["crm", "ecommerce", "helpdesk", "minimal"];
const STACKS = ["enterprise-reporting", "node-rest"];

export function verifyEnterpriseCli(mermaidRoot: string): Check[] {
  const checks: Check[] = [];
  const mermaid = join(mermaidRoot, "enterprise-reporting-rust");
  const yaml = join(ROOT, "enterprise-reporting-rust");
  const work = mkdtempSync(join(tmpdir(), "verify-enterprise-"));
  try {
    for (const model of MODELS) {
      const outputs: Record<string, { mermaid: string; yaml: string }> = {};
      for (const stack of STACKS) {
        const out = { mermaid: join(work, `mmd-${model}-${stack}`), yaml: join(work, `yml-${model}-${stack}`) };
        const generate = (cwd: string, input: string, output: string) =>
          run("bun", ["language/cli/eml.ts", "generate", "-i", input, "-o", output, "-n", model, "--stack", stack, "--no-autofix"], { cwd });
        const a = generate(mermaid, `language/examples/${model}.eml.mmd`, out.mermaid);
        const b = generate(yaml, `language/examples/${model}.eml.yaml`, out.yaml);
        if (a.status !== 0 || b.status !== 0) {
          checks.push({
            section: "enterprise",
            subject: `${model} --stack ${stack}`,
            ok: false,
            detail: [`original exit ${a.status}: ${a.stderr.slice(-400)}`, `copy exit ${b.status}: ${b.stderr.slice(-400)}${b.stdout.slice(-400)}`],
          });
          continue;
        }
        outputs[stack] = out;
      }
      const rounded = roundedNodes(outputs["node-rest"] && join(outputs["node-rest"].mermaid, "eml.model.json"));
      for (const [stack, out] of Object.entries(outputs)) {
        const comparison = compareOutputs(out.mermaid, out.yaml, rounded);
        checks.push({
          section: "enterprise",
          subject: `language/examples/${model} --stack ${stack}`,
          ok: comparison.ok,
          detail: [
            `${comparison.identical} file(s) byte-identical`,
            ...comparison.explained.map((line) => `explained: ${line}`),
            ...comparison.failures.map((line) => `DIFFERS: ${line}`),
          ],
        });
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return checks;
}
