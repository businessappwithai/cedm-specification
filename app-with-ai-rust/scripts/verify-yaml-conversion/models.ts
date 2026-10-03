/**
 * E1 — models. Every file with the old extension in the originals either is a
 * model, whose YAML counterpart in the copy compiles to exactly the ParsedModel
 * the original compiles to, or is not a model (it reads as no entity) and has
 * no counterpart.
 *
 * The original is read the one way this repository still reads the old format:
 * by the readers frozen from the last generator that read it, taken to today's
 * language by the same upgrade that converts a stored model
 * (`packages/web/src/lib/server/stored-models/convert.ts`). Both sides are then
 * compiled by today's compiler, so a difference can only be a difference
 * between the two files.
 */
import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { compileModelDocument, readModelYaml } from "../../packages/generator/src/model-yaml/index";
import { convertModel } from "../../packages/web/src/lib/server/stored-models/convert";
import { emlToModelDocument } from "../../packages/web/src/lib/server/stored-models/legacy/eml.js";
import { type Check, type Copy, NOT_MODELS, ROOT, differences, modelPairs } from "./lib";

/** A YAML text → today's ParsedModel, or the reader's errors. */
export function compileYaml(text: string): { model?: unknown; errors: string[] } {
  const read = readModelYaml(text);
  const errors = read.diagnostics
    .filter((d) => d.severity === "error")
    .map((d) => `${d.line}:${d.column} ${d.code} ${d.message}`);
  if (!read.document) return { errors };
  return { model: compileModelDocument(read.document, { warn: () => {} }), errors };
}

/** An original model → its YAML under today's language, or why not. */
export function convertOriginal(text: string): { yaml?: string; error?: string } {
  const converted = convertModel(text);
  return converted.ok ? { yaml: converted.yaml } : { error: converted.error };
}

function quietly<T>(fn: () => T): T {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
  }
}

/**
 * Models whose YAML says deliberately more than the original did, each with
 * the reason, and a test that the difference is exactly that and nothing else.
 * Anything a test does not account for still fails.
 */
export const REVISIONS: Record<string, { reason: string; accounts: (diff: string[], original: string) => boolean }> = {
  "app-with-ai-rust/tests/test-data/hospital-erd/hospital.erd.mmd": {
    reason:
      "the original marks `code` PK where every entity also has its `id` key, which the language refuses as two primary keys (98 × EML113); the YAML declares the `id` key and keeps `code` as a unique column, so only which of the two is required changes",
    accounts: (diff) => diff.every((line) => /^\.entities\.\d+\.attributes\.[01]\.required: /.test(line)),
  },
  "app-with-ai-rust/examples/cli-crm.eml.mmd": {
    reason:
      "the original writes its two access rules in the retired `%%guard role:… on …` spelling, which was read and never compiled; the YAML carries them as the `rbac` rules they spell",
    accounts: (diff, original) =>
      diff.every((line) => /^\.rbac\.(operations|transitions)\.\d+: mermaid undefined ≠ /.test(line)) &&
      diff.length === (original.match(/%%guard role:/g) ?? []).length,
  },
};

export function verifyModels(mermaidDir: string, copies: readonly Copy[]): Check[] {
  const checks: Check[] = [];
  for (const pair of modelPairs(mermaidDir, copies)) {
    const text = readFileSync(pair.mermaid, "utf8");
    if (!pair.yaml) {
      let entities = 0;
      try {
        entities = quietly(() => emlToModelDocument(text)).document.entities?.length ?? 0;
      } catch {
        entities = 0;
      }
      checks.push({
        section: "models",
        subject: pair.key,
        ok: entities === 0,
        detail: [`not a model — ${NOT_MODELS[pair.key]} (it reads as ${entities} entities)`],
      });
      continue;
    }
    const target = relative(ROOT, pair.yaml);
    if (!existsSync(pair.yaml)) {
      checks.push({ section: "models", subject: pair.key, ok: false, detail: [`${target} is missing`] });
      continue;
    }
    const original = quietly(() => convertOriginal(text));
    if (!original.yaml) {
      checks.push({ section: "models", subject: pair.key, ok: false, detail: [`the original does not convert: ${original.error}`] });
      continue;
    }
    const left = quietly(() => compileYaml(original.yaml!));
    const right = quietly(() => compileYaml(readFileSync(pair.yaml!, "utf8")));
    if (!left.model || !right.model) {
      checks.push({
        section: "models",
        subject: pair.key,
        ok: false,
        detail: [...left.errors.map((e) => `original: ${e}`), ...right.errors.map((e) => `${target}: ${e}`)],
      });
      continue;
    }
    const diff = differences(JSON.parse(JSON.stringify(left.model)), JSON.parse(JSON.stringify(right.model)), 100000);
    const entities = (left.model as { entities: unknown[] }).entities.length;
    const revision = REVISIONS[pair.key];
    const revised = diff.length > 0 && revision?.accounts(diff, text);
    checks.push({
      section: "models",
      subject: pair.key,
      ok: (diff.length === 0 || revised === true) && right.errors.length === 0,
      detail:
        (diff.length && !revised) || right.errors.length
          ? [...diff.slice(0, 12), ...right.errors.map((e) => `${target}: ${e}`)]
          : revised
            ? [`→ ${target}: ${entities} entities; ${diff.length} named differences — ${revision!.reason}`]
            : [`→ ${target}: ${entities} entities, identical ParsedModel`],
    });
  }
  return checks;
}
