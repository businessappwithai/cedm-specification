#!/usr/bin/env node
/**
 * check-model.mjs — validate a model (`*.eml.yaml`) with the published reader.
 *
 *   curl -sO https://www.appwithai.org/guide/check-model.mjs
 *   node check-model.mjs my-business.eml.yaml
 *
 * The protocol documents ask a language model to validate the model it wrote
 * before handing it over, with `model-yaml.js` — the language's own reader,
 * bundled as one ES module: YAML syntax, the JSON Schema, the full checker,
 * every finding at the YAML line and column that caused it. Importing it is one
 * line in Bun or Deno and several in Node, which removed network imports, so a
 * model with a shell and no memory of the difference tends to skip the step.
 * This script is that step, in one command, on every runtime: it finds the
 * published module, runs the three passes (repair, then validate the repaired
 * bytes twice), prints every finding, and exits non-zero if the generator
 * would refuse the model.
 *
 * It is a runner, not a second checker. Every finding it prints comes from
 * `model-yaml.js` — the same reader `appwithai` and the `eml` CLI run.
 *
 * Options
 *   --base <url>   where to load model-yaml.js from — a directory works too,
 *                  which is how to run this with no network at all
 *                  (default: this file's own directory, the working directory,
 *                  ./guide/, then https://www.appwithai.org/guide/)
 *   --write        save the repaired document back over the input file when
 *                  the fixer repaired something
 *   --quiet        print only the verdict line
 *
 * Exit codes: 0 clean · 1 the reader found errors · 2 the script could not run.
 */

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Where the published module lives: the site, and nothing else. The script
 * deliberately reaches no code-hosting origin, and failing to reach this host
 * is not the same as the model being unchecked — the local rungs below come
 * first for exactly that reason.
 */
const PUBLISHED = ["https://www.appwithai.org/guide/"];
const MODULE = "model-yaml.js";
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
};
const file = args.find((arg) => !arg.startsWith("--") && arg !== option("--base"));

if (!file) {
  console.error("usage: node check-model.mjs <model.eml.yaml> [--base <url>] [--write] [--quiet]");
  process.exit(2);
}

/**
 * `--base` takes a URL or a directory. A *relative* directory has to become a
 * `file:` URL first — `fetch` and a bare `import()` both reject
 * `guide/model-yaml.js` with "Failed to parse URL", which reads as the site
 * being unreachable when the file is sitting right there.
 */
function asBase(value) {
  const withSlash = value.endsWith("/") ? value : value + "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(withSlash)) return withSlash;
  return pathToFileURL(resolve(withSlash) + "/").href;
}

/**
 * Local first: a `--base` the caller named, this script's own directory, the
 * working directory, `./guide/`. An agent in a sandbox with no egress can put
 * `model-yaml.js` beside the model and get a real run with a real report.
 */
async function loadModule() {
  const base = option("--base");
  if (base) return importFrom(asBase(base));

  const here = dirname(fileURLToPath(import.meta.url));
  for (const dir of [here, process.cwd(), join(process.cwd(), "guide")]) {
    if (existsSync(join(dir, MODULE))) {
      return { where: join(dir, "/"), language: await import(pathToFileURL(join(dir, MODULE)).href) };
    }
  }
  for (const [index, published] of PUBLISHED.entries()) {
    const loaded = await importFrom(published, { fatal: index === PUBLISHED.length - 1 });
    if (loaded) return loaded;
  }
  return undefined;
}

/**
 * Bun and Deno import a URL directly. Node removed network imports, so the
 * bytes are fetched and written into a temp directory before importing — the
 * same bytes either way.
 */
async function importFrom(base, { fatal = true } = {}) {
  try {
    return { where: base, language: await import(base + MODULE) };
  } catch {
    /* Node: fetch, then import from disk. */
  }
  /*
   * A blocked network fails in two shapes and they are handled alike: a refused
   * connection or a DNS failure *throws*; an egress proxy *answers*, with 403,
   * 407 or 502. Both end in the same place — say what to do instead.
   */
  let failure;
  let response;
  try {
    response = await fetch(base + MODULE);
    if (!response.ok) failure = `${response.status} ${response.statusText}`;
  } catch (error) {
    failure = String(error?.message || error);
  }
  if (failure) {
    if (!fatal) return undefined;
    console.error(
      `could not load ${base}${MODULE}: ${failure}\n\n` +
        "The published module could not be reached — usually no egress from this\n" +
        "environment rather than anything wrong with the site. It does NOT mean the\n" +
        "model is valid, and it is not a reason to stop:\n\n" +
        "  1. put model-yaml.js next to the model, or in this directory, and run this\n" +
        "     script again — it prefers a local copy and needs no network;\n" +
        "  2. or pass --base <directory> naming where that file is;\n" +
        "  3. or, if neither is possible, deliver the model and state plainly that it\n" +
        "     is unvalidated and why. Never report counts you did not obtain."
    );
    process.exit(2);
  }
  const dir = mkdtempSync(join(tmpdir(), "eml-"));
  writeFileSync(join(dir, MODULE), await response.text());
  return { where: base, language: await import(pathToFileURL(join(dir, MODULE)).href) };
}

const { where, language } = await loadModule();
const { validate, fix, LANGUAGE_VERSION } = language;

const path = resolve(file);
let original;
try {
  original = readFileSync(path, "utf8");
} catch (error) {
  console.error(`could not read ${path}: ${error.code === "ENOENT" ? "no such file" : error.message}`);
  process.exit(2);
}

const count = (diagnostics) => ({
  errors: diagnostics.filter((d) => d.severity === "error").length,
  warnings: diagnostics.filter((d) => d.severity === "warning").length,
  infos: diagnostics.filter((d) => d.severity === "info").length,
});

/* The three passes: repair what is repairable, then validate the repaired bytes twice. */
const repaired = fix(original);
let model = repaired.text;
let result = { ok: repaired.ok, diagnostics: repaired.diagnostics };
const passes = [{ label: "fix", counts: count(result.diagnostics), applied: repaired.applied.length }];
for (let pass = 2; pass <= 3 && result.ok; pass++) {
  result = validate(model);
  passes.push({ label: `validate ${pass - 1}`, counts: count(result.diagnostics) });
}

const quiet = flag("--quiet");
const counts = count(result.diagnostics);
const verdict =
  `${result.ok ? "OK" : "FAILED"} — ${counts.errors} error${counts.errors === 1 ? "" : "s"}, ` +
  `${counts.warnings} warning${counts.warnings === 1 ? "" : "s"}, ` +
  `${counts.infos} note${counts.infos === 1 ? "" : "s"} (EML ${LANGUAGE_VERSION})`;

if (!quiet) {
  console.log(`\nmodel   ${path}`);
  console.log(`reader  ${where}${MODULE} · EML ${LANGUAGE_VERSION}`);
  for (const p of passes) {
    const c = p.counts;
    const extra = p.applied ? ` · ${p.applied} repair${p.applied === 1 ? "" : "s"}` : "";
    console.log(`  ${p.label.padEnd(11)} ${c.errors} errors, ${c.warnings} warnings, ${c.infos} notes${extra}`);
  }
  if (repaired.applied.length) {
    console.log("\nrepaired:");
    for (const a of repaired.applied) console.log(`  ${a.code}  ${a.description}`);
  }
  if (result.diagnostics.length) console.log();
  for (const d of result.diagnostics) {
    const tag = d.severity === "error" ? "error" : d.severity === "warning" ? "warn " : "info ";
    console.log(`${tag} ${d.code}:${d.line}:${d.column}  ${d.message}`);
    if (d.hint) console.log(`      → ${d.hint}`);
  }
  console.log();
}

if (flag("--write") && model !== original) {
  writeFileSync(path, model);
  if (!quiet) console.log(`wrote the repaired document back to ${path}\n`);
}

/* The verdict is the last line, whatever else ran: whoever reads a run reads
   its final line, and it must be the outcome rather than the last finding. */
console.log(verdict);
process.exit(result.ok ? 0 : 1);
