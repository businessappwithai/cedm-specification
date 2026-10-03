/**
 * A model document of 18f5792 → a model document of today, as YAML text.
 *
 * The Mermaid reader (`legacy/eml.js`) produces the document the language had
 * when it still read Mermaid. Three things have changed since, and each is
 * resolved the way the compiler of that time resolved it, so the converted
 * model means exactly the application it meant:
 *
 * - a rule node's Mermaid `shape` is its `type`: a stadium only receiving
 *   edges is the end and any other stadium the start, a diamond a decision, a
 *   circle a function, anything else an expression;
 * - a rule's Mermaid direction (`TD`, `LR`, …) is a layout direction;
 * - a `hookDiagrams` entry — a Mermaid flowchart of an entity's hooks — is a
 *   `hookFlows` entry of nodes and edges.
 *
 * The author's comments are carried too: every `%%` comment and every line of
 * prose around the diagram becomes a YAML comment on the construct it
 * preceded. What cannot be placed is reported, never dropped in silence.
 */

import { canonicalDocument } from "@appwithai/generator/model-yaml";
import { Document, isMap, isScalar, isSeq, visit } from "yaml";
import type { LegacyModelDocument } from "./legacy/eml.js";

type Json = Record<string, any>;
type Path = Array<string | number>;

const DIRECTION: Record<string, string> = {
  TD: "down",
  TB: "down",
  BT: "up",
  LR: "right",
  RL: "left",
};

const HOOK_EVENTS = new Set([
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate",
]);

function ruleNodeType(
  shape: string,
  id: string,
  edges: Array<{ from: string; to: string }>
): string {
  if (shape === "stadium") {
    const source = edges.some((edge) => edge.from === id);
    const target = edges.some((edge) => edge.to === id);
    return target && !source ? "end" : "start";
  }
  if (shape === "diamond") return "decision";
  if (shape === "circle") return "function";
  return "expression";
}

/** A hook diagram's Mermaid → nodes and edges, and any lines that are not the diagram. */
function hookFlowOf(diagram: Json): { flow: Json; stray: string[] } {
  const nodes = new Map<string, Json>();
  const edges: Json[] = [];
  const stray: string[] = [];
  let direction: string | undefined;
  const node = (id: string, label?: string) => {
    const existing = nodes.get(id);
    if (existing && (label === undefined || existing.label !== undefined || existing.event)) return;
    const entry: Json = { id };
    if (label !== undefined) {
      const hook = label.match(/^\s*(\w+)\s*:\s*(\w+)\s*$/);
      if (hook && HOOK_EVENTS.has(hook[1]!)) {
        entry.event = hook[1];
        entry.handler = hook[2];
      } else entry.label = label.trim();
    }
    nodes.set(id, existing ? { ...existing, ...entry } : entry);
  };
  for (const raw of String(diagram.diagram ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const opener = line.match(/^(?:flowchart|graph)\s+(\w+)/);
    if (opener) {
      direction = DIRECTION[opener[1]!] ?? "down";
      continue;
    }
    const edge = line.match(
      /^(\w+)(?:\[([^\]]*)\])?\s*-->\s*(?:\|([^|]*)\|\s*)?(\w+)(?:\[([^\]]*)\])?$/
    );
    if (edge) {
      node(edge[1]!, edge[2]);
      node(edge[4]!, edge[5]);
      edges.push({ from: edge[1], to: edge[4], ...(edge[3] ? { label: edge[3].trim() } : {}) });
      continue;
    }
    const lone = line.match(/^(\w+)\[([^\]]*)\]$/);
    if (lone) {
      node(lone[1]!, lone[2]);
      continue;
    }
    stray.push(line.replace(/^%%\s?/, ""));
  }
  for (const entry of nodes.values())
    if (entry.label === undefined && entry.event === undefined) entry.label = entry.id;
  return {
    flow: {
      name: diagram.name,
      ...(diagram.title !== undefined ? { title: diagram.title } : {}),
      entity: diagram.entity,
      ...(direction && direction !== "down" ? { direction } : {}),
      nodes: [...nodes.values()],
      edges,
    },
    stray,
  };
}

/**
 * The document in today's language. Returns what could not be carried: the
 * lines of a hook diagram that were neither a node nor an edge.
 */
export function upgradeDocument(legacy: LegacyModelDocument): { document: Json; notes: string[] } {
  const document: Json = structuredClone(legacy);
  const notes: string[] = [];
  for (const rule of document.rules ?? []) {
    const edges = rule.edges ?? [];
    rule.nodes = (rule.nodes ?? []).map((n: Json) => ({
      id: n.id,
      ...(n.label !== undefined ? { label: n.label } : {}),
      type: ruleNodeType(n.shape, n.id, edges),
    }));
    if (rule.direction !== undefined) rule.direction = DIRECTION[rule.direction] ?? "down";
  }
  if (document.hookDiagrams) {
    document.hookFlows = document.hookDiagrams.map((diagram: Json) => {
      const { flow, stray } = hookFlowOf(diagram);
      for (const line of stray)
        notes.push(
          `hook flow ${diagram.name}: "${line}" is neither a hook nor an edge and was not carried`
        );
      return flow;
    });
    delete document.hookDiagrams;
  }
  return { document, notes };
}

/* -------------------------------------------------------------------------- */
/*  Comments                                                                   */
/* -------------------------------------------------------------------------- */

/** Whether a line outside an entity block is EML rather than prose. */
function looksLikeEml(line: string): boolean {
  return (
    /^(erDiagram|flowchart|graph|stateDiagram(-v2)?)\b/.test(line) ||
    /^[A-Za-z_]\w*\s*\{\s*$/.test(line) ||
    line === "}" ||
    /^\w+\s+[|}][|o](?:--|\.\.)[|o][|{]\s+\w+/.test(line) ||
    /(-->|---|==>|-\.->)/.test(line) ||
    /^\[\*\]/.test(line) ||
    /^\w+\s*(\(\[|\(\(|\[|\{|\()/.test(line) ||
    /^(direction|classDef|class|style|subgraph|end)\b/.test(line)
  );
}

interface Placed {
  header: string[];
  trailing: string[];
  attached: Array<{ path: Path; lines: string[] }>;
}

/** The comments of a Mermaid model, each against the construct it precedes. */
function placeComments(source: string, document: Json): Placed {
  const attached: Array<{ path: Path; lines: string[] }> = [];
  const header: string[] = [];
  let pending: string[] = [];
  let fence = false;
  let currentEntity: number | undefined;
  let attributeIndex = 0;
  let sawAnchor = false;
  const seenRelationships = new Map<string, number>();
  const seenHooks = new Map<string, number>();

  const find = (key: string, match: (item: Json) => boolean): number =>
    (document[key] ?? []).findIndex(match);
  const entityPath = (name: string): Path | null => {
    const index = find("entities", (e) => e.name === name);
    return index >= 0 ? ["entities", index] : null;
  };
  const attach = (target: Path) => {
    while (pending.length && pending[pending.length - 1] === "") pending.pop();
    while (pending.length && pending[0] === "") pending.shift();
    if (pending.length) attached.push({ path: target, lines: pending });
    pending = [];
  };
  const nth = (
    seen: Map<string, number>,
    key: string,
    items: Json[],
    same: (item: Json) => boolean
  ) => {
    const wanted = seen.get(key) ?? 0;
    seen.set(key, wanted + 1);
    let count = -1;
    return items.findIndex((item) => {
      if (same(item)) count++;
      return same(item) && count === wanted;
    });
  };

  const indexed = (key: string, index: number): Path | null => (index >= 0 ? [key, index] : null);
  /** Each directive that names a construct, and how to find that construct. */
  const ANCHORS: Array<[RegExp, (m: RegExpMatchArray) => Path | null]> = [
    [
      /^(\w+)\s+[|}][|o](?:--|\.\.)[|o][|{]\s+(\w+)/,
      (m) =>
        indexed(
          "relationships",
          nth(
            seenRelationships,
            `${m[1]}|${m[2]}`,
            document.relationships ?? [],
            (r) => r.from === m[1] && r.to === m[2]
          )
        ),
    ],
    [
      /^%%enum\s+(\w+)/,
      (m) =>
        indexed(
          "enums",
          find("enums", (e) => e.name === m[1])
        ),
    ],
    [
      /^%%category\b.*\bname:\s*([^;]+)/,
      (m) =>
        indexed(
          "categories",
          find("categories", (c) => c.name === m[1]!.trim())
        ),
    ],
    [/^%%(?:entity|index)\s+(\w+)/, (m) => entityPath(m[1]!)],
    [
      /^%%field\s+(\w+)\.(\w+)/,
      (m) => {
        const entity = entityPath(m[1]!);
        if (!entity) return null;
        const attributes: Json[] = document.entities[entity[1] as number].attributes;
        const index = attributes.findIndex((a) => a.name === m[2]);
        return index >= 0 ? [...entity, "attributes", index] : entity;
      },
    ],
    [
      /^%%hook\s+(\w+)\s+(\w+)\s+on\s+(\w+)/,
      (m) =>
        indexed(
          "hooks",
          nth(
            seenHooks,
            `${m[3]}|${m[1]}|${m[2]}`,
            document.hooks ?? [],
            (h) => h.entity === m[3] && h.event === m[1] && h.handler === m[2]
          )
        ),
    ],
    [
      /^%%rbac\s+\S+\s+on\s+(\w+)\.(\S+)/,
      (m) =>
        indexed(
          "rbac",
          find("rbac", (r) => r.entity === m[1] && r.action === m[2])
        ),
    ],
    [
      /^%%trigger\s+.*\bon\s+(\w+)/,
      (m) =>
        indexed(
          "triggers",
          find("triggers", (t) => t.entity === m[1])
        ),
    ],
    [
      /^%%report\s+([\w-]+)/,
      (m) =>
        indexed(
          "reports",
          find("reports", (r) => r.name === m[1])
        ),
    ],
    [
      /^%%rule\s+(\S+)/,
      (m) =>
        indexed(
          "rules",
          find("rules", (r) => r.name === m[1])
        ),
    ],
    [
      /^%%workflow\s+(\w+)\s.*\bkind:\s*(\w+)/,
      (m) => {
        const key = m[2] === "state" ? "stateMachines" : m[2] === "saga" ? "sagas" : "hookFlows";
        return indexed(
          key,
          find(key, (w) => w.name === m[1])
        );
      },
    ],
  ];

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      fence = !fence;
      continue;
    }
    if (line && !line.startsWith("%%") && currentEntity === undefined && !looksLikeEml(line)) {
      if (line !== "---") pending.push(line);
      continue;
    }
    if (!line) {
      if (pending.length) pending.push("");
      continue;
    }
    if (/^%%(?:\s|$|[-=*#~_])/.test(line) && !/^%%%%/.test(line)) {
      pending.push(line.replace(/^%%\s?/, ""));
      continue;
    }

    const opened = line.match(/^([A-Za-z_]\w*)\s*\{\s*$/);
    if (opened) {
      const target = entityPath(opened[1]!);
      currentEntity = target ? (target[1] as number) : undefined;
      attributeIndex = 0;
      if (target) {
        sawAnchor = true;
        attach(target);
      }
      continue;
    }
    if (line === "}") {
      currentEntity = undefined;
      continue;
    }
    const column = currentEntity !== undefined ? line.match(/^[A-Za-z_][\w(),]*\s+(\w+)/) : null;
    if (currentEntity !== undefined && column) {
      const attributes: Json[] = document.entities[currentEntity].attributes;
      const index = attributes.findIndex((a, i) => i >= attributeIndex && a.name === column[1]);
      if (index >= 0) {
        attributeIndex = index + 1;
        sawAnchor = true;
        attach(["entities", currentEntity, "attributes", index]);
      }
      continue;
    }
    if (/^%%meta\s+name:/.test(line) && !sawAnchor) {
      header.push(...pending);
      pending = [];
      continue;
    }

    // Section openers, %%meta, %%step, %%action and diagram lines anchor nothing.
    const anchored = ANCHORS.map(([pattern, resolve]) => {
      const match = line.match(pattern);
      return match ? { resolve, match } : null;
    }).find(Boolean);
    const target = anchored ? anchored.resolve(anchored.match) : null;
    if (target) {
      sawAnchor = true;
      attach(target);
    }
  }
  while (pending.length && pending[pending.length - 1] === "") pending.pop();
  return { header, trailing: pending, attached };
}

const commentText = (lines: string[]) => lines.map((line) => (line ? ` ${line}` : "")).join("\n");

/**
 * The document as canonical YAML, with the Mermaid source's comments placed on
 * the constructs they described. Returns the comments it had nowhere to put.
 */
export function writeWithComments(
  document: Json,
  source: string
): { text: string; unplaced: string[] } {
  const canonical = canonicalDocument(document as never);
  const yaml = new Document(canonical);
  visit(yaml, {
    Seq(_key, node) {
      if (node.items.length && node.items.every((item) => isScalar(item))) node.flow = true;
    },
  });
  const unplaced: string[] = [];
  const { header, trailing, attached } = placeComments(source, canonical as Json);
  if (header.length) yaml.commentBefore = commentText(header);
  for (const { path, lines } of attached) {
    const node = yaml.getIn(path, true) as { commentBefore?: string | null } | undefined;
    if (!node || !(isMap(node) || isSeq(node) || isScalar(node))) {
      unplaced.push(...lines.filter(Boolean));
      continue;
    }
    node.commentBefore = node.commentBefore
      ? `${node.commentBefore}\n\n${commentText(lines)}`
      : commentText(lines);
  }
  if (trailing.length) yaml.comment = commentText(trailing);
  return {
    text: yaml.toString({
      lineWidth: 0,
      blockQuote: "literal",
      indentSeq: true,
      flowCollectionPadding: false,
    }),
    unplaced,
  };
}
