//! `%%workflow ... kind: state` — the Rust half of the state-machine compiler.
//!
//! A port of `packages/generator/src/workflows/state-machine.ts` and
//! `generators/tanstack-astryx-loco/transitions-seed.ts`.
//!
//! A state diagram in the model draws a lifecycle: which statuses exist, which
//! one a record starts in, and which changes are legitimate. The edges become
//! `sys_workflow_transitions` rows — what `authz::require_transition` refuses a
//! status write against, and what `GET /api/workflows/transitions` offers a
//! form so it can present only the moves that exist.
//!
//! Sagas are compiled separately, by `saga.rs`. The two are different things
//! sharing a directive: a saga is a sequence of steps to *run*, a state machine
//! is a set of moves to *permit*.

use crate::records::{StateMachineDeclaration, StateTransitionDeclaration};
use std::collections::HashMap;

use uuid::Uuid;

use crate::dictionary::{insert, now, text, Sql, NAMESPACE};
use crate::rbac::{RbacStateEdge, RbacStateMachine};
use crate::rules::extract_workflow_sections;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkflowState {
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkflowTransition {
    pub from: String,
    pub to: String,
    /// The event name on the edge, from `from --> to : trigger`.
    pub trigger: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledWorkflow {
    pub name: String,
    pub entity: String,
    /// Physical table the transitions are recorded against, e.g. `bus_deal`.
    pub table_name: String,
    pub states: Vec<WorkflowState>,
    pub transitions: Vec<WorkflowTransition>,
    /// The state a record starts in — the `[*] --> x` edge.
    pub initial: Option<String>,
    pub terminal: Vec<String>,
}

impl CompiledWorkflow {
    /// The shape `compile_rbac` reads, so a `%%rbac` directive naming a
    /// transition can resolve which edges it covers.
    pub fn as_state_machine(&self) -> RbacStateMachine {
        RbacStateMachine {
            entity: self.entity.clone(),
            transitions: self
                .transitions
                .iter()
                .map(|transition| RbacStateEdge {
                    from: transition.from.clone(),
                    to: transition.to.clone(),
                    trigger: transition.trigger.clone(),
                })
                .collect(),
        }
    }
}

const START_MARKER: &str = "[*]";

/// `from --> to : trigger`, with `[*]` legal at either end.
///
/// Mermaid's own state syntax, so the diagram renders in any Mermaid viewer and
/// the generator reads the same thing a reader sees. Hand-parsed rather than
/// pulling in a regex crate; the accepted shape is identical to the TypeScript
/// `^(\[\*\]|[A-Za-z_]\w*)\s*-->\s*(\[\*\]|[A-Za-z_]\w*)\s*(?::\s*(.+))?$`.
fn parse_transition(line: &str) -> Option<(String, String, Option<String>)> {
    let (from, rest) = take_state(line)?;
    let rest = rest.trim_start();
    let rest = rest.strip_prefix("-->")?;
    let rest = rest.trim_start();
    let (to, rest) = take_state(rest)?;

    let rest = rest.trim_start();
    let trigger = if rest.is_empty() {
        None
    } else {
        // Anything after the state that is not a `: label` fails the anchored
        // TypeScript pattern, so the line is not a transition at all.
        let label = rest.strip_prefix(':')?.trim();
        if label.is_empty() {
            return None;
        }
        Some(label.to_string())
    };

    Some((from, to, trigger))
}

/// `[*]` or an identifier, from the front of `value`.
fn take_state(value: &str) -> Option<(String, &str)> {
    if let Some(rest) = value.strip_prefix(START_MARKER) {
        return Some((START_MARKER.to_string(), rest));
    }
    let first = value.chars().next()?;
    if !(first.is_ascii_alphabetic() || first == '_') {
        return None;
    }
    let end = value
        .char_indices()
        .find(|(_, c)| !(c.is_ascii_alphanumeric() || *c == '_'))
        .map_or(value.len(), |(index, _)| index);
    Some((value[..end].to_string(), &value[end..]))
}

/// `Deal` → `bus_deal`, matching the ERD's table naming.
fn to_table_name(entity: &str) -> String {
    let chars: Vec<char> = entity.chars().collect();
    let mut snake = String::new();
    for (index, ch) in chars.iter().enumerate() {
        if ch.is_ascii_uppercase() && index > 0 {
            let prev = chars[index - 1];
            let next_lower = chars.get(index + 1).is_some_and(|c| c.is_ascii_lowercase());
            if prev.is_ascii_lowercase()
                || prev.is_ascii_digit()
                || (prev.is_ascii_uppercase() && next_lower)
            {
                snake.push('_');
            }
        }
        snake.push(ch.to_ascii_lowercase());
    }
    if snake.starts_with("bus_") || snake.starts_with("sys_") {
        snake
    } else {
        format!("bus_{snake}")
    }
}

/// Read the state machines a document declares.
#[cfg(test)]
pub fn compile_workflows(
    source: &str,
    known_entities: &[String],
    on_warn: impl FnMut(String),
) -> Vec<CompiledWorkflow> {
    compile_state_machine_declarations(&read_state_machines(source), known_entities, on_warn)
}

/// Read every `kind: state` section into a declaration, uncompiled. States are
/// listed in the order they first appear on a transition line; `[*] --> x`
/// names the starting state (the last such line wins) and `x --> [*]` a
/// terminal one.
pub fn read_state_machines(source: &str) -> Vec<StateMachineDeclaration> {
    let mut declarations = Vec::new();

    for section in extract_workflow_sections(source) {
        if section.kind != "state" {
            continue;
        }

        let mut states: Vec<String> = Vec::new();
        let mut transitions: Vec<StateTransitionDeclaration> = Vec::new();
        let mut terminal: Vec<String> = Vec::new();
        let mut initial: Option<String> = None;

        for raw_line in section.diagram.lines() {
            let line = raw_line.trim();
            if line.is_empty() || line.starts_with("%%") {
                continue;
            }
            let Some((from, to, trigger)) = parse_transition(line) else {
                continue;
            };

            for name in [&from, &to] {
                if name != START_MARKER && !states.contains(name) {
                    states.push(name.clone());
                }
            }

            // `[*] --> draft` names the starting state and `won --> [*]` a
            // terminal one. Neither is a move a caller can make, so neither
            // becomes an edge: recording `[*]` as a from-state would let a
            // request set any record straight back to its initial status.
            if from == START_MARKER {
                initial = Some(to);
                continue;
            }
            if to == START_MARKER {
                terminal.push(from);
                continue;
            }
            transitions.push(StateTransitionDeclaration { from, to, trigger });
        }

        declarations.push(StateMachineDeclaration {
            name: section.name,
            entity: section.entity,
            states,
            initial,
            r#final: terminal,
            transitions,
        });
    }

    declarations
}

/// Compile state machine declarations read from either syntax.
pub fn compile_state_machine_declarations(
    declarations: &[StateMachineDeclaration],
    known_entities: &[String],
    mut on_warn: impl FnMut(String),
) -> Vec<CompiledWorkflow> {
    let mut compiled = Vec::new();

    for declaration in declarations {
        if !known_entities.is_empty() && !known_entities.contains(&declaration.entity) {
            on_warn(format!(
                "Workflow \"{}\" targets unknown entity \"{}\" — skipped.",
                declaration.name, declaration.entity
            ));
            continue;
        }
        if declaration.states.is_empty() {
            on_warn(format!(
                "Workflow \"{}\" declares no states — skipped.",
                declaration.name
            ));
            continue;
        }
        if declaration.initial.is_none() {
            on_warn(format!(
                "Workflow \"{}\" has no starting state — records will not be stamped.",
                declaration.name
            ));
        }

        compiled.push(CompiledWorkflow {
            table_name: to_table_name(&declaration.entity),
            name: declaration.name.clone(),
            entity: declaration.entity.clone(),
            states: declaration
                .states
                .iter()
                .map(|name| WorkflowState { name: name.clone() })
                .collect(),
            transitions: declaration
                .transitions
                .iter()
                .map(|transition| WorkflowTransition {
                    from: transition.from.clone(),
                    to: transition.to.clone(),
                    trigger: transition.trigger.clone(),
                })
                .collect(),
            initial: declaration.initial.clone(),
            terminal: declaration.r#final.clone(),
        });
    }

    compiled
}

/// The column a machine drives.
///
/// `status` when the entity declares one; `workflow_status` otherwise — the
/// column `m0003_workflow_support` adds to every business table for this case.
/// Both the transitions seed and the access seed resolve it here, because a
/// rule naming a different column from the edge it guards is inert.
pub fn status_field_for(
    table_name: &str,
    columns_by_table: &HashMap<String, Vec<String>>,
) -> String {
    let has_status = columns_by_table
        .get(table_name)
        .is_some_and(|columns| columns.iter().any(|column| column == "status"));
    if has_status {
        "status"
    } else {
        "workflow_status"
    }
    .to_string()
}

pub struct TransitionsSeedOptions<'a> {
    pub project_name: &'a str,
    pub workflows: &'a [CompiledWorkflow],
    pub columns_by_table: &'a HashMap<String, Vec<String>>,
}

pub fn build_transitions_seed_sql(options: &TransitionsSeedOptions<'_>) -> String {
    let TransitionsSeedOptions {
        project_name,
        workflows,
        columns_by_table,
    } = *options;

    let id = |parts: &[&str]| -> String {
        let name = format!("{project_name}:transition:{}", parts.join(":"));
        Uuid::new_v5(&NAMESPACE, name.as_bytes()).to_string()
    };

    let mut out: Vec<String> = Vec::new();
    out.push(format!(
        "-- State-machine edges for {project_name}, compiled from the model's state machines."
    ));
    out.push("--".to_string());
    out.push(
        "-- Generated by @appwithai/generator — do not edit by hand; regenerate instead."
            .to_string(),
    );
    out.push(
        "-- Applied by `cargo loco task seed_workflows` and by `cargo loco db seed`.".to_string(),
    );
    out.push("--".to_string());
    out.push(
        "-- One row per edge the diagram draws. A status write with no matching row is".to_string(),
    );
    out.push(
        "-- refused for every caller, the master role included: an edge the diagram".to_string(),
    );
    out.push("-- never drew is a move that does not exist, not a permission an".to_string());
    out.push(
        "-- administrator lacks. A table with no rows here has no machine and nothing".to_string(),
    );
    out.push("-- is refused.".to_string());
    out.push("--".to_string());
    out.push(
        "-- `[*] --> x` and `x --> [*]` are deliberately absent. They name the initial".to_string(),
    );
    out.push(
        "-- and terminal states, not moves a caller may make; recording `[*]` as a".to_string(),
    );
    out.push(
        "-- from-state would let any request reset a record to its starting status.".to_string(),
    );

    let rows: Vec<(&CompiledWorkflow, &WorkflowTransition)> = workflows
        .iter()
        .flat_map(|workflow| {
            workflow
                .transitions
                .iter()
                .map(move |transition| (workflow, transition))
        })
        .collect();

    if rows.is_empty() {
        out.push("--".to_string());
        out.push(
            "-- This model declares no state machines, so every status column accepts any"
                .to_string(),
        );
        out.push(
            "-- value the dictionary allows. The file is still emitted: `seed_workflows.rs`"
                .to_string(),
        );
        out.push("-- embeds it with include_str!, which is resolved at compile time.".to_string());
        out.push(String::new());
        return out.join("\n");
    }

    for (workflow, transition) in rows {
        let status_field = status_field_for(&workflow.table_name, columns_by_table);
        out.push(String::new());
        out.push(format!(
            "-- {}: {} → {}{}",
            workflow.name,
            transition.from,
            transition.to,
            transition
                .trigger
                .as_ref()
                .map_or(String::new(), |trigger| format!(" ({trigger})"))
        ));
        out.push(insert(
            "sys_workflow_transitions",
            &[
                (
                    "sys_workflow_transition_id",
                    text(id(&[
                        &workflow.table_name,
                        &status_field,
                        &transition.from,
                        &transition.to,
                    ])),
                ),
                ("table_name", text(workflow.table_name.clone())),
                ("status_field", text(status_field)),
                ("from_state", text(transition.from.clone())),
                ("to_state", text(transition.to.clone())),
                // The event name is what a `%%rbac` transition rule matches on
                // and what a UI puts on the button. An unlabelled edge keeps
                // NULL rather than inventing a name nothing else would agree
                // with.
                (
                    "transition_name",
                    transition
                        .trigger
                        .as_ref()
                        .map_or(Sql::Null, |trigger| text(trigger.clone())),
                ),
                ("is_active", Sql::Bool(true)),
                ("created_at", now()),
            ],
        ));
    }

    out.push(String::new());
    out.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    const DIAGRAM: &str = "\
%%workflow DealLifecycle entity: Deal kind: state
stateDiagram-v2
    [*] --> qualification
    qualification --> proposal : qualify
    proposal --> won : close_won
    won --> [*]
";

    #[test]
    fn a_state_diagram_becomes_states_edges_and_endpoints() {
        let compiled = compile_workflows(DIAGRAM, &[], |_| {});
        assert_eq!(compiled.len(), 1);
        let machine = &compiled[0];
        assert_eq!(machine.table_name, "bus_deal");
        assert_eq!(machine.initial.as_deref(), Some("qualification"));
        assert_eq!(machine.terminal, vec!["won".to_string()]);
        // `[*] --> qualification` and `won --> [*]` are endpoints, not moves.
        assert_eq!(machine.transitions.len(), 2);
        assert_eq!(machine.transitions[0].trigger.as_deref(), Some("qualify"));
    }

    #[test]
    fn a_start_marker_never_becomes_an_edge() {
        let compiled = compile_workflows(DIAGRAM, &[], |_| {});
        assert!(
            compiled[0]
                .transitions
                .iter()
                .all(|t| t.from != "[*]" && t.to != "[*]"),
            "an edge from [*] would let any request reset a record to its initial status"
        );
    }

    #[test]
    fn an_unknown_entity_is_skipped_with_a_warning() {
        let mut warnings = Vec::new();
        let compiled = compile_workflows(DIAGRAM, &["Company".to_string()], |m| warnings.push(m));
        assert!(compiled.is_empty());
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("Deal"));
    }

    #[test]
    fn the_status_column_falls_back_when_the_entity_has_none() {
        let mut columns = HashMap::new();
        columns.insert("bus_deal".to_string(), vec!["status".to_string()]);
        columns.insert("bus_task".to_string(), vec!["title".to_string()]);
        assert_eq!(status_field_for("bus_deal", &columns), "status");
        assert_eq!(status_field_for("bus_task", &columns), "workflow_status");
        // A table the map does not know at all is the same case.
        assert_eq!(status_field_for("bus_ghost", &columns), "workflow_status");
    }

    #[test]
    fn the_machine_resolves_a_transition_named_by_an_rbac_directive() {
        let compiled = compile_workflows(DIAGRAM, &[], |_| {});
        let machines: Vec<RbacStateMachine> = compiled
            .iter()
            .map(CompiledWorkflow::as_state_machine)
            .collect();
        let rbac = crate::rbac::compile_rbac(
            "%%rbac role:manager on Deal.close_won",
            &[],
            &machines,
            |_| {},
        );
        assert_eq!(rbac.transitions.len(), 1);
        assert_eq!(rbac.transitions[0].edges.len(), 1);
        assert_eq!(rbac.transitions[0].edges[0].from, "proposal");
        assert_eq!(rbac.transitions[0].edges[0].to, "won");
    }

    #[test]
    fn a_model_with_no_machines_emits_only_the_header() {
        let sql = build_transitions_seed_sql(&TransitionsSeedOptions {
            project_name: "crm",
            workflows: &[],
            columns_by_table: &HashMap::new(),
        });
        assert!(!sql.contains("INSERT INTO"));
        assert!(sql.contains("declares no state machines"));
    }
}
