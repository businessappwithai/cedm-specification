//! Business rules — LocationStatus
//!
//! Authors a JDM decision graph for the entity, checks it evaluates, then
//! checks it actually governs a write. A rule that evaluates but does not
//! change what the API accepts is not enforcing anything.
//!
//! Generated: 2026-10-09T15:28:28.004Z
//! Project: education

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{
    self, bearer,
    entities::entity,
    factory::{build_record, create_with_parents},
};

const ENTITY: &str = "LocationStatus";

/// A decision graph that prevents a write when `field` is negative.
///
/// The shape is GoRules JDM: an input node, a decision table, an output node.
/// `zen-engine` evaluates it in the promotion pipeline on every business write.
fn prevent_negative_jdm(rule_name: &str, field: &str) -> String {
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
                    "outputs": [
                        { "id": "o1", "field": "action", "name": "action" },
                        { "id": "o2", "field": "message", "name": "message" }
                    ],
                    "rules": [{
                        "_id": "r1",
                        "i1": "< 0",
                        "o1": "\"prevent\"",
                        "o2": "\"negative values are not allowed\""
                    }]
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

#[tokio::test]
#[serial]
async fn validates_the_jdm_it_builds() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let Some(numeric) = meta.first_numeric_field() else {
            return;
        };

        let response = request
            .post("/api/rules/validate")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "jdmContent": prevent_negative_jdm("probe", numeric.name) }))
            .await;

        // `/api/rules/validate` is a pure function of its body — it parses the
        // JDM and touches no database and no shared state — so a failure here
        // is almost never about the JDM. It is the request not arriving intact:
        // an expired or rejected token, or the app failing to come up. Both
        // assertions therefore report what actually came back, because this
        // test has failed once without leaving enough evidence to say which.
        let status = response.status_code();
        let body = response.text();
        assert_eq!(
            status, 200,
            "POST /api/rules/validate returned {status}, body: {body}"
        );
        assert_eq!(
            serde_json::from_str::<Value>(&body)
                .ok()
                .and_then(|v| v.get("valid").and_then(Value::as_bool)),
            Some(true),
            "the suite's own JDM does not parse — the test would prove nothing. body: {body}"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_malformed_jdm_without_failing_the_request() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .post("/api/rules/validate")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "jdmContent": "{ not json" }))
            .await;

        // The editor asks this on every keystroke against a half-typed
        // document: an invalid graph is an answer, not an error.
        assert_eq!(response.status_code(), 200);
        assert_eq!(
            response
                .json::<Value>()
                .get("valid")
                .and_then(Value::as_bool),
            Some(false)
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn creates_evaluates_and_enforces_a_rule() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let Some(numeric) = meta.first_numeric_field() else {
            return;
        };

        let rule_name = format!("e2e-{}-{}", meta.table_name, uuid::Uuid::new_v4());
        let created = request
            .post("/api/rules")
            .add_header("authorization", bearer(&token))
            .json(&json!({
                "entityName": meta.table_name,
                "ruleName": rule_name,
                "operation": "CREATE",
                "jdmContent": prevent_negative_jdm(&rule_name, numeric.name),
            }))
            .await;

        assert_eq!(
            created.status_code(),
            201,
            "rule create failed: {}",
            created.text()
        );
        let rule_id = created
            .json::<Value>()
            .get("id")
            .and_then(Value::as_str)
            .expect("rule create returned no id")
            .to_string();

        // A dry run must not touch data.
        let before = request
            .get(&format!("/api/bus/{}?limit=1", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        let before_total = support::total(&before.json::<Value>());

        let dry_run = request
            .post("/api/rules/dry-run")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "ruleId": rule_id, "testData": { numeric.name: -1 } }))
            .await;
        assert_eq!(dry_run.status_code(), 200);
        assert_eq!(
            dry_run
                .json::<Value>()
                .get("matched")
                .and_then(Value::as_bool),
            Some(true),
            "a negative value should match the rule"
        );

        let after = request
            .get(&format!("/api/bus/{}?limit=1", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            support::total(&after.json::<Value>()),
            before_total,
            "a dry run wrote a record"
        );

        // And the rule has to govern a real write, not just evaluate.
        let mut payload = build_record(meta);
        payload.insert(numeric.name.to_string(), json!(-1));
        for fk in meta.foreign_keys() {
            if let Some(parent) = crate::support::entities::parent_of(fk) {
                if let Some(row) = create_with_parents(&request, &token, parent, &[]).await {
                    if let Some(id) = row.get("id").and_then(Value::as_str) {
                        payload.insert(fk.name.to_string(), json!(id));
                    }
                }
            }
        }

        let blocked = request
            .post(&format!("/api/bus/{}", meta.route))
            .add_header("authorization", bearer(&token))
            .json(&Value::Object(payload))
            .await;

        assert!(
            blocked.status_code().is_client_error(),
            "a `prevent` verdict must fail the request — got {}: {}",
            blocked.status_code(),
            blocked.text()
        );

        // Deactivating stops the enforcement.
        let removed = request
            .delete(&format!("/api/rules/{rule_id}"))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(removed.status_code(), 204);

        let listed = request
            .get(&format!(
                "/api/rules?entityName={}&isActive=true",
                meta.table_name
            ))
            .add_header("authorization", bearer(&token))
            .await;
        let still_active = listed
            .json::<Value>()
            .as_array()
            .map(|rules| {
                rules
                    .iter()
                    .any(|r| r.get("id").and_then(Value::as_str) == Some(rule_id.as_str()))
            })
            .unwrap_or(false);
        assert!(
            !still_active,
            "a deactivated rule is still listed as active"
        );
    })
    .await;
}
