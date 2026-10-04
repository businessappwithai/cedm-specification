//! The Application Dictionary cache.
//!
//! Replaces `BusService.metadataCache` / `identifierFieldsCache` from the
//! TypeScript stack. Every generic request resolves its table and column set
//! through here, so this is also the security boundary described in §6.3:
//! a `TableName` cannot be constructed except by matching a `sys_table` row,
//! and a `ColumnName` cannot be constructed except by matching a `sys_column`
//! row for that table. Identifiers reaching SQL are therefore always
//! dictionary-verified, never caller-supplied strings.
//!
//! Invalidation is explicit and must be called from every `sys_table` /
//! `sys_column` / `sys_field` write: the product promise is that reordering a
//! field takes effect without a redeploy.

use std::sync::Arc;
use std::time::Duration;

use moka::future::Cache;
use sqlx::PgPool;

use crate::errors::{AppError, AppResult};

/// A physical table name that has been verified against `sys_table`.
///
/// The inner field is private on purpose — this type existing is the proof
/// that the name is safe to interpolate as a SQL identifier.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TableName(String);

impl TableName {
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Re-wrap a name that already came out of `sys_table`.
    ///
    /// Only for values read back from `TableMeta`, which the dictionary
    /// produced. Never call this with anything derived from a request — that
    /// would defeat the point of the newtype.
    pub(crate) fn from_verified(name: String) -> Self {
        Self(name)
    }
}

impl std::fmt::Display for TableName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

/// Column metadata as the dictionary describes it. Field names mirror
/// `sys_column` so the JSON the metadata endpoints return is unchanged.
/// One way a lookup's choices are narrowed by another column of the same record:
/// the lookup lists the target rows whose `on` column equals the record's `by`
/// column. A state is narrowed by its country (`{by: country_id, on: country_id}`),
/// a city by its state and its country. `sys_column.narrowed_by` holds the list.
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Narrowing {
    pub by: String,
    pub on: String,
}

#[derive(Clone, Debug, serde::Serialize)]
pub struct ColumnMeta {
    pub column_name: String,
    pub name: String,
    pub sys_reference_id: Option<i32>,
    pub is_mandatory: bool,
    pub is_updateable: bool,
    pub is_key: bool,
    pub field_length: Option<i32>,
    pub default_value: Option<String>,
    pub ref_table_name: Option<String>,
    pub seq_no: Option<i32>,
    /// What narrows this lookup's choices; empty for a column that offers every row.
    pub narrowed_by: Vec<Narrowing>,
}

#[derive(Clone, Debug, serde::Serialize)]
pub struct TableMeta {
    pub table_name: String,
    pub name: String,
    /// `sys_table.is_changelog` — whether writes to this table are audited.
    /// An administrator can turn it off per table from the dictionary UI.
    pub is_changelog: bool,
    /// `sys_table.concurrency_mode` — whether an update must name the version
    /// it was read at (m0020).
    pub concurrency: ConcurrencyMode,
    /// The status column this table's state machine drives and the states that
    /// close a record, from `sys_workflow_states`. `None` for a table with no
    /// machine — the common case — and then nothing is ever closed.
    pub lifecycle: Option<Lifecycle>,
    pub columns: Vec<ColumnMeta>,
}

/// How concurrent edits of one record are reconciled. Serialised as the
/// model writes it, `optimistic` or `last-write-wins`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ConcurrencyMode {
    /// An update must carry `If-Match`; a stale one is a `VERSION_CONFLICT`.
    Optimistic,
    /// An update without `If-Match` is accepted. One that carries it is still
    /// checked — a client that names a version means it.
    LastWriteWins,
}

impl ConcurrencyMode {
    fn parse(raw: Option<&str>) -> Self {
        match raw {
            Some("last-write-wins") => Self::LastWriteWins,
            _ => Self::Optimistic,
        }
    }
}

/// A table's state machine, as far as closing a record is concerned.
#[derive(Debug, Clone, serde::Serialize)]
pub struct Lifecycle {
    /// The column the machine drives (`status`, `stage`, …).
    pub status_field: String,
    /// The states a record's transaction ends in.
    pub finals: Vec<String>,
}

impl Lifecycle {
    /// Whether a stored row is in a final state.
    #[must_use]
    pub fn is_final(&self, row: &serde_json::Value) -> bool {
        row.get(&self.status_field)
            .and_then(serde_json::Value::as_str)
            .is_some_and(|state| self.finals.iter().any(|final_state| final_state == state))
    }
}

impl TableMeta {
    #[must_use]
    pub fn column(&self, name: &str) -> Option<&ColumnMeta> {
        self.columns.iter().find(|c| c.column_name == name)
    }

    /// Columns the caller is allowed to write. Mirrors `sys_column.is_updateable`
    /// and excludes the framework-managed audit tail.
    pub fn writable_columns(&self) -> impl Iterator<Item = &ColumnMeta> {
        self.columns
            .iter()
            .filter(|c| c.is_updateable && !is_managed_column(&c.column_name))
    }
}

/// Columns the request handler owns rather than the caller. Writes to these
/// are ignored rather than rejected, matching `BusService`.
///
/// The first group is the audit/versioning tail every `bus_*` table gets from
/// the bus-tables migration; the second is added by the workflow migration and
/// is owned by the promotion pipeline, never by the client.
#[must_use]
pub fn is_managed_column(name: &str) -> bool {
    matches!(
        name,
        "id" | "version"
            | "created_at"
            | "updated_at"
            | "deleted_at"
            | "workflow_status"
            | "workflow_run_id"
            | "doc_status"
            | "doc_status_message"
    )
}

#[derive(Clone)]
pub struct DictionaryCache {
    pool: PgPool,
    tables: Cache<String, Arc<TableMeta>>,
}

impl DictionaryCache {
    #[must_use]
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            tables: Cache::builder()
                .max_capacity(512)
                // A ceiling, not the invalidation mechanism — dictionary writes
                // invalidate explicitly. This only bounds staleness if some
                // future write path forgets to.
                .time_to_live(Duration::from_secs(300))
                .build(),
        }
    }

    /// Resolve a URL entity segment to a verified table name.
    ///
    /// Mirrors the TypeScript `getTableName()` candidates (lowercase,
    /// singularise, `bus_` prefix) but, unlike it, requires a matching
    /// `sys_table` row — an unknown entity is a 404 before any SQL is built.
    pub async fn resolve(&self, entity: &str) -> AppResult<TableName> {
        self.meta(entity).await.map(|m| TableName(m.table_name.clone()))
    }

    /// Resolve and return the full table metadata, from cache when possible.
    pub async fn meta(&self, entity: &str) -> AppResult<Arc<TableMeta>> {
        let key = entity.to_lowercase();
        if let Some(hit) = self.tables.get(&key).await {
            return Ok(hit);
        }

        let Some(table_name) = self.lookup_table_name(&key).await? else {
            return Err(AppError::NotFound(format!("Unknown entity '{entity}'")));
        };

        let meta = Arc::new(self.load_meta(&table_name).await?);
        self.tables.insert(key, Arc::clone(&meta)).await;
        Ok(meta)
    }

    /// Verify a caller-supplied column name against the dictionary.
    pub async fn resolve_column(&self, entity: &str, column: &str) -> AppResult<String> {
        let meta = self.meta(entity).await?;
        meta.column(column)
            .map(|c| c.column_name.clone())
            .ok_or_else(|| AppError::BadRequest(format!("Unknown field '{column}'")))
    }

    /// Drop cached metadata for one entity. Call after any `sys_*` write.
    pub async fn invalidate(&self, entity: &str) {
        self.tables.invalidate(&entity.to_lowercase()).await;
    }

    /// Drop the whole cache. Call after a bulk dictionary import.
    pub fn invalidate_all(&self) {
        self.tables.invalidate_all();
    }

    async fn lookup_table_name(&self, entity: &str) -> AppResult<Option<String>> {
        for candidate in table_name_candidates(entity) {
            let found: Option<(String,)> =
                sqlx::query_as("SELECT table_name FROM sys_table WHERE table_name = $1 LIMIT 1")
                    .bind(&candidate)
                    .fetch_optional(&self.pool)
                    .await?;
            if let Some((name,)) = found {
                return Ok(Some(name));
            }
        }
        Ok(None)
    }

    async fn load_meta(&self, table_name: &str) -> AppResult<TableMeta> {
        let table: (String, String, Option<bool>, Option<String>) = sqlx::query_as(
            "SELECT table_name, name, is_changelog, concurrency_mode FROM sys_table WHERE table_name = $1",
        )
        .bind(table_name)
        .fetch_one(&self.pool)
        .await?;

        // One machine per table: every state row of it names the same column.
        let states: Vec<(String, String, bool)> = sqlx::query_as(
            r"SELECT status_field, state, is_final
                FROM sys_workflow_states
               WHERE table_name = $1 AND is_active
               ORDER BY seq_no",
        )
        .bind(table_name)
        .fetch_all(&self.pool)
        .await?;
        let lifecycle = states.first().map(|(field, _, _)| Lifecycle {
            status_field: field.clone(),
            finals: states
                .iter()
                .filter(|(_, _, is_final)| *is_final)
                .map(|(_, state, _)| state.clone())
                .collect(),
        });

        // The lookup target is the stored `ref_table_name` where the model
        // stated one, and is derived from the column name otherwise — see
        // `resolve_ref_table`.
        let columns = sqlx::query_as::<_, ColumnRow>(
            r"SELECT c.column_name, c.name, c.sys_reference_id, c.is_mandatory,
                     c.is_updateable, c.is_key, c.field_length, c.default_value,
                     c.seq_no, c.ref_table_name, c.narrowed_by
                FROM sys_column c
                JOIN sys_table t ON t.sys_table_id = c.sys_table_id
               WHERE t.table_name = $1 AND c.is_active = true
               ORDER BY c.seq_no NULLS LAST, c.column_name",
        )
        .bind(table_name)
        .fetch_all(&self.pool)
        .await?;

        Ok(TableMeta {
            table_name: table.0,
            name: table.1,
            // Audit on by default: a dictionary row that predates the column,
            // or one written by hand, should still be logged. Silence is the
            // wrong default for an audit trail.
            is_changelog: table.2.unwrap_or(true),
            concurrency: ConcurrencyMode::parse(table.3.as_deref()),
            lifecycle,
            columns: columns.into_iter().map(Into::into).collect(),
        })
    }
}

/// Name candidates tried against `sys_table`, in order. Mirrors `singular()`
/// from `@appwithai/core/utils` so both stacks resolve the same URL segment to
/// the same physical table.
fn table_name_candidates(entity: &str) -> Vec<String> {
    // URLs spell a multi-word entity in kebab-case (`/api/bus/deviation-report`)
    // while the physical table is snake_case (`bus_deviation_report`). Without
    // this every multi-word entity 404s — single-word ones happened to work,
    // which is what made it look like the resolver was fine.
    let lower = entity.to_lowercase().replace('-', "_");
    let singular = singularize(&lower);
    let mut candidates = vec![format!("bus_{singular}"), format!("bus_{lower}")];
    // A caller may also pass the physical name directly.
    candidates.push(lower);
    candidates.dedup();
    candidates
}

fn singularize(word: &str) -> String {
    if let Some(stem) = word.strip_suffix("ies") {
        return format!("{stem}y");
    }
    if let Some(stem) = word.strip_suffix("es") {
        return stem.to_string();
    }
    if let Some(stem) = word.strip_suffix('s') {
        return stem.to_string();
    }
    word.to_string()
}

/// Reference-type ids that make a column a lookup. `18` is Table, `19` is
/// Table Direct — the same two the frontend checks.
const REFERENCE_TABLE: i32 = 18;
const REFERENCE_TABLE_DIRECT: i32 = 19;

/// FK columns naming a person by the role they played rather than by entity.
///
/// The `_by` / `_by_id` suffixes are handled by rule below; this list covers the
/// role names that carry no suffix at all. It mirrors
/// `foreignKeys.personRoleColumns.names` in `language/appwithai-language.json`,
/// which is the canonical list, and `COLUMN_TABLE_ALIASES` in the NestJS
/// `BusService` — all three must agree or the two stacks resolve the same model
/// to different lookups.
const PERSON_ROLE_COLUMNS: &[&str] = &[
    "assigned_to",
    "author_id",
    "lab_manager_id",
    "manager_id",
    "owner_id",
    "pi_id",
    "remediation_owner",
    "remediation_owner_id",
    "user_id",
];

/// Prefixes that name the role a reference plays, not a different entity.
///
/// A hierarchical self-reference is the case that matters: `parent_sample_id`
/// on `bus_sample` points at another sample. Deriving `bus_parent_sample` from
/// the name gives a table that does not exist, so the picker has nothing to
/// show and the field falls back to rendering a raw id.
///
/// Mirrors `QUALIFIER_PREFIXES` in `packages/core/src/types/bus-entity.types.ts`
/// and `language/cedm/naming.ts`; the three lists must agree.
const QUALIFIER_PREFIXES: &[&str] = &["parent_"];

/// The table a lookup column points at: the stored target where there is one,
/// and the one its name derives otherwise.
///
/// `sys_column.ref_table_name` (m0018) is written only for a reference the
/// model named outright and whose column name would derive something else — a
/// CEDM `deliveryLocation → Location` held in `delivery_location_id`. Every
/// other column leaves it NULL, so this is exactly `resolve_ref_table_name` for
/// every model without such a reference.
#[must_use]
pub fn resolve_ref_table(
    stored: Option<&str>,
    column_name: &str,
    sys_reference_id: Option<i32>,
) -> Option<String> {
    if !matches!(
        sys_reference_id,
        Some(REFERENCE_TABLE) | Some(REFERENCE_TABLE_DIRECT)
    ) {
        return None;
    }
    match stored.map(str::trim) {
        Some(table) if !table.is_empty() => Some(table.to_string()),
        _ => resolve_ref_table_name(column_name, sys_reference_id),
    }
}

/// The table a lookup column points at, derived from its name.
///
/// The column name carries the reference (see `foreignKeys.resolution` in the
/// language definition); `resolve_ref_table` puts a stored target ahead of it.
/// A column that resolves to nothing renders its raw id, which is the
/// documented fallback rather than an error.
#[must_use]
pub fn resolve_ref_table_name(column_name: &str, sys_reference_id: Option<i32>) -> Option<String> {
    if !matches!(
        sys_reference_id,
        Some(REFERENCE_TABLE) | Some(REFERENCE_TABLE_DIRECT)
    ) {
        return None;
    }
    if PERSON_ROLE_COLUMNS.contains(&column_name) {
        return Some("bus_user".to_string());
    }

    // Strip a qualifier before the entity rules, so `parent_sample_id` is read
    // as a sample. Checked after the person-role list and before everything
    // else, so a stripped name is still eligible to be a person role —
    // `parent_owner_id` names a user, the same as `owner_id` does.
    let column_name = QUALIFIER_PREFIXES
        .iter()
        .find_map(|prefix| column_name.strip_prefix(prefix))
        .unwrap_or(column_name);
    if PERSON_ROLE_COLUMNS.contains(&column_name) {
        return Some("bus_user".to_string());
    }
    // A `_by` column names a person: `reported_by_id`, `approved_by_id` and
    // `performed_by` all point at a user. Both spellings are matched — `_by_id`
    // is what the EML fixer produces, `_by` is what an unfixed model still
    // carries. Deriving `bus_reported_by` from the name would look up a table
    // that does not exist, so the column would fall back to its raw id.
    if column_name.ends_with("_by_id") || column_name.ends_with("_by") {
        return Some("bus_user".to_string());
    }
    if column_name == "id" {
        return None;
    }
    let stem = column_name.strip_suffix("_id")?;
    Some(format!("bus_{stem}"))
}

#[derive(sqlx::FromRow)]
struct ColumnRow {
    column_name: String,
    name: String,
    sys_reference_id: Option<i32>,
    is_mandatory: Option<bool>,
    is_updateable: Option<bool>,
    is_key: Option<bool>,
    field_length: Option<i32>,
    default_value: Option<String>,
    seq_no: Option<i32>,
    ref_table_name: Option<String>,
    narrowed_by: Option<String>,
}

impl From<ColumnRow> for ColumnMeta {
    fn from(row: ColumnRow) -> Self {
        let column_name = row.column_name;
        Self {
            name: row.name,
            sys_reference_id: row.sys_reference_id,
            is_mandatory: row.is_mandatory.unwrap_or(false),
            is_updateable: row.is_updateable.unwrap_or(true),
            is_key: row.is_key.unwrap_or(false),
            field_length: row.field_length,
            default_value: row.default_value,
            ref_table_name: resolve_ref_table(
                row.ref_table_name.as_deref(),
                &column_name,
                row.sys_reference_id,
            ),
            column_name,
            seq_no: row.seq_no,
            narrowed_by: row
                .narrowed_by
                .as_deref()
                .and_then(|json| serde_json::from_str(json).ok())
                .unwrap_or_default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn singularize_matches_the_typescript_helper() {
        assert_eq!(singularize("companies"), "company");
        assert_eq!(singularize("boxes"), "box");
        assert_eq!(singularize("orders"), "order");
        assert_eq!(singularize("person"), "person");
    }

    #[test]
    fn candidates_prefer_the_singular_bus_table() {
        let candidates = table_name_candidates("Customers");
        assert_eq!(candidates[0], "bus_customer");
        assert!(candidates.contains(&"bus_customers".to_string()));
    }

    /// The URL segment for a multi-word entity is kebab-case; the table is not.
    #[test]
    fn kebab_case_segments_resolve_to_snake_case_tables() {
        assert_eq!(
            table_name_candidates("deviation-report")[0],
            "bus_deviation_report"
        );
        assert_eq!(
            table_name_candidates("chemical-inventory")[0],
            "bus_chemical_inventory"
        );
        // Plurals still singularise after the hyphens are folded.
        assert_eq!(
            table_name_candidates("instrument-bookings")[0],
            "bus_instrument_booking"
        );
        // The physical name passed straight through still works.
        assert!(table_name_candidates("bus_vendor_request")
            .contains(&"bus_vendor_request".to_string()));
    }

    #[test]
    fn managed_columns_are_not_caller_writable() {
        assert!(is_managed_column("version"));
        assert!(is_managed_column("created_at"));
        assert!(!is_managed_column("name"));
    }

    /// The cases from `foreignKeys.personRoleColumns.examples` in the language
    /// definition, plus the ones `BusService.resolveRefTableName` handles. If
    /// this drifts, the two stacks render different lookups for the same model.
    #[test]
    fn a_stored_target_wins_over_the_name_and_only_for_a_lookup() {
        let table = Some(REFERENCE_TABLE_DIRECT);
        assert_eq!(
            resolve_ref_table(Some("bus_location"), "delivery_location_id", table).as_deref(),
            Some("bus_location")
        );
        assert_eq!(
            resolve_ref_table(None, "compound_id", table).as_deref(),
            Some("bus_compound")
        );
        assert_eq!(
            resolve_ref_table(Some(""), "compound_id", table).as_deref(),
            Some("bus_compound")
        );
        assert_eq!(resolve_ref_table(Some("bus_location"), "x_id", Some(10)), None);
    }

    #[test]
    fn ref_table_names_match_the_typescript_resolver() {
        let table = Some(REFERENCE_TABLE);

        // <entity>_id -> bus_<entity>
        assert_eq!(
            resolve_ref_table_name("compound_id", table).as_deref(),
            Some("bus_compound")
        );
        // Person roles, by suffix and by name.
        assert_eq!(
            resolve_ref_table_name("reported_by_id", table).as_deref(),
            Some("bus_user")
        );
        assert_eq!(
            resolve_ref_table_name("performed_by", table).as_deref(),
            Some("bus_user")
        );
        assert_eq!(
            resolve_ref_table_name("pi_id", table).as_deref(),
            Some("bus_user")
        );
        assert_eq!(
            resolve_ref_table_name("assigned_to", table).as_deref(),
            Some("bus_user")
        );

        // A qualifier names the role, not another entity: a Sample's parent is
        // a Sample. `bus_parent_sample` does not exist, so deriving it left the
        // picker with nothing to show.
        assert_eq!(
            resolve_ref_table_name("parent_sample_id", table).as_deref(),
            Some("bus_sample")
        );
        // A stripped name is still eligible to be a person role.
        assert_eq!(
            resolve_ref_table_name("parent_owner_id", table).as_deref(),
            Some("bus_user")
        );
        // `parent_id` alone strips to `id`, which is not a reference to
        // anything — the model has to say what kind of parent it means.
        assert_eq!(resolve_ref_table_name("parent_id", table), None);

        // The row's own key is not a lookup, and neither is a plain column.
        assert_eq!(resolve_ref_table_name("id", table), None);
        assert_eq!(resolve_ref_table_name("smiles", table), None);

        // Only Table (18) and Table Direct (19) are lookups at all — a String
        // column ending in `_id` renders its value, it does not open a picker.
        assert_eq!(resolve_ref_table_name("compound_id", Some(10)), None);
        assert_eq!(resolve_ref_table_name("compound_id", None), None);
        assert_eq!(
            resolve_ref_table_name("compound_id", Some(REFERENCE_TABLE_DIRECT)).as_deref(),
            Some("bus_compound")
        );
    }
}
