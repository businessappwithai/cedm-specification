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

export type RuleNodeShape = "stadium" | "diamond" | "rect" | "circle" | "round";

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
  direction?: string;
  nodes: Array<{ id: string; label: string; shape: RuleNodeShape }>;
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

export interface HookDiagramDocument {
  name: string;
  title?: string;
  entity: string;
  diagram: string;
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
  rbac?: RbacDocument[];
  triggers?: TriggerDocument[];
  reports?: ReportDocument[];
  rules?: RuleDocument[];
  stateMachines?: StateMachineDocument[];
  sagas?: SagaDocument[];
  hookDiagrams?: HookDiagramDocument[];
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
  "rbac",
  "triggers",
  "reports",
  "rules",
  "stateMachines",
  "sagas",
  "hookDiagrams",
];
