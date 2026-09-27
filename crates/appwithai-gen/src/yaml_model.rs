//! The YAML model language, read into model records.
//!
//! A port of `packages/generator/src/model-yaml/{validate,convert}.ts` as far as
//! generation needs it: the document is checked against
//! `language/yaml/eml.schema.json` — the definition of the language, embedded
//! at build time so the binary carries the schema it was built against — and
//! then read into the same records the EML readers produce. From there the
//! compilers cannot tell which syntax a model was written in.
//!
//! The checker's semantic rules and the view-fidelity layer live in the
//! TypeScript validator (`appwithai validate`); this reader refuses what the
//! schema refuses, which is everything the compilers could not act on.

use std::collections::BTreeMap;

use anyhow::{anyhow, bail, Context, Result};
use serde::Deserialize;

use crate::records::{
    relationship_glyph, AttributeDeclaration, CategoryDeclaration, EntityDeclaration, ErdRecords,
    HookDeclaration, IndexDeclaration, ModelRecords, RbacDeclaration, RelationshipDeclaration,
    ReportDeclaration, RuleAction, RuleDeclaration, RuleEdge, RuleNode, SagaDeclaration,
    SagaStepDeclaration, StateMachineDeclaration, StateTransitionDeclaration,
};

/// `language/yaml/eml.schema.json`, as this binary was built with it.
const SCHEMA: &str = include_str!("../../../language/yaml/eml.schema.json");

/// Whether a path names a YAML model rather than an EML one.
pub fn is_model_yaml_path(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            extension.eq_ignore_ascii_case("yaml") || extension.eq_ignore_ascii_case("yml")
        })
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Document {
    #[allow(dead_code)]
    eml: String,
    #[allow(dead_code)]
    name: Option<String>,
    #[allow(dead_code)]
    version: Option<String>,
    description: Option<String>,
    #[serde(default)]
    enums: Vec<EnumDocument>,
    #[serde(default)]
    categories: Vec<CategoryDocument>,
    entities: Vec<EntityDocument>,
    #[serde(default)]
    relationships: Vec<RelationshipDocument>,
    #[serde(default)]
    hooks: Vec<HookDocument>,
    #[serde(default)]
    rbac: Vec<RbacDocument>,
    /// External events and schedules. Read and held to their shape, but the
    /// application generators compile nothing from them yet; the `eml` CLI's
    /// generators do.
    #[serde(default)]
    #[allow(dead_code)]
    triggers: Vec<TriggerDocument>,
    #[serde(default)]
    reports: Vec<ReportDocument>,
    #[serde(default)]
    rules: Vec<RuleDocument>,
    #[serde(default, rename = "stateMachines")]
    state_machines: Vec<StateMachineDocument>,
    #[serde(default)]
    sagas: Vec<SagaDocument>,
    /// Drawings only; nothing compiles them.
    #[serde(default, rename = "hookDiagrams")]
    #[allow(dead_code)]
    hook_diagrams: Vec<serde_yaml::Value>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct EnumDocument {
    name: String,
    values: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CategoryDocument {
    name: String,
    code: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    color: Option<String>,
    seq: Option<i64>,
    #[serde(default)]
    default: bool,
    #[serde(default)]
    entities: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct EntityDocument {
    name: String,
    help: Option<String>,
    icon: Option<String>,
    parent: Option<String>,
    /// `label`, `prefix`, `softDelete`, `audited`: validated by the schema and
    /// carried by the language, compiled by neither application generator yet.
    #[allow(dead_code)]
    label: Option<String>,
    #[allow(dead_code)]
    prefix: Option<String>,
    #[serde(rename = "softDelete")]
    #[allow(dead_code)]
    soft_delete: Option<bool>,
    #[allow(dead_code)]
    audited: Option<bool>,
    attributes: Vec<AttributeDocument>,
    #[serde(default)]
    indexes: Vec<IndexDocument>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct AttributeDocument {
    name: String,
    #[serde(rename = "type")]
    ty: String,
    #[serde(default)]
    pk: bool,
    #[serde(default)]
    fk: bool,
    #[serde(default)]
    unique: bool,
    #[serde(default)]
    optional: bool,
    #[allow(dead_code)]
    comment: Option<String>,
    #[serde(rename = "enum")]
    enum_name: Option<String>,
    help: Option<String>,
    /// `ui`, `default`, `min`, `max`, `format`: validated and carried, not
    /// compiled by either application generator yet. `min`/`max` are a number
    /// or text, so they are held as whatever YAML value was written.
    #[allow(dead_code)]
    ui: Option<String>,
    #[allow(dead_code)]
    default: Option<String>,
    #[allow(dead_code)]
    min: Option<serde_yaml::Value>,
    #[allow(dead_code)]
    max: Option<serde_yaml::Value>,
    #[allow(dead_code)]
    format: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct IndexDocument {
    columns: Vec<String>,
    #[serde(default)]
    unique: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RelationshipDocument {
    from: String,
    #[serde(rename = "fromCardinality")]
    from_cardinality: String,
    to: String,
    #[serde(rename = "toCardinality")]
    to_cardinality: String,
    label: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct HookDocument {
    entity: String,
    event: String,
    handler: String,
    /// Every column the hook is scoped to; the compiled handler takes the first.
    #[serde(default)]
    fields: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RbacDocument {
    entity: String,
    action: String,
    roles: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
#[allow(dead_code)]
struct TriggerDocument {
    entity: String,
    source: String,
    handler: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ReportDocument {
    name: String,
    title: Option<String>,
    entity: Option<String>,
    chart: Option<String>,
    x: Option<String>,
    y: Option<String>,
    help: Option<String>,
    sql: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RuleDocument {
    name: String,
    #[allow(dead_code)]
    title: Option<String>,
    entity: String,
    event: String,
    priority: Option<i64>,
    #[allow(dead_code)]
    direction: Option<String>,
    nodes: Vec<RuleNodeDocument>,
    edges: Vec<RuleEdgeDocument>,
    #[serde(default)]
    actions: Vec<RuleActionDocument>,
    #[serde(rename = "decisionTable")]
    decision_table: Option<serde_yaml::Value>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RuleNodeDocument {
    id: String,
    label: String,
    shape: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RuleEdgeDocument {
    from: String,
    to: String,
    label: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RuleActionDocument {
    name: String,
    #[serde(rename = "type")]
    action_type: String,
    when: Option<String>,
    #[serde(default)]
    props: BTreeMap<String, String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct StateMachineDocument {
    name: String,
    #[allow(dead_code)]
    title: Option<String>,
    entity: String,
    states: Vec<String>,
    initial: Option<String>,
    #[serde(default, rename = "final")]
    terminal: Vec<String>,
    transitions: Vec<TransitionDocument>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct TransitionDocument {
    from: String,
    to: String,
    trigger: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SagaDocument {
    name: String,
    #[allow(dead_code)]
    title: Option<String>,
    entity: String,
    operation: Option<String>,
    trigger: Option<String>,
    description: Option<String>,
    steps: Vec<SagaStepDocument>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SagaStepDocument {
    id: String,
    #[serde(rename = "type")]
    step_type: String,
    label: Option<String>,
    /// A YAML mapping keeps its order; the BPMN a step compiles to writes its
    /// properties in the order the author gave them.
    #[serde(default)]
    properties: serde_yaml::Mapping,
}

/// Check a parsed document against the language's schema, reporting every
/// violation by its path in the document.
fn validate_against_schema(document: &serde_json::Value) -> Result<()> {
    let schema: serde_json::Value =
        serde_json::from_str(SCHEMA).context("the embedded language schema is not JSON")?;
    let validator = jsonschema::draft202012::new(&schema)
        .map_err(|error| anyhow!("the embedded language schema does not compile: {error}"))?;

    let problems: Vec<String> = validator
        .iter_errors(document)
        .map(|error| {
            let at = error.instance_path().to_string();
            format!("  {} {error}", if at.is_empty() { "/" } else { &at })
        })
        .collect();
    if problems.is_empty() {
        return Ok(());
    }
    bail!(
        "the model does not match the YAML model language ({} problem(s)):\n{}\n  \
         `appwithai validate <model>` reports each one at its line and column.",
        problems.len(),
        problems.join("\n")
    )
}

/// Read YAML model text into records, refusing anything the schema refuses.
pub fn read_model_yaml(text: &str) -> Result<ModelRecords> {
    let value: serde_yaml::Value =
        serde_yaml::from_str(text).map_err(|error| match error.location() {
            Some(location) => anyhow!(
                "line {}, column {}: {error}",
                location.line(),
                location.column()
            ),
            None => anyhow!("{error}"),
        })?;
    let as_json = serde_json::to_value(&value)
        .context("the model contains a value JSON cannot hold (a non-string key?)")?;
    validate_against_schema(&as_json)?;

    let document: Document =
        serde_yaml::from_value(value).context("reading the validated model")?;
    document_to_records(document)
}

fn text_of(value: &serde_yaml::Value) -> Result<String> {
    value
        .as_str()
        .map(str::to_string)
        .ok_or_else(|| anyhow!("expected text, found {value:?}"))
}

fn document_to_records(document: Document) -> Result<ModelRecords> {
    let mut erd = ErdRecords {
        enums: document
            .enums
            .into_iter()
            .map(|declared| (declared.name, declared.values))
            .collect(),
        ..ErdRecords::default()
    };

    for entity in document.entities {
        let name = entity.name;
        erd.entities.push(EntityDeclaration {
            name: name.clone(),
            attributes: entity
                .attributes
                .iter()
                .map(|attribute| {
                    let mut modifiers = Vec::new();
                    if attribute.pk {
                        modifiers.push("PK".to_string());
                    }
                    if attribute.fk {
                        modifiers.push("FK".to_string());
                    }
                    if attribute.unique {
                        modifiers.push("UK".to_string());
                    }
                    if attribute.optional {
                        modifiers.push("OPTIONAL".to_string());
                    }
                    AttributeDeclaration {
                        ty: attribute.ty.clone(),
                        name: attribute.name.clone(),
                        modifiers,
                    }
                })
                .collect(),
        });
        if let Some(help) = entity.help {
            erd.entity_help.push((name.clone(), help));
        }
        if let Some(icon) = entity.icon {
            erd.entity_icons.push((name.clone(), icon));
        }
        if let Some(parent) = entity.parent {
            erd.entity_parents.push((name.clone(), parent));
        }
        for attribute in entity.attributes {
            if let Some(enum_name) = attribute.enum_name {
                erd.enum_bindings
                    .push((name.clone(), attribute.name.clone(), enum_name));
            }
            if let Some(help) = attribute.help {
                erd.field_help.push((name.clone(), attribute.name, help));
            }
        }
        for index in entity.indexes {
            erd.indexes.push(IndexDeclaration {
                entity: name.clone(),
                columns: index.columns,
                unique: index.unique,
            });
        }
    }

    for relationship in document.relationships {
        let left = relationship_glyph(&relationship.from_cardinality, true)
            .ok_or_else(|| anyhow!("unknown cardinality {}", relationship.from_cardinality))?;
        let right = relationship_glyph(&relationship.to_cardinality, false)
            .ok_or_else(|| anyhow!("unknown cardinality {}", relationship.to_cardinality))?;
        erd.relationships.push(RelationshipDeclaration {
            source: relationship.from,
            target: relationship.to,
            operator: format!("{left}--{right}"),
            label: relationship.label,
        });
    }

    let mut sagas = Vec::new();
    for saga in document.sagas {
        let mut steps = Vec::new();
        for step in saga.steps {
            let mut properties = Vec::new();
            for (key, value) in &step.properties {
                properties.push((text_of(key)?, text_of(value)?));
            }
            steps.push(SagaStepDeclaration {
                id: step.id,
                step_type: step.step_type,
                label: step.label,
                properties,
            });
        }
        sagas.push(SagaDeclaration {
            name: saga.name,
            entity: saga.entity,
            operation: saga.operation,
            trigger: saga.trigger,
            description: saga.description,
            steps,
        });
    }

    let mut rules = Vec::new();
    for rule in document.rules {
        rules.push(RuleDeclaration {
            name: rule.name,
            entity: rule.entity,
            event: rule.event,
            priority: rule.priority,
            nodes: rule
                .nodes
                .into_iter()
                .map(|node| RuleNode {
                    id: node.id,
                    label: node.label,
                    shape: node.shape,
                })
                .collect(),
            edges: rule
                .edges
                .into_iter()
                .map(|edge| RuleEdge {
                    source: edge.from,
                    target: edge.to,
                    label: edge.label,
                })
                .collect(),
            actions: rule
                .actions
                .into_iter()
                .map(|action| RuleAction {
                    name: action.name,
                    action_type: action.action_type,
                    when: action.when,
                    props: action.props,
                })
                .collect(),
            decision_table: rule
                .decision_table
                .map(|table| serde_json::to_value(&table))
                .transpose()
                .context("reading a decision table")?,
        });
    }

    Ok(ModelRecords {
        description: document.description,
        erd,
        categories: document
            .categories
            .into_iter()
            .map(|category| CategoryDeclaration {
                name: category.name,
                code: category.code,
                description: category.description,
                icon: category.icon,
                color: category.color,
                seq: category.seq,
                is_default: category.default,
                entities: category.entities,
            })
            .collect(),
        rbac: document
            .rbac
            .into_iter()
            .map(|rule| RbacDeclaration {
                roles: rule.roles,
                entity: rule.entity,
                target: rule.action,
            })
            .collect(),
        hooks: document
            .hooks
            .into_iter()
            .map(|hook| HookDeclaration {
                event: hook.event,
                handler: hook.handler,
                entity: hook.entity,
                field: hook.fields.into_iter().next(),
            })
            .collect(),
        reports: document
            .reports
            .into_iter()
            .map(|report| ReportDeclaration {
                name: report.name,
                title: report.title,
                entity: report.entity,
                chart: report.chart,
                x: report.x,
                y: report.y,
                help: report.help,
                sql: report.sql,
            })
            .collect(),
        rules,
        state_machines: document
            .state_machines
            .into_iter()
            .map(|machine| StateMachineDeclaration {
                name: machine.name,
                entity: machine.entity,
                states: machine.states,
                initial: machine.initial,
                r#final: machine.terminal,
                transitions: machine
                    .transitions
                    .into_iter()
                    .map(|transition| StateTransitionDeclaration {
                        from: transition.from,
                        to: transition.to,
                        trigger: transition.trigger,
                    })
                    .collect(),
            })
            .collect(),
        sagas,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::language::Language;
    use crate::model_source::read_eml_model;

    /// `<EML model>`, `<its YAML>` — the corpus the parity script also runs.
    const PAIRS: [(&str, &str); 6] = [
        (
            "examples/drug-discovery.eml.mmd",
            "examples/drug-discovery.eml.yaml",
        ),
        (
            "language/examples/crm.eml.mmd",
            "language/yaml/examples/crm.eml.yaml",
        ),
        (
            "language/examples/dance-studio.eml.mmd",
            "language/yaml/examples/dance-studio.eml.yaml",
        ),
        (
            "language/examples/ecommerce.eml.mmd",
            "language/yaml/examples/ecommerce.eml.yaml",
        ),
        (
            "language/examples/helpdesk.eml.mmd",
            "language/yaml/examples/helpdesk.eml.yaml",
        ),
        (
            "language/examples/minimal.eml.mmd",
            "language/yaml/examples/minimal.eml.yaml",
        ),
    ];

    fn repo_file(relative: &str) -> String {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        std::fs::read_to_string(root.join(relative)).expect(relative)
    }

    /// Everything the compilers produce from a model, as JSON for comparison.
    fn compiled(records: &ModelRecords, lang: &Language) -> serde_json::Value {
        let model = crate::model::compile_erd(&records.erd, lang);
        let names: Vec<String> = model.entities.iter().map(|e| e.name.clone()).collect();
        let workflows = crate::workflows::compile_state_machine_declarations(
            &records.state_machines,
            &names,
            |_| {},
        );
        let machines: Vec<crate::rbac::RbacStateMachine> = workflows
            .iter()
            .map(crate::workflows::CompiledWorkflow::as_state_machine)
            .collect();
        let sagas = crate::saga::compile_saga_declarations(&records.sagas, lang);
        serde_json::json!({
            "entities": model.entities,
            "relationships": model.relationships,
            "enums": model.enums,
            "categories": crate::category::resolve_category_declarations(&records.categories, &names),
            "workflows": format!("{workflows:?}"),
            "rbac": format!("{:?}", crate::rbac::compile_rbac_declarations(&records.rbac, &names, &machines, |_| {})),
            "rules": format!("{:?}", crate::rules::compile_rule_declarations(&records.rules, |_| {})),
            "reports": format!("{:?}", crate::reports::compile_report_declarations(&records.reports, &names, |_| {})),
            "hooks": format!("{:?}", crate::hooks::compile_hook_declarations(&records.hooks, &names, |_| {})),
            "sagas": format!("{:?}", sagas.workflows),
        })
    }

    #[test]
    fn every_yaml_example_compiles_to_what_its_eml_compiles_to() {
        let lang = Language::load();
        for (eml, yaml) in PAIRS {
            let from_eml = read_eml_model(&repo_file(eml), &lang, |_| {});
            let from_yaml = read_model_yaml(&repo_file(yaml)).expect(yaml);
            assert_eq!(
                compiled(&from_yaml, &lang),
                compiled(&from_eml, &lang),
                "{yaml} and {eml} compile differently"
            );
        }
    }

    #[test]
    fn a_model_the_schema_refuses_is_refused_with_its_path() {
        let error = read_model_yaml(
            "eml: \"1.0\"\nentities:\n  - name: A\n    attributes:\n      - { name: id, type: uuid, primary: true }\n",
        )
        .expect_err("an unknown key is refused");
        let message = format!("{error:#}");
        assert!(message.contains("/entities/0/attributes/0"), "{message}");
    }

    /// Refused and named. `serde_yaml` locates the mapping holding the repeat,
    /// not the repeated key; `appwithai validate` gives the key's own line.
    #[test]
    fn a_duplicate_key_is_refused_rather_than_the_last_one_winning() {
        let error = read_model_yaml("eml: \"1.0\"\nentities: []\nentities: []\n")
            .expect_err("a duplicate key is refused");
        assert!(
            format!("{error:#}").contains("duplicate entry with key \"entities\""),
            "{error:#}"
        );
    }

    #[test]
    fn saga_step_properties_keep_the_order_written() {
        let records = read_model_yaml(
            "eml: \"1.0\"\nentities: [{ name: A, attributes: [{ name: id, type: uuid, pk: true }] }]\n\
             sagas:\n  - name: s\n    entity: A\n    steps:\n      - id: b\n        type: UpdateEntity\n        \
             properties: { value: done, field: status }\n",
        )
        .expect("a valid model");
        assert_eq!(
            records.sagas[0].steps[0].properties,
            vec![
                ("value".to_string(), "done".to_string()),
                ("field".to_string(), "status".to_string())
            ]
        );
    }

    #[test]
    fn an_editor_decision_table_compiles_as_the_typescript_generator_compiles_it() {
        let records = read_model_yaml(
            "eml: \"1.0\"\nentities: [{ name: Lead, attributes: [{ name: id, type: uuid, pk: true }] }]\n\
             rules:\n  - name: grade\n    entity: Lead\n    event: beforeCreate\n    nodes: []\n    edges: []\n    \
             decisionTable:\n      hitPolicy: first\n      inputs: [{ id: i1, name: Score, field: score }]\n      \
             outputs: [{ id: o1, name: Grade, field: grade }]\n      rules:\n        \
             - { _id: '', i1: '>= 70', o1: hot }\n        - { i1: '0x10', o1: '1e3' }\n",
        )
        .expect("a valid model");
        let rules = crate::rules::compile_rule_declarations(&records.rules, |_| {});
        assert_eq!(
            rules[0].jdm_content,
            concat!(
                r#"{"nodes":[{"id":"input","name":"Input","type":"inputNode"},"#,
                r#"{"id":"grade-table","name":"grade","type":"decisionTableNode","content":{"hitPolicy":"first","#,
                r#""inputs":[{"id":"i1","name":"Score","field":"score"}],"outputs":[{"id":"o1","name":"Grade","field":"grade"}],"#,
                r#""rules":[{"_id":"grade-1","i1":">= 70","o1":"'hot'"},{"_id":"grade-2","i1":"0x10","o1":"1e3"}]}},"#,
                r#"{"id":"output","name":"Output","type":"outputNode"}],"#,
                r#""edges":[{"id":"edge-1","sourceId":"input","targetId":"grade-table"},"#,
                r#"{"id":"edge-2","sourceId":"grade-table","targetId":"output"}]}"#
            )
        );
    }
}
