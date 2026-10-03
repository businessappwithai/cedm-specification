import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/deploy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /*
         * Read and check before the stream opens.
         *
         * The body used to be read inside `start()`, which meant the project it
         * names was never checked at all — deploying someone else's project
         * needed only its id. It has to be read out here anyway: a request body
         * can only be consumed once, and a refusal reported as an SSE `data:`
         * line is a refusal the client has to remember to look for, where a 401
         * or a 404 is not.
         */
        const body = (await request.json().catch(() => ({}))) as { projectId?: string };
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(
          request,
          String(body.projectId ?? ""),
          "read_write"
        );
        if (access.response) return access.response;

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            const sendLog = (level: string, message: string) => {
              const data = `data: ${JSON.stringify({ log: message, level })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            const sendComplete = (url: string) => {
              const data = `data: ${JSON.stringify({ complete: true, url })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            const sendError = (error: string) => {
              const data = `data: ${JSON.stringify({ error })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            try {
              const { projectId } = body;

              if (!projectId) {
                sendError("Missing required field: projectId");
                controller.close();
                return;
              }

              const { projectDb } = await import("@appwithai/core/services");
              const project = await projectDb.findById(projectId);
              if (!project) {
                sendError("Project not found");
                controller.close();
                return;
              }

              sendLog("info", "Initializing local deployment...");
              await new Promise((resolve) => setTimeout(resolve, 500));

              // TODO: Implement full deployment logic
              // - Validate environment variables
              // - Start local server
              // - Monitor deployment
              // - Stream logs

              sendLog("info", "Starting server...");
              sendLog("success", "Deployment complete");
              sendComplete(`http://localhost:${project.port}`);
              controller.close();
            } catch (error) {
              console.error("Deployment error:", error);
              sendError(error instanceof Error ? error.message : "Deployment failed");
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
