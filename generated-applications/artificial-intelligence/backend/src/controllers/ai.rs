//! Natural-language querying — `POST /api/ai/query` (decision D5).
//!
//! Thin by design: the pipeline lives in `services::nl_query`, and everything
//! interesting about it — that the model returns a validated plan rather than
//! SQL, and that `authz::require_read` gates execution — is documented there.
//!
//! The route is always mounted. Whether it *works* depends on `ai_base_url` and
//! `ai_model` — a `sys_system` row first, the app's `settings` block after it, so
//! the add-on can be turned on from the admin screen without a restart. Without
//! either it answers 503, the
//! same way the Electric proxy does when its upstream is unconfigured. That is
//! deliberate: a conditionally emitted module is the `include_str!` trap in
//! another costume, and the parity gate cannot see a file that both generators
//! agree to omit.
//!
//! Generated: 2026-10-01T05:17:04.398Z
//! Project: artificial-intelligence

use axum::{
    extract::State,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use serde::Deserialize;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;
use crate::services::authz;
use crate::services::dictionary::DictionaryCache;
use crate::services::dynamic_repo::DynamicRepo;
use crate::services::nl_query::{self, AiSettings};
use crate::services::system_config::SystemConfig;

#[derive(Debug, Deserialize)]
pub struct QueryRequest {
    /// The question, in the user's own words.
    pub query: String,
}

#[utoipa::path(
    post, path = "/api/ai/query", tag = "ai",
    security(("bearer" = [])),
    request_body = inline(Object),
    responses(
        (status = 200, description = "`{ success, data, count, entity, displayHint, summary, plan, executionTimeMs }`. `plan` is the validated query the question was translated into, echoed so the answer can be audited."),
        (status = 400, description = "Empty or over-long question, or a plan naming an unknown entity, column or operator"),
        (status = 401, description = "No or invalid token"),
        (status = 403, description = "The account may not read any entity"),
        (status = 503, description = "The AI add-on is not configured, or the endpoint is unreachable"),
    ),
)]
pub async fn query(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    SharedStore(dictionary): SharedStore<DictionaryCache>,
    SharedStore(repo): SharedStore<DynamicRepo>,
    SharedStore(config): SharedStore<SystemConfig>,
    Json(body): Json<QueryRequest>,
) -> AppResult<Response> {
    // Before the settings, deliberately. An empty or over-long question is a
    // bad request on any app, and checking configuration first made it a 503 on
    // an unconfigured one — so the same request meant two different things
    // depending on a server setting the caller cannot see. `tests/requests/ai`
    // asserts the ordering.
    let question = nl_query::validate_question(&body.query)?;

    let settings = AiSettings::resolve(&config, ctx.config.settings.as_ref())
        .await
        .ok_or_else(|| {
            AppError::ServiceUnavailable(
                "AI add-on not configured (set ai_base_url and ai_model on the System \
                 Configuration screen, in settings, or as LOCAL_AI_BASE_URL and \
                 LOCAL_AI_MODEL in the environment)"
                    .to_string(),
            )
        })?;

    let pool = ctx.db.get_postgres_connection_pool();
    let principal = authz::principal(pool, &auth.user).await?;

    let answer =
        nl_query::answer(pool, &principal, &dictionary, &repo, &settings, question).await?;

    Ok(Json(answer).into_response())
}

pub fn routes() -> Routes {
    Routes::new().prefix("ai").add("/query", post(query))
}
