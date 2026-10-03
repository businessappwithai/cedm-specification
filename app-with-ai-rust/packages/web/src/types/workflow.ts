/**
 * A service's hooks, as the enhance step edits them.
 *
 * A service is an entity; its hooks are the lifecycle handlers the generated
 * backend calls around each operation on it. They are stored as
 * `hook_definitions` on the service's `workflows` row, and composed into the
 * model's `hooks` when the project is generated (`lib/model/compose.ts`).
 */

/** Every lifecycle event a generated service dispatches a hook for. */
export const HOOK_TYPES = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeQuery",
  "afterQuery",
  "customValidate",
  "beforeRead",
  "afterRead",
  "beforeList",
  "afterList",
] as const;

export type HookType = (typeof HOOK_TYPES)[number];

/** A column a hook is scoped to. */
export interface HookParameter {
  name: string;
  type: string;
}

/** One hook on a service, as stored in `hook_definitions`. */
export interface HookDefinition {
  type: HookType;
  /** The handler the generated backend calls — a function name. */
  name: string;
  entity: string;
  parameters?: HookParameter[];
  enabled: boolean;
  /** The handler body the author wrote here, if any. */
  code?: string;
  order: number;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** What is wrong with a hook, in words; empty when it can be generated. */
export function validateHookDefinition(hook: Pick<HookDefinition, "type" | "name" | "entity">): string[] {
  const errors: string[] = [];
  if (!(HOOK_TYPES as readonly string[]).includes(hook.type))
    errors.push(`"${hook.type}" is not a lifecycle event a service dispatches.`);
  if (!IDENTIFIER.test(hook.name))
    errors.push(
      `"${hook.name || "(unnamed)"}" is not a valid handler name — letters, digits and underscore, not starting with a digit.`
    );
  if (!IDENTIFIER.test(hook.entity))
    errors.push(`"${hook.entity || "(none)"}" is not a valid entity name.`);
  return errors;
}

/** A service's hooks as the enhance step loads and saves them. */
export interface HookWorkflow {
  id: string;
  projectId: string;
  serviceName: string;
  hooks: HookDefinition[];
  generatedHookCode?: string;
  isDraft: boolean;
  lastModified: string;
  description?: string;
  createdAt?: string;
}

/** Response from applying a service's hooks. */
export interface ApplyWorkflowResponse {
  workflowId: string;
  generatedCode?: string;
  validationErrors?: string[];
  warnings?: string[];
}

/** A service offered on the enhance step. */
export interface ServiceInfo {
  name: string;
  entity: string;
  description: string;
  hooksCount: number;
}
