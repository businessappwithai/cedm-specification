//! The OpenAPI document, and the guarantee that it keeps describing this app.
//!
//! A hand-maintained `paths(...)` list is exactly the kind of thing that is
//! correct on the day it is written and quietly wrong six commits later: adding
//! a handler is one edit, remembering to describe it is a second one nothing
//! enforces. `every_routed_handler_is_described` walks the controllers' own
//! route tables and fails on the first route the document does not carry, so
//! the reminder arrives from the test suite rather than from whoever was
//! reading the docs when they needed them.
//!
//! Generated: 2026-10-01T15:42:31.435Z
//! Project: artificial-intelligence

use loco_rs::controller::Routes;
use serde_json::Value;
use serial_test::serial;

use crate::support;

use artificial_intelligence::controllers;

/// Rebuild the URI Loco will mount a handler at.
///
/// Mirrors `AppRoutes::collect`: the prefix and the handler URI are joined with
/// `/`, repeated slashes collapse, and a trailing slash is dropped — which is
/// what turns the `"/"` that `list` registers into `/api/sys` rather than
/// `/api/sys/`.
fn mounted_uri(prefix: &str, handler_uri: &str) -> String {
    let joined = format!("/api/{prefix}/{handler_uri}");
    let mut uri = String::with_capacity(joined.len());
    let mut last_was_slash = false;
    for ch in joined.chars() {
        if ch == '/' && last_was_slash {
            continue;
        }
        last_was_slash = ch == '/';
        uri.push(ch);
    }
    if uri.len() > 1 {
        if let Some(trimmed) = uri.strip_suffix('/') {
            uri = trimmed.to_string();
        }
    }
    uri
}

/// The controllers mounted under `/api`, paired with the prefix each declares.
///
/// `electric` is absent on purpose: it serves Electric's `/v1/shape` protocol
/// and is mounted before `.prefix("/api")` for that reason. `workflow`'s two
/// alias mounts (`/api/workflow-definitions`, `/api/workflows/runs`) are absent
/// for a different reason — they are second and third URLs onto handlers this
/// list already covers through `/api/workflow`, and the document names one path
/// per handler.
fn api_routes() -> Vec<(&'static str, Routes)> {
    vec![
        ("auth", controllers::auth::routes()),
        ("me", controllers::me::routes()),
        ("bus", controllers::bus::routes()),
        ("sys", controllers::sys::routes()),
        ("audit", controllers::audit::routes()),
        ("rules", controllers::rules::routes()),
        ("workflow", controllers::workflow::routes()),
    ]
}

/// The document is served, and is a document.
#[tokio::test]
#[serial]
async fn serves_the_openapi_document() {
    support::with_app(|request, _ctx, _token| async move {
        // No token: a client generator fetches this before it can authenticate,
        // so a guard here would make the spec useless for the thing it is for.
        let response = request.get("/openapi.json").await;
        assert_eq!(response.status_code(), 200);

        let doc = response.json::<Value>();

        assert!(
            doc.get("openapi")
                .and_then(Value::as_str)
                .is_some_and(|v| v.starts_with("3.")),
            "not an OpenAPI 3.x document: {:?}",
            doc.get("openapi")
        );
        assert_eq!(
            doc.pointer("/info/title").and_then(Value::as_str),
            Some("artificial-intelligence API"),
        );
        assert!(
            doc.get("paths")
                .and_then(Value::as_object)
                .is_some_and(|p| !p.is_empty()),
            "the document describes no paths",
        );

        // Every guarded route in this app authenticates the same way, and the
        // scheme is declared once on the document rather than per operation —
        // which is what makes the "Authorize" button in Redoc and Scalar apply
        // to all of them.
        assert_eq!(
            doc.pointer("/components/securitySchemes/bearer/scheme")
                .and_then(Value::as_str),
            Some("bearer"),
        );
    })
    .await;
}

/// Both UIs render, and neither reaches the network to do it.
///
/// Swagger UI is deliberately not among them: its crate downloads assets in a
/// build script, which would make this app impossible to compile offline. Redoc
/// and Scalar embed theirs, and this test would catch a swap to something that
/// does not.
#[tokio::test]
#[serial]
async fn serves_both_api_browsers() {
    support::with_app(|request, _ctx, _token| async move {
        for path in ["/redoc", "/scalar"] {
            let response = request.get(path).await;
            assert_eq!(response.status_code(), 200, "{path} did not render");
            assert!(
                response.text().contains("<!DOCTYPE html>")
                    || response.text().contains("<!doctype html>"),
                "{path} served something that is not a page",
            );
        }
    })
    .await;
}

/// Every handler the app actually mounts under `/api` is in the document.
///
/// The failure this guards against is silent in the worst way: an undocumented
/// route still works, so nothing breaks — the spec just stops being true, and
/// the client generated from it is missing an endpoint nobody notices until
/// someone needs it.
#[tokio::test]
#[serial]
async fn every_routed_handler_is_described() {
    support::with_app(|request, _ctx, _token| async move {
        let doc = request.get("/openapi.json").await.json::<Value>();
        let paths = doc
            .get("paths")
            .and_then(Value::as_object)
            .expect("the document has no paths object");

        let mut undescribed: Vec<String> = Vec::new();

        for (prefix, routes) in api_routes() {
            for handler in &routes.handlers {
                let uri = mounted_uri(prefix, &handler.uri);
                let Some(operations) = paths.get(&uri).and_then(Value::as_object) else {
                    for action in &handler.actions {
                        undescribed.push(format!("{action} {uri} — path absent"));
                    }
                    continue;
                };

                for action in &handler.actions {
                    // PATCH and PUT reach the same handler on every resource
                    // here, and the document declares the PUT. Accepting the
                    // PUT for a PATCH keeps this from demanding a second,
                    // duplicate operation that would describe the same thing.
                    let method = action.to_string().to_ascii_lowercase();
                    let described = operations.contains_key(&method)
                        || (method == "patch" && operations.contains_key("put"));

                    if !described {
                        undescribed.push(format!("{action} {uri} — path present, verb missing"));
                    }
                }
            }
        }

        assert!(
            undescribed.is_empty(),
            "routes the app serves but the OpenAPI document does not describe:\n  {}\n\
             Add a #[utoipa::path(...)] to the handler and list it in `paths(...)` \
             in src/openapi.rs.",
            undescribed.join("\n  "),
        );
    })
    .await;
}

/// The generic families are described as generic, not expanded per table.
///
/// `/api/bus/{entity}` and `/api/sys/{segment}` are each one handler over
/// whatever the Application Dictionary holds. A document that named a path per
/// table would be wrong as soon as someone added an entity through the
/// dictionary — which they can, at run time, without regenerating anything.
#[tokio::test]
#[serial]
async fn describes_the_dictionary_driven_routes_generically() {
    support::with_app(|request, _ctx, _token| async move {
        let doc = request.get("/openapi.json").await.json::<Value>();
        let paths = doc.get("paths").and_then(Value::as_object).unwrap();

        assert!(
            paths.contains_key("/api/bus/{entity}"),
            "the generic bus path is missing"
        );
        assert!(
            paths.contains_key("/api/sys/{segment}"),
            "the generic sys path is missing"
        );

        let per_table: Vec<&String> = paths
            .keys()
            .filter(|p| p.starts_with("/api/bus/bus_") || p.starts_with("/api/sys/sys_"))
            .collect();
        assert!(
            per_table.is_empty(),
            "these paths name a specific table and will drift from the dictionary: {per_table:?}",
        );
    })
    .await;
}
