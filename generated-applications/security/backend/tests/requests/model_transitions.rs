//! The state machines the *model* drew, and whether the API enforces them.
//!
//! Generated: 2026-10-09T08:32:58.182Z
//! Project: security
//!
//! `requests/rbac.rs` proves the topology guard works by seeding an edge of its
//! own. This proves the edges the model declared actually reached the database
//! — the same distinction as `model_rules.rs`: a diagram the generator compiled
//! and never seeded leaves a status column accepting any string, and every
//! other suite passes, because none of them tries an illegitimate move.

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, entities::entity, factory::create_with_parents, if_match};

/// `(table, statusField, from, to)` for every edge the model draws.
const MODEL_EDGES: &[(&str, &str, &str, &str)] = &[
    ("bus_party", "status", "ACTIVE", "INACTIVE"),
    ("bus_party", "status", "INACTIVE", "ACTIVE"),
    ("bus_party", "status", "ACTIVE", "BLOCKED"),
    ("bus_party", "status", "BLOCKED", "ACTIVE"),
    ("bus_party", "status", "ACTIVE", "RETIRED"),
    ("bus_party", "status", "INACTIVE", "RETIRED"),
    ("bus_party", "status", "BLOCKED", "RETIRED"),
    ("bus_organization", "status", "DRAFT", "ACTIVE"),
    ("bus_organization", "status", "ACTIVE", "INACTIVE"),
    ("bus_organization", "status", "INACTIVE", "ACTIVE"),
    ("bus_organization", "status", "DRAFT", "RETIRED"),
    ("bus_organization", "status", "ACTIVE", "RETIRED"),
    ("bus_organization", "status", "INACTIVE", "RETIRED"),
    ("bus_party_role", "status", "ACTIVE", "INACTIVE"),
    ("bus_party_role", "status", "INACTIVE", "ACTIVE"),
    ("bus_party_role", "status", "ACTIVE", "EXPIRED"),
    ("bus_party_role", "status", "INACTIVE", "EXPIRED"),
    ("bus_address", "status", "ACTIVE", "INACTIVE"),
    ("bus_address", "status", "INACTIVE", "ACTIVE"),
    ("bus_address", "status", "ACTIVE", "RETIRED"),
    ("bus_address", "status", "INACTIVE", "RETIRED"),
    ("bus_location", "status", "PLANNED", "ACTIVE"),
    ("bus_location", "status", "ACTIVE", "CLOSED"),
    ("bus_location", "status", "ACTIVE", "INACTIVE"),
    ("bus_location", "status", "INACTIVE", "ACTIVE"),
    ("bus_location", "status", "PLANNED", "RETIRED"),
    ("bus_location", "status", "ACTIVE", "RETIRED"),
    ("bus_location", "status", "INACTIVE", "RETIRED"),
    ("bus_currency", "status", "ACTIVE", "INACTIVE"),
    ("bus_currency", "status", "INACTIVE", "ACTIVE"),
    ("bus_currency", "status", "ACTIVE", "RETIRED"),
    ("bus_currency", "status", "INACTIVE", "RETIRED"),
    ("bus_exchange_rate", "status", "DRAFT", "ACTIVE"),
    ("bus_exchange_rate", "status", "ACTIVE", "EXPIRED"),
    ("bus_exchange_rate", "status", "DRAFT", "CANCELLED"),
    ("bus_exchange_rate", "status", "ACTIVE", "CANCELLED"),
    ("bus_unit_of_measure", "status", "ACTIVE", "INACTIVE"),
    ("bus_unit_of_measure", "status", "INACTIVE", "ACTIVE"),
    ("bus_unit_of_measure", "status", "ACTIVE", "RETIRED"),
    ("bus_unit_of_measure", "status", "INACTIVE", "RETIRED"),
    ("bus_task", "status", "CREATED", "READY"),
    ("bus_task", "status", "READY", "ASSIGNED"),
    ("bus_task", "status", "ASSIGNED", "IN_PROGRESS"),
    ("bus_task", "status", "IN_PROGRESS", "COMPLETED"),
    ("bus_task", "status", "READY", "BLOCKED"),
    ("bus_task", "status", "BLOCKED", "READY"),
    ("bus_task", "status", "ASSIGNED", "BLOCKED"),
    ("bus_task", "status", "BLOCKED", "ASSIGNED"),
    ("bus_task", "status", "IN_PROGRESS", "BLOCKED"),
    ("bus_task", "status", "BLOCKED", "IN_PROGRESS"),
    ("bus_task", "status", "CREATED", "CANCELLED"),
    ("bus_task", "status", "READY", "CANCELLED"),
    ("bus_task", "status", "ASSIGNED", "CANCELLED"),
    ("bus_task", "status", "IN_PROGRESS", "CANCELLED"),
    ("bus_task", "status", "BLOCKED", "CANCELLED"),
    ("bus_task", "status", "READY", "FAILED"),
    ("bus_task", "status", "ASSIGNED", "FAILED"),
    ("bus_task", "status", "IN_PROGRESS", "FAILED"),
    ("bus_task", "status", "BLOCKED", "FAILED"),
    ("bus_user", "status", "PENDING", "ACTIVE"),
    ("bus_user", "status", "ACTIVE", "LOCKED"),
    ("bus_user", "status", "LOCKED", "ACTIVE"),
    ("bus_user", "status", "ACTIVE", "DISABLED"),
    ("bus_user", "status", "DISABLED", "ACTIVE"),
    ("bus_user", "status", "PENDING", "RETIRED"),
    ("bus_user", "status", "ACTIVE", "RETIRED"),
    ("bus_user", "status", "LOCKED", "RETIRED"),
    ("bus_user", "status", "DISABLED", "RETIRED"),
    ("bus_identity", "status", "ACTIVE", "SUSPENDED"),
    ("bus_identity", "status", "SUSPENDED", "ACTIVE"),
    ("bus_identity", "status", "ACTIVE", "REVOKED"),
    ("bus_identity", "status", "SUSPENDED", "REVOKED"),
    ("bus_identity", "status", "ACTIVE", "EXPIRED"),
    ("bus_identity", "status", "SUSPENDED", "EXPIRED"),
    ("bus_role", "status", "DRAFT", "ACTIVE"),
    ("bus_role", "status", "ACTIVE", "INACTIVE"),
    ("bus_role", "status", "INACTIVE", "ACTIVE"),
    ("bus_role", "status", "DRAFT", "RETIRED"),
    ("bus_role", "status", "ACTIVE", "RETIRED"),
    ("bus_role", "status", "INACTIVE", "RETIRED"),
    ("bus_permission", "status", "ACTIVE", "INACTIVE"),
    ("bus_permission", "status", "INACTIVE", "ACTIVE"),
    ("bus_permission", "status", "ACTIVE", "RETIRED"),
    ("bus_permission", "status", "INACTIVE", "RETIRED"),
    ("bus_access_grant", "status", "PENDING", "ACTIVE"),
    ("bus_access_grant", "status", "ACTIVE", "COMPLETED"),
    ("bus_access_grant", "status", "PENDING", "CANCELLED"),
    ("bus_access_grant", "status", "ACTIVE", "CANCELLED"),
    ("bus_security_incident", "status", "OPEN", "INVESTIGATING"),
    (
        "bus_security_incident",
        "status",
        "INVESTIGATING",
        "CONTAINED",
    ),
    (
        "bus_security_incident",
        "status",
        "CONTAINED",
        "INVESTIGATING",
    ),
    (
        "bus_security_incident",
        "status",
        "INVESTIGATING",
        "RESOLVED",
    ),
    ("bus_security_incident", "status", "CONTAINED", "RESOLVED"),
    ("bus_security_incident", "status", "RESOLVED", "CLOSED"),
];

/// The entity and starting state of the first machine, for the live check.
const FIRST_MACHINE: (&str, &str, &str) = ("Party", "status", "ACTIVE");

/// Every edge the diagram draws reached `sys_workflow_transitions`.
#[tokio::test]
#[serial]
async fn every_edge_the_model_draws_was_seeded() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/workflows/transitions")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            response.status_code(),
            200,
            "GET /api/workflows/transitions: {}",
            response.text()
        );

        let body = response.json::<Value>();
        let rows = body.as_array().cloned().unwrap_or_default();
        let has = |table: &str, field: &str, from: &str, to: &str| {
            rows.iter().any(|row| {
                row.get("tableName").and_then(Value::as_str) == Some(table)
                    && row.get("statusField").and_then(Value::as_str) == Some(field)
                    && row.get("from").and_then(Value::as_str) == Some(from)
                    && row.get("to").and_then(Value::as_str) == Some(to)
            })
        };

        let missing: Vec<String> = MODEL_EDGES
            .iter()
            .filter(|(table, field, from, to)| !has(table, field, from, to))
            .map(|(table, field, from, to)| format!("{table}.{field}: {from} → {to}"))
            .collect();

        assert!(
            missing.is_empty(),
            "the model draws these moves and the application has none of them — \
             seed/transitions.sql was generated but never applied: {missing:#?}"
        );

        // `[*] --> initial` and `terminal --> [*]` name endpoints, not moves.
        // Storing `[*]` as a from-state would let any request reset a record to
        // its starting status, so no row may carry it.
        assert!(
            !rows.iter().any(|row| {
                row.get("from").and_then(Value::as_str) == Some("[*]")
                    || row.get("to").and_then(Value::as_str) == Some("[*]")
            }),
            "a start/end marker was stored as a real edge"
        );
    })
    .await;
}

/// A move the model's own diagram does not draw is refused on a real record.
///
/// The end-to-end claim: diagram → `seed/transitions.sql` →
/// `sys_workflow_transitions` → `authz::require_transition` → 400. Every step
/// has to be connected for this to pass, which is why it is worth the cost of
/// creating a record.
#[tokio::test]
#[serial]
async fn a_move_the_diagram_does_not_draw_is_refused() {
    support::with_app(|request, _ctx, token| async move {
        let (entity_name, status_field, initial) = FIRST_MACHINE;
        if initial.is_empty() {
            return; // the machine declares no starting state
        }
        let meta = entity(entity_name);

        let Some(created) =
            create_with_parents(&request, &token, meta, &[(status_field, json!(initial))]).await
        else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        let refused = request
            .patch(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&created))
            .json(&json!({ status_field: "definitely-not-a-declared-state" }))
            .await;
        assert_eq!(
            refused.status_code(),
            400,
            "the administrator moved {}.{status_field} to a state the diagram never draws — \
             topology is a description of what exists, not a permission a role holds",
            meta.table_name
        );

        // And the guard discriminates: a move the diagram *does* draw, from the
        // state the record is actually in, is accepted.
        let allowed_to = MODEL_EDGES
            .iter()
            .find(|(table, _, from, _)| *table == meta.table_name && *from == initial)
            .map(|(_, _, _, to)| *to);
        if let Some(to) = allowed_to {
            let accepted = request
                .patch(&format!("/api/bus/{}/{id}", meta.route))
                .add_header("authorization", bearer(&token))
                // The refused move above wrote nothing, so the version read at
                // create still holds.
                .add_header("if-match", if_match(&created))
                .json(&json!({ status_field: to }))
                .await;
            assert_eq!(
                accepted.status_code(),
                200,
                "a move the diagram draws ({initial} → {to}) was refused: {}",
                accepted.text()
            );
        }
    })
    .await;
}
