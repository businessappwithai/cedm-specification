//! `getGraphContext` / `formatGraphContext` (`src/lib/graph/rag.ts`): the
//! tables, columns and foreign-key neighbours a question most likely needs,
//! found by keyword in the knowledge graph, plus matching `LLMKnowledge`
//! documents.
use serde_json::{json, Value};

use super::{cypher, prop};

#[derive(Debug, Clone, Default)]
pub struct ColumnContext {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub is_pk: bool,
    pub is_fk: bool,
}

#[derive(Debug, Clone, Default)]
pub struct TableContext {
    pub table_name: String,
    pub schema_name: String,
    pub columns: Vec<ColumnContext>,
    pub related_tables: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct GraphContext {
    pub tables: Vec<TableContext>,
    pub llm_knowledge: Vec<(String, String)>,
    pub total_token_estimate: usize,
}

fn text(v: Option<Value>) -> String {
    v.and_then(|x| x.as_str().map(str::to_string)).unwrap_or_default()
}

fn flag(v: Option<Value>) -> bool {
    matches!(v, Some(Value::Bool(true))) || v.as_ref().and_then(Value::as_str) == Some("true")
}

/// A token as a Cypher string literal body, `'` escaped as Node escapes it.
fn quoted(t: &str) -> String {
    t.replace('\'', "\\'")
}

async fn relevant_tables(ds: &str, tokens: &[String]) -> Result<Vec<String>, sqlx::Error> {
    if tokens.is_empty() {
        return Ok(Vec::new());
    }
    let conditions = tokens
        .iter()
        .map(|t| format!("toLower(t.name) CONTAINS toLower('{}')", quoted(t)))
        .collect::<Vec<_>>()
        .join(" OR ");
    let rows = cypher(
        &format!("MATCH (ds:DataSource {{id: $ds_id}})-[:HAS_TABLE]->(t:Table) WHERE {conditions} RETURN t"),
        &[("ds_id", json!(ds))],
        &["t"],
    )
    .await?;
    Ok(rows.iter().map(|r| text(prop(r[0].as_deref(), "fqn"))).collect())
}

async fn expand_fk(fqns: &[String]) -> Result<Vec<String>, sqlx::Error> {
    if fqns.is_empty() {
        return Ok(Vec::new());
    }
    let list = fqns
        .iter()
        .map(|f| format!("'{}'", quoted(f)))
        .collect::<Vec<_>>()
        .join(", ");
    let rows = cypher(
        &format!(
            "MATCH (t:Table)-[:HAS_COLUMN]->(:Column)-[:FK_REFERENCES]->(c2:Column)<-[:HAS_COLUMN]-(t2:Table) \
             WHERE t.fqn IN [{list}] RETURN DISTINCT t2"
        ),
        &[],
        &["t2"],
    )
    .await?;
    let mut out: Vec<String> = fqns.to_vec();
    for r in &rows {
        let f = text(prop(r[0].as_deref(), "fqn"));
        if !f.is_empty() && !out.contains(&f) {
            out.push(f);
        }
    }
    Ok(out)
}

async fn load_tables(fqns: &[String]) -> Result<Vec<TableContext>, sqlx::Error> {
    if fqns.is_empty() {
        return Ok(Vec::new());
    }
    let list = fqns
        .iter()
        .map(|f| format!("'{}'", quoted(f)))
        .collect::<Vec<_>>()
        .join(", ");
    let rows = cypher(
        &format!("MATCH (t:Table)-[:HAS_COLUMN]->(c:Column) WHERE t.fqn IN [{list}] RETURN t, c"),
        &[],
        &["t", "c"],
    )
    .await?;
    let mut order: Vec<String> = Vec::new();
    let mut by: std::collections::HashMap<String, (TableContext, Vec<String>)> =
        std::collections::HashMap::new();
    for r in &rows {
        let t = r[0].as_deref();
        let c = r.get(1).and_then(|x| x.as_deref());
        let fqn = text(prop(t, "fqn"));
        let entry = by.entry(fqn.clone()).or_insert_with(|| {
            order.push(fqn.clone());
            let schema = text(prop(t, "schema_name"));
            (
                TableContext {
                    table_name: text(prop(t, "name")),
                    schema_name: if schema.is_empty() {
                        "public".into()
                    } else {
                        schema
                    },
                    ..TableContext::default()
                },
                Vec::new(),
            )
        });
        let col = text(prop(c, "name"));
        if !col.is_empty() && !entry.1.contains(&col) {
            entry.1.push(col.clone());
            entry.0.columns.push(ColumnContext {
                name: col,
                data_type: text(prop(c, "data_type")),
                nullable: flag(prop(c, "nullable")),
                is_pk: flag(prop(c, "is_pk")),
                is_fk: flag(prop(c, "is_fk")),
            });
        }
    }
    let mut out = Vec::new();
    for fqn in order {
        let Some((mut ctx, _)) = by.remove(&fqn) else {
            continue;
        };
        let fk = cypher(
            "MATCH (t:Table {fqn: $fqn})-[:HAS_COLUMN]->(:Column)-[:FK_REFERENCES]->(:Column)<-[:HAS_COLUMN]-(t2:Table) \
             RETURN DISTINCT t2",
            &[("fqn", json!(fqn))],
            &["t2"],
        )
        .await?;
        ctx.related_tables = fk
            .iter()
            .map(|r| text(prop(r[0].as_deref(), "name")))
            .filter(|n| !n.is_empty())
            .collect();
        out.push(ctx);
    }
    Ok(out)
}

async fn llm_knowledge(tokens: &[String], max_docs: usize) -> Vec<(String, String)> {
    if tokens.is_empty() {
        return Vec::new();
    }
    let conditions = tokens
        .iter()
        .map(|t| {
            let q = quoted(t);
            format!("toLower(n.title) CONTAINS toLower('{q}') OR toLower(n.body) CONTAINS toLower('{q}')")
        })
        .collect::<Vec<_>>()
        .join(" OR ");
    let Ok(rows) = cypher(
        &format!("MATCH (n:LLMKnowledge) WHERE {conditions} RETURN n"),
        &[],
        &["n"],
    )
    .await
    else {
        return Vec::new();
    };
    rows.iter()
        .take(max_docs)
        .map(|r| {
            let n = r[0].as_deref();
            let body: String = text(prop(n, "body")).chars().take(800).collect();
            (text(prop(n, "title")), body)
        })
        .filter(|(t, _)| !t.is_empty())
        .collect()
}

/// The question's search tokens: lower-cased, split on anything but
/// `[a-z0-9_]`, three characters or more, at most twenty.
#[must_use]
pub fn tokens(question: &str) -> Vec<String> {
    question
        .to_lowercase()
        .split(|c: char| !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_'))
        .filter(|t| t.chars().count() >= 3)
        .take(20)
        .map(str::to_string)
        .collect()
}

/// `getGraphContext(dsId, question, maxTables = 8)`.
///
/// # Errors
/// On a graph database error (callers treat it as "no context").
pub async fn get_graph_context(
    ds: &str,
    question: &str,
    max_tables: usize,
) -> Result<GraphContext, sqlx::Error> {
    let toks = tokens(question);
    let (matched, docs) = tokio::join!(relevant_tables(ds, &toks), llm_knowledge(&toks, 3));
    let matched = matched?;
    let first: Vec<String> = matched.into_iter().take(max_tables).collect();
    let expanded = expand_fk(&first).await?;
    let capped: Vec<String> = expanded.into_iter().take(max_tables).collect();
    let tables = load_tables(&capped).await?;
    let total = tables.iter().map(|t| 30 + t.columns.len() * 15).sum::<usize>()
        + docs.iter().map(|(_, b)| b.len().div_ceil(4)).sum::<usize>();
    Ok(GraphContext {
        tables,
        llm_knowledge: docs,
        total_token_estimate: total,
    })
}

/// `formatGraphContext`.
#[must_use]
pub fn format_graph_context(ctx: &GraphContext) -> String {
    let mut lines: Vec<String> = Vec::new();
    if !ctx.tables.is_empty() {
        lines.push("-- Relevant schema from knowledge graph --".into());
        for t in &ctx.tables {
            let cols = t
                .columns
                .iter()
                .map(|c| {
                    let flags = [c.is_pk.then_some("PK"), c.is_fk.then_some("FK")]
                        .into_iter()
                        .flatten()
                        .collect::<Vec<_>>()
                        .join(",");
                    format!(
                        "  {} {}{}{}",
                        c.name,
                        c.data_type,
                        if flags.is_empty() {
                            String::new()
                        } else {
                            format!(" [{flags}]")
                        },
                        if c.nullable { "" } else { " NOT NULL" }
                    )
                })
                .collect::<Vec<_>>()
                .join("\n");
            lines.push(format!("TABLE {}.{}:\n{cols}", t.schema_name, t.table_name));
            if !t.related_tables.is_empty() {
                lines.push(format!("  -- joins: {}", t.related_tables.join(", ")));
            }
        }
    }
    if !ctx.llm_knowledge.is_empty() {
        lines.push("\n-- Relevant documentation --".into());
        for (title, body) in &ctx.llm_knowledge {
            lines.push(format!("[{title}]\n{body}"));
        }
    }
    lines.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenises_like_node() {
        assert_eq!(
            tokens("Total Revenue by customer_id, in Q1!"),
            vec!["total", "revenue", "customer_id"]
        );
    }

    #[test]
    fn formats() {
        let ctx = GraphContext {
            tables: vec![TableContext {
                table_name: "orders".into(),
                schema_name: "public".into(),
                columns: vec![ColumnContext {
                    name: "id".into(),
                    data_type: "integer".into(),
                    nullable: false,
                    is_pk: true,
                    is_fk: false,
                }],
                related_tables: vec!["customers".into()],
            }],
            llm_knowledge: vec![("Doc".into(), "Body".into())],
            total_token_estimate: 0,
        };
        assert_eq!(
            format_graph_context(&ctx),
            "-- Relevant schema from knowledge graph --\nTABLE public.orders:\n  id integer [PK] NOT NULL\n  -- joins: customers\n\n-- Relevant documentation --\n[Doc]\nBody"
        );
    }
}
