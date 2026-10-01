//! BPMN workflow execution.
//!
//! Ports `bpmn-executor.service.ts`. A workflow definition is BPMN 2.0 XML
//! whose `bpmn:serviceTask` elements carry `appwithai:property` extension
//! elements describing what to do; sequence flows give the execution order.
//!
//! ## Decision D6 is moot — and the design document overstated this risk
//!
//! §6.6 and D6 assume the `Formula` task "evaluates a user-authored
//! expression" that "leans on JavaScript", and recommend adopting
//! `zen-expression` with a published compatibility note because it would be a
//! behaviour change.
//!
//! The actual implementation is not an expression evaluator. It reads four
//! named properties (`target`, `source`, `operation`, `operand`) and switches
//! over a closed set of four arithmetic operations — multiply, divide, add,
//! subtract — with an unknown operation falling through to the base value.
//! There is no JavaScript, no parser, and no user-authored syntax anywhere in
//! it. The Rust port below is therefore exact rather than approximate: no
//! expression crate is needed, no dialect changes, and risk R4 does not apply.

use std::collections::HashMap;

use quick_xml::events::Event;
use quick_xml::Reader;
use serde_json::{json, Map, Value};

use crate::errors::{AppError, AppResult};
use crate::services::dictionary::DictionaryCache;
use crate::services::dynamic_repo::DynamicRepo;
use crate::services::rules_engine::{RuleOperation, RulesEngine};

#[derive(Debug, Clone, Default)]
pub struct BpmnTask {
    pub id: String,
    pub name: String,
    pub node_type: String,
    pub properties: HashMap<String, String>,
}

/// Mutable state threaded through a workflow run.
#[derive(Debug, Default)]
pub struct WorkflowContext {
    pub entity_name: String,
    pub entity_id: Option<String>,
    pub entity_data: Map<String, Value>,
    /// Output of the rule evaluation that triggered this workflow.
    pub decision: Map<String, Value>,
    /// Scratch space written by `Formula` tasks and read by later ones.
    pub vars: Map<String, Value>,
}

impl WorkflowContext {
    /// Resolve a name against decision → vars → entity data, in that order.
    /// The precedence matches the TypeScript executor exactly.
    #[must_use]
    pub fn resolve(&self, key: &str) -> Option<&Value> {
        self.decision
            .get(key)
            .or_else(|| self.vars.get(key))
            .or_else(|| self.entity_data.get(key))
    }

    fn resolve_number(&self, key: &str) -> f64 {
        self.resolve(key).map_or(0.0, |value| match value {
            Value::Number(n) => n.as_f64().unwrap_or(0.0),
            Value::String(s) => s.parse().unwrap_or(0.0),
            Value::Bool(b) => f64::from(u8::from(*b)),
            _ => 0.0,
        })
    }

    fn resolve_string(&self, key: &str) -> String {
        self.resolve(key).map_or_else(String::new, render_scalar)
    }
}

/// How a context value reads once it lands in text.
///
/// `Formula` stores every numeric literal as an f64, so a whole number comes
/// back out of serde_json as `42.0`. That is invisible while a value is only
/// ever fed to more arithmetic, and wrong the moment it reaches a person: a
/// step that titles a record `CAPA-` produced `CAPA-42.0`, and one that
/// wrote a computed day count into a text column stored `30.0`. A float that
/// holds a whole number is printed without the fractional part; a genuine
/// fraction keeps it.
fn render_scalar(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.as_f64().map_or_else(
            || n.to_string(),
            |f| {
                if f.fract() == 0.0 && f.is_finite() && f.abs() < 1e15 {
                    format!("{}", f as i64)
                } else {
                    n.to_string()
                }
            },
        ),
        other => other.to_string(),
    }
}

/// Parse the `bpmn:serviceTask` elements out of a BPMN document, in sequence
/// -flow order where the flows are well formed.
///
/// This is a pull parse rather than a DOM walk: BPMN documents are large and
/// mostly diagram layout, and only two element kinds matter here.
pub fn parse_tasks(xml: &str) -> AppResult<Vec<BpmnTask>> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    // quick-xml reaches EOF without complaint on a truncated document, so
    // element depth is tracked explicitly: a definition with unclosed tags must
    // be rejected here, because `controllers::workflow::create` relies on this
    // parse to refuse invalid BPMN at write time rather than at trigger time.
    let mut depth: i32 = 0;
    let mut tasks: Vec<BpmnTask> = Vec::new();
    let mut flows: Vec<(String, String)> = Vec::new();
    let mut current: Option<BpmnTask> = None;
    // The value of an `appwithai:property` can arrive as a `value` attribute or
    // as element text; both spellings exist in the wild.
    let mut pending_property: Option<String> = None;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Eof) => {
                if depth != 0 {
                    return Err(AppError::BadRequest(
                        "Malformed BPMN XML: document has unclosed elements".to_string(),
                    ));
                }
                break;
            }
            Ok(Event::Start(e)) => {
                depth += 1;
                match local_name(e.name().as_ref()).as_str() {
                    "serviceTask" => {
                        current = Some(BpmnTask {
                            id: attribute(&e, "id").unwrap_or_default(),
                            name: attribute(&e, "name").unwrap_or_default(),
                            node_type: "Unknown".to_string(),
                            properties: HashMap::new(),
                        });
                    }
                    "property" => {
                        if let Some(task) = current.as_mut() {
                            if let Some(prop_name) = attribute(&e, "name") {
                                if let Some(value) = attribute(&e, "value") {
                                    task.properties.insert(prop_name, value);
                                } else {
                                    pending_property = Some(prop_name);
                                }
                            }
                        }
                    }
                    "sequenceFlow" => {
                        if let (Some(from), Some(to)) =
                            (attribute(&e, "sourceRef"), attribute(&e, "targetRef"))
                        {
                            flows.push((from, to));
                        }
                    }
                    _ => {}
                }
            }
            // Self-closing elements never produce an `End`, so a service task
            // written as `<serviceTask …/>` is complete the moment it is seen.
            Ok(Event::Empty(e)) => {
                match local_name(e.name().as_ref()).as_str() {
                    "serviceTask" => {
                        tasks.push(BpmnTask {
                            id: attribute(&e, "id").unwrap_or_default(),
                            name: attribute(&e, "name").unwrap_or_default(),
                            node_type: "Unknown".to_string(),
                            properties: HashMap::new(),
                        });
                    }
                    "property" => {
                        if let Some(task) = current.as_mut() {
                            if let Some(prop_name) = attribute(&e, "name") {
                                task.properties
                                    .insert(prop_name, attribute(&e, "value").unwrap_or_default());
                            }
                        }
                    }
                    "sequenceFlow" => {
                        if let (Some(from), Some(to)) =
                            (attribute(&e, "sourceRef"), attribute(&e, "targetRef"))
                        {
                            flows.push((from, to));
                        }
                    }
                    _ => {}
                }
            }
            Ok(Event::Text(text)) => {
                if let (Some(task), Some(prop)) = (current.as_mut(), pending_property.take()) {
                    let value = text.unescape().unwrap_or_default().trim().to_string();
                    task.properties.insert(prop, value);
                }
            }
            Ok(Event::End(e)) => {
                depth -= 1;
                if local_name(e.name().as_ref()) == "serviceTask" {
                    if let Some(mut task) = current.take() {
                        task.node_type = task
                            .properties
                            .get("nodeType")
                            .cloned()
                            .unwrap_or_else(|| "Unknown".to_string());
                        tasks.push(task);
                    }
                }
            }
            Err(err) => {
                return Err(AppError::BadRequest(format!("Malformed BPMN XML: {err}")));
            }
            _ => {}
        }
        buf.clear();
    }

    Ok(order_tasks(tasks, &flows))
}

/// Order tasks by walking the sequence flows.
///
/// Falls back to document order when the flows do not produce a usable chain,
/// which is what the TypeScript executor does — a diagram with no flows still
/// runs its tasks rather than silently doing nothing.
fn order_tasks(tasks: Vec<BpmnTask>, flows: &[(String, String)]) -> Vec<BpmnTask> {
    if flows.is_empty() || tasks.len() < 2 {
        return tasks;
    }

    let by_id: HashMap<&str, &BpmnTask> = tasks.iter().map(|t| (t.id.as_str(), t)).collect();
    let targets: Vec<&str> = flows.iter().map(|(_, to)| to.as_str()).collect();
    let next: HashMap<&str, &str> = flows
        .iter()
        .map(|(from, to)| (from.as_str(), to.as_str()))
        .collect();

    // The start of the chain is a task nothing points at.
    let Some(start) = tasks.iter().find(|t| !targets.contains(&t.id.as_str())) else {
        return tasks;
    };

    let mut ordered = Vec::with_capacity(tasks.len());
    let mut seen = std::collections::HashSet::new();
    let mut cursor = start.id.as_str();
    loop {
        if !seen.insert(cursor) {
            break; // A cycle in the diagram must not hang the executor.
        }
        if let Some(task) = by_id.get(cursor) {
            ordered.push((*task).clone());
        }
        match next.get(cursor) {
            Some(following) => cursor = following,
            None => break,
        }
    }

    // Any task the flows skipped still runs, after the ordered ones.
    for task in &tasks {
        if !ordered.iter().any(|t| t.id == task.id) {
            ordered.push(task.clone());
        }
    }
    ordered
}

fn local_name(raw: &[u8]) -> String {
    let name = String::from_utf8_lossy(raw);
    name.rsplit(':').next().unwrap_or(&name).to_string()
}

/// One attribute's value, with XML entities resolved.
///
/// `unescape_value` rather than the raw bytes, and that is not cosmetic: a
/// `CreateEntity` payload is JSON, so every quote in it is stored as `&quot;`.
/// Reading the raw value hands `{&quot;title&quot;:...}` to `serde_json`, which
/// rejects it — meaning *every* CreateEntity step with a field map failed at
/// run time with a parse error that pointed at the payload rather than at the
/// reader. Falls back to the lossy raw value so a malformed entity cannot make
/// the whole document unreadable.
fn attribute(element: &quick_xml::events::BytesStart<'_>, key: &str) -> Option<String> {
    element.attributes().flatten().find_map(|attr| {
        (local_name(attr.key.as_ref() ) == key).then(|| {
            attr.unescape_value().map_or_else(
                |_| String::from_utf8_lossy(&attr.value).to_string(),
                |value| value.into_owned(),
            )
        })
    })
}

/// Wrap a bare decision table in the input → table → output graph the engine
/// evaluates.
///
/// A Decision step's `decisionTable` carries the table itself — hit policy,
/// inputs, outputs, rules — because that is the interesting part and making
/// every author write the three-node plumbing around it is noise. A document
/// that already *is* a full graph (it has `nodes`) is passed through, so a
/// table pasted out of the admin editor works too.
fn wrap_decision_table(raw: &str) -> AppResult<String> {
    let parsed: Value = serde_json::from_str(raw)
        .map_err(|err| AppError::BadRequest(format!("decisionTable is not valid JSON: {err}")))?;

    if parsed.get("nodes").is_some() {
        return Ok(raw.to_string());
    }

    let graph = serde_json::json!({
        "nodes": [
            { "id": "input", "name": "Input", "type": "inputNode" },
            { "id": "table", "name": "Decision", "type": "decisionTableNode", "content": parsed },
            { "id": "output", "name": "Output", "type": "outputNode" },
        ],
        "edges": [
            { "id": "edge-1", "sourceId": "input", "targetId": "table" },
            { "id": "edge-2", "sourceId": "table", "targetId": "output" },
        ],
    });
    Ok(graph.to_string())
}

/// Executes parsed BPMN tasks against the database.
#[derive(Clone)]
pub struct WorkflowExecutor {
    repo: DynamicRepo,
    dictionary: DictionaryCache,
}

impl WorkflowExecutor {
    #[must_use]
    pub fn new(repo: DynamicRepo, dictionary: DictionaryCache) -> Self {
        Self { repo, dictionary }
    }

    /// Run every task in order. A task failure aborts the run — a half-applied
    /// workflow is worse than a reported failure.
    pub async fn run(&self, tasks: &[BpmnTask], ctx: &mut WorkflowContext) -> AppResult<()> {
        for task in tasks {
            self.execute(task, ctx).await?;
        }
        Ok(())
    }

    async fn execute(&self, task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
        crate::log_event!(workflow_node_executing, node = task.node_type, name = task.name);
        match task.node_type.as_str() {
            "UpdateEntity" => self.update_entity(task, ctx).await,
            "CreateEntity" => self.create_entity(task, ctx).await,
            // Pure computation, no I/O — see the module comment on D6.
            "Formula" => {
                formula(task, ctx)?;
                Ok(())
            }
            "DeleteEntity" => self.delete_entity(task, ctx).await,
            "Decision" => self.decision(task, ctx).await,
            "REST" => rest(task, ctx).await,
            // Declared by the language so a diagram round-trips through the
            // designer, but not implemented here. Failing the run is the whole
            // point: skipping it completed the saga and reported success for
            // business outcomes that never happened, which is worse than not
            // offering the node at all. `shipped: false` in
            // `workflowConstructs.stepNodes` is the contract this enforces.
            unshipped @ "Agent" => Err(AppError::BadRequest(format!(
                "workflow step type '{unshipped}' is declared in EML but not executed by this \
                 backend, so the run would silently skip it. Remove the step, or implement it in \
                 services/workflow.rs."
            ))),
            other => {
                // Genuinely unknown nodes are skipped, not fatal: a diagram may
                // contain node types a newer generator understands. That
                // forward-compatibility is why this is not an error — but it
                // only applies to types this backend has never heard of.
                crate::log_event!(workflow_node_unknown, node = other);
                Ok(())
            }
        }
    }

    /// `Decision` — evaluate a decision table and publish what it decided.
    ///
    /// This is what lets a saga branch. Every other step type does a thing;
    /// this one works out *which* thing, by evaluating a GoRules table over the
    /// workflow context and writing the matching row's output columns into
    /// `ctx.vars`, where the steps after it read them.
    ///
    /// Two ways to name the table, and the choice is not stylistic:
    ///
    /// * `rule: <name>` reads a rule already in `sys_rule_definitions` — the
    ///   one the model declared in `rules`. Use it when the same table
    ///   already governs the entity, so the process does not fork a second copy
    ///   that then drifts from it.
    /// * `decisionTable: <json>` carries the table inline, for logic only this
    ///   process cares about.
    ///
    /// **A table that matches no row publishes nothing, and that is not an
    /// error.** It is how "leave it alone" is expressed: the steps after it
    /// that read a variable it would have set find nothing and skip themselves.
    /// Failing the run instead would make every optional branch fatal.
    ///
    /// `publish` narrows the output to a comma-separated allow-list, for a
    /// table that emits more than this process needs.
    async fn decision(&self, task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
        let inline = task.properties.get("decisionTable");
        let rule_name = task.properties.get("rule");

        let jdm = match (inline, rule_name) {
            (Some(table), _) => wrap_decision_table(table)?,
            (None, Some(name)) => {
                let found: Option<(String,)> = sqlx::query_as(
                    r"SELECT jdm_content FROM sys_rule_definitions
                       WHERE rule_name = $1 AND is_active = true
                       ORDER BY updated_at DESC NULLS LAST
                       LIMIT 1",
                )
                .bind(name)
                .fetch_optional(self.repo.pool())
                .await
                .map_err(|err| AppError::Internal(anyhow::anyhow!("looking up rule {name}: {err}")))?;

                // A named rule that is not there is a modelling error, not a
                // condition to shrug at: the step would otherwise publish
                // nothing and every branch after it would quietly take the
                // "no match" path.
                let Some((content,)) = found else {
                    return Err(AppError::BadRequest(format!(
                        "Decision step references rule \"{name}\", which is not in \
                         sys_rule_definitions"
                    )));
                };
                content
            }
            (None, None) => {
                return Err(AppError::BadRequest(
                    "Decision requires either \"rule\" or \"decisionTable\"".into(),
                ))
            }
        };

        // The record plus whatever earlier steps published: a decision usually
        // reads both, and `vars` wins so a Formula can override a column.
        let mut input = ctx.entity_data.clone();
        for (key, value) in &ctx.vars {
            input.insert(key.clone(), value.clone());
        }

        let content: zen_engine::model::DecisionContent = serde_json::from_str(&jdm)
            .map_err(|err| AppError::BadRequest(format!("Decision table is not valid JDM: {err}")))?;

        let evaluated = RulesEngine::new()
            .evaluate_raw(&ctx.entity_name, content, &input, RuleOperation::Update)
            .await
            .map_err(|err| AppError::Internal(anyhow::anyhow!("Decision evaluation failed: {err}")))?;

        let allow: Option<Vec<String>> = task.properties.get("publish").map(|list| {
            list.split(',')
                .map(|key| key.trim().to_string())
                .filter(|key| !key.is_empty())
                .collect()
        });

        // `collect` yields an array, `first` a bare object. Both are legal JDM
        // results and a step should not care which hit policy the table uses.
        let rows: Vec<&Value> = match &evaluated {
            Value::Array(items) => items.iter().collect(),
            Value::Object(_) => vec![&evaluated],
            _ => Vec::new(),
        };

        let mut published = 0_usize;
        for row in rows {
            let Value::Object(fields) = row else { continue };
            for (key, value) in fields {
                if let Some(allow) = &allow {
                    if !allow.contains(key) {
                        continue;
                    }
                }
                ctx.vars.insert(key.clone(), value.clone());
                published += 1;
            }
        }

        crate::log_event!(workflow_decision_published, node = task.name, published);
        Ok(())
    }

    async fn update_entity(&self, task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
        let field = task
            .properties
            .get("field")
            .ok_or_else(|| AppError::BadRequest("UpdateEntity requires \"field\"".into()))?;

        let entity = target_entity(task, ctx);
        let meta = self.dictionary.meta(&entity).await?;

        let value = resolved_value(task, ctx);
        let id = target_id(task, ctx, "UpdateEntity")?;

        let mut payload = Map::new();
        payload.insert(field.clone(), value);
        self.repo.update(&meta, id, &payload, None).await?;
        Ok(())
    }

    async fn create_entity(&self, task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
        let entity = target_entity(task, ctx);
        let meta = self.dictionary.meta(&entity).await?;

        // The payload is a JSON object literal carrying placeholders resolved
        // from context. It is read from `fields` *or* `data`: the Workflow
        // Designer has always written `fields` while this executor only ever
        // read `data`, so every CreateEntity node authored in the UI inserted
        // an empty row and reported success. `fields` is the name the language
        // declares and the designer uses; `data` stays readable so diagrams
        // already stored in `sys_workflow_definitions` keep working.
        let raw = task
            .properties
            .get("fields")
            .or_else(|| task.properties.get("data"))
            .cloned()
            .unwrap_or_default();
        let rendered = interpolate(&raw, ctx);
        let declared: Map<String, Value> = if rendered.trim().is_empty() {
            Map::new()
        } else {
            serde_json::from_str(&rendered).map_err(|err| {
                AppError::BadRequest(format!("CreateEntity fields is not JSON: {err}"))
            })?
        };

        // `fields` maps a column to a **context key or a literal**, which is
        // what the language means by
        // `fields: {"account_id":"newAccountId","first_name":"first_name"}`:
        // take the id an earlier step published as `newAccountId`, and the
        // lead's own `first_name`. Only `{{...}}` was substituted before, so a
        // bare name was written through verbatim — a saga inserted the string
        // "newAccountId" into a uuid column and 400'd, and where the column was
        // text it silently stored the word "first_name" instead of a name.
        //
        // A string that names nothing in context stays a literal, which is what
        // keeps `"status":"active"` working.
        let payload = resolve_fields(declared, ctx);

        let created = self.repo.create(&meta, &payload).await?;

        // `as` binds the new row's id into the run context, which is the only
        // way a later step can act on a record this one created.
        if let Some(key) = task.properties.get("as").filter(|k| !k.is_empty()) {
            if let Some(id) = created.get("id") {
                ctx.vars.insert(key.clone(), id.clone());
            }
        }
        Ok(())
    }

    /// Remove a record.
    ///
    /// Soft by default, like every other delete path in this stack — the row
    /// stays auditable. `hard: true` is for a record that was never real from
    /// the user's point of view, such as a placeholder an earlier step created.
    async fn delete_entity(&self, task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
        let entity = target_entity(task, ctx);
        let meta = self.dictionary.meta(&entity).await?;
        let id = target_id(task, ctx, "DeleteEntity")?;

        let table = crate::services::dictionary::TableName::from_verified(meta.table_name.clone());
        let removed = if task
            .properties
            .get("hard")
            .is_some_and(|v| matches!(v.as_str(), "true" | "1" | "yes"))
        {
            self.repo.hard_delete(&table, id).await?
        } else {
            self.repo.soft_delete(&table, id).await?
        };

        if !removed {
            // Not an error: a step that deletes something already gone has
            // achieved what it was asked to.
            crate::log_event!(entity_delete_no_match, entity = %entity, %id);
        }
        Ok(())
    }
}

/// Which record a step acts on.
///
/// `targetSource` names a context key holding the id — how a step reaches a
/// row some earlier step produced. Without it the step acts on the record that
/// triggered the run. The designer has always offered this field; until now
/// the executor ignored it and silently wrote to the triggering record
/// instead, which on a cross-entity step is the wrong row in the wrong table.
fn target_id(task: &BpmnTask, ctx: &WorkflowContext, node: &str) -> AppResult<uuid::Uuid> {
    let raw = match task.properties.get("targetSource").filter(|s| !s.is_empty()) {
        Some(key) => ctx
            .resolve(key)
            .map(|value| match value {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            })
            .ok_or_else(|| {
                AppError::BadRequest(format!("{node} targetSource \"{key}\" is not in the run context"))
            })?,
        None => ctx
            .entity_id
            .clone()
            .ok_or_else(|| AppError::BadRequest(format!("{node} requires a target record")))?,
    };

    uuid::Uuid::parse_str(raw.trim_matches('"'))
        .map_err(|_| AppError::BadRequest(format!("{node} target id is not a UUID: {raw}")))
}

/// Which `bus_` table a task acts on: its own `entity` property when present,
/// otherwise the entity that triggered the workflow.
fn target_entity(task: &BpmnTask, ctx: &WorkflowContext) -> String {
    task.properties
        .get("entity")
        .filter(|e| !e.is_empty())
        .cloned()
        .unwrap_or_else(|| ctx.entity_name.clone())
}

/// A task's value is either a literal (`value`) or a context lookup (`source`).
fn resolved_value(task: &BpmnTask, ctx: &WorkflowContext) -> Value {
    if let Some(source) = task.properties.get("source").filter(|s| !s.is_empty()) {
        return ctx.resolve(source).cloned().unwrap_or(Value::Null);
    }
    task.properties
        .get("value")
        .map_or(Value::Null, |v| Value::String(v.clone()))
}

/// A computed number, stored as an integer when it holds no fraction.
///
/// Arithmetic is done in f64, but the result is what later steps read and what
/// `` renders. Storing `42` as an f64 makes it serialise as
/// `42.0`, so a title built from a step count came out `CAPA-42.0` and a day
/// count written to a text column stored `30.0`. Whole values are narrowed to
/// i64 here so both the JSON and the rendered text say what the author meant;
/// a genuine fraction stays an f64 and keeps its precision.
fn number_value(result: f64) -> Value {
    if result.fract() == 0.0 && result.is_finite() && result.abs() < 1e15 {
        return Value::Number(serde_json::Number::from(result as i64));
    }
    serde_json::Number::from_f64(result).map_or(Value::Null, Value::Number)
}

/// The four arithmetic operations, ported exactly. An unrecognised operation
/// yields the base value unchanged, as in the original.
fn formula(task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
    let target = task
        .properties
        .get("target")
        .ok_or_else(|| AppError::BadRequest("Formula requires \"target\"".into()))?;
    let operation = task.properties.get("operation").map(String::as_str);

    // `set` stages a literal rather than deriving one, so it is the one
    // operation with no source to read. Without it a workflow cannot introduce
    // a constant, and every arithmetic step would need its operand to already
    // exist somewhere in the context.
    if operation == Some("set") {
        let literal = task
            .properties
            .get("value")
            .ok_or_else(|| AppError::BadRequest("Formula set requires \"value\"".into()))?;
        // A literal that parses as a number is stored as one, so a later
        // arithmetic step can read it without a string round trip; anything
        // else is kept verbatim.
        let parsed = literal
            .parse::<f64>()
            .ok()
            .map_or_else(|| Value::String(literal.clone()), number_value);
        ctx.vars.insert(target.clone(), parsed);
        return Ok(());
    }

    let source = task
        .properties
        .get("source")
        .ok_or_else(|| AppError::BadRequest("Formula requires \"source\"".into()))?;

    let base = ctx.resolve_number(source);
    let operand: f64 = task
        .properties
        .get("operand")
        .and_then(|o| o.parse().ok())
        .unwrap_or(0.0);

    let result = match operation {
        Some("multiply") => base * operand,
        // Division by zero yields 0 rather than infinity — same as the original.
        Some("divide") => {
            if operand == 0.0 {
                0.0
            } else {
                base / operand
            }
        }
        Some("add") => base + operand,
        Some("subtract") => base - operand,
        _ => base,
    };

    ctx.vars.insert(target.clone(), number_value(result));
    Ok(())
}

async fn rest(task: &BpmnTask, ctx: &mut WorkflowContext) -> AppResult<()> {
    let url = task
        .properties
        .get("url")
        .filter(|u| !u.is_empty())
        .ok_or_else(|| AppError::BadRequest("REST requires \"url\"".into()))?;
    let method = task
        .properties
        .get("method")
        .cloned()
        .unwrap_or_else(|| "POST".to_string());

    // Read from `bodyTemplate` *or* `body`: the Workflow Designer writes
    // `bodyTemplate` while the language declares the property as `body`, so a
    // REST step authored in EML sent the default payload instead of the one it
    // spelled out — the same mismatch `fields`/`data` had on CreateEntity.
    // Both spellings are honoured so neither authoring path is silently wrong.
    let template = task
        .properties
        .get("bodyTemplate")
        .or_else(|| task.properties.get("body"))
        .filter(|t| !t.is_empty());
    let body = match template {
        Some(template) => interpolate(template, ctx),
        None => json!({ "entityId": ctx.entity_id, "decision": ctx.decision }).to_string(),
    };

    let response = reqwest::Client::new()
        .request(
            reqwest::Method::from_bytes(method.as_bytes())
                .map_err(|_| AppError::BadRequest(format!("Invalid REST method '{method}'")))?,
            url,
        )
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|err| AppError::Internal(err.into()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(AppError::Internal(anyhow::anyhow!(
            "REST {method} {url} returned {status}"
        )));
    }

    // `as` binds the response into the run context. The language has always
    // declared it and the executor used to discard the body, so a chain could
    // call an endpoint but never act on what it returned — which is most of
    // the reason to call one. A JSON response binds as parsed JSON so later
    // steps can reach into it; anything else binds as the raw string.
    if let Some(key) = task.properties.get("as").filter(|k| !k.is_empty()) {
        let text = response
            .text()
            .await
            .map_err(|err| AppError::Internal(err.into()))?;
        let value = serde_json::from_str::<Value>(&text).unwrap_or(Value::String(text));
        ctx.vars.insert(key.clone(), value);
    }
    Ok(())
}

/// Replace `{{name}}` placeholders from context. Same syntax and same
/// resolution order as the TypeScript `bodyTemplate` handling.
/// Turn a `CreateEntity` field map into the row to insert.
///
/// Each value is a **context key or a literal**: a string naming something in
/// the run context resolves to it, anything else is written as given. That is
/// what lets one step say `as: newAccountId` and the next say
/// `"account_id":"newAccountId"`, while `"status":"active"` still means the
/// word "active".
fn resolve_fields(declared: Map<String, Value>, ctx: &WorkflowContext) -> Map<String, Value> {
    declared
        .into_iter()
        .map(|(column, source)| {
            let value = match &source {
                Value::String(key) => ctx.resolve(key).cloned().unwrap_or(source),
                _ => source,
            };
            (column, value)
        })
        .collect()
}

fn interpolate(template: &str, ctx: &WorkflowContext) -> String {
    let mut out = String::with_capacity(template.len());
    let mut rest = template;

    while let Some(start) = rest.find("{{") {
        out.push_str(&rest[..start]);
        let after = &rest[start + 2..];
        match after.find("}}") {
            Some(end) => {
                let key = after[..end].trim();
                out.push_str(&ctx.resolve_string(key));
                rest = &after[end + 2..];
            }
            None => {
                // Unterminated placeholder — emit the rest verbatim.
                out.push_str("{{");
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const BPMN: &str = r#"<?xml version="1.0"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:appwithai="http://appwithai.com/schema">
  <bpmn:process id="p1">
    <bpmn:serviceTask id="t1" name="Compute total">
      <bpmn:extensionElements>
        <appwithai:properties>
          <appwithai:property name="nodeType" value="Formula"/>
          <appwithai:property name="target" value="total"/>
          <appwithai:property name="source" value="qty"/>
          <appwithai:property name="operation" value="multiply"/>
          <appwithai:property name="operand" value="3"/>
        </appwithai:properties>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    <bpmn:serviceTask id="t2" name="Notify">
      <bpmn:extensionElements>
        <appwithai:properties>
          <appwithai:property name="nodeType">REST</appwithai:property>
        </appwithai:properties>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    <bpmn:sequenceFlow id="f1" sourceRef="t1" targetRef="t2"/>
  </bpmn:process>
</bpmn:definitions>"#;

    #[test]
    fn parses_service_tasks_and_their_properties() {
        let tasks = parse_tasks(BPMN).unwrap();
        assert_eq!(tasks.len(), 2);
        assert_eq!(tasks[0].node_type, "Formula");
        assert_eq!(tasks[0].properties.get("operand").unwrap(), "3");
        // The second task spells its value as element text rather than an
        // attribute; both forms must work.
        assert_eq!(tasks[1].node_type, "REST");
    }

    #[test]
    fn sequence_flows_determine_order() {
        let tasks = parse_tasks(BPMN).unwrap();
        assert_eq!(tasks[0].id, "t1");
        assert_eq!(tasks[1].id, "t2");
    }

    #[test]
    fn malformed_xml_is_a_bad_request_not_a_panic() {
        assert!(parse_tasks("<bpmn:definitions><unclosed>").is_err());
    }

    fn ctx_with(key: &str, value: Value) -> WorkflowContext {
        let mut ctx = WorkflowContext::default();
        ctx.entity_data.insert(key.to_string(), value);
        ctx
    }

    fn formula_task(operation: &str, operand: &str) -> BpmnTask {
        let mut properties = HashMap::new();
        properties.insert("target".into(), "result".into());
        properties.insert("source".into(), "base".into());
        properties.insert("operation".into(), operation.into());
        properties.insert("operand".into(), operand.into());
        BpmnTask {
            id: "t".into(),
            name: "f".into(),
            node_type: "Formula".into(),
            properties,
        }
    }

    /// Whole results are JSON integers, not floats.
    ///
    /// `number_value` normalises `30.0` to `30` on purpose — that is what makes
    /// the API emit `30` where JavaScript would, rather than `30.0`. These
    /// assertions previously read `json!(30.0)`, which builds a float
    /// `serde_json::Number`; `Number` compares by representation, so they
    /// failed against the integer the code correctly produces. The expectation
    /// was wrong, not the implementation.
    #[test]
    fn formula_ports_all_four_operations() {
        for (op, operand, expected) in [
            ("multiply", "3", 30_i64),
            ("add", "5", 15),
            ("subtract", "4", 6),
            ("divide", "2", 5),
        ] {
            let mut ctx = ctx_with("base", json!(10));
            formula(&formula_task(op, operand), &mut ctx).unwrap();
            assert_eq!(ctx.vars["result"], json!(expected), "{op} was wrong");
            assert!(
                ctx.vars["result"].is_i64(),
                "{op} produced a float where a whole number was expected: {}",
                ctx.vars["result"]
            );
        }
    }

    /// The other half of `number_value`, which no case above reaches.
    ///
    /// Every operation in the table divides evenly, so the float branch went
    /// untested — a change that stringified fractional results, or dropped them
    /// to an integer, would have passed everything.
    #[test]
    fn a_fractional_result_stays_a_float() {
        let mut ctx = ctx_with("base", json!(10));
        formula(&formula_task("divide", "4"), &mut ctx).unwrap();
        assert_eq!(ctx.vars["result"], json!(2.5));
        assert!(ctx.vars["result"].is_f64());
    }

    #[test]
    fn divide_by_zero_yields_zero_not_infinity() {
        // Matches the TypeScript behaviour exactly; Infinity is not valid JSON.
        let mut ctx = ctx_with("base", json!(10));
        formula(&formula_task("divide", "0"), &mut ctx).unwrap();
        assert_eq!(ctx.vars["result"], json!(0));
        // Not merely "equal to zero": a null here would mean `number_value`
        // rejected a non-finite result, which is the failure this guards.
        assert!(ctx.vars["result"].is_i64());
    }

    #[test]
    fn unknown_operation_passes_the_base_through() {
        let mut ctx = ctx_with("base", json!(7));
        formula(&formula_task("exponentiate", "2"), &mut ctx).unwrap();
        assert_eq!(ctx.vars["result"], json!(7));
    }

    #[test]
    fn context_resolution_prefers_decision_then_vars_then_entity() {
        let mut ctx = WorkflowContext::default();
        ctx.entity_data.insert("x".into(), json!("entity"));
        assert_eq!(ctx.resolve_string("x"), "entity");
        ctx.vars.insert("x".into(), json!("vars"));
        assert_eq!(ctx.resolve_string("x"), "vars");
        ctx.decision.insert("x".into(), json!("decision"));
        assert_eq!(ctx.resolve_string("x"), "decision");
    }

    #[test]
    fn create_entity_fields_resolve_context_keys_and_keep_literals() {
        let mut ctx = WorkflowContext::default();
        ctx.vars
            .insert("newAccountId".into(), json!("6f1c1f16-0000-4000-8000-000000000001"));
        ctx.entity_data.insert("first_name".into(), json!("Ada"));

        let declared: Map<String, Value> = serde_json::from_str(
            r#"{"account_id":"newAccountId","first_name":"first_name","status":"active","is_primary":true}"#,
        )
        .unwrap();
        let resolved = resolve_fields(declared, &ctx);

        // A published variable and a field of the triggering record both
        // resolve; the model writes their names, not their values.
        assert_eq!(resolved["account_id"], json!("6f1c1f16-0000-4000-8000-000000000001"));
        assert_eq!(resolved["first_name"], json!("Ada"));
        // A string naming nothing in context is the value itself.
        assert_eq!(resolved["status"], json!("active"));
        // Non-strings are never treated as keys.
        assert_eq!(resolved["is_primary"], json!(true));
    }

    #[test]
    fn interpolation_fills_placeholders_and_survives_malformed_ones() {
        let ctx = ctx_with("name", json!("Ada"));
        assert_eq!(interpolate("hi {{name}}!", &ctx), "hi Ada!");
        assert_eq!(interpolate("{{missing}}", &ctx), "");
        assert_eq!(interpolate("{{unterminated", &ctx), "{{unterminated");
    }
}
