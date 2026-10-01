//! OpenAPI 3.1 description of the API, and the three UIs that render it.
//!
//! **Why utoipa directly and not `loco-openapi`.** That crate is the documented
//! route and is a thin initializer over these same libraries — but it depends on
//! `loco-rs ^0.16`, and this app is on 1.0. Adding it links two copies of
//! loco-rs, which makes its `Initializer` a different type from the one
//! `Hooks::initializers` returns; it does not compile. utoipa is
//! framework-agnostic, so the spec and its UIs mount through Loco's own
//! `Routes` with a single loco-rs in the tree.
//!
//! Swagger UI is not among the visualisers: its crate downloads assets from
//! GitHub in a build script, which would make a generated app impossible to
//! compile without network access. Redoc and Scalar embed theirs.
//!
//! **What is described, and what cannot be.** Every routed handler on the
//! `/api` surface is described here — auth, the dictionary, business records,
//! rules, workflows and audit. `tests/requests/openapi.rs` walks the route
//! tables and fails if one gains a handler this document does not list, so the
//! two cannot drift apart silently.
//!
//! Two families are described as the generic contracts they actually are,
//! rather than expanded per table. `/api/bus/{entity}` and `/api/sys/{segment}`
//! are each served by one handler over whatever the Application Dictionary
//! holds, so their request and response shapes exist only at run time — the
//! entity is a path parameter, and `/api/bus/{entity}/meta` answers with the
//! shape. Inventing a path per table would produce a document that is wrong the
//! moment someone adds a column through the dictionary.
//!
//! Not described: `/v1/shape`, which is Electric's own protocol and is
//! mounted off `/api` for that reason. The workflow controller is also reachable
//! at `/api/workflow-definitions` and `/api/workflows/runs`, second and third
//! mounts of the same handlers; the document names one path per handler.

use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};
use utoipa_redoc::{Redoc, Servable as RedocServable};
use utoipa_scalar::{Scalar, Servable as ScalarServable};

/// Adds the bearer scheme every authenticated route uses.
///
/// Declared once here rather than repeated on each `#[utoipa::path]`, so the
/// "Authorize" button in the UIs applies to the whole document.
struct BearerAuth;

impl Modify for BearerAuth {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .description(Some(
                            "The token returned by `POST /api/auth/login`. \
                             The same token is also set as an httpOnly cookie.",
                        ))
                        .build(),
                ),
            );
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "workflow API",
        description = "\
Metadata-driven REST API for workflow.

Two families of route, and they behave differently:

* **`/api/bus/{entity}`** — business records. One generic controller serves
  every table the Application Dictionary describes, so the entity is a path
  parameter and the request body is whatever that entity's columns are. Ask
  `/api/bus/{entity}/meta` for the shape at run time. Writes are audited and
  pass through the rules engine before the record settles.
* **`/api/sys/*`** — the Application Dictionary itself: the tables, columns,
  windows and fields that describe the business tables. Reads are open, because
  the frontend builds its navigation from them before anyone logs in; writes
  need a token.
",
        version = "1.0.0",
    ),
    modifiers(&BearerAuth),
    paths(
        crate::controllers::auth::login,
        crate::controllers::auth::register,
        crate::controllers::auth::logout,
        crate::controllers::auth::current,
        crate::controllers::auth::change_password,
        crate::controllers::me::health,
        crate::controllers::me::current,
        crate::controllers::me::permissions,
        crate::controllers::me::dashboard,
        crate::controllers::ai::query,
        crate::controllers::bus::list,
        crate::controllers::bus::lookup,
        crate::controllers::bus::get_one,
        crate::controllers::bus::create,
        crate::controllers::bus::update,
        crate::controllers::bus::remove,
        crate::controllers::bus::meta,
        crate::controllers::bus::fields_form,
        crate::controllers::bus::fields_grid,
        crate::controllers::sys::index,
        crate::controllers::sys::list,
        crate::controllers::sys::get_one,
        crate::controllers::sys::create,
        crate::controllers::sys::update,
        crate::controllers::sys::remove,
        crate::controllers::sys::fields_form,
        crate::controllers::sys::fields_grid,
        crate::controllers::sys::fields_batch_reorder,
        crate::controllers::sys::columns_direct,
        crate::controllers::sys::window_help,
        crate::controllers::sys::categories_with_entities,
        crate::controllers::sys::category_entities,
        crate::controllers::sys::categories_unassign,
        crate::controllers::audit::list,
        crate::controllers::audit::verify,
        crate::controllers::audit::verify_entry,
        crate::controllers::audit::entity_types,
        crate::controllers::jobs::list,
        crate::controllers::jobs::enqueue,
        crate::controllers::jobs::cancel,
        crate::controllers::records::history,
        crate::controllers::records::notes,
        crate::controllers::records::add_note,
        crate::controllers::rules::list,
        crate::controllers::rules::get_one,
        crate::controllers::rules::create,
        crate::controllers::rules::update,
        crate::controllers::rules::remove,
        crate::controllers::rules::evaluate,
        crate::controllers::rules::validate,
        crate::controllers::rules::dry_run,
        crate::controllers::rules::entities,
        crate::controllers::rules::history,
        crate::controllers::rules::migrate,
        crate::controllers::report::list,
        crate::controllers::report::show,
        crate::controllers::report::run,
        crate::controllers::workflow::list,
        crate::controllers::workflow::get_one,
        crate::controllers::workflow::create,
        crate::controllers::workflow::update,
        crate::controllers::workflow::remove,
        crate::controllers::workflow::execute,
        crate::controllers::workflow::runs,
        crate::controllers::workflow::transitions,
        crate::controllers::workflow::entity_runs,
    ),
    tags(
        (name = "auth", description = "Sign in, register, and the current session"),
        (name = "bus", description = "Business records — one generic contract over every dictionary table"),
        (name = "sys", description = "The Application Dictionary"),
        (name = "audit", description = "The audit trail and its hash chain"),
        (name = "rules", description = "Business rules (GoRules JDM decision graphs)"),
        (name = "workflow", description = "Workflow definitions and their run log"),
        (name = "reports", description = "The questions the model declared in its reports"),
    )
)]
pub struct ApiDoc;

/// The raw document, for a client generator or a diff in CI.
pub fn spec() -> utoipa::openapi::OpenApi {
    ApiDoc::openapi()
}

/// Mount `/redoc`, `/scalar` and the raw spec.
///
/// Returned as a stateless axum `Router` and merged by `Hooks::after_routes`,
/// because these come from utoipa's own servables rather than from Loco
/// handlers — `Routes` has nowhere to put them, and none of them touch
/// `AppContext`.
pub fn router() -> axum::Router {
    let doc = spec();

    // `/openapi.json` is served explicitly rather than by a UI crate, so a
    // client generator has a stable URL that does not depend on which
    // visualiser happens to be mounted.
    let raw = doc.clone();

    axum::Router::new()
        .merge(Redoc::with_url("/redoc", doc.clone()))
        .merge(Scalar::with_url("/scalar", doc))
        .route(
            "/openapi.json",
            axum::routing::get(move || {
                let spec = raw.clone();
                async move { axum::Json(spec) }
            }),
        )
}
