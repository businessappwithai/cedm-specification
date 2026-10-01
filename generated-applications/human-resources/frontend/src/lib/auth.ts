/**
 * Authentication Client
 *
 * Talks to the Loco backend's own auth routes. This is the one place the API
 * contract deliberately changed in the migration (decision D1): better-auth's
 * `/api/auth/*` catch-all — `sign-in/email`, `sign-up/email`, `sign-out`,
 * `get-session` — is gone, replaced by explicit handlers over Loco's native
 * JWT. Calling the old paths returns Loco's 404 page, which is what the login
 * screen used to render as "Sign in failed — Not Found".
 *
 *   POST /api/auth/login     -> { token, user }
 *   POST /api/auth/register  -> { user }
 *   POST /api/auth/logout
 *   GET  /api/auth/me        -> { user }
 *
 * Paths are relative so they go through the Vite dev proxy and stay same-origin
 * with the app. The backend sets the session as an httpOnly cookie *and*
 * returns the JWT in the body; `credentials: "include"` carries the cookie, and
 * the caller persists the token for `api-client` to send as a bearer header
 * after a hard navigation, when a client-side store would have been lost.
 */

const AUTH_BASE = "/api/auth";

/** Where the bearer token lives between a hard navigation and the next render. */
const TOKEN_KEY = "auth_token";

async function authFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const hasBody = options.body != null;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }

    // `/api/auth/me` is the only authenticated call here, and it can run before
    // the cookie is readable (first paint after a hard navigation). Sending the
    // stored token too means the session survives that window.
    const token =
      typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${AUTH_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers,
    });

    const text = await res.text();
    let body: T | null = null;
    try {
      body = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const message =
        (body as Record<string, string>)?.message ||
        (body as Record<string, string>)?.error ||
        res.statusText;
      return { data: null, error: message };
    }

    return { data: body, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function signIn(email: string, password: string) {
  const result = await authFetch<{ token?: string; user?: unknown }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Persisted here rather than at the call site so every entry point into
  // sign-in gets the same behaviour.
  const token = result.data?.token;
  if (token && typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
  return result;
}

/**
 * Register an account. Note this does *not* sign you in — the backend returns
 * the created user and no token, so the caller must follow with `signIn`.
 */
export async function signUp(email: string, password: string, name: string) {
  return authFetch("/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function signOut() {
  const result = await authFetch("/logout", { method: "POST" });
  // Drop the token whatever the server said. A logout that leaves a usable
  // bearer token behind has not logged anyone out.
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
  return result;
}

export async function getSession() {
  return authFetch<{ user?: unknown }>("/me");
}
