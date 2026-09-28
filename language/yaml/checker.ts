/**
 * The language checker, over the model document.
 *
 * A model is a YAML document, and by the time it reaches this module it has
 * already passed the two layers that are about its *form*: it parses as YAML,
 * and it satisfies `eml.schema.json`. Everything the schema can say — a key
 * that does not exist, a hook event that is not one of the thirteen, a
 * cardinality that is not one of the four, a report whose query does not open
 * with SELECT or WITH — it has said. What is left is what the schema cannot
 * express: the rules that relate one part of a model to another. Does the
 * foreign key have a relationship behind it? Does the state machine's status
 * column hold a declared vocabulary? Does the saga step read a variable some
 * earlier step published? Is the help text a description or the column name
 * again in prose?
 *
 * Each finding carries the document path of the construct it is about, so the
 * reader can place it at the YAML line and column the author edits. The codes
 * are the language's stable diagnostic codes (`EML101`, `EML264`, …); a code
 * keeps its meaning for as long as the language has it.
 *
 * Deliberately free of I/O and of any import outside `language/`: the CLI, the
 * generator, the modelling tool and the browser bundle all run this same
 * function.
 */

import { type LanguageDefinition, loadLanguageDefinition, stepNodeTypes } from "../index";
import type {
  AttributeDocument,
  DocumentPath,
  EntityDocument,
  ModelDocument,
  RuleDocument,
  SagaDocument,
  StateMachineDocument,
} from "./document";

export type Severity = "error" | "warning" | "info";

export interface ModelIssue {
  severity: Severity;
  code: string;
  message: string;
  /** The construct the finding is about. Empty for the document itself. */
  path: DocumentPath;
  /** A short, actionable way to resolve it. */
  hint?: string;
}

/* -------------------------------------------------------------------------- */
/*  Naming rules the generator applies, restated for the checker               */
/* -------------------------------------------------------------------------- */

/**
 * Column names the generator and the state machines both treat as the record's
 * lifecycle. A state machine tracks one of these (EML500), and the Application
 * Dictionary gives it a List reference only when the column names an enum
 * (EML146).
 */
export const LIFECYCLE_COLUMN_NAMES = new Set(["status", "state", "stage"]);

/**
 * Column names every generated table already carries: the optimistic-lock
 * counter, the audit pair and the soft-delete pair. A model that declares one
 * gets EML103 — PostgreSQL refuses a CREATE TABLE that names a column twice.
 */
export const MANAGED_COLUMN_NAMES = new Set([
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
]);

/**
 * Foreign-key column names that carry no suffix but still name a person by
 * role. Mirrors `foreignKeys.personRoleColumns.names` in appwithai-language.json
 * and the six other places that resolve a lookup's target table.
 */
const PERSON_ROLE_COLUMN_NAMES = new Set([
  "assigned_to",
  "author_id",
  "lab_manager_id",
  "manager_id",
  "owner_id",
  "pi_id",
  "remediation_owner",
  "remediation_owner_id",
  "user_id",
]);

/** Whether a foreign key names a person by the role they played, not by entity. */
export function isPersonRoleColumn(columnName: string): boolean {
  return (
    columnName.endsWith("_by") ||
    columnName.endsWith("_by_id") ||
    PERSON_ROLE_COLUMN_NAMES.has(columnName)
  );
}

/**
 * Whether a column name is one the generator can resolve to a table at all.
 * Mirrors `isForeignKeyColumnName` in packages/core/src/types/bus-entity.types.ts.
 */
export function isForeignKeyColumnName(columnName: string): boolean {
  return columnName.endsWith("_id") || columnName.endsWith("_by") || isPersonRoleColumn(columnName);
}

/** A literal for use inside a constructed RegExp. */
function escapeRe(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `KYCRecord` → `kyc_record`: the generator's snake case, acronyms kept whole. */
function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;
const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;

/** The CRUD operations and aliases an `rbac` action may name. */
const CRUD_ACTIONS = new Set([
  "create",
  "insert",
  "add",
  "read",
  "view",
  "select",
  "list",
  "update",
  "edit",
  "write",
  "modify",
  "delete",
  "remove",
  "destroy",
  "*",
  "all",
  "any",
]);

/* -------------------------------------------------------------------------- */
/*  The columns a model's entity actually has                                  */
/* -------------------------------------------------------------------------- */

interface Column {
  /** Index in the document's `attributes`, or -1 for the key the generator adds. */
  index: number;
  name: string;
  type: string;
  pk: boolean;
  fk: boolean;
  optional: boolean;
  enum?: string;
  help?: string;
}

/**
 * An entity's columns as the generator sees them.
 *
 * The generator gives an entity an `id` key when it declares no `id` and no
 * `*_id` column, so the checker counts that key too: an entity that declares
 * `code` as its primary key and references nothing ends up with two, and
 * EML113 is exactly the report that keeps it from reaching the database.
 */
function columnsOf(entity: EntityDocument): Column[] {
  const columns: Column[] = entity.attributes.map((attribute: AttributeDocument, index) => ({
    index,
    name: attribute.name,
    type: attribute.type,
    pk: attribute.pk === true,
    fk: attribute.fk === true,
    optional: attribute.optional === true,
    ...(attribute.enum !== undefined ? { enum: attribute.enum } : {}),
    ...(attribute.help !== undefined ? { help: attribute.help } : {}),
  }));
  const hasKey = columns.some((column) => column.name === "id" || column.name.endsWith("_id"));
  if (!hasKey) {
    columns.unshift({
      index: -1,
      name: "id",
      type: "string",
      pk: true,
      fk: false,
      optional: false,
    });
  }
  return columns;
}

/* -------------------------------------------------------------------------- */
/*  The engine                                                                  */
/* -------------------------------------------------------------------------- */

type IssueOptions = { hint?: string };

class ModelChecker {
  private readonly issues: ModelIssue[] = [];
  private readonly definition: LanguageDefinition = loadLanguageDefinition();
  private readonly hookEvents: Set<string>;
  private readonly entities: EntityDocument[];
  private readonly entityIndex = new Map<string, number>();
  private readonly columns = new Map<string, Column[]>();

  constructor(private readonly document: ModelDocument) {
    this.hookEvents = new Set(this.definition.hooks.types.map((hook) => hook.type));
    this.entities = document.entities;
    this.entities.forEach((entity, index) => {
      if (!this.entityIndex.has(entity.name)) this.entityIndex.set(entity.name, index);
      if (!this.columns.has(entity.name)) this.columns.set(entity.name, columnsOf(entity));
    });
  }

  private add(
    severity: Severity,
    code: string,
    message: string,
    path: DocumentPath,
    options?: IssueOptions
  ) {
    this.issues.push({
      severity,
      code,
      message,
      path,
      ...(options?.hint ? { hint: options.hint } : {}),
    });
  }
  private error(code: string, message: string, path: DocumentPath, options?: IssueOptions) {
    this.add("error", code, message, path, options);
  }
  private warn(code: string, message: string, path: DocumentPath, options?: IssueOptions) {
    this.add("warning", code, message, path, options);
  }
  private info(code: string, message: string, path: DocumentPath, options?: IssueOptions) {
    this.add("info", code, message, path, options);
  }

  private declares(entity: string): boolean {
    return this.entityIndex.has(entity);
  }

  private entityPath(name: string): DocumentPath {
    const index = this.entityIndex.get(name);
    return index === undefined ? [] : ["entities", index];
  }

  /** Where a column is declared — the entity itself for the key the generator adds. */
  private columnPath(entity: string, column: Column): DocumentPath {
    const at = this.entityPath(entity);
    return column.index < 0 ? at : [...at, "attributes", column.index];
  }

  /** The entity a foreign key column resolves to, by the generator's naming rule. */
  private fkTarget(column: string): string {
    if (isPersonRoleColumn(column)) return this.personEntity();
    const base = column.slice(0, -3);
    return base.replace(/(^|_)([a-z])/g, (_match, _separator, letter: string) =>
      letter.toUpperCase()
    );
  }

  private personEntity(): string {
    for (const candidate of ["User", "Staff", "Employee"]) {
      if (this.declares(candidate)) return candidate;
    }
    return "User";
  }

  /**
   * The foreign key an entity would link to a parent on — the rule EML148 and
   * the dictionary seed both use, so a parent the checker suggests is one the
   * `parent:` key will then accept.
   */
  private linkColumnTo(entity: string, parent: string): Column | undefined {
    const snake = snakeCase(parent);
    return (this.columns.get(entity) ?? []).find(
      (column) =>
        column.fk && (column.name === `${snake}_id` || column.name.startsWith(`${snake}_`))
    );
  }

  run(): ModelIssue[] {
    this.checkDocument();
    this.checkEntities();
    this.checkRelationships();
    this.checkEnums();
    this.checkEnumBindings();
    this.checkIndexes();
    this.checkParents();
    this.checkLineItems();
    this.checkHelpText();
    this.checkHooks();
    this.checkRbac();
    this.checkTriggers();
    this.checkReports();
    this.checkRuleActions();
    this.checkRules();
    this.checkStateMachines();
    this.checkSagas();
    this.checkHookFlows();
    this.checkCrossReferences();
    return this.issues;
  }

  /* ---------------------------------------------------------------------- */
  /*  EML001–EML009: the document                                            */
  /* ---------------------------------------------------------------------- */

  private checkDocument(): void {
    if (this.document.name === undefined) {
      this.warn("EML001", "The model has no name.", [], {
        hint: "Add  name: <YourModelName>  at the top of the document.",
      });
    }

    const workflows =
      (this.document.stateMachines?.length ?? 0) +
      (this.document.sagas?.length ?? 0) +
      (this.document.hookFlows?.length ?? 0);
    if (this.entities.length === 0 && !(this.document.rules?.length ?? 0) && workflows === 0) {
      this.error("EML004", "Empty model: no entities, rules or workflows.", ["entities"], {
        hint: "Declare at least one entity under  entities:.",
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML100–EML119: entities and their columns                              */
  /* ---------------------------------------------------------------------- */

  private checkEntities(): void {
    const seen = new Map<string, number>();

    this.entities.forEach((entity, index) => {
      const path: DocumentPath = ["entities", index];

      const first = seen.get(entity.name);
      if (first !== undefined) {
        this.error("EML101", `Duplicate entity "${entity.name}".`, path, {
          hint: `First declared at entities[${first}]. Merge the two into one entity.`,
        });
        return;
      }
      seen.set(entity.name, index);

      if (entity.attributes.length === 0) {
        this.warn("EML102", `Entity "${entity.name}" has no attributes.`, path, {
          hint: "The generator adds an  id  key; declare the columns the entity holds.",
        });
      }

      this.checkColumns(entity);
    });
  }

  private checkColumns(entity: EntityDocument): void {
    const columns = this.columns.get(entity.name) ?? [];
    const seen = new Map<string, number>();
    let keys = 0;

    for (const column of columns) {
      const path = this.columnPath(entity.name, column);

      // EML111: snake_case is the language's convention for columns.
      if (!SNAKE_CASE.test(column.name) && column.name !== column.name.toUpperCase()) {
        this.info("EML111", `Attribute "${entity.name}.${column.name}" is not snake_case.`, path, {
          hint: "snake_case is the convention for column names (first_name, order_id).",
        });
      }

      // EML112: a column declared twice.
      const previous = seen.get(column.name);
      if (previous !== undefined) {
        this.warn("EML112", `Duplicate attribute "${entity.name}.${column.name}".`, path, {
          hint: `First declared at attributes[${previous}]. Remove the duplicate.`,
        });
      } else {
        seen.set(column.name, column.index);
      }

      // EML113: more than one primary key.
      if (column.pk) {
        keys++;
        if (keys > 1) {
          this.error(
            "EML113",
            `Entity "${entity.name}" declares more than one primary key (found "${column.name}").`,
            path,
            {
              hint:
                column.index < 0
                  ? "The generator adds an  id  key to an entity with no  id  or  *_id  column. Name the key  id, or remove  pk  from the other column."
                  : "An entity has exactly one primary key. Remove  pk  from the extra column.",
            }
          );
        }
      }

      // EML114: a foreign key the generator cannot resolve by name.
      if (column.fk && !column.name.endsWith("_id")) {
        const byRole = column.name.endsWith("_by");
        this.warn(
          "EML114",
          `Foreign key "${entity.name}.${column.name}" does not end with "_id".`,
          path,
          {
            hint: byRole
              ? `Rename it "${column.name}_id" — a _by column names a person by role, so it resolves to the user entity.`
              : `Rename it "${column.name}_id" so the generator can derive the table it references.`,
          }
        );
      }

      // EML119: a column shaped like a reference that is not marked as one.
      // Without `fk` the Application Dictionary records it as a String, and
      // the form shows the raw id instead of a lookup on the referenced table.
      if (!column.fk && !column.pk && isForeignKeyColumnName(column.name)) {
        const target = this.fkTarget(column.name);
        if (this.declares(target)) {
          this.warn(
            "EML119",
            `Column "${entity.name}.${column.name}" looks like a reference to "${target}" but is not marked fk.`,
            path,
            {
              hint: `Add  fk: true. Without it the column is recorded as String and the form shows the raw id instead of a "${target}" lookup.`,
            }
          );
        }
      }

      // EML103: a column the generator adds to every table.
      if (MANAGED_COLUMN_NAMES.has(column.name.toLowerCase()) && !column.pk) {
        this.warn(
          "EML103",
          `Column "${entity.name}.${column.name}" is added by the generator.`,
          path,
          {
            hint: `Every table carries ${[...MANAGED_COLUMN_NAMES].join(", ")} already. Remove it: the generator's own definition is used.`,
          }
        );
      }

      // EML115: a type the language does not define, which becomes a string.
      const base = column.type.replace(/\([\d,]+\)$/, "").toLowerCase();
      if (base !== "string" && !(base in this.definition.types.map)) {
        this.warn(
          "EML115",
          `Unknown type "${column.type}" on "${entity.name}.${column.name}"; it is generated as a string.`,
          path,
          {
            hint: `Valid types: ${this.definition.types.canonical.join(", ")}, plus the aliases in appwithai-language.json.`,
          }
        );
      }

      // EML116: a key cannot be optional.
      if (column.pk && column.optional) {
        this.error(
          "EML116",
          `Primary key "${entity.name}.${column.name}" is marked optional.`,
          path,
          {
            hint: "Remove  optional: true  — a primary key is always required.",
          }
        );
      }
    }

    if (keys === 0 && columns.length > 0) {
      this.warn(
        "EML117",
        `Entity "${entity.name}" has no primary key.`,
        this.entityPath(entity.name),
        {
          hint: "Add  { name: id, type: uuid, pk: true }  as the first attribute, or mark an existing one  pk: true.",
        }
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML120–EML129: relationships                                           */
  /* ---------------------------------------------------------------------- */

  private checkRelationships(): void {
    const seen = new Map<string, number>();

    (this.document.relationships ?? []).forEach((relationship, index) => {
      const path: DocumentPath = ["relationships", index];
      const { from, to } = relationship;

      if (!this.declares(from)) {
        this.error(
          "EML120",
          `Relationship references undeclared entity "${from}".`,
          [...path, "from"],
          {
            hint: `Declare "${from}" under  entities:, or correct the name.`,
          }
        );
      }
      if (!this.declares(to)) {
        this.error(
          "EML121",
          `Relationship references undeclared entity "${to}".`,
          [...path, "to"],
          {
            hint: `Declare "${to}" under  entities:, or correct the name.`,
          }
        );
      }

      if (from === to) {
        this.info("EML123", `Self-referential relationship on "${from}".`, path, {
          hint: "Valid for a hierarchy; make sure the entity carries the parent reference, e.g.  parent_category_id.",
        });
      }

      const key = `${from}|${relationship.fromCardinality}|${relationship.toCardinality}|${to}`;
      const first = seen.get(key);
      if (first !== undefined) {
        this.warn("EML124", `Duplicate relationship between "${from}" and "${to}".`, path, {
          hint: `Declared already at relationships[${first}]. Remove the duplicate.`,
        });
      } else {
        seen.set(key, index);
      }

      // EML125: the many side should carry the foreign key.
      const kind = this.definition.cardinalities.map.find(
        (entry) =>
          entry.from === relationship.fromCardinality && entry.to === relationship.toCardinality
      )?.kind;
      if (
        (kind === "oneToMany" || kind === "manyToOne") &&
        this.declares(from) &&
        this.declares(to)
      ) {
        const many = kind === "manyToOne" ? from : to;
        const one = kind === "manyToOne" ? to : from;
        const columns = this.columns.get(many) ?? [];
        const expected = `${snakeCase(one).replace(/^bus_/, "")}_id`;
        if (
          columns.length > 0 &&
          !columns.some((column) => column.fk || column.name === expected)
        ) {
          this.info(
            "EML125",
            `No foreign key in "${many}" for its relationship to "${one}".`,
            path,
            {
              hint: `Add  { name: ${expected}, type: uuid, fk: true }  to "${many}".`,
            }
          );
        }
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML130–EML139: enums                                                   */
  /* ---------------------------------------------------------------------- */

  private checkEnums(): void {
    const seen = new Map<string, number>();

    (this.document.enums ?? []).forEach((declared, index) => {
      const path: DocumentPath = ["enums", index];

      const first = seen.get(declared.name);
      if (first !== undefined) {
        this.warn("EML131", `Duplicate enum "${declared.name}".`, path, {
          hint: `First declared at enums[${first}]; only that one is used. Merge the values into it.`,
        });
      } else {
        seen.set(declared.name, index);
      }

      const values = new Set<string>();
      declared.values.forEach((value, position) => {
        if (values.has(value)) {
          this.warn(
            "EML133",
            `Duplicate value "${value}" in enum "${declared.name}".`,
            [...path, "values", position],
            {
              hint: "Remove the duplicate value.",
            }
          );
        }
        values.add(value);
        if (!/^[A-Za-z0-9_-]+$/.test(value)) {
          this.warn(
            "EML134",
            `Enum "${declared.name}" value "${value}" contains characters other than letters, digits, "_" and "-".`,
            [...path, "values", position],
            {
              hint: "A value is stored and compared as written; keep it to a slug for safe serialisation.",
            }
          );
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML140–EML146: what a column's options refer to                        */
  /* ---------------------------------------------------------------------- */

  private checkEnumBindings(): void {
    const enums = new Set((this.document.enums ?? []).map((declared) => declared.name));
    const machines = new Set((this.document.stateMachines ?? []).map((machine) => machine.entity));

    for (const entity of this.entities) {
      entity.attributes.forEach((attribute, index) => {
        const path: DocumentPath = [...this.entityPath(entity.name), "attributes", index];

        // EML144: the enum a column names has to be declared.
        if (attribute.enum !== undefined && !enums.has(attribute.enum)) {
          this.error(
            "EML144",
            `Column "${entity.name}.${attribute.name}" names undeclared enum "${attribute.enum}".`,
            [...path, "enum"],
            { hint: `Declare it under  enums:  as  { name: ${attribute.enum}, values: [...] }.` }
          );
        }

        // EML145: min and max are bounds.
        for (const key of ["min", "max"] as const) {
          const bound = attribute[key];
          if (bound !== undefined && Number.isNaN(Number(String(bound).trim()))) {
            this.warn(
              "EML145",
              `Column "${entity.name}.${attribute.name}" has a non-numeric ${key}: "${bound}".`,
              [...path, key],
              { hint: `${key} is a number, e.g.  ${key}: 0.` }
            );
          }
        }

        // EML146: a lifecycle column with no enum. `status` is one wherever
        // it appears; `state` and `stage` only where a state machine says so,
        // because `Address.state` is a region, not a lifecycle.
        if (
          LIFECYCLE_COLUMN_NAMES.has(attribute.name) &&
          (attribute.name === "status" || machines.has(entity.name)) &&
          attribute.enum === undefined
        ) {
          this.warn("EML146", `Column "${entity.name}.${attribute.name}" names no enum.`, path, {
            hint: `Declare  { name: ${entity.name}Status, values: [...] }  under  enums:  and set  enum: ${entity.name}Status  on the column. Without it the dictionary records free text, and the form accepts values the state machine cannot act on.`,
          });
        }
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML155: indexes                                                        */
  /* ---------------------------------------------------------------------- */

  private checkIndexes(): void {
    for (const entity of this.entities) {
      const names = new Set((this.columns.get(entity.name) ?? []).map((column) => column.name));
      (entity.indexes ?? []).forEach((index, position) => {
        const path: DocumentPath = [...this.entityPath(entity.name), "indexes", position];
        index.columns.forEach((column, at) => {
          if (!names.has(column)) {
            this.error(
              "EML155",
              `Index on "${entity.name}" names undeclared column "${column}".`,
              [...path, "columns", at],
              { hint: `Add "${column}" to "${entity.name}", or correct the name.` }
            );
          }
        });
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML147–EML150: line items                                              */
  /* ---------------------------------------------------------------------- */

  /**
   * `parent:` decides where an entity lives, so both halves are checked. A
   * parent nobody declared, or a child with no key back to it, leaves the line
   * item with nowhere to be shown: it loses its own window and gains no tab.
   */
  private checkParents(): void {
    this.entities.forEach((entity, index) => {
      const parent = entity.parent;
      if (parent === undefined) return;
      const path: DocumentPath = ["entities", index, "parent"];

      if (!this.declares(parent)) {
        this.error(
          "EML147",
          `"${entity.name}" names parent "${parent}", which is not declared.`,
          path,
          {
            hint: `Declare "${parent}", or name the entity that owns ${entity.name}.`,
          }
        );
      } else if (parent === entity.name) {
        this.error("EML147", `"${entity.name}" cannot be its own parent.`, path, {
          hint: "A line item belongs to a different entity. Remove  parent  if it has no owner.",
        });
      } else if (!this.linkColumnTo(entity.name, parent)) {
        this.error(
          "EML148",
          `"${entity.name}" names parent "${parent}" but has no foreign key to it.`,
          path,
          {
            hint: `Add  { name: ${snakeCase(parent)}_id, type: uuid, fk: true }  to ${entity.name}. The tab links its rows to the open ${parent} on that column.`,
          }
        );
      }
    });
  }

  private checkLineItems(): void {
    const parents = new Map<string, string>();
    for (const entity of this.entities) {
      if (entity.parent !== undefined) parents.set(entity.name, entity.parent);
    }

    // EML150: a child named in a category. A category lists what the
    // dashboard shows, and a child has no card there.
    const reported = new Set<string>();
    (this.document.categories ?? []).forEach((category, index) => {
      (category.entities ?? []).forEach((name, position) => {
        const parent = parents.get(name);
        if (parent === undefined || !this.declares(name) || reported.has(name)) return;
        reported.add(name);
        this.warn(
          "EML150",
          `"${name}" is a line item of "${parent}" but is listed in category "${category.name}".`,
          ["categories", index, "entities", position],
          {
            hint: `A category lists what the dashboard shows, and a line item has no card — it is reached by opening a ${parent}. Remove "${name}" from the list.`,
          }
        );
      });
    });

    // EML149: an entity shaped like a line item that never says so. Whether a
    // list of these records away from their owner is useful to anyone is a
    // question about the business, so this is information, not a fault.
    const LINE_ITEM_NOUNS = /(Line|LineItem|Item|Detail|Entry|Row)s?$/;
    const names = [...this.entityIndex.keys()];

    for (const entity of this.entities) {
      if (parents.has(entity.name)) continue;

      let candidate: string | undefined;
      for (const other of names) {
        if (other === entity.name || other.length < 3) continue;
        if (!entity.name.startsWith(other) || entity.name.length <= other.length) continue;
        if (!this.linkColumnTo(entity.name, other)) continue;
        if (!candidate || other.length > candidate.length) candidate = other;
      }

      if (!candidate && LINE_ITEM_NOUNS.test(entity.name)) {
        for (const column of this.columns.get(entity.name) ?? []) {
          if (!column.fk || column.pk) continue;
          if (!isForeignKeyColumnName(column.name) || isPersonRoleColumn(column.name)) continue;
          const target = this.fkTarget(column.name);
          const match = names.find(
            (name) => name !== entity.name && (name === target || name.endsWith(target))
          );
          if (match && this.linkColumnTo(entity.name, match)) {
            candidate = match;
            break;
          }
        }
      }

      if (!candidate) continue;
      const link = this.linkColumnTo(entity.name, candidate);
      this.info(
        "EML149",
        `"${entity.name}" looks like a line item of "${candidate}" but declares no parent.`,
        this.entityPath(entity.name),
        {
          hint:
            `If a list of every ${entity.name} away from its ${candidate} is not a screen anyone opens, ` +
            `set  parent: ${candidate}  — the dictionary then drops its dashboard card and gives it a tab ` +
            `inside the ${candidate} window, linked on ${link?.name}. If it is a thing in its own right, leave it.`,
        }
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML151–EML153: help text                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Whether help says nothing the reader could not already see. Help becomes
   * `sys_table.description` and `sys_column.description` — the hint under the
   * control and the manual's "what it is for" — so text that restates the name
   * fills the field and leaves the reader with nothing.
   */
  private restatedHelp(
    entity: string,
    column: string | undefined,
    text: string
  ): string | undefined {
    const body = text.trim().replace(/\.+$/, "").trim().toLowerCase();
    const own = (column ?? entity).replace(/[_.]+/g, " ").trim().toLowerCase();
    const of = entity.toLowerCase();

    if (/^unique identifier( for \w+)?$/.test(body)) return "restates the key";
    if (new RegExp(`^(the )?${escapeRe(own)}( for ${escapeRe(of)})?$`).test(body)) {
      return "is the name again, in prose";
    }
    if (new RegExp(`^${escapeRe(of)} is an? [\\w -]*(record|entity|table|object)\\b`).test(body)) {
      return "is a template sentence, not a description";
    }
    return undefined;
  }

  private checkHelpText(): void {
    for (const entity of this.entities) {
      if (this.entityIndex.get(entity.name) !== this.entities.indexOf(entity)) continue;
      const path = this.entityPath(entity.name);

      if (entity.help === undefined) {
        this.warn("EML152", `Entity "${entity.name}" has no help.`, path, {
          hint: "Add  help:  — what this record is for in the business, when one is created, and what distinguishes it from the entities it sounds like. It becomes sys_table.description and opens the entity's section of the manual.",
        });
      } else {
        const why = this.restatedHelp(entity.name, undefined, entity.help);
        if (why) {
          this.warn("EML151", `The help for "${entity.name}" ${why}.`, [...path, "help"], {
            hint: `"${entity.help.trim().slice(0, 60)}" tells a reader nothing the name did not. Say what the business does with these records.`,
          });
        }
      }

      // EML153: the columns nobody described, reported once for the entity.
      const undocumented = (this.columns.get(entity.name) ?? [])
        .filter((column) => !MANAGED_COLUMN_NAMES.has(column.name.toLowerCase()))
        .filter((column) => !column.pk)
        .filter((column) => column.help === undefined)
        .map((column) => column.name);
      if (undocumented.length > 0) {
        const shown = undocumented.slice(0, 6).join(", ");
        const rest = undocumented.length > 6 ? `, and ${undocumented.length - 6} more` : "";
        this.warn(
          "EML153",
          `${entity.name} has ${undocumented.length} column${undocumented.length === 1 ? "" : "s"} with no help.`,
          path,
          {
            hint: `Add  help:  to ${shown}${rest}. Each becomes sys_column.description — the hint under the control and the column's row in the manual.`,
          }
        );
      }

      entity.attributes.forEach((attribute, index) => {
        if (attribute.help === undefined) return;
        const why = this.restatedHelp(entity.name, attribute.name, attribute.help);
        if (why) {
          this.warn(
            "EML151",
            `The help for "${entity.name}.${attribute.name}" ${why}.`,
            [...path, "attributes", index, "help"],
            {
              hint: `"${attribute.help.trim().slice(0, 60)}" repeats the column name. Say why the value matters, what is expected in it, and what happens downstream.`,
            }
          );
        }
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML200–EML209: hooks                                                   */
  /* ---------------------------------------------------------------------- */

  private checkHooks(): void {
    const seen = new Map<string, number>();

    (this.document.hooks ?? []).forEach((hook, index) => {
      const path: DocumentPath = ["hooks", index];

      if (!this.declares(hook.entity)) {
        this.warn(
          "EML202",
          `Hook "${hook.handler}" is bound to undeclared entity "${hook.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${hook.entity}", or correct the name.`,
          }
        );
      } else {
        const names = new Set((this.columns.get(hook.entity) ?? []).map((column) => column.name));
        (hook.fields ?? []).forEach((field, position) => {
          if (!names.has(field)) {
            this.warn(
              "EML203",
              `Hook "${hook.handler}" names undeclared column "${hook.entity}.${field}".`,
              [...path, "fields", position],
              { hint: `Add "${field}" to "${hook.entity}", or correct the name.` }
            );
          }
        });
      }

      const key = `${hook.entity}|${hook.event}|${hook.handler}`;
      const first = seen.get(key);
      if (first !== undefined) {
        this.warn(
          "EML204",
          `Duplicate hook: ${hook.event} ${hook.handler} on ${hook.entity}.`,
          path,
          {
            hint: `Declared already at hooks[${first}]. Remove the duplicate.`,
          }
        );
      } else {
        seen.set(key, index);
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML210–EML219: access rules                                            */
  /*                                                                         */
  /*  An access rule that does not compile is not a rule that does nothing:  */
  /*  it is a restriction the author believes is in place and is not. So     */
  /*  every one of these is an error.                                        */
  /* ---------------------------------------------------------------------- */

  private checkRbac(): void {
    (this.document.rbac ?? []).forEach((rule, index) => {
      const path: DocumentPath = ["rbac", index];

      if (!this.declares(rule.entity)) {
        this.error(
          "EML213",
          `Access rule names undeclared entity "${rule.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${rule.entity}", or correct the name.`,
          }
        );
        return;
      }

      const action = rule.action.toLowerCase();
      if (CRUD_ACTIONS.has(action)) return;

      const triggers = this.transitionTriggers(rule.entity);
      if (triggers.has(action)) return;

      this.error(
        "EML214",
        `Access rule on ${rule.entity} names "${rule.action}", which is neither a CRUD operation nor a transition of ${rule.entity}.`,
        [...path, "action"],
        {
          hint: triggers.size
            ? `Use create, read, update, delete or * — or a transition of ${rule.entity}: ${[...triggers].join(", ")}.`
            : `Use create, read, update, delete or * — ${rule.entity} has no state machine to take a transition from.`,
        }
      );
    });
  }

  /** The transition triggers an entity's state machines declare, normalised. */
  private transitionTriggers(entity: string): Set<string> {
    const triggers = new Set<string>();
    for (const machine of this.document.stateMachines ?? []) {
      if (machine.entity !== entity) continue;
      for (const transition of machine.transitions) {
        if (transition.trigger) {
          triggers.add(
            transition.trigger
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_")
          );
        }
      }
    }
    return triggers;
  }

  /* ---------------------------------------------------------------------- */
  /*  EML230–EML239: triggers                                                */
  /* ---------------------------------------------------------------------- */

  private checkTriggers(): void {
    (this.document.triggers ?? []).forEach((trigger, index) => {
      const path: DocumentPath = ["triggers", index];

      if (trigger.source.startsWith("cron:")) {
        const expression = trigger.source.slice(5).trim();
        const fields = expression.split(/\s+/).length;
        if (fields < 5 || fields > 6) {
          this.warn(
            "EML231",
            `Trigger cron expression "${expression}" has ${fields} field(s); expected 5 or 6.`,
            [...path, "source"],
            { hint: "minute hour day-of-month month day-of-week, e.g.  cron:0 9 * * *." }
          );
        }
      }

      if (!this.declares(trigger.entity)) {
        this.warn(
          "EML232",
          `Trigger names undeclared entity "${trigger.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${trigger.entity}", or correct the name.`,
          }
        );
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML290–EML299: reports                                                 */
  /*                                                                         */
  /*  A report's query runs against a database this checker cannot see, so   */
  /*  what it checks is the shape: the query reads, a chart names what it    */
  /*  plots (the schema), and the entity it groups under exists.             */
  /* ---------------------------------------------------------------------- */

  private checkReports(): void {
    const seen = new Set<string>();

    (this.document.reports ?? []).forEach((report, index) => {
      const path: DocumentPath = ["reports", index];

      if (seen.has(report.name)) {
        this.error(
          "EML292",
          `Report "${report.name}" is declared more than once.`,
          [...path, "name"],
          {
            hint: "Report names are keys, and the later one replaces the earlier. Give it its own name.",
          }
        );
      }
      seen.add(report.name);

      if (!isSingleReadStatement(report.sql)) {
        this.error(
          "EML293",
          `Report "${report.name}" is not a single SELECT or WITH statement.`,
          [...path, "sql"],
          {
            hint: "A report reads. The application refuses to run anything else, so a write belongs in a rule or a hook.",
          }
        );
      }

      if (report.entity !== undefined && !this.declares(report.entity)) {
        this.warn(
          "EML295",
          `Report "${report.name}" names entity "${report.entity}", which the model does not declare.`,
          [...path, "entity"],
          {
            hint: "entity groups the report with its entity. Correct the name, or drop it if the report spans several.",
          }
        );
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML250–EML259 and EML280–EML289: rules and their actions               */
  /* ---------------------------------------------------------------------- */

  private checkRuleActions(): void {
    const contracts = new Map(
      (this.definition.ruleNodes.actions?.types ?? []).map((action) => [action.name, action])
    );
    const workflows = new Set(this.workflowNames());
    const triggered = new Set<string>();

    (this.document.rules ?? []).forEach((rule, ruleIndex) => {
      (rule.actions ?? []).forEach((action, index) => {
        const path: DocumentPath = ["rules", ruleIndex, "actions", index];
        const props = action.props ?? {};
        if (props.workflow?.trim()) triggered.add(props.workflow.trim());

        const contract = contracts.get(action.type);
        if (!contract) {
          this.error(
            "EML281",
            `Action "${action.name}" has unknown type "${action.type}".`,
            [...path, "type"],
            {
              hint: `Valid action types: ${[...contracts.keys()].join(", ")}.`,
            }
          );
          return;
        }

        const has = (key: string) =>
          ((key === "when" ? action.when : props[key]) ?? "").trim().length > 0;

        if (!has("when")) {
          this.warn(
            "EML282",
            `Action "${action.name}" has no "when" — it fires on every write.`,
            path,
            {
              hint: 'Add a condition, e.g.  when: severity == "critical". Write  when: "true"  to mean always on purpose.',
            }
          );
        }

        const missing = contract.required.filter((key) => !has(key));
        if (missing.length > 0) {
          this.error(
            "EML283",
            `Action "${action.name}" (${action.type}) is missing: ${missing.join(", ")}.`,
            path,
            {
              hint: `${action.type} requires ${contract.required.join(", ")}.`,
            }
          );
        }

        const workflow = props.workflow?.trim();
        if (action.type === "trigger-workflow" && workflow && !workflows.has(workflow)) {
          this.warn(
            "EML284",
            `Action "${action.name}" triggers workflow "${workflow}", which the model does not declare.`,
            [...path, "props", "workflow"],
            { hint: `Declare a saga named ${workflow} with  trigger: rule, or correct the name.` }
          );
        }

        // EML287: a condition naming a column that cannot exist. A rule reads
        // the record being written, and columns are snake_case, so a camelCase
        // identifier is undefined at evaluation: the rule never fires — or,
        // against `== null`, fires on every write and the entity cannot be
        // created at all.
        const condition = action.when?.trim();
        if (condition) {
          const camel = [
            ...new Set(
              (condition.match(/\b[a-z][A-Za-z0-9]*\b/g) ?? []).filter((identifier) =>
                /[a-z][A-Z]/.test(identifier)
              )
            ),
          ];
          if (camel.length > 0) {
            this.error(
              "EML287",
              `Action "${action.name}" tests ${camel.map((name) => `"${name}"`).join(", ")}, which no column is named.`,
              [...path, "when"],
              {
                hint: `Every column is snake_case: write ${camel.map(snakeCase).join(", ")}. A camelCase name is undefined when the rule runs.`,
              }
            );
          }
        }

        const known = new Set(["when", ...contract.required, ...(contract.optional ?? [])]);
        for (const key of Object.keys(props)) {
          if (!known.has(key)) {
            this.warn(
              "EML285",
              `Action "${action.name}" has unknown property "${key}".`,
              [...path, "props", key],
              {
                hint: `${action.type} understands: ${[...known].sort().join(", ")}.`,
              }
            );
          }
        }
      });
    });

    // EML286: a rule-triggered saga no action names never runs.
    (this.document.sagas ?? []).forEach((saga, index) => {
      if (saga.trigger !== "rule" || triggered.has(saga.name)) return;
      this.warn(
        "EML286",
        `Saga "${saga.name}" is rule-triggered but no rule action names it.`,
        ["sagas", index, "trigger"],
        {
          hint: `Add an action  { type: trigger-workflow, when: <condition>, props: { workflow: ${saga.name} } }  to a rule, or set  trigger: automatic.`,
        }
      );
    });
  }

  private checkRules(): void {
    const seen = new Set<string>();

    (this.document.rules ?? []).forEach((rule, index) => {
      const path: DocumentPath = ["rules", index];

      if (seen.has(rule.name)) {
        this.warn("EML504", `Duplicate rule name "${rule.name}".`, [...path, "name"], {
          hint: "Give each rule its own name.",
        });
      }
      seen.add(rule.name);

      if (!this.hookEvents.has(rule.event)) {
        this.error(
          "EML252",
          `Rule "${rule.name}" runs on unknown event "${rule.event}".`,
          [...path, "event"],
          {
            hint: `Valid events: ${[...this.hookEvents].join(", ")}.`,
          }
        );
      }

      if (!this.declares(rule.entity)) {
        this.warn(
          "EML307",
          `Rule "${rule.name}" is bound to undeclared entity "${rule.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${rule.entity}", or correct the name.`,
          }
        );
      }

      this.checkRuleGraph(rule, path);
    });
  }

  private checkRuleGraph(rule: RuleDocument, path: DocumentPath): void {
    const ids = new Map<string, number>();
    rule.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        this.error(
          "EML308",
          `Rule "${rule.name}" declares node "${node.id}" twice.`,
          [...path, "nodes", index, "id"],
          {
            hint: "Node ids are how edges refer to nodes. Give the second one its own id.",
          }
        );
      } else {
        ids.set(node.id, index);
      }
    });

    rule.edges.forEach((edge, index) => {
      for (const end of ["from", "to"] as const) {
        if (!ids.has(edge[end])) {
          this.error(
            "EML309",
            `Rule "${rule.name}" has an edge ${end} "${edge[end]}", which is not one of its nodes.`,
            [...path, "edges", index, end],
            { hint: `Declare a node with  id: ${edge[end]}, or correct the edge.` }
          );
        }
      }
    });

    const roles = ruleNodeRoles(rule);
    const inputs = rule.nodes.filter((node) => roles.get(node.id) === "inputNode");
    const outputs = rule.nodes.filter((node) => roles.get(node.id) === "outputNode");

    if (rule.nodes.length === 0) {
      this.warn("EML306", `Rule "${rule.name}" has no nodes.`, [...path, "nodes"], {
        hint: "Draw the decision: a start node, the decisions and actions, and an end node.",
      });
    }
    if (inputs.length === 0) {
      this.error("EML300", `Rule "${rule.name}" has no start node.`, [...path, "nodes"], {
        hint: "Add a node with  type: start  — the record the rule receives.",
      });
    } else if (inputs.length > 1) {
      this.warn(
        "EML301",
        `Rule "${rule.name}" has ${inputs.length} start nodes; expected 1.`,
        [...path, "nodes"],
        {
          hint: "A rule has exactly one start. Merge the extra ones.",
        }
      );
    }
    if (outputs.length === 0) {
      this.error("EML302", `Rule "${rule.name}" has no end node.`, [...path, "nodes"], {
        hint: "Add a node with  type: end  — the rule's outcome.",
      });
    }

    const outgoing = new Map<string, number>();
    for (const edge of rule.edges) outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);

    rule.nodes.forEach((node, index) => {
      if (node.type !== "decision") return;
      const count = outgoing.get(node.id) ?? 0;
      if (count < 2) {
        this.warn(
          "EML303",
          `Rule "${rule.name}": decision "${node.id}" (${node.label}) has ${count} outgoing edge(s).`,
          [...path, "nodes", index],
          { hint: "A decision branches: give it at least two outgoing edges, e.g. Yes and No." }
        );
      }
    });

    rule.edges.forEach((edge, index) => {
      const source = rule.nodes.find((node) => node.id === edge.from);
      if (source?.type === "decision" && edge.label === undefined) {
        this.warn(
          "EML304",
          `Rule "${rule.name}": an edge out of decision "${source.id}" has no label.`,
          [...path, "edges", index],
          {
            hint: "Label the branch with the condition it takes, e.g.  label: Yes.",
          }
        );
      }
    });

    if (rule.nodes.length > 0 && rule.edges.length > 0) {
      const start = inputs[0];
      const reached = new Set<string>();
      if (start) {
        const queue = [start.id];
        while (queue.length > 0) {
          const id = queue.shift()!;
          if (reached.has(id)) continue;
          reached.add(id);
          for (const edge of rule.edges)
            if (edge.from === id && !reached.has(edge.to)) queue.push(edge.to);
        }
      }
      rule.nodes.forEach((node, index) => {
        if (!reached.has(node.id) && roles.get(node.id) !== "inputNode") {
          this.warn(
            "EML305",
            `Rule "${rule.name}": node "${node.id}" (${node.label}) cannot be reached from the start.`,
            [...path, "nodes", index],
            { hint: "Connect it to the start or to a reachable node, or remove it." }
          );
        }
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML400–EML429: state machines                                          */
  /* ---------------------------------------------------------------------- */

  private checkStateMachines(): void {
    (this.document.stateMachines ?? []).forEach((machine, index) => {
      const path: DocumentPath = ["stateMachines", index];
      if (!this.declares(machine.entity)) {
        this.warn(
          "EML400",
          `State machine "${machine.name}" is bound to undeclared entity "${machine.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${machine.entity}", or correct the name.`,
          }
        );
      }
      this.checkStateMachine(machine, path);
    });
  }

  private checkStateMachine(machine: StateMachineDocument, path: DocumentPath): void {
    const declared = new Set(machine.states);

    machine.transitions.forEach((transition, index) => {
      for (const end of ["from", "to"] as const) {
        if (!declared.has(transition[end])) {
          this.error(
            "EML429",
            `State machine "${machine.name}" has a transition ${end} "${transition[end]}", which is not one of its states.`,
            [...path, "transitions", index, end],
            { hint: `Add "${transition[end]}" to  states:, or correct the transition.` }
          );
        }
      }
    });
    for (const [key, states] of [
      ["initial", machine.initial !== undefined ? [machine.initial] : []],
      ["final", machine.final ?? []],
    ] as const) {
      states.forEach((state, position) => {
        if (!declared.has(state)) {
          this.error(
            "EML429",
            `State machine "${machine.name}" names ${key} state "${state}", which is not one of its states.`,
            key === "initial" ? [...path, "initial"] : [...path, "final", position],
            { hint: `Add "${state}" to  states:, or correct the name.` }
          );
        }
      });
    }

    if (machine.transitions.length === 0) {
      this.warn(
        "EML420",
        `State machine "${machine.name}" has no transitions.`,
        [...path, "transitions"],
        {
          hint: "Declare the moves between states:  { from: draft, to: submitted, trigger: submit }.",
        }
      );
      return;
    }

    if (machine.initial === undefined) {
      this.error("EML421", `State machine "${machine.name}" has no initial state.`, path, {
        hint: "Add  initial: <state>  — the state a new record is stamped with.",
      });
    }
    if (!machine.final?.length) {
      this.warn("EML422", `State machine "${machine.name}" has no final state.`, path, {
        hint: "Add  final: [<state>, ...]  to mark where a record's lifecycle ends.",
      });
    }

    // EML423: every state reachable from the initial one.
    const reachable = new Set<string>();
    const queue = machine.initial !== undefined ? [machine.initial] : [];
    while (queue.length > 0) {
      const state = queue.shift()!;
      if (reachable.has(state)) continue;
      reachable.add(state);
      for (const transition of machine.transitions) {
        if (transition.from === state && !reachable.has(transition.to)) queue.push(transition.to);
      }
    }
    // EML424: every state able to reach a final one.
    const finishing = new Set<string>(machine.final ?? []);
    let changed = true;
    while (changed) {
      changed = false;
      for (const transition of machine.transitions) {
        if (finishing.has(transition.to) && !finishing.has(transition.from)) {
          finishing.add(transition.from);
          changed = true;
        }
      }
    }

    machine.states.forEach((state, index) => {
      if (machine.initial !== undefined && !reachable.has(state)) {
        this.warn(
          "EML423",
          `State machine "${machine.name}": state "${state}" cannot be reached from "${machine.initial}".`,
          [...path, "states", index],
          {
            hint: `Add a transition into "${state}" from a reachable state, or remove it.`,
          }
        );
      }
      if (machine.final?.length && !finishing.has(state)) {
        this.warn(
          "EML424",
          `State machine "${machine.name}": state "${state}" has no path to a final state.`,
          [...path, "states", index],
          {
            hint: `Add a transition out of "${state}" towards a final state, or mark it final.`,
          }
        );
      }
    });

    machine.transitions.forEach((transition, index) => {
      if (transition.trigger && !IDENTIFIER.test(transition.trigger.replace(/[- ]/g, "_"))) {
        this.warn(
          "EML425",
          `State machine "${machine.name}": trigger "${transition.trigger}" is not an identifier.`,
          [...path, "transitions", index, "trigger"],
          { hint: "Use a snake_case or camelCase name (submit, mark_paid, close_won)." }
        );
      }
    });

    // EML426–EML428: the states are the values the status column may hold,
    // so they should be a declared enum. The candidate is the enum sharing the
    // most values with the states — an exact match would hide exactly the model
    // that added a state and forgot the enum value.
    let candidate: { name: string; values: string[]; index: number; overlap: number } | undefined;
    (this.document.enums ?? []).forEach((declared, index) => {
      const values = new Set(declared.values);
      const overlap = machine.states.filter((state) => values.has(state)).length;
      if (overlap > 0 && (!candidate || overlap > candidate.overlap)) {
        candidate = { name: declared.name, values: declared.values, index, overlap };
      }
    });

    if (!candidate) {
      this.warn(
        "EML428",
        `State machine "${machine.name}" has no matching enum; its states are not a declared vocabulary.`,
        [...path, "states"],
        {
          hint: `Declare  { name: ${machine.entity}Status, values: [${machine.states.join(", ")}] }  and set  enum: ${machine.entity}Status  on ${machine.entity}.status.`,
        }
      );
      return;
    }
    const values = new Set(candidate.values);
    const states = new Set(machine.states);
    const missing = machine.states.filter((state) => !values.has(state));
    const extra = candidate.values.filter((value) => !states.has(value));
    if (missing.length > 0) {
      this.warn(
        "EML426",
        `State machine "${machine.name}": states [${missing.join(", ")}] are not values of enum "${candidate.name}".`,
        [...path, "states"],
        { hint: `Add them to enum ${candidate.name}.` }
      );
    }
    if (extra.length > 0) {
      this.info(
        "EML427",
        `Enum "${candidate.name}" has values [${extra.join(", ")}] that are not states of "${machine.name}".`,
        ["enums", candidate.index, "values"],
        {
          hint: "They may be states to come, or values nothing can reach. Remove them if not needed.",
        }
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  EML260–EML279 and EML430: sagas                                        */
  /* ---------------------------------------------------------------------- */

  private checkSagas(): void {
    const stepTypes = new Map(stepNodeTypes().map((step) => [step.name, step]));
    const spellings = this.entitySpellings();
    const rules = new Set((this.document.rules ?? []).map((rule) => rule.name));

    (this.document.sagas ?? []).forEach((saga, index) => {
      const path: DocumentPath = ["sagas", index];
      if (!this.declares(saga.entity)) {
        this.warn(
          "EML400",
          `Saga "${saga.name}" is bound to undeclared entity "${saga.entity}".`,
          [...path, "entity"],
          {
            hint: `Declare "${saga.entity}", or correct the name.`,
          }
        );
      }
      if (saga.steps.length === 0) {
        this.warn("EML430", `Saga "${saga.name}" has no steps.`, [...path, "steps"], {
          hint: "Declare the steps it runs, in order, e.g.  { id: escalate, type: UpdateEntity, properties: { ... } }.",
        });
      }
      this.checkSagaSteps(saga, path, stepTypes, spellings, rules);
    });
  }

  private checkSagaSteps(
    saga: SagaDocument,
    path: DocumentPath,
    stepTypes: Map<string, ReturnType<typeof stepNodeTypes>[number]>,
    spellings: Set<string>,
    rules: Set<string>
  ): void {
    // What a step may read: whatever an earlier step published, and the
    // columns of the record that started the saga — the executor puts that
    // row in scope from the first step.
    const published = new Set<string>();
    const trigger = this.entities.find(
      (entity) => entity.name.toLowerCase() === saga.entity.toLowerCase()
    );
    for (const column of trigger ? (this.columns.get(trigger.name) ?? []) : [])
      published.add(column.name);

    const ids = new Set<string>();

    saga.steps.forEach((step, index) => {
      const at: DocumentPath = [...path, "steps", index];
      const props = step.properties ?? {};

      if (ids.has(step.id)) {
        this.error(
          "EML270",
          `Saga "${saga.name}" declares step "${step.id}" twice.`,
          [...at, "id"],
          {
            hint: "Step ids name the step in the run log. Give the second one its own id.",
          }
        );
      }
      ids.add(step.id);

      const contract = stepTypes.get(step.type);
      if (!contract) {
        this.error(
          "EML261",
          `Step "${step.id}" has unknown type "${step.type}".`,
          [...at, "type"],
          {
            hint: `Valid step types: ${[...stepTypes.keys()].join(", ")}.`,
          }
        );
        return;
      }

      const has = (key: string) => (props[key] ?? "").trim().length > 0;

      const missing: string[] = [];
      for (const key of contract.required ?? []) if (!has(key)) missing.push(key);
      for (const group of contract.oneOf ?? []) {
        if (!group.some((key) => has(key))) missing.push(`one of ${group.join(" / ")}`);
      }
      if (step.type === "Formula" && has("operation")) {
        for (const key of contract.perOperation?.[props.operation!.trim()]?.required ?? []) {
          if (!has(key)) missing.push(key);
        }
      }
      if (missing.length > 0) {
        this.error(
          "EML262",
          `Step "${step.id}" (${step.type}) is missing: ${missing.join(", ")}.`,
          at,
          {
            hint: `${step.type} requires ${(contract.required ?? []).join(", ") || "no fixed properties"}.`,
          }
        );
      }

      // EML268: a misspelt property is ignored by the executor. `in` is loop
      // membership, which belongs to every step type alike.
      const known = new Set([
        ...(contract.required ?? []),
        ...(contract.optional ?? []),
        ...(contract.oneOf ?? []).flat(),
        ...(step.type === "Formula" ? ["source", "operand", "value"] : []),
        "in",
      ]);
      for (const key of Object.keys(props)) {
        if (!known.has(key)) {
          this.warn(
            "EML268",
            `Step "${step.id}" (${step.type}) has unknown property "${key}".`,
            [...at, "properties", key],
            {
              hint: `${step.type} understands: ${[...known].sort().join(", ")}.`,
            }
          );
        }
      }

      const entity = props.entity?.trim();
      if (entity && !spellings.has(entity.toLowerCase())) {
        this.warn(
          "EML266",
          `Step "${step.id}" targets entity "${entity}", which the model does not declare.`,
          [...at, "properties", "entity"],
          {
            hint: "Use the entity's name, or its bus_ table name.",
          }
        );
      }

      if (step.type === "CreateEntity" && has("fields")) {
        const parsed = parseJsonObject(props.fields!);
        if (!parsed) {
          this.error(
            "EML267",
            `Step "${step.id}" (CreateEntity) has an invalid "fields" map.`,
            [...at, "properties", "fields"],
            {
              hint: 'fields is a JSON object of column to value, e.g.  \'{"status":"open"}\'.',
            }
          );
        } else if (Object.keys(parsed).length === 0) {
          this.error(
            "EML267",
            `Step "${step.id}" (CreateEntity) sets no fields.`,
            [...at, "properties", "fields"],
            {
              hint: 'Give at least one column, e.g.  \'{"status":"open"}\'.',
            }
          );
        }
      }

      if (step.type === "Decision" && has("decisionTable")) {
        const table = parseJsonObject(props.decisionTable!) as
          | { outputs?: unknown; rules?: unknown }
          | undefined;
        const tablePath: DocumentPath = [...at, "properties", "decisionTable"];
        if (!table) {
          this.error(
            "EML271",
            `Step "${step.id}" (Decision) has an invalid "decisionTable".`,
            tablePath,
            {
              hint: 'decisionTable is a JSON object: {"hitPolicy":"first","inputs":[…],"outputs":[…],"rules":[…]}.',
            }
          );
        } else if (!Array.isArray(table.rules) || table.rules.length === 0) {
          this.error(
            "EML271",
            `Step "${step.id}" (Decision) has a table with no rows.`,
            tablePath,
            {
              hint: "A table with no rows matches nothing and publishes nothing. Add a row, or drop the step.",
            }
          );
        } else if (Array.isArray(table.outputs)) {
          const columns = (table.outputs as Array<{ id?: string }>)
            .map((output) => output?.id)
            .filter((id): id is string => Boolean(id));
          const incomplete = (table.rules as Array<Record<string, unknown>>).filter((row) =>
            columns.some((column) => row?.[column] === undefined)
          );
          if (incomplete.length > 0) {
            this.error(
              "EML272",
              `Step "${step.id}" (Decision) has ${incomplete.length} row(s) that do not set every output column.`,
              tablePath,
              {
                hint: `Give every row a value for each of ${columns.join(", ")} — "''" for one it leaves blank. The engine discards an incomplete row silently.`,
              }
            );
          }
        }
      }

      if (step.type === "Decision" && has("rule") && !rules.has(props.rule!.trim())) {
        this.warn(
          "EML273",
          `Step "${step.id}" (Decision) names rule "${props.rule!.trim()}", which the model does not declare.`,
          [...at, "properties", "rule"],
          {
            hint: "Declare the rule, or author the table inline with decisionTable.",
          }
        );
      }

      if (
        (step.type === "UpdateEntity" || step.type === "DeleteEntity") &&
        entity &&
        !has("targetSource") &&
        (props.targetField ?? "id").trim() === "id"
      ) {
        this.error(
          "EML265",
          `Step "${step.id}" (${step.type}) targets "${entity}" without saying which row.`,
          at,
          {
            hint: "Set targetSource to a variable holding the row id, or targetField to a foreign key column. The executor refuses rather than guess.",
          }
        );
      }

      const reference = props.targetSource?.trim();
      if (reference && !published.has(reference)) {
        this.warn(
          "EML264",
          `Step "${step.id}" reads "${reference}", which no earlier step publishes.`,
          [...at, "properties", "targetSource"],
          {
            hint: `Publish it with  as: ${reference}  on a CreateEntity step or  target: ${reference}  on a Formula step — unless it is a column of the triggering record.`,
          }
        );
      }

      for (const name of stepPublishes(step.type, props, entity)) published.add(name);
    });
  }

  /** Every spelling of a declared entity a step's `entity` may use. */
  private entitySpellings(): Set<string> {
    const spellings = new Set<string>();
    for (const entity of this.entities) {
      const snake = entity.name
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/-/g, "_")
        .toLowerCase();
      const bare = snake.replace(/^bus_/, "");
      spellings.add(entity.name.toLowerCase());
      spellings.add(snake);
      spellings.add(bare);
      spellings.add(`bus_${bare}`);
    }
    return spellings;
  }

  /* ---------------------------------------------------------------------- */
  /*  EML410–EML413: hook flows                                              */
  /* ---------------------------------------------------------------------- */

  /**
   * A hook flow draws the order an entity's hooks run in. It documents the
   * model's `hooks`; nothing compiles it. So a hook step naming a hook the
   * model does not declare is a drawing of code that will never run, and it is
   * reported rather than drawn as though it would.
   */
  private checkHookFlows(): void {
    const declared = new Set(
      (this.document.hooks ?? []).map((hook) => `${hook.entity}|${hook.event}|${hook.handler}`)
    );
    const hooked = new Set((this.document.hooks ?? []).map((hook) => hook.entity));

    (this.document.hookFlows ?? []).forEach((flow, index) => {
      const path: DocumentPath = ["hookFlows", index];
      if (!this.declares(flow.entity)) {
        this.warn(
          "EML400",
          `Hook flow "${flow.name}" is bound to undeclared entity "${flow.entity}".`,
          [...path, "entity"],
          { hint: `Declare "${flow.entity}", or correct the name.` }
        );
      }
      if (!hooked.has(flow.entity)) {
        this.warn(
          "EML410",
          `Hook flow "${flow.name}" draws ${flow.entity}, which declares no hooks.`,
          path,
          {
            hint: `Declare the hooks it draws under  hooks:, e.g.  { entity: ${flow.entity}, event: beforeCreate, handler: ... }.`,
          }
        );
      }

      const ids = new Set<string>();
      flow.nodes.forEach((node, position) => {
        const at: DocumentPath = [...path, "nodes", position];
        if (ids.has(node.id)) {
          this.error(
            "EML412",
            `Hook flow "${flow.name}" declares node "${node.id}" twice.`,
            [...at, "id"],
            { hint: "Node ids are how edges refer to nodes. Give the second one its own id." }
          );
        }
        ids.add(node.id);

        if (
          node.event !== undefined &&
          node.handler !== undefined &&
          !declared.has(`${flow.entity}|${node.event}|${node.handler}`)
        ) {
          this.warn(
            "EML411",
            `Hook flow "${flow.name}" draws ${node.event} ${node.handler}, which ${flow.entity} does not declare.`,
            at,
            {
              hint: `Declare  { entity: ${flow.entity}, event: ${node.event}, handler: ${node.handler} }  under  hooks:, or correct the step.`,
            }
          );
        }
      });

      flow.edges.forEach((edge, position) => {
        for (const end of ["from", "to"] as const) {
          if (!ids.has(edge[end])) {
            this.error(
              "EML413",
              `Hook flow "${flow.name}" has an edge ${end} "${edge[end]}", which is not one of its nodes.`,
              [...path, "edges", position, end],
              { hint: `Declare a node with  id: ${edge[end]}, or correct the edge.` }
            );
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  EML500–EML509: across the model                                        */
  /* ---------------------------------------------------------------------- */

  private workflowNames(): string[] {
    return [
      ...(this.document.stateMachines ?? []).map((machine) => machine.name),
      ...(this.document.hookFlows ?? []).map((flow) => flow.name),
      ...(this.document.sagas ?? []).map((saga) => saga.name),
    ];
  }

  private checkCrossReferences(): void {
    // EML500: a state machine needs a column to hold the state.
    (this.document.stateMachines ?? []).forEach((machine, index) => {
      if (!this.declares(machine.entity)) return;
      const names = new Set((this.columns.get(machine.entity) ?? []).map((column) => column.name));
      if (![...LIFECYCLE_COLUMN_NAMES].some((name) => names.has(name))) {
        this.warn(
          "EML500",
          `State machine "${machine.name}" is bound to "${machine.entity}", which has no status, state or stage column.`,
          ["stateMachines", index, "entity"],
          {
            hint: `Add  { name: status, type: string, enum: ${machine.entity}Status }  to "${machine.entity}".`,
          }
        );
      }
    });

    // EML502: a foreign key with no relationship to the entity it names. A
    // name that resolves to nothing, on an entity with a declared parent no
    // other key accounts for, is resolved through that relationship by the
    // generator, so it is not reported.
    const relationships = this.document.relationships ?? [];
    for (const entity of this.entities) {
      if (this.entityIndex.get(entity.name) !== this.entities.indexOf(entity)) continue;
      const columns = this.columns.get(entity.name) ?? [];
      const claimed = new Set(
        columns
          .filter((column) => column.fk && column.name.endsWith("_id"))
          .map((column) => this.fkTarget(column.name))
          .filter((name) => this.declares(name))
      );
      const spare = relationships
        .filter(
          (relationship) => relationship.to === entity.name && relationship.from !== entity.name
        )
        .map((relationship) => relationship.from)
        .filter((name) => this.declares(name) && !claimed.has(name));

      for (const column of columns) {
        if (!column.fk || !column.name.endsWith("_id")) continue;
        const target = this.fkTarget(column.name);
        const related = relationships.some(
          (relationship) =>
            (relationship.from === entity.name || relationship.to === entity.name) &&
            (relationship.from === target || relationship.to === target)
        );
        const resolvedByRelationship = !this.declares(target) && spare.length > 0;
        if (resolvedByRelationship) spare.shift();
        if (!related && !resolvedByRelationship) {
          this.info(
            "EML502",
            `Foreign key "${entity.name}.${column.name}" has no relationship to "${target}".`,
            this.columnPath(entity.name, column),
            {
              hint: `Add  { from: ${target}, fromCardinality: exactly-one, to: ${entity.name}, toCardinality: zero-or-more }  under  relationships:.`,
            }
          );
        }
      }
    }

    // EML503: an entity related to nothing.
    if (this.entities.length > 1) {
      const connected = new Set<string>();
      for (const relationship of relationships) {
        connected.add(relationship.from);
        connected.add(relationship.to);
      }
      for (const entity of this.entities) {
        if (!connected.has(entity.name)) {
          this.info(
            "EML503",
            `Entity "${entity.name}" has no relationships.`,
            this.entityPath(entity.name),
            {
              hint: "Valid, but an isolated entity often means a relationship was left out.",
            }
          );
        }
      }
    }

    // EML505: workflow names are keys across state machines, sagas and hook flows.
    const seen = new Set<string>();
    const named: Array<[string, DocumentPath]> = [
      ...(this.document.stateMachines ?? []).map((machine, index): [string, DocumentPath] => [
        machine.name,
        ["stateMachines", index, "name"],
      ]),
      ...(this.document.hookFlows ?? []).map((flow, index): [string, DocumentPath] => [
        flow.name,
        ["hookFlows", index, "name"],
      ]),
      ...(this.document.sagas ?? []).map((saga, index): [string, DocumentPath] => [
        saga.name,
        ["sagas", index, "name"],
      ]),
    ];
    for (const [name, path] of named) {
      if (seen.has(name)) {
        this.warn("EML505", `Duplicate workflow name "${name}".`, path, {
          hint: "State machines, sagas and hook flows share one namespace. Give each its own name.",
        });
      }
      seen.add(name);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers without state                                                      */
/* -------------------------------------------------------------------------- */

/** The JDM node each node type of a rule compiles to. */
const JDM_ROLE = {
  start: "inputNode",
  end: "outputNode",
  decision: "switchNode",
  expression: "expressionNode",
  function: "functionNode",
} as const;

function ruleNodeRoles(rule: RuleDocument): Map<string, string> {
  return new Map(rule.nodes.map((node) => [node.id, JDM_ROLE[node.type]]));
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The variables a step makes available to the ones after it. A Decision
 * publishes one per output column; when it names a rule rather than carrying
 * its table, `publish` is the only declaration, and without it the checker
 * cannot know and stays quiet.
 */
function stepPublishes(
  type: string,
  props: Record<string, string>,
  entity: string | undefined
): string[] {
  if (type === "CreateEntity") {
    const explicit = props.as?.trim();
    if (explicit) return [explicit];
    return entity ? [`${entity.replace(/^bus_/, "")}Id`] : [];
  }
  if (type === "Formula") {
    const target = props.target?.trim();
    return target ? [target] : [];
  }
  if (type === "Decision") {
    const declared = (props.publish ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (declared.length > 0) return declared;
    const table = props.decisionTable ? parseJsonObject(props.decisionTable) : undefined;
    return ((table?.outputs as Array<{ field?: string }> | undefined) ?? [])
      .map((output) => output?.field?.trim())
      .filter((field): field is string => Boolean(field));
  }
  return [];
}

/**
 * Whether a query is one SELECT or WITH statement: the opening keyword, and no
 * statement separator outside a quoted literal or comment. `SELECT 1; DROP
 * TABLE bus_user` opens with SELECT, which is why the keyword alone is not the
 * test. The same rule is applied by the report compiler and by the generated
 * application before it runs the query.
 */
export function isSingleReadStatement(sql: string): boolean {
  let quote: string | null = null;
  let lineComment = false;
  let blockComment = false;
  let separatorAt = -1;
  for (let index = 0; index < sql.length; index++) {
    const character = sql[index]!;
    const next = sql[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "-" && next === "-") lineComment = true;
    else if (character === "/" && next === "*") blockComment = true;
    else if (character === ";") {
      separatorAt = index;
      break;
    }
  }
  if (separatorAt >= 0 && sql.slice(separatorAt + 1).trim().length > 0) return false;
  return /^\s*(select|with)\b/i.test(sql);
}

/** Check a model document the schema has already accepted. */
export function checkModelDocument(document: ModelDocument): ModelIssue[] {
  return new ModelChecker(document).run();
}
