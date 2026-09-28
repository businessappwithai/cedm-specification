#!/usr/bin/env node
/**
 * audit-model.mjs — score a delivered model (`*.eml.yaml`) against the
 * authoring checklist.
 *
 *   curl -sO https://www.appwithai.org/guide/audit-model.mjs
 *   node audit-model.mjs my-business.eml.yaml
 *
 * `check-model.mjs` beside this file answers one question: would the generator
 * refuse this model. This one answers the other: **is the model actually
 * finished.** They are different questions, and the gap between them is the
 * reason this file is published rather than kept as a repository script.
 *
 * A model can report 0 errors and 0 warnings and still be missing half the
 * language. Nothing in the schema or the checker requires a model to *have* a
 * state machine, a saga, a hook, a rule action or an `rbac` entry — a document
 * with one entity is a valid model. Nothing requires help on every column
 * rather than most of them, and a reference column that forgot `fk: true` is
 * a warning the generator proceeds past, having quietly downgraded a lookup to a
 * text box. Each of those is a clean report and an application nobody can use.
 *
 * So this runs the mechanical half of the file contract and the checklist in
 * `https://www.appwithai.org/llms-full.txt`: the file's name and shape, the
 * keys, the enum bindings, the state machines, the rules, the sagas, the access
 * rules, help that says something rather than restating a column's own name,
 * line items declared where they belong — and the three validation passes over
 * the file's own bytes, so a clean audit implies a clean check.
 *
 * It is a scorer, not a second checker. Every finding it reads comes from
 * `model-yaml.js` — the same reader `appwithai` runs. A pass here is not a
 * promise that the model says what the business meant; only that nothing in it
 * is mechanically unfinished.
 *
 * Options
 *   --base <url>   where to load model-yaml.js from — a directory works too,
 *                  which is how to run this with no network at all
 *                  (default: this file's own directory, the working directory,
 *                  ./guide/, then https://www.appwithai.org/guide/)
 *   --quiet        print only the score line
 *
 * Exit codes: 0 every check passed · 1 one or more failed · 2 could not run.
 */

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * The loader is the same ladder `check-model.mjs` uses, repeated rather than
 * imported: each runner is meant to be fetched on its own — one `curl`, one
 * `node` — and a shared module would turn one command into two. Change one,
 * change the other; `scripts/check-spec.mjs` asserts both resolve locally first
 * and that neither reaches a code-hosting origin.
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
  console.error("usage: node audit-model.mjs <model.eml.yaml> [--base <url>] [--quiet]");
  process.exit(2);
}

function asBase(value) {
  const withSlash = value.endsWith("/") ? value : value + "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(withSlash)) return withSlash;
  return pathToFileURL(resolve(withSlash) + "/").href;
}

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

async function importFrom(base, { fatal = true } = {}) {
  try {
    return { where: base, language: await import(base + MODULE) };
  } catch {
    /* Node: fetch, then import from disk. */
  }
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
        "model is finished, and it is not a reason to stop:\n\n" +
        "  1. put model-yaml.js next to the model, or in this directory, and run this\n" +
        "     script again — it prefers a local copy and needs no network;\n" +
        "  2. or pass --base <directory> naming where that file is;\n" +
        "  3. or, if neither is possible, walk the checklist in section 10 of\n" +
        "     https://www.appwithai.org/llms-full.txt by hand and say in your delivery\n" +
        "     that you did. Never report a score you did not obtain."
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
let raw;
try {
  raw = readFileSync(path);
} catch (error) {
  console.error(`could not read ${path}: ${error.code === "ENOENT" ? "no such file" : error.message}`);
  process.exit(2);
}

const src = raw.toString("utf8");
const lines = src.split("\n");
const ok = [];
const bad = [];
const notes = [];
const say = (cond, label) => (cond ? ok : bad).push(label);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const read = validate(src);
const doc = read.document ?? {};
const diagnostics = read.diagnostics;
const codes = (list) => diagnostics.filter((d) => list.includes(d.code));

// The file contract
const base = file.split("/").pop();
say(base.endsWith(".eml.yaml"), "name ends .eml.yaml");
say(/^[a-z0-9-]+(\.(erd|flow|rules))?\.eml\.yaml$/.test(base), "name is lower-case and hyphenated");
say(!raw.includes(0), "UTF-8 plain text");
const first = lines.find((l) => l.trim() !== "" && !l.trim().startsWith("#")) ?? "";
say(/^eml:\s*["']?\d/.test(first), `the document opens on its language version, not on prose (${first.trim().slice(0, 40)})`);
const shape = codes(["YAML", "SCHEMA"]);
say(
  read.document !== undefined && shape.length === 0,
  `the file is one YAML document the schema accepts, not prose about a model` +
    (shape.length ? ` — ${shape[0].code}:${shape[0].line}: ${shape[0].message}` : "")
);
say(
  typeof doc.eml === "string" && typeof doc.name === "string" && doc.name.trim() !== "",
  `it declares the language version and the model's name (eml: ${doc.eml ?? "—"}, name: ${doc.name ?? "—"})`
);
const stray = lines
  .map((line, i) => [i + 1, line])
  .filter(([n, line]) => line.startsWith("```") || line.startsWith("<!--") || (n > 1 && /^---\s*$/.test(line)));
say(
  stray.length === 0,
  `no Markdown fences, HTML comments or second documents` +
    (stray.length ? ` — line ${stray[0][0]}: ${stray[0][1].slice(0, 40)}` : "")
);

// The model
const entities = doc.entities ?? [];
const attributes = entities.flatMap((e) => (e.attributes ?? []).map((a) => ({ entity: e.name, ...a })));
say(entities.length > 0, `entities present (${entities.length}: ${entities.map((e) => e.name).join(", ")})`);
const keyless = entities.filter((e) => !(e.attributes ?? []).some((a) => a.pk)).map((e) => e.name);
say(keyless.length === 0, `every entity declares a primary key${keyless.length ? " — missing on " + keyless.slice(0, 4).join(", ") : ""}`);
const fks = attributes.filter((a) => a.fk);
const badFk = fks.filter((a) => !a.name.endsWith("_id")).map((a) => `${a.entity}.${a.name}`);
say(badFk.length === 0, `every foreign key ends _id (${plural(fks.length, "foreign key")})${badFk.length ? " — " + badFk.slice(0, 4).join(", ") : ""}`);
/* The two silent downgrades. Both validate clean, and both leave the generated
   application showing a text box where a lookup or a dropdown belongs. */
const unmarked = attributes
  .filter((a) => a.name !== "id" && /(_id|_by)$/.test(a.name) && !a.fk)
  .map((a) => `${a.entity}.${a.name}`);
say(
  unmarked.length === 0,
  `every reference column carries fk: true — Table Direct, not String${unmarked.length ? " — missing on " + unmarked.slice(0, 4).join(", ") : ""}`
);
const statusCols = attributes.filter((a) => /^(status|state|stage)$/.test(a.name));
const unbound = statusCols.filter((a) => !a.enum).map((a) => `${a.entity}.${a.name}`);
say(
  unbound.length === 0,
  `every status column is bound to an enum — List, not free text${unbound.length ? " — unbound: " + unbound.slice(0, 4).join(", ") : ""}`
);
const enumBound = attributes.filter((a) => a.enum).length;
say(enumBound >= statusCols.length, `status columns bound to enums (${statusCols.length} status columns, ${enumBound} enum bindings)`);
const machines = doc.stateMachines ?? [];
const complete = machines.filter((m) => m.initial && (m.final ?? []).length > 0);
say(
  machines.length > 0 && complete.length === machines.length,
  `${plural(machines.length, "state machine")}, each with an initial state and a final state`
);
const actions = (doc.rules ?? []).reduce((n, r) => n + (r.actions ?? []).length, 0);
say(actions > 0, `rules carry actions (${actions} across ${plural((doc.rules ?? []).length, "rule")})`);
const sagas = doc.sagas ?? [];
const steps = sagas.reduce((n, s) => n + (s.steps ?? []).length, 0);
say(sagas.length > 0 && steps > 0, `sagas declared (${sagas.length}) with ${steps} steps`);
say((doc.rbac ?? []).length > 0, `rbac entries present (${(doc.rbac ?? []).length})`);
say((doc.hooks ?? []).length > 0, `hooks present (${(doc.hooks ?? []).length})`);

/* Help, and whether it says anything. The three passes below already fail on
   the warnings, but only as a count: a reader of this scorer should be told
   that help was audited and what it was audited for. */
{
  const help = codes(["EML151", "EML152", "EML153"]);
  const restated = help.filter((d) => d.code === "EML151").length;
  const missing = help.length - restated;
  const entityHelp = entities.filter((e) => e.help).length;
  const columnHelp = attributes.filter((a) => a.help).length;
  say(
    help.length === 0,
    `help on every entity and every column, none of it restating its own name ` +
      `(${entityHelp} entities, ${columnHelp} columns` +
      (help.length ? `; ${missing} missing, ${restated} restated` : "") +
      ")"
  );
}

/* Line items, and where the dictionary puts them. EML150 is mechanical and
   fails here. EML149 is a judgement the checker cannot make, so it is reported
   rather than scored. */
{
  const onDashboard = codes(["EML150"]);
  const declared = entities.filter((e) => e.parent).length;
  say(
    onDashboard.length === 0,
    `${plural(declared, "line item")} declared, and none of them left on the dashboard` +
      (onDashboard.length ? ` (${onDashboard.length} still in a category)` : "")
  );
  for (const d of codes(["EML149"])) notes.push(`${d.message} (line ${d.line})`);
}

// The handover: the three passes over the file's own bytes
const count = (list) => ({
  errors: list.filter((d) => d.severity === "error").length,
  warnings: list.filter((d) => d.severity === "warning").length,
});
const repaired = fix(src);
const model = repaired.text;
let result = { ok: repaired.ok, diagnostics: repaired.diagnostics };
const passes = [count(result.diagnostics)];
for (let p = 2; p <= 3 && result.ok; p++) {
  result = validate(model);
  passes.push(count(result.diagnostics));
}
say(
  passes.length === 3 && passes.every((c) => c.errors === 0 && c.warnings === 0),
  `three validation passes clean: ${passes.map((c) => `${c.errors}e/${c.warnings}w`).join(" → ")}`
);
say(model === src, "the repaired bytes are the delivered bytes (no repairs were needed)");

if (!flag("--quiet")) {
  console.log(`\nmodel   ${path}`);
  console.log(`reader  ${where}${MODULE} · EML ${LANGUAGE_VERSION}\n`);
  for (const l of ok) console.log("  PASS  " + l);
  for (const l of bad) console.log("  FAIL  " + l);
  if (notes.length) {
    /* Candidates, not faults: whether something is a line item is a question
       about the business, so these are for the author to answer. */
    console.log(
      `\n  ${notes.length === 1 ? "1 entity looks" : `${notes.length} entities look`} like a line item and declare${notes.length === 1 ? "s" : ""} no parent.`
    );
    console.log("  Walk each one and either declare it (parent:) or decide against it:");
    for (const n of notes) console.log("    " + n);
  }
  console.log();
}

/* The score is the last line: whoever reads a run reads its final line. */
console.log(`${ok.length} passed, ${bad.length} failed`);
process.exit(bad.length === 0 ? 0 : 1);
