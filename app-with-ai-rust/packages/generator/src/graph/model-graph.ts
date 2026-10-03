/**
 * An EML model as a property graph.
 *
 * The assistant's questions about a model are overwhelmingly *structural* —
 * "what points at Compound?", "which rules fire on Experiment?", "what happens
 * if I delete this entity?", "what moves are legal from `submitted`?". Those
 * are traversals with exact answers, and a model already is a graph: entities
 * joined by foreign keys, rules bound to entities, workflows made of ordered
 * steps, states joined by transitions.
 *
 * So the retrieval layer stores the model as a graph and queries it in Cypher
 * (Apache AGE) rather than embedding prose about it and searching by cosine
 * distance. The difference is not efficiency, it is truthfulness: "what
 * references Compound" has one correct answer, and a nearest-neighbour search
 * returns whatever chunks happened to mention it. An embedding index is the
 * right tool for a question about meaning; this is a question about structure.
 *
 * This module is the pure half. It turns a `ParsedModel` into nodes and edges
 * and knows nothing about Postgres, AGE, or Cypher — so the shape of the graph
 * is testable without a database, which is where its bugs would otherwise hide.
 */

import type { Entity, EntityAttribute } from "@appwithai/core/types";
import type { ParsedModel } from "../model/compile";
import { rbacRoleNames } from "../rbac";

/** Node labels. Kept small: a label per *kind of thing an author names*. */
export type NodeLabel =
  | "Entity"
  | "Attribute"
  | "Enum"
  | "Category"
  | "Rule"
  | "Hook"
  | "Workflow"
  | "Step"
  | "State"
  | "Role";

/**
 * Edge types, named as the sentence they stand for: `(Compound)-[:REFERENCES]->
 * (User)` reads the way an author would say it.
 */
export type EdgeType =
  | "HAS_ATTRIBUTE"
  | "HAS_MANY"
  | "REFERENCES"
  | "RELATED_TO"
  | "PARENT_OF"
  | "IN_CATEGORY"
  | "USES_ENUM"
  | "RULE_ON"
  | "HOOK_ON"
  | "WORKFLOW_ON"
  | "HAS_STEP"
  | "NEXT"
  | "HAS_STATE"
  | "TRANSITIONS_TO"
  | "MAY";

export interface GraphNode {
  label: NodeLabel;
  /** Unique within a project. `Entity:Compound`, `Attribute:Compound.smiles`. */
  key: string;
  properties: Record<string, string | number | boolean | string[]>;
}

export interface GraphEdge {
  type: EdgeType;
  from: string;
  to: string;
  properties?: Record<string, string | number | boolean>;
}

export interface ModelGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const key = (label: NodeLabel, ...parts: string[]) => `${label}:${parts.join(".")}`;

/**
 * Build the graph for one parsed model.
 *
 * Every node carries the properties an answer needs to be *useful* rather than
 * just correct: an entity's table name, an attribute's type and whether it is
 * required. A traversal that returns bare names makes the assistant ask a
 * second question.
 */
export function buildModelGraph(model: ParsedModel): ModelGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  const addNode = (node: GraphNode) => {
    if (seen.has(node.key)) return;
    seen.add(node.key);
    nodes.push(node);
  };
  const addEdge = (edge: GraphEdge) => edges.push(edge);

  // ── Entities and their columns ───────────────────────────────────────────
  const entityByName = new Map<string, Entity>();
  for (const entity of model.entities) {
    entityByName.set(entity.name, entity);
    addNode({
      label: "Entity",
      key: key("Entity", entity.name),
      properties: {
        name: entity.name,
        tableName: entity.tableName,
        ...(entity.description ? { description: entity.description } : {}),
        primaryKey: entity.primaryKey,
        attributeCount: entity.attributes.length,
      },
    });

    for (const attribute of entity.attributes) {
      const attrKey = key("Attribute", entity.name, attribute.name);
      addNode({
        label: "Attribute",
        key: attrKey,
        properties: attributeProperties(entity, attribute),
      });
      addEdge({ type: "HAS_ATTRIBUTE", from: key("Entity", entity.name), to: attrKey });
    }
  }

  // A child declared by an entity's `parent: <P>`. Directed parent → child,
  // because that is the direction the question is asked in: "what hangs off an
  // Invoice?" is far more common than the reverse.
  for (const entity of model.entities) {
    const parent = entity.parentEntity;
    if (!parent || !entityByName.has(parent)) continue;
    addEdge({
      type: "PARENT_OF",
      from: key("Entity", parent),
      to: key("Entity", entity.name),
      ...(entity.parentLinkColumn ? { properties: { via: entity.parentLinkColumn } } : {}),
    });
  }

  // ── Relationships ────────────────────────────────────────────────────────
  //
  // Two edges, because the ERD states one thing and the schema does another,
  // and the assistant is asked about both.
  //
  // `Compound ||--o{ CompoundAlias` declares that a Compound *has many*
  // aliases. The foreign key for that lives on the many side —
  // `bus_compound_alias.compound_id` — so the thing that *references* Compound
  // is CompoundAlias, pointing the other way. Emitting one edge called
  // REFERENCES in the ERD's declaration direction made
  // "what references Compound?" answer *nothing* for the most referenced
  // entity in the model, which is worse than not answering: it reads as a
  // considered "no".
  //
  // So `HAS_MANY` keeps the ERD's own statement and `REFERENCES` points the
  // way the foreign key does. Which way that is comes from the cardinality the
  // parser already resolved — never from re-deriving a column name, because
  // that rule lives in seven places in this repo that have to agree and this
  // would be an eighth.
  for (const relationship of model.relationships) {
    const source = key("Entity", relationship.sourceEntity);
    const target = key("Entity", relationship.targetEntity);
    if (!seen.has(source) || !seen.has(target)) continue;

    const declared = {
      cardinality: relationship.cardinality,
      ...(relationship.foreignKey ? { declaredForeignKey: relationship.foreignKey } : {}),
      ...(relationship.onDelete ? { onDelete: relationship.onDelete } : {}),
    };

    switch (relationship.cardinality) {
      case "oneToMany":
        addEdge({ type: "HAS_MANY", from: source, to: target, properties: declared });
        addEdge({ type: "REFERENCES", from: target, to: source, properties: declared });
        break;
      case "manyToOne":
        addEdge({ type: "HAS_MANY", from: target, to: source, properties: declared });
        addEdge({ type: "REFERENCES", from: source, to: target, properties: declared });
        break;
      case "oneToOne":
        // The key is on one side and the ERD does not say which; the declared
        // direction is the only evidence there is.
        addEdge({ type: "REFERENCES", from: source, to: target, properties: declared });
        break;
      case "manyToMany":
        // Neither side holds a plain foreign key — a join table does. Calling
        // that a reference in either direction would be a claim the model has
        // not made.
        addEdge({ type: "RELATED_TO", from: source, to: target, properties: declared });
        addEdge({ type: "RELATED_TO", from: target, to: source, properties: declared });
        break;
    }
  }

  // Note there is deliberately no `via` on REFERENCES. The parser's
  // `foreignKey` is named for the *declared* target, so it is the right column
  // only for `manyToOne`; putting it on the inverted edge would name a column
  // that does not exist. The real column is on the referencing entity and is
  // already in the graph as an Attribute with `isForeignKey`.

  // ── Categories ───────────────────────────────────────────────────────────
  for (const category of model.categories) {
    const categoryKey = key("Category", category.name);
    addNode({
      label: "Category",
      key: categoryKey,
      properties: { name: category.name, ...(category.code ? { code: category.code } : {}) },
    });
    for (const entityName of category.entities ?? []) {
      if (!seen.has(key("Entity", entityName))) continue;
      addEdge({ type: "IN_CATEGORY", from: key("Entity", entityName), to: categoryKey });
    }
  }

  // ── Enums, joined to the columns that use them ───────────────────────────
  for (const modelEnum of model.enums) {
    addNode({
      label: "Enum",
      key: key("Enum", modelEnum.name),
      properties: {
        name: modelEnum.name,
        values: modelEnum.values,
        referenceId: modelEnum.referenceId,
      },
    });
  }
  for (const entity of model.entities) {
    for (const attribute of entity.attributes) {
      if (!attribute.enumRef) continue;
      const enumKey = key("Enum", attribute.enumRef);
      if (!seen.has(enumKey)) continue;
      addEdge({
        type: "USES_ENUM",
        from: key("Attribute", entity.name, attribute.name),
        to: enumKey,
      });
    }
  }

  // ── Rules and hooks ──────────────────────────────────────────────────────
  for (const rule of model.rules) {
    const ruleKey = key("Rule", rule.name);
    addNode({
      label: "Rule",
      key: ruleKey,
      properties: {
        name: rule.name,
        entity: rule.entity,
        event: rule.event,
        operation: rule.operation,
      },
    });
    if (seen.has(key("Entity", rule.entity))) {
      addEdge({ type: "RULE_ON", from: ruleKey, to: key("Entity", rule.entity) });
    }
  }

  for (const hook of model.hooks) {
    const hookKey = key("Hook", hook.entity, hook.type, hook.handler);
    addNode({
      label: "Hook",
      key: hookKey,
      properties: {
        entity: hook.entity,
        type: hook.type,
        handler: hook.handler,
        order: hook.order,
        ...(hook.field ? { field: hook.field } : {}),
      },
    });
    if (seen.has(key("Entity", hook.entity))) {
      addEdge({ type: "HOOK_ON", from: hookKey, to: key("Entity", hook.entity) });
    }
  }

  // ── Sagas: a workflow and its steps, in order ────────────────────────────
  for (const saga of model.sagas) {
    const workflowKey = key("Workflow", saga.name);
    addNode({
      label: "Workflow",
      key: workflowKey,
      properties: {
        name: saga.name,
        kind: "saga",
        entity: saga.entity,
        operation: saga.operation,
        trigger: saga.trigger,
        ...(saga.description ? { description: saga.description } : {}),
        stepCount: saga.steps.length,
      },
    });
    if (seen.has(key("Entity", saga.entity))) {
      addEdge({ type: "WORKFLOW_ON", from: workflowKey, to: key("Entity", saga.entity) });
    }

    let previous: string | null = null;
    for (const [index, step] of saga.steps.entries()) {
      const stepKey = key("Step", saga.name, step.nodeId);
      addNode({
        label: "Step",
        key: stepKey,
        properties: {
          nodeId: step.nodeId,
          nodeType: step.nodeType,
          label: step.label,
          workflow: saga.name,
          position: index,
          // Flattened, because a graph property cannot hold an object and the
          // question "what does step D write?" is answered by reading them.
          ...flattenProperties(step.properties),
        },
      });
      addEdge({ type: "HAS_STEP", from: workflowKey, to: stepKey });
      // `NEXT` is what makes "what runs after the decision?" a traversal
      // rather than a sort over a position property.
      if (previous) addEdge({ type: "NEXT", from: previous, to: stepKey });
      previous = stepKey;
    }
  }

  // ── State machines ───────────────────────────────────────────────────────
  for (const workflow of model.workflows) {
    const workflowKey = key("Workflow", workflow.name);
    addNode({
      label: "Workflow",
      key: workflowKey,
      properties: {
        name: workflow.name,
        kind: "state",
        entity: workflow.entity,
        tableName: workflow.tableName,
        ...(workflow.initial ? { initial: workflow.initial } : {}),
      },
    });
    if (seen.has(key("Entity", workflow.entity))) {
      addEdge({ type: "WORKFLOW_ON", from: workflowKey, to: key("Entity", workflow.entity) });
    }

    for (const state of workflow.states) {
      const stateKey = key("State", workflow.entity, state.name);
      addNode({
        label: "State",
        key: stateKey,
        properties: { name: state.name, entity: workflow.entity },
      });
      if (seen.has(key("Entity", workflow.entity))) {
        addEdge({ type: "HAS_STATE", from: key("Entity", workflow.entity), to: stateKey });
      }
    }

    for (const transition of workflow.transitions) {
      // `[*]` marks where a record starts and ends. It is not a state a record
      // is ever in, and recording it as one would let a traversal answer that
      // a record may move back to the beginning.
      if (transition.from === "[*]" || transition.to === "[*]") continue;
      const from = key("State", workflow.entity, transition.from);
      const to = key("State", workflow.entity, transition.to);
      if (!seen.has(from) || !seen.has(to)) continue;
      addEdge({
        type: "TRANSITIONS_TO",
        from,
        to,
        ...(transition.trigger ? { properties: { trigger: transition.trigger } } : {}),
      });
    }
  }

  // ── Roles, from rbac ──────────────────────────────────────────────────────
  for (const rule of model.rbac.operations) {
    for (const role of rule.roles) {
      const roleKey = key("Role", role);
      addNode({ label: "Role", key: roleKey, properties: { name: role } });
      if (!seen.has(key("Entity", rule.entity))) continue;
      addEdge({
        type: "MAY",
        from: roleKey,
        to: key("Entity", rule.entity),
        properties: { operation: rule.operation },
      });
    }
  }
  for (const rule of model.rbac.transitions) {
    for (const role of rule.roles) {
      const roleKey = key("Role", role);
      addNode({ label: "Role", key: roleKey, properties: { name: role } });
      if (!seen.has(key("Entity", rule.entity))) continue;
      addEdge({
        type: "MAY",
        from: roleKey,
        to: key("Entity", rule.entity),
        properties: { operation: `transition:${rule.transition}` },
      });
    }
  }

  return { nodes, edges };
}

/**
 * What the graph should say about one column.
 *
 * `isForeignKey` is carried through rather than re-derived from the name: the
 * parser already decided, and this repo has repeatedly found copies of that
 * rule disagreeing with each other.
 */
function attributeProperties(
  entity: Entity,
  attribute: EntityAttribute
): Record<string, string | number | boolean | string[]> {
  return {
    name: attribute.name,
    entity: entity.name,
    type: attribute.type,
    required: attribute.required,
    unique: attribute.unique ?? false,
    isForeignKey: attribute.isForeignKey ?? false,
    isPrimaryKey: attribute.name === entity.primaryKey,
    ...(attribute.description ? { description: attribute.description } : {}),
    ...(attribute.enumRef ? { enumRef: attribute.enumRef } : {}),
  };
}

/** A step's `properties` map, prefixed so it cannot collide with a node's own. */
function flattenProperties(properties: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(properties)) {
    out[`prop_${name}`] = value;
  }
  return out;
}

/** A one-paragraph summary, cheap enough to sit in every assistant message. */
export function summariseModel(model: ParsedModel, projectName: string): string {
  const entities = model.entities.map((entity) => entity.name);
  const parts = [
    `${projectName} models ${entities.length} ${entities.length === 1 ? "entity" : "entities"}: ${entities.join(", ")}.`,
  ];
  if (model.categories.length > 0) {
    parts.push(`Grouped into ${model.categories.map((c) => c.name).join(", ")}.`);
  }
  if (model.enums.length > 0) parts.push(`${model.enums.length} enum(s) declared.`);
  if (model.rules.length > 0) parts.push(`${model.rules.length} business rule(s).`);
  if (model.sagas.length > 0) {
    parts.push(`${model.sagas.length} multi-step process(es): ${model.sagas.map((s) => s.name).join(", ")}.`);
  }
  if (model.workflows.length > 0) {
    parts.push(`${model.workflows.length} state machine(s) on ${model.workflows.map((w) => w.entity).join(", ")}.`);
  }
  // Both kinds of access rule name roles, and a model may declare only the
  // transition kind — drug-discovery does. `rbacRoleNames` is the one
  // derivation of the set; reading `operations` alone reported no roles at all
  // for a model with four.
  const roles = rbacRoleNames(model.rbac);
  if (roles.length > 0) parts.push(`Roles: ${roles.join(", ")}.`);
  return parts.join(" ");
}
