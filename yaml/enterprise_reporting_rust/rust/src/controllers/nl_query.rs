//! `/api/nl-query/{history,schema,execute,rag-store,rag-context,voice}` and
//! `/api/voice/{transcribe,synthesize}` — twins of the Node routes of the
//! same names.
//!
//! Deliberate difference (MIGRATION_PLAN.md §9, D-26): `execute` runs the
//! client's `generated_sql` only when it is one read-only statement whose
//! tables the caller may read, inside the read-only transaction user SQL
//! always gets. Node checked table access only, so an analyst with `select`
//! on a table could `UPDATE` or `DELETE` it through this route.
use std::time::Instant;

use axum::{
    body::{Body, Bytes},
    extract::{multipart::MultipartRejection, Multipart, Query, State},
    http::{header, Method, StatusCode},
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::{json, Map, Value};

use super::support::parse_body;
use crate::{
    auth::{CurrentSession, Session},
    common::{
        db::{pg_rows_to_json, pool},
        js,
        pagination::js_parse_int,
        response,
    },
    datasources::{get_connection, DataSourceRow, UserDb},
    nlquery::{ai, rag},
    permissions::ds_rbac::{check_entity_access, Entity},
    sql::{tables::analyse, validator::is_read_only_query},
};

fn fail(status: StatusCode, message: &str) -> Response {
    response::raw(
        status,
        &json!({ "success": false, "error": { "message": message } }),
    )
}

fn unauthorized() -> Response {
    fail(StatusCode::UNAUTHORIZED, "Unauthorized")
}

/// JavaScript `String.length`.
fn js_len(s: &str) -> usize {
    s.encode_utf16().count()
}

/// `String(v)` as a template literal prints a value.
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".into(),
        Value::Object(_) => "[object Object]".into(),
        Value::Array(a) => a
            .iter()
            .map(|x| if x.is_null() { String::new() } else { js_string(x) })
            .collect::<Vec<_>>()
            .join(","),
        other => crate::render::cell_text(other),
    }
}

/// A live (not deleted) data source and a connection to it.
async fn open(ctx: &AppContext, id: &str) -> std::result::Result<(DataSourceRow, UserDb), Response> {
    let ds: Option<DataSourceRow> = sqlx::query_as(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1 AND is_deleted = false",
    )
    .bind(id)
    .fetch_optional(pool(ctx))
    .await
    .map_err(|e| fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let ds = ds.ok_or_else(|| fail(StatusCode::NOT_FOUND, "Data source not found"))?;
    let conn = get_connection(&ds)
        .await
        .map_err(|e| fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    Ok((ds, conn))
}

#[allow(clippy::result_large_err)]
fn pg(conn: &UserDb) -> std::result::Result<&sqlx::PgPool, Response> {
    match conn {
        UserDb::Pg(p) => Ok(p),
        UserDb::MySql(_) => Err(fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "NL query context is served for PostgreSQL data sources only",
        )),
    }
}

#[derive(Debug, Deserialize)]
struct HistoryQuery {
    data_source_id: Option<String>,
    limit: Option<String>,
    offset: Option<String>,
    search: Option<String>,
    scope: Option<String>,
}

/// `GET /api/nl-query/history` — successful NL queries of the caller's
/// primary role (or, `scope=user`, the caller's own).
async fn history(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<HistoryQuery>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let limit =
        js_parse_int(q.limit.as_deref().filter(|s| !s.is_empty()).unwrap_or("10")).map(|n| n.min(200));
    let offset = js_parse_int(q.offset.as_deref().filter(|s| !s.is_empty()).unwrap_or("0"));
    let (Some(limit), Some(offset)) = (limit, offset) else {
        // Node binds `NaN` and reports Postgres's refusal of it.
        return Ok(fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "invalid input syntax for type bigint: \"NaN\"",
        ));
    };
    let role = session
        .user
        .roles
        .first()
        .cloned()
        .unwrap_or_else(|| "viewer".into());
    let by_role = q.scope.as_deref().unwrap_or("role") == "role";
    let search = q.search.as_deref().map(str::trim).unwrap_or_default().to_string();
    let ds = q.data_source_id.filter(|d| !d.is_empty());

    let mut conds = vec!["c.was_successful = true".to_string()];
    let mut binds: Vec<String> = Vec::new();
    let mut total_conds = conds.clone();
    let mut total_binds: Vec<String> = Vec::new();
    if !search.is_empty() {
        binds.push(format!("%{search}%"));
        conds.push(format!(
            "(c.nl_question LIKE ${0} OR c.generated_sql LIKE ${0})",
            binds.len()
        ));
    }
    if let Some(d) = &ds {
        binds.push(d.clone());
        conds.push(format!("c.data_source_id = ${}", binds.len()));
        total_binds.push(d.clone());
        total_conds.push(format!("c.data_source_id = ${}", total_binds.len()));
    }
    let (col, val) = if by_role {
        ("role_name", role)
    } else {
        ("user_id", session.user.id.clone())
    };
    binds.push(val.clone());
    conds.push(format!("c.{col} = ${}", binds.len()));
    total_binds.push(val);
    total_conds.push(format!("c.{col} = ${}", total_binds.len()));

    let sql = format!(
        "SELECT c.id, c.nl_question, c.generated_sql, c.data_source_id, ds.name AS data_source_name, c.role_name, \
           c.user_id, u.display_name AS user_name, c.was_successful, c.row_count, c.execution_time_ms, c.created_at \
         FROM nl_query_context c LEFT JOIN data_sources ds ON ds.id = c.data_source_id LEFT JOIN users u ON u.id = c.user_id \
         WHERE {} ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}",
        conds.join(" AND ")
    );
    let db = pool(&ctx);
    let run = async {
        let mut rq = sqlx::query(sqlx::AssertSqlSafe(sql));
        for b in &binds {
            rq = rq.bind(b);
        }
        let rows = rq.fetch_all(db).await?;
        let mut cq = sqlx::query_scalar::<_, i64>(sqlx::AssertSqlSafe(format!(
            "SELECT COUNT(*) FROM nl_query_context c WHERE {}",
            total_conds.join(" AND ")
        )));
        for b in &total_binds {
            cq = cq.bind(b);
        }
        Ok::<_, sqlx::Error>((pg_rows_to_json(&rows), cq.fetch_one(db).await?))
    };
    Ok(match run.await {
        Ok((rows, total)) => response::raw(
            StatusCode::OK,
            &json!({ "success": true, "data": rows, "meta": { "total": total, "limit": limit, "offset": offset } }),
        ),
        Err(e) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            &crate::datasources::db_error_message(&e),
        ),
    })
}

/// `POST /api/nl-query/history` — record a successful NL query.
async fn save_history(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let b = parse_body(&body).unwrap_or_else(|| json!({}));
    let (Some(question), Some(sql)) = (
        b.get("nl_question")
            .filter(|v| js::truthy(Some(v)))
            .and_then(js::text),
        b.get("generated_sql")
            .filter(|v| js::truthy(Some(v)))
            .and_then(js::text),
    ) else {
        return Ok(fail(
            StatusCode::BAD_REQUEST,
            "nl_question and generated_sql are required",
        ));
    };
    let id = uuid::Uuid::new_v4().simple().to_string();
    let role = session
        .user
        .roles
        .first()
        .cloned()
        .unwrap_or_else(|| "viewer".into());
    let or = |k: &str, d: &str| {
        b.get(k)
            .filter(|v| !v.is_null())
            .and_then(js::text)
            .unwrap_or_else(|| d.to_string())
    };
    let r = sqlx::query(
        "INSERT INTO nl_query_context (id, created_at, nl_question, generated_sql, data_source_id, user_id, role_name, \
           schema_context, rbac_context, row_count, execution_time_ms, was_successful, created_by) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{}', '{}', CAST($8 AS INT), CAST($9 AS INT), CAST($10 AS BOOLEAN), $6)",
    )
    .bind(&id)
    .bind(crate::common::time::now_iso())
    .bind(question)
    .bind(sql)
    .bind(b.get("data_source_id").filter(|v| js::truthy(Some(v))).and_then(js::text).unwrap_or_default())
    .bind(&session.user.id)
    .bind(role)
    .bind(or("row_count", "0"))
    .bind(or("execution_time_ms", "0"))
    .bind(or("was_successful", "true"))
    .execute(pool(&ctx))
    .await;
    Ok(match r {
        Ok(_) => response::ok(json!({ "id": id })),
        Err(e) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            &crate::datasources::db_error_message(&e),
        ),
    })
}

#[derive(Debug, Deserialize)]
struct SchemaQuery {
    data_source_id: Option<String>,
}

/// `GET|POST /api/nl-query/schema` — the tables of a data source as prompt
/// context; also refreshes the schema embeddings (in the background).
async fn schema(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    method: Method,
    Query(q): Query<SchemaQuery>,
    body: Bytes,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let mut ds_id = q.data_source_id.filter(|s| !s.is_empty());
    if ds_id.is_none() && method == Method::POST {
        let Some(b) = parse_body(&body) else {
            return Ok(fail(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Unexpected end of JSON input",
            ));
        };
        ds_id = ["data_source_id", "dataSourceId"]
            .iter()
            .find_map(|k| b.get(*k).filter(|v| js::truthy(Some(v))).and_then(js::text));
    }
    let Some(ds_id) = ds_id else {
        return Ok(fail(StatusCode::BAD_REQUEST, "data_source_id is required"));
    };
    let (ds, conn) = match open(&ctx, &ds_id).await {
        Ok(x) => x,
        Err(r) => return Ok(r),
    };
    let user_pool = match pg(&conn) {
        Ok(p) => p.clone(),
        Err(r) => return Ok(r),
    };
    let cols = match conn
        .fetch_json(
            "SELECT table_name::text AS table_name, column_name::text AS column_name, data_type::text AS data_type \
             FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ( \
               SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') \
             ORDER BY table_name, ordinal_position",
        )
        .await
    {
        Ok(c) => c,
        Err(e) => return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &crate::datasources::db_error_message(&e))),
    };
    let mut tables: Vec<(String, Vec<(String, String)>)> = Vec::new();
    for c in &cols {
        let t = c["table_name"].as_str().unwrap_or_default().to_string();
        let col = (
            c["column_name"].as_str().unwrap_or_default().to_string(),
            c["data_type"].as_str().unwrap_or_default().to_string(),
        );
        match tables.iter_mut().find(|(n, _)| *n == t) {
            Some((_, v)) => v.push(col),
            None => tables.push((t, vec![col])),
        }
    }
    let mut samples = Map::new();
    for (t, _) in &tables {
        let quoted = format!("\"{}\"", t.replace('"', "\"\""));
        let rows = conn
            .fetch_json(&format!("SELECT * FROM {quoted} LIMIT 5"))
            .await
            .unwrap_or_default();
        samples.insert(t.clone(), Value::Array(rows));
    }
    {
        let (ds_id, tables) = (ds_id.clone(), tables.clone());
        tokio::spawn(async move { rag::store_schema(&user_pool, &ds_id, &tables, &samples).await });
    }

    let listed: Vec<&(String, Vec<(String, String)>)> =
        tables.iter().filter(|(n, _)| !n.starts_with("nl_")).collect();
    let bus: Vec<&String> = listed
        .iter()
        .map(|(n, _)| n)
        .filter(|n| n.starts_with("bus_"))
        .collect();
    let display: Vec<&String> = if bus.is_empty() {
        listed.iter().map(|(n, _)| n).collect()
    } else {
        bus
    };
    let instructions: Vec<(String, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT table_name, llm_instructions, description FROM schema_table_instructions WHERE data_source_id = $1",
    )
    .bind(&ds_id)
    .fetch_all(pool(&ctx))
    .await
    .unwrap_or_default();
    let names: Vec<&str> = display.iter().map(|s| s.as_str()).collect();
    let mut lines = vec![
        "DATABASE SCHEMA (PostgreSQL):".to_string(),
        format!("Available tables: {}", names.join(", ")),
        String::new(),
        "TABLE COLUMNS:".to_string(),
    ];
    for (n, c) in &listed {
        if display.contains(&n) {
            let cs: Vec<&str> = c.iter().map(|(x, _)| x.as_str()).collect();
            lines.push(format!("  {n}: {}", cs.join(", ")));
        }
    }
    lines.push(String::new());
    lines.push("IMPORTANT: Call fetchSimilarQueries FIRST to get detailed column schemas and sample data for relevant tables before generating SQL.".into());
    if !instructions.is_empty() {
        lines.push("\nTABLE INSTRUCTIONS:".into());
        for (t, llm, desc) in &instructions {
            let text = llm.clone().filter(|s| !s.is_empty()).or_else(|| desc.clone());
            lines.push(format!("{t}: {}", text.unwrap_or_else(|| "null".into())));
        }
    }
    let tables_json: Vec<Value> = listed
        .iter()
        .map(|(n, c)| json!({ "name": n, "columns": c.iter().map(|(x, _)| x).collect::<Vec<_>>() }))
        .collect();
    Ok(response::ok(json!({
        "data_source_id": ds_id,
        "data_source_name": ds.name,
        "client_type": ds.client_type,
        "tables": tables_json,
        "schemaText": lines.join("\n"),
    })))
}

/// `validateSqlTokens`' structural half: balanced quotes and parentheses.
fn token_errors(sql: &str) -> Vec<String> {
    let mut errors = Vec::new();
    let (mut depth, mut single, mut double) = (0_i64, false, false);
    let mut prev = '\0';
    for (i, c) in sql.encode_utf16().enumerate() {
        let ch = char::from_u32(u32::from(c)).unwrap_or('\0');
        if ch == '\'' && !double && prev != '\\' {
            single = !single;
        } else if ch == '"' && !single && prev != '\\' {
            double = !double;
        } else if !single && !double {
            if ch == '(' {
                depth += 1;
            } else if ch == ')' {
                depth -= 1;
            }
            if depth < 0 {
                errors.push(format!("Unmatched closing parenthesis at position {i}"));
            }
        }
        prev = ch;
    }
    if single {
        errors.push("Unterminated single quote".into());
    }
    if double {
        errors.push("Unterminated double quote".into());
    }
    if depth > 0 {
        errors.push(format!("{depth} unclosed parenthesis(es)"));
    }
    errors
}

/// `POST /api/nl-query/execute` — run the NL query's SQL for the caller.
#[allow(clippy::too_many_lines)]
async fn execute(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(unauthorized());
    };
    let Some(b) = parse_body(&body) else {
        return Ok(fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Unexpected end of JSON input",
        ));
    };
    let (Some(question), Some(ds_id)) = (
        b.get("query").filter(|v| js::truthy(Some(v))).and_then(js::text),
        b.get("data_source_id")
            .filter(|v| js::truthy(Some(v)))
            .and_then(js::text),
    ) else {
        return Ok(fail(
            StatusCode::BAD_REQUEST,
            "query and data_source_id are required",
        ));
    };
    let (ds, conn) = match open(&ctx, &ds_id).await {
        Ok(x) => x,
        Err(r) => return Ok(r),
    };
    let sql = b
        .get("generated_sql")
        .filter(|v| js::truthy(Some(v)))
        .and_then(js::text)
        .unwrap_or_else(|| "SELECT 1;".into());
    let mut result = Map::new();
    result.insert("naturalLanguageQuery".into(), json!(question));
    result.insert("generatedSql".into(), json!(sql));
    let done =
        |mut r: Map<String, Value>, entities: Value, checks: Value, granted: bool, tail: (&str, Value)| {
            r.insert("parsedEntities".into(), entities);
            r.insert("accessCheckResults".into(), checks);
            r.insert("accessGranted".into(), json!(granted));
            r.insert(tail.0.into(), tail.1);
            response::ok(Value::Object(r))
        };

    // Node's pipeline builds `nl_query_history` writes and never executes
    // them (P-14), so nothing is recorded here either.
    let mut errors = token_errors(&sql);
    // D-26: one read-only statement, or it is not run at all.
    let analysis = match analyse(&sql, "pg") {
        Ok(a) if is_read_only_query(&sql) => Some(a),
        Ok(_) => {
            errors.push("This query is not a single read-only statement and was not run.".into());
            None
        }
        Err(e) => {
            errors.push(format!("SQL parse error: {e}"));
            None
        }
    };
    let Some(analysis) = analysis.filter(|_| errors.is_empty()) else {
        return Ok(done(
            result,
            json!([]),
            json!([]),
            false,
            (
                "error",
                json!(format!("Generated SQL has syntax errors: {}", errors.join("; "))),
            ),
        ));
    };
    let entities: Vec<Value> = analysis
        .tables
        .iter()
        .map(|t| json!({ "name": t, "type": "table" }))
        .collect();
    let checks = if analysis.tables.is_empty() {
        Vec::new()
    } else {
        let list: Vec<Entity> = analysis.tables.iter().map(|t| Entity::table(t)).collect();
        match check_entity_access(pool(&ctx), &session.user.id, &ds.id, &list).await {
            Ok(c) => c,
            Err(e) => return Ok(fail(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())),
        }
    };
    let denied: Vec<&str> = checks
        .iter()
        .filter(|c| !c.has_access)
        .map(|c| c.entity.as_str())
        .collect();
    let checks_json = serde_json::to_value(&checks).unwrap_or(Value::Null);
    if !denied.is_empty() {
        let msg = format!(
            "Access denied. You do not have permission to query the following entities: {}. Contact your administrator to request access.",
            denied.join(", ")
        );
        return Ok(done(
            result,
            json!(entities),
            checks_json,
            false,
            ("error", json!(msg)),
        ));
    }
    let mut executable = sql.trim().to_string();
    if !executable.to_lowercase().contains("limit") {
        let re = regex::Regex::new(r";?\s*$").map_err(|e| Error::string(&e.to_string()))?;
        executable = re.replace(&executable, " LIMIT 1000;").into_owned();
    }
    let started = Instant::now();
    match conn.fetch_json(&executable).await {
        Ok(rows) => {
            let ms = i64::try_from(started.elapsed().as_millis()).unwrap_or(i64::MAX);
            let columns: Vec<String> = rows
                .first()
                .and_then(Value::as_object)
                .map(|o| o.keys().cloned().collect())
                .unwrap_or_default();
            let n = rows.len();
            if let UserDb::Pg(p) = &conn {
                let (p, ds_id, q, s) = (p.clone(), ds.id.clone(), question.clone(), sql.clone());
                tokio::spawn(async move {
                    rag::store_query(&p, &ds_id, &q, &s, i64::try_from(n).ok(), Some(ms)).await;
                });
            }
            Ok(done(
                result,
                json!(entities),
                checks_json,
                true,
                (
                    "queryResults",
                    json!({ "columns": columns, "rows": rows, "totalRows": n, "executionTimeMs": ms }),
                ),
            ))
        }
        Err(e) => Ok(done(
            result,
            json!(entities),
            checks_json,
            true,
            (
                "error",
                json!(format!(
                    "Query execution failed: {}",
                    crate::datasources::db_error_message(&e)
                )),
            ),
        )),
    }
}

/// `POST /api/nl-query/rag-store` — remember a successful query.
async fn rag_store(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let Some(b) = parse_body(&body) else {
        return Ok(fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Unexpected end of JSON input",
        ));
    };
    let get = |k: &str| b.get(k).filter(|v| js::truthy(Some(v))).and_then(js::text);
    let (Some(ds_id), Some(question), Some(sql)) = (
        get("data_source_id"),
        get("natural_language_query"),
        get("generated_sql"),
    ) else {
        return Ok(fail(
            StatusCode::BAD_REQUEST,
            "data_source_id, natural_language_query, and generated_sql are required",
        ));
    };
    let (_, conn) = match open(&ctx, &ds_id).await {
        Ok(x) => x,
        Err(r) => return Ok(r),
    };
    let p = match pg(&conn) {
        Ok(p) => p,
        Err(r) => return Ok(r),
    };
    let int = |k: &str| {
        b.get(k).and_then(Value::as_f64).map(|f| {
            #[allow(clippy::cast_possible_truncation)]
            let i = f as i64;
            i
        })
    };
    rag::store_query(
        p,
        &ds_id,
        &question,
        &sql,
        int("row_count"),
        int("execution_time_ms"),
    )
    .await;
    Ok(response::raw(StatusCode::OK, &json!({ "success": true })))
}

/// `(maxChars, maxQueries, maxTables, sampleRows)` per tier.
fn tier(name: &str) -> (usize, i64, i64, usize) {
    match name {
        "small" => (1500, 2, 2, 0),
        "large" => (8000, 3, 5, 2),
        _ => (4000, 3, 3, 1),
    }
}

/// `buildModularContext`.
fn modular_context(similar: &[Value], schema: &[Value], tier_name: &str) -> (String, Vec<Value>) {
    let (max_chars, max_queries, max_tables, sample_rows) = tier(tier_name);
    let mut modules = Vec::new();
    let mut parts: Vec<String> = Vec::new();
    let mut used = 0usize;
    let s = |v: &Value, k: &str| v.get(k).map(js_string).unwrap_or_else(|| "undefined".into());
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let queries: Vec<&Value> = similar.iter().take(max_queries as usize).collect();
    if queries.is_empty() {
        modules.push(
            json!({ "name": "Past queries", "status": "done", "detail": "None found yet", "chars": 0 }),
        );
    } else {
        let mut q = vec!["PROVEN SQL FROM PAST QUERIES:".to_string()];
        for x in &queries {
            q.push(format!(
                "Q: \"{}\" → SQL: {}",
                s(x, "naturalLanguageQuery"),
                s(x, "generatedSql")
            ));
        }
        let text = q.join("\n");
        if used + js_len(&text) <= max_chars {
            used += js_len(&text);
            modules.push(json!({ "name": "Past queries", "status": "done", "detail": format!("{} proven SQL", queries.len()), "chars": js_len(&text) }));
            parts.push(text);
        } else {
            modules.push(json!({ "name": "Past queries", "status": "trimmed", "detail": "Exceeded budget", "chars": 0 }));
        }
    }
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let tables: Vec<&Value> = schema.iter().take(max_tables as usize).collect();
    if tables.is_empty() {
        modules
            .push(json!({ "name": "Schema context", "status": "done", "detail": "No matches", "chars": 0 }));
    } else {
        let mut t = vec!["RELEVANT TABLES:".to_string()];
        for x in &tables {
            t.push(s(x, "schemaText"));
            if sample_rows > 0 {
                if let Some(first) = x
                    .get("sampleData")
                    .and_then(Value::as_array)
                    .and_then(|a| a.first())
                    .and_then(Value::as_object)
                {
                    let vals: Vec<String> = first
                        .iter()
                        .map(|(k, v)| format!("{k}={}", js_string(v)))
                        .collect();
                    t.push(format!("  Example: {}", vals.join(", ")));
                }
            }
        }
        let text = t.join("\n");
        if used + js_len(&text) <= max_chars {
            used += js_len(&text);
            modules.push(json!({ "name": "Schema context", "status": "done", "detail": format!("{} tables", tables.len()), "chars": js_len(&text) }));
            parts.push(text);
        } else {
            let mut fit = vec!["RELEVANT TABLES:".to_string()];
            let mut count = 0;
            for x in &tables {
                let candidate = format!("{}\n{}", fit.join("\n"), s(x, "schemaText"));
                if used + js_len(&candidate) > max_chars {
                    break;
                }
                fit.push(s(x, "schemaText"));
                count += 1;
            }
            if count > 0 {
                let text = fit.join("\n");
                used += js_len(&text);
                modules.push(json!({ "name": "Schema context", "status": "trimmed", "detail": format!("{count}/{} tables fit", tables.len()), "chars": js_len(&text) }));
                parts.push(text);
            } else {
                modules.push(json!({ "name": "Schema context", "status": "trimmed", "detail": "No room in budget", "chars": 0 }));
            }
        }
    }
    modules.push(json!({ "name": "Context budget", "status": "done", "detail": format!("{used}/{max_chars} chars ({tier_name})"), "chars": 0 }));
    (parts.join("\n\n"), modules)
}

/// `POST /api/nl-query/rag-context` — past queries and schema context for a
/// question, within a character budget.
async fn rag_context(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    if session.is_none() {
        return Ok(unauthorized());
    }
    let Some(b) = parse_body(&body) else {
        return Ok(fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Unexpected end of JSON input",
        ));
    };
    let (Some(question), Some(ds_id)) = (
        b.get("query").filter(|v| js::truthy(Some(v))).and_then(js::text),
        b.get("data_source_id")
            .filter(|v| js::truthy(Some(v)))
            .and_then(js::text),
    ) else {
        return Ok(fail(
            StatusCode::BAD_REQUEST,
            "query and data_source_id are required",
        ));
    };
    let tier_name = match b
        .get("context_budget")
        .filter(|v| js::truthy(Some(v)))
        .map(crate::monitoring::js::number)
    {
        None => "medium",
        Some(n) if n <= 2000.0 => "small",
        Some(n) if n <= 5000.0 => "medium",
        Some(_) => "large",
    };
    let (_, _, max_tables, _) = tier(tier_name);
    #[allow(clippy::cast_possible_truncation)]
    let max_queries = match b.get("top_k_queries") {
        None | Some(Value::Null) => tier(tier_name).1,
        Some(v) => crate::monitoring::js::number(v) as i64,
    };
    let (_, conn) = match open(&ctx, &ds_id).await {
        Ok(x) => x,
        Err(r) => return Ok(r),
    };
    let p = match pg(&conn) {
        Ok(p) => p,
        Err(r) => return Ok(r),
    };
    let (similar, relevant) = tokio::join!(
        rag::similar_queries(p, &ds_id, &question, max_queries),
        rag::relevant_schema(p, &ds_id, &question, max_tables)
    );
    let words: Vec<String> = question
        .to_lowercase()
        .split(|c: char| c.is_whitespace() || c == '\u{feff}')
        .filter(|w| js_len(w) > 2)
        .map(str::to_string)
        .collect();
    let found: Vec<String> = relevant
        .iter()
        .filter_map(|s| s.get("tableName").and_then(Value::as_str).map(str::to_string))
        .collect();
    let mut all = relevant;
    all.extend(rag::keyword_tables(p, &ds_id, &words, &found).await);
    let (text, modules) = modular_context(&similar, &all, tier_name);
    Ok(response::ok(json!({
        "similarQueries": similar,
        "relevantSchema": all,
        "contextText": text,
        "tier": tier_name,
        "modules": modules,
    })))
}

/// The `audio` part of a multipart body, if there is one.
async fn audio_part(mut form: Multipart) -> std::result::Result<Option<Vec<u8>>, String> {
    while let Some(field) = form.next_field().await.map_err(|e| e.to_string())? {
        if field.name() == Some("audio") {
            return field
                .bytes()
                .await
                .map(|b| Some(b.to_vec()))
                .map_err(|e| e.to_string());
        }
    }
    Ok(None)
}

fn plain(status: StatusCode, body: &Value) -> Response {
    response::raw(status, body)
}

/// `POST /api/nl-query/voice` — transcribe; failures are `success: false`
/// with 200, as in Node.
async fn nl_voice(
    CurrentSession(session): CurrentSession,
    form: std::result::Result<Multipart, MultipartRejection>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(plain(
            StatusCode::UNAUTHORIZED,
            &json!({ "success": false, "error": "Unauthorized" }),
        ));
    }
    let refuse = |m: &str| plain(StatusCode::OK, &json!({ "success": false, "error": m }));
    let Ok(form) = form else {
        return Ok(refuse("Expected multipart/form-data with audio field"));
    };
    let audio = match audio_part(form).await {
        Ok(Some(a)) => a,
        Ok(None) => return Ok(refuse("No audio data in request")),
        Err(_) => return Ok(refuse("Expected multipart/form-data with audio field")),
    };
    Ok(match ai::transcribe(audio).await {
        Ok(t) if t.is_empty() => {
            refuse("Transcription failed. Ensure Qwen3-ASR is available on llama.cpp server.")
        }
        Ok(t) => plain(StatusCode::OK, &json!({ "success": true, "text": t })),
        Err(e) => refuse(&e),
    })
}

fn not_authenticated(session: Option<&Session>) -> Option<Response> {
    session
        .is_none()
        .then(|| plain(StatusCode::UNAUTHORIZED, &json!({ "error": "Not authenticated" })))
}

/// `POST /api/voice/transcribe`.
async fn transcribe(
    CurrentSession(session): CurrentSession,
    form: std::result::Result<Multipart, MultipartRejection>,
) -> Result<Response> {
    if let Some(r) = not_authenticated(session.as_ref()) {
        return Ok(r);
    }
    let internal = || {
        plain(
            StatusCode::INTERNAL_SERVER_ERROR,
            &json!({ "error": "Internal server error" }),
        )
    };
    let Ok(form) = form else { return Ok(internal()) };
    let audio = match audio_part(form).await {
        Ok(Some(a)) => a,
        Ok(None) => {
            return Ok(plain(
                StatusCode::BAD_REQUEST,
                &json!({ "error": "No audio file provided" }),
            ))
        }
        Err(_) => return Ok(internal()),
    };
    Ok(match ai::transcribe(audio).await {
        Ok(t) if t.is_empty() => plain(
            StatusCode::INTERNAL_SERVER_ERROR,
            &json!({ "error": "Transcription failed" }),
        ),
        Ok(t) => plain(StatusCode::OK, &json!({ "success": true, "text": t })),
        Err(_) => internal(),
    })
}

/// `POST /api/voice/synthesize` — MP3 of `text`.
async fn synthesize(CurrentSession(session): CurrentSession, body: Bytes) -> Result<Response> {
    if let Some(r) = not_authenticated(session.as_ref()) {
        return Ok(r);
    }
    let internal = || {
        plain(
            StatusCode::INTERNAL_SERVER_ERROR,
            &json!({ "error": "Internal server error" }),
        )
    };
    let Some(b) = parse_body(&body) else {
        return Ok(internal());
    };
    let Some(text) = b.get("text").and_then(Value::as_str).filter(|t| !t.is_empty()) else {
        return Ok(plain(
            StatusCode::BAD_REQUEST,
            &json!({ "error": "Text field is required" }),
        ));
    };
    Ok(match ai::synthesize(text).await {
        Ok(audio) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "audio/mpeg")
            .body(Body::from(audio))
            .unwrap_or_else(|_| internal()),
        Err(_) => internal(),
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api")
        .add("/nl-query/history", get(history).post(save_history))
        .add("/nl-query/schema", get(schema).post(schema))
        .add("/nl-query/execute", post(execute))
        .add("/nl-query/rag-store", post(rag_store))
        .add("/nl-query/rag-context", post(rag_context))
        .add("/nl-query/voice", post(nl_voice))
        .add("/voice/transcribe", post(transcribe))
        .add("/voice/synthesize", post(synthesize))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_and_budget() {
        assert_eq!(token_errors("SELECT (1"), vec!["1 unclosed parenthesis(es)"]);
        assert_eq!(token_errors("SELECT 'a"), vec!["Unterminated single quote"]);
        assert!(token_errors("SELECT ')'").is_empty());
        let (text, modules) = modular_context(&[], &[], "small");
        assert!(text.is_empty());
        assert_eq!(modules[2]["detail"], "0/1500 chars (small)");
    }
}
