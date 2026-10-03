/**
 * POST /api/ai/convert — a description, or a change, turned into the model.
 *
 * Body: `{ description, currentModel?, name?, section? }`. Returns the model's
 * YAML with every diagnostic the generator's reader found; `ok` is false while
 * any of them is an error.
 */

import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/ai/convert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { convertModel, ModelConversionError, readConversionRequest } = await import(
          "@/lib/server/model-conversion"
        );
        try {
          const result = await convertModel(readConversionRequest(await request.json()));
          return json({ success: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Conversion failed";
          return json(
            { success: false, error: message },
            error instanceof ModelConversionError ? error.status : 500
          );
        }
      },
    },
  },
});
