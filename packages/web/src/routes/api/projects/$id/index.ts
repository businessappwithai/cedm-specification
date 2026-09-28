import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth-server";

let _dbReady = false;
async function ensureDb() {
  if (!_dbReady) {
    _dbReady = true;
    const { runMigrations } = await import("@appwithai/core/services");
    await runMigrations().catch((err) => console.error("[DB] Migration error:", err));
  }
}

async function checkProjectAccess(
  db: any,
  projectId: string,
  userId: string,
  requiredPermission?: "read_write"
): Promise<{ allowed: boolean; reason?: string }> {
  const project = await db
    .selectFrom("projects")
    .selectAll()
    .where("id", "=", projectId)
    .executeTakeFirst();

  if (!project) {
    return { allowed: false, reason: "Project not found" };
  }

  if ((project as any).owner_user_id === userId) {
    return { allowed: true };
  }

  const membership = await db
    .selectFrom("project_members")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!membership) {
    return { allowed: false, reason: "Access denied" };
  }

  if (requiredPermission === "read_write" && (membership as any).permission !== "read_write") {
    return { allowed: false, reason: "Insufficient permissions" };
  }

  return { allowed: true };
}

/**
 * The columns a PATCH may set, and the database column each maps to.
 *
 * The handler used to spread the request body straight into the UPDATE:
 *
 *     .set({ ...body, updated_at: now })
 *
 * which let any caller with write access set `owner_user_id` — handing the
 * project to themselves or to nobody — or `is_deleted`, or `id`. An allow-list
 * is the only version of this that is safe to read: a column added to the table
 * is not editable until someone adds it here on purpose.
 *
 * It fixes a quieter bug too. The client sends camelCase (`generatedPath`) and
 * the table is snake_case (`generated_path`), so a spread wrote a key no column
 * matched and the write was silently a no-op — the field looked saved until the
 * page was reloaded.
 */
export const EDITABLE_PROJECT_COLUMNS: Record<string, string> = {
  name: "name",
  description: "description",
  icon: "icon",
  iconColor: "icon_color",
  status: "status",
  stackType: "stack_type",
  stackVersion: "stack_version",
  port: "port",
  baseUrl: "base_url",
  databaseUrl: "database_url",
  databaseType: "database_type",
  databaseSchema: "database_schema",
  environmentVariables: "environment_variables",
  generatedPath: "generated_path",
  outputDirectory: "output_directory",
  buildConfig: "build_config",
  isTypescript: "is_typescript",
  isTailwind: "is_tailwind",
  deploymentStatus: "deployment_status",
  deploymentUrl: "deployment_url",
  uptime: "uptime",
};

/** Narrow a request body to the columns a PATCH is allowed to write. */
export function editableProjectColumns(body: Record<string, unknown>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(EDITABLE_PROJECT_COLUMNS)) {
    // A snake_case key is accepted too, so a caller already speaking the
    // database's vocabulary is not silently ignored.
    if (field in body) update[column] = body[field];
    else if (column in body) update[column] = body[column];
  }
  return update;
}

export const Route = createFileRoute("/api/projects/$id/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        await ensureDb();
        try {
          const { getDatabase } = await import("@appwithai/core/services");
          const user = await getCurrentUser(request);
          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = getDatabase();
          const id = params.id as string;

          const access = await checkProjectAccess(db, id, user.id);
          if (!access.allowed) {
            return new Response(JSON.stringify({ error: access.reason ?? "Access denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const dbProject = await db
            .selectFrom("projects")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();

          if (!dbProject) {
            return new Response(JSON.stringify({ error: "Project not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // The model: the saved YAML from the local Git state, or the current
          // `erd_versions` row for a project saved before that existed.
          //
          // `Project.modelYaml` is computed by `projectDb.findById` and read by
          // the design, logic and enhance steps, and this route — the one the
          // frontend actually calls — builds its own projection from the
          // `projects` row, which has no model column. Leaving it out here once
          // left every page reading it on its empty branch.
          const { erdVersionDb } = await import("@appwithai/core/services");
          const currentErdVersion = await erdVersionDb.getCurrentErdVersion(id);

          const gitState = await db
            .selectFrom("project_git_state")
            .selectAll()
            .where("project_id", "=", id)
            .executeTakeFirst();
          const project = {
            gitCommit: gitState?.model_commit ?? null,
            modelYaml:
              gitState?.model_code ??
              (currentErdVersion as { model_yaml?: string } | null)?.model_yaml,
            id: (dbProject as any).id,
            name: (dbProject as any).name,
            description: (dbProject as any).description,
            icon: (dbProject as any).icon,
            iconColor: (dbProject as any).icon_color,
            createdAt: (dbProject as any).created_at,
            updatedAt: (dbProject as any).updated_at,
            status: (dbProject as any).status,
            isDeleted: (dbProject as any).is_deleted,
            ownerId: (dbProject as any).owner_user_id,
            stackType: (dbProject as any).stack_type,
            port: (dbProject as any).port,
            databaseUrl: (dbProject as any).database_url,
            generatedPath: (dbProject as any).generated_path,
          };

          return new Response(JSON.stringify({ project }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error fetching project:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      PATCH: async ({ request, params }) => {
        await ensureDb();
        try {
          const { getDatabase } = await import("@appwithai/core/services");
          const user = await getCurrentUser(request);
          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (user.role === "admin") {
            return new Response(JSON.stringify({ error: "Admins cannot modify projects" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = getDatabase();
          const id = params.id as string;

          const access = await checkProjectAccess(db, id, user.id, "read_write");
          if (!access.allowed) {
            return new Response(JSON.stringify({ error: access.reason ?? "Access denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as Record<string, unknown>;
          const now = new Date().toISOString();

          const update = editableProjectColumns(body);
          if (Object.keys(update).length > 0) {
            await db
              .updateTable("projects")
              .set({ ...update, updated_at: now })
              .where("id", "=", id)
              .execute();
          }

          const dbProject = await db
            .selectFrom("projects")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();

          const project = dbProject
            ? {
                id: (dbProject as any).id,
                name: (dbProject as any).name,
                description: (dbProject as any).description,
                icon: (dbProject as any).icon,
                iconColor: (dbProject as any).icon_color,
                createdAt: (dbProject as any).created_at,
                updatedAt: (dbProject as any).updated_at,
                status: (dbProject as any).status,
                isDeleted: (dbProject as any).is_deleted,
                ownerId: (dbProject as any).owner_user_id,
                stackType: (dbProject as any).stack_type,
                port: (dbProject as any).port,
                databaseUrl: (dbProject as any).database_url,
                generatedPath: (dbProject as any).generated_path,
              }
            : null;

          return new Response(JSON.stringify({ project }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error updating project:", error);
          return new Response(JSON.stringify({ error: "Failed to update project" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      DELETE: async ({ request, params }) => {
        await ensureDb();
        try {
          const { getDatabase } = await import("@appwithai/core/services");
          const user = await getCurrentUser(request);
          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (user.role === "admin") {
            return new Response(JSON.stringify({ error: "Admins cannot delete projects" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = getDatabase();
          const id = params.id as string;

          const access = await checkProjectAccess(db, id, user.id, "read_write");
          if (!access.allowed) {
            return new Response(JSON.stringify({ error: access.reason ?? "Access denied" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const now = new Date().toISOString();
          await db
            .updateTable("projects")
            .set({ is_deleted: true, updated_at: now })
            .where("id", "=", id)
            .execute();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error deleting project:", error);
          return new Response(JSON.stringify({ error: "Failed to delete project" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
