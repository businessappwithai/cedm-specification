"use server";

import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db/config";
import { getConnection } from "@/lib/db/connection-manager";
import { formatGraphContext, getGraphContext } from "@/lib/graph/rag";
import { isDenied, translateNLToSQLViaLlama } from "@/lib/nlquery/llama-translator";
import { isMastraAvailable, translateNLToSQLViaMastra } from "@/lib/nlquery/mastra-connector";
import { buildMastraContextPrompt } from "@/lib/nlquery/nl-query-context-service";
import { getSchemaMetadata } from "@/lib/nlquery/schema-metadata";
import { isAdmin } from "@/lib/permissions/permissions";
import { chartTypeSchema } from "@/lib/schemas/charts";
import { logAudit } from "@/lib/security/audit";
// llama-translator imports this symbol but does not re-export it, so taking it
// from there broke the production build at rollup time.
import { isLlamaReasoningAvailable } from "@/lib/voice/llama-client";
import type { DataSource, ResultRow } from "@/types/database";
import { forwardToRust } from "@/lib/api/backend";

// ---------------------------------------------------------------------------
// Shared helper: resolve NL description to SQL via available backends
// ---------------------------------------------------------------------------

async function nlToSql(
  nlDescription: string,
  dataSource: DataSource
): Promise<{ sql: string; confidence: number } | { error: string }> {
  const schema = await getSchemaMetadata(dataSource);

  // Build context prompt (pgvector RAG + graph RAG)
  let contextPrompt = "";
  try {
    contextPrompt = await buildMastraContextPrompt(
      dataSource.id,
      "admin",
      nlDescription,
      JSON.stringify(schema)
    );
  } catch {
    /* non-fatal */
  }
  try {
    const graphCtx = await getGraphContext(dataSource.id, nlDescription);
    const graphSection = formatGraphContext(graphCtx);
    if (graphSection) {
      contextPrompt = contextPrompt ? `${contextPrompt}\n\n${graphSection}` : graphSection;
    }
  } catch {
    /* non-fatal */
  }

  if (await isMastraAvailable()) {
    const result = await translateNLToSQLViaMastra(nlDescription, schema, {}, contextPrompt);
    if (result?.sql) return { sql: result.sql, confidence: result.confidence ?? 0.8 };
  }

  if (await isLlamaReasoningAvailable()) {
    // No user or data source is passed here, so the translator's RBAC branch
    // does not run and a refusal cannot come back — the narrowing is for the
    // type, and to make the omission visible rather than implicit.
    const result = await translateNLToSQLViaLlama(nlDescription, schema);
    if (result && !isDenied(result)) return { sql: result.sql, confidence: 0.7 };
  }

  return { error: "No NL→SQL backend available. Start Mastra or llama.cpp first." };
}

// ---------------------------------------------------------------------------
// nlBuildPreview — translate NL to SQL and return up to 20 preview rows
// ---------------------------------------------------------------------------

export const nlBuildPreview = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nlDescription: z.string().min(1).max(2000),
      dataSourceId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const forwarded = await forwardToRust<
      | { success: true; sql: string; confidence: number; columns: string[]; rows: ResultRow[] }
      | { success: false; error: string; sql?: string }
    >("POST", "/api/nl-builder/preview", data);
    if (forwarded) return forwarded;

    const session = await requireAuth();
    if (!(await isAdmin(session.user.id))) throw new Error("FORBIDDEN");

    const db = getDb();
    const ds = await db
      .selectFrom("data_sources")
      .selectAll()
      .where("id", "=", data.dataSourceId)
      .where("is_active", "=", true)
      .executeTakeFirst();

    if (!ds) return { success: false as const, error: "Data source not found" };

    const translation = await nlToSql(data.nlDescription, ds);
    if ("error" in translation) return { success: false as const, error: translation.error };

    const { sql, confidence } = translation;

    // Execute preview (first 20 rows)
    try {
      const conn = await getConnection(ds);
      // biome-ignore lint/suspicious/noExplicitAny: external DB
      const result = await (conn as any).executeQuery({
        sql: `${sql.trimEnd().replace(/;$/, "")} LIMIT 20`,
        parameters: [],
      });
      const rows = (result.rows ?? []) as ResultRow[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      await logAudit({
        userId: session.user.id,
        action: "preview",
        resourceType: "nl_builder",
        resourceId: data.dataSourceId,
        details: { nlDescription: data.nlDescription, sql, rowCount: rows.length },
      });

      return { success: true as const, sql, confidence, columns, rows };
    } catch (err) {
      return {
        success: false as const,
        error: `SQL execution failed: ${err instanceof Error ? err.message : String(err)}`,
        sql,
      };
    }
  });

// ---------------------------------------------------------------------------
// nlSaveReport — save NL-generated SQL as a saved_query + report_definition
// ---------------------------------------------------------------------------

export const nlSaveReport = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      dataSourceId: z.string().uuid(),
      sql: z.string().min(1),
      exportFormats: z.array(z.enum(["csv", "xlsx", "pdf"])).default(["csv", "xlsx", "pdf"]),
    })
  )
  .handler(async ({ data }) => {
    const forwarded = await forwardToRust<{
      success: true;
      reportId: string;
      savedQueryId: string;
    }>("POST", "/api/nl-builder/save-report", data);
    if (forwarded) return forwarded;

    const session = await requireAuth();
    if (!(await isAdmin(session.user.id))) throw new Error("FORBIDDEN");

    const db = getDb();
    const savedQueryId = randomUUID();
    const reportId = randomUUID();
    const now = new Date().toISOString();

    // biome-ignore lint/suspicious/noExplicitAny: bootstrapped schema varies between MariaDB/PG
    await (db as any)
      .insertInto("saved_queries")
      .values({
        id: savedQueryId,
        name: data.name,
        description: data.description ?? null,
        data_source_id: data.dataSourceId,
        sql_content: data.sql,
        is_validated: true,
        created_by: session.user.id,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await db
      .insertInto("report_definitions")
      .values({
        id: reportId,
        name: data.name,
        description: data.description ?? null,
        saved_query_id: savedQueryId,
        column_config: "[]",
        export_formats: JSON.stringify(data.exportFormats),
        is_public: false,
        is_deleted: false,
        created_by: session.user.id,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await logAudit({
      userId: session.user.id,
      action: "create",
      resourceType: "report",
      resourceId: reportId,
      details: { name: data.name, source: "nl_builder", savedQueryId },
    });

    return { success: true as const, reportId, savedQueryId };
  });

// ---------------------------------------------------------------------------
// nlSaveChart — save NL-generated SQL as a saved_query + chart_definition
// ---------------------------------------------------------------------------

export const nlSaveChart = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      dataSourceId: z.string().uuid(),
      sql: z.string().min(1),
      chartType: chartTypeSchema,
      chartConfig: z.record(z.unknown()).optional(),
    })
  )
  .handler(async ({ data }) => {
    const forwarded = await forwardToRust<{ success: true; chartId: string; savedQueryId: string }>(
      "POST",
      "/api/nl-builder/save-chart",
      data
    );
    if (forwarded) return forwarded;

    const session = await requireAuth();
    if (!(await isAdmin(session.user.id))) throw new Error("FORBIDDEN");

    const db = getDb();
    const savedQueryId = randomUUID();
    const chartId = randomUUID();
    const now = new Date().toISOString();

    // biome-ignore lint/suspicious/noExplicitAny: bootstrapped schema varies between MariaDB/PG
    await (db as any)
      .insertInto("saved_queries")
      .values({
        id: savedQueryId,
        name: data.name,
        description: data.description ?? null,
        data_source_id: data.dataSourceId,
        sql_content: data.sql,
        is_validated: true,
        created_by: session.user.id,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await db
      .insertInto("chart_definitions")
      .values({
        id: chartId,
        name: data.name,
        description: data.description ?? null,
        saved_query_id: savedQueryId,
        chart_type: data.chartType,
        chart_config: JSON.stringify(data.chartConfig ?? {}),
        data_mapping: JSON.stringify({ xAxis: { field: "" }, yAxis: [] }),
        refresh_interval: null,
        color_theme: null,
        is_public: false,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        created_by: session.user.id,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await logAudit({
      userId: session.user.id,
      action: "create",
      resourceType: "chart",
      resourceId: chartId,
      details: { name: data.name, source: "nl_builder", chartType: data.chartType, savedQueryId },
    });

    return { success: true as const, chartId, savedQueryId };
  });

// ---------------------------------------------------------------------------
// nlBuilderListDataSources — data sources visible to the AI
// ---------------------------------------------------------------------------

export const nlBuilderListDataSources = createServerFn({ method: "GET" }).handler(async () => {
  const forwarded = await forwardToRust<
    { id: string; name: string; client_type: string; description: string | null }[]
  >("GET", "/api/nl-builder/data-sources");
  if (forwarded) return forwarded;

  const session = await requireAuth();
  if (!(await isAdmin(session.user.id))) throw new Error("FORBIDDEN");

  const db = getDb();
  const sources = await db
    .selectFrom("data_sources")
    .select(["id", "name", "client_type", "description"])
    .where("is_active", "=", true)
    .where("is_deleted", "=", false)
    .orderBy("name")
    .execute();

  return sources;
});
