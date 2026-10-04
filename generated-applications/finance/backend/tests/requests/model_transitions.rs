//! The state machines the *model* drew, and whether the API enforces them.
//!
//! Generated: 2026-10-04T08:29:46.971Z
//! Project: finance
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
    ("bus_account", "status", "ACTIVE", "INACTIVE"),
    ("bus_account", "status", "INACTIVE", "ACTIVE"),
    ("bus_account", "status", "ACTIVE", "RETIRED"),
    ("bus_account", "status", "INACTIVE", "RETIRED"),
    ("bus_journal_entry", "status", "DRAFT", "POSTED"),
    ("bus_journal_entry", "status", "POSTED", "REVERSED"),
    ("bus_invoice", "status", "DRAFT", "ISSUED"),
    ("bus_invoice", "status", "ISSUED", "PARTIALLY_PAID"),
    ("bus_invoice", "status", "PARTIALLY_PAID", "PAID"),
    ("bus_invoice", "status", "ISSUED", "OVERDUE"),
    ("bus_invoice", "status", "OVERDUE", "ISSUED"),
    ("bus_invoice", "status", "PARTIALLY_PAID", "OVERDUE"),
    ("bus_invoice", "status", "OVERDUE", "PARTIALLY_PAID"),
    ("bus_invoice", "status", "DRAFT", "CANCELLED"),
    ("bus_invoice", "status", "ISSUED", "CANCELLED"),
    ("bus_invoice", "status", "PARTIALLY_PAID", "CANCELLED"),
    ("bus_invoice", "status", "OVERDUE", "CANCELLED"),
    ("bus_invoice", "status", "DRAFT", "VOID"),
    ("bus_invoice", "status", "ISSUED", "VOID"),
    ("bus_invoice", "status", "PARTIALLY_PAID", "VOID"),
    ("bus_invoice", "status", "OVERDUE", "VOID"),
    ("bus_payment", "status", "DRAFT", "APPROVED"),
    ("bus_payment", "status", "APPROVED", "POSTED"),
    ("bus_payment", "status", "POSTED", "CLEARED"),
    ("bus_payment", "status", "DRAFT", "VOID"),
    ("bus_payment", "status", "APPROVED", "VOID"),
    ("bus_payment", "status", "POSTED", "VOID"),
    ("bus_payment", "status", "POSTED", "REVERSED"),
    ("bus_supplier", "status", "ACTIVE", "INACTIVE"),
    ("bus_supplier", "status", "INACTIVE", "ACTIVE"),
    ("bus_supplier", "status", "ACTIVE", "BLOCKED"),
    ("bus_supplier", "status", "BLOCKED", "ACTIVE"),
    ("bus_supplier", "status", "ACTIVE", "RETIRED"),
    ("bus_supplier", "status", "INACTIVE", "RETIRED"),
    ("bus_supplier", "status", "BLOCKED", "RETIRED"),
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
    ("bus_customer", "status", "ACTIVE", "INACTIVE"),
    ("bus_customer", "status", "INACTIVE", "ACTIVE"),
    ("bus_customer", "status", "ACTIVE", "BLOCKED"),
    ("bus_customer", "status", "BLOCKED", "ACTIVE"),
    ("bus_customer", "status", "ACTIVE", "RETIRED"),
    ("bus_customer", "status", "INACTIVE", "RETIRED"),
    ("bus_customer", "status", "BLOCKED", "RETIRED"),
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
    ("bus_budget", "status", "DRAFT", "SUBMITTED"),
    ("bus_budget", "status", "SUBMITTED", "APPROVED"),
    ("bus_budget", "status", "APPROVED", "ACTIVE"),
    ("bus_budget", "status", "ACTIVE", "CLOSED"),
    ("bus_budget", "status", "DRAFT", "SUPERSEDED"),
    ("bus_budget", "status", "SUBMITTED", "SUPERSEDED"),
    ("bus_budget", "status", "APPROVED", "SUPERSEDED"),
    ("bus_budget", "status", "ACTIVE", "SUPERSEDED"),
    ("bus_scenario", "status", "DRAFT", "ACTIVE"),
    ("bus_scenario", "status", "ACTIVE", "ARCHIVED"),
    ("bus_ledger", "status", "DRAFT", "ACTIVE"),
    ("bus_ledger", "status", "ACTIVE", "COMPLETED"),
    ("bus_ledger", "status", "DRAFT", "CANCELLED"),
    ("bus_ledger", "status", "ACTIVE", "CANCELLED"),
    ("bus_fiscal_period", "status", "FUTURE", "OPEN"),
    ("bus_fiscal_period", "status", "OPEN", "SOFT_CLOSED"),
    ("bus_fiscal_period", "status", "SOFT_CLOSED", "CLOSED"),
    ("bus_fiscal_period", "status", "OPEN", "LOCKED"),
    ("bus_fiscal_period", "status", "LOCKED", "OPEN"),
    ("bus_payment_allocation", "status", "DRAFT", "ACTIVE"),
    ("bus_payment_allocation", "status", "ACTIVE", "REVERSED"),
    ("bus_payment_allocation", "status", "DRAFT", "CANCELLED"),
    ("bus_payment_allocation", "status", "ACTIVE", "CANCELLED"),
    ("bus_payment_instruction", "status", "DRAFT", "ACTIVE"),
    ("bus_payment_instruction", "status", "ACTIVE", "COMPLETED"),
    ("bus_payment_instruction", "status", "DRAFT", "CANCELLED"),
    ("bus_payment_instruction", "status", "ACTIVE", "CANCELLED"),
    ("bus_credit_note", "status", "DRAFT", "APPROVED"),
    ("bus_credit_note", "status", "APPROVED", "POSTED"),
    ("bus_credit_note", "status", "POSTED", "PARTIALLY_APPLIED"),
    (
        "bus_credit_note",
        "status",
        "PARTIALLY_APPLIED",
        "REFUND_DUE",
    ),
    ("bus_credit_note", "status", "REFUND_DUE", "FULLY_APPLIED"),
    ("bus_credit_note", "status", "REFUND_DUE", "REFUNDED"),
    ("bus_credit_note", "status", "DRAFT", "CANCELLED"),
    ("bus_credit_note", "status", "APPROVED", "CANCELLED"),
    ("bus_credit_note", "status", "POSTED", "CANCELLED"),
    (
        "bus_credit_note",
        "status",
        "PARTIALLY_APPLIED",
        "CANCELLED",
    ),
    ("bus_credit_note", "status", "REFUND_DUE", "CANCELLED"),
    ("bus_credit_note", "status", "REFUND_DUE", "REVERSED"),
    ("bus_credit_note_application", "status", "DRAFT", "ACTIVE"),
    (
        "bus_credit_note_application",
        "status",
        "ACTIVE",
        "REVERSED",
    ),
    (
        "bus_credit_note_application",
        "status",
        "DRAFT",
        "CANCELLED",
    ),
    (
        "bus_credit_note_application",
        "status",
        "ACTIVE",
        "CANCELLED",
    ),
    ("bus_tax_code", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_code", "status", "ACTIVE", "COMPLETED"),
    ("bus_tax_code", "status", "DRAFT", "CANCELLED"),
    ("bus_tax_code", "status", "ACTIVE", "CANCELLED"),
    ("bus_tax_jurisdiction", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_jurisdiction", "status", "ACTIVE", "COMPLETED"),
    ("bus_tax_jurisdiction", "status", "DRAFT", "CANCELLED"),
    ("bus_tax_jurisdiction", "status", "ACTIVE", "CANCELLED"),
    ("bus_tax_rate", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_rate", "status", "ACTIVE", "COMPLETED"),
    ("bus_tax_rate", "status", "DRAFT", "CANCELLED"),
    ("bus_tax_rate", "status", "ACTIVE", "CANCELLED"),
    ("bus_tax_registration", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_registration", "status", "ACTIVE", "COMPLETED"),
    ("bus_tax_registration", "status", "DRAFT", "CANCELLED"),
    ("bus_tax_registration", "status", "ACTIVE", "CANCELLED"),
    ("bus_tax_rule", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_rule", "status", "ACTIVE", "INACTIVE"),
    ("bus_tax_rule", "status", "INACTIVE", "ACTIVE"),
    ("bus_tax_rule", "status", "DRAFT", "RETIRED"),
    ("bus_tax_rule", "status", "ACTIVE", "RETIRED"),
    ("bus_tax_rule", "status", "INACTIVE", "RETIRED"),
    ("bus_tax_transaction", "status", "DRAFT", "ACTIVE"),
    ("bus_tax_transaction", "status", "ACTIVE", "COMPLETED"),
    ("bus_tax_transaction", "status", "DRAFT", "CANCELLED"),
    ("bus_tax_transaction", "status", "ACTIVE", "CANCELLED"),
    ("bus_billing_cycle", "status", "DRAFT", "ACTIVE"),
    ("bus_billing_cycle", "status", "ACTIVE", "COMPLETED"),
    ("bus_billing_cycle", "status", "DRAFT", "CANCELLED"),
    ("bus_billing_cycle", "status", "ACTIVE", "CANCELLED"),
    ("bus_charge", "status", "DRAFT", "ACTIVE"),
    ("bus_charge", "status", "ACTIVE", "COMPLETED"),
    ("bus_charge", "status", "DRAFT", "CANCELLED"),
    ("bus_charge", "status", "ACTIVE", "CANCELLED"),
    ("bus_subscription", "status", "DRAFT", "ACTIVE"),
    ("bus_subscription", "status", "ACTIVE", "COMPLETED"),
    ("bus_subscription", "status", "DRAFT", "CANCELLED"),
    ("bus_subscription", "status", "ACTIVE", "CANCELLED"),
    ("bus_subscription_plan", "status", "DRAFT", "ACTIVE"),
    ("bus_subscription_plan", "status", "ACTIVE", "COMPLETED"),
    ("bus_subscription_plan", "status", "DRAFT", "CANCELLED"),
    ("bus_subscription_plan", "status", "ACTIVE", "CANCELLED"),
    ("bus_usage_record", "status", "DRAFT", "ACTIVE"),
    ("bus_usage_record", "status", "ACTIVE", "COMPLETED"),
    ("bus_usage_record", "status", "DRAFT", "CANCELLED"),
    ("bus_usage_record", "status", "ACTIVE", "CANCELLED"),
    ("bus_bank_account", "status", "PENDING", "ACTIVE"),
    ("bus_bank_account", "status", "ACTIVE", "CLOSED"),
    ("bus_bank_account", "status", "ACTIVE", "BLOCKED"),
    ("bus_bank_account", "status", "BLOCKED", "ACTIVE"),
    ("bus_asset", "status", "PLANNED", "ACTIVE"),
    ("bus_asset", "status", "ACTIVE", "UNDER_MAINTENANCE"),
    ("bus_asset", "status", "UNDER_MAINTENANCE", "ACTIVE"),
    ("bus_asset", "status", "ACTIVE", "HELD"),
    ("bus_asset", "status", "HELD", "ACTIVE"),
    ("bus_asset", "status", "ACTIVE", "DISPOSED"),
    ("bus_asset", "status", "UNDER_MAINTENANCE", "DISPOSED"),
    ("bus_asset", "status", "HELD", "DISPOSED"),
    ("bus_asset", "status", "PLANNED", "RETIRED"),
    ("bus_asset", "status", "ACTIVE", "RETIRED"),
    ("bus_asset", "status", "UNDER_MAINTENANCE", "RETIRED"),
    ("bus_asset", "status", "HELD", "RETIRED"),
    ("bus_product", "status", "DRAFT", "ACTIVE"),
    ("bus_product", "status", "ACTIVE", "BLOCKED"),
    ("bus_product", "status", "BLOCKED", "ACTIVE"),
    ("bus_product", "status", "DRAFT", "DISCONTINUED"),
    ("bus_product", "status", "ACTIVE", "DISCONTINUED"),
    ("bus_product", "status", "BLOCKED", "DISCONTINUED"),
    ("bus_product", "status", "DRAFT", "RETIRED"),
    ("bus_product", "status", "ACTIVE", "RETIRED"),
    ("bus_product", "status", "BLOCKED", "RETIRED"),
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
