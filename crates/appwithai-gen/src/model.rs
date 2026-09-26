//! The parsed model: entities, attributes and relationships.
//!
//! A port of `packages/generator/src/parsers/mermaid.parser.ts`. The shapes are
//! serialised straight into the Handlebars context, so the field names here are
//! part of the template contract and must match what the `.hbs` files read.

use serde::Serialize;

use crate::language::Language;
use crate::naming::{add_bus_prefix, snake_case};
use crate::records::{
    AttributeDeclaration, EntityDeclaration, ErdRecords, IndexDeclaration, RelationshipDeclaration,
};

#[derive(Debug, Clone, Serialize)]
pub struct Attribute {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: String,
    pub required: bool,
    pub unique: bool,
    /// Help text from `%%field <E>.<c> help:`, which becomes
    /// `sys_column.description` — the one place a modeller can explain a field
    /// to whoever fills it in.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// The alias the modeller wrote, when it means something the canonical type
    /// cannot say. All five normalise to `string`, so the word is the only
    /// record that a column holds an address rather than a name.
    #[serde(rename = "semanticType", skip_serializing_if = "Option::is_none")]
    pub semantic_type: Option<String>,
    #[serde(rename = "maxLength", skip_serializing_if = "Option::is_none")]
    pub max_length: Option<u32>,
    #[serde(rename = "isForeignKey", skip_serializing_if = "std::ops::Not::not")]
    pub is_foreign_key: bool,
    #[serde(rename = "isPrimaryKey", skip_serializing_if = "std::ops::Not::not")]
    pub is_primary_key: bool,
    /// Name of the `%%enum` this column is bound to, via `%%field E.c enum: N`.
    #[serde(rename = "enumRef", skip_serializing_if = "Option::is_none")]
    pub enum_ref: Option<String>,
    /// The enum's values, in declaration order.
    #[serde(rename = "enumValues", skip_serializing_if = "Option::is_none")]
    pub enum_values: Option<Vec<String>>,
    /// The list reference allocated to this column's enum. Ids from 1000 up are
    /// the per-model list references, which the generated forms render as a
    /// dropdown fed by `/sys/ref-list`.
    #[serde(rename = "enumReferenceId", skip_serializing_if = "Option::is_none")]
    pub enum_reference_id: Option<u16>,
}

/// The aliases that mean something the canonical type does not.
///
/// All five normalise to `string`, so by the time an attribute reaches the
/// dictionary the word the modeller wrote is the only thing separating an
/// e-mail address from a password from a colour.
const SEMANTIC_TYPES: [&str; 5] = ["email", "url", "phone", "password", "color"];

/// A `%%enum Name: a, b, c` declaration, with the reference id it was given.
#[derive(Debug, Clone, Serialize)]
pub struct ModelEnum {
    pub name: String,
    pub values: Vec<String>,
    /// Allocated from 1000 up, stable for a given set of enum names.
    #[serde(rename = "referenceId")]
    pub reference_id: u16,
}

/// An index the model asked for explicitly, via `%%index Entity(a, b) [unique]`.
///
/// Separate from the single-column indexes derived from `UK` and from a column
/// called `name`: those are conventions the generator applies, this is a
/// request the author wrote down, and it is the only way to express a composite.
#[derive(Debug, Clone, Serialize)]
pub struct EntityIndex {
    /// Columns in the order given, which is the order the index is useful in.
    pub columns: Vec<String>,
    pub unique: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Entity {
    pub name: String,
    #[serde(rename = "tableName")]
    pub table_name: String,
    pub description: String,
    pub attributes: Vec<Attribute>,
    #[serde(rename = "primaryKey")]
    pub primary_key: String,
    pub timestamps: bool,
    /// Explicit `%%index` declarations bound to this entity.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indexes: Option<Vec<EntityIndex>>,
    /// The entity this one is a line item of, from `%%entity <E> parent: <P>`.
    ///
    /// A child is not a thing you navigate to. It has no window of its own and
    /// no card on the dashboard; it appears as a tab inside its parent's
    /// window, linked on the foreign key it already declared.
    #[serde(rename = "parentEntity", skip_serializing_if = "Option::is_none")]
    pub parent_entity: Option<String>,
    /// The child's foreign key back to `parentEntity`, resolved at parse time.
    #[serde(rename = "parentLinkColumn", skip_serializing_if = "Option::is_none")]
    pub parent_link_column: Option<String>,
    /// The icon this entity is drawn with, from `%%entity <E> icon: <name>`.
    ///
    /// A lucide name, taken as written: the catalogue is not carried here, so
    /// an unknown name renders a placeholder rather than failing a build.
    /// Compiled to `sys_table.icon`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

impl Entity {
    /// The physical `bus_*` table this entity is stored in.
    pub fn bus_table(&self) -> String {
        add_bus_prefix(&self.name)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Relationship {
    pub name: String,
    #[serde(rename = "sourceEntity")]
    pub source_entity: String,
    #[serde(rename = "targetEntity")]
    pub target_entity: String,
    pub cardinality: String,
    #[serde(rename = "foreignKey")]
    pub foreign_key: String,
}

#[derive(Debug, Clone, Default)]
pub struct Model {
    pub entities: Vec<Entity>,
    pub relationships: Vec<Relationship>,
    /// `%%enum` declarations a `%%field` binds a column to, with their ids.
    pub enums: Vec<ModelEnum>,
}

/// Parse Mermaid ERD source into entities, relationships and enums.
///
/// EML directives ride on `%%` lines, which Mermaid treats as comments and
/// renders as nothing. They are read here too, and attached once every entity
/// they name has been read: the language does not require a directive to
/// follow the block it refers to. The reading is `read_erd` and the meaning is
/// `compile_erd` — the same compiler a YAML model's ERD goes through.
#[cfg(test)]
pub fn parse_erd(source: &str, lang: &Language) -> Model {
    compile_erd(&read_erd(source, lang), lang)
}

/// Read what an EML document's ERD layer declares, without compiling it.
pub fn read_erd(source: &str, lang: &Language) -> ErdRecords {
    let normalized = source.replace("\r\n", "\n");
    let mut records = ErdRecords::default();

    let mut current_entity: Option<String> = None;
    let mut current_attributes: Vec<AttributeDeclaration> = Vec::new();
    let mut in_entity_block = false;

    for raw_line in normalized.lines() {
        let line = raw_line.trim();

        if line.is_empty() || line == "erDiagram" {
            continue;
        }

        if line.starts_with("%%") {
            if let Some((entity, index)) = parse_index_directive(line) {
                records.indexes.push(IndexDeclaration {
                    entity,
                    columns: index.columns,
                    unique: index.unique,
                });
            }
            if let Some(declared) = parse_enum_directive(line) {
                records.enums.push(declared);
            }
            if let Some(binding) = parse_field_enum_directive(line) {
                records.enum_bindings.push(binding);
            }
            if let Some(help) = parse_field_help_directive(line) {
                records.field_help.push(help);
            }
            if let Some(help) = parse_entity_help_directive(line) {
                records.entity_help.push(help);
            }
            if let Some(icon) = parse_entity_icon_directive(line) {
                records.entity_icons.push(icon);
            }
            if let Some(parent) = parse_entity_parent_directive(line) {
                records.entity_parents.push(parent);
            }
            continue;
        }

        if let Some(relationship) = read_relationship(line, lang) {
            records.relationships.push(relationship);
            continue;
        }

        if let Some(name) = parse_entity_start(line) {
            if let Some(previous) = current_entity.take() {
                // An unclosed entity is kept only if it declared something.
                if !current_attributes.is_empty() {
                    records.entities.push(EntityDeclaration {
                        name: previous,
                        attributes: std::mem::take(&mut current_attributes),
                    });
                }
            }
            current_entity = Some(name);
            current_attributes = Vec::new();
            in_entity_block = true;
            continue;
        }

        if line == "}" {
            if let Some(name) = current_entity.take() {
                records.entities.push(EntityDeclaration {
                    name,
                    attributes: std::mem::take(&mut current_attributes),
                });
            }
            in_entity_block = false;
            continue;
        }

        if in_entity_block && current_entity.is_some() {
            if let Some(attribute) = read_attribute(line) {
                current_attributes.push(attribute);
            }
        }
    }

    // An entity whose closing brace is missing still counts.
    if let Some(name) = current_entity {
        if !current_attributes.is_empty() {
            records.entities.push(EntityDeclaration {
                name,
                attributes: current_attributes,
            });
        }
    }

    records
}

/// Resolve repeated `(key, value)` annotations: the last value wins, and the
/// key keeps the position of its first appearance.
fn last_wins(list: &[(String, String)]) -> Vec<(String, String)> {
    let mut resolved: Vec<(String, String)> = Vec::new();
    for (key, value) in list {
        match resolved.iter_mut().find(|(existing, _)| existing == key) {
            Some(slot) => slot.1 = value.clone(),
            None => resolved.push((key.clone(), value.clone())),
        }
    }
    resolved
}

/// Compile what an ERD declares into entities, relationships and enums.
///
/// The only place ERD declarations become entities: EML and YAML are both read
/// into `ErdRecords` and both end here. Repeats resolve as the TypeScript
/// compiler resolves them — the first `%%enum` of a name counts; for entity
/// annotations the last one wins.
pub fn compile_erd(records: &ErdRecords, lang: &Language) -> Model {
    let mut entities: Vec<Entity> = records
        .entities
        .iter()
        .map(|declaration| {
            complete_entity(
                declaration.name.clone(),
                declaration
                    .attributes
                    .iter()
                    .map(|attribute| attribute_from_declaration(attribute, lang))
                    .collect(),
            )
        })
        .collect();
    let relationships: Vec<Relationship> = records
        .relationships
        .iter()
        .filter_map(|declaration| relationship_from_declaration(declaration, lang))
        .collect();

    let mut declared_enums: Vec<(String, Vec<String>)> = Vec::new();
    for (name, values) in &records.enums {
        if !declared_enums.iter().any(|(existing, _)| existing == name) {
            declared_enums.push((name.clone(), values.clone()));
        }
    }
    let declared_indexes: Vec<(String, EntityIndex)> = records
        .indexes
        .iter()
        .map(|index| {
            (
                index.entity.clone(),
                EntityIndex {
                    columns: index.columns.clone(),
                    unique: index.unique,
                },
            )
        })
        .collect();

    attach_indexes(&mut entities, &declared_indexes);
    attach_help(
        &mut entities,
        &records.field_help,
        &last_wins(&records.entity_help),
    );
    for (name, icon) in &last_wins(&records.entity_icons) {
        if let Some(entity) = entities
            .iter_mut()
            .find(|candidate| candidate.name == *name)
        {
            entity.icon = Some(icon.clone());
        }
    }
    attach_parents(&mut entities, &last_wins(&records.entity_parents));
    let enums = attach_enums(&mut entities, &declared_enums, &records.enum_bindings);

    Model {
        entities,
        relationships,
        enums,
    }
}

// ---------------------------------------------------------------------------
// Directives
// ---------------------------------------------------------------------------
//
// Hand-rolled rather than regex-driven, to keep the crate's dependency set as
// it is. Each mirrors the corresponding method in the TypeScript parser; the
// two must agree exactly, because the parity check compares their output.

/// The identifier at the head of `rest`, and everything after it.
fn take_identifier(rest: &str) -> Option<(&str, &str)> {
    let mut end = 0;
    for (index, ch) in rest.char_indices() {
        let ok = if index == 0 {
            ch.is_ascii_alphabetic() || ch == '_'
        } else {
            ch.is_ascii_alphanumeric() || ch == '_'
        };
        if !ok {
            break;
        }
        end = index + ch.len_utf8();
    }
    if end == 0 {
        return None;
    }
    Some((&rest[..end], &rest[end..]))
}

/// `%%index <Entity>(<col>[, <col>...]) [unique]`
fn parse_index_directive(line: &str) -> Option<(String, EntityIndex)> {
    let rest = strip_directive(line, "%%index")?;
    let (entity, rest) = take_identifier(rest.trim_start())?;
    let rest = rest.trim_start();
    let inner = rest.strip_prefix('(')?;
    let (columns_raw, tail) = inner.split_once(')')?;

    let columns: Vec<String> = columns_raw
        .split(',')
        .map(|column| column.trim().to_string())
        .filter(|column| !column.is_empty())
        .collect();
    if columns.is_empty() {
        return None;
    }

    let tail = tail.trim();
    let unique = if tail.is_empty() {
        false
    } else if tail.eq_ignore_ascii_case("unique") {
        true
    } else {
        return None;
    };

    Some((entity.to_string(), EntityIndex { columns, unique }))
}

/// `%%enum <Name>: <value1>, <value2>, ...`
fn parse_enum_directive(line: &str) -> Option<(String, Vec<String>)> {
    let rest = strip_directive(line, "%%enum")?;
    let (name, rest) = take_identifier(rest.trim_start())?;
    let values_raw = rest.trim_start().strip_prefix(':')?;

    let values: Vec<String> = values_raw
        .split(',')
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .collect();
    if values.is_empty() {
        return None;
    }
    Some((name.to_string(), values))
}

/// The `<Entity>.<column>` head shared by every `%%field` form.
fn parse_field_target(rest: &str) -> Option<(String, String, &str)> {
    let (entity, rest) = take_identifier(rest.trim_start())?;
    let rest = rest.strip_prefix('.')?;
    let (column, rest) = take_identifier(rest)?;
    Some((entity.to_string(), column.to_string(), rest))
}

/// `%%field <Entity>.<column> enum: <EnumName>`
fn parse_field_enum_directive(line: &str) -> Option<(String, String, String)> {
    let rest = strip_directive(line, "%%field")?;
    let (entity, column, rest) = parse_field_target(rest)?;
    let rest = rest.trim_start().strip_prefix("enum")?;
    let rest = rest.trim_start().strip_prefix(':')?;
    let (enum_name, tail) = take_identifier(rest.trim_start())?;
    if !tail.trim().is_empty() {
        return None;
    }
    Some((entity, column, enum_name.to_string()))
}

/// `%%field <Entity>.<column> help: <text>`
fn parse_field_help_directive(line: &str) -> Option<(String, String, String)> {
    let rest = strip_directive(line, "%%field")?;
    let (entity, column, rest) = parse_field_target(rest)?;
    let rest = rest.trim_start().strip_prefix("help")?;
    let help = rest.trim_start().strip_prefix(':')?.trim();
    if help.is_empty() {
        return None;
    }
    Some((entity, column, help.to_string()))
}

/// `%%entity <Name> help: <text>` (`description:` is accepted too)
fn parse_entity_help_directive(line: &str) -> Option<(String, String)> {
    let rest = strip_directive(line, "%%entity")?;
    let (entity, rest) = take_identifier(rest.trim_start())?;
    let rest = rest.trim_start();
    let rest = rest
        .strip_prefix("help")
        .or_else(|| rest.strip_prefix("description"))?;
    let help = rest.trim_start().strip_prefix(':')?.trim();
    if help.is_empty() {
        return None;
    }
    Some((entity.to_string(), help.to_string()))
}

/// `%%entity <Name> icon: <lucide-name>`
///
/// The value is taken as written rather than checked against lucide's
/// catalogue, which this repository does not carry: an unknown name renders a
/// placeholder instead of failing a build.
fn parse_entity_icon_directive(line: &str) -> Option<(String, String)> {
    let rest = strip_directive(line, "%%entity")?;
    let (entity, rest) = take_identifier(rest.trim_start())?;
    let rest = rest.trim_start().strip_prefix("icon")?;
    let rest = rest.trim_start().strip_prefix(':')?;
    let icon = rest.trim();
    if icon.is_empty()
        || !icon
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-' || ch == '.')
    {
        return None;
    }
    Some((entity.to_string(), icon.to_string()))
}

/// `%%entity <Child> parent: <Parent>`
fn parse_entity_parent_directive(line: &str) -> Option<(String, String)> {
    let rest = strip_directive(line, "%%entity")?;
    let (entity, rest) = take_identifier(rest.trim_start())?;
    let rest = rest.trim_start().strip_prefix("parent")?;
    let rest = rest.trim_start().strip_prefix(':')?;
    let (parent, tail) = take_identifier(rest.trim_start())?;
    if !tail.trim().is_empty() {
        return None;
    }
    Some((entity.to_string(), parent.to_string()))
}

/// The body of a directive, or `None` if this line is a different one.
///
/// The keyword must be followed by whitespace: without that check `%%indexes`
/// would be read as `%%index` with a body of `es`.
fn strip_directive<'a>(line: &'a str, keyword: &str) -> Option<&'a str> {
    let rest = line.strip_prefix(keyword)?;
    if rest.is_empty() || !rest.starts_with(char::is_whitespace) {
        return None;
    }
    Some(rest)
}

// ---------------------------------------------------------------------------
// Attaching what the directives named
// ---------------------------------------------------------------------------

/// Hang each declared index on the entity it names.
///
/// A declaration naming an unknown entity, or a column the entity does not
/// have, is dropped: the migration would fail on it, and a migration that
/// cannot apply is worse than a missing index.
fn attach_indexes(entities: &mut [Entity], declared: &[(String, EntityIndex)]) {
    for (entity_name, index) in declared {
        let Some(entity) = entities.iter_mut().find(|e| e.name == *entity_name) else {
            continue;
        };
        if !index
            .columns
            .iter()
            .all(|column| entity.attributes.iter().any(|a| a.name == *column))
        {
            continue;
        }
        entity
            .indexes
            .get_or_insert_with(Vec::new)
            .push(index.clone());
    }
}

/// Hang the help text on the entities and columns it names.
///
/// A directive naming something the document does not declare is dropped rather
/// than invented: the checker reports it as EML141 or EML142, and a column
/// conjured out of a help line would be a column the schema has no place for.
fn attach_help(
    entities: &mut [Entity],
    field_help: &[(String, String, String)],
    entity_help: &[(String, String)],
) {
    for (name, help) in entity_help {
        if let Some(entity) = entities.iter_mut().find(|e| e.name == *name) {
            entity.description = help.clone();
        }
    }
    for (name, column, help) in field_help {
        if let Some(attribute) = entities
            .iter_mut()
            .find(|e| e.name == *name)
            .and_then(|e| e.attributes.iter_mut().find(|a| a.name == *column))
        {
            attribute.description = Some(help.clone());
        }
    }
}

/// Resolve `%%entity <Child> parent: <Parent>` to the foreign key that links them.
///
/// Both ends must exist and the child must already carry a foreign key back to
/// the parent — the directive says which of an entity's references is the
/// owning one, it does not create the column.
fn attach_parents(entities: &mut [Entity], parents: &[(String, String)]) {
    for (child_name, parent_name) in parents {
        let Some(parent) = entities.iter().find(|e| e.name == *parent_name) else {
            continue;
        };
        let parent_display = parent.name.clone();
        let snake = snake_case(&parent_display);
        let exact = format!("{snake}_id");
        let prefix = format!("{snake}_");

        let Some(child) = entities.iter_mut().find(|e| e.name == *child_name) else {
            continue;
        };
        let link = child
            .attributes
            .iter()
            .find(|a| a.is_foreign_key && a.name == exact)
            .or_else(|| {
                child
                    .attributes
                    .iter()
                    .find(|a| a.is_foreign_key && a.name.starts_with(&prefix))
            })
            .map(|a| a.name.clone());
        let Some(link) = link else { continue };

        child.parent_entity = Some(parent_display);
        child.parent_link_column = Some(link);
    }
}

/// Bind columns to their enums, allocating one list reference per enum used.
///
/// Only enums a `%%field` actually binds to a real column get an id: a declared
/// but unbound enum would seed a reference nothing points at. Ids are allocated
/// over the *sorted* set of names so they are stable across runs, and from 1000
/// up because the generated forms render any reference at or above 1000 as a
/// dropdown fed by `/sys/ref-list`.
fn attach_enums(
    entities: &mut [Entity],
    declared: &[(String, Vec<String>)],
    bindings: &[(String, String, String)],
) -> Vec<ModelEnum> {
    let values_for = |name: &str| {
        declared
            .iter()
            .find(|(declared_name, _)| declared_name == name)
            .map(|(_, values)| values.clone())
    };
    let column_exists = |entities: &[Entity], entity_name: &str, column: &str| {
        entities
            .iter()
            .find(|e| e.name == entity_name)
            .is_some_and(|e| e.attributes.iter().any(|a| a.name == column))
    };

    let mut used: Vec<String> = Vec::new();
    for (entity_name, column, enum_name) in bindings {
        if values_for(enum_name).is_none() {
            continue;
        }
        if !column_exists(entities, entity_name, column) {
            continue;
        }
        if !used.iter().any(|existing| existing == enum_name) {
            used.push(enum_name.clone());
        }
    }
    used.sort();

    let reference_ids: Vec<(String, u16)> = (1000_u16..)
        .zip(used.iter())
        .map(|(reference_id, name)| (name.clone(), reference_id))
        .collect();
    let id_for = |name: &str| {
        reference_ids
            .iter()
            .find(|(existing, _)| existing == name)
            .map(|(_, id)| *id)
    };

    for (entity_name, column, enum_name) in bindings {
        let (Some(values), Some(reference_id)) = (values_for(enum_name), id_for(enum_name)) else {
            continue;
        };
        if let Some(attribute) = entities
            .iter_mut()
            .find(|e| e.name == *entity_name)
            .and_then(|e| e.attributes.iter_mut().find(|a| a.name == *column))
        {
            attribute.enum_ref = Some(enum_name.clone());
            attribute.enum_values = Some(values);
            attribute.enum_reference_id = Some(reference_id);
        }
    }

    reference_ids
        .into_iter()
        .map(|(name, reference_id)| ModelEnum {
            values: values_for(&name).unwrap_or_default(),
            name,
            reference_id,
        })
        .collect()
}

fn parse_entity_start(line: &str) -> Option<String> {
    let stripped = line.strip_suffix('{')?.trim_end();
    if stripped.is_empty() {
        return None;
    }
    let mut chars = stripped.chars();
    let first = chars.next()?;
    if !first.is_ascii_alphabetic() {
        return None;
    }
    if !chars.all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return None;
    }
    Some(stripped.to_string())
}

/// Read a relationship line. Left glyphs are `||`, `|o`, `}o`, `}|`; right
/// glyphs `||`, `o|`, `o{`, `|{` — and only the eight operators the language
/// defines are relationships.
fn read_relationship(line: &str, lang: &Language) -> Option<RelationshipDeclaration> {
    let (before_label, raw_label) = match line.split_once(':') {
        Some((head, tail)) => (head.trim(), Some(tail.trim().trim_matches('"').trim())),
        None => (line, None),
    };

    let mut parts = before_label.split_whitespace();
    let source = parts.next()?;
    let operator = parts.next()?;
    let target = parts.next()?;
    if parts.next().is_some() {
        return None;
    }

    if !is_identifier(source) || !is_identifier(target) {
        return None;
    }
    lang.cardinality_kind(operator)?;

    Some(RelationshipDeclaration {
        source: source.to_string(),
        target: target.to_string(),
        operator: operator.to_string(),
        label: raw_label
            .filter(|label| !label.is_empty())
            .map(str::to_string),
    })
}

/// The relationship a declaration compiles to, or `None` for an operator the
/// language does not define.
fn relationship_from_declaration(
    declaration: &RelationshipDeclaration,
    lang: &Language,
) -> Option<Relationship> {
    let cardinality = lang.cardinality_kind(&declaration.operator)?;
    let source = declaration.source.as_str();
    let target = declaration.target.as_str();

    let name = match declaration.label.as_deref().map(str::trim) {
        Some(label) if !label.is_empty() => normalize_relationship_name(label),
        _ => format!("{}_{}", source.to_lowercase(), target.to_lowercase()),
    };

    // The foreign key lives on the *many* side and is named after the entity it
    // points at — the *one* side. Deriving it from the target regardless of
    // direction reported `class_session_id` for
    // `ClassOffering ||--o{ ClassSession`: a column named after the table it
    // sits on, which is not a foreign key name and is not what the model
    // declares. A many-to-many carries no such column at all; the
    // target-derived name stays there as the least surprising placeholder.
    let referenced = if cardinality == "oneToMany" {
        source
    } else {
        target
    };

    Some(Relationship {
        name,
        source_entity: source.to_string(),
        target_entity: target.to_string(),
        cardinality: cardinality.to_string(),
        foreign_key: format!("{}_id", snake_case(referenced).trim_start_matches("bus_")),
    })
}

fn is_identifier(s: &str) -> bool {
    let mut chars = s.chars();
    match chars.next() {
        Some(first) if first.is_ascii_alphabetic() || first == '_' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

fn normalize_relationship_name(label: &str) -> String {
    label
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("_")
        .to_lowercase()
}

/// Read a column declaration: `type name [MODIFIERS…]`, tokens as written.
fn read_attribute(line: &str) -> Option<AttributeDeclaration> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 2 {
        return None;
    }
    Some(AttributeDeclaration {
        ty: parts[0].to_string(),
        name: parts[1].to_string(),
        modifiers: parts[2..].iter().map(|m| (*m).to_string()).collect(),
    })
}

/// The attribute a column declaration compiles to — e.g. `string email UK`,
/// `decimal price OPTIONAL`.
pub fn attribute_from_declaration(
    declaration: &AttributeDeclaration,
    lang: &Language,
) -> Attribute {
    let raw_type = declaration.ty.to_ascii_lowercase();
    let modifiers: Vec<String> = declaration
        .modifiers
        .iter()
        .map(|m| m.to_ascii_uppercase())
        .collect();
    let has = |m: &str| modifiers.iter().any(|found| found == m);

    let is_primary_key = has("PK");
    let is_foreign_key = has("FK");
    let is_unique = has("UK") || has("UNIQUE");
    let is_optional = has("OPTIONAL") || has("NULL");

    let max_length = raw_type
        .split_once('(')
        .and_then(|(_, rest)| rest.split_once(')'))
        .and_then(|(digits, _)| digits.parse::<u32>().ok());

    // `string(255)` carries its length in the token; the alias is what is left.
    let base_type = raw_type.split('(').next().unwrap_or(&raw_type).to_string();
    let semantic_type = SEMANTIC_TYPES
        .iter()
        .find(|alias| **alias == base_type)
        .map(|alias| (*alias).to_string());

    Attribute {
        name: declaration.name.clone(),
        ty: lang.normalize_type(&raw_type),
        // A primary key is generated, so it is never "required" input.
        required: !is_optional && !is_primary_key,
        unique: is_unique || is_primary_key,
        description: None,
        semantic_type,
        max_length,
        is_foreign_key,
        is_primary_key,
        enum_ref: None,
        enum_values: None,
        enum_reference_id: None,
    }
}

/// Collapse a column declared more than once into a single attribute.
///
/// A duplicate is a mistake, and `EML112` says so — but it reached the generated
/// schema as a `CREATE TABLE` naming the column twice, which PostgreSQL refuses
/// outright, so the application never opened and the message named no model
/// line. It reached the Application Dictionary as two `sys_column` rows for one
/// column as well, which is a form with the field on it twice.
///
/// The first declaration keeps its place and its type: that is where the author
/// was describing this column, and the later line is the accident. The
/// *constraints* merge the other way — the strongest wins — so the result is
/// never fewer guarantees than were written down.
fn merge_duplicate_attributes(attributes: Vec<Attribute>) -> Vec<Attribute> {
    let mut merged: Vec<Attribute> = Vec::with_capacity(attributes.len());

    for attribute in attributes {
        let Some(existing) = merged.iter_mut().find(|a| a.name == attribute.name) else {
            merged.push(attribute);
            continue;
        };

        existing.required = existing.required || attribute.required;
        if attribute.unique {
            existing.unique = true;
        }
        if attribute.is_foreign_key {
            existing.is_foreign_key = true;
        }
        // Anything the first line did not say, a later one may still supply.
        if existing.max_length.is_none() {
            existing.max_length = attribute.max_length;
        }
        if existing.semantic_type.is_none() {
            existing.semantic_type = attribute.semantic_type;
        }
        if existing.description.is_none() {
            existing.description = attribute.description;
        }
    }

    merged
}

fn complete_entity(name: String, declared_attributes: Vec<Attribute>) -> Entity {
    let table_name = snake_case(&name);
    let mut attributes = merge_duplicate_attributes(declared_attributes);

    let has_id = attributes
        .iter()
        .any(|a| a.name == "id" || (a.unique && a.name.ends_with("_id")));

    if !has_id {
        attributes.insert(
            0,
            Attribute {
                name: "id".to_string(),
                ty: "string".to_string(),
                required: true,
                unique: true,
                description: None,
                semantic_type: None,
                max_length: None,
                is_foreign_key: false,
                is_primary_key: true,
                enum_ref: None,
                enum_values: None,
                enum_reference_id: None,
            },
        );
    }

    let primary_key = attributes
        .iter()
        .find(|a| a.unique && a.name == "id")
        .map(|a| a.name.clone())
        .unwrap_or_else(|| "id".to_string());

    Entity {
        name,
        table_name,
        description: String::new(),
        attributes,
        primary_key,
        timestamps: true,
        indexes: None,
        parent_entity: None,
        parent_link_column: None,
        icon: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_an_icon_onto_the_entity_and_ignores_prose() {
        let source = "erDiagram\n    Patient {\n        string id PK\n    }\n\
                      %%entity Patient icon: stethoscope\n\
                      %% the %%entity Patient icon: not-this one is prose\n";
        let model = parse_erd(source, &lang());
        let patient = model
            .entities
            .iter()
            .find(|entity| entity.name == "Patient")
            .expect("Patient parses");
        // The prose line is a second `%%` comment, so an unanchored reader
        // would take `not-this` as the icon. The first declaration wins.
        assert_eq!(patient.icon.as_deref(), Some("stethoscope"));
    }

    #[test]
    fn an_entity_with_no_icon_directive_carries_none() {
        // The column defaults to 'Table' in m0001, so an absent icon must stay
        // absent rather than becoming a guess the two generators would have to
        // mirror.
        let source = "erDiagram\n    Patient {\n        string id PK\n    }\n";
        let model = parse_erd(source, &lang());
        assert!(model.entities[0].icon.is_none());
    }

    fn lang() -> Language {
        Language::load()
    }

    #[test]
    fn parses_entities_and_attributes() {
        let src = r#"
erDiagram
    Compound {
        string id PK
        string smiles UK
        decimal molecular_weight OPTIONAL
        string registered_by_id FK
    }
"#;
        let model = parse_erd(src, &lang());
        assert_eq!(model.entities.len(), 1);
        let compound = &model.entities[0];
        assert_eq!(compound.name, "Compound");
        assert_eq!(compound.table_name, "compound");
        assert_eq!(compound.bus_table(), "bus_compound");
        assert_eq!(compound.attributes.len(), 4);

        let smiles = &compound.attributes[1];
        assert!(smiles.unique);
        assert!(smiles.required);

        let weight = &compound.attributes[2];
        assert_eq!(weight.ty, "decimal");
        assert!(!weight.required, "OPTIONAL must not be required");

        assert!(compound.attributes[3].is_foreign_key);
    }

    #[test]
    fn parses_relationships_with_and_without_labels() {
        let src = r#"
erDiagram
    Compound ||--o{ CompoundAlias : "known as"
    Team ||--o{ User
"#;
        let model = parse_erd(src, &lang());
        assert_eq!(model.relationships.len(), 2);
        assert_eq!(model.relationships[0].cardinality, "oneToMany");
        assert_eq!(model.relationships[0].name, "known_as");
        // `Compound ||--o{ CompoundAlias` puts the key on the alias, named for
        // the compound it points at — not for the table it sits on.
        assert_eq!(model.relationships[0].foreign_key, "compound_id");
        // An unlabelled edge is named after the pair it joins.
        assert_eq!(model.relationships[1].name, "team_user");
    }

    #[test]
    fn comment_lines_are_not_entities() {
        let src = "%%category name: Compound Registry; entities: Compound\nerDiagram\n";
        assert!(parse_erd(src, &lang()).entities.is_empty());
    }

    #[test]
    fn an_entity_without_an_id_gets_one() {
        let src = "erDiagram\n  Note {\n    string body\n  }\n";
        let model = parse_erd(src, &lang());
        assert_eq!(model.entities[0].attributes[0].name, "id");
        assert_eq!(model.entities[0].primary_key, "id");
    }

    // ── Directives ──────────────────────────────────────────────────────────
    //
    // Every one of these rides on a `%%` line, which this parser used to skip
    // wholesale. The TypeScript parser reads the same lines the same way, and
    // the parity check compares the two generators' output — but parity alone
    // cannot say *what* either of them read, only that they agree. These say.

    const DIRECTIVE_MODEL: &str = r#"
%%enum CompoundClass: small_molecule, biologic, peptide
%%enum Unused: never, bound
erDiagram
    Compound {
        string id PK
        string smiles UK
        string compound_class
        string owner_id FK
    }
    LineItem {
        string id PK
        string compound_id FK
        integer quantity
    }
    Owner {
        string id PK
        string name
    }
%%index Compound(compound_class, smiles)
%%index Compound(smiles) unique
%%index Compound(nope)
%%index Ghost(id)
%%field Compound.compound_class enum: CompoundClass
%%field Compound.smiles help: The structure, written as SMILES.
%%entity Compound help: A molecule the programme is working on.
%%entity LineItem parent: Compound
"#;

    fn compound(model: &Model) -> &Entity {
        model
            .entities
            .iter()
            .find(|e| e.name == "Compound")
            .unwrap()
    }

    #[test]
    fn reads_an_index_declaration_in_the_order_written() {
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        let indexes = compound(&model).indexes.as_ref().unwrap();
        assert!(indexes
            .iter()
            .any(|i| i.columns == ["compound_class", "smiles"] && !i.unique));
        assert!(indexes.iter().any(|i| i.columns == ["smiles"] && i.unique));
    }

    #[test]
    fn drops_an_index_naming_something_the_model_does_not_declare() {
        // The migration would fail on a column or table that does not exist,
        // and a migration that cannot apply is worse than a missing index.
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        let indexes = compound(&model).indexes.as_ref().unwrap();
        assert!(!indexes
            .iter()
            .any(|i| i.columns.contains(&"nope".to_string())));
        assert!(!model.entities.iter().any(|e| e.name == "Ghost"));
    }

    #[test]
    fn binds_a_column_to_its_enum_and_allocates_one_reference_id() {
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        let attr = compound(&model)
            .attributes
            .iter()
            .find(|a| a.name == "compound_class")
            .unwrap();
        assert_eq!(attr.enum_ref.as_deref(), Some("CompoundClass"));
        assert_eq!(
            attr.enum_values.as_deref(),
            Some(
                ["small_molecule", "biologic", "peptide"]
                    .map(String::from)
                    .as_slice()
            )
        );
        assert_eq!(attr.enum_reference_id, Some(1000));
    }

    #[test]
    fn an_enum_no_field_binds_gets_no_reference() {
        // Seeding a reference nothing points at would leave a dead list in the
        // dictionary for an administrator to wonder about.
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        assert_eq!(model.enums.len(), 1);
        assert_eq!(model.enums[0].name, "CompoundClass");
    }

    #[test]
    fn reads_help_text_onto_the_entity_and_the_column() {
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        let entity = compound(&model);
        assert_eq!(
            entity.description,
            "A molecule the programme is working on."
        );
        let smiles = entity
            .attributes
            .iter()
            .find(|a| a.name == "smiles")
            .unwrap();
        assert_eq!(
            smiles.description.as_deref(),
            Some("The structure, written as SMILES.")
        );
    }

    #[test]
    fn resolves_a_parent_to_the_foreign_key_that_links_them() {
        let model = parse_erd(DIRECTIVE_MODEL, &lang());
        let line_item = model
            .entities
            .iter()
            .find(|e| e.name == "LineItem")
            .unwrap();
        assert_eq!(line_item.parent_entity.as_deref(), Some("Compound"));
        assert_eq!(line_item.parent_link_column.as_deref(), Some("compound_id"));
        // The parent itself is not a child of anything.
        assert_eq!(compound(&model).parent_entity, None);
    }

    #[test]
    fn a_semantic_alias_survives_normalisation_to_string() {
        // All five normalise to `string`, so the word the modeller wrote is the
        // only record that the column holds an address rather than a name.
        let src = "erDiagram\n  Person {\n    string id PK\n    email contact_email\n    string label\n  }\n";
        let model = parse_erd(src, &lang());
        let attrs = &model.entities[0].attributes;
        let email = attrs.iter().find(|a| a.name == "contact_email").unwrap();
        assert_eq!(email.ty, "string");
        assert_eq!(email.semantic_type.as_deref(), Some("email"));
        let label = attrs.iter().find(|a| a.name == "label").unwrap();
        assert_eq!(label.semantic_type, None);
    }

    #[test]
    fn a_column_declared_twice_collapses_and_keeps_the_stronger_constraint() {
        // Two rows for one column is a CREATE TABLE PostgreSQL refuses, and a
        // form with the field on it twice. The later line must not be able to
        // relax a mandatory column into a nullable one either.
        let src = "erDiagram\n  Doc {\n    string id PK\n    string title\n    string title OPTIONAL UK\n  }\n";
        let model = parse_erd(src, &lang());
        let titles: Vec<_> = model.entities[0]
            .attributes
            .iter()
            .filter(|a| a.name == "title")
            .collect();
        assert_eq!(titles.len(), 1);
        assert!(
            titles[0].required,
            "OPTIONAL must not loosen the first line"
        );
        assert!(titles[0].unique, "UK from the later line must survive");
    }

    #[test]
    fn a_prose_comment_is_not_read_as_a_directive() {
        let src = "erDiagram\n  Doc {\n    string id PK\n  }\n%% indexes are declared below\n%%indexes Doc(id)\n";
        let model = parse_erd(src, &lang());
        assert!(model.entities[0].indexes.is_none());
    }
}
