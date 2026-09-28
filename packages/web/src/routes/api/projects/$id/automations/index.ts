/**
 * Automations for a project.
 *
 * Stored in the `workflows` table, each as its own YAML document — the
 * `automation: "1.0"` document the generated application stores too, read and
 * written by the same `lib/automation/yaml.ts`. A saga or hook automation adds
 * to what the project generates from: its declarations are composed into the
 * model at generation (`lib/model/compose.ts`).
 *
 * Both verbs call `requireProjectAccess`. An automation names entities, columns
 * and the conditions under which a project's data changes; listing them is
 * reading the project, and creating one is writing to it.
 */

import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * The entity names and columns the builder's pickers offer, from the project's
 * model document — the same reader everything else uses, so a picker never
 * offers an entity the model does not declare.
 */
async function entitiesOf(model: string): Promise<{ name: string; attributes: { name: string }[] }[]> {
  if (!model.trim()) return [];
  const { readModelYaml } = await import("@appwithai/generator/model-yaml");
  const document = readModelYaml(model, { check: false }).document;
  return (document?.entities ?? []).map((entity) => ({
    name: entity.name,
    attributes: entity.attributes.map((attribute) => ({ name: attribute.name })),
  }));
}

export const Route = createFileRoute("/api/projects/$id/automations/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, params.id, "read");
          if (access.response) return access.response;

          const { workflowDb } = await import("@appwithai/core/services");
          const rows = await workflowDb.getWorkflows(params.id);

          // Paged at 200. A project accumulates automations faster than anyone
          // prunes them, and a rail that fetches every one eventually stops
          // painting — 200 fills the longest list anyone scrolls in one go.
          const url = new URL(request.url);
          const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 200), 1), 200);
          const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

          const matching = rows.filter((row) => (row.workflow_type ?? "") === "automation");
          const total = matching.length;

          const automations = matching.slice(offset, offset + limit).map((row) => ({
            id: row.id,
            name: row.name,
            serviceName: row.service_name,
            definition: row.definition_yaml,
            description: row.description ?? undefined,
            updatedAt: row.updated_at ?? row.created_at ?? undefined,
          }));

          // The current ERD, so the builder's pickers have something in them.
          const { projectDb } = await import("@appwithai/core/services");
          const project = await projectDb.findById(params.id);
          const entities = await entitiesOf(project?.modelYaml ?? "");

          return json({
            automations,
            entities,
            total,
            limit,
            offset,
            hasMore: offset + automations.length < total,
          });
        } catch (error) {
          console.error("Failed to list automations:", error);
          return json({ error: "Failed to list automations" }, 500);
        }
      },

      POST: async ({ request, params }) => {
        try {
          const { requireProjectAccess } = await import("@/lib/project-access");
          const access = await requireProjectAccess(request, params.id, "read_write");
          if (access.response) return access.response;

          const body = (await request.json()) as {
            name?: string;
            entity?: string;
            definition?: string;
            description?: string;
          };

          if (!body.name?.trim()) return json({ error: "An automation needs a name." }, 400);
          const { readDefinition } = await import("@/lib/automation/definition");
          const definition = await readDefinition(body.definition);
          if (definition instanceof Response) return definition;

          const { changeWorkflow } = await import("@/lib/server/project-repository");
          const created = await changeWorkflow(
            params.id,
            access.user.id,
            `wf_${crypto.randomUUID()}`,
            {
              name: body.name,
              service_name: body.entity ?? "",
              workflow_type: "automation",
              definition_yaml: definition,
              description: body.description ?? "",
            },
            request.headers.get("Idempotency-Key") ?? undefined
          );

          return json({ automation: created }, 201);
        } catch (error) {
          console.error("Failed to create automation:", error);
          return json({ error: "Failed to create automation" }, 500);
        }
      },
    },
  },
});
