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
 * vendor a browser build of the generator from `app-with-ai-tanstack`,
 * `appwithai-wasm.js`, which writes an application that runs in the tab
 * (`generateFromSource`). The deployable application the website's download
 * writes is not vendored: it is this repository's own pipeline, built for the
 * browser by `loco-generator.ts`.
 *
 * The vendored bundle compiled a model itself, from the old text format. A
 * model is YAML now: the page reads, validates and compiles it with
 * `appwithai-model.js` (`language/browser/browser-generator.entry.ts`), and this
 * script is the whole of what changes in the vendored file:
 *
 * 1. `generateFromModel(options)` is added: the original entry point with the
 *    lines that read model text replaced by `options.model` and
 *    `options.modelText`. Everything else it does is the original's.
 * 2. The text entry points (`generateFromSource`, `parseModel`, `reviewModel`)
 *    leave the export list.
 * 3. The application ships its model as `model/model.eml.yaml`, and the few
 *    sentences that name the model file say so (REPLACEMENTS).
 * 4. The language definition the bundle embeds is cut down to the three parts
 *    the generators read — `types.map`, `types.default` and
 *    `workflowConstructs.stepNodes.types` (DEFINITION_KEYS). The rest of it
 *    described the old notation for the old checker, and its top-level
 *    `setLanguageDefinition` call is a side effect, so the rebundle could never
 *    drop it on reachability alone.
 * 5. The old checker (`class CheckEngine`) is removed outright. Nothing
 *    references it once the first rebundle has dropped the text entry points,
 *    but a class with initialised fields is something the bundler keeps
 *    regardless — so the script asserts it is unreferenced, deletes it, and
 *    rebundles again, which drops everything only it used (`convert`).
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

const MARKER = "// generateFromModel: added by scripts/sites/patch-vendored-generators.ts";

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
  // The generated application's comments, messages and admin screens name the
  // model's YAML keys, not the old directives. Specific sentences first; the
  // last pair catches the bare role spelling the sentences above leave.
  ["%%entity <Child> parent: <Parent>", "parent: <Parent>"],
  ["%%entity <E> parent: <P>", "parent: <P>"],
  ["\\`%%field <E>.<c> help:\\`", "an attribute's \\`help\\`"],
  ["\\`%%field … help:\\` text", "\\`help\\` text"],
  ["<code>%%field ${escapeHtml(entity2.name)}.&lt;field&gt; help: …</code>", "<code>help:</code> on each attribute of <code>${escapeHtml(entity2.name)}</code>"],
  ["Add one with <code>%%entity ' + escapeHtml(entity2.name) + \" help: …</code>.", "Add one with <code>help:</code> on <code>' + escapeHtml(entity2.name) + \"</code>."],
  ["\\`%%rbac role:admin on Order.*\\`", "\\`{ entity: Order, action: \"*\", roles: [admin] }\\`"],
  ["\\`%%rbac … .read\\`", "an \\`rbac\\` entry with \\`action: read\\`"],
  ["an entity no \\`%%rbac\\` line names", "an entity no \\`rbac\\` entry names"],
  ["\\`%%rbac\\` line that shaped it", "\\`rbac\\` entry that shaped it"],
  ["Written by the %%rbac compiler.", "Written by the rbac compiler."],
  ["%%rbac grants read access by", "rbac grants read access by"],
  ["\\`%%hook beforeCreate timestampAnomaly on X[field: anomaly_timestamp]\\`", "\\`{ entity: X, event: beforeCreate, handler: timestampAnomaly, fields: [anomaly_timestamp] }\\`"],
  ["A \\`%%hook\\` directive names a handler", "A \\`hooks\\` entry names a handler"],
  ["the model's \\`%%hook\\` directives declare", "the model's \\`hooks\\` declare"],
  ["Declared by the model's \\`%%hook\\` directives", "Declared by the model's \\`hooks\\`"],
  ["This model declares no \\`%%hook\\` directives.", "This model declares no \\`hooks\\`."],
  ["Generated from `%%hook` directives", "Generated from the model's `hooks`"],
  ["what \\`%%hook\\` compiled to", "what \\`hooks\\` compiled to"],
  ["the model's \\`%%workflow\\` sections", "the model's \\`sagas\\` and \\`stateMachines\\`"],
  ["Add a %%rule section to the EML and regenerate", "Add a rule under rules: in the model and regenerate"],
  ["the model's %%rule sections into GoRules JDM", "the model's rules into GoRules JDM"],
  ["Compiled from %%rule ", "Compiled from rule "],
  ["the section declared \\`%%action\\`", "the rule declared \\`actions\\`"],
  ["sixteen \\`%%action\\` lines", "sixteen rule \\`actions\\`"],
  ["No %%report directives in this model", "No reports in this model"],
  ["Add a %%report directive to the model", "Add a report under reports: in the model"],
  ["declared with \\`%%report\\`", "declared under \\`reports\\`"],
  ["declared with %%report", "declared under reports"],
  ["into the document with %%report", "into the document under reports"],
  ["its own %%report queries", "its own report queries"],
  ["an authored \\`%%report\\`", "an authored report"],
  ["the \\`%%report\\` questions", "the \\`reports\\` questions"],
  ["The \\`%%report\\` questions", "The \\`reports\\` questions"],
  ["Declared in the model as %%report ${r.name}.", "Declared in the model's reports as ${r.name}."],
  ["\\`%%enum\\` declarations become", "\\`enums\\` entries become"],
  ["is what \\`%%enum\\` compiles to", "is what \\`enums\\` compiles to"],
  ["Values declared by %%enum ", "Values declared by enum "],
  ["%%enum vocabularies", "enum vocabularies"],
  ["generated from the model's erDiagram.", "generated from the model's entities."],
  ["the order of `erDiagram` blocks", "the order of `entities`"],
  ["%%rbac", "rbac"],
];

/** The parts of the embedded language definition the generators read. */
export const DEFINITION_KEYS: ReadonlyArray<readonly string[]> = [
  ["types", "map"],
  ["types", "default"],
  ["workflowConstructs", "stepNodes", "types"],
];

/**
 * Replace the embedded `appwithai_language_default` object with the parts
 * DEFINITION_KEYS names. The literal is the bundler's rendering of a JSON
 * file, so it is evaluated as an expression, filtered, and written back as
 * JSON — never edited as text.
 */
function pruneLanguageDefinition(bundle: string): string {
  const head = "var appwithai_language_default = {";
  const start = bundle.indexOf(head);
  if (start < 0) throw new Error("the embedded language definition was not found");
  const end = bundle.indexOf("\n};\n", start);
  if (end < 0) throw new Error("the embedded language definition does not end");
  const literal = bundle.slice(start + head.length - 1, end + 2);
  const full = new Function(`return (${literal});`)() as Record<string, unknown>;
  const pruned: Record<string, unknown> = {};
  for (const path of DEFINITION_KEYS) {
    let from: unknown = full;
    for (const key of path) from = (from as Record<string, unknown> | undefined)?.[key];
    if (from === undefined) throw new Error(`the embedded definition has no ${path.join(".")}`);
    let into = pruned;
    for (const key of path.slice(0, -1)) into = (into[key] ??= {}) as Record<string, unknown>;
    into[path[path.length - 1] as string] = from;
  }
  // A step type's `example` is old-notation syntax for the old checker's
  // messages; nothing the generators run reads it.
  const steps = (pruned.workflowConstructs as { stepNodes: { types: Array<Record<string, unknown>> } })
    .stepNodes.types;
  for (const step of steps) delete step.example;
  return `${bundle.slice(0, start)}var appwithai_language_default = ${JSON.stringify(pruned, null, 2)};${bundle.slice(end + 3)}`;
}

/** Delete a top-level class nothing refers to. Refuses when anything does. */
export function withoutUnreferencedClass(bundle: string, name: string): string {
  const head = `\nclass ${name} {\n`;
  const start = bundle.indexOf(head);
  if (start < 0) throw new Error(`class ${name} was not found`);
  const end = bundle.indexOf("\n}\n", start + head.length);
  if (end < 0) throw new Error(`class ${name} does not end`);
  const rest = bundle.slice(0, start) + bundle.slice(end + 2);
  if (new RegExp(`\\b${name}\\b`).test(rest)) throw new Error(`class ${name} is still referenced`);
  return rest;
}

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
  return bundle.includes("function generateFromModel(options)");
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
    return await result.outputs[0]!.text();
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** The whole conversion of one vendored bundle: patch, rebundle, drop the old checker, rebundle. */
export async function convert(bundle: string, label: string, patch: (text: string) => string): Promise<string> {
  const reachable = await rebundle(patch(bundle), label);
  const body = await rebundle(withoutUnreferencedClass(reachable, "CheckEngine"), label);
  return (
    `// ${label}: vendored from app-with-ai-tanstack, converted to take a compiled YAML\n` +
    "// model by scripts/sites/patch-vendored-generators.ts in app-with-ai-rust — do not edit.\n" +
    body
  );
}

export function patchWasm(bundle: string): string {
  let out = pruneLanguageDefinition(replaceAll(bundle));
  if (!out.includes(MARKER)) {
    const exportAt = out.lastIndexOf("\nexport {");
    out = `${out.slice(0, exportAt)}\n${generateFromModelOf(out)}${out.slice(exportAt)}`;
  }
  return withExports(out, ["generateFromSource", "parseModel", "reviewModel"], "generateFromModel");
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  let stale = false;
  const targets: Array<[string, (text: string) => string]> = [
    ...WASM_TARGETS.map((target) => [target, patchWasm] as [string, (text: string) => string]),
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
    writeFileSync(path, await convert(bundle, name, patch));
    console.log(`✓ converted ${target}`);
  }
  if (stale) process.exit(1);
}
