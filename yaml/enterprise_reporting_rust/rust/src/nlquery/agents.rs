//! The LLM-facing pieces the remaining Node routes call:
//!
//! - `callLLM` / `runReportBuilderAgent` (`mastra/agents/supervisor-agent.ts`),
//!   the report builder's NL→SQL specialist;
//! - `classifyIntent` (`src/lib/adk/intent-classifier.ts`) and the Mastra
//!   supervisor and NL→SQL tool calls of the ADK pipeline;
//! - `isMastraAvailable` / `translateNLToSQLViaMastra`
//!   (`src/lib/nlquery/mastra-connector.ts`) and `translateNLToSQLViaLlama`
//!   (`src/lib/nlquery/llama-translator.ts`), the NL builder's two backends;
//! - `getSchemaMetadata` and `buildMastraContextPrompt`, the prompt context.
//!
//! Every prompt is Node's, character for character: `parity/llm-stub.py`
//! records what each backend sends and the parity script compares them.
use std::{collections::HashMap, sync::LazyLock, time::Duration};

use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};
use tokio::sync::Mutex;

use super::ai;
use crate::common::js;

// ── Endpoints ────────────────────────────────────────────────────────────────

/// `AI_NL2SQL_BASE_URL`, else `LLAMA_REASONING_URL` + `/v1`.
#[must_use]
pub fn nl2sql_base() -> String {
    ai::base(
        "AI_NL2SQL_BASE_URL",
        "LLAMA_REASONING_URL",
        None,
        "http://localhost:8080",
    )
}

fn nl2sql_model() -> String {
    std::env::var("AI_NL2SQL_MODEL")
        .or_else(|_| std::env::var("LLAMA_REASONING_MODEL"))
        .unwrap_or_else(|_| "qwen3.6".into())
}

fn nl2sql_key() -> String {
    ai::key("AI_NL2SQL_API_KEY", "LLAMA_REASONING_API_KEY")
}

fn is_local(url: &str) -> bool {
    url.contains("localhost") || url.contains("127.0.0.1")
}

/// `MASTRA_URL`, default `http://localhost:4111`.
#[must_use]
pub fn mastra_url() -> String {
    std::env::var("MASTRA_URL")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "http://localhost:4111".into())
}

/// Bun's `fetch` message for a request that never got a response.
fn fetch_failed(e: &reqwest::Error) -> String {
    if e.is_timeout() {
        "The operation timed out.".into()
    } else {
        "Unable to connect. Is the computer able to access the url?".into()
    }
}

// ── supervisor-agent.ts ──────────────────────────────────────────────────────

/// `callLLM(system, user)`: one chat completion, 120 s, no retries.
///
/// # Errors
/// `LLM call failed: HTTP <status>`, or the fetch failure.
pub async fn call_llm(system: &str, user: &str) -> Result<String, String> {
    let base = nl2sql_base();
    let mut payload = json!({
        "model": nl2sql_model(),
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user },
        ],
        "temperature": 0.1,
    });
    // chat_template_kwargs is Qwen3/llama.cpp specific — only for a local server.
    if is_local(&base) {
        payload["chat_template_kwargs"] = json!({ "enable_thinking": false });
    }
    let mut req = ai::client(Duration::from_secs(120))
        .post(format!("{base}/chat/completions"))
        .json(&payload);
    let key = nl2sql_key();
    if key != "none" {
        req = req.bearer_auth(key);
    }
    let res = req.send().await.map_err(|e| fetch_failed(&e))?;
    if !res.status().is_success() {
        return Err(format!("LLM call failed: HTTP {}", res.status().as_u16()));
    }
    let data: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string())
}

/// `extractJSON`: from the first `{` to the last `}`, parsed.
///
/// # Errors
/// When there is no object, or it does not parse.
pub fn extract_json(text: &str) -> Result<Value, String> {
    let (Some(start), Some(end)) = (text.find('{'), text.rfind('}')) else {
        return Err("No JSON object found in LLM response".into());
    };
    if end < start {
        return Err("No JSON object found in LLM response".into());
    }
    serde_json::from_str(&text[start..=end]).map_err(|e| e.to_string())
}

fn js_type_name(v: Option<&Value>) -> &'static str {
    match v {
        None => "undefined",
        Some(Value::Null) => "null",
        Some(Value::Bool(_)) => "boolean",
        Some(Value::Number(_)) => "number",
        Some(Value::String(_)) => "string",
        Some(Value::Array(_)) => "array",
        Some(Value::Object(_)) => "object",
    }
}

/// A zod v3 `invalid_type` issue.
fn invalid_type(path: &[Value], expected: &str, got: Option<&Value>) -> Value {
    json!({
        "code": "invalid_type",
        "expected": expected,
        "received": js_type_name(got),
        "path": path,
        "message": if got.is_none() { "Required".to_string() } else { format!("Expected {expected}, received {}", js_type_name(got)) },
    })
}

/// `ZodError#message`: the issues, pretty-printed with two spaces.
fn zod_message(issues: &[Value]) -> String {
    let mut buf = Vec::new();
    let fmt = serde_json::ser::PrettyFormatter::with_indent(b"  ");
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, fmt);
    serde::Serialize::serialize(&issues, &mut ser).ok();
    String::from_utf8(buf).unwrap_or_default()
}

/// `ReportDefinitionGuardrail`.
#[derive(Debug, Clone, PartialEq)]
pub struct ReportDefinition {
    pub sql: String,
    pub metric_column: String,
    pub explanation: String,
    pub confidence: f64,
    pub warnings: Vec<String>,
}

/// `ReportDefinitionGuardrail.parse(raw)`.
///
/// # Errors
/// The `ZodError` message.
pub fn parse_report_definition(raw: &Value) -> Result<ReportDefinition, String> {
    let Some(o) = raw.as_object() else {
        return Err(zod_message(&[invalid_type(&[], "object", Some(raw))]));
    };
    let mut issues = Vec::new();
    match o.get("sql") {
        Some(Value::String(s)) if s.encode_utf16().count() < 1 => issues.push(json!({
            "code": "too_small",
            "minimum": 1,
            "type": "string",
            "inclusive": true,
            "exact": false,
            "message": "String must contain at least 1 character(s)",
            "path": ["sql"],
        })),
        Some(Value::String(_)) => {}
        other => issues.push(invalid_type(&[json!("sql")], "string", other)),
    }
    match o.get("metric_column") {
        None | Some(Value::String(_)) => {}
        other => issues.push(invalid_type(&[json!("metric_column")], "string", other)),
    }
    if !matches!(o.get("explanation"), Some(Value::String(_))) {
        issues.push(invalid_type(
            &[json!("explanation")],
            "string",
            o.get("explanation"),
        ));
    }
    if !matches!(o.get("confidence"), Some(Value::Number(_))) {
        issues.push(invalid_type(
            &[json!("confidence")],
            "number",
            o.get("confidence"),
        ));
    }
    match o.get("warnings") {
        Some(Value::Array(items)) => {
            for (i, w) in items.iter().enumerate() {
                if !w.is_string() {
                    issues.push(invalid_type(&[json!("warnings"), json!(i)], "string", Some(w)));
                }
            }
        }
        other => issues.push(invalid_type(&[json!("warnings")], "array", other)),
    }
    if !issues.is_empty() {
        return Err(zod_message(&issues));
    }
    Ok(ReportDefinition {
        sql: o["sql"].as_str().unwrap_or_default().to_string(),
        metric_column: o
            .get("metric_column")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        explanation: o["explanation"].as_str().unwrap_or_default().to_string(),
        confidence: o["confidence"].as_f64().unwrap_or_default(),
        warnings: o["warnings"]
            .as_array()
            .map(|a| a.iter().filter_map(|w| w.as_str().map(str::to_string)).collect())
            .unwrap_or_default(),
    })
}

const REPORT_SYSTEM: &str = r#"You are a SQL generation specialist for enterprise reports.
Given a natural language request and database schema, generate optimal PostgreSQL SELECT SQL.
GUARDRAILS:
- SQL must be SELECT-only (no INSERT, UPDATE, DELETE, DROP, TRUNCATE)
- Use the exact table and column names from the schema — do NOT invent or assume column names
- Use PostgreSQL syntax ONLY: use NOW() - INTERVAL '7 days' NOT DATE_SUB; use EXTRACT(YEAR FROM col) for year; use :: for casting
- CRITICAL: The schema includes MULTI-HOP JOIN PATHS — follow them EXACTLY for cross-table joins
- CRITICAL: If a column does not exist in a table per the schema, use the multi-hop path to reach it through an intermediate table
- NEVER assume a column exists. Only use columns listed under that table in the DATABASE SCHEMA
- TIME FILTERS: Only add WHERE clauses on date/time columns if the Time context explicitly mentions a period. If the time context says "all time" or does not mention a period, do NOT add any date filter
- metric_column: for aggregation queries (COUNT, SUM, AVG etc.) set this to the aggregated column alias. For listing/detail queries with no aggregation, set metric_column to the first column alias in the SELECT.
- Respond with ONLY a JSON object"#;

/// `runReportBuilderAgent(metric, dataHint, schemaText, timeWindow)`.
///
/// # Errors
/// The LLM call, JSON extraction or guardrail failure, as Node throws it.
pub async fn report_builder_agent(
    metric: &str,
    data_hint: &str,
    schema_text: &str,
    time_window: Option<&str>,
) -> Result<ReportDefinition, String> {
    let user = format!(
        r#"Generate SQL for this report request: "{metric}"
Data hints: {data_hint}
Time context: {}

DATABASE SCHEMA:
{schema_text}

EXAMPLES:

Aggregation query example (metric has COUNT/SUM/AVG):
{{
  "sql": "SELECT d.name AS department_name, COUNT(*) AS total_admissions FROM bus_admission a JOIN bus_department d ON a.department_id::uuid = d.id GROUP BY d.name ORDER BY total_admissions DESC",
  "metric_column": "total_admissions",
  "explanation": "Counts admissions grouped by department",
  "confidence": 0.92,
  "warnings": []
}}

Listing query example (no aggregation, just rows):
{{
  "sql": "SELECT u.id AS user_id, u.email, u.created_at FROM users u ORDER BY u.created_at DESC",
  "metric_column": "user_id",
  "explanation": "Lists all users with their account creation dates",
  "confidence": 0.95,
  "warnings": []
}}

Now generate SQL for the request above. Respond with ONLY a JSON object:"#,
        time_window.unwrap_or("current period / last 7 days")
    );
    let response = call_llm(REPORT_SYSTEM, &user).await?;
    let raw = extract_json(&response)?;
    parse_report_definition(&raw)
}

// ── intent-classifier.ts ─────────────────────────────────────────────────────

const CLASSIFICATION_SYSTEM_PROMPT: &str = r#"You are an intent classification specialist for an enterprise monitoring system.
Your ONLY job is to extract structured intent from the user's natural language request.
Respond with ONLY a valid JSON object. No markdown fences, no commentary outside the JSON.

INTENT TYPES:
- monitoring_rule : user wants to set up automated threshold-based alerting
- report_generate : user wants a one-time or scheduled report without alerts
- alert_create    : user wants to configure alert channels / escalation only
- ambiguous       : request is unclear or lacks enough information

FIELD RULES:
- confidence MUST be a float 0.0–1.0 reflecting how certain you are of the intent
- metric      : the column alias or expression name to measure (e.g. "total_revenue", "patient_count")
- data_hint   : space-separated keywords hinting at relevant DB tables (e.g. "orders revenue sales")
- schedule_natural : human-readable schedule (e.g. "every Monday at 8am")
- schedule_cron    : best-effort 5-field cron expression
- threshold_operator MUST be one of: gt gte lt lte eq neq between
- threshold_value   : numeric threshold for the alert condition
- alert_channels    : subset of ["email", "in_app", "webhook"]

ONLY include optional fields you have evidence for — omit rather than guess."#;

const OPERATORS: &[&str] = &["gt", "gte", "lt", "lte", "eq", "neq", "between"];

/// `normaliseCron(natural, llmCron)` — substring matching, in Node's order
/// (so "every month" matches "mon" and becomes Mondays, as it does there).
#[must_use]
pub fn normalise_cron(natural: Option<&str>, llm_cron: Option<&str>) -> Option<String> {
    if natural.is_none() && llm_cron.is_none() {
        return None;
    }
    let text = natural.unwrap_or_default().to_lowercase();
    let has = |s: &str| text.contains(s);
    let pick = if has("every sunday") || has("sun") {
        Some("0 8 * * 0")
    } else if has("every monday") || has("weekly") || has("mon") {
        Some("0 8 * * 1")
    } else if has("every tuesday") || has("tue") {
        Some("0 8 * * 2")
    } else if has("every wednesday") || has("wed") {
        Some("0 8 * * 3")
    } else if has("every thursday") || has("thu") {
        Some("0 8 * * 4")
    } else if has("every friday") || has("fri") {
        Some("0 8 * * 5")
    } else if has("every saturday") || has("sat") {
        Some("0 8 * * 6")
    } else if has("every weekday") || has("weekday") {
        Some("0 8 * * 1-5")
    } else if has("every hour") || has("hourly") {
        Some("0 * * * *")
    } else if has("every month") || has("monthly") {
        Some("0 8 1 * *")
    } else if has("every day") || has("daily") {
        Some("0 8 * * *")
    } else {
        None
    };
    if let Some(p) = pick {
        return Some(p.into());
    }
    let re = regex::Regex::new(r"^[\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+$").ok()?;
    llm_cron
        .map(str::trim)
        .filter(|c| re.is_match(c))
        .map(str::to_string)
}

/// `classifyIntent(nlRequest, userId, dataSourceId)`: the intent object as
/// Node builds it (fields it has no value for are absent), and how long it
/// took. Any failure yields the "ambiguous" fallback.
pub async fn classify_intent(nl: &str, user_id: &str, ds_id: Option<&str>) -> (Value, u128) {
    let start = std::time::Instant::now();
    let id = uuid::Uuid::new_v4().to_string();
    let now = crate::common::time::now_iso();
    let user_prompt = format!(
        "Classify this monitoring request and extract structured intent:\n\n\"{nl}\"\n\n{}\n\nRespond with a single JSON object containing: intent_type, confidence, metric, data_hint, schedule_natural, schedule_cron, threshold_operator, threshold_value, alert_channels",
        ds_id.map(|d| format!("Data source context: {d}")).unwrap_or_default()
    );
    let parsed = async {
        let res = ai::client(Duration::from_secs(30))
            .post(format!("{}/v1/chat/completions", mastra_url()))
            .json(&json!({
                "messages": [
                    { "role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT },
                    { "role": "user", "content": user_prompt },
                ],
                "temperature": 0.1,
                "response_format": { "type": "json_object" },
            }))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            return Err(format!("LLM endpoint returned HTTP {}", res.status().as_u16()));
        }
        let data: Value = res.json().await.map_err(|e| e.to_string())?;
        let content = data
            .pointer("/choices/0/message/content")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if content.is_empty() {
            return Err("Empty LLM response".to_string());
        }
        extract_json(content)
    }
    .await;
    let fallback = || {
        json!({
            "id": id,
            "userId": user_id,
            "rawRequest": nl,
            "intentType": "ambiguous",
            "confidence": 0,
            "status": "clarification_needed",
            "createdAt": now,
            "updatedAt": now,
        })
    };
    let Ok(raw) = parsed else {
        return (fallback(), start.elapsed().as_millis());
    };
    let Some(o) = raw.as_object() else {
        return (fallback(), start.elapsed().as_millis());
    };
    // LLMIntentResponse: each field falls back on its own (`.catch`).
    let intent_type = o
        .get("intent_type")
        .and_then(Value::as_str)
        .filter(|t| ["monitoring_rule", "report_generate", "alert_create", "ambiguous"].contains(t))
        .unwrap_or("ambiguous");
    // z.number().min(0).max(1).catch(0): the value as sent, or 0.
    let confidence = match o.get("confidence") {
        Some(v @ Value::Number(n)) if n.as_f64().is_some_and(|c| (0.0..=1.0).contains(&c)) => v.clone(),
        _ => json!(0),
    };
    let opt_str = |k: &str| o.get(k).and_then(Value::as_str).map(str::to_string);
    let operator = opt_str("threshold_operator").filter(|op| OPERATORS.contains(&op.as_str()));
    let threshold = o.get("threshold_value").filter(|v| v.is_number()).cloned();
    let channels = o.get("alert_channels").and_then(Value::as_array).and_then(|a| {
        a.iter()
            .all(|c| matches!(c.as_str(), Some("email" | "in_app" | "webhook")))
            .then(|| Value::Array(a.clone()))
    });
    let schedule_natural = opt_str("schedule_natural");
    let cron = normalise_cron(schedule_natural.as_deref(), opt_str("schedule_cron").as_deref());
    let c = confidence.as_f64().unwrap_or(0.0);
    let mut intent = Map::new();
    intent.insert("id".into(), json!(id));
    intent.insert("userId".into(), json!(user_id));
    intent.insert("rawRequest".into(), json!(nl));
    intent.insert("intentType".into(), json!(intent_type));
    intent.insert("confidence".into(), confidence);
    let mut put = |k: &str, v: Option<Value>| {
        if let Some(v) = v {
            intent.insert(k.into(), v);
        }
    };
    put("metric", opt_str("metric").map(Value::String));
    put("dataHint", opt_str("data_hint").map(Value::String));
    put("scheduleNatural", schedule_natural.map(Value::String));
    put("scheduleCron", cron.map(Value::String));
    put("thresholdOperator", operator.map(Value::String));
    put("thresholdValue", threshold);
    put("alertChannels", channels);
    intent.insert(
        "status".into(),
        json!(if c >= 0.5 && intent_type != "ambiguous" {
            "classifying"
        } else {
            "clarification_needed"
        }),
    );
    intent.insert("createdAt".into(), json!(now));
    intent.insert("updatedAt".into(), json!(now));
    (Value::Object(intent), start.elapsed().as_millis())
}

/// `callMastraSupervisor(...)`: `POST /api/build-monitoring-pipeline`, then the
/// `SupervisorResultSchema` shape check.
///
/// # Errors
/// On a transport failure, a non-2xx status or a result of the wrong shape.
pub async fn mastra_supervisor(body: &Value) -> Result<Value, String> {
    let res = ai::client(Duration::from_secs(180))
        .post(format!("{}/api/build-monitoring-pipeline", mastra_url()))
        .json(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!(
            "Mastra supervisor failed: HTTP {}",
            res.status().as_u16()
        ));
    }
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    let ok = v.get("success").is_some_and(Value::is_boolean)
        && v.pointer("/intent/intent_type").is_some_and(Value::is_string)
        && v.pointer("/intent/confidence").is_some_and(Value::is_number)
        && ["sql", "metric_column", "explanation"].iter().all(|k| {
            v.pointer(&format!("/reportDefinition/{k}"))
                .is_some_and(Value::is_string)
        })
        && v.pointer("/reportDefinition/confidence")
            .is_some_and(Value::is_number)
        && v.pointer("/reportDefinition/warnings")
            .is_some_and(Value::is_array)
        && ["name", "description", "threshold_operator"].iter().all(|k| {
            v.pointer(&format!("/monitoringRule/{k}"))
                .is_some_and(Value::is_string)
        })
        && ["threshold_value", "escalation_threshold_pct"].iter().all(|k| {
            v.pointer(&format!("/monitoringRule/{k}"))
                .is_some_and(Value::is_number)
        })
        && v.pointer("/monitoringRule/alert_channels")
            .is_some_and(Value::is_array)
        && ["notify_on_pass", "notify_on_no_data"].iter().all(|k| {
            v.pointer(&format!("/monitoringRule/{k}"))
                .is_some_and(Value::is_boolean)
        })
        && ["cron_expression", "timezone", "description"]
            .iter()
            .all(|k| v.pointer(&format!("/schedule/{k}")).is_some_and(Value::is_string));
    if ok {
        Ok(v)
    } else {
        Err("Supervisor result failed validation".into())
    }
}

/// `executeSqlGenerate`: `POST /api/nl-to-sql`, 30 s.
///
/// # Errors
/// Node's messages for each failure.
pub async fn sql_generate(nl: &str, schema_text: &str, ds_type: &str) -> Result<Value, String> {
    let res = ai::client(Duration::from_secs(30))
        .post(format!("{}/api/nl-to-sql", mastra_url()))
        .json(&json!({ "nlQuestion": nl, "schema": { "schemaText": schema_text }, "context": { "dataSourceType": ds_type } }))
        .send()
        .await
        .map_err(|e| format!("Mastra NL-to-SQL request failed: {}", fetch_failed(&e)))?;
    if !res.status().is_success() {
        return Err(format!("Mastra NL-to-SQL failed: HTTP {}", res.status().as_u16()));
    }
    let raw: Value = res
        .json()
        .await
        .map_err(|_| "Mastra NL-to-SQL returned non-JSON response".to_string())?;
    let sql = raw
        .get("sql")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or_default();
    if sql.is_empty() {
        return Err("Mastra returned empty SQL".into());
    }
    Ok(json!({
        "sql": sql,
        "explanation": raw.get("explanation").and_then(Value::as_str).unwrap_or_default(),
        "confidence": raw.get("confidence").filter(|c| c.is_number()).cloned().unwrap_or(json!(0.7)),
        "warnings": raw.get("warnings").filter(|w| w.is_array()).cloned().unwrap_or(json!([])),
    }))
}

// ── mastra-connector.ts / llama-translator.ts ────────────────────────────────

fn mastra_request(req: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
    match std::env::var("MASTRA_API_KEY") {
        Ok(k) if !k.is_empty() => req.bearer_auth(k),
        _ => req,
    }
}

/// `isMastraAvailable()`: `GET /health` answers 2xx within 5 s.
pub async fn is_mastra_available() -> bool {
    mastra_request(ai::client(Duration::from_secs(5)).get(format!("{}/health", mastra_url())))
        .send()
        .await
        .is_ok_and(|r| r.status().is_success())
}

/// `translateNLToSQLViaMastra(nl, schema, context, contextPrompt)`: the
/// response body, or `None` on any failure.
pub async fn translate_via_mastra(nl: &str, schema: &Value, context_prompt: &str) -> Option<Value> {
    let mut context = Map::new();
    if !context_prompt.is_empty() {
        context.insert("contextFromSimilarQueries".into(), json!(context_prompt));
    }
    let model = |ai_k: &str, llama_k: &str, d: &str| {
        std::env::var(ai_k)
            .or_else(|_| std::env::var(llama_k))
            .unwrap_or_else(|_| d.to_string())
    };
    let body = json!({
        "nlQuestion": nl,
        "schema": schema,
        "context": context,
        "modelConfig": {
            "reasoningModel": model("AI_NL2SQL_MODEL", "LLAMA_REASONING_MODEL", "qwen3.6"),
            "sttModel": model("AI_STT_MODEL", "LLAMA_STT_MODEL", "Qwen3-ASR"),
            "ttsModel": model("AI_TTS_MODEL", "LLAMA_TTS_MODEL", "Qwen3-TTS"),
        },
    });
    let res =
        mastra_request(ai::client(Duration::from_secs(30)).post(format!("{}/api/nl-to-sql", mastra_url())))
            .json(&body)
            .send()
            .await
            .ok()?;
    if !res.status().is_success() {
        tracing::error!(status = res.status().as_u16(), "[Mastra] Translation failed");
        return None;
    }
    res.json().await.ok()
}

/// `isLlamaReasoningAvailable()`: a remote server is assumed up; a local one
/// must answer `/health` within 2 s.
pub async fn is_llama_reasoning_available() -> bool {
    let base = nl2sql_base();
    if !is_local(&base) {
        return true;
    }
    let root = base.strip_suffix("/v1").unwrap_or(&base).to_string();
    ai::client(Duration::from_secs(2))
        .get(format!("{root}/health"))
        .send()
        .await
        .is_ok_and(|r| r.status().is_success())
}

/// `buildSchemaContext`: up to 40 tables as `CREATE TABLE` statements.
#[must_use]
pub fn llama_schema_context(schema: &Value) -> String {
    let empty = Vec::new();
    let tables = schema.get("tables").and_then(Value::as_array).unwrap_or(&empty);
    if tables.is_empty() {
        return "-- No tables available in schema.".into();
    }
    tables
        .iter()
        .take(40)
        .map(|t| {
            let name = t.get("name").and_then(Value::as_str).unwrap_or_default();
            let cols = t
                .get("columns")
                .and_then(Value::as_array)
                .unwrap_or(&empty)
                .iter()
                .map(|c| match c {
                    Value::Object(o) => format!(
                        "  {} {}",
                        o.get("name")
                            .map(js::stringify)
                            .unwrap_or_default()
                            .trim_matches('"'),
                        o.get("type").and_then(Value::as_str).unwrap_or("text")
                    ),
                    other => format!("  {} text", js::text(other).unwrap_or_default()),
                })
                .collect::<Vec<_>>()
                .join(",\n");
            format!("CREATE TABLE {name} (\n{cols}\n);")
        })
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// The first `SELECT` (or `WITH … SELECT`) statement in a completion, fences
/// stripped.
fn select_of(raw: &str) -> Option<String> {
    let stripped = regex::Regex::new(r"(?i)^```sql\s*")
        .ok()?
        .replace(raw.trim(), "")
        .to_string();
    let stripped = stripped
        .strip_suffix("```")
        .unwrap_or(&stripped)
        .trim()
        .to_string();
    let re = regex::Regex::new(r"(?is)(WITH\s+.+?SELECT.+|SELECT.+)").ok()?;
    re.find(&stripped).map(|m| m.as_str().trim().to_string())
}

/// One `chat.completions.create` through the `openai` SDK's retry policy.
async fn llama_chat(system: &str, user: &str) -> Result<Option<String>, String> {
    let model = std::env::var("LLAMA_REASONING_MODEL")
        .ok()
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| "qwen3.6".into());
    let url = format!("{}/chat/completions", nl2sql_base());
    let key = nl2sql_key();
    let body = json!({
        "model": model,
        "max_tokens": 512,
        "messages": [{ "role": "system", "content": system }, { "role": "user", "content": user }],
    });
    let res = ai::send(|| {
        ai::client(Duration::from_secs(600))
            .post(&url)
            .bearer_auth(&key)
            .json(&body)
    })
    .await?;
    let data: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .map(str::to_string))
}

/// `validateGeneratedSQL`.
fn validate_generated(sql: &str) -> Vec<String> {
    let upper = sql.to_uppercase();
    let mut errors = Vec::new();
    if !sql.trim().to_uppercase().starts_with("SELECT") {
        errors.push("Query must be a SELECT statement".to_string());
    }
    for k in [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
    ] {
        if upper.contains(k) {
            errors.push(format!("Dangerous keyword found: {k}"));
        }
    }
    if !upper.contains("FROM") {
        errors.push("Missing FROM clause".into());
    }
    errors
}

/// `translateNLToSQLViaLlama(nl, schema)` without a user (the NL builder's
/// call): `(sql, confidence-free explanation)` or `None`.
pub async fn translate_via_llama(nl: &str, schema: &Value) -> Option<String> {
    if !is_llama_reasoning_available().await {
        return None;
    }
    let ctx = llama_schema_context(schema);
    let system = "You are an expert SQL query generator for database analysis and reporting.\nYour task is to convert natural language questions into accurate SQL queries.\n\nRULES:\n- Generate ONLY SELECT queries with no mutations (no INSERT, UPDATE, DELETE, DROP, etc.)\n- Use ONLY the tables and columns provided in the schema below\n- Do not use SELECT * unless explicitly requested\n- Return ONLY the SQL query with no explanation or markdown code fences\n- If a question cannot be answered with the provided schema, respond with \"UNABLE_TO_GENERATE\"";
    let user = format!(
        "SCHEMA:\n{ctx}\n\nQuestion: {nl}\n\nGenerate a SQL SELECT query that answers this question:"
    );
    let raw = llama_chat(system, &user).await.ok().flatten()?;
    let raw = raw.trim().to_string();
    if raw.contains("UNABLE_TO_GENERATE") {
        return None;
    }
    let initial = select_of(&raw)?;
    let errors = validate_generated(&initial);
    if errors.is_empty() {
        return Some(initial);
    }
    let fix_system = "You are an expert SQL query generator. Fix SQL query errors.\nReturn ONLY the corrected SQL query with no explanation or markdown code fences.";
    let fix_user = format!(
        "Original question: \"{nl}\"\nPrevious SQL: {initial}\nErrors found: {}\n\nSCHEMA:\n{ctx}\n\nGenerate a corrected SQL SELECT query (SELECT only, no mutations):",
        errors.join(", ")
    );
    let refined = llama_chat(fix_system, &fix_user).await.ok().flatten()?;
    select_of(&refined)
}

// ── schema-metadata.ts / nl-query-context-service.ts ─────────────────────────

static SCHEMA_CACHE: LazyLock<Mutex<HashMap<String, (std::time::Instant, Value)>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// `getSchemaMetadata(dataSource)`: tables and views with their column names
/// (typed `unknown`), cached for an hour.
///
/// Deliberate difference (MIGRATION_PLAN.md §9, D-36): Node runs this query
/// through `connection.raw(...)`, a method Kysely does not have; the error is
/// caught and every call returns `{ tables: [] }`, so the NL builder always
/// prompts the model with no schema at all.
pub async fn schema_metadata(ds_id: &str, user: &PgPool) -> Value {
    if let Some((at, v)) = SCHEMA_CACHE.lock().await.get(ds_id) {
        if at.elapsed() < Duration::from_secs(3600) {
            return v.clone();
        }
    }
    let rows = sqlx::query(
        "SELECT t.table_name::text AS table_name, \
                COALESCE(ARRAY_AGG(c.column_name::text ORDER BY c.ordinal_position) FILTER (WHERE c.column_name IS NOT NULL), '{}') AS columns \
         FROM information_schema.tables t \
         LEFT JOIN information_schema.columns c ON t.table_catalog = c.table_catalog \
           AND t.table_schema = c.table_schema AND t.table_name = c.table_name \
         WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema') \
         GROUP BY t.table_name, t.table_type ORDER BY t.table_name",
    )
    .fetch_all(user)
    .await;
    let tables: Vec<Value> = match rows {
        Ok(rows) => rows
            .iter()
            .map(|r| {
                let cols: Vec<String> = r.get("columns");
                json!({
                    "name": r.get::<String, _>("table_name"),
                    "columns": cols.iter().map(|c| json!({ "name": c, "type": "unknown" })).collect::<Vec<_>>(),
                })
            })
            .collect(),
        Err(e) => {
            tracing::error!(error = %e, "[Schema] PostgreSQL schema fetch failed");
            Vec::new()
        }
    };
    let v = json!({ "tables": tables });
    SCHEMA_CACHE
        .lock()
        .await
        .insert(ds_id.to_string(), (std::time::Instant::now(), v.clone()));
    v
}

/// A value as a template literal prints it.
fn template(v: Option<&Value>) -> String {
    match v {
        None => "undefined".into(),
        Some(Value::String(s)) => s.clone(),
        Some(other) => js::stringify(other),
    }
}

/// `x || "N/A"` in a template literal.
fn or_na(v: Option<&Value>) -> String {
    if js::truthy(v) {
        template(v)
    } else {
        "N/A".into()
    }
}

/// `buildMastraContextPrompt(dsId, roleName, nl, schemaContext)` (no
/// embedding: the recent-queries fallback, as every caller uses it).
pub async fn context_prompt(
    config: &PgPool,
    ds_id: &str,
    role: &str,
    schema_context: &str,
) -> Result<String, sqlx::Error> {
    let similar = sqlx::query(
        "SELECT nl_question, generated_sql, execution_time_ms, row_count FROM nl_query_context \
         WHERE data_source_id = $1 AND role_name = $2 AND was_successful = true ORDER BY created_at DESC LIMIT 3",
    )
    .bind(ds_id)
    .bind(role)
    .fetch_all(config)
    .await?;
    let stats = sqlx::query("SELECT * FROM nl_query_role_stats WHERE data_source_id = $1 AND role_name = $2")
        .bind(ds_id)
        .bind(role)
        .fetch_optional(config)
        .await?
        .map(|r| crate::common::db::pg_row_to_json(&r));
    let stat = |k: &str| stats.as_ref().and_then(|s| s.get(k));
    let json_field = |k: &str| {
        stat(k)
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .and_then(|s| serde_json::from_str::<Value>(s).ok())
            .map_or_else(|| "N/A".to_string(), |v| js::stringify(&v))
    };
    let mut out = format!(
        "\nDATABASE SCHEMA:\n{schema_context}\n\nROLE CONTEXT:\n- Role: {role}\n- Success Rate: {}%\n- Average Query Execution Time: {}ms\n- Common Query Types: {}\n- Common Tables: {}\n",
        or_na(stat("success_rate")),
        or_na(stat("avg_execution_time_ms")),
        json_field("common_query_types"),
        json_field("common_tables"),
    );
    if !similar.is_empty() {
        out.push_str("\nSIMILAR SUCCESSFUL QUERIES FROM THIS ROLE (for reference):\n");
        for (i, r) in similar.iter().enumerate() {
            let row = crate::common::db::pg_row_to_json(r);
            out.push_str(&format!(
                "\n{}. User Question: \"{}\"\n   Generated SQL: {}\n   Confidence: 80.0%\n   Execution Time: {}ms\n   Rows Returned: {}\n",
                i + 1,
                template(row.get("nl_question")),
                template(row.get("generated_sql")),
                template(row.get("execution_time_ms")),
                template(row.get("row_count")),
            ));
        }
        out.push_str("\nUse the above successful queries as reference patterns when appropriate.\n");
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cron_normalisation_matches_node() {
        assert_eq!(
            normalise_cron(Some("every Monday at 8am"), None).as_deref(),
            Some("0 8 * * 1")
        );
        // "month" contains "mon": Node answers Mondays, and so does this.
        assert_eq!(
            normalise_cron(Some("every month"), None).as_deref(),
            Some("0 8 * * 1")
        );
        assert_eq!(normalise_cron(Some("hourly"), None).as_deref(), Some("0 * * * *"));
        assert_eq!(
            normalise_cron(Some("whenever"), Some(" 5 4 * * * ")).as_deref(),
            Some("5 4 * * *")
        );
        assert_eq!(normalise_cron(Some("whenever"), Some("soon")), None);
        assert_eq!(normalise_cron(None, None), None);
    }

    #[test]
    fn json_extraction() {
        assert_eq!(
            extract_json("```json\n{\"a\": {\"b\": 1}}\n```").unwrap(),
            json!({"a": {"b": 1}})
        );
        assert!(extract_json("no json").is_err());
    }

    #[test]
    fn guardrail_messages() {
        let err =
            parse_report_definition(&json!({ "sql": "", "confidence": "high", "warnings": [] })).unwrap_err();
        assert!(err.starts_with("[\n  {\n    \"code\": \"too_small\""));
        assert!(err.contains("\"path\": [\n      \"explanation\"\n    ]"));
        assert!(err.contains("\"message\": \"Required\""));
        assert!(err.contains("\"message\": \"Expected number, received string\""));
        let ok = parse_report_definition(
            &json!({ "sql": "SELECT 1", "explanation": "x", "confidence": 0.9, "warnings": [] }),
        )
        .unwrap();
        assert_eq!(ok.metric_column, "");
    }

    #[test]
    fn select_extraction() {
        assert_eq!(
            select_of("```sql\nSELECT 1 FROM t\n```").as_deref(),
            Some("SELECT 1 FROM t")
        );
        assert_eq!(
            select_of("Here: with x as (select 1) select * from x").as_deref(),
            Some("with x as (select 1) select * from x")
        );
        assert_eq!(select_of("nothing"), None);
    }

    #[test]
    fn schema_context() {
        let s = json!({"tables": [{"name": "orders", "columns": [{"name": "id", "type": "unknown"}]}]});
        assert_eq!(
            llama_schema_context(&s),
            "CREATE TABLE orders (\n  id unknown\n);"
        );
        assert_eq!(
            llama_schema_context(&json!({"tables": []})),
            "-- No tables available in schema."
        );
    }
}
