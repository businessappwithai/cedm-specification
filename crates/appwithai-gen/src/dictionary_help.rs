//! Application Dictionary help text.
//!
//! A port of `packages/generator/src/generators/dictionary-help.ts`.
//!
//! Help is composed from the dictionary itself rather than hand-written per
//! project, so it cannot drift from the schema it describes: what is mandatory,
//! what has to be unique, which records link to which, and the draft → final
//! lifecycle every business record goes through. Administrators can overwrite
//! any of it from Window, Tab and Field; the seed only supplies the start.

use std::collections::BTreeMap;

use crate::bus::BusEntity;
use crate::naming::snake_case;

/// Columns the framework maintains; never described as user input.
const AUDIT_COLUMNS: [&str; 6] = [
    "created_at",
    "updated_at",
    "deleted_at",
    "created_by",
    "updated_by",
    "version",
];

/// Columns whose value the database, not the user, is responsible for.
const SYSTEM_MANAGED: [&str; 3] = ["created_at", "updated_at", "deleted_at"];

#[derive(Debug, Clone)]
struct HelpColumn {
    column_name: String,
    display_name: String,
    ty: String,
    is_mandatory: bool,
    is_unique: bool,
    is_foreign_key: bool,
    max_length: Option<u32>,
    /// Display label of the entity this column points at, once resolved.
    fk_target: Option<String>,
    /// The entity's own `<name>_id` column carried over from the ERD.
    is_business_key: bool,
    /// `%%field <Entity>.<column> help:` — what the author said this column is
    /// for.
    ///
    /// The only sentence in a generated application that carries *domain*
    /// knowledge rather than schema. Everything else this module composes is
    /// derived from the column's shape, so a model with a paragraph on every
    /// column produced an application that said "The Student Number of this
    /// Student. Required — the record cannot be saved while this is empty."
    author_help: Option<String>,
}

impl HelpColumn {
    fn is_audit(&self) -> bool {
        AUDIT_COLUMNS.contains(&self.column_name.as_str())
    }
}

#[derive(Debug, Clone)]
struct HelpEntity {
    label: String,
    table_name: String,
    stem: String,
    columns: Vec<HelpColumn>,
}

/// Help for one entity, keyed the way the seed needs it.
#[derive(Debug, Clone, Default)]
pub struct EntityHelp {
    /// `sys_window.help`
    pub window: String,
    /// `sys_tab.help`
    pub tab: String,
    /// `sys_field.help`, keyed by physical column name.
    pub fields: BTreeMap<String, String>,
}

/// The whole dictionary's help, keyed by physical table name.
pub type DictionaryHelp = BTreeMap<String, EntityHelp>;

/// `a`, `a and b`, `a, b and c`
fn join(items: &[String]) -> String {
    match items {
        [] => String::new(),
        [only] => only.clone(),
        _ => format!(
            "{} and {}",
            items[..items.len() - 1].join(", "),
            items[items.len() - 1]
        ),
    }
}

/// `a Patient` / `an Encounter`
fn article(word: &str) -> &'static str {
    match word.chars().next() {
        Some(first) if "aeiouAEIOU".contains(first) => "an",
        _ => "a",
    }
}

fn plural_s(count: usize) -> &'static str {
    if count == 1 {
        ""
    } else {
        "s"
    }
}

/// Resolve the cross-references the help leans on: which columns point at
/// another entity, and which entities point back at this one.
fn resolve_model(entities: &mut [HelpEntity]) -> Vec<Vec<String>> {
    let by_stem: BTreeMap<String, (String, String)> = entities
        .iter()
        .map(|entity| {
            (
                entity.stem.clone(),
                (entity.table_name.clone(), entity.label.clone()),
            )
        })
        .collect();

    for entity in entities.iter_mut() {
        let table_name = entity.table_name.clone();
        for column in entity.columns.iter_mut() {
            let Some(stem) = column.column_name.strip_suffix("_id") else {
                continue;
            };
            let Some((target_table, target_label)) = by_stem.get(stem) else {
                continue;
            };
            if *target_table == table_name {
                // The entity's own identifier from the ERD, not a link.
                column.is_business_key = true;
            } else if column.is_foreign_key {
                column.fk_target = Some(target_label.clone());
            }
        }
    }

    // Children are resolved in a second pass, because the first is what
    // populated the `fk_target` values this reads.
    entities
        .iter()
        .map(|entity| {
            entities
                .iter()
                .filter(|other| {
                    other.table_name != entity.table_name
                        && other
                            .columns
                            .iter()
                            .any(|c| c.fk_target.as_deref() == Some(entity.label.as_str()))
                })
                .map(|other| other.label.clone())
                .collect()
        })
        .collect()
}

fn window_help_text(entity: &HelpEntity, children: &[String]) -> String {
    let label = &entity.label;

    let mut parents: Vec<String> = Vec::new();
    for column in &entity.columns {
        if let Some(target) = &column.fk_target {
            if !parents.contains(target) {
                parents.push(target.clone());
            }
        }
    }
    let uniques: Vec<String> = entity
        .columns
        .iter()
        .filter(|c| c.is_unique)
        .map(|c| c.display_name.clone())
        .collect();
    let required: Vec<String> = entity
        .columns
        .iter()
        .filter(|c| c.is_mandatory && !c.is_audit())
        .map(|c| c.display_name.clone())
        .collect();

    let mut paragraphs: Vec<String> = Vec::new();

    paragraphs.push(format!(
        "Create, find and maintain {label} records. The list shows every {label} you have access to — \
         select a row to open it, or use New to add one. Each row is a single {label}, described by \
         {count} field{s}.",
        count = entity.columns.len(),
        s = plural_s(entity.columns.len()),
    ));

    let mut identity: Vec<String> = Vec::new();
    if !uniques.is_empty() {
        identity.push(format!(
            "{} {}: no two {label} records may share the same value, and a save that would duplicate \
             one is rejected.",
            join(&uniques),
            if uniques.len() == 1 {
                "is unique"
            } else {
                "are unique"
            },
        ));
    }
    if !required.is_empty() {
        identity.push(format!(
            "{} must be filled in before the record can be saved.",
            join(&required)
        ));
    }
    if !identity.is_empty() {
        paragraphs.push(identity.join(" "));
    }

    let mut links: Vec<String> = Vec::new();
    if !parents.is_empty() {
        links.push(format!(
            "Every {label} points at {}. Choose the linked record from the lookup on those fields \
             rather than typing an identifier.",
            join(&parents)
        ));
    }
    if !children.is_empty() {
        links.push(format!(
            "{} {} back to {label}, so what you change here can affect {}.",
            join(children),
            if children.len() == 1 {
                "refers"
            } else {
                "refer"
            },
            if children.len() == 1 {
                "that record"
            } else {
                "those records"
            },
        ));
    }
    if !links.is_empty() {
        paragraphs.push(links.join(" "));
    }

    paragraphs.push(format!(
        "Every save starts as a Draft. The business rules and workflows attached to {label} then run \
         together in a single transaction: if all of them succeed the record becomes Final; if any of \
         them fails, nothing they changed is kept — the record stays Draft and the reason is written \
         onto it so you can fix the cause and retry. {leading} {label} with no rules or workflows \
         attached is marked Final immediately.",
        leading = if article(label) == "an" { "An" } else { "A" },
    ));

    paragraphs.join("\n\n")
}

fn tab_help_text(entity: &HelpEntity) -> String {
    let label = &entity.label;
    let required = entity
        .columns
        .iter()
        .filter(|c| c.is_mandatory && !c.is_audit())
        .count();
    let lookups: Vec<String> = entity
        .columns
        .iter()
        .filter(|c| c.fk_target.is_some())
        .map(|c| c.display_name.clone())
        .collect();

    let mut sentences: Vec<String> = Vec::new();

    sentences.push(format!(
        "Shows one {label} at a time. Fields are grouped: General carries the identifying fields and \
         Details carries the rest."
    ));
    if required > 0 {
        sentences.push(format!(
            "{required} field{s} marked with a red asterisk (*) must have a value before Save will \
             accept the record.",
            s = plural_s(required),
        ));
    }
    if !lookups.is_empty() {
        sentences.push(format!(
            "{} {} — search the linked records instead of entering an identifier by hand.",
            join(&lookups),
            if lookups.len() == 1 {
                "is a lookup"
            } else {
                "are lookups"
            },
        ));
    }
    sentences.push(
        "Any field showing a ? beside its label has help of its own; click it for the rules that \
         apply there."
            .to_string(),
    );

    sentences.join(" ")
}

fn field_type_sentence(entity: &HelpEntity, column: &HelpColumn) -> String {
    let noun = column.display_name.to_lowercase();
    let label = &entity.label;
    match column.ty.as_str() {
        "date" => format!("The {noun} of this {label}, as a calendar date."),
        "datetime" => format!("The {noun} of this {label}, as a date and time."),
        "integer" => format!("The {noun} of this {label}, as a whole number."),
        "decimal" => format!("The {noun} of this {label}, as a decimal amount."),
        "boolean" => format!("Whether this {label} is marked as {noun}."),
        "text" => format!("Free-form {noun} for this {label}. The box grows as you type."),
        "json" => format!("The {noun} of this {label}, held as structured JSON."),
        _ => format!("The {noun} of this {label}."),
    }
}

fn field_help_text(entity: &HelpEntity, column: &HelpColumn) -> String {
    let mut parts: Vec<String> = Vec::new();

    // The author's words come first, and the derived sentence is dropped rather
    // than appended after them: a `%%field ... help:` that says what a column
    // is for should not be followed by this module restating the column's
    // shape. The *facts* below — required, unique, length — still follow,
    // because the author's sentence does not carry them.
    if let Some(authored) = &column.author_help {
        parts.push(authored.clone());
    } else if let Some(target) = &column.fk_target {
        parts.push(format!(
            "Links this {label} to {article} {target} record. Pick the {target} from the lookup — \
             the identifier is stored for you.",
            label = entity.label,
            article = article(target),
        ));
    } else if column.is_business_key {
        parts.push(format!(
            "The {label} reference used outside this system. It identifies the {label} on documents \
             and in exports, and stays with the record for its whole life.",
            label = entity.label,
        ));
    } else if column.is_audit() {
        parts.push(
            "Maintained by the system as part of the audit trail. It is set automatically, not \
             entered here."
                .to_string(),
        );
    } else {
        parts.push(field_type_sentence(entity, column));
    }

    if column.is_mandatory && !column.is_audit() {
        parts.push("Required — the record cannot be saved while this is empty.".to_string());
    }
    if column.is_unique {
        parts.push(format!(
            "Must be unique: a save is rejected if another {} already uses this value.",
            entity.label
        ));
    }
    if let Some(max_length) = column.max_length {
        parts.push(format!("Up to {max_length} characters."));
    }

    parts.join(" ")
}

/// Compose the help text for every window, tab and field in the dictionary.
///
/// The timestamp columns are reported as optional regardless of what the model
/// says, because the database fills them in — telling a user that `created_at`
/// is a required entry would be wrong.
pub fn build_dictionary_help(entities: &[BusEntity]) -> DictionaryHelp {
    let mut help_entities: Vec<HelpEntity> = entities
        .iter()
        .map(|entity| HelpEntity {
            label: entity.display_name.clone(),
            table_name: entity.table_name.clone(),
            stem: snake_case(&entity.name),
            columns: entity
                .attributes
                .iter()
                .map(|attr| {
                    let system_managed = SYSTEM_MANAGED.contains(&attr.column_name.as_str());
                    HelpColumn {
                        column_name: attr.column_name.clone(),
                        display_name: attr.display_name.clone(),
                        ty: attr.ty.clone(),
                        is_mandatory: !system_managed && attr.required,
                        is_unique: attr.unique,
                        is_foreign_key: attr.is_foreign_key,
                        max_length: attr.max_length,
                        fk_target: None,
                        is_business_key: false,
                        author_help: attr.description.clone(),
                    }
                })
                .collect(),
        })
        .collect();

    let children_by_index = resolve_model(&mut help_entities);

    let mut help = DictionaryHelp::new();
    for (index, entity) in help_entities.iter().enumerate() {
        let mut fields = BTreeMap::new();
        for column in &entity.columns {
            fields.insert(column.column_name.clone(), field_help_text(entity, column));
        }
        help.insert(
            entity.table_name.clone(),
            EntityHelp {
                window: window_help_text(entity, &children_by_index[index]),
                tab: tab_help_text(entity),
                fields,
            },
        );
    }

    help
}

#[cfg(test)]
mod tests {

    /// Regression: the model's own help text never reached the application.
    ///
    /// `%%field <E>.<c> help:` is the only place a model says what a column is
    /// *for* rather than what shape it is, and `sys_field.help` — which the
    /// generated form renders under the control — was composed entirely from
    /// the column's shape. A model with a paragraph on every column produced an
    /// application that said "The Member of this Booking. Required — the record
    /// cannot be saved while this is empty."
    ///
    /// The composed *facts* are kept, because the author's sentence does not
    /// carry them; the composed *sentence* gives way to it.
    #[test]
    fn an_authored_sentence_leads_and_the_derived_one_gives_way() {
        let source = "\
erDiagram
    Member { string id PK }
    Booking {
        string id PK
        string member_id FK
        string reference
    }
    Member ||--o{ Booking : \"holds\"

%%field Booking.member_id help: Who holds the place. A booking may not be transferred between members.
";
        let model = parse_erd(source, &Language::load());
        let declared = declared_entity_names(&model.entities);
        let bus: Vec<_> = model
            .entities
            .iter()
            .map(|entity| entity_to_bus_entity(entity, &declared))
            .collect();
        let help = build_dictionary_help(&bus);
        let fields = &help["bus_booking"].fields;

        assert!(
            fields["member_id"].starts_with("Who holds the place."),
            "{}",
            fields["member_id"]
        );
        // The lookup sentence this module would otherwise compose is dropped
        // rather than appended underneath the author's.
        assert!(!fields["member_id"].contains("Links this Booking to"));

        // A column the model says nothing about is composed exactly as before.
        assert!(!fields["reference"].is_empty());
        assert!(!fields["reference"].contains("Who holds the place"));
    }
    use super::*;
    use crate::bus::{declared_entity_names, entity_to_bus_entity};
    use crate::language::Language;
    use crate::model::parse_erd;

    fn help() -> DictionaryHelp {
        let model = parse_erd(
            r#"
erDiagram
    Compound {
        string id PK
        string smiles UK
        decimal molecular_weight OPTIONAL
        string registered_by_id FK
    }
    CompoundAlias {
        string id PK
        string compound_id FK
        string alias_name
    }
    User {
        string id PK
        string email UK
    }
"#,
            &Language::load(),
        );
        let declared = declared_entity_names(&model.entities);
        let bus: Vec<_> = model
            .entities
            .iter()
            .map(|entity| entity_to_bus_entity(entity, &declared))
            .collect();
        build_dictionary_help(&bus)
    }

    #[test]
    fn a_foreign_key_names_the_entity_it_points_at() {
        let help = help();
        let alias = &help["bus_compound_alias"];
        assert!(
            alias.fields["compound_id"].contains("Links this Compound Alias to a Compound record"),
            "{}",
            alias.fields["compound_id"]
        );
    }

    /// The link is resolved by *stem*, not by the FK flag: `<entity>_id` has to
    /// name an entity in the model. `registered_by_id` has the stem
    /// `registered_by`, nothing is called that, so it falls back to a plain
    /// field description even though the ERD marks it FK.
    ///
    /// That is the case `isForeignKeyColumnName` accepts for `referenceId` and
    /// this resolver does not, and the two disagreeing is deliberate: a lookup
    /// widget still works without a resolvable label, but help text naming the
    /// wrong entity would be worse than help text naming none.
    #[test]
    fn an_unresolvable_stem_falls_back_rather_than_guessing() {
        let compound = &help()["bus_compound"];
        assert_eq!(
            compound.fields["registered_by_id"],
            "The registered by id of this Compound. \
             Required — the record cannot be saved while this is empty."
        );
    }

    #[test]
    fn the_article_agrees_with_the_entity_it_precedes() {
        assert_eq!(article("Encounter"), "an");
        assert_eq!(article("Compound"), "a");
        assert_eq!(article("Instrument"), "an");
    }

    #[test]
    fn children_are_reported_on_the_parent() {
        let help = help();
        assert!(
            help["bus_compound"]
                .window
                .contains("Compound Alias refers back to Compound"),
            "{}",
            help["bus_compound"].window
        );
    }

    #[test]
    fn unique_and_required_columns_are_spelled_out() {
        let help = help();
        let smiles = &help["bus_compound"].fields["smiles"];
        assert!(smiles.contains("Required"), "{smiles}");
        assert!(
            smiles.contains("Must be unique: a save is rejected if another Compound"),
            "{smiles}"
        );
        // OPTIONAL means no "Required" sentence.
        assert!(!help["bus_compound"].fields["molecular_weight"].contains("Required"));
    }

    #[test]
    fn a_decimal_reads_as_an_amount() {
        assert!(help()["bus_compound"].fields["molecular_weight"]
            .starts_with("The molecular weight of this Compound, as a decimal amount."));
    }

    #[test]
    fn joins_read_as_english() {
        assert_eq!(join(&[]), "");
        assert_eq!(join(&["a".into()]), "a");
        assert_eq!(join(&["a".into(), "b".into()]), "a and b");
        assert_eq!(join(&["a".into(), "b".into(), "c".into()]), "a, b and c");
    }
}
