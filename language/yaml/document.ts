/**
 * The model document, as TypeScript.
 *
 * `eml.schema.json` beside this file is the normative definition of the
 * language; these types are its shape. Every reader validates a document
 * against the schema itself before code typed with these interfaces sees it.
 *
 * They live in `language/` rather than in the generator because everything that
 * reads a model — the checker, the `eml` CLI, the browser bundle, the generator
 * and the modelling tool — reads this document, and `language/` is the one
 * place all of them can import from.
 */

export const EML_YAML_VERSION = "1.0";

/** How many records may stand at one end of a relationship. */
export type RelationshipEnd = "exactly-one" | "zero-or-one" | "zero-or-more" | "one-or-more";

/**
 * What a node of a rule's decision graph does: `start` receives the record,
 * `decision` branches on it, `expression` sets or computes a value, `function`
 * runs a reusable computation, `end` is the rule's outcome.
 */
export type RuleNodeType = "start" | "end" | "decision" | "expression" | "function";

/** Which way a graph is laid out when drawn. Layout only; nothing compiles it. */
export type FlowDirection = "down" | "up" | "right" | "left";

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

export interface AttributeDocument {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  /**
   * The entity a foreign key points at, where its name does not say: a CEDM
   * reference such as `deliveryLocation → Location` (`delivery_location_id`
   * would otherwise resolve to a `DeliveryLocation` nothing declares).
   */
  references?: string;
  unique?: boolean;
  optional?: boolean;
  comment?: string;
  enum?: string;
  help?: string;
  /** Validated and carried; no application generator compiles these yet. */
  ui?: string;
  default?: string;
  min?: number | string;
  max?: number | string;
  format?: string;
}

export interface IndexDocument {
  columns: string[];
  unique?: boolean;
}

export interface EntityDocument {
  name: string;
  help?: string;
  icon?: string;
  parent?: string;
  /** Validated and carried; no application generator compiles these yet. */
  label?: string;
  prefix?: "bus" | "sys";
  softDelete?: boolean;
  audited?: boolean;
  attributes: AttributeDocument[];
  indexes?: IndexDocument[];
}

export interface RelationshipDocument {
  from: string;
  fromCardinality: RelationshipEnd;
  to: string;
  toCardinality: RelationshipEnd;
  label?: string;
}

export interface EnumDocument {
  name: string;
  values: string[];
}

export interface CategoryDocument {
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  seq?: number;
  default?: boolean;
  entities?: string[];
}

export interface HookDocument {
  entity: string;
  event: string;
  handler: string;
  /** Columns the hook is scoped to, in order. */
  fields?: string[];
}

export interface RbacDocument {
  entity: string;
  action: string;
  roles: string[];
}

export interface ReportDocument {
  name: string;
  title?: string;
  entity?: string;
  chart?: string;
  x?: string;
  y?: string;
  help?: string;
  sql: string;
}

export interface RuleDocument {
  name: string;
  title?: string;
  entity: string;
  event: string;
  priority?: number;
  direction?: FlowDirection;
  nodes: Array<{ id: string; label: string; type: RuleNodeType }>;
  edges: Array<{ from: string; to: string; label?: string }>;
  actions?: Array<{ name: string; type: string; when?: string; props?: Record<string, string> }>;
  decisionTable?: DecisionTable;
}

export interface StateMachineDocument {
  name: string;
  title?: string;
  entity: string;
  states: string[];
  initial?: string;
  final?: string[];
  transitions: Array<{ from: string; to: string; trigger?: string }>;
}

export interface SagaStepDocument {
  id: string;
  type: string;
  label?: string;
  properties?: Record<string, string>;
}

export interface SagaDocument {
  name: string;
  title?: string;
  entity: string;
  operation?: string;
  trigger?: string;
  description?: string;
  steps: SagaStepDocument[];
}

/** An external event or schedule that calls a handler on an entity. */
export interface TriggerDocument {
  entity: string;
  source: string;
  handler: string;
}

/**
 * One step of a hook flow: a hook the entity declares, named by `event` and
 * `handler`, or a step shown for context — the request, the write, the
 * response — named by `label`.
 */
export interface HookFlowNodeDocument {
  id: string;
  label?: string;
  event?: string;
  handler?: string;
}

/** The order an entity's hooks run in around a write, drawn as a graph. */
export interface HookFlowDocument {
  name: string;
  title?: string;
  entity: string;
  direction?: FlowDirection;
  nodes: HookFlowNodeDocument[];
  edges: Array<{ from: string; to: string; label?: string }>;
}

export interface ModelDocument {
  eml: typeof EML_YAML_VERSION;
  name?: string;
  version?: string;
  description?: string;
  enums?: EnumDocument[];
  categories?: CategoryDocument[];
  entities: EntityDocument[];
  relationships?: RelationshipDocument[];
  hooks?: HookDocument[];
  hookFlows?: HookFlowDocument[];
  rbac?: RbacDocument[];
  triggers?: TriggerDocument[];
  reports?: ReportDocument[];
  rules?: RuleDocument[];
  stateMachines?: StateMachineDocument[];
  sagas?: SagaDocument[];
}

/** A path into the document: keys and array indexes. */
export type DocumentPath = Array<string | number>;

/**
 * Keys in the order a canonical document writes them. The serializer follows
 * it, so a document saved twice is byte-identical and a diff between two saves
 * shows only what changed.
 */
export const DOCUMENT_KEY_ORDER: readonly (keyof ModelDocument)[] = [
  "eml",
  "name",
  "version",
  "description",
  "enums",
  "categories",
  "entities",
  "relationships",
  "hooks",
  "hookFlows",
  "rbac",
  "triggers",
  "reports",
  "rules",
  "stateMachines",
  "sagas",
];
