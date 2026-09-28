import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Lazy, like every other server-only import here: the logger is Pino,
        // which a client bundle cannot carry.
        const { getLogger } = await import("@appwithai/core/logging");
        const log = getLogger("auth");

        const { AUTH_REGISTER_LIMIT, enforceRateLimit } = await import("@/lib/rate-limit");

        // Signup abuse protection: 3 registrations per minute per IP.
        const limited = enforceRateLimit(request, "auth:register", AUTH_REGISTER_LIMIT);
        if (limited) {
          log.event("auth.signin.refused", { reason: "rate-limited" });
          return limited;
        }

        const { getDatabase, runMigrations } = await import("@appwithai/core/services");

        // One implementation, in `lib/password.ts`: login, registration and
        // the bootstrap have to agree byte for byte or the account they make
        // is one nobody can sign into.
        const { hashPassword } = await import("@/lib/password");

        try {
          await runMigrations();
          const db = getDatabase();
          const body = await request.json();
          const { email, password, name } = body as {
            email: string;
            password: string;
            name: string;
          };

          if (!email || !password || !name) {
            return new Response(
              JSON.stringify({ error: "Name, email and password are required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          if (password.length < 8) {
            return new Response(
              JSON.stringify({ error: "Password must be at least 8 characters" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Check if user already exists
          const existingUser = await db
            .selectFrom("auth_users" as any)
            .selectAll()
            .where("email" as any, "=", email)
            .executeTakeFirst();

          if (existingUser) {
            return new Response(JSON.stringify({ error: "Email already registered" }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Create user
          const userId = crypto.randomUUID();
          const now = new Date().toISOString();
          const passwordHash = await hashPassword(password);

          await db
            .insertInto("auth_users" as any)
            .values({
              id: userId,
              email,
              name,
              passwordHash,
              emailVerified: false,
              status: "pending",
              role: "user",
              createdAt: now,
              updatedAt: now,
            } as any)
            .execute();

          log.event("auth.registration.accepted", { userId });

          return new Response(
            JSON.stringify({
              pending: true,
              message: "Registration successful! Your account is pending admin approval.",
              userId,
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          log.event("auth.request.failed", {
            route: "auth/register",
            reason: error instanceof Error ? error.message : String(error),
          });
          const message = error instanceof Error ? error.message : "Registration failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
