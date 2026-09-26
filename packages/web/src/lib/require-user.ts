/**
 * Who may call a route that is not about one project.
 *
 * `requireProjectAccess` answers the project-scoped question — owner, member,
 * or neither. It has no answer for a route that lists across projects, such as
 * the diagram library with no `projectId`, and such a route must still refuse a
 * caller with no session. The shape mirrors `requireProjectAccess` deliberately,
 * so a handler guards itself the same way whichever question it is asking:
 *
 * ```ts
 * const caller = await requireUser(request, "mermaid-library");
 * if (caller.response) return caller.response;
 * ```
 *
 * `resource` and `operation` name what was being reached for; they are kept in
 * the signature so a denial can be logged without the call site changing.
 */

import { getCurrentUser } from "@/lib/auth-server";

export interface UserDenied {
  response: Response;
  user?: undefined;
}

export interface UserGranted {
  response?: undefined;
  user: { id: string; role?: string | null };
}

export type CallerAccess = UserDenied | UserGranted;

export async function requireUser(
  request: Request,
  _resource: string,
  _operation = "read"
): Promise<CallerAccess> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user: { id: user.id, role: (user as { role?: string | null }).role ?? null } };
}
