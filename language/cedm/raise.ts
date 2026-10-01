/**
 * Raising: a model document → the same application written in CEDM.
 *
 * The inverse of `lower.ts`, used by `appwithai convert --to cedm` and by the
 * equivalence gates: every model in the repository is raised, lowered again,
 * and required to come back as what it was, so the two languages are shown to
 * say the same thing rather than assumed to.
 *
 * "What it was" is up to one difference CEDM makes on purpose. A CEDM model
 * declares a relationship on the entity it belongs to, and a lifecycle on the
 * entity it governs, so their order in the lowered document is entity order.
 * `cedmOrder` is that reordering; `lowerCedmModel(raiseModelDocument(d))`
 * equals `cedmOrder(d)` for every document this module accepts.
 *
 * Physical names are kept exactly: an attribute is renamed to camelCase only
 * where the snake_case of the new name is the old column, and states `column:`
 * otherwise.
 */

import type {
  AttributeDocument,
  EntityDocument,
  ModelDocument,
  RelationshipDocument,
  RelationshipEnd,
  StateMachineDocument,
} from "../yaml/document";
import type {
  CedmAttribute,
  CedmEntity,
  CedmLifecycle,
  CedmModelDocument,
  CedmRelationship,
} from "./document";
import { defaultRelationshipName, END_CARDINALITY, lowerCedmModel, lowerType } from "./lower";
import { camelCase, derivedReferenceTable, pascalCase, snakeCase, tableOf } from "./naming";

/** A model this module cannot express in CEDM without changing what it means. */
export class RaiseError extends Error {
  constructor(readonly problems: string[]) {
    super(`The model cannot be written in CEDM unchanged:\n  ${problems.join("\n  ")}`);
    this.name = "RaiseError";
  }
}

function isMany(end: RelationshipEnd): boolean {
  return end === "zero-or-more" || end === "one-or-more";
}

/** `has aliases` → `hasAliases`. */
function nameFromLabel(label: string): string {
  const words = label.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (!words.length) return "relationship";
  const [first = "", ...rest] = words;
  const name =
    first.charAt(0).toLowerCase() +
    first.slice(1) +
    rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  return /^[0-9]/.test(name) ? `r${name}` : name;
}

/**
 * The document in the order CEDM declares it: relationships grouped under the
 * entity they are declared from, state machines under the entity they govern,
 * shared value lists before the ones a single column declares inline.
 */
export function cedmOrder(document: ModelDocument): ModelDocument {
  const position = new Map(document.entities.map((entity, index) => [entity.name, index]));
  const byEntity = <T>(items: T[] | undefined, entity: (item: T) => string): T[] | undefined =>
    items
      ?.map((item, index) => ({ item, index }))
      .sort(
        (a, b) =>
          (position.get(entity(a.item)) ?? Number.MAX_SAFE_INTEGER) -
            (position.get(entity(b.item)) ?? Number.MAX_SAFE_INTEGER) || a.index - b.index
      )
      .map(({ item }) => item);

  const ordered: ModelDocument = { ...document };
  const relationships = byEntity(document.relationships, (relationship) => relationship.from);
  if (relationships) ordered.relationships = relationships;
  const machines = byEntity(document.stateMachines, (machine) => machine.entity);
  if (machines) ordered.stateMachines = machines;

  if (document.enums) {
    const inline = inlineEnums(document);
    const shared = document.enums.filter((declared) => !inline.has(declared.name));
    const inlined: typeof document.enums = [];
    for (const entity of document.entities) {
      for (const attribute of entity.attributes) {
        if (attribute.enum === undefined || !inline.has(attribute.enum)) continue;
        const declared = document.enums.find((candidate) => candidate.name === attribute.enum);
        if (declared && !inlined.includes(declared)) inlined.push(declared);
      }
    }
    ordered.enums = [...shared, ...inlined];
  }
  return ordered;
}

/** Value lists one column alone uses, which CEDM writes on that column. */
function inlineEnums(document: ModelDocument): Set<string> {
  const declared = new Map<string, number>();
  for (const value of document.enums ?? []) {
    declared.set(value.name, (declared.get(value.name) ?? 0) + 1);
  }
  const uses = new Map<string, number>();
  for (const entity of document.entities) {
    for (const attribute of entity.attributes) {
      if (attribute.enum !== undefined) {
        uses.set(attribute.enum, (uses.get(attribute.enum) ?? 0) + 1);
      }
    }
  }
  const inline = new Set<string>();
  for (const [name, count] of declared) {
    if (count === 1 && uses.get(name) === 1) inline.add(name);
  }
  return inline;
}

/** The entity a foreign key points at, as the generator would resolve it. */
function referencedEntity(
  attribute: AttributeDocument,
  tables: Map<string, string>
): string | undefined {
  if (attribute.references !== undefined) return attribute.references;
  const table = derivedReferenceTable(attribute.name);
  return table === undefined ? undefined : tables.get(table);
}

function raiseAttribute(
  entity: EntityDocument,
  attribute: AttributeDocument,
  name: string,
  singleKey: boolean,
  enums: Map<string, string[]>,
  inline: Set<string>,
  tables: Map<string, string>
): CedmAttribute {
  const raised: CedmAttribute = { name, type: attribute.type };
  const defaultColumn = attribute.pk && singleKey ? "id" : snakeCase(name);
  if (defaultColumn !== attribute.name) raised.column = attribute.name;

  if (attribute.fk) {
    raised.type = "reference";
    const target = referencedEntity(attribute, tables);
    if (target !== undefined) raised.target = target;
    if (attribute.type !== "string") raised.keyType = attribute.type;
  } else if (attribute.enum !== undefined && attribute.type === "string") {
    raised.type = "enum";
  }
  if (attribute.optional) raised.required = false;
  if (attribute.unique) raised.unique = true;

  if (attribute.enum !== undefined) {
    const values = enums.get(attribute.enum);
    if (inline.has(attribute.enum) && values) {
      raised.values = [...values];
      if (attribute.enum !== `${entity.name}${pascalCase(name)}`) raised.enumName = attribute.enum;
    } else {
      raised.enum = attribute.enum;
    }
  }
  if (attribute.help !== undefined) raised.help = attribute.help;
  if (attribute.comment !== undefined) raised.comment = attribute.comment;
  if (attribute.ui !== undefined) raised.ui = attribute.ui;
  if (attribute.default !== undefined) raised.default = attribute.default;
  if (attribute.min !== undefined) raised.minimum = attribute.min;
  if (attribute.max !== undefined) raised.maximum = attribute.max;
  if (attribute.format !== undefined) raised.format = attribute.format;
  return raised;
}

function raiseLifecycle(machine: StateMachineDocument): CedmLifecycle {
  const lifecycle: CedmLifecycle = { states: [...machine.states] };
  if (machine.name !== `${machine.entity}Lifecycle`) lifecycle.name = machine.name;
  if (machine.title !== undefined) lifecycle.title = machine.title;
  if (machine.initial !== undefined) lifecycle.initial = machine.initial;
  if (machine.final !== undefined) lifecycle.terminal = [...machine.final];
  lifecycle.transitions = machine.transitions.map((transition) => ({
    from: transition.from,
    to: transition.to,
    ...(transition.trigger !== undefined ? { action: transition.trigger } : {}),
  }));
  // Name and title first, as an author writes them.
  return {
    ...(lifecycle.name !== undefined ? { name: lifecycle.name } : {}),
    ...(lifecycle.title !== undefined ? { title: lifecycle.title } : {}),
    states: lifecycle.states,
    ...(lifecycle.initial !== undefined ? { initial: lifecycle.initial } : {}),
    ...(lifecycle.terminal !== undefined ? { terminal: lifecycle.terminal } : {}),
    transitions: lifecycle.transitions,
  };
}

/** Write a model document in CEDM. Throws `RaiseError` when it cannot be done faithfully. */
export function raiseModelDocument(document: ModelDocument): CedmModelDocument {
  const problems: string[] = [];
  const names = new Set(document.entities.map((entity) => entity.name));
  const tables = new Map(document.entities.map((entity) => [tableOf(entity.name), entity.name]));
  const enums = new Map((document.enums ?? []).map((value) => [value.name, value.values]));
  const inline = inlineEnums(document);

  for (const relationship of document.relationships ?? []) {
    if (!names.has(relationship.from)) {
      problems.push(
        `relationship ${relationship.from} → ${relationship.to}: "${relationship.from}" is not an entity, so there is nowhere to declare it`
      );
    }
  }
  for (const machine of document.stateMachines ?? []) {
    if (!names.has(machine.entity)) {
      problems.push(`state machine ${machine.name}: "${machine.entity}" is not an entity`);
    }
  }

  const entities: CedmEntity[] = document.entities.map((entity) => {
    const raised: CedmEntity = { name: entity.name };
    if (entity.help !== undefined) raised.help = entity.help;

    const keys = entity.attributes.filter((attribute) => attribute.pk);
    const singleKey = keys.length === 1;
    const used = new Set<string>();
    const attributeNames = entity.attributes.map((attribute) => {
      let name = camelCase(attribute.name);
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name) || used.has(name)) name = attribute.name;
      if (used.has(name)) {
        problems.push(`${entity.name}.${attribute.name} is declared twice`);
      }
      used.add(name);
      return name;
    });
    if (keys.length) {
      const keyNames = entity.attributes
        .map((attribute, index) => (attribute.pk ? attributeNames[index] : undefined))
        .filter((name): name is string => name !== undefined);
      raised.identity = { key: singleKey ? (keyNames[0] as string) : keyNames };
    }
    raised.attributes = entity.attributes.map((attribute, index) =>
      raiseAttribute(
        entity,
        attribute,
        attributeNames[index] as string,
        singleKey,
        enums,
        inline,
        tables
      )
    );

    const relationships = (document.relationships ?? []).filter(
      (relationship) => relationship.from === entity.name
    );
    if (relationships.length) {
      raised.relationships = relationships.map((relationship) =>
        raiseRelationship(relationship, document)
      );
    }

    const machines = (document.stateMachines ?? []).filter(
      (machine) => machine.entity === entity.name
    );
    if (machines.length === 1)
      raised.lifecycle = raiseLifecycle(machines[0] as StateMachineDocument);
    else if (machines.length > 1) raised.lifecycle = machines.map(raiseLifecycle);

    if (entity.icon !== undefined || entity.label !== undefined) {
      raised.ui = {
        ...(entity.icon !== undefined ? { icon: entity.icon } : {}),
        ...(entity.label !== undefined ? { label: entity.label } : {}),
      };
    }
    if (
      entity.prefix !== undefined ||
      entity.softDelete !== undefined ||
      entity.audited !== undefined ||
      entity.indexes?.length
    ) {
      raised.persistence = {
        ...(entity.prefix !== undefined ? { prefix: entity.prefix } : {}),
        ...(entity.softDelete !== undefined ? { softDelete: entity.softDelete } : {}),
        ...(entity.audited !== undefined ? { audited: entity.audited } : {}),
        ...(entity.indexes?.length
          ? {
              indexes: entity.indexes.map((index) => ({
                columns: [...index.columns],
                ...(index.unique !== undefined ? { unique: index.unique } : {}),
              })),
            }
          : {}),
      };
    }
    return raised;
  });

  // A line item's parent: an aggregate relationship where there is one to mark.
  const byName = new Map(entities.map((entity) => [entity.name, entity]));
  for (const entity of document.entities) {
    if (entity.parent === undefined) continue;
    const parent = byName.get(entity.parent);
    const owning = parent?.relationships?.find((relationship) => {
      const end = CARDINALITY[relationship.cardinality];
      return relationship.target === entity.name && end !== undefined && isMany(end);
    });
    const child = byName.get(entity.name) as CedmEntity;
    if (owning && parent !== undefined && entity.parent !== entity.name) {
      owning.ownership = "aggregate";
    } else {
      child.aggregateRoot = entity.parent;
    }
  }

  if (problems.length) throw new RaiseError(problems);

  const cedm: CedmModelDocument = { cedm: "1.0" };
  if (
    document.name !== undefined ||
    document.version !== undefined ||
    document.description !== undefined
  ) {
    cedm.application = {
      ...(document.name !== undefined ? { name: document.name } : {}),
      ...(document.version !== undefined ? { version: document.version } : {}),
      ...(document.description !== undefined ? { description: document.description } : {}),
    };
  }
  const shared = (document.enums ?? []).filter((value) => !inline.has(value.name));
  if (shared.length) cedm.enums = shared.map((value) => ({ ...value, values: [...value.values] }));
  cedm.entities = entities;
  if (document.categories?.length) cedm.ui = { categories: document.categories };
  if (document.rbac?.length) {
    cedm.authorization = {
      permissions: document.rbac.map((rule) => ({
        resource: rule.entity,
        action: rule.action,
        subject: [...rule.roles],
      })),
    };
  }
  if (document.hooks?.length) cedm.hooks = document.hooks;
  if (document.hookFlows?.length) cedm.hookFlows = document.hookFlows;
  if (document.triggers?.length) cedm.triggers = document.triggers;
  if (document.reports?.length) cedm.reports = document.reports;
  if (document.rules?.length) cedm.rules = document.rules;
  if (document.sagas?.length) cedm.processes = document.sagas;

  settleForeignKeys(cedm);
  return cedm;
}

const CARDINALITY: Readonly<Record<string, RelationshipEnd>> = {
  "1": "exactly-one",
  "0..1": "zero-or-one",
  "0..*": "zero-or-more",
  "1..*": "one-or-more",
};

function raiseRelationship(
  relationship: RelationshipDocument,
  document: ModelDocument
): CedmRelationship {
  const many = isMany(relationship.toCardinality);
  let name: string;
  let label: string | undefined;
  if (relationship.label !== undefined) {
    name = nameFromLabel(relationship.label);
    if (snakeCase(name) !== relationship.label) label = relationship.label;
  } else {
    name = defaultRelationshipName(relationship.to, many);
  }
  const raised: CedmRelationship = {
    name,
    target: relationship.to,
    cardinality: END_CARDINALITY[relationship.toCardinality],
  };
  // A to-one relationship always says which way it runs; a to-many one says
  // so when its source end is not the usual "one", or when the target has a
  // to-many relationship back that would otherwise be read as its other half.
  const backToMany = (document.relationships ?? []).some(
    (other) =>
      other !== relationship &&
      other.from === relationship.to &&
      other.to === relationship.from &&
      isMany(other.toCardinality)
  );
  if (!many || relationship.fromCardinality !== "exactly-one" || backToMany) {
    raised.inverseCardinality = END_CARDINALITY[
      relationship.fromCardinality
    ] as CedmRelationship["inverseCardinality"];
  }
  if (label !== undefined) raised.label = label;
  return raised;
}

/**
 * Mark the relationships whose key column the model keeps somewhere the
 * lowering's search does not look, so that lowering adds no column the
 * original model did not have.
 */
function settleForeignKeys(cedm: CedmModelDocument): void {
  for (let pass = 0; pass < 50; pass++) {
    const { notes } = lowerCedmModel(cedm);
    const created = notes.filter((note) => note.code === "CEDM140");
    if (!created.length) return;
    for (const note of created) {
      const [, entityIndex, , relationshipIndex] = note.path;
      const relationship =
        cedm.entities?.[entityIndex as number]?.relationships?.[relationshipIndex as number];
      if (relationship) relationship.foreignKey = false;
    }
  }
}

/** The CEDM types the lowering rewrites; an attribute written with one as its token cannot be raised. */
export function isCedmOnlyType(type: string): boolean {
  return lowerType(type, undefined).token !== type || type.toLowerCase() === "reference";
}
