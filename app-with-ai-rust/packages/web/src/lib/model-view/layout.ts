/**
 * Positions for a model view, from ELK's layered algorithm.
 *
 * Sizes are decided here rather than measured in the DOM, so a layout is a
 * pure function of the view: the same document is always drawn the same way,
 * and a test can check it without a browser. The node components in
 * `components/model/` draw to exactly these sizes.
 */

import type { FlowDirection } from "@appwithai/generator/model-yaml";
import type { ModelView, ViewNode } from "./graph";

export const ENTITY_WIDTH = 260;
export const ENTITY_HEADER = 44;
export const FIELD_HEIGHT = 20;
/** Columns drawn before the card says how many more there are. */
export const ENTITY_FIELD_LIMIT = 14;

export interface NodeBox {
  width: number;
  height: number;
}

export interface PositionedNode {
  node: ViewNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  nodes: PositionedNode[];
  width: number;
  height: number;
}

export function nodeBox(node: ViewNode): NodeBox {
  switch (node.kind) {
    case "entity": {
      const shown = Math.min(node.fields.length, ENTITY_FIELD_LIMIT);
      const overflow = node.fields.length > ENTITY_FIELD_LIMIT ? 1 : 0;
      const tags = node.tags.length ? 22 : 0;
      return { width: ENTITY_WIDTH, height: ENTITY_HEADER + tags + (shown + overflow) * FIELD_HEIGHT + 8 };
    }
    case "initial":
      return { width: 20, height: 20 };
    case "saga-start":
    case "saga-end":
    case "start":
    case "end":
      return { width: 180, height: 48 };
    case "decision":
      return { width: 200, height: 72 };
    default:
      return { width: 200, height: node.detail ? 60 : 44 };
  }
}

const ELK_DIRECTION: Record<FlowDirection, string> = {
  down: "DOWN",
  up: "UP",
  right: "RIGHT",
  left: "LEFT",
};

type ElkInstance = {
  layout(graph: unknown): Promise<{
    width?: number;
    height?: number;
    children?: Array<{ id: string; x?: number; y?: number }>;
  }>;
};

let elk: Promise<ElkInstance> | undefined;

function loadElk(): Promise<ElkInstance> {
  elk ??= import("elkjs/lib/elk.bundled.js").then(
    (module) => new (module.default as unknown as new () => ElkInstance)()
  );
  return elk;
}

export async function layoutView(view: ModelView): Promise<Layout> {
  const engine = await loadElk();
  const boxes = new Map(view.nodes.map((node) => [node.id, nodeBox(node)]));
  const result = await engine.layout({
    id: view.key,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": ELK_DIRECTION[view.direction],
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": view.kind === "entities" ? "56" : "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": view.kind === "entities" ? "96" : "56",
      "elk.spacing.edgeNode": "24",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.separateConnectedComponents": "true",
    },
    children: view.nodes.map((node) => ({ id: node.id, ...boxes.get(node.id) })),
    edges: view.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });

  const placed = new Map((result.children ?? []).map((child) => [child.id, child]));
  const nodes = view.nodes.map((node) => {
    const box = boxes.get(node.id) ?? nodeBox(node);
    const at = placed.get(node.id);
    if (at?.x === undefined || at.y === undefined) {
      throw new Error(`ELK placed no position for ${view.key} node ${node.id}`);
    }
    return { node, x: at.x, y: at.y, ...box };
  });
  return { nodes, width: result.width ?? 0, height: result.height ?? 0 };
}
