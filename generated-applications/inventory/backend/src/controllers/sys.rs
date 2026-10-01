//! Application Dictionary CRUD — the `sys_*` tables.
//!
//! **Deviation from §5.2 decision 1, stated plainly.** The design document
//! proposed a hand-written SeaORM entity plus controller/service pair for each
//! of the thirteen dictionary tables. This implements them instead as one
//! generic handler over a compile-time `SysTable` registry, because:
//!
//! * The thirteen controllers are pure CRUD over fixed-shape tables. The
//!   entity-per-table version is ~3,500 lines of near-identical code whose only
//!   real content is the table name and primary key — exactly the shape that
//!   rots when one copy gets a fix and twelve do not.
//! * The registry is still compile-time. Table and column names are `&'static
//!   str` constants in this file, never request data, so the safety property
//!   that motivated typed entities is preserved.
//! * `sys_reference` has an `INTEGER` primary key while the rest use `UUID`.
//!   The registry makes that a one-line difference instead of a divergent
//!   module.
//!
//! Where a dictionary table later grows real business logic, give *that* table
//! a typed entity and a dedicated handler; nothing here prevents it.
//!
//! **Cache invalidation is the load-bearing part.** Every write goes through
//! `invalidate_for`, because the product promise is that reordering a field
//! takes effect without a redeploy (§6.4).

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use loco_rs::prelude::*;
use sea_query::{
    extension::postgres::PgExpr, Alias, Asterisk, Condition, Expr, ExprTrait, Func, Order,
    PostgresQueryBuilder, Query as SeaQuery,
};
use sea_query_sqlx::SqlxBinder;
use serde_json::{json, Map, Value};
use sqlx::{AssertSqlSafe, PgPool, Row};
use std::collections::HashMap;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;
use crate::services::authz;
use crate::services::dictionary::DictionaryCache;
use crate::services::system_config::SystemConfig;
use crate::services::field_meta::{self, FieldLayout};

/// How a dictionary table is addressed over HTTP and in SQL.
#[derive(Clone, Copy, Debug)]
pub struct SysTable {
    /// URL segment, e.g. `tables` in `/api/sys/tables`.
    pub segment: &'static str,
    /// Physical table name.
    pub table: &'static str,
    /// Primary key column.
    pub pk: &'static str,
    /// Primary keys are UUIDs everywhere except `sys_reference`, which uses a
    /// caller-supplied INTEGER (the reference-type id is a stable vocabulary).
    pub integer_pk: bool,
    /// Default ordering, chosen to match what each TypeScript controller
    /// returned so list responses keep their existing order.
    pub order_by: &'static str,
}

/// The dictionary surface. Segments mirror the NestJS `@Controller('sys/…')`
/// prefixes exactly — these are part of the frozen API contract (§9).
pub const SYS_TABLES: &[SysTable] = &[
    SysTable { segment: "tables",      table: "sys_table",      pk: "sys_table_id",      integer_pk: false, order_by: "table_name" },
    SysTable { segment: "columns",     table: "sys_column",     pk: "sys_column_id",     integer_pk: false, order_by: "seq_no" },
    SysTable { segment: "fields",      table: "sys_field",      pk: "sys_field_id",      integer_pk: false, order_by: "seq_no" },
    SysTable { segment: "tabs",        table: "sys_tab",        pk: "sys_tab_id",        integer_pk: false, order_by: "seq_no" },
    SysTable { segment: "windows",     table: "sys_window",     pk: "sys_window_id",     integer_pk: false, order_by: "name" },
    SysTable { segment: "references",  table: "sys_reference",  pk: "sys_reference_id",  integer_pk: true,  order_by: "sys_reference_id" },
    // Ordered by `value`, not `seq_no`: `sys_ref_list` has no sequence column —
    // a reference list is a value vocabulary, and its natural order is the
    // value itself.
    SysTable { segment: "ref-lists",   table: "sys_ref_list",   pk: "sys_ref_list_id",   integer_pk: false, order_by: "value" },
    SysTable { segment: "roles",       table: "sys_role",       pk: "sys_role_id",       integer_pk: false, order_by: "name" },
    SysTable { segment: "users",       table: "sys_user",       pk: "sys_user_id",       integer_pk: false, order_by: "email" },
    SysTable { segment: "user-roles",  table: "sys_user_roles", pk: "sys_user_roles_id", integer_pk: false, order_by: "sys_user_id" },
    SysTable { segment: "access",      table: "sys_access",     pk: "sys_access_id",     integer_pk: false, order_by: "sys_role_id" },
    SysTable { segment: "val-rules",   table: "sys_val_rule",   pk: "sys_val_rule_id",   integer_pk: false, order_by: "name" },
    SysTable { segment: "categories",  table: "sys_category",   pk: "sys_category_id",   integer_pk: false, order_by: "seq_no" },
    // Below the NestJS thirteen. These tables were always in the schema and the
    // frontend always read them; the TypeScript stack reached them through
    // hand-written controllers that this generic one subsumes.
    SysTable { segment: "elements",     table: "sys_element",     pk: "sys_element_id",     integer_pk: false, order_by: "column_name" },
    SysTable { segment: "field-groups", table: "sys_field_group", pk: "sys_field_group_id", integer_pk: false, order_by: "seq_no" },
    SysTable { segment: "ref-tables",   table: "sys_ref_table",   pk: "sys_ref_table_id",   integer_pk: false, order_by: "sys_reference_id" },
    // The report designer's saved layouts. Served by the same generic five
    // verbs as every other dictionary resource: `layout` is opaque JSONB the
    // designer owns, so there is nothing here for a bespoke controller to do
    // that this one does not — and a layout format the API validates is a
    // layout format the API has to be redeployed to change.
    SysTable { segment: "report-designs", table: "sys_report_designs", pk: "sys_report_design_id", integer_pk: false, order_by: "table_name" },
    // Configuration an operator may change at run time. Served here rather than
    // by a controller of its own: it is a `sys_*` table with a name, an id and
    // rows to edit, which is exactly what this route already does — and a
    // bespoke endpoint would need its own paging, filtering and openapi entry
    // to end up in the same place.
    SysTable { segment: "system",      table: "sys_system",     pk: "sys_system_id",     integer_pk: false, order_by: "category" },
];

/// URL segments that mean the same table as another segment.
///
/// `/sys/ref-list` and `/sys/ref-lists` both appear in the frontend, written
/// years apart. Aliasing is cheaper than a migration of every call site, and
/// removing one would be a contract break for anything already calling it.
const SEGMENT_ALIASES: &[(&str, &str)] = &[
    ("ref-list", "ref-lists"),
    ("field-group", "field-groups"),
    ("element", "elements"),
];

fn lookup(segment: &str) -> AppResult<&'static SysTable> {
    let canonical = SEGMENT_ALIASES
        .iter()
        .find(|(alias, _)| *alias == segment)
        .map_or(segment, |(_, target)| *target);

    SYS_TABLES
        .iter()
        .find(|t| t.segment == canonical)
        .ok_or_else(|| AppError::NotFound(format!("Unknown dictionary resource '{segment}'")))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// Default page size. Higher than the business default of 25 because the
/// dictionary tables are small and the UI reads whole lists out of them — the
/// navigation is built from every `sys_window`, not from the first page of
/// them.
const DEFAULT_LIMIT: u64 = 200;
/// Upper bound so a caller cannot ask for an unbounded scan.
const MAX_LIMIT: u64 = 1000;

/// Query parameters that steer the query rather than filter it. Everything
/// else is treated as a column predicate.
const RESERVED_PARAMS: &[&str] = &[
    "limit",
    "page",
    "offset",
    "sort",
    "order",
    "orderBy",
    "orderDir",
    "search",
    "prefix",
    "includeHidden",
    "entity",
];

/// Shorthands the frontend uses for foreign keys. `?table_id=` reads better in
/// a URL than `?sys_table_id=`, and both stacks accepted it.
const PARAM_ALIASES: &[(&str, &str)] = &[
    ("table_id", "sys_table_id"),
    ("tab_id", "sys_tab_id"),
    ("window_id", "sys_window_id"),
    ("column_id", "sys_column_id"),
    ("field_id", "sys_field_id"),
    ("reference_id", "sys_reference_id"),
    ("field_group_id", "sys_field_group_id"),
    ("category_id", "sys_category_id"),
    ("role_id", "sys_role_id"),
    ("user_id", "sys_user_id"),
];

/// Columns a `?search=` sweeps, when the table has them.
const SEARCHABLE_COLUMNS: &[&str] = &[
    "name",
    "table_name",
    "column_name",
    "description",
    "email",
    "value",
    "code",
];

/// `GET /api/sys/{segment}` — one dictionary table, paged.
#[utoipa::path(
    get, path = "/api/sys/{segment}", tag = "sys",
    params(
        ("segment" = String, Path, description = "Dictionary resource — `tables`, `columns`, `fields`, `tabs`, `windows`, `references`, `ref-lists`, `roles`, `users`, `user-roles`, `access`, `val-rules`, `categories`, `elements`, `field-groups`, `ref-tables`, `system`"),
        ("limit" = Option<i64>, Query, description = "Page size, clamped"),
        ("page" = Option<i64>, Query, description = "1-based page number"),
        ("offset" = Option<i64>, Query, description = "Row offset; overrides `page`"),
        ("sort" = Option<String>, Query, description = "Column to order by; falls back to the resource's natural order"),
        ("order" = Option<String>, Query, description = "`asc` or `desc`"),
        ("search" = Option<String>, Query, description = "Case-insensitive match across this table's searchable columns"),
    ),
    responses(
        (status = 200, description = "`{ data, meta }` for this dictionary table"),
        (status = 404, description = "Unknown dictionary resource"),
    ),
)]
pub async fn list(
    Path(segment): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let spec = lookup(&segment)?;
    let pool = ctx.db.get_postgres_connection_pool();

    // A Table reference — an enumeration with a business table — has no rows in
    // `sys_ref_list`: its values are the table's, so a value reworded or retired
    // there is what the dropdown offers on the next request.
    if spec.table == "sys_ref_list" {
        if let Some(reference_id) = params
            .get("sys_reference_id")
            .and_then(|value| value.parse::<i32>().ok())
        {
            if let Some(items) = table_reference_values(pool, reference_id).await? {
                let total = items.len();
                return Ok(Json(json!({
                    "data": items,
                    "meta": { "total": total, "page": 1, "limit": total, "totalPages": 1 }
                }))
                .into_response());
            }
        }
    }

    let conditions = conditions_from(pool, spec, &params).await?;
    let (limit, page, offset) = pagination_from(&params);

    // Total is counted with the same predicates but without the window, so the
    // `meta` block describes the whole result set rather than the page.
    let mut count = SeaQuery::select();
    count
        .expr(Func::count(Expr::col(Asterisk)))
        .from(Alias::new(spec.table));
    for condition in conditions.clone() {
        count.cond_where(condition);
    }
    let (count_sql, count_values) = count.build_sqlx(PostgresQueryBuilder);
    let total: i64 = sqlx::query_scalar_with(AssertSqlSafe(count_sql), count_values)
        .fetch_one(pool)
        .await?;
    let total = u64::try_from(total).unwrap_or(0);

    let mut select = SeaQuery::select();
    select.column(Asterisk).from(Alias::new(spec.table));
    for condition in conditions {
        select.cond_where(condition);
    }

    let (order_column, order_dir) = ordering_from(pool, spec, &params).await?;
    select.order_by(Alias::new(order_column), order_dir);
    select.limit(limit).offset(offset);

    let (sql, values) = select.build_sqlx(PostgresQueryBuilder);
    let rows = sqlx::query_with(AssertSqlSafe(sql), values)
        .fetch_all(pool)
        .await?;

    // The envelope is the frozen contract (§9): the frontend's
    // `PaginatedResponse<T>` and the stack-agnostic `tests/` suites both read
    // `data` and `meta.total`. A bare array is a contract break, not a
    // simplification.
    Ok(Json(json!({
        "data": crate::services::row_json::rows_to_json(&rows),
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": if limit == 0 { 0 } else { total.div_ceil(limit) },
        }
    }))
    .into_response())
}

/// A name that may be written into SQL: lower-case words joined by underscores.
/// Table and column names reach this handler from the dictionary, which an
/// administrator can write, so they are checked rather than trusted.
fn is_safe_identifier(name: &str) -> bool {
    !name.is_empty()
        && name.starts_with(|c: char| c.is_ascii_lowercase())
        && name
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
}

/// An `ORDER BY` the dictionary may state: one column, optionally `asc`/`desc`.
fn safe_order_by(clause: &str) -> Option<String> {
    let mut parts = clause.split_whitespace();
    let column = parts.next()?;
    let direction = parts.next().map(str::to_ascii_lowercase);
    let valid_direction = matches!(direction.as_deref(), None | Some("asc") | Some("desc"));
    (is_safe_identifier(column) && valid_direction && parts.next().is_none()).then(|| {
        match direction {
            Some(direction) => format!("{column} {direction}"),
            None => column.to_string(),
        }
    })
}

/// The values of a Table reference, shaped like `sys_ref_list` rows, or `None`
/// when the reference is not a Table one.
///
/// Only a filter of the form `<column> = true|false` is honoured from
/// `where_clause` — the enumeration contract's `is_active = true` — because the
/// clause is text an administrator wrote and is not run as SQL.
async fn table_reference_values(pool: &PgPool, reference_id: i32) -> AppResult<Option<Vec<Value>>> {
    let definition = sqlx::query(
        "SELECT t.table_name, k.column_name AS key_column, d.column_name AS display_column, \
                rt.order_by_clause, rt.where_clause \
           FROM sys_ref_table rt \
           JOIN sys_table t ON t.sys_table_id = rt.sys_table_id \
           JOIN sys_column k ON k.sys_column_id = rt.key_column_id \
           JOIN sys_column d ON d.sys_column_id = rt.display_column_id \
          WHERE rt.sys_reference_id = $1 AND rt.is_active \
          LIMIT 1",
    )
    .bind(reference_id)
    .fetch_optional(pool)
    .await?;
    let Some(definition) = definition else {
        return Ok(None);
    };
    let table: String = definition.try_get("table_name")?;
    let key: String = definition.try_get("key_column")?;
    let display: String = definition.try_get("display_column")?;
    let order: Option<String> = definition.try_get("order_by_clause")?;
    let filter: Option<String> = definition.try_get("where_clause")?;
    if ![&table, &key, &display].iter().all(|name| is_safe_identifier(name)) {
        return Err(AppError::BadRequest(format!(
            "Reference {reference_id} names a table or column that is not a plain identifier"
        )));
    }

    let has_description: bool = sqlx::query_scalar(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns \
                         WHERE table_name = $1 AND column_name = 'description')",
    )
    .bind(&table)
    .fetch_one(pool)
    .await?;
    let description = if has_description { "description::text" } else { "NULL::text" };

    let mut sql = format!(
        "SELECT {key}::text AS value, {display}::text AS name, {description} AS description FROM {table}"
    );
    if let Some(clause) = filter.as_deref() {
        let mut words = clause.split_whitespace();
        if let (Some(column), Some("="), Some(flag), None) =
            (words.next(), words.next(), words.next(), words.next())
        {
            if is_safe_identifier(column) && matches!(flag, "true" | "false") {
                sql.push_str(&format!(" WHERE {column} = {flag}"));
            }
        }
    }
    sql.push_str(&format!(
        " ORDER BY {}, {key} LIMIT 1000",
        order.as_deref().and_then(safe_order_by).unwrap_or_else(|| display.clone())
    ));

    let rows = sqlx::query(AssertSqlSafe(sql)).fetch_all(pool).await?;
    let items = rows
        .iter()
        .map(|row| {
            let value: String = row.try_get("value").unwrap_or_default();
            json!({
                "sys_ref_list_id": value,
                "sys_reference_id": reference_id,
                "value": value,
                "name": row.try_get::<String, _>("name").unwrap_or_default(),
                "description": row.try_get::<Option<String>, _>("description").unwrap_or(None),
                "is_active": true,
            })
        })
        .collect();
    Ok(Some(items))
}

/// `GET /api/sys/{fields|columns}/{form|grid}` — the field layout for one
/// entity, by dictionary rather than by business route.
///
/// The layout editor reaches the same projection as `/api/bus/{entity}/fields/…`
/// but passes `?includeHidden=true`, because switching a hidden field back on
/// is what that screen is for.
#[utoipa::path(
    get, path = "/api/sys/fields/form", tag = "sys",
    params(
        ("entity" = String, Query, description = "The entity whose form layout is wanted; resolved through the dictionary"),
        ("includeHidden" = Option<bool>, Query, description = "Include fields switched off in the layout — what the layout editor asks for"),
    ),
    responses(
        (status = 200, description = "The form field layout"),
        (status = 400, description = "`entity` is required"),
        (status = 404, description = "No such entity in the dictionary"),
    ),
)]
pub async fn fields_form(
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    fields_layout(FieldLayout::Form, &params, &ctx).await
}

#[utoipa::path(
    get, path = "/api/sys/fields/grid", tag = "sys",
    params(
        ("entity" = String, Query, description = "The entity whose grid layout is wanted; resolved through the dictionary"),
        ("includeHidden" = Option<bool>, Query, description = "Include columns switched off in the layout — what the layout editor asks for"),
    ),
    responses(
        (status = 200, description = "The grid field layout"),
        (status = 400, description = "`entity` is required"),
        (status = 404, description = "No such entity in the dictionary"),
    ),
)]
pub async fn fields_grid(
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    fields_layout(FieldLayout::Grid, &params, &ctx).await
}

async fn fields_layout(
    layout: FieldLayout,
    params: &HashMap<String, String>,
    ctx: &AppContext,
) -> AppResult<Response> {
    let entity = params.get("entity").map(String::as_str).ok_or_else(|| {
        AppError::BadRequest("entity query parameter is required".to_string())
    })?;
    let include_hidden = truthy(params.get("includeHidden"));

    // The entity segment is resolved through the dictionary, so an unknown one
    // is a 404 before any table name reaches SQL.
    let dictionary = ctx
        .shared_store
        .get::<DictionaryCache>()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("dictionary cache not initialised")))?;
    let table = dictionary.resolve(entity).await?;

    let pool = ctx.db.get_postgres_connection_pool();
    let fields = field_meta::layout_fields(pool, table.as_str(), layout, include_hidden).await?;
    Ok(Json(fields).into_response())
}

/// `POST /api/sys/fields/batch-reorder` — persist a drag-and-drop reorder.
///
/// One transaction, because a half-applied reorder leaves the form in an order
/// nobody chose. Body: `{ "fields": [{ "sys_field_id": …, "seq_no": …,
/// "seq_no_grid": …, "is_displayed": …, "is_displayed_grid": …,
/// "sys_field_group_id": … }] }` — every key but the id is optional.
#[utoipa::path(
    post, path = "/api/sys/fields/batch-reorder", tag = "sys",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ fields: [{ sys_field_id, seq_no?, seq_no_grid?, is_displayed?, is_displayed_grid?, sys_field_group_id? }] }`"),
    responses(
        (status = 200, description = "How many field rows were moved"),
        (status = 400, description = "`fields` was not an array"),
        (status = 401, description = "Dictionary writes require a token"),
        (status = 403, description = "Dictionary writes require the master role"),
    ),
)]
pub async fn fields_batch_reorder(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();
    authz::require_dictionary_admin(&authz::principal(pool, &auth.user).await?)?;

    let items = payload
        .get("fields")
        .and_then(Value::as_array)
        .ok_or_else(|| AppError::BadRequest("fields must be an array".to_string()))?;

    let mut tx = pool.begin().await?;
    let mut updated = 0_usize;

    for item in items {
        let Some(id) = item
            .get("sys_field_id")
            .and_then(Value::as_str)
            .and_then(|v| uuid::Uuid::parse_str(v).ok())
        else {
            return Err(AppError::BadRequest(
                "every field needs a sys_field_id".to_string(),
            ));
        };

        // COALESCE leaves an omitted key untouched rather than nulling it, so a
        // grid reorder cannot silently clear the form order.
        let result = sqlx::query(
            r"UPDATE sys_field
                 SET seq_no            = COALESCE($2, seq_no),
                     seq_no_grid       = COALESCE($3, seq_no_grid),
                     is_displayed      = COALESCE($4, is_displayed),
                     is_displayed_grid = COALESCE($5, is_displayed_grid),
                     sys_field_group_id = COALESCE($6, sys_field_group_id),
                     updated_at        = NOW()
               WHERE sys_field_id = $1",
        )
        .bind(id)
        .bind(item.get("seq_no").and_then(Value::as_i64).map(|v| v as i32))
        .bind(
            item.get("seq_no_grid")
                .and_then(Value::as_i64)
                .map(|v| v as i32),
        )
        .bind(item.get("is_displayed").and_then(Value::as_bool))
        .bind(item.get("is_displayed_grid").and_then(Value::as_bool))
        .bind(
            item.get("sys_field_group_id")
                .and_then(Value::as_str)
                .and_then(|v| uuid::Uuid::parse_str(v).ok()),
        )
        .execute(&mut *tx)
        .await?;
        updated += usize::try_from(result.rows_affected()).unwrap_or(0);
    }

    tx.commit().await?;

    if let Some(cache) = ctx.shared_store.get::<DictionaryCache>() {
        cache.invalidate_all();
    }
    Ok(Json(json!({ "updated": updated })).into_response())
}

/// `GET /api/sys/columns/direct?tableName=…` — columns for one table by name.
///
/// The workflow canvas needs a column list for a table it only knows by name,
/// and resolving `table_name` → `sys_table_id` → `/sys/columns?table_id=` from
/// the browser is two round trips for one list.
#[utoipa::path(
    get, path = "/api/sys/columns/direct", tag = "sys",
    params(("tableName" = String, Query, description = "Physical table name, e.g. `bus_compound`")),
    responses(
        (status = 200, description = "`{ data }` — that table's columns"),
        (status = 400, description = "`tableName` is required"),
    ),
)]
pub async fn columns_direct(
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let table_name = params
        .get("tableName")
        .or_else(|| params.get("table_name"))
        .ok_or_else(|| AppError::BadRequest("tableName is required".to_string()))?;

    let pool = ctx.db.get_postgres_connection_pool();
    let rows = sqlx::query(
        r"SELECT c.*
            FROM sys_column c
            JOIN sys_table  t ON t.sys_table_id = c.sys_table_id
           WHERE t.table_name = $1 AND COALESCE(c.is_active, true) = true
           ORDER BY c.seq_no NULLS LAST, c.column_name",
    )
    .bind(table_name)
    .fetch_all(pool)
    .await?;

    Ok(Json(json!({ "data": crate::services::row_json::rows_to_json(&rows) })).into_response())
}

/// `GET /api/sys/window-help/{table_name}` — window, tab and field help text.
#[utoipa::path(
    get, path = "/api/sys/window-help/{table_name}", tag = "sys",
    params(("table_name" = String, Path, description = "Physical table name")),
    responses(
        (status = 200, description = "Window, tab and field help text for that entity"),
        (status = 404, description = "No such table in the dictionary"),
    ),
)]
pub async fn window_help(
    Path(table_name): Path<String>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let dictionary = ctx
        .shared_store
        .get::<DictionaryCache>()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("dictionary cache not initialised")))?;
    let table = dictionary.resolve(&table_name).await?;

    let pool = ctx.db.get_postgres_connection_pool();
    Ok(Json(field_meta::window_help(pool, table.as_str()).await?).into_response())
}

/// `GET /api/sys/categories/with-entities` — the dashboard's grouping.
///
/// Every active category with the business tables assigned to it, plus a
/// synthetic trailing group for the tables nobody has categorised. Without that
/// group a new entity would be invisible on the dashboard until an
/// administrator filed it, which is the wrong default.
#[utoipa::path(
    get, path = "/api/sys/categories/with-entities", tag = "sys",
    responses((status = 200, description = "`{ data }` — active categories with their tables, plus a trailing uncategorised group")),
)]
pub async fn categories_with_entities(State(ctx): State<AppContext>) -> AppResult<Response> {
    let pool = ctx.db.get_postgres_connection_pool();

    let categories = sqlx::query(
        r"SELECT sys_category_id, name, code, description, icon, color, seq_no
            FROM sys_category
           WHERE COALESCE(is_active, true) = true
           ORDER BY seq_no NULLS LAST, name",
    )
    .fetch_all(pool)
    .await?;

    let tables = sqlx::query(
        r"SELECT * FROM sys_table
           WHERE COALESCE(is_active, true) = true
             AND table_name LIKE 'bus\_%'
           ORDER BY name",
    )
    .fetch_all(pool)
    .await?;
    let tables: Vec<Value> = crate::services::row_json::rows_to_json(&tables);

    let mut groups: Vec<Value> = Vec::with_capacity(categories.len() + 1);
    let mut claimed: Vec<String> = Vec::new();

    for category in &categories {
        let mut group = crate::services::row_json::row_to_json(category);
        let id = group
            .get("sys_category_id")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let entities: Vec<Value> = tables
            .iter()
            .filter(|t| t.get("sys_category_id").and_then(Value::as_str) == Some(id.as_str()))
            .cloned()
            .collect();
        for entity in &entities {
            if let Some(name) = entity.get("table_name").and_then(Value::as_str) {
                claimed.push(name.to_string());
            }
        }

        if let Some(object) = group.as_object_mut() {
            object.insert("entities".into(), Value::Array(entities));
        }
        groups.push(group);
    }

    let uncategorised: Vec<Value> = tables
        .iter()
        .filter(|t| {
            t.get("table_name")
                .and_then(Value::as_str)
                .is_none_or(|name| !claimed.iter().any(|c| c == name))
        })
        .cloned()
        .collect();

    if !uncategorised.is_empty() {
        groups.push(json!({
            "sys_category_id": Value::Null,
            "name": "Uncategorised",
            "code": "UNCATEGORISED",
            "description": Value::Null,
            "icon": Value::Null,
            "color": Value::Null,
            "entities": uncategorised,
        }));
    }

    Ok(Json(json!({ "data": groups })).into_response())
}

/// `GET /api/sys/categories/{id}/entities` — the tables filed under one category.
#[utoipa::path(
    get, path = "/api/sys/categories/{id}/entities", tag = "sys",
    params(("id" = String, Path, description = "Category UUID")),
    responses(
        (status = 200, description = "`{ data }` — the tables filed under this category"),
        (status = 400, description = "The id was not a UUID"),
    ),
)]
pub async fn category_entities(
    Path(id): Path<String>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let category = uuid::Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("category id must be a UUID".to_string()))?;

    let pool = ctx.db.get_postgres_connection_pool();
    let rows = sqlx::query(
        r"SELECT * FROM sys_table
           WHERE sys_category_id = $1 AND COALESCE(is_active, true) = true
           ORDER BY name",
    )
    .bind(category)
    .fetch_all(pool)
    .await?;

    Ok(Json(json!({ "data": crate::services::row_json::rows_to_json(&rows) })).into_response())
}

/// `POST /api/sys/categories/unassign` — clear the category on some tables.
///
/// Body: `{ "tableIds": ["…"] }`. Separate from the generic `PUT` because the
/// admin UI unassigns several tables in one gesture.
#[utoipa::path(
    post, path = "/api/sys/categories/unassign", tag = "sys",
    security(("bearer" = [])),
    request_body(content = serde_json::Value, description = "`{ tableIds: [\"…\"] }`"),
    responses(
        (status = 200, description = "How many tables were unfiled"),
        (status = 401, description = "Dictionary writes require a token"),
        (status = 403, description = "Dictionary writes require the master role"),
    ),
)]
pub async fn categories_unassign(
    auth: auth::JWTWithUser<users::Model>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    authz::require_dictionary_admin(
        &authz::principal(ctx.db.get_postgres_connection_pool(), &auth.user).await?,
    )?;

    let ids: Vec<uuid::Uuid> = payload
        .get("tableIds")
        .or_else(|| payload.get("sys_table_ids"))
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .filter_map(|v| uuid::Uuid::parse_str(v).ok())
                .collect()
        })
        .unwrap_or_default();

    if ids.is_empty() {
        return Err(AppError::BadRequest(
            "tableIds must be a non-empty array of UUIDs".to_string(),
        ));
    }

    let pool = ctx.db.get_postgres_connection_pool();
    let result = sqlx::query("UPDATE sys_table SET sys_category_id = NULL WHERE sys_table_id = ANY($1)")
        .bind(&ids)
        .execute(pool)
        .await?;

    if let Some(cache) = ctx.shared_store.get::<DictionaryCache>() {
        cache.invalidate_all();
    }
    Ok(Json(json!({ "unassigned": result.rows_affected() })).into_response())
}

/// `GET /api/sys/{segment}/{id}` — one dictionary row.
#[utoipa::path(
    get, path = "/api/sys/{segment}/{id}", tag = "sys",
    params(
        ("segment" = String, Path, description = "Dictionary resource"),
        ("id" = String, Path, description = "Primary key — a UUID, or an integer for `references`"),
    ),
    responses(
        (status = 200, description = "The row"),
        (status = 404, description = "Unknown resource, or no such row"),
    ),
)]
pub async fn get_one(
    Path((segment, id)): Path<(String, String)>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let spec = lookup(&segment)?;
    let pool = ctx.db.get_postgres_connection_pool();

    let row = fetch_one(pool, spec, &id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("{} {id} not found", spec.segment)))?;
    Ok(Json(row).into_response())
}

/// `POST /api/sys/{segment}` — add a dictionary row.
#[utoipa::path(
    post, path = "/api/sys/{segment}", tag = "sys",
    security(("bearer" = [])),
    params(("segment" = String, Path, description = "Dictionary resource")),
    request_body(content = serde_json::Value, description = "The row's writable columns"),
    responses(
        (status = 201, description = "The stored row"),
        (status = 400, description = "No writable fields, or a column rejected the value"),
        (status = 401, description = "Dictionary writes require a token"),
        (status = 403, description = "Dictionary writes require the master role"),
        (status = 404, description = "Unknown dictionary resource"),
    ),
)]
pub async fn create(
    auth: auth::JWTWithUser<users::Model>,
    Path(segment): Path<String>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let spec = lookup(&segment)?;
    let pool = ctx.db.get_postgres_connection_pool();
    authz::require_dictionary_admin(&authz::principal(pool, &auth.user).await?)?;
    let body = as_object(payload)?;

    let assignments = verified_assignments(pool, spec, &body, true).await?;
    if assignments.is_empty() {
        return Err(AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec!["No writable fields supplied".to_string()],
        });
    }

    let mut columns = Vec::with_capacity(assignments.len());
    let mut values = Vec::with_capacity(assignments.len());
    for (column, value) in assignments {
        columns.push(Alias::new(column));
        values.push(value);
    }

    let (sql, bound) = SeaQuery::insert()
        .into_table(Alias::new(spec.table))
        .columns(columns)
        .values(values)
        .map_err(|err| AppError::Internal(err.into()))?
        .returning_all()
        .build_sqlx(PostgresQueryBuilder);

    let row = sqlx::query_with(AssertSqlSafe(sql), bound)
        .fetch_one(pool)
        .await?;

    // A table with no window has no screen, and a column with no field is
    // invisible on the one it has. The seed pairs them at generation time; this
    // does the same for anything added afterwards.
    provision_ui_for(pool, spec, &row).await?;

    invalidate_for(&ctx, spec).await;
    Ok((
        StatusCode::CREATED,
        Json(crate::services::row_json::row_to_json(&row)),
    )
        .into_response())
}

/// Give a newly added table its window and tab, or a newly added column its
/// field.
///
/// The dictionary seed emits one `sys_window` and one `sys_tab` per entity and
/// one `sys_field` per column, and the whole UI is built from those rows. A
/// table added through this API afterwards used to arrive with none of them: the
/// row existed, `/api/bus/<it>` served data, and it had no screen anywhere —
/// which looks like the table was not created at all. Same for a column, which
/// simply did not appear on the form.
///
/// Deliberately quiet about what it does not do:
///
/// * If the caller supplied `sys_window_id`, they have chosen a window and
///   nothing is invented.
/// * A column whose table has no tab is left alone rather than given one. The
///   tab is a property of the table, and inventing it here from a column insert
///   would guess at a window the caller never asked for.
/// * A second call for the same column does nothing, so re-running an import
///   does not produce duplicate fields.
///
/// Failures propagate. A half-provisioned dictionary — a table whose window
/// exists but whose tab does not — renders an empty screen, which is harder to
/// diagnose than a failed request.
async fn provision_ui_for(pool: &PgPool, spec: &SysTable, row: &sqlx::postgres::PgRow) -> AppResult<()> {
    match spec.segment {
        "tables" => provision_window_and_tab(pool, row).await,
        "columns" => provision_field(pool, row).await,
        _ => Ok(()),
    }
}

/// `created_by` / `updated_by` are NOT NULL across the dictionary. Reuse what
/// the caller stamped on the row so the provisioned rows attribute to the same
/// person, rather than inventing a second actor for the same action.
fn actor(row: &sqlx::postgres::PgRow) -> String {
    row.try_get::<String, _>("created_by")
        .unwrap_or_else(|_| "system".to_string())
}

async fn provision_window_and_tab(pool: &PgPool, row: &sqlx::postgres::PgRow) -> AppResult<()> {
    let table_id: uuid::Uuid = row
        .try_get("sys_table_id")
        .map_err(|err| AppError::Internal(err.into()))?;

    let display: String = row
        .try_get::<String, _>("name")
        .or_else(|_| row.try_get::<String, _>("table_name"))
        .map_err(|err| AppError::Internal(err.into()))?;
    let by = actor(row);

    // A caller-supplied window is honoured rather than duplicated — but the tab
    // is still owed. Skipping both left a table sitting on someone else's
    // window with nothing on it, which is the same empty screen this function
    // exists to prevent.
    let supplied = row
        .try_get::<Option<uuid::Uuid>, _>("sys_window_id")
        .ok()
        .flatten();

    let window_id = match supplied {
        Some(window_id) => window_id,
        None => {
            let window_id: uuid::Uuid = sqlx::query_scalar(
                r"INSERT INTO sys_window
                      (name, description, window_type, is_default, entity_type, is_active,
                       created_by, updated_by)
                   VALUES ($1, $2, 'M', true, 'U', true, $3, $3)
                RETURNING sys_window_id",
            )
            .bind(&display)
            .bind(format!("Maintain {display} records"))
            .bind(&by)
            .fetch_one(pool)
            .await?;

            // `sys_table.sys_window_id` is what the navigation follows, so the
            // table has to point back at the window it was just given.
            sqlx::query("UPDATE sys_table SET sys_window_id = $1 WHERE sys_table_id = $2")
                .bind(window_id)
                .bind(table_id)
                .execute(pool)
                .await?;

            window_id
        }
    };

    // One tab per table. A second would put the same entity on the screen
    // twice.
    let existing_tab: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT sys_tab_id FROM sys_tab WHERE sys_table_id = $1 LIMIT 1")
            .bind(table_id)
            .fetch_optional(pool)
            .await?;
    if existing_tab.is_some() {
        return Ok(());
    }

    // On a shared window the tab goes after whatever is already there, so
    // attaching a table does not reorder someone else's screen.
    let next_seq: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(seq_no), 0) + 10 FROM sys_tab WHERE sys_window_id = $1",
    )
    .bind(window_id)
    .fetch_one(pool)
    .await
    .unwrap_or(10);

    sqlx::query(
        r"INSERT INTO sys_tab
              (sys_window_id, sys_table_id, name, tab_level, seq_no, is_single_row,
               is_insert_record, entity_type, is_active, created_by, updated_by)
           VALUES ($1, $2, $3, 0, $4, true, true, 'U', true, $5, $5)",
    )
    .bind(window_id)
    .bind(table_id)
    .bind(&display)
    .bind(next_seq)
    .bind(&by)
    .execute(pool)
    .await?;

    Ok(())
}

async fn provision_field(pool: &PgPool, row: &sqlx::postgres::PgRow) -> AppResult<()> {
    let column_id: uuid::Uuid = row
        .try_get("sys_column_id")
        .map_err(|err| AppError::Internal(err.into()))?;
    let table_id: uuid::Uuid = row
        .try_get("sys_table_id")
        .map_err(|err| AppError::Internal(err.into()))?;

    // The table's tab. No tab means no screen to put the field on — a view, or
    // a table whose window the caller has not set up yet.
    let Some(tab_id): Option<uuid::Uuid> = sqlx::query_scalar(
        "SELECT sys_tab_id FROM sys_tab WHERE sys_table_id = $1 ORDER BY seq_no LIMIT 1",
    )
    .bind(table_id)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(());
    };

    let existing: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT sys_field_id FROM sys_field WHERE sys_column_id = $1")
            .bind(column_id)
            .fetch_optional(pool)
            .await?;
    if existing.is_some() {
        return Ok(());
    }

    let display: String = row
        .try_get::<String, _>("name")
        .or_else(|_| row.try_get::<String, _>("column_name"))
        .map_err(|err| AppError::Internal(err.into()))?;
    let is_key = row.try_get::<bool, _>("is_key").unwrap_or(false);
    let seq_no = row.try_get::<i32, _>("seq_no").unwrap_or(0);

    // Follows the seed: the key is hidden, and the grid takes the first eight
    // non-key columns so it does not scroll sideways on every screen.
    let shown_in_grid: i64 = sqlx::query_scalar(
        r"SELECT count(*) FROM sys_field f
            JOIN sys_column c ON c.sys_column_id = f.sys_column_id
           WHERE f.sys_tab_id = $1 AND f.is_displayed_grid",
    )
    .bind(tab_id)
    .fetch_one(pool)
    .await?;

    sqlx::query(
        r"INSERT INTO sys_field
              (sys_tab_id, sys_column_id, name, seq_no, seq_no_grid, is_displayed,
               is_displayed_grid, entity_type, is_active, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $4, $5, $6, 'U', true, $7, $7)",
    )
    .bind(tab_id)
    .bind(column_id)
    .bind(&display)
    .bind(seq_no)
    .bind(!is_key)
    .bind(!is_key && shown_in_grid < 8)
    .bind(actor(row))
    .execute(pool)
    .await?;

    Ok(())
}

/// `PUT`/`PATCH /api/sys/{segment}/{id}` — change a dictionary row.
///
/// Both verbs reach this handler and behave identically: only the keys present
/// in the body are written.
#[utoipa::path(
    put, path = "/api/sys/{segment}/{id}", tag = "sys",
    security(("bearer" = [])),
    params(
        ("segment" = String, Path, description = "Dictionary resource"),
        ("id" = String, Path, description = "Primary key"),
    ),
    request_body(content = serde_json::Value, description = "The columns to change"),
    responses(
        (status = 200, description = "The updated row"),
        (status = 400, description = "No writable fields supplied"),
        (status = 401, description = "Dictionary writes require a token"),
        (status = 403, description = "Dictionary writes require the master role"),
        (status = 404, description = "Unknown resource, or no such row"),
    ),
)]
pub async fn update(
    auth: auth::JWTWithUser<users::Model>,
    Path((segment, id)): Path<(String, String)>,
    State(ctx): State<AppContext>,
    Json(payload): Json<Value>,
) -> AppResult<Response> {
    let spec = lookup(&segment)?;
    let pool = ctx.db.get_postgres_connection_pool();
    authz::require_dictionary_admin(&authz::principal(pool, &auth.user).await?)?;
    let body = as_object(payload)?;

    let assignments = verified_assignments(pool, spec, &body, false).await?;
    if assignments.is_empty() {
        return Err(AppError::Validation {
            message: "Validation failed".to_string(),
            errors: vec!["No writable fields supplied".to_string()],
        });
    }

    let mut update = SeaQuery::update();
    update.table(Alias::new(spec.table));
    for (column, value) in assignments {
        update.value(Alias::new(column), value);
    }
    update.and_where(pk_predicate(spec, &id)?);

    let (sql, bound) = update.returning_all().build_sqlx(PostgresQueryBuilder);
    let row = sqlx::query_with(AssertSqlSafe(sql), bound)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("{} {id} not found", spec.segment)))?;

    invalidate_for(&ctx, spec).await;
    Ok(Json(crate::services::row_json::row_to_json(&row)).into_response())
}

/// `DELETE /api/sys/{segment}/{id}` — drop a dictionary row.
#[utoipa::path(
    delete, path = "/api/sys/{segment}/{id}", tag = "sys",
    security(("bearer" = [])),
    params(
        ("segment" = String, Path, description = "Dictionary resource"),
        ("id" = String, Path, description = "Primary key"),
    ),
    responses(
        (status = 204, description = "Deleted"),
        (status = 401, description = "Dictionary writes require a token"),
        (status = 403, description = "Dictionary writes require the master role"),
        (status = 404, description = "Unknown resource, or no such row"),
    ),
)]
pub async fn remove(
    auth: auth::JWTWithUser<users::Model>,
    Path((segment, id)): Path<(String, String)>,
    State(ctx): State<AppContext>,
) -> AppResult<Response> {
    let spec = lookup(&segment)?;
    let pool = ctx.db.get_postgres_connection_pool();
    authz::require_dictionary_admin(&authz::principal(pool, &auth.user).await?)?;

    let (sql, bound) = SeaQuery::delete()
        .from_table(Alias::new(spec.table))
        .and_where(pk_predicate(spec, &id)?)
        .build_sqlx(PostgresQueryBuilder);

    let result = sqlx::query_with(AssertSqlSafe(sql), bound).execute(pool).await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("{} {id} not found", spec.segment)));
    }

    invalidate_for(&ctx, spec).await;
    Ok(StatusCode::NO_CONTENT.into_response())
}

/// `GET /api/sys` — what the dictionary exposes. Handy for clients and for
/// confirming the registry matches the NestJS route list.
#[utoipa::path(
    get, path = "/api/sys", tag = "sys",
    responses((status = 200, description = "`{ resources }` — every dictionary segment, its table and primary key")),
)]
pub async fn index() -> AppResult<Response> {
    let resources: Vec<Value> = SYS_TABLES
        .iter()
        .map(|t| json!({ "resource": t.segment, "table": t.table, "primaryKey": t.pk }))
        .collect();
    Ok(Json(json!({ "resources": resources })).into_response())
}

/// Reads are open; writes require a session.
///
/// The dictionary describes the UI, so the frontend reads `sys_*` to build its
/// navigation and forms before anyone has logged in — the NestJS `SysController`
/// carries no guard for exactly that reason, and closing reads here would break
/// the login screen. Writes are a different matter: `POST`/`PUT`/`PATCH`/
/// `DELETE` on the dictionary can grant a role access to any table, so they are
/// authenticated regardless of what the TypeScript stack does.
pub fn routes() -> Routes {
    Routes::new()
        .prefix("sys")
        .add("/", get(index))
        // Static paths are registered alongside the generic ones on purpose.
        // axum's router (matchit) gives a static segment priority over a
        // parameter at the same depth and backtracks when the static branch
        // dead-ends, so `/sys/fields/form` reaches `fields_layout` while
        // `/sys/fields/{uuid}` still reaches `get_one`.
        //
        // Every one of these is spelled out rather than captured. A
        // `/fields/{layout}` pattern would also swallow `GET /sys/fields/{uuid}`,
        // because a parameter matches anything — the exact spellings are what
        // keep the generic row route reachable.
        .add("/fields/form", get(fields_form))
        .add("/fields/grid", get(fields_grid))
        .add("/fields/batch-reorder", post(fields_batch_reorder))
        .add("/columns/direct", get(columns_direct))
        .add("/categories/with-entities", get(categories_with_entities))
        .add("/categories/unassign", post(categories_unassign))
        .add("/categories/{id}/entities", get(category_entities))
        .add("/window-help/{table_name}", get(window_help))
        .add("/{segment}", get(list))
        .add("/{segment}", post(create))
        .add("/{segment}/{id}", get(get_one))
        .add("/{segment}/{id}", put(update))
        .add("/{segment}/{id}", patch(update))
        .add("/{segment}/{id}", delete(remove))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn truthy(value: Option<&String>) -> bool {
    matches!(value.map(String::as_str), Some("true" | "1" | "yes"))
}

/// `?limit` / `?page` (or `?offset`), clamped.
///
/// Returns `(limit, page, offset)`. A `page` beyond the end yields an empty
/// `data` with a truthful `meta.total`, which is what a table footer needs to
/// render "showing 0 of 137".
fn pagination_from(params: &HashMap<String, String>) -> (u64, u64, u64) {
    let limit = params
        .get("limit")
        .and_then(|v| v.parse::<u64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(DEFAULT_LIMIT);
    // `Ord::min`, spelled out: `ExprTrait` is in scope for the query builder and
    // also has a `min`, so the bare method call is ambiguous.
    let limit = Ord::min(limit, MAX_LIMIT);

    let page = params
        .get("page")
        .and_then(|v| v.parse::<u64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(1);

    // An explicit `offset` wins — the two are alternative spellings and a
    // caller that sends both means the more specific one.
    let offset = params
        .get("offset")
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or_else(|| (page - 1) * limit);

    (limit, page, offset)
}

/// `?sort=` / `?orderBy=` with `?order=` / `?orderDir=`, falling back to the
/// registry's default. The column is verified against the live schema, so an
/// unknown one is a 400 rather than an interpolated identifier.
async fn ordering_from(
    pool: &PgPool,
    spec: &SysTable,
    params: &HashMap<String, String>,
) -> AppResult<(String, Order)> {
    let requested = params.get("sort").or_else(|| params.get("orderBy"));
    let column = match requested {
        Some(name) => verify_column(pool, spec.table, name).await?.0,
        // The registry's default is verified too. It is a hand-maintained
        // constant against a generated schema, and a stale entry there used to
        // 500 the whole resource — falling back to the primary key keeps the
        // endpoint answering while the log says exactly what to fix.
        None => match verify_column(pool, spec.table, spec.order_by).await {
            Ok((column, _)) => column,
            Err(_) => {
                crate::log_event!(
                    dictionary_column_absent,
                    table = spec.table,
                    column = spec.order_by
                );
                spec.pk.to_string()
            }
        },
    };

    let direction = params
        .get("order")
        .or_else(|| params.get("orderDir"))
        .map(String::as_str);
    let direction = if matches!(direction, Some("desc" | "DESC")) {
        Order::Desc
    } else {
        Order::Asc
    };

    Ok((column, direction))
}

/// Turn the query string into WHERE clauses.
///
/// Three shapes are accepted, because three are already in use:
///
/// * `?filter.{column}=` — explicit and strict; an unknown column is a 400.
/// * `?{column}=` — the shorthand every frontend call site uses. Unknown keys
///   are ignored rather than rejected, because callers append cache-busters and
///   UI state to these URLs and a 400 there would break a working screen.
/// * `?search=` / `?prefix=` — cross-column conveniences.
async fn conditions_from(
    pool: &PgPool,
    spec: &SysTable,
    params: &HashMap<String, String>,
) -> AppResult<Vec<Condition>> {
    let mut conditions = Vec::new();

    for (key, value) in params {
        if let Some(column) = key.strip_prefix("filter.") {
            let (column, _) = verify_column(pool, spec.table, column).await?;
            conditions.push(Condition::all().add(Expr::col(Alias::new(column)).eq(value.clone())));
            continue;
        }
        if RESERVED_PARAMS.contains(&key.as_str()) || key.starts_with('_') {
            continue;
        }

        // `?name=` on `sys_table` means the physical table name as often as the
        // display name — `useSysTable` passes `bus_compound`, the admin search
        // passes "Compound". Matching either is what the local PGlite query
        // (`WHERE table_name = $1`) and the admin UI both expect.
        if key == "name" && spec.table == "sys_table" {
            conditions.push(
                Condition::any()
                    .add(Expr::col(Alias::new("table_name")).eq(value.clone()))
                    .add(Expr::col(Alias::new("name")).eq(value.clone())),
            );
            continue;
        }

        let alias = PARAM_ALIASES
            .iter()
            .find(|(from, _)| from == key)
            .map_or(key.as_str(), |(_, to)| *to);

        // Unknown keys are skipped, not rejected — see the doc comment.
        if let Ok((column, _)) = verify_column(pool, spec.table, alias).await {
            conditions.push(typed_equality(&column, value));
        }
    }

    if let Some(prefix) = params.get("prefix") {
        if verify_column(pool, spec.table, "table_name").await.is_ok() {
            conditions.push(
                Condition::all()
                    .add(Expr::col(Alias::new("table_name")).like(format!("{prefix}%"))),
            );
        }
    }

    if let Some(needle) = params.get("search").filter(|v| !v.is_empty()) {
        let mut any = Condition::any();
        let mut matched = false;
        for candidate in SEARCHABLE_COLUMNS {
            if let Ok((column, _)) = verify_column(pool, spec.table, candidate).await {
                any = any.add(Expr::col(Alias::new(column)).ilike(format!("%{needle}%")));
                matched = true;
            }
        }
        if matched {
            conditions.push(any);
        }
    }

    Ok(conditions)
}

/// Bind a filter value by the type its column actually has.
///
/// Postgres will not compare a `uuid` or an `integer` against a text
/// parameter, so `?table_id=<uuid>` has to bind a `Uuid` — passing the string
/// through raises `operator does not exist: uuid = text` at query time.
fn typed_equality(column: &str, value: &str) -> Condition {
    let expr = Expr::col(Alias::new(column));
    if column.ends_with("_id") && !column.ends_with("reference_id") {
        if let Ok(id) = uuid::Uuid::parse_str(value) {
            return Condition::all().add(expr.eq(id));
        }
    }
    if let Ok(number) = value.parse::<i32>() {
        // Only integer-typed columns should take this branch; a text column
        // holding "42" still compares fine because Postgres coerces the
        // integer literal to text, which the reverse is not true of.
        if column.ends_with("_id") || column.starts_with("seq") || column.ends_with("_no") {
            return Condition::all().add(expr.eq(number));
        }
    }
    match value {
        "true" => Condition::all().add(expr.eq(true)),
        "false" => Condition::all().add(expr.eq(false)),
        other => Condition::all().add(expr.eq(other.to_string())),
    }
}

fn as_object(payload: Value) -> AppResult<Map<String, Value>> {
    match payload {
        Value::Object(map) => Ok(map),
        _ => Err(AppError::BadRequest(
            "Request body must be a JSON object".to_string(),
        )),
    }
}

/// Build the primary-key comparison, honouring the INTEGER/UUID split.
fn pk_predicate(spec: &SysTable, id: &str) -> AppResult<Expr> {
    let column = Expr::col(Alias::new(spec.pk));
    if spec.integer_pk {
        let parsed: i32 = id
            .parse()
            .map_err(|_| AppError::BadRequest(format!("{} id must be an integer", spec.segment)))?;
        Ok(column.eq(parsed))
    } else {
        let parsed = uuid::Uuid::parse_str(id)
            .map_err(|_| AppError::BadRequest(format!("{} id must be a UUID", spec.segment)))?;
        Ok(column.eq(parsed))
    }
}

async fn fetch_one(pool: &PgPool, spec: &SysTable, id: &str) -> AppResult<Option<Value>> {
    let (sql, values) = SeaQuery::select()
        .column(Asterisk)
        .from(Alias::new(spec.table))
        .and_where(pk_predicate(spec, id)?)
        .build_sqlx(PostgresQueryBuilder);

    let row = sqlx::query_with(AssertSqlSafe(sql), values)
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(crate::services::row_json::row_to_json))
}

/// Column names in a write payload are checked against `information_schema`
/// for this table before they can become SQL identifiers.
///
/// The dictionary describes the *business* tables, not itself, so `sys_column`
/// is not the right oracle here — the live schema is.
/// Confirm the column exists on this dictionary table, and report its SQL type.
///
/// The type is what makes a write bind correctly. Every value used to go in as
/// its JSON type, so a UUID arrived as text and Postgres refused it with 42804
/// — surfacing as `400 A value has the wrong type or format`. That made
/// `POST /api/sys/columns` impossible: `sys_table_id` is a `uuid`, so every
/// attempt to add a column through the dictionary failed. The same held for any
/// `sys_*` write carrying a foreign key, a date or a boolean-as-string.
///
/// Binding is delegated to `dynamic_repo::raw_json_to_expr`, which already does
/// this for the business tables — one binder, so the two cannot disagree about
/// what a `date` accepts.
async fn verify_column(pool: &PgPool, table: &str, column: &str) -> AppResult<(String, String)> {
    let found: Option<(String, String)> = sqlx::query_as(
        r"SELECT column_name, data_type FROM information_schema.columns
           WHERE table_name = $1 AND column_name = $2
           LIMIT 1",
    )
    .bind(table)
    .bind(column)
    .fetch_optional(pool)
    .await?;

    found.ok_or_else(|| AppError::BadRequest(format!("Unknown field '{column}'")))
}

/// Map a payload onto verified column assignments.
///
/// The primary key is accepted on create only when the table uses an INTEGER
/// key (`sys_reference`, whose ids are a fixed vocabulary the caller chooses);
/// UUID keys are always database-generated. On update the key is never
/// writable — it is in the URL.
async fn verified_assignments(
    pool: &PgPool,
    spec: &SysTable,
    payload: &Map<String, Value>,
    is_create: bool,
) -> AppResult<Vec<(String, Expr)>> {
    let mut assignments = Vec::new();
    for (key, value) in payload {
        if key == spec.pk && !(is_create && spec.integer_pk) {
            continue;
        }
        // Timestamps are database-managed on these tables.
        if key == "created_at" || key == "updated_at" {
            continue;
        }
        let (column, data_type) = verify_column(pool, spec.table, key).await?;
        assignments.push((
            column,
            crate::services::dynamic_repo::raw_json_to_expr(value, &data_type),
        ));
    }
    Ok(assignments)
}


/// Drop cached dictionary metadata after a write.
///
/// `sys_table` / `sys_column` are what `DictionaryCache` reads, and `sys_field`
/// carries the ordering the UI renders from — a stale cache here is exactly the
/// "reordering needs a redeploy" failure the dictionary exists to avoid. The
/// blunt clear is deliberate: dictionary writes are rare and admin-driven, and
/// a per-entity invalidation would have to resolve which business table a
/// `sys_column` row belongs to before it could be precise.
async fn invalidate_for(ctx: &AppContext, spec: &SysTable) {
    // `sys_system` is cached by a different service, and missing it is the one
    // failure this table exists to prevent: a setting saved through the admin
    // screen that does not take effect until the process restarts is no better
    // than the YAML file it replaced.
    if spec.table == "sys_system" {
        if let Some(config) = ctx.shared_store.get::<SystemConfig>() {
            config.invalidate().await;
            crate::log_event!(dictionary_cache_invalidated, table = spec.table, cache = "configuration");
        }
        return;
    }
    if !matches!(
        spec.table,
        "sys_table" | "sys_column" | "sys_field" | "sys_tab" | "sys_window"
    ) {
        return;
    }
    if let Some(cache) = ctx.shared_store.get::<DictionaryCache>() {
        cache.invalidate_all();
        crate::log_event!(dictionary_cache_invalidated, table = spec.table, cache = "dictionary");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_covers_every_nestjs_route_segment() {
        // These are the thirteen @Controller('sys/…') prefixes from the
        // TypeScript stack. Drift here is a contract break.
        let expected = [
            "tables", "columns", "fields", "tabs", "windows", "references",
            "ref-lists", "roles", "users", "user-roles", "access", "val-rules",
            "categories",
        ];
        for segment in expected {
            assert!(lookup(segment).is_ok(), "missing dictionary route: {segment}");
        }
    }

    /// Every alias must land on a real segment, or a call site that has used
    /// the alternative spelling for years starts 404ing.
    #[test]
    fn aliases_resolve_to_a_registered_table() {
        for (alias, target) in SEGMENT_ALIASES {
            assert!(lookup(alias).is_ok(), "dangling alias: {alias}");
            assert_eq!(lookup(alias).unwrap().segment, *target);
        }
        assert_eq!(lookup("ref-list").unwrap().table, "sys_ref_list");
    }

    #[test]
    fn unknown_segment_is_not_found() {
        assert!(lookup("passwords").is_err());
        assert!(lookup("../../etc/passwd").is_err());
    }

    #[test]
    fn pagination_clamps_and_derives_offset() {
        let params = |pairs: &[(&str, &str)]| {
            pairs
                .iter()
                .map(|(k, v)| ((*k).to_string(), (*v).to_string()))
                .collect::<HashMap<_, _>>()
        };

        assert_eq!(pagination_from(&params(&[])), (DEFAULT_LIMIT, 1, 0));
        assert_eq!(pagination_from(&params(&[("limit", "10"), ("page", "3")])), (10, 3, 20));
        // Zero and junk fall back rather than producing an empty page.
        assert_eq!(pagination_from(&params(&[("limit", "0")])), (DEFAULT_LIMIT, 1, 0));
        assert_eq!(pagination_from(&params(&[("limit", "nope")])), (DEFAULT_LIMIT, 1, 0));
        // A caller cannot ask for the whole table.
        assert_eq!(pagination_from(&params(&[("limit", "99999")])).0, MAX_LIMIT);
        // An explicit offset overrides the page-derived one.
        assert_eq!(pagination_from(&params(&[("limit", "10"), ("page", "3"), ("offset", "5")])).2, 5);
    }

    /// `?table_id=<uuid>` has to bind a UUID: Postgres has no `uuid = text`.
    #[test]
    fn filter_values_bind_by_column_type() {
        let uuid = "3f2e1669-c3a7-4082-96a4-7a4bde870cd0";

        // Assert on the *bound values*, not the rendered SQL: rendering inlines
        // every parameter as a quoted literal, so the string looks identical
        // whichever type was bound — which is exactly the bug this guards.
        fn bound(condition: Condition) -> Vec<sea_query::Value> {
            let mut select = SeaQuery::select();
            select
                .column(Asterisk)
                .from(Alias::new("sys_column"))
                .cond_where(condition);
            select.build(PostgresQueryBuilder).1.into_iter().collect()
        }

        assert!(matches!(
            bound(typed_equality("sys_table_id", uuid)).as_slice(),
            [sea_query::Value::Uuid(Some(_))]
        ));
        assert!(matches!(
            bound(typed_equality("sys_reference_id", "18")).as_slice(),
            [sea_query::Value::Int(Some(18))]
        ));
        assert!(matches!(
            bound(typed_equality("is_active", "true")).as_slice(),
            [sea_query::Value::Bool(Some(true))]
        ));
        assert!(matches!(
            bound(typed_equality("column_name", "smiles")).as_slice(),
            [sea_query::Value::String(Some(_))]
        ));
        // A malformed UUID falls back to text rather than erroring — the query
        // simply matches nothing, which is the right answer for a bad filter.
        assert!(matches!(
            bound(typed_equality("sys_table_id", "not-a-uuid")).as_slice(),
            [sea_query::Value::String(Some(_))]
        ));
    }

    #[test]
    fn only_sys_reference_uses_an_integer_key() {
        for spec in SYS_TABLES {
            assert_eq!(
                spec.integer_pk,
                spec.table == "sys_reference",
                "{} has the wrong key kind",
                spec.table
            );
        }
    }

    #[test]
    fn primary_key_parsing_rejects_junk() {
        let uuid_table = lookup("tables").unwrap();
        assert!(pk_predicate(uuid_table, "not-a-uuid").is_err());
        assert!(pk_predicate(uuid_table, "3f2e1669-c3a7-4082-96a4-7a4bde870cd0").is_ok());

        let int_table = lookup("references").unwrap();
        assert!(pk_predicate(int_table, "10").is_ok());
        assert!(pk_predicate(int_table, "10; DROP TABLE sys_table").is_err());
    }
}
