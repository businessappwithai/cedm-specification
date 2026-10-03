/**
 * AppWithAI Modeling Language (EML)
 * ---------------------------------
 * A model is a YAML document (`*.eml.yaml`) describing an application's
 * entities and relationships, its business rules, its access rules and its
 * workflows. `yaml/eml.schema.json` defines the document's shape;
 * `appwithai-language.json` defines the vocabulary it is written in — the
 * types, the cardinalities, the lifecycle events, the rule node types, the
 * saga step types — and what each compiles to.
 *
 * This module is the typed accessor for `appwithai-language.json`, so every
 * reader of a model — the checker, the CLI, the generator, the browser bundle —
 * reads one vocabulary.
 *
 * @example
 * ```ts
 * import { normalizeType, cardinalityKind, isHookType } from "../language";
 *
 * normalizeType("varchar");                            // "string"
 * cardinalityKind("exactly-one", "zero-or-more");      // "oneToMany"
 * isHookType("beforeCreate");                          // true
 * ```
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types describing the shape of appwithai-language.json
// ---------------------------------------------------------------------------

export type CanonicalType =
  | "string"
  | "text"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "json";

export type CardinalityKind = "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";

/** How many records may stand at one end of a relationship. */
export type RelationshipEnd = "exactly-one" | "zero-or-one" | "zero-or-more" | "one-or-more";

export type HookType =
  | "beforeCreate"
  | "afterCreate"
  | "beforeUpdate"
  | "afterUpdate"
  | "beforeDelete"
  | "afterDelete"
  | "beforeQuery"
  | "afterQuery"
  | "customValidate"
  | "beforeRead"
  | "afterRead"
  | "beforeList"
  | "afterList";

export type JdmNodeRole =
  | "inputNode"
  | "outputNode"
  | "switchNode"
  | "functionNode"
  | "expressionNode";

/** What a node of a rule's decision graph does. */
export type RuleNodeType = "start" | "end" | "decision" | "expression" | "function";

/**
 * One executable step type for a saga.
 *
 * The checker, the generator and both authoring UIs read their notion of "what
 * this step needs" from here, so a new step type is declared once.
 */
export interface StepNodeDefinition {
  name: string;
  purpose: string;
  required: string[];
  /** Groups where at least one member must be present. */
  oneOf?: string[][];
  optional?: string[];
  /** Formula only: the operations it understands. */
  operations?: Record<string, string>;
  /** Formula only: extra required properties per operation. */
  perOperation?: Record<string, { required: string[] }>;
  notes?: string[];
  rowTargeting?: string;
  shipped?: boolean;
  example: string;
}

/** One lifecycle event an automation can be triggered by. */
export interface AutomationTrigger {
  /** How the builder names it, e.g. "created". */
  event: string;
  /** The hook it maps to on the generated service, e.g. "afterCreate". */
  hook: string;
  phase: "before" | "after";
  /** Whether the automation can still stop the write. */
  blocking: boolean;
  purpose: string;
}

/** A comparison operator usable in an automation condition. */
export interface AutomationOperator {
  id: string;
  label: string;
  /** 0 means the operator takes no right-hand value ("is empty"). */
  arity: 0 | 1;
}

/** One step type an automation may use. */
export interface AutomationStepDefinition {
  type: string;
  purpose: string;
  properties: string[];
  example: string;
}

export interface LanguageDefinition {
  $schema: string;
  $id: string;
  language: {
    id: string;
    name: string;
    abbreviation: string;
    version: string;
    description: string;
    fileExtensions: string[];
    documentSchema: string;
    encoding: string;
    purpose: string[];
  };
  types: {
    description: string;
    canonical: CanonicalType[];
    map: Record<string, CanonicalType>;
    semanticHints: Record<string, string>;
    default: CanonicalType;
  };
  cardinalities: {
    description: string;
    ends: Record<RelationshipEnd, string>;
    map: Array<{ from: RelationshipEnd; to: RelationshipEnd; kind: CardinalityKind; example: string }>;
  };
  hooks: {
    description: string;
    types: Array<{ type: HookType; phase: string; op: string; purpose: string }>;
  };
  ruleNodes: {
    description: string;
    /** What each node type of a rule's decision graph compiles to. */
    types: Array<{ type: RuleNodeType; jdmType: JdmNodeRole; role: string }>;
    /** Side-effecting actions a rule may declare. */
    actions?: {
      description: string;
      types: Array<{
        name: string;
        purpose: string;
        required: string[];
        optional?: string[];
        example: string;
      }>;
    };
  };
  workflowConstructs: {
    description: string;
    /** Executable step vocabulary for sagas. */
    stepNodes: {
      description: string;
      variables: string;
      types: StepNodeDefinition[];
    };
  };
  /** Automations built in a generated application's automation screen. */
  automations: {
    description: string;
    triggers: { description: string; events: AutomationTrigger[] };
    conditions: { description: string; operators: AutomationOperator[] };
    steps: { description: string; types: AutomationStepDefinition[] };
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** Absolute path to the language definition file. */
export const LANGUAGE_DEFINITION_PATH = (() => {
  // Resolve relative to this module so it works from source and from dist.
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "appwithai-language.json");
})();

let cached: LanguageDefinition | null = null;

/**
 * Supply the definition instead of reading it from disk.
 *
 * A browser tab has no `appwithai-language.json` to open: the bundler inlines
 * the same JSON and hands it over here, so the vocabulary a model is checked
 * against is the file in this folder either way.
 */
export function setLanguageDefinition(definition: LanguageDefinition): void {
  cached = definition;
}

/**
 * Load and cache the language definition from disk.
 * @param force - bypass the in-memory cache and re-read the file.
 */
export function loadLanguageDefinition(force = false): LanguageDefinition {
  if (cached && !force) return cached;
  const raw = readFileSync(LANGUAGE_DEFINITION_PATH, "utf-8");
  cached = JSON.parse(raw) as LanguageDefinition;
  return cached;
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** Normalise an attribute type alias to its canonical type. */
export function normalizeType(rawType: string): CanonicalType {
  const def = loadLanguageDefinition();
  const key = (rawType || "")
    .toLowerCase()
    .replace(/\(\d+\)/, "")
    .trim();
  return def.types.map[key] ?? def.types.default;
}

/** The kind of relationship two ends make, or null for a pair the language does not define. */
export function cardinalityKind(from: RelationshipEnd, to: RelationshipEnd): CardinalityKind | null {
  return (
    loadLanguageDefinition().cardinalities.map.find(
      (entry) => entry.from === from && entry.to === to
    )?.kind ?? null
  );
}

/** All valid lifecycle hook types. */
export function hookTypes(): HookType[] {
  return loadLanguageDefinition().hooks.types.map((h) => h.type);
}

/** Type guard: is the given string a valid hook type? */
export function isHookType(value: string): value is HookType {
  return hookTypes().includes(value as HookType);
}

/** Language version string, e.g. "2.0.0". */
export function languageVersion(): string {
  return loadLanguageDefinition().language.version;
}

export default loadLanguageDefinition;

/** The executable step types a saga may use. */
export function stepNodeTypes(): StepNodeDefinition[] {
  return loadLanguageDefinition().workflowConstructs.stepNodes.types;
}

/** Look up one step type's contract by name. */
export function stepNode(name: string): StepNodeDefinition | undefined {
  return stepNodeTypes().find((step) => step.name === name);
}

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

/** The lifecycle events an automation can be triggered by. */
export function automationTriggers(): AutomationTrigger[] {
  return loadLanguageDefinition().automations.triggers.events;
}

/** The hook a trigger event maps to, or null if the event is unknown. */
export function triggerHook(event: string): string | null {
  return automationTriggers().find((t) => t.event === event)?.hook ?? null;
}

/** The reverse: which trigger event a hook name denotes. */
export function hookTriggerEvent(hook: string): string | null {
  return automationTriggers().find((t) => t.hook === hook)?.event ?? null;
}

/** Comparison operators available to an automation condition. */
export function automationOperators(): AutomationOperator[] {
  return loadLanguageDefinition().automations.conditions.operators;
}

/**
 * How many operands an operator takes: 1 normally, 0 for checks like
 * "is empty" that have nothing on the right-hand side. An operator the language
 * does not define is reported as 1, the arity of every comparison.
 */
export function operatorArity(id: string): 0 | 1 {
  return automationOperators().find((o) => o.id === id)?.arity ?? 1;
}

/** The step types an automation may use. */
export function automationStepTypes(): AutomationStepDefinition[] {
  return loadLanguageDefinition().automations.steps.types;
}

/** Look up one automation step type by name. */
export function automationStep(type: string): AutomationStepDefinition | undefined {
  return automationStepTypes().find((step) => step.type === type);
}
