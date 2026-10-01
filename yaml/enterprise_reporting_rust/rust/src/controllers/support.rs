//! Shared query helpers for controllers. Table and column names passed here
//! are compile-time constants, never request input.
use serde_json::Value;
use sqlx::{AssertSqlSafe, PgPool};

use crate::{
    common::{db::pg_rows_to_json, pagination::Page},
    datasources::DataSourceRow,
};

/// `SELECT * FROM <table> WHERE id = $1`.
///
/// # Errors
/// On a database error.
pub async fn find_by_id(pool: &PgPool, table: &'static str, id: &str) -> Result<Option<Value>, sqlx::Error> {
    let rows = sqlx::query(AssertSqlSafe(format!("SELECT * FROM {table} WHERE id = $1")))
        .bind(id)
        .fetch_all(pool)
        .await?;
    Ok(pg_rows_to_json(&rows).into_iter().next())
}

/// A page of `SELECT * FROM <table> [WHERE <filter>] ORDER BY <order>` and the
/// filtered total — the list shape reports, charts, dashboards and jobs use.
///
/// # Errors
/// On a database error.
pub async fn list_page(
    pool: &PgPool,
    table: &'static str,
    filter: Option<&'static str>,
    order_by: &'static str,
    page: Page,
) -> Result<(Vec<Value>, i64), sqlx::Error> {
    let where_clause = filter.map(|f| format!(" WHERE {f}")).unwrap_or_default();
    let rows = sqlx::query(AssertSqlSafe(format!(
        "SELECT * FROM {table}{where_clause} ORDER BY {order_by} LIMIT $1 OFFSET $2"
    )))
    .bind(page.page_size)
    .bind(page.offset())
    .fetch_all(pool)
    .await?;
    let total: i64 = sqlx::query_scalar(AssertSqlSafe(format!(
        "SELECT COUNT(id) FROM {table}{where_clause}"
    )))
    .fetch_one(pool)
    .await?;
    Ok((pg_rows_to_json(&rows), total))
}

/// An active data source by id, with the fields a connection needs.
///
/// # Errors
/// On a database error.
pub async fn active_data_source(pool: &PgPool, id: &str) -> Result<Option<DataSourceRow>, sqlx::Error> {
    sqlx::query_as::<_, DataSourceRow>(
        "SELECT id, name, client_type, connection_config FROM data_sources WHERE id = $1 AND is_active = true",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// Node's `sql.trim().replace(/;$/, "")`.
#[must_use]
pub fn strip_trailing_semicolon(sql: &str) -> &str {
    let t = sql.trim();
    t.strip_suffix(';').unwrap_or(t)
}

/// Node's `/\bLIMIT\s+\d+/i.test(sql)`.
#[must_use]
pub fn has_limit(sql: &str) -> bool {
    static RE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
    RE.get_or_init(|| regex::Regex::new(r"(?i)\bLIMIT\s+\d+").expect("static regex"))
        .is_match(sql)
}

/// "Is any of the caller's roles an admin role" as the Node routes spell it:
/// `roles.some(r => r.toLowerCase().includes("admin"))`.
#[must_use]
pub fn is_admin_by_role_name(roles: &[String]) -> bool {
    roles.iter().any(|r| r.to_lowercase().contains("admin"))
}

/// The request body as JSON, or `None` when it is not JSON — the Node routes
/// `await request.json()` inside their try, so a bad body is their generic 500.
#[must_use]
pub fn parse_body(body: &[u8]) -> Option<serde_json::Value> {
    serde_json::from_slice(body).ok()
}

/// `SELECT * … WHERE id = $1` after a write, as the Node routes return it.
///
/// # Errors
/// On a database error.
pub async fn reread(pool: &PgPool, table: &'static str, id: &str) -> Result<Value, sqlx::Error> {
    Ok(find_by_id(pool, table, id).await?.unwrap_or(Value::Null))
}
