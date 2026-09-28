/**
 * Enterprise Reporting: the platform's `eml` CLI generates the same code from
 * each YAML example as the Mermaid CLI it replaced generated from the Mermaid
 * example — for both of its stacks.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareOutputs, roundedNodes } from "./compare-output";
import { type Check, YAML_ROOT, run } from "./lib";

const MODELS = ["crm", "ecommerce", "helpdesk", "minimal"];
const STACKS = ["enterprise-reporting", "node-rest"];

export function verifyEnterpriseCli(mermaidRoot: string): Check[] {
  const checks: Check[] = [];
  const mermaid = join(mermaidRoot, "enterprise_reporting_rust");
  const yaml = join(YAML_ROOT, "enterprise_reporting_rust");
  const work = mkdtempSync(join(tmpdir(), "verify-enterprise-"));
  try {
    for (const model of MODELS) {
      const outputs: Record<string, { mermaid: string; yaml: string }> = {};
      for (const stack of STACKS) {
        const out = { mermaid: join(work, `mmd-${model}-${stack}`), yaml: join(work, `yml-${model}-${stack}`) };
        const a = run("bun", ["language/cli/eml.ts", "generate", "-i", `language/examples/${model}.eml.mmd`, "-o", out.mermaid, "-n", model, "--stack", stack, "--no-autofix"], { cwd: mermaid });
        const b = run("bun", ["language/cli/eml.ts", "generate", "-i", `language/examples/${model}.eml.yaml`, "-o", out.yaml, "-n", model, "--stack", stack, "--no-autofix"], { cwd: yaml });
        if (a.status !== 0 || b.status !== 0) {
          checks.push({ section: "enterprise", subject: `${model} --stack ${stack}`, ok: false, detail: [`mermaid exit ${a.status}: ${a.stderr.slice(-400)}`, `yaml exit ${b.status}: ${b.stderr.slice(-400)}${b.stdout.slice(-400)}`] });
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
