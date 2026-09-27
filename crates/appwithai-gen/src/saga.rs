//! The model's `sagas`: compile each to BPMN and emit `seed/workflows.sql`.
//!
//! A port of `packages/generator/src/workflows/{sagas,saga}.ts`. A saga's steps
//! run in the order the model lists them; each becomes one `bpmn:serviceTask`.

use std::collections::BTreeMap;

use crate::language::Language;
use crate::records::{SagaDeclaration, SagaStepDeclaration};

/// One step of a saga, by its id.
#[derive(Debug, Clone)]
pub struct SagaStep {
    pub node_id: String,
    pub node_type: String,
    /// The step's label, used as the BPMN task name; its id when it has none.
    pub label: String,
    /// Ordered so the emitted BPMN is stable across runs. The TypeScript
    /// version relies on JavaScript's insertion order for the same guarantee.
    pub properties: Vec<(String, String)>,
}

#[derive(Debug, Clone)]
pub struct SagaWorkflow {
    pub name: String,
    /// ERD entity the workflow is bound to. Rewritten to the physical table
    /// name before the seed is built.
    pub entity: String,
    /// The write that runs it: `CREATE` (the default), `UPDATE`, `DELETE` or `ALL`.
    pub operation: String,
    /// What starts the run: `automatic` (the default) or `rule`.
    pub trigger: String,
    pub description: Option<String>,
    pub steps: Vec<SagaStep>,
}

#[derive(Debug, Clone)]
pub struct SagaDiagnostic {
    pub workflow: String,
    pub node_id: Option<String>,
    pub message: String,
}

#[derive(Debug, Default)]
pub struct SagaParseResult {
    pub workflows: Vec<SagaWorkflow>,
    pub diagnostics: Vec<SagaDiagnostic>,
}

// ── Directive scanning ───────────────────────────────────────────────────────

// ── Flowchart reading ────────────────────────────────────────────────────────

// ── Parsing ──────────────────────────────────────────────────────────────────

/// The write a saga runs on, in the runtime's vocabulary. Aliases are read as
/// the access rules read them; anything else is kept, upper-cased. Default `CREATE`.
pub fn saga_operation(declared: Option<&str>) -> String {
    let Some(value) = declared.map(str::trim).filter(|value| !value.is_empty()) else {
        return "CREATE".to_string();
    };
    match value.to_ascii_lowercase().as_str() {
        "create" | "insert" | "add" => "CREATE".to_string(),
        "update" | "edit" | "write" | "modify" => "UPDATE".to_string(),
        "delete" | "remove" | "destroy" => "DELETE".to_string(),
        "all" | "any" | "*" => "ALL".to_string(),
        _ => value.to_uppercase(),
    }
}

/// What starts a saga: `automatic` (the default) or `rule`.
pub fn saga_trigger(declared: Option<&str>) -> String {
    match declared.map(str::trim).filter(|value| !value.is_empty()) {
        Some(value) => value.to_lowercase(),
        None => "automatic".to_string(),
    }
}

/// The steps of a saga that can run, in declaration order.
///
/// A step of an unknown type is dropped, and so is a second step on a node that
/// already has one; a step missing a property its type requires is kept and
/// reported. `after_each` runs once per accepted step, after its own checks.
fn accept_saga_steps(
    workflow: &str,
    declared: &[SagaStepDeclaration],
    lang: &Language,
    diagnostics: &mut Vec<SagaDiagnostic>,
) -> Vec<(String, SagaStep)> {
    let mut by_node: Vec<(String, SagaStep)> = Vec::new();

    for step in declared {
        let node_id = step.id.clone();
        let node_type = step.step_type.clone();
        if !lang.is_step_node_type(&node_type) {
            diagnostics.push(SagaDiagnostic {
                workflow: workflow.to_string(),
                node_id: Some(node_id),
                message: format!("unknown step type \"{node_type}\""),
            });
            continue;
        }
        if by_node.iter().any(|(id, _)| *id == node_id) {
            diagnostics.push(SagaDiagnostic {
                workflow: workflow.to_string(),
                node_id: Some(node_id.clone()),
                message: format!("node \"{node_id}\" already has a step; the second is ignored"),
            });
            continue;
        }

        let lookup: BTreeMap<String, String> = step.properties.iter().cloned().collect();
        for missing in lang.missing_step_props(&node_type, &lookup) {
            diagnostics.push(SagaDiagnostic {
                workflow: workflow.to_string(),
                node_id: Some(node_id.clone()),
                message: format!("{node_type} is missing {missing}"),
            });
        }

        by_node.push((
            node_id.clone(),
            SagaStep {
                label: step.label.clone().unwrap_or_else(|| node_id.clone()),
                node_id,
                node_type,
                properties: step.properties.clone(),
            },
        ));
    }

    by_node
}

/// Compile saga declarations. The same checks `parse_sagas` makes, except that
/// steps run in the order listed: a declaration states its order outright.
pub fn compile_saga_declarations(
    declarations: &[SagaDeclaration],
    lang: &Language,
) -> SagaParseResult {
    let mut result = SagaParseResult::default();

    for declaration in declarations {
        let name = declaration.name.clone();
        if declaration.entity.is_empty() {
            result.diagnostics.push(SagaDiagnostic {
                workflow: name.clone(),
                node_id: None,
                message: "saga declares no entity".to_string(),
            });
        }

        let steps: Vec<SagaStep> =
            accept_saga_steps(&name, &declaration.steps, lang, &mut result.diagnostics)
                .into_iter()
                .map(|(_, step)| step)
                .collect();

        if steps.is_empty() {
            result.diagnostics.push(SagaDiagnostic {
                workflow: name.clone(),
                node_id: None,
                message: "saga has no steps, so it compiles to an empty process".to_string(),
            });
        }

        result.workflows.push(SagaWorkflow {
            name,
            entity: declaration.entity.clone(),
            operation: saga_operation(declaration.operation.as_deref()),
            trigger: saga_trigger(declaration.trigger.as_deref()),
            description: declaration.description.clone(),
            steps,
        });
    }

    result
}

// ── BPMN ─────────────────────────────────────────────────────────────────────

fn escape_xml(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            _ => out.push(ch),
        }
    }
    out
}

/// A BPMN-safe id. Node ids come from the model, so they are not trusted.
fn safe_id(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '_' || ch == '-' {
                ch
            } else {
                '_'
            }
        })
        .collect();
    match cleaned.chars().next() {
        Some(first) if first.is_ascii_alphabetic() || first == '_' => cleaned,
        _ => format!("n_{cleaned}"),
    }
}

/// Diagram geometry. A saga is a straight line, so the layout is one row.
mod layout {
    pub const ROW_Y: i64 = 140;
    pub const EVENT_SIZE: i64 = 36;
    pub const TASK_WIDTH: i64 = 140;
    pub const TASK_HEIGHT: i64 = 80;
    pub const START_X: i64 = 160;
    pub const GAP: i64 = 60;
}

struct Bounds {
    id: String,
    x: i64,
    y: i64,
    width: i64,
    height: i64,
}

/// The `bpmndi` section for a linear process.
///
/// bpmn-js does *not* lay out a diagram that carries no `BPMNDiagram`: it
/// rejects the import with "no diagram to display", so a model-declared saga
/// opened in the Workflow Designer rendered nothing at all. Coordinates are
/// emitted here instead. They cost nothing on a re-save, because the designer
/// exports its own DI from whatever the user has arranged.
fn build_diagram(process_id: &str, sequence: &[String], flow_ids: &[String]) -> String {
    let is_event = |index: usize| index == 0 || index == sequence.len() - 1;

    let bounds: Vec<Bounds> = sequence
        .iter()
        .enumerate()
        .map(|(index, id)| {
            let width = if is_event(index) {
                layout::EVENT_SIZE
            } else {
                layout::TASK_WIDTH
            };
            let height = if is_event(index) {
                layout::EVENT_SIZE
            } else {
                layout::TASK_HEIGHT
            };
            // Every preceding node contributes its own width plus one gap.
            let x = layout::START_X
                + (0..index)
                    .map(|position| {
                        let preceding = if is_event(position) {
                            layout::EVENT_SIZE
                        } else {
                            layout::TASK_WIDTH
                        };
                        preceding + layout::GAP
                    })
                    .sum::<i64>();
            Bounds {
                id: id.clone(),
                x,
                y: layout::ROW_Y - height / 2,
                width,
                height,
            }
        })
        .collect();

    let shapes = bounds
        .iter()
        .map(|node| {
            format!(
                "      <bpmndi:BPMNShape id=\"{id}_di\" bpmnElement=\"{id}\">\n        \
                 <dc:Bounds x=\"{x}\" y=\"{y}\" width=\"{width}\" height=\"{height}\"/>\n      \
                 </bpmndi:BPMNShape>",
                id = node.id,
                x = node.x,
                y = node.y,
                width = node.width,
                height = node.height,
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let edges = flow_ids
        .iter()
        .enumerate()
        .map(|(index, flow_id)| {
            let from = &bounds[index];
            let to = &bounds[index + 1];
            format!(
                "      <bpmndi:BPMNEdge id=\"{flow_id}_di\" bpmnElement=\"{flow_id}\">\n        \
                 <di:waypoint x=\"{from_x}\" y=\"{row}\"/>\n        \
                 <di:waypoint x=\"{to_x}\" y=\"{row}\"/>\n      </bpmndi:BPMNEdge>",
                from_x = from.x + from.width,
                to_x = to.x,
                row = layout::ROW_Y,
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        "  <bpmndi:BPMNDiagram id=\"BPMNDiagram_{process_id}\">\n    \
         <bpmndi:BPMNPlane id=\"BPMNPlane_{process_id}\" bpmnElement=\"{process_id}\">\n\
         {shapes}\n{edges}\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>"
    )
}

/// Compile a saga to BPMN.
///
/// Properties ride as `appwithai:property` extension elements — the encoding the
/// designer reads and the executor parses. Emitting anything else here would
/// produce a diagram that runs but cannot be edited, or the reverse.
pub fn build_saga_bpmn(saga: &SagaWorkflow) -> String {
    let process_id = format!("Process_{}", safe_id(&saga.name));
    let start_id = format!("{process_id}_start");
    let end_id = format!("{process_id}_end");

    let task_ids: Vec<String> = saga
        .steps
        .iter()
        .map(|step| format!("{process_id}_{}", safe_id(&step.node_id)))
        .collect();

    let mut sequence = vec![start_id.clone()];
    sequence.extend(task_ids.iter().cloned());
    sequence.push(end_id.clone());

    let tasks = saga
        .steps
        .iter()
        .enumerate()
        .map(|(index, step)| {
            let properties = step
                .properties
                .iter()
                .map(|(key, value)| {
                    format!(
                        "        <appwithai:property name=\"{}\" value=\"{}\"/>",
                        escape_xml(key),
                        escape_xml(value)
                    )
                })
                .collect::<Vec<_>>()
                .join("\n");

            format!(
                "    <bpmn:serviceTask id=\"{id}\" name=\"{label}\">\n      \
                 <bpmn:extensionElements>\n        <appwithai:properties>\n        \
                 <appwithai:property name=\"nodeType\" value=\"{node_type}\"/>\n\
                 {properties}\n        </appwithai:properties>\n      \
                 </bpmn:extensionElements>\n    </bpmn:serviceTask>",
                id = task_ids[index],
                label = escape_xml(&step.label),
                node_type = escape_xml(&step.node_type),
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let flow_ids: Vec<String> = (0..sequence.len().saturating_sub(1))
        .map(|index| format!("{process_id}_flow_{index}"))
        .collect();
    let flows = flow_ids
        .iter()
        .enumerate()
        .map(|(index, flow_id)| {
            format!(
                "    <bpmn:sequenceFlow id=\"{flow_id}\" sourceRef=\"{from}\" targetRef=\"{to}\"/>",
                from = sequence[index],
                to = sequence[index + 1],
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:appwithai="http://appwithai.io/schema/1.0"
  id="Definitions_{definition_id}"
  targetNamespace="http://appwithai.io/bpmn">
  <bpmn:process id="{process_id}" isExecutable="true">
    <bpmn:startEvent id="{start_id}"/>
{tasks}
    <bpmn:endEvent id="{end_id}"/>
{flows}
  </bpmn:process>
{diagram}
</bpmn:definitions>"#,
        definition_id = safe_id(&saga.name),
        diagram = build_diagram(&process_id, &sequence, &flow_ids),
    )
}

// ── Seed SQL ─────────────────────────────────────────────────────────────────

fn sql_string(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

/// Seed SQL for every saga in the model.
///
/// Upserted by name, so regenerating a model updates the definition it owns.
/// `is_model_managed` marks these as belonging to the model: the designer shows
/// them read-only rather than letting an edit be silently overwritten by the
/// next generation.
pub fn build_workflow_seed_sql(sagas: &[SagaWorkflow], project_name: &str) -> String {
    let header = format!(
        "-- Model-declared workflows for {project_name}.\n\
         --\n\
         -- Generated by @appwithai/generator from the model's `kind: saga` sections —\n\
         -- do not edit by hand; change the model and regenerate.\n\
         --\n\
         -- Upserted by name: these definitions belong to the model, and the designer\n\
         -- presents them read-only so a regeneration cannot quietly discard an edit\n\
         -- someone made in the UI.\n"
    );

    if sagas.is_empty() {
        return format!("{header}\n-- The model declares no sagas.\n");
    }

    let statements = sagas
        .iter()
        .map(|workflow| {
            let bpmn = build_saga_bpmn(workflow);
            let description = match workflow.description.as_deref() {
                Some(text) if !text.is_empty() => sql_string(text),
                _ => sql_string(&format!(
                    "Declared in the model as a {}-triggered saga.",
                    workflow.trigger
                )),
            };

            format!(
                "INSERT INTO sys_workflow_definitions\n  \
                 (name, entity_name, operation, trigger_type, bpmn_xml, description, is_active, is_model_managed, created_at, updated_at)\n\
                 VALUES ({name}, {entity}, {operation},\n        \
                 {trigger}, {bpmn}, {description}, TRUE, TRUE, NOW(), NOW())\n\
                 ON CONFLICT (name) DO UPDATE SET\n  \
                 entity_name      = EXCLUDED.entity_name,\n  \
                 operation        = EXCLUDED.operation,\n  \
                 trigger_type     = EXCLUDED.trigger_type,\n  \
                 bpmn_xml         = EXCLUDED.bpmn_xml,\n  \
                 description      = EXCLUDED.description,\n  \
                 is_model_managed = TRUE,\n  \
                 updated_at       = NOW();",
                name = sql_string(&workflow.name),
                entity = sql_string(&workflow.entity),
                operation = sql_string(&workflow.operation),
                trigger = sql_string(&workflow.trigger),
                bpmn = sql_string(&bpmn),
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    format!("{header}\n{statements}\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lang() -> Language {
        Language::load().expect("language definition")
    }

    fn step(
        id: &str,
        step_type: &str,
        label: Option<&str>,
        properties: &[(&str, &str)],
    ) -> SagaStepDeclaration {
        SagaStepDeclaration {
            id: id.to_string(),
            step_type: step_type.to_string(),
            label: label.map(str::to_string),
            properties: properties
                .iter()
                .map(|(key, value)| (key.to_string(), value.to_string()))
                .collect(),
        }
    }

    fn saga(name: &str, steps: Vec<SagaStepDeclaration>) -> SagaDeclaration {
        SagaDeclaration {
            name: name.to_string(),
            entity: "DeviationReport".to_string(),
            operation: None,
            trigger: None,
            description: None,
            steps,
        }
    }

    fn escalation() -> SagaDeclaration {
        SagaDeclaration {
            operation: Some("create".to_string()),
            trigger: Some("rule".to_string()),
            description: Some("Escalate a critical deviation into a CAPA.".to_string()),
            ..saga(
                "DeviationEscalation",
                vec![
                    step(
                        "B",
                        "Formula",
                        Some("Compute due days"),
                        &[
                            ("target", "dueDays"),
                            ("operation", "multiply"),
                            ("source", "baseDays"),
                            ("operand", "7"),
                        ],
                    ),
                    step(
                        "C",
                        "CreateEntity",
                        Some("Raise CAPA"),
                        &[
                            ("entity", "CAPA"),
                            ("as", "newCapaId"),
                            ("fields", r#"{"title":"Escalated","severity":"high"}"#),
                        ],
                    ),
                ],
            )
        }
    }

    #[test]
    fn compiles_a_saga_with_its_steps_in_the_order_listed() {
        let compiled = compile_saga_declarations(&[escalation()], &lang());
        assert_eq!(compiled.workflows.len(), 1);
        let saga = &compiled.workflows[0];
        assert_eq!(saga.name, "DeviationEscalation");
        assert_eq!(saga.entity, "DeviationReport");
        assert_eq!(saga.operation, "CREATE");
        assert_eq!(saga.trigger, "rule");
        assert_eq!(
            saga.description.as_deref(),
            Some("Escalate a critical deviation into a CAPA.")
        );
        assert_eq!(
            saga.steps
                .iter()
                .map(|s| s.node_id.as_str())
                .collect::<Vec<_>>(),
            ["B", "C"]
        );
        assert_eq!(saga.steps[0].label, "Compute due days");
        assert!(
            compiled.diagnostics.is_empty(),
            "{:?}",
            compiled.diagnostics
        );
    }

    #[test]
    fn a_step_with_no_label_is_named_by_its_id() {
        let compiled = compile_saga_declarations(
            &[saga(
                "s",
                vec![step(
                    "mark",
                    "UpdateEntity",
                    None,
                    &[("field", "status"), ("value", "done")],
                )],
            )],
            &lang(),
        );
        assert_eq!(compiled.workflows[0].steps[0].label, "mark");
    }

    #[test]
    fn an_unknown_step_type_is_reported_and_dropped() {
        let compiled = compile_saga_declarations(
            &[saga(
                "Broken",
                vec![step("B", "Teleport", None, &[("target", "mars")])],
            )],
            &lang(),
        );
        assert_eq!(compiled.workflows.len(), 1);
        assert!(compiled.workflows[0].steps.is_empty());
        assert!(compiled
            .diagnostics
            .iter()
            .any(|d| d.message.contains("unknown step type \"Teleport\"")));
        // And the empty process is called out too.
        assert!(compiled
            .diagnostics
            .iter()
            .any(|d| d.message.contains("has no steps")));
    }

    #[test]
    fn a_missing_required_property_is_reported() {
        let compiled = compile_saga_declarations(
            &[saga(
                "Partial",
                vec![step("B", "Formula", None, &[("target", "x")])],
            )],
            &lang(),
        );
        assert!(
            compiled
                .diagnostics
                .iter()
                .any(|d| d.message.contains("Formula is missing operation")),
            "{:?}",
            compiled.diagnostics
        );
    }

    #[test]
    fn a_step_id_declared_twice_keeps_the_first() {
        let compiled = compile_saga_declarations(
            &[saga(
                "Twice",
                vec![
                    step(
                        "B",
                        "UpdateEntity",
                        None,
                        &[("field", "status"), ("value", "a")],
                    ),
                    step(
                        "B",
                        "UpdateEntity",
                        None,
                        &[("field", "status"), ("value", "b")],
                    ),
                ],
            )],
            &lang(),
        );
        assert_eq!(compiled.workflows[0].steps.len(), 1);
        assert!(compiled
            .diagnostics
            .iter()
            .any(|d| d.message.contains("already has a step")));
    }

    #[test]
    fn bpmn_carries_a_diagram_and_the_step_properties() {
        let compiled = compile_saga_declarations(&[escalation()], &lang());
        let bpmn = build_saga_bpmn(&compiled.workflows[0]);

        // Without a BPMNDiagram bpmn-js refuses the import outright.
        assert!(bpmn.contains("<bpmndi:BPMNDiagram"));
        assert!(bpmn.contains("<bpmndi:BPMNShape"));
        assert!(bpmn.contains("<bpmndi:BPMNEdge"));

        assert!(bpmn.contains(r#"<appwithai:property name="nodeType" value="Formula"/>"#));
        assert!(bpmn.contains(r#"<appwithai:property name="operation" value="multiply"/>"#));
        // The JSON in `fields` has to survive as escaped XML.
        assert!(bpmn.contains("&quot;title&quot;:&quot;Escalated&quot;"));

        // Two steps: start, two tasks, end — and one flow between each pair.
        assert_eq!(bpmn.matches("<bpmn:serviceTask").count(), 2);
        assert_eq!(bpmn.matches("<bpmn:sequenceFlow").count(), 3);
    }

    #[test]
    fn a_model_with_no_sagas_still_gets_a_seed_file() {
        let sql = build_workflow_seed_sql(&[], "drug-discovery");
        assert!(sql.contains("-- The model declares no sagas."));
        assert!(!sql.contains("INSERT INTO"));
    }

    #[test]
    fn the_seed_upserts_by_name() {
        let compiled = compile_saga_declarations(&[escalation()], &lang());
        let sql = build_workflow_seed_sql(&compiled.workflows, "drug-discovery");
        assert!(sql.contains("ON CONFLICT (name) DO UPDATE SET"));
        assert!(sql.contains("'DeviationEscalation'"));
        assert!(sql.contains("is_model_managed = TRUE"));
    }

    #[test]
    fn a_saga_that_says_nothing_runs_automatically_on_create() {
        let compiled = compile_saga_declarations(
            &[saga(
                "Handoff",
                vec![step(
                    "A",
                    "UpdateEntity",
                    None,
                    &[("field", "status"), ("value", "handed_off")],
                )],
            )],
            &lang(),
        );
        assert_eq!(compiled.workflows[0].trigger, "automatic");
        assert_eq!(compiled.workflows[0].operation, "CREATE");
    }

    #[test]
    fn an_operation_alias_is_the_operation_the_runtime_matches() {
        assert_eq!(saga_operation(Some("INSERT")), "CREATE");
        assert_eq!(saga_operation(Some("edit")), "UPDATE");
        assert_eq!(saga_operation(Some("*")), "ALL");
        assert_eq!(saga_trigger(None), "automatic");
    }
}
