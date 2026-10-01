/**
 * The workflow step types this application can actually run.
 *
 * Derived from `workflowConstructs.stepNodes` in the EML language definition,
 * which is also what the backend's executor is written against. It is derived
 * rather than freely written because the two hand-maintained copies had
 * already drifted apart in both directions: the designer offered
 * `Agent`, which the executor rejects outright with a 400 — so a workflow
 * built with one failed every time it ran — and it did not offer `Decision`,
 * which the executor gained and nothing could then reach.
 *
 * Checked in rather than rendered, and pinned to the language by
 * `src/templates/__tests__/step-types.test.ts` — a static file resolves in
 * the template tree, which a `.hbs` does not, and the guarantee is the same:
 * a change to `stepNodes` that is not made here fails a test.
 *
 * A step type the language marks `shipped: false` is declared but not
 * executed. Those are listed separately and deliberately not offered: the
 * executor fails a run containing one rather than skipping it, because
 * skipping reported success for business outcomes that never happened. A
 * designer that cannot build the step is the same contract, one step earlier.
 */

export const STEP_TYPES = [
  "UpdateEntity",
  "CreateEntity",
  "DeleteEntity",
  "Decision",
  "Formula",
  "REST",
] as const;

export type StepType = (typeof STEP_TYPES)[number];

/** Declared in the language, not executed by this backend. Never offered. */
export const UNSHIPPED_STEP_TYPES: readonly string[] = [
  "Agent",
];

/** One line on what each step does, from the language's own `purpose`. */
export const STEP_PURPOSE: Record<StepType, string> = {
  UpdateEntity: "Write one column on the triggering record, or on rows of a related entity.",
  CreateEntity: "Insert a row, optionally publishing its id for later steps.",
  DeleteEntity: "Delete the triggering record or rows of a related entity.",
  Decision: "Evaluate a GoRules decision table and publish the matching row's output columns as variables the following steps read.",
  Formula: "Publish a value into the workflow context for later steps.",
  REST: "Call an external HTTP endpoint.",
};

export function isStepType(value: string): value is StepType {
  return (STEP_TYPES as readonly string[]).includes(value);
}
