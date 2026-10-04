/**
 * Loco.rs (Rust) Backend Generator
 *
 * Two-phase generation, mirroring `NestJsBackendGenerator`:
 *  1. Optionally scaffold with `loco new` (skipped by default — see below).
 *  2. Overlay the bundled Handlebars templates.
 *
 * Phase 1 is opt-in for this stack. `loco new` is non-interactive only when
 * `--db`, `--bg` and `--assets` are all supplied (verified against loco-new
 * 1.0), but its output is a generic starter that every template below
 * overwrites anyway, so the default is template-only generation. That keeps
 * generation offline-capable, which is a first-class path in this architecture.
 *
 * Generated from templates in tanstack-astryx-loco/backend/.
 */

import {
  type BusEntity,
  declaredEntityNames,
  type Entity,
  type EntityEnum,
  entityToBusEntity,
  generateEntityDictionary,
  type Relationship,
} from "@appwithai/core/types";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { CompiledHook } from "../../hooks";
import { hooksByEntity } from "../../hooks";
import { buildGeneratedLoggingModule } from "../../logging/generated-spec";
import type { EntityCategory } from "../../model/categories";
import type { CompiledRbac } from "../../rbac";
import { deriveAccess } from "../../rbac/roles";
import type { CompiledReport } from "../../reports";
import type { CompiledRule } from "../../rules";
import { CliExecutor } from "../../utils/cli-executor";
import { buildWorkflowSeedSql, type SagaWorkflow } from "../../workflows/saga";
import type { CompiledWorkflow } from "../../workflows/state-machine";
import { BaseGenerator } from "../base.generator";
import { buildAccessSeedSql } from "./access-seed";
import { buildBusinessSeedSql } from "./business-seed";
import { buildDictionarySeedSql } from "./dictionary-seed";
import {
  appendMissingHandlers,
  buildHookHandlerModule,
  buildHookHandlersMod,
  buildHookRegistry,
  handlerModule,
} from "./hook-handlers";
import { buildReportsSeedSql } from "./reports-seed";
import { buildRulesSeedSql } from "./rules-seed";
import { buildSystemSeedSql, SYSTEM_SETTING_KEYS } from "./system-seed";
import { buildTransitionsSeedSql, statusFieldFor } from "./transitions-seed";

/**
 * The Loco CLI the scaffold runs: the release line `Cargo.toml.hbs` pins for
 * `loco-rs` (`1.2`). The two move together.
 */
const LOCO_CLI_MINOR = 2;
const LOCO_CLI_REQUIREMENT = "^1.2";
const LOCO_CLI_INSTALL = `cargo install loco --version ${LOCO_CLI_REQUIREMENT} --locked`;

/**
 * Step types `services/workflow.rs` dispatches on.
 *
 * Kept in step with the `match` in that template — the language declares
 * `Agent` as well, and nothing in this backend runs it.
 */
const EXECUTABLE_STEP_TYPES = new Set([
  "UpdateEntity",
  "CreateEntity",
  "DeleteEntity",
  "Decision",
  "Formula",
  "REST",
]);

/**
 * Resolve the template directory, handling both dev and bundled environments.
 * Mirrors the resolution order used by the NestJS generator.
 */
function resolveTemplateDir(subpath: string): string {
  // TEMPLATE_DIR names the templates root outright. The browser build sets it
  // to its in-memory volume, where no working directory leads anywhere.
  const configured = process.env.TEMPLATE_DIR;
  if (configured) return path.join(configured, subpath);
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, "packages/generator/templates", subpath),
    path.join(cwd, "templates", subpath),
    path.join(cwd, "../../../packages/generator/templates", subpath),
    path.join(cwd, "../../packages/generator/templates", subpath),
    path.join(__dirname, "../../../templates", subpath),
  ];

  for (const possiblePath of possiblePaths) {
    try {
      if (require("fs").statSync(possiblePath).isDirectory()) {
        return possiblePath;
      }
    } catch {
      // Continue to the next candidate.
    }
  }

  const fallbackPath = path.join(__dirname, "../../../templates", subpath);
  console.error("Template directory not found. Tried paths:");
  for (const p of possiblePaths) {
    console.error(`  - ${p}`);
  }
  console.error(`Using fallback: ${fallbackPath}`);
  return fallbackPath;
}

export interface LocoBackendOptions {
  projectName: string;
  projectVersion: string;
  projectDescription: string;
  port: number;
  frontendPort?: number;
  /**
   * Skip `loco new` and generate from templates alone.
   *
   * Defaults to **false**: scaffolding first is Loco's own documented flow and
   * gives the project whatever the framework considers current — the CI
   * workflow, `.rustfmt.toml`, `AGENTS.md`, the `.gitignore` — none of which
   * this repo should be maintaining a copy of. The templates then overlay the
   * parts that carry real logic.
   *
   * Set it when generating offline or without a `cargo` toolchain. The
   * fallback is not a degraded mode: the templates write every file the
   * backend needs, and generation succeeds either way.
   */
  skipCliScaffold?: boolean;
  /**
   * Enums bound to a column by its `enum` key, with their ids.
   *
   * The dictionary seed needs them to define the list references that
   * `sys_column.sys_reference_id` already points at; without them those columns
   * render as empty dropdowns.
   */
  modelEnums?: EntityEnum[];
  /** Entity categories from the model's `categories`. */
  categories?: EntityCategory[];
  /**
   * The model's sagas, compiled. `seed/workflows.sql` is built from these, so
   * a model written in either syntax seeds the same processes.
   */
  sagas?: SagaWorkflow[];
  /**
   * The model's access rules (`rbac`), compiled.
   *
   * Feeds `seed/access.sql` and the role accounts `seed_access` creates. A
   * model declaring none leaves every operation open, which is what it did
   * before the directive meant anything.
   */
  compiledRbac?: CompiledRbac;
  /** Decision graphs from the model's `rules`, for `seed/rules.sql`. */
  compiledRules?: CompiledRule[];
  /** Questions from the model's `reports`, for `seed/reports.sql` and `/api/reports`. */
  compiledReports?: CompiledReport[];
  /** Status machines from the model's `stateMachines`, for `seed/transitions.sql`. */
  compiledWorkflows?: CompiledWorkflow[];
  /**
   * Lifecycle handlers from the model's `hooks`.
   *
   * Reaches `src/hooks/`, which is what the bus controller calls around every
   * CRUD operation. Without it a declared hook is parsed, documented and then
   * never run.
   */
  compiledHooks?: CompiledHook[];
  /**
   * Which Postgres the generated app will connect to.
   *
   * Both targets use the same driver and the same SQL — Neon is Postgres. The
   * only difference the backend sees is that Neon has no localhost default and
   * requires TLS.
   */
  database?: DatabaseTarget;
}

/** The database targets this stack can emit for. Both are Postgres. */
export type DatabaseTarget = "postgres" | "neon";

/** `src/common/mod.rs`. One line, so it is stated here rather than templated. */
const COMMON_MOD_RS = `//! Cross-cutting pieces the rest of the crate uses.

pub mod http_log;
pub mod logging;
pub mod rate_limit;
`;

/** Template → output path pairs rendered with the full entity context. */
const RENDERED_FILES: Array<{ tpl: string; out: string }> = [
  { tpl: "Cargo.toml.hbs", out: "Cargo.toml" },
  // Shipped so a generated app resolves the graph it was tested against rather
  // than the crates.io index of the day. See the template's own header.
  { tpl: "Cargo.lock.hbs", out: "Cargo.lock" },
  { tpl: ".cargo/config.toml.hbs", out: ".cargo/config.toml" },
  // The scaffold does not write one, and both the README and the CLI's own
  // "next steps" told the developer to copy a file that was never there.
  { tpl: ".env.example.hbs", out: ".env.example" },
  { tpl: "Dockerfile.hbs", out: "Dockerfile" },
  { tpl: "config/development.yaml.hbs", out: "config/development.yaml" },
  { tpl: "config/test.yaml.hbs", out: "config/test.yaml" },
  { tpl: "config/production.yaml.hbs", out: "config/production.yaml" },

  { tpl: "migration/Cargo.toml.hbs", out: "migration/Cargo.toml" },
  { tpl: "migration/src/lib.rs.hbs", out: "migration/src/lib.rs" },
  { tpl: "migration/src/m0000_auth_users.rs.hbs", out: "migration/src/m0000_auth_users.rs" },
  { tpl: "migration/src/m0001_sys_tables.rs.hbs", out: "migration/src/m0001_sys_tables.rs" },
  { tpl: "migration/src/m0002_bus_tables.rs.hbs", out: "migration/src/m0002_bus_tables.rs" },
  {
    tpl: "migration/src/m0003_workflow_support.rs.hbs",
    out: "migration/src/m0003_workflow_support.rs",
  },
  {
    tpl: "migration/src/m0004_workflow_definitions.rs.hbs",
    out: "migration/src/m0004_workflow_definitions.rs",
  },
  { tpl: "migration/src/m0005_sys_category.rs.hbs", out: "migration/src/m0005_sys_category.rs" },
  { tpl: "migration/src/m0006_audit_log.rs.hbs", out: "migration/src/m0006_audit_log.rs" },
  {
    tpl: "migration/src/m0007_audit_hash_chain.rs.hbs",
    out: "migration/src/m0007_audit_hash_chain.rs",
  },
  {
    tpl: "migration/src/m0008_model_managed_workflows.rs.hbs",
    out: "migration/src/m0008_model_managed_workflows.rs",
  },
  {
    tpl: "migration/src/m0009_sys_access_control.rs.hbs",
    out: "migration/src/m0009_sys_access_control.rs",
  },
  {
    tpl: "migration/src/m0010_dictionary_role_scope.rs.hbs",
    out: "migration/src/m0010_dictionary_role_scope.rs",
  },
  {
    tpl: "migration/src/m0011_sys_report_designs.rs.hbs",
    out: "migration/src/m0011_sys_report_designs.rs",
  },
  {
    tpl: "migration/src/m0012_sys_note.rs.hbs",
    out: "migration/src/m0012_sys_note.rs",
  },
  {
    tpl: "migration/src/m0013_workflow_definition_source.rs.hbs",
    out: "migration/src/m0013_workflow_definition_source.rs",
  },
  {
    tpl: "migration/src/m0014_sys_system.rs.hbs",
    out: "migration/src/m0014_sys_system.rs",
  },
  {
    tpl: "migration/src/m0015_sys_report.rs.hbs",
    out: "migration/src/m0015_sys_report.rs",
  },
  {
    tpl: "migration/src/m0016_sys_window_icon.rs.hbs",
    out: "migration/src/m0016_sys_window_icon.rs",
  },
  {
    tpl: "migration/src/m0017_workflow_definition_yaml.rs.hbs",
    out: "migration/src/m0017_workflow_definition_yaml.rs",
  },
  {
    tpl: "migration/src/m0018_sys_column_ref_table.rs.hbs",
    out: "migration/src/m0018_sys_column_ref_table.rs",
  },
  {
    tpl: "migration/src/m0019_sys_column_narrowed_by.rs.hbs",
    out: "migration/src/m0019_sys_column_narrowed_by.rs",
  },
  {
    tpl: "migration/src/m0020_workflow_states_and_concurrency.rs.hbs",
    out: "migration/src/m0020_workflow_states_and_concurrency.rs",
  },

  { tpl: "src/lib.rs.hbs", out: "src/lib.rs" },
  { tpl: "src/bin/main.rs.hbs", out: "src/bin/main.rs" },
  { tpl: "src/app.rs.hbs", out: "src/app.rs" },
  { tpl: "src/errors.rs.hbs", out: "src/errors.rs" },
  { tpl: "src/openapi.rs.hbs", out: "src/openapi.rs" },
  { tpl: "src/controllers/mod.rs.hbs", out: "src/controllers/mod.rs" },
  { tpl: "src/controllers/auth.rs.hbs", out: "src/controllers/auth.rs" },
  { tpl: "src/controllers/bus.rs.hbs", out: "src/controllers/bus.rs" },
  { tpl: "src/controllers/sys.rs.hbs", out: "src/controllers/sys.rs" },
  { tpl: "src/controllers/audit.rs.hbs", out: "src/controllers/audit.rs" },
  { tpl: "src/controllers/electric.rs.hbs", out: "src/controllers/electric.rs" },
  { tpl: "src/controllers/workflow.rs.hbs", out: "src/controllers/workflow.rs" },
  { tpl: "src/controllers/me.rs.hbs", out: "src/controllers/me.rs" },
  { tpl: "src/controllers/jobs.rs.hbs", out: "src/controllers/jobs.rs" },
  { tpl: "src/controllers/records.rs.hbs", out: "src/controllers/records.rs" },
  { tpl: "src/controllers/report.rs.hbs", out: "src/controllers/report.rs" },
  { tpl: "src/controllers/rules.rs.hbs", out: "src/controllers/rules.rs" },
  { tpl: "src/controllers/ai.rs.hbs", out: "src/controllers/ai.rs" },
  { tpl: "src/services/mod.rs.hbs", out: "src/services/mod.rs" },
  { tpl: "src/services/dictionary.rs.hbs", out: "src/services/dictionary.rs" },
  { tpl: "src/services/dynamic_repo.rs.hbs", out: "src/services/dynamic_repo.rs" },
  { tpl: "src/services/row_json.rs.hbs", out: "src/services/row_json.rs" },
  { tpl: "src/services/field_meta.rs.hbs", out: "src/services/field_meta.rs" },
  // Integration tests. One cargo test binary (`tests/app.rs`) with shared
  // `support` and `requests` modules — see the header comment there for why it
  // is one binary rather than a file per suite.
  { tpl: "tests/app.rs.hbs", out: "tests/app.rs" },
  { tpl: "tests/support/mod.rs.hbs", out: "tests/support/mod.rs" },
  { tpl: "tests/support/entities.rs.hbs", out: "tests/support/entities.rs" },
  { tpl: "tests/support/factory.rs.hbs", out: "tests/support/factory.rs" },
  { tpl: "tests/requests/mod.rs.hbs", out: "tests/requests/mod.rs" },
  { tpl: "tests/requests/health.rs.hbs", out: "tests/requests/health.rs" },
  { tpl: "tests/requests/auth.rs.hbs", out: "tests/requests/auth.rs" },
  { tpl: "tests/requests/dictionary.rs.hbs", out: "tests/requests/dictionary.rs" },
  { tpl: "tests/requests/openapi.rs.hbs", out: "tests/requests/openapi.rs" },
  { tpl: "tests/requests/model_rules.rs.hbs", out: "tests/requests/model_rules.rs" },
  { tpl: "tests/requests/model_transitions.rs.hbs", out: "tests/requests/model_transitions.rs" },
  { tpl: "tests/requests/concurrency.rs.hbs", out: "tests/requests/concurrency.rs" },
  { tpl: "tests/requests/permissions.rs.hbs", out: "tests/requests/permissions.rs" },
  { tpl: "tests/requests/rate_limit.rs.hbs", out: "tests/requests/rate_limit.rs" },
  { tpl: "tests/requests/ai.rs.hbs", out: "tests/requests/ai.rs" },
  { tpl: "tests/requests/jobs.rs.hbs", out: "tests/requests/jobs.rs" },
  { tpl: "tests/requests/records.rs.hbs", out: "tests/requests/records.rs" },
  { tpl: "tests/requests/rbac.rs.hbs", out: "tests/requests/rbac.rs" },
  { tpl: "tests/requests/workflow.rs.hbs", out: "tests/requests/workflow.rs" },
  { tpl: "tests/requests/rules_workflow.rs.hbs", out: "tests/requests/rules_workflow.rs" },
  { tpl: "tests/requests/saga_execution.rs.hbs", out: "tests/requests/saga_execution.rs" },
  { tpl: "tests/requests/http_log.rs.hbs", out: "tests/requests/http_log.rs" },
  { tpl: "tests/requests/system_config.rs.hbs", out: "tests/requests/system_config.rs" },
  { tpl: "tests/requests/reports.rs.hbs", out: "tests/requests/reports.rs" },
  { tpl: "src/services/rules_engine.rs.hbs", out: "src/services/rules_engine.rs" },
  { tpl: "src/common/http_log.rs.hbs", out: "src/common/http_log.rs" },
  { tpl: "src/common/rate_limit.rs.hbs", out: "src/common/rate_limit.rs" },
  { tpl: "src/services/system_config.rs.hbs", out: "src/services/system_config.rs" },
  { tpl: "src/services/audit.rs.hbs", out: "src/services/audit.rs" },
  { tpl: "src/services/concurrency.rs.hbs", out: "src/services/concurrency.rs" },
  { tpl: "src/services/authz.rs.hbs", out: "src/services/authz.rs" },
  { tpl: "src/services/nl_query.rs.hbs", out: "src/services/nl_query.rs" },
  { tpl: "src/services/promotion.rs.hbs", out: "src/services/promotion.rs" },
  { tpl: "src/services/workflow.rs.hbs", out: "src/services/workflow.rs" },
  { tpl: "src/models/mod.rs.hbs", out: "src/models/mod.rs" },
  { tpl: "src/models/_entities/mod.rs.hbs", out: "src/models/_entities/mod.rs" },
  { tpl: "src/models/_entities/users.rs.hbs", out: "src/models/_entities/users.rs" },
  { tpl: "src/models/users.rs.hbs", out: "src/models/users.rs" },
  { tpl: "src/tasks/mod.rs.hbs", out: "src/tasks/mod.rs" },
  { tpl: "src/tasks/seed_dictionary.rs.hbs", out: "src/tasks/seed_dictionary.rs" },
  { tpl: "src/tasks/seed_rules.rs.hbs", out: "src/tasks/seed_rules.rs" },
  { tpl: "src/tasks/seed_system.rs.hbs", out: "src/tasks/seed_system.rs" },
  { tpl: "src/tasks/seed_business.rs.hbs", out: "src/tasks/seed_business.rs" },
  { tpl: "src/tasks/seed_reports.rs.hbs", out: "src/tasks/seed_reports.rs" },
  { tpl: "src/tasks/seed_workflows.rs.hbs", out: "src/tasks/seed_workflows.rs" },
  { tpl: "src/tasks/seed_access.rs.hbs", out: "src/tasks/seed_access.rs" },
  { tpl: "src/tasks/ensure_admin.rs.hbs", out: "src/tasks/ensure_admin.rs" },
  { tpl: "src/workers/mod.rs.hbs", out: "src/workers/mod.rs" },
  { tpl: "src/workers/email.rs.hbs", out: "src/workers/email.rs" },
  { tpl: "src/workers/report.rs.hbs", out: "src/workers/report.rs" },
  { tpl: "src/workers/sync.rs.hbs", out: "src/workers/sync.rs" },
];

/** Directories created up front so template writes never race on mkdir. */
const DIRECTORIES = [
  ".cargo",
  "config",
  "seed",
  "migration/src",
  "migration/sql",
  "src/bin",
  // The event catalogue and the request log live here. Listed rather than left
  // to the writer that creates it: `RENDERED_FILES` writes into it first, and
  // a directory created afterwards only works on an output that already exists.
  "src/common",
  "src/controllers",
  "src/services",
  "src/models/_entities",
  "src/tasks",
  "src/workers",
  "tests/requests",
  "tests/support",
];

export class LocoBackendGenerator extends BaseGenerator {
  private options: LocoBackendOptions;
  private resolvedTemplateDir: string;

  constructor(options: LocoBackendOptions) {
    const templateDir = resolveTemplateDir("tanstack-astryx-loco/backend");
    super(templateDir);
    this.options = options;
    this.resolvedTemplateDir = templateDir;
  }

  async generate(
    entities: Entity[],
    relationships: Relationship[],
    outputDir: string
  ): Promise<void> {
    if (this.options.skipCliScaffold === true) {
      console.log("\n📦 Phase 1: Skipping CLI scaffold (template-only mode)");
      await fs.mkdir(outputDir, { recursive: true });
    } else {
      console.log("\n📦 Phase 1: Scaffolding Loco project...");
      await this.scaffoldLocoProject(outputDir);
      await this.pruneScaffold(outputDir);
    }

    console.log("\n🎨 Phase 2: Overlaying Rust templates...");
    const context = this.prepareContext(entities, relationships);

    for (const dir of DIRECTORIES) {
      await fs.mkdir(path.join(outputDir, dir), { recursive: true });
    }

    for (const { tpl, out } of RENDERED_FILES) {
      const content = await this.renderTemplate(tpl, context);
      await fs.writeFile(path.join(outputDir, out), content);
    }

    // The static `sys_*` DDL is copied byte for byte rather than rendered —
    // it is extracted from the TypeScript migrations and must not be
    // reinterpreted by Handlebars on the way through.
    await this.writeLoggingModule(outputDir);
    await this.copyMigrationSql(outputDir);
    await this.writePerEntityTests(outputDir, entities, context);
    await this.writeBusEntities(outputDir, entities, context);
    await this.writeHookHandlers(outputDir);

    // The dictionary seed is SQL for the same reason the migrations are, and
    // it is written before `cargo fmt` runs only because both write into the
    // crate — nothing formats `.sql`.
    await this.writeDictionarySeed(entities, relationships, outputDir);

    // Handlebars block helpers leave whitespace that rustfmt cares about and
    // humans should not have to hand-tune inside a template. Formatting the
    // output is the Rust counterpart to the Prettier/Biome pass the TypeScript
    // stack runs.
    await this.formatRustSources(outputDir);

    console.log("\n✅ Loco backend generation complete!");
  }

  /** Run `cargo fmt` over the generated crate. Best-effort: never fatal. */
  private async formatRustSources(outputDir: string): Promise<void> {
    if (!CliExecutor.isCommandAvailable("cargo")) {
      console.log("  Cargo not found — skipping `cargo fmt` on the generated sources");
      return;
    }
    try {
      await CliExecutor.executeAsync("cargo", ["fmt"], {
        cwd: outputDir,
        stdio: "pipe",
        timeout: 120000,
      });
      console.log("  ✓ Formatted Rust sources with cargo fmt");
    } catch (error) {
      console.warn(`  ⚠️  cargo fmt skipped: ${(error as Error).message.split("\n")[0]}`);
    }
  }

  /**
   * Phase 1: scaffold with `loco new`.
   *
   * Failure is non-fatal by design, exactly as with `nest new`: the templates
   * write every file the backend needs.
   */
  private async scaffoldLocoProject(outputDir: string): Promise<void> {
    // `loco` is what this step runs, so `loco` is what it has to check for.
    // Checking `cargo` instead meant a machine with a Rust toolchain and no
    // Loco CLI took the "scaffolding complete" path all the way to a spawn
    // failure, and reported the miss as an ordinary command error.
    // An older CLI is replaced, not used: the scaffold is where the framework's
    // own defaults come from, and they have to be the release the templates pin.
    if (!this.hasCurrentLocoCli()) {
      await this.installLocoCli();
    }

    const projectName = path.basename(outputDir);

    // `loco new` refuses to write into a path that already exists, so it cannot
    // be pointed at the output directory on a regeneration — and regenerating
    // over an existing project is the normal case, not the exotic one. It runs
    // in a scratch directory instead and its output is copied across, which
    // makes the scaffold phase idempotent: every run picks up whatever the
    // framework currently considers a default, first time and every time after.
    const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), "appwithai-loco-"));

    try {
      // Supplying --db, --bg and --assets together is what makes `loco new`
      // non-interactive; without all three it prompts for a template.
      await CliExecutor.executeAsync(
        "loco",
        [
          "new",
          "-n",
          projectName,
          "--db",
          "postgres",
          "--bg",
          "async",
          "--assets",
          "none",
          "--allow-in-git-repo",
        ],
        { cwd: stagingRoot, stdio: "inherit", timeout: 300000 }
      );

      await fs.mkdir(outputDir, { recursive: true });
      await fs.cp(path.join(stagingRoot, projectName), outputDir, {
        recursive: true,
        force: true,
      });
      console.log("  ✅ Loco scaffolding complete");
    } catch (error) {
      throw new Error(
        `\`loco new\` failed: ${(error as Error).message.split("\n")[0]}\n` +
          "  The scaffold is where the framework's own current defaults come from — its CI\n" +
          "  workflow, .rustfmt.toml, AGENTS.md, .gitignore — so a backend built without it\n" +
          "  is missing files this repo deliberately does not keep copies of.\n" +
          "  Pass --skip-cli-scaffold to generate from templates alone (offline builds)."
      );
    } finally {
      // Best effort: a scratch directory left behind is untidy, not broken.
      await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Whether the `loco` on PATH is the release line the templates pin.
   *
   * `loco --version` prints `loco <semver>`; anything else — an older line, a
   * 2.x, or output that names no version — counts as not current, because a
   * scaffold from another release brings that release's CI workflow and
   * defaults beside a backend compiled against this one.
   */
  private hasCurrentLocoCli(): boolean {
    if (!CliExecutor.isCommandAvailable("loco")) return false;
    const match = CliExecutor.getCommandVersion("loco")?.match(/(\d+)\.(\d+)\.\d+/);
    return Boolean(match) && Number(match?.[1]) === 1 && Number(match?.[2]) >= LOCO_CLI_MINOR;
  }

  /**
   * Install the Loco CLI on demand, at the release line the templates pin.
   *
   * `cargo install loco --version ^1.2 --locked` is a one-line fix that a
   * developer would otherwise have to be told to run, and the scaffold cannot
   * proceed without it. It replaces an older `loco` already on PATH. It is a
   * compile, so it is announced rather than done silently, and a failure names
   * the command to run by hand.
   */
  private async installLocoCli(): Promise<void> {
    if (!CliExecutor.isCommandAvailable("cargo")) {
      throw new Error(
        "Neither `loco` nor `cargo` is on PATH. Install a Rust toolchain " +
          "(https://rustup.rs) — the generated backend is a cargo crate and needs one anyway."
      );
    }

    console.log(`  📥 Loco CLI ${LOCO_CLI_REQUIREMENT} not found — installing it with \`${LOCO_CLI_INSTALL}\`…`);
    try {
      await CliExecutor.executeAsync("cargo", LOCO_CLI_INSTALL.split(" ").slice(1), {
        stdio: "inherit",
        timeout: 900000,
      });
    } catch (error) {
      throw new Error(
        `\`${LOCO_CLI_INSTALL}\` failed: ${(error as Error).message.split("\n")[0]}\n` +
          "  Install it by hand, or pass --skip-cli-scaffold to generate from templates alone."
      );
    }
  }

  /**
   * Emit `seed/dictionary.sql` — the Application Dictionary rows.
   *
   * ERD entity names are translated to physical `bus_*` table names here, the
   * same way the NestJS category seed does it, because `sys_table` is matched
   * on `table_name`. The match is case-insensitive: a model may write
   * `Compound` as the entity and `compound` in a category's entity list.
   */
  private async writeDictionarySeed(
    entities: Entity[],
    relationships: Relationship[],
    outputDir: string
  ): Promise<void> {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const tableByName = new Map(
      busEntities.map((entity) => [entity.name.toLowerCase(), entity.tableName])
    );

    const categories = (this.options.categories ?? []).map((category) => ({
      name: category.name,
      code: category.code,
      description: category.description,
      icon: category.icon,
      color: category.color,
      seqNo: category.seqNo,
      isDefault: category.isDefault,
      tables: category.entities
        .map((entityName) => tableByName.get(entityName.toLowerCase()))
        .filter((tableName): tableName is string => !!tableName),
    }));

    const sql = buildDictionarySeedSql({
      projectName: this.options.projectName,
      entities: busEntities,
      categories,
      modelEnums: this.options.modelEnums,
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/dictionary.sql"), sql);
    console.log(`  ✓ Wrote seed/dictionary.sql (${busEntities.length} entities)`);

    await this.writeWorkflowSeed(outputDir, entities);
    await this.writeRulesSeed(outputDir);
    await this.writeTransitionsSeed(outputDir, entities);
    await this.writeAccessSeed(outputDir, entities);
    await this.writeSystemSeed(outputDir);
    await this.writeBusinessSeed(outputDir, busEntities, relationships);
    await this.writeReportsSeed(outputDir, busEntities);
  }

  /**
   * Emit `src/common/logging.rs` — the event catalogue, as a macro.
   *
   * Derived from the canonical log specification rather than rendered from a
   * template: a template would be a second copy of the catalogue, and two
   * copies of a catalogue drift. See `logging/generated-spec.ts`.
   */
  private async writeLoggingModule(outputDir: string): Promise<void> {
    const dir = path.join(outputDir, "src/common");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "mod.rs"), COMMON_MOD_RS);
    await fs.writeFile(
      path.join(dir, "logging.rs"),
      buildGeneratedLoggingModule(this.options.projectName)
    );
  }

  /**
   * Emit `seed/business.sql` — demonstration records for the model's entities.
   *
   * Always written, for the same reason every other seed is: `seed_business.rs`
   * embeds it with `include_str!`, resolved at compile time.
   */
  private async writeBusinessSeed(
    outputDir: string,
    entities: BusEntity[],
    relationships: Relationship[]
  ): Promise<void> {
    const sql = buildBusinessSeedSql({
      projectName: this.options.projectName,
      entities,
      relationships: relationships.map((relationship) => ({
        sourceEntity: relationship.sourceEntity,
        targetEntity: relationship.targetEntity,
        cardinality: relationship.cardinality,
      })),
      workflows: this.options.compiledWorkflows,
      modelEnums: this.options.modelEnums,
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/business.sql"), sql);
    console.log(`  ✓ Wrote seed/business.sql (${entities.length} entities)`);
  }

  /**
   * Emit `seed/system.sql` — the settings an operator may change at run time.
   *
   * Always written, for the same reason every other seed is: `seed_system.rs`
   * embeds it with `include_str!`, resolved at compile time, so an app whose
   * seed file is missing does not compile rather than starting without it.
   */
  private async writeSystemSeed(outputDir: string): Promise<void> {
    const sql = buildSystemSeedSql({
      projectName: this.options.projectName,
      projectDescription: this.options.projectDescription,
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/system.sql"), sql);
    console.log(`  ✓ Wrote seed/system.sql (${SYSTEM_SETTING_KEYS.length} settable key(s))`);
  }

  /**
   * Emit `seed/reports.sql` — the questions the model's `reports` declared.
   *
   * Always written, for the same reason every other seed is: `seed_reports.rs`
   * embeds it with `include_str!`, resolved at compile time, so a model with no
   * report would otherwise produce a backend that does not compile — and
   * the parity gate could not see it, because both generators would skip it.
   *
   * The entity → table resolution happens here rather than in the generated
   * application, for the same reason the transitions seed resolves its status
   * column here: this is the only place holding both the model's names and the
   * names the schema ended up with.
   */
  private async writeReportsSeed(outputDir: string, busEntities: BusEntity[]): Promise<void> {
    const reports = this.options.compiledReports ?? [];
    const tableForEntity = new Map(
      busEntities.map((entity) => [entity.name, entity.tableName] as const)
    );
    const sql = buildReportsSeedSql({
      projectName: this.options.projectName,
      reports,
      tableForEntity,
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/reports.sql"), sql);
    console.log(
      reports.length === 0
        ? "  ✓ Wrote seed/reports.sql (no reports declared)"
        : `  ✓ Wrote seed/reports.sql (${reports.length} report(s))`
    );
  }

  /**
   * Emit `seed/rules.sql` — the decision graphs the model's `rules` compile to.
   *
   * Always written, for the same reason every other seed is: `seed_rules.rs`
   * embeds it with `include_str!`, resolved at compile time, so a model with no
   * rule would otherwise produce a backend that does not compile — and the
   * parity gate could not see it, because both generators would skip it.
   */
  private async writeRulesSeed(outputDir: string): Promise<void> {
    const rules = this.options.compiledRules ?? [];
    const sql = buildRulesSeedSql({ projectName: this.options.projectName, rules });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/rules.sql"), sql);
    console.log(
      rules.length === 0
        ? "  ✓ Wrote seed/rules.sql (no rules declared)"
        : `  ✓ Wrote seed/rules.sql (${rules.length} rule(s))`
    );
  }

  /**
   * Entity table name → its column names, for resolving each machine's status
   * column. Built once and shared by the transitions and access seeds, because
   * a rule naming a different column from the edge it guards is inert.
   */
  private columnsByTable(entities: Entity[]): Map<string, string[]> {
    return new Map(
      entities
        .map((entity) => entityToBusEntity(entity, declaredEntityNames(entities)))
        .map((entity) => [
          entity.tableName,
          entity.attributes.map((attribute) => attribute.columnName ?? attribute.name),
        ])
    );
  }

  /**
   * Emit `seed/transitions.sql` — the moves the model's state machines draw.
   *
   * Always written, for the same reason every other seed is: `seed_workflows.rs`
   * embeds it with `include_str!`, resolved at compile time.
   */
  private async writeTransitionsSeed(outputDir: string, entities: Entity[]): Promise<void> {
    const workflows = this.options.compiledWorkflows ?? [];
    const sql = buildTransitionsSeedSql({
      projectName: this.options.projectName,
      workflows,
      columnsByTable: this.columnsByTable(entities),
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/transitions.sql"), sql);

    const edges = workflows.reduce((total, workflow) => total + workflow.transitions.length, 0);
    console.log(
      edges === 0
        ? "  ✓ Wrote seed/transitions.sql (no state machines declared)"
        : `  ✓ Wrote seed/transitions.sql (${workflows.length} machine(s), ${edges} edge(s))`
    );
  }

  /**
   * Emit `seed/access.sql` — the roles and restrictions the model's `rbac` declared.
   *
   * Always written, even for a model with no access rules, and that is not
   * tidiness: `src/tasks/seed_access.rs` embeds it with `include_str!`, which
   * is resolved at compile time. A generator that skipped the file would
   * produce a backend that does not compile, and the parity gate could not see
   * it — both generators would skip it and still match.
   */
  private async writeAccessSeed(outputDir: string, entities: Entity[]): Promise<void> {
    const rbac = this.options.compiledRbac ?? { operations: [], transitions: [] };
    const sql = buildAccessSeedSql({
      projectName: this.options.projectName,
      rbac,
      columnsByTable: this.columnsByTable(entities),
      // The roles need somewhere to go: without a `sys_access` grant the first
      // authorisation gate refuses them every entity, reads included.
      entities: entities
        .map((entity) => entityToBusEntity(entity, declaredEntityNames(entities)))
        .map((entity) => ({
          name: entity.name,
          tableName: entity.tableName,
          windowOwner: entity.windowOwner,
        })),
    });

    await fs.mkdir(path.join(outputDir, "seed"), { recursive: true });
    await fs.writeFile(path.join(outputDir, "seed/access.sql"), sql);

    const rules = rbac.operations.reduce((total, rule) => total + rule.roles.length, 0);
    const edges = rbac.transitions.reduce(
      (total, rule) => total + rule.edges.length * rule.roles.length,
      0
    );
    console.log(
      rules + edges === 0
        ? "  ✓ Wrote seed/access.sql (no access rules declared)"
        : `  ✓ Wrote seed/access.sql (${rules} operation rule(s), ${edges} transition rule(s))`
    );
  }

  /**
   * Emit `seed/workflows.sql` — the model's `kind: saga` workflows as BPMN.
   *
   * Always written, even with no sagas, so `cargo loco db seed` has a stable
   * file to apply and a model that removes its last saga does not leave the
   * previous generation's file behind.
   */
  private async writeWorkflowSeed(outputDir: string, entities: Entity[]): Promise<void> {
    // A copy: entity names are rewritten to tables below, and the compiled
    // model belongs to the caller.
    const workflows: SagaWorkflow[] = structuredClone(this.options.sagas ?? []);

    // A saga names its entity the way the ERD does — `DeviationReport` — but
    // everything downstream resolves physical tables. Normalising here rather
    // than at run time keeps the stored definition in the same vocabulary as
    // the dictionary the executor looks the entity up in.
    const tableByName = new Map(
      entities
        .map((entity) => entityToBusEntity(entity, declaredEntityNames(entities)))
        .map((entity) => [entity.name.toLowerCase(), entity.tableName])
    );
    for (const workflow of workflows) {
      const table = tableByName.get(workflow.entity.toLowerCase());
      if (table) {
        workflow.entity = table;
      } else if (workflow.entity) {
        console.warn(`  ⚠️  saga ${workflow.name}: entity "${workflow.entity}" is not in the model`);
      }
    }

    // The language declares more step types than this backend executes. An
    // unimplemented one is skipped at run time with only a log line, so a saga
    // that leans on it appears to succeed while doing nothing. Say so at
    // generation time, where the author is still looking.
    for (const workflow of workflows) {
      for (const step of workflow.steps) {
        if (!EXECUTABLE_STEP_TYPES.has(step.nodeType)) {
          console.warn(
            `  ⚠️  saga ${workflow.name}.${step.nodeId}: "${step.nodeType}" steps are declared by EML but the Loco backend has no executor for them — this step will be skipped at run time.`
          );
        }
      }
    }

    const seed = buildWorkflowSeedSql(workflows, this.options.projectName);
    await fs.writeFile(path.join(outputDir, "seed/workflows.sql"), seed);

    const steps = workflows.reduce((total, workflow) => total + workflow.steps.length, 0);
    console.log(
      workflows.length === 0
        ? "  ✓ Wrote seed/workflows.sql (no sagas declared)"
        : `  ✓ Wrote seed/workflows.sql (${workflows.length} saga(s), ${steps} steps)`
    );
  }

  /**
   * Remove what `loco new` emits that this architecture replaces.
   *
   * The scaffold is a full starter app: a users migration, mailers with Tera
   * templates, DTOs, fixtures, a playground example. Those are good defaults
   * for a hand-written Loco app and wrong here — this backend is
   * dictionary-driven, its auth migration is `m0000_auth_users`, and it sends
   * no mail. Left in place they would compile (or fail to) alongside the real
   * files and confuse anyone reading the output.
   *
   * Files the templates overwrite outright are not listed: `app.rs`,
   * `controllers/*`, `models/*` and the rest are replaced by name a moment
   * later, so deleting them first would be busywork.
   */
  private async pruneScaffold(outputDir: string): Promise<void> {
    const remove = [
      // Superseded by `migration/sql/m0000_auth_users.up.sql`, which carries
      // the `sys_user_id` bridge column this one lacks.
      "migration/src/m20220101_000001_users.rs",
      "src/mailers",
      "src/dtos",
      "src/fixtures",
      "src/data",
      "examples",
      // The scaffold's request/model tests exercise the starter's mailers and
      // `users` model, and reference the crate by the name `loco new` gave it
      // — which `Cargo.toml.hbs` then changes. They do not compile against
      // this app and are replaced by the rendered `tests/requests` suite.
      "tests",
    ];

    let removed = 0;
    for (const entry of remove) {
      try {
        await fs.rm(path.join(outputDir, entry), { recursive: true, force: true });
        removed += 1;
      } catch {
        // Absent is the expected case when the scaffold was skipped.
      }
    }
    console.log(`  ✓ Pruned ${removed} scaffold paths this architecture replaces`);
  }

  /**
   * One CRUD module and one rules module per entity.
   *
   * A failure then names the entity that broke rather than collapsing the
   * whole model into a single suite, and adding an entity to the model adds
   * its tests without anyone writing one.
   */
  /**
   * `src/hooks/` — the lifecycle handlers the model's `hooks` declare.
   *
   * Two kinds of file, and the difference is the point:
   *
   * - `handlers/<entity>.rs` holds the bodies, so it is written **once** and
   *   never rewritten. Regenerating a project must not delete an
   *   implementation someone wrote. A hook added to the model later is
   *   appended as a new stub rather than triggering a rewrite.
   * - `mod.rs` and `handlers/mod.rs` are pure wiring and are rewritten every
   *   run, so a newly declared hook is always picked up.
   *
   * Both files are written even for a model with no hooks at all: `lib.rs`
   * declares `pub mod hooks;` and the bus controller calls the dispatchers
   * unconditionally, so a missing module is a crate that does not compile —
   * the same trap as a conditionally emitted seed behind an `include_str!`.
   */
  private async writeHookHandlers(outputDir: string): Promise<void> {
    const hooks = this.options.compiledHooks ?? [];
    const grouped = hooksByEntity(hooks);
    const entities = [...grouped.keys()].sort();

    const hooksDir = path.join(outputDir, "src/hooks");
    const handlersDir = path.join(hooksDir, "handlers");
    await fs.mkdir(handlersDir, { recursive: true });

    for (const entity of entities) {
      const forEntity = grouped.get(entity) ?? [];
      const file = path.join(handlersDir, `${handlerModule(entity)}.rs`);

      let existing: string | null = null;
      try {
        existing = await fs.readFile(file, "utf-8");
      } catch {
        // No handler module yet — write the stubs.
      }

      if (existing === null) {
        await fs.writeFile(file, buildHookHandlerModule(entity, forEntity));
        continue;
      }

      const appended = appendMissingHandlers(entity, forEntity, existing);
      if (appended !== null) await fs.writeFile(file, appended);
    }

    await fs.writeFile(path.join(handlersDir, "mod.rs"), buildHookHandlersMod(entities));
    await fs.writeFile(path.join(hooksDir, "mod.rs"), buildHookRegistry(hooks));

    console.log(
      hooks.length === 0
        ? "  ✓ src/hooks/ (no hooks declared)"
        : `  ✓ src/hooks/ — ${hooks.length} handler(s) across ${entities.length} entity(ies)`
    );
  }

  private async writePerEntityTests(
    outputDir: string,
    entities: Entity[],
    context: Record<string, unknown>
  ): Promise<void> {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));

    for (const entity of busEntities) {
      // The module name has to match what `tests/requests/mod.rs` declares,
      // which is why both derive it the same way from the table name.
      const slug = entity.tableName.replace(/^bus_/, "").replace(/[^a-z0-9]+/gi, "_");
      const entityContext = { ...context, entity };

      const crud = await this.renderTemplate("tests/requests/crud_entity.rs.hbs", entityContext);
      await fs.writeFile(path.join(outputDir, "tests/requests", `crud_${slug}.rs`), crud);

      const rules = await this.renderTemplate("tests/requests/rules_entity.rs.hbs", entityContext);
      await fs.writeFile(path.join(outputDir, "tests/requests", `rules_${slug}.rs`), rules);
    }

    // Counted from the file list, not a literal. It read `+ 6` while seven
    // fixed suites are rendered, so every run reported one fewer suite than it
    // wrote.
    const fixedSuites = RENDERED_FILES.filter(
      ({ out }) => out.startsWith("tests/requests/") && out !== "tests/requests/mod.rs"
    ).length;
    console.log(`  ✓ tests/ — ${busEntities.length * 2 + fixedSuites} request suites`);
  }

  /**
   * `src/models/_entities/bus_*.rs` — one SeaORM entity per business table.
   *
   * Rewritten on every run, unlike `src/hooks/handlers/`: there is nothing of
   * the developer's in these files. They are derived from the model, so a
   * column added to the ERD has to show up here, and anything hand-edited would
   * be describing a table that no longer exists.
   *
   * Named after the table rather than the entity so the module, the file and
   * the `table_name` attribute all read the same — `bus_customer` three times,
   * with nothing to keep in sync by convention.
   */
  private async writeBusEntities(
    outputDir: string,
    entities: Entity[],
    context: Record<string, unknown>
  ): Promise<void> {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));

    for (const entity of busEntities) {
      const rendered = await this.renderTemplate("src/models/_entities/bus_entity.rs.hbs", {
        ...context,
        entity,
      });
      await fs.writeFile(
        path.join(outputDir, "src/models/_entities", `${entity.tableName}.rs`),
        rendered
      );
    }

    console.log(`  ✓ src/models/_entities/ — ${busEntities.length} bus entity(ies)`);
  }

  private async copyMigrationSql(outputDir: string): Promise<void> {
    const sourceDir = path.join(this.resolvedTemplateDir, "migration/sql");
    const targetDir = path.join(outputDir, "migration/sql");
    const entries = await fs.readdir(sourceDir);
    for (const entry of entries) {
      if (entry.endsWith(".sql")) {
        await fs.copyFile(path.join(sourceDir, entry), path.join(targetDir, entry));
      }
    }
  }

  private prepareContext(
    entities: Entity[],
    relationships: Relationship[]
  ): Record<string, unknown> {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const dictionaryEntries = entities.map((entity) => generateEntityDictionary(entity));
    const sysTables = dictionaryEntries.map((entry) => entry.dictionaryPlaceholders.table);

    const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const projectKebab = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const frontendPort = this.options.frontendPort ?? this.options.port + 1;
    const databaseTarget: DatabaseTarget = this.options.database ?? "postgres";

    return {
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
        id: projectKebab,
        snake: projectSnake,
      },
      config: {
        port: this.options.port,
        frontendPort,
        corsOrigin: `http://localhost:${frontendPort}`,
        dbUser: process.env.USER || process.env.USERNAME || "postgres",
      },
      // Loco's own convention, and the one `config/development.yaml` bakes in
      // as the `DATABASE_URL` default. Anything that has to name the database
      // — `.env.example`, the README, `createdb` — reads it from here so the
      // three cannot drift apart.
      //
      // `target` distinguishes a database we can reach on localhost from one we
      // cannot. Neon speaks the same wire protocol and uses the same driver, so
      // nothing else in the backend changes; what changes is that there is no
      // sensible localhost default to fall back to, and TLS is mandatory. The
      // templates branch on `isNeon` for exactly those two things.
      database: {
        name: `${projectSnake}_development`,
        testName: `${projectSnake}_test`,
        target: databaseTarget,
        isNeon: databaseTarget === "neon",
      },
      projectName: this.options.projectName,
      projectSnake,
      projectKebab,
      entities: busEntities,
      relationships,
      sysTables,
      categories: this.options.categories ?? [],
      /* The names of the model's `reports`, in order, for
         `tests/requests/reports.rs` to assert against. The query is deliberately
         not carried here: the seed is the only place it belongs, and a second
         copy compiled into the test binary would drift from the row being run. */
      reports: (this.options.compiledReports ?? []).map((report) => ({
        name: report.name,
      })),
      /* The model's own rules, for `tests/requests/model_rules.rs` to assert
         against. The JDM is deliberately not carried here — the seed is the
         only place it belongs, and a second copy in the test binary would be a
         second copy to drift. */
      compiledRules: (this.options.compiledRules ?? []).map((rule) => ({
        name: rule.name,
        entity: rule.entity,
        tableName: rule.tableName,
        event: rule.event,
        operation: rule.operation,
        priority: rule.priority,
      })),
      /* The model's state machines, for `tests/requests/model_transitions.rs`.
         `statusField` is resolved here rather than in the template because the
         seed resolves it here too — a suite asserting against a different
         column from the one the edge was recorded on would pass while the
         guard matched nothing. */
      compiledWorkflows: (this.options.compiledWorkflows ?? []).map((workflow) => ({
        name: workflow.name,
        entity: workflow.entity,
        tableName: workflow.tableName,
        statusField: statusFieldFor(workflow.tableName, this.columnsByTable(entities)),
        initial: workflow.initial ?? "",
        transitions: workflow.transitions,
        states: workflow.states,
        final: workflow.terminal,
      })),
      /* The roles the model named, one account per role, and how many entities
         each may read — the same derivation the seed writer uses, so the
         accounts `seed_access` creates and the rules it installs cannot
         disagree about which roles exist. */
      access: deriveAccess(this.options.compiledRbac ?? { operations: [], transitions: [] }, {
        projectId: projectKebab,
        entities: busEntities.map((entity) => entity.name),
      }),
      now: new Date().toISOString(),
    };
  }
}

export default LocoBackendGenerator;
