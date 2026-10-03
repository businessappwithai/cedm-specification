import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects/$id/workflows/$serviceName/draft")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;

        try {
          await request.json();

          // TODO: Implement workflow draft logic
          return new Response(
            JSON.stringify({
              success: true,
              message: "Workflow draft created successfully",
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error creating workflow draft:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to create workflow draft",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
