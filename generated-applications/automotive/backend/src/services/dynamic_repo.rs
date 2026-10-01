//! Runtime, metadata-driven access to the `bus_*` tables.
//!
//! This is the answer to the central design problem of the migration (§6.3).
//! The `bus` controller is generic: `/api/bus/{entity}` dispatches to a table
//! named by a runtime string, and validation follows `sys_column` rows an
//! admin can edit *after* the binary was compiled. SeaORM entities are
//! compile-time types and cannot express that, so queries are built with
//! `sea_query` and executed over the sqlx pool SeaORM already owns.
//!
//! Safety rules, because table and column names arrive over HTTP:
//!
//! 1. Table names are `TableName`, constructible only by matching a
//!    `sys_table` row (see `services::dictionary`).
//! 2. Column names are checked against `sys_column` before entering a query.
//! 3. Filter operators come from a fixed enum — never string interpolation.
//!
//! Values are always bound as parameters; identifiers go through `Alias`,
//! which quotes.

use chrono::Utc;
// `ExprTrait` carries the comparison/logic combinators in sea-query 1.0 (they
// are no longer inherent methods), and `PgExpr` adds `ilike`. Without these in
// scope `.eq(..)` silently resolves to `PartialEq::eq` and fails to typecheck.
use sea_query::extension::postgres::PgExpr;
use sea_query::{Alias, Asterisk, Expr, ExprTrait, Order, PostgresQueryBuilder, Query};
use sea_query_sqlx::SqlxBinder;
use serde_json::{Map, Value};
use sqlx::{AssertSqlSafe, PgPool};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::services::dictionary::{is_managed_column, ColumnMeta, TableMeta, TableName};
use crate::services::row_json::{row_to_json, rows_to_json};

/// Reference types the `search` query parameter scans. Preserved exactly from
/// `bus.controller.ts.hbs:79` — STRING, TEXT, URL, EMAIL, PHONE.
const SEARCHABLE_REFERENCE_IDS: [i32; 5] = [10, 14, 24, 30, 31];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OrderDir {
    Asc,
    Desc,
}

impl OrderDir {
    #[must_use]
    pub fn parse(raw: Option<&str>) -> Self {
        match raw.map(str::to_ascii_lowercase).as_deref() {
            Some("desc") => Self::Desc,
            _ => Self::Asc,
        }
    }

    fn to_order(self) -> Order {
        match self {
            Self::Asc => Order::Asc,
            Self::Desc => Order::Desc,
        }
    }
}

#[derive(Clone, Debug)]
pub struct PaginationOptions {
    /// 1-based, matching the `?page=` contract.
    pub page: u64,
    pub limit: u64,
    pub order_by: Option<String>,
    pub order_dir: OrderDir,
}

impl Default for PaginationOptions {
    fn default() -> Self {
        Self {
            page: 1,
            limit: 25,
            order_by: None,
            order_dir: OrderDir::Asc,
        }
    }
}

impl PaginationOptions {
    fn offset(&self) -> u64 {
        self.page.saturating_sub(1) * self.limit
    }
}

/// The operator whitelist. `?filter.{field}={operator}:{value}` accepts only
/// these — anything else is a 400 rather than a query.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FilterOp {
    Equals,
    Gt,
    Gte,
    Lt,
    Lte,
    Contains,
    StartsWith,
    EndsWith,
}

impl FilterOp {
    pub fn parse(raw: &str) -> AppResult<Self> {
        match raw {
            "equals" | "eq" => Ok(Self::Equals),
            "gt" => Ok(Self::Gt),
            "gte" => Ok(Self::Gte),
            "lt" => Ok(Self::Lt),
            "lte" => Ok(Self::Lte),
            "contains" => Ok(Self::Contains),
            "startsWith" => Ok(Self::StartsWith),
            "endsWith" => Ok(Self::EndsWith),
            other => Err(AppError::BadRequest(format!(
                "Unsupported filter operator '{other}'"
            ))),
        }
    }
}

#[derive(Clone, Debug)]
pub struct Filter {
    pub column: String,
    pub op: FilterOp,
    pub value: String,
}

pub struct PaginatedResult {
    pub data: Vec<Value>,
    pub total: u64,
}

#[derive(Clone)]
pub struct DynamicRepo {
    pool: PgPool,
}

impl DynamicRepo {
    #[must_use]
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_all(
        &self,
        meta: &TableMeta,
        opts: &PaginationOptions,
        filters: &[Filter],
        search: Option<&str>,
    ) -> AppResult<PaginatedResult> {
        let table = Alias::new(meta.table_name.clone());

        let mut select = Query::select();
        select
            .column(Asterisk)
            .from(table.clone())
            .and_where(Expr::col(Alias::new("deleted_at")).is_null());

        let mut count = Query::select();
        count
            .expr(Expr::col(Alias::new("id")).count())
            .from(table)
            .and_where(Expr::col(Alias::new("deleted_at")).is_null());

        for filter in filters {
            let condition = filter_condition(filter);
            select.and_where(condition.clone());
            count.and_where(condition);
        }

        if let Some(term) = search.filter(|t| !t.is_empty()) {
            if let Some(condition) = search_condition(meta, term) {
                select.and_where(condition.clone());
                count.and_where(condition);
            }
        }

        // `order_by` is dictionary-verified by the caller; default to the
        // deterministic `created_at` the TypeScript stack used.
        let order_column = opts.order_by.as_deref().unwrap_or("created_at");
        select
            .order_by(Alias::new(order_column), opts.order_dir.to_order())
            .limit(opts.limit)
            .offset(opts.offset());

        let (sql, values) = select.build_sqlx(PostgresQueryBuilder);
        let rows = sqlx::query_with(AssertSqlSafe(sql), values)
            .fetch_all(&self.pool)
            .await?;

        let (count_sql, count_values) = count.build_sqlx(PostgresQueryBuilder);
        let total: i64 = sqlx::query_scalar_with(AssertSqlSafe(count_sql), count_values)
            .fetch_one(&self.pool)
            .await?;

        Ok(PaginatedResult {
            data: rows_to_json(&rows),
            #[allow(clippy::cast_sign_loss)]
            total: Ord::max(total, 0) as u64,
        })
    }

    pub async fn find_by_id(&self, table: &TableName, id: Uuid) -> AppResult<Option<Value>> {
        let (sql, values) = Query::select()
            .column(Asterisk)
            .from(Alias::new(table.as_str()))
            .and_where(Expr::col(Alias::new("id")).eq(id))
            .and_where(Expr::col(Alias::new("deleted_at")).is_null())
            .build_sqlx(PostgresQueryBuilder);

        let row = sqlx::query_with(AssertSqlSafe(sql), values)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.as_ref().map(row_to_json))
    }

    pub async fn create(&self, meta: &TableMeta, payload: &Map<String, Value>) -> AppResult<Value> {
        let assignments = self.collect_assignments(meta, payload)?;
        if assignments.is_empty() {
            return Err(AppError::Validation {
                message: "Validation failed".to_string(),
                errors: vec!["No writable fields supplied".to_string()],
            });
        }
        require_mandatory_columns(meta, payload)?;

        let now = Utc::now();
        let mut columns: Vec<Alias> = Vec::with_capacity(assignments.len() + 2);
        let mut values: Vec<Expr> = Vec::with_capacity(assignments.len() + 2);
        for (column, value) in assignments {
            columns.push(Alias::new(column));
            values.push(value);
        }
        columns.push(Alias::new("created_at"));
        values.push(Expr::val(now));
        columns.push(Alias::new("updated_at"));
        values.push(Expr::val(now));

        let (sql, bound) = Query::insert()
            .into_table(Alias::new(meta.table_name.clone()))
            .columns(columns)
            .values(values)
            .map_err(|e| AppError::Internal(e.into()))?
            .returning_all()
            .build_sqlx(PostgresQueryBuilder);

        let row = sqlx::query_with(AssertSqlSafe(sql), bound)
            .fetch_one(&self.pool)
            .await?;
        Ok(row_to_json(&row))
    }

    /// Update with optimistic concurrency.
    ///
    /// `expected_version` comes from `If-Match: "v{n}"`. The comparison happens
    /// inside the UPDATE's WHERE clause, so the check and the write are one
    /// atomic statement — no read-then-write race (§6.12).
    pub async fn update(
        &self,
        meta: &TableMeta,
        id: Uuid,
        payload: &Map<String, Value>,
        expected_version: Option<i32>,
    ) -> AppResult<Value> {
        let assignments = self.collect_assignments(meta, payload)?;

        let mut update = Query::update();
        update.table(Alias::new(meta.table_name.clone()));

        for (column, value) in assignments {
            update.value(Alias::new(column), value);
        }
        update.value(Alias::new("updated_at"), Expr::val(Utc::now()));
        update.value(
            Alias::new("version"),
            Expr::col(Alias::new("version")).add(1),
        );

        update
            .and_where(Expr::col(Alias::new("id")).eq(id))
            .and_where(Expr::col(Alias::new("deleted_at")).is_null());

        if let Some(version) = expected_version {
            update.and_where(Expr::col(Alias::new("version")).eq(version));
        }

        let (sql, bound) = update.returning_all().build_sqlx(PostgresQueryBuilder);
        let row = sqlx::query_with(AssertSqlSafe(sql), bound)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => Ok(row_to_json(&row)),
            None if expected_version.is_some() => {
                // Zero rows with an `If-Match` present means either the row is
                // gone or someone else bumped the version. Distinguish, so a
                // deleted row still reports 404 rather than a misleading 409.
                if self.find_by_id(&meta_table(meta), id).await?.is_some() {
                    Err(AppError::version_mismatch())
                } else {
                    Err(AppError::NotFound(format!("Record {id} not found")))
                }
            }
            None => Err(AppError::NotFound(format!("Record {id} not found"))),
        }
    }

    /// Write the promotion pipeline's verdict into the managed `doc_status`
    /// columns.
    ///
    /// Separate from `update` on purpose: `doc_status` is framework-managed and
    /// the caller-facing path deliberately refuses to write it, so the pipeline
    /// needs its own door rather than an exception in the guard.
    pub async fn set_document_status(
        &self,
        table: &str,
        id: Uuid,
        status: &str,
        message: Option<&str>,
    ) -> AppResult<()> {
        let (sql, bound) = Query::update()
            .table(Alias::new(table))
            .value(Alias::new("doc_status"), Expr::val(status))
            .value(
                Alias::new("doc_status_message"),
                message.map_or_else(
                    || Expr::val(sea_query::Value::String(None)),
                    |text| Expr::val(text.to_string()),
                ),
            )
            .and_where(Expr::col(Alias::new("id")).eq(id))
            .build_sqlx(PostgresQueryBuilder);

        sqlx::query_with(AssertSqlSafe(sql), bound)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Soft delete. Returns false when the row was already gone.
    pub async fn soft_delete(&self, table: &TableName, id: Uuid) -> AppResult<bool> {
        let (sql, bound) = Query::update()
            .table(Alias::new(table.as_str()))
            .value(Alias::new("deleted_at"), Expr::val(Utc::now()))
            .and_where(Expr::col(Alias::new("id")).eq(id))
            .and_where(Expr::col(Alias::new("deleted_at")).is_null())
            .build_sqlx(PostgresQueryBuilder);

        let result = sqlx::query_with(AssertSqlSafe(sql), bound)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    /// The pool, for callers that need to issue a statement this type does not
    /// model — the promotion pipeline's workflow-run insert, for one.
    #[must_use]
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Update a row in a table named at runtime, bypassing the dictionary.
    ///
    /// For rule cascades only. The caller-facing `update` verifies every column
    /// against `sys_column` because its input is a request body; here the
    /// column names come from a rule an administrator authored, and the target
    /// table is checked against the dictionary before anything is written —
    /// so an unknown table or column is a no-op rather than an interpolated
    /// identifier.
    pub async fn update_raw(
        &self,
        table: &str,
        id: Uuid,
        values: &Map<String, Value>,
    ) -> AppResult<()> {
        let Some(columns) = self.verified_columns(table, values).await? else {
            return Ok(());
        };

        let mut update = Query::update();
        update.table(Alias::new(table));
        for (column, value) in columns {
            update.value(Alias::new(column), value);
        }
        update
            .value(Alias::new("updated_at"), Expr::val(Utc::now()))
            .and_where(Expr::col(Alias::new("id")).eq(id));

        let (sql, bound) = update.build_sqlx(PostgresQueryBuilder);
        sqlx::query_with(AssertSqlSafe(sql), bound)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Insert a row into a table named at runtime. Same reasoning as
    /// `update_raw`.
    pub async fn insert_raw(&self, table: &str, values: &Map<String, Value>) -> AppResult<()> {
        let Some(verified) = self.verified_columns(table, values).await? else {
            return Ok(());
        };

        let now = Utc::now();
        let mut columns: Vec<Alias> = Vec::with_capacity(verified.len() + 2);
        let mut bound_values: Vec<Expr> = Vec::with_capacity(verified.len() + 2);
        for (column, value) in verified {
            columns.push(Alias::new(column));
            bound_values.push(value);
        }
        columns.push(Alias::new("created_at"));
        bound_values.push(Expr::val(now));
        columns.push(Alias::new("updated_at"));
        bound_values.push(Expr::val(now));

        let (sql, bound) = Query::insert()
            .into_table(Alias::new(table))
            .columns(columns)
            .values(bound_values)
            .map_err(|err| AppError::Internal(err.into()))?
            .build_sqlx(PostgresQueryBuilder);

        sqlx::query_with(AssertSqlSafe(sql), bound)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Check a rule-supplied table and column set against the live schema.
    ///
    /// Returns `None` when the table is unknown, so a rule naming a table that
    /// does not exist is ignored instead of reaching SQL. Unknown columns are
    /// dropped for the same reason.
    async fn verified_columns(
        &self,
        table: &str,
        values: &Map<String, Value>,
    ) -> AppResult<Option<Vec<(String, Expr)>>> {
        // `data_type` as well as the name: a rule payload is plain JSON with no
        // type information attached, so the live schema is the only thing that
        // can say a string is meant to land in a `timestamptz`. Binding it as
        // text instead makes Postgres refuse the whole statement, and because
        // rule actions are fail-open the only trace is a log line.
        let known: Vec<(String, String)> = sqlx::query_as(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
        )
        .bind(table)
        .fetch_all(&self.pool)
        .await?;

        if known.is_empty() {
            crate::log_event!(rules_target_unknown, table);
            return Ok(None);
        }

        let mut assignments = Vec::new();
        for (key, value) in values {
            if is_managed_column(key) {
                continue;
            }
            let Some((_, data_type)) = known.iter().find(|(name, _)| name == key) else {
                crate::log_event!(rules_target_unknown, table, column = key);
                continue;
            };
            assignments.push((key.clone(), raw_json_to_expr(value, data_type)));
        }
        Ok((!assignments.is_empty()).then_some(assignments))
    }

    /// Remove a row outright.
    ///
    /// Not for user deletes — those are `soft_delete`, so the record stays
    /// auditable. This is for a draft the promotion pipeline refused: it was
    /// never a record from the user's point of view, and leaving a tombstone
    /// for a write that was rejected would clutter every list with rows nobody
    /// created.
    pub async fn hard_delete(&self, table: &TableName, id: Uuid) -> AppResult<bool> {
        let (sql, bound) = Query::delete()
            .from_table(Alias::new(table.as_str()))
            .and_where(Expr::col(Alias::new("id")).eq(id))
            .build_sqlx(PostgresQueryBuilder);

        let result = sqlx::query_with(AssertSqlSafe(sql), bound)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    /// Map a JSON payload onto dictionary-verified column assignments,
    /// silently dropping framework-managed columns and rejecting unknown ones.
    fn collect_assignments(
        &self,
        meta: &TableMeta,
        payload: &Map<String, Value>,
    ) -> AppResult<Vec<(String, Expr)>> {
        let mut assignments = Vec::new();
        for (key, value) in payload {
            if is_managed_column(key) {
                continue;
            }
            let Some(column) = meta.column(key) else {
                return Err(AppError::BadRequest(format!("Unknown field '{key}'")));
            };
            if !column.is_updateable {
                continue;
            }
            assignments.push((column.column_name.clone(), json_to_expr(column, value)?));
        }
        Ok(assignments)
    }
}

/// Reject a create that omits a column the dictionary marks mandatory.
///
/// Postgres would reject it anyway, and `From<sqlx::Error>` now turns a
/// `23502` into a 400 rather than a 500. This runs first so the message can
/// name *every* missing field at once, from the dictionary, instead of the one
/// column the database happened to notice — a form with three empty required
/// inputs should be told so in one round trip.
///
/// Only creates are checked. An update supplies a partial payload by design;
/// a column it does not mention keeps the value it already had.
fn require_mandatory_columns(meta: &TableMeta, payload: &Map<String, Value>) -> AppResult<()> {
    let missing: Vec<String> = meta
        .writable_columns()
        .filter(|column| column.is_mandatory)
        // A column with a default is satisfied by that default.
        .filter(|column| column.default_value.is_none())
        .filter(
            |column| !matches!(payload.get(&column.column_name), Some(value) if !is_blank(value)),
        )
        .map(|column| format!("'{}' is required", column.column_name))
        .collect();

    if missing.is_empty() {
        return Ok(());
    }
    Err(AppError::Validation {
        message: "Validation failed".to_string(),
        errors: missing,
    })
}

/// An empty string counts as absent. HTML forms submit `""` for an untouched
/// text input, and storing that in a mandatory column satisfies `NOT NULL`
/// while meaning nothing.
fn is_blank(value: &Value) -> bool {
    match value {
        Value::Null => true,
        Value::String(s) => s.trim().is_empty(),
        _ => false,
    }
}

/// Bind a rule-supplied value against the column's real Postgres type.
///
/// Unlike `json_to_expr` there is no `ColumnMeta` here — a rule names a column
/// on *another* table — so `data_type` from `information_schema` stands in for
/// it. JSON alone is not enough: a date, a timestamp and a uuid all arrive as
/// strings, and Postgres will not coerce a text parameter into any of them.
pub fn raw_json_to_expr(value: &Value, data_type: &str) -> Expr {
    let Value::String(text) = value else {
        return match value {
            Value::Null => typed_null_for_data_type(data_type),
            Value::Bool(b) => Expr::val(*b),
            Value::Number(n) => n
                .as_i64()
                .map_or_else(|| Expr::val(n.as_f64().unwrap_or_default()), Expr::val),
            other => Expr::val(other.clone()),
        };
    };

    // `data_type` is the SQL standard spelling — "timestamp with time zone",
    // not "timestamptz" — so match on that, and fall back to text for anything
    // Postgres can coerce on its own (varchar, text, numeric from a string).
    match data_type {
        "uuid" => uuid::Uuid::parse_str(text).map_or_else(|_| Expr::val(text.clone()), Expr::val),
        "date" => parse_date(text).map_or_else(|| Expr::val(text.clone()), Expr::val),
        "timestamp with time zone" | "timestamp without time zone" => {
            parse_datetime(text).map_or_else(|| Expr::val(text.clone()), Expr::val)
        }
        "boolean" => match text.as_str() {
            "true" | "t" | "1" => Expr::val(true),
            "false" | "f" | "0" => Expr::val(false),
            _ => Expr::val(text.clone()),
        },
        "integer" | "bigint" | "smallint" => text
            .parse::<i64>()
            .map_or_else(|_| Expr::val(text.clone()), Expr::val),
        "json" | "jsonb" => {
            serde_json::from_str::<Value>(text).map_or_else(|_| Expr::val(text.clone()), Expr::val)
        }
        _ => Expr::val(text.clone()),
    }
}

fn meta_table(meta: &TableMeta) -> TableName {
    // `TableMeta.table_name` came from `sys_table`, so re-wrapping it is sound.
    // Going through the dictionary again would be a redundant round trip on an
    // error path that has already failed once.
    TableName::from_verified(meta.table_name.clone())
}

fn filter_condition(filter: &Filter) -> Expr {
    let column = Expr::col(Alias::new(filter.column.clone()));
    match filter.op {
        FilterOp::Equals => column.eq(filter.value.clone()),
        FilterOp::Gt => column.gt(filter.value.clone()),
        FilterOp::Gte => column.gte(filter.value.clone()),
        FilterOp::Lt => column.lt(filter.value.clone()),
        FilterOp::Lte => column.lte(filter.value.clone()),
        FilterOp::Contains => column.like(format!("%{}%", escape_like(&filter.value))),
        FilterOp::StartsWith => column.like(format!("{}%", escape_like(&filter.value))),
        FilterOp::EndsWith => column.like(format!("%{}", escape_like(&filter.value))),
    }
}

/// OR together an ILIKE across every text-ish column, matching the TypeScript
/// `search` behaviour.
fn search_condition(meta: &TableMeta, term: &str) -> Option<Expr> {
    let pattern = format!("%{}%", escape_like(term));
    meta.columns
        .iter()
        .filter(|c| {
            c.sys_reference_id
                .is_some_and(|id| SEARCHABLE_REFERENCE_IDS.contains(&id))
        })
        .map(|c| Expr::col(Alias::new(c.column_name.clone())).ilike(pattern.clone()))
        .reduce(|left, right| left.or(right))
}

/// Escape LIKE wildcards in user input so a search for "50%" does not match
/// everything. Postgres' default escape character is a backslash.
fn escape_like(input: &str) -> String {
    input
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}

/// Convert an incoming JSON value to a bound SQL value, coercing according to
/// the column's `sys_reference_id`. This is the runtime type coercion
/// `BusService.validateData` performed (§6.10 layer 2).
/// Accept the spellings a browser actually sends for a date.
///
/// `<input type="date">` produces `YYYY-MM-DD`, but a round-tripped record
/// carries the full timestamp the API returned — rejecting that would make
/// "load a record, save it unchanged" fail.
fn parse_date(raw: &str) -> Option<chrono::NaiveDate> {
    if let Ok(date) = chrono::NaiveDate::parse_from_str(raw, "%Y-%m-%d") {
        return Some(date);
    }
    parse_datetime(raw).map(|dt| dt.date_naive())
}

/// Likewise for timestamps: RFC 3339 first, then the two shapes
/// `<input type="datetime-local">` emits, then a bare date at midnight UTC.
fn parse_datetime(raw: &str) -> Option<chrono::DateTime<Utc>> {
    if let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(raw) {
        return Some(parsed.with_timezone(&Utc));
    }
    for format in [
        "%Y-%m-%dT%H:%M:%S%.f",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M:%S%.f",
    ] {
        if let Ok(naive) = chrono::NaiveDateTime::parse_from_str(raw, format) {
            return Some(chrono::DateTime::from_naive_utc_and_offset(naive, Utc));
        }
    }
    chrono::NaiveDate::parse_from_str(raw, "%Y-%m-%d")
        .ok()
        .and_then(|date| date.and_hms_opt(0, 0, 0))
        .map(|naive| chrono::DateTime::from_naive_utc_and_offset(naive, Utc))
}

/// A NULL of the column's own type.
///
/// Binding every NULL as `Value::String(None)` sends an untyped text parameter,
/// and Postgres refuses to compare or store text against a `numeric`, `date`,
/// `uuid`, `boolean` or `jsonb` column — it raises 42804 `datatype_mismatch`,
/// which surfaced as `400 A value has the wrong type or format`. The effect was
/// that an optional field could never be cleared: the form's own number input
/// emits `null` when you empty it, and the backend rejected its own UI's
/// request. `None::<T>` gives sea-query the typed NULL it needs.
fn typed_null(reference_id: i32) -> Expr {
    match reference_id {
        // INTEGER
        11 => Expr::val(None::<i32>),
        // AMOUNT
        12 => Expr::val(None::<f64>),
        // ID / TABLE / TABLE_DIRECT — UUID columns
        13 | 18 | 19 => Expr::val(None::<Uuid>),
        // DATE
        15 => Expr::val(None::<chrono::NaiveDate>),
        // DATETIME
        16 => Expr::val(None::<chrono::DateTime<Utc>>),
        // YES_NO
        20 => Expr::val(None::<bool>),
        // JSON
        28 => Expr::val(sea_query::Value::Json(None)),
        // Everything else is a string column.
        _ => Expr::val(None::<String>),
    }
}

/// The same, keyed by `information_schema.data_type` rather than a reference id.
fn typed_null_for_data_type(data_type: &str) -> Expr {
    match data_type {
        "uuid" => Expr::val(None::<Uuid>),
        "date" => Expr::val(None::<chrono::NaiveDate>),
        "timestamp with time zone" | "timestamp without time zone" => {
            Expr::val(None::<chrono::DateTime<Utc>>)
        }
        "boolean" => Expr::val(None::<bool>),
        "integer" | "bigint" | "smallint" => Expr::val(None::<i64>),
        "numeric" | "real" | "double precision" => Expr::val(None::<f64>),
        "json" | "jsonb" => Expr::val(sea_query::Value::Json(None)),
        _ => Expr::val(None::<String>),
    }
}

fn json_to_expr(column: &ColumnMeta, value: &Value) -> AppResult<Expr> {
    if value.is_null() {
        if column.is_mandatory {
            return Err(AppError::Validation {
                message: "Validation failed".to_string(),
                errors: vec![format!("{} is required", column.name)],
            });
        }
        return Ok(typed_null(column.sys_reference_id.unwrap_or(10)));
    }

    let reference_id = column.sys_reference_id.unwrap_or(10);
    let invalid = |expected: &str| AppError::Validation {
        message: "Validation failed".to_string(),
        errors: vec![format!("{} must be {expected}", column.name)],
    };

    Ok(match reference_id {
        // INTEGER
        11 => {
            let n = value.as_i64().ok_or_else(|| invalid("an integer"))?;
            let n = i32::try_from(n).map_err(|_| invalid("a 32-bit integer"))?;
            Expr::val(n)
        }
        // AMOUNT
        12 => {
            let n = value.as_f64().ok_or_else(|| invalid("a number"))?;
            Expr::val(n)
        }
        // ID / TABLE / TABLE_DIRECT — UUID columns
        13 | 18 | 19 => {
            let raw = value.as_str().ok_or_else(|| invalid("a UUID string"))?;
            let uuid = Uuid::parse_str(raw).map_err(|_| invalid("a valid UUID"))?;
            Expr::val(uuid)
        }
        // DATE — a `date` column. Postgres will not coerce text into it, so
        // binding the string straight through fails with `column "x" is of
        // type date but expression is of type text`, which surfaced as a 500.
        15 => {
            let raw = value.as_str().ok_or_else(|| invalid("a date string"))?;
            Expr::val(parse_date(raw).ok_or_else(|| invalid("a valid date (YYYY-MM-DD)"))?)
        }
        // DATETIME — a `timestamptz` column, same reasoning.
        16 => {
            let raw = value
                .as_str()
                .ok_or_else(|| invalid("a timestamp string"))?;
            Expr::val(parse_datetime(raw).ok_or_else(|| invalid("a valid RFC 3339 timestamp"))?)
        }
        // YES_NO
        20 => {
            let b = value.as_bool().ok_or_else(|| invalid("a boolean"))?;
            Expr::val(b)
        }
        // JSON
        28 => Expr::val(value.clone()),
        // Everything else is a string column. Numbers and booleans are
        // stringified rather than rejected, matching the TypeScript coercion.
        _ => {
            let text = match value {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            };
            if let Some(max) = column.field_length {
                if i32::try_from(text.chars().count()).unwrap_or(i32::MAX) > max {
                    return Err(AppError::Validation {
                        message: "Validation failed".to_string(),
                        errors: vec![format!("{} exceeds maximum length of {max}", column.name)],
                    });
                }
            }
            Expr::val(text)
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filter_operators_are_a_closed_set() {
        assert!(FilterOp::parse("eq").is_ok());
        assert!(FilterOp::parse("contains").is_ok());
        // Anything outside the whitelist must not reach SQL.
        assert!(FilterOp::parse("; DROP TABLE bus_customer --").is_err());
        assert!(FilterOp::parse("regex").is_err());
    }

    #[test]
    fn like_wildcards_in_user_input_are_escaped() {
        assert_eq!(escape_like("50%"), "50\\%");
        assert_eq!(escape_like("a_b"), "a\\_b");
        assert_eq!(escape_like(r"back\slash"), r"back\\slash");
    }

    #[test]
    fn pagination_offset_is_one_based() {
        let opts = PaginationOptions {
            page: 1,
            limit: 25,
            ..Default::default()
        };
        assert_eq!(opts.offset(), 0);
        let opts = PaginationOptions {
            page: 3,
            limit: 25,
            ..Default::default()
        };
        assert_eq!(opts.offset(), 50);
    }
}

#[cfg(test)]
mod temporal_tests {
    use super::*;

    /// Every spelling a browser or a round-tripped record can send. Binding any
    /// of these as text made Postgres reject the whole write with
    /// `column "x" is of type date but expression is of type text` — a 500 on
    /// what was really valid input.
    #[test]
    fn dates_accept_both_the_input_format_and_a_round_tripped_timestamp() {
        assert_eq!(
            parse_date("2026-12-01"),
            chrono::NaiveDate::from_ymd_opt(2026, 12, 1)
        );
        assert_eq!(
            parse_date("2026-12-01T00:00:00Z"),
            chrono::NaiveDate::from_ymd_opt(2026, 12, 1)
        );
        assert_eq!(parse_date("not a date"), None);
        assert_eq!(parse_date(""), None);
    }

    #[test]
    fn timestamps_accept_rfc3339_and_the_datetime_local_shapes() {
        assert!(parse_datetime("2026-12-01T09:30:00Z").is_some());
        assert!(parse_datetime("2026-12-01T09:30:00+02:00").is_some());
        // What `<input type="datetime-local">` submits — no zone at all.
        assert!(parse_datetime("2026-12-01T09:30").is_some());
        assert!(parse_datetime("2026-12-01T09:30:00.123").is_some());
        // A bare date lands at midnight rather than failing.
        assert_eq!(
            parse_datetime("2026-12-01").map(|d| d.date_naive()),
            chrono::NaiveDate::from_ymd_opt(2026, 12, 1)
        );
        assert!(parse_datetime("yesterday").is_none());
    }

    /// An offset timestamp normalises to UTC rather than keeping its zone, so
    /// two clients in different zones write the same instant.
    #[test]
    fn offsets_normalise_to_utc() {
        let with_offset = parse_datetime("2026-12-01T09:30:00+02:00").unwrap();
        let as_utc = parse_datetime("2026-12-01T07:30:00Z").unwrap();
        assert_eq!(with_offset, as_utc);
    }
}
