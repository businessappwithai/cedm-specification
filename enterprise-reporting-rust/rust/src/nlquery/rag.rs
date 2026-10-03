//! `src/lib/mastra/rag-store.ts`: embeddings of past NL queries and of the
//! schema, in pgvector tables of the **user's** database
//! (`nl_query_embeddings`, `nl_schema_embeddings`).
//!
//! These statements are the platform's own, parameterised SQL — not user
//! SQL — so they run on the pool directly rather than in the read-only
//! transaction user SQL gets. Every failure is swallowed, as in Node: a
//! database without pgvector simply has no RAG context.
use std::sync::atomic::{AtomicU8, Ordering};

use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};

use super::ai;
use crate::monitoring::js::number_to_string;

const DIM: usize = 384;

/// `_embeddingAvailable`: 0 unknown, 1 yes, 2 no. Once the embedding server
/// has failed, Node never asks it again for the life of the process.
static EMBEDDING: AtomicU8 = AtomicU8::new(0);

fn js_space(c: char) -> bool {
    c.is_whitespace() || c == '\u{feff}'
}

/// `(h << 5) - h + code | 0` over UTF-16 code units.
fn hash(unit: &[u16]) -> i32 {
    let mut h: i32 = 0;
    for &c in unit {
        let v = i64::from(h.wrapping_shl(5)) - i64::from(h) + i64::from(c);
        #[allow(clippy::cast_possible_truncation)]
        {
            h = v as i32;
        }
    }
    h
}

/// `hashEmbed`: word, 2- and 3-gram tokens into a `Float32Array`, then
/// normalised in double precision — exactly as Node computes it.
#[must_use]
pub fn hash_embed(text: &str) -> Vec<f64> {
    let mut v = [0.0_f32; DIM];
    let lower = text.to_lowercase();
    let normalized = lower.trim_matches(js_space);
    let words: Vec<&str> = if normalized.is_empty() {
        vec![""]
    } else {
        normalized.split(js_space).filter(|w| !w.is_empty()).collect()
    };
    let mut seen = std::collections::HashSet::new();
    let mut tokens: Vec<Vec<u16>> = Vec::new();
    for w in words {
        let u: Vec<u16> = w.encode_utf16().collect();
        let mut add = |t: Vec<u16>| {
            if seen.insert(t.clone()) {
                tokens.push(t);
            }
        };
        add(u.clone());
        for i in 0..u.len().saturating_sub(1) {
            add(u[i..i + 2].to_vec());
        }
        for i in 0..u.len().saturating_sub(2) {
            add(u[i..i + 3].to_vec());
        }
    }
    for t in tokens {
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let idx = i64::from(hash(&t)).rem_euclid(DIM as i64) as usize;
        v[idx] += 0.2;
        v[(idx + 1) % DIM] += 0.1;
        v[(idx + 2) % DIM] += 0.05;
    }
    let mut mag = 0.0_f64;
    for x in &v {
        mag += f64::from(*x) * f64::from(*x);
    }
    let mag = if mag.sqrt() == 0.0 { 1.0 } else { mag.sqrt() };
    v.iter().map(|x| f64::from(*x) / mag).collect()
}

/// `generateEmbedding`: the embedding server when it is available (padded or
/// truncated to 384), else the hash embedding.
pub async fn embedding(text: &str) -> Vec<f64> {
    if EMBEDDING.load(Ordering::Relaxed) != 2 {
        match ai::embed(text).await {
            Some(mut v) => {
                EMBEDDING.store(1, Ordering::Relaxed);
                v.resize(DIM, 0.0);
                return v;
            }
            None => EMBEDDING.store(2, Ordering::Relaxed),
        }
    }
    hash_embed(text)
}

#[must_use]
pub fn embedding_kind() -> &'static str {
    if EMBEDDING.load(Ordering::Relaxed) == 1 {
        "llama.cpp"
    } else {
        "hash-fallback"
    }
}

/// `[${embedding.join(",")}]`, numbers as JavaScript prints them.
fn literal(v: &[f64]) -> String {
    let parts: Vec<String> = v.iter().map(|x| number_to_string(*x)).collect();
    format!("[{}]", parts.join(","))
}

/// `queryHash`: a 64-bit polynomial hash of the normalised text, in hex.
#[must_use]
pub fn query_hash(text: &str) -> String {
    let lower = text.to_lowercase();
    let collapsed: Vec<&str> = lower.split(js_space).filter(|w| !w.is_empty()).collect();
    let n = collapsed.join(" ");
    let mut h: u64 = 0;
    for c in n.encode_utf16() {
        h = h.wrapping_mul(31).wrapping_add(u64::from(c));
    }
    format!("{h:x}")
}

fn num(v: f64) -> Value {
    serde_json::from_str(&number_to_string(v)).unwrap_or(Value::Null)
}

/// `findSimilarQueries`: successful past queries by cosine similarity (> 0.3).
pub async fn similar_queries(pool: &PgPool, ds: &str, text: &str, limit: i64) -> Vec<Value> {
    let lit = literal(&embedding(text).await);
    let rows = sqlx::query(
        "SELECT natural_language_query, generated_sql, explanation, 1 - (embedding <=> $2::vector) AS similarity \
         FROM nl_query_embeddings WHERE data_source_id = $1 AND success = true \
         ORDER BY embedding <=> $2::vector LIMIT $3",
    )
    .bind(ds)
    .bind(&lit)
    .bind(limit)
    .fetch_all(pool)
    .await;
    let Ok(rows) = rows else { return Vec::new() };
    rows.iter()
        .filter_map(|r| {
            let s: f64 = r.try_get("similarity").ok()?;
            (s > 0.3).then(|| {
                json!({
                    "naturalLanguageQuery": r.try_get::<String, _>("natural_language_query").ok(),
                    "generatedSql": r.try_get::<String, _>("generated_sql").ok(),
                    "explanation": r.try_get::<Option<String>, _>("explanation").ok().flatten(),
                    "similarity": num(s),
                })
            })
        })
        .collect()
}

fn sample(raw: Option<String>) -> Value {
    raw.and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(Value::Null)
}

/// `findRelevantSchema`: schema entries by cosine similarity (> 0.2).
pub async fn relevant_schema(pool: &PgPool, ds: &str, text: &str, limit: i64) -> Vec<Value> {
    let lit = literal(&embedding(text).await);
    let rows = sqlx::query(
        "SELECT table_name, schema_text, sample_data::text AS sample_data, 1 - (embedding <=> $2::vector) AS similarity \
         FROM nl_schema_embeddings WHERE data_source_id = $1 ORDER BY embedding <=> $2::vector LIMIT $3",
    )
    .bind(ds)
    .bind(&lit)
    .bind(limit)
    .fetch_all(pool)
    .await;
    let Ok(rows) = rows else { return Vec::new() };
    rows.iter()
        .filter_map(|r| {
            let s: f64 = r.try_get("similarity").ok()?;
            (s > 0.2).then(|| {
                json!({
                    "tableName": r.try_get::<String, _>("table_name").ok(),
                    "schemaText": r.try_get::<String, _>("schema_text").ok(),
                    "sampleData": sample(r.try_get("sample_data").ok().flatten()),
                    "similarity": num(s),
                })
            })
        })
        .collect()
}

/// `keywordMatchTables`: `bus_` tables whose name words prefix-match the query.
pub async fn keyword_tables(pool: &PgPool, ds: &str, words: &[String], found: &[String]) -> Vec<Value> {
    let Ok(rows) = sqlx::query(
        "SELECT table_name, schema_text, sample_data::text AS sample_data FROM nl_schema_embeddings \
         WHERE data_source_id = $1 AND table_name LIKE 'bus_%'",
    )
    .bind(ds)
    .fetch_all(pool)
    .await
    else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for r in &rows {
        let name: String = r.try_get("table_name").unwrap_or_default();
        if found.contains(&name) {
            continue;
        }
        let stem = name.replacen("bus_", "", 1).replace('_', " ");
        let hit = words.iter().any(|q| {
            stem.split(' ')
                .any(|t| t.starts_with(q.as_str()) || q.starts_with(t))
        });
        if hit {
            out.push(json!({
                "tableName": name,
                "schemaText": r.try_get::<String, _>("schema_text").ok(),
                "sampleData": sample(r.try_get("sample_data").ok().flatten()),
                "similarity": 0.5,
            }));
        }
    }
    out.truncate(5);
    out
}

/// `storeQueryEmbedding`: insert, or refresh the row for the same normalised text.
pub async fn store_query(
    pool: &PgPool,
    ds: &str,
    question: &str,
    sql: &str,
    row_count: Option<i64>,
    execution_ms: Option<i64>,
) {
    let h = query_hash(question);
    let lit = literal(&embedding(question).await);
    let run = async {
        let existing: Option<String> = sqlx::query_scalar(
            "SELECT id::text FROM nl_query_embeddings WHERE data_source_id = $1 AND query_hash = $2 LIMIT 1",
        )
        .bind(ds)
        .bind(&h)
        .fetch_optional(pool)
        .await?;
        match existing {
            Some(id) => {
                sqlx::query(
                    "UPDATE nl_query_embeddings SET generated_sql = $2, embedding = $3::vector, row_count = $4, \
                     execution_time_ms = $5, success = true WHERE id = $1::uuid",
                )
                .bind(id)
                .bind(sql)
                .bind(&lit)
                .bind(row_count)
                .bind(execution_ms)
                .execute(pool)
                .await?;
            }
            None => {
                sqlx::query(
                    "INSERT INTO nl_query_embeddings (data_source_id, natural_language_query, generated_sql, explanation, \
                       query_hash, embedding, row_count, execution_time_ms, success) \
                     VALUES ($1, $2, $3, NULL, $4, $5::vector, $6, $7, true)",
                )
                .bind(ds)
                .bind(question)
                .bind(sql)
                .bind(&h)
                .bind(&lit)
                .bind(row_count)
                .bind(execution_ms)
                .execute(pool)
                .await?;
            }
        }
        Ok::<_, sqlx::Error>(())
    };
    if let Err(e) = run.await {
        tracing::warn!(error = %e, "[RAG] storeQueryEmbedding failed");
    }
}

/// `storeSchemaEmbeddings`: one upserted row per table, with up to five
/// sample rows.
pub async fn store_schema(
    pool: &PgPool,
    ds: &str,
    tables: &[(String, Vec<(String, String)>)],
    samples: &Map<String, Value>,
) {
    for (name, cols) in tables {
        let defs: Vec<String> = cols.iter().map(|(c, t)| format!("{c} ({t})")).collect();
        let schema_text = format!("TABLE {name}: {}", defs.join(", "));
        let rows: Vec<Value> = samples
            .get(name)
            .and_then(Value::as_array)
            .map(|a| a.iter().take(5).cloned().collect())
            .unwrap_or_default();
        let sample_json = crate::common::js::stringify(&Value::Array(rows.clone()));
        let context = if rows.is_empty() {
            schema_text.clone()
        } else {
            format!("{schema_text}\nSAMPLE DATA:\n{sample_json}")
        };
        let lit = literal(&embedding(&context).await);
        let r = sqlx::query(
            "INSERT INTO nl_schema_embeddings (data_source_id, table_name, schema_text, sample_data, embedding) \
             VALUES ($1, $2, $3, $4::jsonb, $5::vector) ON CONFLICT (data_source_id, table_name) DO UPDATE SET \
             schema_text = EXCLUDED.schema_text, sample_data = EXCLUDED.sample_data, embedding = EXCLUDED.embedding, updated_at = NOW()",
        )
        .bind(ds)
        .bind(name)
        .bind(&schema_text)
        .bind(&sample_json)
        .bind(&lit)
        .execute(pool)
        .await;
        if let Err(e) = r {
            tracing::warn!(error = %e, table = %name, "[RAG] storeSchemaEmbeddings failed");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_and_normalises() {
        let v = hash_embed("Total sales by region");
        assert_eq!(v.len(), DIM);
        assert!((v.iter().map(|x| x * x).sum::<f64>() - 1.0).abs() < 1e-6);
        assert_eq!(query_hash("  Hello   World "), query_hash("hello world"));
    }
}
