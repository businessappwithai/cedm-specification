//! `%%rule` sections — the Rust half of the rules compiler.
//!
//! A port of `language/composer.ts` (the extraction half),
//! `packages/generator/src/rules/{flowchart-parser,jdm-converter,index}.ts` and
//! `generators/tanstack-astryx-loco/rules-seed.ts`.
//!
//! A `%%rule` section is a decision flowchart. It compiles to a GoRules JDM
//! document — the same representation the generated application's rules engine
//! evaluates and its admin editor edits — so a rule drawn in the design phase
//! is the rule that runs.
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
/*  Section extraction — the composer's half                                   */
/* -------------------------------------------------------------------------- */

const RULE_LEAD: &str = "%%rule ";
const WORKFLOW_LEAD: &str = "%%workflow ";

/// One `%%rule` section: the directive's fields plus the flowchart body.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmlRuleSection {
    pub name: String,
    pub entity: String,
    pub event: String,
    pub priority: Option<i64>,
    pub title: Option<String>,
    pub flowchart: String,
}

/// Trim trailing whitespace per line and collapse leading/trailing blank lines.
fn tidy(block: &str) -> String {
    let lines: Vec<&str> = block.lines().map(str::trim_end).collect();
    let start = lines.iter().position(|line| !line.is_empty());
    let end = lines.iter().rposition(|line| !line.is_empty());
    match (start, end) {
        (Some(start), Some(end)) => lines[start..=end].join("\n"),
        _ => String::new(),
    }
}

struct RawSection {
    directive: String,
    title: Option<String>,
    body: String,
}

/// Read the sections a document declares, for one directive lead.
///
/// A banner rule separates sections and is decoration, never part of a body —
/// letting one through made extraction non-idempotent, because the banner ended
/// up inside the preceding flowchart and was re-emitted alongside a fresh one,
/// so every save grew the document.
fn extract_sections(source: &str, lead: &str) -> Vec<RawSection> {
    let mut found: Vec<RawSection> = Vec::new();
    let mut current: Option<(String, Option<String>, Vec<String>)> = None;
    let mut pending_title: Option<String> = None;

    fn close(
        current: &mut Option<(String, Option<String>, Vec<String>)>,
        found: &mut Vec<RawSection>,
    ) {
        if let Some((directive, title, body)) = current.take() {
            let body = tidy(&body.join("\n"));
            if !body.is_empty() {
                found.push(RawSection {
                    directive,
                    title,
                    body,
                });
            }
        }
    }

    for line in source.lines() {
        let trimmed = line.trim();

        // `%% ====` — a banner rule.
        if is_banner_rule(trimmed) {
            close(&mut current, &mut found);
            continue;
        }

        // `%%meta name:` opens the *next* section's header, so it closes this one.
        if let Some(rest) = trimmed.strip_prefix("%%meta") {
            let rest = rest.trim_start();
            if let Some(name) = rest.strip_prefix("name:") {
                close(&mut current, &mut found);
                let name = name.trim();
                pending_title = if name.is_empty() {
                    None
                } else {
                    Some(name.to_string())
                };
            }
            // Other `%%meta` keys belong to a header, not to a body.
            continue;
        }

        if let Some(rest) = trimmed.strip_prefix(lead) {
            close(&mut current, &mut found);
            current = Some((rest.trim().to_string(), pending_title.take(), Vec::new()));
            continue;
        }

        // Another section's directive ends this one.
        if trimmed.starts_with(RULE_LEAD) || trimmed.starts_with(WORKFLOW_LEAD) {
            close(&mut current, &mut found);
            continue;
        }

        if let Some((_, _, body)) = current.as_mut() {
            body.push(line.to_string());
        }
    }

    close(&mut current, &mut found);
    found
}

/// `%% ===============` on a line of its own.
fn is_banner_rule(trimmed: &str) -> bool {
    let Some(rest) = trimmed.strip_prefix("%%") else {
        return false;
    };
    let rest = rest.trim();
    !rest.is_empty() && rest.chars().all(|c| c == '=')
}

/// Read the rule sections a document declares.
pub fn extract_rule_sections(source: &str) -> Vec<EmlRuleSection> {
    extract_sections(source, RULE_LEAD)
        .into_iter()
        .map(|section| {
            let parsed = parse_rule_directive(&section.directive);
            EmlRuleSection {
                name: parsed.0,
                entity: parsed.1,
                event: parsed.2,
                priority: parsed.3,
                title: section.title,
                flowchart: section.body,
            }
        })
        .collect()
}

/// One `%%workflow` section: the directive's fields plus the diagram body.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmlWorkflowSection {
    pub name: String,
    pub entity: String,
    /// `hook`, `state` or `saga`. Anything unrecognised reads as `hook`,
    /// matching the TypeScript.
    pub kind: String,
    pub title: Option<String>,
    pub diagram: String,
}

/// Read the workflow sections a document declares.
///
/// Shares `extract_sections` with the rules, because the two directives divide
/// the same document and a section boundary one of them recognised and the
/// other did not would give the two readers different bodies.
pub fn extract_workflow_sections(source: &str) -> Vec<EmlWorkflowSection> {
    extract_sections(source, WORKFLOW_LEAD)
        .into_iter()
        .map(|section| {
            let (name, entity, kind) = parse_workflow_directive(&section.directive);
            EmlWorkflowSection {
                name,
                entity,
                kind,
                title: section.title,
                diagram: section.body,
            }
        })
        .collect()
}

/// `<name> entity: <Entity> kind: <kind> [...]`
fn parse_workflow_directive(directive: &str) -> (String, String, String) {
    let fallback = ("workflow".to_string(), String::new(), "hook".to_string());
    let tokens: Vec<&str> = directive.split_whitespace().collect();
    let Some(name) = tokens.first() else {
        return fallback;
    };

    let value_after = |key: &str| -> Option<String> {
        let mut index = 1;
        while index < tokens.len() {
            if let Some(value) = tokens[index].strip_prefix(key) {
                if value.is_empty() {
                    return tokens.get(index + 1).map(|value| (*value).to_string());
                }
                return Some(value.to_string());
            }
            index += 1;
        }
        None
    };

    let (Some(entity), Some(kind)) = (value_after("entity:"), value_after("kind:")) else {
        return fallback;
    };
    let kind = if kind == "state" || kind == "saga" {
        kind
    } else {
        "hook".to_string()
    };
    ((*name).to_string(), entity, kind)
}

/// `<name> on <Entity> event: <event> [priority: <n>]`
///
/// The TypeScript regex is
/// `^(\S+)\s+on\s+(\S+)\s+event:\s*(\S+)(?:\s+priority:\s*(-?\d+))?` and falls
/// back to `"rule"` / `""` / `"beforeCreate"` when it does not match, so a
/// malformed directive still produces a section the checker can report on
/// rather than one that vanishes.
fn parse_rule_directive(directive: &str) -> (String, String, String, Option<i64>) {
    let fallback = (
        "rule".to_string(),
        String::new(),
        "beforeCreate".to_string(),
        None,
    );

    let tokens: Vec<&str> = directive.split_whitespace().collect();
    let (Some(name), Some(on)) = (tokens.first(), tokens.get(1)) else {
        return fallback;
    };
    if *on != "on" {
        return fallback;
    }
    let Some(entity) = tokens.get(2) else {
        return fallback;
    };

    // `event:` may be its own token or glued to its value (`event:beforeCreate`
    // does not match the TypeScript regex, which requires `event:` followed by
    // optional whitespace then a non-space run — so `event:beforeCreate` DOES
    // match it, with the value in the same token).
    let mut event: Option<String> = None;
    let mut priority: Option<i64> = None;
    let mut index = 3;
    while index < tokens.len() {
        let token = tokens[index];
        if let Some(value) = token.strip_prefix("event:") {
            if value.is_empty() {
                event = tokens.get(index + 1).map(|value| (*value).to_string());
                index += 2;
            } else {
                event = Some(value.to_string());
                index += 1;
            }
            continue;
        }
        if let Some(value) = token.strip_prefix("priority:") {
            let raw = if value.is_empty() {
                let next = tokens.get(index + 1).copied().unwrap_or_default();
                index += 2;
                next
            } else {
                index += 1;
                value
            };
            priority = raw.parse::<i64>().ok();
            continue;
        }
        index += 1;
    }

    let Some(event) = event else {
        return fallback;
    };
    ((*name).to_string(), (*entity).to_string(), event, priority)
}

/* -------------------------------------------------------------------------- */
/*  Flowchart parser                                                           */
/* -------------------------------------------------------------------------- */

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NodeShape {
    Stadium,
    Diamond,
    Rect,
    Circle,
    Round,
}

impl NodeShape {
    /// The shape's name in the model records and the YAML model language.
    pub fn as_str(self) -> &'static str {
        match self {
            NodeShape::Stadium => "stadium",
            NodeShape::Diamond => "diamond",
            NodeShape::Rect => "rect",
            NodeShape::Circle => "circle",
            NodeShape::Round => "round",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        Some(match name {
            "stadium" => NodeShape::Stadium,
            "diamond" => NodeShape::Diamond,
            "rect" => NodeShape::Rect,
            "circle" => NodeShape::Circle,
            "round" => NodeShape::Round,
            _ => return None,
        })
    }
}

#[derive(Debug, Clone)]
pub struct FlowNode {
    pub id: String,
    pub label: String,
    pub shape: NodeShape,
}

#[derive(Debug, Clone)]
pub struct FlowEdge {
    pub source: String,
    pub target: String,
    pub label: Option<String>,
}

/// Insertion-ordered, because `convert_to_jdm` iterates the node map and the
/// JSON it produces is diffed against the JavaScript `Map`'s own order.
#[derive(Debug, Default)]
pub struct FlowAst {
    pub node_order: Vec<String>,
    pub nodes: BTreeMap<String, FlowNode>,
    pub edges: Vec<FlowEdge>,
}

impl FlowAst {
    fn insert_node(&mut self, node: FlowNode) {
        if !self.nodes.contains_key(&node.id) {
            self.node_order.push(node.id.clone());
        }
        self.nodes.insert(node.id.clone(), node);
    }

    fn iter(&self) -> impl Iterator<Item = &FlowNode> {
        self.node_order
            .iter()
            .filter_map(move |id| self.nodes.get(id))
    }
}

/// The shape suffix after a node id, and the label inside it.
///
/// Longest forms first: `((circle))` and `([stadium])` both start with `(`, so
/// a bare `(...)` tried earlier would claim only their opening half and
/// mis-shape the node.
fn parse_node_def(id: &str, rest: &str) -> Option<FlowNode> {
    const FORMS: [(&str, &str, NodeShape); 5] = [
        ("([", "])", NodeShape::Stadium),
        ("((", "))", NodeShape::Circle),
        ("{", "}", NodeShape::Diamond),
        ("[", "]", NodeShape::Rect),
        ("(", ")", NodeShape::Round),
    ];

    for (open, close, shape) in FORMS {
        let Some(after) = rest.strip_prefix(open) else {
            continue;
        };
        // The TypeScript regexes are non-greedy: the label runs to the *first*
        // closing delimiter.
        let Some(end) = after.find(close) else {
            continue;
        };
        let label = after[..end].trim();
        if label.is_empty() {
            continue;
        }
        return Some(FlowNode {
            id: id.to_string(),
            label: label.to_string(),
            shape,
        });
    }
    None
}

fn is_ident_start(c: char) -> bool {
    c.is_ascii_alphabetic() || c == '_'
}

fn is_ident_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// Take an identifier from the front of `text`, returning it and the rest.
fn take_ident(value: &str) -> Option<(&str, &str)> {
    let mut chars = value.char_indices();
    let (_, first) = chars.next()?;
    if !is_ident_start(first) {
        return None;
    }
    let end = value
        .char_indices()
        .find(|(_, c)| !is_ident_char(*c))
        .map_or(value.len(), |(index, _)| index);
    Some((&value[..end], &value[end..]))
}

/// Take a node's shape suffix from the front, returning it and the rest.
fn take_suffix(value: &str) -> (Option<&str>, &str) {
    const FORMS: [(&str, &str); 5] = [
        ("((", "))"),
        ("([", "])"),
        ("{", "}"),
        ("[", "]"),
        ("(", ")"),
    ];
    for (open, close) in FORMS {
        if !value.starts_with(open) {
            continue;
        }
        // `[^)]*` and friends: the suffix runs to the first closing delimiter.
        let after = &value[open.len()..];
        if let Some(end) = after.find(close) {
            let total = open.len() + end + close.len();
            return (Some(&value[..total]), &value[total..]);
        }
    }
    (None, value)
}

fn ensure_node(ast: &mut FlowAst, id: &str, suffix: Option<&str>) {
    if ast.nodes.contains_key(id) {
        return;
    }
    if let Some(suffix) = suffix {
        if let Some(node) = parse_node_def(id, suffix) {
            ast.insert_node(node);
            return;
        }
    }
    ast.insert_node(FlowNode {
        id: id.to_string(),
        label: id.to_string(),
        shape: NodeShape::Rect,
    });
}

/// One parsed edge line: the two node ids, their shape suffixes, and the label.
struct ParsedEdge {
    source: String,
    source_suffix: Option<String>,
    label: Option<String>,
    target: String,
    target_suffix: Option<String>,
}

/// `Src[suffix] --> |label| Tgt[suffix]`
///
/// The edge label is recognised only when it is actually delimited by pipes.
/// Written as an optional unanchored group the TypeScript version matched the
/// empty-pipe case by greedily consuming the target node and backtracking, so
/// `A --> B{Status == draft?}` produced a node id of `t` — the tail of `draft`.
fn parse_edge(line: &str) -> Option<ParsedEdge> {
    let (source, rest) = take_ident(line)?;
    let (source_suffix, rest) = take_suffix(rest);
    let rest = rest.trim_start();

    let rest = rest
        .strip_prefix("-->")
        .or_else(|| rest.strip_prefix("---"))?;
    let rest = rest.trim_start();

    let (label, rest) = match rest.strip_prefix('|') {
        Some(after) => match after.find('|') {
            Some(end) => (Some(after[..end].to_string()), &after[end + 1..]),
            None => (None, rest),
        },
        None => (None, rest),
    };
    let rest = rest.trim_start();

    let (target, rest) = take_ident(rest)?;
    let (target_suffix, _) = take_suffix(rest);

    Some(ParsedEdge {
        source: source.to_string(),
        source_suffix: source_suffix.map(str::to_string),
        label,
        target: target.to_string(),
        target_suffix: target_suffix.map(str::to_string),
    })
}

pub fn parse_mermaid_flowchart(code: &str) -> FlowAst {
    let mut ast = FlowAst::default();

    for raw_line in code.lines() {
        let line = raw_line.trim();
        if line.is_empty()
            || line.starts_with("flowchart")
            || line.starts_with("graph")
            || line.starts_with("%%")
        {
            continue;
        }

        if let Some(edge) = parse_edge(line) {
            ensure_node(&mut ast, &edge.source, edge.source_suffix.as_deref());
            ensure_node(&mut ast, &edge.target, edge.target_suffix.as_deref());
            ast.edges.push(FlowEdge {
                source: edge.source,
                target: edge.target,
                label: edge
                    .label
                    .map(|label| label.trim().to_string())
                    .filter(|label| !label.is_empty()),
            });
            continue;
        }

        // A standalone node definition.
        if let Some((id, rest)) = take_ident(line) {
            let rest = rest.trim();
            if !rest.is_empty() && !ast.nodes.contains_key(id) {
                if let Some(node) = parse_node_def(id, rest) {
                    ast.insert_node(node);
                }
            }
        }
    }

    ast
}

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
    /// Omitted rather than null when the flowchart edge carried no label —
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

fn shape_to_type(shape: NodeShape, is_target: bool, is_source: bool) -> &'static str {
    match shape {
        NodeShape::Stadium => {
            if is_target && !is_source {
                "outputNode"
            } else {
                "inputNode"
            }
        }
        NodeShape::Diamond => "switchNode",
        NodeShape::Circle => "functionNode",
        _ => "expressionNode",
    }
}

pub fn convert_to_jdm(ast: &FlowAst) -> JdmGraph {
    let sources: Vec<&str> = ast.edges.iter().map(|edge| edge.source.as_str()).collect();
    let targets: Vec<&str> = ast.edges.iter().map(|edge| edge.target.as_str()).collect();

    let nodes = ast
        .iter()
        .map(|node| JdmNode {
            id: format!("node-{}", node.id),
            name: node.label.clone(),
            node_type: shape_to_type(
                node.shape,
                targets.contains(&node.id.as_str()),
                sources.contains(&node.id.as_str()),
            )
            .to_string(),
            content: None,
        })
        .collect();

    let edges = ast
        .edges
        .iter()
        .enumerate()
        .map(|(index, edge)| JdmEdge {
            id: format!("edge-{}", index + 1),
            name: edge.label.clone(),
            source_id: format!("node-{}", edge.source),
            target_id: format!("node-{}", edge.target),
        })
        .collect();

    JdmGraph { nodes, edges }
}

/* -------------------------------------------------------------------------- */
/*  `%%action` directives                                                      */
/* -------------------------------------------------------------------------- */

/// A side-effecting action a rule emits, declared by a `%%action` directive.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRuleAction {
    pub name: String,
    pub action_type: String,
    /// Zen expression over the record; `true` fires on every write.
    pub when: String,
    pub props: BTreeMap<String, String>,
}

/// `key:` starts a new property; the value runs to the next one.
fn parse_action_props(rest: &str) -> BTreeMap<String, String> {
    let mut props = BTreeMap::new();
    let trimmed = rest.trim();
    if trimmed.is_empty() {
        return props;
    }

    // The TypeScript splits on whitespace followed by `key:`. Walk the string
    // and cut at each such boundary rather than pulling in a regex crate.
    let bytes: Vec<char> = trimmed.chars().collect();
    let mut starts: Vec<usize> = vec![0];
    for index in 1..bytes.len() {
        if !bytes[index - 1].is_whitespace() {
            continue;
        }
        if !is_ident_start(bytes[index]) {
            continue;
        }
        let mut cursor = index;
        while cursor < bytes.len() && is_ident_char(bytes[cursor]) {
            cursor += 1;
        }
        if cursor < bytes.len() && bytes[cursor] == ':' {
            starts.push(index);
        }
    }
    starts.push(bytes.len());

    for window in starts.windows(2) {
        let chunk: String = bytes[window[0]..window[1]].iter().collect();
        let chunk = chunk.trim();
        let Some(at) = chunk.find(':') else { continue };
        if at == 0 {
            continue;
        }
        let key = chunk[..at].trim();
        if !key.is_empty() {
            props.insert(key.to_string(), chunk[at + 1..].trim().to_string());
        }
    }
    props
}

/// `%%action <name> <type> when: <expr> <key>: <value> ...`, compiled: an
/// action with no `when:` fires on every write.
#[cfg(test)]
pub fn parse_rule_actions(flowchart: &str) -> Vec<CompiledRuleAction> {
    read_rule_actions(flowchart)
        .iter()
        .map(with_default_condition)
        .collect()
}

/// Read a rule body's `%%action` lines as written: an action that states no
/// `when:` keeps none, so "always" said outright and "always" by omission —
/// which the checker tells apart (EML282) — survive reading.
pub fn read_rule_actions(flowchart: &str) -> Vec<RuleAction> {
    let mut actions = Vec::new();
    for raw_line in flowchart.lines() {
        let line = raw_line.trim();
        let Some(rest) = line.strip_prefix("%%action") else {
            continue;
        };
        if !rest.starts_with(char::is_whitespace) {
            continue;
        }
        let rest = rest.trim_start();

        let Some((name, rest)) = take_ident_with_dashes(rest) else {
            continue;
        };
        let rest = rest.trim_start();
        let Some((action_type, rest)) = take_ident_with_dashes(rest) else {
            continue;
        };
        // The TypeScript type pattern is `[A-Za-z][\w-]*`, so a leading
        // underscore is a name but not a type.
        if !action_type.starts_with(|c: char| c.is_ascii_alphabetic()) {
            continue;
        }

        let mut props = parse_action_props(rest);
        let when = props
            .remove("when")
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        actions.push(RuleAction {
            name: name.to_string(),
            action_type: action_type.to_string(),
            when,
            props,
        });
    }
    actions
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

/// `[A-Za-z_][\w-]*` — an identifier that may carry hyphens after the first
/// character, which is what both directive patterns accept.
fn take_ident_with_dashes(value: &str) -> Option<(&str, &str)> {
    let first = value.chars().next()?;
    if !is_ident_start(first) {
        return None;
    }
    let end = value
        .char_indices()
        .find(|(index, c)| *index > 0 && !is_ident_char(*c) && *c != '-')
        .map_or(value.len(), |(index, _)| index);
    Some((&value[..end], &value[end..]))
}

/// Quote a value for a zen decision-table output cell.
fn zen_literal(value: &str) -> String {
    format!("'{}'", value.replace('\'', "\\'"))
}

/// A GoRules decision table, one row per `%%action`.
///
/// The node-graph form a rules flowchart compiles to carries no outputs, so the
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
/// EML's; see `runtime_action`.
///
/// Every declared output column appears in every row, blank when the action
/// does not use it: zen-engine yields *no result at all* for a row with a
/// missing cell, so an omitted column silently disables the whole rule.
/// EML's action names, in the vocabulary the generated runtime reads.
///
/// The two are not the same list and never were. EML spells a refusal
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
/// EML writes `field:` and `value:` as two separate properties; the runtime
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

/// A rule compiled from EML, ready to seed into `sys_rule_definitions`.
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

/// Compile a model's `%%rule` sections into JDM decision graphs.
///
/// A section that will not compile is warned about and skipped rather than
/// fatal: one malformed rule should not stop an application from being
/// generated.
#[cfg(test)]
pub fn compile_rules(
    sections: &[EmlRuleSection],
    on_warn: impl FnMut(String),
) -> Vec<CompiledRule> {
    let declarations: Vec<RuleDeclaration> = sections.iter().map(read_rule_section).collect();
    compile_rule_declarations(&declarations, on_warn)
}

const DECISION_TABLE_DIRECTIVE: &str = "%%decision-table ";

/// The table the rules editor hangs off a `%%decision-table` line, if any.
fn parse_decision_table_directive(flowchart: &str) -> Option<serde_json::Value> {
    let line = flowchart
        .lines()
        .map(str::trim)
        .find(|line| line.starts_with(DECISION_TABLE_DIRECTIVE))?;
    match serde_json::from_str::<serde_json::Value>(&line[DECISION_TABLE_DIRECTIVE.len()..]) {
        Ok(value @ (serde_json::Value::Object(_) | serde_json::Value::Array(_))) => Some(value),
        _ => None,
    }
}

/// Read one `%%rule` section into a declaration: its binding, the decision
/// flowchart as nodes and edges, its `%%action` lines and any editor-authored
/// `%%decision-table`. Nothing is compiled here.
pub fn read_rule_section(section: &EmlRuleSection) -> RuleDeclaration {
    let ast = parse_mermaid_flowchart(&section.flowchart);
    RuleDeclaration {
        name: section.name.clone(),
        entity: section.entity.clone(),
        event: section.event.clone(),
        priority: section.priority,
        nodes: ast
            .iter()
            .map(|node| RuleNode {
                id: node.id.clone(),
                label: node.label.clone(),
                shape: node.shape.as_str().to_string(),
            })
            .collect(),
        edges: ast
            .edges
            .iter()
            .map(|edge| RuleEdge {
                source: edge.source.clone(),
                target: edge.target.clone(),
                label: edge.label.clone(),
            })
            .collect(),
        actions: read_rule_actions(&section.flowchart),
        decision_table: parse_decision_table_directive(&section.flowchart),
    }
}

/// Compile rule declarations read from either syntax.
///
/// What a rule compiles *from* follows one precedence: an editor-authored
/// decision table, then its actions, then the flowchart itself. A rule with no
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
        // placeholder flowchart, so it has to be read before the AST —
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
            let mut ast = FlowAst::default();
            for node in &declaration.nodes {
                let Some(shape) = NodeShape::from_name(&node.shape) else {
                    continue;
                };
                ast.insert_node(FlowNode {
                    id: node.id.clone(),
                    label: node.label.clone(),
                    shape,
                });
            }
            ast.edges = declaration
                .edges
                .iter()
                .map(|edge| FlowEdge {
                    source: edge.source.clone(),
                    target: edge.target.clone(),
                    label: edge.label.clone(),
                })
                .collect();
            convert_to_jdm(&ast)
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
        "-- Business rules for {project_name}, compiled from %%rule sections."
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
        out.push(
            "-- This model declares no %%rule sections. The file is still emitted:".to_string(),
        );
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

    /// The compiled row is asserted against the *runtime's* action union,
    /// never against this compiler's own output.
    ///
    /// EML and the generated Loco backend do not share an action vocabulary,
    /// and two of the three types EML ships were inert because of it.
    /// `validation-error` is EML's word for a refusal; `promotion.rs` looks for
    /// `prevent`, so a compiled `validation-error` row matched, fell through
    /// `run_action`'s `other` arm and was logged as unknown — a rule written to
    /// refuse a write let every write through. And `transform` had no payload
    /// column, so `JdmViolation.transform_data` arrived empty.
    ///
    /// A test reading back what this function produced cannot see either
    /// failure: the compiler was perfectly self-consistent.
    #[test]
    fn an_action_row_is_written_in_the_runtimes_vocabulary() {
        let actions = parse_rule_actions(
            "\
    %%action refuseDiscount validation-error when: discount_percent > 40 message: Reprice it
    %%action stampTier transform when: amount > 50000 field: tier value: strategic
    %%action escalate trigger-workflow when: amount > 1000 workflow: Approval
",
        );
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

    /// A transform's `field:` and `value:` fold into the one object the runtime
    /// reads, and nothing else carries one.
    #[test]
    fn a_transform_carries_its_payload_and_nothing_else_does() {
        let actions = parse_rule_actions(
            "\
    %%action stampTier transform when: amount > 50000 field: tier value: strategic
    %%action escalate trigger-workflow when: amount > 1000 workflow: Approval
",
        );
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

    /// One cell of a compiled row, by column id.
    fn cell(row: &JdmRow, id: &str) -> String {
        row.0
            .iter()
            .find(|(key, _)| key == id)
            .map(|(_, value)| value.clone())
            .unwrap_or_default()
    }

    #[test]
    fn a_rule_section_is_read_back_out_of_a_document() {
        let source = "\
erDiagram
    Deal { string id PK }

%%rule dealApproval on Deal event: beforeUpdate priority: 50
flowchart TD
    A([Deal]) --> B{amount > 10000?}
    B --> |yes| C([Needs approval])
";
        let sections = extract_rule_sections(source);
        assert_eq!(sections.len(), 1);
        assert_eq!(sections[0].name, "dealApproval");
        assert_eq!(sections[0].entity, "Deal");
        assert_eq!(sections[0].event, "beforeUpdate");
        assert_eq!(sections[0].priority, Some(50));
        assert!(sections[0].flowchart.starts_with("flowchart TD"));
    }

    #[test]
    fn a_diamond_node_after_an_edge_keeps_its_id() {
        // The regression the TypeScript comment records: greedy backtracking
        // over an absent edge label produced a node id of `t`, the tail of
        // `draft`, instead of `B`.
        let ast = parse_mermaid_flowchart("flowchart TD\n    A --> B{Status == draft?}\n");
        assert!(ast.nodes.contains_key("B"), "got {:?}", ast.node_order);
        assert_eq!(ast.nodes["B"].label, "Status == draft?");
        assert_eq!(ast.nodes["B"].shape, NodeShape::Diamond);
    }

    #[test]
    fn every_node_shape_maps_to_its_jdm_type() {
        let ast = parse_mermaid_flowchart(
            "flowchart TD\n    A([In]) --> B{Check}\n    B --> C((Fn))\n    C --> D[Expr]\n    D --> E([Out])\n",
        );
        let jdm = convert_to_jdm(&ast);
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
    }

    #[test]
    fn an_edge_label_becomes_the_jdm_edge_name_and_absence_omits_it() {
        let ast = parse_mermaid_flowchart("flowchart TD\n    A --> |yes| B\n    B --> C\n");
        let json = serialize_jdm(&convert_to_jdm(&ast));
        assert!(json.contains(r#""name":"yes""#), "{json}");
        // `JSON.stringify` drops an undefined property rather than writing null.
        assert!(!json.contains("null"), "{json}");
    }

    #[test]
    fn an_action_directive_compiles_to_a_decision_table() {
        let sections = extract_rule_sections(
            "%%rule escalate on Deal event: afterUpdate\nflowchart TD\n    A([Deal]) --> B([Done])\n    %%action notify trigger-workflow when: amount > 10000 workflow: BigDeal message: Big deal\n",
        );
        let compiled = compile_rules(&sections, |_| {});
        assert_eq!(compiled.len(), 1);
        assert_eq!(compiled[0].table_name, "bus_deal");
        assert_eq!(compiled[0].operation, "UPDATE");
        let json = &compiled[0].jdm_content;
        assert!(json.contains("decisionTableNode"), "{json}");
        assert!(json.contains(r#""i1":"amount > 10000""#), "{json}");
        assert!(json.contains(r#"'trigger-workflow'"#), "{json}");
        assert!(json.contains(r#"'Big deal'"#), "{json}");
    }

    #[test]
    fn an_action_with_no_when_fires_on_every_write() {
        let actions =
            parse_rule_actions("    %%action block prevent message: A closed deal cannot change");
        assert_eq!(actions.len(), 1);
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
        assert!(sql.contains("declares no %%rule"));
    }

    #[test]
    fn the_seed_upserts_only_when_the_setting_is_on() {
        let sections = extract_rule_sections(
            "%%rule r on Deal event: beforeCreate\nflowchart TD\n    A([In]) --> B([Out])\n",
        );
        let sql = build_rules_seed_sql(&RulesSeedOptions {
            project_name: "crm",
            rules: &compile_rules(&sections, |_| {}),
            created_by: "system",
        });
        assert!(sql.contains("ON CONFLICT (entity_name, operation, rule_name) DO UPDATE"));
        assert!(sql.contains("current_setting('appwithai.rules_overwrite', true) = 'on'"));
    }
}
