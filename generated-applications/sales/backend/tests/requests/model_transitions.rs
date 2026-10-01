//! The state machines the *model* drew, and whether the API enforces them.
//!
//! Generated: 2026-10-01T16:23:21.202Z
//! Project: sales
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
    ("bus_customer", "status", "ACTIVE", "INACTIVE"),
    ("bus_customer", "status", "INACTIVE", "ACTIVE"),
    ("bus_customer", "status", "ACTIVE", "BLOCKED"),
    ("bus_customer", "status", "BLOCKED", "ACTIVE"),
    ("bus_customer", "status", "ACTIVE", "RETIRED"),
    ("bus_customer", "status", "INACTIVE", "RETIRED"),
    ("bus_customer", "status", "BLOCKED", "RETIRED"),
    ("bus_lead", "status", "NEW", "QUALIFYING"),
    ("bus_lead", "status", "QUALIFYING", "QUALIFIED"),
    ("bus_lead", "status", "QUALIFIED", "DISQUALIFIED"),
    ("bus_lead", "status", "DISQUALIFIED", "CONVERTED"),
    ("bus_lead", "status", "QUALIFYING", "LOST"),
    ("bus_lead", "status", "QUALIFIED", "LOST"),
    ("bus_lead", "status", "DISQUALIFIED", "LOST"),
    ("bus_lead", "status", "CONVERTED", "LOST"),
    ("bus_opportunity", "stage", "QUALIFICATION", "DISCOVERY"),
    ("bus_opportunity", "stage", "DISCOVERY", "PROPOSAL"),
    ("bus_opportunity", "stage", "PROPOSAL", "WON"),
    ("bus_opportunity", "stage", "DISCOVERY", "NEGOTIATION"),
    ("bus_opportunity", "stage", "NEGOTIATION", "DISCOVERY"),
    ("bus_opportunity", "stage", "PROPOSAL", "NEGOTIATION"),
    ("bus_opportunity", "stage", "NEGOTIATION", "PROPOSAL"),
    ("bus_opportunity", "stage", "WON", "NEGOTIATION"),
    ("bus_opportunity", "stage", "NEGOTIATION", "WON"),
    ("bus_opportunity", "stage", "DISCOVERY", "LOST"),
    ("bus_opportunity", "stage", "PROPOSAL", "LOST"),
    ("bus_opportunity", "stage", "WON", "LOST"),
    ("bus_opportunity", "stage", "NEGOTIATION", "LOST"),
    ("bus_quotation", "status", "DRAFT", "SUBMITTED"),
    ("bus_quotation", "status", "SUBMITTED", "ACCEPTED"),
    ("bus_quotation", "status", "DRAFT", "REJECTED"),
    ("bus_quotation", "status", "SUBMITTED", "REJECTED"),
    ("bus_quotation", "status", "ACCEPTED", "REJECTED"),
    ("bus_quotation", "status", "SUBMITTED", "EXPIRED"),
    ("bus_quotation", "status", "ACCEPTED", "EXPIRED"),
    ("bus_quotation", "status", "DRAFT", "CANCELLED"),
    ("bus_quotation", "status", "SUBMITTED", "CANCELLED"),
    ("bus_quotation", "status", "ACCEPTED", "CANCELLED"),
    ("bus_sales_order", "status", "DRAFT", "CONFIRMED"),
    ("bus_sales_order", "status", "CONFIRMED", "ALLOCATED"),
    (
        "bus_sales_order",
        "status",
        "ALLOCATED",
        "PARTIALLY_FULFILLED",
    ),
    (
        "bus_sales_order",
        "status",
        "PARTIALLY_FULFILLED",
        "FULFILLED",
    ),
    ("bus_sales_order", "status", "DRAFT", "CANCELLED"),
    ("bus_sales_order", "status", "CONFIRMED", "CANCELLED"),
    ("bus_sales_order", "status", "ALLOCATED", "CANCELLED"),
    (
        "bus_sales_order",
        "status",
        "PARTIALLY_FULFILLED",
        "CANCELLED",
    ),
    ("bus_purchase_order", "status", "DRAFT", "APPROVED"),
    ("bus_purchase_order", "status", "APPROVED", "SENT"),
    ("bus_purchase_order", "status", "SENT", "PARTIALLY_RECEIVED"),
    (
        "bus_purchase_order",
        "status",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
    ),
    ("bus_purchase_order", "status", "RECEIVED", "CLOSED"),
    ("bus_purchase_order", "status", "DRAFT", "CANCELLED"),
    ("bus_purchase_order", "status", "APPROVED", "CANCELLED"),
    ("bus_purchase_order", "status", "SENT", "CANCELLED"),
    (
        "bus_purchase_order",
        "status",
        "PARTIALLY_RECEIVED",
        "CANCELLED",
    ),
    ("bus_purchase_order", "status", "RECEIVED", "CANCELLED"),
    ("bus_product", "status", "DRAFT", "ACTIVE"),
    ("bus_product", "status", "ACTIVE", "BLOCKED"),
    ("bus_product", "status", "BLOCKED", "ACTIVE"),
    ("bus_product", "status", "DRAFT", "DISCONTINUED"),
    ("bus_product", "status", "ACTIVE", "DISCONTINUED"),
    ("bus_product", "status", "BLOCKED", "DISCONTINUED"),
    ("bus_product", "status", "DRAFT", "RETIRED"),
    ("bus_product", "status", "ACTIVE", "RETIRED"),
    ("bus_product", "status", "BLOCKED", "RETIRED"),
    ("bus_supplier", "status", "ACTIVE", "INACTIVE"),
    ("bus_supplier", "status", "INACTIVE", "ACTIVE"),
    ("bus_supplier", "status", "ACTIVE", "BLOCKED"),
    ("bus_supplier", "status", "BLOCKED", "ACTIVE"),
    ("bus_supplier", "status", "ACTIVE", "RETIRED"),
    ("bus_supplier", "status", "INACTIVE", "RETIRED"),
    ("bus_supplier", "status", "BLOCKED", "RETIRED"),
    ("bus_payment_term", "status", "ACTIVE", "INACTIVE"),
    ("bus_payment_term", "status", "INACTIVE", "ACTIVE"),
    ("bus_payment_term", "status", "ACTIVE", "RETIRED"),
    ("bus_payment_term", "status", "INACTIVE", "RETIRED"),
    ("bus_product_category", "status", "ACTIVE", "INACTIVE"),
    ("bus_product_category", "status", "INACTIVE", "ACTIVE"),
    ("bus_product_category", "status", "ACTIVE", "RETIRED"),
    ("bus_product_category", "status", "INACTIVE", "RETIRED"),
    ("bus_discount_rule", "status", "DRAFT", "ACTIVE"),
    ("bus_discount_rule", "status", "ACTIVE", "INACTIVE"),
    ("bus_discount_rule", "status", "INACTIVE", "ACTIVE"),
    ("bus_discount_rule", "status", "DRAFT", "RETIRED"),
    ("bus_discount_rule", "status", "ACTIVE", "RETIRED"),
    ("bus_discount_rule", "status", "INACTIVE", "RETIRED"),
    ("bus_customer_return", "status", "DRAFT", "AUTHORIZED"),
    ("bus_customer_return", "status", "AUTHORIZED", "IN_TRANSIT"),
    ("bus_customer_return", "status", "IN_TRANSIT", "RECEIVED"),
    ("bus_customer_return", "status", "RECEIVED", "COMPLETED"),
    (
        "bus_customer_return",
        "status",
        "COMPLETED",
        "DISPOSITIONED",
    ),
    (
        "bus_customer_return",
        "status",
        "AUTHORIZED",
        "INSPECTION_PENDING",
    ),
    (
        "bus_customer_return",
        "status",
        "INSPECTION_PENDING",
        "AUTHORIZED",
    ),
    (
        "bus_customer_return",
        "status",
        "IN_TRANSIT",
        "INSPECTION_PENDING",
    ),
    (
        "bus_customer_return",
        "status",
        "INSPECTION_PENDING",
        "IN_TRANSIT",
    ),
    (
        "bus_customer_return",
        "status",
        "RECEIVED",
        "INSPECTION_PENDING",
    ),
    (
        "bus_customer_return",
        "status",
        "INSPECTION_PENDING",
        "RECEIVED",
    ),
    ("bus_customer_return", "status", "AUTHORIZED", "EXCEPTION"),
    ("bus_customer_return", "status", "EXCEPTION", "AUTHORIZED"),
    ("bus_customer_return", "status", "IN_TRANSIT", "EXCEPTION"),
    ("bus_customer_return", "status", "EXCEPTION", "IN_TRANSIT"),
    ("bus_customer_return", "status", "RECEIVED", "EXCEPTION"),
    ("bus_customer_return", "status", "EXCEPTION", "RECEIVED"),
    ("bus_customer_return", "status", "DRAFT", "CANCELLED"),
    ("bus_customer_return", "status", "AUTHORIZED", "CANCELLED"),
    ("bus_customer_return", "status", "IN_TRANSIT", "CANCELLED"),
    ("bus_customer_return", "status", "RECEIVED", "CANCELLED"),
    (
        "bus_customer_return",
        "status",
        "INSPECTION_PENDING",
        "CANCELLED",
    ),
    ("bus_customer_return", "status", "EXCEPTION", "CANCELLED"),
    ("bus_brand", "status", "ACTIVE", "INACTIVE"),
    ("bus_brand", "status", "INACTIVE", "ACTIVE"),
    ("bus_brand", "status", "ACTIVE", "RETIRED"),
    ("bus_brand", "status", "INACTIVE", "RETIRED"),
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
