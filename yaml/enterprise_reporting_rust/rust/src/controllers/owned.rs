//! Shared plumbing for the report/chart/dashboard write routes: the audit
//! call and the owner-or-admin gate (MIGRATION_PLAN.md §9, D-12).
use axum::{http::StatusCode, response::Response};
use serde_json::Value;
use sqlx::PgPool;

use crate::{
    common::response,
    permissions::ownership::{can_modify, Owned, WriteDecision},
    security::audit::{log_audit, AuditEntry},
};

pub async fn audit(
    db: &PgPool,
    user: &str,
    action: &str,
    resource_type: &str,
    id: &str,
    details: Option<Value>,
) {
    let entry = AuditEntry {
        user_id: Some(user),
        action,
        resource_type,
        resource_id: Some(id),
        details,
        ..Default::default()
    };
    if let Err(e) = log_audit(db, entry).await {
        tracing::error!(error = %e, "audit log failed");
    }
}

/// `Ok(Some(response))` means stop and return it. `missing_ok` is for
/// DELETE, which Node answers with success whether or not the row existed.
///
/// # Errors
/// On a database error.
pub async fn gate(
    db: &PgPool,
    what: Owned,
    noun: &str,
    id: &str,
    user: &str,
    missing_ok: bool,
) -> Result<Option<Response>, sqlx::Error> {
    Ok(match can_modify(db, what, id, user).await? {
        WriteDecision::Allowed => None,
        WriteDecision::NotFound if missing_ok => None,
        WriteDecision::NotFound => {
            let cap = noun[..1].to_uppercase() + &noun[1..];
            Some(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                &format!("{cap} not found"),
            ))
        }
        WriteDecision::Forbidden => Some(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            &format!("You can only change {noun}s you created."),
        )),
    })
}
