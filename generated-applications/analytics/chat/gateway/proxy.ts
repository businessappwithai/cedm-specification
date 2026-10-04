/**
 * The person's Harness host, reached through the gateway.
 *
 * Everything under the chat's mount that is not the gateway's own (`/_/…`) is
 * the Harness Web client and its API, served by the person's own host. The
 * gateway rewrites three things on the way through and nothing else:
 *
 * - **the path** — the mount is taken off; the Harness page carries
 *   `<base href="./">`, so it is correct at any prefix;
 * - **`Host` and `Origin`** — set to the host's own loopback authority, which
 *   its browser-trust fence requires and its cookie is bound to;
 * - **the cookie** — the browser's cookies are dropped and the host's
 *   authentication cookie, which only the gateway holds, is sent instead.
 *
 * And it refuses Remote calls outside {@link REMOTE_ALLOWLIST}. The composition
 * already removed every Host API over the machine; this is the second wall, and
 * it is the one that closes `workspace/create`, which would otherwise let a
 * browser make any directory a session's working directory.
 */

import type { RunningHost } from "./hosts";

/**
 * Remote namespaces the business chat uses. Each either names the methods it
 * may not use (`deny`) or, where most of the namespace is dangerous, the only
 * ones it may (`allow`).
 */
export const REMOTE_ALLOWLIST: Record<string, { deny?: string[]; allow?: string[] }> = {
  session: {},
  commands: {},
  skills: {},
  userQuestions: {},
  sessionReferenceResolver: {},
  workspace: { deny: ["create"] },
  // The client reads its display preferences here (the transcript mode that
  // keeps the application's screens unfolded). Writes stay closed: `settings`
  // edits any plugin's live configuration, the DeepSeek provider's `baseURL`
  // among them — and a repointed base URL is the server's API key sent to an
  // address the person chose.
  settings: { allow: ["describe"] },
};

/** The stream every client opens for host events; not an RPC namespace. */
const EVENT_STREAM = "$events";

/** `null` when a Remote endpoint (`namespace/method`) may be used, else why not. */
export function refuseEndpoint(endpoint: string): string | null {
  if (endpoint === EVENT_STREAM) return null;
  const match = /^([A-Za-z]+)\/([A-Za-z]+)$/.exec(endpoint);
  if (!match) return `${endpoint} is not part of the business chat`;
  const [, namespace, name] = match;
  const rule = REMOTE_ALLOWLIST[namespace!];
  if (!rule) return `${namespace} is not part of the business chat`;
  if (rule.allow && !rule.allow.includes(name!)) return `${namespace}/${name} is not available in the business chat`;
  if (rule.deny?.includes(name!)) return `${namespace}/${name} is not available in the business chat`;
  return null;
}

/**
 * Check one browser-to-host frame on `/api/remote.mux`.
 *
 * The mux carries the same Remote calls as the unary routes — a stream is
 * opened by naming an `endpoint` — so the allowlist has to hold here too, or a
 * hand-written client opens on the socket what the HTTP route refuses. The
 * frame shapes are Harness's own (`parseRemoteStreamClientMessage`): text,
 * JSON, `open` naming an endpoint, then `item`, `cancel` and `end` on a stream
 * it opened.
 *
 * `opened` is this socket's set of allowed streams; an `open` that passes is
 * added to it.
 */
export function checkMuxFrame(
  message: string | Buffer | ArrayBuffer | Uint8Array,
  opened: Set<string>
): { forward: true } | { forward: false; reply?: string; close?: string } {
  if (typeof message !== "string") return { forward: false, close: "binary frames are not part of the protocol" };
  let frame: { type?: unknown; streamId?: unknown; endpoint?: unknown };
  try {
    frame = JSON.parse(message);
  } catch {
    return { forward: false, close: "malformed frame" };
  }
  const streamId = typeof frame.streamId === "string" && frame.streamId.length > 0 ? frame.streamId : null;
  if (!streamId) return { forward: false, close: "frame without a stream" };
  if (frame.type === "open") {
    const reason = typeof frame.endpoint === "string" ? refuseEndpoint(frame.endpoint) : "open without an endpoint";
    if (reason) {
      return {
        forward: false,
        reply: JSON.stringify({ type: "error", streamId, error: { code: "FORBIDDEN", message: reason, details: {} } }),
      };
    }
    opened.add(streamId);
    return { forward: true };
  }
  if (frame.type === "item" || frame.type === "cancel" || frame.type === "end") {
    if (!opened.has(streamId)) return { forward: false };
    if (frame.type !== "item") opened.delete(streamId);
    return { forward: true };
  }
  return { forward: false, close: "unknown frame type" };
}

const REMOTE_PATH = /^\/api\/([A-Za-z]+)\/([A-Za-z]+)$/;

/** `null` when the request may pass, else the reason it may not. */
export function refuseRemote(method: string, path: string): string | null {
  if (!path.startsWith("/api/")) return null;
  if (path === "/api/remote.mux") return null;
  const match = REMOTE_PATH.exec(path);
  if (!match) {
    // Non-RPC routes. The session-log download is the one the chat keeps;
    // `/api/file?path=` is refused because it reads any absolute path through
    // the host's filesystem provider, which no part of a business chat needs.
    return path === "/api/session.export" && (method === "GET" || method === "POST")
      ? null
      : `${path} is not part of the business chat`;
  }
  const [, namespace, name] = match;
  return refuseEndpoint(`${namespace}/${name}`);
}

/** Response and request headers that do not cross a proxy. */
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "cookie",
  "origin",
  "referer",
  "content-length",
]);

export function hostAuthority(host: RunningHost): string {
  return `127.0.0.1:${host.port}`;
}

/** Forward one HTTP request to the person's host. */
export async function proxyHttp(request: Request, host: RunningHost, innerPath: string): Promise<Response> {
  const url = new URL(request.url);
  const target = `http://${hostAuthority(host)}${innerPath}${url.search}`;
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers.set(name, value);
  }
  headers.set("host", hostAuthority(host));
  headers.set("cookie", host.cookie);
  if (request.headers.has("origin")) headers.set("origin", `http://${hostAuthority(host)}`);
  // A same-origin request as far as the host can tell, which it is: the browser
  // is talking to the gateway, and the gateway to its own loopback host.
  headers.set("sec-fetch-site", "same-origin");

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
    // @ts-expect-error -- Bun/undici accept `duplex` for a streamed request body.
    duplex: "half",
  });

  const responseHeaders = new Headers();
  for (const [name, value] of upstream.headers) {
    const lower = name.toLowerCase();
    // The host's own cookie stays with the gateway. `fetch` has already decoded
    // a compressed body, so its encoding header no longer describes what we send.
    if (lower === "set-cookie" || lower === "content-encoding" || HOP_BY_HOP.has(lower)) continue;
    responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}
