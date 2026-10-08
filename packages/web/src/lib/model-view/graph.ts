/**
 * A model document, as the diagrams the modelling tool draws.
 *
 * Every view is computed from the YAML document — the one thing a model is —
 * and every node and edge carries the document path it was drawn from, so a
 * click on the diagram can select the lines that declared it and a cursor in
 * the text can find the node it is on. Nothing here parses text or lays
 * anything out: `document` in, nodes and edges out. Layout is ELK's job, in
 * `layout.ts`, and rendering is React Flow's.
 */

import type {
  DocumentPath,
  FlowDirection,
  ModelDocument,
  RelationshipEnd,
  RuleNodeType,
} from "@appwithai/generator/model-yaml";

/** What a node is, which decides how it is drawn. */
export type ViewNodeKind =
  | "entity"
  | "state"
  | "initial"
  | "final"
  | "saga-start"
  | "saga-step"
  | "saga-end"
  | RuleNodeType
  | "hook"
  | "flow-step";

export interface ViewField {
  name: string;
  type: string;
  /** `PK`, `FK`, `UK`, `enum: Status` — the column's modifiers, as badges. */
  badges: string[];
  path: DocumentPath;
}

export interface ViewNode {
  id: string;
  kind: ViewNodeKind;
  label: string;
  /** A second line under the label: an entity's help, a step's type. */
  detail?: string;
  /** An entity's columns; empty for every other kind. */
  fields: ViewField[];
  /** Short tags drawn beside the label: the category, `line item of X`. */
  tags: string[];
  path: DocumentPath;
}

export interface ViewEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Cardinality at each end of a relationship, written as the document writes it. */
  sourceEnd?: RelationshipEnd;
  targetEnd?: RelationshipEnd;
  /** A line item's link to its parent, drawn differently from a plain reference. */
  ownership?: boolean;
  path: DocumentPath;
}

export type ViewKind = "entities" | "stateMachine" | "saga" | "rule" | "hookFlow";

export interface ModelView {
  /** Stable across edits that do not rename the thing drawn. */
  key: string;
  kind: ViewKind;
  title: string;
  /** The entity the view is about, when it is about one. */
  entity?: string;
  direction: FlowDirection;
  nodes: ViewNode[];
  edges: ViewEdge[];
  /** Where the view's declaration starts, for "show in source". */
  path: DocumentPath;
}

const FLOW_DEFAULT: FlowDirection = "down";

/** Every view a document has, in the order the document declares them. */
export function modelViews(document: ModelDocument): ModelView[] {
  return [
    entityView(document),
    ...(document.stateMachines ?? []).map((machine, index) => {
      const path: DocumentPath = ["stateMachines", index];
      const nodes: ViewNode[] = machine.states.map((state, stateIndex) => ({
        id: `state:${state}`,
        kind: machine.final?.includes(state) ? "final" : "state",
        label: state,
        fields: [],
        tags: state === machine.initial ? ["initial"] : [],
        path: [...path, "states", stateIndex],
      }));
      const edges: ViewEdge[] = machine.transitions.map((transition, transitionIndex) => ({
        id: `transition:${transitionIndex}`,
        source: `state:${transition.from}`,
        target: `state:${transition.to}`,
        label: transition.trigger,
        path: [...path, "transitions", transitionIndex],
      }));
      if (machine.initial) {
        nodes.unshift({
          id: "initial",
          kind: "initial",
          label: "",
          fields: [],
          tags: [],
          path: [...path, "initial"],
        });
        edges.unshift({
          id: "initial",
          source: "initial",
          target: `state:${machine.initial}`,
          path: [...path, "initial"],
        });
      }
      return {
        key: `stateMachine:${machine.name}`,
        kind: "stateMachine" as const,
        title: machine.title ?? machine.name,
        entity: machine.entity,
        direction: FLOW_DEFAULT,
        nodes: onlyConnected(nodes, edges),
        edges: edgesBetween(nodes, edges),
        path,
      };
    }),
    ...(document.sagas ?? []).map((saga, index) => {
      const path: DocumentPath = ["sagas", index];
      const steps: ViewNode[] = saga.steps.map((step, stepIndex) => ({
        id: `step:${step.id}`,
        kind: "saga-step",
        label: step.label ?? step.id,
        detail: step.type,
        fields: [],
        tags: [],
        path: [...path, "steps", stepIndex],
      }));
      const start: ViewNode = {
        id: "start",
        kind: "saga-start",
        label: [saga.trigger ?? "automatic", saga.operation ?? "CREATE"].join(" · "),
        detail: saga.entity,
        fields: [],
        tags: [],
        path,
      };
      const end: ViewNode = {
        id: "end",
        kind: "saga-end",
        label: "Done",
        fields: [],
        tags: [],
        path: [...path, "steps"],
      };
      const chain = [start, ...steps, end];
      const edges: ViewEdge[] = chain.slice(1).map((node, position) => ({
        id: `sequence:${position}`,
        source: chain[position]?.id ?? start.id,
        target: node.id,
        path: node.path,
      }));
      return {
        key: `saga:${saga.name}`,
        kind: "saga" as const,
        title: saga.title ?? saga.name,
        entity: saga.entity,
        direction: FLOW_DEFAULT,
        nodes: chain,
        edges,
        path,
      };
    }),
    ...(document.rules ?? []).map((rule, index) => {
      const path: DocumentPath = ["rules", index];
      const nodes: ViewNode[] = rule.nodes.map((node, nodeIndex) => ({
        id: `node:${node.id}`,
        kind: node.type,
        label: node.label,
        fields: [],
        tags: [],
        path: [...path, "nodes", nodeIndex],
      }));
      const edges: ViewEdge[] = rule.edges.map((edge, edgeIndex) => ({
        id: `edge:${edgeIndex}`,
        source: `node:${edge.from}`,
        target: `node:${edge.to}`,
        label: edge.label,
        path: [...path, "edges", edgeIndex],
      }));
      return {
        key: `rule:${rule.name}`,
        kind: "rule" as const,
        title: rule.title ?? rule.name,
        entity: rule.entity,
        direction: rule.direction ?? FLOW_DEFAULT,
        nodes,
        edges: edgesBetween(nodes, edges),
        path,
      };
    }),
    ...(document.hookFlows ?? []).map((flow, index) => {
      const path: DocumentPath = ["hookFlows", index];
      const nodes: ViewNode[] = flow.nodes.map((node, nodeIndex) => ({
        id: `node:${node.id}`,
        kind: node.event ? "hook" : "flow-step",
        label: node.label ?? node.handler ?? node.id,
        detail: node.event,
        fields: [],
        tags: [],
        path: [...path, "nodes", nodeIndex],
      }));
      const edges: ViewEdge[] = flow.edges.map((edge, edgeIndex) => ({
        id: `edge:${edgeIndex}`,
        source: `node:${edge.from}`,
        target: `node:${edge.to}`,
        label: edge.label,
        path: [...path, "edges", edgeIndex],
      }));
      return {
        key: `hookFlow:${flow.name}`,
        kind: "hookFlow" as const,
        title: flow.title ?? flow.name,
        entity: flow.entity,
        direction: flow.direction ?? FLOW_DEFAULT,
        nodes,
        edges: edgesBetween(nodes, edges),
        path,
      };
    }),
  ];
}

function entityView(document: ModelDocument): ModelView {
  const categoryOf = new Map<string, string>();
  for (const category of document.categories ?? []) {
    for (const entity of category.entities ?? []) {
      if (!categoryOf.has(entity)) categoryOf.set(entity, category.name);
    }
  }

  const nodes: ViewNode[] = document.entities.map((entity, index) => {
    const path: DocumentPath = ["entities", index];
    const tags: string[] = [];
    const category = categoryOf.get(entity.name);
    if (category) tags.push(category);
    if (entity.parent) tags.push(`line item of ${entity.parent}`);
    // Optimistic is the default and says nothing; the exception is worth a tag.
    if (entity.concurrency === "last-write-wins") tags.push("last-write-wins");
    return {
      id: `entity:${entity.name}`,
      kind: "entity",
      label: entity.name,
      detail: entity.help,
      fields: entity.attributes.map((attribute, attributeIndex) => {
        const badges: string[] = [];
        if (attribute.pk) badges.push("PK");
        if (attribute.fk) badges.push("FK");
        if (attribute.unique) badges.push("UK");
        if (attribute.optional) badges.push("optional");
        if (attribute.enum) badges.push(`enum ${attribute.enum}`);
        return {
          name: attribute.name,
          type: attribute.type,
          badges,
          path: [...path, "attributes", attributeIndex],
        };
      }),
      tags,
      path,
    };
  });

  const parentOf = new Map(
    document.entities.filter((entity) => entity.parent).map((e) => [e.name, e.parent])
  );
  const edges: ViewEdge[] = (document.relationships ?? []).map((relationship, index) => ({
    id: `relationship:${index}`,
    source: `entity:${relationship.from}`,
    target: `entity:${relationship.to}`,
    label: relationship.label,
    sourceEnd: relationship.fromCardinality,
    targetEnd: relationship.toCardinality,
    ownership:
      parentOf.get(relationship.to) === relationship.from ||
      parentOf.get(relationship.from) === relationship.to,
    path: ["relationships", index],
  }));

  return {
    key: "entities",
    kind: "entities",
    title: document.name ? `${document.name} — entities` : "Entities",
    direction: FLOW_DEFAULT,
    nodes,
    edges: edgesBetween(nodes, edges),
    path: ["entities"],
  };
}

/**
 * Edges whose two ends are drawn. The schema lets a document name a node that
 * does not exist — the checker reports it — and a diagram cannot draw an edge
 * into nothing, so it is left out here and the diagnostic stays the report.
 */
function edgesBetween(nodes: ViewNode[], edges: ViewEdge[]): ViewEdge[] {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
}

/** A state machine's initial marker is drawn only when its state exists. */
function onlyConnected(nodes: ViewNode[], edges: ViewEdge[]): ViewNode[] {
  const ids = new Set(nodes.map((node) => node.id));
  return nodes.filter(
    (node) =>
      node.kind !== "initial" ||
      edges.some((edge) => edge.source === node.id && ids.has(edge.target))
  );
}

/** Written the way a person reads a relationship end. */
export const END_LABEL: Record<RelationshipEnd, string> = {
  "exactly-one": "1",
  "zero-or-one": "0..1",
  "zero-or-more": "0..*",
  "one-or-more": "1..*",
};

/** Whether `inner` lies within `outer`: the same path or a path below it. */
export function pathWithin(inner: DocumentPath, outer: DocumentPath): boolean {
  return outer.length <= inner.length && outer.every((key, index) => inner[index] === key);
}

/**
 * The node or edge a document path belongs to — the one whose path is the
 * longest prefix of it. How a cursor in the text finds what to highlight.
 */
export function elementAt(
  view: ModelView,
  path: DocumentPath
): { node?: ViewNode; edge?: ViewEdge } {
  let best: { node?: ViewNode; edge?: ViewEdge; depth: number } = { depth: -1 };
  for (const node of view.nodes) {
    if (pathWithin(path, node.path) && node.path.length > best.depth) {
      best = { node, depth: node.path.length };
    }
  }
  for (const edge of view.edges) {
    if (pathWithin(path, edge.path) && edge.path.length > best.depth) {
      best = { edge, depth: edge.path.length };
    }
  }
  return { node: best.node, edge: best.edge };
}
