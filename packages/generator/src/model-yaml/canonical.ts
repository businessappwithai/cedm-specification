/**
 * A model document in canonical form.
 *
 * Canonical form is how a model is saved: keys in the order the language lists
 * them, and nothing stated that is the language's default — a title equal to
 * the name, a `down` direction, a saga's `automatic` trigger and `CREATE`
 * operation, a step label equal to its id, an empty list. Two documents that
 * mean the same thing are then the same text, so saving a model twice gives the
 * same bytes and a Git diff between two saves is exactly the change.
 *
 * Canonical form changes nothing a compiler reads: `compileModelDocument` of a
 * document and of its canonical form produce the same application.
 */

import { sagaOperation, sagaTrigger } from "../workflows/sagas";
import type {
  AttributeDocument,
  CategoryDocument,
  EntityDocument,
  EnumDocument,
  HookFlowDocument,
  ModelDocument,
  ReportDocument,
  RuleDocument,
  SagaDocument,
  StateMachineDocument,
} from "./document";

/** Spread `{ [key]: value }` only when `value` is defined. */
function present<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

/** Spread `{ [key]: list }` only when `list` has members. */
function nonEmpty<K extends string, V>(key: K, list: V[] | undefined): Partial<Record<K, V[]>> {
  return list?.length ? ({ [key]: list } as Record<K, V[]>) : {};
}

/** A title is stated only where it says something the name does not. */
function titleOf(title: string | undefined, name: string): Partial<Record<"title", string>> {
  return title !== undefined && title !== name ? { title } : {};
}

function attributeOf(attribute: AttributeDocument): AttributeDocument {
  return {
    name: attribute.name,
    type: attribute.type,
    ...(attribute.pk ? { pk: true } : {}),
    ...(attribute.fk ? { fk: true } : {}),
    ...present("references", attribute.references),
    ...(attribute.unique ? { unique: true } : {}),
    ...(attribute.optional ? { optional: true } : {}),
    ...present("enum", attribute.enum),
    ...present("help", attribute.help),
    ...present("ui", attribute.ui),
    ...present("default", attribute.default),
    ...present("min", attribute.min),
    ...present("max", attribute.max),
    ...present("format", attribute.format),
    ...present("comment", attribute.comment),
  };
}

function entityOf(entity: EntityDocument): EntityDocument {
  return {
    name: entity.name,
    ...present("help", entity.help),
    ...present("icon", entity.icon),
    ...present("parent", entity.parent),
    ...present("label", entity.label),
    ...present("prefix", entity.prefix),
    ...present("softDelete", entity.softDelete),
    ...present("audited", entity.audited),
    attributes: entity.attributes.map(attributeOf),
    ...nonEmpty(
      "indexes",
      entity.indexes?.map((index) => ({
        columns: [...index.columns],
        ...(index.unique ? { unique: true } : {}),
      }))
    ),
  };
}

/** The first enum of a name is the one the compiler uses; a repeat says nothing. */
function enumsOf(enums: EnumDocument[] | undefined): EnumDocument[] | undefined {
  if (!enums) return undefined;
  const seen = new Set<string>();
  return enums
    .filter((declared) => !seen.has(declared.name) && seen.add(declared.name))
    .map((declared) => ({ name: declared.name, values: [...declared.values] }));
}

function categoryOf(category: CategoryDocument): CategoryDocument {
  return {
    name: category.name,
    ...present("code", category.code),
    ...present("description", category.description),
    ...present("icon", category.icon),
    ...present("color", category.color),
    ...present("seq", category.seq),
    ...(category.default ? { default: true } : {}),
    ...nonEmpty("entities", category.entities && [...category.entities]),
  };
}

function reportOf(report: ReportDocument): ReportDocument {
  return {
    name: report.name,
    ...present("title", report.title),
    ...present("entity", report.entity),
    ...present("chart", report.chart),
    ...present("x", report.x),
    ...present("y", report.y),
    ...present("help", report.help),
    sql: report.sql,
  };
}

function edgesOf(edges: Array<{ from: string; to: string; label?: string }>) {
  return edges.map((edge) => ({ from: edge.from, to: edge.to, ...present("label", edge.label) }));
}

function ruleOf(rule: RuleDocument): RuleDocument {
  return {
    name: rule.name,
    ...titleOf(rule.title, rule.name),
    entity: rule.entity,
    event: rule.event,
    ...present("priority", rule.priority),
    ...(rule.direction !== undefined && rule.direction !== "down"
      ? { direction: rule.direction }
      : {}),
    nodes: rule.nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
    edges: edgesOf(rule.edges),
    ...nonEmpty(
      "actions",
      rule.actions?.map((action) => ({
        name: action.name,
        type: action.type,
        ...present("when", action.when),
        ...(action.props && Object.keys(action.props).length ? { props: { ...action.props } } : {}),
      }))
    ),
    ...present("decisionTable", rule.decisionTable),
  };
}

function stateMachineOf(machine: StateMachineDocument): StateMachineDocument {
  return {
    name: machine.name,
    ...titleOf(machine.title, machine.name),
    entity: machine.entity,
    states: [...machine.states],
    ...present("initial", machine.initial),
    ...nonEmpty("final", machine.final && [...machine.final]),
    transitions: machine.transitions.map((transition) => ({
      from: transition.from,
      to: transition.to,
      ...present("trigger", transition.trigger),
    })),
  };
}

function sagaOf(saga: SagaDocument): SagaDocument {
  const operation = sagaOperation(saga.operation);
  const trigger = sagaTrigger(saga.trigger);
  return {
    name: saga.name,
    ...titleOf(saga.title, saga.name),
    entity: saga.entity,
    ...(operation !== "CREATE" ? { operation } : {}),
    ...(trigger !== "automatic" ? { trigger } : {}),
    ...present("description", saga.description),
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...(step.label !== undefined && step.label !== step.id ? { label: step.label } : {}),
      ...(step.properties && Object.keys(step.properties).length
        ? { properties: { ...step.properties } }
        : {}),
    })),
  };
}

function hookFlowOf(flow: HookFlowDocument): HookFlowDocument {
  return {
    name: flow.name,
    ...titleOf(flow.title, flow.name),
    entity: flow.entity,
    ...(flow.direction !== undefined && flow.direction !== "down"
      ? { direction: flow.direction }
      : {}),
    nodes: flow.nodes.map((node) => ({
      id: node.id,
      ...present("label", node.label),
      ...present("event", node.event),
      ...present("handler", node.handler),
    })),
    edges: edgesOf(flow.edges),
  };
}

/** The document in canonical form. */
export function canonicalDocument(document: ModelDocument): ModelDocument {
  return {
    eml: document.eml,
    ...present("name", document.name),
    ...present("version", document.version),
    ...present("description", document.description),
    ...nonEmpty("enums", enumsOf(document.enums)),
    ...nonEmpty("categories", document.categories?.map(categoryOf)),
    entities: document.entities.map(entityOf),
    ...nonEmpty(
      "relationships",
      document.relationships?.map((relationship) => ({
        from: relationship.from,
        fromCardinality: relationship.fromCardinality,
        to: relationship.to,
        toCardinality: relationship.toCardinality,
        ...present("label", relationship.label),
      }))
    ),
    ...nonEmpty(
      "hooks",
      document.hooks?.map((hook) => ({
        entity: hook.entity,
        event: hook.event,
        handler: hook.handler,
        ...nonEmpty("fields", hook.fields && [...hook.fields]),
      }))
    ),
    ...nonEmpty("hookFlows", document.hookFlows?.map(hookFlowOf)),
    ...nonEmpty(
      "rbac",
      document.rbac?.map((rule) => ({
        entity: rule.entity,
        action: rule.action,
        roles: [...rule.roles],
      }))
    ),
    ...nonEmpty(
      "triggers",
      document.triggers?.map((trigger) => ({
        entity: trigger.entity,
        source: trigger.source,
        handler: trigger.handler,
      }))
    ),
    ...nonEmpty("reports", document.reports?.map(reportOf)),
    ...nonEmpty("rules", document.rules?.map(ruleOf)),
    ...nonEmpty("stateMachines", document.stateMachines?.map(stateMachineOf)),
    ...nonEmpty("sagas", document.sagas?.map(sagaOf)),
  };
}
