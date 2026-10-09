//! Roles, users and what the signed-in caller may see.
//!
//! Generated: 2026-10-09T15:28:23.196Z
//! Project: ecommerce

use serde_json::Value;
use serial_test::serial;

use crate::support::{self, bearer, entities::ENTITIES, rows, ADMIN_EMAIL};

/// Routes that must refuse a caller with no token, and the verb to try them
/// with. Every other suite in this crate sends a bearer token on every request,
/// which is exactly how `/api/workflow*` stayed wide open while 246 tests
/// passed: nothing anywhere asserted what happens *without* one.
///
/// `/api/sys/*` reads are deliberately absent — the frontend builds its
/// navigation from the dictionary before anyone signs in — as are `auth` and
/// `/api/me/health`.
const GUARDED_ROUTES: &[(&str, &str)] = &[
    ("GET", "/api/workflow"),
    ("GET", "/api/workflow-definitions"),
    ("GET", "/api/workflows/runs"),
    ("GET", "/api/workflows/transitions"),
    (
        "GET",
        "/api/workflows/entity/bus_nothing/00000000-0000-0000-0000-000000000000",
    ),
    ("GET", "/api/audit"),
    ("GET", "/api/jobs"),
    (
        "GET",
        "/api/records/bus_user/00000000-0000-4000-8000-000000000000/history",
    ),
    (
        "GET",
        "/api/records/bus_user/00000000-0000-4000-8000-000000000000/notes",
    ),
    ("GET", "/api/rules"),
    ("GET", "/api/rules/entities"),
    // A report's rows are business data, and the list names every table the
    // model thought worth asking about, so both are guarded.
    ("GET", "/api/reports"),
    ("GET", "/api/reports/nothing"),
    ("GET", "/api/reports/nothing/run"),
    ("GET", "/api/me/permissions"),
    // Accounts carry every email address in the application and the means to
    // grant a role, so the list is guarded before it is checked for a master.
    ("GET", "/api/accounts"),
    // A lookup lists rows of the table it points at, so it is read-guarded.
    ("GET", "/api/bus/bus_user/lookup/id"),
    // The dashboard names every entity this caller may read, so it is a
    // listing of the application scoped to one account — guarded like the data
    // it points at, not like the dictionary metadata it is built from.
    ("GET", "/api/me/dashboard"),
    ("CREATE_WORKFLOW", "/api/workflow-definitions"),
    // The NL endpoint reads business data on the caller's behalf, so it is
    // guarded like the rest. Its JWT extractor runs before the add-on's
    // configuration is consulted, so an anonymous caller gets 401 rather than
    // the 503 an unconfigured add-on returns — which is what makes this
    // assertion meaningful even with no model server present.
    ("AI_QUERY", "/api/ai/query"),
];

/// A definition that parses, so the only thing that can refuse it is the
/// missing token.
///
/// This matters more than it looks. A bare `{}` body is rejected for a missing
/// field *before* the handler does anything, so a POST with an empty body
/// returns 400 whether or not the route is guarded — and a test built on that
/// would pass with `create` wide open. The payload below is valid, so a 2xx
/// means one thing only: an anonymous caller just stored an executable
/// workflow.
fn valid_definition() -> Value {
    serde_json::json!({
        "name": "anonymous-probe",
        "entityName": "sys_table",
        "operation": "ALL",
        "bpmnXml": concat!(
            r#"<?xml version="1.0" encoding="UTF-8"?>"#,
            r#"<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL""#,
            r#" xmlns:appwithai="http://appwithai.io/schema/1.0" id="D""#,
            r#" targetNamespace="http://appwithai.io/bpmn">"#,
            r#"<bpmn:process id="P" isExecutable="true">"#,
            r#"<bpmn:startEvent id="s"/><bpmn:endEvent id="e"/>"#,
            r#"</bpmn:process></bpmn:definitions>"#,
        ),
    })
}

/// An unauthenticated caller gets nowhere on a guarded route.
///
/// This is the regression gate for an authentication bypass that made the
/// `/api/bus/*` guard decorative: the workflow controller took no `auth::JWT`
/// on any handler, so anyone could POST a definition whose step was
/// `CreateEntity` on a business table, execute it, and write the row that the
/// bus route had just refused them.
#[tokio::test]
#[serial]
async fn guarded_routes_refuse_an_anonymous_caller() {
    support::with_app(|request, _ctx, token| async move {
        let mut reachable: Vec<String> = Vec::new();

        for (verb, route) in GUARDED_ROUTES {
            let response = match *verb {
                "CREATE_WORKFLOW" => request.post(route).json(&valid_definition()).await,
                // Same reasoning as `valid_definition`: a body that would
                // otherwise be rejected for its shape proves nothing about the
                // guard, so send one the handler would accept.
                "AI_QUERY" => {
                    request
                        .post(route)
                        .json(&serde_json::json!({ "query": "how many records are there" }))
                        .await
                }
                _ => request.get(route).await,
            };

            // A 2xx is the failure: it means the route ran for someone who
            // never signed in.
            if response.status_code().is_success() {
                reachable.push(format!("{verb} {route} -> {}", response.status_code()));
            }
        }

        assert!(
            reachable.is_empty(),
            "these routes served an unauthenticated caller: {reachable:#?}"
        );

        // Belt and braces: nothing the probe sent may have landed.
        let stored = request
            .get("/api/workflow-definitions")
            .add_header("authorization", bearer(&token))
            .await;
        if stored.status_code() == 200 {
            let names: Vec<String> = rows(&stored.json::<Value>())
                .iter()
                .filter_map(|r| r.get("name").and_then(Value::as_str))
                .map(str::to_string)
                .collect();
            assert!(
                !names.iter().any(|n| n == "anonymous-probe"),
                "an unauthenticated POST stored a workflow definition: {names:?}"
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn seeds_the_administrator_role() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/roles?limit=100").await;
        assert_eq!(response.status_code(), 200);

        let names: Vec<String> = rows(&response.json::<Value>())
            .iter()
            .filter_map(|r| r.get("name").and_then(Value::as_str))
            .map(str::to_lowercase)
            .collect();

        assert!(
            names.iter().any(|n| n == "administrator"),
            "got roles: {names:?}"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn seeds_the_administrator_user() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/users?limit=100").await;
        assert_eq!(response.status_code(), 200);

        let emails: Vec<String> = rows(&response.json::<Value>())
            .iter()
            .filter_map(|r| r.get("email").and_then(Value::as_str))
            .map(str::to_lowercase)
            .collect();

        assert!(emails.iter().any(|e| e == ADMIN_EMAIL));
    })
    .await;
}

#[tokio::test]
#[serial]
async fn grants_the_administrator_master_access() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/me/permissions")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200);

        let body = response.json::<Value>();
        assert_eq!(body.get("isMaster").and_then(Value::as_bool), Some(true));

        let windows = body
            .get("windows")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        assert!(
            !windows.is_empty(),
            "a master role sees every window; got none"
        );

        // The dashboard builds its navigation from these, so a window with no
        // route is a dead entry in the UI.
        for window in &windows {
            assert!(
                window.get("name").is_some(),
                "window without a name: {window}"
            );
            assert!(
                matches!(
                    window.get("category").and_then(Value::as_str),
                    Some("admin" | "business")
                ),
                "window with an unknown category: {window}"
            );
        }
    })
    .await;
}

/// A signed-in user with no grant is refused the data, not just the menu.
///
/// `/api/bus/*` used to require a token and nothing else. `sys_access` decided
/// which windows the UI rendered, so hiding an entity hid its menu entry and
/// left its endpoint open to anyone with any account — security by menu. The
/// dictionary described the grant; only the navigation read it.
///
/// The other suites cannot catch this. Every one of them signs in as the
/// seeded administrator, who holds a master role and therefore passes every
/// check, so a guarded endpoint and an open one look identical to them. This
/// test needs a caller who is genuinely authenticated and genuinely ungranted.
///
/// A freshly registered account is exactly that: `create_with_password` makes
/// an auth user with no `sys_user` link, so it holds no roles and no grants.
#[tokio::test]
#[serial]
async fn an_authenticated_user_without_a_grant_is_refused_the_data() {
    support::with_app(|request, _ctx, admin_token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let path = format!("/api/bus/{}", entity.route);

        let email = format!("ungranted-{}@example.test", uuid::Uuid::new_v4().simple());
        let password = "Sufficiently-Long-Passw0rd";

        let registered = request
            .post("/api/auth/register")
            .json(&serde_json::json!({
                "email": &email,
                "password": password,
                "name": "Ungranted Probe",
            }))
            .await;
        assert_eq!(
            registered.status_code(),
            201,
            "could not register the probe account: {}",
            registered.text()
        );

        let logged_in = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "email": &email, "password": password }))
            .await;
        assert_eq!(
            logged_in.status_code(),
            200,
            "probe account could not sign in"
        );
        let token = logged_in.json::<Value>()["token"]
            .as_str()
            .expect("login returns a token")
            .to_string();

        // The point of the test: authenticated, and still refused.
        let refused = request
            .get(&path)
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(
            refused.status_code(),
            403,
            "an authenticated user with no sys_access grant read {path} — the dictionary's \
             grant is not being enforced on the API, only in the navigation"
        );

        let refused_write = request
            .post(&path)
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({ "probe": "value" }))
            .await;
        assert_eq!(
            refused_write.status_code(),
            403,
            "an authenticated user with no sys_access grant wrote to {path}"
        );

        // And the guard discriminates rather than simply breaking the route:
        // the administrator still reads the same path.
        let allowed = request
            .get(&path)
            .add_header("authorization", bearer(&admin_token))
            .await;
        assert_eq!(
            allowed.status_code(),
            200,
            "the master-role administrator was refused {path}; the guard is too strict"
        );
    })
    .await;
}
