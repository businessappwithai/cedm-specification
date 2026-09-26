/**
 * Between the YAML model document and model records.
 *
 * The document nests what EML scatters: an entity carries its own help, icon,
 * parent, indexes and each attribute its enum binding and help, where EML says
 * each of those with a separate `%%` line naming what it annotates. Records keep
 * EML's flat shape because that is the shape the compilers resolve.
 *
 * `documentToRecords` is total: every document the schema accepts has one
 * reading. `recordsToDocument` is not, because EML can say things a nested
 * document has no place for — a help line naming a column that does not exist,
 * a second enum binding for the same column. Those compile to nothing or to a
 * resolution the document states outright, and each one is reported rather
 * than dropped silently.
 */

import type {
  AttributeDeclaration,
  CategoryDeclaration,
  EnumDeclaration,
  ErdRecords,
  FieldEnumBinding,
  FieldHelp,
  HookDeclaration,
  IndexDeclaration,
  ModelRecords,
  RbacDeclaration,
  ReportDeclaration,
  RuleDeclaration,
  SagaDeclaration,
  StateMachineDeclaration,
} from "../model/records";
import {
  type AttributeDocument,
  type CategoryDocument,
  EML_YAML_VERSION,
  type EntityDocument,
  type ModelDocument,
  type ReportDocument,
  type RuleDocument,
  type SagaDocument,
  type StateMachineDocument,
} from "./document";

/* -------------------------------------------------------------------------- */
/*  Document → records                                                         */
/* -------------------------------------------------------------------------- */

function modifiersOf(attribute: AttributeDocument): string[] {
  const modifiers: string[] = [];
  if (attribute.pk) modifiers.push("PK");
  if (attribute.fk) modifiers.push("FK");
  if (attribute.unique) modifiers.push("UK");
  if (attribute.optional) modifiers.push("OPTIONAL");
  return modifiers;
}

function erdOf(document: ModelDocument): ErdRecords {
  const erd: ErdRecords = {
    entities: [],
    relationships: [],
    indexes: [],
    enums: (document.enums ?? []).map((declared) => ({
      name: declared.name,
      values: [...declared.values],
    })),
    enumBindings: [],
    fieldHelp: [],
    entityHelp: [],
    entityIcons: [],
    entityParents: [],
  };

  for (const entity of document.entities) {
    erd.entities.push({
      name: entity.name,
      attributes: entity.attributes.map(
        (attribute): AttributeDeclaration => ({
          type: attribute.type,
          name: attribute.name,
          modifiers: modifiersOf(attribute),
        })
      ),
    });
    if (entity.help !== undefined) erd.entityHelp.push({ entity: entity.name, help: entity.help });
    if (entity.icon !== undefined) erd.entityIcons.push({ entity: entity.name, icon: entity.icon });
    if (entity.parent !== undefined) {
      erd.entityParents.push({ entity: entity.name, parent: entity.parent });
    }
    for (const attribute of entity.attributes) {
      if (attribute.enum !== undefined) {
        erd.enumBindings.push({
          entity: entity.name,
          column: attribute.name,
          enumName: attribute.enum,
        });
      }
      if (attribute.help !== undefined) {
        erd.fieldHelp.push({ entity: entity.name, column: attribute.name, help: attribute.help });
      }
    }
    for (const index of entity.indexes ?? []) {
      erd.indexes.push({
        entity: entity.name,
        columns: [...index.columns],
        unique: index.unique === true,
      });
    }
  }

  erd.relationships = (document.relationships ?? []).map((relationship) => ({
    source: relationship.from,
    target: relationship.to,
    sourceEnd: relationship.fromCardinality,
    targetEnd: relationship.toCardinality,
    ...(relationship.label !== undefined ? { label: relationship.label } : {}),
  }));

  return erd;
}

function categoryOf(category: CategoryDocument): CategoryDeclaration {
  return {
    name: category.name,
    ...(category.code !== undefined ? { code: category.code } : {}),
    ...(category.description !== undefined ? { description: category.description } : {}),
    ...(category.icon !== undefined ? { icon: category.icon } : {}),
    ...(category.color !== undefined ? { color: category.color } : {}),
    ...(category.seq !== undefined ? { seq: category.seq } : {}),
    isDefault: category.default === true,
    entities: [...(category.entities ?? [])],
  };
}

function ruleOf(rule: RuleDocument): RuleDeclaration {
  return {
    name: rule.name,
    ...(rule.title !== undefined ? { title: rule.title } : {}),
    entity: rule.entity,
    event: rule.event,
    ...(rule.priority !== undefined ? { priority: rule.priority } : {}),
    ...(rule.direction !== undefined ? { direction: rule.direction } : {}),
    nodes: rule.nodes.map((node) => ({ ...node })),
    edges: rule.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      ...(edge.label !== undefined ? { label: edge.label } : {}),
    })),
    actions: (rule.actions ?? []).map((action) => ({
      name: action.name,
      type: action.type,
      ...(action.when !== undefined ? { when: action.when } : {}),
      props: { ...(action.props ?? {}) },
    })),
    ...(rule.decisionTable !== undefined ? { decisionTable: rule.decisionTable } : {}),
  };
}

function stateMachineOf(machine: StateMachineDocument): StateMachineDeclaration {
  return {
    name: machine.name,
    ...(machine.title !== undefined ? { title: machine.title } : {}),
    entity: machine.entity,
    states: [...machine.states],
    ...(machine.initial !== undefined ? { initial: machine.initial } : {}),
    final: [...(machine.final ?? [])],
    transitions: machine.transitions.map((transition) => ({ ...transition })),
  };
}

function sagaOf(saga: SagaDocument): SagaDeclaration {
  return {
    name: saga.name,
    ...(saga.title !== undefined ? { title: saga.title } : {}),
    entity: saga.entity,
    ...(saga.operation !== undefined ? { operation: saga.operation } : {}),
    ...(saga.trigger !== undefined ? { trigger: saga.trigger } : {}),
    ...(saga.description !== undefined ? { description: saga.description } : {}),
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...(step.label !== undefined ? { label: step.label } : {}),
      properties: { ...(step.properties ?? {}) },
    })),
  };
}

/** Read a validated YAML model document into records. */
export function documentToRecords(document: ModelDocument): ModelRecords {
  return {
    ...(document.name !== undefined ? { name: document.name } : {}),
    ...(document.version !== undefined ? { version: document.version } : {}),
    ...(document.description !== undefined ? { description: document.description } : {}),
    erd: erdOf(document),
    categories: (document.categories ?? []).map(categoryOf),
    rbac: (document.rbac ?? []).map(
      (rule): RbacDeclaration => ({
        roles: [...rule.roles],
        entity: rule.entity,
        target: rule.action,
      })
    ),
    hooks: (document.hooks ?? []).map(
      (hook): HookDeclaration => ({
        event: hook.event,
        handler: hook.handler,
        entity: hook.entity,
        ...(hook.field !== undefined ? { field: hook.field } : {}),
      })
    ),
    reports: (document.reports ?? []).map((report): ReportDeclaration => ({ ...report })),
    rules: (document.rules ?? []).map(ruleOf),
    stateMachines: (document.stateMachines ?? []).map(stateMachineOf),
    sagas: (document.sagas ?? []).map(sagaOf),
    hookDiagrams: (document.hookDiagrams ?? []).map((diagram) => ({ ...diagram })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Records → document                                                         */
/* -------------------------------------------------------------------------- */

/** Something EML declared that the document states differently or not at all. */
export interface ConversionIssue {
  /** What the issue concerns, e.g. `%%field Order.status enum`. */
  construct: string;
  message: string;
  /**
   * `dropped`: the declaration compiled to nothing, so leaving it out changes
   * nothing generated. `resolved`: EML said it more than once and the document
   * keeps the declaration that took effect.
   */
  kind: "dropped" | "resolved";
}

const FLAG_MODIFIERS = new Set(["PK", "FK", "UK", "UNIQUE", "OPTIONAL", "NULL"]);

/**
 * An attribute declaration as a document attribute.
 *
 * Flags are read the way the compiler reads them — from every token after the
 * name — so a declaration keeps its meaning exactly; the quoted Mermaid comment
 * is kept for the diagram. Any other token is compiled by nothing and reported.
 */
function attributeOf(
  entity: string,
  declaration: AttributeDeclaration,
  issues: ConversionIssue[]
): AttributeDocument {
  const upper = declaration.modifiers.map((token) => token.toUpperCase());
  const attribute: AttributeDocument = { name: declaration.name, type: declaration.type };
  if (upper.includes("PK")) attribute.pk = true;
  if (upper.includes("FK")) attribute.fk = true;
  if (upper.includes("UK") || upper.includes("UNIQUE")) attribute.unique = true;
  if (upper.includes("OPTIONAL") || upper.includes("NULL")) attribute.optional = true;

  const rest = declaration.modifiers.join(" ");
  const quoted = rest.match(/"([^"]*)"/);
  const comment = quoted?.[1]?.trim();
  if (comment) attribute.comment = comment;

  const outside = quoted ? rest.replace(quoted[0], " ") : rest;
  for (const token of outside.split(/\s+/).filter(Boolean)) {
    if (FLAG_MODIFIERS.has(token.toUpperCase())) continue;
    issues.push({
      construct: `${entity}.${declaration.name}`,
      message: `modifier "${token}" is not part of the language and compiles to nothing`,
      kind: "dropped",
    });
  }
  return attribute;
}

function ruleDocumentOf(rule: RuleDeclaration): RuleDocument {
  return {
    name: rule.name,
    ...(rule.title !== undefined && rule.title !== rule.name ? { title: rule.title } : {}),
    entity: rule.entity,
    event: rule.event,
    ...(rule.priority !== undefined ? { priority: rule.priority } : {}),
    ...(rule.direction !== undefined && rule.direction !== "TD"
      ? { direction: rule.direction }
      : {}),
    nodes: rule.nodes.map(({ id, label, shape }) => ({ id, label, shape })),
    edges: rule.edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      ...(edge.label !== undefined ? { label: edge.label } : {}),
    })),
    ...(rule.actions.length
      ? {
          actions: rule.actions.map((action) => ({
            name: action.name,
            type: action.type,
            ...(action.when !== undefined ? { when: action.when } : {}),
            ...(Object.keys(action.props).length ? { props: { ...action.props } } : {}),
          })),
        }
      : {}),
    ...(rule.decisionTable !== undefined ? { decisionTable: rule.decisionTable } : {}),
  };
}

function stateMachineDocumentOf(machine: StateMachineDeclaration): StateMachineDocument {
  return {
    name: machine.name,
    ...(machine.title !== undefined && machine.title !== machine.name
      ? { title: machine.title }
      : {}),
    entity: machine.entity,
    states: [...machine.states],
    ...(machine.initial !== undefined ? { initial: machine.initial } : {}),
    ...(machine.final.length ? { final: [...machine.final] } : {}),
    transitions: machine.transitions.map(({ from, to, trigger }) => ({
      from,
      to,
      ...(trigger !== undefined ? { trigger } : {}),
    })),
  };
}

function sagaDocumentOf(saga: SagaDeclaration): SagaDocument {
  const operation = saga.operation?.toUpperCase();
  return {
    name: saga.name,
    ...(saga.title !== undefined && saga.title !== saga.name ? { title: saga.title } : {}),
    entity: saga.entity,
    ...(operation !== undefined && operation !== "ALL" ? { operation } : {}),
    ...(saga.trigger !== undefined && saga.trigger !== "rule" ? { trigger: saga.trigger } : {}),
    ...(saga.description !== undefined ? { description: saga.description } : {}),
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...(step.label !== undefined && step.label !== step.id ? { label: step.label } : {}),
      ...(Object.keys(step.properties).length ? { properties: { ...step.properties } } : {}),
    })),
  };
}

function reportDocumentOf(report: ReportDeclaration): ReportDocument {
  return {
    name: report.name,
    ...(report.title !== undefined ? { title: report.title } : {}),
    ...(report.entity !== undefined ? { entity: report.entity } : {}),
    ...(report.chart !== undefined ? { chart: report.chart } : {}),
    ...(report.x !== undefined ? { x: report.x } : {}),
    ...(report.y !== undefined ? { y: report.y } : {}),
    ...(report.help !== undefined ? { help: report.help } : {}),
    sql: report.sql,
  };
}

/**
 * Nest what the ERD declares into document entities.
 *
 * An annotation attaches to the *first* entity of its name and the first
 * attribute of its column, which is where the compiler attaches it. Repeats
 * resolve as the compiler resolves them — the last help, icon and parent win —
 * and an annotation naming something undeclared is dropped and reported.
 */
function entitiesOf(erd: ErdRecords, issues: ConversionIssue[]): EntityDocument[] {
  const entities: EntityDocument[] = erd.entities.map((declaration) => ({
    name: declaration.name,
    attributes: declaration.attributes.map((attribute) =>
      attributeOf(declaration.name, attribute, issues)
    ),
  }));

  const entity = (name: string) => entities.find((candidate) => candidate.name === name);
  const attribute = (entityName: string, column: string) =>
    entity(entityName)?.attributes.find((candidate) => candidate.name === column);

  const drop = (construct: string, message: string) =>
    issues.push({ construct, message, kind: "dropped" });
  const resolve = (construct: string, message: string) =>
    issues.push({ construct, message, kind: "resolved" });

  const annotate = <K extends "help" | "icon" | "parent">(
    key: K,
    list: Array<{ entity: string } & Record<K, string>>
  ) => {
    for (const item of list) {
      const target = entity(item.entity);
      const construct = `%%entity ${item.entity} ${key}`;
      if (!target) {
        drop(construct, `names an entity the model does not declare`);
        continue;
      }
      if (target[key] !== undefined && target[key] !== item[key]) {
        resolve(construct, `declared more than once; the last declaration takes effect`);
      }
      target[key] = item[key];
    }
  };
  annotate("help", erd.entityHelp);
  annotate("icon", erd.entityIcons);
  annotate("parent", erd.entityParents);

  for (const help of erd.fieldHelp as FieldHelp[]) {
    const target = attribute(help.entity, help.column);
    const construct = `%%field ${help.entity}.${help.column} help`;
    if (!target) {
      drop(construct, `names a column the model does not declare`);
      continue;
    }
    if (target.help !== undefined && target.help !== help.help) {
      resolve(construct, `declared more than once; the last declaration takes effect`);
    }
    target.help = help.help;
  }

  for (const binding of erd.enumBindings as FieldEnumBinding[]) {
    const target = attribute(binding.entity, binding.column);
    const construct = `%%field ${binding.entity}.${binding.column} enum`;
    if (!target) {
      drop(construct, `names a column the model does not declare`);
      continue;
    }
    if (target.enum !== undefined && target.enum !== binding.enumName) {
      resolve(
        construct,
        `binds the column to both ${target.enum} and ${binding.enumName}; the last binding takes effect, ` +
          `but EML still allocated a reference id to ${target.enum}`
      );
    }
    target.enum = binding.enumName;
  }

  for (const index of erd.indexes as IndexDeclaration[]) {
    const target = entity(index.entity);
    if (!target) {
      drop(`%%index ${index.entity}(${index.columns.join(", ")})`, "names an unknown entity");
      continue;
    }
    target.indexes = target.indexes ?? [];
    target.indexes.push({
      columns: [...index.columns],
      ...(index.unique ? { unique: true } : {}),
    });
  }

  return entities.map((document) => ({
    name: document.name,
    ...(document.help !== undefined ? { help: document.help } : {}),
    ...(document.icon !== undefined ? { icon: document.icon } : {}),
    ...(document.parent !== undefined ? { parent: document.parent } : {}),
    attributes: document.attributes.map(orderedAttribute),
    ...(document.indexes?.length ? { indexes: document.indexes } : {}),
  }));
}

/** An attribute with its keys in canonical order. */
function orderedAttribute(attribute: AttributeDocument): AttributeDocument {
  return {
    name: attribute.name,
    type: attribute.type,
    ...(attribute.pk ? { pk: true } : {}),
    ...(attribute.fk ? { fk: true } : {}),
    ...(attribute.unique ? { unique: true } : {}),
    ...(attribute.optional ? { optional: true } : {}),
    ...(attribute.enum !== undefined ? { enum: attribute.enum } : {}),
    ...(attribute.help !== undefined ? { help: attribute.help } : {}),
    ...(attribute.comment !== undefined ? { comment: attribute.comment } : {}),
  };
}

function enumsOf(enums: EnumDeclaration[], issues: ConversionIssue[]) {
  const seen = new Set<string>();
  const kept: EnumDeclaration[] = [];
  for (const declared of enums) {
    if (seen.has(declared.name)) {
      issues.push({
        construct: `%%enum ${declared.name}`,
        message: "declared more than once; the first declaration takes effect",
        kind: "resolved",
      });
      continue;
    }
    seen.add(declared.name);
    kept.push({ name: declared.name, values: [...declared.values] });
  }
  return kept;
}

function categoryDocumentOf(category: CategoryDeclaration): CategoryDocument {
  return {
    name: category.name,
    ...(category.code !== undefined ? { code: category.code } : {}),
    ...(category.description !== undefined ? { description: category.description } : {}),
    ...(category.icon !== undefined ? { icon: category.icon } : {}),
    ...(category.color !== undefined ? { color: category.color } : {}),
    ...(category.seq !== undefined ? { seq: category.seq } : {}),
    ...(category.isDefault ? { default: true } : {}),
    ...(category.entities.length ? { entities: [...category.entities] } : {}),
  };
}

/**
 * Write model records as a YAML model document.
 *
 * Every declaration that compiles to something is carried, so
 * `compileModelRecords(documentToRecords(document))` equals
 * `compileModelRecords(records)`. What is not carried is in `issues`.
 */
export function recordsToDocument(records: ModelRecords): {
  document: ModelDocument;
  issues: ConversionIssue[];
} {
  const issues: ConversionIssue[] = [];

  const rbac = records.rbac.filter((rule) => {
    if (rule.roles.filter(Boolean).length > 0) return true;
    issues.push({
      construct: `%%rbac on ${rule.entity}.${rule.target}`,
      message: "names no role, so it compiles to nothing",
      kind: "dropped",
    });
    return false;
  });

  const document: ModelDocument = {
    eml: EML_YAML_VERSION,
    ...(records.name !== undefined ? { name: records.name } : {}),
    ...(records.version !== undefined ? { version: records.version } : {}),
    ...(records.description !== undefined ? { description: records.description } : {}),
    ...(records.erd.enums.length ? { enums: enumsOf(records.erd.enums, issues) } : {}),
    ...(records.categories.length ? { categories: records.categories.map(categoryDocumentOf) } : {}),
    entities: entitiesOf(records.erd, issues),
    ...(records.erd.relationships.length
      ? {
          relationships: records.erd.relationships.map((relationship) => ({
            from: relationship.source,
            fromCardinality: relationship.sourceEnd,
            to: relationship.target,
            toCardinality: relationship.targetEnd,
            ...(relationship.label !== undefined ? { label: relationship.label } : {}),
          })),
        }
      : {}),
    ...(records.hooks.length
      ? {
          hooks: records.hooks.map((hook) => ({
            entity: hook.entity,
            event: hook.event,
            handler: hook.handler,
            ...(hook.field !== undefined ? { field: hook.field } : {}),
          })),
        }
      : {}),
    ...(rbac.length
      ? {
          rbac: rbac.map((rule) => ({
            entity: rule.entity,
            action: rule.target,
            roles: rule.roles.filter(Boolean),
          })),
        }
      : {}),
    ...(records.reports.length ? { reports: records.reports.map(reportDocumentOf) } : {}),
    ...(records.rules.length ? { rules: records.rules.map(ruleDocumentOf) } : {}),
    ...(records.stateMachines.length
      ? { stateMachines: records.stateMachines.map(stateMachineDocumentOf) }
      : {}),
    ...(records.sagas.length ? { sagas: records.sagas.map(sagaDocumentOf) } : {}),
    ...(records.hookDiagrams.length
      ? {
          hookDiagrams: records.hookDiagrams.map((diagram) => ({
            name: diagram.name,
            ...(diagram.title !== undefined && diagram.title !== diagram.name
              ? { title: diagram.title }
              : {}),
            entity: diagram.entity,
            diagram: diagram.diagram,
          })),
        }
      : {}),
  };

  return { document, issues };
}
