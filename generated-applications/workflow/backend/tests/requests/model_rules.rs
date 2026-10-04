//! The rules the *model* declared, and whether they reached the application.
//!
//! Generated: 2026-10-04T01:13:13.813Z
//! Project: workflow
//!
//! Every other rules suite creates a rule through the API and then checks that
//! the API has it — which proves the endpoint round-trips and nothing else. A
//! rule that the generator compiled, wrote to `seed/rules.sql`, and
//! never applied would pass all of them: `sys_rule_definitions` existed, the
//! controller read it, the admin editor edited it, and for a long time nothing
//! ever put a model's row in it.
//!
//! So this asserts against the **model**, not against what the application
//! happens to contain. The expectations below are rendered from
//! `compiledRules`, the same list the seed is written from — which is the point
//! the assertion can be made at all: a rule dropped anywhere between the
//! rule and the database leaves the seed short, and this suite names it.

use serde_json::Value;
use serial_test::serial;

use crate::support::{self, bearer};

/// `(rule_name, entity_name, operation)` for every rule the model declares.
const MODEL_RULES: &[(&str, &str, &str)] = &[
    (
        "partyRoleInvariantsBeforeCreate",
        "bus_party_role",
        "CREATE",
    ),
    (
        "partyRoleInvariantsBeforeUpdate",
        "bus_party_role",
        "UPDATE",
    ),
    ("addressInvariantsBeforeCreate", "bus_address", "CREATE"),
    ("addressInvariantsBeforeUpdate", "bus_address", "UPDATE"),
    (
        "exchangeRateInvariantsBeforeCreate",
        "bus_exchange_rate",
        "CREATE",
    ),
    (
        "exchangeRateInvariantsBeforeUpdate",
        "bus_exchange_rate",
        "UPDATE",
    ),
    ("taskInvariantsBeforeCreate", "bus_task", "CREATE"),
    ("taskInvariantsBeforeUpdate", "bus_task", "UPDATE"),
    (
        "businessProcessInvariantsBeforeCreate",
        "bus_business_process",
        "CREATE",
    ),
    (
        "businessProcessInvariantsBeforeUpdate",
        "bus_business_process",
        "UPDATE",
    ),
    ("partyWorkflowsAfterUpdate", "bus_party", "UPDATE"),
    (
        "exchangeRateWorkflowsAfterUpdate",
        "bus_exchange_rate",
        "UPDATE",
    ),
    (
        "processDefinitionWorkflowsAfterUpdate",
        "bus_process_definition",
        "UPDATE",
    ),
    (
        "processInstanceWorkflowsAfterUpdate",
        "bus_process_instance",
        "UPDATE",
    ),
];

/// Every rule reached `sys_rule_definitions`, bound to the physical
/// table and with JDM the engine can parse.
#[tokio::test]
#[serial]
async fn every_rule_the_model_declares_was_seeded() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/rules")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            response.status_code(),
            200,
            "GET /api/rules: {}",
            response.text()
        );

        let body = response.json::<Value>();
        let rows = body.as_array().cloned().unwrap_or_default();

        let mut missing: Vec<String> = Vec::new();
        let mut misbound: Vec<String> = Vec::new();
        let mut unparsable: Vec<String> = Vec::new();

        for (name, table, operation) in MODEL_RULES {
            let Some(row) = rows
                .iter()
                .find(|row| row.get("ruleName").and_then(Value::as_str) == Some(*name))
            else {
                missing.push((*name).to_string());
                continue;
            };

            // The physical table, not the ERD name. `load_entity_jdms` binds
            // `meta.table_name` when it looks a rule up on a business write, so
            // a rule stored under `Deal` rather than `bus_deal` is listed,
            // active, and dead.
            let stored_table = row.get("entityName").and_then(Value::as_str).unwrap_or("");
            let stored_operation = row.get("operation").and_then(Value::as_str).unwrap_or("");
            if stored_table != *table || stored_operation != *operation {
                misbound.push(format!(
                    "{name}: expected {table}/{operation}, stored {stored_table}/{stored_operation}"
                ));
            }

            // The JDM is a string column holding JSON. A document that does not
            // parse is a rule the engine skips at run time with a log line
            // nobody reads.
            let jdm = row.get("jdmContent").and_then(Value::as_str).unwrap_or("");
            match serde_json::from_str::<Value>(jdm) {
                Ok(graph)
                    if graph
                        .get("nodes")
                        .and_then(Value::as_array)
                        .is_some_and(|n| !n.is_empty()) => {}
                Ok(_) => unparsable.push(format!("{name}: JDM has no nodes")),
                Err(error) => unparsable.push(format!("{name}: {error}")),
            }
        }

        assert!(
            missing.is_empty(),
            "the model declares these rules and the application has none of them — \
             seed/rules.sql was generated but never applied: {missing:?}"
        );
        assert!(
            misbound.is_empty(),
            "rules bound to the wrong table or operation: {misbound:#?}"
        );
        assert!(
            unparsable.is_empty(),
            "rules whose JDM the engine cannot read: {unparsable:#?}"
        );
    })
    .await;
}

/// Seeding twice does not duplicate a rule, and does not touch one that is
/// already there.
///
/// `seed_rules` conflicts on `(entity_name, operation, rule_name)` and updates
/// only when `appwithai.rules_overwrite` is on, which the task does not set. An
/// unchanged `version` is what says the conflict was skipped rather than taken,
/// which is what lets `cargo loco db seed` be re-run against a database an
/// administrator has been editing.
///
/// The version is compared against itself before and after rather than against
/// 1: these suites share one database and deliberately leave their rows behind,
/// so by the time this runs another test may legitimately have migrated the
/// rule. What must not change is the version across *this* re-seed.
#[tokio::test]
#[serial]
async fn re_seeding_leaves_an_existing_rule_alone() {
    support::with_app(|request, ctx, token| async move {
        use loco_rs::task::{Task, Vars};

        let versions = |token: String| {
            let request = &request;
            async move {
                let body = request
                    .get("/api/rules")
                    .add_header("authorization", bearer(&token))
                    .await
                    .json::<Value>();
                let rows = body.as_array().cloned().unwrap_or_default();
                MODEL_RULES
                    .iter()
                    .map(|(name, _, _)| {
                        let matching: Vec<&Value> = rows
                            .iter()
                            .filter(|row| {
                                row.get("ruleName").and_then(Value::as_str) == Some(*name)
                            })
                            .collect();
                        (
                            *name,
                            matching.len(),
                            matching
                                .first()
                                .and_then(|row| row.get("version"))
                                .and_then(Value::as_i64),
                        )
                    })
                    .collect::<Vec<_>>()
            }
        };

        let before = versions(token.clone()).await;

        workflow::tasks::seed_rules::SeedRules
            .run(&ctx, &Vars::default())
            .await
            .expect("re-running seed_rules");

        let after = versions(token.clone()).await;

        for ((name, count, version), (_, count_after, version_after)) in
            before.iter().zip(after.iter())
        {
            assert_eq!(
                *count, 1,
                "{name} was listed {count} times before the re-seed"
            );
            assert_eq!(*count_after, 1, "{name} was seeded a second time");
            assert_eq!(
                version, version_after,
                "{name} was overwritten by a re-seed; the conflict clause is not conditional"
            );
        }
    })
    .await;
}
/// `POST /api/rules/migrate` puts the model's version back.
///
/// The other half of the seed's conflict clause, and the half that makes the
/// non-destructive half safe to choose. Without it a model whose rule
/// changed could never reach a database that already held the old one, and
/// "seeding does not overwrite" would mean "a rule can only ever be edited by
/// hand".
#[tokio::test]
#[serial]
async fn migrating_replaces_an_edited_rule_with_the_model_version() {
    support::with_app(|request, _ctx, token| async move {
        let Some((name, _, _)) = MODEL_RULES.first() else {
            return;
        };

        let listed = request
            .get("/api/rules")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        let rule = listed
            .as_array()
            .and_then(|rows| {
                rows.iter()
                    .find(|row| row.get("ruleName").and_then(Value::as_str) == Some(*name))
            })
            .cloned()
            .expect("the model's first rule was seeded");

        let id = rule["id"].as_str().expect("rule id").to_string();
        let original = rule["jdmContent"].as_str().expect("rule jdm").to_string();

        // Edit it the way an administrator would, through the API.
        let edited = r#"{"nodes":[{"id":"input","name":"Edited","type":"inputNode"}],"edges":[]}"#;
        let saved = request
            .put(&format!("/api/rules/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({ "jdmContent": edited }))
            .await;
        assert!(
            saved.status_code().is_success(),
            "editing the rule: {}",
            saved.text()
        );

        let migrated = request
            .post("/api/rules/migrate")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(migrated.status_code(), 200, "migrate: {}", migrated.text());
        assert!(
            migrated.json::<Value>()["migrated"].as_i64().unwrap_or(0) >= 1,
            "migrate reported replacing nothing, having just been given something to replace"
        );

        let after = request
            .get(&format!("/api/rules/{id}"))
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        assert_eq!(
            after["jdmContent"].as_str(),
            Some(original.as_str()),
            "migrate left the edited rule in place; the overwrite setting is not reaching the seed"
        );
    })
    .await;
}
