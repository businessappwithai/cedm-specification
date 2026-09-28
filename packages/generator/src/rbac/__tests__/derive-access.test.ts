/**
 * Tests for the roles, users and visibility the generated application seeds.
 *
 * The properties worth holding are the ones a reader can check by signing in:
 * every declared role exists, every role has an account, and an entity is
 * hidden from a role only when the model restricted *reading* it.
 */

import { describe, expect, it } from "vitest";
import type { RbacDeclaration } from "../../model/records";
import { compileRbacDeclarations } from "../index";
import { deriveAccess } from "../roles";

const compile = (rules: RbacDeclaration[]) =>
  compileRbacDeclarations(rules, ["Lead", "Account", "SupportCase", "Order"]);

const derive = (rules: RbacDeclaration[]) =>
  deriveAccess(compile(rules), { projectId: "acme-crm" });

describe("derived access", () => {
  it("always seeds an administrator and a role-less user", () => {
    const access = derive([]);
    expect(access.roles.map((role) => role.name)).toEqual(["Administrator", "User"]);
    expect(access.roles[0]?.isAdmin).toBe(true);
    expect(access.users[0]?.email).toBe("admin@admin.com");
  });

  it("seeds a role for every role the model names, once", () => {
    const access = derive([
      { roles: ["sales_rep", "sales_manager"], entity: "Lead", target: "*" },
      { roles: ["sales_manager"], entity: "Lead", target: "delete" },
      { roles: ["support_agent"], entity: "SupportCase", target: "*" },
    ]);
    expect(access.roles.map((role) => role.name)).toEqual([
      "Administrator",
      "User",
      "Sales Manager",
      "Sales Rep",
      "Support Agent",
    ]);
  });

  it("does not seed a second Administrator when the model names one", () => {
    const access = derive([{ roles: ["administrator"], entity: "Order", target: "delete" }]);
    expect(access.roles.filter((role) => role.name === "Administrator")).toHaveLength(1);
  });

  it("gives every role exactly one account, on the project's domain", () => {
    const access = derive([{ roles: ["sales_rep"], entity: "Lead", target: "*" }]);
    expect(access.users).toHaveLength(access.roles.length);
    const sales = access.users.find((user) => user.roleName === "Sales Rep");
    /* A dot, not an underscore: it is a sign-in box, and every directory in the
       world spells an address this way. */
    expect(sales?.email).toBe("sales.rep@acme-crm.example.com");
    expect(sales?.isAdmin).toBe(false);
  });

  it("makes an entity visible only to the roles allowed to read it", () => {
    const access = derive([
      { roles: ["sales_rep", "sales_manager"], entity: "Lead", target: "*" },
      { roles: ["support_agent"], entity: "SupportCase", target: "read" },
    ]);
    expect(access.entityVisibility["Lead"]).toEqual(["sales_manager", "sales_rep"]);
    expect(access.entityVisibility["SupportCase"]).toEqual(["support_agent"]);
    expect(access.scoped).toBe(true);
  });

  it("leaves navigation alone for a restriction that is not about reading", () => {
    /* The whole reason visibility is derived from `read` and nothing else: a
       model protecting deletion must not thereby hide the window. */
    const access = derive([
      { roles: ["administrator"], entity: "Order", target: "delete" },
      { roles: ["sales_manager"], entity: "Lead", target: "update" },
    ]);
    expect(access.entityVisibility).toEqual({});
    expect(access.scoped).toBe(false);
    /* …but the roles it named still have to exist and be signable-in. */
    expect(access.roles.map((role) => role.name)).toContain("Sales Manager");
  });

  it("merges two rules that both grant read on one entity", () => {
    const access = derive([
      { roles: ["sales_rep"], entity: "Account", target: "read" },
      { roles: ["support_agent"], entity: "Account", target: "read" },
    ]);
    expect(access.entityVisibility["Account"]).toEqual(["sales_rep", "support_agent"]);
  });
});
