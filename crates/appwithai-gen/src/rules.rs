//! The model's `rules` — the Rust half of the rules compiler.
//!
//! A port of `packages/generator/src/rules/{jdm-converter,index}.ts` and
//! `generators/tanstack-astryx-loco/rules-seed.ts`.
//!
//! A rule is a decision graph, a list of actions, or a decision table authored
//! in the rule editor. It compiles to a GoRules JDM document — the same
//! representation the generated application's rules engine evaluates and its
//! admin editor edits — so a rule written in the model is the rule that runs.
//!
//! **The JSON has to match `JSON.stringify` byte for byte**, because the two
//! generators' `seed/rules.sql` files are diffed against each other. That
//! constrains this module in three ways: struct field order is the object key
//! order, every optional field is `skip_serializing_if` (JS omits `undefined`
//! rather than writing null), and `serde_json::to_string` is the only
//! serialiser used — `to_string_pretty` would add whitespace JS never emits.

use crate::records::{RuleAction, RuleDeclaration, RuleEdge, RuleNode};
use std::collections::BTreeMap;

use serde::Serialize;
use uuid::Uuid;

use crate::dictionary::{insert, now, text, Sql, NAMESPACE};

/* -------------------------------------------------------------------------- */
/*  JDM                                                                        */
/* -------------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize)]
pub struct JdmColumn {
    pub id: String,
    pub name: String,
    pub field: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JdmDecisionTable {
    pub hit_policy: String,
    pub inputs: Vec<JdmColumn>,
    pub outputs: Vec<JdmColumn>,
    /// `_id` plus one cell per column id.
    pub rules: Vec<JdmRow>,
}

/// One decision-table row: a JSON *object*, with its keys in the order the
/// table declares its columns.
///
/// A `Vec` of pairs rather than a map because the order is part of the output —
/// `serde_json::Map` is a `BTreeMap` unless the crate's `preserve_order`
/// feature is on, and turning that on to fix one struct would quietly reorder
/// every other map this generator emits.
#[derive(Debug, Clone)]
pub struct JdmRow(pub Vec<(String, String)>);

impl Serialize for JdmRow {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        use serde::ser::SerializeMap;
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for (key, value) in &self.0 {
            map.serialize_entry(key, value)?;
        }
        map.end()
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct JdmNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<JdmDecisionTable>,
}

#[derive(Debug, Clone, Serialize)]
pub struct JdmEdge {
    pub id: String,
    /// Omitted rather than null when the rule's edge carried no label —
    /// `JSON.stringify` drops an `undefined` property.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "sourceId")]
    pub source_id: String,
    #[serde(rename = "targetId")]
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct JdmGraph {
    pub nodes: Vec<JdmNode>,
    pub edges: Vec<JdmEdge>,
}

/// The JDM node a rule node type compiles to.
pub fn jdm_node_type(node_type: &str) -> Option<&'static str> {
    Some(match node_type {
        "start" => "inputNode",
        "end" => "outputNode",
        "decision" => "switchNode",
        "expression" => "expressionNode",
        "function" => "functionNode",
        _ => return None,
    })
}

/// A rule's decision graph as a JDM graph: one JDM node per rule node, in the
/// order declared, and one edge per edge, numbered from 1 — the TypeScript
/// generator's `ruleGraphToJdm`, byte for byte.
pub fn rule_graph_to_jdm(nodes: &[RuleNode], edges: &[RuleEdge]) -> Result<JdmGraph, String> {
    let nodes = nodes
        .iter()
        .map(|node| {
            let node_type = jdm_node_type(&node.node_type).ok_or_else(|| {
                format!("node {} has unknown type \"{}\"", node.id, node.node_type)
            })?;
            Ok(JdmNode {
                id: format!("node-{}", node.id),
                name: node.label.clone(),
                node_type: node_type.to_string(),
                content: None,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let edges = edges
        .iter()
        .enumerate()
        .map(|(index, edge)| JdmEdge {
            id: format!("edge-{}", index + 1),
            name: edge.label.clone(),
            source_id: format!("node-{}", edge.source),
            target_id: format!("node-{}", edge.target),
        })
        .collect();
    Ok(JdmGraph { nodes, edges })
}

/* -------------------------------------------------------------------------- */
/*  Actions                                                                    */
/* -------------------------------------------------------------------------- */

/// A side-effecting action a rule emits, from the rule's `actions`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRuleAction {
    pub name: String,
    pub action_type: String,
    /// Zen expression over the record; `true` fires on every write.
    pub when: String,
    pub props: BTreeMap<String, String>,
}

/// An action as the rules engine runs it: no condition means always.
fn with_default_condition(action: &RuleAction) -> CompiledRuleAction {
    CompiledRuleAction {
        name: action.name.clone(),
        action_type: action.action_type.clone(),
        when: action.when.clone().unwrap_or_else(|| "true".to_string()),
        props: action.props.clone(),
    }
}

/// Quote a value for a zen decision-table output cell.
fn zen_literal(value: &str) -> String {
    format!("'{}'", value.replace('\'', "\\'"))
}

/// A GoRules decision table, one row per action.
///
/// The node-graph form a rule's decision graph compiles to carries no outputs, so the
/// rules engine finds no actions in it and a model-declared rule can decide but
/// never act. A decision table is the shape the engine reads `action`,
/// `message`, `ruleId` and `workflowName` from.
///
/// The output columns are the fields `JdmViolation` deserialises in the
/// generated backend — `cascade-update` and `create-record` need structured
/// payloads and there was no column to carry them, so both could be declared
/// and would arrive empty.
///
/// The `action` cell is written in the *runtime's* vocabulary rather than
/// the model's; see `runtime_action`.
///
/// Every declared output column appears in every row, blank when the action
/// does not use it: zen-engine yields *no result at all* for a row with a
/// missing cell, so an omitted column silently disables the whole rule.
/// The model's action names, in the vocabulary the generated runtime reads.
///
/// The two are not the same list and never were. The model spells a refusal
/// `validation-error`; the Loco backend's `promotion.rs` looks for `prevent`,
/// and everything else — `trigger-workflow`, `cascade-update`, `create-record`
/// — it already spells the runtime's way. So a compiled `validation-error` row
/// matched, was handed to `run_action`, fell through to the `other` arm and was
/// logged as an unknown action: a rule written to refuse a write let every
/// write through.
fn runtime_action(eml_type: &str) -> &str {
    match eml_type {
        "validation-error" => "prevent",
        other => other,
    }
}

/// A transform's target, as the runtime wants it.
///
/// The model writes `field` and `value` as two separate properties; the runtime
/// reads one `transformData` object of column → value, which is the shape
/// `JdmViolation` already deserialises and `to_action_config` already forwards.
fn transform_data_cell(action: &CompiledRuleAction) -> String {
    let field = action.props.get("field").map_or("", String::as_str).trim();
    if action.action_type != "transform" || field.is_empty() {
        return zen_literal("");
    }
    let value = action.props.get("value").map_or("", String::as_str);
    let payload = serde_json::json!({ field: value });
    zen_literal(&payload.to_string())
}

pub fn build_action_decision_table(rule_name: &str, actions: &[CompiledRuleAction]) -> JdmGraph {
    let prop = |action: &CompiledRuleAction, key: &str| -> String {
        zen_literal(action.props.get(key).map_or("", String::as_str))
    };

    let rows: Vec<JdmRow> = actions
        .iter()
        .map(|action| {
            let message = action
                .props
                .get("message")
                .cloned()
                .unwrap_or_else(|| format!("{rule_name}: {}", action.name));
            JdmRow(vec![
                ("_id".to_string(), format!("{rule_name}-{}", action.name)),
                ("i1".to_string(), action.when.clone()),
                (
                    "o1".to_string(),
                    zen_literal(runtime_action(&action.action_type)),
                ),
                ("o2".to_string(), zen_literal(&message)),
                ("o3".to_string(), zen_literal(rule_name)),
                ("o4".to_string(), prop(action, "workflow")),
                ("o5".to_string(), prop(action, "targetEntity")),
                ("o6".to_string(), prop(action, "linkField")),
                // JSON objects, written as a string. `as_object()` in the
                // engine tolerates either, and a string is what fits in a cell.
                ("o7".to_string(), prop(action, "updateData")),
                ("o8".to_string(), prop(action, "createData")),
                ("o9".to_string(), transform_data_cell(action)),
            ])
        })
        .collect();

    let table_id = format!("{rule_name}-table");
    let column = |id: &str, name: &str, field: &str| JdmColumn {
        id: id.to_string(),
        name: name.to_string(),
        field: field.to_string(),
    };

    JdmGraph {
        nodes: vec![
            JdmNode {
                id: "input".to_string(),
                name: "Input".to_string(),
                node_type: "inputNode".to_string(),
                content: None,
            },
            JdmNode {
                id: table_id.clone(),
                name: rule_name.to_string(),
                node_type: "decisionTableNode".to_string(),
                content: Some(JdmDecisionTable {
                    // Several rows may match one write — a rule that escalates
                    // *and* stamps a field is ordinary.
                    hit_policy: "collect".to_string(),
                    inputs: vec![column("i1", "Record", "")],
                    outputs: vec![
                        column("o1", "Action", "action"),
                        column("o2", "Message", "message"),
                        column("o3", "Rule ID", "ruleId"),
                        column("o4", "Workflow Name", "workflowName"),
                        column("o5", "Target Entity", "targetEntity"),
                        column("o6", "Link Field", "linkField"),
                        column("o7", "Update Data", "updateData"),
                        column("o8", "Create Data", "createData"),
                        column("o9", "Transform Data", "transformData"),
                    ],
                    rules: rows,
                }),
            },
            JdmNode {
                id: "output".to_string(),
                name: "Output".to_string(),
                node_type: "outputNode".to_string(),
                content: None,
            },
        ],
        edges: vec![
            JdmEdge {
                id: "edge-1".to_string(),
                name: None,
                source_id: "input".to_string(),
                target_id: table_id.clone(),
            },
            JdmEdge {
                id: "edge-2".to_string(),
                name: None,
                source_id: table_id,
                target_id: "output".to_string(),
            },
        ],
    }
}

/* -------------------------------------------------------------------------- */
/*  Compilation                                                                */
/* -------------------------------------------------------------------------- */

/// A rule compiled from the model, ready to seed into `sys_rule_definitions`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRule {
    pub name: String,
    /// Table the rule is bound to, e.g. `bus_sample`.
    pub table_name: String,
    pub entity: String,
    pub event: String,
    /// CRUD operation the rules engine keys on.
    pub operation: String,
    pub priority: i64,
    /// The JDM decision graph, serialised.
    pub jdm_content: String,
}

/// Map a lifecycle event onto the operation the rules engine evaluates against.
pub fn event_to_operation(event: &str) -> &'static str {
    let normalized = event.to_lowercase();
    if normalized.contains("create") {
        "CREATE"
    } else if normalized.contains("update") {
        "UPDATE"
    } else if normalized.contains("delete") {
        "DELETE"
    } else {
        "ALL"
    }
}

/// `Sample` → `bus_sample`, matching the ERD's table naming.
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

/// Compile rule declarations read from either syntax.
///
/// What a rule compiles *from* follows one precedence: an editor-authored
/// decision table, then its actions, then its decision graph. A rule with no
/// table and no nodes compiles to nothing and is skipped.
pub fn compile_rule_declarations(
    declarations: &[RuleDeclaration],
    mut on_warn: impl FnMut(String),
) -> Vec<CompiledRule> {
    let mut compiled = Vec::new();

    for declaration in declarations {
        if declaration.entity.is_empty() {
            on_warn(format!(
                "Rule \"{}\" declares no entity; skipping.",
                declaration.name
            ));
            continue;
        }

        // A table authored in the editor carries its own directive and only a
        // placeholder graph, so it has to be read before the graph —
        // compiling the placeholder yields a rule that decides nothing.
        if declaration.decision_table.is_none() && declaration.nodes.is_empty() {
            on_warn(format!(
                "Rule \"{}\" has no nodes; skipping.",
                declaration.name
            ));
            continue;
        }

        // A rule that declares actions compiles to a decision table: that is
        // the only JDM shape the rules engine reads actions out of.
        let jdm = if let Some(table) = &declaration.decision_table {
            match build_editor_decision_table(&declaration.name, table) {
                Ok(jdm) => jdm,
                Err(message) => {
                    on_warn(format!(
                        "Rule \"{}\" could not be compiled: {message}",
                        declaration.name
                    ));
                    continue;
                }
            }
        } else if !declaration.actions.is_empty() {
            let actions: Vec<CompiledRuleAction> = declaration
                .actions
                .iter()
                .map(with_default_condition)
                .collect();
            build_action_decision_table(&declaration.name, &actions)
        } else {
            match rule_graph_to_jdm(&declaration.nodes, &declaration.edges) {
                Ok(jdm) => jdm,
                Err(message) => {
                    on_warn(format!(
                        "Rule \"{}\" could not be compiled: {message}",
                        declaration.name
                    ));
                    continue;
                }
            }
        };

        compiled.push(CompiledRule {
            name: declaration.name.clone(),
            entity: declaration.entity.clone(),
            table_name: to_table_name(&declaration.entity),
            event: declaration.event.clone(),
            operation: event_to_operation(&declaration.event).to_string(),
            priority: declaration.priority.unwrap_or(100),
            jdm_content: serialize_jdm(&jdm),
        });
    }

    compiled
}

/* -------------------------------------------------------------------------- */
/*  Decision tables authored in the editor                                     */
/* -------------------------------------------------------------------------- */

/// Whether JavaScript's `Number(value)` reads `value` as a number. `value` is
/// already trimmed and non-empty.
fn is_js_numeric(value: &str) -> bool {
    let unsigned = value.strip_prefix(['+', '-']).unwrap_or(value);
    if unsigned == "Infinity" {
        return true;
    }
    if value.len() == unsigned.len() {
        let radix = |prefix: &[&str], digits: fn(char) -> bool| {
            prefix
                .iter()
                .find_map(|p| value.strip_prefix(p))
                .is_some_and(|rest| !rest.is_empty() && rest.chars().all(digits))
        };
        if radix(&["0x", "0X"], |c| c.is_ascii_hexdigit())
            || radix(&["0o", "0O"], |c| ('0'..='7').contains(&c))
            || radix(&["0b", "0B"], |c| c == '0' || c == '1')
        {
            return true;
        }
    }
    let (mantissa, exponent) = match unsigned.find(['e', 'E']) {
        Some(at) => (&unsigned[..at], Some(&unsigned[at + 1..])),
        None => (unsigned, None),
    };
    let (whole, fraction) = mantissa.split_once('.').unwrap_or((mantissa, ""));
    let digits = |part: &str| part.chars().all(|c| c.is_ascii_digit());
    let mantissa_ok =
        digits(whole) && digits(fraction) && !(whole.is_empty() && fraction.is_empty());
    let exponent_ok = exponent.is_none_or(|exp| {
        let exp = exp.strip_prefix(['+', '-']).unwrap_or(exp);
        !exp.is_empty() && digits(exp)
    });
    mantissa_ok && exponent_ok
}

fn is_bare_literal(value: &str) -> bool {
    matches!(value, "true" | "false" | "null") || (!value.is_empty() && is_js_numeric(value))
}

fn is_quoted(value: &str) -> bool {
    let mut chars = value.chars();
    let first = chars.next();
    value.chars().count() >= 2
        && matches!(first, Some('\'') | Some('"'))
        && value.ends_with(first.unwrap_or(' '))
}

/// The editor stores what the user typed; zen evaluates expressions, so a bare
/// word becomes a string literal and a literal stays one.
fn zen_cell(raw: &str) -> String {
    let value = raw.trim();
    if value.is_empty() {
        return String::new();
    }
    if is_quoted(value) || is_bare_literal(value) {
        return value.to_string();
    }
    zen_literal(value)
}

/// Input cells may carry a leading comparison: `>= 70` stays a unary
/// comparison, `= hot` drops the operator (zen reads a bare value as equality).
fn zen_input_cell(raw: &str) -> String {
    let value = raw.trim();
    if value.is_empty() {
        return String::new();
    }
    let operator = [">=", "<=", "!=", "=", ">", "<"]
        .into_iter()
        .find(|operator| value.starts_with(operator));
    let Some(operator) = operator else {
        return zen_cell(value);
    };
    let cell = zen_cell(value[operator.len()..].trim_start());
    if cell.is_empty() {
        return String::new();
    }
    if operator == "=" {
        cell
    } else {
        format!("{operator} {cell}")
    }
}

/// A string field of an editor object: absent or null is `None`; anything but
/// a string is an error, as it is where the TypeScript compiler calls `.trim()`.
fn string_field(value: &serde_json::Value, key: &str) -> Result<Option<String>, String> {
    match value.get(key) {
        None | Some(serde_json::Value::Null) => Ok(None),
        Some(serde_json::Value::String(text)) => Ok(Some(text.clone())),
        Some(other) => Err(format!("{key} is {other}, not text")),
    }
}

/// JavaScript object key order: canonical array indexes first, ascending, then
/// every other key in insertion order; assigning an existing key keeps its
/// place. `JSON.stringify` writes a row's cells in this order.
fn js_object_insert(row: &mut Vec<(String, String)>, key: String, value: String) {
    if let Some(slot) = row.iter_mut().find(|(existing, _)| *existing == key) {
        slot.1 = value;
        return;
    }
    row.push((key, value));
}

fn js_object_order(row: Vec<(String, String)>) -> Vec<(String, String)> {
    let index = |key: &str| -> Option<u32> {
        let canonical =
            key == "0" || (!key.starts_with('0') && key.chars().all(|c| c.is_ascii_digit()));
        if !canonical {
            return None;
        }
        key.parse::<u32>().ok().filter(|n| *n < u32::MAX)
    };
    let (mut indexed, named): (Vec<_>, Vec<_>) =
        row.into_iter().partition(|(key, _)| index(key).is_some());
    indexed.sort_by_key(|(key, _)| index(key));
    indexed.extend(named);
    indexed
}

/// Compile the editor's table into the one JDM shape the rules engine reads:
/// input → decision table → output. Mirrors `buildEditorDecisionTable`.
fn build_editor_decision_table(
    rule_name: &str,
    table: &serde_json::Value,
) -> Result<JdmGraph, String> {
    let columns = |key: &str| -> Result<Vec<JdmColumn>, String> {
        let mut kept = Vec::new();
        let Some(list) = table.get(key).and_then(serde_json::Value::as_array) else {
            return Ok(kept);
        };
        for column in list {
            let field = string_field(column, "field")?.unwrap_or_default();
            if field.trim().is_empty() {
                continue;
            }
            let id = string_field(column, "id")?
                .ok_or_else(|| format!("a decision-table column in {key} has no id"))?;
            kept.push(JdmColumn {
                name: string_field(column, "name")?.unwrap_or_else(|| id.clone()),
                id,
                field,
            });
        }
        Ok(kept)
    };
    let inputs = columns("inputs")?;
    let outputs = columns("outputs")?;

    let mut rows = Vec::new();
    if let Some(list) = table.get("rules").and_then(serde_json::Value::as_array) {
        for (index, row) in list.iter().enumerate() {
            let id = match row.get("_id") {
                Some(serde_json::Value::String(text)) if !text.is_empty() => text.clone(),
                None
                | Some(serde_json::Value::Null)
                | Some(serde_json::Value::Bool(false))
                | Some(serde_json::Value::String(_)) => format!("{rule_name}-{}", index + 1),
                Some(serde_json::Value::Number(number)) if number.as_f64() == Some(0.0) => {
                    format!("{rule_name}-{}", index + 1)
                }
                Some(other) => return Err(format!("a decision-table row _id is {other}")),
            };
            let mut compiled: Vec<(String, String)> = Vec::new();
            js_object_insert(&mut compiled, "_id".to_string(), id);
            for column in &inputs {
                let raw = string_field(row, &column.id)?.unwrap_or_default();
                js_object_insert(&mut compiled, column.id.clone(), zen_input_cell(&raw));
            }
            for column in &outputs {
                let raw = string_field(row, &column.id)?.unwrap_or_default();
                js_object_insert(&mut compiled, column.id.clone(), zen_cell(&raw));
            }
            rows.push(JdmRow(js_object_order(compiled)));
        }
    }

    let hit_policy = match table.get("hitPolicy").and_then(serde_json::Value::as_str) {
        Some("collect") => "collect",
        _ => "first",
    };
    let table_id = format!("{rule_name}-table");

    Ok(JdmGraph {
        nodes: vec![
            JdmNode {
                id: "input".to_string(),
                name: "Input".to_string(),
                node_type: "inputNode".to_string(),
                content: None,
            },
            JdmNode {
                id: table_id.clone(),
                name: rule_name.to_string(),
                node_type: "decisionTableNode".to_string(),
                content: Some(JdmDecisionTable {
                    hit_policy: hit_policy.to_string(),
                    inputs,
                    outputs,
                    rules: rows,
                }),
            },
            JdmNode {
                id: "output".to_string(),
                name: "Output".to_string(),
                node_type: "outputNode".to_string(),
                content: None,
            },
        ],
        edges: vec![
            JdmEdge {
                id: "edge-1".to_string(),
                name: None,
                source_id: "input".to_string(),
                target_id: table_id.clone(),
            },
            JdmEdge {
                id: "edge-2".to_string(),
                name: None,
                source_id: table_id,
                target_id: "output".to_string(),
            },
        ],
    })
}

/// `JSON.stringify(jdm)` — compact, insertion-ordered, no trailing newline.
fn serialize_jdm(graph: &JdmGraph) -> String {
    serde_json::to_string(graph).unwrap_or_else(|_| "{}".to_string())
}

/* -------------------------------------------------------------------------- */
/*  Seed                                                                       */
/* -------------------------------------------------------------------------- */

/// The conditional conflict clause. See `rules-seed.ts` for why it is not a
/// plain `DO NOTHING`.
const CONFLICT: &str = "ON CONFLICT (entity_name, operation, rule_name) DO UPDATE\n\
     \x20 SET jdm_content = EXCLUDED.jdm_content,\n\
     \x20     version     = sys_rule_definitions.version + 1,\n\
     \x20     is_active   = TRUE,\n\
     \x20     updated_by  = EXCLUDED.updated_by,\n\
     \x20     updated_at  = NOW()\n\
     \x20 WHERE current_setting('appwithai.rules_overwrite', true) = 'on';";

pub struct RulesSeedOptions<'a> {
    pub project_name: &'a str,
    pub rules: &'a [CompiledRule],
    pub created_by: &'a str,
}

pub fn build_rules_seed_sql(options: &RulesSeedOptions<'_>) -> String {
    let RulesSeedOptions {
        project_name,
        rules,
        created_by,
    } = *options;

    let mut out: Vec<String> = Vec::new();
    out.push(format!(
        "-- Business rules for {project_name}, compiled from the model's rules."
    ));
    out.push("--".to_string());
    out.push(
        "-- Generated by @appwithai/generator — do not edit by hand; regenerate instead."
            .to_string(),
    );
    out.push("-- Applied by `cargo loco task seed_rules` and by `cargo loco db seed`.".to_string());
    out.push("--".to_string());
    out.push(
        "-- Each statement conflicts on (entity_name, operation, rule_name) and updates"
            .to_string(),
    );
    out.push(
        "-- only when `appwithai.rules_overwrite` is set to 'on' — which the seed task".to_string(),
    );
    out.push(
        "-- does not set and `POST /api/rules/migrate` does. Seeding therefore installs"
            .to_string(),
    );
    out.push("-- what is missing and leaves an administrator's edits alone; migrating".to_string());
    out.push("-- replaces them with the model's version.".to_string());

    if rules.is_empty() {
        out.push("--".to_string());
        out.push("-- This model declares no rules. The file is still emitted:".to_string());
        out.push(
            "-- `seed_rules.rs` embeds it with include_str!, which is resolved at".to_string(),
        );
        out.push("-- compile time, so a crate without it does not build.".to_string());
        out.push(String::new());
        return out.join("\n");
    }

    for rule in rules {
        out.push(String::new());
        out.push(format!(
            "-- {} — {}.{} (priority {})",
            rule.name, rule.entity, rule.event, rule.priority
        ));

        let id = Uuid::new_v5(
            &NAMESPACE,
            format!(
                "{project_name}:rule:{}:{}:{}",
                rule.table_name, rule.operation, rule.name
            )
            .as_bytes(),
        )
        .to_string();

        let statement = insert(
            "sys_rule_definitions",
            &[
                ("id", text(id)),
                // The physical table, not the ERD name: `load_entity_jdms`
                // binds `meta.table_name`, so an entity-named row never fires.
                ("entity_name", text(rule.table_name.clone())),
                ("rule_name", text(rule.name.clone())),
                ("operation", text(rule.operation.clone())),
                ("jdm_content", text(rule.jdm_content.clone())),
                ("version", Sql::Int(1)),
                ("is_active", Sql::Bool(true)),
                ("created_by", text(created_by)),
                ("updated_by", text(created_by)),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        );
        out.push(
            statement
                .strip_suffix("ON CONFLICT DO NOTHING;")
                .map_or(statement.clone(), |head| format!("{head}{CONFLICT}")),
        );
    }

    out.push(String::new());
    out.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn action(
        name: &str,
        action_type: &str,
        when: Option<&str>,
        props: &[(&str, &str)],
    ) -> RuleAction {
        RuleAction {
            name: name.to_string(),
            action_type: action_type.to_string(),
            when: when.map(str::to_string),
            props: props
                .iter()
                .map(|(key, value)| (key.to_string(), value.to_string()))
                .collect(),
        }
    }

    fn compiled_actions(actions: &[RuleAction]) -> Vec<CompiledRuleAction> {
        actions.iter().map(with_default_condition).collect()
    }

    fn node(id: &str, label: &str, node_type: &str) -> RuleNode {
        RuleNode {
            id: id.to_string(),
            label: label.to_string(),
            node_type: node_type.to_string(),
        }
    }

    fn edge(source: &str, target: &str, label: Option<&str>) -> RuleEdge {
        RuleEdge {
            source: source.to_string(),
            target: target.to_string(),
            label: label.map(str::to_string),
        }
    }

    fn rule(
        name: &str,
        event: &str,
        nodes: Vec<RuleNode>,
        edges: Vec<RuleEdge>,
        actions: Vec<RuleAction>,
    ) -> RuleDeclaration {
        RuleDeclaration {
            name: name.to_string(),
            entity: "Deal".to_string(),
            event: event.to_string(),
            priority: None,
            nodes,
            edges,
            actions,
            decision_table: None,
        }
    }

    /// One cell of a compiled row, by column id.
    fn cell(row: &JdmRow, id: &str) -> String {
        row.0
            .iter()
            .find(|(key, _)| key == id)
            .map(|(_, value)| value.clone())
            .unwrap_or_default()
    }

    /// The compiled row is asserted against the *runtime's* action union,
    /// never against this compiler's own output.
    ///
    /// The model language and the generated Loco backend do not share an
    /// action vocabulary, and two of the three types the language ships were
    /// inert because of it. `validation-error` is the model's word for a
    /// refusal; `promotion.rs` looks for `prevent`, so a compiled
    /// `validation-error` row matched, fell through `run_action`'s `other` arm
    /// and was logged as unknown — a rule written to refuse a write let every
    /// write through. And `transform` had no payload column, so
    /// `JdmViolation.transform_data` arrived empty.
    #[test]
    fn an_action_row_is_written_in_the_runtimes_vocabulary() {
        let actions = compiled_actions(&[
            action(
                "refuseDiscount",
                "validation-error",
                Some("discount_percent > 40"),
                &[("message", "Reprice it")],
            ),
            action(
                "stampTier",
                "transform",
                Some("amount > 50000"),
                &[("field", "tier"), ("value", "strategic")],
            ),
            action(
                "escalate",
                "trigger-workflow",
                Some("amount > 1000"),
                &[("workflow", "Approval")],
            ),
        ]);
        let table = build_action_decision_table("quoteDiscountApproval", &actions);
        let content = table.nodes[1].content.as_ref().expect("decision table");

        // The literal strings `services/promotion.rs` matches on.
        let runtime = [
            "prevent",
            "transform",
            "trigger-workflow",
            "cascade-update",
            "create-record",
        ];
        for row in &content.rules {
            let emitted = cell(row, "o1").trim_matches('\'').to_string();
            assert!(
                runtime.contains(&emitted.as_str()),
                "{emitted} is not a runtime action"
            );
        }
        assert_eq!(cell(&content.rules[0], "o1"), "'prevent'");
        assert_eq!(cell(&content.rules[2], "o1"), "'trigger-workflow'");
    }

    /// A transform's `field` and `value` fold into the one object the runtime
    /// reads, and nothing else carries one.
    #[test]
    fn a_transform_carries_its_payload_and_nothing_else_does() {
        let actions = compiled_actions(&[
            action(
                "stampTier",
                "transform",
                Some("amount > 50000"),
                &[("field", "tier"), ("value", "strategic")],
            ),
            action(
                "escalate",
                "trigger-workflow",
                Some("amount > 1000"),
                &[("workflow", "Approval")],
            ),
        ]);
        let table = build_action_decision_table("r", &actions);
        let content = table.nodes[1].content.as_ref().expect("decision table");

        assert_eq!(cell(&content.rules[0], "o9"), "'{\"tier\":\"strategic\"}'");
        assert_eq!(cell(&content.rules[1], "o9"), "''");

        // zen-engine yields no result at all for a row with a missing cell, so
        // every declared column has to appear on every row.
        for row in &content.rules {
            for column in &content.outputs {
                assert!(
                    row.0.iter().any(|(key, _)| key == &column.id),
                    "row is missing {}",
                    column.id
                );
            }
        }
    }

    #[test]
    fn every_node_type_maps_to_its_jdm_type() {
        let nodes = vec![
            node("A", "In", "start"),
            node("B", "Check", "decision"),
            node("C", "Fn", "function"),
            node("D", "Expr", "expression"),
            node("E", "Out", "end"),
        ];
        let jdm = rule_graph_to_jdm(&nodes, &[]).expect("known types");
        let types: Vec<&str> = jdm.nodes.iter().map(|n| n.node_type.as_str()).collect();
        assert_eq!(
            types,
            vec![
                "inputNode",
                "switchNode",
                "functionNode",
                "expressionNode",
                "outputNode"
            ]
        );
        assert_eq!(jdm.nodes[1].id, "node-B");
    }

    #[test]
    fn an_unknown_node_type_is_refused_rather_than_guessed() {
        assert!(rule_graph_to_jdm(&[node("A", "In", "stadium")], &[]).is_err());
    }

    #[test]
    fn an_edge_label_becomes_the_jdm_edge_name_and_absence_omits_it() {
        let nodes = vec![
            node("A", "a", "start"),
            node("B", "b", "decision"),
            node("C", "c", "end"),
        ];
        let edges = vec![edge("A", "B", None), edge("B", "C", Some("yes"))];
        let json = serialize_jdm(&rule_graph_to_jdm(&nodes, &edges).unwrap());
        assert!(json.contains(r#""name":"yes""#), "{json}");
        assert!(json.contains(r#""id":"edge-2""#), "{json}");
        // `JSON.stringify` drops an undefined property rather than writing null.
        assert!(!json.contains("null"), "{json}");
    }

    #[test]
    fn a_rule_with_actions_compiles_to_a_decision_table() {
        let compiled = compile_rule_declarations(
            &[rule(
                "escalate",
                "afterUpdate",
                vec![node("A", "Deal", "start"), node("B", "Done", "end")],
                vec![edge("A", "B", None)],
                vec![action(
                    "notify",
                    "trigger-workflow",
                    Some("amount > 10000"),
                    &[("workflow", "BigDeal"), ("message", "Big deal")],
                )],
            )],
            |_| {},
        );
        assert_eq!(compiled.len(), 1);
        assert_eq!(compiled[0].table_name, "bus_deal");
        assert_eq!(compiled[0].operation, "UPDATE");
        let json = &compiled[0].jdm_content;
        assert!(json.contains("decisionTableNode"), "{json}");
        assert!(json.contains(r#""i1":"amount > 10000""#), "{json}");
        assert!(json.contains("'trigger-workflow'"), "{json}");
        assert!(json.contains("'Big deal'"), "{json}");
    }

    #[test]
    fn an_action_with_no_when_fires_on_every_write() {
        let actions = compiled_actions(&[action(
            "block",
            "prevent",
            None,
            &[("message", "A closed deal cannot change")],
        )]);
        assert_eq!(actions[0].when, "true");
        assert_eq!(actions[0].action_type, "prevent");
        assert_eq!(actions[0].props["message"], "A closed deal cannot change");
    }

    #[test]
    fn an_event_maps_onto_the_operation_the_engine_keys_on() {
        assert_eq!(event_to_operation("beforeCreate"), "CREATE");
        assert_eq!(event_to_operation("afterUpdate"), "UPDATE");
        assert_eq!(event_to_operation("beforeDelete"), "DELETE");
        assert_eq!(event_to_operation("onSomethingElse"), "ALL");
    }

    #[test]
    fn a_model_with_no_rules_emits_only_the_header() {
        let sql = build_rules_seed_sql(&RulesSeedOptions {
            project_name: "crm",
            rules: &[],
            created_by: "system",
        });
        assert!(!sql.contains("INSERT INTO"));
        assert!(sql.contains("declares no rules"));
    }

    #[test]
    fn the_seed_upserts_only_when_the_setting_is_on() {
        let compiled = compile_rule_declarations(
            &[rule(
                "r",
                "beforeCreate",
                vec![node("A", "In", "start"), node("B", "Out", "end")],
                vec![edge("A", "B", None)],
                vec![],
            )],
            |_| {},
        );
        let sql = build_rules_seed_sql(&RulesSeedOptions {
            project_name: "crm",
            rules: &compiled,
            created_by: "system",
        });
        assert!(sql.contains("ON CONFLICT (entity_name, operation, rule_name) DO UPDATE"));
        assert!(sql.contains("current_setting('appwithai.rules_overwrite', true) = 'on'"));
    }
}
