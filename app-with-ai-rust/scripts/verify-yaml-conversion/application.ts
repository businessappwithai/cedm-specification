/**
 * E2 — applications. This repository's generator, given an original model
 * (read and upgraded as `models.ts` reads it) and then its YAML counterpart in
 * the copy, writes the same application: the same files with the same bytes,
 * apart from the files named in ACCEPTED, which record the model text itself
 * rather than anything generated from it.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { readModelYaml } from "../../packages/generator/src/model-yaml/index";
import { generateApplication } from "../../packages/generator/src/pipeline/generate-application";
import { type Check, PLATFORM, walk } from "./lib";
import { convertOriginal } from "./models";

const MODELS: Array<{ name: string; mermaid: string; yaml: string }> = [
  { name: "drug-discovery", mermaid: "examples/drug-discovery.eml.mmd", yaml: "examples/drug-discovery.eml.yaml" },
  { name: "crm", mermaid: "language/examples/crm.eml.mmd", yaml: "language/yaml/examples/crm.eml.yaml" },
];

/** A generation timestamp, in any of the forms the templates write. */
const TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g;

/** Files that carry the model's own text, comments included, not output. */
const ACCEPTED: Record<string, string> = {
  "model/model.eml.yaml": "the model text as written — the conversion of the original keeps its comments, the copy's file has its own",
};

const normalise = (text: string) => text.replace(TIMESTAMP, "<timestamp>");

async function generate(text: string, name: string, outputDir: string): Promise<string | undefined> {
  const read = readModelYaml(text);
  if (!read.document) return read.diagnostics.filter((d) => d.severity === "error").map((d) => d.message).join("; ");
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    await generateApplication({
      document: read.document,
      modelText: text,
      projectName: name,
      outputDir,
      skipCliScaffold: true,
      writeManifestFile: true,
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    console.log = log;
    console.warn = warn;
  }
  return undefined;
}

export async function verifyApplications(mermaidDir: string): Promise<Check[]> {
  const checks: Check[] = [];
  const work = mkdtempSync(join(tmpdir(), "verify-application-"));
  try {
    for (const model of MODELS) {
      const out = { mermaid: join(work, `${model.name}-mermaid`), yaml: join(work, `${model.name}-yaml`) };
      const original = convertOriginal(readFileSync(join(mermaidDir, "app-with-ai-rust", model.mermaid), "utf8"));
      if (!original.yaml) {
        checks.push({ section: "application", subject: model.name, ok: false, detail: [original.error ?? ""] });
        continue;
      }
      const failures = [
        await generate(original.yaml, model.name, out.mermaid),
        await generate(readFileSync(join(PLATFORM, model.yaml), "utf8"), model.name, out.yaml),
      ].filter(Boolean) as string[];
      if (failures.length) {
        checks.push({ section: "application", subject: model.name, ok: false, detail: failures });
        continue;
      }
      const files = (dir: string) => walk(dir, () => true).map((f) => relative(dir, f));
      const left = new Set(files(out.mermaid));
      const right = new Set(files(out.yaml));
      const detail: string[] = [];
      let identical = 0;
      for (const file of new Set([...left, ...right])) {
        if (file in ACCEPTED) continue;
        if (!left.has(file) || !right.has(file)) {
          detail.push(`${file}: only in the application from the ${left.has(file) ? "original" : "copy"}`);
          continue;
        }
        const a = readFileSync(join(out.mermaid, file));
        const b = readFileSync(join(out.yaml, file));
        if (a.equals(b) || normalise(a.toString("utf8")) === normalise(b.toString("utf8"))) identical++;
        else detail.push(`${file}: differs`);
      }
      checks.push({
        section: "application",
        subject: `${model.name}: ${model.mermaid} → ${model.yaml}`,
        ok: detail.length === 0,
        detail: detail.length
          ? detail.slice(0, 40)
          : [`${identical} of ${left.size} files identical (timestamps masked); ${Object.keys(ACCEPTED).join(", ")} carries the model text`],
      });
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return checks;
}
