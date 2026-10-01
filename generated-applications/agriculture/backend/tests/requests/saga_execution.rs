//! A model-declared saga, actually executed.
//!
//! Everything else about saga steps can pass while the feature does nothing: the
//! compiler can emit BPMN, the seed can install it, the designer can list it,
//! and the executor can still refuse every task at run time. This is the case
//! that closes that gap — it runs the workflow the model declared and looks at
//! the *other* table.
//!
//! Deliberately model-agnostic. It reads the seeded definition rather than
//! naming an entity, so it exercises whatever saga the model happens to
//! declare and skips cleanly when it declares none. Hard-coding this project's
//! entities would make the test useless for every other model the generator
//! serves.
//!
//! The foreign-key chain a saga's entity needs is not restated here either:
//! `factory::create_with_parents` already creates parents recursively, which is
//! the same machinery the CRUD suites use.
//!
//! Generated: 2026-10-01T12:57:50.206Z
//! Project: agriculture

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{
    self, bearer,
    entities::{entity_by_table, ENTITIES},
    factory::create_with_parents,
    rows,
};

/// The seeded model-managed workflow, if the model declared one.
fn model_workflow(body: &Value) -> Option<&Value> {
    body.as_array()?
        .iter()
        .find(|w| w.get("is_model_managed").and_then(Value::as_bool) == Some(true))
}

/// Tables a `CreateEntity` step in this BPMN writes to.
///
/// Parsed out of the stored document rather than assumed, so the assertion
/// follows whatever the model asked for.
fn create_targets(bpmn: &str) -> Vec<String> {
    let mut targets = Vec::new();
    let mut rest = bpmn;

    // Each service task carries its properties as `appwithai:property`
    // elements; a CreateEntity task is one whose nodeType says so, and its
    // `entity` property names the table.
    while let Some(start) = rest.find("<bpmn:serviceTask") {
        let task_end = rest[start..]
            .find("</bpmn:serviceTask>")
            .map_or(rest.len(), |offset| start + offset);
        let task = &rest[start..task_end];

        if task.contains(r#"name="nodeType" value="CreateEntity""#) {
            if let Some(pos) = task.find(r#"name="entity" value=""#) {
                let after = &task[pos + r#"name="entity" value=""#.len()..];
                if let Some(quote) = after.find('"') {
                    targets.push(after[..quote].to_string());
                }
            }
        }
        rest = &rest[task_end.min(rest.len())..];
        if rest.starts_with("</bpmn:serviceTask>") {
            rest = &rest["</bpmn:serviceTask>".len()..];
        }
    }
    targets
}

async fn count_rows(request: &loco_rs::TestServer, token: &str, route: &str) -> u64 {
    let response = request
        .get(&format!("/api/bus/{route}?limit=1"))
        .add_header("authorization", bearer(token))
        .await;
    support::total(&response.json::<Value>())
}

#[tokio::test]
#[serial]
async fn a_model_declared_saga_runs_and_writes_to_another_entity() {
    support::with_app(|request, _ctx, token| async move {
        let listed = request
            .get("/api/workflow")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            listed.status_code(),
            200,
            "workflow list failed: {}",
            listed.text()
        );

        let body = listed.json::<Value>();
        let Some(workflow) = model_workflow(&body) else {
            // The model declares no saga; there is nothing to prove here.
            return;
        };

        let id = workflow
            .get("id")
            .and_then(Value::as_str)
            .expect("workflow has no id");
        let bound = workflow
            .get("entity_name")
            .and_then(Value::as_str)
            .expect("workflow names no entity");
        let bpmn = workflow
            .get("bpmn_xml")
            .and_then(Value::as_str)
            .expect("workflow carries no BPMN");

        // The saga must have compiled to something. A definition with no
        // service tasks would pass every assertion below by doing nothing.
        assert!(
            bpmn.contains("<bpmn:serviceTask"),
            "the seeded saga has no service tasks — the compiler emitted an empty process"
        );

        // Resolve the bound entity through the registry, tolerating either the
        // ERD name or the physical table, since a model may write either.
        let meta = entity_by_table(bound)
            .or_else(|| ENTITIES.iter().find(|e| e.name == bound))
            .or_else(|| entity_by_table(&format!("bus_{}", bound.to_lowercase())))
            .unwrap_or_else(|| panic!("saga is bound to unknown entity '{bound}'"));

        // The record that triggers the run, with its parents created for it.
        let trigger = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create the {} the saga runs on", meta.name));
        let trigger_id = trigger
            .get("id")
            .and_then(Value::as_str)
            .expect("created record has no id")
            .to_string();

        // Row counts before, for every table a CreateEntity step targets.
        let targets = create_targets(bpmn);
        let mut before = Vec::new();
        for table in &targets {
            let route = entity_by_table(table).map_or(table.clone(), |e| e.route.to_string());
            before.push((route.clone(), count_rows(&request, &token, &route).await));
        }

        let executed = request
            .post(&format!("/api/workflow/{id}/execute"))
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "entityId": trigger_id,
                "entityData": trigger.clone(),
                "decision": {},
            }))
            .await;

        assert!(
            executed.status_code().is_success(),
            "the model's saga failed to run: {} {}",
            executed.status_code(),
            executed.text()
        );

        let outcome = executed.json::<Value>();
        assert_eq!(
            outcome.get("status").and_then(Value::as_str),
            Some("completed"),
            "the saga did not complete: {outcome}"
        );
        assert!(
            outcome
                .get("tasksExecuted")
                .and_then(Value::as_u64)
                .unwrap_or(0)
                > 0,
            "the saga reported success having executed no tasks — {outcome}"
        );

        // A Formula step writes into the run's variables. If the model has one,
        // its output is the cheapest proof that steps really ran rather than
        // being skipped as unknown node types.
        if bpmn.contains(r#"name="nodeType" value="Formula""#) {
            let vars = outcome.get("vars").and_then(Value::as_object);
            assert!(
                vars.is_some_and(|v| !v.is_empty()),
                "the saga has a Formula step but produced no variables — {outcome}"
            );
        }

        // The point of the whole feature: a row in a *different* table.
        for (route, count) in before {
            let after = count_rows(&request, &token, &route).await;
            assert!(
                after > count,
                "the saga has a CreateEntity step targeting {route}, but the table \
                 still holds {count} rows — the step did not write"
            );
        }

        // And the run is visible to an operator.
        let runs = request
            .get("/api/workflows/runs?limit=50")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(runs.status_code(), 200);
        let logged = runs.json::<Value>();
        let found = logged
            .as_array()
            .map(|entries| {
                entries.iter().any(|entry| {
                    entry.get("entity_id").and_then(Value::as_str) == Some(trigger_id.as_str())
                })
            })
            .unwrap_or(false);
        assert!(found, "the saga ran but left no entry in the run log");

        let _ = rows(&Value::Null);
    })
    .await;
}
