//! The Apache AGE knowledge graph (`src/lib/graph/`): a property graph of
//! data sources, their tables, columns and foreign keys, and the reports,
//! charts and dashboards built on them, in its own database
//! (`GRAPH_DATABASE_URL`). The NL paths read it for schema context
//! ([`rag`]); [`sync`] writes it at boot and on demand.
//!
//! Every graph failure is non-fatal, as in Node: an installation without the
//! graph database simply gets no graph context.
pub mod rag;
pub mod sync;

use std::sync::OnceLock;

use serde_json::Value;
use sqlx::{
    postgres::{PgPoolOptions, PgRow},
    AssertSqlSafe, Executor, PgPool, Row,
};

/// `GRAPH_NAME` in `src/lib/graph/client.ts`.
pub const GRAPH_NAME: &str = "knowledge_graph";

static POOL: OnceLock<PgPool> = OnceLock::new();

fn url() -> String {
    std::env::var("GRAPH_DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://graph:graphpass@localhost:5433/ers_knowledge".into())
}

/// The graph database pool. Every connection loads AGE and puts `ag_catalog`
/// on the search path, as `setupClient` does. Lazy: nothing connects until a
/// query runs.
///
/// # Errors
/// When `GRAPH_DATABASE_URL` does not parse.
pub fn pool() -> Result<&'static PgPool, sqlx::Error> {
    if let Some(p) = POOL.get() {
        return Ok(p);
    }
    let p = PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .after_connect(|conn, _| {
            Box::pin(async move {
                conn.execute("LOAD 'age'").await?;
                conn.execute("SET search_path = ag_catalog, \"$user\", public")
                    .await?;
                Ok(())
            })
        })
        .connect_lazy(&url())?;
    Ok(POOL.get_or_init(|| p))
}

/// A Cypher literal for an inlined parameter (`cypherWrite`): strings quoted
/// with `\` and `'` escaped, `null`, booleans and numbers as they print.
#[must_use]
pub fn literal(v: &Value) -> String {
    match v {
        Value::Null => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => crate::common::js::stringify(&Value::Number(n.clone())),
        Value::String(s) => format!("'{}'", s.replace('\\', "\\\\").replace('\'', "\\'")),
        other => format!(
            "'{}'",
            other.to_string().replace('\\', "\\\\").replace('\'', "\\'")
        ),
    }
}

/// Inline `$name` parameters as Cypher literals, longest names first so `$id`
/// never rewrites part of `$ids`. Every value is the platform's own (ids,
/// names read from the database), never request text.
fn inline(cql: &str, params: &[(&str, Value)]) -> String {
    let mut out = cql.to_string();
    let mut sorted: Vec<&(&str, Value)> = params.iter().collect();
    sorted.sort_by_key(|(k, _)| std::cmp::Reverse(k.len()));
    for (k, v) in sorted {
        if let Ok(re) = regex::Regex::new(&format!(r"\${}\b", regex::escape(k))) {
            let lit = literal(v);
            out = re.replace_all(&out, regex::NoExpand(&lit)).into_owned();
        }
    }
    out
}

/// `cypher(cql, params, aliases)`: each alias comes back as the text of its
/// `agtype` value — through `format('%s', …)`, which is the type's output
/// function (what node-pg reads); AGE 1.5 has no `::text` cast for a vertex. Node passes parameters as an `agtype` argument; sqlx types
/// its parameters, and AGE has no cast from `text`, so they are inlined here
/// the way `cypherWrite` inlines them.
///
/// # Errors
/// On a database or Cypher error.
pub async fn cypher(
    cql: &str,
    params: &[(&str, Value)],
    aliases: &[&str],
) -> Result<Vec<Vec<Option<String>>>, sqlx::Error> {
    let cols = if aliases.is_empty() {
        "result ag_catalog.agtype".to_string()
    } else {
        aliases
            .iter()
            .map(|a| format!("{a} ag_catalog.agtype"))
            .collect::<Vec<_>>()
            .join(", ")
    };
    let select = if aliases.is_empty() {
        "format('%s', result)".to_string()
    } else {
        aliases
            .iter()
            .map(|a| format!("format('%s', {a})"))
            .collect::<Vec<_>>()
            .join(", ")
    };
    let sql = format!(
        "SELECT {select} FROM ag_catalog.cypher('{GRAPH_NAME}', $$ {} $$) AS ({cols})",
        inline(cql, params)
    );
    let rows: Vec<PgRow> = sqlx::query(AssertSqlSafe(sql)).fetch_all(pool()?).await?;
    let n = aliases.len().max(1);
    Ok(rows
        .iter()
        .map(|r| {
            (0..n)
                .map(|i| r.try_get::<Option<String>, _>(i).ok().flatten())
                .collect()
        })
        .collect())
}

/// `cypherWrite`: parameters inlined as literals.
///
/// # Errors
/// On a database or Cypher error.
pub async fn cypher_write(cql: &str, params: &[(&str, Value)]) -> Result<(), sqlx::Error> {
    let sql = format!(
        "SELECT * FROM ag_catalog.cypher('{GRAPH_NAME}', $$ {} $$) AS (result ag_catalog.agtype)",
        inline(cql, params)
    );
    sqlx::query(AssertSqlSafe(sql)).execute(pool()?).await?;
    Ok(())
}

/// `initGraph`: the extension and the graph, idempotently.
///
/// # Errors
/// On a database error other than "already exists".
pub async fn init_graph() -> Result<(), sqlx::Error> {
    let pool = pool()?;
    sqlx::query("CREATE EXTENSION IF NOT EXISTS age")
        .execute(pool)
        .await?;
    match sqlx::query("SELECT ag_catalog.create_graph($1)")
        .bind(GRAPH_NAME)
        .execute(pool)
        .await
    {
        Ok(_) => tracing::info!("[graph] Created property graph: {GRAPH_NAME}"),
        Err(e) if e.to_string().contains("already exists") => {}
        Err(e) => return Err(e),
    }
    tracing::info!("[graph] Knowledge graph ready: {GRAPH_NAME}");
    Ok(())
}

/// A property of an `agtype` vertex (or map) in its text form:
/// `{"id": …, "label": …, "properties": {…}}::vertex`.
#[must_use]
pub fn prop(agtype: Option<&str>, key: &str) -> Option<Value> {
    let text = agtype?;
    let trimmed = text.trim_end_matches("::vertex").trim_end_matches("::edge");
    let v: Value = serde_json::from_str(trimmed).ok()?;
    v.get("properties")
        .and_then(|p| p.get(key))
        .or_else(|| v.get(key))
        .cloned()
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn literals_escape_like_node() {
        assert_eq!(literal(&json!("it's a \\ test")), r"'it\'s a \\ test'");
        assert_eq!(literal(&json!(null)), "null");
        assert_eq!(literal(&json!(true)), "true");
        assert_eq!(literal(&json!(3)), "3");
    }

    #[test]
    fn inlining() {
        let q = inline(
            "MATCH (t {id: $id, ids: $ids})",
            &[("id", json!("a'b")), ("ids", json!(2))],
        );
        assert_eq!(q, r"MATCH (t {id: 'a\'b', ids: 2})");
    }

    #[test]
    fn vertex_properties() {
        let v = r#"{"id": 844424930131969, "label": "Table", "properties": {"fqn": "ds.orders", "name": "orders"}}::vertex"#;
        assert_eq!(prop(Some(v), "fqn"), Some(json!("ds.orders")));
        assert_eq!(prop(Some(v), "label"), Some(json!("Table")));
        assert_eq!(prop(None, "x"), None);
    }
}
