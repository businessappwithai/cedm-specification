/**
 * A rule's decision graph → a GoRules JDM decision graph.
 *
 * Each node's `type` names the JDM node it becomes; ids are prefixed so a
 * model's short ids (`A`, `check`) cannot collide with the fixed ids the
 * decision-table forms use.
 */

import type { RuleEdge, RuleNode, RuleNodeType } from "../model/records";

type JdmNodeType =
  | "inputNode"
  | "outputNode"
  | "switchNode"
  | "expressionNode"
  | "functionNode"
  | "decisionTableNode";

/** A decision table's columns and rows. Only `decisionTableNode` carries one. */
export interface JdmDecisionTable {
  hitPolicy: "first" | "collect";
  inputs: Array<{ id: string; name: string; field: string }>;
  outputs: Array<{ id: string; name: string; field: string }>;
  /** `_id` plus one cell per input/output id, each a zen expression. */
  rules: Array<Record<string, string>>;
}

export interface JdmNode {
  id: string;
  name: string;
  type: JdmNodeType;
  content?: JdmDecisionTable;
}

export interface JdmEdge {
  id: string;
  name?: string;
  sourceId: string;
  targetId: string;
}

export interface JdmGraph {
  nodes: JdmNode[];
  edges: JdmEdge[];
}

/** The JDM node each rule node type compiles to. */
export const JDM_NODE_TYPE: Record<RuleNodeType, JdmNodeType> = {
  start: "inputNode",
  end: "outputNode",
  decision: "switchNode",
  expression: "expressionNode",
  function: "functionNode",
};

/** Compile a rule's nodes and edges into a JDM graph. */
export function ruleGraphToJdm(nodes: RuleNode[], edges: RuleEdge[]): JdmGraph {
  let edgeCounter = 0;
  return {
    nodes: nodes.map((node) => ({
      id: `node-${node.id}`,
      name: node.label,
      type: JDM_NODE_TYPE[node.type],
    })),
    edges: edges.map((edge) => ({
      id: `edge-${++edgeCounter}`,
      name: edge.label,
      sourceId: `node-${edge.source}`,
      targetId: `node-${edge.target}`,
    })),
  };
}
