//! CRUD — AddressAddressType
//!
//! One module per entity, so a failure names the entity that broke instead of
//! collapsing every entity into one suite.
//!
//! Generated: 2026-10-09T06:43:15.359Z
//! Project: analytics

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{
    self, bearer,
    entities::entity,
    factory::{build_invalid_record, build_record, create_with_parents, marked},
    if_match, rows, total,
};

const ENTITY: &str = "AddressAddressType";

#[tokio::test]
#[serial]
async fn lists_records_with_pagination_metadata() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let response = request
            .get(&format!("/api/bus/{}?page=1&limit=10", meta.route))
            .add_header("authorization", bearer(&token))
            .await;

        assert_eq!(response.status_code(), 200);
        let body = response.json::<Value>();
        assert!(rows(&body).len() <= 10, "limit=10 should cap the page");
        assert!(
            body.pointer("/meta/total").is_some(),
            "no meta.total to paginate on"
        );
        let _ = total(&body);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn creates_and_reads_back_a_record() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));

        let id = created
            .get("id")
            .and_then(Value::as_str)
            .expect("create returned no id")
            .to_string();

        let fetched = request
            .get(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .await;

        assert_eq!(fetched.status_code(), 200);
        assert_eq!(
            fetched.json::<Value>().get("id").and_then(Value::as_str),
            Some(id.as_str())
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn persists_the_values_it_was_given() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let Some(text_field) = meta.first_text_field() else {
            return;
        };

        let marker = marked(text_field, "marker");
        let created = create_with_parents(
            &request,
            &token,
            meta,
            &[(text_field.name, json!(marker.clone()))],
        )
        .await
        .unwrap_or_else(|| panic!("could not create a {ENTITY}"));

        let id = created
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();
        let fetched = request
            .get(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .await;

        assert_eq!(
            fetched
                .json::<Value>()
                .get(text_field.name)
                .and_then(Value::as_str),
            Some(marker.as_str())
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn updates_with_patch_and_bumps_the_version() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let Some(text_field) = meta.first_text_field() else {
            return;
        };

        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));
        let id = created
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();
        let before = created.get("version").and_then(Value::as_i64).unwrap_or(0);

        let updated = marked(text_field, "patched");
        let response = request
            .patch(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&created))
            .json(&json!({ text_field.name: updated.clone() }))
            .await;

        assert!(
            response.status_code().is_success(),
            "PATCH failed: {}",
            response.text()
        );
        let body = response.json::<Value>();
        assert_eq!(
            body.get(text_field.name).and_then(Value::as_str),
            Some(updated.as_str())
        );
        assert!(
            body.get("version").and_then(Value::as_i64).unwrap_or(0) > before,
            "the version should advance so optimistic concurrency can detect a stale write"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn replaces_a_record_with_put() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));
        let id = created
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();

        let response = request
            .put(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .add_header("if-match", if_match(&created))
            .json(&Value::Object(build_record(meta)))
            .await;

        // A rejected replacement is a legitimate answer; a 500 is not.
        assert!(
            !response.status_code().is_server_error(),
            "PUT returned {}: {}",
            response.status_code(),
            response.text()
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_a_payload_missing_a_required_field() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let Some(invalid) = build_invalid_record(meta) else {
            return;
        };

        let response = request
            .post(&format!("/api/bus/{}", meta.route))
            .add_header("authorization", bearer(&token))
            .json(&Value::Object(invalid))
            .await;

        // The caller's mistake, not the server's: a 500 would tell a client to
        // retry a request that can never succeed.
        assert!(
            response.status_code().is_client_error(),
            "expected 4xx, got {}: {}",
            response.status_code(),
            response.text()
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn returns_404_for_an_unknown_id_and_400_for_a_malformed_one() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);

        let missing = request
            .get(&format!(
                "/api/bus/{}/00000000-0000-4000-8000-000000000000",
                meta.route
            ))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(missing.status_code(), 404);

        let malformed = request
            .get(&format!("/api/bus/{}/not-a-uuid", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert!(malformed.status_code().is_client_error());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn soft_deletes_a_record() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));
        let id = created
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();

        let deleted = request
            .delete(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(deleted.status_code(), 204);

        let after = request
            .get(&format!("/api/bus/{}/{id}", meta.route))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            after.status_code(),
            404,
            "a soft-deleted row should not be readable"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn requires_authentication() {
    support::with_app(|request, _ctx, _token| async move {
        let meta = entity(ENTITY);
        let response = request.get(&format!("/api/bus/{}", meta.route)).await;
        assert_eq!(response.status_code(), 401);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn exposes_every_writable_field_through_the_api() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));

        let returned = created.as_object().expect("create returned a non-object");
        let missing: Vec<&str> = meta
            .writable_fields()
            .map(|f| f.name)
            .filter(|name| !returned.contains_key(*name))
            .collect();

        assert!(
            missing.is_empty(),
            "{ENTITY} does not round-trip these fields: {missing:?}"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn clears_an_optional_field_with_an_explicit_null() {
    support::with_app(|request, _ctx, token| async move {
        let meta = entity(ENTITY);
        let fields: Vec<&str> = meta.optional_typed_fields().map(|f| f.name).collect();
        if fields.is_empty() {
            return;
        }

        let created = create_with_parents(&request, &token, meta, &[])
            .await
            .unwrap_or_else(|| panic!("could not create a {ENTITY}"));
        let id = created
            .get("id")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();

        // One field at a time, so a failure names the column. `null` is the
        // only way a caller can clear an optional value, and it is what the
        // generated form emits when you empty a number or date input — the
        // backend used to answer 400 to its own UI.
        // Each clear is a new version, so each names the one before it.
        let mut current = created.clone();
        for name in fields {
            let response = request
                .patch(&format!("/api/bus/{}/{id}", meta.route))
                .add_header("authorization", bearer(&token))
                .add_header("if-match", if_match(&current))
                .json(&json!({ name: Value::Null }))
                .await;

            assert!(
                response.status_code().is_success(),
                "clearing {ENTITY}.{name} with null failed: {} {}",
                response.status_code(),
                response.text()
            );
            current = response.json::<Value>();
            assert_eq!(
                current.get(name),
                Some(&Value::Null),
                "{ENTITY}.{name} did not read back as null after being cleared"
            );
        }
    })
    .await;
}
