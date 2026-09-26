/**
 * `%%workflow ... kind: state` → the moves a record may make.
 *
 * A state diagram in the model draws a lifecycle: which statuses exist, which
 * one a record starts in, and which changes are legitimate. Until now that
 * diagram was decoration — the parser skipped it, so an author could draw
 * `draft --> approved` and the API would happily accept `draft --> shipped`,
 * or any other string typed into the column.
 *
 * This compiles it. The edges become `sys_workflow_transitions` rows, which is
 * what `authz::require_transition` refuses a status write against, and what
 * `GET /api/workflows/transitions` offers a form so it can show only the moves
 * that exist.
 *
 * Sagas are compiled separately, by `./saga.ts`. The two are different things
 * that share a directive: a saga is a sequence of steps to *run*, a state
 * machine is a set of moves to *permit*.
 */

import { extractWorkflowSections } from "../eml";

export interface WorkflowState {
  name: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  /** The event name on the edge, from `from --> to : trigger`. */
  trigger?: string;
}

export interface CompiledWorkflow {
  /** Workflow name as written in the model. */
  name: string;
  /** Entity the workflow belongs to, as the model spells it. */
  entity: string;
  /** Physical table the transitions are recorded against, e.g. `bus_deal`. */
  tableName: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  /** The state a record starts in — the `[*] --> x` edge. */
  initial?: string;
  terminal: string[];
}

const START_MARKER = "[*]";

/**
 * `from --> to : trigger`, with `[*]` legal at either end.
 *
 * Mermaid's own state syntax, so the diagram renders in any Mermaid viewer and
 * the generator reads the same thing a reader sees.
 */
const TRANSITION = /^(\[\*\]|[A-Za-z_]\w*)\s*-->\s*(\[\*\]|[A-Za-z_]\w*)\s*(?::\s*(.+))?$/;

/** `Deal` → `bus_deal`, matching the ERD's table naming. */
function toTableName(entity: string): string {
  const snake = entity
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}

/** Read the state machines a document declares. */
export function compileWorkflows(
  source: string,
  knownEntities: string[] = [],
  onWarn: (message: string) => void = () => {}
): CompiledWorkflow[] {
  const known = new Set(knownEntities);
  const compiled: CompiledWorkflow[] = [];

  for (const section of extractWorkflowSections(source ?? "")) {
    if (section.kind !== "state") continue;

    if (known.size && !known.has(section.entity)) {
      onWarn(`Workflow "${section.name}" targets unknown entity "${section.entity}" — skipped.`);
      continue;
    }

    const states = new Map<string, WorkflowState>();
    const transitions: WorkflowTransition[] = [];
    const terminal: string[] = [];
    let initial: string | undefined;

    for (const rawLine of (section.diagram ?? "").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("%%")) continue;

      const match = line.match(TRANSITION);
      if (!match) continue;

      const [, from, to, trigger] = match as unknown as [
        string,
        string,
        string,
        string | undefined,
      ];

      for (const name of [from, to]) {
        if (name !== START_MARKER && !states.has(name)) states.set(name, { name });
      }

      // `[*] --> draft` names the starting state, and `won --> [*]` a terminal
      // one. Neither is a move a caller can make, so neither becomes an edge:
      // recording `[*]` as a from-state would let a request set any record
      // straight back to its initial status.
      if (from === START_MARKER) {
        initial = to;
        continue;
      }
      if (to === START_MARKER) {
        terminal.push(from);
        continue;
      }
      transitions.push({ from, to, trigger: trigger?.trim() });
    }

    if (!states.size) {
      onWarn(`Workflow "${section.name}" declares no states — skipped.`);
      continue;
    }
    if (!initial) {
      onWarn(`Workflow "${section.name}" has no starting state — records will not be stamped.`);
    }

    compiled.push({
      name: section.name,
      entity: section.entity,
      tableName: toTableName(section.entity),
      states: [...states.values()],
      transitions,
      initial,
      terminal,
    });
  }

  return compiled;
}

/** A human-readable summary of the machine, for the Workflow Designer. */
export function describeWorkflow(workflow: CompiledWorkflow): string {
  const moves = workflow.transitions
    .map((t) => `${t.from} → ${t.to}${t.trigger ? ` (${t.trigger})` : ""}`)
    .join(", ");

  return [
    `${workflow.name}: ${workflow.states.length} states`,
    workflow.initial ? `starts in ${workflow.initial}` : null,
    workflow.terminal.length ? `ends in ${workflow.terminal.join(" or ")}` : null,
    moves ? `transitions: ${moves}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
