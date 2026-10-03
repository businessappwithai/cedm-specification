/**
 * GoRules JDM emitter.
 *
 * Converts each rule's decision graph into a GoRules JDM document with the
 * generator's own converter (`packages/generator/src/rules/jdm-converter.ts`),
 * so a rule compiles here exactly as it compiles into a generated application:
 * `start` → inputNode, `end` → outputNode, `decision` → switchNode,
 * `expression` → expressionNode, `function` → functionNode. The result is
 * wrapped in a GoRules decision document and written as
 * `<out>/rules/<rule>.jdm.json`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ruleGraphToJdm } from "../../../../../app-with-ai-rust/packages/generator/src/rules/jdm-converter.ts";
import type { EmlModel, EmlRule } from "../model.ts";
import { kebabCase } from "../util.ts";

export interface JdmDocument {
  contentType: "application/vnd.gorules.decision";
  version: "1";
  name: string;
  meta: { entity?: string; event?: string; priority?: number };
  nodes: Array<{ id: string; name: string; type: string; position: { x: number; y: number } }>;
  edges: Array<{ id: string; name?: string; sourceId: string; targetId: string }>;
}

/** Convert one rule to a GoRules JDM document. */
export function ruleToJdm(rule: EmlRule): JdmDocument {
  const graph = ruleGraphToJdm(
    rule.nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
    rule.edges
  );
  return {
    contentType: "application/vnd.gorules.decision",
    version: "1",
    name: rule.name,
    meta: { entity: rule.entity, event: rule.event, priority: rule.priority },
    nodes: graph.nodes.map((node, i) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      position: { x: 80 + (i % 4) * 220, y: 80 + Math.floor(i / 4) * 140 },
    })),
    edges: graph.edges,
  };
}

/** Write a .jdm.json per rule plus an index. Returns written (relative) paths. */
export function generateJdm(model: EmlModel, outDir: string, subdir = "rules"): string[] {
  if (model.rules.length === 0) return [];
  const dir = path.join(outDir, subdir);
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];

  const index: Array<{ rule: string; file: string; entity?: string; event?: string }> = [];
  for (const rule of model.rules) {
    const doc = ruleToJdm(rule);
    const file = `${kebabCase(rule.name)}.jdm.json`;
    writeFileSync(path.join(dir, file), JSON.stringify(doc, null, 2));
    written.push(path.join(subdir, file));
    index.push({ rule: rule.name, file, entity: rule.entity, event: rule.event });
  }

  writeFileSync(path.join(dir, "index.json"), JSON.stringify({ decisions: index }, null, 2));
  written.push(path.join(subdir, "index.json"));
  return written;
}
