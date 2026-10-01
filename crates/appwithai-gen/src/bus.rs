//! The `bus_*` view of a parsed entity — the shape templates and the dictionary
//! seed both read.
//!
//! A port of `packages/core/src/types/bus-entity.types.ts`. The serialised field
//! names are the template contract, so they stay camelCase here even though the
//! Rust fields are snake_case.
//!
//! Two things this layer decides that nothing else does:
//!
//!   * the physical table name (`Compound` → `bus_compound`), which `sys_table`
//!     is matched on; and
//!   * `referenceId`, the `sys_reference_id` that tells the frontend which
//!     control to render for a column. Key columns are UUIDs in the physical
//!     schema whatever scalar type the ERD declared, so they resolve to
//!     `ID`/`TABLE_DIRECT` rather than to their declared type — get this wrong
//!     and a foreign key renders as a raw UUID text box instead of a lookup.

use std::collections::HashMap;

use serde::Serialize;

use crate::model::{Attribute, Entity, EntityIndex};
use crate::naming::{snake_case, BUS_TABLE_PREFIX};

/// `sys_reference_id` values. Mirrors `ReferenceType` in
/// `packages/core/src/types/sys-dictionary.types.ts`; the numbers are stored in
/// the database, so they are not free to change on this side alone.
pub mod reference_type {
    pub const STRING: u16 = 10;
    pub const INTEGER: u16 = 11;
    pub const AMOUNT: u16 = 12;
    pub const ID: u16 = 13;
    pub const TEXT: u16 = 14;
    pub const DATE: u16 = 15;
    pub const DATETIME: u16 = 16;
    pub const TABLE_DIRECT: u16 = 19;
    pub const YES_NO: u16 = 20;
    pub const URL: u16 = 24;
    pub const COLOR: u16 = 27;
    pub const JSON: u16 = 28;
    pub const PASSWORD: u16 = 29;
    pub const EMAIL: u16 = 30;
    pub const PHONE: u16 = 31;
}

#[derive(Debug, Clone, Serialize)]
pub struct BusAttribute {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: String,
    pub required: bool,
    pub unique: bool,
    #[serde(rename = "maxLength", skip_serializing_if = "Option::is_none")]
    pub max_length: Option<u32>,
    #[serde(rename = "isForeignKey", skip_serializing_if = "std::ops::Not::not")]
    pub is_foreign_key: bool,
    #[serde(rename = "isPrimaryKey", skip_serializing_if = "std::ops::Not::not")]
    pub is_primary_key: bool,
    /// Physical column name. Equal to `name` today; kept separate because the
    /// dictionary stores both and a future rename rule has one place to live.
    #[serde(rename = "columnName")]
    pub column_name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "referenceId")]
    pub reference_id: u16,
    /// Column order, in tens, so a hand-inserted column can be slotted between
    /// two generated ones without renumbering the table.
    #[serde(rename = "seqNo")]
    pub seq_no: u32,
    /// Part of the record's display value — `sys_column.is_identifier`.
    ///
    /// Decided across the whole attribute list rather than per attribute (a
    /// surname only identifies a person alongside a forename), so it is set by
    /// `entity_to_bus_entity` and carried here for every template that needs it.
    #[serde(rename = "isIdentifier")]
    pub is_identifier: bool,
    /// The entity a foreign key names outright (a CEDM reference), and the
    /// table that is — what `sys_column.ref_table_name` stores and every lookup
    /// resolver prefers. Absent for every column whose name says it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub references: Option<String>,
    #[serde(rename = "referencesTable", skip_serializing_if = "Option::is_none")]
    pub references_table: Option<String>,
    /// Foreign-key columns of the entity that narrow this lookup's choices.
    #[serde(rename = "narrowedBy", skip_serializing_if = "Option::is_none")]
    pub narrowed_by: Option<Vec<String>>,
    /// The column's `help`, as the author wrote it.
    ///
    /// The only text in a generated application that carries *domain*
    /// knowledge rather than schema, and the reason `sys_column.description`
    /// exists. Kept on the bus attribute so the dictionary seed and the help
    /// composer read one value rather than each going back to the parsed model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BusEntity {
    pub name: String,
    #[serde(rename = "tableName")]
    pub table_name: String,
    #[serde(rename = "originalName")]
    pub original_name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub description: String,
    pub attributes: Vec<BusAttribute>,
    #[serde(rename = "primaryKey")]
    pub primary_key: String,
    pub timestamps: bool,
    /// The entity's declared `indexes` merged with the conventional single-column
    /// ones, so the DDL emits each index once.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indexes: Option<Vec<EntityIndex>>,
    /// The entity whose window holds this one's tab — itself, or its `parent:`.
    #[serde(rename = "windowOwner")]
    pub window_owner: String,
    /// The entity this one is a line item of, from its `parent`.
    #[serde(rename = "parentEntity", skip_serializing_if = "Option::is_none")]
    pub parent_entity: Option<String>,
    /// The child's foreign key back to `parentEntity`.
    #[serde(rename = "parentLinkColumn", skip_serializing_if = "Option::is_none")]
    pub parent_link_column: Option<String>,
    /// The entity's `icon`, carried through to `sys_table.icon`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    /// Rows the entity ships with (reference data).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<crate::records::EntityData>,
}

impl BusEntity {
    /// The module/file stem the generated test suites use for this entity.
    ///
    /// `tests/requests/mod.rs` declares the modules and the per-entity files are
    /// written next to it, so both have to derive the name the same way or the
    /// crate does not compile.
    pub fn slug(&self) -> String {
        let stripped = self
            .table_name
            .strip_prefix(BUS_TABLE_PREFIX)
            .unwrap_or(&self.table_name);
        let mut out = String::with_capacity(stripped.len());
        let mut prev_underscore = false;
        for ch in stripped.chars() {
            if ch.is_ascii_alphanumeric() {
                out.push(ch);
                prev_underscore = false;
            } else if !prev_underscore {
                out.push('_');
                prev_underscore = true;
            }
        }
        out
    }
}

/// Convert a parsed entity into its `bus_*` form.
/// Every entity name, keyed by itself with separators and case removed.
///
/// `kyc_record` and `KYCRecord` both squash to `kycrecord`, which is what lets
/// a column find the entity it points at. Case is the thing being recovered, so
/// it cannot also be the thing being matched on.
pub fn declared_entity_names(entities: &[Entity]) -> HashMap<String, String> {
    entities
        .iter()
        .map(|entity| {
            (
                entity.name.to_ascii_lowercase().replace('_', ""),
                entity.name.clone(),
            )
        })
        .collect()
}

/// Convert a parsed entity into its `bus_*` form, resolving foreign-key labels
/// against the entity names the model declares.
pub fn entity_to_bus_entity(entity: &Entity, declared: &HashMap<String, String>) -> BusEntity {
    let table_name = if entity.table_name.starts_with(BUS_TABLE_PREFIX) {
        entity.table_name.clone()
    } else {
        format!("{BUS_TABLE_PREFIX}{}", entity.table_name)
    };

    let attributes: Vec<BusAttribute> = entity
        .attributes
        .iter()
        .enumerate()
        .map(|(index, attr)| attribute_to_bus_attribute(attr, index, &entity.primary_key, declared))
        .collect();

    BusEntity {
        name: entity.name.clone(),
        table_name,
        original_name: entity.name.clone(),
        display_name: format_display_name(&entity.name),
        description: entity.description.clone(),
        attributes: with_identifiers(attributes, &entity.primary_key),
        primary_key: entity.primary_key.clone(),
        timestamps: entity.timestamps,
        indexes: Some(merge_indexes(entity)),
        // Whose window this entity's records are reached through: itself, unless
        // its `parent` made it a line item, in which case the
        // parent's — a child has no window of its own.
        icon: entity.icon.clone(),
        data: entity.data.clone(),
        window_owner: entity
            .parent_entity
            .clone()
            .unwrap_or_else(|| entity.name.clone()),
        parent_entity: entity.parent_entity.clone(),
        parent_link_column: entity.parent_link_column.clone(),
    }
}

/// Mark the columns that make up the record's display value.
fn with_identifiers(mut attributes: Vec<BusAttribute>, primary_key: &str) -> Vec<BusAttribute> {
    let identifiers = identifier_column_names(&attributes, primary_key);
    for attribute in &mut attributes {
        attribute.is_identifier = identifiers.contains(&attribute.name);
    }
    attributes
}

/// The columns that say what a record *is*, in the Application Dictionary's own
/// terms.
///
/// `sys_column.is_identifier` is the dictionary's answer to "what is this record
/// called": the identifier columns, concatenated in `seq_no` order, are the
/// record's display value — what a lookup lists, and what a grid shows in place
/// of a foreign key.
///
/// This mirrors `identifierColumnNames` in `@appwithai/core/types` exactly, and
/// must keep mirroring it: the frontend, the generated server's `labelFor` and
/// the test harness all ask the same question, and two answers to "what is this
/// record called" is one too many.
///
/// Returns the names in the order they should be concatenated.
fn identifier_column_names(attributes: &[BusAttribute], primary_key: &str) -> Vec<String> {
    let has = |name: &str| attributes.iter().any(|a| a.name == name);

    // A unique `code` beside a `name`: the pair people quote ("USD · US Dollar").
    // The code alone is a key and the name alone is not unique, so a lookup that
    // offered either would be ambiguous or unreadable. A `code` that is not unique
    // is a technical value, not a key, and does not qualify.
    if has("name") && attributes.iter().any(|a| a.name == "code" && a.unique) {
        return vec!["code".to_string(), "name".to_string()];
    }

    // One column that names the record outright.
    for candidate in [
        "name",
        "full_name",
        "display_name",
        "title",
        "label",
        "subject",
    ] {
        if has(candidate) {
            return vec![candidate.to_string()];
        }
    }

    // A person: two columns that only mean anything together.
    if has("first_name") && has("last_name") {
        return vec!["first_name".to_string(), "last_name".to_string()];
    }

    // A code or reference is not a name, but it is what people quote at each
    // other, and it beats a uuid.
    for candidate in ["code", "reference", "number"] {
        if has(candidate) {
            return vec![candidate.to_string()];
        }
    }

    // Prose the author wrote about this record. A `text` column is a
    // description — the sentence someone typed to say what happened — and that
    // is what the record is called. It is checked before the join-entity rule
    // below because an entity can hold two references and still be
    // substantially about its own content: a DeviationReport points at an
    // experiment and at the person who filed it, and is identified by neither.
    // `string` columns are deliberately not accepted here; those are codes and
    // statuses, handled further down.
    if let Some(prose) = attributes
        .iter()
        .find(|a| a.name != primary_key && !a.is_foreign_key && a.ty == "text")
    {
        return vec![prose.name.clone()];
    }

    // A join entity, whose identity is the pair of records it joins. Two or more
    // references and no name of its own is the shape, and the first two are the
    // pair: a label built from more than two parents stops being readable.
    let references: Vec<&BusAttribute> = attributes
        .iter()
        .filter(|a| {
            a.name != primary_key
                && a.is_foreign_key
                && (a.references.is_some() || is_foreign_key_column_name(&a.name))
        })
        .collect();
    if references.len() >= 2 {
        return references[..2].iter().map(|a| a.name.clone()).collect();
    }

    // Failing all of that, the first plain text column the model declared that
    // is neither the key nor a pointer at another record.
    attributes
        .iter()
        .find(|a| {
            a.name != primary_key
                && !a.is_foreign_key
                && !a.name.ends_with("_id")
                && (a.ty == "string" || a.ty == "text")
        })
        .map(|a| vec![a.name.clone()])
        .unwrap_or_default()
}

/// Declared indexes plus the conventional ones, each column set named once.
///
/// Both sources name an index after its columns, so emitting them independently
/// produced two `CREATE INDEX IF NOT EXISTS` statements with the same name — and
/// the second, the one carrying `unique`, was the no-op.
fn merge_indexes(entity: &Entity) -> Vec<EntityIndex> {
    let mut merged: Vec<EntityIndex> = entity.indexes.clone().unwrap_or_default();
    let mut claimed: Vec<String> = merged.iter().map(|i| i.columns.join(",")).collect();

    for attribute in &entity.attributes {
        // The convention: a column called `name` is what people search by.
        //
        // A unique column deliberately gets nothing here. The generated DDL
        // already writes `UNIQUE` on the column and `PRIMARY KEY` on the key,
        // and Postgres backs each with an index of its own — so adding one more
        // meant two unique indexes on every unique column and a spare on every
        // primary key. An explicit unique index still emits: it is in
        // `merged` before this loop.
        if attribute.name != "name" {
            continue;
        }
        if claimed.contains(&attribute.name) {
            continue;
        }
        claimed.push(attribute.name.clone());
        merged.push(EntityIndex {
            columns: vec![attribute.name.clone()],
            unique: attribute.unique,
        });
    }

    merged
}

/// The stem a column's label is built from.
///
/// A Table Direct column stores a uuid and *shows* the referenced record — so
/// "Class Session Id" over a column reading "Ballet, Studio 2" names the wrong
/// thing. Strip the `_id` suffix so the label names the record, which is what
/// the reader sees in it.
///
/// Only for a resolved foreign key: the primary key stays "Id", and a `_by`
/// column keeps its suffix because "Created By" is the label and "Created" is
/// not. A person-role column carries no suffix to strip.
fn foreign_key_label_stem<'a>(attr: &'a Attribute, entity_primary_key: &str) -> &'a str {
    let is_table_direct =
        attribute_reference_id(attr, entity_primary_key) == reference_type::TABLE_DIRECT;
    if is_table_direct && attr.name.ends_with("_id") && !attr.name.ends_with("_by_id") {
        return &attr.name[..attr.name.len() - "_id".len()];
    }
    &attr.name
}

/// The label a column carries on screen.
///
/// A resolved foreign key is labelled by the thing it points at rather than by
/// the column that points: `kyc_record_id` reads `KYC Record`, not
/// `Kyc Record Id`. Two steps, and each was missing: the suffix was never
/// stripped, and the acronym was already gone by the time the label was built
/// from the column name alone.
///
/// `declared` is what recovers the case: a column is lower-case by the time it
/// reaches here, and the entity's own name is the only place the acronym still
/// exists.
pub fn attribute_display_name(
    attr: &Attribute,
    entity_primary_key: &str,
    declared: &HashMap<String, String>,
) -> String {
    let stem = foreign_key_label_stem(attr, entity_primary_key);
    if stem != attr.name {
        if let Some(resolved) = declared.get(&stem.to_ascii_lowercase().replace('_', "")) {
            return format_display_name(resolved);
        }
    }
    format_display_name(stem)
}

pub fn attribute_to_bus_attribute(
    attr: &Attribute,
    index: usize,
    entity_primary_key: &str,
    declared: &HashMap<String, String>,
) -> BusAttribute {
    BusAttribute {
        name: attr.name.clone(),
        ty: attr.ty.clone(),
        required: attr.required,
        unique: attr.unique,
        max_length: attr.max_length,
        is_foreign_key: attr.is_foreign_key,
        is_primary_key: attr.is_primary_key,
        column_name: attr.name.clone(),
        display_name: attribute_display_name(attr, entity_primary_key, declared),
        reference_id: attribute_reference_id(attr, entity_primary_key),
        description: attr
            .description
            .as_deref()
            .map(str::trim)
            .filter(|text| !text.is_empty())
            .map(str::to_string),
        seq_no: (index as u32 + 1) * 10,
        // Set across the whole list by `with_identifiers`; one attribute on its
        // own cannot tell whether it identifies the record.
        is_identifier: false,
        references: attr.references.clone().filter(|_| attr.is_foreign_key),
        references_table: attr
            .references
            .as_deref()
            .filter(|_| attr.is_foreign_key)
            .map(|entity| format!("{BUS_TABLE_PREFIX}{}", snake_case(entity))),
        narrowed_by: attr.narrowed_by.clone().filter(|_| attr.is_foreign_key),
    }
}

/// Which control the dictionary tells the frontend to render for a column.
///
/// The order of the arms is the whole point: a primary key is an ID display
/// before it is a string, and a foreign key is a lookup before it is whatever
/// scalar the ERD wrote — the physical schema stores both as UUIDs regardless.
pub fn attribute_reference_id(attr: &Attribute, entity_primary_key: &str) -> u16 {
    if attr.name == "id" || attr.name == entity_primary_key {
        return reference_type::ID;
    }
    // An explicit target makes a lookup whatever the column is called; without
    // one, the name has to be one a resolver can read.
    if attr.is_foreign_key && (attr.references.is_some() || is_foreign_key_column_name(&attr.name))
    {
        return reference_type::TABLE_DIRECT;
    }
    // A column bound to an enum points at that enum's own list reference. The
    // generated forms render any reference at or above 1000 as a dropdown fed by
    // /sys/ref-list, so this is what stops a modelled status being a text box
    // the user can type anything into — including values the state machine
    // cannot act on.
    if let Some(enum_reference_id) = attr.enum_reference_id {
        return enum_reference_id;
    }
    // `email`, `url`, `phone`, `password` and `color` all normalise to `string`,
    // so the alias the modeller wrote is the only record that the column is an
    // address rather than a name. Read before the canonical type, which by this
    // point cannot tell them apart.
    if let Some(semantic) = attr.semantic_type.as_deref() {
        return match semantic {
            "email" => reference_type::EMAIL,
            "url" => reference_type::URL,
            "phone" => reference_type::PHONE,
            "password" => reference_type::PASSWORD,
            "color" => reference_type::COLOR,
            _ => type_to_reference_id(&attr.ty),
        };
    }
    if let Some(by_name) = reference_from_column_name(attr) {
        return by_name;
    }
    type_to_reference_id(&attr.ty)
}

/// Failing an alias, the column's name — for the model that wrote
/// `string email` rather than `email email`.
///
/// Semantic type aliases are the deliberate way to say a column holds an address,
/// and most models do not use them: `string email`, `string contact_phone` and
/// `string website` are what an author actually writes, and each rendered as a
/// plain text box with no keyboard hint and no validation.
///
/// Guarded to a column that could plausibly hold an address, a number or a
/// link: `boolean email_opt_out` is a checkbox that happens to have "email" in
/// its name, and giving it the EMAIL reference put an email input in front of a
/// true/false column.
pub fn reference_from_column_name(attr: &Attribute) -> Option<u16> {
    if attr.ty != "string" && attr.ty != "text" {
        return None;
    }
    let name = attr.name.to_ascii_lowercase();
    if name.contains("email") {
        return Some(reference_type::EMAIL);
    }
    if name.contains("phone") || name.contains("mobile") || name.contains("tel") {
        return Some(reference_type::PHONE);
    }
    if name.contains("url") || name.contains("website") || name.contains("link") {
        return Some(reference_type::URL);
    }
    None
}

/// Columns that name a person by the role they played and carry no FK suffix.
///
/// Mirrors `foreignKeys.personRoleColumns.names` in `appwithai-language.json`
/// and `PERSON_ROLE_COLUMN_NAMES` in `packages/core/src/types/bus-entity.types.ts`.
const PERSON_ROLE_COLUMN_NAMES: &[&str] = &[
    "assigned_to",
    "author_id",
    "lab_manager_id",
    "manager_id",
    "owner_id",
    "pi_id",
    "remediation_owner",
    "remediation_owner_id",
    "user_id",
];

/// Qualifier prefixes stripped before a column name is read as an entity.
///
/// Mirrors `QUALIFIER_PREFIXES` in the generated backend's `dictionary.rs` and
/// `packages/core/src/types/bus-entity.types.ts`.
const QUALIFIER_PREFIXES: &[&str] = &["parent_"];

/// The person entity, in the order the language definition prefers them.
const PERSON_TABLES: &[&str] = &["bus_user", "bus_staff", "bus_employee"];

/// The table an FK column points at, or `None` when nothing declares one.
///
/// The same derivation as `resolve_ref_table_name` in the generated backend's
/// `dictionary.rs`, in the same order, and the mirror of
/// `foreignKeyTargetTable` in `packages/core/src/types/bus-entity.types.ts`.
/// It lives beside `PERSON_ROLE_COLUMN_NAMES` because that list already has to
/// agree in seven places and a resolver carrying its own copy would make eight.
#[must_use]
pub fn foreign_key_target_table(
    column_name: &str,
    tables: &std::collections::HashSet<String>,
    explicit_table: Option<&str>,
) -> Option<String> {
    // A stated target wins over anything the name would say.
    if let Some(table) = explicit_table {
        return tables.contains(table).then(|| table.to_string());
    }
    let person = || {
        PERSON_TABLES
            .iter()
            .find(|table| tables.contains(**table))
            .map(|table| (*table).to_string())
    };

    if PERSON_ROLE_COLUMN_NAMES.contains(&column_name) {
        return person();
    }

    let stripped = QUALIFIER_PREFIXES
        .iter()
        .find_map(|prefix| column_name.strip_prefix(prefix))
        .unwrap_or(column_name);

    if PERSON_ROLE_COLUMN_NAMES.contains(&stripped) {
        return person();
    }
    if stripped.ends_with("_by_id") || stripped.ends_with("_by") {
        return person();
    }
    if stripped == "id" {
        return None;
    }

    let stem = stripped.strip_suffix("_id")?;
    let candidate = format!("bus_{stem}");
    tables.contains(&candidate).then_some(candidate)
}

/// Whether an FK-marked column name is one the generator can resolve to a table.
///
/// `<entity>_id` is the convention. A bare `_by` column is accepted too: it names
/// a person by the role they played (`reported_by`, `approved_by`) and resolves
/// to the user entity. Without this it falls through to the declared scalar type
/// and renders as the raw UUID with no lookup — what the checker reports as
/// EML114.
///
/// A person-role *name* is accepted for the same reason, and it is not
/// hypothetical: `assigned_to` is declared `FK` in the ERD, and the backend's
/// `resolve_ref_table_name` and the generated test harness both resolve it to
/// `bus_user` — but this function did not, so the dictionary stamped it
/// `String` and the generated CRUD suite failed on a mandatory FK the factory
/// had no parent to fill.
pub fn is_foreign_key_column_name(column_name: &str) -> bool {
    column_name.ends_with("_id")
        || column_name.ends_with("_by")
        || PERSON_ROLE_COLUMN_NAMES.contains(&column_name)
}

fn type_to_reference_id(ty: &str) -> u16 {
    match ty {
        "string" => reference_type::STRING,
        "integer" => reference_type::INTEGER,
        "decimal" => reference_type::AMOUNT,
        "boolean" => reference_type::YES_NO,
        "date" => reference_type::DATE,
        "datetime" => reference_type::DATETIME,
        "text" => reference_type::TEXT,
        "json" => reference_type::JSON,
        // The language's canonical list is closed and `normalize_type` maps
        // everything into it, so this is unreachable for a parsed model. String
        // is the language's own default rather than a guess.
        _ => reference_type::STRING,
    }
}

/// `registered_by` → `Registered By`, `molecularWeight` → `Molecular Weight`.
///
/// Not `title_case`: that one snake-cases first, which would turn the already
/// human `CAPA` into `Capa`.
pub fn format_display_name(name: &str) -> String {
    split_words(name)
        .into_iter()
        .map(|word| title_word(&word))
        .collect::<Vec<_>>()
        .join(" ")
}

/// A name, as the words it is made of.
///
/// Two boundaries, and the second is the one that matters: `fooBar` splits on
/// the lower-to-upper step, and a run of capitals splits *before its last
/// letter* when a lowercase follows, because that last capital starts the next
/// word. `KYCRecord` is `KYC` + `Record`, not `KYCR` + `ecord`.
fn split_words(name: &str) -> Vec<String> {
    let chars: Vec<char> = name.chars().collect();
    let mut spaced = String::with_capacity(name.len() + 4);

    for (i, &ch) in chars.iter().enumerate() {
        if ch == '_' || ch == '-' || ch == ' ' {
            spaced.push(' ');
            continue;
        }
        if ch.is_ascii_uppercase() && i > 0 {
            let prev = chars[i - 1];
            let prev_is_word = prev.is_ascii_lowercase() || prev.is_ascii_digit();
            let ends_an_acronym =
                prev.is_ascii_uppercase() && chars.get(i + 1).is_some_and(char::is_ascii_lowercase);
            if prev_is_word || ends_an_acronym {
                spaced.push(' ');
            }
        }
        spaced.push(ch);
    }

    spaced.split_whitespace().map(str::to_string).collect()
}

/// Capitalise a word, unless it is already an acronym.
///
/// A model that declares `KYCRecord` or `CAPA` means the acronym, and lowering
/// it renames the entity on screen: `Kyc Record`, `Capa`. Nothing downstream
/// reads these — they are labels — so the failure is silent and permanent, and
/// a reader comparing the screen to their own model finds the two disagree.
fn title_word(word: &str) -> String {
    if !word.is_empty()
        && word
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
    {
        return word.to_string();
    }
    let mut chars = word.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().chain(chars).collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::yaml_model::test_model;

    fn model() -> crate::model::Model {
        test_model(
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
      - name: registered_by_id
        type: string
        fk: true
      - name: notes
        type: text
      - name: is_active
        type: boolean
      - name: registered_at
        type: datetime
      - name: metadata
        type: json
      - name: batch_count
        type: integer
      - name: expires_on
        type: date
"#,
        )
    }

    #[test]
    fn table_names_take_the_bus_prefix_once() {
        let bus = entity_to_bus_entity(
            &model().entities[0],
            &declared_entity_names(&model().entities),
        );
        assert_eq!(bus.table_name, "bus_compound");
        assert_eq!(bus.original_name, "Compound");
        assert_eq!(bus.display_name, "Compound");
        assert_eq!(bus.slug(), "compound");
    }

    #[test]
    fn key_columns_outrank_their_declared_type() {
        let bus = entity_to_bus_entity(
            &model().entities[0],
            &declared_entity_names(&model().entities),
        );
        let by_name = |n: &str| {
            bus.attributes
                .iter()
                .find(|a| a.name == n)
                .unwrap_or_else(|| panic!("no attribute {n}"))
                .clone()
        };

        // Declared `string`, but it is the primary key: an ID display, not text.
        assert_eq!(by_name("id").reference_id, reference_type::ID);
        // Declared `string` and FK-marked: a lookup, not a raw UUID field.
        assert_eq!(
            by_name("registered_by_id").reference_id,
            reference_type::TABLE_DIRECT
        );
        assert_eq!(by_name("smiles").reference_id, reference_type::STRING);
        assert_eq!(
            by_name("molecular_weight").reference_id,
            reference_type::AMOUNT
        );
        assert_eq!(by_name("notes").reference_id, reference_type::TEXT);
        assert_eq!(by_name("is_active").reference_id, reference_type::YES_NO);
        assert_eq!(
            by_name("registered_at").reference_id,
            reference_type::DATETIME
        );
        assert_eq!(by_name("metadata").reference_id, reference_type::JSON);
        assert_eq!(by_name("batch_count").reference_id, reference_type::INTEGER);
        assert_eq!(by_name("expires_on").reference_id, reference_type::DATE);
    }

    #[test]
    fn an_fk_marked_column_without_a_resolvable_name_keeps_its_type() {
        let attr = Attribute {
            name: "owner".to_string(),
            ty: "string".to_string(),
            required: true,
            unique: false,
            description: None,
            semantic_type: None,
            max_length: None,
            is_foreign_key: true,
            is_primary_key: false,
            references: None,
            narrowed_by: None,
            enum_ref: None,
            enum_values: None,
            enum_reference_id: None,
        };
        assert_eq!(attribute_reference_id(&attr, "id"), reference_type::STRING);

        let by = Attribute {
            name: "approved_by".to_string(),
            ..attr
        };
        assert_eq!(
            attribute_reference_id(&by, "id"),
            reference_type::TABLE_DIRECT
        );
    }

    #[test]
    fn seq_numbers_leave_room_between_columns() {
        let bus = entity_to_bus_entity(
            &model().entities[0],
            &declared_entity_names(&model().entities),
        );
        assert_eq!(bus.attributes[0].seq_no, 10);
        assert_eq!(bus.attributes[1].seq_no, 20);
    }

    #[test]
    fn display_names_survive_every_spelling() {
        assert_eq!(format_display_name("registered_by_id"), "Registered By Id");
        assert_eq!(format_display_name("molecularWeight"), "Molecular Weight");
        assert_eq!(format_display_name("CompoundAlias"), "Compound Alias");
        assert_eq!(format_display_name("id"), "Id");
    }

    /// An acronym the model wrote is the acronym the screen shows.
    ///
    /// `CAPA` used to render as `Capa` and `KYCRecord` as `Kyc Record`, so a
    /// reader comparing the application to their own model found the two
    /// disagreeing on the name of the thing. Nothing downstream reads these —
    /// they are labels — which is why the failure was silent and permanent.
    #[test]
    fn an_acronym_is_not_re_cased_per_letter() {
        assert_eq!(format_display_name("CAPA"), "CAPA");
        assert_eq!(format_display_name("KYCRecord"), "KYC Record");
        assert_eq!(format_display_name("SIPInstruction"), "SIP Instruction");
        assert_eq!(format_display_name("kyc_record"), "Kyc Record");
    }

    /// Mirrors `foreign-key-columns.test.ts` in `@appwithai/core`.
    ///
    /// The suffix-less case is the one that was wrong: `assigned_to` is
    /// declared `FK` and resolves to `bus_user` in the backend, the generated
    /// test harness and the checker, but not here — so the dictionary stamped
    /// it `String` and the lookup became a text box.
    #[test]
    fn a_person_role_name_is_a_foreign_key_even_without_a_suffix() {
        assert!(is_foreign_key_column_name("compound_id"));
        assert!(is_foreign_key_column_name("reported_by"));
        assert!(is_foreign_key_column_name("assigned_to"));
        assert!(is_foreign_key_column_name("remediation_owner"));
        assert!(!is_foreign_key_column_name("title"));
        // An exact match, not a prefix.
        assert!(!is_foreign_key_column_name("assigned_to_team"));
    }
}
