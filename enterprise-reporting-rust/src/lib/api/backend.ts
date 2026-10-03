/**
 * Forward a server function to the Rust (Loco) backend when one is configured.
 *
 * TanStack server functions are RPC over `/_serverFn/…`, which a non-JS
 * backend cannot serve, so each one that has moved (rust/MIGRATION_PLAN.md
 * §6.2) calls its REST twin from here. The caller's Cookie header is passed on
 * unchanged: both backends accept the same Better Auth session.
 *
 * Returns `null` when `ERS_RUST_API_URL` is unset, and the server function
 * then runs its own (Node) implementation.
 */
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import type { Session } from "@/lib/auth/session";

/**
 * The prefix this build is served under, from Vite's `base` — `/report` when
 * the application shares an origin with another (the orchestrator's
 * `subpath-overlay.ts` sets `base` and moves the client's `/api` literals under
 * it), empty at the root.
 */
const BASE_PATH = (import.meta.env?.BASE_URL ?? "/").replace(/\/+$/, "");

/**
 * `pathname` without the build's base path, or unchanged when it does not
 * carry it.
 *
 * Rust routes `/api/…`, never `/report/api/…`. Under a prefix a request
 * arrives as `/report/api/…`, and so does a path written at a call site the
 * overlay rewrote; matching or forwarding either as-is sent the request past
 * Rust into the disabled Node handlers, or to Rust as a 404. Every path handed
 * to Rust goes through here.
 *
 * This module and `src/server.ts` are left alone by the overlay's `/api`
 * rewrite, so the literals below stay what Rust serves.
 */
export function withoutBase(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return "/";
  return pathname.startsWith(`${BASE_PATH}/`) ? pathname.slice(BASE_PATH.length) : pathname;
}

export function rustApiUrl(): string | null {
  const url = process.env.ERS_RUST_API_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

export async function forwardToRust<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T | null> {
  const base = rustApiUrl();
  if (!base) return null;
  const headers: Record<string, string> = { cookie: getRequestHeader("cookie") ?? "" };
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${base}${withoutBase(path)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // Read the body as text first: a proxy or a restarting server answers with
  // HTML or nothing, and a JSON parse error would hide the status that says
  // what actually went wrong.
  const text = await res.text();
  let payload: (T & { error?: { message?: string } | string }) | undefined;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }
  if (!res.ok || payload === undefined) {
    const e = payload?.error;
    const detail = typeof e === "string" ? e : e?.message;
    throw new Error(detail ?? `Rust backend returned ${res.status} ${res.statusText}`.trim());
  }
  return payload;
}

/**
 * Call one of Rust's Better Auth routes on the browser's behalf and hand back
 * the raw Response, so the caller can relay its `Set-Cookie` headers.
 *
 * The client's address goes along as `X-Forwarded-For`: the sign-in rate limit
 * is per address, and without it every browser would share the Vite server's
 * one bucket — five sign-ins a minute for the whole installation. The cookie
 * and origin go along only when asked (sign-out needs them; sign-in does not,
 * and a stale cookie would otherwise subject it to the origin check).
 *
 * Returns `null` when `ERS_RUST_API_URL` is unset.
 */
export async function forwardAuthToRust(
  path: string,
  body: unknown,
  opts: { withCookie: boolean }
): Promise<Response | null> {
  const base = rustApiUrl();
  if (!base) return null;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const names = opts.withCookie ? ["cookie", "origin", "referer", "user-agent"] : ["user-agent"];
  for (const name of names) {
    const value = getRequestHeader(name as "cookie");
    if (value) headers[name] = value;
  }
  const ip = getRequestIP({ xForwardedFor: true });
  if (ip) headers["x-forwarded-for"] = ip;
  return fetch(`${base}${withoutBase(path)}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * The caller's session as Rust resolves it (`GET /api/auth/session`): the
 * `getSessionFn` guards' twin. `undefined` when Rust is not configured, so the
 * caller falls back to resolving it here.
 */
export async function sessionFromRust(): Promise<Session | null | undefined> {
  if (!rustApiUrl()) return undefined;
  const result = await forwardToRust<{ session: Session | null }>("GET", "/api/auth/session");
  return result?.session ?? null;
}
