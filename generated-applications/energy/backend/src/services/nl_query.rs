//! Natural-language querying over the business entities (decision D5).
//!
//! ## The model does not write SQL
//!
//! This is the load-bearing design choice and the reason the module looks the
//! way it does. The NestJS original asked an agent for SQL, validated the
//! string, and executed it. That puts generated text on the path to the
//! database with a validator as the only barrier — the same class of risk the
//! Electric proxy deliberately refused to port (see `controllers/electric.rs`).
//!
//! Instead the model returns a **`QueryPlan`**: an entity name, filters drawn
//! from the operator whitelist `/api/bus/{entity}` already accepts, an optional
//! sort, and a limit. `validate` checks every part of it against the
//! Application Dictionary, and execution goes through `DynamicRepo::find_all` —
//! the exact path the REST endpoint uses. Two consequences follow, and both are
//! the point:
//!
//!   * there is no string from the model anywhere near `sea_query`, so a prompt
//!     injection has no SQL to inject into; and
//!   * the natural-language layer cannot express anything the caller could not
//!     already do over REST, so it adds a *phrasing*, not a privilege.
//!
//! The cost is real and worth stating: no joins, no `GROUP BY`, no aggregates
//! beyond the row count `find_all` already returns. A question needing those
//! gets an honest "I can't answer that from one entity" rather than a query
//! nobody vetted.
//!
//! ## Authorisation
//!
//! The caller's readable tables are resolved **before** the prompt is built, so
//! the model is never told about a table the caller cannot see — it cannot
//! suggest one, and the schema itself is not a disclosure. `execute` then calls
//! `authz::require_read` on the resolved table regardless. The filter is a
//! usability measure; the check is the control, and it runs even if the model
//! returns something the filter should have excluded.
//!
//! Generated: 2026-10-01T05:17:44.735Z
//! Project: energy

use std::time::Instant;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::errors::{AppError, AppResult};
use crate::services::authz::{self, Principal};
use crate::services::dictionary::{is_managed_column, DictionaryCache};
use crate::services::dynamic_repo::{DynamicRepo, Filter, FilterOp, OrderDir, PaginationOptions};
use crate::services::system_config::SystemConfig;

/// Hard ceiling on rows a single question can return, whatever the plan asks
/// for. `/api/bus/{entity}` uses the same number.
const MAX_LIMIT: u64 = 500;
/// What a plan gets when it names no limit.
const DEFAULT_LIMIT: u64 = 25;
/// Upper bound on the question itself. A prompt is charged per token and this
/// endpoint is authenticated but not otherwise rate limited.
const MAX_QUESTION_CHARS: usize = 1_000;

/// Where the model's answer is parsed into.
///
/// Deliberately small. Every field is validated against the dictionary before
/// anything runs, and a field that cannot be validated does not belong here —
/// "raw_sql" being the obvious one.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct QueryPlan {
    /// Dictionary entity or table name, e.g. `compound` or `bus_compound`.
    pub entity: String,
    #[serde(default)]
    pub filters: Vec<PlanFilter>,
    #[serde(default)]
    pub search: Option<String>,
    #[serde(default)]
    pub order_by: Option<String>,
    #[serde(default)]
    pub order_dir: Option<String>,
    #[serde(default)]
    pub limit: Option<u64>,
    /// How the model expects the answer to read. Advisory only — the frontend
    /// uses it to pick a view and nothing on this side depends on it.
    #[serde(default)]
    pub display_hint: Option<String>,
    /// One sentence restating the question, shown above the results.
    #[serde(default)]
    pub summary: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PlanFilter {
    pub column: String,
    pub op: String,
    pub value: String,
}

/// A plan that has been checked against the dictionary and is safe to run.
///
/// Separate from `QueryPlan` on purpose: the type is the proof. A `ValidPlan`
/// can only be produced by `validate`, so `execute` cannot be handed an
/// unchecked plan by a future caller who forgot the step.
pub struct ValidPlan {
    table_name: String,
    entity: String,
    filters: Vec<Filter>,
    search: Option<String>,
    opts: PaginationOptions,
    display_hint: String,
    summary: Option<String>,
}

/// One entity as the prompt describes it.
struct EntitySchema {
    table_name: String,
    display_name: String,
    columns: Vec<String>,
}

/// Read the AI settings out of the app's own `settings` block.
///
/// Mirrors `electric_url` in the Electric controller — same shape, same reason:
/// an optional integration is configured in `config/*.yaml` and its absence is
/// a 503 rather than a panic or a missing route.
pub struct AiSettings {
    pub base_url: String,
    pub model: String,
    pub api_key: String,
}

impl AiSettings {
    /// `None` when the add-on is not configured, which is the default.
    ///
    /// The module is always compiled and the route always mounted — a
    /// conditionally emitted module is the `include_str!` trap this codebase
    /// has already been bitten by, and the parity gate cannot see it. The
    /// feature is gated at run time instead.
    #[must_use]
    pub fn from_settings(settings: Option<&Value>) -> Option<Self> {
        let settings = settings?;
        let base_url = settings
            .get("ai_base_url")?
            .as_str()
            .filter(|value| !value.is_empty())?
            .trim_end_matches('/')
            .to_string();
        let model = settings
            .get("ai_model")
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())?
            .to_string();
        let api_key = settings
            .get("ai_api_key")
            .and_then(Value::as_str)
            .unwrap_or("local")
            .to_string();

        Some(Self {
            base_url,
            model,
            api_key,
        })
    }

    /// The same three values, resolved through `sys_system` first.
    ///
    /// This is what the route calls, so an operator can point the add-on at an
    /// endpoint from the admin screen and have the next request use it — the
    /// settings-block reader above stays the fallback, and stays separately
    /// testable because it needs no database.
    ///
    /// Both halves are still required: a base URL with no model is not a
    /// half-configured add-on, it is an unconfigured one, and answering with a
    /// model name the operator never chose would be worse than a 503.
    pub async fn resolve(config: &SystemConfig, settings: Option<&Value>) -> Option<Self> {
        let base_url = config
            .get_optional(settings, "ai_base_url")
            .await?
            .trim_end_matches('/')
            .to_string();
        let model = config.get_optional(settings, "ai_model").await?;
        let api_key = config.get(settings, "ai_api_key", "local").await;

        Some(Self {
            base_url,
            model,
            api_key,
        })
    }
}

/// Check the question itself, and hand back the trimmed form.
///
/// Public, and called by the controller *before* it reads the add-on's
/// settings, so a malformed request gets the same 400 whether or not a model is
/// wired up. Ordering it the other way round — which is how this shipped —
/// answered 503 for an empty question on an unconfigured app and 400 on a
/// configured one, so the same request changed meaning when an operator turned
/// the feature on, and a client could not tell "you sent nothing" from "this
/// app has no model".
///
/// `answer` calls it too. It is cheap and idempotent, and a service function
/// that trusts its caller to have validated the input is one that stops being
/// safe the moment a second caller appears.
pub fn validate_question(question: &str) -> AppResult<&str> {
    let question = question.trim();
    if question.is_empty() {
        return Err(AppError::BadRequest("query must not be empty".to_string()));
    }
    if question.chars().count() > MAX_QUESTION_CHARS {
        return Err(AppError::BadRequest(format!(
            "query must be {MAX_QUESTION_CHARS} characters or fewer"
        )));
    }
    Ok(question)
}

/// Answer one question. The whole pipeline, in the order it has to happen.
pub async fn answer(
    pool: &PgPool,
    principal: &Principal,
    dictionary: &DictionaryCache,
    repo: &DynamicRepo,
    settings: &AiSettings,
    question: &str,
) -> AppResult<Value> {
    let started = Instant::now();

    let question = validate_question(question)?;

    let schema = readable_schema(pool, principal, dictionary).await?;
    if schema.is_empty() {
        return Err(AppError::Forbidden(
            "no entities are readable by this account".to_string(),
        ));
    }

    let plan = ask_model(settings, &schema, question).await?;
    let valid = validate(dictionary, &plan).await?;

    // The control, not the filter above: run it whatever the model returned.
    authz::require_read(pool, principal, &valid.table_name).await?;

    // Bound rather than inlined: `meta` is an `Arc<TableMeta>` and `find_all`
    // takes `&TableMeta`. Written inline as `&dictionary.meta(..).await?` the
    // expected type propagates into the `?`, which then tries to convert the
    // `Arc` away instead of letting deref coercion do it at the call site.
    let meta = dictionary.meta(&valid.entity).await?;
    let result = repo
        .find_all(&meta, &valid.opts, &valid.filters, valid.search.as_deref())
        .await?;

    Ok(json!({
        "success": true,
        "data": result.data,
        "count": result.total,
        "entity": valid.table_name,
        "displayHint": valid.display_hint,
        "summary": valid.summary,
        "plan": plan,
        "executionTimeMs": started.elapsed().as_millis(),
    }))
}

/// The entities this caller may read, with their columns.
///
/// Built per request rather than cached: a role change has to take effect on
/// the next question, the same way a dictionary edit takes effect on the next
/// request everywhere else in this application.
async fn readable_schema(
    pool: &PgPool,
    principal: &Principal,
    dictionary: &DictionaryCache,
) -> AppResult<Vec<EntitySchema>> {
    let table_names: Vec<String> = sqlx::query_scalar(
        "SELECT table_name FROM sys_table \
         WHERE is_active = true AND table_name LIKE 'bus\\_%' \
         ORDER BY table_name",
    )
    .fetch_all(pool)
    .await?;

    let mut schema = Vec::new();
    for table_name in table_names {
        if authz::require_read(pool, principal, &table_name)
            .await
            .is_err()
        {
            continue;
        }
        let Ok(meta) = dictionary.meta(&table_name).await else {
            continue;
        };
        schema.push(EntitySchema {
            table_name: meta.table_name.clone(),
            display_name: meta.name.clone(),
            columns: meta
                .columns
                .iter()
                .map(|column| column.column_name.clone())
                .collect(),
        });
    }

    Ok(schema)
}

/// Turn the schema and the question into a plan, by asking the model.
async fn ask_model(
    settings: &AiSettings,
    schema: &[EntitySchema],
    question: &str,
) -> AppResult<QueryPlan> {
    let body = json!({
        "model": settings.model,
        "temperature": 0,
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": system_prompt(schema) },
            { "role": "user", "content": question },
        ],
    });

    // `reqwest` rather than a dedicated OpenAI client crate: this is one JSON
    // POST to one endpoint, and an SDK would add a large dependency tree to
    // every generated application for it — including applications that never
    // configure the add-on.
    let response = reqwest::Client::new()
        .post(format!("{}/chat/completions", settings.base_url))
        .bearer_auth(&settings.api_key)
        .json(&body)
        .send()
        .await
        .map_err(|err| AppError::ServiceUnavailable(format!("AI endpoint unreachable: {err}")))?;

    if !response.status().is_success() {
        let status = response.status();
        return Err(AppError::ServiceUnavailable(format!(
            "AI endpoint returned {status}"
        )));
    }

    let payload: Value = response
        .json()
        .await
        .map_err(|err| AppError::ServiceUnavailable(format!("AI endpoint sent no JSON: {err}")))?;

    let content = payload
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
        .ok_or_else(|| {
            AppError::ServiceUnavailable("AI endpoint sent no completion".to_string())
        })?;

    serde_json::from_str::<QueryPlan>(strip_code_fence(content)).map_err(|err| {
        // The model's prose is deliberately not echoed back to the caller: it
        // is untrusted text and this error reaches a UI.
        crate::log_event!(assistant_plan_unparseable, error = %err);
        AppError::ServiceUnavailable("AI returned an unusable answer".to_string())
    })
}

/// Models fence JSON in ```json blocks often enough to be worth handling.
fn strip_code_fence(content: &str) -> &str {
    let trimmed = content.trim();
    let Some(rest) = trimmed.strip_prefix("```") else {
        return trimmed;
    };
    let rest = rest.strip_prefix("json").unwrap_or(rest);
    rest.trim_start_matches('\n')
        .strip_suffix("```")
        .unwrap_or(rest)
        .trim()
}

fn system_prompt(schema: &[EntitySchema]) -> String {
    let mut prompt = String::from(
        "You translate a question about business data into a JSON query plan.\n\
         Reply with JSON only — no prose, no code fence.\n\n\
         Shape:\n\
         {\"entity\":\"<table>\",\"filters\":[{\"column\":\"<col>\",\"op\":\"<op>\",\"value\":\"<text>\"}],\
         \"search\":\"<text or null>\",\"order_by\":\"<col or null>\",\"order_dir\":\"asc|desc\",\
         \"limit\":<1-500>,\"display_hint\":\"table|number\",\"summary\":\"<one sentence>\"}\n\n\
         Rules:\n\
         - `entity` must be exactly one of the tables below. Pick the single best one; \
         you cannot join.\n\
         - `column` must be one of that table's columns.\n\
         - `op` must be one of: equals, gt, gte, lt, lte, contains, startsWith, endsWith.\n\
         - Use `search` for a free-text match when no single column fits.\n\
         - Use display_hint \"number\" when the question asks how many.\n\
         - If the question cannot be answered from one table, still pick the closest \
         table and say so in `summary`.\n\n\
         Tables:\n",
    );

    for entity in schema {
        prompt.push_str(&format!(
            "- {} ({}): {}\n",
            entity.table_name,
            entity.display_name,
            entity.columns.join(", ")
        ));
    }

    prompt
}

/// Resolve a column a plan wants to filter or sort on.
///
/// The dictionary describes an entity's *business* columns. It does not
/// describe the framework-managed tail every `bus_*` table carries —
/// `created_at`, `updated_at`, `doc_status` and the rest — so resolving through
/// it alone rejected the most natural questions there are. "The newest
/// compounds" is an `order_by: created_at`, and "added this month" is a filter
/// on the same column; both came back as `Unknown field 'created_at'` while
/// `DynamicRepo::find_all` was meanwhile using that exact column as its own
/// default sort.
///
/// `is_managed_column` is reused rather than a second list written here, for
/// the usual reason: two lists of the same thing drift, and this one already
/// answers precisely the question being asked — does this column exist on every
/// business table regardless of the model. That it is a fixed, code-owned set
/// is also what keeps this safe, because the name reaches `sea_query` as an
/// identifier: a plan still cannot name a column that is neither in the
/// dictionary nor in that set.
async fn resolve_filterable_column(
    dictionary: &DictionaryCache,
    entity: &str,
    column: &str,
) -> AppResult<String> {
    if is_managed_column(column) {
        return Ok(column.to_string());
    }
    dictionary.resolve_column(entity, column).await
}

/// How many rows a plan is allowed to return.
///
/// A function rather than an inline expression so the test exercises the code
/// that runs. Asserting the clamp inline re-derives it in the assertion, which
/// passes just as happily after someone removes the clamp from `validate`.
///
/// Zero is raised to one rather than honoured: a plan asking for no rows reads
/// as "nothing matched" in the UI, which is a wrong answer rather than an empty
/// one.
fn resolve_limit(requested: Option<u64>) -> u64 {
    requested.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT)
}

/// Check every part of the plan against the dictionary.
///
/// Nothing here trusts the model. An unknown entity, an unknown column or an
/// operator outside the whitelist is a 400 naming the offending value, not a
/// silently dropped clause — a filter quietly discarded would return more rows
/// than the caller asked for and look like a correct answer.
async fn validate(dictionary: &DictionaryCache, plan: &QueryPlan) -> AppResult<ValidPlan> {
    // `resolve` fails for anything the dictionary does not describe, which is
    // what stops a hallucinated table name before it becomes an identifier.
    let table = dictionary.resolve(&plan.entity).await?;
    let table_name = table.as_str().to_string();

    let mut filters = Vec::with_capacity(plan.filters.len());
    for filter in &plan.filters {
        let column = resolve_filterable_column(dictionary, &plan.entity, &filter.column).await?;
        filters.push(Filter {
            column,
            op: FilterOp::parse(&filter.op)?,
            value: filter.value.clone(),
        });
    }

    let order_by = match plan.order_by.as_deref().filter(|value| !value.is_empty()) {
        Some(column) => Some(resolve_filterable_column(dictionary, &plan.entity, column).await?),
        None => None,
    };

    let limit = resolve_limit(plan.limit);

    Ok(ValidPlan {
        table_name,
        entity: plan.entity.clone(),
        filters,
        search: plan.search.clone().filter(|term| !term.trim().is_empty()),
        opts: PaginationOptions {
            page: 1,
            limit,
            order_by,
            order_dir: OrderDir::parse(plan.order_dir.as_deref()),
        },
        display_hint: match plan.display_hint.as_deref() {
            Some("number") => "number".to_string(),
            _ => "table".to_string(),
        },
        summary: plan.summary.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_plan_without_a_limit_gets_the_default_and_one_over_the_cap_is_clamped() {
        // The cap is what stops "list everything" from being a table scan the
        // REST endpoint would have refused.
        assert_eq!(resolve_limit(None), DEFAULT_LIMIT);
        assert_eq!(resolve_limit(Some(10_000)), MAX_LIMIT);
        assert_eq!(resolve_limit(Some(0)), 1);
        // A reasonable request passes through untouched.
        assert_eq!(resolve_limit(Some(10)), 10);
    }

    /// Regression: the managed columns are filterable and sortable.
    ///
    /// Found by /qa driving the page: a plan ordering by `created_at` — the
    /// column `DynamicRepo::find_all` itself defaults to — was refused with
    /// `Unknown field 'created_at'`, because the dictionary only describes
    /// business columns. "Newest first" and "added this month" are the two most
    /// natural questions a user asks, and both were 400s.
    ///
    /// This asserts the gate, not the whole resolver: a name outside the
    /// managed set still has to come from the dictionary, which is what keeps
    /// an arbitrary string out of the identifier position.
    #[test]
    fn managed_columns_are_accepted_without_the_dictionary() {
        for column in ["created_at", "updated_at", "doc_status", "id", "version"] {
            assert!(
                is_managed_column(column),
                "{column} must be filterable/sortable without a sys_column row"
            );
        }
        // Anything else still needs the dictionary to vouch for it.
        assert!(!is_managed_column("smiles"));
        assert!(!is_managed_column("1=1; DROP TABLE bus_compound"));
    }

    /// The question check, exercised through the function the controller calls
    /// rather than by restating its conditions here.
    #[test]
    fn a_question_must_be_non_empty_and_bounded() {
        assert_eq!(
            validate_question("  how many compounds?  ").unwrap(),
            "how many compounds?"
        );
        assert!(validate_question("").is_err());
        assert!(validate_question("   \n\t ").is_err());
        assert!(validate_question(&"a".repeat(MAX_QUESTION_CHARS)).is_ok());
        assert!(validate_question(&"a".repeat(MAX_QUESTION_CHARS + 1)).is_err());
    }

    #[test]
    fn fenced_json_is_unwrapped() {
        assert_eq!(strip_code_fence("```json\n{\"a\":1}\n```"), "{\"a\":1}");
        assert_eq!(strip_code_fence("```\n{\"a\":1}\n```"), "{\"a\":1}");
        assert_eq!(strip_code_fence("  {\"a\":1}  "), "{\"a\":1}");
    }

    #[test]
    fn the_add_on_is_off_unless_both_url_and_model_are_set() {
        assert!(AiSettings::from_settings(None).is_none());
        assert!(AiSettings::from_settings(Some(&json!({}))).is_none());
        assert!(AiSettings::from_settings(Some(&json!({ "ai_base_url": "" }))).is_none());
        // A base URL with no model is a half-configuration and stays off.
        assert!(
            AiSettings::from_settings(Some(&json!({ "ai_base_url": "http://x/v1" }))).is_none()
        );

        let configured = AiSettings::from_settings(Some(&json!({
            "ai_base_url": "http://localhost:8000/v1/",
            "ai_model": "qwen3.6:27b-mlx",
        })))
        .expect("both set");
        // The trailing slash is trimmed so the join cannot produce `//`.
        assert_eq!(configured.base_url, "http://localhost:8000/v1");
        assert_eq!(configured.api_key, "local");
    }

    #[test]
    fn the_prompt_names_only_the_tables_it_was_given() {
        let prompt = system_prompt(&[EntitySchema {
            table_name: "bus_compound".to_string(),
            display_name: "Compound".to_string(),
            columns: vec!["id".to_string(), "smiles".to_string()],
        }]);
        assert!(prompt.contains("bus_compound (Compound): id, smiles"));
        // The caller's unreadable tables are absent because they were filtered
        // before the prompt was built, not because the model was asked nicely.
        assert!(!prompt.contains("bus_secret"));
    }

    /// A plan carries no SQL field, so there is nothing for a prompt injection
    /// to land in. This pins that: `QueryPlan` must reject the shape the
    /// NestJS original accepted.
    #[test]
    fn a_plan_cannot_smuggle_sql() {
        let plan: QueryPlan = serde_json::from_str(
            r#"{"entity":"compound","sql":"DROP TABLE bus_compound","raw_sql":"x"}"#,
        )
        .expect("unknown fields are ignored, not accepted");
        let round_tripped = serde_json::to_value(&plan).expect("serialises");
        assert!(round_tripped.get("sql").is_none());
        assert!(round_tripped.get("raw_sql").is_none());
        assert_eq!(plan.entity, "compound");
    }
}
