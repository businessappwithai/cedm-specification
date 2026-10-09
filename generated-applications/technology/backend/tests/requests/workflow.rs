//! Workflow definitions, runs, and the audit trail they write.
//!
//! Generated: 2026-10-09T08:33:11.948Z
//! Project: technology

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, entities::ENTITIES, factory::create_with_parents, rows};

/// The smallest BPMN the executor will accept: start, one task, end.
fn minimal_bpmn(name: &str) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="defs-{name}">
  <bpmn:process id="{name}" isExecutable="true">
    <bpmn:startEvent id="start" />
    <bpmn:serviceTask id="task" name="noop" />
    <bpmn:endEvent id="end" />
    <bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="task" />
    <bpmn:sequenceFlow id="f2" sourceRef="task" targetRef="end" />
  </bpmn:process>
</bpmn:definitions>"#
    )
}

#[tokio::test]
#[serial]
async fn creates_lists_and_executes_a_workflow_definition() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let name = format!("e2e-wf-{}", uuid::Uuid::new_v4());

        let created = request
            .post("/api/workflow")
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "name": name,
                "entityName": entity.table_name,
                "operation": "ALL",
                "bpmnXml": minimal_bpmn("probe"),
            }))
            .await;

        assert_eq!(
            created.status_code(),
            201,
            "workflow create failed: {}",
            created.text()
        );
        let id = created
            .json::<Value>()
            .get("id")
            .and_then(Value::as_str)
            .expect("workflow create returned no id")
            .to_string();

        // The designer reads the plural alias; both spellings are in the
        // frontend and both have to resolve.
        let listed = request
            .get("/api/workflow-definitions")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(listed.status_code(), 200);

        let executed = request
            .post(&format!("/api/workflow/{id}/execute"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "entityData": {} }))
            .await;
        assert!(
            !executed.status_code().is_server_error(),
            "execute returned {}: {}",
            executed.status_code(),
            executed.text()
        );

        // Every run is recorded, successful or not — the run log is the
        // operator's only view into what a workflow actually did.
        let runs = request
            .get("/api/workflows/runs?limit=10")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(runs.status_code(), 200);
        assert!(
            runs.json::<Value>().as_array().is_some(),
            "runs should be an array"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_a_definition_whose_bpmn_does_not_parse() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };

        let response = request
            .post("/api/workflow")
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "name": "broken",
                "entityName": entity.table_name,
                "bpmnXml": "<not-bpmn>",
            }))
            .await;

        // Catching it at write time beats discovering it when a user's save
        // fails for a reason that has nothing to do with what they typed.
        assert!(response.status_code().is_client_error());
    })
    .await;
}

/// An automation as the automations screen writes it: the YAML document of
/// the automation's own model.
fn automation_yaml(entity: &str, name: &str) -> String {
    format!(
        "automation: \"1.0\"\nname: {name}\nkind: automation\ntrigger:\n  entity: {entity}\n  event: created\n\
         conditions: []\nloops: []\nsteps:\n  - id: s1\n    type: UpdateEntity\n    resultName: ''\n    \
         props:\n      field: status\n      value: reviewed\nhooks: []\nstatus: draft\n"
    )
}

#[tokio::test]
#[serial]
async fn stores_an_automation_as_its_yaml_document() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let name = format!("e2e-auto-{}", uuid::Uuid::new_v4());
        let definition = automation_yaml(entity.table_name, &name);

        let created = request
            .post("/api/workflow-definitions")
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "kind": "automation",
                "name": name,
                "entityName": entity.table_name,
                "definition": definition,
            }))
            .await;
        assert_eq!(
            created.status_code(),
            201,
            "automation create failed: {}",
            created.text()
        );
        let row = created.json::<Value>();
        let id = row["id"]
            .as_str()
            .expect("automation create returned no id")
            .to_string();
        assert_eq!(row["kind"], "automation");
        assert_eq!(row["definition_yaml"], definition.as_str());
        assert!(row["bpmn_xml"].is_null(), "an automation carries no BPMN");

        // The screen lists automations alone; a diagram list must not show one.
        let automations = request
            .get("/api/workflow-definitions?kind=automation")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        assert!(
            automations
                .as_array()
                .is_some_and(|rows| rows.iter().any(|r| r["id"] == id.as_str())),
            "the automation is missing from ?kind=automation"
        );
        let diagrams = request
            .get("/api/workflow-definitions?kind=bpmn")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        assert!(
            !diagrams
                .as_array()
                .is_some_and(|rows| rows.iter().any(|r| r["id"] == id.as_str())),
            "an automation was listed as a diagram"
        );

        // Publishing sends the edited document; it replaces the stored one.
        let edited = definition.replace("status: draft", "status: live");
        let updated = request
            .put(&format!("/api/workflow-definitions/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "definition": edited, "isActive": true }))
            .await;
        assert_eq!(
            updated.status_code(),
            200,
            "automation update failed: {}",
            updated.text()
        );
        assert_eq!(updated.json::<Value>()["definition_yaml"], edited.as_str());

        // The execute endpoint runs BPMN; an automation has none, and saying so
        // is a 400, not a 500 from decoding a NULL diagram.
        let executed = request
            .post(&format!("/api/workflow/{id}/execute"))
            .add_header("authorization", bearer(&token))
            .json(&json!({}))
            .await;
        assert_eq!(
            executed.status_code(),
            400,
            "execute on an automation: {}",
            executed.text()
        );

        let removed = request
            .delete(&format!("/api/workflow-definitions/{id}"))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(removed.status_code(), 204);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn refuses_an_automation_that_is_not_an_automation_document() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let valid = automation_yaml(entity.table_name, "probe");

        for (label, definition) in [
            ("not YAML", "automation: [unclosed".to_string()),
            (
                "wrong version",
                valid.replace("automation: \"1.0\"", "automation: \"9.9\""),
            ),
            (
                "no entity",
                valid.replace(&format!("  entity: {}\n", entity.table_name), ""),
            ),
            (
                "steps not a list",
                valid.replace("steps:\n  - id: s1", "steps: nope\nextra:\n  - id: s1"),
            ),
        ] {
            let response = request
                .post("/api/workflow-definitions")
                .add_header("authorization", bearer(&token))
                .json(&json!({
                    "kind": "automation",
                    "name": format!("e2e-bad-{label}"),
                    "entityName": entity.table_name,
                    "definition": definition,
                }))
                .await;
            assert_eq!(
                response.status_code(),
                400,
                "{label}: expected a refusal, got {}: {}",
                response.status_code(),
                response.text()
            );
        }

        let unknown_kind = request
            .post("/api/workflow-definitions")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "kind": "script", "name": "x", "entityName": entity.table_name }))
            .await;
        assert_eq!(unknown_kind.status_code(), 400);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn audits_a_business_write_and_verifies_the_chain() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };

        create_with_parents(&request, &token, entity, &[])
            .await
            .expect("could not create a record to audit");

        let log = request
            .get("/api/audit?limit=50")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(log.status_code(), 200);
        assert!(
            !rows(&log.json::<Value>()).is_empty(),
            "a write left no audit entry"
        );

        let types = request
            .get("/api/audit/entity-types")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(types.status_code(), 200);

        // The chain is the tamper evidence: if it does not verify, the log
        // cannot be trusted to say what happened.
        let verified = request
            .get("/api/audit/verify")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(verified.status_code(), 200);
        assert_eq!(
            verified
                .json::<Value>()
                .get("verified")
                .and_then(Value::as_bool),
            Some(true),
            "the audit hash chain does not verify"
        );
    })
    .await;
}
