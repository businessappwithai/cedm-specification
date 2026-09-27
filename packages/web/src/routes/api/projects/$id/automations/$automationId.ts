/**
 * One automation: read it, save it, remove it.
 *
 * The body carries the automation's YAML document rather than the builder's
 * object model, so what is stored is the one document every reader reads and
 * this endpoint never becomes a second source of truth for what one is.
 *
 * Every verb calls `requireProjectAccess` before it looks the automation up.
 * Checking that the row belongs to `params.id` is not a permission check: it
 * establishes which project the automation is in, and says nothing about
 * whether the caller may see that project.
 */

import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/projects/$id/automations/$automationId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, params.id, "read");
          if (access.response) return access.response;

          const { workflowDb } = await import("@appwithai/core/services");
          const row = await workflowDb.findById(params.automationId);

          if (!row || row.project_id !== params.id) {
            return json({ error: "No automation with that id in this project." }, 404);
          }

          return json({
            automation: {
              id: row.id,
              name: row.name,
              serviceName: row.service_name,
              definition: row.definition_yaml,
              description: row.description ?? undefined,
              status: row.status ?? "draft",
              updatedAt: row.updated_at ?? undefined,
            },
          });
        } catch (error) {
          console.error("Failed to read automation:", error);
          return json({ error: "Failed to read automation" }, 500);
        }
      },

      PUT: async ({ request, params }) => {
        try {
          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, params.id, "read_write");
          if (access.response) return access.response;

          const body = (await request.json()) as {
            name?: string;
            entity?: string;
            definition?: string;
            description?: string;
            status?: string;
          };

          const { readDefinition } = await import("@/lib/automation/definition");
          const definition =
            body.definition === undefined ? undefined : await readDefinition(body.definition);
          if (definition instanceof Response) return definition;

          const { workflowDb } = await import("@appwithai/core/services");
          const existing = await workflowDb.findById(params.automationId);
          if (!existing || existing.project_id !== params.id) {
            return json({ error: "No automation with that id in this project." }, 404);
          }

          const { changeWorkflow } = await import("@/lib/server/project-repository");
          const updated = await changeWorkflow(params.id, access.user.id, params.automationId, {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.entity !== undefined ? { service_name: body.entity } : {}),
            ...(definition !== undefined ? { definition_yaml: definition } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
          });

          return json({ automation: updated });
        } catch (error) {
          console.error("Failed to save automation:", error);
          return json({ error: "Failed to save automation" }, 500);
        }
      },

      DELETE: async ({ request, params }) => {
        try {
          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, params.id, "read_write");
          if (access.response) return access.response;

          const { workflowDb } = await import("@appwithai/core/services");
          const existing = await workflowDb.findById(params.automationId);
          if (!existing || existing.project_id !== params.id) {
            return json({ error: "No automation with that id in this project." }, 404);
          }

          const { changeWorkflow } = await import("@/lib/server/project-repository");
          await changeWorkflow(params.id, access.user.id, params.automationId, null);
          return json({ deleted: true });
        } catch (error) {
          console.error("Failed to delete automation:", error);
          return json({ error: "Failed to delete automation" }, 500);
        }
      },
    },
  },
});
