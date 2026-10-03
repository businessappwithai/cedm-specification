//! `sync_knowledge_graph [llmtext:<path>]` — `scripts/sync-knowledge-graph.ts`:
//! bootstrap the Apache AGE graph, sync every data source's schema and the
//! report/chart/dashboard metadata into it, import `llmtext/llms-full.txt` as
//! `LLMKnowledge` nodes, and print the node counts.
use loco_rs::prelude::*;

use crate::{
    common::db::pool,
    graph::{cypher, init_graph, sync},
};

pub struct SyncKnowledgeGraph;

#[async_trait]
impl Task for SyncKnowledgeGraph {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "sync_knowledge_graph".to_string(),
            detail: "Bootstrap the AGE knowledge graph, sync schema + config metadata, import llmtext \
                     (sync_knowledge_graph [llmtext:../llmtext/llms-full.txt])"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        init_graph()
            .await
            .map_err(|e| Error::string(&format!("Graph init failed: {e}")))?;
        println!("[✓] Graph initialized");
        match sync::sync_knowledge_graph(pool(ctx)).await {
            Ok(n) => println!("[✓] Schema + config synced ({n} data source(s))"),
            Err(e) => println!("[✗] Schema sync failed: {e}"),
        }
        let path = vars
            .cli_arg("llmtext")
            .map_or_else(|_| "../llmtext/llms-full.txt".to_string(), ToString::to_string);
        match sync::import_llmtext(std::path::Path::new(&path)).await {
            Ok(n) => println!("[✓] LLMText imported ({n} section(s))"),
            Err(e) => println!("[✗] LLMText import failed: {e}"),
        }
        for label in ["DataSource", "Table", "Column", "LLMKnowledge"] {
            let rows = cypher(&format!("MATCH (n:{label}) RETURN count(n) AS c"), &[], &["c"])
                .await
                .unwrap_or_default();
            let count = rows
                .first()
                .and_then(|r| r[0].clone())
                .unwrap_or_else(|| "0".into());
            println!("  {label:<13}: {count}");
        }
        Ok(())
    }
}
