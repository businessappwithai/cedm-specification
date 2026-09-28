/**
 * The database half of the conversion: every stored model, version and
 * automation, from its Mermaid column to its YAML column.
 *
 * Planned first, applied second. The plan converts everything in memory and
 * says what did not convert; nothing is written until the caller has seen that
 * and chosen to proceed. The write is one transaction — columns added, rows
 * filled, Mermaid columns dropped — so a database is never half converted, and
 * each original goes into `stored_model_conversions` beside what it became.
 */

import { createHash } from "node:crypto";
import { type Kysely, sql } from "kysely";
import { type Conversion, convertAutomation, convertModel } from "./convert";

// biome-ignore lint/suspicious/noExplicitAny: the Mermaid-era schema is not in the typed Database.
export type Db = Kysely<any>;

export type Source =
  | "erd_version"
  | "project_model"
  | "automation"
  | "hook_flowchart"
  | "pending_operation"
  | "repository"
  | "legacy_library";

/** One stored text and what the conversion made of it. */
export interface Item {
  source: Source;
  /** Stable across runs: the row, or the file and the commit it was read at. */
  key: string;
  projectId: string | null;
  original: string;
  conversion: Conversion;
  /** Carried, but not converted: kept in the audit table and no longer stored. */
  retired?: string;
}

export const auditId = (source: string, key: string) =>
  createHash("sha256").update(`${source}\0${key}`).digest("hex").slice(0, 40);

export interface DatabasePlan {
  /** The Mermaid-era columns present; empty when there is nothing to convert. */
  columns: Array<{ table: string; column: string }>;
  versions: Array<Item & { id: string }>;
  models: Array<Item & { projectId: string }>;
  workflows: Array<Item & { id: string; convertedType?: string }>;
  pending: Array<Item & { id: string }>;
}

async function columnsOf(db: Db): Promise<Array<{ table: string; column: string }>> {
  const rows = await sql<{ table_name: string; column_name: string }>`
    SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND (table_name, column_name) IN (('erd_versions', 'mermaid_code'),
                                         ('workflows', 'mermaid_code'),
                                         ('workflows', 'flowchart_code'))
     ORDER BY table_name, column_name`.execute(db);
  return rows.rows.map((row) => ({ table: row.table_name, column: row.column_name }));
}

const has = (plan: { columns: DatabasePlan["columns"] }, table: string, column: string) =>
  plan.columns.some((c) => c.table === table && c.column === column);

export async function planDatabase(db: Db): Promise<DatabasePlan> {
  const columns = await columnsOf(db);
  const plan: DatabasePlan = { columns, versions: [], models: [], workflows: [], pending: [] };

  // A save that was interrupted is replayed by the next one, and its payload is
  // Mermaid. It is either finished by the version of the tool that started it
  // or explicitly given up; converting around it would replay Mermaid later.
  const pending = await sql<{ id: string; project_id: string; kind: string; payload: string }>`
    SELECT id, project_id, kind, payload FROM project_git_operations
     WHERE status = 'prepared' ORDER BY created_at`.execute(db);
  for (const row of pending.rows)
    plan.pending.push({
      source: "pending_operation",
      key: row.id,
      id: row.id,
      projectId: row.project_id,
      original: row.payload,
      conversion: {
        ok: false,
        error: `an interrupted ${row.kind} that was never completed`,
        notes: [],
      },
    });

  if (!columns.length) return plan;

  if (has(plan, "erd_versions", "mermaid_code")) {
    const versions = await sql<{
      id: string;
      project_id: string;
      version_number: number;
      mermaid_code: string;
    }>`
      SELECT id, project_id, version_number, mermaid_code FROM erd_versions
       ORDER BY project_id, version_number`.execute(db);
    for (const row of versions.rows)
      plan.versions.push({
        source: "erd_version",
        key: row.id,
        id: row.id,
        projectId: row.project_id,
        original: row.mermaid_code ?? "",
        conversion: convertModel(row.mermaid_code ?? ""),
      });

    // The current model of a project whose history is kept in Git: Mermaid for
    // as long as the versions were, and converted the same way. An empty one is
    // a project nobody has modelled yet, which stays empty.
    const states = await sql<{ project_id: string; model_code: string }>`
      SELECT project_id, model_code FROM project_git_state ORDER BY project_id`.execute(db);
    for (const row of states.rows) {
      if (!row.model_code.trim()) continue;
      plan.models.push({
        source: "project_model",
        key: row.project_id,
        projectId: row.project_id,
        original: row.model_code,
        conversion: convertModel(row.model_code),
      });
    }
  }

  const mermaid = has(plan, "workflows", "mermaid_code");
  const flowchart = has(plan, "workflows", "flowchart_code");
  if (mermaid || flowchart) {
    const workflows = await sql<{
      id: string;
      project_id: string;
      name: string;
      service_name: string;
      workflow_type: string | null;
      mermaid_code: string | null;
      flowchart_code: string | null;
    }>`SELECT id, project_id, name, service_name, workflow_type,
              ${mermaid ? sql`mermaid_code` : sql`NULL`} AS mermaid_code,
              ${flowchart ? sql`flowchart_code` : sql`NULL`} AS flowchart_code
         FROM workflows ORDER BY project_id, id`.execute(db);
    for (const row of workflows.rows) {
      if (row.workflow_type === "hooks") {
        // A service's flowchart was drawn from its hooks, which are stored
        // beside it in `hook_definitions` and are what generation reads.
        const drawn = [row.flowchart_code, row.mermaid_code].filter(
          (t): t is string => !!t?.trim()
        );
        if (drawn.length)
          plan.workflows.push({
            source: "hook_flowchart",
            key: row.id,
            id: row.id,
            projectId: row.project_id,
            original: drawn.join("\n\n"),
            conversion: { ok: true, yaml: "", notes: [] },
            retired: "a diagram drawn from the service's hooks, which are kept as they are",
          });
        continue;
      }
      const source = row.mermaid_code ?? "";
      plan.workflows.push({
        source: "automation",
        key: row.id,
        id: row.id,
        projectId: row.project_id,
        original: source,
        conversion: convertAutomation(source, row.name, row.service_name),
        convertedType: "automation",
      });
    }
  }
  return plan;
}

/** What stops the plan from being applied as it stands. */
export function databaseFailures(plan: DatabasePlan): Item[] {
  return [
    ...plan.pending,
    ...plan.versions.filter((i) => !i.conversion.ok),
    ...plan.models.filter((i) => !i.conversion.ok),
    ...plan.workflows.filter((i) => !i.conversion.ok),
  ];
}

export interface ApplyOptions {
  /** Keep what did not convert in the audit table only, and remove it from where it was stored. */
  archiveUnconvertible: boolean;
  /** Give up interrupted saves, keeping their payload in the audit table. */
  abandonPending: boolean;
}

async function audit(tx: Db, item: Item, now: string) {
  await sql`
    INSERT INTO stored_model_conversions
      (id, project_id, source, source_key, original_text, converted_text, issues, error, converted_at)
    VALUES (${auditId(item.source, item.key)}, ${item.projectId}, ${item.source}, ${item.key},
            ${item.original}, ${item.conversion.ok && item.conversion.yaml ? item.conversion.yaml : null},
            ${JSON.stringify(item.retired ? [...item.conversion.notes, `retired: ${item.retired}`] : item.conversion.notes)},
            ${item.conversion.ok ? null : item.conversion.error}, ${now})
    ON CONFLICT (id) DO NOTHING`.execute(tx);
}

export async function applyDatabase(
  db: Db,
  plan: DatabasePlan,
  options: ApplyOptions
): Promise<void> {
  const failures = databaseFailures(plan);
  const blocking = failures.filter((item) =>
    item.source === "pending_operation" ? !options.abandonPending : !options.archiveUnconvertible
  );
  if (blocking.length)
    throw new Error(`${blocking.length} stored item(s) cannot be converted; see the plan`);

  const now = new Date().toISOString();
  await db.transaction().execute(async (tx) => {
    for (const item of plan.pending) {
      await audit(tx, item, now);
      await sql`UPDATE project_git_operations SET status = 'abandoned' WHERE id = ${item.id}`.execute(
        tx
      );
    }
    if (!plan.columns.length) return;

    if (has(plan, "erd_versions", "mermaid_code")) {
      await sql`ALTER TABLE erd_versions ADD COLUMN IF NOT EXISTS model_yaml text`.execute(tx);
      for (const item of plan.versions) {
        await audit(tx, item, now);
        if (item.conversion.ok)
          await sql`UPDATE erd_versions SET model_yaml = ${item.conversion.yaml} WHERE id = ${item.id}`.execute(
            tx
          );
        else await sql`DELETE FROM erd_versions WHERE id = ${item.id}`.execute(tx);
      }
      // Every version's snapshot is Mermaid-era; restoring one re-archives it
      // from the converted text (`archiveVersions`), which needs the link gone.
      await sql`UPDATE erd_versions SET git_commit = NULL`.execute(tx);
      await sql`ALTER TABLE erd_versions ALTER COLUMN model_yaml SET NOT NULL`.execute(tx);
      await sql`ALTER TABLE erd_versions DROP COLUMN mermaid_code`.execute(tx);

      for (const item of plan.models) {
        await audit(tx, item, now);
        await sql`UPDATE project_git_state SET model_code = ${item.conversion.ok ? item.conversion.yaml : ""}
                   WHERE project_id = ${item.projectId}`.execute(tx);
      }
    }

    const workflowColumns = plan.columns.filter((c) => c.table === "workflows");
    if (workflowColumns.length) {
      await sql`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS definition_yaml text`.execute(tx);
      for (const item of plan.workflows) {
        await audit(tx, item, now);
        if (item.source !== "automation") continue;
        if (item.conversion.ok)
          await sql`UPDATE workflows SET definition_yaml = ${item.conversion.yaml},
                                         workflow_type = ${item.convertedType ?? "automation"}
                     WHERE id = ${item.id}`.execute(tx);
        else await sql`DELETE FROM workflows WHERE id = ${item.id}`.execute(tx);
      }
      for (const { column } of workflowColumns)
        await sql`ALTER TABLE workflows DROP COLUMN ${sql.ref(column)}`.execute(tx);
    }
  });
}
