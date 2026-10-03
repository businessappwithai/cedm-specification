import { getSessionFromHeaders, type Session } from "./session";

export type { Session };

/**
 * Resolve the caller's session from a request.
 *
 * Prefer this over reading the cookie by hand: the cookie's name is Better
 * Auth's business (`ers.session_token` today, and prefixed `__Secure-` once
 * served over HTTPS), and a regex that hard-codes one spelling silently stops
 * matching the day the other applies — which reads as "everyone is signed out"
 * rather than as a bug in the matcher.
 */
export async function auth(request?: Request): Promise<Session | null> {
  let req = request;
  if (!req) {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      req = getRequest();
    } catch {
      return null;
    }
  }
  if (!req) return null;
  return getSessionFromHeaders(req.headers);
}

export async function getAuthSession(request?: Request): Promise<Session | null> {
  return auth(request);
}
