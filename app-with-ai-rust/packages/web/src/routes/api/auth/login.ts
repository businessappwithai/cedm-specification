import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Lazy, like every other server-only import in this handler: the logger
        // is Pino, which writes to a file descriptor, so a static import would
        // pull `node:` builtins into the client bundle.
        const { getLogger } = await import("@appwithai/core/logging");
        const log = getLogger("auth");

        const { AUTH_LOGIN_LIMIT, enforceRateLimit } = await import("@/lib/rate-limit");

        // Brute-force protection: 10 attempts per minute per IP.
        const limited = enforceRateLimit(request, "auth:login", AUTH_LOGIN_LIMIT);
        if (limited) {
          // Worth a line of its own: a burst of these is the signal that
          // somebody is working through a password list, and it is invisible
          // in the refusals above because the handler never reaches them.
          log.event("auth.signin.refused", { reason: "rate-limited" });
          return limited;
        }

        const { setSessionCookie } = await import("@/lib/auth-server");
        const { getDatabase } = await import("@appwithai/core/services");

        // One implementation, in `lib/password.ts`: login, registration and
        // the bootstrap have to agree byte for byte or the account they make
        // is one nobody can sign into.
        const { hashPassword } = await import("@/lib/password");
        try {
          const body = await request.json();
          const { email, password } = body as { email: string; password: string };

          if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email and password are required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = getDatabase();

          const user = await db
            .selectFrom("auth_users" as any)
            .selectAll()
            .where("email" as any, "=", email)
            .executeTakeFirst();

          if (!user) {
            // The reason is recorded here and deliberately not in the response:
            // the body says the same thing for an unknown address as for a
            // wrong password, because a different one is an account-enumeration
            // oracle. An operator reading the log can still tell them apart.
            log.event("auth.signin.refused", { reason: "unknown-address" });
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const status = (user as any).status || "approved";
          const role = (user as any).role || "user";

          if (status === "pending") {
            log.event("auth.signin.refused", { reason: "pending-approval" });
            return new Response(
              JSON.stringify({
                error: "PENDING_APPROVAL",
                message:
                  "Your account is pending admin approval. Please wait for an administrator to review your registration.",
              }),
              {
                status: 403,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          if (status === "rejected") {
            log.event("auth.signin.refused", { reason: "account-rejected" });
            return new Response(
              JSON.stringify({
                error: "ACCOUNT_REJECTED",
                message: "Your account has been rejected. Please contact an administrator.",
              }),
              {
                status: 403,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Verify password
          const passwordHash = await hashPassword(password);
          const storedPasswordHash = (user as any).passwordHash;

          if (!storedPasswordHash) {
            log.event("auth.signin.refused", { reason: "no-password-set" });
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (passwordHash !== storedPasswordHash) {
            log.event("auth.signin.refused", { reason: "wrong-password" });
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Create a session
          const sessionId = crypto.randomUUID();
          const sessionToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          await db
            .insertInto("auth_sessions" as any)
            .values({
              id: sessionId,
              userId: (user as any).id,
              token: sessionToken,
              expiresAt,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any)
            .execute();

          log.event("auth.signin.succeeded", { userId: (user as any).id });

          return new Response(
            JSON.stringify({
              user: {
                id: (user as any).id,
                email: (user as any).email,
                name: (user as any).name,
                role,
                status,
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": setSessionCookie(sessionToken),
              },
            }
          );
        } catch (error) {
          log.event("auth.request.failed", {
            route: "auth/login",
            reason: error instanceof Error ? error.message : String(error),
          });
          const message = error instanceof Error ? error.message : "Login failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
