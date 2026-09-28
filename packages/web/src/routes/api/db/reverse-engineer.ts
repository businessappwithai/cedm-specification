/**
 * Read an existing database and describe it as a model document.
 *
 * The second way into the product: a team with a database already has a model,
 * it is just written in DDL. The reading itself lives in
 * `@appwithai/core/services` — this route is the HTTP shell around it, so the
 * same introspection is available to the CLI and to tests without a server.
 *
 * Guarded by `requireProjectAccess`. The connection string is the project's own
 * secret and the schema it returns describes the project's data, so reading it
 * is reading the project. It used to take only the ciphertext with no
 * authentication at all, which meant anyone who came by a stored connection
 * string could read that database's shape without signing in.
 */

import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/db/reverse-engineer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            projectId?: string;
            targetDbConnection?: string;
          };
          const { projectId, targetDbConnection } = body;

          if (!projectId) return json({ error: "projectId is required" }, 400);
          if (!targetDbConnection) return json({ error: "targetDbConnection is required" }, 400);

          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, projectId, "read");
          if (access.response) return access.response;

          const { decryptConnectionString } = await import("@/lib/encrypt");
          let connectionString: string;
          try {
            connectionString = decryptConnectionString(targetDbConnection);
          } catch {
            return json({ error: "Invalid or corrupted connection string" }, 400);
          }

          const { introspectDatabase } = await import("@appwithai/core/services");
          const result = await introspectDatabase({ connectionString });

          const { serializeModelDocument } = await import("@appwithai/generator/model-yaml");
          return json({
            model: serializeModelDocument(result.document),
            tableCount: result.tableCount,
            relationshipCount: result.relationshipCount,
            skipped: result.skipped,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to reverse-engineer schema";
          // A database that cannot be reached is the caller's problem to fix,
          // not a fault here — 504 says which.
          const status =
            message.includes("connect ECONNREFUSED") || message.includes("timeout") ? 504 : 500;
          return json({ error: message }, status);
        }
      },
    },
  },
});
