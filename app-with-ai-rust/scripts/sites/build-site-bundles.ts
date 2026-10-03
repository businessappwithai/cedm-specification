#!/usr/bin/env bun
/**
 * Bundle the model language into the two published sites checked out beside
 * this repository: `businessappwithairust` (the website) and
 * `app-and-report-with-ai-rust` (the orchestrator's guide and viewers).
 *
 *   bun scripts/sites/build-site-bundles.ts                 # write every bundle
 *   bun scripts/sites/build-site-bundles.ts --check         # fail if any committed copy is stale
 *   bun scripts/sites/build-site-bundles.ts --only website  # one site (website | orchestrator)
 *
 * Each site gets three files, all built from `language/browser/` here — never
 * copied, never edited:
 *
 * | File | Entry | What a page does with it |
 * |---|---|---|
 * | `model-yaml.js` | `model-yaml.entry.ts` | validate and repair a model (`*.eml.yaml`): YAML, the JSON Schema, the full checker, every finding at its YAML line. Its URL is published: the protocol documents tell a language model to run its output past it |
 * | `appwithai-model.js` | `browser-generator.entry.ts` | read, validate and compile a model for the in-browser generator the site vendors (`appwithai-wasm.js`) — see that entry's comment |
 * | `viewers/appwithai-model.js` | `browser-generator.entry.ts` | the same module beside the model viewers, which read a model with `inspectModel` and print a report with `formatReport` |
 *
 * Nothing here re-implements a rule. A model that passes in a browser passes in
 * the terminal, because it is the same code.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { bundleForBrowser, bundlerEnvNotice } from "./browser-bundle";

// Pinned to the repository root: Bun labels each bundled module with its path
// relative to the cwd, so a build from anywhere else produces a different file.
const ROOT = resolve(import.meta.dir, "../..");
process.chdir(ROOT);
/** cedm-specification: the sites are this repository's siblings. */
const SITES_ROOT = resolve(ROOT, "..");

const VALIDATOR_BLURB =
  "// Validate and repair models (*.eml.yaml):\n" +
  "//   import { validate, fix } from './model-yaml.js';\n" +
  "//   const { ok, diagnostics } = validate(yamlText);   // located at YAML lines\n" +
  "//   const { text, applied } = fix(yamlText);           // comments kept\n";

const GENERATOR_BLURB =
  "// Read and compile a model (*.eml.yaml) for this site's browser generators:\n" +
  "//   import { compileForBrowser } from './appwithai-model.js';\n" +
  "//   const { ok, model, diagnostics } = compileForBrowser(yamlText);\n" +
  "//   generateFromModel({ model, modelText, … })   // appwithai-wasm.js\n";

const VIEWER_BLURB =
  "// Read a model (*.eml.yaml) for the model viewers:\n" +
  "//   import { inspectModel, formatReport } from './appwithai-model.js';\n" +
  "//   const { model, report } = inspectModel(yamlText);   // throws when it does not read\n";

interface Bundle {
  site: "website" | "orchestrator";
  entry: string;
  target: string;
  global: string;
  what: string;
  blurb: string;
}

const WEBSITE = "businessappwithairust";
const ORCHESTRATOR = "app-and-report-with-ai-rust/common/html";
const ORCHESTRATOR_VIEWERS = "app-and-report-with-ai-rust/common/website/viewers";

const BUNDLES: Bundle[] = [
  {
    site: "website",
    entry: "language/browser/model-yaml.entry.ts",
    target: `${WEBSITE}/guide/model-yaml.js`,
    global: "EMLYaml",
    what: "the model language",
    blurb: VALIDATOR_BLURB,
  },
  {
    site: "website",
    entry: "language/browser/browser-generator.entry.ts",
    target: `${WEBSITE}/assets/js/appwithai-model.js`,
    global: "EMLYamlGenerator",
    what: "the model reader and compiler for the browser generators",
    blurb: GENERATOR_BLURB,
  },
  {
    site: "orchestrator",
    entry: "language/browser/model-yaml.entry.ts",
    target: `${ORCHESTRATOR}/model-yaml.js`,
    global: "EMLYaml",
    what: "the model language",
    blurb: VALIDATOR_BLURB,
  },
  {
    site: "orchestrator",
    entry: "language/browser/browser-generator.entry.ts",
    target: `${ORCHESTRATOR}/assets/appwithai-model.js`,
    global: "EMLYamlGenerator",
    what: "the model reader and compiler for the browser generators",
    blurb: GENERATOR_BLURB,
  },
  {
    site: "website",
    entry: "language/browser/browser-generator.entry.ts",
    target: `${WEBSITE}/viewers/appwithai-model.js`,
    global: "EMLYamlGenerator",
    what: "the model reader for the model viewers",
    blurb: VIEWER_BLURB,
  },
  {
    site: "orchestrator",
    entry: "language/browser/browser-generator.entry.ts",
    target: `${ORCHESTRATOR_VIEWERS}/appwithai-model.js`,
    global: "EMLYamlGenerator",
    what: "the model reader for the model viewers",
    blurb: VIEWER_BLURB,
  },
];

const args = process.argv.slice(2);
const check = args.includes("--check");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
const selected = BUNDLES.filter((bundle) => !only || bundle.site === only);
if (selected.length === 0) {
  console.error(`No bundles for --only ${only}. Sites: website, orchestrator.`);
  process.exit(2);
}

const built = new Map<string, string>();
let stale = false;

for (const bundle of selected) {
  let text = built.get(bundle.entry);
  if (text === undefined) {
    try {
      text = await bundleForBrowser(join(ROOT, bundle.entry));
    } catch (error) {
      for (const log of (error as AggregateError).errors ?? [error]) console.error(log);
      process.exit(1);
    }
    built.set(bundle.entry, text);
  }

  const output =
    "// Generated by scripts/sites/build-site-bundles.ts in app-with-ai-rust — do not edit.\n" +
    `// Source: ${bundle.entry}\n` +
    "//\n" +
    `// ${bundle.what}, bundled for the browser. This is the engine the CLIs run, not a\n` +
    "// second implementation of it — a model that passes here passes there.\n" +
    "//\n" +
    bundle.blurb +
    "//\n" +
    `// Loaded without a bound import, it also answers to globalThis.${bundle.global}.\n` +
    text;
  const target = join(SITES_ROOT, bundle.target);

  if (check) {
    const existing = await readFile(target, "utf-8").catch(() => "");
    if (existing !== output) {
      console.error(`${bundle.target} is out of date.\nRun: bun scripts/sites/build-site-bundles.ts`);
      stale = true;
    } else {
      console.log(`✓ ${bundle.target} is up to date`);
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, output, "utf-8");
    console.log(`✓ ${relative(SITES_ROOT, target)} (${(output.length / 1024).toFixed(0)}KB)`);
  }
}

if (stale) {
  console.error(bundlerEnvNotice());
  process.exit(1);
}
