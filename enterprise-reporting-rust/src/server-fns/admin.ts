import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  getUserSchema,
  changePasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersInput,
  type GetUserInput,
  type ChangePasswordInput,
} from "@/lib/schemas/users";
import {
  createRoleSchema,
  updateRoleSchema,
  getRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
  type GetRoleInput,
} from "@/lib/schemas/roles";
import { requireAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db/config";
import { logAudit } from "@/lib/security/audit";
import { isAdmin } from "@/lib/permissions/permissions";
import { withErrorHandler } from "@/lib/server-fns/with-error-handler";
import { BCRYPT_COST } from "@/lib/auth/bcrypt-cost";
import { forwardToRust } from "@/lib/api/backend";

// With ERS_RUST_API_URL set, each function below forwards to its REST twin in
// the Rust backend (rust/MIGRATION_PLAN.md §6.2) after its input schema has run.
interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
interface ListUsersResult {
  items: Array<AdminUser & { roles: Array<{ id: string; name: string }> }>;
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
interface ParsedRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string | null;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const listUsers = createServerFn({ method: "GET" })
  .inputValidator(listUsersSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<ListUsersResult>(
      "GET",
      `/api/admin/users/page?page=${input.page ?? 0}&pageSize=${input.pageSize ?? 20}`
    );
    if (forwarded) return forwarded;

    const session = await requireAuth();

    return withErrorHandler(
      async () => {
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const page = input.page ?? 0;
        const pageSize = Math.min(input.pageSize ?? 20, 100);

        const db = getDb();
        const users = await db
          .selectFrom("users")
          .select([
            "id",
            "email",
            "display_name",
            "avatar_url",
            "is_active",
            "created_at",
            "updated_at",
          ])
          .orderBy("created_at", "desc")
          .offset(page * pageSize)
          .limit(pageSize)
          .execute();

        // Fetch roles for each user
        const usersWithRoles = await Promise.all(
          users.map(async (user) => {
            const roles = await db
              .selectFrom("user_roles as ur")
              .innerJoin("roles as r", "r.id", "ur.role_id")
              .select(["r.id", "r.name"])
              .where("ur.user_id", "=", user.id)
              .execute();
            return { ...user, roles };
          })
        );

        const countResult = await db
          .selectFrom("users")
          .select(db.fn.count<number>("id").as("count"))
          .executeTakeFirst();
        const total = Number(countResult?.count ?? 0);

        return {
          items: usersWithRoles,
          meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
        };
      },
      {
        user: session.user,
        action: "listUsers",
        resourceType: "user",
        details: { operation: "list" },
      }
    );
  });

export const getUser = createServerFn({ method: "GET" })
  .inputValidator(getUserSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<AdminUser>(
      "GET",
      `/api/admin/users/${encodeURIComponent(input.id)}`
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        const user = await db
          .selectFrom("users")
          .select([
            "id",
            "email",
            "display_name",
            "avatar_url",
            "is_active",
            "created_at",
            "updated_at",
          ])
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!user) {
          throw new Error("NOT_FOUND");
        }

        return user;
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "getUser", userId: input.id },
      }
    );
  });

export const createUser = createServerFn({ method: "POST" })
  .inputValidator(createUserSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ id: string }>("POST", "/api/admin/users", input);
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();

        // Check for existing user
        const existing = await db
          .selectFrom("users")
          .select("id")
          .where("email", "=", input.email)
          .executeTakeFirst();

        if (existing) {
          throw new Error("CONFLICT: User with this email already exists");
        }

        const userId = randomUUID();
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
        const now = new Date().toISOString();

        await db
          .insertInto("users")
          .values({
            id: userId,
            email: input.email,
            password_hash: passwordHash,
            display_name: input.displayName,
            avatar_url: null,
            is_active: input.isActive ?? true,
            created_at: now,
            updated_at: now,
          })
          .execute();

        // Assign roles if provided
        if (input.roleIds && input.roleIds.length > 0) {
          await db
            .insertInto("user_roles")
            .values(
              input.roleIds.map((roleId) => ({
                user_id: userId,
                role_id: roleId,
                assigned_at: new Date().toISOString(),
              }))
            )
            .execute();
        }

        await logAudit({
          userId: session.user.id,
          action: "create",
          resourceType: "user",
          resourceId: userId,
          details: { email: input.email, displayName: input.displayName },
        });

        return { id: userId };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "createUser", email: input.email },
      }
    );
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator(updateUserSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ success: boolean }>(
      "PUT",
      `/api/admin/users/${encodeURIComponent(input.id)}`,
      input
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        // Only existence is needed here, and `users` carries a legacy
        // credential column — a query that never asks for it cannot leak it.
        const existing = await db
          .selectFrom("users")
          .select("id")
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.email !== undefined) updates.email = input.email;
        if (input.displayName !== undefined) updates.display_name = input.displayName;
        if (input.isActive !== undefined) updates.is_active = input.isActive;

        await db.updateTable("users").set(updates).where("id", "=", input.id).execute();

        // Update roles if provided
        if (input.roleIds !== undefined) {
          await db.deleteFrom("user_roles").where("user_id", "=", input.id).execute();
          if (input.roleIds.length > 0) {
            await db
              .insertInto("user_roles")
              .values(
                input.roleIds.map((roleId) => ({
                  user_id: input.id,
                  role_id: roleId,
                  assigned_at: new Date().toISOString(),
                }))
              )
              .execute();
          }
        }

        await logAudit({
          userId: session.user.id,
          action: "update",
          resourceType: "user",
          resourceId: input.id,
          details: { email: input.email },
        });

        return { success: true };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "updateUser", userId: input.id },
      }
    );
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(getUserSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ success: boolean }>(
      "DELETE",
      `/api/admin/users/${encodeURIComponent(input.id)}`
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        // Prevent deletion of self
        if (input.id === session.user.id) {
          throw new Error("FORBIDDEN: Cannot delete your own account");
        }

        const db = getDb();
        // Only existence is needed here, and `users` carries a legacy
        // credential column — a query that never asks for it cannot leak it.
        const existing = await db
          .selectFrom("users")
          .select("id")
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        await db.deleteFrom("user_roles").where("user_id", "=", input.id).execute();
        await db.deleteFrom("users").where("id", "=", input.id).execute();

        await logAudit({
          userId: session.user.id,
          action: "delete",
          resourceType: "user",
          resourceId: input.id,
        });

        return { success: true };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "deleteUser", userId: input.id },
      }
    );
  });

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(changePasswordSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ success: boolean }>(
      "POST",
      `/api/admin/users/${encodeURIComponent(input.id)}/password`,
      input
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin && input.id !== session.user.id) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();

        // The credential lives in `auth_accounts`, not `users.password_hash` —
        // Better Auth is the only reader, and it looks there. Writing the old
        // column instead is the silent version of this bug: the change reports
        // success and sign-in keeps accepting the OLD password, because nothing
        // Better Auth reads ever changed.
        const credential = await db
          .selectFrom("auth_accounts")
          .select(["id", "password"])
          .where("user_id", "=", input.id)
          .where("provider_id", "=", "credential")
          .executeTakeFirst();

        if (!credential?.password) {
          throw new Error("NOT_FOUND");
        }

        const isValid = await bcrypt.compare(input.currentPassword, credential.password);
        if (!isValid) {
          throw new Error("UNAUTHORIZED: Current password is incorrect");
        }

        // bcrypt to match the hash/verify hooks configured on Better Auth.
        const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
        await db
          .updateTable("auth_accounts")
          .set({ password: newPasswordHash, updated_at: new Date() })
          .where("id", "=", credential.id)
          .execute();

        // Every other session for this user is now stale. Ending them is the
        // point of changing a password: a stolen session must not survive it.
        await db.deleteFrom("auth_sessions").where("user_id", "=", input.id).execute();

        await logAudit({
          userId: session.user.id,
          action: "update",
          resourceType: "user",
          resourceId: input.id,
          details: { operation: "changePassword" },
        });

        return { success: true };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "changePassword", userId: input.id },
      }
    );
  });

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

export const listRoles = createServerFn({ method: "GET" }).handler(async () => {
  const forwarded = await forwardToRust<ParsedRole[]>("GET", "/api/admin/roles/parsed");
  if (forwarded) return forwarded;

  return withErrorHandler(
    async () => {
      const session = await requireAuth();
      const admin = await isAdmin(session.user.id);
      if (!admin) {
        throw new Error("FORBIDDEN");
      }

      const db = getDb();
      const roles = await db.selectFrom("roles").selectAll().orderBy("name", "asc").execute();

      return roles.map((r) => ({
        ...r,
        permissions: typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions,
      }));
    },
    {
      userId: (await requireAuth()).user.id,
      action: "execute",
      details: { operation: "listRoles" },
    }
  );
});

export const getRole = createServerFn({ method: "GET" })
  .inputValidator(getRoleSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<ParsedRole>(
      "GET",
      `/api/admin/roles/${encodeURIComponent(input.id)}`
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        const role = await db
          .selectFrom("roles")
          .selectAll()
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!role) {
          throw new Error("NOT_FOUND");
        }

        return {
          ...role,
          permissions:
            typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions,
        };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "getRole", roleId: input.id },
      }
    );
  });

export const createRole = createServerFn({ method: "POST" })
  .inputValidator(createRoleSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ id: string }>("POST", "/api/admin/roles", input);
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        const roleId = randomUUID();
        const now = new Date().toISOString();

        await db
          .insertInto("roles")
          .values({
            id: roleId,
            name: input.name,
            description: input.description ?? null,
            permissions: JSON.stringify(input.permissions || []),
            created_at: now,
          })
          .execute();

        await logAudit({
          userId: session.user.id,
          action: "create",
          resourceType: "role",
          resourceId: roleId,
          details: { name: input.name },
        });

        return { id: roleId };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "createRole", name: input.name },
      }
    );
  });

export const updateRole = createServerFn({ method: "POST" })
  .inputValidator(updateRoleSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ success: boolean }>(
      "PUT",
      `/api/admin/roles/${encodeURIComponent(input.id)}`,
      input
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        const existing = await db
          .selectFrom("roles")
          .selectAll()
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        const updates: Record<string, unknown> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.permissions !== undefined)
          updates.permissions = JSON.stringify(input.permissions);

        await db.updateTable("roles").set(updates).where("id", "=", input.id).execute();

        await logAudit({
          userId: session.user.id,
          action: "update",
          resourceType: "role",
          resourceId: input.id,
          details: { name: input.name },
        });

        return { success: true };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "updateRole", roleId: input.id },
      }
    );
  });

export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator(getRoleSchema)
  .handler(async ({ data: input }) => {
    const forwarded = await forwardToRust<{ success: boolean }>(
      "DELETE",
      `/api/admin/roles/${encodeURIComponent(input.id)}`
    );
    if (forwarded) return forwarded;

    return withErrorHandler(
      async () => {
        const session = await requireAuth();
        const admin = await isAdmin(session.user.id);
        if (!admin) {
          throw new Error("FORBIDDEN");
        }

        const db = getDb();
        const existing = await db
          .selectFrom("roles")
          .selectAll()
          .where("id", "=", input.id)
          .executeTakeFirst();

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        // Check if role is in use
        const usageCount = await db
          .selectFrom("user_roles")
          .select(db.fn.count<number>("role_id").as("count"))
          .where("role_id", "=", input.id)
          .executeTakeFirst();

        if ((usageCount?.count ?? 0) > 0) {
          throw new Error("IN_USE: Cannot delete role that is assigned to users");
        }

        await db.deleteFrom("roles").where("id", "=", input.id).execute();

        await logAudit({
          userId: session.user.id,
          action: "delete",
          resourceType: "role",
          resourceId: input.id,
        });

        return { success: true };
      },
      {
        userId: (await requireAuth()).user.id,
        action: "execute",
        details: { operation: "deleteRole", roleId: input.id },
      }
    );
  });
