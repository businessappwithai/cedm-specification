//! Business-rule evaluation via GoRules ZEN.
//!
//! The TypeScript stack used `@gorules/zen-engine`, a Node binding around a Rust
//! core. Here that core is the dependency directly, so JDM files port
//! byte-for-byte and every evaluation saves an N-API boundary crossing. It is a
//! real improvement — with one constraint the design document did not foresee,
//! described under "Why evaluation runs on a blocking thread" below.
//!
//! Two behaviours from the TypeScript service are load-bearing and preserved
//! exactly (see rules-engine.service.ts.hbs):
//!
//! * **`_operation`, never `action`.** The CRUD verb travels in `_operation`
//!   so a model that has its own `action` column can still write rules against
//!   it. Injecting `action` would both clobber the column and make a
//!   required-field rule on it un-fireable, since the injected value makes the
//!   field look present even when omitted.
//! * **Fail-open.** An infrastructure failure (bad JDM, engine error) logs and
//!   returns a non-matching result so the write proceeds. Only an explicit
//!   `prevent` action rejects a request. Rules must not become an availability
//!   risk for ordinary CRUD.
//!
//! ## Why evaluation runs on a blocking thread
//!
//! `zen_engine::Variable` — the engine's own value type — is built on `Rc<str>`
//! and `Rc<RefCell<..>>`, so it is **not `Send`**. Holding one across an `.await`
//! makes the surrounding future `!Send`, and axum requires handler futures to be
//! `Send`. Calling `decision.evaluate(..).await` directly from a controller
//! therefore does not compile.
//!
//! This is worth stating plainly because §2.2 of the design document calls the
//! rules module "the one module where the migration is a strict improvement
//! with near-zero risk". The improvement is real — same engine, no N-API hop —
//! but it is not drop-in: the `!Send` value type is a genuine constraint the
//! document did not anticipate.
//!
//! The containment is to run the whole evaluation inside `spawn_blocking` on a
//! current-thread runtime, so every `Variable` is created and dropped on that
//! one thread and only `serde_json::Value` (which is `Send`) crosses back. That
//! keeps the constraint in this module instead of leaking `!Send` into every
//! caller.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use zen_engine::model::DecisionContent;
use zen_engine::{DecisionEngine, Variable};

/// One violation row as a JDM decision table emits it.
///
/// Field names mirror the TypeScript `JdmViolation` interface exactly, because
/// the same JDM documents feed both stacks.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct JdmViolation {
    pub action: String,
    pub message: String,
    #[serde(rename = "ruleId")]
    pub rule_id_camel: Option<String>,
    pub rule_id: Option<String>,
    #[serde(rename = "workflowName")]
    pub workflow_name: Option<String>,
    /// `cascade-*`: the table to act on.
    #[serde(rename = "targetEntity")]
    pub target_entity: Option<String>,
    /// `cascade-update` / `cascade-delete`: column on `target_entity` holding this row's id.
    #[serde(rename = "linkField")]
    pub link_field: Option<String>,
    /// The three payload fields are tolerated as either a JSON object or a
    /// JSON *string* containing one — decision-table authors write both.
    #[serde(rename = "updateData")]
    pub update_data: Option<Value>,
    #[serde(rename = "createData")]
    pub create_data: Option<Value>,
    #[serde(rename = "transformData")]
    pub transform_data: Option<Value>,
}

impl JdmViolation {
    /// `ruleId` or `rule_id`, whichever the table author used.
    #[must_use]
    pub fn rule_id(&self) -> String {
        self.rule_id_camel
            .clone()
            .or_else(|| self.rule_id.clone())
            .unwrap_or_else(|| "unknown".to_string())
    }
}

/// A single action a matched rule asks for.
#[derive(Debug, Clone, Serialize)]
pub struct RuleAction {
    #[serde(rename = "type")]
    pub action_type: String,
    pub config: Value,
}

#[derive(Debug, Clone, Serialize)]
pub struct RuleEvaluationResult {
    #[serde(rename = "ruleId")]
    pub rule_id: String,
    #[serde(rename = "ruleName")]
    pub rule_name: String,
    pub matched: bool,
    pub actions: Vec<RuleAction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<String>>,
}

impl RuleEvaluationResult {
    /// The fail-open marker. `matched: false` means callers treat it as "no
    /// rule fired" — the write proceeds — while the error is still visible.
    fn engine_error(message: String) -> Self {
        Self {
            rule_id: "engine-error".to_string(),
            rule_name: "Rules Engine Error".to_string(),
            matched: false,
            actions: Vec::new(),
            errors: Some(vec![message]),
        }
    }
}

/// The CRUD verb a rule set is being evaluated for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuleOperation {
    Create,
    Update,
    Delete,
}

impl RuleOperation {
    #[must_use]
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Create => "create",
            Self::Update => "update",
            Self::Delete => "delete",
        }
    }
}

#[derive(Clone)]
pub struct RulesEngine {
    engine: Arc<DecisionEngine>,
}

impl Default for RulesEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl RulesEngine {
    #[must_use]
    pub fn new() -> Self {
        Self {
            engine: Arc::new(DecisionEngine::default()),
        }
    }

    /// Evaluate a JDM document held as text — the database-backed path
    /// (`sys_rule_definitions.jdm_content`).
    ///
    /// `rule_name` overrides the rule id in the results when the caller knows
    /// it, matching `evaluateRulesWithJDM(.., dbRuleName)`.
    pub async fn evaluate_jdm_str(
        &self,
        entity_type: &str,
        jdm_content: &str,
        data: &Map<String, Value>,
        operation: RuleOperation,
        rule_name: Option<&str>,
    ) -> Vec<RuleEvaluationResult> {
        let content: DecisionContent = match serde_json::from_str(jdm_content) {
            Ok(content) => content,
            Err(err) => {
                crate::log_event!(rules_jdm_invalid, entity = entity_type, error = %err);
                return vec![RuleEvaluationResult::engine_error(err.to_string())];
            }
        };
        self.evaluate(entity_type, content, data, operation, rule_name)
            .await
    }

    /// Evaluate a JDM document and return what it produced, untouched.
    ///
    /// `evaluate` reads the result as a list of *violations* — `{ action,
    /// message, ... }` — which is the right shape for a rule guarding a write
    /// and the wrong one for a decision table that publishes arbitrary columns.
    /// A table emitting `{ priority, slaDays }` deserialises into no violation
    /// at all and its output is lost.
    ///
    /// A `Decision` workflow step needs the columns themselves, so it takes
    /// this path. Both share the `spawn_blocking` hop, which is not optional:
    /// `zen_engine::Variable` is built on `Rc` and is not `Send`, so awaiting
    /// `decision.evaluate` in a handler will not compile.
    pub async fn evaluate_raw(
        &self,
        entity_type: &str,
        content: DecisionContent,
        data: &Map<String, Value>,
        operation: RuleOperation,
    ) -> Result<Value, String> {
        let mut input = data.clone();
        input.insert("_operation".into(), Value::String(operation.as_str().into()));

        let engine = Arc::clone(&self.engine);
        let payload = Value::Object(input);

        let evaluated = tokio::task::spawn_blocking(move || {
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .map_err(|err| err.to_string())?;
            runtime.block_on(async move {
                let decision = engine.create_decision(Arc::new(content));
                decision
                    .evaluate(Variable::from(payload))
                    .await
                    .map(|response| response.result.to_value())
                    .map_err(|err| err.to_string())
            })
        })
        .await;

        match evaluated {
            Ok(Ok(value)) => Ok(value),
            Ok(Err(err)) => {
                crate::log_event!(rules_evaluation_failed, entity = entity_type, error = %err);
                Err(err)
            }
            Err(err) => {
                crate::log_event!(rules_evaluation_failed, entity = entity_type, error = %err);
                Err(err.to_string())
            }
        }
    }

    /// Evaluate a parsed JDM document.
    pub async fn evaluate(
        &self,
        entity_type: &str,
        content: DecisionContent,
        data: &Map<String, Value>,
        operation: RuleOperation,
        rule_name: Option<&str>,
    ) -> Vec<RuleEvaluationResult> {
        let mut input = data.clone();
        // See the module comment: the verb is `_operation`, and the payload is
        // otherwise passed through untouched.
        input.insert("_operation".into(), Value::String(operation.as_str().into()));

        let engine = Arc::clone(&self.engine);
        let payload = Value::Object(input);

        // Everything touching `Variable` happens inside this closure, on one
        // thread, and only a `serde_json::Value` comes back out.
        let evaluated = tokio::task::spawn_blocking(move || {
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .map_err(|err| err.to_string())?;
            runtime.block_on(async move {
                let decision = engine.create_decision(Arc::new(content));
                decision
                    .evaluate(Variable::from(payload))
                    .await
                    .map(|response| response.result.to_value())
                    .map_err(|err| err.to_string())
            })
        })
        .await;

        let result = match evaluated {
            Ok(Ok(value)) => value,
            Ok(Err(err)) => {
                crate::log_event!(rules_evaluation_failed, entity = entity_type, error = %err);
                return vec![RuleEvaluationResult::engine_error(err)];
            }
            Err(err) => {
                crate::log_event!(rules_evaluation_failed, entity = entity_type, error = %err);
                return vec![RuleEvaluationResult::engine_error(err.to_string())];
            }
        };

        parse_violations(&result)
            .into_iter()
            .map(|violation| {
                let id = rule_name
                    .map(ToString::to_string)
                    .unwrap_or_else(|| violation.rule_id());
                RuleEvaluationResult {
                    rule_id: id.clone(),
                    rule_name: id,
                    matched: true,
                    actions: vec![RuleAction {
                        action_type: violation.action.clone(),
                        config: to_action_config(&violation),
                    }],
                    errors: None,
                }
            })
            .collect()
    }
}

/// A decision graph may return a single object or an array of them; both are
/// valid and the TypeScript stack accepted either.
fn parse_violations(result: &Value) -> Vec<JdmViolation> {
    let parsed: Vec<JdmViolation> = match result {
        Value::Array(items) => items
            .iter()
            .filter_map(|item| serde_json::from_value(item.clone()).ok())
            .collect(),
        Value::Object(_) => serde_json::from_value(result.clone())
            .map(|violation| vec![violation])
            .unwrap_or_default(),
        _ => Vec::new(),
    };

    // A decision graph that matched nothing returns `{}`, and every field on
    // `JdmViolation` has a default — so without this an empty result
    // deserialises into a violation with an empty action, and *every* write
    // against an entity with rules reports a match that asks for nothing. The
    // action is what a violation is; one without it did not happen.
    parsed
        .into_iter()
        .filter(|violation| !violation.action.is_empty())
        .collect()
}

/// Flatten a violation into the action config the executor consumes.
fn to_action_config(violation: &JdmViolation) -> Value {
    let mut config = Map::new();
    config.insert("message".into(), Value::String(violation.message.clone()));
    if let Some(name) = &violation.workflow_name {
        config.insert("workflowName".into(), Value::String(name.clone()));
    }
    if let Some(entity) = &violation.target_entity {
        config.insert("targetEntity".into(), Value::String(entity.clone()));
    }
    if let Some(field) = &violation.link_field {
        config.insert("linkField".into(), Value::String(field.clone()));
    }
    for (key, raw) in [
        ("updateData", &violation.update_data),
        ("createData", &violation.create_data),
        ("transformData", &violation.transform_data),
    ] {
        if let Some(value) = raw {
            config.insert(key.into(), as_object(value));
        }
    }
    Value::Object(config)
}

/// Decision-table cells hold either a JSON object or a *string* containing
/// JSON. The TypeScript `asObject()` helper tolerated both, and existing models
/// rely on that, so this does too.
fn as_object(value: &Value) -> Value {
    match value {
        Value::String(text) => serde_json::from_str(text).unwrap_or_else(|_| value.clone()),
        other => other.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rule_id_accepts_either_spelling() {
        let camel = JdmViolation {
            rule_id_camel: Some("R1".into()),
            ..Default::default()
        };
        assert_eq!(camel.rule_id(), "R1");

        let snake = JdmViolation {
            rule_id: Some("R2".into()),
            ..Default::default()
        };
        assert_eq!(snake.rule_id(), "R2");

        assert_eq!(JdmViolation::default().rule_id(), "unknown");
    }

    #[test]
    fn violations_parse_from_object_or_array() {
        let single = serde_json::json!({ "action": "prevent", "message": "no" });
        assert_eq!(parse_violations(&single).len(), 1);

        let many = serde_json::json!([
            { "action": "prevent", "message": "a" },
            { "action": "transform", "message": "b" },
        ]);
        assert_eq!(parse_violations(&many).len(), 2);

        // A scalar result means the graph produced no violations.
        assert!(parse_violations(&serde_json::json!(true)).is_empty());

        // So does an empty object, which is what a decision table returns when
        // no row matched — every field defaults, so this parses cleanly and has
        // to be rejected on its content instead.
        assert!(parse_violations(&serde_json::json!({})).is_empty());
        assert!(
            parse_violations(&serde_json::json!([{ "message": "no action" }])).is_empty(),
            "a violation with no action asks for nothing and is not a match"
        );
    }

    #[test]
    fn payload_fields_tolerate_json_encoded_strings() {
        let as_string = Value::String(r#"{"status":"closed"}"#.to_string());
        assert_eq!(as_object(&as_string), serde_json::json!({"status":"closed"}));

        let as_object_already = serde_json::json!({"status":"open"});
        assert_eq!(as_object(&as_object_already), as_object_already);

        // Not JSON at all — passed through rather than dropped.
        let plain = Value::String("closed".to_string());
        assert_eq!(as_object(&plain), plain);
    }

    #[tokio::test]
    async fn engine_failure_is_fail_open() {
        let engine = RulesEngine::new();
        let results = engine
            .evaluate_jdm_str(
                "bus_order",
                "{ not valid jdm",
                &Map::new(),
                RuleOperation::Create,
                None,
            )
            .await;

        assert_eq!(results.len(), 1);
        // `matched: false` is what makes the caller let the write through.
        assert!(!results[0].matched);
        assert_eq!(results[0].rule_id, "engine-error");
        assert!(results[0].errors.is_some());
    }
}
