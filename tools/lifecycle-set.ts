#!/usr/bin/env bun
/**
 * Replace an entity's lifecycle transitions and terminal states.
 *
 *     bun tools/lifecycle-set.ts BankLoan --terminal PAID_OFF,DEFAULTED,CANCELLED \
 *         APPLICATION>APPROVED:approve APPROVED>ACTIVE:activate ...
 *
 * Options: --attribute <name>, --initial <state>, --terminal <A,B,...>.
 * Every state named in a transition must be one of the lifecycle's `states`.
 * Transitions are written one flow mapping per line, as the library writes them.
 */

import "./lib/cli";
import { isMap, YAMLSeq } from "yaml";
import { fail, openEntityByName } from "./lib/edit";
import { writeDocument } from "./lib/yaml";

const [name, ...rest] = process.argv.slice(2);
if (!name)
  fail(
    "usage: bun tools/lifecycle-set.ts Entity [--attribute a] [--initial s] [--terminal A,B] FROM>TO:action ..."
  );

let attribute: string | undefined;
let initial: string | undefined;
let terminal: string[] | undefined;
const edges: Array<[string, string, string]> = [];
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i] as string;
  if (arg === "--attribute") attribute = rest[++i];
  else if (arg === "--initial") initial = rest[++i];
  else if (arg === "--terminal") terminal = (rest[++i] ?? "").split(",").filter(Boolean);
  else {
    const [edge = "", action = ""] = arg.split(/:(.*)/s);
    const [from = "", to = ""] = edge.split(/>(.*)/s);
    if (!from || !to) fail(`${arg}: expected FROM>TO:action`);
    edges.push([from, to, action]);
  }
}

const { path, document, entity } = openEntityByName(name);
const lifecycle = entity.get("lifecycle", true);
if (!isMap(lifecycle)) fail(`${name} has no lifecycle; declare its states first`);
const states = new Set<string>((lifecycle.toJSON().states ?? []).map(String));
for (const [from, to] of edges) {
  if (!states.has(from) || !states.has(to))
    fail(`${from}>${to}: not in states ${JSON.stringify([...states].sort())}`);
}
for (const state of [...(terminal ?? []), ...(initial ? [initial] : [])]) {
  if (!states.has(state)) fail(`${state}: not in states ${JSON.stringify([...states].sort())}`);
}

const transitions = new YAMLSeq();
for (const [from, to, action] of edges) {
  const node = document.createNode({ from, to, action });
  node.flow = true;
  transitions.items.push(node);
}
lifecycle.set("transitions", transitions);
if (attribute !== undefined) lifecycle.set("attribute", attribute);
if (initial !== undefined) lifecycle.set("initial", initial);
if (terminal !== undefined) {
  const node = document.createNode(terminal);
  node.flow = true;
  lifecycle.set("terminal", node);
}
writeDocument(path, document);
console.log(
  `${name}: ${edges.length} transitions, terminal=${JSON.stringify(lifecycle.toJSON().terminal ?? null)}`
);
