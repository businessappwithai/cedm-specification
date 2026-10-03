#!/usr/bin/env bun
/**
 * Make the vendored browser generators take a compiled model instead of model
 * text in the old format.
 *
 *   bun scripts/sites/patch-vendored-generators.ts           # patch both sites' copies
 *   bun scripts/sites/patch-vendored-generators.ts --check   # fail if a copy is unpatched
 *
 * The two published sites checked out beside this repository —
 * `businessappwithairust` and `app-and-report-with-ai-rust/common/html` — each
 * vendor two browser builds of the generator from `app-with-ai-tanstack`:
 *
 * - `appwithai-wasm.js` writes an application that runs in the tab
 *   (`generateFromSource`);
 * - `appwithai-fullstack.js` writes the deployable source, the NestJS and
 *   TanStack Start application chapter 10 runs and the zip download carries
 *   (`generateFullStack`).
 *
 * Both compiled a model themselves, from the old text format. A model is YAML
 * now: the page reads, validates and compiles it with `appwithai-model.js`
 * (`language/browser/browser-generator.entry.ts`), and this script is the whole
 * of what changes in the vendored files:
 *
 * 1. `generateFromModel(options)` / `generateFullStackFromModel(options)` are
 *    added: the original entry point with the lines that read model text
 *    replaced by `options.model` and `options.modelText`. Everything else they
 *    do is the original's.
 * 2. The text entry points (`generateFromSource`, `generateFullStack`,
 *    `parseModel`, `reviewModel`) leave the export list.
 * 3. The application ships its model as `model/model.eml.yaml`, and the few
 *    sentences that name the model file say so (REPLACEMENTS).
 *
 * `build-site-bundles.ts` then rebundles each patched file from its exports
 * alone, which drops the code nothing can reach any more — the old reader
 * included. `scripts/verify-yaml-conversion` generates every published model
 * through the original bundles and the converted ones and compares the
 * applications file by file.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** cedm-specification: the sites are this repository's siblings. */
export const SITES_ROOT = resolve(import.meta.dir, "../../..");

export const WASM_TARGETS = [
  "businessappwithairust/assets/js/appwithai-wasm.js",
  "app-and-report-with-ai-rust/common/html/assets/appwithai-wasm.js",
];
export const FULLSTACK_TARGETS = [
  "businessappwithairust/assets/js/appwithai-fullstack.js",
  "app-and-report-with-ai-rust/common/html/assets/appwithai-fullstack.js",
];

const MARKER = "// generateFromModel: added by scripts/sites/patch-vendored-generators.ts";
const FULLSTACK_MARKER = "// generateFullStackFromModel: added by scripts/sites/patch-vendored-generators.ts";

/**
 * Text the generators write that named the model file's old format, and its
 * replacement. A pair whose left side a bundle does not contain is skipped for
 * that bundle; the verification applies the same pairs to the original run's
 * output before comparing, so each is a named, deliberate difference.
 */
export const REPLACEMENTS: Array<[string, string]> = [
  ['files.set("model/model.eml.mmd", options.source);', 'files.set("model/model.eml.yaml", options.source);'],
  ['readAsset("model/model.eml.mmd")', 'readAsset("model/model.eml.yaml")'],
  [
    "| \\`model/model.eml.mmd\\` | the model this was generated from |",
    "| \\`model/model.eml.yaml\\` | the model this was generated from |",
  ],
  ["kebabName(appName)}.eml.mmd`", "kebabName(appName)}.eml.yaml`"],
  ['  ".mmd": "text/plain; charset=utf-8",', '  ".yaml": "text/yaml; charset=utf-8",'],
  [
    "a single model file &mdash; a Mermaid document describing the records, the rules and the processes above.",
    "a single model file &mdash; a YAML document (<code>model.eml.yaml</code>) describing the records, the rules and the processes above.",
  ],
  ['await writeFile(join(outputDir, "model", "model.eml.mmd"), document, "utf-8");', 'await writeFile(join(outputDir, "model", "model.eml.yaml"), document, "utf-8");'],
  ['log.event("pipeline.artifact.write_failed", { artifact: "model/model.eml.mmd", err });', 'log.event("pipeline.artifact.write_failed", { artifact: "model/model.eml.yaml", err });'],
];

/** `generateFromSource`, reading its model from `options.model`. */
function generateFromModelOf(bundle: string): string {
  const start = bundle.indexOf("function generateFromSource(options) {");
  const end = bundle.indexOf("\nexport {", start);
  if (start < 0 || end < 0) throw new Error("generateFromSource not found");
  let body = bundle.slice(start, end);
  const read = body.indexOf("  const warnings = [];");
  const guard = body.indexOf("  if (!parsed.entities.length) {");
  if (read < 0 || guard < 0) throw new Error("generateFromSource has an unexpected shape");
  body =
    body.slice(0, read) +
    "  const warnings = [];\n" +
    "  // Compiled from YAML by appwithai-model.js; nothing here reads model text.\n" +
    "  const parsed = options.model;\n" +
    "  const source = options.modelText;\n" +
    body.slice(guard);
  body = body
    .replace("function generateFromSource(options) {", "function generateFromModel(options) {")
    .replace(
      'An EML document needs an `erDiagram` section — " + "check that the file is a Mermaid ER diagram and not, say, a flowchart on its own.',
      "A model declares its entities under `entities:`."
    )
    .replace(/,\n    review\n  \};/, "\n  };");
  return `${MARKER}\n${body}\n`;
}

/** `generateFullStack`, reading its model from `options.model`. */
function generateFullStackFromModelOf(bundle: string): string {
  const start = bundle.indexOf("async function generateFullStack(options) {");
  const end = bundle.indexOf("\nasync function loadTemplates(", start);
  if (start < 0 || end < 0) throw new Error("generateFullStack not found");
  let body = bundle.slice(start, end);
  const check = body.indexOf('  report("check", "Checking the model");');
  const guard = body.indexOf("  if (!parsed.entities.length) {");
  if (check < 0 || guard < 0) throw new Error("generateFullStack has an unexpected shape");
  body =
    body.slice(0, check) +
    '  report("parse", "Reading the model");\n' +
    "  // Read, validated and compiled from YAML by appwithai-model.js.\n" +
    "  const parsed = options.model;\n" +
    "  const source = options.modelText;\n" +
    body.slice(guard);
  body = body
    .replace("async function generateFullStack(options) {", "async function generateFullStackFromModel(options) {")
    .replace("An EML document needs an `erDiagram` section.", "A model declares its entities under `entities:`.")
    .replace("    sources: [review.source],", "    sources: [source],")
    .replace('      input: ["model.eml.mmd"],', '      input: ["model.eml.yaml"],')
    .replace("    files: files2,\n    review,\n", "    files: files2,\n");
  if (/\breview\b/.test(body)) throw new Error("generateFullStackFromModel still refers to the review");
  return `${FULLSTACK_MARKER}\n${body}\n`;
}

function replaceAll(bundle: string): string {
  let out = bundle;
  for (const [from, to] of REPLACEMENTS) out = out.replaceAll(from, to);
  return out;
}

function withExports(bundle: string, remove: string[], add: string): string {
  const exportAt = bundle.lastIndexOf("\nexport {");
  const names = bundle
    .slice(exportAt)
    .replace(/^\nexport \{/, "")
    .replace(/\};?\s*$/, "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name && !remove.includes(name));
  if (!names.includes(add)) names.push(add);
  names.sort();
  return `${bundle.slice(0, exportAt)}\nexport {\n${names.map((name) => `  ${name}`).join(",\n")}\n};\n`;
}

/** True once a bundle has been converted (patched and rebundled). */
export function isConverted(bundle: string): boolean {
  return bundle.includes("function generateFromModel(options)") || bundle.includes("function generateFullStackFromModel(options)");
}

/**
 * Bundle a patched file again from its exports alone. Bun drops every
 * top-level declaration nothing exported reaches, which is the old reader and
 * everything only it used. Module initialisers with side effects stay.
 */
export async function rebundle(text: string, label: string): Promise<string> {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const work = mkdtempSync(join(tmpdir(), "rebundle-"));
  try {
    const entry = join(work, label);
    writeFileSync(entry, text);
    const result = await Bun.build({ entrypoints: [entry], target: "browser", format: "esm", minify: false });
    if (!result.success) throw new AggregateError(result.logs, `could not rebundle ${label}`);
    const body = await result.outputs[0]!.text();
    return (
      `// ${label}: vendored from app-with-ai-tanstack, converted to take a compiled YAML\n` +
      "// model by scripts/sites/patch-vendored-generators.ts in app-with-ai-rust — do not edit.\n" +
      body
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export function patchWasm(bundle: string): string {
  let out = replaceAll(bundle);
  if (!out.includes(MARKER)) {
    const exportAt = out.lastIndexOf("\nexport {");
    out = `${out.slice(0, exportAt)}\n${generateFromModelOf(out)}${out.slice(exportAt)}`;
  }
  return withExports(out, ["generateFromSource", "parseModel", "reviewModel"], "generateFromModel");
}

export function patchFullStack(bundle: string): string {
  let out = replaceAll(bundle);
  if (!out.includes(FULLSTACK_MARKER)) {
    const exportAt = out.lastIndexOf("\nexport {");
    out = `${out.slice(0, exportAt)}\n${generateFullStackFromModelOf(out)}${out.slice(exportAt)}`;
  }
  return withExports(out, ["generateFullStack"], "generateFullStackFromModel");
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  let stale = false;
  const targets: Array<[string, (text: string) => string]> = [
    ...WASM_TARGETS.map((target) => [target, patchWasm] as [string, (text: string) => string]),
    ...FULLSTACK_TARGETS.map((target) => [target, patchFullStack] as [string, (text: string) => string]),
  ];
  for (const [target, patch] of targets) {
    const path = join(SITES_ROOT, target);
    if (!existsSync(path)) continue;
    const bundle = readFileSync(path, "utf8");
    if (isConverted(bundle)) {
      console.log(`✓ ${target} takes a compiled model`);
      continue;
    }
    if (check) {
      console.error(`${target} is not converted. Run: bun scripts/sites/patch-vendored-generators.ts`);
      stale = true;
      continue;
    }
    const name = target.split("/").pop()!;
    writeFileSync(path, await rebundle(patch(bundle), name));
    console.log(`✓ converted ${target}`);
  }
  if (stale) process.exit(1);
}
