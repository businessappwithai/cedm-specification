//! `SyncService.syncDataSource` (`src/lib/metadata/sync-service.ts`): write
//! an introspected schema into `metadata_entity_header` / `_field`, in one
//! transaction, and audit it.
use serde::Serialize;
use serde_json::json;
use sqlx::{Acquire, PgPool, Postgres, Row, Transaction};

use crate::{
    common::{js, time::now_iso},
    datasources::introspection::{to_value, SchemaInfo, Table},
};

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub entities_created: u32,
    pub entities_updated: u32,
    pub fields_created: u32,
    pub fields_updated: u32,
    pub errors: Vec<String>,
}

fn schema_metadata(t: &Table) -> String {
    js::stringify(&json!({
        "tableName": t.name,
        "schema": t.schema,
        "entityType": "table",
        "primaryKey": t.primary_key,
        "foreignKeys": to_value(&t.foreign_keys),
        "indexes": to_value(&t.indexes),
        "columns": to_value(&t.columns),
    }))
}

async fn sync_fields(
    tx: &mut Transaction<'_, Postgres>,
    header_id: &str,
    t: &Table,
    is_new: bool,
) -> Result<(u32, u32), sqlx::Error> {
    let existing: Vec<(String, String)> = if is_new {
        Vec::new()
    } else {
        sqlx::query_as("SELECT id, field_name FROM metadata_entity_field WHERE entity_header_id = $1")
            .bind(header_id)
            .fetch_all(&mut **tx)
            .await?
    };
    let (mut created, mut updated) = (0, 0);
    for c in &t.columns {
        let now = now_iso();
        let fk = t.foreign_keys.iter().find(|f| f.column == c.name);
        let is_pk = t.primary_key.contains(&c.name);
        let data_type = if c.data_type.is_empty() {
            "unknown".to_string()
        } else {
            c.data_type.clone()
        };
        if let Some((id, _)) = existing.iter().find(|(_, n)| *n == c.name) {
            sqlx::query(
                "UPDATE metadata_entity_field SET entity_header_id = $2, field_name = $3, data_type = $4, is_nullable = $5, \
                   is_primary_key = $6, is_foreign_key = $7, foreign_key_table = $8, foreign_key_column = $9, \
                   default_value = $10, updated_at = $11 WHERE id = $1",
            )
            .bind(id)
            .bind(header_id)
            .bind(&c.name)
            .bind(&data_type)
            .bind(c.nullable)
            .bind(is_pk)
            .bind(fk.is_some())
            .bind(fk.map(|f| f.referenced_table.clone()))
            .bind(fk.map(|f| f.referenced_column.clone()))
            .bind(c.default_value.clone())
            .bind(&now)
            .execute(&mut **tx)
            .await?;
            updated += 1;
        } else {
            sqlx::query(
                "INSERT INTO metadata_entity_field (id, entity_header_id, field_name, data_type, is_nullable, is_primary_key, \
                   is_foreign_key, foreign_key_table, foreign_key_column, default_value, description, is_display_field, \
                   is_searchable, display_order, relationship_ui_type, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, false, true, NULL, NULL, $11, $11)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(header_id)
            .bind(&c.name)
            .bind(&data_type)
            .bind(c.nullable)
            .bind(is_pk)
            .bind(fk.is_some())
            .bind(fk.map(|f| f.referenced_table.clone()))
            .bind(fk.map(|f| f.referenced_column.clone()))
            .bind(c.default_value.clone())
            .bind(&now)
            .execute(&mut **tx)
            .await?;
            created += 1;
        }
    }
    Ok((created, updated))
}

/// Sync an already-introspected schema. (Node introspects a second time
/// here; the result is the same schema, so this reuses the caller's.)
///
/// # Errors
/// On a database error outside the per-entity recovery.
pub async fn sync_data_source(
    pool: &PgPool,
    data_source_id: &str,
    user_id: Option<&str>,
    schema: &SchemaInfo,
) -> Result<SyncResult, sqlx::Error> {
    let mut r = SyncResult::default();
    let mut tx = pool.begin().await?;
    for t in &schema.tables {
        let now = now_iso();
        let existing: Option<String> = sqlx::query(
            "SELECT id FROM metadata_entity_header WHERE data_source_id = $1 AND entity_name = $2 AND entity_schema = $3",
        )
        .bind(data_source_id)
        .bind(&t.name)
        .bind(&t.schema)
        .fetch_optional(&mut *tx)
        .await?
        .map(|row| row.get("id"));
        let meta = schema_metadata(t);
        // A savepoint per table: an error aborts only that table's statements,
        // not the transaction every later table and the audit row run in.
        let mut sp = Acquire::begin(&mut *tx).await?;
        let outcome = async {
            if let Some(id) = &existing {
                sqlx::query(
                    "UPDATE metadata_entity_header SET schema_metadata = $2, last_introspected_at = $3, updated_at = $3 WHERE id = $1",
                )
                .bind(id)
                .bind(&meta)
                .bind(&now)
                .execute(&mut *sp)
                .await?;
                let (c, u) = sync_fields(&mut sp, id, t, false).await?;
                Ok::<_, sqlx::Error>((false, c, u))
            } else {
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT INTO metadata_entity_header (id, data_source_id, entity_name, entity_schema, entity_type, schema_metadata, \
                       last_introspected_at, is_active, is_hidden, created_by, updated_at, created_at) \
                     VALUES ($1, $2, $3, $4, 'table', $5, $6, false, true, $7, $6, $6)",
                )
                .bind(&id)
                .bind(data_source_id)
                .bind(&t.name)
                .bind(&t.schema)
                .bind(&meta)
                .bind(&now)
                .bind(user_id)
                .execute(&mut *sp)
                .await?;
                let (c, u) = sync_fields(&mut sp, &id, t, true).await?;
                Ok((true, c, u))
            }
        }
        .await;
        match outcome {
            Ok((new, c, u)) => {
                sp.commit().await?;
                if new {
                    r.entities_created += 1;
                } else {
                    r.entities_updated += 1;
                }
                r.fields_created += c;
                r.fields_updated += u;
            }
            Err(e) => {
                sp.rollback().await?;
                r.errors.push(format!("Error syncing entity {}: {e}", t.name));
            }
        }
    }
    if let Some(uid) = user_id {
        sqlx::query(
            "INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) \
             VALUES ($1, $2, 'create', 'metadata_entity', $3, $4, NULL, NULL, $5)",
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(uid)
        .bind(data_source_id)
        .bind(js::stringify(&json!({
            "operation": "sync_datasource",
            "entitiesCreated": r.entities_created,
            "entitiesUpdated": r.entities_updated,
            "fieldsCreated": r.fields_created,
            "fieldsUpdated": r.fields_updated,
            "errors": r.errors,
            "table_count": schema.tables.len(),
        })))
        .bind(now_iso())
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(r)
}
