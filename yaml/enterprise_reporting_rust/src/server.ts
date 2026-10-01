import type { Register } from "@tanstack/react-router";
import type { RequestHandler } from "@tanstack/react-start/server";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { closeDb, waitForDatabaseReady } from "@/lib/db/config";
import { initializeWorkers, shutdownWorkers } from "@/lib/jobs/worker-runner";
import { initGraph } from "@/lib/graph/graph-init";
import { syncKnowledgeGraph } from "@/lib/graph/sync";
import { rustApiUrl, withoutBase } from "@/lib/api/backend";
import { isRustRoute } from "@/lib/api/rust-routes";

// Persistent config store will be imported and initialized on first use

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' ws: wss: http://localhost:4050 http://localhost:8080 http://localhost:8081 http://localhost:8083 http://localhost:4111 https://api.cloud.copilotkit.ai https://cdn.copilotkit.ai https://telemetry.copilotkit.ai; worker-src 'self' blob:; frame-ancestors 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

const handler = createStartHandler(defaultStreamHandler);

/*
 * With ERS_RUST_API_URL set, the Rust (Loco) backend is the backend
 * (rust/MIGRATION_PLAN.md §7, Phase 7): every route in rust/routes.json is
 * proxied to it below, and the background work it owns — the cron runner,
 * the job workers and the knowledge-graph sync — does not start here, or
 * monitoring rules and scheduled reports would fire twice. The Node handlers
 * stay in the tree, unreached, for parity comparison against a Node-only
 * server (ERS_RUST_API_URL unset).
 */
const RUST = rustApiUrl();

if (RUST) {
  console.log(`[server] Backend: Rust at ${RUST} (workers, cron and graph sync run there)`);
} else {
  // Start background workers (Trigger.dev or on-premise cron runner)
  initializeWorkers().catch((err) =>
    console.error("[server] Worker init failed (non-fatal):", err)
  );

  // Bootstrap Apache AGE knowledge graph, then sync schema + config metadata
  initGraph()
    .then(() => syncKnowledgeGraph())
    .catch((err) => console.warn("[server] Knowledge graph init failed (non-fatal):", err));
}

/**
 * Hand one request to the Rust backend and its response back, headers and
 * all (several `Set-Cookie`s included). The client's address goes along as
 * `X-Forwarded-For` only when a proxy in front already set it: the sign-in
 * rate limit is per address, and it trusts one forwarded value, not a list.
 */
async function toRust(base: string, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.delete("host");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  // `globalThis`: this module exports its own `fetch` handler.
  return globalThis.fetch(`${base}${withoutBase(url.pathname)}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });
}

/**
 * With Rust as the backend, which `/api/` requests Node still answers: only
 * the CopilotKit runtime, a JavaScript library's own protocol with no data
 * access of its own. Everything else Node has under `/api/` — the Better
 * Auth paths this application never calls, the dead `voice/ws` (P-18) — is
 * a 404, so the Node backend is disabled but present, not half-live.
 */
function nodeStillServes(pathname: string): boolean {
  return pathname === "/api/copilotkit" || pathname.startsWith("/api/copilotkit/");
}

const fetch: RequestHandler<Register> = async (request, opts) => {
  const pathname = withoutBase(new URL(request.url).pathname);
  const api = RUST !== null && pathname.startsWith("/api/");
  const response =
    api && isRustRoute(request.method, pathname)
      ? await toRust(RUST, request)
      : api && !nodeStillServes(pathname)
        ? Response.json({ error: "Not found" }, { status: 404 })
        : await (async () => {
            // With Rust as the backend it owns the schema and the bootstrap
            // rows (rust/src/bootstrap.rs), so a page render does not wait on
            // Node running the same bootstrap a second time.
            if (!RUST) await waitForDatabaseReady();
            return handler(request, opts);
          })();

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// Graceful shutdown for proper database cleanup
if (typeof process !== "undefined" && process.versions?.node) {
  const shutdown = async () => {
    console.log("[server] Closing database connections...");
    await shutdownWorkers();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

export default { fetch };
