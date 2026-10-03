/**
 * Application Dictionary help text.
 *
 * Help is composed from the dictionary itself rather than hand-written per
 * project, so it cannot drift from the schema it describes: what is mandatory,
 * what has to be unique, which records link to which, and the draft -> final
 * lifecycle every business record goes through.
 *
 * Administrators can overwrite any of this from Window, Tab and Field; the seed
 * only supplies the starting text.
 *
 * **Why this lives here and not in a template.** Both stacks seed the same
 * `sys_window.help` / `sys_tab.help` / `sys_field.help` columns, and the prose
 * is derived purely from the model — so there is no reason for two copies of
 * the composition rules, and every reason not to have them. The NestJS seed
 * (`common/seeds/sys-dictionary.ts.hbs`) and the Loco seed
 * (`tanstack-astryx-loco/dictionary-seed.ts`) both render the strings this
 * module returns.
 */

import type { BusEntity } from "@appwithai/core/types";
/*
 * The shared snake-caser, not a local one.
 *
 * This module had its own, and it dropped the acronym rule: `KYCRecord` came
 * out `kycrecord`, so the stem it indexed entities by never matched the
 * `kyc_record` a `kyc_record_id` column strips to. Every lookup onto an entity
 * whose name begins with an acronym was then unresolvable, and the field help
 * fell back to "The kyc record of this KYC Verification" — the column name in
 * prose, which is the restatement EML151 exists to refuse. The Rust half of
 * the generator reads `naming::snake_case` and got it right, so the two
 * disagreed on exactly those models.
 */
import { snakeCase } from "@appwithai/core/utils";

/** Columns the framework maintains; never described as user input. */
const AUDIT_COLUMNS = [
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
  "version",
];

interface HelpColumn {
  columnName: string;
  displayName: string;
  type: string;
  isMandatory: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  maxLength?: number;
  /** Display label of the entity this column points at, once resolved. */
  fkTarget?: string;
  /** The entity's own <name>_id column carried over from the ERD. */
  isBusinessKey?: boolean;
  /**
   * The column's `help` — what the author said this column is for.
   *
   * The only sentence in a generated application that carries *domain*
   * knowledge rather than schema. Everything else this module composes is
   * derived from the column's shape, so a model with a paragraph on every
   * column produced an application that said "The Student Number of this
   * Student. Required — the record cannot be saved while this is empty." The
   * composed facts are kept — "required" and "must be unique" are things the
   * author's sentence does not carry — but they follow it rather than replace
   * it.
   */
  authorHelp?: string;
}

interface HelpEntity {
  label: string;
  tableName: string;
  stem: string;
  columns: HelpColumn[];
}

/** Help for one entity, keyed the way the seeds need it. */
export interface EntityHelp {
  /** `sys_window.help` */
  window: string;
  /** `sys_tab.help` */
  tab: string;
  /** `sys_field.help`, keyed by physical column name. */
  fields: Record<string, string>;
}

/** The whole dictionary's help, keyed by physical table name. */
export type DictionaryHelp = Record<string, EntityHelp>;

/** 'a', 'a and b', 'a, b and c' */
function join(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] as string;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** 'a Patient' / 'an Encounter' */
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function isAuditColumn(col: HelpColumn): boolean {
  return AUDIT_COLUMNS.includes(col.columnName);
}

/**
 * Resolve the cross-references the help text leans on: which columns point at
 * another entity, and which entities point back at this one.
 */
function resolveModel(
  entities: HelpEntity[]
): Map<string, { entity: HelpEntity; children: string[] }> {
  const byStem = new Map(entities.map((e) => [e.stem, e]));
  const resolved = new Map<string, { entity: HelpEntity; children: string[] }>();

  for (const entity of entities) {
    for (const col of entity.columns) {
      if (!col.columnName.endsWith("_id")) continue;
      const stem = col.columnName.slice(0, -"_id".length);
      const target = byStem.get(stem);
      if (!target) continue;
      if (target.tableName === entity.tableName) {
        // The entity's own identifier from the ERD, not a link to anything.
        col.isBusinessKey = true;
      } else if (col.isForeignKey) {
        col.fkTarget = target.label;
      }
    }
  }

  for (const entity of entities) {
    const children = entities
      .filter(
        (other) =>
          other.tableName !== entity.tableName &&
          other.columns.some((c) => c.fkTarget === entity.label)
      )
      .map((other) => other.label);
    resolved.set(entity.tableName, { entity, children });
  }

  return resolved;
}

function windowHelpText(entity: HelpEntity, children: string[]): string {
  const label = entity.label;
  const parents = [
    ...new Set(entity.columns.filter((c) => c.fkTarget).map((c) => c.fkTarget as string)),
  ];
  const uniques = entity.columns.filter((c) => c.isUnique).map((c) => c.displayName);
  const required = entity.columns
    .filter((c) => c.isMandatory && !isAuditColumn(c))
    .map((c) => c.displayName);

  const paragraphs: string[] = [];

  paragraphs.push(
    `Create, find and maintain ${label} records. The list shows every ${label} you have access to — ` +
      `select a row to open it, or use New to add one. Each row is a single ${label}, described by ` +
      `${entity.columns.length} field${entity.columns.length === 1 ? "" : "s"}.`
  );

  const identity: string[] = [];
  if (uniques.length > 0) {
    identity.push(
      `${join(uniques)} ${uniques.length === 1 ? "is unique" : "are unique"}: no two ${label} records ` +
        `may share the same value, and a save that would duplicate one is rejected.`
    );
  }
  if (required.length > 0) {
    identity.push(`${join(required)} must be filled in before the record can be saved.`);
  }
  if (identity.length > 0) paragraphs.push(identity.join(" "));

  const links: string[] = [];
  if (parents.length > 0) {
    links.push(
      `Every ${label} points at ${join(parents)}. Choose the linked record from the lookup on those ` +
        `fields rather than typing an identifier.`
    );
  }
  if (children.length > 0) {
    links.push(
      `${join(children)} ${children.length === 1 ? "refers" : "refer"} back to ${label}, so what you ` +
        `change here can affect ${children.length === 1 ? "that record" : "those records"}.`
    );
  }
  if (links.length > 0) paragraphs.push(links.join(" "));

  paragraphs.push(
    `Every save starts as a Draft. The business rules and workflows attached to ${label} then run together ` +
      `in a single transaction: if all of them succeed the record becomes Final; if any of them fails, ` +
      `nothing they changed is kept — the record stays Draft and the reason is written onto it so you can ` +
      `fix the cause and retry. ${article(label) === "an" ? "An" : "A"} ${label} with no rules or ` +
      `workflows attached is marked Final immediately.`
  );

  return paragraphs.join("\n\n");
}

function tabHelpText(entity: HelpEntity): string {
  const label = entity.label;
  const required = entity.columns.filter((c) => c.isMandatory && !isAuditColumn(c));
  const lookups = entity.columns.filter((c) => c.fkTarget);
  const sentences: string[] = [];

  sentences.push(
    `Shows one ${label} at a time. Fields are grouped: General carries the identifying fields and Details ` +
      `carries the rest.`
  );
  if (required.length > 0) {
    sentences.push(
      `${required.length} field${required.length === 1 ? "" : "s"} marked with a red asterisk (*) must have ` +
        `a value before Save will accept the record.`
    );
  }
  if (lookups.length > 0) {
    sentences.push(
      `${join(lookups.map((c) => c.displayName))} ${lookups.length === 1 ? "is a lookup" : "are lookups"} — ` +
        `search the linked records instead of entering an identifier by hand.`
    );
  }
  sentences.push(
    `Any field showing a ? beside its label has help of its own; click it for the rules that apply there.`
  );

  return sentences.join(" ");
}

function fieldTypeSentence(entity: HelpEntity, col: HelpColumn): string {
  const noun = col.displayName.toLowerCase();
  switch (col.type) {
    case "date":
      return `The ${noun} of this ${entity.label}, as a calendar date.`;
    case "datetime":
      return `The ${noun} of this ${entity.label}, as a date and time.`;
    case "integer":
      return `The ${noun} of this ${entity.label}, as a whole number.`;
    case "decimal":
      return `The ${noun} of this ${entity.label}, as a decimal amount.`;
    case "boolean":
      return `Whether this ${entity.label} is marked as ${noun}.`;
    case "text":
      return `Free-form ${noun} for this ${entity.label}. The box grows as you type.`;
    case "json":
      return `The ${noun} of this ${entity.label}, held as structured JSON.`;
    default:
      return `The ${noun} of this ${entity.label}.`;
  }
}

function fieldHelpText(entity: HelpEntity, col: HelpColumn): string {
  const parts: string[] = [];

  // The author's words come first, and the derived sentence is dropped rather
  // than appended after them: a column `help` that says what a column is
  // for should not be followed by this module restating the column's shape.
  // The *facts* below — required, unique, length — still follow, because the
  // author's sentence does not carry them.
  if (col.authorHelp) {
    parts.push(col.authorHelp);
  } else if (col.fkTarget) {
    parts.push(
      `Links this ${entity.label} to ${article(col.fkTarget)} ${col.fkTarget} record. Pick the ` +
        `${col.fkTarget} from the lookup — the identifier is stored for you.`
    );
  } else if (col.isBusinessKey) {
    parts.push(
      `The ${entity.label} reference used outside this system. It identifies the ${entity.label} on ` +
        `documents and in exports, and stays with the record for its whole life.`
    );
  } else if (isAuditColumn(col)) {
    parts.push(
      `Maintained by the system as part of the audit trail. It is set automatically, not entered here.`
    );
  } else {
    parts.push(fieldTypeSentence(entity, col));
  }

  if (col.isMandatory && !isAuditColumn(col)) {
    parts.push(`Required — the record cannot be saved while this is empty.`);
  }
  if (col.isUnique) {
    parts.push(
      `Must be unique: a save is rejected if another ${entity.label} already uses this value.`
    );
  }
  if (col.maxLength) {
    parts.push(`Up to ${col.maxLength} characters.`);
  }

  return parts.join(" ");
}

/**
 * Compose the help text for every window, tab and field in the dictionary.
 *
 * The timestamp columns are reported as optional regardless of what the model
 * says, because the database fills them in — telling a user that `created_at`
 * is a required entry would be wrong.
 */
export function buildDictionaryHelp(entities: BusEntity[]): DictionaryHelp {
  const helpEntities: HelpEntity[] = entities.map((entity) => ({
    label: entity.displayName,
    tableName: entity.tableName,
    stem: snakeCase(entity.name),
    columns: entity.attributes.map((attr) => {
      const systemManaged = ["created_at", "updated_at", "deleted_at"].includes(attr.columnName);
      const column: HelpColumn = {
        columnName: attr.columnName,
        displayName: attr.displayName,
        type: attr.type,
        isMandatory: systemManaged ? false : attr.required === true,
        isUnique: attr.unique === true,
        isForeignKey: attr.isForeignKey === true,
      };
      if (attr.maxLength !== undefined) column.maxLength = attr.maxLength;
      const authored = (attr.description ?? "").trim();
      if (authored) column.authorHelp = authored;
      return column;
    }),
  }));

  const resolved = resolveModel(helpEntities);
  const help: DictionaryHelp = {};

  for (const [tableName, { entity, children }] of resolved) {
    const fields: Record<string, string> = {};
    for (const col of entity.columns) {
      fields[col.columnName] = fieldHelpText(entity, col);
    }
    help[tableName] = {
      window: windowHelpText(entity, children),
      tab: tabHelpText(entity),
      fields,
    };
  }

  return help;
}

export default buildDictionaryHelp;
