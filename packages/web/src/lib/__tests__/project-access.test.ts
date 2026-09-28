/**
 * A guard is only tested by a refusal.
 *
 * Every other test in this repository signs in as somebody with access, so a
 * route that checks nothing looks exactly like a route that checks correctly.
 * These assert the four refusals and the two grants.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUser = vi.hoisted(() => ({ value: null as { id: string } | null }));
const rows = vi.hoisted(() => ({
  project: null as { id: string; owner_user_id: string | null } | null,
  membership: null as { permission: string } | null,
}));

vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: async () => currentUser.value,
}));

vi.mock("@appwithai/core/services", () => ({
  getDatabase: () => ({
    selectFrom(table: string) {
      const result = table === "projects" ? rows.project : rows.membership;
      const chain = {
        select: () => chain,
        where: () => chain,
        executeTakeFirst: async () => result ?? undefined,
      };
      return chain;
    },
  }),
}));

const { requireProjectAccess } = await import("../project-access");

const request = new Request("http://localhost/api/projects/p1");

describe("requireProjectAccess", () => {
  beforeEach(() => {
    currentUser.value = { id: "u1" };
    rows.project = { id: "p1", owner_user_id: "u1" };
    rows.membership = null;
  });

  it("refuses an anonymous caller with 401", async () => {
    currentUser.value = null;
    const access = await requireProjectAccess(request, "p1");
    expect(access.response?.status).toBe(401);
  });

  it("lets the owner through", async () => {
    const access = await requireProjectAccess(request, "p1", "read_write");
    expect(access.response).toBeUndefined();
    expect(access.user?.id).toBe("u1");
  });

  it("reports a project the caller cannot see as 404, not 403", async () => {
    // Telling an unauthorised caller that an id is real is itself a disclosure.
    rows.project = { id: "p1", owner_user_id: "someone-else" };
    const access = await requireProjectAccess(request, "p1");
    expect(access.response?.status).toBe(404);
  });

  it("reports a project that does not exist as 404", async () => {
    rows.project = null;
    const access = await requireProjectAccess(request, "nope");
    expect(access.response?.status).toBe(404);
  });

  it("lets a member read", async () => {
    rows.project = { id: "p1", owner_user_id: "someone-else" };
    rows.membership = { permission: "read" };
    const access = await requireProjectAccess(request, "p1", "read");
    expect(access.response).toBeUndefined();
  });

  it("refuses a read-only member a write with 403", async () => {
    // 403 rather than 404 here: the caller can see the project, so its
    // existence is not the secret — only the permission is.
    rows.project = { id: "p1", owner_user_id: "someone-else" };
    rows.membership = { permission: "read" };
    const access = await requireProjectAccess(request, "p1", "read_write");
    expect(access.response?.status).toBe(403);
  });
});
