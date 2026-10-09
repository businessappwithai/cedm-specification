//! What the model's access rules compile to, enforced on the request.
//!
//! Generated: 2026-10-09T15:28:09.300Z
//! Project: container-logistics
//!
//! Every other suite in this crate signs in as the seeded administrator, who
//! holds a master role and therefore bypasses every role rule — so to them a
//! restricted operation and an open one look identical. These tests build their
//! own non-master caller, and they set up the rules themselves rather than
//! reading the ones the model happened to declare: a model with no access rules
//! would otherwise leave the whole enforcement path untested, and that is the
//! model most projects start from.
//!
//! Rows are removed before the assertions run, not after. `sys_operation_access`
//! is shared with every other suite in the process, and a failed assertion that
//! left a `read` restriction behind would fail the next twenty tests for a
//! reason none of them names.

use loco_rs::TestServer;
use serde_json::{json, Value};
use serial_test::serial;
use sqlx::PgPool;
use uuid::Uuid;

use crate::support::{self, bearer, entities::ENTITIES, factory::create_with_parents};

/// The role the probe account holds. Spelled with a space here and matched
/// against `sales_manager`-style directive spellings by the guard's own
/// normalisation, which is the thing worth testing: `sys_role.name` is
/// title-cased for display and an access rule writes the model's spelling.
const PROBE_ROLE: &str = "Rbac Probe Role";

/// A role nobody holds, used to close an operation.
const OTHER_ROLE: &str = "rbac_other_role";

/// Register an account, give it a `sys_user`, the probe role, and a read/write
/// `sys_access` grant on `table_name`'s window.
///
/// The grant matters: without it the dictionary's own gate refuses the request
/// before any access rule is consulted, and a test built on that would pass
/// with the rules doing nothing at all.
async fn granted_probe(request: &TestServer, pool: &PgPool, table_name: &str) -> Option<String> {
    let email = format!("rbac-probe-{}@example.test", Uuid::new_v4().simple());
    let password = "Sufficiently-Long-Passw0rd";

    let registered = request
        .post("/api/auth/register")
        .json(&json!({ "email": &email, "password": password, "name": "RBAC Probe" }))
        .await;
    assert_eq!(
        registered.status_code(),
        201,
        "could not register the probe account: {}",
        registered.text()
    );

    let (role_id,): (Uuid,) = sqlx::query_as(
        r"INSERT INTO sys_role (
               sys_role_id, name, description, user_level, is_master_role,
               is_can_export, is_can_report, is_personal_lock, is_personal_access,
               max_query_records, is_show_accounting,
               entity_type, is_active, created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, 'Created by the rbac request suite', 'U', FALSE,
                   TRUE, TRUE, FALSE, FALSE, 0, FALSE,
                   'U', TRUE, 'test', 'test', NOW(), NOW())
           ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
           RETURNING sys_role_id",
    )
    .bind(PROBE_ROLE)
    .fetch_one(pool)
    .await
    .expect("creating the probe role");

    let (sys_user_id,): (Uuid,) = sqlx::query_as(
        r"INSERT INTO sys_user (
               sys_user_id, name, email, password_hash, description,
               is_system_user, is_sales_rep, login_failure_count, is_locked,
               is_account_verified, default_sys_role_id,
               entity_type, is_active, created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), 'RBAC Probe', $1, '!', 'Created by the rbac request suite',
                   FALSE, FALSE, 0, FALSE, TRUE, $2,
                   'D', TRUE, 'test', 'test', NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
           RETURNING sys_user_id",
    )
    .bind(&email)
    .bind(role_id)
    .fetch_one(pool)
    .await
    .expect("creating the probe sys_user");

    sqlx::query(
        r"INSERT INTO sys_user_roles (
               sys_user_roles_id, sys_user_id, sys_role_id,
               entity_type, is_active, created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'D', TRUE, 'test', 'test', NOW(), NOW())
           ON CONFLICT (sys_user_id, sys_role_id) DO NOTHING",
    )
    .bind(sys_user_id)
    .bind(role_id)
    .execute(pool)
    .await
    .expect("granting the probe role");

    sqlx::query("UPDATE users SET sys_user_id = $1 WHERE email = $2")
        .bind(sys_user_id)
        .bind(&email)
        .execute(pool)
        .await
        .expect("linking the credential row to sys_user");

    // The dictionary's own grant: role → window → tab → table.
    let window_id: Option<Uuid> = sqlx::query_scalar(
        r"SELECT tb.sys_window_id
            FROM sys_tab   tb
            JOIN sys_table t ON t.sys_table_id = tb.sys_table_id
           WHERE t.table_name = $1
           LIMIT 1",
    )
    .bind(table_name)
    .fetch_optional(pool)
    .await
    .expect("looking up the entity's window")
    .flatten();

    // A child entity has a tab but shares its parent's window, and an entity
    // with neither cannot be granted anything — skip rather than assert, so a
    // model whose first entity is a line item does not fail the suite.
    let window_id = window_id?;

    sqlx::query(
        r"INSERT INTO sys_access (
               sys_access_id, sys_role_id, sys_window_id, is_read_only, is_exclude,
               entity_type, is_active, created_by, updated_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, FALSE, FALSE,
                   'D', TRUE, 'test', 'test', NOW(), NOW())
           ON CONFLICT DO NOTHING",
    )
    .bind(role_id)
    .bind(window_id)
    .execute(pool)
    .await
    .expect("granting sys_access on the entity's window");

    let logged_in = request
        .post("/api/auth/login")
        .json(&json!({ "email": &email, "password": password }))
        .await;
    assert_eq!(
        logged_in.status_code(),
        200,
        "the probe account could not sign in"
    );
    Some(
        logged_in.json::<Value>()["token"]
            .as_str()
            .expect("login returns a token")
            .to_string(),
    )
}

/// Close `table_name`.`operation` to `role_name` and nobody else.
async fn restrict(pool: &PgPool, table_name: &str, operation: &str, role_name: &str) {
    sqlx::query(
        r"INSERT INTO sys_operation_access (
               sys_operation_access_id, table_name, operation, role_name,
               is_model_managed, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, FALSE, TRUE, NOW(), NOW())
           ON CONFLICT (table_name, operation, role_name) DO NOTHING",
    )
    .bind(table_name)
    .bind(operation)
    .bind(role_name)
    .execute(pool)
    .await
    .expect("inserting an operation rule");
}

/// Leave `table_name` with no operation rule in force.
///
/// This suite's own rules are deleted; the model's are set aside by
/// deactivating them, never deleted. Deleting by table took the model's rules
/// with it for the rest of the binary, so every later suite ran against an
/// application with fewer restrictions than the model declares.
/// `support::with_app` reactivates them on entry to the next test, including
/// after a test that failed before reaching its own cleanup.
async fn clear_rules(pool: &PgPool, table_name: &str) {
    let _ = sqlx::query(
        "DELETE FROM sys_operation_access WHERE table_name = $1 AND is_model_managed = FALSE",
    )
    .bind(table_name)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "UPDATE sys_operation_access SET is_active = FALSE, updated_at = NOW()
          WHERE table_name = $1 AND is_model_managed = TRUE",
    )
    .bind(table_name)
    .execute(pool)
    .await;
}

/// A rule closes an operation to the roles it names, and to nobody else.
///
/// Three states, in one test because they share an expensive setup and because
/// the interesting claim is the *transition* between them: the same caller, the
/// same request, allowed and then refused and then allowed again, with nothing
/// changing but a row in `sys_operation_access`.
#[tokio::test]
#[serial]
async fn an_operation_rule_admits_only_the_roles_it_names() {
    support::with_app(|request, ctx, admin_token| async move {
        let Some(entity) = ENTITIES.first() else { return };
        let pool = ctx.db.get_postgres_connection_pool();
        let path = format!("/api/bus/{}", entity.route);

        clear_rules(pool, entity.table_name).await;
        let Some(token) = granted_probe(&request, pool, entity.table_name).await else {
            return;
        };

        let read = |token: String| {
            let request = &request;
            let path = path.clone();
            async move {
                request
                    .get(&path)
                    .add_header("authorization", bearer(&token))
                    .await
                    .status_code()
                    .as_u16()
            }
        };

        // 1. No rules at all: the pair is unrestricted, and the dictionary's
        //    grant is the only thing that had to pass. This is what keeps
        //    the access rules additive — a model declaring none behaves as it always did.
        let unrestricted = read(token.clone()).await;

        // 2. A rule naming a role the probe does not hold closes the operation.
        restrict(pool, entity.table_name, "read", OTHER_ROLE).await;
        let closed = read(token.clone()).await;
        let master_while_closed = read(admin_token.clone()).await;

        // 3. A rule naming a role it *does* hold opens it again — spelled the
        //    way a directive would spell it, which the guard folds against the
        //    title-cased `sys_role.name`.
        restrict(pool, entity.table_name, "read", "rbac_probe_role").await;
        let reopened = read(token.clone()).await;

        // A different operation was never restricted, so it is still open.
        let other_operation_untouched = request
            .get(&format!("{path}/00000000-0000-4000-8000-000000000000"))
            .add_header("authorization", bearer(&token))
            .await
            .status_code()
            .as_u16();

        clear_rules(pool, entity.table_name).await;

        assert_eq!(
            unrestricted, 200,
            "a table with no rule rows refused a granted caller — the access rules are denying by default"
        );
        assert_eq!(
            closed, 403,
            "a rule naming only {OTHER_ROLE} still served a caller who does not hold it"
        );
        assert_eq!(
            master_while_closed, 200,
            "the master-role administrator was refused a restricted read; role rules must be \
             bypassed by master, exactly as the dictionary's grants are"
        );
        assert_eq!(
            reopened, 200,
            "a rule naming the caller's own role still refused it — the guard is not folding \
             `Rbac Probe Role` and `rbac_probe_role` to the same role"
        );
        assert_ne!(
            other_operation_untouched, 403,
            "restricting `read` on the list route also closed the detail route"
        );
    })
    .await;
}

/// A move the diagram never drew does not exist — for everyone.
///
/// The topology check and the role check are deliberately separate, and this is
/// the half that binds the administrator too. Merging them is how topology
/// enforcement comes to run only on the edges that happen to carry a role rule.
#[tokio::test]
#[serial]
async fn a_status_move_with_no_edge_is_refused_even_for_the_master_role() {
    support::with_app(|request, ctx, token| async move {
        // The first entity carrying a plain `status` column. A model with none
        // has no state machine to enforce, and nothing to assert.
        let Some(entity) = ENTITIES
            .iter()
            .find(|entity| entity.fields.iter().any(|field| field.name == "status"))
        else {
            return;
        };
        let pool = ctx.db.get_postgres_connection_pool();

        let Some(created) =
            create_with_parents(&request, &token, entity, &[("status", json!("draft"))]).await
        else {
            return;
        };
        let id = created["id"]
            .as_str()
            .expect("create returns an id")
            .to_string();

        // One edge, so the table has a machine at all. Without any rows the
        // guard has nothing to enforce and every move is legitimate.
        //
        // The id comes back only when this test created the row. When the model
        // already draws `draft → approved` the insert is a no-op and the edge is
        // the model's, so it is not this test's to remove — and the table's
        // other edges never are. Deleting by table once took every edge the
        // model drew for this entity with it, and `model_transitions` then
        // failed or passed depending on which of the two ran first.
        let probe_edge: Option<String> = sqlx::query_scalar(
            r"INSERT INTO sys_workflow_transitions (
                   sys_workflow_transition_id, table_name, status_field,
                   from_state, to_state, transition_name, is_active, created_at)
               VALUES (gen_random_uuid(), $1, 'status', 'draft', 'approved', 'approve', TRUE, NOW())
               ON CONFLICT (table_name, status_field, from_state, to_state) DO NOTHING
               RETURNING sys_workflow_transition_id::text",
        )
        .bind(entity.table_name)
        .fetch_optional(pool)
        .await
        .expect("seeding one transition edge");

        let patch = |to: &'static str| {
            let request = &request;
            let token = token.clone();
            let route = entity.route;
            let id = id.clone();
            async move {
                // `*`: this case is about who may move a record, not about
                // concurrent edits, and the two probes share one record.
                request
                    .patch(&format!("/api/bus/{route}/{id}"))
                    .add_header("authorization", bearer(&token))
                    .add_header("if-match", "*")
                    .json(&json!({ "status": to }))
                    .await
                    .status_code()
                    .as_u16()
            }
        };

        let undrawn = patch("nowhere").await;
        let drawn = patch("approved").await;

        if let Some(edge) = probe_edge {
            let _ = sqlx::query(
                "DELETE FROM sys_workflow_transitions WHERE sys_workflow_transition_id = $1::uuid",
            )
            .bind(edge)
            .execute(pool)
            .await;
        }

        assert_eq!(
            undrawn, 400,
            "the master-role administrator moved {} to a state no edge reaches; topology is a \
             description of what exists, not a permission a role can hold",
            entity.table_name
        );
        assert_eq!(
            drawn, 200,
            "a move the diagram does draw was refused — the guard is refusing everything rather \
             than checking the edge"
        );
    })
    .await;
}

/// The dictionary's own tables are the authorization model, so writing them is
/// administering it.
///
/// `/api/sys/*` writes used to require only a token. That is a complete bypass
/// of everything above: `sys_role` carries `is_master_role`, `sys_user_roles`
/// is what grants a role, and `sys_access` is the first of the three gates — so
/// any account that could register could promote a role to master, grant itself
/// one, and arrive back at `/api/bus/*` holding everything. It was reachable in
/// three requests from a self-registered account with no roles at all.
///
/// These drive the same three doors as that account, and the probe here is the
/// stronger case: it holds a role and a `sys_access` grant, and must still be
/// refused, because what is being asked for is not access to a table — it is
/// the ability to rewrite who has access to every table.
#[tokio::test]
#[serial]
async fn dictionary_writes_are_refused_to_a_caller_without_the_master_role() {
    support::with_app(|request, ctx, _token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let Some(probe) = granted_probe(&request, pool, entity.table_name).await else {
            return;
        };

        // A role the probe does not hold, so a success here cannot be mistaken
        // for the probe editing something of its own.
        let (target_role,): (Uuid,) = sqlx::query_as(
            r"INSERT INTO sys_role (
                   sys_role_id, name, description, user_level, is_master_role,
                   is_can_export, is_can_report, is_personal_lock, is_personal_access,
                   max_query_records, is_show_accounting,
                   entity_type, is_active, created_by, updated_by, created_at, updated_at)
               VALUES (gen_random_uuid(), 'Rbac Escalation Target', 'Created by the rbac suite',
                       'U', FALSE, TRUE, TRUE, FALSE, FALSE, 0, FALSE,
                       'U', TRUE, 'test', 'test', NOW(), NOW())
               ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
               RETURNING sys_role_id",
        )
        .fetch_one(pool)
        .await
        .expect("creating the escalation target role");

        // 1. Promote a role to master — one PATCH, and every holder of that
        //    role bypasses every gate in this file.
        let promote = request
            .patch(&format!("/api/sys/roles/{target_role}"))
            .add_header("authorization", bearer(&probe))
            .json(&json!({ "is_master_role": true }))
            .await;
        assert_eq!(
            promote.status_code(),
            403,
            "a non-master caller promoted a role to master: {}",
            promote.text()
        );

        // 2. Grant a role. The body carries `created_by` because without it the
        //    request is refused for its *shape*, and a test that passed on a
        //    validation error would say nothing about authorization.
        let grant = request
            .post("/api/sys/user-roles")
            .add_header("authorization", bearer(&probe))
            .json(&json!({
                "sys_user_id": Uuid::new_v4(),
                "sys_role_id": target_role,
                "created_by": "probe",
                "updated_by": "probe",
            }))
            .await;
        assert_eq!(
            grant.status_code(),
            403,
            "a non-master caller granted a role: {}",
            grant.text()
        );

        // 3. Configuration. `ai_base_url` is where business data is sent, so an
        //    open write here is an exfiltration channel rather than a nuisance.
        let setting: Option<(Uuid,)> =
            sqlx::query_as("SELECT sys_system_id FROM sys_system WHERE config_key = 'ai_base_url'")
                .fetch_optional(pool)
                .await
                .expect("reading the ai_base_url setting");
        if let Some((setting_id,)) = setting {
            let repoint = request
                .patch(&format!("/api/sys/system/{setting_id}"))
                .add_header("authorization", bearer(&probe))
                .json(&json!({ "config_value": "https://elsewhere.example.test/v1" }))
                .await;
            assert_eq!(
                repoint.status_code(),
                403,
                "a non-master caller repointed the AI endpoint: {}",
                repoint.text()
            );
        }

        let _ = sqlx::query("DELETE FROM sys_role WHERE sys_role_id = $1")
            .bind(target_role)
            .execute(pool)
            .await;
    })
    .await;
}

/// The two halves the fix has to keep apart.
///
/// Reads stay open: the generated frontend builds its navigation from the
/// dictionary before anyone signs in, so closing them would break the sign-in
/// page itself. And the administrator must still be able to write, or the
/// admin screens the dictionary exists for stop working — a fix that refuses
/// everybody is not a fix.
#[tokio::test]
#[serial]
async fn the_dictionary_stays_readable_and_the_administrator_can_still_write() {
    support::with_app(|request, ctx, token| async move {
        let anonymous = request.get("/api/sys/tables?limit=1").await;
        assert_eq!(
            anonymous.status_code(),
            200,
            "dictionary reads must stay open — the frontend needs them before sign-in"
        );

        let pool = ctx.db.get_postgres_connection_pool();
        let setting: Option<(Uuid, Option<String>)> = sqlx::query_as(
            "SELECT sys_system_id, config_value FROM sys_system WHERE config_key = 'ai_model'",
        )
        .fetch_optional(pool)
        .await
        .expect("reading the ai_model setting");

        if let Some((setting_id, before)) = setting {
            let written = request
                .patch(&format!("/api/sys/system/{setting_id}"))
                .add_header("authorization", bearer(&token))
                .json(&json!({ "config_value": "written-by-the-administrator" }))
                .await;
            assert_eq!(
                written.status_code(),
                200,
                "the master-role administrator can no longer write the dictionary: {}",
                written.text()
            );

            let _ = sqlx::query("UPDATE sys_system SET config_value = $2 WHERE sys_system_id = $1")
                .bind(setting_id)
                .bind(before)
                .execute(pool)
                .await;
        }
    })
    .await;
}

/// Every table the dashboard offers, across all of its category groups.
async fn dashboard_tables(request: &TestServer, token: &str) -> Vec<String> {
    let response = request
        .get("/api/me/dashboard")
        .add_header("authorization", bearer(token))
        .await;
    assert_eq!(
        response.status_code(),
        200,
        "the dashboard did not answer: {}",
        response.text()
    );

    let body = response.json::<Value>();
    let mut tables = Vec::new();
    for group in body["data"].as_array().into_iter().flatten() {
        for entity in group["entities"].as_array().into_iter().flatten() {
            if let Some(name) = entity.get("table_name").and_then(Value::as_str) {
                tables.push(name.to_string());
            }
        }
    }
    tables
}

/// A read rule takes the entity off the dashboard, not just out of the API.
///
/// The failure this closes: the dashboard was built from
/// `/api/sys/categories/with-entities`, an unscoped dictionary read, so every
/// account was offered a card for every entity in the application and the three
/// gates then answered 403 on the ones it did not hold. A dashboard that offers
/// nine entities and refuses them cannot be told from a broken one.
///
/// Three states in one test, because the interesting claim is the transition:
/// the same caller, the same screen, offered and then not offered and then
/// offered again, with nothing changing but a row in `sys_operation_access`.
#[tokio::test]
#[serial]
async fn a_read_rule_removes_the_entity_from_the_dashboard() {
    support::with_app(|request, ctx, admin_token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let pool = ctx.db.get_postgres_connection_pool();

        clear_rules(pool, entity.table_name).await;
        let Some(token) = granted_probe(&request, pool, entity.table_name).await else {
            return;
        };

        assert!(
            dashboard_tables(&request, &token)
                .await
                .iter()
                .any(|t| t == entity.table_name),
            "{} is granted and unrestricted, so the dashboard must offer it",
            entity.table_name
        );

        // Closed to a role nobody holds.
        restrict(pool, entity.table_name, "read", OTHER_ROLE).await;
        assert!(
            !dashboard_tables(&request, &token)
                .await
                .iter()
                .any(|t| t == entity.table_name),
            "{} is closed to this caller and must not be offered",
            entity.table_name
        );

        // The master role bypasses the model's rules, so the administrator is
        // still offered it — which is what says the card disappeared because of
        // the rule rather than because the seed or the query lost the row.
        assert!(
            dashboard_tables(&request, &admin_token)
                .await
                .iter()
                .any(|t| t == entity.table_name),
            "the master role bypasses role rules, so {} must still be offered to it",
            entity.table_name
        );

        clear_rules(pool, entity.table_name).await;
        assert!(
            dashboard_tables(&request, &token)
                .await
                .iter()
                .any(|t| t == entity.table_name),
            "removing the rule must put {} back on the dashboard",
            entity.table_name
        );
    })
    .await;
}

/// The dashboard's scope and the request guard answer the same question.
///
/// `authz::readable_tables` states the two read gates over a set, where
/// `require_read` states them over one name. That is a second expression of
/// rules that already exist, and this is what stops the two drifting: it drives
/// both over every entity in the dictionary and fails on the first one they
/// disagree about — an entity offered on the dashboard and refused by the API,
/// or held back from the dashboard and served by the API.
///
/// Line items are the one deliberate difference and are excluded here. A child
/// declared with `parent: <Parent>` has no window of its own
/// and is reached by opening a parent record, so it is not a place to navigate
/// to — but its rows are readable, and `/api/bus/*` serves them.
#[tokio::test]
#[serial]
async fn the_dashboard_scope_agrees_with_the_request_guard() {
    support::with_app(|request, ctx, _admin_token| async move {
        let Some(first) = ENTITIES.first() else {
            return;
        };
        let pool = ctx.db.get_postgres_connection_pool();

        clear_rules(pool, first.table_name).await;
        let Some(token) = granted_probe(&request, pool, first.table_name).await else {
            return;
        };

        let offered = dashboard_tables(&request, &token).await;

        let mut compared = 0;
        let mut refused = 0;
        for entity in ENTITIES {
            // Read the line-item rule off `sys_tab` rather than recomputing it,
            // exactly as the endpoint does.
            let is_line_item: bool = sqlx::query_scalar(
                r"SELECT EXISTS (
                        SELECT 1 FROM sys_tab tb
                          JOIN sys_table t ON t.sys_table_id = tb.sys_table_id
                         WHERE t.table_name = $1 AND tb.tab_level > 0)",
            )
            .bind(entity.table_name)
            .fetch_one(pool)
            .await
            .expect("reading the entity's tab level");
            if is_line_item {
                continue;
            }

            let response = request
                .get(&format!("/api/bus/{}", entity.route))
                .add_header("authorization", bearer(&token))
                .await;
            let served = response.status_code() != 403;
            if !served {
                refused += 1;
            }

            assert_eq!(
                offered.iter().any(|t| t == entity.table_name),
                served,
                "the dashboard and /api/bus/{} disagree about {}: offered={}, status={}",
                entity.route,
                entity.table_name,
                offered.iter().any(|t| t == entity.table_name),
                response.status_code()
            );
            compared += 1;
        }

        // Both outcomes have to occur, or the test passes by agreeing on
        // nothing: the probe holds a grant on one entity and none on the rest.
        assert!(compared > 0, "no entity was compared");
        assert!(
            refused > 0,
            "every entity was served, so this run proved only that the two agree \
             when nothing is refused"
        );
    })
    .await;
}

/// Switching an account, or its role, off withdraws the access it was granted.
///
/// `sys_access` is read through `sys_user_roles`, and none of the three rows on
/// that path used to be consulted for being switched on — so deactivating an
/// account took its menu away and left `/api/bus/*` open to the token it
/// already held. Same shape as the other tests here: the same caller and the
/// same request, answered differently as one flag changes.
#[tokio::test]
#[serial]
async fn deactivating_an_account_or_its_role_withdraws_its_access() {
    support::with_app(|request, ctx, _admin_token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let pool = ctx.db.get_postgres_connection_pool();
        let path = format!("/api/bus/{}", entity.route);

        clear_rules(pool, entity.table_name).await;
        let Some(token) = granted_probe(&request, pool, entity.table_name).await else {
            return;
        };
        let read = || async {
            request
                .get(&path)
                .add_header("authorization", bearer(&token))
                .await
                .status_code()
                .as_u16()
        };

        let granted = read().await;

        // The role first: the grant is the role's, and the account is untouched.
        sqlx::query("UPDATE sys_role SET is_active = FALSE WHERE name = $1")
            .bind(PROBE_ROLE)
            .execute(pool)
            .await
            .expect("deactivating the role");
        let role_off = read().await;
        sqlx::query("UPDATE sys_role SET is_active = TRUE WHERE name = $1")
            .bind(PROBE_ROLE)
            .execute(pool)
            .await
            .expect("reactivating the role");
        let role_back = read().await;

        // Then the account, which holds a perfectly good role.
        sqlx::query("UPDATE sys_user SET is_active = FALSE WHERE name = 'RBAC Probe'")
            .execute(pool)
            .await
            .expect("deactivating the accounts");
        let account_off = read().await;
        // Locked is the other way to switch it off.
        sqlx::query(
            "UPDATE sys_user SET is_active = TRUE, is_locked = TRUE WHERE name = 'RBAC Probe'",
        )
        .execute(pool)
        .await
        .expect("locking the accounts");
        let account_locked = read().await;
        sqlx::query("UPDATE sys_user SET is_locked = FALSE WHERE name = 'RBAC Probe'")
            .execute(pool)
            .await
            .expect("unlocking the accounts");

        assert_eq!(granted, 200, "the probe was never granted access");
        assert_eq!(role_off, 403, "an inactive role still grants access");
        assert_eq!(
            role_back, 200,
            "reactivating the role did not restore access"
        );
        assert_eq!(account_off, 403, "an inactive account still reaches data");
        assert_eq!(account_locked, 403, "a locked account still reaches data");
    })
    .await;
}
