import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects/$id/erd-versions/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read");
        if (access.response) return access.response;
        try {
          const { erdVersionDb } = await import("@appwithai/core/services");
          return Response.json({ versions: await erdVersionDb.getVersions(params.id) });
        } catch (error) {
          const { repositoryFailure } = await import("@/lib/server/project-repository");
          return repositoryFailure(error);
        }
      },
      POST: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;
        const service = await import("@/lib/server/project-repository");
        try {
          const body = await request.json();
          if (typeof body.model !== "string")
            return Response.json({ error: "The model (YAML text) is required" }, { status: 400 });
          const result = await service.saveProject(params.id, access.user.id, {
            model: body.model,
            mode: body.mode === "draft" ? "draft" : "version",
            description: body.description,
            requestId: body.requestId,
            expectedCommit: body.expectedCommit,
          });

          // Saving a model is what makes the assistant's view stale, so it is
          // rebuilt here rather than on the next question. It cannot fail the
          // save — see `lib/model-context.ts`.
          const { reindexProjectModel } = await import("@/lib/model-context");
          const indexed = await reindexProjectModel(params.id, body.model);

          return Response.json(
            { ...result, version: result.version ?? null, indexed },
            { status: 201 }
          );
        } catch (error) {
          return service.repositoryFailure(error);
        }
      },
    },
  },
});
