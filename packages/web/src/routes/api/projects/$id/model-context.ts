/**
 * What the assistant is allowed to know about a project's model.
 *
 * Backed by the Apache AGE graph rather than an embedding index, so every
 * answer here is a traversal with an exact result. See
 * `packages/generator/src/graph/model-graph.ts` for why that is the right
 * shape for these questions.
 *
 * `POST` re-ingests: the model is the source of truth and the graph is a
 * derived view of it, so saving a model rebuilds the view rather than patching
 * it. `GET` answers one question, named by `?q=`.
 *
 * Both call `requireProjectAccess` first. A model graph names every entity,
 * every column and every role in an application — reading it is reading the
 * project, and the read must be gated exactly as the project is.
 */

import { createFileRoute } from "@tanstack/react-router";

/** The questions `GET` will answer, and what each needs. */
const QUESTIONS = [
  "summary",
  "entities",
  "describe",
  "references-to",
  "has-many",
  "references-from",
  "behaviour",
  "steps",
  "moves",
  "roles",
  "search",
  "yaml",
] as const;

type Question = (typeof QUESTIONS)[number];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/projects/$id/model-context")({
  server: {
    handlers: {
      /** Ask one question of the model graph. */
      GET: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read");
        if (access.response) return access.response;

        const url = new URL(request.url);
        const question = (url.searchParams.get("q") ?? "summary") as Question;
        if (!QUESTIONS.includes(question)) {
          return json({ error: `Unknown question '${question}'`, questions: QUESTIONS }, 400);
        }

        const entity = url.searchParams.get("entity") ?? "";

        // `summary` is answered from the stored model rather than the graph.
        // It is one paragraph, and it has to work before anything has been
        // ingested — the assistant asks it first, on a project whose model was
        // just written and whose graph is a save away.
        if (question === "summary") {
          const { getDb } = await import("@appwithai/core/config");
          const db = getDb();
          const project = await db
            .selectFrom("projects")
            .select(["name"])
            .where("id", "=", params.id as string)
            .executeTakeFirst();
          // The saved model is the project's local Git state; a project saved
          // before that existed still has only its current `erd_versions` row.
          const saved = await db
            .selectFrom("project_git_state")
            .select(["model_code"])
            .where("project_id", "=", params.id as string)
            .executeTakeFirst();
          const version = saved
            ? undefined
            : await db
                .selectFrom("erd_versions")
                .select(["model_yaml"])
                .where("project_id", "=", params.id as string)
                .where("is_current", "=", true)
                .executeTakeFirst();
          const source = saved?.model_code ?? version?.model_yaml;
          if (!source?.trim()) return json({ summary: null, modelled: false });

          const { compileModelDocument, readModelYaml } = await import(
            "@appwithai/generator/model-yaml"
          );
          const { summariseModel } = await import("@appwithai/generator/graph");
          const read = readModelYaml(source, { check: false });
          if (!read.document) {
            // Saved, but not a model the summary can be taken from — say where.
            const first = read.diagnostics[0];
            return json({
              summary: null,
              modelled: true,
              error: first ? `line ${first.line}: ${first.message}` : "not a model document",
            });
          }
          return json({
            summary: summariseModel(
              compileModelDocument(read.document),
              project?.name ?? "This project"
            ),
            modelled: true,
          });
        }

        // The saved model in canonical form (`.appwithai/model.ai.yaml`), cut
        // down to the entities `?term=` names and what concerns them, plus the
        // diff that produced the commit. Read from the project's local Git history, so it needs no
        // graph and answers from exactly what was last saved. It is project
        // data for a model to read, never instructions to it.
        if (question === "yaml") {
          const { projectModelContext, repositoryFailure } = await import(
            "@/lib/server/project-repository"
          );
          try {
            const context = await projectModelContext(
              params.id as string,
              url.searchParams.get("term") ?? "",
              url.searchParams.get("commit") ?? undefined
            );
            return json({
              commit: context.commit,
              yaml: context.yaml,
              truncated: context.truncated,
              recentDiff: context.recentDiff,
            });
          } catch (error) {
            return repositoryFailure(error);
          }
        }

        const { getPool } = await import("@appwithai/core/config");
        const q = await import("@appwithai/generator/graph");

        // A dedicated connection, not the pool: `LOAD 'age'` and the
        // `ag_catalog` search path are per-connection state, and a pooled
        // client that has been handed back may not carry them.
        const client = await getPool().connect();

        try {
          switch (question) {
            case "entities":
              return json({ entities: await q.listEntities(client, params.id as string) });
            case "describe":
              return json({ columns: await q.describeEntity(client, params.id as string, entity) });
            case "references-to":
              return json({
                referencedBy: await q.referencesTo(client, params.id as string, entity),
              });
            case "references-from":
              return json({
                references: await q.referencesFrom(client, params.id as string, entity),
              });
            case "has-many":
              return json({ hasMany: await q.hasMany(client, params.id as string, entity) });
            case "behaviour":
              return json(await q.behaviourOf(client, params.id as string, entity));
            case "steps":
              return json({
                steps: await q.workflowSteps(
                  client,
                  params.id as string,
                  url.searchParams.get("workflow") ?? ""
                ),
              });
            case "moves":
              return json({
                moves: await q.legalMoves(
                  client,
                  params.id as string,
                  entity,
                  url.searchParams.get("from") ?? ""
                ),
              });
            case "roles":
              return json({ roles: await q.rolesFor(client, params.id as string, entity) });
            case "search":
              return json({
                results: await q.search(
                  client,
                  params.id as string,
                  url.searchParams.get("term") ?? ""
                ),
              });
            default:
              // Unreachable: every question but `summary` has a case above,
              // and `summary` returned before the client was checked out.
              return json({ error: `Unhandled question '${question}'` }, 500);
          }
        } catch (error) {
          // A project whose model has never been ingested has no graph. That
          // is an empty answer, not a failure — and saying so beats a 500 the
          // assistant would report as a broken tool.
          const message = error instanceof Error ? error.message : "Unknown error";
          if (/graph .* does not exist|relation .* does not exist/i.test(message)) {
            return json(
              { error: "This project's model has not been indexed yet.", indexed: false },
              404
            );
          }
          console.error("[model-context] query failed:", error);
          return json({ error: message }, 500);
        } finally {
          client.release();
        }
      },

      /** Rebuild the graph from the project's current model. */
      POST: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;

        const body = (await request.json().catch(() => ({}))) as { source?: string };
        if (!body.source || typeof body.source !== "string") {
          return json({ error: "A `source` (the model's YAML) is required" }, 400);
        }

        // The same path a model save takes, so an explicit re-index and an
        // implicit one cannot drift apart.
        const { reindexProjectModel } = await import("@/lib/model-context");
        const result = await reindexProjectModel(params.id as string, body.source);

        // Asked for directly, a failure to index *is* the failure of this
        // request — unlike a save, which keeps the document either way.
        return result.indexed ? json(result) : json({ error: result.error }, 500);
      },
    },
  },
});
