//! Loco application hooks: routes, workers, tasks and boot checks.
use std::path::Path;

use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::{BackgroundWorker, Queue},
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};

use crate::{common::settings, controllers, migration::Migrator, security::encryption, tasks, workers};

pub struct App;

/// Every controller, mounted. A plain function so the route-table test can
/// enumerate it without an application context.
#[must_use]
pub fn app_routes() -> AppRoutes {
    AppRoutes::empty()
        .add_route(controllers::health::routes())
        .add_route(controllers::queries::routes())
        .add_route(controllers::reports::routes())
        .add_route(controllers::report_export::routes())
        .add_route(controllers::report_generation::routes())
        .add_route(controllers::charts::routes())
        .add_route(controllers::dashboards::routes())
        .add_route(controllers::jobs::routes())
        .add_route(controllers::notifications::routes())
        .add_route(controllers::data_sources::routes())
        .add_route(controllers::monitoring::routes())
        .add_route(controllers::filters::routes())
        .add_route(controllers::help::routes())
        .add_route(controllers::logs::routes())
        .add_route(controllers::sql::routes())
        .add_route(controllers::metadata::routes())
        .add_route(controllers::schema_instructions::routes())
        .add_route(controllers::settings::routes())
        .add_route(controllers::nl_query::routes())
        .add_route(controllers::auth::routes())
        .add_route(controllers::admin::routes())
        .add_route(controllers::adk::routes())
        .add_route(controllers::copilotkit::routes())
        .add_route(controllers::nl_builder::routes())
        .add_route(controllers::share::routes())
}

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        format!(
            "{} ({})",
            env!("CARGO_PKG_VERSION"),
            option_env!("BUILD_SHA").unwrap_or("dev")
        )
    }

    async fn boot(mode: StartMode, environment: &Environment, config: Config) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    /// The same two fatal checks the Node service makes at boot: a missing or
    /// short `AUTH_SECRET`, and a missing `ENCRYPTION_KEY` (unless the
    /// development fallback is explicitly allowed outside production).
    ///
    /// Then the bootstrap baseline, on **every** boot, exactly as Node runs
    /// `bootstrapSchema()` on every boot. A SeaORM migration runs once under
    /// a fixed name, so a regenerated baseline (a new table in bootstrap.ts)
    /// would never reach an existing database through it. The DDL is all
    /// `IF NOT EXISTS`, so re-running it is a no-op when nothing changed.
    async fn before_run(ctx: &AppContext) -> Result<()> {
        settings::auth_secret().map_err(|e| loco_rs::Error::string(&e))?;
        encryption::derive_key(std::env::var("ENCRYPTION_KEY").ok().as_deref())
            .map_err(|e| loco_rs::Error::string(&e.to_string()))?;
        crate::bootstrap::baseline(crate::common::db::pool(ctx))
            .await
            .map_err(|e| loco_rs::Error::string(&e))?;
        // And the rows bootstrap.ts writes after its DDL — the administrator,
        // the NL-query account, Better Auth credentials and the help articles —
        // so an installation served by Rust alone has somebody to sign in as.
        crate::bootstrap::seed(crate::common::db::pool(ctx))
            .await
            .map_err(|e| loco_rs::Error::string(&format!("bootstrap seed: {e}")))?;
        // The knowledge graph, as `src/server.ts` does at boot: in the
        // background, and non-fatal — an installation without the graph
        // database runs without graph context.
        let db = crate::common::db::pool(ctx).clone();
        tokio::spawn(async move {
            let run = async {
                crate::graph::init_graph().await?;
                crate::graph::sync::sync_knowledge_graph(&db).await
            };
            if let Err(e) = run.await {
                tracing::warn!(error = %e, "[server] Knowledge graph init failed (non-fatal)");
            }
        });
        Ok(())
    }

    /// Every response says which backend produced it, so a mixed deployment
    /// (some areas on Node, some on Rust) can be read from the network tab.
    async fn after_routes(router: axum::Router, _ctx: &AppContext) -> Result<axum::Router> {
        Ok(router.layer(axum::middleware::map_response(
            |mut res: axum::response::Response| async move {
                res.headers_mut()
                    .insert("x-ers-backend", axum::http::HeaderValue::from_static("loco-rs"));
                res
            },
        )))
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        app_routes()
    }

    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        queue.register(workers::ReportWorker::build(ctx)).await?;
        queue.register(workers::ExportWorker::build(ctx)).await?;
        queue.register(workers::EmailBatchWorker::build(ctx)).await?;
        queue
            .register(crate::reportgen::worker::ReportGenerationWorker::build(ctx))
            .await?;
        queue
            .register(workers::MonitoringEvaluateWorker::build(ctx))
            .await?;
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        tasks.register(tasks::cron_tick::CronTick);
        tasks.register(tasks::evaluate_rule::EvaluateRule);
        tasks.register(tasks::generate_report::GenerateReport);
        tasks.register(tasks::email_batch::EmailBatch);
        tasks.register(tasks::generate_nl_report::GenerateNlReport);
        tasks.register(tasks::report_cleanup::ReportCleanup);
        tasks.register(tasks::seed_reporting_pack::SeedReportingPack);
        tasks.register(tasks::sync_knowledge_graph::SyncKnowledgeGraph);
    }

    /// The schema is shared with the Node service; truncating it from here
    /// would take the other backend's data with it.
    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }
}

/// `routes.json` is what the dev proxy and a cut-over route to Rust. It must
/// list exactly the routes the router serves: an entry the router lacks sends
/// traffic into a 404, and a route missing from it is ported but unreachable.
#[cfg(test)]
mod route_table {
    use std::collections::BTreeSet;

    use super::app_routes;

    /// `(METHOD, /path/:param)` for every route the app registers, from Loco's
    /// own route collection.
    fn served_routes() -> Vec<(String, String)> {
        app_routes()
            .collect()
            .into_iter()
            .flat_map(|r| {
                let path = r
                    .uri
                    .trim_end_matches('/')
                    .split('/')
                    .map(|seg| {
                        seg.strip_prefix('{')
                            .and_then(|s| s.strip_suffix('}'))
                            .map_or_else(|| seg.to_string(), |p| format!(":{p}"))
                    })
                    .collect::<Vec<_>>()
                    .join("/");
                r.actions.into_iter().map(move |m| (m.to_string(), path.clone()))
            })
            .filter(|(m, _)| m != "HEAD")
            .collect()
    }

    #[test]
    fn routes_json_matches_the_router() {
        let table: serde_json::Value = serde_json::from_str(include_str!("../routes.json")).unwrap();
        let listed: BTreeSet<(String, String)> = table["routes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| {
                (
                    r[0].as_str().unwrap().to_string(),
                    r[1].as_str().unwrap().to_string(),
                )
            })
            .collect();
        let served: BTreeSet<(String, String)> = served_routes().into_iter().collect();
        assert_eq!(served.len(), listed.len(), "served: {served:?}");
        let missing: Vec<_> = served.difference(&listed).collect();
        let extra: Vec<_> = listed.difference(&served).collect();
        assert!(
            missing.is_empty() && extra.is_empty(),
            "not in routes.json: {missing:?}\nnot served: {extra:?}"
        );
    }
}
