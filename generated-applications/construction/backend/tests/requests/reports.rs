//! The questions the model declared in `reports`, over HTTP.
//!
//! These assert against **what the model declared**, not against the rows the
//! same generator wrote. Reading `sys_report` back and checking it against
//! itself only proves the application is self-consistent, and passes just as
//! happily when the compiler dropped a directive on the floor — which is
//! exactly the failure reports had before they were compiled at all.
//!
//! The read-only assertions are the important ones. `sql_text` is the single
//! column in this application where text authored in a document becomes a
//! statement, and the backend's refusal is the last of the three guards
//! standing between that column and the database.
//!
//! Generated: 2026-10-01T09:31:22.930Z
//! Project: construction

use serde_json::{json, Value};
use serial_test::serial;

use crate::support::{self, bearer, rows};

/// The names of this model's `reports`, in order.
const DECLARED: &[&str] = &[];

#[tokio::test]
#[serial]
async fn every_report_the_model_declared_is_installed() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/reports")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200);

        let body = response.json::<Value>();
        let installed: Vec<String> = rows(&body)
            .iter()
            .filter_map(|row| row.get("name").and_then(Value::as_str).map(str::to_string))
            .collect();

        for name in DECLARED {
            assert!(
                installed.iter().any(|found| found == name),
                "report {name} was declared but is not in sys_report — the \
                 compiler or the seed dropped it"
            );
        }
        assert_eq!(
            installed.len(),
            DECLARED.len(),
            "sys_report holds a report the model never declared"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn the_list_never_hands_out_the_queries() {
    // The list feeds a menu. Handing the query to the browser would put the
    // application's schema in front of anyone who can open the reports page,
    // and nothing on that screen needs it.
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/reports")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200);

        for row in rows(&response.json::<Value>()) {
            assert!(
                row.get("sql_text").is_none() && row.get("sqlText").is_none(),
                "a report's query reached the list response: {row}"
            );
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_chart_report_names_both_of_its_axes() {
    // A chart with one axis renders nothing and reports no error, which is
    // worse than not being a chart. The compiler refuses one; this is the
    // assertion that it actually did.
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/reports")
            .add_header("authorization", bearer(&token))
            .await;

        for row in rows(&response.json::<Value>()) {
            let charted = row.get("chart").and_then(Value::as_str);
            if let Some(chart) = charted {
                let name = row.get("name").and_then(Value::as_str).unwrap_or("?");
                assert!(
                    row.get("xAxis").and_then(Value::as_str).is_some()
                        && row.get("yAxis").and_then(Value::as_str).is_some(),
                    "report {name} declares chart {chart} without both axes"
                );
            }
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn an_unknown_report_is_a_404_rather_than_an_empty_answer() {
    support::with_app(|request, _ctx, token| async move {
        let response = request
            .get("/api/reports/no-such-report")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 404);

        let run = request
            .get("/api/reports/no-such-report/run")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(run.status_code(), 404);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_stored_write_is_refused_before_it_runs() {
    // The generator cannot put a write here, so this writes one directly —
    // which is precisely the case the backend's own guard exists for. A later
    // migration, a restored backup, or anyone with database access can reach
    // this column, and without the second check the handler would run whatever
    // it found with the application's own credentials.
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        for (name, statement) in [
            ("t-write", "DELETE FROM sys_report WHERE FALSE"),
            ("t-second", "SELECT 1; DELETE FROM sys_report WHERE FALSE"),
        ] {
            sqlx::query(
                "INSERT INTO sys_report (name, title, sql_text, sort_order)
                 VALUES ($1, $1, $2, 9999)
                 ON CONFLICT (name) DO UPDATE SET sql_text = EXCLUDED.sql_text",
            )
            .bind(name)
            .bind(statement)
            .execute(pool)
            .await
            .expect("planting the statement");

            let response = request
                .get(&format!("/api/reports/{name}/run"))
                .add_header("authorization", bearer(&token))
                .await;
            assert_eq!(
                response.status_code(),
                400,
                "a stored `{statement}` was not refused"
            );

            sqlx::query("DELETE FROM sys_report WHERE name = $1")
                .bind(name)
                .execute(pool)
                .await
                .expect("removing the planted row");
        }
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_semicolon_inside_a_literal_is_not_a_second_statement() {
    // The guard tracks quoting rather than searching for the byte. Getting
    // this wrong refuses a legitimate report and looks like a compiler bug.
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        sqlx::query(
            "INSERT INTO sys_report (name, title, sql_text, sort_order)
             VALUES ('t-quoted', 't-quoted', $1, 9999)
             ON CONFLICT (name) DO UPDATE SET sql_text = EXCLUDED.sql_text",
        )
        .bind("SELECT ';' AS separator")
        .execute(pool)
        .await
        .expect("planting the query");

        let response = request
            .get("/api/reports/t-quoted/run")
            .add_header("authorization", bearer(&token))
            .await;
        assert_eq!(response.status_code(), 200);
        let body = response.json::<Value>();
        assert_eq!(body["rows"][0]["separator"], json!(";"));

        sqlx::query("DELETE FROM sys_report WHERE name = 't-quoted'")
            .execute(pool)
            .await
            .expect("removing the planted row");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn columns_come_back_in_the_order_the_select_declares() {
    // The screen lays a report out by `columns`. They were once read off a
    // row's JSON keys, which are sorted, so every report rendered its columns
    // alphabetically — the grouping column last, after the counts it groups.
    support::with_app(|request, ctx, token| async move {
        let pool = ctx.db.get_postgres_connection_pool();
        sqlx::query(
            "INSERT INTO sys_report (name, title, sql_text, sort_order)
             VALUES ('t-ordered', 't-ordered', $1, 9999)
             ON CONFLICT (name) DO UPDATE SET sql_text = EXCLUDED.sql_text",
        )
        .bind("SELECT 'z' AS zeta, 2 AS middle, 1 AS alpha")
        .execute(pool)
        .await
        .expect("planting the query");

        let response = request
            .get("/api/reports/t-ordered/run")
            .add_header("authorization", bearer(&token))
            .await;

        sqlx::query("DELETE FROM sys_report WHERE name = 't-ordered'")
            .execute(pool)
            .await
            .expect("removing the planted row");

        assert_eq!(response.status_code(), 200);
        assert_eq!(
            response.json::<Value>()["columns"],
            json!(["zeta", "middle", "alpha"])
        );
    })
    .await;
}
