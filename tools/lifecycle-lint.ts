#!/usr/bin/env bun
/**
 * Find lifecycles that do not describe a real life.
 *
 *     bun tools/lifecycle-lint.ts [Entity ...]
 *
 * Checks, per entity with a `lifecycle`:
 *   L1 a transition leaves a state declared terminal
 *   L2 a state cannot be reached from the initial state
 *   L3 a non-terminal state has no way out
 *   L4 the status attribute's default is not the initial state
 *   L5 the attribute's `values` differ from the lifecycle's `states`
 *   L6 `terminal` names a state with no incoming transition (and is not initial)
 *   L7 a completed state is cancelled, rejected or voided afterwards (a heuristic: the
 *      names are the ones the template generator used for "undo everything")
 *   L9 the lifecycle names no attribute or no initial state
 */

import "./lib/cli";
import { loadEntities } from "./lib/library";
import { str } from "./lib/text";
import type { Spec } from "./lib/yaml";

const DONE = new Set([
  "COMPLETED",
  "CHECKED_OUT",
  "PAID",
  "FULFILLED",
  "DELIVERED",
  "CLOSED",
  "SETTLED",
  "ARRIVED",
  "FINAL",
  "CONSUMED",
  "GRADUATED",
  "POSTED",
]);
const UNDONE = new Set([
  "CANCELLED",
  "NO_SHOW",
  "REJECTED",
  "VOID",
  "DENIED",
  "WITHDRAWN",
  "ABANDONED",
]);

export function lint(entity: Spec): string[] {
  const lc = entity.lifecycle;
  if (!lc) return [];
  const out: string[] = [];
  const states: unknown[] = [...(lc.states ?? [])];
  if (!lc.attribute) out.push("L9 lifecycle names no attribute");
  if (!lc.initial) out.push("L9 lifecycle names no initial state");
  const initial = lc.initial;
  const terminal: unknown[] = [...new Set<unknown>(lc.terminal ?? [])];
  const terminalSet = new Set(terminal);
  const edges: Array<[unknown, unknown]> = (lc.transitions ?? []).map((t: Spec) => [t.from, t.to]);
  for (const [a, b] of edges)
    if (terminalSet.has(a)) out.push(`L1 leaves terminal ${str(a)} -> ${str(b)}`);
  const seen = new Set<unknown>([initial]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [a, b] of edges) {
      if (seen.has(a) && !seen.has(b)) {
        seen.add(b);
        changed = true;
      }
    }
  }
  for (const s of states) {
    if (!seen.has(s)) out.push(`L2 ${str(s)} unreachable from ${str(initial)}`);
    if (!terminalSet.has(s) && !edges.some(([a]) => a === s))
      out.push(`L3 ${str(s)} has no way out and is not terminal`);
  }
  for (const [a, b] of edges) {
    if (DONE.has(a as string) && UNDONE.has(b as string) && !(a === "POSTED" && b === "VOID")) {
      out.push(`L7 ${str(a)} -> ${str(b)} undoes a completed state`);
    }
  }
  for (const t of terminal) {
    if (t !== initial && !edges.some(([, b]) => b === t))
      out.push(`L6 terminal ${str(t)} is never entered`);
  }
  const attr = (entity.attributes ?? []).find((a: Spec) => a?.name === lc.attribute);
  if (attr) {
    if (attr.default !== undefined && attr.default !== null && str(attr.default) !== str(initial)) {
      out.push(`L4 default ${str(attr.default)} != initial ${str(initial)}`);
    }
    const values = new Set<string>((attr.values ?? []).map(str));
    const stateSet = new Set(states.map(str));
    if (
      attr.values?.length &&
      (values.size !== stateSet.size || [...values].some((v) => !stateSet.has(v)))
    ) {
      out.push("L5 values differ from states");
    }
  }
  return out;
}

if (import.meta.main) {
  const only = new Set(process.argv.slice(2));
  let total = 0;
  for (const { entity } of loadEntities()) {
    if (only.size && !only.has(entity.name)) continue;
    for (const line of lint(entity)) {
      console.log(`${entity.name}: ${line}`);
      total++;
    }
  }
  console.log(`${total} lifecycle finding(s)`);
  process.exit(total ? 1 : 0);
}
