/**
 * POST /api/ai/convert-stream — `/api/ai/convert`, reporting as it goes.
 *
 * Server-sent events: `{ step, message }` while it works, then one
 * `{ step: "complete", model, diagnostics, ok, dropped, attempts }`, or
 * `{ step: "error", message }`.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/convert-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { convertModel, ModelConversionError, readConversionRequest } = await import(
          "@/lib/server/model-conversion"
        );
        let input: ReturnType<typeof readConversionRequest>;
        try {
          input = readConversionRequest(await request.json().catch(() => ({})));
        } catch (error) {
          const status = error instanceof ModelConversionError ? error.status : 400;
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Bad request" }),
            { status, headers: { "Content-Type": "application/json" } }
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (data: Record<string, unknown>) =>
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            try {
              send(
                input.currentModel?.trim()
                  ? {
                      step: "revising",
                      message: input.section
                        ? `Revising the model's ${input.section}...`
                        : "Revising the model...",
                    }
                  : { step: "analyzing", message: "Analysing the business domain..." }
              );
              const result = await convertModel(input);
              send({
                step: "validating",
                message: `Checked the model: ${result.diagnostics.filter((d) => d.severity === "error").length} error(s)`,
              });
              send({ step: "complete", ...result });
            } catch (error) {
              send({
                step: "error",
                message: error instanceof Error ? error.message : "Conversion failed",
              });
            } finally {
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
