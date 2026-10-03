/**
 * The CEDM application model, as TypeScript.
 *
 * A model written in CEDM is an application whose entities are CEDM entities:
 * the entity shape is the one `schema/cedm-entity.schema.yaml` defines for the
 * domain library (`domain/entities/*.yaml`), so a library entity can be
 * imported by name or pasted into a model unchanged. What CEDM does not
 * describe — dashboards, hooks, executable rules, processes the backend runs,
 * reports it serves — is the application profile,
 * `specification/application-profile.yaml`, which this document carries in
 * CEDM's own vocabulary.
 *
 * `cedm-model.schema.json` beside this file is the normative definition; these
 * types are its shape. Every reader validates against the schema before code
 * typed with these interfaces sees a document.
 *
 * A CEDM model is lowered (`lower.ts`) into the model document every generator
 * already compiles (`language/yaml/document.ts`), so nothing downstream of the
 * lowering knows which language a model was written in.
 */

import type {
  CategoryDocument,
  EnumDocument,
  HookDocument,
  HookFlowDocument,
  ReportDocument,
  RuleDocument,
  SagaDocument,
  TriggerDocument,
} from "../yaml/document";

export const CEDM_MODEL_VERSION = "1.0";

/** CEDM's four cardinalities: how many targets one source record relates to. */
export type CedmCardinality = "0..1" | "1" | "0..*" | "1..*";

/**
 * Structured help, in the fields `specification/help-semantics.yaml` names
 * (`summary`, `businessMeaning`, `usage`, …). Values are prose. A plain string
 * is accepted wherever help is, for a model that has one sentence to say.
 */
export type CedmHelp = string | { [field: string]: CedmHelpValue };
export type CedmHelpValue = string | string[] | { [field: string]: CedmHelpValue };

export interface CedmIdentity {
  /** The identifying attribute(s). A composite key lists several. */
  key: string | string[] | null;
  type?: string;
  generated?: boolean;
  immutable?: boolean;
}

export interface CedmAttribute {
  /** camelCase, as CEDM writes it. */
  name: string;
  /** For a reference: other references of this entity that narrow its choices. */
  narrowedBy?: string[];
  /**
   * The physical column. Defaults to the snake_case of `name`, and to `id` for
   * the identity key; written only when it differs.
   */
  column?: string;
  /**
   * A CEDM vocabulary type (`uuid`, `string`, `decimal`, `money`, `enum`,
   * `reference`, `currency_code`, …) or any type token of the model language
   * (`text`, `email`, `string(255)`, …).
   */
  type: string;
  required?: boolean;
  unique?: boolean;
  immutable?: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
  minimum?: number | string;
  maximum?: number | string;
  default?: string | number | boolean | Record<string, unknown>;
  /** Inline value list: the column becomes a dropdown of these. */
  values?: string[];
  /** The name the inline value list is published under. Defaults to `<Entity><Attribute>`. */
  enumName?: string;
  /** A value list declared once in the model's `enums`, shared by several columns. */
  enum?: string;
  /** For `type: reference`: the entity the column points at. */
  target?: string;
  /** For `type: reference`: the stored key's type token. Defaults to `string`. */
  keyType?: string;
  help?: CedmHelp;
  description?: string;
  /** A note shown beside the column in the model viewer. */
  comment?: string;
  ui?: string;
  format?: string;
  systemManaged?: boolean;
}

export interface CedmRelationship {
  name: string;
  target: string;
  cardinality: CedmCardinality | string;
  /**
   * How many source records relate to one target. Defaults to `1` for a
   * to-many relationship. A to-one relationship that states none is read as
   * the many side of a one-to-many owned by the target.
   */
  inverseCardinality?: CedmCardinality;
  ownership?: "aggregate" | "reference";
  /** The relationship's name on the target, when both sides declare it. */
  inverse?: string;
  /** The relationship's label in the generated application. */
  label?: string;
  /**
   * The attribute holding a to-one relationship's key. Found by name when
   * omitted (`<name>Id`, or the one reference attribute to the target), and
   * created when none exists; `false` says the key is declared elsewhere.
   */
  foreignKey?: string | false;
  /**
   * Other relationships or reference attributes of this entity that narrow the
   * choices of this one, most specific first (a city: `[stateProvince, country]`).
   */
  narrowedBy?: string[];
  help?: CedmHelp;
  description?: string;
  condition?: string;
}

export interface CedmTransition {
  from: string;
  to: string;
  /** The command that makes the move: becomes the transition's trigger. */
  action?: string;
  guard?: string;
  authorization?: string | string[];
  sideEffects?: string | string[];
  auditEvent?: string;
}

export interface CedmLifecycle {
  name?: string;
  title?: string;
  /** The status attribute the lifecycle governs. */
  attribute?: string;
  states: string[];
  initial?: string;
  terminal?: string[];
  transitions?: CedmTransition[];
}

export interface CedmInvariant {
  id: string;
  rule: string;
  severity?: "error" | "warning" | "info";
  enforcement?: string | string[];
  message?: string;
  appliesWhen?: string;
  /**
   * The condition under which the invariant is broken, in the rules engine's
   * expression language over physical columns. An invariant with one compiles
   * to a validation rule; one without is documentation.
   */
  violatedWhen?: string;
  /** Events the compiled rule runs on. Defaults to beforeCreate and beforeUpdate. */
  events?: string[];
}

export interface CedmIndex {
  /** Attribute names (or physical columns). */
  columns: string[];
  unique?: boolean;
}

/** One step of an entity workflow: a saga step, with `fields` allowed as an object. */
export interface CedmWorkflowStep {
  id: string;
  type: string;
  label?: string;
  properties?: Record<string, string | Record<string, unknown>>;
}

/**
 * A workflow an entity starts: when `when` holds of a record written to it, the
 * steps run. It lowers to a saga plus a rule that triggers it.
 */
export interface CedmWorkflow {
  name: string;
  title?: string;
  description?: string;
  /** A condition over the record, in the rules engine's expression language. */
  when: string;
  /** The write event the rule is filed under. Defaults to `afterUpdate`. */
  event?: string;
  /** What the rule says when it fires. */
  message?: string;
  steps: CedmWorkflowStep[];
}

export interface CedmEntity {
  name: string;
  namespace?: string;
  kind?: string;
  description?: string;
  extends?: string;
  tags?: string[];
  identity?: CedmIdentity;
  attributes?: CedmAttribute[];
  relationships?: CedmRelationship[];
  lifecycle?: CedmLifecycle | CedmLifecycle[];
  invariants?: CedmInvariant[];
  /**
   * Rows the entity ships with, keyed by attribute (or relationship) name; a
   * reference holds the natural key of the row it points at. A library entity
   * names a file under `domain/` in `referenceData`, and the library inlines it
   * here when it hands the entity out.
   */
  data?: { key: string; rows: Array<Record<string, string | number | boolean | null>> };
  referenceData?: string;
  /** Workflows the entity starts when a record meets a condition. */
  workflows?: CedmWorkflow[];
  audit?: Record<string, unknown>;
  help?: CedmHelp;
  /** Application profile: how the entity is presented. */
  ui?: { icon?: string; label?: string };
  /** Application profile: how the entity is stored. */
  persistence?: {
    prefix?: "bus" | "sys";
    softDelete?: boolean;
    audited?: boolean;
    indexes?: CedmIndex[];
  };
  /**
   * The aggregate root this entity is a member of. Usually implied by the
   * root's `ownership: aggregate` relationship; stated where it is not.
   */
  aggregateRoot?: string;
}

/** A library entity, or a reusable application module, brought into the model. */
export type CedmImport =
  | {
      entity: string;
      /** Keep only these attributes and relationships (by name). */
      include?: string[];
      /** Drop these attributes and relationships (by name). */
      exclude?: string[];
    }
  | { module: string };

export interface CedmPermission {
  /** The entity the permission is about. */
  resource: string;
  /** A CRUD operation, a lifecycle action, or `*`. */
  action: string;
  /** The roles granted it. */
  subject: string | string[];
  /** Only `allow` compiles; the generated application's rules are additive. */
  effect?: "allow" | "deny";
  scope?: string;
}

export interface CedmApplication {
  name?: string;
  version?: string;
  description?: string;
  namespace?: string;
  /** The catalog domain (`domains/catalog.yaml`) the application serves. */
  domain?: string;
  /**
   * Give every enumeration a business table (`specification/enumeration-semantics.yaml`).
   * Off by default, so a model that predates it lowers exactly as it did.
   */
  enumerationTables?: boolean;
}

export interface CedmModelDocument {
  cedm: typeof CEDM_MODEL_VERSION;
  application?: CedmApplication;
  imports?: CedmImport[];
  enums?: EnumDocument[];
  entities?: CedmEntity[];
  ui?: { categories?: CategoryDocument[] };
  authorization?: { permissions?: CedmPermission[] };
  hooks?: HookDocument[];
  hookFlows?: HookFlowDocument[];
  triggers?: TriggerDocument[];
  reports?: ReportDocument[];
  rules?: RuleDocument[];
  processes?: SagaDocument[];
}

/** Keys in the order a canonical CEDM model writes them. */
export const CEDM_DOCUMENT_KEY_ORDER: readonly (keyof CedmModelDocument)[] = [
  "cedm",
  "application",
  "imports",
  "enums",
  "entities",
  "ui",
  "authorization",
  "hooks",
  "hookFlows",
  "triggers",
  "reports",
  "rules",
  "processes",
];
