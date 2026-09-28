#!/usr/bin/env bun
/**
 * Make the vendored in-browser generator (`appwithai-wasm.js`) take a compiled
 * model instead of Mermaid text.
 *
 *   bun scripts/patch-vendored-generators.ts           # patch both sites' copies
 *   bun scripts/patch-vendored-generators.ts --check   # fail if a copy is unpatched
 *
 * The two published sites under `yaml/` vendor a browser build of the
 * generator from `app-with-ai-tanstack`. It compiled a model itself, from
 * Mermaid, and exported that path (`generateFromSource`, `parseModel`,
 * `reviewModel`). In this repository a model is YAML: the page reads,
 * validates and compiles it with `appwithai-model.js`
 * (`language/browser/browser-generator.entry.ts`), whose model equals the one
 * the bundle compiled from the Mermaid it replaced, byte for byte. This script
 * is the whole of what changes in the vendored file:
 *
 * 1. `generateFromModel(options)` is added: `generateFromSource` with the two
 *    lines that read model text replaced by `options.model`. Everything it
 *    returns is computed the same way.
 * 2. The Mermaid entry points leave the export list, so nothing on a page can
 *    reach them. Their code stays in the file, unreachable — this is a
 *    vendored build, and it is not re-bundled here.
 * 3. The application ships its model as `model/model.eml.yaml`: the file it
 *    writes, the route that serves it, its README, and the static server's
 *    content type.
 * 4. One sentence the generated manual prints about the model file.
 *
 * Re-vendoring the bundle means running this again; `--check` fails until then.
 * `yaml/verify` generates every published model through the patched bundle
 * and the original and compares the two applications file by file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const TARGETS = [
  "yaml/businessappwithairust/assets/js/appwithai-wasm.js",
  "yaml/app-and-report-with-ai-rust/common/html/assets/appwithai-wasm.js",
];

const MARKER = "// generateFromModel: added by scripts/patch-vendored-generators.ts";

export const REPLACEMENTS: Array<[string, string]> = [
  [
    'files.set("model/model.eml.mmd", options.source);',
    'files.set("model/model.eml.yaml", options.source);',
  ],
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
];

const OLD_EXPORTS = ["  generateFromSource,\n", "  parseModel,\n", "  reviewModel\n"];

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
  if (/\breview\b/.test(body.replace(/reviewModel/g, "")) && body.includes("review:")) {
    throw new Error("generateFromModel still refers to the review");
  }
  return `${MARKER}\n${body}\n`;
}

function patch(bundle: string): string {
  let out = bundle;
  for (const [from, to] of REPLACEMENTS) {
    if (out.includes(to) && !out.includes(from)) continue;
    if (!out.includes(from)) throw new Error(`patch point not found: ${from.slice(0, 60)}`);
    out = out.replaceAll(from, to);
  }
  if (!out.includes(MARKER)) {
    const exportAt = out.lastIndexOf("\nexport {");
    out = `${out.slice(0, exportAt)}\n${generateFromModelOf(out)}${out.slice(exportAt)}`;
  }
  const exportAt = out.lastIndexOf("\nexport {");
  let exports = out.slice(exportAt);
  for (const line of OLD_EXPORTS) exports = exports.replace(line, "");
  exports = exports.replace(
    "  ModelCheckError,\n  RUNTIME_BYTES,\n",
    "  ModelCheckError,\n  RUNTIME_BYTES,\n  generateFromModel,\n"
  );
  exports = exports.replace(
    "  generateFromModel,\n  generateFromModel,\n",
    "  generateFromModel,\n"
  );
  exports = exports.replace("  generateWasmApp,\n};", "  generateWasmApp\n};");
  return out.slice(0, exportAt) + exports;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  let stale = false;
  for (const target of TARGETS) {
    const path = join(ROOT, target);
    const bundle = readFileSync(path, "utf8");
    const patched = patch(bundle);
    if (check) {
      if (patched !== bundle) {
        console.error(`${target} is not patched. Run: bun scripts/patch-vendored-generators.ts`);
        stale = true;
      } else console.log(`✓ ${target} takes a compiled model`);
    } else {
      writeFileSync(path, patched);
      console.log(`✓ patched ${target}`);
    }
  }
  if (stale) process.exit(1);
}
