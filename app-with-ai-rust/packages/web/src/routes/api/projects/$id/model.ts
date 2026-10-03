/**
 * The project's model: its YAML document.
 *
 * GET → the saved text, the document it reads as, and every diagnostic at its
 *       line — what an editor needs to show the model and what is wrong in it.
 * PUT → replace whole top-level sections (`rules`, `hooks`, `sagas`, …) that a
 *       screen edits as data. Only those sections' text changes; the author's
 *       comments and layout everywhere else are kept byte for byte.
 */

import { createFileRoute } from "@tanstack/react-router";
import { requireProjectAccess } from "@/lib/project-access";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function describe(projectId: string, model: string) {
  const { readModelYaml } = await import("@appwithai/generator/model-yaml");
  const read = readModelYaml(model);
  return {
    projectId,
    model,
    document: read.document ?? null,
    ok: read.ok,
    diagnostics: read.diagnostics,
  };
}

export const Route = createFileRoute("/api/projects/$id/model")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const access = await requireProjectAccess(request, params.id, "read");
        if (access.response) return access.response;
        const { projectDb } = await import("@appwithai/core/services");
        const project = await projectDb.findById(params.id);
        if (!project) return json({ error: "Project not found" }, 404);
        return json({
          name: project.name,
          gitCommit: project.gitCommit ?? null,
          ...(await describe(params.id, project.modelYaml ?? "")),
        });
      },

      PUT: async ({ request, params }) => {
        const access = await requireProjectAccess(request, params.id, "read_write");
        if (access.response) return access.response;

        const { projectDb } = await import("@appwithai/core/services");
        const { replaceSections, SectionEditError, EDITABLE_SECTIONS } = await import(
          "@/lib/model/sections"
        );
        const service = await import("@/lib/server/project-repository");

        const project = await projectDb.findById(params.id);
        if (!project) return json({ error: "Project not found" }, 404);
        const existing: string = project.modelYaml ?? "";
        if (!existing.trim())
          return json(
            { error: "This project has no model yet. Design the data model before its behaviour." },
            409
          );

        const body = (await request.json().catch(() => ({}))) as {
          sections?: Record<string, unknown>;
          description?: string;
        };
        const sections = body.sections ?? {};
        const unknown = Object.keys(sections).filter(
          (key) => !(EDITABLE_SECTIONS as readonly string[]).includes(key)
        );
        if (unknown.length || !Object.keys(sections).length)
          return json(
            {
              error: unknown.length
                ? `Cannot replace ${unknown.join(", ")}; editable sections are ${EDITABLE_SECTIONS.join(", ")}`
                : "Name at least one section to replace",
            },
            400
          );

        try {
          const model = replaceSections(existing, sections);
          // A draft: the screen saved one part of the model, which is not a
          // claim that the whole of it is ready. Checker findings are returned
          // with the document so the screen can show them.
          await service.saveProject(params.id, access.user.id, {
            model,
            mode: "draft",
            description: body.description ?? `Update ${Object.keys(sections).join(", ")}`,
            expectedCommit: project.gitCommit ?? null,
            requestId: request.headers.get("Idempotency-Key") ?? undefined,
          });
          const { reindexProjectModel } = await import("@/lib/model-context");
          const indexed = await reindexProjectModel(params.id, model);
          return json({ ...(await describe(params.id, model)), indexed });
        } catch (error) {
          if (error instanceof SectionEditError) return json({ error: error.message }, 422);
          return service.repositoryFailure(error);
        }
      },
    },
  },
});
