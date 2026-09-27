/**
 * `bun run convert:stored-models` — the one-time conversion of an installation
 * that stored its models as Mermaid.
 *
 * Everything is planned before anything is written: the database's models,
 * versions and automations, each project's history, and the legacy library.
 * The plan is reported in full, and it is applied only when nothing in it is
 * blocked — a text that does not convert, an interrupted save, a file someone
 * edited and never committed. Two flags let an operator resolve those
 * explicitly, and each keeps the original in `stored_model_conversions`:
 *
 *   --archive-unconvertible   remove what cannot be converted from where it is stored
 *   --abandon-pending         give up interrupted saves
 *
 * `--dry-run` reports the plan and writes nothing. Running it again after it
 * has succeeded finds nothing to do.
 */

import {
  assertModelFormat,
  getDatabase,
  runMigrations,
  StoredModelFormatError,
} from "@appwithai/core/services";
import {
  applyDatabase,
  type DatabasePlan,
  type Db,
  databaseFailures,
  type Item,
  planDatabase,
} from "./database";
import {
  applyLegacyLibrary,
  applyRepository,
  type LegacyLibraryPlan,
  planLegacyLibrary,
  planRepositories,
  type RepositoryPlan,
} from "./repositories";

export interface ConversionOptions {
  dryRun: boolean;
  archiveUnconvertible: boolean;
  abandonPending: boolean;
  verbose: boolean;
  log: (line: string) => void;
}

export interface ConversionOutcome {
  status: "nothing-to-do" | "planned" | "blocked" | "converted";
  blocking: number;
}

const LABEL: Record<Item["source"], string> = {
  erd_version: "version",
  project_model: "current model",
  automation: "automation",
  hook_flowchart: "service diagram",
  pending_operation: "interrupted save",
  repository: "history file",
  legacy_library: "legacy library entry",
};

function describe(item: Item, verbose: boolean, log: (line: string) => void) {
  const where = `${LABEL[item.source]} ${item.key}${item.projectId ? ` (project ${item.projectId})` : ""}`;
  if (!item.conversion.ok) {
    log(`  ✗ ${where}: ${item.conversion.error.replace(/\n/g, "\n      ")}`);
  } else if (item.retired) {
    if (verbose) log(`  – ${where}: retired — ${item.retired}`);
  } else if (verbose || item.conversion.notes.length) {
    log(
      `  ✓ ${where}${item.conversion.notes.length ? ` — ${item.conversion.notes.length} note(s)` : ""}`
    );
  }
  if (verbose) for (const note of item.conversion.notes) log(`      ${note}`);
}

function summarise(
  plan: DatabasePlan,
  repositories: RepositoryPlan[],
  library: LegacyLibraryPlan | null,
  options: ConversionOptions
) {
  const { log, verbose } = options;
  const items: Item[] = [...plan.pending, ...plan.versions, ...plan.models, ...plan.workflows];
  if (plan.columns.length)
    log(`Database: ${plan.columns.map((c) => `${c.table}.${c.column}`).join(", ")} → YAML columns`);
  for (const [source, label] of Object.entries(LABEL)) {
    const of = items.filter((i) => i.source === source);
    if (!of.length) continue;
    const failed = of.filter((i) => !i.conversion.ok).length;
    log(
      `  ${of.length} ${label}(s): ${of.length - failed} converted${failed ? `, ${failed} not` : ""}`
    );
  }
  for (const item of items) describe(item, verbose, log);
  for (const repository of repositories) {
    const failed = repository.items.filter((i) => !i.conversion.ok).length;
    log(
      `History of ${repository.projectId}: ${Object.values(repository.files).filter((v) => v === null).length} file(s) removed, ` +
        `${Object.values(repository.files).filter((v) => v !== null).length} written${failed ? `, ${failed} not convertible` : ""}`
    );
    for (const name of repository.edited) log(`  ✗ ${name} is edited on disk and not committed`);
    for (const item of repository.items) describe(item, verbose, log);
  }
  if (library) {
    log(
      `Legacy library ${library.directory}: ${library.items.length} entr${library.items.length === 1 ? "y" : "ies"}`
    );
    for (const item of library.items) describe(item, verbose, log);
  }
}

function blockers(
  plan: DatabasePlan,
  repositories: RepositoryPlan[],
  library: LegacyLibraryPlan | null,
  options: ConversionOptions
) {
  const unconvertible = [
    ...databaseFailures(plan).filter((i) => i.source !== "pending_operation"),
    ...repositories.flatMap((r) => r.items.filter((i) => !i.conversion.ok)),
    ...(library?.items.filter((i) => !i.conversion.ok) ?? []),
  ];
  return (
    (options.abandonPending ? 0 : plan.pending.length) +
    (options.archiveUnconvertible ? 0 : unconvertible.length) +
    repositories.reduce((sum, r) => sum + r.edited.length, 0)
  );
}

export async function convertStoredModels(options: ConversionOptions): Promise<ConversionOutcome> {
  const { log } = options;
  // Everything else the schema needs; the only refusal expected here is the
  // one this command exists to clear.
  try {
    await runMigrations();
  } catch (error) {
    if (!(error instanceof StoredModelFormatError)) throw error;
  }
  // The Mermaid-era columns are not in the typed schema; the passes read and
  // write them with raw SQL.
  const typed = getDatabase();
  const db = typed as unknown as Db;

  const plan = await planDatabase(db);
  const pendingModels = new Map(
    plan.models.map((i) => [i.projectId, i.conversion.ok ? i.conversion.yaml : ""])
  );
  const pendingDefinitions = new Map(
    plan.workflows
      .filter((i) => i.source === "automation")
      .map((i) => [i.id, i.conversion.ok ? i.conversion.yaml : null])
  );
  const repositories = await planRepositories(
    db,
    plan.columns.length ? { models: pendingModels, definitions: pendingDefinitions } : undefined
  );
  const library = await planLegacyLibrary(db);

  if (!plan.columns.length && !plan.pending.length && !repositories.length && !library) {
    log("Nothing to convert: models, automations and project histories are YAML.");
    await assertModelFormat(typed);
    return { status: "nothing-to-do", blocking: 0 };
  }

  summarise(plan, repositories, library, options);
  const blocking = blockers(plan, repositories, library, options);
  if (blocking) {
    log(
      `\n${blocking} item(s) block the conversion. Nothing was written. Resolve them, or re-run with ` +
        "--archive-unconvertible / --abandon-pending to keep them in stored_model_conversions only. " +
        "A file edited on disk must be committed or discarded first."
    );
    return { status: "blocked", blocking };
  }
  if (options.dryRun) {
    log("\nDry run: nothing was written.");
    return { status: "planned", blocking: 0 };
  }

  await applyDatabase(db, plan, options);
  log("\nDatabase converted.");
  // Planned again from the converted database: the commit holds what the tool
  // now stores, not what the plan expected it to.
  for (const repository of await planRepositories(db)) {
    const commit = await applyRepository(db, repository, options.archiveUnconvertible);
    log(`History of ${repository.projectId} converted in ${commit.slice(0, 8)}.`);
  }
  if (library)
    log(
      `Legacy library converted; the original is kept at ${await applyLegacyLibrary(db, library, options.archiveUnconvertible)}.`
    );
  await assertModelFormat(typed);
  log("Done. Every original is in stored_model_conversions.");
  return { status: "converted", blocking: 0 };
}
