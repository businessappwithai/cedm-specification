/**
 * A model's state machines → the moves a record may make.
 *
 * A state machine states a lifecycle: which statuses exist, which one a record
 * starts in, and which changes are legitimate. It was once decoration — nothing
 * compiled it, so an author could permit `draft → approved` and the API would
 * happily accept `draft → shipped`, or any other string typed into the column.
 *
 * This compiles it. The transitions become `sys_workflow_transitions` rows,
 * which is what `authz::require_transition` refuses a status write against, and
 * what `GET /api/workflows/transitions` offers a form so it can show only the
 * moves that exist.
 *
 * Sagas are compiled separately, by `./sagas.ts`: a saga is a sequence of steps
 * to *run*, a state machine is a set of moves to *permit*.
 */

import type { StateMachineDeclaration } from "../model/records";

export interface WorkflowState {
  name: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  /** The event that makes the move — the transition's `trigger`. */
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
  /** The state a record starts in — the machine's `initial`. */
  initial?: string;
  terminal: string[];
}

/** `Deal` → `bus_deal`, matching the ERD's table naming. */
function toTableName(entity: string): string {
  const snake = entity
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}

/**
 * Compile a model's state machines. One naming an entity the model does not
 * declare is skipped with a warning: a machine bound to no table has nothing to
 * govern.
 */
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
