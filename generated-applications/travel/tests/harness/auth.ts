/**
 * Authentication helpers.
 *
 * The auth routes sit at /api/auth/* rather than under the resource prefix the
 * rest of the client applies, hence `absolute: true` on those calls.
 *
 * The backend issues a JWT *and* sets it as an httpOnly cookie, so the cookie
 * jar carries the session for every later request on the same client and the
 * token is there for anything that would rather send a bearer header.
 *
 * Generated: 2026-10-09T08:33:27.631Z
 * Project: travel
 */

import { config } from "./config";
import { type HttpClient, HttpError } from "./http";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface Permissions {
  role: string;
  isMaster: boolean;
  windows: Array<{
    sys_window_id: string;
    name: string;
    route: string;
    category: "admin" | "business";
    is_read_only: boolean;
  }>;
}

/**
 * Sign in with email + password. The session cookie lands in the client's jar,
 * so every later request on this client is authenticated.
 */
export async function login(
  client: HttpClient,
  email: string = config.admin.email,
  password: string = config.admin.password
): Promise<SessionUser> {
  const response = await client.post<{ user?: SessionUser; token?: string }>(
    "/api/auth/login",
    { email, password },
    { absolute: true, allowFailure: true }
  );

  if (!response.ok) {
    throw new HttpError(
      `Login failed for ${email} (${response.status}). ` +
        `Confirm the app was seeded — the bootstrap creates ${config.admin.email}. Body: ${response.raw.slice(0, 300)}`,
      response.status,
      response.data,
      "POST",
      "/api/auth/login"
    );
  }

  if (client.jar.size === 0) {
    throw new Error("Login returned 2xx but set no session cookie — the session would not persist.");
  }

  const user = response.data?.user;
  if (!user) {
    // A response carrying only a token is still a valid login — resolve the
    // user through /api/me rather than failing.
    return await currentUser(client);
  }
  return user;
}

/** Register a new account. Returns the created user. */
export async function register(
  client: HttpClient,
  email: string,
  password: string,
  name: string
): Promise<{ ok: boolean; status: number; user?: SessionUser }> {
  const response = await client.post<{ user?: SessionUser }>(
    "/api/auth/register",
    { email, password, name },
    { absolute: true, allowFailure: true }
  );
  return { ok: response.ok, status: response.status, user: response.data?.user };
}

export async function logout(client: HttpClient): Promise<void> {
  await client.post("/api/auth/logout", {}, { absolute: true, allowFailure: true });
  client.jar.clear();
}

/** The currently authenticated user, via the backend's own /api/me route. */
export async function currentUser(client: HttpClient): Promise<SessionUser> {
  const response = await client.get<{ user: SessionUser }>("/me");
  return response.data.user;
}

export async function permissions(client: HttpClient): Promise<Permissions> {
  const response = await client.get<Permissions>("/me/permissions");
  return response.data;
}

/** True when the client currently holds a usable session. */
export async function isAuthenticated(client: HttpClient): Promise<boolean> {
  const response = await client.get("/me", { allowFailure: true });
  return response.ok;
}
