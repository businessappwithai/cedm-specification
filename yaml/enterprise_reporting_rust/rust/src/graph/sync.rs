//! `syncKnowledgeGraph` (`src/lib/graph/sync.ts`) and the `LLMKnowledge`
//! import of `scripts/sync-knowledge-graph.ts`: MERGE every active data
//! source, its introspected tables, columns and foreign keys, and the
//! reports, charts and dashboards, into the graph. Idempotent.
//!
//! One deliberate difference (MIGRATION_PLAN.md §9, D-38): a column's
//! `is_pk` comes from the table's primary key. Node's PostgreSQL
//! introspection never sets `isPrimaryKey`, so every PostgreSQL column was
//! written with `is_pk = false`.
use serde_json::json;
use sqlx::{PgPool, Row};

use super::cypher_write;
use crate::datasources::{get_connection, introspection::introspect_postgres, DataSourceRow, UserDb};

async fn sync_data_source(ds: &DataSourceRow, description: &str) -> Result<(), sqlx::Error> {
    cypher_write(
        "MERGE (n:DataSource {id: $id}) SET n.name = $name, n.client_type = $client_type, n.description = $description",
        &[
            ("id", json!(ds.id)),
            ("name", json!(ds.name)),
            ("client_type", json!(ds.client_type)),
            ("description", json!(description)),
        ],
    )
    .await?;
    let Ok(UserDb::Pg(user)) = get_connection(ds).await else {
        return Ok(()); // unreachable or not PostgreSQL: skipped, as in Node
    };
    let schema = match introspect_postgres(&user).await {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(ds = %ds.id, error = %e, "[graph-sync] Schema introspection failed");
            return Ok(());
        }
    };
    for table in &schema.tables {
        let table_fqn = format!("{}.{}", ds.id, table.name);
        cypher_write(
            "MERGE (t:Table {fqn: $fqn}) SET t.ds_id = $ds_id, t.name = $name, t.schema_name = $schema_name",
            &[
                ("fqn", json!(table_fqn)),
                ("ds_id", json!(ds.id)),
                ("name", json!(table.name)),
                ("schema_name", json!(table.schema)),
            ],
        )
        .await?;
        cypher_write(
            "MATCH (ds:DataSource {id: $ds_id}), (t:Table {fqn: $fqn}) MERGE (ds)-[:HAS_TABLE]->(t)",
            &[("ds_id", json!(ds.id)), ("fqn", json!(table_fqn))],
        )
        .await?;
        for col in &table.columns {
            let col_fqn = format!("{table_fqn}.{}", col.name);
            cypher_write(
                "MERGE (c:Column {fqn: $fqn}) SET c.ds_id = $ds_id, c.table_name = $table_name, c.name = $name, \
                 c.data_type = $data_type, c.nullable = $nullable, c.is_pk = $is_pk",
                &[
                    ("fqn", json!(col_fqn)),
                    ("ds_id", json!(ds.id)),
                    ("table_name", json!(table.name)),
                    ("name", json!(col.name)),
                    ("data_type", json!(col.data_type)),
                    ("nullable", json!(col.nullable)),
                    ("is_pk", json!(table.primary_key.contains(&col.name))),
                ],
            )
            .await?;
            cypher_write(
                "MATCH (t:Table {fqn: $table_fqn}), (c:Column {fqn: $col_fqn}) MERGE (t)-[:HAS_COLUMN]->(c)",
                &[("table_fqn", json!(table_fqn)), ("col_fqn", json!(col_fqn))],
            )
            .await?;
        }
        for fk in &table.foreign_keys {
            cypher_write(
                "MATCH (a:Column {fqn: $from}), (b:Column {fqn: $to}) MERGE (a)-[:FK_REFERENCES]->(b)",
                &[
                    ("from", json!(format!("{table_fqn}.{}", fk.column))),
                    (
                        "to",
                        json!(format!(
                            "{}.{}.{}",
                            ds.id, fk.referenced_table, fk.referenced_column
                        )),
                    ),
                ],
            )
            .await?;
        }
    }
    Ok(())
}

async fn sync_built_on(
    pool: &PgPool,
    table: &'static str,
    label: &'static str,
    with_type: bool,
) -> Result<(), sqlx::Error> {
    let chart_type = if with_type {
        ", d.chart_type"
    } else {
        ", NULL::text AS chart_type"
    };
    let rows = sqlx::query(sqlx::AssertSqlSafe(format!(
        "SELECT d.id, d.name, d.description{chart_type}, q.data_source_id FROM {table} d \
         LEFT JOIN saved_queries q ON q.id = d.saved_query_id WHERE d.is_deleted = false"
    )))
    .fetch_all(pool)
    .await?;
    for r in rows {
        let id: String = r.get("id");
        let ds: Option<String> = r.get("data_source_id");
        let mut params = vec![
            ("id", json!(id)),
            ("name", json!(r.get::<String, _>("name"))),
            (
                "description",
                json!(r.get::<Option<String>, _>("description").unwrap_or_default()),
            ),
            ("ds_id", json!(ds.clone().unwrap_or_default())),
        ];
        let set = if with_type {
            params.push(("chart_type", json!(r.get::<Option<String>, _>("chart_type"))));
            "SET n.name = $name, n.description = $description, n.chart_type = $chart_type, n.ds_id = $ds_id"
        } else {
            "SET n.name = $name, n.description = $description, n.ds_id = $ds_id"
        };
        cypher_write(&format!("MERGE (n:{label} {{id: $id}}) {set}"), &params).await?;
        if let Some(ds) = ds.filter(|d| !d.is_empty()) {
            let alias = if with_type { "ch" } else { "r" };
            cypher_write(
                &format!("MATCH (ds:DataSource {{id: $ds_id}}), ({alias}:{label} {{id: $id}}) MERGE ({alias})-[:BUILT_ON]->(ds)"),
                &[("ds_id", json!(ds)), ("id", json!(id))],
            )
            .await?;
        }
    }
    Ok(())
}

/// `syncKnowledgeGraph()`. Returns how many data sources it synced.
///
/// # Errors
/// On a config-database or graph error.
pub async fn sync_knowledge_graph(pool: &PgPool) -> Result<usize, sqlx::Error> {
    tracing::info!("[graph-sync] Starting knowledge graph sync");
    let rows = sqlx::query(
        "SELECT id, name, client_type, connection_config, description FROM data_sources \
         WHERE is_active = true AND is_deleted = false",
    )
    .fetch_all(pool)
    .await?;
    for r in &rows {
        let ds = DataSourceRow {
            id: r.get("id"),
            name: r.get("name"),
            client_type: r.get("client_type"),
            connection_config: r.get("connection_config"),
        };
        let description: Option<String> = r.get("description");
        sync_data_source(&ds, description.as_deref().unwrap_or_default()).await?;
    }
    sync_built_on(pool, "report_definitions", "Report", false).await?;
    sync_built_on(pool, "chart_definitions", "Chart", true).await?;
    let dashboards =
        sqlx::query("SELECT id, name, description FROM dashboard_layouts WHERE is_deleted = false")
            .fetch_all(pool)
            .await?;
    for d in dashboards {
        cypher_write(
            "MERGE (n:Dashboard {id: $id}) SET n.name = $name, n.description = $description",
            &[
                ("id", json!(d.get::<String, _>("id"))),
                ("name", json!(d.get::<String, _>("name"))),
                (
                    "description",
                    json!(d.get::<Option<String>, _>("description").unwrap_or_default()),
                ),
            ],
        )
        .await?;
    }
    tracing::info!("[graph-sync] Done — synced {} data source(s).", rows.len());
    Ok(rows.len())
}

/// The sections of `llmtext/llms-full.txt` as `importLLMText` cuts them: one
/// per `#`–`###` heading, bodies over 20 characters, each capped at 3000.
#[must_use]
pub fn llmtext_sections(content: &str) -> Vec<(String, String, String)> {
    let re = regex::Regex::new(r"(?m)^#{1,3}\s+(.+)$").expect("static pattern");
    let mut out = Vec::new();
    let mut last_title: Option<String> = None;
    let mut last_index = 0usize;
    let cap = |s: &str| -> String { s.encode_utf16().take(3000).collect::<Vec<u16>>().pipe_string() };
    for m in re.captures_iter(content) {
        let whole = m.get(0).expect("group 0");
        if let Some(title) = &last_title {
            if whole.start() > last_index {
                let body = content[last_index..whole.start()].trim();
                if body.encode_utf16().count() > 20 {
                    out.push((format!("s{}", out.len()), title.clone(), cap(body)));
                }
            }
        }
        last_title = Some(m[1].trim().to_string());
        last_index = whole.end();
    }
    if let Some(title) = last_title {
        let body = content[last_index..].trim();
        if body.encode_utf16().count() > 20 {
            out.push((format!("s{}", out.len()), title, cap(body)));
        }
    }
    if out.is_empty() {
        let body: String = content
            .encode_utf16()
            .take(4000)
            .collect::<Vec<u16>>()
            .pipe_string();
        out.push((
            "full".into(),
            "Enterprise Reporting Platform — Full LLM Text".into(),
            body,
        ));
    }
    out
}

trait PipeString {
    fn pipe_string(self) -> String;
}

impl PipeString for Vec<u16> {
    fn pipe_string(self) -> String {
        String::from_utf16_lossy(&self)
    }
}

/// `importLLMText`: `LLMKnowledge` nodes from the file, if it exists.
///
/// # Errors
/// On a graph error.
pub async fn import_llmtext(path: &std::path::Path) -> Result<usize, sqlx::Error> {
    let Ok(content) = tokio::fs::read_to_string(path).await else {
        tracing::warn!("[llmtext] llmtext file not found, skipping");
        return Ok(0);
    };
    let sections = llmtext_sections(&content);
    for (id, title, body) in &sections {
        cypher_write(
            "MERGE (n:LLMKnowledge {section_id: $id}) SET n.title = $title, n.body = $body, n.source = 'llmtext'",
            &[("id", json!(id)), ("title", json!(title)), ("body", json!(body))],
        )
        .await?;
    }
    Ok(sections.len())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sections() {
        let text = "# One\nshort\n## Two\nthis body is long enough to keep\n### Three\nand so is this final one here";
        let s = llmtext_sections(text);
        assert_eq!(s.len(), 2);
        assert_eq!(s[0].0, "s0");
        assert_eq!(s[0].1, "Two");
        assert_eq!(s[1].1, "Three");
        assert_eq!(s[1].2, "and so is this final one here");
    }
}
