// Vendored from businessappwithai/app-with-ai-tanstack at 34e5f17346dfc77550c7bf38cef5e550c2d12dd4
//   packages/web/src/lib/jdm-converter.ts
//
// Copied rather than imported across the repository boundary: this repository has
// no packages/web, and the import that used to reach for one resolved nowhere, so
// every eml CLI command — validate and info included — died at module load. Both
// files are dependency-free, which is what makes copying them cheap.
//
// The generator's copy is upstream. If a rule flow starts compiling differently
// there, re-copy both files rather than editing these by hand.

// Converts a parsed Mermaid flowchart AST → GoRules JDM JSON
// Minimal, no AI required.

import type { FlowAST, NodeShape } from "./mermaid-flowchart-parser";

type JdmNodeType = "inputNode" | "outputNode" | "switchNode" | "expressionNode" | "functionNode";

interface JdmNode {
  id: string;
  name: string;
  type: JdmNodeType;
}

interface JdmEdge {
  id: string;
  name?: string;
  sourceId: string;
  targetId: string;
}

export interface JdmGraph {
  nodes: JdmNode[];
  edges: JdmEdge[];
}

function shapeToType(shape: NodeShape, isTarget: boolean, isSource: boolean): JdmNodeType {
  if (shape === "stadium") return isTarget && !isSource ? "outputNode" : "inputNode";
  if (shape === "diamond") return "switchNode";
  if (shape === "circle") return "functionNode";
  return "expressionNode";
}

export function convertToJdm(ast: FlowAST): JdmGraph {
  const sourceIds = new Set(ast.edges.map((e) => e.source));
  const targetIds = new Set(ast.edges.map((e) => e.target));

  const nodes: JdmNode[] = [];
  let edgeCounter = 0;

  for (const [, node] of ast.nodes) {
    const isSource = sourceIds.has(node.id);
    const isTarget = targetIds.has(node.id);
    nodes.push({
      id: `node-${node.id}`,
      name: node.label,
      type: shapeToType(node.shape, isTarget, isSource),
    });
  }

  const edges: JdmEdge[] = ast.edges.map((e) => ({
    id: `edge-${++edgeCounter}`,
    name: e.label,
    sourceId: `node-${e.source}`,
    targetId: `node-${e.target}`,
  }));

  return { nodes, edges };
}
