//! EML sagas: parse `%%workflow … kind: saga` sections, compile them to BPMN,
//! and emit `seed/workflows.sql`.
//!
//! A port of `language/sagas.ts` (the parsing) and
//! `packages/generator/src/workflows/saga.ts` (the BPMN and the seed). They are
//! separate files there because the `eml` CLI and the checker need the parsing
//! too; here there is one consumer, so they are one module.
//!
//! The binding between a `%%step` directive and a flowchart node id is what
//! gives a saga its order: the arrows drawn in the diagram are the sequence, not
//! the order the directives happen to be written in.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use crate::language::Language;
use crate::records::{SagaDeclaration, SagaStepDeclaration};

/// One `%%step` line, bound to a flowchart node by its id.
#[derive(Debug, Clone)]
pub struct SagaStep {
    pub node_id: String,
    pub node_type: String,
    /// The node's label in the flowchart, used as the BPMN task name.
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
    /// `ALL` unless a `%%meta operation:` narrows it.
    pub operation: String,
    /// What starts the run — `rule` by default.
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

/// `%%workflow <Name> <attrs…>` → (name, attrs)
fn parse_workflow_header(line: &str) -> Option<(String, String)> {
    let rest = line.strip_prefix("%%workflow")?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let mut parts = rest.trim_start().splitn(2, char::is_whitespace);
    let name = parts.next()?;
    if name.is_empty() {
        return None;
    }
    Some((name.to_string(), parts.next().unwrap_or("").to_string()))
}

/// `%%step <nodeId> <NodeType> <rest>` → (node id, node type, rest)
fn parse_step_header(line: &str) -> Option<(String, String, String)> {
    let rest = line.strip_prefix("%%step")?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let mut parts = rest.trim_start().splitn(3, char::is_whitespace);
    let node_id = parts.next()?;
    let node_type = parts.next()?;
    if node_id.is_empty() || node_type.is_empty() {
        return None;
    }
    Some((
        node_id.to_string(),
        node_type.to_string(),
        parts.next().unwrap_or("").trim().to_string(),
    ))
}

/// `%%meta <key>: <value>` → (key, value)
fn parse_meta(line: &str) -> Option<(String, String)> {
    let rest = line.strip_prefix("%%meta")?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let rest = rest.trim_start();
    let (key, value) = rest.split_once(':')?;
    let key = key.trim();
    if key.is_empty() || !is_meta_key(key) {
        return None;
    }
    Some((key.to_string(), value.trim().to_string()))
}

fn is_meta_key(key: &str) -> bool {
    let mut chars = key.chars();
    matches!(chars.next(), Some(c) if c.is_ascii_alphabetic())
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// Split `key: value key2: value2` into pairs.
///
/// A value runs to the next `<key>:` token or the end of the line, so it may
/// contain spaces — and a `fields:` JSON payload, whose own `": "` pairs must
/// not be mistaken for the next key, is required to be written last.
///
/// The `://` exclusion is what keeps a URL whole. `url: https://host/path`
/// would otherwise split at `https:`, leaving a REST step compiled with no url
/// at all and the executor called with `undefined`.
///
/// This is the same rule as `PROP_SPLIT` in `language/checker.ts` and in
/// `packages/generator/src/workflows/sagas.ts`. It replaced a terminal-key list
/// that the language definition no longer carries; a checker and a compiler
/// that disagree about a directive is worse than either being wrong alone.
pub fn parse_step_properties(rest: &str) -> Vec<(String, String)> {
    let mut properties: Vec<(String, String)> = Vec::new();
    let trimmed = rest.trim();
    if trimmed.is_empty() {
        return properties;
    }

    for chunk in split_on_keys(trimmed) {
        let Some(at) = chunk.find(':') else { continue };
        if at == 0 {
            continue;
        }
        let key = chunk[..at].trim();
        if key.is_empty() {
            continue;
        }
        push_property(
            &mut properties,
            key.to_string(),
            chunk[at + 1..].trim().to_string(),
        );
    }

    properties
}

/// `\s+(?=[A-Za-z_]\w*:(?!//))` — hand-rolled, because the `regex` crate has
/// no lookahead and the rule has to match the TypeScript side character for
/// character.
fn split_on_keys(input: &str) -> Vec<&str> {
    let bytes = input.as_bytes();
    let mut chunks: Vec<&str> = Vec::new();
    let mut start = 0usize;

    let mut index = 0usize;
    while index < bytes.len() {
        if !bytes[index].is_ascii_whitespace() {
            index += 1;
            continue;
        }
        let space_start = index;
        while index < bytes.len() && bytes[index].is_ascii_whitespace() {
            index += 1;
        }
        let key_start = index;
        if key_start >= bytes.len()
            || !(bytes[key_start].is_ascii_alphabetic() || bytes[key_start] == b'_')
        {
            continue;
        }
        let mut cursor = key_start;
        while cursor < bytes.len()
            && (bytes[cursor].is_ascii_alphanumeric() || bytes[cursor] == b'_')
        {
            cursor += 1;
        }
        if cursor >= bytes.len() || bytes[cursor] != b':' {
            continue;
        }
        // `https://` is a scheme, not a key.
        if bytes[cursor + 1..].starts_with(b"//") {
            continue;
        }
        chunks.push(input[start..space_start].trim());
        start = key_start;
        index = cursor;
    }

    chunks.push(input[start..].trim());
    chunks.into_iter().filter(|c| !c.is_empty()).collect()
}

/// Last write wins, matching assignment into a JavaScript object literal.
fn push_property(properties: &mut Vec<(String, String)>, key: String, value: String) {
    if let Some(existing) = properties.iter_mut().find(|(k, _)| *k == key) {
        existing.1 = value;
    } else {
        properties.push((key, value));
    }
}

// ── Flowchart reading ────────────────────────────────────────────────────────

/// Node labels, so a BPMN task carries the name drawn on the diagram.
///
/// Matches `A([Start])`, `B[Do a thing]`, `C{Choice}`, `D((Event))`, `E(Task)`.
/// First label for an id wins.
fn parse_node_labels(lines: &[&str]) -> HashMap<String, String> {
    let mut labels: HashMap<String, String> = HashMap::new();

    for line in lines {
        if line.trim_start().starts_with("%%") {
            continue;
        }
        let bytes = line.as_bytes();
        let mut index = 0usize;
        while index < bytes.len() {
            // An identifier only starts at the beginning, after whitespace, or
            // after `>` — the tail of an arrow.
            let boundary =
                index == 0 || bytes[index - 1].is_ascii_whitespace() || bytes[index - 1] == b'>';
            if !boundary || !(bytes[index].is_ascii_alphabetic() || bytes[index] == b'_') {
                index += 1;
                continue;
            }

            let start = index;
            while index < bytes.len()
                && (bytes[index].is_ascii_alphanumeric() || bytes[index] == b'_')
            {
                index += 1;
            }
            let id = &line[start..index];

            let mut cursor = index;
            while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
                cursor += 1;
            }
            let Some(opener) = shape_opener(&line[cursor..]) else {
                continue;
            };
            cursor += opener;

            let label_start = cursor;
            while cursor < bytes.len()
                && bytes[cursor] != b']'
                && bytes[cursor] != b'}'
                && bytes[cursor] != b')'
            {
                cursor += 1;
            }
            let label = line[label_start..cursor].trim();
            if !label.is_empty() {
                labels
                    .entry(id.to_string())
                    .or_insert_with(|| label.to_string());
            }
            index = cursor;
        }
    }

    labels
}

/// Length of the shape-opening bracket at the head of `rest`, longest first.
fn shape_opener(rest: &str) -> Option<usize> {
    for opener in ["([", "((", "[", "{", "("] {
        if rest.starts_with(opener) {
            return Some(opener.len());
        }
    }
    None
}

/// Node ids in edge order — the flowchart's arrows are the sequence.
///
/// Nodes are emitted in the order they are first reached, following the arrows
/// left to right, so a branch reads the way it is drawn.
fn parse_edge_order(lines: &[&str]) -> Vec<String> {
    let mut order: Vec<String> = Vec::new();
    let mut seen: BTreeSet<String> = BTreeSet::new();

    for line in lines {
        let trimmed = line.trim();
        // The guard has to admit every arrow `split_arrows` knows about. It
        // used to test `--` only, so a flowchart drawn entirely with `==>`
        // never reached the split: the order came back empty, the saga's steps
        // fell back to the order the `%%step` directives happen to be written
        // in, and no diagnostic fired.
        if trimmed.starts_with("%%") {
            continue;
        }
        if !trimmed.contains("--") && !trimmed.contains("==") {
            continue;
        }

        // Strip edge labels (`-->|Yes|`) before splitting, so they are not
        // mistaken for node ids.
        let cleaned = strip_edge_labels(trimmed);
        for part in split_arrows(&cleaned) {
            if let Some(id) = leading_identifier(&part) {
                if seen.insert(id.clone()) {
                    order.push(id);
                }
            }
        }
    }

    order
}

/// `.replace(/\|[^|]*\|/g, " ")` — a *matched pair* of bars and its contents.
///
/// The pairing matters. Dropping everything after a lone `|` would swallow the
/// rest of a malformed line, and with it any node ids further along; the regex
/// leaves an unmatched bar exactly where it found it, so the ids after it are
/// still read.
fn strip_edge_labels(line: &str) -> String {
    let mut out = String::with_capacity(line.len());
    let mut rest = line;

    while let Some(open) = rest.find('|') {
        let after_open = &rest[open + 1..];
        let Some(close) = after_open.find('|') else {
            break;
        };
        out.push_str(&rest[..open]);
        out.push(' ');
        rest = &after_open[close + 1..];
    }

    out.push_str(rest);
    out
}

/// Split on `-->`, `--`, `==>` and their longer forms.
fn split_arrows(line: &str) -> Vec<String> {
    let mut parts: Vec<String> = Vec::new();
    let bytes = line.as_bytes();
    let mut segment_start = 0usize;
    let mut index = 0usize;

    while index < bytes.len() {
        let ch = bytes[index];
        if ch != b'-' && ch != b'=' {
            index += 1;
            continue;
        }

        let run_start = index;
        while index < bytes.len() && bytes[index] == ch {
            index += 1;
        }
        let run = index - run_start;
        // `={2,}>` requires the arrowhead; `-{2,}>` and `-{2,}` do not.
        let has_head = index < bytes.len() && bytes[index] == b'>';
        let matched = match ch {
            b'-' => run >= 2,
            _ => run >= 2 && has_head,
        };
        if !matched {
            continue;
        }
        if has_head {
            index += 1;
        }

        parts.push(line[segment_start..run_start].to_string());
        segment_start = index;
    }

    parts.push(line[segment_start..].to_string());
    parts
}

/// `^\s*([A-Za-z_]\w*)`
fn leading_identifier(part: &str) -> Option<String> {
    let trimmed = part.trim_start();
    let mut chars = trimmed.char_indices();
    let (_, first) = chars.next()?;
    if !(first.is_ascii_alphabetic() || first == '_') {
        return None;
    }
    let mut end = trimmed.len();
    for (index, ch) in trimmed.char_indices().skip(1) {
        if !(ch.is_ascii_alphanumeric() || ch == '_') {
            end = index;
            break;
        }
    }
    Some(trimmed[..end].to_string())
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/// One `kind: saga` section as written, before any step is checked.
struct SagaBlock {
    name: String,
    entity: String,
    meta: BTreeMap<String, String>,
    labels: HashMap<String, String>,
    /// Node ids in the order the flowchart's edges first reach them.
    order: Vec<String>,
    /// Every `%%step`, in declaration order, including ones that will be refused.
    raw_steps: Vec<SagaStepDeclaration>,
}

/// Each `%%workflow … kind: saga` section: from its directive to the next
/// `%%workflow`.
fn saga_blocks(source: &str) -> Vec<SagaBlock> {
    let normalized = source.replace("\r\n", "\n");
    let lines: Vec<&str> = normalized.lines().collect();
    let mut blocks = Vec::new();

    let starts: Vec<usize> = lines
        .iter()
        .enumerate()
        .filter(|(_, line)| parse_workflow_header(line.trim()).is_some())
        .map(|(index, _)| index)
        .collect();

    for (position, start) in starts.iter().enumerate() {
        let end = starts.get(position + 1).copied().unwrap_or(lines.len());
        let block = &lines[*start..end];

        let Some((name, attrs)) = parse_workflow_header(block[0].trim()) else {
            continue;
        };

        let attributes = parse_step_properties(&attrs);
        let kind = attributes
            .iter()
            .find(|(key, _)| key == "kind")
            .map(|(_, value)| value.to_ascii_lowercase())
            .unwrap_or_default();
        if kind != "saga" {
            continue;
        }

        let entity = attributes
            .iter()
            .find(|(key, _)| key == "entity")
            .map(|(_, value)| value.clone())
            .unwrap_or_default();

        let mut meta: BTreeMap<String, String> = BTreeMap::new();
        for line in block {
            if let Some((key, value)) = parse_meta(line.trim()) {
                meta.insert(key, value);
            }
        }

        let labels = parse_node_labels(block);
        let mut raw_steps = Vec::new();
        for line in block {
            let Some((node_id, node_type, rest)) = parse_step_header(line.trim()) else {
                continue;
            };
            raw_steps.push(SagaStepDeclaration {
                label: Some(
                    labels
                        .get(&node_id)
                        .cloned()
                        .unwrap_or_else(|| node_id.clone()),
                ),
                id: node_id,
                step_type: node_type,
                properties: parse_step_properties(&rest),
            });
        }

        blocks.push(SagaBlock {
            name,
            entity,
            meta,
            order: parse_edge_order(block),
            labels,
            raw_steps,
        });
    }

    blocks
}

/// "no node in the flowchart" — the one check only a drawn saga can fail.
fn unreachable_step(block: &SagaBlock, node_id: &str) -> Option<SagaDiagnostic> {
    if block.order.iter().any(|id| id == node_id) || block.labels.contains_key(node_id) {
        return None;
    }
    Some(SagaDiagnostic {
        workflow: block.name.clone(),
        node_id: Some(node_id.to_string()),
        message: format!("no node \"{node_id}\" in the flowchart — the step will never run"),
    })
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
    mut after_each: impl FnMut(&str, &mut Vec<SagaDiagnostic>),
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
        after_each(&node_id, diagnostics);

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

/// Every saga in an EML document, with its steps in flowchart order.
///
/// Sections are delimited by `%%workflow`; a document may hold several.
#[cfg(test)]
pub fn parse_sagas(source: &str, lang: &Language) -> SagaParseResult {
    let mut result = SagaParseResult::default();

    for block in saga_blocks(source) {
        let name = block.name.clone();
        if block.entity.is_empty() {
            result.diagnostics.push(SagaDiagnostic {
                workflow: name.clone(),
                node_id: None,
                message: "saga declares no entity".to_string(),
            });
        }

        let mut by_node = accept_saga_steps(
            &name,
            &block.raw_steps,
            lang,
            &mut result.diagnostics,
            |node_id, diagnostics| {
                if let Some(diagnostic) = unreachable_step(&block, node_id) {
                    diagnostics.push(diagnostic);
                }
            },
        );

        // Flowchart order first; a step whose node is missing from the edges
        // still runs, after the ones that are placed.
        let mut steps: Vec<SagaStep> = Vec::new();
        for node_id in &block.order {
            if let Some(index) = by_node.iter().position(|(id, _)| id == node_id) {
                steps.push(by_node.remove(index).1);
            }
        }
        steps.extend(by_node.into_iter().map(|(_, step)| step));

        if steps.is_empty() {
            result.diagnostics.push(SagaDiagnostic {
                workflow: name.clone(),
                node_id: None,
                message: "saga has no %%step directives, so it compiles to an empty process"
                    .to_string(),
            });
        }

        result.workflows.push(SagaWorkflow {
            name,
            entity: block.entity.clone(),
            operation: block
                .meta
                .get("operation")
                .map(|value| value.to_uppercase())
                .unwrap_or_else(|| "ALL".to_string()),
            trigger: block
                .meta
                .get("trigger")
                .cloned()
                .unwrap_or_else(|| "rule".to_string()),
            description: block.meta.get("description").cloned(),
            steps,
        });
    }

    result
}

/// Read every saga section into a declaration, without checking its steps.
///
/// Steps are listed in the order the saga runs them — the order its edges reach
/// their nodes, any step on no edge after, in declaration order. The
/// diagnostics are the ones only a flowchart can raise.
pub fn read_saga_directives(source: &str) -> (Vec<SagaDeclaration>, Vec<SagaDiagnostic>) {
    let mut declarations = Vec::new();
    let mut diagnostics = Vec::new();

    for block in saga_blocks(source) {
        let rank = |id: &str| {
            block
                .order
                .iter()
                .position(|candidate| candidate == id)
                .unwrap_or(usize::MAX)
        };
        let mut indexed: Vec<(usize, &SagaStepDeclaration)> =
            block.raw_steps.iter().enumerate().collect();
        indexed
            .sort_by(|(a_pos, a), (b_pos, b)| rank(&a.id).cmp(&rank(&b.id)).then(a_pos.cmp(b_pos)));
        let steps: Vec<SagaStepDeclaration> =
            indexed.into_iter().map(|(_, step)| step.clone()).collect();

        let mut reported: BTreeSet<String> = BTreeSet::new();
        for step in &block.raw_steps {
            if reported.insert(step.id.clone()) {
                if let Some(diagnostic) = unreachable_step(&block, &step.id) {
                    diagnostics.push(diagnostic);
                }
            }
        }

        declarations.push(SagaDeclaration {
            name: block.name.clone(),
            entity: block.entity.clone(),
            operation: block.meta.get("operation").cloned(),
            trigger: block.meta.get("trigger").cloned(),
            description: block.meta.get("description").cloned(),
            steps,
        });
    }

    (declarations, diagnostics)
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

        let steps: Vec<SagaStep> = accept_saga_steps(
            &name,
            &declaration.steps,
            lang,
            &mut result.diagnostics,
            |_, _| {},
        )
        .into_iter()
        .map(|(_, step)| step)
        .collect();

        if steps.is_empty() {
            result.diagnostics.push(SagaDiagnostic {
                workflow: name.clone(),
                node_id: None,
                message: "saga has no %%step directives, so it compiles to an empty process"
                    .to_string(),
            });
        }

        result.workflows.push(SagaWorkflow {
            name,
            entity: declaration.entity.clone(),
            operation: declaration
                .operation
                .as_deref()
                .map(str::to_uppercase)
                .unwrap_or_else(|| "ALL".to_string()),
            trigger: declaration
                .trigger
                .clone()
                .unwrap_or_else(|| "rule".to_string()),
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
                 (name, entity_name, operation, bpmn_xml, description, is_active, is_model_managed, created_at, updated_at)\n\
                 VALUES ({name}, {entity}, {operation},\n        \
                 {bpmn}, {description}, TRUE, TRUE, NOW(), NOW())\n\
                 ON CONFLICT (name) DO UPDATE SET\n  \
                 entity_name      = EXCLUDED.entity_name,\n  \
                 operation        = EXCLUDED.operation,\n  \
                 bpmn_xml         = EXCLUDED.bpmn_xml,\n  \
                 description      = EXCLUDED.description,\n  \
                 is_model_managed = TRUE,\n  \
                 updated_at       = NOW();",
                name = sql_string(&workflow.name),
                entity = sql_string(&workflow.entity),
                operation = sql_string(&workflow.operation),
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

    const SAGA: &str = r#"
%%workflow DeviationEscalation entity: DeviationReport kind: saga
%%meta operation: create
%%meta trigger: rule
%%meta description: Escalate a critical deviation into a CAPA.
flowchart TD
    A([Start]) --> B[Compute due days]
    B --> C[Raise CAPA]
    C --> D([Done])
%%step B Formula target: dueDays operation: multiply source: baseDays operand: 7
%%step C CreateEntity entity: CAPA as: newCapaId fields: {"title":"Escalated","severity":"high"}
"#;

    fn lang() -> Language {
        Language::load()
    }

    #[test]
    fn parses_a_saga_in_flowchart_order() {
        let parsed = parse_sagas(SAGA, &lang());
        assert_eq!(parsed.workflows.len(), 1);
        let saga = &parsed.workflows[0];

        assert_eq!(saga.name, "DeviationEscalation");
        assert_eq!(saga.entity, "DeviationReport");
        assert_eq!(saga.operation, "CREATE");
        assert_eq!(saga.trigger, "rule");
        assert_eq!(
            saga.description.as_deref(),
            Some("Escalate a critical deviation into a CAPA.")
        );

        // B before C because the arrows say so, not because of directive order.
        assert_eq!(
            saga.steps
                .iter()
                .map(|s| s.node_id.as_str())
                .collect::<Vec<_>>(),
            ["B", "C"]
        );
        assert_eq!(saga.steps[0].label, "Compute due days");
        assert_eq!(saga.steps[1].label, "Raise CAPA");
        assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    }

    /// A decision table survives to the end of the line.
    ///
    /// It is JSON, so it is full of `":"` — a scanner that split on every colon
    /// would cut it at the first one and the Rust generator would compile a
    /// `Decision` step against half a table. The rule that saves it is the one
    /// the checker uses: a split point needs *whitespace* before the key, and
    /// compact JSON has none.
    #[test]
    fn a_decision_table_is_read_to_the_end_of_the_line() {
        let props = parse_step_properties(
            r#"publish: priority decisionTable: {"hitPolicy":"first","outputs":[{"id":"o1","field":"priority"}]}"#,
        );
        let get = |key: &str| {
            props
                .iter()
                .find(|(k, _)| k == key)
                .map(|(_, v)| v.as_str())
                .unwrap_or_default()
        };
        assert_eq!(get("publish"), "priority");
        assert_eq!(
            get("decisionTable"),
            r#"{"hitPolicy":"first","outputs":[{"id":"o1","field":"priority"}]}"#
        );
    }

    #[test]
    fn a_json_payload_written_last_survives_whole() {
        let props = parse_step_properties(
            r#"entity: CAPA as: newCapaId fields: {"title":"Escalated","severity":"high"}"#,
        );
        let get = |key: &str| {
            props
                .iter()
                .find(|(k, _)| k == key)
                .map(|(_, v)| v.as_str())
                .unwrap_or_default()
        };
        assert_eq!(get("entity"), "CAPA");
        assert_eq!(get("as"), "newCapaId");
        assert_eq!(get("fields"), r#"{"title":"Escalated","severity":"high"}"#);
    }

    /// The reason the rule excludes `://`.
    ///
    /// Without it `url: https://host/path` splits at `https:`, and the REST
    /// step compiles with no url at all — the executor is then called with
    /// nothing, which fails a long way from here.
    #[test]
    fn a_url_is_not_split_at_its_scheme() {
        let props =
            parse_step_properties("method: POST url: https://example.test/api/v1 as: reply");
        let get = |key: &str| {
            props
                .iter()
                .find(|(k, _)| k == key)
                .map(|(_, v)| v.as_str())
                .unwrap_or_default()
        };
        assert_eq!(get("method"), "POST");
        assert_eq!(get("url"), "https://example.test/api/v1");
        assert_eq!(get("as"), "reply");
    }

    #[test]
    fn an_unknown_step_type_is_reported_and_dropped() {
        let source = r#"
%%workflow Broken entity: Compound kind: saga
flowchart TD
    A --> B
%%step B Teleport target: mars
"#;
        let parsed = parse_sagas(source, &lang());
        assert_eq!(parsed.workflows.len(), 1);
        assert!(parsed.workflows[0].steps.is_empty());
        assert!(parsed
            .diagnostics
            .iter()
            .any(|d| d.message.contains("unknown step type \"Teleport\"")));
        // And the empty process is called out too.
        assert!(parsed
            .diagnostics
            .iter()
            .any(|d| d.message.contains("no %%step directives")));
    }

    #[test]
    fn a_missing_required_property_is_reported() {
        let source = r#"
%%workflow Partial entity: Compound kind: saga
flowchart TD
    A --> B
%%step B Formula target: x
"#;
        let parsed = parse_sagas(source, &lang());
        // `operation` is required; `source`/`value` are not a oneOf on Formula.
        assert!(
            parsed
                .diagnostics
                .iter()
                .any(|d| d.message.contains("Formula is missing operation")),
            "{:?}",
            parsed.diagnostics
        );
    }

    #[test]
    fn a_non_saga_workflow_is_skipped() {
        let source = "%%workflow Approval entity: Compound kind: state\nflowchart TD\n  A --> B\n";
        assert!(parse_sagas(source, &lang()).workflows.is_empty());
    }

    #[test]
    fn edge_labels_are_not_mistaken_for_nodes() {
        let order = parse_edge_order(&["    A -->|Yes| B", "    B --> C"]);
        assert_eq!(order, ["A", "B", "C"]);
    }

    #[test]
    fn an_unmatched_bar_does_not_swallow_the_rest_of_the_line() {
        // A matched pair becomes one space — leaving two where the line already
        // had one, exactly as the regex does.
        assert_eq!(strip_edge_labels("A -->|Yes| B"), "A -->  B");
        // A stray bar is left where it is, so the ids after it are still read.
        assert_eq!(strip_edge_labels("A -->|Yes B"), "A -->|Yes B");
        assert_eq!(strip_edge_labels("A -->|x| B -->|y| C"), "A -->  B -->  C");
    }

    /// Every arrow the splitter understands must also get past the line guard.
    ///
    /// `==>` used to be split but never reached: the guard admitted a line only
    /// if it contained `--`, so a thick-arrow-only flowchart produced an empty
    /// order and the steps silently fell back to directive order. Fixed in
    /// `language/sagas.ts` and here together, so both generators agree.
    #[test]
    fn arrows_of_every_length_split_the_same_way() {
        assert_eq!(parse_edge_order(&["A --> B"]), ["A", "B"]);
        assert_eq!(parse_edge_order(&["A ---> B"]), ["A", "B"]);
        assert_eq!(parse_edge_order(&["A --- B"]), ["A", "B"]);
        // A node reached twice keeps its first position.
        assert_eq!(parse_edge_order(&["A --> B", "C --> A"]), ["A", "B", "C"]);

        assert_eq!(parse_edge_order(&["A ==> B"]), ["A", "B"]);
        assert_eq!(parse_edge_order(&["A --> B ==> C"]), ["A", "B", "C"]);
        assert_eq!(parse_edge_order(&["A ==> B", "B ==> C"]), ["A", "B", "C"]);
    }

    #[test]
    fn bpmn_carries_a_diagram_and_the_step_properties() {
        let parsed = parse_sagas(SAGA, &lang());
        let bpmn = build_saga_bpmn(&parsed.workflows[0]);

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
        let parsed = parse_sagas(SAGA, &lang());
        let sql = build_workflow_seed_sql(&parsed.workflows, "drug-discovery");
        assert!(sql.contains("ON CONFLICT (name) DO UPDATE SET"));
        assert!(sql.contains("'DeviationEscalation'"));
        assert!(sql.contains("is_model_managed = TRUE"));
    }
}
