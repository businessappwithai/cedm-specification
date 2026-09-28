/**
 * The storage format of models: YAML, and nothing that predates it.
 *
 * The modelling tool once stored models and automations as Mermaid, in
 * `erd_versions.mermaid_code`, `workflows.mermaid_code` and
 * `workflows.flowchart_code`. It reads YAML only now, so a database still
 * holding those columns is one it cannot serve: a Mermaid model would open in
 * the YAML editor as a wall of errors, and generating from it would fail
 * further along with an error that names the wrong cause.
 *
 * The conversion is a one-time operator command, not something the running
 * application does, because it is the only thing left that reads Mermaid and
 * it should stay out of every request path. `runMigrations` calls
 * `assertModelFormat` and refuses to continue until it has been run.
 */

import { type Kysely, sql } from "kysely";
import type { Database } from "../config/db.types";

/** The command that converts a database's stored Mermaid to YAML. */
export const CONVERT_STORED_MODELS_COMMAND = "bun run convert:stored-models";

/** Columns only a database from before YAML models has. */
export const MERMAID_ERA_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "erd_versions", column: "mermaid_code" },
  { table: "workflows", column: "mermaid_code" },
  { table: "workflows", column: "flowchart_code" },
];

export class StoredModelFormatError extends Error {
  constructor(readonly columns: Array<{ table: string; column: string }>) {
    super(
      `This database stores models as Mermaid (${columns
        .map(({ table, column }) => `${table}.${column}`)
        .join(", ")}). The modelling tool reads YAML only. Run \`${CONVERT_STORED_MODELS_COMMAND}\` ` +
        "once to convert every stored model, version and automation; it keeps each original " +
        "in `stored_model_conversions`."
    );
    this.name = "StoredModelFormatError";
  }
}

/** The Mermaid-era columns this database still has. */
export async function mermaidEraColumns(
  db: Kysely<Database>
): Promise<Array<{ table: string; column: string }>> {
  const rows = await sql<{ table_name: string; column_name: string }>`
    SELECT table_name, column_name
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND (table_name, column_name) IN (('erd_versions', 'mermaid_code'),
                                         ('workflows', 'mermaid_code'),
                                         ('workflows', 'flowchart_code'))`.execute(db);
  return MERMAID_ERA_COLUMNS.filter(({ table, column }) =>
    rows.rows.some((row) => row.table_name === table && row.column_name === column)
  );
}

/** Refuse a database that still stores Mermaid, naming the command that converts it. */
export async function assertModelFormat(db: Kysely<Database>): Promise<void> {
  const columns = await mermaidEraColumns(db);
  if (columns.length) throw new StoredModelFormatError(columns);
}

/** The audit table the conversion writes. Created with the schema so it always exists. */
export async function createStoredModelConversions(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("stored_model_conversions")
    .ifNotExists()
    .addColumn("id", "varchar(128)", (c) => c.primaryKey())
    .addColumn("project_id", "varchar(128)")
    .addColumn("source", "varchar(32)", (c) => c.notNull())
    .addColumn("source_key", "text", (c) => c.notNull())
    .addColumn("original_text", "text", (c) => c.notNull())
    .addColumn("converted_text", "text")
    .addColumn("issues", "text", (c) => c.notNull())
    .addColumn("error", "text")
    .addColumn("converted_at", "varchar(64)", (c) => c.notNull())
    .execute();
}
