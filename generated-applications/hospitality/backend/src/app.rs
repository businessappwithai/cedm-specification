//! The wiring hub — `impl Hooks for App`.

use std::path::Path;

use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks},
    bgworker::BackgroundWorker,
    bgworker::Queue,
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};
use migration::Migrator;

use crate::controllers;
use crate::services::audit::AuditService;
use crate::services::dictionary::DictionaryCache;
use crate::services::dynamic_repo::DynamicRepo;
use crate::services::promotion::PromotionService;
use crate::services::rules_engine::RulesEngine;
use crate::services::system_config::SystemConfig;
use crate::services::workflow::WorkflowExecutor;
use crate::tasks;
use crate::workers;

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    /// Long-lived services go in `shared_store`, which is the DI container in
    /// Loco (§5.2). Both are cheap to clone — they hold a pool handle and a
    /// cache handle — which is what the `SharedStore<T>` extractor requires.
    async fn after_context(ctx: AppContext) -> Result<AppContext> {
        let pool = ctx.db.get_postgres_connection_pool().clone();
        ctx.shared_store.insert(DictionaryCache::new(pool.clone()));
        ctx.shared_store.insert(DynamicRepo::new(pool.clone()));
        ctx.shared_store.insert(RulesEngine::new());
        ctx.shared_store.insert(AuditService::new(pool.clone()));
        ctx.shared_store.insert(SystemConfig::new(pool.clone()));
        ctx.shared_store.insert(PromotionService::new(
            DynamicRepo::new(pool.clone()),
            RulesEngine::new(),
            // Its own executor, not the shared one: a rule's `trigger-workflow`
            // action runs the workflow it names, and both are cheap clones of a
            // pool handle.
            WorkflowExecutor::new(
                DynamicRepo::new(pool.clone()),
                DictionaryCache::new(pool.clone()),
            ),
        ));
        ctx.shared_store.insert(WorkflowExecutor::new(
            DynamicRepo::new(pool.clone()),
            DictionaryCache::new(pool),
        ));
        Ok(ctx)
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        // Route order matters. `AppRoutes::prefix` is not scoped — `add_route`
        // bakes whatever prefix is set *at that moment* into the route. So
        // anything that must stay off `/api` is added before `.prefix()` is
        // called, and everything after it is mounted under `/api`.
        //
        // (Verified against loco-rs 1.0.1 and 1.2.0 `app_routes.rs::add_route`. Using
        // `.nest_route("", ...)` after `.prefix("/api")` does NOT escape the
        // prefix — it appends to it.)
        AppRoutes::with_default_routes()
            // Electric serves /v1/shape and must stay off the /api prefix.
            .add_route(controllers::electric::routes())
            .prefix("/api")
            .add_route(controllers::auth::routes())
            .add_route(controllers::me::routes())
            .add_route(controllers::bus::routes())
            .add_route(controllers::sys::routes())
            .add_route(controllers::audit::routes())
            .add_route(controllers::records::routes())
            .add_route(controllers::jobs::routes())
            .add_route(controllers::rules::routes())
            .add_route(controllers::report::routes())
            // Always mounted; answers 503 until `ai_base_url`/`ai_model` are
            // configured. See the note in `controllers/ai.rs` for why this is
            // not conditionally emitted.
            .add_route(controllers::ai::routes())
            .add_route(controllers::workflow::routes())
            // `/api/workflows/runs` and `/api/workflow-definitions` are second
            // and third URLs onto the same handlers — see the doc comments on
            // those functions. `Routes::prefix` takes one segment, so each
            // needs its own route table.
            .add_route(controllers::workflow::run_routes())
            .add_route(controllers::workflow::definition_routes())
    }

    /// Mount the OpenAPI document and its three UIs.
    ///
    /// These are axum routers from utoipa's servables rather than Loco
    /// handlers, so they merge here instead of going through `AppRoutes`. They
    /// stay off the `/api` prefix on purpose: `/swagger` is a browser
    /// destination, not part of the API it describes.
    async fn after_routes(router: axum::Router, ctx: &AppContext) -> Result<axum::Router> {
        // Built once, at boot: the budgets come from configuration and the
        // secret a session token is verified against comes from the auth block,
        // and neither may cost a database round trip per request.
        let limiter = std::sync::Arc::new(crate::common::rate_limit::Limiter::from_context(ctx));

        Ok(router
            .merge(crate::openapi::router())
            // The limiter is layered *beneath* the request log deliberately.
            // `.layer(a).layer(b)` makes b the outer one, so the log wraps the
            // limiter and a 429 is reported as the refusal it is; the other
            // order would drop every refused request out of the log entirely,
            // which is the one class of traffic an operator most needs to see.
            .layer(axum::middleware::from_fn_with_state(
                limiter,
                crate::common::rate_limit::enforce,
            ))
            // One catalogued line per request, on the way out. Applied here, so
            // it wraps the merged router and sees every response — including a
            // 401 from the JWT extractor and a 404 for a route that does not
            // exist, neither of which reaches a handler. See
            // `common::http_log` for why that placement is the whole point.
            .layer(axum::middleware::from_fn(
                crate::common::http_log::log_request,
            )))
    }

    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        // Entity promotion is deliberately NOT registered here: it runs inline
        // so the create/update response can carry the final doc_status
        // (§6.7 option A). Only genuinely asynchronous work is queued.
        queue
            .register(workers::email::EmailWorker::build(ctx))
            .await?;
        queue
            .register(workers::report::ReportWorker::build(ctx))
            .await?;
        queue
            .register(workers::sync::SyncWorker::build(ctx))
            .await?;
        Ok(())
    }

    fn register_tasks(registry: &mut Tasks) {
        registry.register(tasks::seed_dictionary::SeedDictionary);
        registry.register(tasks::seed_rules::SeedRules);
        registry.register(tasks::seed_workflows::SeedWorkflows);
        registry.register(tasks::seed_access::SeedAccess);
        registry.register(tasks::seed_system::SeedSystem);
        registry.register(tasks::seed_business::SeedBusiness);
        registry.register(tasks::seed_reports::SeedReports);
        registry.register(tasks::ensure_admin::EnsureAdmin);
    }

    async fn truncate(ctx: &AppContext) -> Result<()> {
        // Used by the request test suites between cases. `loco_rs::db::truncate_table`
        // is generic over a SeaORM `EntityTrait`, which the dynamically-served
        // `bus_*` tables deliberately do not have — so this issues the
        // statement directly.
        use sea_orm::ConnectionTrait;
        ctx.db
            .execute_unprepared("TRUNCATE TABLE audit_log RESTART IDENTITY CASCADE")
            .await?;
        Ok(())
    }

    /// `cargo loco db seed` — the dictionary, the rules, the workflows, the
    /// access rules, the configuration, the demonstration records, then the
    /// administrator.
    ///
    /// Order matters and is not incidental: `ensure_admin` grants the
    /// Administrator role, which `seed_dictionary` is what creates. The
    /// workflows go between them because a saga names entities the dictionary
    /// has to already describe, and `seed_access` follows them because a
    /// transition rule names an edge a workflow drew. All seven are
    /// idempotent, so this is safe to run against a database that already has
    /// any of them.
    ///
    /// The `path` argument is Loco's fixture directory for SeaORM-entity
    /// seeding. Nothing here uses it — the dictionary is generated SQL and the
    /// `bus_*` tables have no entities by design — so it is ignored rather
    /// than made to look supported.
    /// Seeding is seven tasks, not a fixtures directory.
    ///
    /// `_path` is ignored on purpose. Loco offers a `--from` directory of YAML
    /// fixtures; this app's seed data is the Application Dictionary and the
    /// model's workflows, both generated as SQL and embedded in the binary with
    /// `include_str!`, so there is nothing on disk to read.
    ///
    /// That is also why every `cargo loco db seed` logs
    /// `WARN loco_rs::boot: seed: reset=false from=src/fixtures`. Loco emits
    /// that line unconditionally before it dispatches, naming the default path
    /// whether or not the hook uses it (`boot.rs`, `RunDbCommand::Seed`). The
    /// directory is deliberately absent — the scaffold's copy is pruned at
    /// generation — and the warning is Loco narrating its own default, not a
    /// missing file. Nothing to fix; do not add an empty `src/fixtures` to
    /// silence it.
    async fn seed(ctx: &AppContext, _path: &Path) -> Result<()> {
        use loco_rs::task::{Task, Vars};

        let vars = Vars::default();
        tasks::seed_dictionary::SeedDictionary
            .run(ctx, &vars)
            .await?;
        // Rules before workflows: a saga step may invoke a rule by name, and a
        // definition naming one that is not there yet is a step that does nothing.
        tasks::seed_rules::SeedRules.run(ctx, &vars).await?;
        tasks::seed_workflows::SeedWorkflows.run(ctx, &vars).await?;
        // Access rules before the administrator, for the same reason the
        // dictionary is: `seed_access` creates the roles an access rule
        // named, and `ensure_admin` grants a role that has to already exist.
        tasks::seed_access::SeedAccess.run(ctx, &vars).await?;
        // Configuration last, and independent of everything above it: nothing
        // in the other seeds reads a `sys_system` row, and `system_config`
        // resolves through to the settings block for a key with no row — so the
        // order only decides when the admin screen fills in, not what works.
        tasks::seed_system::SeedSystem.run(ctx, &vars).await?;
        // Demonstration records last: they reference the dictionary's tables and
        // are the only seed whose rows a user is expected to edit or delete.
        // Nothing above reads them, so a model whose seed is empty — one with
        // no entities — changes nothing about the six seeds before it.
        tasks::seed_business::SeedBusiness.run(ctx, &vars).await?;
        // The model's own questions, after the records they are asked about.
        // Nothing here runs a report — the ordering matters only so that
        // opening one finds something to answer with.
        tasks::seed_reports::SeedReports.run(ctx, &vars).await?;
        tasks::ensure_admin::EnsureAdmin.run(ctx, &vars).await?;
        Ok(())
    }
}
