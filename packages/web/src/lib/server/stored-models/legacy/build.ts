#!/usr/bin/env bun
/**
 * Rebuild the vendored Mermaid readers from the last commit that had them.
 *
 *   git worktree add /tmp/appwithai-18f5792 18f5792
 *   (cd /tmp/appwithai-18f5792 && bun install --frozen-lockfile)
 *   bun packages/web/src/lib/server/stored-models/legacy/build.ts /tmp/appwithai-18f5792
 *
 * The repository no longer reads Mermaid. The one thing that still has to is
 * the one-time conversion of what an older installation stored, so the reader
 * is kept here as it was at that commit, bundled into two files with nothing
 * resolved at run time:
 *
 *   eml.js         `emlToModelDocument` — a Mermaid (EML) model → the model
 *                  document of that time, with what it could not carry
 *   automation.js  `parseAutomation` / `serializeAutomation` — the automation
 *                  dialect the automations screen wrote
 *
 * The language definition is embedded rather than read from disk. The old
 * loaders looked for `language/appwithai-language.json` by walking up from the
 * module, and one of them returned `null` when it found nothing — after which
 * the reader quietly used a built-in vocabulary and a `text` column came out a
 * plain string. A conversion run years from now must not depend on a file
 * being wherever it was then, and must never degrade in silence, so the build
 * patches that loader and fails if the patch does not apply.
 *
 * `--check` rebuilds into memory and fails if either file differs from what is
 * checked in; `README.md` records the digests.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const COMMIT = "18f5792";
const args = process.argv.slice(2);
const check = args.includes("--check");
const worktree = args.find((arg) => !arg.startsWith("--"));
if (!worktree) {
  console.error("usage: build.ts <worktree of 18f5792> [--check]");
  process.exit(2);
}
const root = path.resolve(worktree);
const here = path.dirname(new URL(import.meta.url).pathname);

const head = (await Bun.$`git -C ${root} rev-parse --short=7 HEAD`.text()).trim();
if (head !== COMMIT) {
  console.error(`${root} is at ${head}; the readers are vendored from ${COMMIT}.`);
  process.exit(2);
}
const dirty = (await Bun.$`git -C ${root} status --porcelain --untracked-files=no`.text()).trim();
if (dirty) {
  console.error(`${root} has local changes; build from a clean checkout of ${COMMIT}.`);
  process.exit(2);
}

const languageFile = path.join(root, "language", "appwithai-language.json");
const definition = readFileSync(languageFile, "utf8");
JSON.parse(definition);

/** The loader in `parsers/language-maps.ts`, reading the embedded definition. */
const embedLanguageMaps: import("bun").BunPlugin = {
  name: "embed-language-definition",
  setup(build) {
    build.onLoad({ filter: /parsers[\\/]language-maps\.ts$/ }, (args) => {
      const source = readFileSync(args.path, "utf8");
      const from = [
        "    const file = findDefinitionFile();",
        "    if (!file) {",
        "      cachedDefinition = null;",
        "      return null;",
        "    }",
        '    cachedDefinition = JSON.parse(readFileSync(file, "utf-8")) as LanguageDefinitionShape;',
      ].join("\n");
      if (!source.includes(from))
        throw new Error(`${args.path}: the definition loader is not the one this build patches`);
      return {
        loader: "ts",
        contents: `const EMBEDDED_LANGUAGE_DEFINITION: unknown = ${definition};\n${source.replace(
          from,
          "    cachedDefinition = EMBEDDED_LANGUAGE_DEFINITION as LanguageDefinitionShape;"
        )}`,
      };
    });
  },
};

const entries = {
  "eml.ts": `
import { setLanguageDefinition } from "./language/index";
import definition from "./language/appwithai-language.json";
import { readEmlModel, uncarriedDirectiveLines } from "./packages/generator/src/model/read-eml";
import { recordsToDocument } from "./packages/generator/src/model-yaml/convert";

setLanguageDefinition(definition as never);

/** \`emlToModelDocument\` of ${COMMIT}, without the validator it did not call. */
export function emlToModelDocument(source: string) {
  const warnings: string[] = [];
  const { document, issues } = recordsToDocument(
    readEmlModel(source, (message: string) => warnings.push(message))
  );
  for (const message of warnings) issues.push({ construct: "directive", message, kind: "dropped" });
  issues.push(...sagaDirectiveIssues(source));
  return { document, issues, uncarried: uncarriedDirectiveLines(source) };
}

${readFileSync(path.join(root, "packages/generator/src/model-yaml/index.ts"), "utf8")
  .split("function sagaDirectiveIssues")[1]!
  .replace(/^/, "function sagaDirectiveIssues")}
`,
  "automation.ts": `
export { parseAutomation, serializeAutomation, emptyAutomation } from "./packages/web/src/lib/automation/model";
`,
};

// Bun names each module in a comment by its path relative to the working
// directory, so building from inside the worktree is what makes the output the
// same wherever the command is run from.
process.chdir(root);
const outputs: Record<string, string> = {};
for (const [entry, contents] of Object.entries(entries)) {
  const file = path.join(root, `.vendor-${entry}`);
  writeFileSync(file, contents);
  try {
    const result = await Bun.build({
      entrypoints: [file],
      target: "node",
      format: "esm",
      minify: false,
      plugins: [embedLanguageMaps],
    });
    if (!result.success) {
      for (const log of result.logs) console.error(log);
      process.exit(1);
    }
    const text = await result.outputs[0]!.text();
    // Node's built-ins are always there; a package is not.
    const builtins = new Set((await import("node:module")).builtinModules);
    const external = [...text.matchAll(/^import .* from "([^"]+)";$/gm)]
      .map((m) => m[1]!)
      .filter((name) => !name.startsWith("node:") && !builtins.has(name));
    if (external.length) throw new Error(`${entry}: resolves ${external.join(", ")} at run time`);
    outputs[entry.replace(/\.ts$/, ".js")] =
      `// Vendored from ${COMMIT} by build.ts — do not edit; see README.md.\n${text.replaceAll(root, "<18f5792>")}`;
  } finally {
    (await import("node:fs")).rmSync(file, { force: true });
  }
}

let stale = false;
for (const [name, text] of Object.entries(outputs)) {
  const target = path.join(here, name);
  const digest = createHash("sha256").update(text).digest("hex");
  if (check) {
    const current = existsSync(target) ? readFileSync(target, "utf8") : "";
    if (current !== text) {
      console.error(`${name} differs from a build of ${COMMIT}`);
      stale = true;
    } else console.log(`✓ ${name} ${digest}`);
  } else {
    writeFileSync(target, text);
    console.log(`wrote ${name} ${digest}`);
  }
}
if (stale) process.exit(1);
