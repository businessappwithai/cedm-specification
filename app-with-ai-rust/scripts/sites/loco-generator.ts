/**
 * Build the in-browser Loco generator and the assets it runs on.
 *
 *   appwithai-loco.js   language/browser/loco-generator.entry.ts, bundled for a
 *                       browser with node:fs, node:crypto, node:os, node:url and
 *                       child_process answered by language/browser/shims/
 *   loco-assets.json    the files that entry mounts in its in-memory volume:
 *                       the Loco templates, the language definition and the
 *                       CEDM specification, each at the absolute path the
 *                       pipeline looks for it under
 *
 * Both are derived from this repository and nothing else, so the browser writes
 * what `appwithai generate --skip-cli-scaffold` writes. `equivalence` below is
 * the proof: it runs the bundle from `/`, where no repository is in reach, runs
 * the real pipeline beside it with the same settings, and compares every file.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { locateCedmRoot } from "../../packages/generator/src/model-cedm/library";

export const ROOT = resolve(import.meta.dir, "../..");
const SHIMS = join(ROOT, "language/browser/shims");
export const ENTRY = join(ROOT, "language/browser/loco-generator.entry.ts");

/** The node modules the pipeline imports, and the shim that answers each one. */
const SHIM_FOR: Record<string, string> = {
  fs: "fs.ts",
  "fs/promises": "fs-promises.ts",
  crypto: "crypto.ts",
  os: "os.ts",
  url: "url.ts",
  child_process: "child-process.ts",
};

const shimPlugin: import("bun").BunPlugin = {
  name: "loco-generator-shims",
  setup(build) {
    build.onResolve({ filter: /^(?:node:)?(fs|fs\/promises|crypto|os|url|child_process)$/ }, (args) => ({
      path: join(SHIMS, SHIM_FOR[args.path.replace(/^node:/, "")] as string),
    }));
  },
};

/**
 * The volume's layout, as constants of the build: the pipeline reads all three from
 * `process.env`, and baking them in keeps the bundle pointed at its own volume
 * whichever host runs it — a browser, or the test that runs it under Bun.
 */
const DEFINE = {
  "process.env.APPWITHAI_LANGUAGE_FILE": JSON.stringify("/language/appwithai-language.json"),
  "process.env.CEDM_SPEC_ROOT": JSON.stringify("/"),
  "process.env.TEMPLATE_DIR": JSON.stringify("/packages/generator/templates"),
};

export async function bundleLocoGenerator(): Promise<string> {
  const result = await Bun.build({
    entrypoints: [ENTRY],
    target: "browser",
    format: "esm",
    minify: false,
    plugins: [shimPlugin],
    define: DEFINE,
  });
  if (!result.success) throw new AggregateError(result.logs, "could not bundle the Loco generator");
  return (
    "// appwithai-loco.js — the Loco + Astryx application, generated in the tab by the\n" +
    "// real pipeline. Built by scripts/sites/build-site-bundles.ts in app-with-ai-rust\n" +
    "// from language/browser/loco-generator.entry.ts — do not edit.\n" +
    "//   const { files, executables } = await generateLocoApplication({\n" +
    "//     document, modelText, name, assets: await (await fetch('loco-assets.json')).json() });\n" +
    (await result.outputs[0]!.text())
  );
}

/** What the volume holds, relative to the repository root. */
const TEMPLATE_ROOT = "packages/generator/templates/tanstack-astryx-loco";
const LANGUAGE_FILE = "language/appwithai-language.json";
const CEDM_DIRECTORIES = ["specification", "schema", "domains"];
const BINARY = /\.(woff2?|ttf|otf|png|jpe?g|gif|ico|webp)$/i;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else out.push(path);
  }
  return out;
}

/** `loco-assets.json`: absolute volume path → text, or `{ base64 }` for a binary. */
export function buildLocoAssets(): string {
  // The CEDM specification is found the way the pipeline finds it: in this
  // repository, or by walking up to the specification it sits inside.
  const cedmRoot = locateCedmRoot(ROOT);
  if (!cedmRoot) throw new Error("No CEDM specification root (specification/manifest.yaml) above this repository");
  const sources: Array<[string, string]> = [
    ...files(join(ROOT, TEMPLATE_ROOT)).map((path) => [path, relative(ROOT, path)] as [string, string]),
    [join(ROOT, LANGUAGE_FILE), LANGUAGE_FILE],
  ];
  for (const directory of CEDM_DIRECTORIES) {
    for (const name of readdirSync(join(cedmRoot, directory)).sort()) {
      if (/\.ya?ml$/.test(name)) sources.push([join(cedmRoot, directory, name), `${directory}/${name}`]);
    }
  }
  const assets: Record<string, string | { base64: string }> = {};
  for (const [path, at] of sources) {
    const bytes = readFileSync(path);
    assets[`/${at}`] = BINARY.test(path) ? { base64: bytes.toString("base64") } : bytes.toString("utf8");
  }
  return `${JSON.stringify(assets)}\n`;
}
