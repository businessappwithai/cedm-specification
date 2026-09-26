import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/copilotkit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { copilotError, handleCopilotRequest } = await import("@/lib/copilot-runtime");
        try {
          return await handleCopilotRequest(request, "/api/copilotkit");
        } catch (error) {
          return copilotError(error, "GET");
        }
      },
      POST: async ({ request }) => {
        const { copilotError, handleCopilotRequest } = await import("@/lib/copilot-runtime");
        try {
          return await handleCopilotRequest(request, "/api/copilotkit");
        } catch (error) {
          return copilotError(error, "POST");
        }
      },
    },
  },
});
