//! The Application Dictionary — the metadata every screen is built from.
//!
//! Generated: 2026-10-09T06:46:38.046Z
//! Project: travel

use serde_json::Value;
use serial_test::serial;

use crate::support::{self, bearer, entities::ENTITIES, rows, total};

use travel::services::dictionary::resolve_ref_table;

#[tokio::test]
#[serial]
async fn lists_tables_in_the_paginated_envelope() {
    support::with_app(|request, _ctx, _token| async move {
        // `sys` reads are open: the frontend builds its navigation from the
        // dictionary before anyone has logged in.
        let response = request.get("/api/sys/tables?limit=1").await;
        assert_eq!(response.status_code(), 200);

        let body = response.json::<Value>();
        assert!(
            body.get("data").and_then(Value::as_array).is_some(),
            "expected a data array — a bare list breaks every paginated screen"
        );
        assert!(
            total(&body) > 0,
            "the dictionary should describe at least one table"
        );
        assert_eq!(rows(&body).len(), 1, "limit=1 should return one row");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn describes_every_entity_in_the_model() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/tables?prefix=bus_&limit=500").await;
        assert_eq!(response.status_code(), 200);

        let described: Vec<String> = rows(&response.json::<Value>())
            .iter()
            .filter_map(|row| row.get("table_name").and_then(Value::as_str))
            .map(ToString::to_string)
            .collect();

        for entity in ENTITIES {
            assert!(
                described.iter().any(|t| t == entity.table_name),
                "{} is in the model but not in the dictionary — /api/bus/{} would 404",
                entity.table_name,
                entity.route
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn filters_tables_by_name() {
    support::with_app(|request, _ctx, _token| async move {
        let Some(first) = ENTITIES.first() else {
            return;
        };

        let response = request
            .get(&format!("/api/sys/tables?name={}", first.table_name))
            .await;
        assert_eq!(response.status_code(), 200);

        assert_eq!(
            rows(&response.json::<Value>()).len(),
            1,
            "a name filter should match exactly one table"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn serves_the_form_and_grid_field_layouts() {
    support::with_app(|request, _ctx, token| async move {
        let Some(first) = ENTITIES.first() else {
            return;
        };

        for layout in ["form", "grid"] {
            let response = request
                .get(&format!("/api/bus/{}/fields/{layout}", first.route))
                .add_header("authorization", bearer(&token))
                .await;

            assert_eq!(
                response.status_code(),
                200,
                "{layout} layout should be served"
            );
            let fields = response.json::<Value>();
            assert!(
                fields.as_array().is_some_and(|f| !f.is_empty()),
                "{} has no {layout} fields — the screen would render empty",
                first.name
            );
        }
    })
    .await;
}

/// Every entity gets a window and a tab, and every column gets a field.
///
/// This is the UI layer the seed exists to produce: an entity with no tab has
/// no screen, and a column with no field is invisible on the one it has. Both
/// are silent — the app boots, the other entities render, and the gap only
/// turns up when someone goes looking for that one screen.
///
/// Counting is not enough to catch it. 141 fields for 141 columns still passes
/// if one column has two and another has none, so this checks the mapping is
/// total in both directions rather than that the totals agree.
#[tokio::test]
#[serial]
async fn gives_every_entity_a_tab_and_every_column_a_field() {
    support::with_app(|_request, ctx, _token| async move {
        let pool = ctx.db.get_postgres_connection_pool();

        let tabless: Vec<(String, i64)> = sqlx::query_as(
            r"SELECT t.table_name, count(tb.sys_tab_id)
                FROM sys_table t
                LEFT JOIN sys_tab tb ON tb.sys_table_id = t.sys_table_id
               WHERE t.table_name LIKE 'bus_%'
               GROUP BY t.table_name
              HAVING count(tb.sys_tab_id) <> 1",
        )
        .fetch_all(pool)
        .await
        .expect("query the tab mapping");
        assert!(
            tabless.is_empty(),
            "entities without exactly one tab: {tabless:?}",
        );

        let fieldless: Vec<(String, String, i64)> = sqlx::query_as(
            r"SELECT t.table_name, c.column_name, count(f.sys_field_id)
                FROM sys_column c
                JOIN sys_table t ON t.sys_table_id = c.sys_table_id
                LEFT JOIN sys_field f ON f.sys_column_id = c.sys_column_id
               WHERE t.table_name LIKE 'bus_%'
               GROUP BY t.table_name, c.column_name
              HAVING count(f.sys_field_id) <> 1",
        )
        .fetch_all(pool)
        .await
        .expect("query the field mapping");
        assert!(
            fieldless.is_empty(),
            "columns without exactly one field: {fieldless:?}",
        );

        // A field carries both a tab and a column, and nothing in the schema
        // makes them agree — a field can be hung off one entity's tab while
        // describing another entity's column, which renders a column on the
        // wrong screen.
        let misfiled: Vec<(String, String)> = sqlx::query_as(
            r"SELECT t.table_name, c.column_name
                FROM sys_field f
                JOIN sys_tab tb   ON tb.sys_tab_id = f.sys_tab_id
                JOIN sys_column c ON c.sys_column_id = f.sys_column_id
                JOIN sys_table t  ON t.sys_table_id = c.sys_table_id
               WHERE tb.sys_table_id <> c.sys_table_id",
        )
        .fetch_all(pool)
        .await
        .expect("query for misfiled fields");
        assert!(
            misfiled.is_empty(),
            "fields whose tab belongs to a different entity than their column: {misfiled:?}",
        );

        // Each entity window is reachable: it has a tab, and that tab names a
        // table. The admin windows deliberately have none, so only the entity
        // windows are checked.
        let orphan_tabs: Vec<(String,)> = sqlx::query_as(
            r"SELECT tb.name
                FROM sys_tab tb
                LEFT JOIN sys_window w ON w.sys_window_id = tb.sys_window_id
               WHERE w.sys_window_id IS NULL",
        )
        .fetch_all(pool)
        .await
        .expect("query for orphan tabs");
        assert!(
            orphan_tabs.is_empty(),
            "tabs with no window: {orphan_tabs:?}"
        );
    })
    .await;
}

/// A lookup that resolves to an existing entity reaches the right one.
///
/// The target is derived from the column name, never stored, so a rename or a
/// change to the person-role list silently repoints a picker. This pins the
/// resolution for every lookup whose target the dictionary actually has.
///
/// Entities referencing two or more others are the interesting case: each
/// lookup resolves independently, and a person-role column like
/// `remediation_owner_id` goes to the user entity rather than to a table named
/// after the column.
///
/// Deliberately *not* asserted here: that every lookup resolves at all. A
/// qualified self-reference like `parent_sample_id` now resolves — the
/// qualifier comes off before the entity rule — but a column can still be named
/// after something that is not an entity, and that falls back to rendering the
/// raw id. `EML118` reports it at validation, where the model can be fixed;
/// a generated suite can only observe it after the fact.
/// A target the model stated outright (`sys_column.ref_table_name`, written
/// for a CEDM reference whose column name would derive another table) names a
/// table the dictionary holds, and is what the lookup resolves to.
///
/// Vacuous for a model without such a reference — which is every model not
/// written in CEDM — and the stored column is then NULL throughout.
#[tokio::test]
#[serial]
async fn a_stated_lookup_target_is_a_table_the_dictionary_holds() {
    support::with_app(|_request, ctx, _token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let stated: Vec<(String, String, Option<i32>, String)> = sqlx::query_as(
            r"SELECT t.table_name, c.column_name, c.sys_reference_id, c.ref_table_name
                FROM sys_column c
                JOIN sys_table t ON t.sys_table_id = c.sys_table_id
               WHERE c.ref_table_name IS NOT NULL",
        )
        .fetch_all(pool)
        .await
        .expect("read the stated lookup targets");

        for (table, column, reference, target) in &stated {
            let exists: Option<(String,)> =
                sqlx::query_as("SELECT table_name FROM sys_table WHERE table_name = $1")
                    .bind(target)
                    .fetch_optional(pool)
                    .await
                    .expect("look the target up");
            assert!(
                exists.is_some(),
                "{table}.{column} states {target}, which the dictionary does not hold",
            );
            assert_eq!(
                resolve_ref_table(Some(target), column, *reference).as_deref(),
                Some(target.as_str()),
                "{table}.{column} does not resolve to the target it states",
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn resolved_lookups_point_at_the_right_entity() {
    support::with_app(|_request, ctx, _token| async move {
        let pool = ctx.db.get_postgres_connection_pool();

        let known: Vec<(String,)> = sqlx::query_as("SELECT table_name FROM sys_table")
            .fetch_all(pool)
            .await
            .expect("read the table list");
        let known: Vec<String> = known.into_iter().map(|(t,)| t).collect();

        let lookups: Vec<(String, String, Option<i32>, Option<String>)> = sqlx::query_as(
            r"SELECT t.table_name, c.column_name, c.sys_reference_id, c.ref_table_name
                FROM sys_column c
                JOIN sys_table t ON t.sys_table_id = c.sys_table_id
               WHERE c.sys_reference_id IN (18, 19)
                 AND c.column_name <> 'id'",
        )
        .fetch_all(pool)
        .await
        .expect("read the lookup columns");

        assert!(
            !lookups.is_empty(),
            "no lookup columns at all — reference resolution would be untested",
        );

        let mut resolved = 0_usize;
        for (table, column, reference, stored) in &lookups {
            let Some(target) = resolve_ref_table(stored.as_deref(), column, *reference) else {
                continue;
            };
            if !known.contains(&target) {
                continue;
            }
            resolved += 1;

            // A `_by`/`_by_id` column, or a listed person-role name, names a
            // person and must reach the user entity — never a table named
            // after the column, which is what the plain `<entity>_id` rule
            // would produce.
            // A target the model stated outright is the model's answer instead.
            if stored.is_none() && (column.ends_with("_by") || column.ends_with("_by_id")) {
                assert_eq!(
                    target, "bus_user",
                    "{table}.{column} names a person but resolved to {target}",
                );
            }
        }

        assert!(
            resolved > 0,
            "not one lookup in this model resolves to an entity the dictionary has",
        );
    })
    .await;
}

/// An entity that can be labelled has something marked `is_identifier`.
///
/// A lookup renders a human label by reading the target's identifier columns.
/// An entity with none renders a raw UUID in *every* lookup pointing at it —
/// silently, because the id is a perfectly valid value. That used to happen to
/// any entity that did not name its label column one of six conventional
/// things: a compound is identified by its `smiles`, and got nothing.
///
/// The bar is "can be labelled": an entity whose columns are all numbers, dates
/// and foreign keys has nothing a human could read, and is correctly left
/// without one.
#[tokio::test]
#[serial]
async fn every_entity_that_can_be_labelled_has_an_identifier() {
    support::with_app(|_request, ctx, _token| async move {
        let pool = ctx.db.get_postgres_connection_pool();

        // Reference 10 is String and 14 is Text — the two whose values read as
        // a label. Mirrors LABEL_REFERENCE_IDS in the dictionary seed.
        let unlabelled: Vec<(String,)> = sqlx::query_as(
            r"SELECT t.table_name
                FROM sys_table t
               WHERE t.table_name LIKE 'bus_%'
                 AND EXISTS (
                       SELECT 1 FROM sys_column c
                        WHERE c.sys_table_id = t.sys_table_id
                          AND c.sys_reference_id IN (10, 14)
                          AND NOT c.is_key
                          AND c.column_name NOT IN ('created_at', 'updated_at', 'deleted_at')
                     )
                 AND NOT EXISTS (
                       SELECT 1 FROM sys_column c
                        WHERE c.sys_table_id = t.sys_table_id
                          AND c.is_identifier
                     )",
        )
        .fetch_all(pool)
        .await
        .expect("query for unlabelled entities");

        assert!(
            unlabelled.is_empty(),
            "entities with a label-able column but no is_identifier — every lookup pointing at \
             these renders a raw UUID: {unlabelled:?}",
        );
    })
    .await;
}

/// A table added at run time gets a window and a tab; a column gets a field.
///
/// The seed pairs them at generation time, so a generated entity always has a
/// screen. A table added afterwards through this API used to arrive with
/// neither: the row existed and `/api/bus/<it>` served data, but nothing
/// rendered it anywhere, which reads as "the table was not created".
#[tokio::test]
#[serial]
async fn provisions_a_window_tab_and_field_for_anything_added_at_run_time() {
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        let table_name = format!("bus_runtime_probe_{}", uuid::Uuid::new_v4().simple());

        let created = request
            .post("/api/sys/tables")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({
                "table_name": table_name,
                "name": "Runtime Probe",
                "created_by": "test",
                "updated_by": "test",
            }))
            .await;
        assert_eq!(created.status_code(), 201);

        let table_id = created.json::<Value>()["sys_table_id"]
            .as_str()
            .expect("the new table's id")
            .to_string();

        let (window_id, tabs): (Option<uuid::Uuid>, i64) = sqlx::query_as(
            r"SELECT t.sys_window_id,
                     (SELECT count(*) FROM sys_tab WHERE sys_table_id = t.sys_table_id)
                FROM sys_table t
               WHERE t.sys_table_id = $1::uuid",
        )
        .bind(&table_id)
        .fetch_one(pool)
        .await
        .expect("read back the new table");

        assert!(
            window_id.is_some(),
            "a table added at run time got no window, so it has no screen",
        );
        assert_eq!(tabs, 1, "expected exactly one tab for the new table");

        let column = request
            .post("/api/sys/columns")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({
                "sys_table_id": table_id,
                "column_name": "probe_name",
                "name": "Probe Name",
                "sys_reference_id": 10,
                "seq_no": 10,
                "created_by": "test",
                "updated_by": "test",
            }))
            .await;
        assert_eq!(column.status_code(), 201);

        let column_id = column.json::<Value>()["sys_column_id"]
            .as_str()
            .expect("the new column's id")
            .to_string();

        let fields: i64 =
            sqlx::query_scalar("SELECT count(*) FROM sys_field WHERE sys_column_id = $1::uuid")
                .bind(&column_id)
                .fetch_one(pool)
                .await
                .expect("count the new column's fields");
        assert_eq!(
            fields, 1,
            "a column added at run time got no field, so it is invisible on the form",
        );

        // The field has to land on *this* table's tab, not merely exist.
        let on_own_tab: i64 = sqlx::query_scalar(
            r"SELECT count(*) FROM sys_field f
                JOIN sys_tab tb ON tb.sys_tab_id = f.sys_tab_id
               WHERE f.sys_column_id = $1::uuid AND tb.sys_table_id = $2::uuid",
        )
        .bind(&column_id)
        .bind(&table_id)
        .fetch_one(pool)
        .await
        .expect("check the field's tab");
        assert_eq!(on_own_tab, 1, "the field landed on another entity's tab");

        // Attaching a table to a window the caller already has still owes it a
        // tab. Honouring the window used to mean skipping both, which left the
        // table on someone else's window with nothing on it — the same empty
        // screen this whole path exists to prevent.
        let windows_before: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_window")
            .fetch_one(pool)
            .await
            .expect("count windows");

        let attached = request
            .post("/api/sys/tables")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({
                "table_name": format!("bus_attached_probe_{}", uuid::Uuid::new_v4().simple()),
                "name": "Attached Probe",
                "sys_window_id": window_id.expect("the first probe's window"),
                "created_by": "test",
                "updated_by": "test",
            }))
            .await;
        assert_eq!(attached.status_code(), 201);

        let attached_id = attached.json::<Value>()["sys_table_id"]
            .as_str()
            .expect("the attached table's id")
            .to_string();

        let windows_after: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_window")
            .fetch_one(pool)
            .await
            .expect("count windows");
        assert_eq!(
            windows_before, windows_after,
            "a caller-supplied window was duplicated instead of reused",
        );

        let attached_tabs: i64 =
            sqlx::query_scalar("SELECT count(*) FROM sys_tab WHERE sys_table_id = $1::uuid")
                .bind(&attached_id)
                .fetch_one(pool)
                .await
                .expect("count the attached table's tabs");
        assert_eq!(
            attached_tabs, 1,
            "a table attached to an existing window got no tab, so that window shows nothing \
             for it",
        );

        sqlx::query("DELETE FROM sys_tab WHERE sys_table_id = $1::uuid")
            .bind(&attached_id)
            .execute(pool)
            .await
            .ok();
        sqlx::query("DELETE FROM sys_table WHERE sys_table_id = $1::uuid")
            .bind(&attached_id)
            .execute(pool)
            .await
            .ok();

        sqlx::query("DELETE FROM sys_field WHERE sys_column_id = $1::uuid")
            .bind(&column_id)
            .execute(pool)
            .await
            .ok();
        sqlx::query("DELETE FROM sys_column WHERE sys_column_id = $1::uuid")
            .bind(&column_id)
            .execute(pool)
            .await
            .ok();
        sqlx::query("DELETE FROM sys_tab WHERE sys_table_id = $1::uuid")
            .bind(&table_id)
            .execute(pool)
            .await
            .ok();
        sqlx::query("DELETE FROM sys_table WHERE sys_table_id = $1::uuid")
            .bind(&table_id)
            .execute(pool)
            .await
            .ok();
        if let Some(window) = window_id {
            sqlx::query("DELETE FROM sys_window WHERE sys_window_id = $1")
                .bind(window)
                .execute(pool)
                .await
                .ok();
        }
    })
    .await;
}

/// A report design round-trips through the same generic verbs as every other
/// dictionary resource.
///
/// `sys_report_designs` was created by m0011 and read by nothing: a migration
/// with no consumer is a table that exists to be forgotten. Adding the segment
/// to `SYS_TABLES` is the whole implementation — `layout` is opaque JSONB the
/// designer owns, so there is nothing a bespoke controller would do that this
/// one does not.
#[tokio::test]
#[serial]
async fn stores_and_returns_a_report_design() {
    support::with_app(|request, _ctx, token| async move {
        let Some(entity) = ENTITIES.first() else {
            return;
        };
        let layout = serde_json::json!({
            "orientation": "portrait",
            "sections": [{ "kind": "header", "text": "Report" }],
        });

        let name = format!("Round-trip design {}", uuid::Uuid::new_v4().simple());

        // `sys_report_designs` is unique on `table_name` — a table has one
        // design, not a collection — and `cargo test` truncates the business
        // tables between runs but not the dictionary. So the row this test
        // wrote last time is still there, and creating over it is a 409. Clear
        // it first: the suites deliberately leave their rows behind, which
        // makes a re-run the normal case rather than the exception.
        let existing = request
            .get(&format!(
                "/api/sys/report-designs?filter.table_name={}",
                entity.table_name
            ))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(existing.status_code(), 200, "{}", existing.text());
        for row in rows(&existing.json::<Value>()) {
            let Some(id) = row.get("sys_report_design_id").and_then(Value::as_str) else {
                continue;
            };
            let removed = request
                .delete(&format!("/api/sys/report-designs/{id}"))
                .add_header("authorization", bearer(&token))
                .await;
            assert!(
                removed.status_code().is_success(),
                "clearing the previous run's design: {} {}",
                removed.status_code(),
                removed.text()
            );
        }

        let created = request
            .post("/api/sys/report-designs")
            .add_header("authorization", bearer(&token))
            .json(&serde_json::json!({
                "table_name": entity.table_name,
                "name": name,
                "layout": layout,
            }))
            .await;
        assert!(
            created.status_code().is_success(),
            "creating a report design: {} {}",
            created.status_code(),
            created.text()
        );

        // Read back by table rather than by name: a table has exactly one
        // design, so this is an exact lookup, and the name carries spaces that
        // do not belong in a URI unescaped.
        let listed = request
            .get(&format!(
                "/api/sys/report-designs?filter.table_name={}",
                entity.table_name
            ))
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(listed.status_code(), 200, "{}", listed.text());

        let body = listed.json::<Value>();
        let found = rows(&body)
            .iter()
            .find(|row| row.get("name").and_then(Value::as_str) == Some(name.as_str()))
            .cloned()
            .unwrap_or_else(|| panic!("the design was stored and did not come back: {body}"));

        // The layout is returned as the JSON it was given, not as a string and
        // not reshaped. The designer is the only thing that reads it.
        assert_eq!(
            found
                .get("layout")
                .and_then(|l| l.get("orientation"))
                .and_then(Value::as_str),
            Some("portrait"),
            "the layout did not survive the round trip: {found}"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn requires_a_session_to_write_the_dictionary() {
    support::with_app(|request, _ctx, _token| async move {
        // A dictionary write can grant a role access to any table, so it is
        // authenticated even though reads are not.
        let response = request
            .post("/api/sys/categories")
            .json(&serde_json::json!({ "name": "Unauthenticated", "code": "NOPE" }))
            .await;

        assert_eq!(response.status_code(), 401);
    })
    .await;
}

/// `allowed_roles` survives the trip out of Postgres as an array.
///
/// The column is `TEXT[]`, and `row_json` had no arm for it: the value fell to
/// the `String` catch-all, whose decode failed, and a failed decode is emitted
/// as `null` — indistinguishable to every caller from a column that was never
/// set. So the dictionary reported no role scope at all while the rows held
/// `{Administrator}`, and the same gap blanked `audit_log.changed_fields`, the
/// one field naming *what* an update changed.
///
/// This asserts the shape rather than a particular role, because which windows
/// a model grants is the model's business. What is not the model's business is
/// that `sys_refresh_dictionary_scope()` leaves every window with at least
/// `ARRAY[]::TEXT[]` — so a `null` here means the mapping is gone again, and a
/// string means it came back as Postgres's own `{a,b}` literal.
#[tokio::test]
#[serial]
async fn a_text_array_column_reads_back_as_a_json_array() {
    support::with_app(|request, _ctx, _token| async move {
        let response = request.get("/api/sys/windows?limit=200").await;
        assert_eq!(response.status_code(), 200, "windows: {}", response.text());

        let body = response.json::<Value>();
        let windows = rows(&body);
        assert!(!windows.is_empty(), "the dictionary seeded no windows");

        let mut scoped = 0;
        for window in &windows {
            let scope = window
                .get("allowed_roles")
                .unwrap_or_else(|| panic!("window has no allowed_roles at all: {window}"));

            let entries = scope.as_array().unwrap_or_else(|| {
                panic!(
                    "allowed_roles came back as {scope} rather than a JSON array — \
                     row_json has lost its TEXT[] mapping"
                )
            });
            for entry in entries {
                assert!(
                    entry.is_string(),
                    "allowed_roles holds a non-string element: {window}"
                );
            }
            if !entries.is_empty() {
                scoped += 1;
            }
        }

        // The admin windows are granted to the administrator role by the
        // dictionary seed, so at least one window must carry a role. Without
        // this the test would pass just as happily on a column that decoded
        // every value to an empty array.
        assert!(
            scoped > 0,
            "no window carries a role — either the scope refresh did not run \
             or every array decoded empty"
        );
    })
    .await;
}
