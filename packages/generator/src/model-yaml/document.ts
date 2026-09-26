/**
 * The YAML model document, as TypeScript.
 *
 * `language/yaml/eml.schema.json` is the normative definition; these types are
 * its shape. The validator checks a document against the schema itself, so a
 * document that reaches code typed with these interfaces has already been held
 * to it.
 */

import type { DecisionTable, RelationshipEnd, RuleNodeShape } from "../model/records";

export const EML_YAML_VERSION = "1.0";

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
  field?: string;
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

export interface SagaDocument {
  name: string;
  title?: string;
  entity: string;
  operation?: string;
  trigger?: string;
  description?: string;
  steps: Array<{
    id: string;
    type: string;
    label?: string;
    properties?: Record<string, string>;
  }>;
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
  reports?: ReportDocument[];
  rules?: RuleDocument[];
  stateMachines?: StateMachineDocument[];
  sagas?: SagaDocument[];
  hookDiagrams?: HookDiagramDocument[];
}

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
  "reports",
  "rules",
  "stateMachines",
  "sagas",
  "hookDiagrams",
];
