import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { readSessionToken, verifySession } from "@/lib/auth/session";
import { forwardToRust } from "@/lib/api/backend";
import { getDb } from "@/lib/db/config";

async function getSession() {
  const cookie = getRequestHeader("cookie") || "";
  const token = readSessionToken(cookie);
  if (!token) return null;
  return verifySession(token);
}

export const fetchNotificationsFn = createServerFn({ method: "GET" })
  .inputValidator((data: { includeRead?: boolean }) => data)
  .handler(async ({ data: { includeRead = false } }) => {
    try {
      const forwarded = await forwardToRust<{
        success: boolean;
        data: Record<string, string | number | boolean | null>[];
        error?: string;
      }>("GET", `/api/notifications/inbox?includeRead=${includeRead}`);
      if (forwarded) return forwarded;

      const session = await getSession();
      if (!session?.user) {
        return { success: false, data: [], error: "Unauthorized" };
      }

      const db = getDb();
      let query = (db as any)
        .selectFrom("notifications")
        .where("user_id", "=", session.user.id)
        .orderBy("created_at", "desc")
        .limit(50);

      if (!includeRead) {
        query = query.where("is_read", "=", 0);
      }

      const rows = await query.selectAll().execute();
      return { success: true, data: rows };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
      };
    }
  });

export const markNotificationAsReadFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }) => {
    try {
      const forwarded = await forwardToRust<{ success: boolean; error?: string }>(
        "POST",
        `/api/notifications/${encodeURIComponent(id)}/read`
      );
      if (forwarded) return forwarded;

      const session = await getSession();
      if (!session?.user) {
        return { success: false, error: "Unauthorized" };
      }

      const db = getDb();
      await (db as any)
        .updateTable("notifications")
        .set({ is_read: 1 })
        .where("id", "=", id)
        .where("user_id", "=", session.user.id)
        .execute();

      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update notification",
      };
    }
  });

export const markAllNotificationsAsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const forwarded = await forwardToRust<{ success: boolean; error?: string }>(
      "POST",
      "/api/notifications/read-all"
    );
    if (forwarded) return forwarded;

    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();
    await (db as any)
      .updateTable("notifications")
      .set({ is_read: 1 })
      .where("user_id", "=", session.user.id)
      .where("is_read", "=", 0)
      .execute();

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notifications",
    };
  }
});

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }) => {
    try {
      const forwarded = await forwardToRust<{ success: boolean; error?: string }>(
        "DELETE",
        `/api/notifications/${encodeURIComponent(id)}`
      );
      if (forwarded) return forwarded;

      const session = await getSession();
      if (!session?.user) {
        return { success: false, error: "Unauthorized" };
      }

      const db = getDb();
      await (db as any)
        .deleteFrom("notifications")
        .where("id", "=", id)
        .where("user_id", "=", session.user.id)
        .execute();

      return { success: true };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete notification",
      };
    }
  });
