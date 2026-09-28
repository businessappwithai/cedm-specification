/**
 * What every browser bundle of the language needs: stubs for the Node builtins
 * the reader's loaders name, and an honest message when a `--check` fails.
 * Shared by `scripts/build-language-tools.ts` (the root's `html/model-yaml.js`)
 * and `scripts/build-site-bundles.ts` (the published sites under `yaml/`).
 */

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
export const nodeStubs: Record<string, string> = {
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

export const stubPlugin: import("bun").BunPlugin = {
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
export function bundlerEnvNotice(): string {
  const runtime =
    typeof Bun === "undefined" ? `node ${process.versions.node}` : `bun ${Bun.version}`;
  return (
    `\nBuilt here with ${runtime} on ${process.platform}-${process.arch}.\n` +
    `Bundler output is sensitive to both, so if the diff is only a module path\n` +
    `or a byte or two of whitespace, check that against CI's runtime before\n` +
    `treating it as staleness. Anything larger is a real difference in source.\n`
  );
}

/** Bundle one browser entry the way every published language bundle is built. */
export async function bundleForBrowser(entry: string): Promise<string> {
  const result = await Bun.build({
    plugins: [stubPlugin],
    entrypoints: [entry],
    target: "browser",
    format: "esm",
    // Readable rather than minified: these are served from documentation sites,
    // and someone who wants to know what a page does to their model should be
    // able to read it.
    minify: false,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.EML_DEBUG": "undefined",
      "import.meta.main": "false",
    },
  });
  if (!result.success) {
    throw new AggregateError(result.logs, `could not bundle ${entry}`);
  }
  const artifact = result.outputs[0];
  if (!artifact) throw new Error(`no output for ${entry}`);
  return await artifact.text();
}
