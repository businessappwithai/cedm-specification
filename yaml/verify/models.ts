/**
 * Models: every Mermaid model of the imported repositories has a YAML model in
 * `yaml/`, and that YAML compiles to exactly the ParsedModel the Mermaid
 * compiled to — the input every generator in this repository works from.
 */
import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { compileModelDocument, readModelYaml } from "../../packages/generator/src/model-yaml/index";
import { type Check, ROOT, differences, mermaidModels, run } from "./lib";

export function verifyModels(mermaidDir: string, reference: string): Check[] {
  const checks: Check[] = [];
  const models = mermaidModels(mermaidDir);
  const compiled = run("bun", ["yaml/verify/reference/compile-mermaid.ts", ...models.map((m) => m.mermaid)], {
    env: { REFERENCE: reference },
  });
  if (compiled.status !== 0) {
    return [{ section: "models", subject: "reference compile", ok: false, detail: [compiled.stderr.slice(-2000)] }];
  }
  const reference_ = JSON.parse(compiled.stdout) as Record<string, { model?: unknown; error?: string }>;

  for (const model of models) {
    const subject = model.key;
    const mermaid = reference_[model.mermaid]!;
    if (!model.yaml) {
      const entities = (mermaid.model as { entities?: unknown[] } | undefined)?.entities?.length ?? 0;
      checks.push({
        section: "models",
        subject,
        ok: entities === 0,
        detail: [`not a model (the Mermaid reader finds ${entities} entities); kept as prose`],
      });
      continue;
    }
    if (!existsSync(model.yaml)) {
      checks.push({ section: "models", subject, ok: false, detail: [`${relative(ROOT, model.yaml)} is missing`] });
      continue;
    }
    if (mermaid.error) {
      checks.push({ section: "models", subject, ok: false, detail: [`the Mermaid does not compile: ${mermaid.error}`] });
      continue;
    }
    const read = readModelYaml(readFileSync(model.yaml, "utf8"));
    if (!read.document) {
      checks.push({
        section: "models",
        subject,
        ok: false,
        detail: read.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.line}:${d.column} ${d.code} ${d.message}`),
      });
      continue;
    }
    const yamlModel = compileModelDocument(read.document, { warn: () => {} });
    const diff = differences(JSON.parse(JSON.stringify(mermaid.model)), JSON.parse(JSON.stringify(yamlModel)));
    checks.push({
      section: "models",
      subject,
      ok: diff.length === 0,
      detail: diff.length ? diff : [`→ ${relative(ROOT, model.yaml)}: ${yamlModel.entities.length} entities, identical ParsedModel`],
    });
  }
  return checks;
}
