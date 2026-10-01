//! Application Dictionary seed, emitted as SQL.
//!
//! A port of
//! `packages/generator/src/generators/tanstack-astryx-loco/dictionary-seed.ts`.
//!
//! Without this file every `/api/bus/*` route 404s: the dictionary is what tells
//! the generic controller which tables exist. `src/tasks/seed_dictionary.rs`
//! pulls it in with `include_str!`, so it is also what makes the generated crate
//! compile at all.
//!
//! **Every id is deterministic.** Primary keys are UUIDv5 over the object's
//! natural name, so re-running the seed produces byte-identical statements and
//! `ON CONFLICT DO NOTHING` makes the whole file idempotent — including for the
//! dictionary tables (`sys_window`, `sys_tab`, `sys_field_group`, `sys_access`)
//! that have no natural unique key to conflict on. It also means a generated
//! project's dictionary ids are stable across regenerations, so a URL or a saved
//! report that names a window id keeps working.

use std::collections::HashMap;

use uuid::Uuid;

use crate::bus::BusEntity;
use crate::dictionary_help::build_dictionary_help;
use crate::model::ModelEnum;

/// A category the model declares, resolved to physical tables.
#[derive(Debug, Clone)]
pub struct CategorySeed {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub seq_no: i64,
    pub is_default: bool,
    /// Physical table names (`bus_*`) that belong to this category.
    pub tables: Vec<String>,
}

pub struct DictionarySeedOptions<'a> {
    pub project_name: &'a str,
    pub entities: &'a [BusEntity],
    pub categories: &'a [CategorySeed],
    /// Enums a column's `enum` key binds it to, with their ids.
    ///
    /// Without these the seed still stamps `sys_column.sys_reference_id` with
    /// the enum's id — `attribute_reference_id` reads it before anything else —
    /// and nothing defines that reference or its values, so the generated form
    /// renders an *empty* dropdown: strictly worse than the free-text box it
    /// replaced.
    pub model_enums: &'a [ModelEnum],
    /// Value written to every `created_by` / `updated_by`.
    pub created_by: &'a str,
}

/// Namespace for the generated ids.
///
/// A fixed random UUID, not a project-derived one: two projects that declare the
/// same entity should still get distinct dictionary ids, which they do because
/// the name fed to `uuidv5` is prefixed with the project name.
pub(crate) const NAMESPACE: Uuid = Uuid::from_u128(0x6f9d3a54_1b0e_4c9a_9f2a_8e5d4b7c1a30);

/// Columns whose value the database, not the user, is responsible for.
const SYSTEM_TIMESTAMPS: [&str; 3] = ["created_at", "updated_at", "deleted_at"];

/*
 * The identifier derivation used to live here, as `identifier_columns_for`,
 * beside `IDENTIFIER_COLUMNS` and `LABEL_REFERENCE_IDS`.
 *
 * It disagreed with `identifier_column_names` in `bus.rs` — and with
 * `identifierColumnNames` in `@appwithai/core/types`, which is the same question
 * asked by the frontend, the generated server's `labelFor` and the test harness.
 * This copy returned *every* conventional column it found, so an entity with
 * `name`, `title` and `code` was identified by all three concatenated; and it
 * keyed its fallback off `reference_id`, a dictionary artifact nothing outside
 * this file can see.
 *
 * `entity_to_bus_entity` now marks each attribute, so the seed reads
 * `attr.is_identifier` and there is one derivation again.
 */

/// A value that is SQL, not data.
///
/// A distinct variant rather than a marker prefix on a string: `NOW()` and the
/// role sub-selects must not be quoted, and every other string in this file
/// must be. Making that a type distinction means no model-supplied value can
/// impersonate raw SQL.
pub(crate) enum Sql {
    Raw(String),
    Text(String),
    Int(i64),
    Bool(bool),
    Null,
}

impl Sql {
    fn render(&self) -> String {
        match self {
            Sql::Raw(sql) => sql.clone(),
            Sql::Text(value) => format!("'{}'", value.replace('\'', "''")),
            Sql::Int(value) => value.to_string(),
            Sql::Bool(value) => if *value { "TRUE" } else { "FALSE" }.to_string(),
            Sql::Null => "NULL".to_string(),
        }
    }
}

pub(crate) fn text(value: impl Into<String>) -> Sql {
    Sql::Text(value.into())
}

fn opt_text(value: Option<&String>) -> Sql {
    match value {
        Some(value) => Sql::Text(value.clone()),
        None => Sql::Null,
    }
}

pub(crate) fn now() -> Sql {
    Sql::Raw("NOW()".to_string())
}

/// Single-quoted SQL literal, or NULL — for the fragments built by hand.
fn lit(value: Option<&String>) -> String {
    opt_text(value).render()
}

/// One INSERT with a bare `ON CONFLICT DO NOTHING`.
///
/// Bare rather than targeted on purpose: it covers the primary key *and* every
/// natural unique key (`sys_table.table_name`, `sys_column(table, column)`,
/// `sys_role.name`, …), which is exactly the "insert unless this row is already
/// there in some form" semantics a re-runnable seed wants.
pub(crate) fn insert(table: &str, values: &[(&str, Sql)]) -> String {
    let columns = values
        .iter()
        .map(|(column, _)| *column)
        .collect::<Vec<_>>()
        .join(", ");
    let rendered = values
        .iter()
        .map(|(_, value)| value.render())
        .collect::<Vec<_>>()
        .join(", ");
    format!("INSERT INTO {table} ({columns})\nVALUES ({rendered})\nON CONFLICT DO NOTHING;")
}

/// Resolve a role's id by name, so a pre-existing role is honoured.
pub(crate) fn role_ref(name: &str) -> Sql {
    Sql::Raw(format!(
        "(SELECT sys_role_id FROM sys_role WHERE name = {})",
        text(name).render()
    ))
}

/// The reference-type vocabulary.
///
/// Ids are part of the contract — `sys_column.sys_reference_id` values are
/// emitted by `bus::attribute_reference_id` and read by the frontend to choose
/// an input widget — so they are fixed integers, not generated.
const REFERENCES: &[(i64, &str, &str, &str)] = &[
    (10, "String", "Variable length string", "S"),
    (11, "Integer", "Whole number", "S"),
    (12, "Amount", "Decimal number for amounts", "S"),
    (13, "ID", "Unique identifier (UUID)", "S"),
    (14, "Text", "Long text/memo field", "S"),
    (15, "Date", "Date only", "S"),
    (16, "DateTime", "Date and time", "S"),
    (17, "List", "Dropdown list from sys_ref_list", "L"),
    (18, "Table", "Reference to another table", "T"),
    (
        19,
        "Table Direct",
        "Direct reference using column name",
        "T",
    ),
    (20, "Yes-No", "Boolean yes/no", "S"),
    (24, "URL", "Web URL", "S"),
    (28, "JSON", "JSON data", "S"),
    (30, "Email", "Email address", "S"),
    (31, "Phone", "Phone number", "S"),
    (100, "EntityType", "Entity type classification", "L"),
    (
        101,
        "AccessLevel",
        "Access level for windows and tables",
        "L",
    ),
];

const REF_LISTS: &[(i64, &str, &str)] = &[
    (100, "S", "System Only"),
    (100, "C", "Client"),
    (100, "O", "Organization"),
    (100, "U", "User Maintained"),
    (101, "M", "Maintain"),
    (101, "T", "Transaction"),
    (101, "Q", "Query"),
    (101, "A", "Admin Only"),
];

/// Admin windows (`entity_type = 'S'`).
///
/// These are the Application Dictionary entries the dashboard renders as its
/// admin section; `description` carries the frontend route.
/// The dictionary's own screens, and what each one looks like.
///
/// The icon is a lucide **id** — the same spelling an entity's `icon` holds and
/// the same one `sys_table.icon` holds. The dashboard used to carry a map from
/// window name to an icon and a route in the frontend instead, which meant a
/// window this list added and that map did not know about was dropped from the
/// screen without a word.
const ADMIN_WINDOWS: &[(&str, &str, &str)] = &[
    ("Business Rules", "/admin/rules", "shield-check"),
    (
        "Workflow Designer",
        "/admin/workflow-definitions",
        "workflow",
    ),
    ("Audit Log", "/admin/audit", "scroll-text"),
    ("Table and Column", "/admin/tables", "table-2"),
    ("Window, Tab and Field", "/admin/windows", "app-window"),
    // "Administration" is not decoration. These two maintain `sys_user` and
    // `sys_role`, and a model is free to declare its own `User` or `Role`
    // entity — crm does. Both windows then land in the dictionary under one
    // name, the dashboard renders two identical cards, and which one opens the
    // business records is a coin toss. The dictionary's own screens say so.
    ("User Administration", "/admin/users", "users"),
    ("Role Administration", "/admin/roles", "user-cog"),
    ("System Configuration", "/admin/system", "settings"),
];

const FIELD_GROUPS: &[(&str, &str, i64, bool)] = &[
    ("General", "General information fields", 10, false),
    ("Details", "Detailed information fields", 20, true),
    ("System", "System fields (audit trail)", 30, true),
];

const ROLES: &[(&str, &str, &str, bool)] = &[
    ("Administrator", "Full system access", "S", true),
    ("User", "Standard user access", "C", false),
];

/// `pending_review` -> `Pending Review`, for a dropdown label.
///
/// The stored value is untouched: every rule and state machine compares against
/// the raw one, and prettifying that would break them silently.
fn title_case_enum_value(value: &str) -> String {
    value
        .split('_')
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn build_dictionary_seed_sql(options: &DictionarySeedOptions<'_>) -> String {
    let DictionarySeedOptions {
        project_name,
        entities,
        categories,
        model_enums,
        created_by,
    } = *options;

    let help = build_dictionary_help(entities);

    // Deterministic id for a dictionary object, scoped to this project.
    let id = |kind: &str, parts: &[&str]| -> String {
        let name = format!("{project_name}:{kind}:{}", parts.join(":"));
        Uuid::new_v5(&NAMESPACE, name.as_bytes()).to_string()
    };

    let mut out: Vec<String> = Vec::new();
    let section = |out: &mut Vec<String>, title: &str| {
        out.push(String::new());
        out.push(format!("-- {}", "-".repeat(74)));
        out.push(format!("-- {title}"));
        out.push(format!("-- {}", "-".repeat(74)));
    };

    out.push(format!(
        "-- Application Dictionary seed for {project_name}."
    ));
    out.push("--".to_string());
    out.push(
        "-- Generated by @appwithai/generator — do not edit by hand; regenerate instead."
            .to_string(),
    );
    out.push(
        "-- Applied by `cargo loco task seed_dictionary` and by `cargo loco db seed`.".to_string(),
    );
    out.push("--".to_string());
    out.push(
        "-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary".to_string(),
    );
    out.push(
        "-- key, so running this file twice is a no-op and running it after a partial".to_string(),
    );
    out.push("-- failure completes the job.".to_string());

    // ── Reference types ─────────────────────────────────────────────────────
    section(&mut out, "Reference types");
    for (reference_id, name, description, validation) in REFERENCES {
        out.push(insert(
            "sys_reference",
            &[
                ("sys_reference_id", Sql::Int(*reference_id)),
                ("name", text(*name)),
                ("description", text(*description)),
                ("validation_type", text(*validation)),
                ("entity_type", text("S")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }
    // One list reference per enum the model binds to a column. Ids run from
    // 1000 up, allocated by the parser, so they are stable for a given set of
    // enum names and the seed stays idempotent across regenerations.
    for model_enum in model_enums {
        out.push(insert(
            "sys_reference",
            &[
                (
                    "sys_reference_id",
                    Sql::Int(i64::from(model_enum.reference_id)),
                ),
                ("name", text(model_enum.name.clone())),
                (
                    "description",
                    text(format!("Values allowed for {}", model_enum.name)),
                ),
                ("validation_type", text("L")),
                ("entity_type", text("U")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
        for value in &model_enum.values {
            out.push(insert(
                "sys_ref_list",
                &[
                    (
                        "sys_ref_list_id",
                        text(id(
                            "ref_list",
                            &[&model_enum.reference_id.to_string(), value],
                        )),
                    ),
                    (
                        "sys_reference_id",
                        Sql::Int(i64::from(model_enum.reference_id)),
                    ),
                    ("value", text(value.clone())),
                    // `pending_review` reads as "Pending Review" in a dropdown.
                    // The raw value is what is stored, and what every rule and
                    // state machine compares against — only the label is
                    // prettified.
                    ("name", text(title_case_enum_value(value))),
                    ("entity_type", text("U")),
                    ("is_active", Sql::Bool(true)),
                    ("created_by", text(created_by)),
                    ("updated_by", text(created_by)),
                    ("created_at", now()),
                    ("updated_at", now()),
                ],
            ));
        }
    }

    for (reference_id, value, name) in REF_LISTS {
        out.push(insert(
            "sys_ref_list",
            &[
                (
                    "sys_ref_list_id",
                    text(id("ref_list", &[&reference_id.to_string(), value])),
                ),
                ("sys_reference_id", Sql::Int(*reference_id)),
                ("value", text(*value)),
                ("name", text(*name)),
                ("entity_type", text("S")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }

    // ── Roles ───────────────────────────────────────────────────────────────
    section(&mut out, "Roles");
    for (name, description, user_level, master) in ROLES {
        out.push(insert(
            "sys_role",
            &[
                ("sys_role_id", text(id("role", &[name]))),
                ("name", text(*name)),
                ("description", text(*description)),
                ("user_level", text(*user_level)),
                ("is_master_role", Sql::Bool(*master)),
                ("is_can_export", Sql::Bool(true)),
                ("is_can_report", Sql::Bool(true)),
                ("is_personal_lock", Sql::Bool(false)),
                ("is_personal_access", Sql::Bool(false)),
                ("max_query_records", Sql::Int(0)),
                ("is_show_accounting", Sql::Bool(false)),
                ("entity_type", text("S")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }

    // ── Field groups ────────────────────────────────────────────────────────
    section(&mut out, "Field groups");
    for (name, description, seq_no, collapsed) in FIELD_GROUPS {
        out.push(insert(
            "sys_field_group",
            &[
                ("sys_field_group_id", text(id("field_group", &[name]))),
                ("name", text(*name)),
                ("description", text(*description)),
                ("seq_no", Sql::Int(*seq_no)),
                ("columns", Sql::Int(2)),
                ("field_group_type", text("C")),
                ("is_collapsed_by_default", Sql::Bool(*collapsed)),
                ("entity_type", text("D")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }
    let general_group = id("field_group", &["General"]);
    let details_group = id("field_group", &["Details"]);

    // ── One section per entity ──────────────────────────────────────────────
    // Parents before children.
    //
    // A line item's tab hangs off its parent's window, and `sys_tab.sys_window_id`
    // is NOT NULL with a foreign key — so the parent's `sys_window` row has to be
    // inserted first. Entities arrive in declaration order, which says nothing
    // about which is which. A stable partition keeps the order identical for a
    // model that declares no parents, which is every model that worked before.
    let table_name_by_entity: HashMap<&str, &str> = entities
        .iter()
        .map(|entity| (entity.name.as_str(), entity.table_name.as_str()))
        .collect();
    let ordered: Vec<&BusEntity> = entities
        .iter()
        .filter(|entity| entity.parent_entity.is_none())
        .chain(
            entities
                .iter()
                .filter(|entity| entity.parent_entity.is_some()),
        )
        .collect();
    // Child tabs are numbered after the parent's own tab, which is 10.
    let mut child_seq_by_window: HashMap<String, i64> = HashMap::new();

    for entity in ordered {
        section(
            &mut out,
            &format!("{} ({})", entity.display_name, entity.table_name),
        );

        let table_id = id("table", &[&entity.table_name]);
        let tab_id = id("tab", &[&entity.table_name]);

        // A line item gets no window of its own. `InvoiceLine` with `parent:
        // Invoice` says the child has no life away from its parent, and the
        // dictionary is where that stops being a comment and starts being the
        // application: no window means no card on the dashboard and nothing to
        // navigate to, and the tab below is attached to the *parent's* window
        // instead — which is what puts the lines under the invoice you opened.
        //
        // A child whose parent the model does not declare keeps a window of its
        // own. An orphaned entity you can still open is fixable; one that has
        // quietly vanished from the application is not.
        let parent_table: Option<&str> = entity
            .parent_entity
            .as_deref()
            .and_then(|parent| table_name_by_entity.get(parent).copied());
        let is_child = parent_table.is_some();
        let window_id = id("window", &[parent_table.unwrap_or(&entity.table_name)]);
        let entity_help = help.get(&entity.table_name);

        // The window comes first: `sys_table.sys_window_id` points at it. A child
        // reuses its parent's, which the stable partition above already emitted.
        if !is_child {
            let mut window_columns: Vec<(&str, Sql)> = vec![
                ("sys_window_id", text(window_id.clone())),
                ("name", text(entity.display_name.clone())),
                (
                    "description",
                    text(format!("Maintain {} records", entity.display_name)),
                ),
                (
                    "help",
                    entity_help
                        .map(|h| text(h.window.clone()))
                        .unwrap_or(Sql::Null),
                ),
            ];
            // The icon the dashboard card and the menu draw, from the window like
            // every other label on them. Written only when the model declares one,
            // so a model without icons seeds exactly what it always did.
            if let Some(icon) = entity.icon.as_ref().filter(|icon| !icon.is_empty()) {
                window_columns.push(("icon", text(icon.clone())));
            }
            window_columns.extend([
                ("window_type", text("M")),
                ("is_sales_transaction", Sql::Bool(false)),
                ("is_default", Sql::Bool(true)),
                ("entity_type", text("U")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ]);
            out.push(insert("sys_window", &window_columns));
        }

        // Written only when the model declares one — see the TypeScript seed.
        let mut table_columns: Vec<(&str, Sql)> = vec![
            ("sys_table_id", text(table_id.clone())),
            ("table_name", text(entity.table_name.clone())),
            ("name", text(entity.display_name.clone())),
            // An empty description is treated as absent, matching the
            // `{{#if description}}` the NestJS seed template used —
            // otherwise a model that declares no description leaves the
            // field blank in the UI.
            (
                "description",
                text(if entity.description.is_empty() {
                    format!("Manage {} records", entity.display_name)
                } else {
                    entity.description.clone()
                }),
            ),
        ];
        if let Some(icon) = entity.icon.as_ref().filter(|icon| !icon.is_empty()) {
            table_columns.push(("icon", text(icon.clone())));
        }
        table_columns.extend([
            ("access_level", text("A")),
            ("is_view", Sql::Bool(false)),
            ("is_document", Sql::Bool(false)),
            ("is_high_volume", Sql::Bool(false)),
            ("is_changelog", Sql::Bool(true)),
            ("sys_window_id", text(window_id.clone())),
            ("entity_type", text("U")),
            ("is_active", Sql::Bool(true)),
            ("created_by", text(created_by)),
            ("updated_by", text(created_by)),
            ("created_at", now()),
            ("updated_at", now()),
        ]);
        out.push(insert("sys_table", &table_columns));

        out.push(insert(
            "sys_tab",
            &[
                ("sys_tab_id", text(tab_id.clone())),
                ("sys_window_id", text(window_id.clone())),
                ("sys_table_id", text(table_id.clone())),
                ("name", text(entity.display_name.clone())),
                (
                    "help",
                    entity_help
                        .map(|h| text(h.tab.clone()))
                        .unwrap_or(Sql::Null),
                ),
                // A child's tab sits inside the parent's window at level 1,
                // numbered after the parent's own tab (10) and after any
                // sibling already placed.
                ("tab_level", Sql::Int(i64::from(is_child))),
                (
                    "seq_no",
                    Sql::Int(if is_child {
                        let seq = child_seq_by_window.entry(window_id.clone()).or_insert(10);
                        *seq += 10;
                        *seq
                    } else {
                        10
                    }),
                ),
                ("is_single_row", Sql::Bool(true)),
                ("has_tree", Sql::Bool(false)),
                ("is_info_tab", Sql::Bool(false)),
                ("is_translation_tab", Sql::Bool(false)),
                ("is_read_only", Sql::Bool(false)),
                ("is_insert_record", Sql::Bool(true)),
                ("is_advanced_tab", Sql::Bool(false)),
                ("entity_type", text("U")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));

        for (index, attr) in entity.attributes.iter().enumerate() {
            let is_key = attr.name == entity.primary_key;
            let is_system_timestamp = SYSTEM_TIMESTAMPS.contains(&attr.column_name.as_str());
            out.push(insert(
                "sys_column",
                &[
                    (
                        "sys_column_id",
                        text(id("column", &[&entity.table_name, &attr.column_name])),
                    ),
                    ("sys_table_id", text(table_id.clone())),
                    ("column_name", text(attr.column_name.clone())),
                    ("name", text(attr.display_name.clone())),
                    // The column's `help`, as the author wrote it.
                    //
                    // The parser has hung this on the attribute since
                    // the column's `help` was read, and the seed dropped it: the
                    // column existed in the DDL and was never written, so the
                    // Application Dictionary's own column screen showed nothing
                    // for every column of every entity, in a model that may
                    // have described all of them.
                    ("description", opt_text(attr.description.as_ref())),
                    ("sys_reference_id", Sql::Int(attr.reference_id as i64)),
                    (
                        "field_length",
                        attr.max_length
                            .map(|length| Sql::Int(length as i64))
                            .unwrap_or(Sql::Null),
                    ),
                    // The parser carries no column defaults, so this is always
                    // NULL today. Kept in the statement rather than dropped so
                    // the emitted column list matches the TypeScript seed.
                    ("default_value", Sql::Null),
                    ("is_key", Sql::Bool(is_key)),
                    // Compiere's own marking: the column tying a detail row
                    // to its master is `is_parent`, and the tab links on it.
                    (
                        "is_parent",
                        Sql::Bool(
                            entity.parent_link_column.as_deref() == Some(attr.column_name.as_str()),
                        ),
                    ),
                    (
                        "is_mandatory",
                        Sql::Bool(!is_system_timestamp && attr.required),
                    ),
                    ("is_updateable", Sql::Bool(!is_key && !is_system_timestamp)),
                    ("is_identifier", Sql::Bool(attr.is_identifier)),
                    (
                        "is_selection_column",
                        Sql::Bool(attr.name == "name" || attr.unique),
                    ),
                    ("is_translated", Sql::Bool(false)),
                    ("is_encrypted", Sql::Bool(false)),
                    ("is_allow_logging", Sql::Bool(true)),
                    ("is_allow_copy", Sql::Bool(!is_key)),
                    ("seq_no", Sql::Int((index as i64 + 1) * 10)),
                    ("entity_type", text("U")),
                    ("is_active", Sql::Bool(true)),
                    ("created_by", text(created_by)),
                    ("updated_by", text(created_by)),
                    ("created_at", now()),
                    ("updated_at", now()),
                ],
            ));
        }

        // Store the target of each lookup whose name does not say it — a CEDM
        // reference named outright. A separate statement rather than a value
        // in the INSERT keeps every seed of a model without one byte for byte
        // what it was. The column exists from m0018.
        for attr in &entity.attributes {
            if let Some(table) = attr.references_table.as_deref() {
                out.push(format!(
                    "UPDATE sys_column SET ref_table_name = {} WHERE sys_column_id = {};",
                    text(table).render(),
                    text(id("column", &[&entity.table_name, &attr.column_name])).render(),
                ));
            }
        }

        // Point the child's tab at the column that links it to its parent.
        //
        // An UPDATE rather than a value in the INSERT above, because
        // `sys_tab.link_column_id` is a foreign key onto `sys_column` and the
        // tab row is written before the columns are. Reordering the whole block
        // to suit one case would move every statement in every existing seed.
        if let (true, Some(link_column)) = (is_child, entity.parent_link_column.as_deref()) {
            out.push(format!(
                "UPDATE sys_tab SET link_column_id = {} WHERE sys_tab_id = {};",
                text(id("column", &[&entity.table_name, link_column])).render(),
                text(tab_id.clone()).render(),
            ));
        }

        for (index, attr) in entity.attributes.iter().enumerate() {
            let is_key = attr.name == entity.primary_key;
            out.push(insert(
                "sys_field",
                &[
                    (
                        "sys_field_id",
                        text(id("field", &[&entity.table_name, &attr.column_name])),
                    ),
                    ("sys_tab_id", text(tab_id.clone())),
                    (
                        "sys_column_id",
                        text(id("column", &[&entity.table_name, &attr.column_name])),
                    ),
                    // The first three columns land in General; everything else
                    // in Details.
                    (
                        "sys_field_group_id",
                        text(if index < 3 {
                            general_group.clone()
                        } else {
                            details_group.clone()
                        }),
                    ),
                    ("name", text(attr.display_name.clone())),
                    (
                        "help",
                        entity_help
                            .and_then(|h| h.fields.get(&attr.column_name))
                            .map(|value| text(value.clone()))
                            .unwrap_or(Sql::Null),
                    ),
                    ("seq_no", Sql::Int((index as i64 + 1) * 10)),
                    ("seq_no_grid", Sql::Int((index as i64 + 1) * 10)),
                    ("is_displayed", Sql::Bool(!is_key)),
                    // The grid gets the first eight non-key columns; more than
                    // that and it scrolls sideways on every screen.
                    ("is_displayed_grid", Sql::Bool(!is_key && index < 8)),
                    (
                        "is_read_only",
                        Sql::Bool(SYSTEM_TIMESTAMPS.contains(&attr.column_name.as_str())),
                    ),
                    ("is_encrypted", Sql::Bool(false)),
                    ("is_same_line", Sql::Bool(false)),
                    ("is_heading", Sql::Bool(false)),
                    ("is_field_only", Sql::Bool(false)),
                    ("entity_type", text("U")),
                    ("is_active", Sql::Bool(true)),
                    ("created_by", text(created_by)),
                    ("updated_by", text(created_by)),
                    ("created_at", now()),
                    ("updated_at", now()),
                ],
            ));
        }

        out.push(insert(
            "sys_access",
            &[
                (
                    "sys_access_id",
                    text(id("access", &["Administrator", &entity.table_name])),
                ),
                ("sys_role_id", role_ref("Administrator")),
                ("sys_table_id", text(table_id.clone())),
                ("sys_window_id", text(window_id.clone())),
                ("access_type_table", text("W")),
                ("is_read_only", Sql::Bool(false)),
                ("is_exclude", Sql::Bool(false)),
                ("entity_type", text("U")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
        out.push(insert(
            "sys_access",
            &[
                (
                    "sys_access_id",
                    text(id("access", &["User", &entity.table_name])),
                ),
                ("sys_role_id", role_ref("User")),
                ("sys_table_id", text(table_id)),
                ("sys_window_id", text(window_id)),
                ("access_type_table", text("R")),
                ("is_read_only", Sql::Bool(true)),
                ("is_exclude", Sql::Bool(false)),
                ("entity_type", text("U")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }

    // ── Admin windows ───────────────────────────────────────────────────────
    section(
        &mut out,
        "Admin windows (Application Dictionary section on the dashboard)",
    );
    for (name, route, icon) in ADMIN_WINDOWS {
        let window_id = id("admin_window", &[name]);
        out.push(insert(
            "sys_window",
            &[
                ("sys_window_id", text(window_id.clone())),
                ("name", text(*name)),
                ("description", text(*route)),
                ("icon", text(*icon)),
                ("window_type", text("M")),
                ("is_sales_transaction", Sql::Bool(false)),
                ("is_default", Sql::Bool(false)),
                ("entity_type", text("S")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
        out.push(insert(
            "sys_access",
            &[
                ("sys_access_id", text(id("admin_access", &[name]))),
                ("sys_role_id", role_ref("Administrator")),
                ("sys_window_id", text(window_id)),
                ("access_type_table", text("W")),
                ("is_read_only", Sql::Bool(false)),
                ("is_exclude", Sql::Bool(false)),
                ("entity_type", text("S")),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }

    // ── Categories ──────────────────────────────────────────────────────────
    if !categories.is_empty() {
        section(&mut out, "Entity categories");
        // A partial unique index allows only one default; clear the flag first
        // so a changed default never trips it.
        out.push("UPDATE sys_category SET is_default = FALSE WHERE is_default = TRUE;".to_string());

        for category in categories {
            out.push(insert(
                "sys_category",
                &[
                    ("sys_category_id", text(id("category", &[&category.code]))),
                    ("name", text(category.name.clone())),
                    ("code", text(category.code.clone())),
                    ("description", opt_text(category.description.as_ref())),
                    ("icon", opt_text(category.icon.as_ref())),
                    ("color", opt_text(category.color.as_ref())),
                    ("seq_no", Sql::Int(category.seq_no)),
                    ("is_default", Sql::Bool(category.is_default)),
                    ("is_active", Sql::Bool(true)),
                    ("created_by", text(created_by)),
                    ("updated_by", text(created_by)),
                    ("created_at", now()),
                    ("updated_at", now()),
                ],
            ));
            // The insert above is a no-op on re-run, so the update is what
            // actually carries an edited name or colour through to an existing
            // category.
            out.push(format!(
                "UPDATE sys_category SET name = {name}, description = {description}, icon = {icon}, \
                 color = {color}, seq_no = {seq_no}, is_default = {is_default}, updated_at = NOW(), \
                 updated_by = {created_by} WHERE code = {code};",
                name = text(category.name.clone()).render(),
                description = lit(category.description.as_ref()),
                icon = lit(category.icon.as_ref()),
                color = lit(category.color.as_ref()),
                seq_no = category.seq_no,
                is_default = if category.is_default { "TRUE" } else { "FALSE" },
                created_by = text(created_by).render(),
                code = text(category.code.clone()).render(),
            ));
        }

        for category in categories {
            if category.tables.is_empty() {
                continue;
            }
            let table_list = category
                .tables
                .iter()
                .map(|table| text(table.clone()).render())
                .collect::<Vec<_>>()
                .join(", ");
            out.push(format!(
                "UPDATE sys_table SET sys_category_id = (SELECT sys_category_id FROM sys_category \
                 WHERE code = {code}) WHERE table_name IN ({table_list});",
                code = text(category.code.clone()).render(),
            ));
        }

        if let Some(fallback) = categories.iter().find(|category| category.is_default) {
            // Anything still uncategorised goes to the default, so the
            // dashboard never has to render an orphan group.
            out.push(format!(
                "UPDATE sys_table SET sys_category_id = (SELECT sys_category_id FROM sys_category \
                 WHERE code = {code}) WHERE sys_category_id IS NULL AND table_name LIKE 'bus\\_%';",
                code = text(fallback.code.clone()).render(),
            ));
        }
    }

    out.push(String::new());
    out.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bus::{declared_entity_names, entity_to_bus_entity};
    use crate::yaml_model::test_model;

    fn entities() -> Vec<BusEntity> {
        let parsed = test_model(
            r#"eml: "1.0"
entities:
  - name: Compound
    attributes:
      - name: id
        type: string
        pk: true
      - name: smiles
        type: string
        unique: true
      - name: molecular_weight
        type: decimal
        optional: true
"#,
        )
        .entities;
        let declared = declared_entity_names(&parsed);
        parsed
            .iter()
            .map(|entity| entity_to_bus_entity(entity, &declared))
            .collect()
    }

    fn seed(categories: &[CategorySeed]) -> String {
        build_dictionary_seed_sql(&DictionarySeedOptions {
            project_name: "drug-discovery",
            entities: &entities(),
            categories,
            model_enums: &[],
            created_by: "system",
        })
    }

    #[test]
    fn ids_are_deterministic_across_runs() {
        assert_eq!(seed(&[]), seed(&[]));
    }

    #[test]
    fn the_project_name_scopes_the_ids() {
        let other = build_dictionary_seed_sql(&DictionarySeedOptions {
            project_name: "other-project",
            entities: &entities(),
            categories: &[],
            model_enums: &[],
            created_by: "system",
        });
        // Same entity, different project: the table id must differ, or two
        // projects sharing a database would collide.
        assert_ne!(seed(&[]), other);
    }

    #[test]
    fn every_statement_is_re_runnable() {
        let sql = seed(&[]);
        let inserts = sql.matches("INSERT INTO").count();
        let guards = sql.matches("ON CONFLICT DO NOTHING;").count();
        assert_eq!(inserts, guards, "an INSERT without a conflict guard");
    }

    #[test]
    fn a_quote_in_model_text_cannot_break_out_of_its_literal() {
        let sql = build_dictionary_seed_sql(&DictionarySeedOptions {
            project_name: "drug-discovery",
            entities: &entities(),
            categories: &[CategorySeed {
                name: "Bob's Lab".to_string(),
                code: "bobs-lab".to_string(),
                description: Some("It's fine".to_string()),
                icon: None,
                color: None,
                seq_no: 10,
                is_default: true,
                tables: vec!["bus_compound".to_string()],
            }],
            model_enums: &[],
            created_by: "system",
        });
        assert!(sql.contains("'Bob''s Lab'"), "{sql}");
        assert!(sql.contains("'It''s fine'"));
    }

    #[test]
    fn a_line_item_has_no_window_and_its_tab_hangs_off_the_parent() {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Invoice
    attributes:
      - name: id
        type: string
        pk: true
      - name: name
        type: string
  - name: InvoiceLine
    parent: Invoice
    attributes:
      - name: id
        type: string
        pk: true
      - name: invoice_id
        type: string
        fk: true
      - name: description
        type: string
"#,
        );
        let declared = declared_entity_names(&model.entities);
        let entities: Vec<BusEntity> = model
            .entities
            .iter()
            .map(|entity| entity_to_bus_entity(entity, &declared))
            .collect();
        let sql = build_dictionary_seed_sql(&DictionarySeedOptions {
            project_name: "billing",
            entities: &entities,
            categories: &[],
            model_enums: &[],
            created_by: "system",
        });

        // One business window, not two: the child is reached through its parent.
        assert_eq!(
            sql.matches("INSERT INTO sys_window").count(),
            1 + ADMIN_WINDOWS.len()
        );

        // The child's tab is at level 1 and links on the foreign key it already
        // declared, and the marking goes on that column.
        assert!(sql.contains("UPDATE sys_tab SET link_column_id ="), "{sql}");
        // The `VALUES` line of each sys_tab insert, in order. Splitting the
        // document on the INSERT keyword does not isolate them: help text
        // contains commas, and the final chunk runs on into the next table.
        let lines: Vec<&str> = sql.lines().collect();
        let tab_values: Vec<&str> = lines
            .iter()
            .enumerate()
            .filter(|(index, line)| {
                line.starts_with("VALUES (")
                    && index
                        .checked_sub(1)
                        .and_then(|previous| lines.get(previous))
                        .is_some_and(|previous| previous.starts_with("INSERT INTO sys_tab "))
            })
            .map(|(_, line)| *line)
            .collect();
        assert_eq!(tab_values.len(), 2, "one tab each");

        let parent_tab = tab_values[0];
        let child_tab = tab_values[1];
        assert!(parent_tab.contains("'Invoice',"), "{parent_tab}");
        assert!(child_tab.contains("'Invoice Line',"), "{child_tab}");
        // tab_level 1, seq_no 20 — inside the parent, after the parent's own tab.
        assert!(
            child_tab.contains(", 1, 20,"),
            "tab_level/seq_no: {child_tab}"
        );
        // And inside the *same* window as its parent, which is the whole point.
        let window_of = |values: &str| values.split(", ").nth(1).unwrap().to_string();
        assert_eq!(
            window_of(parent_tab),
            window_of(child_tab),
            "the child's tab must hang off the parent's window"
        );
    }

    #[test]
    fn the_window_precedes_the_table_that_points_at_it() {
        let sql = seed(&[]);
        let window = sql.find("INSERT INTO sys_window").unwrap();
        let table = sql.find("INSERT INTO sys_table").unwrap();
        assert!(window < table, "sys_table.sys_window_id would dangle");
    }

    #[test]
    fn key_columns_are_not_editable_and_not_shown() {
        let sql = seed(&[]);
        // The `id` column's sys_field row: not displayed, not in the grid.
        let field = sql
            .split("INSERT INTO sys_field ")
            .find(|chunk| chunk.contains("'Id'"))
            .expect("an id field row");
        assert!(field.contains("FALSE, FALSE, FALSE"), "{field}");
    }

    #[test]
    fn categories_clear_the_default_before_setting_one() {
        let sql = seed(&[CategorySeed {
            name: "Compound Registry".to_string(),
            code: "compound-registry".to_string(),
            description: None,
            icon: Some("FlaskConical".to_string()),
            color: None,
            seq_no: 10,
            is_default: true,
            tables: vec!["bus_compound".to_string()],
        }]);
        let clear = sql
            .find("UPDATE sys_category SET is_default = FALSE")
            .unwrap();
        let insert = sql.find("INSERT INTO sys_category").unwrap();
        assert!(clear < insert, "the partial unique index would be tripped");
        assert!(sql.contains("WHERE table_name IN ('bus_compound');"));
        // An absent description/colour is NULL, not the string "None".
        assert!(
            sql.contains("'compound-registry', NULL, 'FlaskConical', NULL"),
            "{sql}"
        );
    }
}
