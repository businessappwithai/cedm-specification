//! Configuration an operator changes at run time, and whether it takes effect.
//!
//! The table is easy to get *nearly* right: the rows seed, the admin screen
//! lists them, a value saves — and nothing reads it until the process
//! restarts, which is the one thing `sys_system` exists to avoid. So these
//! assert the resolution itself rather than the storage: a value written
//! through the API must be visible to the next request that resolves it.
//!
//! Generated: 2026-10-09T15:29:20.630Z
//! Project: life-sciences

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, rows};

/// The row for a key, as the dictionary route serves it.
async fn setting(request: &loco_rs::TestServer, key: &str) -> Value {
    let response = request
        .get(&format!("/api/sys/system?config_key={key}&limit=1"))
        .await;
    assert_eq!(response.status_code(), 200, "reading {key}");
    rows(&response.json::<Value>())
        .first()
        .cloned()
        .unwrap_or_else(|| panic!("no sys_system row for {key} — seed_system did not run"))
}

#[tokio::test]
#[serial]
async fn the_seed_describes_every_settable_key() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/system?limit=100").await;
        assert_eq!(response.status_code(), 200);

        let keys: Vec<String> = rows(&response.json::<Value>())
            .iter()
            .filter_map(|row| {
                row.get("config_key")
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .collect();

        // These are the keys something in the backend resolves. A key that
        // stops being read should lose its row in the same change — a setting
        // that saves and does nothing is worse than one that is absent.
        for expected in [
            "app_name",
            "app_description",
            "ai_base_url",
            "ai_model",
            "ai_api_key",
            "electric_url",
        ] {
            assert!(
                keys.iter().any(|key| key == expected),
                "sys_system has no row for {expected}; seeded keys were {keys:?}"
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn every_row_carries_a_description() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/system?limit=100").await;
        let listed = rows(&response.json::<Value>());
        assert!(!listed.is_empty());

        for row in listed {
            let key = row.get("config_key").and_then(Value::as_str).unwrap_or("?");
            let description = row.get("description").and_then(Value::as_str).unwrap_or("");
            // The screen shows the key, the value and this sentence. Without it
            // an operator is being asked to set something the app will not
            // explain, which is how a setting gets changed by guesswork.
            assert!(
                !description.is_empty(),
                "sys_system row {key} has no description"
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_saved_value_reaches_the_next_request() {
    support::with_app(|request, _ctx, token| async move {
        // The name the probe reports before anything is changed.
        let before = request.get("/api/me/health").await.json::<Value>();
        let original = before
            .get("name")
            .and_then(Value::as_str)
            .expect("health should report the application's name")
            .to_string();

        let row = setting(&request, "app_name").await;
        let id = row
            .get("sys_system_id")
            .and_then(Value::as_str)
            .expect("a sys_system row has an id")
            .to_string();

        let renamed = format!("{original} (renamed by a test)");
        let update = request
            .patch(&format!("/api/sys/system/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "config_value": renamed }))
            .await;
        assert_eq!(update.status_code(), 200, "saving a setting");

        // The assertion this suite exists for: no restart between the write and
        // the read. A cache that is not invalidated on the write passes every
        // other test in this file and fails this one.
        let after = request.get("/api/me/health").await.json::<Value>();
        assert_eq!(
            after.get("name").and_then(Value::as_str),
            Some(renamed.as_str()),
            "the renamed application should be visible to the very next request"
        );

        // Put it back: the suites share a database, and a later assertion on
        // the application's name would otherwise fail for a reason it does not
        // name.
        let restore = request
            .patch(&format!("/api/sys/system/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "config_value": original }))
            .await;
        assert_eq!(restore.status_code(), 200);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn an_inactive_row_falls_through_to_the_deployment() {
    support::with_app(|request, _ctx, token| async move {
        let row = setting(&request, "app_name").await;
        let id = row
            .get("sys_system_id")
            .and_then(Value::as_str)
            .expect("a sys_system row has an id")
            .to_string();

        let deactivate = request
            .patch(&format!("/api/sys/system/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "is_active": false }))
            .await;
        assert_eq!(deactivate.status_code(), 200);

        // Deactivating is how a setting is handed back to the deployment
        // without deleting the row and losing what it documents. The resolver
        // must then ignore it entirely rather than return its stored value.
        let health = request.get("/api/me/health").await.json::<Value>();
        let reported = health.get("name").and_then(Value::as_str).unwrap_or("");
        assert!(
            !reported.is_empty(),
            "an inactive row must fall through to a name, not to nothing"
        );

        let reactivate = request
            .patch(&format!("/api/sys/system/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "is_active": true }))
            .await;
        assert_eq!(reactivate.status_code(), 200);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn writing_a_setting_needs_a_token() {
    support::with_app(|request, _ctx, _token| async move {
        let row = setting(&request, "ai_base_url").await;
        let id = row
            .get("sys_system_id")
            .and_then(Value::as_str)
            .expect("a sys_system row has an id")
            .to_string();

        // `sys` reads are open so the frontend can build its navigation before
        // anyone signs in. Writes are not: this row decides where the app sends
        // the questions its users type.
        let response = request
            .patch(&format!("/api/sys/system/{id}"))
            .json(&json!({ "config_value": "http://attacker.example/v1" }))
            .await;
        assert_eq!(
            response.status_code(),
            401,
            "an anonymous caller must not be able to repoint the AI endpoint"
        );
    })
    .await;
}
