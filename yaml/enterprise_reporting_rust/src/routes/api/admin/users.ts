import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server/response";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/config";
import { isAdmin } from "@/lib/permissions/permissions";

async function getSession(request: Request) {
  return auth(request);
}

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await getSession(request);
          if (!session?.user) {
            return json(
              { success: false, error: { message: "Not authenticated" } },
              { status: 401 }
            );
          }

          const adminCheck = await isAdmin(session.user.id);
          if (!adminCheck) {
            return json(
              { success: false, error: { message: "Insufficient permissions" } },
              { status: 403 }
            );
          }

          /*
           * Named columns, not `selectAll()`.
           *
           * `users` carries `password_hash` — a legacy bcrypt credential that
           * Better Auth no longer reads but that is still populated for every
           * account predating the migration. This route selected the whole row
           * behind a session check alone, so any authenticated user could
           * retrieve every account's hash and attack them offline.
           *
           * The administrator check above fixes who may call this. Listing the
           * columns fixes what it can ever return, which is the half that
           * survives somebody adding a second caller: a screen listing users
           * has no use for a credential, and the safest way to keep one out of
           * a response is for the query never to ask for it.
           */
          const db = getDb();
          const users = await db
            .selectFrom("users")
            .select([
              "id",
              "email",
              "display_name",
              "avatar_url",
              "email_verified",
              "is_active",
              "created_at",
              "updated_at",
            ])
            .orderBy("created_at", "desc")
            .execute();

          return json({ success: true, data: users });
        } catch (error) {
          console.error("Error fetching users:", error);
          return json(
            { success: false, error: { message: "Failed to fetch users" } },
            { status: 500 }
          );
        }
      },
    },
  },
});
