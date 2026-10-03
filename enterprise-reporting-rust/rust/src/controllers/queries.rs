//! `/api/queries` — saved queries. Twin of `src/routes/api/queries*.ts`.
//!
//! A saved query is SQL something else will execute later, so it is checked
//! at save time as strictly as the SQL editor checks what it runs, **and**
//! again at run time: permissions change between saving and running.
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use loco_rs::prelude::*;
use serde_json::{json, Value};

use super::support::{
    active_data_source, find_by_id, has_limit, is_admin_by_role_name, strip_trailing_semicolon,
};
use crate::{
    auth::CurrentSession,
    common::{
        db::{pg_rows_to_json, pool},
        pagination::{Page, PageQuery},
        response,
        time::now_iso,
    },
    datasources::get_connection,
    permissions::query_access::validate_query_access,
    sql::validator::is_read_only_query,
};

const NOT_AUTHENTICATED: &str = "Not authenticated";
const READ_ONLY_REQUIRED: &str =
    "A saved query must be a single SELECT, WITH, EXPLAIN, SHOW or DESCRIBE statement.";

fn body_str<'a>(body: &'a Value, key: &str) -> Option<&'a str> {
    body.get(key).and_then(Value::as_str).filter(|s| !s.is_empty())
}

async fn list(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Query(q): Query<PageQuery>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            NOT_AUTHENTICATED,
        ));
    }
    let page = Page::from_query(&q, 20, None);
    let search = q.search.as_deref().unwrap_or_default().trim().to_string();
    let db = pool(&ctx);

    // Search at the database, including the data source's name — the
    // browser-side filter this replaced matched on it too.
    let matches =
        "(name ILIKE $1 OR description ILIKE $1 OR EXISTS (SELECT data_sources.id FROM data_sources \
                   WHERE data_sources.id = saved_queries.data_source_id AND data_sources.name ILIKE $1))";
    let result = async {
        if search.is_empty() {
            let rows = sqlx::query("SELECT * FROM saved_queries ORDER BY created_at DESC LIMIT $1 OFFSET $2")
                .bind(page.page_size)
                .bind(page.offset())
                .fetch_all(db)
                .await?;
            let total: i64 = sqlx::query_scalar("SELECT COUNT(id) FROM saved_queries")
                .fetch_one(db)
                .await?;
            Ok::<_, sqlx::Error>((rows, total))
        } else {
            let like = format!("%{search}%");
            // `matches` is a constant; the search term is bound as $1.
            let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
                "SELECT * FROM saved_queries WHERE {matches} ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            )))
            .bind(&like)
            .bind(page.page_size)
            .bind(page.offset())
            .fetch_all(db)
            .await?;
            let total: i64 = sqlx::query_scalar(sqlx::AssertSqlSafe(format!(
                "SELECT COUNT(id) FROM saved_queries WHERE {matches}"
            )))
            .bind(&like)
            .fetch_one(db)
            .await?;
            Ok((rows, total))
        }
    }
    .await;

    match result {
        Ok((rows, total)) => Ok(response::ok(json!({
            "items": pg_rows_to_json(&rows),
            "meta": page.meta(total),
        }))),
        Err(e) => {
            tracing::error!(error = %e, "Failed to fetch queries");
            Ok(response::error_no_code(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch queries",
            ))
        }
    }
}

async fn create(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            NOT_AUTHENTICATED,
        ));
    };
    let fail = || response::error_no_code(StatusCode::INTERNAL_SERVER_ERROR, "Failed to create query");
    let Ok(body) = serde_json::from_slice::<Value>(&body) else {
        return Ok(fail());
    };
    let (Some(name), Some(data_source_id), Some(sql_content)) = (
        body_str(&body, "name"),
        body_str(&body, "dataSourceId"),
        body_str(&body, "sqlContent"),
    ) else {
        return Ok(response::error_no_code(
            StatusCode::BAD_REQUEST,
            "Missing required fields",
        ));
    };

    if !is_read_only_query(sql_content) {
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            READ_ONLY_REQUIRED,
        ));
    }
    let db = pool(&ctx);
    let access = validate_query_access(db, &session.user.id, sql_content, data_source_id).await;
    if !access.allowed {
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            access
                .reason
                .as_deref()
                .unwrap_or("You do not have access to every table in this query"),
        ));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = now_iso();
    let inserted = sqlx::query(
        "INSERT INTO saved_queries (id, created_by, is_validated, name, description, data_source_id, sql_content, created_at, updated_at) \
         VALUES ($1, $2, false, $3, $4, $5, $6, $7, $7)",
    )
    .bind(&id)
    .bind(&session.user.id)
    .bind(name)
    .bind(body_str(&body, "description"))
    .bind(data_source_id)
    .bind(sql_content)
    .bind(&now)
    .execute(db)
    .await;
    match inserted {
        Ok(_) => Ok(response::ok_with(StatusCode::CREATED, json!({ "id": id }))),
        Err(e) => {
            tracing::error!(error = %e, "Failed to create query");
            Ok(fail())
        }
    }
}

async fn show(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    if session.is_none() {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            NOT_AUTHENTICATED,
        ));
    }
    match find_by_id(pool(&ctx), "saved_queries", &id).await {
        Ok(Some(row)) => Ok(response::ok(row)),
        Ok(None) => Ok(response::error_no_code(StatusCode::NOT_FOUND, "Query not found")),
        Err(e) => {
            tracing::error!(error = %e, "Error fetching query");
            Ok(response::error_no_code(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch query",
            ))
        }
    }
}

async fn owner_and_source(
    db: &sqlx::PgPool,
    id: &str,
) -> Result<Option<(Option<String>, String)>, sqlx::Error> {
    sqlx::query_as::<_, (Option<String>, String)>(
        "SELECT created_by, data_source_id FROM saved_queries WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(db)
    .await
}

async fn update(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            NOT_AUTHENTICATED,
        ));
    };
    let fail = || response::error_no_code(StatusCode::INTERNAL_SERVER_ERROR, "Failed to update query");
    let Ok(body) = serde_json::from_slice::<Value>(&body) else {
        return Ok(fail());
    };
    let db = pool(&ctx);
    let existing = match owner_and_source(db, &id).await {
        Ok(Some(e)) => e,
        Ok(None) => return Ok(response::error_no_code(StatusCode::NOT_FOUND, "Query not found")),
        Err(e) => {
            tracing::error!(error = %e, "Error updating query");
            return Ok(fail());
        }
    };
    if !is_admin_by_role_name(&session.user.roles) && existing.0.as_deref() != Some(session.user.id.as_str())
    {
        return Ok(response::error_no_code(StatusCode::FORBIDDEN, "Unauthorized"));
    }

    // `sqlContent` present (even empty) is re-validated, as in Node.
    if let Some(sql) = body.get("sqlContent").and_then(Value::as_str) {
        if !is_read_only_query(sql) {
            return Ok(response::error_no_code(StatusCode::FORBIDDEN, READ_ONLY_REQUIRED));
        }
        let target = body_str(&body, "dataSourceId").map_or_else(|| existing.1.clone(), String::from);
        let access = validate_query_access(db, &session.user.id, sql, &target).await;
        if !access.allowed {
            return Ok(response::error_no_code(
                StatusCode::FORBIDDEN,
                access
                    .reason
                    .as_deref()
                    .unwrap_or("You do not have access to every table in this query"),
            ));
        }
    }

    let description = body
        .get("description")
        .map(|d| d.as_str().filter(|s| !s.is_empty()).map(String::from));
    let updated = sqlx::query(
        "UPDATE saved_queries SET updated_at = $2, \
           name = COALESCE($3, name), \
           description = CASE WHEN $4 THEN $5 ELSE description END, \
           data_source_id = COALESCE($6, data_source_id), \
           sql_content = COALESCE($7, sql_content) \
         WHERE id = $1",
    )
    .bind(&id)
    .bind(now_iso())
    .bind(body_str(&body, "name"))
    .bind(description.is_some())
    .bind(description.flatten())
    .bind(body_str(&body, "dataSourceId"))
    .bind(body_str(&body, "sqlContent"))
    .execute(db)
    .await;
    match updated {
        Ok(_) => Ok(response::ok(json!({ "id": id }))),
        Err(e) => {
            tracing::error!(error = %e, "Error updating query");
            Ok(fail())
        }
    }
}

async fn destroy(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::error_no_code(
            StatusCode::UNAUTHORIZED,
            NOT_AUTHENTICATED,
        ));
    };
    let fail = || response::error_no_code(StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete query");
    let db = pool(&ctx);
    let existing = match owner_and_source(db, &id).await {
        Ok(Some(e)) => e,
        Ok(None) => return Ok(response::error_no_code(StatusCode::NOT_FOUND, "Query not found")),
        Err(e) => {
            tracing::error!(error = %e, "Error deleting query");
            return Ok(fail());
        }
    };
    if !is_admin_by_role_name(&session.user.roles) && existing.0.as_deref() != Some(session.user.id.as_str())
    {
        return Ok(response::error_no_code(StatusCode::FORBIDDEN, "Unauthorized"));
    }
    match sqlx::query("DELETE FROM saved_queries WHERE id = $1")
        .bind(&id)
        .execute(db)
        .await
    {
        Ok(_) => Ok(response::raw(StatusCode::OK, &json!({ "success": true }))),
        Err(e) => {
            tracing::error!(error = %e, "Error deleting query");
            Ok(fail())
        }
    }
}

async fn execute(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let db = pool(&ctx);
    let exec_error = |msg: &str| response::error(StatusCode::INTERNAL_SERVER_ERROR, "EXECUTION_ERROR", msg);

    let query = match sqlx::query_as::<_, (String, String)>(
        "SELECT sql_content, data_source_id FROM saved_queries WHERE id = $1",
    )
    .bind(&id)
    .fetch_optional(db)
    .await
    {
        Ok(Some(q)) => q,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Query not found",
            ))
        }
        Err(e) => return Ok(exec_error(&e.to_string())),
    };
    let (sql_content, data_source_id) = query;
    let data_source = match active_data_source(db, &data_source_id).await {
        Ok(Some(ds)) => ds,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Data source not found or inactive",
            ))
        }
        Err(e) => return Ok(exec_error(&e.to_string())),
    };

    if !is_read_only_query(&sql_content) {
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            "This saved query is not a single read-only statement and was not run.",
        ));
    }
    let access = validate_query_access(db, &session.user.id, &sql_content, &data_source_id).await;
    if !access.allowed {
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            access
                .reason
                .as_deref()
                .unwrap_or("You do not have access to every table in this query"),
        ));
    }

    let conn = match get_connection(&data_source).await {
        Ok(c) => c,
        Err(e) => return Ok(exec_error(&e.to_string())),
    };
    let limited = strip_trailing_semicolon(&sql_content);
    let to_run = if has_limit(limited) {
        limited.to_string()
    } else {
        format!("{limited} LIMIT 1000")
    };
    match conn.fetch_json(&to_run).await {
        Ok(rows) => {
            let columns: Vec<String> = rows
                .first()
                .and_then(Value::as_object)
                .map(|o| o.keys().cloned().collect())
                .unwrap_or_default();
            let row_count = rows.len();
            Ok(response::ok(
                json!({ "rows": rows, "columns": columns, "rowCount": row_count }),
            ))
        }
        Err(e) => {
            tracing::error!(error = %e, "Error executing query");
            Ok(exec_error(&e.to_string()))
        }
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/queries")
        .add("/", get(list).post(create))
        .add("/{id}", get(show).put(update).delete(destroy))
        .add("/{id}/execute", post(execute))
}
