import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { forwardAuthToRust, sessionFromRust } from "@/lib/api/backend";
import { getAuth } from "@/lib/auth/better-auth";
import { getSessionFromHeaders } from "@/lib/auth/session";
import { createLogger } from "@/lib/logging/logger";
import { AUDIT_ACTIONS } from "@/types/actions";
import { LOG_COMPONENTS } from "@/types/components";

/**
 * Sign out.
 *
 * Delegated to Better Auth rather than expiring a cookie by name, and that is
 * the whole point: `signOut` DELETES THE SESSION ROW as well as clearing the
 * cookie. Clearing the cookie alone would leave a live session in the database
 * that any copy of the token still opens.
 *
 * The previous implementation wrote `session_token=; Max-Age=0` — the name of
 * the cookie this application used before Better Auth. Against the real cookie
 * (`ers.session_token`) that expires nothing: the browser keeps its session,
 * the row stays in the database, and the user is redirected to /login while
 * still signed in. Navigating back would have let them straight in.
 */
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const logger = createLogger({ component: LOG_COMPONENTS.Authentication });

  try {
    const request = getRequest();
    const headers = request?.headers ?? new Headers();

    // Read the session before ending it — afterwards there is nothing to name
    // in the audit line.
    const session = await getSessionFromHeaders(headers);

    const forwarded = await forwardAuthToRust("/api/auth/sign-out", {}, { withCookie: true });
    if (forwarded) {
      // All three expiring cookies at once: one call per cookie would leave
      // only the last.
      setResponseHeader("Set-Cookie", forwarded.headers.getSetCookie());
    } else {
      const authResponse = await getAuth().api.signOut({ headers, asResponse: true });
      for (const cookie of authResponse.headers.getSetCookie()) {
        setResponseHeader("Set-Cookie", cookie);
      }
    }

    if (session?.user) {
      logger.info("User logout", {
        userId: session.user.id,
        email: session.user.email,
        userName: session.user.name,
        action: AUDIT_ACTIONS.AUTH.LOGOUT,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.debug("Error logging logout action", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  throw redirect({ to: "/login" });
});

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const forwarded = await sessionFromRust();
  if (forwarded !== undefined) return forwarded;
  const request = getRequest();
  if (!request) return null;
  return getSessionFromHeaders(request.headers);
});
