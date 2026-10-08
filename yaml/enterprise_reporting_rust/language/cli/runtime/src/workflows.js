// Workflow state machines.
// Builds a transition table per entity from the model's state machines, and
// enforces legal status transitions on update.

import { MODEL } from "./model.js";

/** entity -> { initial, states, finals, statusField, transitions: {from: {event: to}} } */
export const stateMachines = buildStateMachines();

function buildStateMachines() {
  const machines = {};
  for (const wf of MODEL.workflows ?? []) {
    if (wf.kind !== "state" || !wf.entity) continue;
    const transitions = {};
    for (const t of wf.transitions ?? []) {
      if (!transitions[t.from]) transitions[t.from] = {};
      transitions[t.from][t.event || `${t.from}_to_${t.to}`] = t.to;
    }
    machines[wf.entity] = {
      initial: wf.initial ?? wf.states?.[0] ?? null,
      states: wf.states ?? [],
      // A completed transaction: a record in one of these is closed.
      finals: wf.final ?? [],
      // The column the machine drives — `status`, `state` or `stage`, resolved
      // when the model was read. Not always `status`: a sales opportunity keeps
      // its lifecycle in `stage`.
      statusField: wf.statusField ?? "status",
      transitions,
    };
  }
  return machines;
}

/** Is a direct from->to transition allowed for this entity? */
export function canTransition(entity, from, to) {
  const sm = stateMachines[entity];
  if (!sm) return true; // no state machine => unrestricted
  if (from == null) return true;
  const events = sm.transitions[from] ?? {};
  return Object.values(events).includes(to);
}

/** Reachable next states from a given state. */
export function nextStates(entity, from) {
  const sm = stateMachines[entity];
  if (!sm) return [];
  return Object.values(sm.transitions[from] ?? {});
}
