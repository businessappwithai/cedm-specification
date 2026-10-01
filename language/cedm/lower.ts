/**
 * Lowering: a CEDM application model → the model document the generators compile.
 *
 * The generators compile one thing, the model document of
 * `language/yaml/document.ts`. A CEDM model is translated into it here, once,
 * so every reader of a model — the checker, both generators, the CLI, the
 * modelling tool — keeps working unchanged, and so a construct cannot mean one
 * thing when it is written in CEDM and another when it is not.
 *
 * The translation is total and deterministic. It records, for every value it
 * writes, which part of the CEDM document it came from (`sources`), so a
 * finding about the lowered document is reported where the author wrote it.
 * What CEDM states that the application cannot act on is not dropped
 * silently: it is listed in `notes`.
 *
 * Imports are resolved before lowering (`imports.ts`); this module sees one
 * self-contained document.
 */

import type {
  AttributeDocument,
  DocumentPath,
  EntityDocument,
  EnumDocument,
  IndexDocument,
  ModelDocument,
  RbacDocument,
  RelationshipDocument,
  RelationshipEnd,
  RuleDocument,
  StateMachineDocument,
} from "../yaml/document";
import type {
  CedmAttribute,
  CedmEntity,
  CedmHelp,
  CedmLifecycle,
  CedmModelDocument,
  CedmRelationship,
} from "./document";
import { derivedReferenceTable, lowerFirst, pascalCase, snakeCase, tableOf } from "./naming";

export type LoweringSeverity = "error" | "warning" | "info";

/** Something the CEDM model says that the application does not, or cannot, act on. */
export interface LoweringNote {
  severity: LoweringSeverity;
  code: string;
  message: string;
  /** Where in the CEDM document. */
  path: DocumentPath;
}

/** Which CEDM value a lowered value came from. */
export interface SourceMapping {
  lowered: DocumentPath;
  source: DocumentPath;
}

export interface LoweringResult {
  document: ModelDocument;
  notes: LoweringNote[];
  sources: SourceMapping[];
}

/* -------------------------------------------------------------------------- */
/*  Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * CEDM vocabulary types the model language has no token for, and the token
 * each is stored as. Every other type — `uuid`, `string`, `decimal`, `money`,
 * `date`, `datetime`, `boolean`, `object`, and the model language's own
 * `text`, `email`, `string(255)`, … — is already a token and is kept as written.
 */
export const CEDM_TYPE_TOKENS: Readonly<Record<string, string>> = {
  currency_code: "string(3)",
  country_code: "string(2)",
  locale: "string(35)",
  timezone: "string(64)",
  value_object: "json",
};

/**
 * Columns every generated table carries already — the optimistic-lock counter,
 * the audit pair and the soft-delete pair. Mirrors `MANAGED_COLUMN_NAMES` in
 * the checker (EML103).
 */
const MANAGED_COLUMNS = new Set([
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
]);

/** Types whose maximum length is written as a `(n)` suffix on the token. */
const LENGTH_TYPES = new Set(["string", "varchar", "char"]);

const CARDINALITY_END: Readonly<Record<string, RelationshipEnd>> = {
  "1": "exactly-one",
  "0..1": "zero-or-one",
  "0..*": "zero-or-more",
  "1..*": "one-or-more",
};

/** The CEDM cardinality an end of a relationship is written as. */
export const END_CARDINALITY: Readonly<Record<RelationshipEnd, string>> = {
  "exactly-one": "1",
  "zero-or-one": "0..1",
  "zero-or-more": "0..*",
  "one-or-more": "1..*",
};

function isMany(end: RelationshipEnd): boolean {
  return end === "zero-or-more" || end === "one-or-more";
}

/** Events an invariant with a `violatedWhen` condition is checked on, by default. */
const INVARIANT_EVENTS = ["beforeCreate", "beforeUpdate"];

/* -------------------------------------------------------------------------- */
/*  Help                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Help as one line of prose. Structured help (`summary`, `businessMeaning`,
 * `usage`, …) is joined in the order written; the application shows help as a
 * hint under a control and as a paragraph of the manual, and both are prose.
 */
export function composeHelp(help: CedmHelp | undefined): string | undefined {
  if (help === undefined || help === null) return undefined;
  if (typeof help === "string") return help;
  const parts: string[] = [];
  const collect = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(help);
  const text = parts
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((part) => (/[.!?]$/.test(part) || parts.length === 1 ? part : `${part}.`))
    .join(" ");
  return text || undefined;
}

/* -------------------------------------------------------------------------- */
/*  The lowering                                                               */
/* -------------------------------------------------------------------------- */

interface EntityState {
  source: CedmEntity;
  index: number;
  document: EntityDocument;
  /** attribute name → column */
  columns: Map<string, string>;
  /** physical columns already on the entity */
  physical: Set<string>;
  /** reference attributes: column → target entity */
  references: Map<string, string | undefined>;
}

interface PendingRelationship {
  entity: EntityState;
  index: number;
  relationship: CedmRelationship;
  end: RelationshipEnd;
  paired?: boolean;
}

/** Name a relationship is given when the author gives it none (and when raising). */
export function defaultRelationshipName(target: string, many: boolean): string {
  return many ? `${lowerFirst(target)}List` : lowerFirst(target);
}

export function lowerCedmModel(cedm: CedmModelDocument): LoweringResult {
  const notes: LoweringNote[] = [];
  const sources: SourceMapping[] = [];
  const note = (severity: LoweringSeverity, code: string, message: string, path: DocumentPath) =>
    notes.push({ severity, code, message, path });
  const map = (lowered: DocumentPath, source: DocumentPath) => sources.push({ lowered, source });

  const cedmEntities = cedm.entities ?? [];
  const entityNames = new Set(cedmEntities.map((entity) => entity.name));

  /* ---- enums ------------------------------------------------------------ */
  const enums: EnumDocument[] = [];
  const enumIndex = new Map<string, number>();
  (cedm.enums ?? []).forEach((declared, index) => {
    enumIndex.set(declared.name, enums.length);
    map(["enums", enums.length], ["enums", index]);
    enums.push({ name: declared.name, values: [...declared.values] });
  });
  const publishEnum = (name: string, values: string[], at: DocumentPath) => {
    const existing = enumIndex.get(name);
    if (existing !== undefined) {
      const known = enums[existing]?.values ?? [];
      if (known.length !== values.length || known.some((value, i) => value !== values[i])) {
        note(
          "error",
          "CEDM110",
          `Value list "${name}" is declared twice with different values.`,
          at
        );
      }
      return;
    }
    enumIndex.set(name, enums.length);
    map(["enums", enums.length], at);
    enums.push({ name, values: [...values] });
  };

  /* ---- aggregate roots from ownership ----------------------------------- */
  const parents = new Map<string, string>();
  cedmEntities.forEach((entity) => {
    if (entity.aggregateRoot) parents.set(entity.name, entity.aggregateRoot);
  });
  cedmEntities.forEach((entity) => {
    for (const relationship of entity.relationships ?? []) {
      const end = CARDINALITY_END[relationship.cardinality];
      if (
        relationship.ownership === "aggregate" &&
        end &&
        isMany(end) &&
        relationship.target !== entity.name &&
        entityNames.has(relationship.target) &&
        !parents.has(relationship.target)
      ) {
        parents.set(relationship.target, entity.name);
      }
    }
  });

  /* ---- entities and attributes ------------------------------------------ */
  const states: EntityState[] = cedmEntities.map((entity, index) => {
    const path: DocumentPath = ["entities", index];
    map(["entities", index], path);
    const keys = identityKeys(entity);
    const singleKey = keys.length === 1;
    const document: EntityDocument = { name: entity.name, attributes: [] };
    const help = composeHelp(entity.help) ?? entity.description;
    if (help !== undefined) document.help = help;
    if (entity.ui?.icon !== undefined) document.icon = entity.ui.icon;
    const parent = parents.get(entity.name);
    if (parent !== undefined) document.parent = parent;
    if (entity.ui?.label !== undefined) document.label = entity.ui.label;
    if (entity.persistence?.prefix !== undefined) document.prefix = entity.persistence.prefix;
    if (entity.persistence?.softDelete !== undefined) {
      document.softDelete = entity.persistence.softDelete;
    }
    if (entity.persistence?.audited !== undefined) document.audited = entity.persistence.audited;

    const state: EntityState = {
      source: entity,
      index,
      document,
      columns: new Map(),
      physical: new Set(),
      references: new Map(),
    };

    // An identity key the attribute list does not repeat is still a column.
    const declared = new Set((entity.attributes ?? []).map((attribute) => attribute.name));
    for (const key of keys) {
      if (declared.has(key)) continue;
      const column = singleKey ? "id" : snakeCase(key);
      state.columns.set(key, column);
      state.physical.add(column);
      document.attributes.push({
        name: column,
        type: lowerType(entity.identity?.type ?? "uuid", undefined).token,
        pk: true,
      });
    }

    (entity.attributes ?? []).forEach((attribute, attributeIndex) => {
      const at: DocumentPath = [...path, "attributes", attributeIndex];
      const isKey = keys.includes(attribute.name);
      const column = attribute.column ?? (isKey && singleKey ? "id" : snakeCase(attribute.name));
      state.columns.set(attribute.name, column);
      state.physical.add(column);
      // CEDM's vocabulary calls the audit fields system-managed, and every
      // generated table carries them already; declaring one again would put
      // the column in the DDL twice. `systemManaged: false` keeps it.
      if (MANAGED_COLUMNS.has(column) && !isKey && attribute.systemManaged !== false) {
        note(
          "info",
          "CEDM141",
          `${entity.name}.${attribute.name} is provided by the application itself (${column}).`,
          at
        );
        return;
      }
      const dangling =
        attribute.type.toLowerCase() === "reference" &&
        attribute.target !== undefined &&
        !entityNames.has(attribute.target);
      const lowered = lowerAttribute(entity, attribute, column, isKey, dangling);
      map([...path, "attributes", document.attributes.length], at);
      document.attributes.push(lowered.attribute);
      if (lowered.reference) state.references.set(column, attribute.target);
      if (lowered.enumValues) publishEnum(lowered.attribute.enum as string, lowered.enumValues, at);
      if (dangling) {
        note(
          "warning",
          "CEDM120",
          `${entity.name}.${attribute.name} references "${attribute.target}", which the model does not contain; it is kept as a plain value.`,
          at
        );
      }
    });

    for (const [indexNumber, index_] of (entity.persistence?.indexes ?? []).entries()) {
      const lowered: IndexDocument = {
        columns: index_.columns.map((column) => state.columns.get(column) ?? column),
      };
      if (index_.unique !== undefined) lowered.unique = index_.unique;
      document.indexes = document.indexes ?? [];
      map(
        [...path, "indexes", document.indexes.length],
        [...path, "persistence", "indexes", indexNumber]
      );
      document.indexes.push(lowered);
    }

    return state;
  });
  const stateByName = new Map(states.map((state) => [state.source.name, state]));

  /* ---- relationships ------------------------------------------------------ */
  const pending: PendingRelationship[] = [];
  states.forEach((state) => {
    (state.source.relationships ?? []).forEach((relationship, index) => {
      const at: DocumentPath = ["entities", state.index, "relationships", index];
      let end = CARDINALITY_END[relationship.cardinality];
      if (!end) {
        const atLeast = /^(\d+)\.\.\*$/.exec(relationship.cardinality);
        if (atLeast) {
          end = "one-or-more";
          note(
            "info",
            "CEDM131",
            `${state.source.name}.${relationship.name} has cardinality ${relationship.cardinality}; the application enforces it as 1..*.`,
            at
          );
        } else {
          note(
            "error",
            "CEDM130",
            `${state.source.name}.${relationship.name} has cardinality "${relationship.cardinality}", which is not one of 0..1, 1, 0..*, 1..*.`,
            at
          );
          return;
        }
      }
      if (!entityNames.has(relationship.target)) {
        // A library entity is written for many applications, and most of its
        // optional neighbours are in none of them: that is information. A
        // required one missing is worth a warning.
        note(
          end === "zero-or-one" || end === "zero-or-more" ? "info" : "warning",
          "CEDM121",
          `${state.source.name}.${relationship.name} points at "${relationship.target}", which the model does not declare; the relationship is not generated.`,
          at
        );
        return;
      }
      pending.push({ entity: state, index, relationship, end });
    });
  });

  const counterpart = (item: PendingRelationship): PendingRelationship | undefined => {
    const { relationship, entity } = item;
    if (relationship.inverseCardinality !== undefined) return undefined;
    const candidates = pending.filter(
      (other) =>
        other !== item &&
        !other.paired &&
        other.entity.source.name === relationship.target &&
        other.relationship.target === entity.source.name &&
        other.relationship.inverseCardinality === undefined
    );
    if (relationship.inverse !== undefined) {
      return candidates.find((other) => other.relationship.name === relationship.inverse);
    }
    const named = candidates.find((other) => other.relationship.inverse === relationship.name);
    if (named) return named;
    if (candidates.some((other) => other.relationship.inverse !== undefined)) return undefined;
    // Unnamed pairing: exactly one relationship each way. Two to-one
    // relationships that point at each other are the two halves of a
    // one-to-one (`PartyRole.supplierRole 0..1` and `Supplier.partyRole 1`).
    const outgoing = pending.filter(
      (other) =>
        other.entity === entity &&
        other.relationship.target === relationship.target &&
        other.relationship.inverseCardinality === undefined &&
        other.relationship.inverse === undefined
    );
    if (outgoing.length !== 1 || candidates.length !== 1) return undefined;
    const [other] = candidates;
    return other;
  };

  const relationships: RelationshipDocument[] = [];
  const labelOf = (relationship: CedmRelationship, many: boolean): string | undefined => {
    if (relationship.label !== undefined) return relationship.label;
    if (relationship.name === defaultRelationshipName(relationship.target, many)) return undefined;
    return snakeCase(relationship.name);
  };
  /** Help for a key column a to-one relationship is held in. */
  const keyHelp = (relationship: CedmRelationship, holder: string): string =>
    composeHelp(relationship.help) ??
    relationship.description ??
    `The ${relationship.target} this ${holder} refers to.`;
  const emit = (record: RelationshipDocument, at: DocumentPath) => {
    map(["relationships", relationships.length], at);
    relationships.push(record);
  };

  /**
   * Make sure the entity holding a to-one key has a column for it.
   *
   * The key is found, in order: the attribute `foreignKey` names; a reference
   * attribute whose target is the referenced entity; a reference attribute
   * named `<hint>Id`; a column already named `<hint>_id`. Only when none
   * exists is one created — `foreignKey: false` says the model keeps the key
   * somewhere this cannot see, and creates none.
   */
  const ensureForeignKey = (
    holder: EntityState,
    target: string,
    foreignKey: string | false | undefined,
    hint: string,
    optional: boolean,
    at: DocumentPath,
    help: string
  ) => {
    if (foreignKey === false) return;
    if (typeof foreignKey === "string") {
      if (!holder.columns.has(foreignKey)) {
        note(
          "error",
          "CEDM122",
          `foreignKey "${foreignKey}" is not an attribute of ${holder.source.name}.`,
          at
        );
      }
      return;
    }
    for (const [, referenced] of holder.references) {
      if (referenced === target) return;
    }
    const byName = holder.columns.get(`${hint}Id`);
    if (byName !== undefined && holder.references.has(byName)) return;
    const column = `${snakeCase(hint)}_id`;
    if (holder.physical.has(column)) return;

    const attribute: AttributeDocument = { name: column, type: "string", fk: true };
    if (optional) attribute.optional = true;
    if (derivedReferenceTable(column) !== tableOf(target)) attribute.references = target;
    attribute.help = help;
    map(["entities", holder.index, "attributes", holder.document.attributes.length], at);
    holder.document.attributes.push(attribute);
    holder.physical.add(column);
    holder.references.set(column, target);
    note(
      "info",
      "CEDM140",
      `${holder.source.name} gains the key column "${column}" for its relationship to ${target}.`,
      at
    );
  };

  for (const item of pending) {
    if (item.paired) continue;
    const { entity, relationship, end, index } = item;
    const at: DocumentPath = ["entities", entity.index, "relationships", index];
    const other = counterpart(item);
    const target = stateByName.get(relationship.target) as EntityState;

    if (other) {
      other.paired = true;
      item.paired = true;
      const otherAt: DocumentPath = ["entities", other.entity.index, "relationships", other.index];
      const [many, one] = isMany(end) ? [item, other] : [other, item];
      if (isMany(many.end) && isMany(one.end)) {
        // Many-to-many: no key column; the two ends must agree.
        const both = many.end === one.end ? many.end : "zero-or-more";
        if (many.end !== one.end) {
          note(
            "info",
            "CEDM132",
            `${entity.source.name}.${relationship.name} pairs ${END_CARDINALITY[many.end]} with ${END_CARDINALITY[one.end]}; the application relates them as 0..* both ways.`,
            at
          );
        }
        const label = labelOf(many.relationship, true);
        emit(
          {
            from: many.entity.source.name,
            fromCardinality: both,
            to: many.relationship.target,
            toCardinality: both,
            ...(label !== undefined ? { label } : {}),
          },
          isMany(end) ? at : otherAt
        );
        continue;
      }
      if (!isMany(many.end)) {
        // One-to-one, declared on both sides. The key sits on the side that
        // cannot exist without the other (cardinality 1); failing that, on the
        // side that already holds a reference to the other; failing that, on
        // the one declared first.
        const holdsReference = (side: PendingRelationship, referenced: string) =>
          [...side.entity.references.values()].includes(referenced);
        const a = item;
        const b = other;
        const holder =
          a.end === "exactly-one" && b.end !== "exactly-one"
            ? a
            : b.end === "exactly-one" && a.end !== "exactly-one"
              ? b
              : holdsReference(b, a.entity.source.name) && !holdsReference(a, b.entity.source.name)
                ? b
                : a;
        const both: RelationshipEnd =
          a.end === "zero-or-one" && b.end === "zero-or-one" ? "zero-or-one" : "exactly-one";
        const label = labelOf(holder.relationship, false);
        const holderAt = holder === a ? at : otherAt;
        emit(
          {
            from: holder.relationship.target,
            fromCardinality: both,
            to: holder.entity.source.name,
            toCardinality: both,
            ...(label !== undefined ? { label } : {}),
          },
          holderAt
        );
        ensureForeignKey(
          holder.entity,
          holder.relationship.target,
          holder.relationship.foreignKey,
          holder.relationship.name,
          holder.end === "zero-or-one",
          holderAt,
          keyHelp(holder.relationship, holder.entity.source.name)
        );
        continue;
      }
      // One-to-many: recorded from the "one" side; the key sits on the many side.
      const label = labelOf(many.relationship, true);
      emit(
        {
          from: many.entity.source.name,
          fromCardinality: "exactly-one",
          to: many.relationship.target,
          toCardinality: many.end,
          ...(label !== undefined ? { label } : {}),
        },
        many === item ? at : otherAt
      );
      ensureForeignKey(
        one.entity,
        one.relationship.target,
        one.relationship.foreignKey,
        one.relationship.name,
        one.end === "zero-or-one",
        many === item ? otherAt : at,
        keyHelp(one.relationship, one.entity.source.name)
      );
      continue;
    }

    const inverse =
      relationship.inverseCardinality !== undefined
        ? CARDINALITY_END[relationship.inverseCardinality]
        : undefined;

    if (isMany(end)) {
      const fromEnd = inverse ?? "exactly-one";
      const label = labelOf(relationship, true);
      emit(
        {
          from: entity.source.name,
          fromCardinality: fromEnd,
          to: relationship.target,
          toCardinality: end,
          ...(label !== undefined ? { label } : {}),
        },
        at
      );
      if (!isMany(fromEnd)) {
        // One-to-many declared on the "one" side only: the key sits on the target.
        ensureForeignKey(
          target,
          entity.source.name,
          relationship.foreignKey,
          target === entity ? `parent${entity.source.name}` : lowerFirst(entity.source.name),
          relationship.ownership !== "aggregate",
          at,
          `The ${entity.source.name} this ${target.source.name} belongs to.`
        );
      }
      continue;
    }

    const label = labelOf(relationship, false);
    if (inverse === undefined) {
      // A to-one reference with nothing said about the other side: the many
      // side of a one-to-many the target owns.
      emit(
        {
          from: relationship.target,
          fromCardinality: "exactly-one",
          to: entity.source.name,
          toCardinality: "zero-or-more",
          ...(label !== undefined ? { label } : {}),
        },
        at
      );
    } else {
      emit(
        {
          from: entity.source.name,
          fromCardinality: inverse,
          to: relationship.target,
          toCardinality: end,
          ...(label !== undefined ? { label } : {}),
        },
        at
      );
    }
    ensureForeignKey(
      entity,
      relationship.target,
      relationship.foreignKey,
      relationship.name,
      end === "zero-or-one",
      at,
      keyHelp(relationship, entity.source.name)
    );
  }

  /* ---- lifecycles --------------------------------------------------------- */
  const stateMachines: StateMachineDocument[] = [];
  states.forEach((state) => {
    const lifecycles = state.source.lifecycle;
    if (lifecycles === undefined) return;
    const list = Array.isArray(lifecycles) ? lifecycles : [lifecycles];
    list.forEach((lifecycle, index) => {
      const at: DocumentPath = Array.isArray(lifecycles)
        ? ["entities", state.index, "lifecycle", index]
        : ["entities", state.index, "lifecycle"];
      if (!lifecycle.transitions?.length) {
        note(
          "info",
          "CEDM150",
          `${state.source.name}'s lifecycle declares no transitions, so no state machine is generated for it.`,
          at
        );
        return;
      }
      map(["stateMachines", stateMachines.length], at);
      stateMachines.push(lowerLifecycle(state.source.name, lifecycle));
    });
  });

  /* ---- invariants ----------------------------------------------------------- */
  const rules: RuleDocument[] = [];
  (cedm.rules ?? []).forEach((rule, index) => {
    map(["rules", rules.length], ["rules", index]);
    rules.push(rule);
  });
  states.forEach((state) => {
    const checked = (state.source.invariants ?? [])
      .map((invariant, index) => ({ invariant, index }))
      .filter(({ invariant }) => invariant.violatedWhen !== undefined);
    if (!checked.length) return;
    const events = new Set<string>();
    for (const { invariant } of checked) {
      for (const event of invariant.events ?? INVARIANT_EVENTS) events.add(event);
    }
    for (const event of events) {
      const applicable = checked.filter(({ invariant }) =>
        (invariant.events ?? INVARIANT_EVENTS).includes(event)
      );
      const first = applicable[0];
      if (!first) continue;
      map(["rules", rules.length], ["entities", state.index, "invariants", first.index]);
      rules.push({
        name: `${lowerFirst(state.source.name)}Invariants${pascalCase(event)}`,
        title: `${state.source.name} invariants (${event})`,
        entity: state.source.name,
        event,
        nodes: [
          { id: "S", label: `Start: ${state.source.name} ${event}`, type: "start" },
          { id: "E", label: "End: invariants hold", type: "end" },
        ],
        edges: [{ from: "S", to: "E" }],
        actions: applicable.map(({ invariant }) => ({
          name: invariant.id.replace(/[^\w-]/g, "_"),
          type: "validation-error",
          when: invariant.violatedWhen as string,
          props: { message: (invariant.message ?? invariant.rule).replace(/\s+/g, " ").trim() },
        })),
      });
    }
  });

  /* ---- authorization ---------------------------------------------------- */
  const rbac: RbacDocument[] = [];
  (cedm.authorization?.permissions ?? []).forEach((permission, index) => {
    const at: DocumentPath = ["authorization", "permissions", index];
    if (permission.effect === "deny") {
      note(
        "error",
        "CEDM160",
        `A deny permission (${permission.resource} ${permission.action}) cannot be generated: the application's access rules are additive grants. Express it by granting the action only to the roles that may perform it.`,
        at
      );
      return;
    }
    if (permission.scope !== undefined) {
      note(
        "error",
        "CEDM161",
        `A scoped permission (${permission.resource} ${permission.action}, scope ${permission.scope}) cannot be generated: the application grants per role, not per scope.`,
        at
      );
      return;
    }
    map(["rbac", rbac.length], at);
    rbac.push({
      entity: permission.resource,
      action: permission.action,
      roles: Array.isArray(permission.subject) ? [...permission.subject] : [permission.subject],
    });
  });

  /* ---- the document ------------------------------------------------------- */
  const document: ModelDocument = { eml: "1.0", entities: states.map((state) => state.document) };
  if (cedm.application?.name !== undefined) document.name = cedm.application.name;
  if (cedm.application?.version !== undefined) document.version = cedm.application.version;
  if (cedm.application?.description !== undefined) {
    document.description = cedm.application.description;
  }
  if (enums.length) document.enums = enums;
  const passThrough = (
    key: "categories" | "hooks" | "hookFlows" | "triggers" | "reports" | "sagas",
    value: unknown[] | undefined,
    source: DocumentPath
  ) => {
    if (!value?.length) return;
    for (let index = 0; index < value.length; index++) map([key, index], [...source, index]);
    (document as unknown as Record<string, unknown>)[key] = value;
  };
  passThrough("categories", cedm.ui?.categories, ["ui", "categories"]);
  if (relationships.length) document.relationships = relationships;
  passThrough("hooks", cedm.hooks, ["hooks"]);
  passThrough("hookFlows", cedm.hookFlows, ["hookFlows"]);
  if (rbac.length) document.rbac = rbac;
  passThrough("triggers", cedm.triggers, ["triggers"]);
  passThrough("reports", cedm.reports, ["reports"]);
  if (rules.length) document.rules = rules;
  if (stateMachines.length) document.stateMachines = stateMachines;
  passThrough("sagas", cedm.processes, ["processes"]);

  // Hook fields name columns; accept the attribute names CEDM writes.
  if (document.hooks) {
    document.hooks = document.hooks.map((hook) => {
      const state = stateByName.get(hook.entity);
      if (!hook.fields || !state) return hook;
      return { ...hook, fields: hook.fields.map((field) => state.columns.get(field) ?? field) };
    });
  }

  return { document, notes, sources };
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                     */
/* -------------------------------------------------------------------------- */

export function identityKeys(entity: CedmEntity): string[] {
  const key = entity.identity?.key;
  if (key === undefined || key === null) return [];
  return Array.isArray(key) ? key : [key];
}

/** A CEDM type → the model language's type token. */
export function lowerType(
  type: string,
  attribute: Pick<CedmAttribute, "keyType" | "maxLength"> | undefined
): { token: string; reference: boolean } {
  const lower = type.toLowerCase();
  if (lower === "reference") return { token: attribute?.keyType ?? "string", reference: true };
  if (lower === "enum") return { token: "string", reference: false };
  const mapped = CEDM_TYPE_TOKENS[lower];
  if (mapped !== undefined) return { token: mapped, reference: false };
  if (attribute?.maxLength !== undefined && LENGTH_TYPES.has(lower)) {
    return { token: `${type}(${attribute.maxLength})`, reference: false };
  }
  return { token: type, reference: false };
}

function lowerAttribute(
  entity: CedmEntity,
  attribute: CedmAttribute,
  column: string,
  isKey: boolean,
  dangling: boolean
): { attribute: AttributeDocument; reference: boolean; enumValues?: string[] } {
  const typed = lowerType(attribute.type, attribute);
  const token = typed.token;
  const reference = typed.reference && !dangling;
  const lowered: AttributeDocument = { name: column, type: token };
  if (isKey) lowered.pk = true;
  if (reference) lowered.fk = true;
  if (attribute.unique) lowered.unique = true;
  if (attribute.required === false) lowered.optional = true;
  if (attribute.comment !== undefined) lowered.comment = attribute.comment;

  let enumValues: string[] | undefined;
  if (attribute.enum !== undefined) {
    lowered.enum = attribute.enum;
  } else if (attribute.values !== undefined) {
    lowered.enum = attribute.enumName ?? `${entity.name}${pascalCase(attribute.name)}`;
    enumValues = attribute.values.map(String);
  }

  const help = composeHelp(attribute.help) ?? attribute.description;
  if (help !== undefined) lowered.help = help;
  if (attribute.ui !== undefined) lowered.ui = attribute.ui;
  if (attribute.default !== undefined) {
    lowered.default =
      typeof attribute.default === "object"
        ? JSON.stringify(attribute.default)
        : String(attribute.default);
  }
  if (attribute.minimum !== undefined) lowered.min = attribute.minimum;
  if (attribute.maximum !== undefined) lowered.max = attribute.maximum;
  if (attribute.format !== undefined) lowered.format = attribute.format;
  if (reference && attribute.target !== undefined) {
    if (derivedReferenceTable(column) !== tableOf(attribute.target)) {
      lowered.references = attribute.target;
    }
  }
  return { attribute: lowered, reference, ...(enumValues ? { enumValues } : {}) };
}

function lowerLifecycle(entity: string, lifecycle: CedmLifecycle): StateMachineDocument {
  const machine: StateMachineDocument = {
    name: lifecycle.name ?? `${entity}Lifecycle`,
    entity,
    states: [...lifecycle.states],
    transitions: (lifecycle.transitions ?? []).map((transition) => ({
      from: transition.from,
      to: transition.to,
      ...(transition.action !== undefined ? { trigger: transition.action } : {}),
    })),
  };
  if (lifecycle.title !== undefined) machine.title = lifecycle.title;
  // A lifecycle that names no initial state starts in the first state it lists:
  // CEDM lists a lifecycle's states in the order a record passes through them,
  // and the generated API needs a state to create a record in.
  const initial = lifecycle.initial ?? lifecycle.states[0];
  if (initial !== undefined) machine.initial = initial;
  if (lifecycle.terminal !== undefined) machine.final = [...lifecycle.terminal];
  return machine;
}
