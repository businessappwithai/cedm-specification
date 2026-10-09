//! One record's trail and its notes.
//!
//! Generated: 2026-10-09T06:46:29.059Z
//! Project: telecommunications

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, entities::ENTITIES, factory::create_with_parents};

/// A write shows up in the record's own history.
///
/// The same rows `/api/audit` serves, asked as "what happened to this one".
/// Worth its own test because the narrowing is done with two bound parameters
/// and an unbound one would quietly return the whole trail — every record's
/// history looking identical and nobody noticing until an auditor did.
#[tokio::test]
#[serial]
async fn a_record_carries_the_history_of_its_own_writes() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(created) = create_with_parents(&request, &token, entity, &[]).await else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        let response = request
            .get(&format!("/api/records/{}/{id}/history", entity.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200, "history: {}", response.text());

        let body = response.json::<Value>();
        let rows = body["data"].as_array().cloned().unwrap_or_default();

        // The create is audited only when the table carries `is_changelog`, so
        // an empty trail is legitimate. What must never happen is entries for a
        // *different* record.
        for row in &rows {
            assert_eq!(
                row.get("entity_id").and_then(Value::as_str),
                Some(id.as_str()),
                "history returned an entry for another record: {row}"
            );
            assert_eq!(
                row.get("entity_type").and_then(Value::as_str),
                Some(entity.table_name),
                "history returned an entry for another table: {row}"
            );
            // `changed_fields` is TEXT[] and NOT NULL DEFAULT '{}', so every
            // entry has one. It reached callers as `null` for as long as
            // `row_json` had no array arm — the field that says what an update
            // touched, reporting nothing, on every entry in the trail.
            assert!(
                row.get("changed_fields").is_some_and(Value::is_array),
                "changed_fields is not a JSON array: {row}"
            );
        }
        assert_eq!(
            body["meta"]["recordId"].as_str(),
            Some(id.as_str()),
            "meta does not name the record it answered for"
        );
    })
    .await;
}

/// A note is stored, attributed to the caller, and read back newest first.
#[tokio::test]
#[serial]
async fn a_note_is_stored_against_the_record_and_attributed_to_its_author() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(created) = create_with_parents(&request, &token, entity, &[]).await else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();
        let path = format!("/api/records/{}/{id}/notes", entity.route);

        let first = request
            .post(&path)
            .add_header("authorization", bearer(&token))
            .json(&json!({ "note": "First note" }))
            .await;
        assert_eq!(first.status_code(), 201, "add note: {}", first.text());

        let stored = first.json::<Value>();
        assert_eq!(
            stored.get("note").and_then(Value::as_str),
            Some("First note")
        );
        // Attribution comes from the token, never the body — a note whose
        // author the caller chooses is not attribution.
        assert_eq!(
            stored.get("user_email").and_then(Value::as_str),
            Some(support::ADMIN_EMAIL),
            "the note was not attributed to the signed-in user: {stored}"
        );

        let second = request
            .post(&path)
            .add_header("authorization", bearer(&token))
            .json(&json!({ "note": "Second note", "user_email": "impostor@example.test" }))
            .await;
        assert_eq!(second.status_code(), 201);
        assert_eq!(
            second
                .json::<Value>()
                .get("user_email")
                .and_then(Value::as_str),
            Some(support::ADMIN_EMAIL),
            "a caller set its own attribution by putting user_email in the body"
        );

        let listed = request
            .get(&path)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(listed.status_code(), 200);
        let notes = listed.json::<Value>();
        let notes = notes.as_array().cloned().unwrap_or_default();
        assert_eq!(notes.len(), 2, "expected both notes on this record");
        assert_eq!(
            notes[0].get("note").and_then(Value::as_str),
            Some("Second note"),
            "notes are not newest first"
        );
    })
    .await;
}

/// An empty note is refused rather than stored.
#[tokio::test]
#[serial]
async fn an_empty_note_is_refused() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(created) = create_with_parents(&request, &token, entity, &[]).await else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        for body in [json!({ "note": "   " }), json!({})] {
            let response = request
                .post(&format!("/api/records/{}/{id}/notes", entity.route))
                .add_header("authorization", bearer(&token))
                .json(&body)
                .await;
            assert_eq!(
                response.status_code(),
                400,
                "an empty note was accepted: {body}"
            );
        }
    })
    .await;
}

/// A caller who may not read the entity may not read its history or its notes.
///
/// This is the whole reason these routes exist separately from `/api/audit`:
/// the permission is that entity's own `read`, not administrator. A route that
/// narrowed the question but not the check would be a way around the guard on
/// `/api/bus/*` — the trail carries the record's `before` and `after`, so
/// reading the history of a record is reading the record.
#[tokio::test]
#[serial]
async fn an_ungranted_caller_is_refused_the_trail_and_the_notes() {
    support::with_app(|request, _ctx, admin_token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(created) = create_with_parents(&request, &admin_token, entity, &[]).await else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        // A freshly registered account: authenticated, and holding nothing.
        let email = format!("notes-probe-{}@example.test", uuid::Uuid::new_v4().simple());
        let password = "Sufficiently-Long-Passw0rd";
        let registered = request
            .post("/api/auth/register")
            .json(&json!({ "email": &email, "password": password, "name": "Notes Probe" }))
            .await;
        assert_eq!(registered.status_code(), 201, "{}", registered.text());

        let token = request
            .post("/api/auth/login")
            .json(&json!({ "email": &email, "password": password }))
            .await
            .json::<Value>()["token"]
            .as_str()
            .expect("login returns a token")
            .to_string();

        for path in [
            format!("/api/records/{}/{id}/history", entity.route),
            format!("/api/records/{}/{id}/notes", entity.route),
        ] {
            let refused = request
                .get(&path)
                .add_header("authorization", bearer(&token))
                .await;
            assert_eq!(
                refused.status_code(),
                403,
                "an authenticated user with no grant read {path}"
            );
        }

        let refused_write = request
            .post(&format!("/api/records/{}/{id}/notes", entity.route))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "note": "should not land" }))
            .await;
        assert_eq!(refused_write.status_code(), 403);
    })
    .await;
}
