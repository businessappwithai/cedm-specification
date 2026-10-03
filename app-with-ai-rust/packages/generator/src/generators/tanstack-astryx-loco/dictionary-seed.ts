/**
 * Application Dictionary seed, emitted as SQL.
 *
 * The NestJS stack seeds the dictionary with a TypeScript file that runs
 * against Kysely at seed time. The Rust backend has no TypeScript, so the
 * equivalent is generated here as a single `seed/dictionary.sql` that
 * `cargo loco task seed_dictionary` executes — the same choice already made
 * for the migrations (`migration/sql/*.sql`), and for the same reason: the
 * content is mechanical data derived from the model, and raw SQL is the form
 * in which both stacks can be compared line for line.
 *
 * **Every id is deterministic.** Primary keys are UUIDv5 over the object's
 * natural name, so re-running the seed produces byte-identical statements and
 * `ON CONFLICT DO NOTHING` makes the whole file idempotent — including for the
 * dictionary tables (`sys_window`, `sys_tab`, `sys_field_group`, `sys_access`)
 * that have no natural unique key to conflict on. It also means a generated
 * project's dictionary ids are stable across regenerations, so a URL or a saved
 * report that names a window id keeps working.
 */

import { createHash } from "node:crypto";

import type { BusEntity, EntityEnum } from "@appwithai/core/types";

import { buildDictionaryHelp } from "../dictionary-help";

/** Category declared by a `%%category` directive in the model. */
export interface EntityCategorySeed {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  seqNo: number;
  isDefault?: boolean;
  /** Physical table names (`bus_*`) that belong to this category. */
  tables: string[];
}

export interface DictionarySeedOptions {
  projectName: string;
  entities: BusEntity[];
  categories?: EntityCategorySeed[];
  /**
   * `%%enum` declarations a `%%field` binds a column to, with the reference id
   * each was allocated.
   *
   * Without these the seed still stamps `sys_column.sys_reference_id` with the
   * enum's id — `attributeReferenceId` reads `enumReferenceId` before anything
   * else — and nothing defines that reference or its values. The generated form
   * renders any reference at or above 1000 as a dropdown fed by
   * `/sys/ref-list`, so the column becomes an *empty* select: strictly worse
   * than the free-text box it replaced.
   */
  modelEnums?: EntityEnum[];
  /** Value written to every `created_by` / `updated_by`. */
  createdBy?: string;
}

/**
 * Namespace for the generated ids.
 *
 * A fixed random UUID, not a project-derived one: two projects that declare the
 * same entity should still get distinct dictionary ids, which they do because
 * the name fed to `uuidv5` below is prefixed with the project name.
 */
const NAMESPACE = "6f9d3a54-1b0e-4c9a-9f2a-8e5d4b7c1a30";

/** RFC 4122 §4.3 name-based UUID (SHA-1). */
export function uuidv5(name: string, namespace: string = NAMESPACE): string {
  const hex = namespace.replace(/-/g, "");
  const ns = Buffer.from(hex, "hex");
  const hash = createHash("sha1").update(ns).update(Buffer.from(name, "utf8")).digest();

  // Version 5, RFC 4122 variant.
  hash[6] = ((hash[6] as number) & 0x0f) | 0x50;
  hash[8] = ((hash[8] as number) & 0x3f) | 0x80;

  const b = hash.subarray(0, 16).toString("hex");
  return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20, 32)}`;
}

/** Single-quoted SQL literal, or NULL. */
export function lit(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

/** Columns whose value the database, not the user, is responsible for. */
const SYSTEM_TIMESTAMPS = ["created_at", "updated_at", "deleted_at"];

/*
 * The identifier derivation used to live here, as `identifierColumnsFor`.
 *
 * It disagreed with `identifierColumnNames` in `@appwithai/core/types`, which
 * is the same question asked by the frontend, the generated server's `labelFor`
 * and the test harness. Two answers to "what is this record called" is one too
 * many: this copy returned *every* conventional column it found, so an entity
 * with `name`, `title` and `code` was identified by all three concatenated in
 * whatever order they were declared; and it keyed its fallback off
 * `referenceId`, a dictionary artifact nothing outside this file can see.
 *
 * `entityToBusEntity` now marks each attribute through `withIdentifiers`, so
 * the seed reads `attr.isIdentifier` and there is one derivation again. The
 * cases the core version can express and this one could not — `first_name` plus
 * `last_name`, and a join entity identified by the pair of records it joins —
 * come along with it.
 */

/**
 * A value that is SQL, not data.
 *
 * A distinct type rather than a marker prefix on a string: `NOW()` and the
 * role sub-selects must not be quoted, and every other string in this file
 * must be. Making that a type distinction lets the compiler enforce it, and
 * means no model-supplied value can ever impersonate raw SQL.
 */
export class RawSql {
  constructor(readonly sql: string) {}
}

export type SqlValue = string | number | boolean | null | undefined | RawSql;

/** Mark a fragment as raw SQL rather than a literal. */
export function raw(sql: string): RawSql {
  return new RawSql(sql);
}

/**
 * One INSERT with a bare `ON CONFLICT DO NOTHING`.
 *
 * Bare rather than targeted on purpose: it covers the primary key *and* every
 * natural unique key (`sys_table.table_name`, `sys_column(table, column)`,
 * `sys_role.name`, …), which is exactly the "insert unless this row is already
 * there in some form" semantics a re-runnable seed wants.
 */
export function insert(table: string, values: Record<string, SqlValue>): string {
  const columns = Object.keys(values);
  const rendered = columns.map((column) => {
    const value = values[column];
    return value instanceof RawSql ? value.sql : lit(value);
  });
  return (
    `INSERT INTO ${table} (${columns.join(", ")})\n` +
    `VALUES (${rendered.join(", ")})\n` +
    `ON CONFLICT DO NOTHING;`
  );
}

const NOW = raw("NOW()");

/**
 * The reference-type vocabulary.
 *
 * Ids are part of the contract — `sys_column.sys_reference_id` values are
 * emitted by the generator's `referenceId` mapping and read by the frontend to
 * choose an input widget — so they are fixed integers, not generated.
 */
const REFERENCES: Array<{ id: number; name: string; description: string; validation: string }> = [
  { id: 10, name: "String", description: "Variable length string", validation: "S" },
  { id: 11, name: "Integer", description: "Whole number", validation: "S" },
  { id: 12, name: "Amount", description: "Decimal number for amounts", validation: "S" },
  { id: 13, name: "ID", description: "Unique identifier (UUID)", validation: "S" },
  { id: 14, name: "Text", description: "Long text/memo field", validation: "S" },
  { id: 15, name: "Date", description: "Date only", validation: "S" },
  { id: 16, name: "DateTime", description: "Date and time", validation: "S" },
  { id: 17, name: "List", description: "Dropdown list from sys_ref_list", validation: "L" },
  { id: 18, name: "Table", description: "Reference to another table", validation: "T" },
  {
    id: 19,
    name: "Table Direct",
    description: "Direct reference using column name",
    validation: "T",
  },
  { id: 20, name: "Yes-No", description: "Boolean yes/no", validation: "S" },
  { id: 24, name: "URL", description: "Web URL", validation: "S" },
  { id: 28, name: "JSON", description: "JSON data", validation: "S" },
  { id: 30, name: "Email", description: "Email address", validation: "S" },
  { id: 31, name: "Phone", description: "Phone number", validation: "S" },
  { id: 100, name: "EntityType", description: "Entity type classification", validation: "L" },
  {
    id: 101,
    name: "AccessLevel",
    description: "Access level for windows and tables",
    validation: "L",
  },
];

const REF_LISTS: Array<{ referenceId: number; value: string; name: string }> = [
  { referenceId: 100, value: "S", name: "System Only" },
  { referenceId: 100, value: "C", name: "Client" },
  { referenceId: 100, value: "O", name: "Organization" },
  { referenceId: 100, value: "U", name: "User Maintained" },
  { referenceId: 101, value: "M", name: "Maintain" },
  { referenceId: 101, value: "T", name: "Transaction" },
  { referenceId: 101, value: "Q", name: "Query" },
  { referenceId: 101, value: "A", name: "Admin Only" },
];

/**
 * Admin windows (`entity_type = 'S'`).
 *
 * These are the Application Dictionary entries the dashboard renders as its
 * admin section; `description` carries the frontend route.
 */
/**
 * The dictionary's own screens, and what each one looks like.
 *
 * The icon is a lucide **id** — the same spelling `%%entity … icon:` writes and
 * the same one `sys_table.icon` holds. The dashboard used to carry a map from
 * window name to an icon and a route in the frontend instead, which meant a
 * window this list added and that map did not know about was dropped from the
 * screen without a word: `User Administration`, `Role Administration` and
 * `System Configuration` were all granted, routed and invisible.
 */
const ADMIN_WINDOWS: Array<{ name: string; route: string; icon: string }> = [
  { name: "Business Rules", route: "/admin/rules", icon: "shield-check" },
  { name: "Workflow Designer", route: "/admin/workflow-definitions", icon: "workflow" },
  { name: "Audit Log", route: "/admin/audit", icon: "scroll-text" },
  { name: "Table and Column", route: "/admin/tables", icon: "table-2" },
  { name: "Window, Tab and Field", route: "/admin/windows", icon: "app-window" },
  // "Administration" is not decoration. These two maintain `sys_user` and
  // `sys_role`, and a model is free to declare its own `User` or `Role`
  // entity — crm does. Both windows then land in the dictionary under one
  // name, the dashboard renders two identical cards, and which one opens the
  // business records is a coin toss. The dictionary's own screens say so.
  { name: "User Administration", route: "/admin/users", icon: "users" },
  { name: "Role Administration", route: "/admin/roles", icon: "user-cog" },
  { name: "System Configuration", route: "/admin/system", icon: "settings" },
];

const FIELD_GROUPS: Array<{
  name: string;
  description: string;
  seqNo: number;
  collapsed: boolean;
}> = [
  { name: "General", description: "General information fields", seqNo: 10, collapsed: false },
  { name: "Details", description: "Detailed information fields", seqNo: 20, collapsed: true },
  { name: "System", description: "System fields (audit trail)", seqNo: 30, collapsed: true },
];

/** Resolve a role's id by name, so a pre-existing role is honoured. */
function roleRef(name: string): RawSql {
  return raw(`(SELECT sys_role_id FROM sys_role WHERE name = ${lit(name)})`);
}

/** Where one column is placed on its entity's screen — the `sys_field` flags. */
export interface FieldPlacement {
  seqNo: number;
  isDisplayed: boolean;
  isDisplayedGrid: boolean;
  isReadOnly: boolean;
}

/**
 * The placement rule every `sys_field` row is written from.
 *
 * Exported so the manual can report the screen the application actually draws
 * (`manual/index.ts`, "Where it appears") without deriving it a second time:
 * the day this changes, the seed and the manual change together.
 */
export function fieldPlacement(
  entity: Pick<BusEntity, "primaryKey">,
  attr: Pick<BusEntity["attributes"][number], "name" | "columnName">,
  index: number
): FieldPlacement {
  const isKey = attr.name === entity.primaryKey;
  return {
    seqNo: (index + 1) * 10,
    isDisplayed: !isKey,
    // The grid gets the first eight non-key columns; more than that and it
    // scrolls sideways on every screen.
    isDisplayedGrid: !isKey && index < 8,
    isReadOnly: SYSTEM_TIMESTAMPS.includes(attr.columnName),
  };
}

/** One entity's screen, as `seed/dictionary.sql` lays it out. */
export interface ScreenLayout {
  window: string;
  tab: string;
  fields: Array<FieldPlacement & { column: string; label: string }>;
}

/**
 * The window, tab and fields the seed writes for each entity, keyed by table.
 *
 * A line item (`%%entity <E> parent: <P>`) sits on its parent's window, exactly
 * as the seed attaches its `sys_tab` there.
 */
export function screenLayout(entities: BusEntity[]): Map<string, ScreenLayout> {
  const byName = new Map(entities.map((entity) => [entity.name, entity]));
  const layouts = new Map<string, ScreenLayout>();
  for (const entity of entities) {
    const parent = entity.parentEntity ? byName.get(entity.parentEntity) : undefined;
    layouts.set(entity.tableName, {
      window: (parent ?? entity).displayName,
      tab: entity.displayName,
      fields: entity.attributes
        .map((attr, index) => ({
          column: attr.columnName,
          label: attr.displayName,
          ...fieldPlacement(entity, attr, index),
        }))
        .sort((a, b) => a.seqNo - b.seqNo),
    });
  }
  return layouts;
}

export function buildDictionarySeedSql(options: DictionarySeedOptions): string {
  const { projectName, entities } = options;
  const categories = options.categories ?? [];
  const createdBy = options.createdBy ?? "system";
  const help = buildDictionaryHelp(entities);

  /** Deterministic id for a dictionary object, scoped to this project. */
  const id = (kind: string, ...parts: string[]) =>
    uuidv5(`${projectName}:${kind}:${parts.join(":")}`);

  const out: string[] = [];
  const section = (title: string) => {
    out.push("");
    out.push(`-- ${"-".repeat(74)}`);
    out.push(`-- ${title}`);
    out.push(`-- ${"-".repeat(74)}`);
  };

  out.push(`-- Application Dictionary seed for ${projectName}.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_dictionary` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary");
  out.push("-- key, so running this file twice is a no-op and running it after a partial");
  out.push("-- failure completes the job.");

  // --------------------------------------------------------------------------
  section("Reference types");
  for (const reference of REFERENCES) {
    out.push(
      insert("sys_reference", {
        sys_reference_id: reference.id,
        name: reference.name,
        description: reference.description,
        validation_type: reference.validation,
        entity_type: "S",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }
  // One list reference per `%%enum` the model binds to a column. Ids run from
  // 1000 up, allocated by the parser, so they are stable for a given set of
  // enum names and the seed stays idempotent across regenerations.
  for (const modelEnum of options.modelEnums ?? []) {
    out.push(
      insert("sys_reference", {
        sys_reference_id: modelEnum.referenceId,
        name: modelEnum.name,
        description: `Values allowed for ${modelEnum.name}`,
        validation_type: "L",
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
    for (const value of modelEnum.values) {
      out.push(
        insert("sys_ref_list", {
          sys_ref_list_id: id("ref_list", String(modelEnum.referenceId), value),
          sys_reference_id: modelEnum.referenceId,
          value,
          // `pending_review` reads as "Pending Review" in a dropdown. The raw
          // value is what is stored, and what every rule and state machine
          // compares against — only the label is prettified.
          name: value
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
          entity_type: "U",
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW,
          updated_at: NOW,
        })
      );
    }
  }

  for (const item of REF_LISTS) {
    out.push(
      insert("sys_ref_list", {
        sys_ref_list_id: id("ref_list", String(item.referenceId), item.value),
        sys_reference_id: item.referenceId,
        value: item.value,
        name: item.name,
        entity_type: "S",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }

  // --------------------------------------------------------------------------
  section("Roles");
  const roles: Array<{ name: string; description: string; userLevel: string; master: boolean }> = [
    {
      name: "Administrator",
      description: "Full system access",
      userLevel: "S",
      master: true,
    },
    { name: "User", description: "Standard user access", userLevel: "C", master: false },
  ];
  for (const role of roles) {
    out.push(
      insert("sys_role", {
        sys_role_id: id("role", role.name),
        name: role.name,
        description: role.description,
        user_level: role.userLevel,
        is_master_role: role.master,
        is_can_export: true,
        is_can_report: true,
        is_personal_lock: false,
        is_personal_access: false,
        max_query_records: 0,
        is_show_accounting: false,
        entity_type: "S",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }

  // --------------------------------------------------------------------------
  section("Field groups");
  for (const group of FIELD_GROUPS) {
    out.push(
      insert("sys_field_group", {
        sys_field_group_id: id("field_group", group.name),
        name: group.name,
        description: group.description,
        seq_no: group.seqNo,
        columns: 2,
        field_group_type: "C",
        is_collapsed_by_default: group.collapsed,
        entity_type: "D",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }
  const generalGroup = id("field_group", "General");
  const detailsGroup = id("field_group", "Details");

  // --------------------------------------------------------------------------
  /*
   * Parents before children.
   *
   * A line item's tab hangs off its parent's window, and `sys_tab.sys_window_id`
   * is NOT NULL with a foreign key — so the parent's `sys_window` row has to be
   * inserted first. Entities arrive in declaration order, which says nothing
   * about which is which. A stable partition keeps the order identical for a
   * model that declares no parents, which is every model that worked before.
   */
  const tableNameByEntity = new Map(entities.map((entity) => [entity.name, entity.tableName]));
  const ordered = [
    ...entities.filter((entity) => !entity.parentEntity),
    ...entities.filter((entity) => entity.parentEntity),
  ];
  /** Child tabs are numbered after the parent's own tab, which is 10. */
  const childSeqByWindow = new Map<string, number>();
  const nextChildSeq = (window: string) => {
    const seq = (childSeqByWindow.get(window) ?? 10) + 10;
    childSeqByWindow.set(window, seq);
    return seq;
  };

  for (const entity of ordered) {
    section(`${entity.displayName} (${entity.tableName})`);

    const tableId = id("table", entity.tableName);
    const tabId = id("tab", entity.tableName);

    /*
     * A line item gets no window of its own.
     *
     * `%%entity InvoiceLine parent: Invoice` says the child has no life away
     * from its parent, and the dictionary is where that stops being a comment
     * and starts being the application: no window means no card on the
     * dashboard and nothing to navigate to, and the tab below is attached to
     * the *parent's* window instead — which is what puts the lines under the
     * invoice you opened.
     *
     * A child whose parent the model does not declare keeps a window of its
     * own. An orphaned entity you can still open is fixable; one that has
     * quietly vanished from the application is not.
     */
    const parentTable = entity.parentEntity
      ? tableNameByEntity.get(entity.parentEntity)
      : undefined;
    const isChild = !!parentTable;
    const windowId = id("window", parentTable ?? entity.tableName);
    const entityHelp = help[entity.tableName];

    // The window comes first: `sys_table.sys_window_id` points at it. A child
    // reuses its parent's, which the stable partition above has already emitted.
    if (!isChild) {
      out.push(
        insert("sys_window", {
          sys_window_id: windowId,
          name: entity.displayName,
          description: `Maintain ${entity.displayName} records`,
          help: entityHelp?.window ?? null,
          window_type: "M",
          is_sales_transaction: false,
          is_default: true,
          entity_type: "U",
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW,
          updated_at: NOW,
        })
      );
    }

    out.push(
      insert("sys_table", {
        sys_table_id: tableId,
        table_name: entity.tableName,
        name: entity.displayName,
        // An empty description is treated as absent, matching the
        // `{{#if description}}` the NestJS seed template uses — otherwise a
        // model that declares no description leaves the field blank in the UI.
        description: entity.description || `Manage ${entity.displayName} records`,
        // Written only when the model declares one. `sys_table.icon` defaults
        // to 'Table' in m0001, so an entity with no `%%entity … icon:` emits
        // exactly the row it did before this key was read — and the name-pattern
        // guess in `getEntityIcon` stays out of the seed deliberately, because a
        // derivation here would be a second one for the Rust side to mirror.
        ...(entity.icon ? { icon: entity.icon } : {}),
        access_level: "A",
        is_view: false,
        is_document: false,
        is_high_volume: false,
        is_changelog: true,
        sys_window_id: windowId,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );

    out.push(
      insert("sys_tab", {
        sys_tab_id: tabId,
        sys_window_id: windowId,
        sys_table_id: tableId,
        name: entity.displayName,
        help: entityHelp?.tab ?? null,
        // A child's tab sits inside the parent's window at level 1, numbered
        // after the parent's own tab (10) and after any sibling already placed.
        tab_level: isChild ? 1 : 0,
        seq_no: isChild ? nextChildSeq(windowId) : 10,
        is_single_row: true,
        has_tree: false,
        is_info_tab: false,
        is_translation_tab: false,
        is_read_only: false,
        is_insert_record: true,
        is_advanced_tab: false,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );

    entity.attributes.forEach((attr, index) => {
      const isKey = attr.name === entity.primaryKey;
      const isSystemTimestamp = SYSTEM_TIMESTAMPS.includes(attr.columnName);
      out.push(
        insert("sys_column", {
          sys_column_id: id("column", entity.tableName, attr.columnName),
          sys_table_id: tableId,
          column_name: attr.columnName,
          name: attr.displayName,
          // `%%field <Entity>.<column> help:`, as the author wrote it.
          //
          // The parser has hung this on the attribute since `%%field help:`
          // was read, and the seed dropped it: the column existed in the DDL
          // and was never written, so the Application Dictionary's own column
          // screen showed nothing for every column of every entity, in a model
          // that may have described all of them.
          description: attr.description || null,
          sys_reference_id: attr.referenceId,
          field_length: attr.maxLength ?? null,
          default_value: attr.default === undefined ? null : String(attr.default),
          is_key: isKey,
          // Compiere's own marking: the column tying a detail row to its master
          // is `is_parent`, and the tab links on it.
          is_parent: attr.columnName === entity.parentLinkColumn,
          is_mandatory: isSystemTimestamp ? false : attr.required === true,
          is_updateable: !isKey && !isSystemTimestamp,
          is_identifier: attr.isIdentifier,
          is_selection_column: attr.name === "name" || attr.unique === true,
          is_translated: false,
          is_encrypted: false,
          is_allow_logging: true,
          is_allow_copy: !isKey,
          seq_no: (index + 1) * 10,
          entity_type: "U",
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW,
          updated_at: NOW,
        })
      );
    });

    /*
     * Point the child's tab at the column that links it to its parent.
     *
     * An UPDATE rather than a value in the INSERT above, because
     * `sys_tab.link_column_id` is a foreign key onto `sys_column` and the tab
     * row is written before the columns are. Reordering the whole block to suit
     * one case would move every statement in every existing seed.
     */
    if (isChild && entity.parentLinkColumn) {
      out.push(
        `UPDATE sys_tab SET link_column_id = ${lit(
          id("column", entity.tableName, entity.parentLinkColumn)
        )} WHERE sys_tab_id = ${lit(tabId)};`
      );
    }

    entity.attributes.forEach((attr, index) => {
      const placement = fieldPlacement(entity, attr, index);
      out.push(
        insert("sys_field", {
          sys_field_id: id("field", entity.tableName, attr.columnName),
          sys_tab_id: tabId,
          sys_column_id: id("column", entity.tableName, attr.columnName),
          // The first three columns land in General; everything else in
          // Details. Matches the NestJS seed so the two stacks render the same
          // form layout.
          sys_field_group_id: index < 3 ? generalGroup : detailsGroup,
          name: attr.displayName,
          help: entityHelp?.fields[attr.columnName] ?? null,
          seq_no: placement.seqNo,
          seq_no_grid: placement.seqNo,
          is_displayed: placement.isDisplayed,
          is_displayed_grid: placement.isDisplayedGrid,
          is_read_only: placement.isReadOnly,
          is_encrypted: false,
          is_same_line: false,
          is_heading: false,
          is_field_only: false,
          entity_type: "U",
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW,
          updated_at: NOW,
        })
      );
    });

    out.push(
      insert("sys_access", {
        sys_access_id: id("access", "Administrator", entity.tableName),
        sys_role_id: roleRef("Administrator"),
        sys_table_id: tableId,
        sys_window_id: windowId,
        access_type_table: "W",
        is_read_only: false,
        is_exclude: false,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
    out.push(
      insert("sys_access", {
        sys_access_id: id("access", "User", entity.tableName),
        sys_role_id: roleRef("User"),
        sys_table_id: tableId,
        sys_window_id: windowId,
        access_type_table: "R",
        is_read_only: true,
        is_exclude: false,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }

  // --------------------------------------------------------------------------
  section("Admin windows (Application Dictionary section on the dashboard)");
  for (const window of ADMIN_WINDOWS) {
    const windowId = id("admin_window", window.name);
    out.push(
      insert("sys_window", {
        sys_window_id: windowId,
        name: window.name,
        description: window.route,
        icon: window.icon,
        window_type: "M",
        is_sales_transaction: false,
        is_default: false,
        entity_type: "S",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
    out.push(
      insert("sys_access", {
        sys_access_id: id("admin_access", window.name),
        sys_role_id: roleRef("Administrator"),
        sys_window_id: windowId,
        access_type_table: "W",
        is_read_only: false,
        is_exclude: false,
        entity_type: "S",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW,
      })
    );
  }

  // --------------------------------------------------------------------------
  if (categories.length > 0) {
    section("Entity categories");
    // A partial unique index allows only one default; clear the flag first so a
    // changed default never trips it.
    out.push("UPDATE sys_category SET is_default = FALSE WHERE is_default = TRUE;");

    for (const category of categories) {
      out.push(
        insert("sys_category", {
          sys_category_id: id("category", category.code),
          name: category.name,
          code: category.code,
          description: category.description ?? null,
          icon: category.icon ?? null,
          color: category.color ?? null,
          seq_no: category.seqNo,
          is_default: category.isDefault === true,
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW,
          updated_at: NOW,
        })
      );
      // The insert above is a no-op on re-run, so the update is what actually
      // carries an edited name or colour through to an existing category.
      out.push(
        `UPDATE sys_category SET name = ${lit(category.name)}, ` +
          `description = ${lit(category.description ?? null)}, ` +
          `icon = ${lit(category.icon ?? null)}, ` +
          `color = ${lit(category.color ?? null)}, ` +
          `seq_no = ${category.seqNo}, ` +
          `is_default = ${category.isDefault === true ? "TRUE" : "FALSE"}, ` +
          `updated_at = NOW(), updated_by = ${lit(createdBy)} ` +
          `WHERE code = ${lit(category.code)};`
      );
    }

    for (const category of categories) {
      if (category.tables.length === 0) continue;
      const tableList = category.tables.map((table) => lit(table)).join(", ");
      out.push(
        `UPDATE sys_table SET sys_category_id = ` +
          `(SELECT sys_category_id FROM sys_category WHERE code = ${lit(category.code)}) ` +
          `WHERE table_name IN (${tableList});`
      );
    }

    const fallback = categories.find((category) => category.isDefault === true);
    if (fallback) {
      // Anything still uncategorised goes to the default, so the dashboard
      // never has to render an orphan group.
      out.push(
        `UPDATE sys_table SET sys_category_id = ` +
          `(SELECT sys_category_id FROM sys_category WHERE code = ${lit(fallback.code)}) ` +
          `WHERE sys_category_id IS NULL AND table_name LIKE 'bus\\_%';`
      );
    }
  }

  out.push("");
  return out.join("\n");
}

export default buildDictionarySeedSql;
