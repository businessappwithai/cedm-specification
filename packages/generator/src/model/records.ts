/**
 * Model records — what a model *says*, before anything is compiled from it.
 *
 * A model can be written in two syntaxes: EML, where every construct rides on a
 * Mermaid diagram or a `%%` directive, and the YAML model language, where every
 * construct is a key. Both are read into these records, and only these records
 * are compiled. That is the whole equivalence argument: a construct has one
 * compiler, so the two syntaxes cannot come to mean different things.
 *
 * The records keep what the author wrote, not what it will be compiled into.
 * An attribute's type is the token as written (`string(255)`, `email`), a
 * relationship keeps both ends' cardinality rather than the four-way kind the
 * compiler folds them into, and a saga step keeps the properties the author
 * gave it. Anything the compilers derive — table names, reference ids, primary
 * keys, default categories — is derived by the compilers, once.
 */

/* -------------------------------------------------------------------------- */
/*  Entity-relationship model                                                  */
/* -------------------------------------------------------------------------- */

/** One column declaration inside an entity block: `type name MODIFIER…`. */
export interface AttributeDeclaration {
  /** The type token as written, length suffix included: `string(255)`, `email`. */
  type: string;
  name: string;
  /** Whitespace-separated tokens after the name, as written. */
  modifiers: string[];
}

export interface EntityDeclaration {
  name: string;
  attributes: AttributeDeclaration[];
}

/** One end of a relationship line, as Mermaid draws it. */
export type RelationshipEnd = "exactly-one" | "zero-or-one" | "zero-or-more" | "one-or-more";

export interface RelationshipDeclaration {
  source: string;
  target: string;
  /** Cardinality at the source end (the left glyph pair). */
  sourceEnd: RelationshipEnd;
  /** Cardinality at the target end (the right glyph pair). */
  targetEnd: RelationshipEnd;
  /** The label after the colon, quotes removed, as written. */
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
 * Everything the ERD layer of a model declares.
 *
 * Entity-level annotations are lists in declaration order, not maps: the
 * compiler resolves repeats the way the EML reader always has (the last
 * `%%entity … help:` wins, but the entity keeps the position of the first), and
 * that rule belongs to the compiler rather than to whichever syntax happened to
 * be read.
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
  entityParents: Array<{ entity: string; parent: string }>;
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

/** One `%%category` declaration. Declarations sharing a code are merged. */
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
 * One `%%rbac` declaration: these roles may perform `target` on `entity`.
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

/** One `%%hook` declaration. `event` is checked against the hook vocabulary by the compiler. */
export interface HookDeclaration {
  event: string;
  handler: string;
  entity: string;
  field?: string;
}

/** One `%%report` declaration, before the read-only and chart checks. */
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

export type RuleNodeShape = "stadium" | "diamond" | "rect" | "circle" | "round";

export interface RuleNode {
  id: string;
  label: string;
  shape: RuleNodeShape;
}

export interface RuleEdge {
  source: string;
  target: string;
  label?: string;
}

export interface RuleAction {
  name: string;
  type: string;
  /** The condition, in the rule engine's expression language. */
  when: string;
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
 * editor-authored decision table, a list of actions, or the decision flowchart
 * itself. All three are kept because the flowchart is also what the rule looks
 * like, and dropping it on read would lose the drawing the author made.
 */
export interface RuleDeclaration {
  name: string;
  title?: string;
  entity: string;
  event: string;
  priority?: number;
  /** Flowchart direction for the diagram view (`TD`, `LR`, …). */
  direction?: string;
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
 * A `kind: state` workflow: the moves a record's status may make.
 *
 * `states` is listed rather than inferred so its order is the author's; the EML
 * reader fills it in order of first appearance, which is the order the diagram
 * has always compiled to.
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

/** A `kind: saga` workflow: an ordered process of steps run on a write. */
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

/** A `kind: hook` workflow — a drawing of a hook's logic. Carried, not compiled. */
export interface HookDiagramDeclaration {
  name: string;
  title?: string;
  entity: string;
  /** The diagram body, starting at its `flowchart` line. */
  diagram: string;
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
  hooks: HookDeclaration[];
  reports: ReportDeclaration[];
  rules: RuleDeclaration[];
  stateMachines: StateMachineDeclaration[];
  sagas: SagaDeclaration[];
  hookDiagrams: HookDiagramDeclaration[];
}

/** Mermaid's glyph pair for each end, keyed by which side of `--` it sits on. */
export const RELATIONSHIP_GLYPHS: Record<RelationshipEnd, { left: string; right: string }> = {
  "exactly-one": { left: "||", right: "||" },
  "zero-or-one": { left: "|o", right: "o|" },
  "zero-or-more": { left: "}o", right: "o{" },
  "one-or-more": { left: "}|", right: "|{" },
};

export const RELATIONSHIP_ENDS = Object.keys(RELATIONSHIP_GLYPHS) as RelationshipEnd[];

/** The end a left-hand glyph pair denotes, or undefined for anything else. */
export function endFromLeftGlyph(glyph: string): RelationshipEnd | undefined {
  return RELATIONSHIP_ENDS.find((end) => RELATIONSHIP_GLYPHS[end].left === glyph);
}

/** The end a right-hand glyph pair denotes, or undefined for anything else. */
export function endFromRightGlyph(glyph: string): RelationshipEnd | undefined {
  return RELATIONSHIP_ENDS.find((end) => RELATIONSHIP_GLYPHS[end].right === glyph);
}

/** The Mermaid operator for a relationship, e.g. `||--o{`. */
export function relationshipOperator(declaration: RelationshipDeclaration): string {
  return `${RELATIONSHIP_GLYPHS[declaration.sourceEnd].left}--${
    RELATIONSHIP_GLYPHS[declaration.targetEnd].right
  }`;
}
