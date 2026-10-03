#!/usr/bin/env bun
/**
 * Generate from a model with every `--stack` the CLI offers, and assert each
 * one wrote something.
 *
 * This exists for the cross-folder imports. `language/` sits at the repository
 * root and two of its modules reach down into `app-with-ai-rust/packages`
 * — the shipped JDM converter and the generation pipeline — deliberately,
 * so the CLI and the modelling tool cannot disagree about what a rule flow
 * compiles to. Nothing type-checks those two paths: `jdm.ts` imports across a
 * project boundary and `tanstack.ts` resolves the pipeline at runtime from
 * a non-literal specifier. Moving either file breaks generation and nothing
 * else, which is exactly how it broke when this folder was first promoted.
 *
 * `tanstack-astryx-loco` is the one that needs `app-with-ai-rust` installed;
 * pass --skip-heavy to run only the two self-contained targets. It generates a
 * Loco (Rust) backend, and this checks what that backend's seeds carry — it
 * does not compile the crate; `build-and-run.yml` builds it in its image.
 *
 * **A file count is not enough, and that is the lesson this file was taught.**
 * `tanstack.ts` used to assemble the generator's inputs by hand instead of
 * driving the shipped pipeline, and everything a model declares beyond its
 * columns — `%%enum`, `%%rbac`, `%%hook`, the state machines, `%%action`,
 * `%%category` — never reached the generator at all. Every target still
 * generated, still built, still ran, and still wrote four hundred files. The
 * seeds were simply empty: no transitions, no roles, no dropdown values. So
 * the heavy target is checked against what the model *declared* — if the
 * document asks for a state machine, the seed that carries transitions has to
 * carry one.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const MODEL = process.env.CHECK_STACKS_MODEL ?? "language/examples/helpdesk.eml.mmd";
const skipHeavy = process.argv.includes("--skip-heavy");

/** Each target, and the fewest files a run of it may legitimately write. */
const TARGETS: { stack: string; minFiles: number; heavy: boolean }[] = [
  { stack: "node-rest", minFiles: 10, heavy: false },
  { stack: "enterprise-reporting", minFiles: 6, heavy: false },
  { stack: "tanstack-astryx-loco", minFiles: 200, heavy: true },
];

/**
 * What the model asks for, and where the generated application has to show it.
 *
 * `declared` reads the model source — untrimmed, because the reference models
 * indent their directives to sit inside the diagram block they annotate, so
 * anchoring at `^%%` undercounts to zero. `carries` reads one generated file
 * and answers whether the construct actually arrived. A construct the model
 * never declares is not checked: `helpdesk.eml.mmd` has no `%%action` and an
 * application generated from it is right to have no authored rules.
 */
/**
 * Every file named here is SQL a Loco task applies (`cargo loco db seed`) or
 * Rust the crate compiles. The seeds are embedded with `include_str!`, so a
 * seed that exists but carries nothing is exactly the hollow case: the crate
 * compiles, seeds, serves — and the model's roles, transitions and dropdowns
 * are simply absent.
 */
const SURFACE: {
  what: string;
  declared: (model: string) => boolean;
  file: string;
  carries: (source: string) => boolean;
}[] = [
  {
    what: "state-machine transitions",
    declared: (model) => /kind:\s*state/.test(model),
    file: "backend/seed/transitions.sql",
    carries: (source) => /INSERT INTO sys_workflow_transitions/.test(source),
  },
  {
    what: "%%enum values as list references",
    declared: (model) => /%%field\s+\S+\s+enum:/.test(model),
    file: "backend/seed/dictionary.sql",
    carries: (source) => /INSERT INTO sys_ref_list/.test(source),
  },
  {
    what: "%%rbac roles",
    declared: (model) => /%%rbac\s/.test(model),
    file: "backend/seed/access.sql",
    carries: (source) => /INSERT INTO sys_role\b/.test(source),
  },
  {
    what: "%%action rules",
    declared: (model) => /%%action\s/.test(model),
    file: "backend/seed/rules.sql",
    carries: (source) => /INSERT INTO sys_rule_definitions/.test(source),
  },
  {
    what: "%%category groups",
    declared: (model) => /%%category\s/.test(model),
    file: "backend/seed/dictionary.sql",
    // A model with no categories still gets the single "General" fallback, so
    // the question is whether anything the model named is there beside it.
    carries: (source) => (source.match(/INSERT INTO sys_category\b/g) ?? []).length > 1,
  },
  {
    what: "%%hook lifecycle handlers",
    declared: (model) => /%%hook\s/.test(model),
    file: "backend/src/hooks/handlers/mod.rs",
    carries: (source) => /\bpub mod \w+;/.test(source),
  },
];

/**
 * Check one generated tree against what its model declared.
 *
 * Returns the failures rather than printing them, so the caller decides how a
 * run reports — and so a missing file reads as "the construct never arrived"
 * rather than as a crash.
 */
function surfaceFailures(outDir: string, modelSource: string): string[] {
  const failures: string[] = [];
  for (const { what, declared, file, carries } of SURFACE) {
    if (!declared(modelSource)) continue;
    let source: string;
    try {
      source = readFileSync(path.join(outDir, file), "utf8");
    } catch {
      failures.push(`the model declares ${what}; ${file} was not written at all`);
      continue;
    }
    if (!carries(source)) {
      failures.push(`the model declares ${what}; ${file} carries none`);
    }
  }
  return failures;
}

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

if (!existsSync(path.join(ROOT, MODEL))) {
  console.error(`Model not found: ${MODEL}`);
  process.exit(1);
}

const modelSource = readFileSync(path.join(ROOT, MODEL), "utf8");

let failed = 0;

for (const { stack, minFiles, heavy } of TARGETS) {
  if (heavy && skipHeavy) {
    console.log(`  skip  ${stack} (--skip-heavy)`);
    continue;
  }

  const out = mkdtempSync(path.join(tmpdir(), `eml-${stack}-`));
  const run = spawnSync(
    "bun",
    ["language/cli/eml.ts", "generate", "-i", MODEL, "-o", out, "--stack", stack, "--force"],
    { cwd: ROOT, encoding: "utf8" }
  );

  if (run.status !== 0) {
    failed++;
    console.error(`  FAIL  ${stack} exited ${run.status}`);
    console.error(`${run.stdout ?? ""}${run.stderr ?? ""}`.replace(/^/gm, "        "));
    rmSync(out, { recursive: true, force: true });
    continue;
  }

  const written = countFiles(out);
  // Only the full stack compiles the behaviour surface: `node-rest` is a
  // datastore over the ERD and `enterprise-reporting` emits, on purpose, only
  // what a new entity needs in a platform that already has the rest.
  const surface = heavy ? surfaceFailures(out, modelSource) : [];
  rmSync(out, { recursive: true, force: true });

  if (written < minFiles) {
    failed++;
    console.error(`  FAIL  ${stack} wrote ${written} file(s), expected at least ${minFiles}`);
  } else if (surface.length) {
    failed++;
    console.error(`  FAIL  ${stack} wrote ${written} file(s) but generated a hollow application:`);
    for (const line of surface) console.error(`          ${line}`);
  } else {
    console.log(`  ok    ${stack.padEnd(21)} ${written} file(s)`);
  }
}

if (failed) {
  console.error(`\n${failed} stack(s) failed.`);
  process.exit(1);
}
console.log("\nAll stacks generated.");
