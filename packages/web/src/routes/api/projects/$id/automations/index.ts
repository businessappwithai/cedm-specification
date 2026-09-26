/**
 * Automations for a project.
 *
 * Stored in the existing `workflows` table as mermaid, because that is what the
 * generator already reads. The builder is a new way to write the same artifact,
 * not a new artifact — so an automation saved here is picked up by code
 * generation with no further translation, and one written before the builder
 * existed opens in it.
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
 * The entity names and columns the builder's pickers offer.
 *
 * Parsed from the project's current ERD here rather than fetched separately,
 * because the builder needs them on the same first paint as the automations —
 * an entity picker with nothing in it cannot even show the trigger a saved
 * automation already has.
 *
 * Deliberately a small reader over the `Entity { type name }` blocks rather
 * than the full generator parser: this needs names and columns, and pulling the
 * whole generator into a request path to get them would cost far more than it
 * returns.
 */
function entitiesFromErd(mermaid: string): { name: string; attributes: { name: string }[] }[] {
  const entities: { name: string; attributes: { name: string }[] }[] = [];
  let current: { name: string; attributes: { name: string }[] } | null = null;

  for (const raw of mermaid.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("%%")) continue;

    const open = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\{$/);
    if (open?.[1] && open[1] !== "erDiagram") {
      current = { name: open[1], attributes: [] };
      entities.push(current);
      continue;
    }

    if (line === "}") {
      current = null;
      continue;
    }

    if (current) {
      // `type name`, optionally followed by PK/FK and a "comment".
      const attr = line.match(/^[A-Za-z_][A-Za-z0-9_[\]]*\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (attr?.[1]) current.attributes.push({ name: attr[1] });
    }
  }

  return entities;
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
            mermaid: row.mermaid_code,
            description: row.description ?? undefined,
            updatedAt: row.updated_at ?? row.created_at ?? undefined,
          }));

          // The current ERD, so the builder's pickers have something in them.
          const { projectDb } = await import("@appwithai/core/services");
          const project = await projectDb.findById(params.id);
          const entities = project?.erdCode ? entitiesFromErd(project.erdCode) : [];

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
            mermaid?: string;
            description?: string;
          };

          if (!body.name?.trim() || !body.mermaid?.trim()) {
            return json({ error: "An automation needs a name and its mermaid source." }, 400);
          }

          const { changeWorkflow } = await import("@/lib/server/project-repository");
          const created = await changeWorkflow(
            params.id,
            access.user.id,
            `wf_${crypto.randomUUID()}`,
            {
              name: body.name,
              service_name: body.entity ?? "",
              workflow_type: "automation",
              mermaid_code: body.mermaid,
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
