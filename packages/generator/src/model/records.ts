/**
 * Model records — what a model *says*, before anything is compiled from it.
 *
 * A model is a YAML document (`language/yaml/eml.schema.json`). It is read into
 * these records by `documentToRecords`, and only these records are compiled.
 * The Rust generator reads the same document into the same records
 * (`crates/appwithai-gen/src/records.rs`) and compiles them with the same
 * rules; `bun run parity` holds the two to identical output.
 *
 * The records keep what the author wrote, not what it will be compiled into.
 * An attribute's type is the token as written (`string(255)`, `email`), a
 * relationship keeps both ends' cardinality rather than the four-way kind the
 * compiler folds them into, and a saga step keeps the properties the author
 * gave it. Anything the compilers derive — table names, reference ids, primary
 * keys, default categories — is derived by the compilers, once.
 */

import type { ConcurrencyMode } from "../model-yaml/document";

/* -------------------------------------------------------------------------- */
/*  Entity-relationship model                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One column declaration. The flags are the attribute's `pk`, `fk`, `unique` and
 * `optional` keys, as the tokens `PK`, `FK`, `UK` and `OPTIONAL`, and a comment
 * as one quoted token — the form both compilers resolve.
 */
export interface AttributeDeclaration {
  /** The type as written, length suffix included: `string(255)`, `email`. */
  type: string;
  name: string;
  modifiers: string[];
  /** The entity a foreign key points at, where its name does not say. */
  references?: string;
  /** Columns of the entity that narrow this lookup's choices. */
  narrowedBy?: string[];
}

export interface EntityDeclaration {
  name: string;
  attributes: AttributeDeclaration[];
}

/** How many records may stand at one end of a relationship. */
export type RelationshipEnd = "exactly-one" | "zero-or-one" | "zero-or-more" | "one-or-more";

export interface RelationshipDeclaration {
  source: string;
  target: string;
  /** Cardinality at the source (`from`) end. */
  sourceEnd: RelationshipEnd;
  /** Cardinality at the target (`to`) end. */
  targetEnd: RelationshipEnd;
  /** The relationship's name, as written. */
  label?: string;
}

export interface IndexDeclaration {
  entity: string;
  columns: string[];
  unique: boolean;
}

export interface EnumDeclaration {
  name: string;
  values: string[];
  /** The enumeration has a business table (an entity of the same name). */
  table?: boolean;
  labels?: Record<string, string>;
  descriptions?: Record<string, string>;
}

export interface FieldEnumBinding {
  entity: string;
  column: string;
  enumName: string;
}

export interface FieldHelp {
  entity: string;
  column: string;
  help: string;
}

/**
 * Entity keys the language validates and carries but the application
 * generators do not compile yet. The `eml` CLI's generators read `audited`.
 */
export const ENTITY_OPTION_KEYS = ["label", "prefix", "softDelete", "audited"] as const;
export type EntityOptionKey = (typeof ENTITY_OPTION_KEYS)[number];

/** Attribute keys carried on the same terms as `ENTITY_OPTION_KEYS`. */
export const FIELD_OPTION_KEYS = ["ui", "default", "min", "max", "format"] as const;
export type FieldOptionKey = (typeof FIELD_OPTION_KEYS)[number];

/** An entity's value for a key in `ENTITY_OPTION_KEYS`, as text. */
export interface EntityOption {
  entity: string;
  key: EntityOptionKey;
  value: string;
}

/** An attribute's value for a key in `FIELD_OPTION_KEYS`, as text. */
export interface FieldOption {
  entity: string;
  column: string;
  key: FieldOptionKey;
  value: string;
}

/**
 * Everything the ERD layer of a model declares.
 *
 * Entity-level annotations are lists in declaration order, not maps, so that
 * the compiler alone decides how a repeat resolves (the last help wins, the
 * entity keeps the position of the first).
 */
export interface ErdRecords {
  entities: EntityDeclaration[];
  relationships: RelationshipDeclaration[];
  indexes: IndexDeclaration[];
  enums: EnumDeclaration[];
  enumBindings: FieldEnumBinding[];
  fieldHelp: FieldHelp[];
  entityHelp: Array<{ entity: string; help: string }>;
  entityIcons: Array<{ entity: string; icon: string }>;
  /** An entity's `concurrency`, where it declares one. */
  entityConcurrency: Array<{ entity: string; mode: ConcurrencyMode }>;
  /** Rows an entity ships with: `data` of the entity document. */
  entityData: Array<{ entity: string; key: string; rows: Array<Record<string, string | number | boolean | null>> }>;
  entityParents: Array<{ entity: string; parent: string }>;
  entityOptions: EntityOption[];
  fieldOptions: FieldOption[];
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

/** One category. Categories sharing a code are merged. */
export interface CategoryDeclaration {
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  seq?: number;
  isDefault: boolean;
  entities: string[];
}

/* -------------------------------------------------------------------------- */
/*  Access control, hooks, reports                                             */
/* -------------------------------------------------------------------------- */

/**
 * One access rule: these roles may perform `target` on `entity`.
 *
 * `target` is a CRUD operation or one of its aliases, `*`, or the trigger of a
 * transition in the entity's state machine — which of those it is, the
 * compiler decides, because only the compiled machines can say.
 */
export interface RbacDeclaration {
  roles: string[];
  entity: string;
  target: string;
}

/**
 * An external event or a schedule that calls `handler` on `entity`.
 *
 * `source` is `cron:<expression>`, `webhook:<name>` or `message:<topic>`. The
 * application generators compile nothing from it yet; the `eml` CLI's
 * generators do.
 */
export interface TriggerDeclaration {
  source: string;
  handler: string;
  entity: string;
}

/** One hook. `event` is checked against the hook vocabulary by the compiler. */
export interface HookDeclaration {
  event: string;
  handler: string;
  entity: string;
  /**
   * The columns the hook is scoped to, in the order written. The compiled
   * handler is scoped to the first; every one is carried.
   */
  fields?: string[];
}

/** One report, before the read-only and chart checks. */
export interface ReportDeclaration {
  name: string;
  title?: string;
  entity?: string;
  chart?: string;
  x?: string;
  y?: string;
  help?: string;
  sql: string;
}

/* -------------------------------------------------------------------------- */
/*  Rules                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What a node of a rule's decision graph does, and so which GoRules JDM node it
 * compiles to: `start` an input node, `end` an output node, `decision` a switch,
 * `expression` an expression node, `function` a function node.
 */
export type RuleNodeType = "start" | "end" | "decision" | "expression" | "function";

export interface RuleNode {
  id: string;
  label: string;
  type: RuleNodeType;
}

/** Which way a diagram of a graph is laid out. Layout only; nothing compiles it. */
export type FlowDirection = "down" | "up" | "right" | "left";

export interface RuleEdge {
  source: string;
  target: string;
  label?: string;
}

export interface RuleAction {
  name: string;
  type: string;
  /** The condition, in the rule engine's expression language. Absent means always. */
  when?: string;
  props: Record<string, string>;
}

export interface DecisionTableColumn {
  id: string;
  name?: string;
  field?: string;
}

export interface DecisionTable {
  hitPolicy?: "first" | "collect";
  inputs?: DecisionTableColumn[];
  outputs?: DecisionTableColumn[];
  rules?: Array<Record<string, string>>;
}

/**
 * A business rule bound to a lifecycle event.
 *
 * A rule is compiled from exactly one of three things, in this precedence: an
 * editor-authored decision table, a list of actions, or the decision graph
 * itself. All three are kept because the graph is also what the rule looks
 * like, and dropping it would lose what the author drew.
 */
export interface RuleDeclaration {
  name: string;
  title?: string;
  entity: string;
  event: string;
  priority?: number;
  /** How the graph is laid out when drawn. */
  direction?: FlowDirection;
  nodes: RuleNode[];
  edges: RuleEdge[];
  actions: RuleAction[];
  decisionTable?: DecisionTable;
}

/* -------------------------------------------------------------------------- */
/*  Workflows                                                                  */
/* -------------------------------------------------------------------------- */

export interface StateTransitionDeclaration {
  from: string;
  to: string;
  trigger?: string;
}

/**
 * A state machine: the moves a record's status may make.
 *
 * `states` is listed rather than inferred, so its order is the author's.
 */
export interface StateMachineDeclaration {
  name: string;
  title?: string;
  entity: string;
  states: string[];
  initial?: string;
  final: string[];
  transitions: StateTransitionDeclaration[];
}

export interface SagaStepDeclaration {
  id: string;
  type: string;
  label?: string;
  properties: Record<string, string>;
}

/** A saga: an ordered process of steps run on a write. */
export interface SagaDeclaration {
  name: string;
  title?: string;
  entity: string;
  operation?: string;
  trigger?: string;
  description?: string;
  /** In execution order. */
  steps: SagaStepDeclaration[];
}

/**
 * One step of a hook flow: either a hook the entity declares, named by its
 * event and handler, or a step the flow shows for context (the request, the
 * write, the response), named by its label.
 */
export interface HookFlowNode {
  id: string;
  label?: string;
  event?: string;
  handler?: string;
}

/**
 * The order an entity's hooks run in around a write, drawn as a graph. It
 * documents the hooks; the hooks themselves are the model's `hooks`, and the
 * compiled dispatch order is the hook vocabulary's, not this drawing's.
 */
export interface HookFlowDeclaration {
  name: string;
  title?: string;
  entity: string;
  direction?: FlowDirection;
  nodes: HookFlowNode[];
  edges: RuleEdge[];
}

/* -------------------------------------------------------------------------- */
/*  The whole model                                                            */
/* -------------------------------------------------------------------------- */

export interface ModelRecords {
  name?: string;
  version?: string;
  description?: string;
  erd: ErdRecords;
  categories: CategoryDeclaration[];
  rbac: RbacDeclaration[];
  triggers: TriggerDeclaration[];
  hooks: HookDeclaration[];
  reports: ReportDeclaration[];
  rules: RuleDeclaration[];
  stateMachines: StateMachineDeclaration[];
  sagas: SagaDeclaration[];
  hookFlows: HookFlowDeclaration[];
}
