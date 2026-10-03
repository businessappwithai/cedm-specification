//! `logAudit` (`src/lib/security/audit.ts`): one `audit_log` row per action.
use serde_json::Value;
use sqlx::PgPool;

use crate::common::time::now_iso;

#[derive(Debug, Default)]
pub struct AuditEntry<'a> {
    pub user_id: Option<&'a str>,
    pub action: &'a str,
    pub resource_type: &'a str,
    pub resource_id: Option<&'a str>,
    pub details: Option<Value>,
    pub ip_address: Option<&'a str>,
    pub user_agent: Option<&'a str>,
}

/// # Errors
/// On a database error.
pub async fn log_audit(pool: &PgPool, entry: AuditEntry<'_>) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(entry.user_id)
    .bind(entry.action)
    .bind(entry.resource_type)
    .bind(entry.resource_id)
    .bind(entry.details.map(|d| d.to_string()))
    .bind(entry.ip_address)
    .bind(entry.user_agent)
    .bind(now_iso())
    .execute(pool)
    .await?;
    Ok(())
}
