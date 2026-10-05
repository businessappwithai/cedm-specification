#!/usr/bin/env bun
/**
 * The business chat's gateway.
 *
 * Two listeners:
 *
 * - **Public** (`CHAT_PORT`, behind the reverse proxy at `CHAT_BASE_PATH`):
 *   the sign-in page and Better Auth (`/_/auth/*`), sign-out, the embedded-view
 *   routes the chat's nodes load (`/_/views/*`), and — for everything else —
 *   the signed-in person's own Harness host, proxied.
 * - **Internal** (`CHAT_INTERNAL_PORT`, loopback only): the tool API the
 *   person's host calls, authenticated by the secret the gateway gave it.
 *
 * Nothing on the public listener reaches a host without a chat session, and no
 * host is reachable except through this process.
 */

import { dirname, resolve } from "node:path";
import type { ServerWebSocket } from "bun";
import { ApplicationClient, ApplicationError } from "./application";
import { CLIENT_IP_HEADER, createAuth } from "./auth";
import { loadConfig } from "./config";
import { secretEquals } from "./crypto";
import { createDb, createPool, ensureDatabase, migrateGatewayTables, sweepExpired } from "./db";
import { CapacityError, HostManager, type RunningHost } from "./hosts";
import { checkMuxFrame, hostAuthority, proxyHttp, refuseRemote } from "./proxy";
import { ReportingClient } from "./reporting";
import { notFoundPage, signInPage, waitingPage } from "./pages";
import { BusinessTools, ToolRefusal } from "./tools";
import { ViewService } from "./views";

const packageDir = resolve(dirname(new URL(import.meta.url).pathname), "..");
const config = loadConfig(packageDir);
await ensureDatabase(config.databaseUrl);
const pool = createPool(config.databaseUrl, config.databaseSchema);
const db = createDb(pool);
await migrateGatewayTables(db, config.databaseSchema);

const application = new ApplicationClient(config.appApiUrl);
const reporting = config.reportApiUrl ? new ReportingClient(config.reportApiUrl) : null;
const gatewayAuth = createAuth({ config, pool, db, application, reporting });
await gatewayAuth.migrate();
const hosts = new HostManager(config);
const tools = new BusinessTools(config, db, application, reporting);
const views = new ViewService(config, db, application, reporting);

const sweeper = setInterval(() => void sweepExpired(db).catch((error) => console.error("sweep failed", error)), 10 * 60_000);
sweeper.unref();

const base = config.basePath;
const json = (status: number, body: unknown, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
const html = (status: number, body: string, headers: HeadersInit = {}) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'self'",
      ...headers,
    },
  });

interface SocketData {
  host: RunningHost;
  userId: string;
  protocols: string | null;
  upstream?: WebSocket;
  pending: Array<string | ArrayBufferLike | Uint8Array>;
  /** Streams this socket opened through the allowlist (`checkMuxFrame`). */
  streams: Set<string>;
}

/** The address a request came from: the socket, or the first hop a trusted proxy recorded. */
function clientIp(request: Request, server: Bun.Server<SocketData>): string {
  if (config.trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return server.requestIP(request)?.address ?? "unknown";
}

async function publicFetch(incoming: Request, server: Bun.Server<SocketData>): Promise<Response | undefined> {
  const headers = new Headers(incoming.headers);
  headers.set(CLIENT_IP_HEADER, clientIp(incoming, server));
  const request = new Request(incoming, { headers });
  const url = new URL(request.url);
  if (base && url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return html(404, notFoundPage(base));
  const path = url.pathname.slice(base.length) || "/";

  // ── the gateway's own routes ──────────────────────────────────────────────
  if (path.startsWith("/_/auth/")) return gatewayAuth.auth.handler(request);

  if (path === "/_/sign-in") return html(200, signInPage(base));

  if (path === "/_/sign-out" && request.method === "POST") {
    const credentials = await gatewayAuth.credentialsFor(request);
    const cleared = await gatewayAuth.signOutEverywhere(request);
    if (credentials) await hosts.stop(credentials.userId);
    const headers = new Headers({ location: `${base}/_/sign-in`, "cache-control": "no-store" });
    for (const cookie of cleared) headers.append("set-cookie", cookie);
    return new Response(null, { status: 303, headers });
  }

  if (path === "/_/health") return json(200, { status: "ok", hosts: hosts.running, capacity: hosts.capacity });

  const credentials = await gatewayAuth.credentialsFor(request);
  if (!credentials) {
    if (path.startsWith("/api/") || path.startsWith("/_/")) return json(401, { code: "UNAUTHENTICATED", message: "Sign in to the chat first." });
    return Response.redirect(`${config.publicOrigin}${base}/_/sign-in`, 303);
  }

  if (path.startsWith("/_/views/")) return views.handle(request, path.slice("/_/views/".length), credentials);

  if (path === "/_/queue") {
    await hosts.waitForTurn(credentials.userId, 25_000);
    return json(200, { position: hosts.queuePosition(credentials.userId) });
  }

  // ── the person's Harness host ─────────────────────────────────────────────
  const refusal = refuseRemote(request.method, path);
  if (refusal) return json(403, { code: "NOT_AVAILABLE", message: refusal });

  let host: RunningHost;
  try {
    host = await hosts.ensure(credentials.userId);
  } catch (error) {
    if (error instanceof CapacityError) {
      return path.startsWith("/api/")
        ? json(503, { code: "AT_CAPACITY", position: error.position }, { "retry-after": "10" })
        : html(503, waitingPage(base, error.position), { "retry-after": "10" });
    }
    console.error("host start failed", error);
    return json(502, { code: "HOST_UNAVAILABLE", message: "The chat could not start for you. Try again in a moment." });
  }
  hosts.touch(credentials.userId);

  if (path === "/api/remote.mux" && request.headers.get("upgrade")?.toLowerCase() === "websocket") {
    // Bun upgrades only the request object it handed in.
    const upgraded = server.upgrade(incoming, {
      data: { host, userId: credentials.userId, protocols: request.headers.get("sec-websocket-protocol"), pending: [], streams: new Set() },
    });
    return upgraded ? undefined : json(400, { code: "UPGRADE_FAILED", message: "WebSocket upgrade failed." });
  }
  return proxyHttp(request, host, path);
}

const publicServer = Bun.serve<SocketData>({
  hostname: config.host,
  port: config.port,
  idleTimeout: 120,
  fetch: publicFetch,
  websocket: {
    open(socket: ServerWebSocket<SocketData>) {
      const { host } = socket.data;
      hosts.streamOpened(socket.data.userId);
      const upstream = new WebSocket(`ws://${hostAuthority(host)}/api/remote.mux`, {
        headers: { cookie: host.cookie, origin: `http://${hostAuthority(host)}`, host: hostAuthority(host) },
        ...(socket.data.protocols ? { protocols: socket.data.protocols.split(",").map((p) => p.trim()) } : {}),
      } as unknown as string[]);
      upstream.binaryType = "arraybuffer";
      socket.data.upstream = upstream;
      upstream.onopen = () => {
        for (const message of socket.data.pending.splice(0)) upstream.send(message);
      };
      upstream.onmessage = (event) => socket.send(event.data as string | ArrayBuffer);
      upstream.onclose = (event) => socket.close(event.code === 1005 ? 1000 : event.code, event.reason);
      upstream.onerror = () => socket.close(1011, "chat host stream failed");
    },
    message(socket, message) {
      const upstream = socket.data.upstream;
      hosts.touch(socket.data.userId);
      const verdict = checkMuxFrame(message, socket.data.streams);
      if (!verdict.forward) {
        if (verdict.reply) socket.send(verdict.reply);
        if (verdict.close) socket.close(1008, verdict.close);
        return;
      }
      if (upstream && upstream.readyState === WebSocket.OPEN) upstream.send(message);
      else socket.data.pending.push(message);
    },
    close(socket) {
      hosts.streamClosed(socket.data.userId);
      socket.data.upstream?.close();
    },
  },
});

// ── the internal tool API ───────────────────────────────────────────────────
const internalServer = Bun.serve({
  hostname: "127.0.0.1",
  port: config.internalPort,
  async fetch(request) {
    const url = new URL(request.url);
    const match = /^\/internal\/tools\/([a-z_]+)$/.exec(url.pathname);
    if (request.method !== "POST" || !match) return json(404, { code: "NOT_FOUND", message: "No such internal route." });
    const presented = request.headers.get("x-chat-host-secret") ?? "";
    const userId = presented ? hosts.userForSecret(presented) : null;
    const host = userId ? hosts.host(userId) : null;
    if (!userId || !host || !secretEquals(presented, host.secret)) {
      return json(401, { code: "UNKNOWN_HOST", message: "This host was not started by the gateway." });
    }
    hosts.touch(userId);
    const who = await gatewayAuth.latestCredentialsForUser(userId);
    if (!who) return json(401, { code: "SESSION_ENDED", message: "The person is no longer signed in to the chat." });
    let args: Record<string, unknown>;
    try {
      args = (await request.json()) as Record<string, unknown>;
    } catch {
      return json(400, { code: "INVALID_JSON", message: "The tool arguments were not JSON." });
    }
    try {
      return json(200, await tools.handle(match[1]!, args, who));
    } catch (error) {
      if (error instanceof ToolRefusal) return json(error.status, { code: error.code, message: error.message });
      if (error instanceof ApplicationError) return json(error.status, { code: error.code, message: error.message });
      console.error(`tool ${match[1]} failed`, error);
      return json(500, { code: "TOOL_FAILED", message: "The tool failed unexpectedly." });
    }
  },
});

console.log(
  `chat gateway: ${config.publicOrigin}${base}/ (listening on ${publicServer.hostname}:${publicServer.port}; ` +
    `tools on 127.0.0.1:${internalServer.port}; up to ${hosts.capacity} hosts)`
);

const shutdown = async () => {
  publicServer.stop();
  internalServer.stop();
  await hosts.stopAll();
  await pool.end();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
