/**
 * The CopilotKit runtime URL every `<CopilotKit>` provider is given.
 *
 * Absolute in the browser, because CopilotKit's single-endpoint transport
 * resolves resource requests with `new URL(runtimeUrl)` — no base — and a
 * relative `"/api/copilotkit"` throws `Failed to construct 'URL': Invalid
 * URL` on every message, on every page that mounts the assistant. The path
 * stays a root-absolute `"/api/…"` literal here so the subpath overlay
 * prefixes it exactly as it did the inline copies (`/report/api/copilotkit`).
 *
 * On the server there is no origin to resolve against and nothing is fetched,
 * so the path is returned as is.
 *
 * Every provider also passes `useSingleEndpoint`: the runtime is mounted with
 * `copilotRuntimeNextJSAppRouterEndpoint`, which serves the single-endpoint
 * protocol and answers any GET with 405. Left on "auto", the client probed
 * `GET …/info` first and logged that 405 on every page load before falling
 * back to the POST it should have sent.
 */
const RUNTIME_PATH = "/api/copilotkit";

export function copilotRuntimeUrl(): string {
  if (typeof window === "undefined") return RUNTIME_PATH;
  return new URL(RUNTIME_PATH, window.location.origin).href;
}
