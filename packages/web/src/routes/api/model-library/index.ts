/**
 * The model library: models someone exported so they can be loaded again.
 *
 * Each entry is a model document (`*.eml.yaml`) kept in its project's local
 * Git history under `model/library/`. Listing across projects lists only the
 * projects the caller owns or belongs to.
 */

import { createFileRoute } from "@tanstack/react-router";
import { accessibleProjectIds, requireProjectAccess } from "@/lib/project-access";
import { requireUser } from "@/lib/require-user";

export const Route = createFileRoute("/api/model-library/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const projectId = url.searchParams.get("projectId");
        const caller = projectId
          ? await requireProjectAccess(request, projectId)
          : await requireUser(request, "model-library");
        if (caller.response) return caller.response;
        const service = await import("@/lib/server/project-repository");
        try {
          const ids = projectId ? [projectId] : [...(await accessibleProjectIds(caller.user.id))];
          let files = (await Promise.all(ids.map((id) => service.projectLibrary(id)))).flat();
          if (url.searchParams.get("canonical") === "true")
            files = files.filter((f) => f.canonical);
          return Response.json({
            files: files.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          });
        } catch (error) {
          return service.repositoryFailure(error);
        }
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        if (!body.projectId || !body.filename || typeof body.content !== "string")
          return Response.json(
            { error: "projectId, filename and content are required" },
            { status: 400 }
          );
        const access = await requireProjectAccess(request, body.projectId, "read_write");
        if (access.response) return access.response;
        const service = await import("@/lib/server/project-repository");
        try {
          const result = await service.saveLibraryModel(
            body.projectId,
            access.user.id,
            { filename: body.filename, content: body.content, canonical: body.canonical },
            body.requestId
          );
          const file = (await service.projectLibrary(body.projectId)).find(
            (f) => f.filename === body.filename
          );
          return Response.json({ success: true, file, ...result }, { status: 201 });
        } catch (error) {
          return service.repositoryFailure(error);
        }
      },
    },
  },
});
