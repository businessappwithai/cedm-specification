//! What a concurrency refusal tells the caller, and where a transaction stands.
//!
//! Two people open one record; the first saves. When the second saves, the
//! update names the version they read (`If-Match`), the database no longer
//! holds it, and the write is refused. A bare "modified by another user" leaves
//! that person to reload and retype, so the refusal carries everything the
//! screen needs to let them decide in place:
//!
//! - the record **as it now stands**, and its current version — the ETag an
//!   overwrite sends back;
//! - **who** changed it and **when**;
//! - **which columns** changed since the version they read;
//! - **where the transaction stands**: the record's status, its label, and
//!   whether that state is final — in which case the record is closed and
//!   overwriting is not offered.
//!
//! The same status block rides on every successful write as
//! `transactionStatus`, so the person who saved is told where the record is
//! now whichever way their save went.

use serde_json::{json, Map, Value};
use sqlx::PgPool;

use crate::errors::AppError;
use crate::services::dictionary::{Lifecycle, TableMeta};

/// Which refusal this is.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Refusal {
    /// The record changed since the caller read it.
    VersionConflict,
    /// The record is in a final state: its transaction is complete.
    RecordFinal,
}

impl Refusal {
    /// Decide which refusal a refused write was, from the row as it now is.
    #[must_use]
    pub fn of(meta: &TableMeta, current: &Value) -> Self {
        if meta
            .lifecycle
            .as_ref()
            .is_some_and(|lifecycle| lifecycle.is_final(current))
        {
            Self::RecordFinal
        } else {
            Self::VersionConflict
        }
    }

    fn code(self) -> &'static str {
        match self {
            Self::VersionConflict => "VERSION_CONFLICT",
            Self::RecordFinal => "RECORD_FINAL",
        }
    }

    fn message(self) -> &'static str {
        match self {
            Self::VersionConflict => AppError::VERSION_CONFLICT_MESSAGE,
            Self::RecordFinal => AppError::RECORD_FINAL_MESSAGE,
        }
    }
}

/// The 409 for a refused write, describing `current` to the caller.
///
/// `your_version` is the version the caller sent; `sent` is what they tried to
/// write, which decides `changedFields` when the table keeps no audit trail.
pub async fn refusal(
    pool: &PgPool,
    meta: &TableMeta,
    current: &Value,
    your_version: Option<i32>,
    sent: &Map<String, Value>,
    kind: Refusal,
) -> AppError {
    let id = current.get("id").and_then(Value::as_str).unwrap_or_default();
    let current_version = current.get("version").and_then(Value::as_i64);
    let (changed_by, changed_fields) =
        what_changed(pool, meta, id, current, your_version, sent).await;
    let status = transaction_status(pool, meta, current).await;

    AppError::Concurrency {
        code: kind.code(),
        message: kind.message().to_string(),
        conflict: json!({
            "yourVersion": your_version,
            "currentVersion": current_version,
            "changedBy": changed_by,
            "changedAt": current.get("updated_at").cloned().unwrap_or(Value::Null),
            "changedFields": changed_fields,
            "current": current,
            "status": status,
            "overwritable": kind == Refusal::VersionConflict,
        }),
    }
}

/// Who made the most recent change, and which columns changed after the
/// version the caller read.
///
/// The audit trail answers both when the table keeps one
/// (`sys_table.is_changelog`): every entry since that version names its
/// columns. Without a trail the record cannot say who wrote it, and the
/// columns reported are the ones where the record now differs from what the
/// caller tried to save — the ones they have to decide about.
async fn what_changed(
    pool: &PgPool,
    meta: &TableMeta,
    id: &str,
    current: &Value,
    your_version: Option<i32>,
    sent: &Map<String, Value>,
) -> (Value, Vec<String>) {
    let differing = || -> Vec<String> {
        sent.iter()
            .filter(|(column, value)| current.get(column.as_str()) != Some(*value))
            .map(|(column, _)| column.clone())
            .collect()
    };
    if !meta.is_changelog {
        return (Value::Null, differing());
    }

    let entries: Vec<(Option<String>, Vec<String>)> = sqlx::query_as(
        r"SELECT user_email, changed_fields
            FROM audit_log
           WHERE entity_type = $1 AND entity_id = $2
             AND COALESCE((after_value->>'version')::int, 0) > $3
           ORDER BY timestamp DESC",
    )
    .bind(&meta.table_name)
    .bind(id)
    .bind(your_version.unwrap_or(0))
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let changed_by = entries
        .first()
        .and_then(|(email, _)| email.clone())
        .map_or(Value::Null, Value::String);
    let mut fields: Vec<String> = Vec::new();
    for (_, columns) in &entries {
        for column in columns {
            if column != "version" && column != "updated_at" && !fields.contains(column) {
                fields.push(column.clone());
            }
        }
    }
    if fields.is_empty() {
        fields = differing();
    }
    (changed_by, fields)
}

/// Where the record's transaction stands: its status, the status's label, and
/// whether that state is final. `null` for a table with no state machine.
pub async fn transaction_status(pool: &PgPool, meta: &TableMeta, row: &Value) -> Value {
    let Some(lifecycle) = meta.lifecycle.as_ref() else {
        return Value::Null;
    };
    let value = row.get(&lifecycle.status_field).cloned().unwrap_or(Value::Null);
    let label = match value.as_str() {
        Some(state) => Value::String(state_label(pool, meta, lifecycle, state).await),
        None => Value::Null,
    };
    json!({
        "field": lifecycle.status_field,
        "value": value,
        "label": label,
        "isFinal": lifecycle.is_final(row),
    })
}

/// A state's label: the name the dictionary gives that value of the status
/// column's list, or the state itself made readable.
async fn state_label(pool: &PgPool, meta: &TableMeta, lifecycle: &Lifecycle, state: &str) -> String {
    let named: Option<String> = sqlx::query_scalar(
        r"SELECT rl.name
            FROM sys_column c
            JOIN sys_table t ON t.sys_table_id = c.sys_table_id
            JOIN sys_ref_list rl ON rl.sys_reference_id = c.sys_reference_id
           WHERE t.table_name = $1 AND c.column_name = $2 AND rl.value = $3
           LIMIT 1",
    )
    .bind(&meta.table_name)
    .bind(&lifecycle.status_field)
    .bind(state)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();
    named.unwrap_or_else(|| readable(state))
}

/// `closed_won` → `Closed Won`.
fn readable(state: &str) -> String {
    state
        .split(['_', '-', ' '])
        .filter(|word| !word.is_empty())
        .map(|word| {
            let mut chars = word.chars();
            chars.next().map_or_else(String::new, |first| {
                first.to_uppercase().collect::<String>() + chars.as_str()
            })
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::readable;

    #[test]
    fn a_state_reads_as_words() {
        assert_eq!(readable("closed_won"), "Closed Won");
        assert_eq!(readable("in-review"), "In Review");
        assert_eq!(readable("draft"), "Draft");
    }
}
