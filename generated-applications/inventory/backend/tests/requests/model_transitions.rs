//! The state machines the *model* drew, and whether the API enforces them.
//!
//! Generated: 2026-10-02T03:50:33.354Z
//! Project: inventory
//!
//! `requests/rbac.rs` proves the topology guard works by seeding an edge of its
//! own. This proves the edges the model declared actually reached the database
//! — the same distinction as `model_rules.rs`: a diagram the generator compiled
//! and never seeded leaves a status column accepting any string, and every
//! other suite passes, because none of them tries an illegitimate move.

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, entities::entity, factory::create_with_parents};

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
    ("bus_inventory_reservation", "status", "PENDING", "ACTIVE"),
    (
        "bus_inventory_reservation",
        "status",
        "ACTIVE",
        "PARTIALLY_CONSUMED",
    ),
    (
        "bus_inventory_reservation",
        "status",
        "PARTIALLY_CONSUMED",
        "RELEASED",
    ),
    (
        "bus_inventory_reservation",
        "status",
        "RELEASED",
        "CONSUMED",
    ),
    (
        "bus_inventory_reservation",
        "status",
        "PENDING",
        "CANCELLED",
    ),
    ("bus_inventory_reservation", "status", "ACTIVE", "CANCELLED"),
    (
        "bus_inventory_reservation",
        "status",
        "PARTIALLY_CONSUMED",
        "CANCELLED",
    ),
    (
        "bus_inventory_reservation",
        "status",
        "RELEASED",
        "CANCELLED",
    ),
    ("bus_inventory_reservation", "status", "ACTIVE", "EXPIRED"),
    (
        "bus_inventory_reservation",
        "status",
        "PARTIALLY_CONSUMED",
        "EXPIRED",
    ),
    ("bus_inventory_reservation", "status", "RELEASED", "EXPIRED"),
    ("bus_inventory_transfer", "status", "PLANNED", "RELEASED"),
    (
        "bus_inventory_transfer",
        "status",
        "RELEASED",
        "IN_PROGRESS",
    ),
    (
        "bus_inventory_transfer",
        "status",
        "IN_PROGRESS",
        "COMPLETED",
    ),
    ("bus_inventory_transfer", "status", "PLANNED", "CANCELLED"),
    ("bus_inventory_transfer", "status", "RELEASED", "CANCELLED"),
    (
        "bus_inventory_transfer",
        "status",
        "IN_PROGRESS",
        "CANCELLED",
    ),
    ("bus_lot", "status", "ACTIVE", "HOLD"),
    ("bus_lot", "status", "HOLD", "RELEASED"),
    ("bus_lot", "status", "RELEASED", "CLOSED"),
    ("bus_lot", "status", "CLOSED", "CONSUMED"),
    ("bus_lot", "status", "HOLD", "QUARANTINED"),
    ("bus_lot", "status", "QUARANTINED", "HOLD"),
    ("bus_lot", "status", "RELEASED", "QUARANTINED"),
    ("bus_lot", "status", "QUARANTINED", "RELEASED"),
    ("bus_lot", "status", "HOLD", "EXPIRED"),
    ("bus_lot", "status", "RELEASED", "EXPIRED"),
    ("bus_lot", "status", "QUARANTINED", "EXPIRED"),
    ("bus_lot", "status", "ACTIVE", "REJECTED"),
    ("bus_lot", "status", "HOLD", "REJECTED"),
    ("bus_lot", "status", "RELEASED", "REJECTED"),
    ("bus_lot", "status", "QUARANTINED", "REJECTED"),
    ("bus_serial_number", "status", "EXPECTED", "AVAILABLE"),
    ("bus_serial_number", "status", "AVAILABLE", "RESERVED"),
    ("bus_serial_number", "status", "RESERVED", "IN_TRANSIT"),
    ("bus_serial_number", "status", "IN_TRANSIT", "INSTALLED"),
    ("bus_serial_number", "status", "INSTALLED", "CONSUMED"),
    ("bus_serial_number", "status", "CONSUMED", "RETURNED"),
    ("bus_serial_number", "status", "AVAILABLE", "QUARANTINED"),
    ("bus_serial_number", "status", "QUARANTINED", "AVAILABLE"),
    ("bus_serial_number", "status", "RESERVED", "QUARANTINED"),
    ("bus_serial_number", "status", "QUARANTINED", "RESERVED"),
    ("bus_serial_number", "status", "IN_TRANSIT", "QUARANTINED"),
    ("bus_serial_number", "status", "QUARANTINED", "IN_TRANSIT"),
    ("bus_serial_number", "status", "AVAILABLE", "SCRAPPED"),
    ("bus_serial_number", "status", "RESERVED", "SCRAPPED"),
    ("bus_serial_number", "status", "IN_TRANSIT", "SCRAPPED"),
    ("bus_serial_number", "status", "QUARANTINED", "SCRAPPED"),
    ("bus_serial_number", "status", "EXPECTED", "RETIRED"),
    ("bus_serial_number", "status", "AVAILABLE", "RETIRED"),
    ("bus_serial_number", "status", "RESERVED", "RETIRED"),
    ("bus_serial_number", "status", "IN_TRANSIT", "RETIRED"),
    ("bus_serial_number", "status", "QUARANTINED", "RETIRED"),
    ("bus_serial_number", "status", "INSTALLED", "RETIRED"),
    ("bus_serial_number", "status", "CONSUMED", "RETIRED"),
    ("bus_product", "status", "DRAFT", "ACTIVE"),
    ("bus_product", "status", "ACTIVE", "BLOCKED"),
    ("bus_product", "status", "BLOCKED", "ACTIVE"),
    ("bus_product", "status", "DRAFT", "DISCONTINUED"),
    ("bus_product", "status", "ACTIVE", "DISCONTINUED"),
    ("bus_product", "status", "BLOCKED", "DISCONTINUED"),
    ("bus_product", "status", "DRAFT", "RETIRED"),
    ("bus_product", "status", "ACTIVE", "RETIRED"),
    ("bus_product", "status", "BLOCKED", "RETIRED"),
    ("bus_inventory_location", "status", "ACTIVE", "BLOCKED"),
    ("bus_inventory_location", "status", "BLOCKED", "ACTIVE"),
    ("bus_inventory_location", "status", "ACTIVE", "INACTIVE"),
    ("bus_inventory_location", "status", "INACTIVE", "ACTIVE"),
    ("bus_warehouse", "status", "PLANNED", "ACTIVE"),
    ("bus_warehouse", "status", "ACTIVE", "CLOSED"),
    ("bus_warehouse", "status", "ACTIVE", "SUSPENDED"),
    ("bus_warehouse", "status", "SUSPENDED", "ACTIVE"),
    ("bus_putaway", "status", "PLANNED", "RELEASED"),
    ("bus_putaway", "status", "RELEASED", "IN_PROGRESS"),
    ("bus_putaway", "status", "IN_PROGRESS", "COMPLETED"),
    ("bus_putaway", "status", "RELEASED", "EXCEPTION"),
    ("bus_putaway", "status", "EXCEPTION", "RELEASED"),
    ("bus_putaway", "status", "IN_PROGRESS", "EXCEPTION"),
    ("bus_putaway", "status", "EXCEPTION", "IN_PROGRESS"),
    ("bus_putaway", "status", "PLANNED", "CANCELLED"),
    ("bus_putaway", "status", "RELEASED", "CANCELLED"),
    ("bus_putaway", "status", "IN_PROGRESS", "CANCELLED"),
    ("bus_putaway", "status", "EXCEPTION", "CANCELLED"),
    ("bus_picking", "status", "PLANNED", "RELEASED"),
    ("bus_picking", "status", "RELEASED", "IN_PROGRESS"),
    ("bus_picking", "status", "IN_PROGRESS", "PICKED"),
    ("bus_picking", "status", "PICKED", "SHORT"),
    ("bus_picking", "status", "RELEASED", "EXCEPTION"),
    ("bus_picking", "status", "EXCEPTION", "RELEASED"),
    ("bus_picking", "status", "IN_PROGRESS", "EXCEPTION"),
    ("bus_picking", "status", "EXCEPTION", "IN_PROGRESS"),
    ("bus_picking", "status", "PICKED", "EXCEPTION"),
    ("bus_picking", "status", "EXCEPTION", "PICKED"),
    ("bus_picking", "status", "SHORT", "EXCEPTION"),
    ("bus_picking", "status", "EXCEPTION", "SHORT"),
    ("bus_picking", "status", "PLANNED", "CANCELLED"),
    ("bus_picking", "status", "RELEASED", "CANCELLED"),
    ("bus_picking", "status", "IN_PROGRESS", "CANCELLED"),
    ("bus_picking", "status", "PICKED", "CANCELLED"),
    ("bus_picking", "status", "SHORT", "CANCELLED"),
    ("bus_picking", "status", "EXCEPTION", "CANCELLED"),
    ("bus_packing", "status", "PLANNED", "IN_PROGRESS"),
    ("bus_packing", "status", "IN_PROGRESS", "PACKED"),
    ("bus_packing", "status", "IN_PROGRESS", "EXCEPTION"),
    ("bus_packing", "status", "EXCEPTION", "IN_PROGRESS"),
    ("bus_packing", "status", "PACKED", "EXCEPTION"),
    ("bus_packing", "status", "EXCEPTION", "PACKED"),
    ("bus_packing", "status", "PLANNED", "CANCELLED"),
    ("bus_packing", "status", "IN_PROGRESS", "CANCELLED"),
    ("bus_packing", "status", "PACKED", "CANCELLED"),
    ("bus_packing", "status", "EXCEPTION", "CANCELLED"),
    ("bus_wave", "status", "PLANNED", "RELEASED"),
    ("bus_wave", "status", "RELEASED", "IN_PROGRESS"),
    ("bus_wave", "status", "IN_PROGRESS", "COMPLETED"),
    ("bus_wave", "status", "PLANNED", "CANCELLED"),
    ("bus_wave", "status", "RELEASED", "CANCELLED"),
    ("bus_wave", "status", "IN_PROGRESS", "CANCELLED"),
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
