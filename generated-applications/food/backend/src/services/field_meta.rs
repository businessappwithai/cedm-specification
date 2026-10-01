//! Field-layout projection — what the UI needs to draw a form or a grid.
//!
//! `sys_field` says *where* a field sits (order, visibility, group, tab) and
//! `sys_column` says *what* it is (type, length, mandatory). Neither alone is
//! enough to render a screen, so both metadata endpoints —
//! `/api/bus/{entity}/fields/{form,grid}` and `/api/sys/fields/{form,grid}` —
//! return the join. They are the same projection reached by two URLs because
//! the frontend uses both: the business screens ask by entity, the layout
//! editor asks by dictionary and wants hidden fields too.
//!
//! The shape is the frozen API contract (§9): a flat JSON array whose keys are
//! `FieldMetadata` in the frontend. Not an envelope — these are metadata, not
//! a paginated resource, and the TypeScript stack returned a bare array.

use serde_json::{json, Map, Value};
use sqlx::{AssertSqlSafe, PgPool, Row};
use std::collections::HashMap;

use crate::errors::AppResult;
use crate::services::dictionary::resolve_ref_table;

/// Which of the two layouts a request wants.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FieldLayout {
    /// The detail form: ordered by `seq_no`, gated on `is_displayed`.
    Form,
    /// The list grid: ordered by `seq_no_grid`, gated on `is_displayed_grid`.
    Grid,
}

impl FieldLayout {
    fn visibility_column(self) -> &'static str {
        match self {
            Self::Form => "is_displayed",
            Self::Grid => "is_displayed_grid",
        }
    }

    fn order_column(self) -> &'static str {
        match self {
            Self::Form => "seq_no",
            Self::Grid => "seq_no_grid",
        }
    }
}

/// Fields for one table, in the order the UI should render them.
///
/// `include_hidden` is what the layout editor passes: it needs the fields an
/// administrator has switched off, because switching them back on is the whole
/// point of that screen.
pub async fn layout_fields(
    pool: &PgPool,
    table_name: &str,
    layout: FieldLayout,
    include_hidden: bool,
) -> AppResult<Value> {
    // The visibility and ordering columns come from `FieldLayout`, never from
    // the request, so interpolating them here cannot be influenced by a caller.
    let sql = format!(
        r"SELECT f.sys_field_id, f.name, f.help, f.seq_no, f.seq_no_grid,
                 f.is_displayed, f.is_displayed_grid, f.is_read_only,
                 f.column_span, f.num_lines, f.sys_field_group_id,
                 f.default_value AS field_default_value,
                 c.column_name, c.sys_reference_id, c.is_mandatory, c.is_updateable,
                 c.is_identifier,
                 c.field_length, c.default_value AS column_default_value,
                 c.ref_table_name AS stored_ref_table_name,
                 r.name AS reference_name,
                 g.name AS group_name, g.columns AS group_columns,
                 g.description AS group_description, g.layout_type AS group_layout_type,
                 tb.name AS tab_name
            FROM sys_field f
            JOIN sys_column c ON c.sys_column_id = f.sys_column_id
            JOIN sys_tab   tb ON tb.sys_tab_id = f.sys_tab_id
            JOIN sys_table  t ON t.sys_table_id = tb.sys_table_id
            LEFT JOIN sys_reference   r ON r.sys_reference_id = c.sys_reference_id
            LEFT JOIN sys_field_group g ON g.sys_field_group_id = f.sys_field_group_id
           WHERE t.table_name = $1
             AND COALESCE(f.is_active, true) = true
             AND ($2 OR COALESCE(f.{visibility}, false) = true)
           ORDER BY f.{order} NULLS LAST, f.name",
        visibility = layout.visibility_column(),
        order = layout.order_column(),
    );

    let rows = sqlx::query(AssertSqlSafe(sql))
        .bind(table_name)
        .bind(include_hidden)
        .fetch_all(pool)
        .await?;

    let mut fields: Vec<Value> = Vec::with_capacity(rows.len());
    let mut ref_tables: Vec<String> = Vec::new();

    for row in &rows {
        let column_name: String = row.try_get("column_name").unwrap_or_default();
        let sys_reference_id: Option<i32> = row.try_get("sys_reference_id").ok().flatten();
        let stored: Option<String> = row.try_get("stored_ref_table_name").ok().flatten();
        let ref_table_name = resolve_ref_table(stored.as_deref(), &column_name, sys_reference_id);
        if let Some(name) = &ref_table_name {
            if !ref_tables.contains(name) {
                ref_tables.push(name.clone());
            }
        }

        // A field's own default wins over the column's — that is the override
        // the dictionary exists to allow.
        let default_value: Option<String> = row
            .try_get::<Option<String>, _>("field_default_value")
            .ok()
            .flatten()
            .or_else(|| {
                row.try_get::<Option<String>, _>("column_default_value")
                    .ok()
                    .flatten()
            });

        let mut field = Map::new();
        field.insert(
            "sys_field_id".into(),
            json!(row
                .try_get::<uuid::Uuid, _>("sys_field_id")
                .ok()
                .map(|id| id.to_string())),
        );
        field.insert(
            "name".into(),
            json!(row.try_get::<Option<String>, _>("name").ok().flatten()),
        );
        field.insert("column_name".into(), json!(column_name));
        field.insert("sys_reference_id".into(), json!(sys_reference_id));
        field.insert(
            "is_mandatory".into(),
            json!(flag(row, "is_mandatory", false)),
        );
        // What the record is called. The screens title a record by its first
        // identifier field; without this every entity fell through to a list of
        // guessed names, and a compound identified by `smiles` was titled with
        // its UUID.
        field.insert(
            "is_identifier".into(),
            json!(flag(row, "is_identifier", false)),
        );
        field.insert(
            "is_updateable".into(),
            json!(flag(row, "is_updateable", true)),
        );
        field.insert(
            "is_read_only".into(),
            json!(flag(row, "is_read_only", false)),
        );
        field.insert(
            "is_displayed".into(),
            json!(flag(row, "is_displayed", false)),
        );
        field.insert(
            "is_displayed_grid".into(),
            json!(flag(row, "is_displayed_grid", false)),
        );
        field.insert("seq_no".into(), json!(num(row, "seq_no").unwrap_or(0)));
        field.insert(
            "seq_no_grid".into(),
            json!(num(row, "seq_no_grid").unwrap_or(0)),
        );
        field.insert("field_length".into(), json!(num(row, "field_length")));
        field.insert("default_value".into(), json!(default_value));
        field.insert("col_span".into(), json!(num(row, "column_span")));
        field.insert("row_span".into(), json!(num(row, "num_lines")));
        field.insert(
            "field_group_id".into(),
            json!(row
                .try_get::<Option<uuid::Uuid>, _>("sys_field_group_id")
                .ok()
                .flatten()
                .map(|id| id.to_string())),
        );
        field.insert("group_name".into(), json!(text(row, "group_name")));
        field.insert("group_columns".into(), json!(num(row, "group_columns")));
        field.insert(
            "group_description".into(),
            json!(text(row, "group_description")),
        );
        field.insert(
            "group_layout_type".into(),
            json!(text(row, "group_layout_type")),
        );
        field.insert("reference_name".into(), json!(text(row, "reference_name")));
        field.insert("ref_table_name".into(), json!(ref_table_name));
        field.insert("tab_name".into(), json!(text(row, "tab_name")));
        field.insert("help".into(), json!(text(row, "help")));
        // Filled in below, once every referenced table has been resolved in one
        // query rather than one per lookup column.
        field.insert("ref_label_fields".into(), Value::Array(Vec::new()));

        fields.push(Value::Object(field));
    }

    let labels = identifier_columns(pool, &ref_tables).await?;
    for field in &mut fields {
        let Some(object) = field.as_object_mut() else {
            continue;
        };
        let Some(table) = object
            .get("ref_table_name")
            .and_then(Value::as_str)
            .map(ToString::to_string)
        else {
            continue;
        };
        if let Some(columns) = labels.get(&table) {
            object.insert("ref_label_fields".into(), json!(columns));
        }
    }

    Ok(Value::Array(fields))
}

/// The columns that identify a row to a human, per referenced table.
///
/// A lookup renders these instead of a UUID. One query for every referenced
/// table keeps a wide form from issuing a query per foreign key.
async fn identifier_columns(
    pool: &PgPool,
    tables: &[String],
) -> AppResult<HashMap<String, Vec<String>>> {
    let mut map: HashMap<String, Vec<String>> = HashMap::new();
    if tables.is_empty() {
        return Ok(map);
    }

    let rows = sqlx::query(
        r"SELECT t.table_name, c.column_name
            FROM sys_column c
            JOIN sys_table  t ON t.sys_table_id = c.sys_table_id
           WHERE t.table_name = ANY($1)
             AND COALESCE(c.is_identifier, false) = true
             AND COALESCE(c.is_active, true) = true
           ORDER BY c.seq_no NULLS LAST, c.column_name",
    )
    .bind(tables)
    .fetch_all(pool)
    .await?;

    for row in &rows {
        let table: String = row.try_get("table_name").unwrap_or_default();
        let column: String = row.try_get("column_name").unwrap_or_default();
        map.entry(table).or_default().push(column);
    }
    Ok(map)
}

/// `GET /api/sys/window-help/{table_name}` — the help text behind the `?` icon.
///
/// Returns the window, its tabs and its fields with their `help` columns. A
/// table with no window yields nulls rather than a 404: the dialog is an
/// optional affordance, and a missing one is not an error.
pub async fn window_help(pool: &PgPool, table_name: &str) -> AppResult<Value> {
    let window = sqlx::query(
        r"SELECT w.sys_window_id, w.name, w.description, w.help
            FROM sys_window w
            JOIN sys_tab   tb ON tb.sys_window_id = w.sys_window_id
            JOIN sys_table  t ON t.sys_table_id = tb.sys_table_id
           WHERE t.table_name = $1
           ORDER BY tb.seq_no NULLS LAST
           LIMIT 1",
    )
    .bind(table_name)
    .fetch_optional(pool)
    .await?;

    let Some(window) = window else {
        return Ok(json!({ "window": Value::Null, "tabs": [], "fields": [] }));
    };
    let window_id: uuid::Uuid = window.try_get("sys_window_id")?;

    let tabs = sqlx::query(
        r"SELECT sys_tab_id, name, description, help, seq_no, tab_level
            FROM sys_tab
           WHERE sys_window_id = $1
           ORDER BY seq_no NULLS LAST, name",
    )
    .bind(window_id)
    .fetch_all(pool)
    .await?;

    let fields = sqlx::query(
        r"SELECT f.sys_field_id, f.sys_tab_id, f.name, f.help, f.seq_no,
                 c.column_name, c.is_mandatory
            FROM sys_field f
            JOIN sys_column c ON c.sys_column_id = f.sys_column_id
            JOIN sys_tab   tb ON tb.sys_tab_id = f.sys_tab_id
           WHERE tb.sys_window_id = $1
           ORDER BY f.seq_no NULLS LAST, f.name",
    )
    .bind(window_id)
    .fetch_all(pool)
    .await?;

    Ok(json!({
        "window": crate::services::row_json::row_to_json(&window),
        "tabs": crate::services::row_json::rows_to_json(&tabs),
        "fields": crate::services::row_json::rows_to_json(&fields),
    }))
}

// ---------------------------------------------------------------------------
// Row accessors
//
// These endpoints must not fail because one nullable column is null, so every
// read is fallible-with-a-default rather than an unwrap.
// ---------------------------------------------------------------------------

fn flag(row: &sqlx::postgres::PgRow, column: &str, default: bool) -> bool {
    row.try_get::<Option<bool>, _>(column)
        .ok()
        .flatten()
        .unwrap_or(default)
}

fn num(row: &sqlx::postgres::PgRow, column: &str) -> Option<i32> {
    row.try_get::<Option<i32>, _>(column).ok().flatten()
}

fn text(row: &sqlx::postgres::PgRow, column: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(column).ok().flatten()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn layouts_read_their_own_visibility_and_order_columns() {
        assert_eq!(FieldLayout::Form.visibility_column(), "is_displayed");
        assert_eq!(FieldLayout::Form.order_column(), "seq_no");
        assert_eq!(FieldLayout::Grid.visibility_column(), "is_displayed_grid");
        assert_eq!(FieldLayout::Grid.order_column(), "seq_no_grid");
    }

    /// The interpolated identifiers must never be able to come from a request.
    #[test]
    fn interpolated_identifiers_are_a_closed_set() {
        for layout in [FieldLayout::Form, FieldLayout::Grid] {
            for name in [layout.visibility_column(), layout.order_column()] {
                assert!(name.chars().all(|c| c.is_ascii_lowercase() || c == '_'));
            }
        }
    }
}
