/**
 * The CopilotKit runtime, shared by both `/api/copilotkit` routes.
 *
 * Both routes used to build an `AnthropicAdapter` around `ANTHROPIC_API_KEY`
 * with the model id `claude-sonnet-4-20250514` written into the file. Two
 * things were wrong with that, and the first is not subtle: this project does
 * not call the Anthropic API. The key is dead config — CLAUDE.md says so —
 * which means the assistant answered every message with an authentication
 * error. The second is that a hard-coded model string is exactly what
 * `packages/ai/src/config.ts` exists to prevent; changing models meant editing
 * route files.
 *
 * The adapter points at the same local OpenAI-compatible endpoint every agent
 * uses, resolved from that one config module rather than from defaults
 * restated here — restating them is how the third copy of a base URL appears.
 */

import { AI_API_KEY, AI_BASE_URL, AI_MODEL } from "@appwithai/ai/config";
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";

/** One runtime for the process; it holds no per-request state. */
export const copilotRuntime = new CopilotRuntime();

/**
 * Build the service adapter.
 *
 * Per request rather than once at module load: the OpenAI client captures the
 * base URL when it is constructed, so building it lazily means a dev server
 * that started before the model server did does not need restarting once it
 * is up.
 */
export async function makeServiceAdapter() {
  const { default: OpenAI } = await import("openai");

  return new OpenAIAdapter({
    openai: new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_BASE_URL }) as never,
    model: AI_MODEL,
  });
}

/**
 * Handle one CopilotKit request.
 *
 * `endpoint` has to match the route the browser posts to, or the runtime's
 * generated GraphQL URLs point somewhere that does not exist.
 */
export async function handleCopilotRequest(request: Request, endpoint: string): Promise<Response> {
  const { copilotRuntimeNodeHttpEndpoint } = await import("@copilotkit/runtime");

  const handler = copilotRuntimeNodeHttpEndpoint({
    runtime: copilotRuntime,
    serviceAdapter: await makeServiceAdapter(),
    endpoint,
  });

  return handler(request) as Promise<Response>;
}

/** Turn a thrown error into a response rather than a dead socket. */
export function copilotError(error: unknown, method: string): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[copilotkit] ${method} failed:`, error);
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
