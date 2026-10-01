//! Audit trail with tamper-evident hash chaining.
//!
//! Decision D4, option B: immudb has no maintained Rust client, and running a
//! second datastore purely for tamper evidence is a heavy dependency for what
//! it buys. Instead each `audit_log` row carries the hash of its predecessor,
//! so any edit or deletion of a historical row breaks the chain from that point
//! forward and `verify_chain` reports exactly where.
//!
//! What this does and does not give you, stated honestly:
//!
//! * **Detects** retroactive edits, deletions, and reordering of existing rows.
//! * **Does not prevent** an attacker with write access to the table from
//!   recomputing the whole chain forward from the row they altered. immudb's
//!   value was that the server itself refuses to rewrite history.
//!
//! Closing that gap needs an external anchor — periodically publishing the head
//! hash somewhere the database cannot reach. That is a deployment decision, not
//! a code one, so it is left to the operator and noted here rather than
//! silently skipped.

use chrono::{DateTime, Duration as ChronoDuration, Utc};
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppResult;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AuditOperation {
    Create,
    /// The default: most audited operations are updates, and an entry that
    /// somehow reaches the log without an explicit verb is far more likely to
    /// be one than a create or a delete.
    #[default]
    Update,
    Delete,
}

impl AuditOperation {
    #[must_use]
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Create => "CREATE",
            Self::Update => "UPDATE",
            Self::Delete => "DELETE",
        }
    }
}

/// Mirrors the `audit_log` columns the TypeScript stack writes. Field names
/// here are the Rust-side names; the SQL below uses the real column names
/// (`action`, `entity_type`, `entity_id`, `before_value`, `after_value`), which
/// are part of the shared schema and what `/admin/audit` reads.
#[derive(Debug, Clone, Default)]
pub struct AuditEntry {
    /// → `entity_type`, e.g. `bus_customer`.
    pub entity_type: String,
    /// → `entity_id`. VARCHAR in the schema, not UUID.
    pub entity_id: Option<String>,
    pub operation: AuditOperation,
    pub before: Option<Value>,
    pub after: Option<Value>,
    pub user_id: Option<String>,
    pub user_email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChainVerification {
    pub verified: bool,
    pub entries_checked: u64,
    /// The first row whose stored hash disagrees with a recomputation, if any.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub broken_at: Option<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Clone)]
pub struct AuditService {
    pool: PgPool,
}

impl AuditService {
    #[must_use]
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Append an entry, linking it to the current chain head.
    ///
    /// Auditing must never fail the request that triggered it: a write that
    /// succeeded but could not be logged is still a write, and returning an
    /// error here would roll back real user data over a bookkeeping problem.
    /// Failures are logged loudly instead.
    pub async fn record(&self, entry: &AuditEntry) {
        if let Err(err) = self.try_record(entry).await {
            crate::log_event!(
                entity_audit_write_failed,
                error = %err,
                entity = entry.entity_type
            );
        }
    }

    async fn try_record(&self, entry: &AuditEntry) -> AppResult<()> {
        let changed = diff(entry.before.as_ref(), entry.after.as_ref());

        // Serialising the append keeps two concurrent writers from reading the
        // same head and producing a forked chain.
        let mut txn = self.pool.begin().await?;
        sqlx::query("SELECT pg_advisory_xact_lock($1)")
            .bind(AUDIT_CHAIN_LOCK)
            .execute(&mut *txn)
            .await?;

        let tip: Option<(String, DateTime<Utc>)> = sqlx::query_as(
            "SELECT entry_hash, created_at FROM audit_log WHERE entry_hash IS NOT NULL \
             ORDER BY created_at DESC, id DESC LIMIT 1",
        )
        .fetch_optional(&mut *txn)
        .await?;

        /*
         * The chain's order is the lock's order, so the column it is read back
         * by has to be the lock's order too — and a wall clock is not.
         *
         * `Utc::now()` was read before the lock, so two writers could take
         * their timestamps in one order and acquire the lock in the other; and
         * `id DESC` breaks a tie with a random UUIDv4, which is no order at
         * all. Either way an entry chains onto a hash that sorts *after* it,
         * and `verify_chain` walks the rows in timestamp order and reports the
         * tamper that never happened — which is the worst thing a
         * tamper-evidence feature can do, because a false alarm and a real one
         * look identical.
         *
         * Inside the lock, taking the timestamp after the tip and stepping past
         * it makes `created_at` strictly increasing along the chain. The step
         * is a microsecond, the resolution the column stores, so the recorded
         * time stays the event's own to well within any tolerance that matters.
         */
        let now = Utc::now();
        let timestamp = match tip.as_ref() {
            Some((_, previous)) if *previous >= now => *previous + ChronoDuration::microseconds(1),
            _ => now,
        };
        let prev_hash = tip.map(|(hash, _)| hash);

        let id = Uuid::new_v4();
        let entry_hash = hash_entry(
            &id,
            prev_hash.as_deref(),
            &entry.entity_type,
            entry.entity_id.as_deref(),
            entry.operation,
            entry.before.as_ref(),
            entry.after.as_ref(),
            timestamp.timestamp_millis(),
        );

        sqlx::query(
            r"INSERT INTO audit_log
                (id, timestamp, user_id, user_email, action, entity_type, entity_id,
                 before_value, after_value, changed_fields, source, success,
                 prev_hash, entry_hash, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'API', true, $11, $12, $13)",
        )
        .bind(id)
        .bind(timestamp)
        .bind(&entry.user_id)
        .bind(&entry.user_email)
        .bind(entry.operation.as_str())
        .bind(&entry.entity_type)
        .bind(&entry.entity_id)
        .bind(&entry.before)
        .bind(&entry.after)
        // changed_fields is TEXT[], not JSONB.
        .bind(&changed)
        .bind(&prev_hash)
        .bind(&entry_hash)
        .bind(timestamp)
        .execute(&mut *txn)
        .await?;

        txn.commit().await?;
        Ok(())
    }

    /// Walk the chain from the beginning and recompute every hash.
    pub async fn verify_chain(&self) -> AppResult<ChainVerification> {
        // Rows predating the hash chain (or written by the TypeScript stack)
        // have no entry_hash and are skipped rather than reported as breakage.
        let rows: Vec<AuditRow> = sqlx::query_as(
            r"SELECT id, entity_type, entity_id, action, before_value, after_value,
                     prev_hash, entry_hash, created_at
                FROM audit_log
               WHERE entry_hash IS NOT NULL
               ORDER BY created_at ASC, id ASC",
        )
        .fetch_all(&self.pool)
        .await?;

        let mut expected_prev: Option<String> = None;
        for (index, row) in rows.iter().enumerate() {
            if row.prev_hash != expected_prev {
                return Ok(ChainVerification {
                    verified: false,
                    entries_checked: index as u64,
                    broken_at: Some(row.id),
                    message: Some("prev_hash does not match the preceding entry".to_string()),
                });
            }

            let recomputed = hash_entry(
                &row.id,
                row.prev_hash.as_deref(),
                &row.entity_type,
                row.entity_id.as_deref(),
                parse_operation(&row.action),
                row.before_value.as_ref(),
                row.after_value.as_ref(),
                row.created_at.timestamp_millis(),
            );
            if recomputed != row.entry_hash {
                return Ok(ChainVerification {
                    verified: false,
                    entries_checked: index as u64,
                    broken_at: Some(row.id),
                    message: Some("entry contents do not match its recorded hash".to_string()),
                });
            }
            expected_prev = Some(row.entry_hash.clone());
        }

        Ok(ChainVerification {
            verified: true,
            entries_checked: rows.len() as u64,
            broken_at: None,
            message: None,
        })
    }

    /// Recompute one entry's hash without walking the chain.
    ///
    /// This proves the row's *contents* are unaltered. It cannot prove its
    /// position in the chain is — that needs `verify_chain`, which is why the
    /// two are separate endpoints rather than one with a filter.
    pub async fn verify_entry(&self, id: Uuid) -> AppResult<ChainVerification> {
        let row: Option<AuditRow> = sqlx::query_as(
            r"SELECT id, entity_type, entity_id, action, before_value, after_value,
                     prev_hash, entry_hash, created_at
                FROM audit_log
               WHERE id = $1 AND entry_hash IS NOT NULL",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        // An entry with no hash predates the chain. Reporting that plainly is
        // more useful than "unverified", which reads like tampering.
        let Some(row) = row else {
            return Ok(ChainVerification {
                verified: false,
                entries_checked: 0,
                broken_at: Some(id),
                message: Some("no hashed audit entry with that id".to_string()),
            });
        };

        let recomputed = hash_entry(
            &row.id,
            row.prev_hash.as_deref(),
            &row.entity_type,
            row.entity_id.as_deref(),
            parse_operation(&row.action),
            row.before_value.as_ref(),
            row.after_value.as_ref(),
            row.created_at.timestamp_millis(),
        );

        let verified = recomputed == row.entry_hash;
        Ok(ChainVerification {
            verified,
            entries_checked: 1,
            broken_at: if verified { None } else { Some(row.id) },
            message: if verified {
                None
            } else {
                Some("entry contents do not match its recorded hash".to_string())
            },
        })
    }
}

/// Arbitrary but fixed key for the advisory lock that serialises appends.
const AUDIT_CHAIN_LOCK: i64 = 0x0A11_D170;

#[derive(sqlx::FromRow)]
struct AuditRow {
    id: Uuid,
    entity_type: String,
    entity_id: Option<String>,
    action: String,
    before_value: Option<Value>,
    after_value: Option<Value>,
    prev_hash: Option<String>,
    entry_hash: String,
    created_at: chrono::DateTime<Utc>,
}

fn parse_operation(raw: &str) -> AuditOperation {
    match raw {
        "CREATE" => AuditOperation::Create,
        "DELETE" => AuditOperation::Delete,
        _ => AuditOperation::Update,
    }
}

/// Hash over every field that matters, plus the previous hash — which is what
/// makes it a chain rather than a set of independent checksums.
///
/// Fields are length-prefixed so that moving a character across a boundary
/// (`"ab" + "c"` vs `"a" + "bc"`) cannot produce the same digest.
#[allow(clippy::too_many_arguments)]
fn hash_entry(
    id: &Uuid,
    prev_hash: Option<&str>,
    entity_type: &str,
    entity_id: Option<&str>,
    operation: AuditOperation,
    before: Option<&Value>,
    after: Option<&Value>,
    timestamp_millis: i64,
) -> String {
    let mut hasher = Sha256::new();
    let mut field = |bytes: &[u8]| {
        hasher.update((bytes.len() as u64).to_be_bytes());
        hasher.update(bytes);
    };

    field(id.as_bytes());
    field(prev_hash.unwrap_or("").as_bytes());
    field(entity_type.as_bytes());
    field(entity_id.unwrap_or("").as_bytes());
    field(operation.as_str().as_bytes());
    field(canonical(before).as_bytes());
    field(canonical(after).as_bytes());
    field(&timestamp_millis.to_be_bytes());

    format!("{:x}", hasher.finalize())
}

/// `serde_json` preserves insertion order for objects unless the `preserve_order`
/// feature is off, so two logically equal payloads can serialise differently.
/// Sorting keys makes the digest depend on content, not on map iteration order.
fn canonical(value: Option<&Value>) -> String {
    match value {
        None | Some(Value::Null) => String::new(),
        Some(value) => {
            let mut sorted = value.clone();
            sort_keys(&mut sorted);
            sorted.to_string()
        }
    }
}

fn sort_keys(value: &mut Value) {
    match value {
        Value::Object(map) => {
            let mut entries: Vec<(String, Value)> =
                map.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
            entries.sort_by(|a, b| a.0.cmp(&b.0));
            let mut rebuilt = serde_json::Map::new();
            for (key, mut item) in entries {
                sort_keys(&mut item);
                rebuilt.insert(key, item);
            }
            *map = rebuilt;
        }
        Value::Array(items) => items.iter_mut().for_each(sort_keys),
        _ => {}
    }
}

/// Columns whose value changed between before and after.
fn diff(before: Option<&Value>, after: Option<&Value>) -> Vec<String> {
    let (Some(Value::Object(before)), Some(Value::Object(after))) = (before, after) else {
        return Vec::new();
    };
    let mut changed: Vec<String> = after
        .iter()
        .filter(|(key, value)| before.get(*key) != Some(*value))
        .map(|(key, _)| key.clone())
        .collect();
    changed.sort();
    changed
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample_hash(prev: Option<&str>, after: Option<&Value>) -> String {
        let id = Uuid::nil();
        hash_entry(
            &id,
            prev,
            "bus_order",
            None,
            AuditOperation::Update,
            None,
            after,
            1_700_000_000_000,
        )
    }

    #[test]
    fn hash_depends_on_the_previous_link() {
        let a = sample_hash(Some("aaaa"), None);
        let b = sample_hash(Some("bbbb"), None);
        assert_ne!(a, b, "chaining must affect the digest");
    }

    #[test]
    fn hash_depends_on_content() {
        let a = sample_hash(None, Some(&json!({ "total": 10 })));
        let b = sample_hash(None, Some(&json!({ "total": 11 })));
        assert_ne!(a, b);
    }

    #[test]
    fn key_order_does_not_change_the_hash() {
        // The same record, serialised with keys in a different order, must not
        // look like tampering.
        let a = canonical(Some(&json!({ "b": 2, "a": 1 })));
        let b = canonical(Some(&json!({ "a": 1, "b": 2 })));
        assert_eq!(a, b);
    }

    #[test]
    fn length_prefixing_prevents_field_boundary_collisions() {
        let joined = hash_entry(
            &Uuid::nil(),
            Some("ab"),
            "c",
            None,
            AuditOperation::Update,
            None,
            None,
            0,
        );
        let shifted = hash_entry(
            &Uuid::nil(),
            Some("a"),
            "bc",
            None,
            AuditOperation::Update,
            None,
            None,
            0,
        );
        assert_ne!(joined, shifted);
    }

    #[test]
    fn diff_lists_only_changed_columns() {
        let before = json!({ "name": "a", "total": 1 });
        let after = json!({ "name": "a", "total": 2 });
        assert_eq!(diff(Some(&before), Some(&after)), vec!["total".to_string()]);
    }
}
