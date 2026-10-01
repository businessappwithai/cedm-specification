//! The compiled model: entities, attributes and relationships.
//!
//! A port of `packages/generator/src/model/compile-erd.ts`. The shapes are
//! serialised straight into the Handlebars context, so the field names here are
//! part of the template contract and must match what the `.hbs` files read.

use serde::Serialize;

use crate::language::Language;
use crate::naming::{add_bus_prefix, snake_case};
use crate::records::{AttributeDeclaration, EnumDetails, ErdRecords, RelationshipDeclaration};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize)]
pub struct Attribute {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: String,
    pub required: bool,
    pub unique: bool,
    /// Help text from the column's `help`, which becomes
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
    /// The entity a foreign key names outright, where its column name would
    /// resolve elsewhere — a CEDM reference. Absent for every other column.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub references: Option<String>,
    /// Name of the enum this column is bound to, by its `enum` key.
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

/// An enum the model declares, with the reference id it was given.
#[derive(Debug, Clone, Serialize)]
pub struct ModelEnum {
    pub name: String,
    pub values: Vec<String>,
    /// Allocated from 1000 up, stable for a given set of enum names.
    #[serde(rename = "referenceId")]
    pub reference_id: u16,
    /// The enumeration has a business table, an entity of the same name.
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub table: bool,
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub labels: BTreeMap<String, String>,
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub descriptions: BTreeMap<String, String>,
}

/// An index the model asked for explicitly, in the entity's `indexes`.
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
    /// The entity's explicit `indexes`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indexes: Option<Vec<EntityIndex>>,
    /// The entity this one is a line item of, from its `parent`.
    ///
    /// A child is not a thing you navigate to. It has no window of its own and
    /// no card on the dashboard; it appears as a tab inside its parent's
    /// window, linked on the foreign key it already declared.
    #[serde(rename = "parentEntity", skip_serializing_if = "Option::is_none")]
    pub parent_entity: Option<String>,
    /// The child's foreign key back to `parentEntity`, resolved at parse time.
    #[serde(rename = "parentLinkColumn", skip_serializing_if = "Option::is_none")]
    pub parent_link_column: Option<String>,
    /// The icon this entity is drawn with, from its `icon`.
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
    /// Enums a column's `enum` key binds it to, with their ids.
    pub enums: Vec<ModelEnum>,
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
/// The only place ERD declarations become entities. Repeats resolve as the TypeScript
/// compiler resolves them — the first enum of a name counts; for entity
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
    let enums = attach_enums(
        &mut entities,
        &declared_enums,
        &records.enum_bindings,
        &records.enum_details,
    );

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

/// Resolve an entity's `parent` to the foreign key that links them.
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
            .or_else(|| {
                // A key that names the parent outright, whatever it is called.
                child.attributes.iter().find(|a| {
                    a.is_foreign_key && a.references.as_deref() == Some(parent_display.as_str())
                })
            })
            .map(|a| a.name.clone());
        let Some(link) = link else { continue };

        child.parent_entity = Some(parent_display);
        child.parent_link_column = Some(link);
    }
}

/// Bind columns to their enums, allocating one list reference per enum used.
///
/// Only enums a column's `enum` key actually binds to a real column get an id: a declared
/// but unbound enum would seed a reference nothing points at. Ids are allocated
/// over the *sorted* set of names so they are stable across runs, and from 1000
/// up because the generated forms render any reference at or above 1000 as a
/// dropdown fed by `/sys/ref-list`.
fn attach_enums(
    entities: &mut [Entity],
    declared: &[(String, Vec<String>)],
    bindings: &[(String, String, String)],
    details: &[(String, EnumDetails)],
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
        .map(|(name, reference_id)| {
            // The first enum of a name is the one that counts, details included.
            let extra = details
                .iter()
                .find(|(declared, _)| *declared == name)
                .map(|(_, extra)| extra.clone())
                .unwrap_or_default();
            ModelEnum {
                values: values_for(&name).unwrap_or_default(),
                name,
                reference_id,
                table: extra.table,
                labels: extra.labels,
                descriptions: extra.descriptions,
            }
        })
        .collect()
}

/// The relationship a declaration compiles to, or `None` for an operator the
/// language does not define.
fn relationship_from_declaration(
    declaration: &RelationshipDeclaration,
    lang: &Language,
) -> Option<Relationship> {
    let cardinality = lang.cardinality_kind(&declaration.source_end, &declaration.target_end)?;
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

fn normalize_relationship_name(label: &str) -> String {
    label
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("_")
        .to_lowercase()
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
        references: declaration.references.clone().filter(|_| is_foreign_key),
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
        if existing.references.is_none() {
            existing.references = attribute.references;
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
                references: None,
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
    use crate::yaml_model::test_model;

    fn entity<'a>(model: &'a Model, name: &str) -> &'a Entity {
        model.entities.iter().find(|e| e.name == name).expect(name)
    }

    #[test]
    fn carries_an_icon_onto_the_entity_and_none_when_absent() {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Patient
    icon: stethoscope
    attributes: [{ name: id, type: string, pk: true }]
  - name: Ward
    attributes: [{ name: id, type: string, pk: true }]
"#,
        );
        assert_eq!(
            entity(&model, "Patient").icon.as_deref(),
            Some("stethoscope")
        );
        // The column defaults to 'Table' in m0001, so an absent icon must stay
        // absent rather than becoming a guess the two generators would have to
        // mirror.
        assert!(entity(&model, "Ward").icon.is_none());
    }

    #[test]
    fn compiles_entities_and_attributes() {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Compound
    attributes:
      - { name: id, type: string, pk: true }
      - { name: smiles, type: string, unique: true }
      - { name: molecular_weight, type: decimal, optional: true }
      - { name: registered_by_id, type: string, fk: true }
"#,
        );
        assert_eq!(model.entities.len(), 1);
        let compound = &model.entities[0];
        assert_eq!(compound.name, "Compound");
        assert_eq!(compound.table_name, "compound");
        assert_eq!(compound.bus_table(), "bus_compound");
        assert_eq!(compound.attributes.len(), 4);
        assert!(compound.attributes[1].unique);
        assert!(compound.attributes[1].required);
        assert_eq!(compound.attributes[2].ty, "decimal");
        assert!(
            !compound.attributes[2].required,
            "optional must not be required"
        );
        assert!(compound.attributes[3].is_foreign_key);
    }

    #[test]
    fn compiles_relationships_with_and_without_labels() {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - { name: Compound, attributes: [{ name: id, type: string, pk: true }] }
  - { name: CompoundAlias, attributes: [{ name: id, type: string, pk: true }, { name: compound_id, type: string, fk: true }] }
  - { name: Team, attributes: [{ name: id, type: string, pk: true }] }
  - { name: User, attributes: [{ name: id, type: string, pk: true }, { name: team_id, type: string, fk: true }] }
relationships:
  - { from: Compound, fromCardinality: exactly-one, to: CompoundAlias, toCardinality: zero-or-more, label: known as }
  - { from: Team, fromCardinality: exactly-one, to: User, toCardinality: zero-or-more }
  - { from: CompoundAlias, fromCardinality: zero-or-more, to: Team, toCardinality: exactly-one }
"#,
        );
        assert_eq!(model.relationships.len(), 3);
        assert_eq!(model.relationships[0].cardinality, "oneToMany");
        assert_eq!(model.relationships[0].name, "known_as");
        // A one-to-many puts the key on the many side, named for the entity it
        // points at — not for the table it sits on.
        assert_eq!(model.relationships[0].foreign_key, "compound_id");
        // An unlabelled relationship is named after the pair it joins.
        assert_eq!(model.relationships[1].name, "team_user");
        assert_eq!(model.relationships[2].cardinality, "manyToOne");
        assert_eq!(model.relationships[2].foreign_key, "team_id");
    }

    #[test]
    fn an_entity_without_an_id_gets_one() {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - { name: Note, attributes: [{ name: body, type: string }] }
"#,
        );
        assert_eq!(model.entities[0].attributes[0].name, "id");
        assert_eq!(model.entities[0].primary_key, "id");
    }

    const ANNOTATED: &str = r#"eml: "1.0"
enums:
  - { name: CompoundClass, values: [small_molecule, biologic, peptide] }
  - { name: Unused, values: [never, bound] }
entities:
  - name: Compound
    help: A molecule the programme is working on.
    attributes:
      - { name: id, type: string, pk: true }
      - { name: smiles, type: string, unique: true, help: "The structure, written as SMILES." }
      - { name: compound_class, type: string, enum: CompoundClass }
      - { name: owner_id, type: string, fk: true }
    indexes:
      - { columns: [compound_class, smiles] }
      - { columns: [smiles], unique: true }
      - { columns: [nope] }
  - name: LineItem
    parent: Compound
    attributes:
      - { name: id, type: string, pk: true }
      - { name: compound_id, type: string, fk: true }
      - { name: quantity, type: integer }
  - name: Owner
    attributes:
      - { name: id, type: string, pk: true }
      - { name: name, type: string }
"#;

    #[test]
    fn carries_indexes_in_the_order_written() {
        let model = test_model(ANNOTATED);
        let indexes = entity(&model, "Compound").indexes.as_ref().unwrap();
        assert!(indexes
            .iter()
            .any(|i| i.columns == ["compound_class", "smiles"] && !i.unique));
        assert!(indexes.iter().any(|i| i.columns == ["smiles"] && i.unique));
    }

    #[test]
    fn drops_an_index_naming_a_column_the_entity_does_not_declare() {
        // The migration would fail on a column that does not exist, and a
        // migration that cannot apply is worse than a missing index.
        let model = test_model(ANNOTATED);
        let indexes = entity(&model, "Compound").indexes.as_ref().unwrap();
        assert!(!indexes
            .iter()
            .any(|i| i.columns.contains(&"nope".to_string())));
    }

    #[test]
    fn binds_a_column_to_its_enum_and_allocates_one_reference_id() {
        let model = test_model(ANNOTATED);
        let attr = entity(&model, "Compound")
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
    fn an_enum_no_column_binds_gets_no_reference() {
        // Seeding a reference nothing points at would leave a dead list in the
        // dictionary for an administrator to wonder about.
        let model = test_model(ANNOTATED);
        assert_eq!(model.enums.len(), 1);
        assert_eq!(model.enums[0].name, "CompoundClass");
    }

    #[test]
    fn carries_help_text_onto_the_entity_and_the_column() {
        let model = test_model(ANNOTATED);
        let compound = entity(&model, "Compound");
        assert_eq!(
            compound.description,
            "A molecule the programme is working on."
        );
        let smiles = compound
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
        let model = test_model(ANNOTATED);
        let line_item = entity(&model, "LineItem");
        assert_eq!(line_item.parent_entity.as_deref(), Some("Compound"));
        assert_eq!(line_item.parent_link_column.as_deref(), Some("compound_id"));
        assert_eq!(entity(&model, "Compound").parent_entity, None);
    }

    #[test]
    fn a_semantic_alias_survives_normalisation_to_string() {
        // All five normalise to `string`, so the word the modeller wrote is the
        // only record that the column holds an address rather than a name.
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Person
    attributes:
      - { name: id, type: string, pk: true }
      - { name: contact_email, type: email }
      - { name: label, type: string }
"#,
        );
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
        // form with the field on it twice. The later declaration must not be
        // able to relax a mandatory column into a nullable one either.
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Doc
    attributes:
      - { name: id, type: string, pk: true }
      - { name: title, type: string }
      - { name: title, type: string, optional: true, unique: true }
"#,
        );
        let titles: Vec<_> = model.entities[0]
            .attributes
            .iter()
            .filter(|a| a.name == "title")
            .collect();
        assert_eq!(titles.len(), 1);
        assert!(
            titles[0].required,
            "optional must not loosen the first declaration"
        );
        assert!(
            titles[0].unique,
            "unique from the later declaration must survive"
        );
    }
}
