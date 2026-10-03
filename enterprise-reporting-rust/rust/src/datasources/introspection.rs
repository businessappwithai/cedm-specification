//! `introspectSchema` for PostgreSQL (`src/lib/sql/schema-introspection.ts`):
//! the same catalogue queries, in the same order, producing the same JSON
//! (`SchemaInfo`). The information-schema domain types are cast to text so
//! they decode the way node-pg reads them.
use serde::Serialize;
use serde_json::Value;
use sqlx::{PgPool, Row};

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub name: String,
    #[serde(rename = "type")]
    pub data_type: String,
    pub nullable: bool,
    /// Always present (null when there is none), as in Node.
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ForeignKey {
    pub column: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Index {
    pub name: String,
    pub columns: Vec<String>,
    pub unique: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Table {
    pub name: String,
    pub schema: String,
    pub columns: Vec<Column>,
    pub primary_key: Vec<String>,
    pub foreign_keys: Vec<ForeignKey>,
    pub indexes: Vec<Index>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct View {
    pub name: String,
    pub schema: String,
    pub columns: Vec<Column>,
    pub definition: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Default)]
pub struct SchemaInfo {
    pub tables: Vec<Table>,
    pub views: Vec<View>,
}

async fn columns(pool: &PgPool, schema: &str, table: &str) -> Result<Vec<Column>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT column_name::text AS column_name, data_type::text AS data_type, is_nullable::text AS is_nullable, \
                column_default::text AS column_default, character_maximum_length::int AS character_maximum_length \
         FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position",
    )
    .bind(schema)
    .bind(table)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(|r| {
            let data_type: String = r.get("data_type");
            let len: Option<i32> = r.get("character_maximum_length");
            Column {
                name: r.get("column_name"),
                // JS: `len ? \`${type}(${len})\` : type` — 0 is falsy.
                data_type: match len {
                    Some(n) if n != 0 => format!("{data_type}({n})"),
                    _ => data_type,
                },
                nullable: r.get::<String, _>("is_nullable") == "YES",
                default_value: r.get("column_default"),
            }
        })
        .collect())
}

async fn primary_key(pool: &PgPool, schema: &str, table: &str) -> Result<Vec<String>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT a.attname::text FROM pg_index i \
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) \
         JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace \
         WHERE i.indisprimary AND n.nspname = $1 AND c.relname = $2",
    )
    .bind(schema)
    .bind(table)
    .fetch_all(pool)
    .await
}

async fn foreign_keys(pool: &PgPool, schema: &str, table: &str) -> Result<Vec<ForeignKey>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT kcu.column_name::text AS column_name, ccu.table_name::text AS referenced_table, \
                ccu.column_name::text AS referenced_column \
         FROM information_schema.table_constraints AS tc \
         JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name \
         JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name \
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2",
    )
    .bind(schema)
    .bind(table)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(|r| ForeignKey {
            column: r.get("column_name"),
            referenced_table: r.get("referenced_table"),
            referenced_column: r.get("referenced_column"),
        })
        .collect())
}

async fn indexes(pool: &PgPool, schema: &str, table: &str) -> Result<Vec<Index>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT i.relname::text AS index_name, ix.indisunique AS is_unique, \
                array_agg(a.attname::text ORDER BY array_position(ix.indkey, a.attnum)) AS columns \
         FROM pg_index ix JOIN pg_class t ON t.oid = ix.indrelid JOIN pg_class i ON i.oid = ix.indexrelid \
         JOIN pg_namespace n ON n.oid = t.relnamespace \
         JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) \
         WHERE n.nspname = $1 AND t.relname = $2 AND NOT ix.indisprimary \
         GROUP BY i.relname, ix.indisunique",
    )
    .bind(schema)
    .bind(table)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(|r| Index {
            name: r.get("index_name"),
            columns: r.get("columns"),
            unique: r.get("is_unique"),
        })
        .collect())
}

/// # Errors
/// On a database error.
pub async fn introspect_postgres(pool: &PgPool) -> Result<SchemaInfo, sqlx::Error> {
    let tables: Vec<(String, String)> = sqlx::query_as(
        "SELECT table_name::text, table_schema::text FROM information_schema.tables \
         WHERE table_schema NOT IN ('information_schema', 'pg_catalog') AND table_type = 'BASE TABLE' ORDER BY table_name",
    )
    .fetch_all(pool)
    .await?;
    let views: Vec<(String, String, Option<String>)> = sqlx::query_as(
        "SELECT table_name::text, table_schema::text, view_definition::text FROM information_schema.views \
         WHERE table_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY table_name",
    )
    .fetch_all(pool)
    .await?;

    let mut out = SchemaInfo::default();
    for (name, schema) in tables {
        out.tables.push(Table {
            columns: columns(pool, &schema, &name).await?,
            primary_key: primary_key(pool, &schema, &name).await?,
            foreign_keys: foreign_keys(pool, &schema, &name).await?,
            indexes: indexes(pool, &schema, &name).await?,
            name,
            schema,
        });
    }
    for (name, schema, definition) in views {
        out.views.push(View {
            columns: columns(pool, &schema, &name).await?,
            name,
            schema,
            definition,
        });
    }
    Ok(out)
}

/// The JSON a `TableInfo` serialises to, for `schema_metadata` columns.
#[must_use]
pub fn to_value<T: Serialize>(v: &T) -> Value {
    serde_json::to_value(v).unwrap_or(Value::Null)
}
