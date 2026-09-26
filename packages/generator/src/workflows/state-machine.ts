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
import type { StateMachineDeclaration, StateTransitionDeclaration } from "../model/records";

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

/**
 * Compile every `%%workflow … kind: state` section in a model.
 *
 * A section naming an entity the model does not declare is skipped with a
 * warning: a machine bound to no table has nothing to govern.
 */
export function compileWorkflows(
  source: string,
  knownEntities: string[] = [],
  onWarn: (message: string) => void = () => {}
): CompiledWorkflow[] {
  return compileStateMachineDeclarations(readStateMachines(source), knownEntities, onWarn);
}

/**
 * Read every `kind: state` section into a declaration, uncompiled.
 *
 * States are listed in the order they first appear on a transition line, which
 * is the order the diagram has always compiled to. `[*] --> x` names the
 * starting state (the last such line wins) and `x --> [*]` a terminal one.
 */
export function readStateMachines(source: string): StateMachineDeclaration[] {
  const declarations: StateMachineDeclaration[] = [];

  for (const section of extractWorkflowSections(source ?? "")) {
    if (section.kind !== "state") continue;

    const states: string[] = [];
    const transitions: StateTransitionDeclaration[] = [];
    const final: string[] = [];
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
        if (name !== START_MARKER && !states.includes(name)) states.push(name);
      }

      if (from === START_MARKER) {
        initial = to;
        continue;
      }
      if (to === START_MARKER) {
        final.push(from);
        continue;
      }
      const cleaned = trigger?.trim();
      transitions.push({ from, to, ...(cleaned !== undefined ? { trigger: cleaned } : {}) });
    }

    declarations.push({
      name: section.name,
      ...(section.title ? { title: section.title } : {}),
      entity: section.entity,
      states,
      ...(initial !== undefined ? { initial } : {}),
      final,
      transitions,
    });
  }

  return declarations;
}

/** Compile state machine declarations read from either syntax. */
export function compileStateMachineDeclarations(
  declarations: StateMachineDeclaration[],
  knownEntities: string[] = [],
  onWarn: (message: string) => void = () => {}
): CompiledWorkflow[] {
  const known = new Set(knownEntities);
  const compiled: CompiledWorkflow[] = [];

  for (const declaration of declarations) {
    if (known.size && !known.has(declaration.entity)) {
      onWarn(
        `Workflow "${declaration.name}" targets unknown entity "${declaration.entity}" — skipped.`
      );
      continue;
    }

    if (!declaration.states.length) {
      onWarn(`Workflow "${declaration.name}" declares no states — skipped.`);
      continue;
    }
    if (!declaration.initial) {
      onWarn(`Workflow "${declaration.name}" has no starting state — records will not be stamped.`);
    }

    compiled.push({
      name: declaration.name,
      entity: declaration.entity,
      tableName: toTableName(declaration.entity),
      states: declaration.states.map((name) => ({ name })),
      transitions: declaration.transitions.map(({ from, to, trigger }) => ({ from, to, trigger })),
      initial: declaration.initial,
      terminal: [...declaration.final],
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
