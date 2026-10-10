//! Two people, one record: optimistic locking and closed transactions.
//!
//! Generated: 2026-10-10T12:30:41.376Z
//! Project: finance
//!
//! Every entity is optimistic unless the model says `concurrency:
//! last-write-wins`. An update names the version it was read at; one made
//! against a version someone else has replaced is refused with the record as it
//! now stands, so the screen can offer to refresh or to overwrite. A record in a
//! final state of its machine is a completed transaction and refuses every
//! update.
//!
//! A delete is held to the same two rules: it names the version it was read
//! at, and a record in a final state is not deleted, by anyone.
//!
//! Every other suite sends the version it read and so never sees a conflict.
//! This one makes them on purpose: two readers of one version, ten writers
//! racing on one version, two moves racing out of one state.

use std::future::Future;
use std::pin::Pin;
use std::task::Poll;

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{
    self, bearer,
    entities::{EntityMeta, ENTITIES},
    factory::{create_with_parents, marked},
    if_match,
};

/// Entities the model declares `last-write-wins`.
const LAST_WRITE_WINS: &[&str] = &[];

/// `(entity, status column, a final state)` for each machine that has one.
const FINAL_STATES: &[(&str, &str, &str)] = &[
    ("Party", "status", "RETIRED"),
    ("Organization", "status", "RETIRED"),
    ("PartyRole", "status", "EXPIRED"),
    ("Address", "status", "RETIRED"),
    ("Location", "status", "CLOSED"),
    ("Currency", "status", "RETIRED"),
    ("ExchangeRate", "status", "EXPIRED"),
    ("UnitOfMeasure", "status", "RETIRED"),
    ("Task", "status", "COMPLETED"),
    ("Account", "status", "RETIRED"),
    ("JournalEntry", "status", "REVERSED"),
    ("Invoice", "status", "PAID"),
    ("Payment", "status", "CLEARED"),
    ("Supplier", "status", "RETIRED"),
    ("PurchaseOrder", "status", "CLOSED"),
    ("Customer", "status", "RETIRED"),
    ("SalesOrder", "status", "FULFILLED"),
    ("Budget", "status", "CLOSED"),
    ("Scenario", "status", "ARCHIVED"),
    ("Ledger", "status", "COMPLETED"),
    ("FiscalPeriod", "status", "CLOSED"),
    ("PaymentAllocation", "status", "REVERSED"),
    ("PaymentInstruction", "status", "COMPLETED"),
    ("CreditNote", "status", "CANCELLED"),
    ("CreditNoteApplication", "status", "REVERSED"),
    ("TaxCode", "status", "COMPLETED"),
    ("TaxJurisdiction", "status", "COMPLETED"),
    ("TaxRate", "status", "COMPLETED"),
    ("TaxRegistration", "status", "COMPLETED"),
    ("TaxRule", "status", "RETIRED"),
    ("TaxTransaction", "status", "COMPLETED"),
    ("BillingCycle", "status", "COMPLETED"),
    ("Charge", "status", "COMPLETED"),
    ("Subscription", "status", "COMPLETED"),
    ("SubscriptionPlan", "status", "COMPLETED"),
    ("UsageRecord", "status", "COMPLETED"),
    ("BankAccount", "status", "CLOSED"),
    ("Asset", "status", "DISPOSED"),
    ("Product", "status", "DISCONTINUED"),
];

/// `(entity, status column, initial, [targets of edges out of initial])`.
const FIRST_MOVES: &[(&str, &str, &str, &[&str])] = &[
    (
        "Party",
        "status",
        "ACTIVE",
        &["INACTIVE", "BLOCKED", "RETIRED"],
    ),
    ("Organization", "status", "DRAFT", &["ACTIVE", "RETIRED"]),
    ("PartyRole", "status", "ACTIVE", &["INACTIVE", "EXPIRED"]),
    ("Address", "status", "ACTIVE", &["INACTIVE", "RETIRED"]),
    ("Location", "status", "PLANNED", &["ACTIVE", "RETIRED"]),
    ("Currency", "status", "ACTIVE", &["INACTIVE", "RETIRED"]),
    ("ExchangeRate", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    (
        "UnitOfMeasure",
        "status",
        "ACTIVE",
        &["INACTIVE", "RETIRED"],
    ),
    ("Task", "status", "CREATED", &["READY", "CANCELLED"]),
    ("Account", "status", "ACTIVE", &["INACTIVE", "RETIRED"]),
    ("JournalEntry", "status", "DRAFT", &["POSTED"]),
    (
        "Invoice",
        "status",
        "DRAFT",
        &["ISSUED", "CANCELLED", "VOID"],
    ),
    ("Payment", "status", "DRAFT", &["APPROVED", "VOID"]),
    (
        "Supplier",
        "status",
        "ACTIVE",
        &["INACTIVE", "BLOCKED", "RETIRED"],
    ),
    (
        "PurchaseOrder",
        "status",
        "DRAFT",
        &["APPROVED", "CANCELLED"],
    ),
    (
        "Customer",
        "status",
        "ACTIVE",
        &["INACTIVE", "BLOCKED", "RETIRED"],
    ),
    ("SalesOrder", "status", "DRAFT", &["CONFIRMED", "CANCELLED"]),
    ("Budget", "status", "DRAFT", &["SUBMITTED", "SUPERSEDED"]),
    ("Scenario", "status", "DRAFT", &["ACTIVE"]),
    ("Ledger", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    ("FiscalPeriod", "status", "FUTURE", &["OPEN"]),
    (
        "PaymentAllocation",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    (
        "PaymentInstruction",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("CreditNote", "status", "DRAFT", &["APPROVED", "CANCELLED"]),
    (
        "CreditNoteApplication",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("TaxCode", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    (
        "TaxJurisdiction",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("TaxRate", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    (
        "TaxRegistration",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("TaxRule", "status", "DRAFT", &["ACTIVE", "RETIRED"]),
    (
        "TaxTransaction",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("BillingCycle", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    ("Charge", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    ("Subscription", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    (
        "SubscriptionPlan",
        "status",
        "DRAFT",
        &["ACTIVE", "CANCELLED"],
    ),
    ("UsageRecord", "status", "DRAFT", &["ACTIVE", "CANCELLED"]),
    ("BankAccount", "status", "PENDING", &["ACTIVE"]),
    ("Asset", "status", "PLANNED", &["ACTIVE", "RETIRED"]),
    (
        "Product",
        "status",
        "DRAFT",
        &["ACTIVE", "DISCONTINUED", "RETIRED"],
    ),
];

/// The first entity that is optimistic and has a text column to edit.
fn optimistic_entity() -> Option<(&'static EntityMeta, &'static str)> {
    ENTITIES
        .iter()
        .filter(|meta| !LAST_WRITE_WINS.contains(&meta.table_name))
        .find_map(|meta| meta.first_text_field().map(|field| (meta, field.name)))
}

/// Poll every future to completion, interleaved — the in-process way to put
/// several requests in flight at once without another dependency.
async fn all<F: Future>(futures: Vec<F>) -> Vec<F::Output> {
    let mut pending: Vec<Pin<Box<F>>> = futures.into_iter().map(Box::pin).collect();
    let mut outputs: Vec<Option<F::Output>> = pending.iter().map(|_| None).collect();
    std::future::poll_fn(|cx| {
        let mut waiting = false;
        for (index, future) in pending.iter_mut().enumerate() {
            if outputs[index].is_none() {
                match future.as_mut().poll(cx) {
                    Poll::Ready(output) => outputs[index] = Some(output),
                    Poll::Pending => waiting = true,
                }
            }
        }
        if waiting {
            Poll::Pending
        } else {
            Poll::Ready(())
        }
    })
    .await;
    outputs
        .into_iter()
        .map(|output| output.expect("every future was polled to completion"))
        .collect()
}

fn version(record: &Value) -> i64 {
    record.get("version").and_then(Value::as_i64).unwrap_or(0)
}

/// A create answers with the ETag its first save sends back.
#[tokio::test]
#[serial]
async fn a_created_record_carries_its_etag() {
    support::with_app(|request, _ctx, token| async move {
        // The first entity a create succeeds on with no parents to supply; the
        // CRUD suites cover the ones that need them.
        let mut created = None;
        for meta in ENTITIES {
            let response = request
                .post(&format!("/api/bus/{}", meta.route))
                .add_header("authorization", bearer(&token))
                .json(&Value::Object(support::factory::build_record(meta)))
                .await;
            if response.status_code().is_success() {
                created = Some(response);
                break;
            }
        }
        let response = created.expect("no entity could be created without parents");
        let body = response.json::<Value>();
        let etag = response.header("etag");
        assert_eq!(
            etag.to_str().ok(),
            Some(format!("\"v{}\"", version(&body)).as_str()),
            "a create must answer with the ETag its first save sends back"
        );
    })
    .await;
}

/// A reads v1, B reads v1; A saves; B's save is refused with what A wrote.
/// B overwrites with the version the refusal named; refreshing reads it back.
#[tokio::test]
#[serial]
async fn a_stale_save_is_refused_with_the_record_as_it_stands() {
    support::with_app(|request, _ctx, token| async move {
        let Some((meta, field)) = optimistic_entity() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);
        let field_meta = meta.first_text_field().expect("chosen for its text field");

        // A saves first.
        let theirs = marked(field_meta, "first");
        let first = request
            .patch(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&read))
            .json(&json!({ field: theirs.clone() }))
            .await;
        assert_eq!(first.status_code(), 200, "the first save: {}", first.text());
        let after_first = first.json::<Value>();
        assert_eq!(version(&after_first), version(&read) + 1);

        // B saves against the version it read, which A has replaced.
        let mine = marked(field_meta, "second");
        let stale = request
            .patch(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&read))
            .json(&json!({ field: mine.clone() }))
            .await;
        assert_eq!(
            stale.status_code(),
            409,
            "a stale save must be refused: {}",
            stale.text()
        );
        let refusal = stale.json::<Value>();
        assert_eq!(refusal["error"], "VERSION_CONFLICT");
        let conflict = &refusal["conflict"];
        assert_eq!(conflict["yourVersion"].as_i64(), Some(version(&read)));
        assert_eq!(
            conflict["currentVersion"].as_i64(),
            Some(version(&after_first))
        );
        assert_eq!(
            conflict["current"][field],
            json!(theirs),
            "the refusal carries what A wrote"
        );
        assert_eq!(conflict["overwritable"], json!(true));
        assert!(
            conflict["changedFields"]
                .as_array()
                .is_some_and(|fields| fields.iter().any(|f| f == field)),
            "the refusal names the column that changed: {conflict}"
        );
        assert!(
            !conflict["changedAt"].is_null(),
            "the refusal says when: {conflict}"
        );

        // B overwrites, naming the version the refusal reported.
        let overwrite = request
            .patch(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&conflict["current"]))
            .json(&json!({ field: mine.clone() }))
            .await;
        assert_eq!(
            overwrite.status_code(),
            200,
            "the overwrite: {}",
            overwrite.text()
        );
        let overwritten = overwrite.json::<Value>();
        assert_eq!(overwritten[field], json!(mine));

        // Refreshing reads the latest version, with its ETag.
        let refreshed = request
            .get(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(refreshed.status_code(), 200);
        assert_eq!(
            refreshed.header("etag").to_str().ok(),
            Some(format!("\"v{}\"", version(&overwritten)).as_str())
        );
        assert_eq!(refreshed.json::<Value>()[field], json!(mine));
    })
    .await;
}

/// Ten saves race on one version: exactly one lands.
#[tokio::test]
#[serial]
async fn of_ten_saves_on_one_version_exactly_one_lands() {
    support::with_app(|request, _ctx, token| async move {
        let Some((meta, field)) = optimistic_entity() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);
        let field_meta = meta.first_text_field().expect("chosen for its text field");
        let header = if_match(&read);

        let saves = (0..10)
            .map(|writer| {
                let request = &request;
                let token = &token;
                let url = &url;
                let header = header.clone();
                let value = marked(field_meta, &format!("writer-{writer}"));
                async move {
                    request
                        .patch(url)
                        .add_header("authorization", bearer(token))
                        .add_header("if-match", header)
                        .json(&json!({ field: value }))
                        .await
                        .status_code()
                        .as_u16()
                }
            })
            .collect::<Vec<_>>();
        let statuses = all(saves).await;

        assert_eq!(
            statuses.iter().filter(|status| **status == 200).count(),
            1,
            "exactly one of ten saves on one version may land: {statuses:?}"
        );
        assert!(
            statuses
                .iter()
                .all(|status| *status == 200 || *status == 409),
            "every other save is a conflict, not an error: {statuses:?}"
        );
    })
    .await;
}

/// An optimistic entity refuses an update that names no version.
#[tokio::test]
#[serial]
async fn an_update_that_names_no_version_is_428() {
    support::with_app(|request, _ctx, token| async move {
        let Some((meta, field)) = optimistic_entity() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let field_meta = meta.first_text_field().expect("chosen for its text field");

        let blind = request
            .patch(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .json(&json!({ field: marked(field_meta, "blind") }))
            .await;
        assert_eq!(
            blind.status_code(),
            428,
            "a client that never read the record must not overwrite it blind: {}",
            blind.text()
        );
    })
    .await;
}

/// An entity the model declares `last-write-wins` accepts an update that names
/// no version.
#[tokio::test]
#[serial]
async fn a_last_write_wins_entity_accepts_an_update_without_a_version() {
    support::with_app(|request, _ctx, token| async move {
        let Some(meta) = ENTITIES
            .iter()
            .find(|meta| LAST_WRITE_WINS.contains(&meta.table_name))
        else {
            return; // the model declares none
        };
        let Some(field_meta) = meta.first_text_field() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        let response = request
            .patch(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .json(&json!({ field_meta.name: marked(field_meta, "lww") }))
            .await;
        assert_eq!(response.status_code(), 200, "{}", response.text());
    })
    .await;
}

/// A record in a final state is closed — to a stale save, a fresh one and a
/// deliberate overwrite alike — and the refusal says so.
#[tokio::test]
#[serial]
async fn a_record_in_a_final_state_is_closed() {
    support::with_app(|request, _ctx, token| async move {
        let Some(&(entity_name, status_field, final_state)) = FINAL_STATES.first() else {
            return; // the model declares no final state
        };
        let meta = ENTITIES
            .iter()
            .find(|meta| meta.name == entity_name)
            .expect("a machine names a declared entity");
        let read = create_with_parents(
            &request,
            &token,
            meta,
            &[(status_field, json!(final_state))],
        )
        .await
        .unwrap_or_else(|| panic!("could not create a {} in {}", meta.name, final_state));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);
        let field = meta
            .first_text_field()
            .map_or(status_field, |field| field.name);

        for precondition in [if_match(&read), "*".to_string()] {
            let response = request
                .patch(&url)
                .add_header("authorization", bearer(&token))
                .add_header("if-match", precondition.clone())
                .json(&json!({ field: read[field].clone() }))
                .await;
            assert_eq!(
                response.status_code(),
                409,
                "a record in {final_state} must refuse an update with If-Match {precondition}: {}",
                response.text()
            );
            let body = response.json::<Value>();
            assert_eq!(body["error"], "RECORD_FINAL");
            assert_eq!(body["conflict"]["overwritable"], json!(false));
            assert_eq!(body["conflict"]["status"]["isFinal"], json!(true));
            assert_eq!(body["conflict"]["status"]["value"], json!(final_state));
        }
    })
    .await;
}

/// A delete against a version someone else has replaced is refused with the
/// record as it now stands; deleting the version the refusal named succeeds.
#[tokio::test]
#[serial]
async fn a_stale_delete_is_refused_with_the_record_as_it_stands() {
    support::with_app(|request, _ctx, token| async move {
        let Some((meta, field)) = optimistic_entity() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);
        let field_meta = meta.first_text_field().expect("chosen for its text field");

        // Somebody saves after this reader opened the record.
        let theirs = marked(field_meta, "before-delete");
        let saved = request
            .patch(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&read))
            .json(&json!({ field: theirs.clone() }))
            .await;
        assert_eq!(
            saved.status_code(),
            200,
            "the intervening save: {}",
            saved.text()
        );

        let stale = request
            .delete(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&read))
            .await;
        assert_eq!(
            stale.status_code(),
            409,
            "a stale delete must be refused: {}",
            stale.text()
        );
        let refusal = stale.json::<Value>();
        assert_eq!(refusal["error"], "VERSION_CONFLICT");
        let conflict = &refusal["conflict"];
        assert_eq!(
            conflict["current"][field],
            json!(theirs),
            "the refusal carries what was saved"
        );
        assert_eq!(conflict["overwritable"], json!(true));

        // Still there: a refused delete leaves the record exactly as it was.
        let still = request
            .get(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(still.status_code(), 200, "a refused delete must not delete");

        let deleted = request
            .delete(&url)
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&conflict["current"]))
            .await;
        assert_eq!(
            deleted.status_code(),
            204,
            "deleting the current version: {}",
            deleted.text()
        );
        let gone = request
            .get(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(gone.status_code(), 404);
    })
    .await;
}

/// An optimistic entity refuses a delete that names no version.
#[tokio::test]
#[serial]
async fn a_delete_that_names_no_version_is_428() {
    support::with_app(|request, _ctx, token| async move {
        let Some((meta, _)) = optimistic_entity() else {
            return;
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);

        let blind = request
            .delete(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            blind.status_code(),
            428,
            "a client that never read the record must not delete it blind: {}",
            blind.text()
        );
        let still = request
            .get(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(still.status_code(), 200, "a refused delete must not delete");
    })
    .await;
}

/// An entity the model declares `last-write-wins` deletes without a version.
#[tokio::test]
#[serial]
async fn a_last_write_wins_entity_deletes_without_a_version() {
    support::with_app(|request, _ctx, token| async move {
        let Some(meta) = ENTITIES
            .iter()
            .find(|meta| LAST_WRITE_WINS.contains(&meta.table_name))
        else {
            return; // the model declares none
        };
        let read = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {}", meta.name));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        let response = request
            .delete(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 204, "{}", response.text());
    })
    .await;
}

/// A record in a final state is a completed transaction: it is not deleted —
/// with the version it was read at, or with `*` — and the refusal says why.
#[tokio::test]
#[serial]
async fn a_record_in_a_final_state_is_not_deleted() {
    support::with_app(|request, _ctx, token| async move {
        let Some(&(entity_name, status_field, final_state)) = FINAL_STATES.first() else {
            return; // the model declares no final state
        };
        let meta = ENTITIES
            .iter()
            .find(|meta| meta.name == entity_name)
            .expect("a machine names a declared entity");
        let read = create_with_parents(
            &request,
            &token,
            meta,
            &[(status_field, json!(final_state))],
        )
        .await
        .unwrap_or_else(|| panic!("could not create a {} in {}", meta.name, final_state));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);

        for precondition in [if_match(&read), "*".to_string()] {
            let response = request
                .delete(&url)
                .add_header("authorization", bearer(&token))
                .add_header("if-match", precondition.clone())
                .await;
            assert_eq!(
                response.status_code(),
                409,
                "a record in {final_state} must refuse a delete with If-Match {precondition}: {}",
                response.text()
            );
            let body = response.json::<Value>();
            assert_eq!(body["error"], "RECORD_FINAL");
            assert_eq!(body["conflict"]["overwritable"], json!(false));
            assert_eq!(body["conflict"]["status"]["isFinal"], json!(true));
        }
        let still = request
            .get(&url)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            still.status_code(),
            200,
            "a completed transaction must still be readable"
        );
    })
    .await;
}

/// Two moves race out of one state: one lands, the other is refused.
#[tokio::test]
#[serial]
async fn of_two_moves_out_of_one_state_one_lands() {
    support::with_app(|request, _ctx, token| async move {
        let Some(&(entity_name, status_field, initial, targets)) = FIRST_MOVES
            .iter()
            .find(|(_, _, _, targets)| !targets.is_empty())
        else {
            return; // no machine draws a move out of its initial state
        };
        let meta = ENTITIES
            .iter()
            .find(|meta| meta.name == entity_name)
            .expect("a machine names a declared entity");
        let read = create_with_parents(&request, &token, meta, &[(status_field, json!(initial))])
            .await
            .unwrap_or_else(|| panic!("could not create a {} in {}", meta.name, initial));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let url = format!("/api/bus/{}/{id}", meta.route);
        let second = targets.get(1).copied().unwrap_or(targets[0]);

        // Both people read the record in its initial state, and each names the
        // version it read. Without that the race has no fixed starting point:
        // a request whose own read lands after the other's commit sees the new
        // state, and when the model draws an edge onward from it (Lead:
        // working → disqualified) that is a legal second move, not a race.
        let read_at = if_match(&read);
        let moves = [targets[0], second]
            .into_iter()
            .map(|to| {
                let request = &request;
                let token = &token;
                let url = &url;
                let read_at = read_at.as_str();
                async move {
                    request
                        .patch(url)
                        .add_header("authorization", bearer(token))
                        .add_header("if-match", read_at)
                        .json(&json!({ status_field: to }))
                        .await
                        .status_code()
                        .as_u16()
                }
            })
            .collect::<Vec<_>>();
        let mut statuses = all(moves).await;
        statuses.sort_unstable();

        assert_eq!(
            statuses,
            vec![200, 409],
            "of two moves out of {initial} made from one read, exactly one lands \
             and the other is told the record changed: {statuses:?}"
        );
    })
    .await;
}

/// A successful save says where the record's transaction stands.
#[tokio::test]
#[serial]
async fn a_save_reports_the_transaction_status() {
    support::with_app(|request, _ctx, token| async move {
        let Some(&(entity_name, status_field, initial, _)) = FIRST_MOVES.first() else {
            return; // the model declares no state machine
        };
        let meta = ENTITIES
            .iter()
            .find(|meta| meta.name == entity_name)
            .expect("a machine names a declared entity");
        let read = create_with_parents(&request, &token, meta, &[(status_field, json!(initial))])
            .await
            .unwrap_or_else(|| panic!("could not create a {} in {}", meta.name, initial));
        let id = read["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let field = meta
            .first_text_field()
            .map_or(status_field, |field| field.name);

        let response = request
            .patch(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&read))
            .json(&json!({ field: read[field].clone() }))
            .await;
        assert_eq!(response.status_code(), 200, "{}", response.text());
        let status = &response.json::<Value>()["transactionStatus"];
        assert_eq!(status["field"], json!(status_field));
        assert_eq!(status["value"], json!(initial));
        assert_eq!(status["isFinal"], json!(false));
        assert!(status["label"]
            .as_str()
            .is_some_and(|label| !label.is_empty()));
    })
    .await;
}
