//! Model records — what a model *says*, before anything is compiled from it.
//!
//! A port of `packages/generator/src/model/records.ts`. A model is written in
//! EML (Mermaid plus `%%` directives) or in the YAML model language; both are
//! read into these records, and only these records are compiled. Each compiler
//! therefore exists once, and the two syntaxes cannot come to mean different
//! things — the same argument the TypeScript generator rests on, made again
//! here so the Rust generator can take a YAML model as its source.

use std::collections::BTreeMap;

/// One column declaration: `type name MODIFIER…`, tokens as written.
#[derive(Debug, Clone, PartialEq)]
pub struct AttributeDeclaration {
    /// The type token with any length suffix: `string(255)`, `email`.
    pub ty: String,
    pub name: String,
    pub modifiers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct EntityDeclaration {
    pub name: String,
    pub attributes: Vec<AttributeDeclaration>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct RelationshipDeclaration {
    pub source: String,
    pub target: String,
    /// The Mermaid operator, e.g. `||--o{`. Only the eight the language
    /// defines compile.
    pub operator: String,
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IndexDeclaration {
    pub entity: String,
    pub columns: Vec<String>,
    pub unique: bool,
}

/// Everything the ERD layer declares, annotations as flat lists in declaration
/// order. Repeats are resolved by the compiler: the first enum of a name, the
/// last help/icon/parent for an entity.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ErdRecords {
    pub entities: Vec<EntityDeclaration>,
    pub relationships: Vec<RelationshipDeclaration>,
    pub indexes: Vec<IndexDeclaration>,
    pub enums: Vec<(String, Vec<String>)>,
    /// `(entity, column, enum)`
    pub enum_bindings: Vec<(String, String, String)>,
    /// `(entity, column, help)`
    pub field_help: Vec<(String, String, String)>,
    pub entity_help: Vec<(String, String)>,
    pub entity_icons: Vec<(String, String)>,
    pub entity_parents: Vec<(String, String)>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CategoryDeclaration {
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub seq: Option<i64>,
    pub is_default: bool,
    pub entities: Vec<String>,
}

/// These roles may perform `target` — a CRUD operation or alias, `*`, or a
/// transition trigger — on `entity`.
#[derive(Debug, Clone, PartialEq)]
pub struct RbacDeclaration {
    pub roles: Vec<String>,
    pub entity: String,
    pub target: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HookDeclaration {
    pub event: String,
    pub handler: String,
    pub entity: String,
    pub field: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct ReportDeclaration {
    pub name: String,
    pub title: Option<String>,
    pub entity: Option<String>,
    pub chart: Option<String>,
    pub x: Option<String>,
    pub y: Option<String>,
    pub help: Option<String>,
    pub sql: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct RuleNode {
    pub id: String,
    pub label: String,
    /// `stadium`, `diamond`, `rect`, `circle` or `round`.
    pub shape: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct RuleEdge {
    pub source: String,
    pub target: String,
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct RuleAction {
    pub name: String,
    pub action_type: String,
    /// Absent means always.
    pub when: Option<String>,
    pub props: BTreeMap<String, String>,
}

/// A business rule bound to a lifecycle event, compiled from its decision
/// table, else its actions, else its flowchart.
#[derive(Debug, Clone, PartialEq)]
pub struct RuleDeclaration {
    pub name: String,
    pub entity: String,
    pub event: String,
    pub priority: Option<i64>,
    pub nodes: Vec<RuleNode>,
    pub edges: Vec<RuleEdge>,
    pub actions: Vec<RuleAction>,
    /// The editor's decision table, as JSON.
    pub decision_table: Option<serde_json::Value>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StateTransitionDeclaration {
    pub from: String,
    pub to: String,
    pub trigger: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StateMachineDeclaration {
    pub name: String,
    pub entity: String,
    pub states: Vec<String>,
    pub initial: Option<String>,
    pub r#final: Vec<String>,
    pub transitions: Vec<StateTransitionDeclaration>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SagaStepDeclaration {
    pub id: String,
    pub step_type: String,
    pub label: Option<String>,
    /// In the order written.
    pub properties: Vec<(String, String)>,
}

/// A saga, steps in execution order.
#[derive(Debug, Clone, PartialEq)]
pub struct SagaDeclaration {
    pub name: String,
    pub entity: String,
    pub operation: Option<String>,
    pub trigger: Option<String>,
    pub description: Option<String>,
    pub steps: Vec<SagaStepDeclaration>,
}

/// Everything a model declares.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ModelRecords {
    pub description: Option<String>,
    pub erd: ErdRecords,
    pub categories: Vec<CategoryDeclaration>,
    pub rbac: Vec<RbacDeclaration>,
    pub hooks: Vec<HookDeclaration>,
    pub reports: Vec<ReportDeclaration>,
    pub rules: Vec<RuleDeclaration>,
    pub state_machines: Vec<StateMachineDeclaration>,
    pub sagas: Vec<SagaDeclaration>,
}

/// Mermaid's glyph pair for a relationship end, by side.
pub fn relationship_glyph(end: &str, left: bool) -> Option<&'static str> {
    Some(match (end, left) {
        ("exactly-one", _) => "||",
        ("zero-or-one", true) => "|o",
        ("zero-or-one", false) => "o|",
        ("zero-or-more", true) => "}o",
        ("zero-or-more", false) => "o{",
        ("one-or-more", true) => "}|",
        ("one-or-more", false) => "|{",
        _ => return None,
    })
}
