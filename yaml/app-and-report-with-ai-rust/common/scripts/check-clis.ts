#!/usr/bin/env bun
/**
 * Generate the same model through both of APPWITHAI's command-line interfaces
 * and assert each produced the application it claims to.
 *
 * There are two, and `check-stacks.ts` exercises neither of them. That script
 * drives `language/cli/eml.ts` — the `eml` CLI, which for the
 * `tanstack-astryx-loco` target loads the generator's pipeline as a library.
 * The two shipped binaries are different entry points with their own argument
 * parsing and their own defaults. Both live in `app-with-ai-rust`, checked out
 * beside this repository, and
 * both read a model as YAML:
 *
 *   appwithai       packages/generator/src/cli/generate.ts, run by bun
 *                   the whole application — a Loco (Rust) backend crate, a
 *                   TanStack Start + Astryx front end, its tests and compose
 *                   file.
 *
 *   appwithai-gen   crates/appwithai-gen, run by cargo
 *                   the Rust rewrite of the generator. It emits the backend
 *                   only (the front end is still TypeScript's, by design), and
 *                   the repository's parity gate (`bun run parity`) holds that
 *                   backend byte for byte to the first CLI's.
 *
 * `--skip-cli-scaffold` on both, deliberately. Without it each CLI shells out
 * to `loco new` — installing it with `cargo install` when absent — for the
 * framework's own CI workflow, rustfmt config and AGENTS.md, none of which the
 * backend needs to compile. `--no-setup` on the first for the same reason as
 * ever: setup installs, migrates and seeds against a database on 127.0.0.1,
 * which is not the question here; `check-reporting-pack.ts` answers that one
 * with a real database.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
/** app-with-ai-rust, beside this repository, where both CLIs ship from. */
const APP_REPO = path.resolve(ROOT, "..", "..", "app-with-ai-rust");
const MODEL = process.env.CHECK_CLIS_MODEL ?? "examples/crm.eml.yaml";

/** `--only <name>` runs one CLI. CI uses it to give each its own job. */
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;

interface Cli {
  /** The name the binary is published under. */
  readonly name: string;
  /** The command and its leading arguments, run from the app repository. */
  readonly command: readonly string[];
  /** Arguments after `generate -i <model> -o <out>`. */
  readonly args: readonly string[];
  /** The fewest files a run may legitimately write. */
  readonly minFiles: number;
  /** What it runs on — printed beside the result, never enforced. */
  readonly runtime: () => string;
  /**
   * Paths that must exist under the output. Each one is the evidence that a
   * particular stage ran, not decoration — see the comment beside it.
   */
  readonly expect: readonly { path: string; why: string }[];
}

const CLIS: readonly Cli[] = [
  {
    name: "appwithai",
    command: ["bun", "packages/generator/src/cli/generate.ts"],
    args: ["-n", "check", "--force", "--no-setup", "--skip-cli-scaffold"],
    minFiles: 200,
    runtime: () => `bun ${Bun.version}`,
    expect: [
      { path: "backend/Cargo.toml", why: "the Loco backend crate" },
      { path: "backend/seed/dictionary.sql", why: "the dictionary every /api/bus route reads" },
      { path: "frontend/src/router.tsx", why: "the TanStack Start frontend" },
      { path: "docker-compose.yml", why: "the way the generated app is run" },
      { path: "model/model.eml.yaml", why: "the model the app answers questions from" },
    ],
  },
  {
    name: "appwithai-gen",
    command: ["cargo", "run", "-q", "-p", "appwithai-gen", "--"],
    args: ["-n", "check", "--force", "--skip-cli-scaffold"],
    minFiles: 100,
    runtime: () => {
      const v = spawnSync("cargo", ["--version"], { encoding: "utf8" });
      return (v.stdout ?? "").trim() || "cargo (version unknown)";
    },
    expect: [
      { path: "backend/Cargo.toml", why: "the same backend crate the other CLI writes" },
      { path: "backend/seed/dictionary.sql", why: "the dictionary, compiled by the Rust port" },
      {
        path: "backend/src/hooks/mod.rs",
        why: "the hook registry the crate will not build without",
      },
    ],
  },
];

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const p = path.join(dir, entry);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

if (!existsSync(path.join(ROOT, MODEL))) {
  console.error(`Model not found: ${MODEL}`);
  process.exit(1);
}
if (!existsSync(path.join(APP_REPO, "node_modules"))) {
  console.error(
    `${APP_REPO} has no node_modules.\n` +
      "Both CLIs ship from it — run `./deps.sh --install` first."
  );
  process.exit(1);
}

let failed = 0;

const selected = only ? CLIS.filter((c) => c.name === only) : CLIS;
if (selected.length === 0) {
  console.error(`No such CLI: ${only}. Known: ${CLIS.map((c) => c.name).join(", ")}`);
  process.exit(2);
}

for (const cli of selected) {
  const out = mkdtempSync(path.join(tmpdir(), `cli-${cli.name}-`));
  const [command, ...leading] = cli.command;
  const run = spawnSync(
    command ?? "",
    [...leading, "generate", "-i", path.join(ROOT, MODEL), "-o", out, ...cli.args],
    { cwd: APP_REPO, encoding: "utf8" }
  );

  if (run.status !== 0) {
    failed++;
    console.error(`  FAIL  ${cli.name} exited ${run.status}`);
    console.error(`${run.stdout ?? ""}${run.stderr ?? ""}`.replace(/^/gm, "        "));
    rmSync(out, { recursive: true, force: true });
    continue;
  }

  const written = countFiles(out);
  const missing = cli.expect.filter((e) => !existsSync(path.join(out, e.path)));
  rmSync(out, { recursive: true, force: true });

  if (written < cli.minFiles) {
    failed++;
    console.error(
      `  FAIL  ${cli.name} wrote ${written} file(s), expected at least ${cli.minFiles}`
    );
    continue;
  }
  if (missing.length > 0) {
    failed++;
    console.error(`  FAIL  ${cli.name} wrote ${written} file(s) but not:`);
    for (const m of missing) console.error(`          ${m.path}  — ${m.why}`);
    continue;
  }
  console.log(
    `  ok    ${cli.name.padEnd(15)} ${String(written).padStart(3)} file(s)  ${cli.runtime()}`
  );
}

if (failed) {
  console.error(`\n${failed} CLI(s) failed.`);
  process.exit(1);
}
console.log(`\n${selected.length === CLIS.length ? "Both CLIs" : selected[0]?.name} generated.`);
