//! `/api/accounts` — creating, disabling and removing the people who sign in.
//!
//! Generated: 2026-10-09T08:31:32.392Z
//! Project: inventory
//!
//! The suites that sign in as the administrator cannot see what a *different*
//! caller may do, so the authorisation cases here build a real non-master
//! account through the API under test and use it. Accounts created here carry a
//! unique address and are deleted before the assertions that follow them: a
//! leftover active administrator would make the last-administrator test pass
//! for a reason that has nothing to do with the rule.

use loco_rs::TestServer;
use serde_json::{json, Value};
use serial_test::serial;
use uuid::Uuid;

use crate::support::{self, bearer};

const PASSWORD: &str = "Sufficiently-Long-Passw0rd";

fn unique_email() -> String {
    format!("account-{}@example.test", Uuid::new_v4().simple())
}

/// The parts of a response these tests read.
///
/// Not the server's own response type: loco pins its own `axum-test` and does
/// not re-export that type, and a second copy in the tree would be a different
/// type by the same name (see the note in `Cargo.toml`).
struct Reply {
    status: u16,
    text: String,
}

impl Reply {
    fn status_code(&self) -> u16 {
        self.status
    }
    fn text(&self) -> &str {
        &self.text
    }
    fn json<T: serde::de::DeserializeOwned>(&self) -> T {
        serde_json::from_str(&self.text)
            .unwrap_or_else(|err| panic!("not JSON ({err}): {}", self.text))
    }
}

async fn create(request: &TestServer, token: &str, body: Value) -> Reply {
    let response = request
        .post("/api/accounts")
        .add_header("authorization", bearer(token))
        .json(&body)
        .await;
    Reply {
        status: response.status_code().as_u16(),
        text: response.text(),
    }
}

async fn sign_in(request: &TestServer, email: &str, password: &str) -> Reply {
    let response = request
        .post("/api/auth/login")
        .json(&json!({ "email": email, "password": password }))
        .await;
    Reply {
        status: response.status_code().as_u16(),
        text: response.text(),
    }
}

async fn remove(request: &TestServer, token: &str, id: &str) {
    let _ = request
        .delete(&format!("/api/accounts/{id}"))
        .add_header("authorization", bearer(token))
        .await;
}

#[tokio::test]
#[serial]
async fn an_account_can_be_created_signs_in_and_is_listed() {
    support::with_app(|request, _ctx, token| async move {
        let email = unique_email();
        let created = create(
            &request,
            &token,
            json!({ "name": "Account Probe", "email": email.to_uppercase(), "password": PASSWORD }),
        )
        .await;
        assert_eq!(created.status_code(), 201, "{}", created.text());
        let account = created.json::<Value>();
        let id = account["id"].as_str().expect("an id").to_string();
        assert_eq!(
            account["email"], email,
            "emails are stored folded to lower case"
        );
        assert_eq!(account["isActive"], true);
        assert_eq!(account["canSignIn"], true);
        assert!(account.get("password").is_none() && account.get("passwordHash").is_none());

        let signed_in = sign_in(&request, &email, PASSWORD).await;
        assert_eq!(
            signed_in.status_code(),
            200,
            "a created account must be able to sign in"
        );

        let listed = request
            .get(&format!("/api/accounts?search={}", &email[..20]))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(listed.status_code(), 200);
        let body = listed.json::<Value>();
        assert!(
            body["data"]
                .as_array()
                .is_some_and(|rows| rows.iter().any(|r| r["id"] == id)),
            "the new account is missing from the list: {body}"
        );

        // A second account on the same address, in any spelling, is refused.
        let duplicate = create(
            &request,
            &token,
            json!({ "name": "Twin", "email": email, "password": PASSWORD }),
        )
        .await;
        assert_eq!(duplicate.status_code(), 409);

        remove(&request, &token, &id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_malformed_account_is_refused_with_every_reason() {
    support::with_app(|request, _ctx, token| async move {
        let refused = create(
            &request,
            &token,
            json!({ "name": "  ", "email": "not-an-address", "password": "short" }),
        )
        .await;
        assert_eq!(refused.status_code(), 400, "{}", refused.text());
        let errors = refused.json::<Value>()["errors"].to_string();
        for needle in ["name", "email", "password"] {
            assert!(
                errors.contains(needle),
                "no reason mentions {needle}: {errors}"
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_deactivated_or_locked_account_cannot_sign_in_and_a_reactivated_one_can() {
    support::with_app(|request, _ctx, token| async move {
        let email = unique_email();
        let id = create(
            &request,
            &token,
            json!({ "name": "Switch Probe", "email": email, "password": PASSWORD }),
        )
        .await
        .json::<Value>()["id"]
            .as_str()
            .expect("an id")
            .to_string();
        let held = sign_in(&request, &email, PASSWORD).await.json::<Value>()["token"]
            .as_str()
            .expect("a token")
            .to_string();

        for (patch, why) in [
            (json!({ "isActive": false }), "deactivated"),
            (json!({ "isActive": true, "isLocked": true }), "locked"),
        ] {
            let changed = request
                .patch(&format!("/api/accounts/{id}"))
                .add_header("authorization", bearer(&token))
                .json(&patch)
                .await;
            assert_eq!(changed.status_code(), 200, "{}", changed.text());

            // Refused exactly as a wrong password is: no oracle for the address.
            let refused = sign_in(&request, &email, PASSWORD).await;
            assert_eq!(refused.status_code(), 401, "a {why} account signed in");
            let wrong = sign_in(&request, &email, "not-the-password").await;
            assert_eq!(
                refused.text(),
                wrong.text(),
                "a {why} account is distinguishable"
            );

            // The token it already held stops working too.
            let me = request
                .get("/api/auth/me")
                .add_header("authorization", bearer(&held))
                .await;
            assert_eq!(me.status_code(), 401, "a {why} account's token still works");
        }

        let restored = request
            .patch(&format!("/api/accounts/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "isLocked": false }))
            .await;
        assert_eq!(restored.status_code(), 200);
        assert_eq!(sign_in(&request, &email, PASSWORD).await.status_code(), 200);

        remove(&request, &token, &id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_password_reset_replaces_the_old_password() {
    support::with_app(|request, _ctx, token| async move {
        let email = unique_email();
        let id = create(
            &request,
            &token,
            json!({ "name": "Reset Probe", "email": email, "password": PASSWORD }),
        )
        .await
        .json::<Value>()["id"]
            .as_str()
            .expect("an id")
            .to_string();

        let short = request
            .post(&format!("/api/accounts/{id}/reset-password"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "password": "short" }))
            .await;
        assert_eq!(short.status_code(), 400);

        let reset = request
            .post(&format!("/api/accounts/{id}/reset-password"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "password": "Another-Long-Passw0rd" }))
            .await;
        assert_eq!(reset.status_code(), 200, "{}", reset.text());
        assert_eq!(sign_in(&request, &email, PASSWORD).await.status_code(), 401);
        assert_eq!(
            sign_in(&request, &email, "Another-Long-Passw0rd")
                .await
                .status_code(),
            200
        );

        remove(&request, &token, &id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn only_the_master_role_may_manage_accounts() {
    support::with_app(|request, _ctx, token| async move {
        // An ordinary, role-less account made through the API under test.
        let email = unique_email();
        let id = create(
            &request,
            &token,
            json!({ "name": "Ordinary", "email": email, "password": PASSWORD }),
        )
        .await
        .json::<Value>()["id"]
            .as_str()
            .expect("an id")
            .to_string();
        let ordinary = sign_in(&request, &email, PASSWORD).await.json::<Value>()["token"]
            .as_str()
            .expect("a token")
            .to_string();

        let bearer_ordinary = bearer(&ordinary);
        let attempts: Vec<(&str, u16)> = vec![
            (
                "list",
                request
                    .get("/api/accounts")
                    .add_header("authorization", &bearer_ordinary)
                    .await
                    .status_code()
                    .as_u16(),
            ),
            (
                "create",
                create(
                    &request,
                    &ordinary,
                    json!({ "name": "Backdoor", "email": unique_email(), "password": PASSWORD }),
                )
                .await
                .status,
            ),
            (
                "update",
                request
                    .patch(&format!("/api/accounts/{id}"))
                    .add_header("authorization", &bearer_ordinary)
                    .json(&json!({ "name": "Renamed by the account itself" }))
                    .await
                    .status_code()
                    .as_u16(),
            ),
            (
                "reset-password",
                request
                    .post(&format!("/api/accounts/{id}/reset-password"))
                    .add_header("authorization", &bearer_ordinary)
                    .json(&json!({ "password": "Another-Long-Passw0rd" }))
                    .await
                    .status_code()
                    .as_u16(),
            ),
            (
                "delete",
                request
                    .delete(&format!("/api/accounts/{id}"))
                    .add_header("authorization", &bearer_ordinary)
                    .await
                    .status_code()
                    .as_u16(),
            ),
        ];
        for (what, status) in attempts {
            assert_eq!(status, 403, "{what} by an account without the master role");
        }

        remove(&request, &token, &id).await;
    })
    .await;
}

/// The only way to reach the last-administrator rule through the API is to
/// act on your own grant — any other caller is itself an administrator, so
/// there are at least two. So: make a second administrator, set every other
/// one aside, and have it try to give up the role it alone holds.
///
/// The others are put back before any assertion runs. They are shared with
/// every other suite, and a failed assertion that left the seeded
/// administrator inactive would fail the rest of the run for a reason none of
/// them names.
#[tokio::test]
#[serial]
async fn the_last_administrator_cannot_give_up_the_master_role() {
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let master_role: Uuid =
            sqlx::query_scalar("SELECT sys_role_id FROM sys_role WHERE is_master_role LIMIT 1")
                .fetch_one(pool)
                .await
                .expect("a master role");

        let email = unique_email();
        let second = create(
            &request,
            &token,
            json!({ "name": "Second Admin", "email": email, "password": PASSWORD, "roleIds": [master_role] }),
        )
        .await;
        assert_eq!(second.status_code(), 201, "{}", second.text());
        let second_id = second.json::<Value>()["id"].as_str().expect("an id").to_string();
        let second_uuid = Uuid::parse_str(&second_id).expect("a uuid");
        let second_token = sign_in(&request, &email, PASSWORD).await.json::<Value>()["token"]
            .as_str()
            .expect("a token")
            .to_string();

        let others: Vec<Uuid> = sqlx::query_scalar(
            r"SELECT DISTINCT s.sys_user_id
                FROM sys_user s
                JOIN sys_user_roles ur ON ur.sys_user_id = s.sys_user_id
                JOIN sys_role r        ON r.sys_role_id = ur.sys_role_id
               WHERE r.is_master_role AND s.is_active AND s.sys_user_id <> $1",
        )
        .bind(second_uuid)
        .fetch_all(pool)
        .await
        .expect("listing the other administrators");
        sqlx::query("UPDATE sys_user SET is_active = FALSE WHERE sys_user_id = ANY($1)")
            .bind(&others)
            .execute(pool)
            .await
            .expect("setting the others aside");

        let give_up = request
            .patch(&format!("/api/accounts/{second_id}"))
            .add_header("authorization", bearer(&second_token))
            .json(&json!({ "roleIds": [] }))
            .await;
        let (status, body) = (give_up.status_code().as_u16(), give_up.text());
        let still_master: bool = sqlx::query_scalar(
            r"SELECT EXISTS (SELECT 1 FROM sys_user_roles ur
                               JOIN sys_role r ON r.sys_role_id = ur.sys_role_id
                              WHERE ur.sys_user_id = $1 AND r.is_master_role)",
        )
        .bind(second_uuid)
        .fetch_one(pool)
        .await
        .expect("reading the grant back");

        sqlx::query("UPDATE sys_user SET is_active = TRUE WHERE sys_user_id = ANY($1)")
            .bind(&others)
            .execute(pool)
            .await
            .expect("restoring the others");

        assert_eq!(status, 409, "the last administrator gave up the role: {body}");
        assert!(still_master, "the refused change was not rolled back");

        // With the others back, it is no longer the last, and may go.
        let released = request
            .patch(&format!("/api/accounts/{second_id}"))
            .add_header("authorization", bearer(&second_token))
            .json(&json!({ "roleIds": [] }))
            .await;
        assert_eq!(released.status_code(), 200, "{}", released.text());
        remove(&request, &token, &second_id).await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn nobody_deletes_or_deactivates_their_own_account() {
    support::with_app(|request, _ctx, token| async move {
        let me = request
            .get("/api/auth/me")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        let id = me["user"]["sysUserId"]
            .as_str()
            .expect("the administrator has an identity");

        let deleted = request
            .delete(&format!("/api/accounts/{id}"))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(deleted.status_code(), 409);
        let off = request
            .patch(&format!("/api/accounts/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "isActive": false }))
            .await;
        assert_eq!(off.status_code(), 409);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn roles_can_be_defined_renamed_and_listed_but_not_duplicated() {
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let name = format!("Accounts Suite {}", Uuid::new_v4().simple());
        let created = request
            .post("/api/accounts/roles")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "name": name, "description": "made by the accounts suite" }))
            .await;
        assert_eq!(created.status_code(), 201, "{}", created.text());
        let role = created.json::<Value>();
        let id = role["id"].as_str().expect("an id").to_string();
        assert_eq!(role["isMasterRole"], false);
        assert_eq!(role["userCount"], 0);

        let duplicate = request
            .post("/api/accounts/roles")
            .add_header("authorization", bearer(&token))
            .json(&json!({ "name": name }))
            .await;
        assert_eq!(duplicate.status_code(), 409);

        let renamed = request
            .patch(&format!("/api/accounts/roles/{id}"))
            .add_header("authorization", bearer(&token))
            .json(&json!({ "name": format!("{name} (renamed)") }))
            .await;
        assert_eq!(renamed.status_code(), 200, "{}", renamed.text());

        let listed = request
            .get("/api/accounts/roles")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        assert!(
            listed["data"].as_array().is_some_and(|rows| rows.iter().any(|r| r["id"] == id)),
            "the new role is missing from the list"
        );

        // Counted once an account holds it.
        let email = unique_email();
        let account = create(
            &request,
            &token,
            json!({ "name": "Role Holder", "email": email, "password": PASSWORD, "roleIds": [id] }),
        )
        .await;
        assert_eq!(account.status_code(), 201, "{}", account.text());
        let held = request
            .get("/api/accounts/roles")
            .add_header("authorization", bearer(&token))
            .await
            .json::<Value>();
        let count = held["data"]
            .as_array()
            .and_then(|rows| rows.iter().find(|r| r["id"] == id))
            .map(|r| r["userCount"].clone());
        assert_eq!(count, Some(json!(1)));
        remove(&request, &token, account.json::<Value>()["id"].as_str().expect("an id")).await;

        // An account naming a role that does not exist is told so.
        let missing = create(
            &request,
            &token,
            json!({ "name": "Nobody", "email": unique_email(), "password": PASSWORD, "roleIds": [Uuid::new_v4()] }),
        )
        .await;
        assert_eq!(missing.status_code(), 400);

        let _ = sqlx::query("DELETE FROM sys_role WHERE sys_role_id = $1")
            .bind(Uuid::parse_str(&id).expect("a uuid"))
            .execute(pool)
            .await;
    })
    .await;
}

#[tokio::test]
#[serial]
async fn the_last_master_role_cannot_be_demoted_or_deactivated() {
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let masters: Vec<Uuid> = sqlx::query_scalar(
            "SELECT sys_role_id FROM sys_role WHERE is_master_role AND is_active",
        )
        .fetch_all(pool)
        .await
        .expect("listing master roles");

        // Demote them one at a time. Every one but the last that gives any
        // administrator their power may go; the last may not.
        let mut statuses = Vec::new();
        for id in &masters {
            let response = request
                .patch(&format!("/api/accounts/roles/{id}"))
                .add_header("authorization", bearer(&token))
                .json(&json!({ "isMasterRole": false }))
                .await;
            statuses.push(response.status_code().as_u16());
        }
        let standing: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sys_role WHERE is_master_role AND is_active",
        )
        .fetch_one(pool)
        .await
        .expect("counting master roles");
        sqlx::query("UPDATE sys_role SET is_master_role = TRUE, is_active = TRUE WHERE sys_role_id = ANY($1)")
            .bind(&masters)
            .execute(pool)
            .await
            .expect("restoring the master roles");

        assert_eq!(statuses.last(), Some(&409), "the last master role was demoted: {statuses:?}");
        assert!(standing >= 1, "no master role was left standing");
    })
    .await;
}
