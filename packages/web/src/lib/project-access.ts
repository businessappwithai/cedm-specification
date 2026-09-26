/**
 * Who may read or edit a project.
 *
 * A project is owned by the user who created it and shared with the members
 * listed in `project_members`. That rule has to hold for every route that
 * touches a project, not just the ones that happen to remember it: a model is
 * a company's data design, and reading someone else's by guessing an id is the
 * same disclosure whether it arrives as JSON, as an `.mmd` download, or as the
 * parsed sections an editor loads.
 *
 * The check lives here rather than in each route so there is one implementation
 * to keep correct — a copy in one file and not another is exactly how the EML
 * routes ended up open while `/api/projects/$id` was closed.
 */

import { getCurrentUser } from "@/lib/auth-server";

export type ProjectPermission = "read" | "read_write";

export interface ProjectAccessDenied {
  /** The response to return as-is. Present only when access is refused. */
  response: Response;
  user?: undefined;
}

export interface ProjectAccessGranted {
  response?: undefined;
  user: { id: string };
}

export type ProjectAccess = ProjectAccessDenied | ProjectAccessGranted;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Resolve the caller and confirm they may act on this project.
 *
 * Returns either the authenticated user or the response to send back, so a
 * handler guards itself in two lines and cannot forget the failure case:
 *
 * ```ts
 * const access = await requireProjectAccess(request, params.id, "read_write");
 * if (access.response) return access.response;
 * ```
 *
 * A project that does not exist and a project the caller cannot see are both
 * reported as 404 — telling an unauthorised caller that an id is real is itself
 * a disclosure.
 */
export async function requireProjectAccess(
  request: Request,
  projectId: string,
  permission: ProjectPermission = "read"
): Promise<ProjectAccess> {
  const user = await getCurrentUser(request);
  if (!user) return { response: json({ error: "Unauthorized" }, 401) };

  const { getDatabase } = await import("@appwithai/core/services");
  const db = getDatabase();

  const project = await db
    .selectFrom("projects")
    .select(["id", "owner_user_id"])
    .where("id", "=", projectId)
    .executeTakeFirst();

  if (!project) return { response: json({ error: "Project not found" }, 404) };
  if (project.owner_user_id === user.id) return { user: { id: user.id } };

  const membership = await db
    .selectFrom("project_members")
    .select(["permission"])
    .where("project_id", "=", projectId)
    .where("user_id", "=", user.id)
    .executeTakeFirst();

  if (!membership) return { response: json({ error: "Project not found" }, 404) };

  if (permission === "read_write" && membership.permission !== "read_write") {
    return { response: json({ error: "Insufficient permissions" }, 403) };
  }

  return { user: { id: user.id } };
}

/**
 * The ids of every project this caller owns or is a member of.
 *
 * `requireProjectAccess` answers "may I touch this project". A route that lists
 * across projects — the diagram library's `GET /api/mermaid` with no
 * `projectId` — has no single project to ask about, and serving the whole
 * library for the client to filter is how that endpoint came to hand every
 * project's diagrams to anybody. This is the other half.
 */
export async function accessibleProjectIds(userId: string): Promise<Set<string>> {
  const { getDatabase } = await import("@appwithai/core/services");
  const db = getDatabase();

  const [owned, shared] = await Promise.all([
    db.selectFrom("projects").select(["id"]).where("owner_user_id", "=", userId).execute(),
    db.selectFrom("project_members").select(["project_id"]).where("user_id", "=", userId).execute(),
  ]);

  return new Set([
    ...owned.map((row) => String(row.id)),
    ...shared.map((row) => String(row.project_id)),
  ]);
}
