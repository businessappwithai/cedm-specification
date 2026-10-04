#!/usr/bin/env bun

/**
 * AppWithAI Code Generator CLI
 *
 * Generates full-stack applications from a model: a YAML document, `*.eml.yaml`.
 * One stack is supported: tanstack-astryx-loco (TanStack Start + Astryx on a
 * Loco.rs backend).
 */

import { getLogger } from "@appwithai/core/logging";
import type { Entity, EntityEnum, Relationship } from "@appwithai/core/types";
import { spawnSync } from "child_process";
import { Command } from "commander";
import { promises as fs } from "fs";
import * as path from "path";
import * as readline from "readline";
import { isDeepStrictEqual } from "util";
import type { StackOption } from "../generators/full-stack.generator";
import {
  ASTRYX_THEMES,
  AstryxFrontendGenerator,
  type DatabaseTarget,
  LocoBackendGenerator,
} from "../generators/tanstack-astryx-loco";
import { TanStackStartFrontendGenerator } from "../generators/tanstack-astryx-loco/tanstack-start-frontend.generator";
import {
  cedmOrder,
  raiseModelDocument,
  readCedmModel,
  serializeCedmDocument,
} from "../model-cedm";
import { serializeModelDocument } from "../model-yaml";
import { generateApplication } from "../pipeline";
import { cliLogger } from "../pipeline/logger-port";
import { loadModelFile, validateModelYamlFile } from "./model-input";
import { CliExecutor } from "../utils/cli-executor";

// Resolve relative paths from the workspace root (INIT_CWD) when called via bun --filter
const resolvePath = (p: string) =>
  path.isAbsolute(p) ? p : path.resolve(process.env.INIT_CWD || process.cwd(), p);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function log(msg: string, quiet: boolean) {
  if (!quiet) console.log(msg);
}

function getStackDescription(stack: StackOption): string {
  return stack === "tanstack-astryx-loco"
    ? "tanstack-astryx-loco - Rust Web (TanStack Start + Astryx | Loco.rs)"
    : "tanstack-astryx-loco - Rust Web (TanStack Start + Astryx | Loco.rs)";
}

/**
 * Read a model file and return its entities, relationships and enums. The model
 * is validated first, and one with errors is refused.
 */
async function parseFile(
  filePath: string
): Promise<{ entities: Entity[]; relationships: Relationship[]; enums: EntityEnum[] }> {
  const { model } = await loadModelFile(resolvePath(filePath), { verbose: false });
  return { entities: model.entities, relationships: model.relationships, enums: model.enums };
}

/** Check whether the output directory already contains files. */
async function outputDirHasContent(outputDir: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(outputDir);
    return entries.filter((e) => !e.startsWith(".")).length > 0;
  } catch {
    return false;
  }
}

/**
 * Post-generation setup: install deps, create DB, run migrations + seeds.
 * Copies .env.example → .env if .env does not already exist.
 */
/**
 * Host/port/user flags for `createdb`, derived from the same environment the
 * generated app reads.
 *
 * `DATABASE_URL` wins, then the standard `PG*` variables, then nothing — which
 * leaves `createdb` on its default unix socket, the right answer for a local
 * install.
 */
/**
 * The first line that looks like an error, for a one-line failure report.
 *
 * Cargo puts compilation progress on stderr too, so the whole stream is mostly
 * noise; the useful part is the `Error:` line the app printed.
 */
function firstError(stderr: string | undefined): string {
  if (!stderr) return "no output captured";
  const line = stderr
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^(error|Error:)/.test(l));
  return (line ?? stderr.trim().split("\n").pop() ?? "unknown error").slice(0, 300);
}

/**
 * The database the generated backend will actually connect to.
 *
 * `DATABASE_URL` wins outright — it is the variable the app reads, so creating
 * anything else guarantees a "database does not exist" on the first migration.
 * Otherwise this has to reproduce the default baked into the generated config,
 * and Loco's is `<crate>_development`, not `<crate>`: creating the bare name
 * left `cargo loco db migrate` failing against a database nothing had made.
 */
function resolveDbName(projectName: string, isLoco: boolean): string {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const fromUrl = new URL(url).pathname.replace(/^\//, "");
      if (fromUrl) return fromUrl;
    } catch {
      // Malformed: fall through to the derived name.
    }
  }

  const crate = projectName
    .replace(/-/g, "_")
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();
  return isLoco ? `${crate}_development` : crate;
}

function pgConnectionArgs(): string[] {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      const args: string[] = [];
      if (parsed.hostname) args.push("-h", parsed.hostname);
      if (parsed.port) args.push("-p", parsed.port);
      if (parsed.username) args.push("-U", decodeURIComponent(parsed.username));
      return args;
    } catch {
      // A malformed URL is the app's problem to report, not this step's.
      return [];
    }
  }
  const args: string[] = [];
  if (process.env.PGHOST) args.push("-h", process.env.PGHOST);
  if (process.env.PGPORT) args.push("-p", process.env.PGPORT);
  if (process.env.PGUSER) args.push("-U", process.env.PGUSER);
  return args;
}

async function runSetup(opts: {
  outputDir: string;
  dbType: string;
  projectName: string;
  packageManager: string;
  quiet: boolean;
  /** Which stack was generated — decides how the backend is built and migrated. */
  stackOption?: string;
}) {
  const { outputDir, dbType, packageManager: pm, quiet } = opts;
  // The Loco backend is a cargo crate with no package.json, so none of the
  // `bun run` steps below apply to it. Its migrations run through Loco's own
  // clap CLI instead.
  const isLoco = opts.stackOption === "tanstack-astryx-loco";
  const backendDir = path.join(outputDir, "backend");
  const frontendDir = path.join(outputDir, "frontend");
  const dbName = resolveDbName(opts.projectName, isLoco);

  const run = (cmd: string, args: string[], cwd: string, label: string) => {
    log(`   ${label}…`, quiet);
    const res = spawnSync(cmd, args, { cwd, stdio: quiet ? "pipe" : "inherit", shell: false });
    if (res.status !== 0) {
      const stderr = res.stderr?.toString().trim();
      throw new Error(`${label} failed${stderr ? `: ${stderr}` : ""}`);
    }
  };

  // 1. Install deps (root workspace so both backend + frontend get installed)
  log("\n📦 Installing dependencies…", quiet);
  run(pm, ["install"], outputDir, `${pm} install`);

  // 2. Copy .env.example → .env in backend (skip if already exists)
  const envPath = path.join(backendDir, ".env");
  const envExamplePath = path.join(backendDir, ".env.example");
  try {
    await fs.access(envPath);
  } catch {
    try {
      await fs.copyFile(envExamplePath, envPath);
      log("   ✓ backend/.env created from .env.example", quiet);
    } catch {
      // non-fatal — user can copy manually
    }
  }

  // 3. Create the database if this target is one we can create.
  //
  // `neon` is Postgres and uses the same driver, but its databases are
  // provisioned through Neon's console or API, not by `createdb` against a
  // connection — and there is no local socket to fall back to. Running it
  // anyway produced a warning on every single Neon run, which trains people to
  // ignore the one time it matters.
  if (dbType === "neon") {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "\n   ⚠️  --db neon needs DATABASE_URL set to your Neon connection string" +
          " (it must include ?sslmode=require). Skipping migrate and seed."
      );
      return;
    }
    log("\n🗄️  Neon: using the existing database named by DATABASE_URL", quiet);
  } else if (dbType === "postgres") {
    log(`\n🗄️  Creating database "${dbName}"…`, quiet);
    // `createdb` with no arguments talks to the unix socket, which is the wrong
    // server whenever `DATABASE_URL` names a host — and then the migration
    // fails with "database does not exist" against a server the database was
    // never created on. Point it at the same place the app will connect to.
    const createDb = spawnSync("createdb", [...pgConnectionArgs(), dbName], { stdio: "pipe" });
    if (createDb.status === 0) {
      log(`   ✓ Database "${dbName}" created`, quiet);
    } else {
      const msg = createDb.stderr?.toString() ?? "";
      if (msg.includes("already exists")) {
        log(`   ✓ Database "${dbName}" already exists`, quiet);
      } else {
        // Non-fatal — the target may be a managed database the caller
        // provisions separately.
        console.warn(
          `   ⚠️  createdb: ${msg.trim() || "could not create database (may already exist or need manual setup)"}`
        );
      }
    }
  }

  // 4. Run migrations
  log("\n🔄 Running migrations…", quiet);
  if (isLoco) {
    // `cargo loco db migrate` has to compile the migration crate first, which
    // on a cold dependency tree is minutes. Failing here would leave a
    // perfectly good project looking broken, so this is best-effort and
    // reports the command to run by hand.
    if (!CliExecutor.isCommandAvailable("cargo")) {
      console.warn("   ⚠️  cargo not found — run `cd backend && cargo loco db migrate` yourself");
    } else {
      // Captured rather than inherited so a failure can be reported with its
      // actual cause. The previous version printed a canned "expected on a
      // first run" guess that was wrong every time the real error was
      // something else — the crate compiling fine and the database simply not
      // existing, for one.
      const migrated = spawnSync("cargo", ["loco", "db", "migrate"], {
        cwd: backendDir,
        stdio: "pipe",
        shell: false,
      });
      if (migrated.status === 0) {
        log("   ✓ migrations applied", quiet);
        const seeded = spawnSync("cargo", ["loco", "db", "seed"], {
          cwd: backendDir,
          stdio: "pipe",
          shell: false,
        });
        if (seeded.status === 0) {
          log("   ✓ seeds applied", quiet);
        } else {
          console.warn(`   ⚠️  seed failed: ${firstError(seeded.stderr?.toString())}`);
          console.warn("      Retry with: cd backend && cargo loco db seed");
        }
      } else {
        console.warn(`   ⚠️  migrate failed: ${firstError(migrated.stderr?.toString())}`);
        console.warn("      Retry with: cd backend && cargo loco db migrate");
      }
    }
  } else {
    run(pm, ["run", "migrate"], backendDir, "migrate");

    // 5. Run seeds
    log("\n🌱 Running seeds…", quiet);
    run(pm, ["run", "seed"], backendDir, "seed");
  }

  // 6. Install frontend deps separately if it has its own package.json
  try {
    await fs.access(path.join(frontendDir, "package.json"));
    log("\n📦 Installing frontend dependencies…", quiet);
    run(pm, ["install"], frontendDir, `${pm} install (frontend)`);
  } catch {
    // no separate frontend package.json — already installed at root
  }
}

// ---------------------------------------------------------------------------
// E2E test run (bun:test)
// ---------------------------------------------------------------------------

/**
 * Install the test workspace's dependencies and run the generated suites.
 *
 * The suites start the backend themselves (or attach to one already listening),
 * so this only needs a migrated + seeded database — which `runSetup` has
 * already produced by the time we get here.
 *
 * Returns true when the suites pass, false when they fail, and null when they
 * could not be run at all.
 */
async function runE2ETests(opts: {
  outputDir: string;
  packageManager: string;
  fast: boolean;
  quiet: boolean;
}): Promise<boolean | null> {
  const { outputDir, packageManager: pm, fast, quiet } = opts;
  const testsDir = path.join(outputDir, "tests");

  try {
    await fs.access(path.join(testsDir, "run.ts"));
  } catch {
    console.warn("\n⚠️  No tests/ directory found — skipping the E2E run.");
    return null;
  }

  log("\n📦 Installing test dependencies…", quiet);
  const install = spawnSync(pm, ["install"], {
    cwd: testsDir,
    stdio: quiet ? "pipe" : "inherit",
    shell: false,
  });
  if (install.status !== 0) {
    const stderr = install.stderr?.toString().trim();
    console.error(`\n❌ Installing test dependencies failed${stderr ? `: ${stderr}` : ""}`);
    return false;
  }

  log(`\n🧪 Running E2E tests${fast ? " (fast — no bulk seed)" : ""}…\n`, quiet);
  const run = spawnSync("bun", ["run", "run.ts", ...(fast ? ["--fast"] : [])], {
    cwd: testsDir,
    // Always inherit: a test run the user asked for should stream its output.
    stdio: "inherit",
    shell: false,
  });

  if (run.status === 0) {
    log("\n✅ E2E tests passed", quiet);
    return true;
  }

  console.error(`\n❌ E2E tests failed (exit code ${run.status ?? "unknown"})`);
  return false;
}

// ---------------------------------------------------------------------------
// Model pre-flight
// ---------------------------------------------------------------------------

/**
 * Validate the model before anything is generated from it, printing every
 * finding at its line and column. A model with an error is refused, and the
 * refusal is named as an event as well as thrown: in CI the terminal output is
 * gone once the scrollback is, and the event is what records which model was
 * refused.
 */
async function preflight(modelPath: string, quiet: boolean): Promise<void> {
  log(`\n🔍 Validating ${path.basename(modelPath)}…`, quiet);
  try {
    await validateModelYamlFile(modelPath, { verbose: !quiet });
  } catch (error) {
    getLogger("pipeline").event("pipeline.model.rejected", {
      project: path.basename(modelPath),
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
  log("   ✓ No model errors found.", quiet);
}

// ---------------------------------------------------------------------------
// CLI setup
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name("appwithai")
  .description("Generate full-stack applications from models (.eml.yaml)")
  .version("5.2.0");

// ---------------------------------------------------------------------------
// generate — main full-stack generation command
// ---------------------------------------------------------------------------

program
  .command("generate")
  .description("Generate a full-stack application from a model (.eml.yaml)")
  .requiredOption("-i, --input <file>", "The model: a YAML document (.eml.yaml)")
  // Output
  .requiredOption("-o, --output <dir>", "Output directory")
  .option("--force", "Overwrite existing output directory without prompting")
  .option("--dry-run", "Preview files that would be generated without writing them")
  // Project metadata
  // No default: an omitted name is derived from the output directory below.
  // A fixed default silently renamed a project on every regeneration — the
  // Rust crate, its binary and the `cargo loco` alias are all built from this,
  // so re-running `generate --force` without `-n` used to leave a project whose
  // documented commands no longer worked.
  .option("-n, --name <name>", "Project name (default: the output directory name)")
  .option("-v, --version <version>", "Project version", "1.0.0")
  .option("-d, --description <desc>", "Project description", "Generated application")
  // Stack & database
  .option(
    "-s, --stack <stack>",
    "Stack: tanstack-astryx-loco (the only stack)",
    "tanstack-astryx-loco"
  )
  .option("--db <type>", "Database target: postgres | neon", "postgres")
  .option(
    "--theme <theme>",
    "Astryx theme for tanstack-astryx-loco: neutral | butter | chocolate | matcha | stone | gothic | y2k",
    "neutral"
  )
  // Ports & URLs
  .option("--port <port>", "Backend port", "3000")
  .option("--frontend-port <port>", "Frontend dev-server port (default: backend port + 1)")
  .option("--api-url <url>", "Backend API URL used by the frontend (overrides --port default)")
  .option(
    "--cors-origin <origin>",
    "CORS allowed origin (default: http://localhost:<frontend-port>)"
  )
  // Frontend options
  .option("--dark-mode", "Enable dark mode in the generated frontend")
  // Backend options
  .option("--no-swagger", "Disable Swagger / OpenAPI UI in the backend")
  .option("--no-cors", "Disable CORS in the backend")
  .option(
    "--skip-cli-scaffold",
    "Generate the backend from templates alone, without running `loco new` (offline builds)"
  )
  // Scope
  .option("--skip-frontend", "Generate backend only (shorthand for generate:backend)")
  .option("--skip-backend", "Generate frontend only (shorthand for generate:frontend)")
  // Package manager
  .option("--package-manager <pm>", "Package manager: bun | npm | pnpm | yarn", "bun")
  // Output verbosity
  .option("--verbose", "Print each file as it is written")
  .option("--quiet", "Suppress all non-error output")
  // Post-generation setup
  .option("--no-setup", "Skip automatic install, migrate and seed after generation")
  // End-to-end tests (bun:test)
  .option("--no-tests", "Skip generation of the bun:test E2E suite in tests/")
  .option(
    "--records-per-entity <count>",
    "Records the bulk-seed E2E suite creates per entity",
    "1000"
  )
  .option("--run-tests", "Run the generated E2E suite after setup completes")
  .option("--run-tests-fast", "Run the E2E suite but skip the bulk-seed volume suite")
  .action(async (options) => {
    const quiet: boolean = !!options.quiet;

    if (!quiet) {
      console.log("\n🚀 AppWithAI Code Generator");
      console.log("═══════════════════════════════════════════\n");
    }

    try {
      // ── The model, validated and compiled once ──────────────────────────
      const inputPath = resolvePath(options.input);
      await preflight(inputPath, quiet);
      log(`📄 Reading the model from: ${inputPath}`, quiet);
      const {
        document,
        model,
        text: modelText,
        cedm,
      } = await loadModelFile(inputPath, { verbose: false });
      const allEntities = model.entities;
      const categories = model.categories;
      log(
        `   ✓ ${model.entities.length} entities, ${model.relationships.length} relationships`,
        quiet
      );

      // ── Entity summary ──────────────────────────────────────────────────
      if (!quiet) {
        console.log("\n📊 Entities found:");
        for (const e of allEntities) {
          console.log(`   • ${e.name} (${e.attributes.length} attributes)`);
        }

        console.log(`\n🗂️  Entity categories (${categories.length}):`);
        for (const c of [...categories].sort((a, b) => a.name.localeCompare(b.name))) {
          const flag = c.isDefault ? " (default)" : "";
          console.log(`   • ${c.name}${flag} — ${c.entities.length} entities`);
        }
      }

      // ── Stack validation ────────────────────────────────────────────────
      const stackOption = options.stack as StackOption;
      if (stackOption !== "tanstack-astryx-loco") {
        throw new Error('Invalid stack. The only stack is "tanstack-astryx-loco"');
      }

      // The theme names a real npm package, so a typo must fail here rather
      // than produce a project whose `bun install` cannot resolve a dependency.
      if (stackOption === "tanstack-astryx-loco" && !ASTRYX_THEMES.includes(options.theme)) {
        throw new Error(
          `Invalid theme "${options.theme}". Available: ${ASTRYX_THEMES.join(" | ")}`
        );
      }

      // ── Port / URL resolution ───────────────────────────────────────────
      const backendPort = parseInt(options.port, 10);
      const frontendPort = options.frontendPort
        ? parseInt(options.frontendPort, 10)
        : backendPort + 1;
      const apiUrl = options.apiUrl || `http://localhost:${backendPort}`;
      const corsOrigin = options.corsOrigin || `http://localhost:${frontendPort}`;

      // ── Output directory ────────────────────────────────────────────────
      const outputDir = resolvePath(options.output);

      // The project name defaults to the output directory's name. Regenerating
      // into an existing project without `-n` must not rename it: the Rust
      // crate, its `-cli` binary and the `cargo loco` alias in
      // `.cargo/config.toml` are all derived from this, and a rename leaves a
      // project whose own documented commands fail.
      const projectName = options.name || path.basename(outputDir);

      if (!options.dryRun) {
        const hasContent = await outputDirHasContent(outputDir);
        if (hasContent && !options.force) {
          throw new Error(
            `Output directory "${outputDir}" already contains files.\n` +
              `  Use --force to overwrite, or choose a different --output path.`
          );
        }
        await fs.mkdir(outputDir, { recursive: true });
      }

      // ── Configuration summary ───────────────────────────────────────────
      if (!quiet) {
        console.log("\n⚙️  Generation Configuration:");
        console.log(`   • Stack:            ${getStackDescription(stackOption)}`);
        console.log(`   • Project:          ${projectName} v${options.version}`);
        console.log(`   • Database:         ${options.db}`);
        console.log(`   • Backend port:     ${backendPort}`);
        console.log(`   • Frontend port:    ${frontendPort}`);
        console.log(`   • API URL:          ${apiUrl}`);
        console.log(`   • CORS origin:      ${corsOrigin}`);
        console.log(`   • Dark mode:        ${options.darkMode ? "yes" : "no"}`);
        console.log(`   • Swagger:          ${options.swagger !== false ? "yes" : "no"}`);
        console.log(`   • Package manager:  ${options.packageManager}`);
        console.log(`   • Output:           ${outputDir}`);
        if (options.dryRun) console.log("   • Mode:             DRY RUN (no files written)");
        if (options.skipFrontend) console.log("   • Scope:            backend only");
        if (options.skipBackend) console.log("   • Scope:            frontend only");
      }

      // ── Dry-run: list expected output files from templates ──────────────
      if (options.dryRun) {
        console.log("\n📂 Files that would be generated:\n");
        const templateRoot = path.resolve(
          __dirname,
          stackOption === "tanstack-astryx-loco"
            ? "../../templates/tanstack-astryx-loco"
            : "../../templates/tanstack-astryx-loco"
        );
        await listTemplateFiles(templateRoot, "", options.skipFrontend, options.skipBackend);
        console.log("\n✅ Dry run complete — no files were written.");
        return;
      }

      // ── Generate ────────────────────────────────────────────────────────
      log("\n📦 Generating application...\n", quiet);

      /*
       * Through the pipeline, so the CLI and the web app build the generator's
       * options from one function. It also writes `model/model.eml.yaml` and the
       * manifest.
       */
      await generateApplication({
        // Silent unless the operator set LOG_LEVEL: this command is writing a
        // progress display to a terminal, and JSON through the middle of it
        // helps nobody. See `pipeline/logger-port.ts`.
        logger: cliLogger(getLogger("pipeline")),
        document,
        modelText,
        ...(cedm ? { cedm } : {}),
        model,
        stackOption,
        astryxTheme: options.theme,
        database: options.db as DatabaseTarget,
        projectName,
        projectVersion: options.version,
        projectDescription: options.description,
        outputDir,
        port: backendPort,
        frontendPort,
        apiBaseUrl: apiUrl,
        enableDarkMode: !!options.darkMode,
        skipFrontend: !!options.skipFrontend,
        skipBackend: !!options.skipBackend,
        skipCliScaffold: !!options.skipCliScaffold,
        skipTests: options.tests === false,
        recordsPerEntity: Number(options.recordsPerEntity) || 1000,
        manifest: {
          input: options.input,
          packageManager: options.packageManager,
        },
      });

      // ── Auto-setup (install + migrate + seed) ───────────────────────────
      if (options.setup !== false) {
        log("\n⚙️  Running automatic setup…", quiet);
        await runSetup({
          stackOption,
          outputDir,
          dbType: options.db,
          projectName,
          packageManager: options.packageManager,
          quiet,
        });
      }

      // ── Run E2E tests ───────────────────────────────────────────────────
      // Generation → setup → tests, in that order: the suites sign in as the
      // seeded administrator, so they cannot run before migrate + seed.
      const wantsTests = !!(options.runTests || options.runTestsFast);
      let testsPassed: boolean | null = null;

      if (wantsTests && options.tests === false) {
        console.warn("\n⚠️  --run-tests ignored: test generation was disabled with --no-tests");
      } else if (wantsTests && options.setup === false) {
        console.warn(
          "\n⚠️  --run-tests ignored: the suites need a migrated and seeded database (--no-setup was given)"
        );
      } else if (wantsTests) {
        testsPassed = await runE2ETests({
          outputDir,
          packageManager: options.packageManager,
          fast: !!options.runTestsFast,
          quiet,
        });
      }

      // ── Success ─────────────────────────────────────────────────────────
      if (!quiet) {
        const pm = options.packageManager;
        console.log("\n═══════════════════════════════════════════");
        console.log("✅ Generation complete!\n");
        // A generated project is bilingual: `cargo` owns `backend/`, `bun`
        // owns `frontend/` and `tests/`. These lines used to advise
        // `bun install && bun run db:setup && bun run dev` at the project
        // root, which is the NestJS stack's shape — none of those scripts
        // exist here, so the first thing the CLI told a new user to do failed.
        if (options.setup === false) {
          console.log("Next steps:");
          console.log(`   1. cd ${outputDir}`);
          console.log("   2. cp backend/.env.example backend/.env");
          // The same derivation `runSetup` uses, so the name it prints is the
          // one the migrate step will actually look for.
          console.log(`   3. createdb ${resolveDbName(projectName, true)}`);
          console.log("   4. cd backend && cargo loco db migrate && cargo loco db seed");
          console.log("   5. cargo loco start --server-and-worker");
          console.log(`   6. cd ../frontend && ${pm} install && ${pm} run dev\n`);
          console.log("   Or, instead of 3-6:  docker compose up\n");
        } else {
          console.log(`   App ready in: ${outputDir}`);
          console.log(
            `   Backend:  cd ${outputDir}/backend && cargo loco start --server-and-worker`
          );
          console.log(`   Frontend: cd ${outputDir}/frontend && ${pm} run dev\n`);
          // The values `ensure_admin` falls back to; ADMIN_EMAIL and
          // ADMIN_PASSWORD override them.
          console.log("   Default admin:  admin@admin.com / admin\n");
        }
        if (options.tests !== false) {
          console.log(
            `   Rust suite:     cd ${outputDir}/backend && LOCO_ENV=test cargo test --test app`
          );
          console.log(`   bun suite:      cd ${outputDir}/tests && ${pm} run test`);
          console.log(`                   (test:fast skips the bulk-seed volume suite)\n`);
        }
      }

      if (testsPassed === false) {
        process.exitCode = 1;
      }
    } catch (error: unknown) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// inspect — display a model's entities and relationships without generating
// ---------------------------------------------------------------------------

program
  .command("inspect")
  .description("Display a model's entities, relationships and statistics")
  .argument("<file>", "The model to inspect (.eml.yaml)")
  .option("-f, --format <format>", "Output format: table | json | tree", "table")
  .action(async (file, options) => {
    try {
      const { entities, relationships } = await parseFile(file);

      if (options.format === "json") {
        console.log(JSON.stringify({ entities, relationships }, null, 2));
        return;
      }

      console.log("\n🔍 Model Inspection Report");
      console.log("═══════════════════════════════════════════\n");

      // Entities table
      console.log(`📊 Entities (${entities.length})\n`);
      const header = padRow(["Entity", "Table", "PK", "Attributes", "FKs", "Unique"]);
      console.log(header);
      console.log("─".repeat(header.length));
      for (const e of entities) {
        const fks = e.attributes.filter((a) => a.name.endsWith("_id") && a.name !== "id").length;
        const uniq = e.attributes.filter((a) => a.unique && a.name !== "id").length;
        console.log(
          padRow([
            e.name,
            `bus_${e.tableName}`,
            e.primaryKey ?? "id",
            String(e.attributes.length),
            String(fks),
            String(uniq),
          ])
        );
      }

      // Relationships
      if (relationships.length > 0) {
        console.log(`\n🔗 Relationships (${relationships.length})\n`);
        const relHeader = padRow(["From", "Cardinality", "To", "Via"]);
        console.log(relHeader);
        console.log("─".repeat(relHeader.length));
        for (const r of relationships) {
          console.log(
            padRow([
              r.sourceEntity,
              cardinalityLabel(r.cardinality),
              r.targetEntity,
              r.foreignKey ?? "",
            ])
          );
        }
      }

      // Statistics
      const totalAttrs = entities.reduce((s, e) => s + e.attributes.length, 0);
      const totalFKs = entities.reduce(
        (s, e) => s + e.attributes.filter((a) => a.name.endsWith("_id") && a.name !== "id").length,
        0
      );
      console.log("\n📈 Statistics");
      console.log(`   • Total entities:      ${entities.length}`);
      console.log(`   • Total attributes:    ${totalAttrs}`);
      console.log(`   • Total relationships: ${relationships.length}`);
      console.log(`   • Total FK columns:    ${totalFKs}`);
      console.log(
        `   • Avg attrs/entity:    ${(totalAttrs / Math.max(entities.length, 1)).toFixed(1)}\n`
      );

      if (options.format === "tree") {
        console.log("🌳 Entity Tree\n");
        for (const e of entities) {
          console.log(`  ${e.name}`);
          for (const a of e.attributes) {
            const flags = [
              a.name === e.primaryKey ? "PK" : "",
              a.name.endsWith("_id") && a.name !== "id" ? "FK" : "",
              a.unique && a.name !== "id" ? "UK" : "",
              a.required ? "" : "optional",
            ].filter(Boolean);
            console.log(
              `    ├─ ${a.name} : ${a.type}${flags.length ? ` [${flags.join(", ")}]` : ""}`
            );
          }
        }
        console.log();
      }
    } catch (error: unknown) {
      console.error("❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// generate:entity — add / regenerate a single entity in an existing project
// ---------------------------------------------------------------------------

program
  .command("generate:entity")
  .description(
    "Add or regenerate a single entity from a model into an existing generated project"
  )
  .requiredOption("-i, --input <file>", "The model containing the entity (.eml.yaml)")
  .requiredOption("-e, --entity <name>", "Entity name to generate (PascalCase, e.g. 'Compound')")
  .requiredOption(
    "-o, --output <dir>",
    "Root of the generated project directory (must contain backend/ and/or frontend/)"
  )
  .option("--backend-only", "Generate backend files only (JDM + migration)")
  .option("--frontend-only", "Generate frontend files only (list + detail routes)")
  .option(
    "--backend-dir <dir>",
    "Explicit path to the backend directory (overrides <output>/backend)"
  )
  .option(
    "--frontend-dir <dir>",
    "Explicit path to the frontend directory (overrides <output>/frontend)"
  )
  .option("--force", "Overwrite existing generated files without prompting")
  .option("--dry-run", "Print what would be generated without writing files")
  .option("--quiet", "Suppress non-error output")
  .action(async (options) => {
    const quiet: boolean = !!options.quiet;

    try {
      if (!quiet) {
        console.log("\n🧩 AppWithAI — Generate Single Entity");
        console.log("═══════════════════════════════════════════\n");
      }

      // ── Validate and read the model ──────────────────────────────────────
      await preflight(resolvePath(options.input), quiet);
      const { entities, relationships } = await parseFile(options.input);

      // ── Find the entity ──────────────────────────────────────────────────
      const entityName = options.entity as string;
      const entity = entities.find((e) => e.name.toLowerCase() === entityName.toLowerCase());
      if (!entity) {
        const available = entities.map((e) => e.name).join(", ");
        throw new Error(
          `Entity "${entityName}" not found in ${path.basename(options.input)}.\n` +
            `  Available entities: ${available}`
        );
      }

      // ── Resolve project directories ──────────────────────────────────────
      const projectRoot = resolvePath(options.output);
      const backendDir = options.backendDir
        ? resolvePath(options.backendDir)
        : path.join(projectRoot, "backend");
      const frontendDir = options.frontendDir
        ? resolvePath(options.frontendDir)
        : path.join(projectRoot, "frontend");

      // ── Read project manifest for config ────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let manifest: Record<string, any> = {};
      try {
        const raw = await fs.readFile(path.join(projectRoot, ".appwithai.json"), "utf-8");
        manifest = JSON.parse(raw);
      } catch {
        /* no manifest — use defaults */
      }

      if (!quiet) {
        console.log(`📋 Entity:  ${entity.name}`);
        console.log(`📄 Source:  ${path.basename(options.input)}`);
        console.log(`📁 Project: ${projectRoot}\n`);
      }

      // ── Dry-run: just print what would be generated ──────────────────────
      if (options.dryRun) {
        const snake = entity.name
          .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
          .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
          .toLowerCase();
        const kebab = snake.replace(/_/g, "-");
        const tableName = `bus_${snake}`;
        console.log("📂 Files that would be generated (dry-run):");
        if (!options.frontendOnly) {
          console.log(`  backend/src/modules/rules/jdm/${tableName}.jdm.json`);
          console.log(`  backend/src/migrations/<ts>_add_${snake}.ts`);
        }
        if (!options.backendOnly) {
          console.log(`  frontend/src/routes/${kebab}.tsx`);
          console.log(`  frontend/src/routes/${kebab}.$id.tsx`);
        }
        return;
      }

      // ── Backend ──────────────────────────────────────────────────────────
      if (!options.frontendOnly) {
        let backendExists = false;
        try {
          await fs.access(backendDir);
          backendExists = true;
        } catch {
          /* skip */
        }
        if (backendExists) {
          // The backend is regenerated in full, and that is not a shortcut.
          //
          // This architecture is dictionary-driven: one generic controller
          // serves every table from the `sys_*` metadata, so an entity is not a
          // set of files of its own. It is rows in `seed/dictionary.sql` and a
          // table in `migration/src/m0002_bus_tables.rs` — both whole-file
          // artifacts derived from the whole model. There is no smaller unit to
          // emit, and regeneration is idempotent, so "add this entity" and
          // "regenerate the backend" are the same operation.
          //
          // Until this change the branch called `NestJsBackendGenerator`, a
          // class deleted with the NestJS stack, so the command did not merely
          // fail to type-check: it threw `NestJsBackendGenerator is not
          // defined` at run time, every time.
          if (!quiet) {
            console.log("⚙️  Regenerating the backend from the full model…");
            console.log(
              "   (the dictionary and the bus-table migration describe every entity, " +
                "so they are rewritten as a whole)"
            );
          }
          const { model } = await loadModelFile(resolvePath(options.input), { verbose: false });
          const backendGen = new LocoBackendGenerator({
            projectName: String(manifest.name ?? "my-app"),
            projectVersion: String(manifest.version ?? "1.0.0"),
            projectDescription: String(manifest.description ?? ""),
            port: Number(manifest.backendPort ?? 3000),
            frontendPort: Number(manifest.frontendPort ?? 3001),
            database: (manifest.database ?? "postgres") as DatabaseTarget,
            skipCliScaffold: true,
            sagas: model.sagas,
            categories: model.categories,
          });
          await backendGen.generate(entities, relationships, backendDir);
        } else {
          console.warn(`  ⚠️  backend/ not found at ${backendDir} — skipping backend`);
        }
      }

      // ── Frontend ─────────────────────────────────────────────────────────
      if (!options.backendOnly) {
        let frontendExists = false;
        try {
          await fs.access(frontendDir);
          frontendExists = true;
        } catch {
          /* skip */
        }
        if (frontendExists) {
          if (!quiet) console.log("\n🎨 Generating frontend files…");
          const frontendGen = new TanStackStartFrontendGenerator({
            projectName: String(manifest.name ?? "my-app"),
            projectVersion: String(manifest.version ?? "1.0.0"),
            projectDescription: String(manifest.description ?? ""),
            apiBaseUrl: String(manifest.apiUrl ?? "http://localhost:3000"),
            enableDarkMode: false,
            skipCliScaffold: true,
          });
          await frontendGen.generateSingleEntity(entity, relationships, frontendDir, entities);
        } else {
          console.warn(`  ⚠️  frontend/ not found at ${frontendDir} — skipping frontend`);
        }
      }

      if (!quiet) {
        console.log(`\n✅ Entity "${entity.name}" generated successfully!`);
        console.log(
          // `bun run migrate` was the NestJS instruction. The Loco backend is
          // a cargo crate with no package.json at all, so that command has
          // nothing to run; migrating and reseeding is `cargo loco`, and the
          // seed matters as much as the migration here because the dictionary
          // is what makes the new table reachable through /api/bus/*.
          "   Apply the schema change and refresh the dictionary:\n" +
            `   cd ${path.join(projectRoot, "backend")} && cargo loco db migrate && cargo loco db seed\n`
        );
      }
    } catch (error: unknown) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// validate — check a model against the language
// ---------------------------------------------------------------------------

program
  .command("validate")
  .description(
    "Validate a model (.cedm.yaml or .eml.yaml): YAML, the schema, CEDM imports and lowering, and the language checker"
  )
  .argument("<file>", "The model to validate")
  .option("--strict", "Fail on warnings in addition to errors")
  .action(async (file, options) => {
    try {
      const { diagnostics } = await validateModelYamlFile(resolvePath(file));
      const warnings = diagnostics.filter((d) => d.severity === "warning").length;
      console.log(`\n✅ ${path.basename(file)} is a valid model (${warnings} warning(s)).`);
      if (options.strict && warnings > 0) process.exit(1);
    } catch (error: unknown) {
      console.error("❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// convert — between a CEDM application model and a model document
// ---------------------------------------------------------------------------

program
  .command("convert")
  .description(
    "Convert a model between the two languages: a model document (.eml.yaml) to a CEDM application model (.cedm.yaml), or a CEDM model to the model document it compiles to"
  )
  .argument("<file>", "The model to convert")
  .option("-o, --output <file>", "Where to write it (default: beside the input; `-` for stdout)")
  .option("--force", "Overwrite an existing file")
  .action(async (file, options) => {
    try {
      const inputPath = resolvePath(file);
      const { document, cedm } = await validateModelYamlFile(inputPath, { verbose: false });
      const base = inputPath.replace(/\.(cedm|eml)\.ya?ml$/i, "").replace(/\.ya?ml$/i, "");
      let text: string;
      let output: string;
      if (cedm) {
        text = serializeModelDocument(document);
        output = options.output ?? `${base}.eml.yaml`;
      } else {
        const raised = raiseModelDocument(document);
        const lowered = readCedmModel(serializeCedmDocument(raised), { check: false });
        if (!isDeepStrictEqual(lowered.document, cedmOrder(document))) {
          throw new Error(
            "The CEDM form would not read back as the same model; nothing was written."
          );
        }
        text = serializeCedmDocument(
          raised,
          ` Converted from ${path.basename(inputPath)}.`
        );
        output = options.output ?? `${base}.cedm.yaml`;
      }
      if (output === "-") {
        process.stdout.write(text);
        return;
      }
      const target = resolvePath(output);
      if (!options.force && (await fs.stat(target).catch(() => undefined))) {
        throw new Error(`${output} exists; pass --force to overwrite it.`);
      }
      await fs.writeFile(target, text, "utf-8");
      console.log(`✅ Wrote ${path.relative(process.cwd(), target)}`);
    } catch (error: unknown) {
      console.error("❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// diff — compare two models
// ---------------------------------------------------------------------------

program
  .command("diff")
  .description("Compare two models and report what changed")
  .argument("<from>", "The original model (.eml.yaml)")
  .argument("<to>", "The updated model (.eml.yaml)")
  .option("--no-attributes", "Show only entity-level diffs (skip attribute details)")
  .action(async (fromFile, toFile, options) => {
    try {
      const [fromParsed, toParsed] = await Promise.all([parseFile(fromFile), parseFile(toFile)]);

      const fromMap = new Map(fromParsed.entities.map((e) => [e.name, e]));
      const toMap = new Map(toParsed.entities.map((e) => [e.name, e]));

      const added = [...toMap.keys()].filter((n) => !fromMap.has(n));
      const removed = [...fromMap.keys()].filter((n) => !toMap.has(n));
      const common = [...fromMap.keys()].filter((n) => toMap.has(n));

      console.log("\n🔀 Model Diff");
      console.log("═══════════════════════════════════════════\n");
      console.log(`   From: ${resolvePath(fromFile)}`);
      console.log(`   To:   ${resolvePath(toFile)}\n`);

      if (added.length === 0 && removed.length === 0) {
        let hasAttrChanges = false;
        if (options.attributes) {
          for (const name of common) {
            const attrDiffs = diffAttributes(fromMap.get(name)!, toMap.get(name)!);
            if (attrDiffs.length > 0) {
              hasAttrChanges = true;
              break;
            }
          }
        }
        if (!hasAttrChanges) {
          console.log("✅ No entity changes detected.\n");
        }
      }

      for (const name of added) {
        const e = toMap.get(name)!;
        console.log(`  + [ADDED]   ${name} (${e.attributes.length} attrs)`);
        if (options.attributes) {
          for (const a of e.attributes) console.log(`      + ${a.name}: ${a.type}`);
        }
      }

      for (const name of removed) {
        const e = fromMap.get(name)!;
        console.log(`  - [REMOVED] ${name} (${e.attributes.length} attrs)`);
      }

      for (const name of common) {
        const fromEntity = fromMap.get(name)!;
        const toEntity = toMap.get(name)!;
        if (!options.attributes) continue;
        const attrDiffs = diffAttributes(fromEntity, toEntity);
        if (attrDiffs.length === 0) continue;
        console.log(`  ~ [CHANGED] ${name}`);
        for (const d of attrDiffs) console.log(`    ${d}`);
      }

      // Relationship diffs
      const fromRels = new Set(
        fromParsed.relationships.map((r) => `${r.sourceEntity}->${r.targetEntity}`)
      );
      const toRels = new Set(
        toParsed.relationships.map((r) => `${r.sourceEntity}->${r.targetEntity}`)
      );
      const addedRels = [...toRels].filter((r) => !fromRels.has(r));
      const removedRels = [...fromRels].filter((r) => !toRels.has(r));

      if (addedRels.length > 0 || removedRels.length > 0) {
        console.log("\n  Relationship changes:");
        for (const r of addedRels) console.log(`    + ${r}`);
        for (const r of removedRels) console.log(`    - ${r}`);
      }

      console.log(
        `\n  Summary: +${added.length} added, -${removed.length} removed, ` +
          `~${common.length - (common.length - added.length)} unchanged entities\n`
      );
    } catch (error: unknown) {
      console.error("❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// info — read .appwithai.json manifest from a generated project
// ---------------------------------------------------------------------------

program
  .command("info")
  .description("Show metadata about a previously generated project")
  .argument("<dir>", "Path to a generated project directory")
  .action(async (dir) => {
    try {
      const manifestPath = path.join(resolvePath(dir), ".appwithai.json");
      const raw = await fs.readFile(manifestPath, "utf-8");
      const meta = JSON.parse(raw);

      console.log("\n📋 Generated Project Info");
      console.log("═══════════════════════════════════════════\n");
      console.log(`   Name:          ${meta.name ?? "—"}`);
      console.log(`   Version:       ${meta.version ?? "—"}`);
      console.log(`   Description:   ${meta.description ?? "—"}`);
      console.log(`   Stack:         ${meta.stack ?? "—"}`);
      console.log(`   Database:      ${meta.database ?? "—"}`);
      console.log(`   Backend port:  ${meta.backendPort ?? "—"}`);
      console.log(`   Frontend port: ${meta.frontendPort ?? "—"}`);
      console.log(`   API URL:       ${meta.apiUrl ?? "—"}`);
      console.log(`   Package mgr:   ${meta.packageManager ?? "—"}`);
      console.log(`   Generated at:  ${meta.generatedAt ?? "—"}`);
      if (meta.entities?.length) {
        console.log(`   Entities:      ${(meta.entities as string[]).join(", ")}`);
      }
      if (meta.input) {
        const inp = typeof meta.input === "string" ? meta.input : JSON.stringify(meta.input);
        console.log(`   Input:         ${inp}`);
      }
      console.log();
    } catch {
      console.error(
        `❌ No .appwithai.json found in "${dir}". Was this project generated by appwithai?`
      );
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// generate:backend — backend-only generation
// ---------------------------------------------------------------------------

program
  .command("generate:backend")
  .description("Generate backend only")
  .requiredOption("-i, --input <file>", "The model (.eml.yaml)")
  .requiredOption("-o, --output <dir>", "Output directory")
  .option("-n, --name <name>", "Project name", "my-backend")
  .option("-s, --stack <stack>", "Backend stack: loco (the only stack)", "loco")
  .option("--db <type>", "Database target: postgres | neon", "postgres")
  .option("--port <port>", "Backend port", "3000")
  .option("--no-swagger", "Disable Swagger UI")
  .option("--no-cors", "Disable CORS")
  .option("--cors-origin <origin>", "CORS allowed origin")
  .option("--force", "Overwrite existing output directory")
  .action(async (options) => {
    console.log("\n🚀 Generating Backend...\n");

    try {
      await preflight(resolvePath(options.input), false);
      const { entities, relationships } = await parseFile(options.input);
      const outputDir = resolvePath(options.output);

      const hasContent = await outputDirHasContent(outputDir);
      if (hasContent && !options.force) {
        throw new Error(`Output dir "${outputDir}" already has content. Use --force to overwrite.`);
      }
      await fs.mkdir(outputDir, { recursive: true });

      if (options.stack === "loco") {
        // Swagger and CORS are not flags here: CORS is `middlewares.cors` in
        // config/*.yaml, and Loco has no built-in Swagger UI.
        const generator = new LocoBackendGenerator({
          projectName: options.name,
          projectVersion: "1.0.0",
          projectDescription: "Generated Loco.rs backend",
          port: parseInt(options.port, 10),
        });
        await generator.generate(entities, relationships, outputDir);
      } else {
        throw new Error('Invalid backend stack. The only stack is "loco"');
      }

      console.log(`\n✅ Backend generated at: ${outputDir}\n`);
    } catch (error: unknown) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// generate:frontend — frontend-only generation
// ---------------------------------------------------------------------------

program
  .command("generate:frontend")
  .description("Generate frontend only")
  .requiredOption("-i, --input <file>", "The model (.eml.yaml)")
  .requiredOption("-o, --output <dir>", "Output directory")
  .option("-n, --name <name>", "Project name", "my-frontend")
  .option("-s, --stack <stack>", "Frontend stack: tanstack | astryx", "tanstack")
  .option(
    "--theme <theme>",
    "Astryx theme (astryx stack only): neutral | butter | chocolate | matcha | stone | gothic | y2k",
    "neutral"
  )
  .option("--api-url <url>", "Backend API URL", "http://localhost:3000")
  .option("--dark-mode", "Enable dark mode")
  .option("--force", "Overwrite existing output directory")
  .action(async (options) => {
    console.log("\n🚀 Generating Frontend...\n");

    try {
      await preflight(resolvePath(options.input), false);
      const { entities, relationships } = await parseFile(options.input);
      const outputDir = resolvePath(options.output);

      const hasContent = await outputDirHasContent(outputDir);
      if (hasContent && !options.force) {
        throw new Error(`Output dir "${outputDir}" already has content. Use --force to overwrite.`);
      }
      await fs.mkdir(outputDir, { recursive: true });

      if (options.stack === "tanstack") {
        const generator = new TanStackStartFrontendGenerator({
          projectName: options.name,
          projectVersion: "1.0.0",
          projectDescription: "Generated TanStack Start frontend",
          apiBaseUrl: options.apiUrl,
          enableDarkMode: !!options.darkMode,
        });
        await generator.generate(entities, relationships, outputDir);
      } else if (options.stack === "astryx") {
        if (!ASTRYX_THEMES.includes(options.theme)) {
          throw new Error(
            `Invalid theme "${options.theme}". Available: ${ASTRYX_THEMES.join(" | ")}`
          );
        }
        const generator = new AstryxFrontendGenerator({
          projectName: options.name,
          projectVersion: "1.0.0",
          projectDescription: "Generated TanStack Start + Astryx frontend",
          apiBaseUrl: options.apiUrl,
          enableDarkMode: !!options.darkMode,
          astryxTheme: options.theme,
        });
        await generator.generate(entities, relationships, outputDir);
      } else {
        throw new Error('Invalid frontend stack. Use "tanstack" or "astryx"');
      }

      console.log(`\n✅ Frontend generated at: ${outputDir}\n`);
    } catch (error: unknown) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// wizard — interactive project generation wizard
// ---------------------------------------------------------------------------

program
  .command("wizard")
  .description("Interactive guided project generation wizard")
  .action(async () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (prompt: string): Promise<string> =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log("\n🧙 AppWithAI Project Wizard");
    console.log("═══════════════════════════════════════════\n");

    try {
      const name = (await ask("Project name [my-app]: ")) || "my-app";
      const description =
        (await ask("Description [Generated application]: ")) || "Generated application";
      const inputFile = await ask("Model file path (.eml.yaml): ");
      if (!inputFile) throw new Error("A model file path is required.");
      const outputDir = (await ask("Output directory [./generated]: ")) || "./generated";

      console.log("\nSelect database:");
      console.log("  1. PostgreSQL — self-hosted or managed");
      console.log("  2. Neon — serverless Postgres (same wire protocol, TLS required)");
      const dbChoice = (await ask("Choice [1]: ")) || "1";
      const db = dbChoice === "2" ? "neon" : "postgres";

      const portStr = (await ask("Backend port [3000]: ")) || "3000";
      const port = parseInt(portStr, 10);
      const frontendPortStr = (await ask(`Frontend port [${port + 1}]: `)) || String(port + 1);

      const darkModeInput = (await ask("Enable dark mode? [y/N]: ")).toLowerCase();
      const darkMode = darkModeInput === "y" || darkModeInput === "yes";

      const swaggerInput = (await ask("Enable Swagger UI? [Y/n]: ")).toLowerCase();
      const noSwagger = swaggerInput === "n" || swaggerInput === "no";

      console.log("\nSelect package manager:");
      console.log("  1. bun (recommended)");
      console.log("  2. npm");
      console.log("  3. pnpm");
      console.log("  4. yarn");
      const pmChoice = (await ask("Choice [1]: ")) || "1";
      const pmMap: Record<string, string> = { "1": "bun", "2": "npm", "3": "pnpm", "4": "yarn" };
      const packageManager = pmMap[pmChoice] ?? "bun";

      rl.close();
      console.log("\n📦 Generating project...\n");

      const args = [
        "generate",
        "-i",
        inputFile,
        "-o",
        outputDir,
        "-n",
        name,
        "-d",
        description,
        "--db",
        db,
        "--port",
        portStr,
        "--frontend-port",
        frontendPortStr,
        "--package-manager",
        packageManager,
        "--force",
      ];
      if (darkMode) args.push("--dark-mode");
      if (noSwagger) args.push("--no-swagger");

      await program.parseAsync(["node", "appwithai", ...args]);
    } catch (error: unknown) {
      rl.close();
      console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// list — show available stacks and features
// ---------------------------------------------------------------------------

program
  .command("list")
  .description("List available stacks, themes and options")
  .action(() => {
    console.log("\n📋 AppWithAI — Available Options\n");
    console.log("═══════════════════════════════════════════\n");

    console.log("🔷 Stack\n");

    // The NestJS stack this used to advertise first was deleted along with its
    // generators and templates; `list` kept describing it, so `--stack` offered
    // a value that could not be generated.
    console.log("  tanstack-astryx-loco   Rust Web Stack");
    console.log("    Backend:   Loco.rs 1.2 + Axum + SeaORM/sqlx + PostgreSQL");
    console.log("    Frontend:  TanStack Start v1 + Astryx + TanStack Query/Table");
    console.log("    Auth:      Loco native JWT");
    console.log("    Best for:  Throughput-sensitive APIs, low-footprint deploys");
    console.log("    Note:      Backend builds with cargo, frontend with bun\n");

    console.log("🗄️  Databases\n");
    console.log("  postgres       — Self-hosted or managed PostgreSQL (default)");
    console.log("  neon           — Neon serverless Postgres; same driver, TLS required\n");

    console.log("📦 Package Managers\n");
    console.log("  bun (default), npm, pnpm, yarn\n");

    console.log("🔑 Key Features\n");
    console.log("  • Compiere-style Application Dictionary (sys_ tables)");
    console.log("  • Business entities with bus_ prefix");
    console.log("  • Runtime UI configuration via sys_field.seq_no");
    console.log("  • GoRules JDM decision-table business rules engine");
    console.log("  • Workflow definitions + BPMN executor");
    console.log("  • Audit trail (ImmuDB-backed)");
    console.log("  • Role-based access control (RBAC)");
    console.log("  • ETag-based optimistic concurrency");
    console.log("  • E2E test suite (bun:test) — CRUD, rules, workflows, faker volume data\n");

    console.log("🛠️  CLI Commands\n");
    console.log("  generate          Full-stack generation");
    console.log("  generate:backend  Backend only");
    console.log("  generate:frontend Frontend only");
    console.log("  inspect <file>    Display a model's entities and relationships");
    console.log("  validate <file>   Validate a model against the language");
    console.log("  diff <a> <b>      Compare two models");
    console.log("  info <dir>        Show generated project metadata");
    console.log("  wizard            Interactive guided wizard");
    console.log("  deploy <dir>      Deploy project to Hostinger/VPS via SSH\n");
  });

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function padRow(cols: string[]): string {
  const widths = [22, 26, 8, 12, 6, 8];
  return cols.map((c, i) => c.padEnd(widths[i] ?? 10)).join(" ");
}

function cardinalityLabel(c: string): string {
  const map: Record<string, string> = {
    oneToOne: "one-to-one",
    oneToMany: "one-to-many",
    manyToOne: "many-to-one",
    manyToMany: "many-to-many",
  };
  return map[c] ?? c;
}

function diffAttributes(from: Entity, to: Entity): string[] {
  const fromMap = new Map(from.attributes.map((a) => [a.name, a]));
  const toMap = new Map(to.attributes.map((a) => [a.name, a]));
  const diffs: string[] = [];
  for (const [name, attr] of toMap) {
    if (!fromMap.has(name)) diffs.push(`    + ${name}: ${attr.type}`);
    else if (fromMap.get(name)!.type !== attr.type)
      diffs.push(`    ~ ${name}: ${fromMap.get(name)!.type} → ${attr.type}`);
  }
  for (const name of fromMap.keys()) {
    if (!toMap.has(name)) diffs.push(`    - ${name}`);
  }
  return diffs;
}

async function listTemplateFiles(
  dir: string,
  prefix: string,
  skipFrontend?: boolean,
  skipBackend?: boolean
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (skipFrontend && rel.startsWith("frontend")) continue;
      if (skipBackend && rel.startsWith("backend")) continue;
      if (entry.isDirectory()) {
        console.log(`  📁 ${rel}/`);
        await listTemplateFiles(path.join(dir, entry.name), rel, skipFrontend, skipBackend);
      } else {
        const displayName = entry.name.endsWith(".hbs") ? entry.name.slice(0, -4) : entry.name;
        console.log(`     ${displayName}`);
      }
    }
  } catch {
    // directory may not exist for this stack variant
  }
}

// ---------------------------------------------------------------------------
// deploy — build Docker images and deploy to a remote host via SSH
// ---------------------------------------------------------------------------

program
  .command("deploy <project-dir>")
  .description("Deploy a generated project to a remote host (e.g. Hostinger VPS) via SSH")
  .option("--host <host>", "SSH host (IP or hostname)")
  .option("--user <user>", "SSH username", "root")
  .option("--password <password>", "SSH password")
  .option("--port <port>", "SSH port", "22")
  .option("--remote-dir <dir>", "Remote directory to deploy into", "/opt/appwithai")
  .option("--image-tag <tag>", "Docker image tag", "latest")
  .option("--skip-build", "Skip docker build, only sync files and restart")
  .option(
    "--env-file <file>",
    "Path to .env file to upload (default: <project-dir>/.env.production)"
  )
  .option("--provision-db", "Run migrations and seeds after containers start")
  .option("--migrate-only", "Run migrations only (no seeds) after containers start")
  .action(
    async (
      projectDir: string,
      opts: {
        host?: string;
        user: string;
        password?: string;
        port: string;
        remoteDir: string;
        imageTag: string;
        skipBuild?: boolean;
        envFile?: string;
        provisionDb?: boolean;
        migrateOnly?: boolean;
      }
    ) => {
      const { NodeSSH } = await import("node-ssh");

      const absProjectDir = resolvePath(projectDir);

      // ── Read project manifest ──────────────────────────────────────────────
      const manifestPath = path.join(absProjectDir, ".appwithai.json");
      let manifest: Record<string, unknown>;
      try {
        manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      } catch {
        console.error(`✗ No .appwithai.json found in ${absProjectDir}`);
        console.error("  Run 'appwithai generate' first to create the project.");
        process.exit(1);
      }

      const projectName = String(manifest.name ?? path.basename(absProjectDir));
      const remoteProjectDir = path.posix.join(opts.remoteDir, projectName);

      // ── Prompt for missing credentials ────────────────────────────────────
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const askInput = (q: string) => new Promise<string>((res) => rl.question(q, res));

      if (!opts.host) {
        opts.host = await askInput("SSH host (IP or hostname): ");
      }
      // Only prompt for password if not provided AND no local SSH key exists
      const os2 = await import("os");
      const earlyKeyCheck = [
        path.join(os2.homedir(), ".ssh", "id_ed25519"),
        path.join(os2.homedir(), ".ssh", "id_rsa"),
        path.join(os2.homedir(), ".ssh", "id_ecdsa"),
      ];
      let hasLocalKey = false;
      for (const k of earlyKeyCheck) {
        try {
          await fs.access(k);
          hasLocalKey = true;
          break;
        } catch {
          /* none */
        }
      }

      if (!opts.password && !hasLocalKey) {
        opts.password = await askInput(`SSH password for ${opts.user}@${opts.host}: `);
      }
      rl.close();

      console.log(
        `\n🚀 Deploying ${projectName} → ${opts.user}@${opts.host}:${remoteProjectDir}\n`
      );

      // ── Determine env file ─────────────────────────────────────────────────
      const envFilePath = opts.envFile
        ? resolvePath(opts.envFile)
        : path.join(absProjectDir, ".env.production");
      let hasEnvFile = false;
      try {
        await fs.access(envFilePath);
        hasEnvFile = true;
      } catch {
        // no env file — user must configure env vars on the server
      }

      // ── Connect via SSH ────────────────────────────────────────────────────
      const ssh = new NodeSSH();
      const os = await import("os");
      const sshKeyPaths = [
        path.join(os.homedir(), ".ssh", "id_ed25519"),
        path.join(os.homedir(), ".ssh", "id_rsa"),
        path.join(os.homedir(), ".ssh", "id_ecdsa"),
      ];
      const availableKeys: string[] = [];
      for (const keyPath of sshKeyPaths) {
        try {
          await fs.access(keyPath);
          availableKeys.push(keyPath);
        } catch {
          /* not found */
        }
      }

      try {
        const connectOpts: Record<string, unknown> = {
          host: opts.host,
          username: opts.user,
          port: parseInt(opts.port, 10),
          readyTimeout: 30_000,
          tryKeyboard: false,
        };
        if (opts.password) {
          connectOpts["password"] = opts.password;
        } else if (availableKeys.length > 0) {
          connectOpts["privateKeyPath"] = availableKeys[0];
        } else {
          opts.password = await askInput(`SSH password for ${opts.user}@${opts.host}: `);
          connectOpts["password"] = opts.password;
        }
        await ssh.connect(connectOpts as Parameters<typeof ssh.connect>[0]);
      } catch (err) {
        // Try other available keys before giving up
        let connected = false;
        for (const keyPath of availableKeys.slice(1)) {
          try {
            await ssh.connect({
              host: opts.host!,
              username: opts.user,
              port: parseInt(opts.port, 10),
              privateKeyPath: keyPath,
              readyTimeout: 15_000,
            });
            connected = true;
            break;
          } catch {
            /* try next */
          }
        }
        if (!connected) {
          console.error(`✗ SSH connection failed: ${err instanceof Error ? err.message : err}`);
          process.exit(1);
        }
      }

      console.log(`✓ Connected to ${opts.host}\n`);

      // Helper: run a command on the remote server via SSH
      const sshExec = async (cmd: string, label?: string) => {
        if (label) process.stdout.write(`  ${label}... `);
        const result = await ssh.execCommand(cmd, { cwd: remoteProjectDir });
        if (result.code !== 0) {
          if (label) console.log("✗");
          console.error(`\nRemote command failed on ${opts.host}`);
          if (result.stderr) console.error(result.stderr);
          ssh.dispose();
          process.exit(1);
        }
        if (label) console.log("✓");
        return result.stdout;
      };

      try {
        // ── Ensure remote directory exists ───────────────────────────────────
        await ssh.execCommand(`mkdir -p ${remoteProjectDir}`);

        // ── Upload files via SFTP ────────────────────────────────────────────
        console.log("📦 Uploading project files...");

        const excludes = new Set(["node_modules", "dist", ".output", ".git"]);
        const uploadDir = async (localDir: string, remoteBase: string) => {
          await ssh.execCommand(`mkdir -p ${remoteBase}`);
          const entries = await fs.readdir(localDir, { withFileTypes: true });
          for (const entry of entries) {
            if (excludes.has(entry.name)) continue;
            if (entry.name.startsWith(".") && !entry.name.startsWith(".env")) continue;
            const localPath = path.join(localDir, entry.name);
            const remotePath = path.posix.join(remoteBase, entry.name);
            if (entry.isDirectory()) {
              await uploadDir(localPath, remotePath);
            } else {
              await ssh.putFile(localPath, remotePath);
            }
          }
        };

        await uploadDir(
          path.join(absProjectDir, "backend"),
          path.posix.join(remoteProjectDir, "backend")
        );
        console.log("  ✓ backend/");
        await uploadDir(
          path.join(absProjectDir, "frontend"),
          path.posix.join(remoteProjectDir, "frontend")
        );
        console.log("  ✓ frontend/");

        // Upload root files
        for (const f of [
          ".appwithai.json",
          "package.json",
          "bun.lock",
          "bun.lockb",
          "docker-compose.yml",
        ]) {
          const localFile = path.join(absProjectDir, f);
          try {
            await fs.access(localFile);
            await ssh.putFile(localFile, path.posix.join(remoteProjectDir, f));
          } catch {
            /* optional */
          }
        }

        if (hasEnvFile) {
          await ssh.putFile(envFilePath, path.posix.join(remoteProjectDir, ".env"));
          console.log("  ✓ .env");
        } else {
          console.log("  ⚠  No .env.production found — make sure env vars are set on the server.");
        }

        // ── Ensure Docker is available ───────────────────────────────────────
        console.log("\n🐳 Checking Docker on server...");
        const dockerCheck = await ssh.execCommand("docker --version 2>/dev/null || echo MISSING");
        if (dockerCheck.stdout.includes("MISSING")) {
          console.log("  Installing Docker...");
          await sshExec("curl -fsSL https://get.docker.com | sh", "docker install");
        } else {
          console.log(`  ✓ ${dockerCheck.stdout.trim()}`);
        }

        const composeCheck = await ssh.execCommand(
          "docker compose version 2>/dev/null || echo MISSING"
        );
        if (composeCheck.stdout.includes("MISSING")) {
          await sshExec(
            "apt-get install -y docker-compose-plugin 2>/dev/null || true",
            "compose install"
          );
        } else {
          console.log(`  ✓ ${composeCheck.stdout.trim()}`);
        }

        // ── Build & start containers ─────────────────────────────────────────
        console.log("\n🏗  Building and starting containers...");

        if (!opts.skipBuild) {
          await sshExec("docker compose build --parallel 2>&1", "docker build");
        }

        await sshExec("docker compose up -d --remove-orphans 2>&1", "docker compose up");

        // ── DB provisioning ──────────────────────────────────────────────────
        if (opts.provisionDb || opts.migrateOnly) {
          console.log("\n🗄  Provisioning database...");

          // Wait for postgres to be healthy
          process.stdout.write("  waiting for postgres... ");
          for (let i = 0; i < 30; i++) {
            const check = await ssh.execCommand(
              "docker compose exec -T postgres pg_isready -U ${DB_USER:-app} 2>/dev/null",
              { cwd: remoteProjectDir }
            );
            if (check.code === 0) break;
            await new Promise((r) => setTimeout(r, 2000));
          }
          console.log("✓");

          await sshExec("docker compose exec -T backend bun run migrate 2>&1", "run migrations");

          if (opts.provisionDb && !opts.migrateOnly) {
            await sshExec("docker compose exec -T backend bun run seed 2>&1", "run seeds");
          }
        }

        // ── Show status ──────────────────────────────────────────────────────
        const ps = await ssh.execCommand("docker compose ps --format table 2>&1", {
          cwd: remoteProjectDir,
        });
        console.log("\n📊 Running containers:\n");
        console.log(ps.stdout);

        const backendPort = manifest.backendPort ?? 3001;
        const frontendPort = manifest.frontendPort ?? 3002;
        console.log(`\n✅ ${projectName} deployed successfully!`);
        console.log(`   Frontend: http://${opts.host}:${frontendPort}`);
        console.log(`   Backend:  http://${opts.host}:${backendPort}/api`);
        if (!opts.provisionDb && !opts.migrateOnly) {
          console.log(`\n   Tip: add --provision-db to run migrations and seeds on first deploy.`);
        }
      } finally {
        ssh.dispose();
      }
    }
  );

// ---------------------------------------------------------------------------
program.parse();

export { program };
