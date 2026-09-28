#!/usr/bin/env bun
/**
 * Bundle the model language as one standalone file for the web.
 *
 * `html/model-yaml.js` is what an author — or a model writing a model —
 * validates and repairs a `*.eml.yaml` with, without a checkout, a Bun install
 * or a terminal. It sits at the site root because its URL is the interface:
 * `website/llmtext/llms-full.txt` tells a language model to run its output past
 * `/model-yaml.js`, and a path that reads like an implementation detail invites
 * being moved.
 *
 * Nothing here re-implements a rule. The entry point injects the inlined
 * language definition and re-exports the reader, checker and fixer the CLIs run.
 * A document that passes in a browser passes in the terminal, because it is the
 * same code.
 *
 *   bun run build:language-tools
 *   bun run build:language-tools --check    # fail if the checked-in copy is stale
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

// Pinned to the repository root, not the working directory. Bun labels each
// bundled module with its path relative to the cwd, so a build from anywhere
// else produces a different file — `--check` passing locally and failing in CI,
// which is the worst way round.
const ROOT = resolve(import.meta.dir, "..");
process.chdir(ROOT);

const TOOLS = [
  {
    entry: "language/browser/model-yaml.entry.ts",
    target: "html/model-yaml.js",
    global: "EMLYaml",
    what: "the model language",
    blurb:
      "// Validate and repair models (*.eml.yaml):\n" +
      "//   import { validate, fix } from './model-yaml.js';\n" +
      "//   const { ok, diagnostics } = validate(yamlText);   // located at YAML lines\n" +
      "//   const { text, applied } = fix(yamlText);           // comments kept\n",
  },
] as const;

/**
 * Stubs for the Node builtins the CLI halves still name.
 *
 * `language/index.ts` and the generator's language maps resolve the definition
 * off disk. The entry point injects the definition and calls only the pure
 * functions, so none of these ever run — but the imports must still resolve for
 * the bundle to build.
 *
 * They fail rather than pretend: a read reports a missing file, which is the
 * branch the loader already handles, and a write throws, because a page quietly
 * dropping a write would be worse than one that says it cannot.
 */
const nodeStubs: Record<string, string> = {
  "node:fs":
    "const missing = () => { throw new Error('no filesystem in the browser'); };\n" +
    "export const existsSync = () => false;\n" +
    "export const readFileSync = missing;\n" +
    "export const writeFileSync = missing;\n" +
    "export const readdirSync = missing;\n" +
    "export const statSync = missing;\n" +
    "export default { existsSync, readFileSync, writeFileSync, readdirSync, statSync };",
  "node:path":
    "const dirname = (p) => String(p).replace(/\\/[^/]*$/, '') || '/';\n" +
    "const basename = (p) => String(p).split('/').pop() || '';\n" +
    "const join = (...parts) => parts.filter(Boolean).join('/').replace(/\\/+/g, '/');\n" +
    "const resolve = (...parts) => join(...parts);\n" +
    "const relative = (_from, to) => String(to);\n" +
    "export { dirname, basename, join, resolve, relative };\n" +
    "export default { dirname, basename, join, resolve, relative };",
  "node:url":
    "export const fileURLToPath = (url) => String(url).replace(/^file:\\/\\//, '');\n" +
    "export default { fileURLToPath };",
};

const stubPlugin: import("bun").BunPlugin = {
  name: "node-builtin-stubs",
  setup(build) {
    // Both spellings: `node:fs` and `fs` resolve to the same stub.
    build.onResolve({ filter: /^(?:node:)?(fs|path|url)$/ }, (args) => ({
      path: args.path.startsWith("node:") ? args.path : `node:${args.path}`,
      namespace: "node-stub",
    }));
    build.onLoad({ filter: /.*/, namespace: "node-stub" }, (args) => ({
      contents: nodeStubs[args.path] ?? "export default {};",
      loader: "js",
    }));
  },
};

/**
 * What to print when `--check` finds a mismatch.
 *
 * `Bun.build` output depends on the bun version *and* the platform, so "is out
 * of date" alone is ambiguous: it usually means somebody forgot to run the
 * build, and sometimes means the same source bundled slightly differently
 * somewhere else. Saying which runtime produced the comparison is what lets a
 * reader tell those apart instead of guessing.
 */
function bundlerEnvNotice(): string {
  const runtime =
    typeof Bun === "undefined" ? `node ${process.versions.node}` : `bun ${Bun.version}`;
  return (
    `\nBuilt here with ${runtime} on ${process.platform}-${process.arch}.\n` +
    `Bundler output is sensitive to both, so if the diff is only a module path\n` +
    `or a byte or two of whitespace, check that against CI's runtime before\n` +
    `treating it as staleness. Anything larger is a real difference in source.\n`
  );
}

const check = process.argv.includes("--check");
let stale = false;

for (const tool of TOOLS) {
  const result = await Bun.build({
    plugins: [stubPlugin],
    entrypoints: [join(ROOT, tool.entry)],
    target: "browser",
    format: "esm",
    // Readable rather than minified: this is served from a documentation site,
    // and someone who wants to know what the page does to their model should be
    // able to read it.
    minify: false,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.EML_DEBUG": "undefined",
      "import.meta.main": "false",
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  const artifact = result.outputs[0];
  if (!artifact) {
    console.error(`no output for ${tool.entry}`);
    process.exit(1);
  }

  const banner =
    `// Generated by scripts/build-language-tools.ts — do not edit.\n` +
    `// Source: ${tool.entry}\n` +
    `//\n` +
    `// ${tool.what}, bundled for the browser. This is the engine the CLI runs, not a\n` +
    `// second implementation of it — a document that passes here passes there.\n` +
    `//\n` +
    tool.blurb +
    `//\n` +
    `// Loaded without a bound import, it also answers to globalThis.${tool.global}.\n`;

  const bundle = banner + (await artifact.text());
  const target = join(ROOT, tool.target);

  if (check) {
    const existing = await readFile(target, "utf-8").catch(() => "");
    if (existing !== bundle) {
      console.error(`${tool.target} is out of date.\nRun: bun run build:language-tools`);
      stale = true;
    } else {
      console.log(`✓ ${tool.target} is up to date`);
    }
  } else {
    await mkdir(join(ROOT, "html"), { recursive: true });
    await writeFile(target, bundle, "utf-8");
    console.log(
      `✓ bundled ${tool.what} to ${relative(ROOT, target)} (${(bundle.length / 1024).toFixed(0)}KB)`
    );
  }
}

if (stale) {
  console.error(bundlerEnvNotice());
  process.exit(1);
}
