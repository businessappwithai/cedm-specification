import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects/$id/erd-versions/$versionId/restore")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;

        try {
          const { restoreProject } = await import("@/lib/server/project-repository");
          const body = await request.json().catch(() => ({}));
          const result = await restoreProject(params.id, access.user.id, {
            versionId: params.versionId,
            scope: "model",
            requestId: body.requestId,
            expectedCommit: body.expectedCommit,
          });

          // Restoring makes an older document the current one, so the
          // assistant's view is as stale as it would be after a save.
          const { getDatabase } = await import("@appwithai/core/services");
          const state = await getDatabase()
            .selectFrom("project_git_state")
            .select("model_code")
            .where("project_id", "=", params.id)
            .executeTakeFirst();
          const { reindexProjectModel } = await import("@/lib/model-context");
          const indexed = await reindexProjectModel(params.id as string, state?.model_code ?? "");
          return Response.json({ ...result, indexed });
        } catch (error) {
          const { repositoryFailure } = await import("@/lib/server/project-repository");
          return repositoryFailure(error);
        }
      },

      DELETE: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;

        try {
          const { erdVersionDb } = await import("@appwithai/core/services");
          const versionId = params.versionId as string;

          await erdVersionDb.delete(versionId);

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error deleting ERD version:", error);
          return new Response(JSON.stringify({ error: "Failed to delete ERD version" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
