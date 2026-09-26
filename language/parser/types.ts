/**
 * CEDL Type Definitions
 * Complete type system for CEDM Enterprise Definition Language
 */

export interface CEDLModel {
  version: string;
  metadata: Metadata;
  domain: Domain;
  relationships?: Relationship[];
  rules?: Rule[];
  workflows?: Workflow[];
  rbac?: RBAC;
  hooks?: Hook[];
  reports?: Report[];
  system?: SystemConfig;
  diagnostics: Diagnostic[];
}

export interface Metadata {
  name: string;
  description?: string;
  version?: string;
  timestamp?: string;
  author?: string;
  tags?: string[];
}

export interface Domain {
  categories?: Category[];
  entities: Entity[];
  enums?: Enum[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  help?: string;
  order?: number;
}

export interface Entity {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  help?: string;
  isAuditEnabled?: boolean;
  parent?: string;
  tags?: string[];
  attributes: Attribute[];
}

export interface Attribute {
  id: string;
  name: string;
  type: AttributeType;
  description?: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isIdentifier?: boolean;
  isEncrypted?: boolean;
  isReadonly?: boolean;
  isIndexed?: boolean;
  isForeignKey?: boolean;
  defaultValue?: unknown;
  length?: number;
  precision?: number;
  scale?: number;
  enumRef?: string;
  referenceEntity?: string;
  help?: string;
  order?: number;
}

export type AttributeType =
  | 'uuid'
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'array'
  | 'enum'
  | 'reference';

export interface Enum {
  id: string;
  name: string;
  description?: string;
  values: EnumValue[];
}

export interface EnumValue {
  value: string;
  label?: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
}

export interface Relationship {
  id?: string;
  source: string;
  target: string;
  cardinality: Cardinality;
  foreignKey?: string;
  isRequired?: boolean;
  description?: string;
  help?: string;
}

export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  entity?: string;
  trigger: RuleTrigger;
  conditions: Condition[];
  actions: Action[];
}

export type RuleTrigger = 'on-create' | 'on-update' | 'on-delete' | 'scheduled' | 'webhook';

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  caseSensitive?: boolean;
}

export type ConditionOperator =
  | 'equals'
  | 'not-equals'
  | 'less-than'
  | 'greater-than'
  | 'less-than-equals'
  | 'greater-than-equals'
  | 'in'
  | 'not-in'
  | 'contains'
  | 'not-contains'
  | 'regex'
  | 'starts-with'
  | 'ends-with'
  | 'between';

export interface Action {
  type: ActionType;
  target?: string;
  parameters?: Record<string, unknown>;
  order?: number;
}

export type ActionType =
  | 'notify'
  | 'transform'
  | 'transition'
  | 'webhook'
  | 'trigger-workflow'
  | 'create-record'
  | 'email';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  entity: string;
  isActive?: boolean;
  startEvent: string;
  endEvents?: string[];
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface WorkflowState {
  id: string;
  name: string;
  type?: 'normal' | 'initial' | 'final';
  help?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  name?: string;
  condition?: string;
  order?: number;
}

export interface RBAC {
  roles?: Role[];
  permissions?: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isMasterRole?: boolean;
}

export interface Permission {
  role: string;
  entity?: string;
  operations: Operation[];
  isExclude?: boolean;
  conditions?: Record<string, unknown>;
}

export type Operation = 'read' | 'create' | 'update' | 'delete';

export interface Hook {
  entity: string;
  event: HookEvent;
  name?: string;
  description?: string;
  handler: string;
  phase?: 'validation' | 'transform' | 'business_logic' | 'integration';
  async?: boolean;
}

export type HookEvent =
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete'
  | 'customValidate';

export interface Report {
  id: string;
  name: string;
  description?: string;
  entity: string;
  query: string;
  maxRows?: number;
  cacheTTL?: number;
}

export interface SystemConfig {
  database?: {
    type?: 'postgresql';
    migrations?: {
      auto?: boolean;
    };
  };
  api?: {
    documentation?: {
      enabled?: boolean;
      tools?: ('redoc' | 'scalar')[];
    };
  };
  features?: {
    auditLog?: boolean;
    encryption?: boolean;
    softDelete?: boolean;
  };
}

/**
 * Diagnostic System
 * Structured diagnostic information for validation and error reporting
 */

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  location: Location;
  relatedInfo?: RelatedInformation[];
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Location {
  path: string[];
  line: number;
  column: number;
  source?: string;
}

export interface RelatedInformation {
  location: Location;
  message: string;
}

/**
 * Parser Result
 */

export interface ParseResult {
  model?: CEDLModel;
  diagnostics: Diagnostic[];
  success: boolean;
  parseTime?: number;
}

/**
 * Parser Configuration
 */

export interface ParserOptions {
  strict?: boolean;
  checkSemantics?: boolean;
  checkPerformance?: boolean;
  maxEntityCount?: number;
  maxAttributeCount?: number;
}

/**
 * Validation Context
 */

export interface ValidationContext {
  model: CEDLModel;
  entityMap: Map<string, Entity>;
  enumMap: Map<string, Enum>;
  roleMap: Map<string, Role>;
  relationshipMap: Map<string, Relationship>;
  diagnostics: Diagnostic[];
}
