import { describe, expect, it } from "vitest";
import {
  type CompiledRbac,
  compileRbacDeclarations,
  hasRbacRules,
  type RbacStateMachine,
  rbacRoleNames,
} from "../index";
import type { RbacDeclaration } from "../../model/records";

const ENTITIES = ["Order", "Deal", "Contact"];

const rule = (roles: string[], entity: string, target: string): RbacDeclaration => ({
  roles,
  entity,
  target,
});

/** Order's lifecycle, so rules naming a transition have something to resolve against. */
const MACHINES: RbacStateMachine[] = [
  {
    entity: "Order",
    transitions: [
      { from: "[*]", to: "draft" },
      { from: "draft", to: "submitted", trigger: "submit" },
      { from: "submitted", to: "approved", trigger: "approve" },
      { from: "draft", to: "approved", trigger: "approve" },
      { from: "submitted", to: "rejected", trigger: "close won" },
      { from: "approved", to: "[*]" },
    ],
  },
];

/** Operations only — most tests care about the CRUD half. */
const ops = (rules: RbacDeclaration[], entities = ENTITIES) =>
  compileRbacDeclarations(rules, entities).operations;

describe("compileRbacDeclarations", () => {
  it("compiles a rule against the physical table", () => {
    const rules = ops([rule(["admin"], "Order", "delete")], ENTITIES);
    expect(rules).toEqual([
      { entity: "Order", tableName: "bus_order", operation: "delete", roles: ["admin"] },
    ]);
  });

  it("derives snake_case table names for multi-word entities", () => {
    const rules = ops([rule(["admin"], "Order", "delete")], ["Order"]);
    expect(rules[0]?.tableName).toBe("bus_order");
    expect(ops([rule(["a"], "SupportCase", "read")], ["SupportCase"])[0]?.tableName).toBe(
      "bus_support_case"
    );
  });

  it("expands * to every operation", () => {
    const rules = ops([rule(["admin"], "Order", "*")], ENTITIES);
    expect(rules.map((r) => r.operation)).toEqual(["create", "delete", "read", "update"]);
    expect(rules.every((r) => r.roles.length === 1)).toBe(true);
  });

  it("accepts operation aliases", () => {
    expect(ops([rule(["a"], "Order", "remove")])[0]?.operation).toBe("delete");
    expect(ops([rule(["a"], "Order", "edit")])[0]?.operation).toBe("update");
    expect(ops([rule(["a"], "Order", "view")])[0]?.operation).toBe("read");
  });

  it("merges two rules on the same pair instead of the last one winning", () => {
    // Two rules each naming a role must mean "either role", the same as one
    // rule naming both. Overriding would silently drop a permission the
    // author wrote down.
    const rules = ops(
      [rule(["admin"], "Order", "delete"), rule(["auditor"], "Order", "delete")],
      ENTITIES
    );
    expect(rules).toHaveLength(1);
    expect(rules[0]?.roles).toEqual(["admin", "auditor"]);
  });

  it("de-duplicates a role named twice", () => {
    const rules = ops(
      [rule(["admin"], "Order", "delete"), rule(["admin"], "Order", "delete")],
      ENTITIES
    );
    expect(rules[0]?.roles).toEqual(["admin"]);
  });

  it("keeps entities separate", () => {
    const rules = ops(
      [rule(["admin"], "Order", "delete"), rule(["sales"], "Deal", "update")],
      ENTITIES
    );
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.tableName)).toEqual(["bus_deal", "bus_order"]);
  });

  it("skips a rule naming an entity the model does not declare", () => {
    const warnings: string[] = [];
    const compiled = compileRbacDeclarations(
      [rule(["admin"], "Ghost", "delete")],
      ENTITIES,
      [],
      (m) => warnings.push(m)
    );
    expect(compiled.operations).toEqual([]);
    expect(warnings[0]).toContain("unknown entity");
  });

  it("skips a name that is neither an operation nor a transition", () => {
    const warnings: string[] = [];
    const compiled = compileRbacDeclarations(
      [rule(["admin"], "Order", "teleport")],
      ENTITIES,
      MACHINES,
      (m) => warnings.push(m)
    );
    expect(compiled.operations).toEqual([]);
    expect(compiled.transitions).toEqual([]);
    // The message must name both possibilities: with state machines in play,
    // "unknown operation" alone would send the author looking in one place.
    expect(warnings[0]).toContain("neither a CRUD operation");
    expect(warnings[0]).toContain("transition");
  });

  it("skips a rule that names no role, which would lock everyone out", () => {
    const warnings: string[] = [];
    const compiled = compileRbacDeclarations([rule([""], "Order", "delete")], ENTITIES, [], (m) =>
      warnings.push(m)
    );
    expect(compiled.operations).toEqual([]);
    expect(warnings[0]).toContain("names no role");
  });

  it("returns nothing for a model that declares no rbac, leaving every op open", () => {
    expect(ops([])).toEqual([]);
  });

  it("collects the distinct role names for seeding", () => {
    const compiled = compileRbacDeclarations(
      [rule(["admin", "manager"], "Order", "delete"), rule(["sales"], "Deal", "update")],
      ENTITIES
    );
    expect(rbacRoleNames(compiled)).toEqual(["admin", "manager", "sales"]);
  });
});

describe("compileRbacDeclarations — state transitions", () => {
  const compile = (rules: RbacDeclaration[]) => compileRbacDeclarations(rules, ENTITIES, MACHINES);

  it("resolves a non-CRUD name against the entity's state machine", () => {
    const { transitions, operations } = compile([rule(["manager"], "Order", "submit")]);
    expect(operations).toEqual([]);
    expect(transitions).toEqual([
      {
        entity: "Order",
        tableName: "bus_order",
        transition: "submit",
        edges: [{ from: "draft", to: "submitted" }],
        roles: ["manager"],
      },
    ]);
  });

  it("carries every edge an event names, not just the first", () => {
    // `approve` appears twice — from draft and from submitted. Keeping one
    // would leave the other path unguarded while looking restricted.
    const { transitions } = compile([rule(["manager"], "Order", "approve")]);
    expect(transitions[0]?.edges).toEqual([
      { from: "submitted", to: "approved" },
      { from: "draft", to: "approved" },
    ]);
  });

  it("matches an event written with spaces or dashes in the diagram", () => {
    // A state machine may name the trigger `close won`; an access rule spells
    // the same event `close_won`.
    const { transitions } = compile([rule(["manager"], "Order", "close_won")]);
    expect(transitions[0]?.edges).toEqual([{ from: "submitted", to: "rejected" }]);
  });

  it("merges two rules naming the same transition", () => {
    const { transitions } = compile([
      rule(["manager"], "Order", "submit"),
      rule(["admin"], "Order", "submit"),
    ]);
    expect(transitions).toHaveLength(1);
    expect(transitions[0]?.roles).toEqual(["admin", "manager"]);
  });

  it("keeps CRUD and transition rules in separate buckets", () => {
    const compiled = compile([
      rule(["admin"], "Order", "delete"),
      rule(["manager"], "Order", "submit"),
    ]);
    expect(compiled.operations).toHaveLength(1);
    expect(compiled.transitions).toHaveLength(1);
  });

  it("collects roles from both kinds for seeding", () => {
    const compiled = compile([
      rule(["admin"], "Order", "delete"),
      rule(["manager"], "Order", "submit"),
    ]);
    expect(rbacRoleNames(compiled)).toEqual(["admin", "manager"]);
    expect(hasRbacRules(compiled)).toBe(true);
  });

  it("reports nothing declared when the model has no access rules", () => {
    const compiled: CompiledRbac = compile([]);
    expect(hasRbacRules(compiled)).toBe(false);
  });

  it("cannot resolve a transition when no machine is supplied", () => {
    const warnings: string[] = [];
    const compiled = compileRbacDeclarations(
      [rule(["manager"], "Order", "submit")],
      ENTITIES,
      [],
      (m) => warnings.push(m)
    );
    expect(compiled.transitions).toEqual([]);
    expect(warnings[0]).toContain("neither a CRUD operation");
  });
});
