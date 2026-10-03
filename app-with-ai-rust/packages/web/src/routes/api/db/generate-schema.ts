/**
 * Create tables in a target database from the project's saved model.
 *
 * Guarded by `requireProjectAccess` with `read_write`: it executes DDL against
 * the database a project points at, which is the most consequential thing this
 * app does to something outside itself. It used to take only the encrypted
 * connection string with no authentication at all.
 *
 * The model is read from what the project saved, not from the request, and
 * compiled by the generator, so every table, column, type and primary key here
 * is the one the generated application would use.
 */

import { createFileRoute } from "@tanstack/react-router";
import type { EntityAttribute } from "@appwithai/core/types";

/** The column type a canonical model type is stored as. */
const SQL_TYPE: Record<EntityAttribute["type"], string> = {
  string: "TEXT",
  text: "TEXT",
  integer: "BIGINT",
  decimal: "NUMERIC",
  boolean: "BOOLEAN",
  date: "DATE",
  datetime: "TIMESTAMPTZ",
  json: "JSONB",
};

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

export const Route = createFileRoute("/api/db/generate-schema")({
  server: {
    handlers: {
      POST: async ({ request }) => {
    try {
      const body = (await request.json()) as {
        projectId?: string;
        targetDbConnection: string;
      };
      const { projectId, targetDbConnection } = body;

      if (!projectId) {
        return new Response(JSON.stringify({ error: "projectId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { requireProjectAccess } = await import("@/lib/project-access");
      const access = await requireProjectAccess(request, projectId, "read_write");
      if (access.response) return access.response;

      if (!targetDbConnection) {
        return new Response(JSON.stringify({ error: "targetDbConnection is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { projectDb } = await import("@appwithai/core/services");
      const project = await projectDb.findById(projectId);
      const modelText: string = project?.modelYaml ?? "";
      const { ModelYamlError, parseModelYaml } = await import("@appwithai/generator/model-yaml");
      let schema: ReturnType<typeof parseModelYaml>["model"];
      try {
        schema = parseModelYaml(modelText, { source: "model/model.eml.yaml" }).model;
      } catch (error) {
        if (error instanceof ModelYamlError)
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        throw error;
      }
      if (schema.entities.length === 0) {
        return new Response(
          JSON.stringify({ error: "The saved model declares no entities." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Decrypt connection string
      const { decryptConnectionString } = await import("@/lib/encrypt");
      let connStr: string;
      try {
        connStr = decryptConnectionString(targetDbConnection);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid or corrupted connection string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Connect via pg
      const { Client } = await import("pg");
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 10000 });
      await client.connect();

      const ddlStatements: string[] = [];
      const tablesCreated: string[] = [];

      for (const entity of schema.entities) {
        const columns = entity.attributes.map((attr) => {
          const primary = attr.name === entity.primaryKey;
          return (
            `  ${quote(attr.name)} ${SQL_TYPE[attr.type]}` +
            (primary ? " PRIMARY KEY" : "") +
            (attr.required && !primary ? " NOT NULL" : "") +
            (attr.unique && !primary ? " UNIQUE" : "")
          );
        });
        ddlStatements.push(
          `CREATE TABLE IF NOT EXISTS ${quote(entity.tableName)} (\n${columns.join(",\n")}\n);`
        );
        tablesCreated.push(entity.tableName);
      }

      try {
        for (const stmt of ddlStatements) {
          await client.query(stmt);
        }
      } finally {
        await client.end();
      }

      return new Response(JSON.stringify({ success: true, tablesCreated }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : "Failed to generate schema",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
      },
    },
  },
});
