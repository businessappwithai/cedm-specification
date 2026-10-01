/**
 * A validated model document → model records, the form the compilers read.
 *
 * The document nests what the records keep flat: an entity carries its own
 * help, icon, parent, indexes and each attribute its enum and help, where the
 * records list each of those beside the entities, in declaration order. That
 * flat shape is what both compilers resolve (the Rust generator's
 * `yaml_model.rs` builds the same records), so the two cannot come to read one
 * document differently.
 *
 * Every document the schema accepts has exactly one reading.
 */

import type {
  AttributeDeclaration,
  CategoryDeclaration,
  ErdRecords,
  HookDeclaration,
  HookFlowDeclaration,
  ModelRecords,
  RbacDeclaration,
  ReportDeclaration,
  RuleDeclaration,
  SagaDeclaration,
  StateMachineDeclaration,
} from "../model/records";
import { ENTITY_OPTION_KEYS, FIELD_OPTION_KEYS } from "../model/records";
import type {
  AttributeDocument,
  CategoryDocument,
  HookFlowDocument,
  ModelDocument,
  RuleDocument,
  SagaDocument,
  StateMachineDocument,
} from "./document";

function modifiersOf(attribute: AttributeDocument): string[] {
  const modifiers: string[] = [];
  if (attribute.pk) modifiers.push("PK");
  if (attribute.fk) modifiers.push("FK");
  if (attribute.unique) modifiers.push("UK");
  if (attribute.optional) modifiers.push("OPTIONAL");
  if (attribute.comment !== undefined) modifiers.push(`"${attribute.comment}"`);
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
    entityOptions: [],
    fieldOptions: [],
  };

  for (const entity of document.entities) {
    erd.entities.push({
      name: entity.name,
      attributes: entity.attributes.map(
        (attribute): AttributeDeclaration => ({
          type: attribute.type,
          name: attribute.name,
          modifiers: modifiersOf(attribute),
          ...(attribute.references !== undefined ? { references: attribute.references } : {}),
        })
      ),
    });
    if (entity.help !== undefined) erd.entityHelp.push({ entity: entity.name, help: entity.help });
    if (entity.icon !== undefined) erd.entityIcons.push({ entity: entity.name, icon: entity.icon });
    if (entity.parent !== undefined) {
      erd.entityParents.push({ entity: entity.name, parent: entity.parent });
    }
    for (const key of ENTITY_OPTION_KEYS) {
      const value = entity[key];
      if (value !== undefined) {
        erd.entityOptions.push({ entity: entity.name, key, value: String(value) });
      }
    }
    for (const attribute of entity.attributes) {
      if (attribute.enum !== undefined) {
        erd.enumBindings.push({
          entity: entity.name,
          column: attribute.name,
          enumName: attribute.enum,
        });
      }
      for (const key of FIELD_OPTION_KEYS) {
        const value = attribute[key];
        if (value !== undefined) {
          erd.fieldOptions.push({
            entity: entity.name,
            column: attribute.name,
            key,
            value: String(value),
          });
        }
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
    nodes: rule.nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
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

function hookFlowOf(flow: HookFlowDocument): HookFlowDeclaration {
  return {
    name: flow.name,
    ...(flow.title !== undefined ? { title: flow.title } : {}),
    entity: flow.entity,
    ...(flow.direction !== undefined ? { direction: flow.direction } : {}),
    nodes: flow.nodes.map((node) => ({ ...node })),
    edges: flow.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      ...(edge.label !== undefined ? { label: edge.label } : {}),
    })),
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

/** Read a validated model document into records. */
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
    triggers: (document.triggers ?? []).map((trigger) => ({
      source: trigger.source,
      handler: trigger.handler,
      entity: trigger.entity,
    })),
    hooks: (document.hooks ?? []).map(
      (hook): HookDeclaration => ({
        event: hook.event,
        handler: hook.handler,
        entity: hook.entity,
        ...(hook.fields?.length ? { fields: [...hook.fields] } : {}),
      })
    ),
    reports: (document.reports ?? []).map((report): ReportDeclaration => ({ ...report })),
    rules: (document.rules ?? []).map(ruleOf),
    stateMachines: (document.stateMachines ?? []).map(stateMachineOf),
    sagas: (document.sagas ?? []).map(sagaOf),
    hookFlows: (document.hookFlows ?? []).map(hookFlowOf),
  };
}
