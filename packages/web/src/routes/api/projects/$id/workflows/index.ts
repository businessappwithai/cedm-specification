import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects/$id/workflows/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read");
        if (access.response) return access.response;

        try {
          const { workflowDb } = await import("@appwithai/core/services");
          const id = params.id as string;

          const workflows = await workflowDb.getWorkflows(id);

          return new Response(JSON.stringify({ workflows }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error fetching workflows:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch workflows" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request, params }) => {
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, params.id as string, "read_write");
        if (access.response) return access.response;

        try {
          const { changeWorkflow } = await import("@/lib/server/project-repository");
          const id = params.id as string;
          const body = await request.json();
          const { name, serviceName, definition, description, extensionPoints } = body;

          if (!name || !serviceName || typeof definition !== "string") {
            return new Response(
              JSON.stringify({
                error: "name, serviceName and definition (the automation's YAML document) are required",
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          // Stored only once it reads as an automation document: a row that
          // cannot be opened is worse than a refused request.
          const { AutomationDocumentError, automationFromYaml } = await import(
            "@/lib/automation/yaml"
          );
          try {
            automationFromYaml(definition);
          } catch (error) {
            if (!(error instanceof AutomationDocumentError)) throw error;
            return new Response(JSON.stringify({ error: error.message }), {
              status: 422,
              headers: { "Content-Type": "application/json" },
            });
          }

          const workflow = await changeWorkflow(id, access.user.id, `wf_${crypto.randomUUID()}`, {
            name,
            service_name: serviceName,
            workflow_type: "automation",
            definition_yaml: definition,
            description,
            extension_points: extensionPoints,
          });

          return new Response(JSON.stringify({ workflow }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error creating workflow:", error);
          return new Response(JSON.stringify({ error: "Failed to create workflow" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
