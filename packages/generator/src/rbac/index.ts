/**
 * A model's `rbac` rules → per-operation and per-transition access rules.
 *
 * Access rules were once reserved in the language and read by nobody, so a model
 * could say that only `admin` deletes an Order and every signed-in user could
 * still delete orders. This module is what makes them mean something.
 *
 * ## It restricts; it does not grant
 *
 * An `(entity, operation)` pair no rule names is unrestricted — anyone the
 * session guard admits may perform it. One or more rules turn that pair into a
 * closed list: the caller must hold at least one of the named roles, or a
 * master role.
 *
 * The alternative reading — every operation denied until granted — is the
 * stricter default and the wrong one here. It would silently lock every user
 * out of every existing model on the next regeneration, and a model that says
 * nothing about permissions is a model whose author has not thought about them
 * yet, not one that wants everything forbidden.
 *
 * ## Why this does not write `sys_access`
 *
 * `sys_access` looks like the natural home and is not. It is a *grant* table
 * whose rows feed `sys_refresh_dictionary_scope()`, which recomputes
 * `allowed_roles` on every dictionary table: a table with no `sys_access` rows
 * is visible to all roles, and the first row added narrows it to that role
 * alone. Seeding one from a rule restricting Order `delete` to `admin` would therefore
 * hide the Order window from everybody except admin — a restriction on deleting
 * silently becoming a restriction on looking. The two concerns need two tables,
 * so operation rules live in `sys_operation_access`.
 */

import type { RbacDeclaration } from "../model/records";

/** The CRUD operations an access rule may restrict. */
export const RBAC_OPERATIONS = ["create", "read", "update", "delete"] as const;

export type RbacOperation = (typeof RBAC_OPERATIONS)[number];

/**
 * Aliases accepted for an operation, so a model may say what it means.
 *
 * `*` and `all` expand to every operation — a whole entity behind one role is
 * the common case and writing four rules for it is noise.
 */
const OPERATION_ALIASES: Record<string, RbacOperation | "*"> = {
  "*": "*",
  all: "*",
  any: "*",
  create: "create",
  insert: "create",
  add: "create",
  read: "read",
  view: "read",
  select: "read",
  list: "read",
  update: "update",
  edit: "update",
  write: "update",
  modify: "update",
  delete: "delete",
  remove: "delete",
  destroy: "delete",
};

/** One state change a transition rule covers: `from` → `to` on the status column. */
export interface RbacTransitionEdge {
  from: string;
  to: string;
}

/**
 * A restriction on moving a record along a named state-machine transition.
 *
 * `edges` rather than a single target state because a transition event may
 * appear more than once in a machine (two states that both `approve` into
 * `approved`). Carrying the `from` as well as the `to` keeps the rule precise:
 * restricting `approve` must not also restrict a different event that happens
 * to land on the same state.
 */
export interface CompiledRbacTransition {
  entity: string;
  tableName: string;
  /** The transition event as the model spells it, e.g. `convert`. */
  transition: string;
  edges: RbacTransitionEdge[];
  roles: string[];
}

/** One `(entity, operation)` pair and the roles permitted to perform it. */
export interface CompiledRbacRule {
  /** ERD entity name, as declared. */
  entity: string;
  /** Physical table the guard matches on, e.g. `bus_order`. */
  tableName: string;
  operation: RbacOperation;
  /** Role names permitted, de-duplicated and sorted. Never empty. */
  roles: string[];
}

/** Everything a model's access rules compile to. */
export interface CompiledRbac {
  /** CRUD restrictions, seeded into `sys_operation_access`. */
  operations: CompiledRbacRule[];
  /** State-transition restrictions, seeded into `sys_transition_access`. */
  transitions: CompiledRbacTransition[];
}

/** The shape `compileStateMachineDeclarations` produces, repeated structurally to avoid the import cycle. */
export interface RbacStateMachine {
  entity: string;
  transitions: Array<{ from: string; to: string; trigger?: string }>;
}

/** `Order` → `bus_order`. Mirrors the ERD parser's table naming. */
function busTableName(entity: string): string {
  const snake = entity
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/^_/, "");
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}

/**
 * Compile access rules into operation and transition rules.
 *
 * Rules naming the same target are merged rather than overriding one another:
 * two rules each naming a role mean either role may perform it.
 *
 * An action that is not a CRUD operation is looked up among `stateMachines` as
 * a transition trigger on that entity. One that is neither is skipped with a
 * warning naming both possibilities.
 */
export function compileRbacDeclarations(
  declarations: RbacDeclaration[],
  knownEntities: string[] = [],
  stateMachines: RbacStateMachine[] = [],
  onWarn: (message: string) => void = () => {}
): CompiledRbac {
  const known = new Set(knownEntities);

  /** `entity:operation` → role set. */
  const operations = new Map<
    string,
    { entity: string; operation: RbacOperation; roles: Set<string> }
  >();
  /** `entity:transition` → edges + role set. */
  const transitions = new Map<
    string,
    { entity: string; transition: string; edges: RbacTransitionEdge[]; roles: Set<string> }
  >();

  /** Every `from -> to` edge an event names on an entity's machines. */
  const edgesFor = (entity: string, event: string): RbacTransitionEdge[] => {
    const found: RbacTransitionEdge[] = [];
    for (const machine of stateMachines) {
      if (machine.entity !== entity) continue;
      for (const edge of machine.transitions) {
        if (!edge.trigger) continue;
        // Events are written as they read in a diagram (`close won`,
        // `counter-signed`); a rule spells the same thing in one token.
        const normalized = edge.trigger
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
        if (normalized === event.toLowerCase()) found.push({ from: edge.from, to: edge.to });
      }
    }
    return found;
  };

  for (const declaration of declarations) {
    const { entity, target: rawTarget } = declaration;

    if (known.size && !known.has(entity)) {
      onWarn(`access rule on unknown entity "${entity}" — skipped.`);
      continue;
    }

    const roles = declaration.roles.filter(Boolean);
    if (roles.length === 0) {
      // A rule with no role names would compile to a restriction nobody can
      // satisfy, locking the target for everyone including its author.
      onWarn(`access rule on ${entity}.${rawTarget} names no role — skipped.`);
      continue;
    }

    const resolved = OPERATION_ALIASES[rawTarget.toLowerCase()];
    if (resolved) {
      const ops: RbacOperation[] = resolved === "*" ? [...RBAC_OPERATIONS] : [resolved];
      for (const operation of ops) {
        const key = `${entity}:${operation}`;
        const existing = operations.get(key);
        if (existing) {
          for (const role of roles) existing.roles.add(role);
        } else {
          operations.set(key, { entity, operation, roles: new Set(roles) });
        }
      }
      continue;
    }

    const edges = edgesFor(entity, rawTarget);
    if (edges.length === 0) {
      onWarn(
        `access rule on ${entity}.${rawTarget} names neither a CRUD operation ` +
          `(${RBAC_OPERATIONS.join(", ")}, *) nor a transition in ${entity}'s state machine — skipped.`
      );
      continue;
    }

    const key = `${entity}:${rawTarget.toLowerCase()}`;
    const existing = transitions.get(key);
    if (existing) {
      for (const role of roles) existing.roles.add(role);
    } else {
      transitions.set(key, { entity, transition: rawTarget, edges, roles: new Set(roles) });
    }
  }

  return {
    operations: [...operations.values()]
      .map(({ entity, operation, roles }) => ({
        entity,
        tableName: busTableName(entity),
        operation,
        roles: [...roles].sort(),
      }))
      .sort(
        (a, b) => a.tableName.localeCompare(b.tableName) || a.operation.localeCompare(b.operation)
      ),
    transitions: [...transitions.values()]
      .map(({ entity, transition, edges, roles }) => ({
        entity,
        tableName: busTableName(entity),
        transition,
        edges,
        roles: [...roles].sort(),
      }))
      .sort(
        (a, b) => a.tableName.localeCompare(b.tableName) || a.transition.localeCompare(b.transition)
      ),
  };
}

/** Every distinct role named across every compiled rule, sorted. */
export function rbacRoleNames(compiled: CompiledRbac): string[] {
  return [
    ...new Set([
      ...compiled.operations.flatMap((rule) => rule.roles),
      ...compiled.transitions.flatMap((rule) => rule.roles),
    ]),
  ].sort();
}

/** True when the model declared any restriction at all. */
export function hasRbacRules(compiled: CompiledRbac): boolean {
  return compiled.operations.length > 0 || compiled.transitions.length > 0;
}
