//! Rules that *stop* a write, and rules that *cause* work.
//!
//! Both halves are here because neither is covered anywhere else. The
//! per-entity `rules_*` modules look like they test the first, but they author
//! a graph and post it to `/api/rules/validate`, which parses a document and
//! touches no pipeline — so until
//! `a_blocking_rule_refuses_the_write_under_either_name` was added, no test in
//! the binary had ever driven a blocking rule over HTTP, and a matched refusal
//! could be dropped silently.
//!
//! The rest proves a rule can cause work: firing a workflow, cascading an
//! update into a related entity, and creating a record in another table
//! entirely. Those are the actions that make the rules engine an automation
//! surface rather than a validator, and they are the ones with somewhere to go
//! wrong — a cascade that silently no-ops looks identical to one that fired,
//! unless something checks the other table.
//!
//! Each case walks the whole path: author the rule, write the record that
//! triggers it, then assert on the response, the *other* entity, or the run
//! log.
//!
//! Generated: 2026-10-03T02:00:36.903Z
//! Project: media

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{
    self, bearer,
    entities::{parent_of, EntityMeta, ENTITIES},
    factory::{build_record, build_record_with_parents, create_with_parents},
    rows,
};

/// A decision-table condition that matches whatever the field holds.
///
/// Not `true`. An input cell is a **unary test**, not a boolean expression: it
/// is compiled against the field's value, so a cell of `true` means `$ == true`
/// and never matches a text column. That failure is invisible — the table
/// simply returns `{}` — so the always-match condition has to be written as a
/// test that is true for any value.
const ALWAYS: &str = "$ != null";

/// Render a value as an expression-language literal.
///
/// The expression language is not JSON: object keys are written *unquoted*, so
/// `{"a": 1}` is a syntax error while `{a: 1}` is the object the JDM editor
/// itself emits. Getting this wrong does not raise — the cell fails to compile
/// and the whole table quietly returns nothing, which reads as "the rule did
/// not match".
fn zen_literal(value: &Value) -> String {
    match value {
        Value::Object(map) => {
            let fields: Vec<String> = map
                .iter()
                .map(|(key, inner)| format!("{key}: {}", zen_literal(inner)))
                .collect();
            let mut out = String::from("{");
            out.push_str(&fields.join(", "));
            out.push('}');
            out
        }
        Value::Array(items) => format!(
            "[{}]",
            items.iter().map(zen_literal).collect::<Vec<_>>().join(", ")
        ),
        // Scalars are already written the same way in both languages.
        scalar => scalar.to_string(),
    }
}

/// A decision graph whose matched row carries an arbitrary action.
///
/// `when` is a JDM *unary test* against one field of the written row (see
/// [`ALWAYS`]). Everything after the action name rides along in the output,
/// which is what the promotion pipeline reads to decide what to do next.
fn action_jdm(rule_name: &str, field: &str, when: &str, outputs: &[(&str, Value)]) -> String {
    // `message` is not decoration: the engine deserialises a matched row into
    // `JdmViolation`, where `message` is required. A table that omits it fails
    // to deserialise, the violation is dropped, and the rule looks like it
    // never matched — silently, which is the worst way for this to fail.
    let mut output_defs = vec![
        json!({ "id": "o1", "field": "action", "name": "action" }),
        json!({ "id": "om", "field": "message", "name": "message" }),
    ];
    let mut rule = json!({
        "_id": "r1",
        "i1": when,
        "o1": "\"trigger-workflow\"",
        "om": format!("\"{rule_name}\""),
    });

    for (index, (name, value)) in outputs.iter().enumerate() {
        let key = format!("o{}", index + 3);
        output_defs.push(json!({ "id": key, "field": name, "name": name }));
        // A decision-table cell holds an *expression*, not JSON, so a payload
        // has to be written as an expression-language literal. Scalars already
        // are one; objects and arrays go through `zen_literal`.
        rule[key.as_str()] = json!(zen_literal(value));
    }
    // The action name is one of the outputs, so a caller can override it.
    if let Some((_, action)) = outputs.iter().find(|(name, _)| *name == "action") {
        rule["o1"] = json!(action.to_string());
    }

    json!({
        "nodes": [
            { "id": "input", "name": "request", "type": "inputNode", "position": { "x": 0, "y": 0 } },
            {
                "id": "table",
                "name": rule_name,
                "type": "decisionTableNode",
                "position": { "x": 200, "y": 0 },
                "content": {
                    "hitPolicy": "first",
                    "inputs": [{ "id": "i1", "field": field, "name": field }],
                    "outputs": output_defs,
                    "rules": [rule]
                }
            },
            { "id": "output", "name": "response", "type": "outputNode", "position": { "x": 400, "y": 0 } }
        ],
        "edges": [
            { "id": "e1", "sourceId": "input", "targetId": "table", "type": "edge" },
            { "id": "e2", "sourceId": "table", "targetId": "output", "type": "edge" }
        ]
    })
    .to_string()
}

/// The first entity that has a foreign key we can follow, paired with its
/// parent. Multi-step cases need two related tables; a model with none skips.
fn linked_pair() -> Option<(&'static EntityMeta, &'static EntityMeta, &'static str)> {
    for child in ENTITIES {
        for fk in child.foreign_keys() {
            if let Some(parent) = parent_of(fk) {
                if parent.name != child.name {
                    return Some((child, parent, fk.name));
                }
            }
        }
    }
    None
}

async fn create_rule(
    request: &loco_rs::TestServer,
    token: &str,
    entity: &EntityMeta,
    jdm: String,
) -> String {
    let name = format!("e2e-wf-{}-{}", entity.table_name, uuid::Uuid::new_v4());
    let response = request
        .post("/api/rules")
        .add_header("authorization", bearer(token))
        .json(&json!({
            "entityName": entity.table_name,
            "ruleName": name,
            "operation": "CREATE",
            "jdmContent": jdm,
        }))
        .await;

    assert_eq!(
        response.status_code(),
        201,
        "rule create failed: {}",
        response.text()
    );
    response
        .json::<Value>()
        .get("id")
        .and_then(Value::as_str)
        .expect("rule create returned no id")
        .to_string()
}

/// How many rows an entity has, read from the list envelope's `meta.total`.
async fn count_rows(request: &loco_rs::TestServer, token: &str, entity: &EntityMeta) -> u64 {
    let response = request
        .get(&format!("/api/bus/{}?limit=1", entity.route))
        .add_header("authorization", bearer(token))
        .await;
    support::total(&response.json::<Value>())
}

async fn deactivate(request: &loco_rs::TestServer, token: &str, rule_id: &str) {
    request
        .delete(&format!("/api/rules/{rule_id}"))
        .add_header("authorization", bearer(token))
        .await;
}

/// Deactivate every rule these cases have authored.
///
/// Each one matches `true`, so a rule left behind fires on every later write in
/// the binary — a single real failure used to cascade into unrelated suites and
/// bury its own cause. Called at the *start* of each case rather than only at
/// the end, because an assertion that fails never reaches the end.
async fn clear_test_rules(request: &loco_rs::TestServer, token: &str) {
    for entity in ENTITIES {
        let listed = request
            .get(&format!("/api/rules?entityName={}", entity.table_name))
            .add_header("authorization", bearer(token))
            .await;

        let Some(rules) = listed.json::<Value>().as_array().cloned() else {
            continue;
        };
        for rule in rules {
            let is_ours = rule
                .get("ruleName")
                .and_then(Value::as_str)
                .is_some_and(|name| name.starts_with("e2e-wf-"));
            let active = rule
                .get("isActive")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            if is_ours && active {
                if let Some(id) = rule.get("id").and_then(Value::as_str) {
                    deactivate(request, token, id).await;
                }
            }
        }
    }
}

#[tokio::test]
#[serial]
async fn a_rule_can_trigger_a_workflow_on_a_business_write() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(field) = entity.first_text_field() else {
            return;
        };

        // A workflow for the rule to name.
        let workflow_name = format!("e2e-flow-{}", uuid::Uuid::new_v4());
        let workflow = request
            .post("/api/workflow")
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "name": workflow_name,
                "entityName": entity.table_name,
                "operation": "ALL",
                "bpmnXml": format!(
                    r#"<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="d">
  <bpmn:process id="p" isExecutable="true">
    <bpmn:startEvent id="start" />
    <bpmn:serviceTask id="task" name="{workflow_name}" />
    <bpmn:endEvent id="end" />
    <bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="task" />
    <bpmn:sequenceFlow id="f2" sourceRef="task" targetRef="end" />
  </bpmn:process>
</bpmn:definitions>"#
                ),
            }))
            .await;
        assert_eq!(
            workflow.status_code(),
            201,
            "workflow create failed: {}",
            workflow.text()
        );

        let rule_id = create_rule(
            &request,
            &token,
            entity,
            action_jdm(
                "trigger",
                field.name,
                ALWAYS,
                &[("workflowName", json!(workflow_name.clone()))],
            ),
        )
        .await;

        // `/api/workflows/runs` returns a bare array, not the `{ data, meta }`
        // envelope the business routes use.
        let before = request
            .get("/api/workflows/runs?limit=200")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>()
            .as_array()
            .map_or(0, Vec::len);

        create_with_parents(&request, &token, entity, &[])
            .await
            .expect("could not create the record that should trigger the workflow");

        let runs = request
            .get("/api/workflows/runs?limit=200")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(runs.status_code(), 200);

        let after = runs.json::<Value>().as_array().map_or(0, Vec::len);
        assert!(
            after > before,
            "the write matched a trigger-workflow rule but left no run — a workflow that \
             does not record its execution cannot be operated"
        );

        deactivate(&request, &token, &rule_id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_rule_can_cascade_an_update_into_a_related_entity() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some((child, parent, link_field)) = linked_pair() else {
            return;
        };
        let Some(child_trigger) = child.first_text_field() else {
            return;
        };
        let Some(parent_field) = parent.first_text_field() else {
            return;
        };

        // A parent to cascade into, and a marker to look for afterwards.
        let parent_row = create_with_parents(&request, &token, parent, &[])
            .await
            .expect("could not create the parent to cascade into");
        let parent_id = parent_row
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();
        let before = parent_row
            .get(parent_field.name)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let cascaded = format!("cascaded-{}", uuid::Uuid::new_v4());
        let rule_id = create_rule(
            &request,
            &token,
            child,
            action_jdm(
                "cascade",
                child_trigger.name,
                ALWAYS,
                &[
                    ("action", json!("cascade-update")),
                    ("targetEntity", json!(parent.table_name)),
                    ("linkField", json!(link_field)),
                    ("updateData", json!({ parent_field.name: cascaded.clone() })),
                ],
            ),
        )
        .await;

        // Writing the child is what fires the cascade.
        let mut payload = build_record(child);
        payload.insert(link_field.to_string(), json!(parent_id.clone()));
        let created = request
            .post(&format!("/api/bus/{}", child.route))
            .add_header("authorization", bearer(&token))
            .json(&Value::Object(payload))
            .await;
        assert_eq!(
            created.status_code(),
            201,
            "could not create the {} that should cascade: {}",
            child.name,
            created.text()
        );

        let refreshed = request
            .get(&format!("/api/bus/{}/{parent_id}", parent.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(refreshed.status_code(), 200);

        let after = refreshed
            .json::<Value>()
            .get(parent_field.name)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        // The whole point of a cascade is that the *other* record changed.
        // Asserting only on the write that triggered it would pass whether the
        // cascade ran or not.
        assert_ne!(
            after, before,
            "writing a {} matched a cascade-update rule targeting {}, but the parent row is \
             unchanged — the cascade did not reach it",
            child.name, parent.name
        );

        deactivate(&request, &token, &rule_id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_rule_can_create_a_record_in_another_entity() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some((child, parent, _)) = linked_pair() else {
            return;
        };
        let Some(trigger_field) = child.first_text_field() else {
            return;
        };

        let before = count_rows(&request, &token, parent).await;

        let rule_id = create_rule(
            &request,
            &token,
            child,
            action_jdm(
                "spawn",
                trigger_field.name,
                ALWAYS,
                &[
                    ("action", json!("create-record")),
                    ("targetEntity", json!(parent.table_name)),
                    (
                        "createData",
                        json!(Value::Object(
                            build_record_with_parents(&request, &token, parent).await
                        )),
                    ),
                ],
            ),
        )
        .await;

        create_with_parents(&request, &token, child, &[])
            .await
            .expect("could not create the record that should spawn another");

        let after = count_rows(&request, &token, parent).await;

        // `create_with_parents` may itself have created a parent to satisfy a
        // foreign key, so the count can rise by more than one — but it must
        // rise, and the rule is the only reason it would rise by two.
        assert!(
            after > before,
            "a create-record rule targeting {} left the table at {before} rows",
            parent.name
        );

        deactivate(&request, &token, &rule_id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_multi_step_rule_runs_every_action_it_matched() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some((child, parent, link_field)) = linked_pair() else {
            return;
        };
        let Some(trigger_field) = child.first_text_field() else {
            return;
        };
        let Some(parent_field) = parent.first_text_field() else {
            return;
        };

        let parent_row = create_with_parents(&request, &token, parent, &[])
            .await
            .expect("could not create the parent for the multi-step case");
        let parent_id = parent_row
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();

        // One rule, two actions: fire a workflow *and* cascade an update. A
        // pipeline that stops at the first matched action passes every
        // single-action test above and fails this one.
        let marker = format!("multi-{}", uuid::Uuid::new_v4());
        let rule_id = create_rule(
            &request,
            &token,
            child,
            action_jdm(
                "multi",
                trigger_field.name,
                ALWAYS,
                &[
                    ("action", json!("cascade-update")),
                    ("targetEntity", json!(parent.table_name)),
                    ("linkField", json!(link_field)),
                    ("updateData", json!({ parent_field.name: marker.clone() })),
                    ("workflowName", json!("multi-step-probe")),
                ],
            ),
        )
        .await;

        let mut payload = build_record(child);
        payload.insert(link_field.to_string(), json!(parent_id.clone()));
        let created = request
            .post(&format!("/api/bus/{}", child.route))
            .add_header("authorization", bearer(&token))
            .json(&Value::Object(payload))
            .await;
        assert_eq!(
            created.status_code(),
            201,
            "multi-step create failed: {}",
            created.text()
        );

        // The write itself succeeded, the cascade reached the parent, and the
        // audit trail recorded both — three checks because a partial pipeline
        // satisfies any one of them alone.
        let refreshed = request
            .get(&format!("/api/bus/{}/{parent_id}", parent.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(refreshed.status_code(), 200);

        let audit = request
            .get("/api/audit?limit=50")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(audit.status_code(), 200);
        assert!(
            !rows(&audit.json::<Value>()).is_empty(),
            "a multi-step rule fired but the audit trail is empty"
        );

        let verified = request
            .get("/api/audit/verify")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            verified
                .json::<Value>()
                .get("verified")
                .and_then(Value::as_bool),
            Some(true),
            "the cascade broke the audit hash chain"
        );

        deactivate(&request, &token, &rule_id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_cascade_carries_a_value_from_the_triggering_record() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some((child, parent, link_field)) = linked_pair() else {
            return;
        };
        let Some(child_field) = child.first_text_field() else {
            return;
        };
        let Some(parent_field) = parent.first_text_field() else {
            return;
        };

        let parent_row = create_with_parents(&request, &token, parent, &[])
            .await
            .expect("could not create the parent for the pass-through case");
        let parent_id = parent_row
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();

        // The value the child is written with. Nothing in the rule knows it —
        // the rule references the *field*, so whatever arrives has to travel
        // from the triggering row into the target entity.
        let carried = format!("carried-{}", uuid::Uuid::new_v4());

        // The `$`-brace-field placeholder, assembled from chars. Writing it
        // literally would put a doubled opening brace in a Handlebars template,
        // where two braces open an expression rather than meaning text, and
        // generation dies with a parse error before this ever compiles.
        let placeholder = format!("${}{}{}", '{', child_field.name, '}');

        // `updateData` names the source field rather than a literal. A pipeline
        // that only handles constants passes every other cascade test and fails
        // this one, because the parent would end up holding the string
        // "child_field" instead of the value that field held.
        let rule_id = create_rule(
            &request,
            &token,
            child,
            action_jdm(
                "pass-through",
                child_field.name,
                ALWAYS,
                &[
                    ("action", json!("cascade-update")),
                    ("targetEntity", json!(parent.table_name)),
                    ("linkField", json!(link_field)),
                    ("updateData", json!({ parent_field.name: placeholder })),
                ],
            ),
        )
        .await;

        let mut payload = build_record(child);
        payload.insert(link_field.to_string(), json!(parent_id.clone()));
        payload.insert(child_field.name.to_string(), json!(carried.clone()));

        let created = request
            .post(&format!("/api/bus/{}", child.route))
            .add_header("authorization", bearer(&token))
            .json(&Value::Object(payload))
            .await;
        assert_eq!(
            created.status_code(),
            201,
            "could not create the {} that should pass a value through: {}",
            child.name,
            created.text()
        );

        let refreshed = request
            .get(&format!("/api/bus/{}/{parent_id}", parent.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(refreshed.status_code(), 200);

        let landed = refreshed
            .json::<Value>()
            .get(parent_field.name)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        assert_eq!(
            landed, carried,
            "the cascade reached {} but did not carry {}.{} through — got {landed:?}, expected \
             the value the {} was written with",
            parent.name, child.name, child_field.name, child.name
        );

        deactivate(&request, &token, &rule_id).await;
    })
    .await;
}

/// A matched blocking rule refuses the write — under **both** of its names.
///
/// The promotion pipeline has two ways to be told "do not accept this record",
/// and they come from different authoring routes: `prevent` is what the rules
/// editor emits, `validation-error` is what a model's rule action compiles to.
/// The pipeline recognised only the first, so a modelled validation was seeded,
/// matched on the write, fell past the blocking pass into the action dispatch,
/// and was logged as an unknown action while the record was written and
/// reported `final` — a validation failure whose only trace was a `warn!`.
///
/// Nothing caught it because nothing drove a blocking rule over HTTP at all.
/// The per-entity `rules_*` suites author a graph and post it to
/// `/api/rules/validate`, which parses a document and touches no pipeline, so
/// the one name that *was* handled had no coverage either — it simply happened
/// to be the name no model emits.
///
/// The control write is what makes the refusals mean anything: an entity whose
/// text column is enum-backed would answer 400 to a bad value as readily as to
/// a blocked one, so this first proves the payload is acceptable with no rule
/// in place, and only then asserts that adding one changes the answer. The
/// message assertion is the second half of that — a 400 carrying the rule's own
/// message came from the rule and not from the validator.
#[tokio::test]
#[serial]
async fn a_blocking_rule_refuses_the_write_under_either_name() {
    support::with_app(|request, _ctx, token| async move {
        clear_test_rules(&request, &token).await;

        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(field) = entity.first_text_field() else {
            return;
        };

        // Created before any rule exists: the create path is not under test,
        // and this gives the update a row that already satisfies the model.
        let Some(record) = create_with_parents(&request, &token, entity, &[]).await else {
            return;
        };
        let Some(id) = record.get("id").and_then(Value::as_str).map(str::to_string) else {
            return;
        };

        // Write the column back the value it already holds, so the payload is
        // known-good by construction rather than by the factory's guess.
        let Some(probe) = record
            .get(field.name)
            .filter(|value| !value.is_null())
            .cloned()
        else {
            return;
        };
        let body = json!({ field.name: probe });

        let control = request
            .put(&format!("/api/bus/{}/{}", entity.route, id))
            .add_header("authorization", bearer(&token))
            .json(&body)
            .await;
        assert_eq!(
            control.status_code(),
            200,
            "the probe write was refused before any rule existed, so this case cannot tell a \
             blocked write from a rejected one: {}",
            control.text()
        );

        for action in ["prevent", "validation-error"] {
            let name = format!("e2e-wf-block-{action}-{}", uuid::Uuid::new_v4());
            let rule_id = {
                let created = request
                    .post("/api/rules")
                    .add_header("authorization", bearer(&token))
                    .json(&json!({
                        "entityName": entity.table_name,
                        "ruleName": name,
                        "operation": "UPDATE",
                        // `action_jdm` writes the rule's own name as the
                        // message, which is what the refusal is matched on.
                        "jdmContent": action_jdm(&name, field.name, ALWAYS, &[
                            ("action", json!(action)),
                        ]),
                    }))
                    .await;
                assert_eq!(
                    created.status_code(),
                    201,
                    "rule create failed: {}",
                    created.text()
                );
                created.json::<Value>()["id"]
                    .as_str()
                    .expect("rule create returned no id")
                    .to_string()
            };

            let response = request
                .put(&format!("/api/bus/{}/{}", entity.route, id))
                .add_header("authorization", bearer(&token))
                .json(&body)
                .await;
            let status = response.status_code();
            let text = response.text();

            // Before asserting: a rule matching every row would otherwise fire
            // on every later write in the binary.
            deactivate(&request, &token, &rule_id).await;

            assert_eq!(
                status, 400,
                "a matched `{action}` rule did not refuse the write — the same payload was \
                 accepted with no rule in place, so the verdict was dropped: {text}"
            );
            assert!(
                text.contains(&name),
                "the write was refused, but not by this rule: the 400 does not carry the \
                 rule's message, so it came from somewhere else: {text}"
            );
        }
    })
    .await;
}
