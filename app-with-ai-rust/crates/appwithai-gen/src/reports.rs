//! The model's `reports` → `seed/reports.sql`, the questions a generated application ships with.
//!
//! The TypeScript originals are `packages/generator/src/reports/index.ts` (the
//! directive reader) and
//! `packages/generator/src/generators/tanstack-astryx-loco/reports-seed.ts` (the
//! emitter). All three readings must agree byte for byte; `bun run parity` is
//! what says they do.
//!
//! The design note lives in those files and in the m0015 migration. In short:
//! `sys_report` holds analytical queries over the whole database, distinct from
//! `sys_report_designs` (m0011) which is one printable layout per record; and
//! `sql_text` is the one column in a generated application where text authored
//! in a document becomes a statement, so it is guarded by the checker
//! (EML293), by this compiler, and again by `controllers::report` at run time.

use crate::records::ReportDeclaration;
use std::collections::{HashMap, HashSet};

use uuid::Uuid;

use crate::dictionary::{insert, now, text, Sql, NAMESPACE};

/// The chart types a report's `chart` may name. Mirrors `appwithai-language.json`.
pub const REPORT_CHART_TYPES: &[&str] = &["bar", "line", "pie", "area"];

/// One report, as the generated application will store it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledReport {
    /// Stable identifier — unique across the model, and the row's key.
    pub name: String,
    /// What the report is called on screen.
    pub title: String,
    /// The entity it is mainly about, when it is about one. Groups the list.
    pub entity: Option<String>,
    /// Absent means a table; present means a chart of this type beside it.
    pub chart: Option<String>,
    /// Result columns the chart plots. Both required when `chart` is set.
    pub x: Option<String>,
    pub y: Option<String>,
    /// Who asks this question and why — shown as the report's description.
    pub help: Option<String>,
    /// The query, exactly as it will be run.
    pub sql: String,
}

/// A report may only read.
///
/// The query is authored in the model and run, verbatim, against the generated
/// application's own database — so the directive is an execution path from a
/// document into SQL. The checker rejects a write at authoring time (EML293),
/// but a checker runs where the author is and this runs where the generator is:
/// a model that reached the generator without being checked, or one edited
/// after it was, would otherwise arrive here with `DELETE` in it.
fn is_read_only(sql: &str) -> bool {
    let head = sql.trim_start().to_ascii_lowercase();
    // `\b` — a query named `selection_of(...)` is not a SELECT.
    for keyword in ["with", "select"] {
        if let Some(rest) = head.strip_prefix(keyword) {
            if rest
                .chars()
                .next()
                .is_none_or(|ch| !ch.is_alphanumeric() && ch != '_')
            {
                return true;
            }
        }
    }
    false
}

/// A statement separator outside of quotes — the way a `SELECT` smuggles a write.
///
/// `SELECT 1; DROP TABLE bus_account` passes `is_read_only` and is not one
/// query. Semicolons *inside* string literals are ordinary characters, so the
/// scan tracks quoting rather than searching for the byte, and a single
/// trailing semicolon is allowed because it is how most people end a statement.
fn has_statement_break(sql: &str) -> bool {
    let body = strip_trailing_semicolon(sql);
    let chars: Vec<char> = body.chars().collect();
    let mut quote: Option<char> = None;
    let mut index = 0;
    while index < chars.len() {
        let ch = chars[index];
        match quote {
            Some(open) => {
                if ch == open {
                    // Doubling is how both SQL quote styles escape themselves.
                    if chars.get(index + 1) == Some(&open) {
                        index += 1;
                    } else {
                        quote = None;
                    }
                }
            }
            None => {
                if ch == '\'' || ch == '"' {
                    quote = Some(ch);
                } else if ch == ';' {
                    return true;
                }
            }
        }
        index += 1;
    }
    false
}

fn strip_trailing_semicolon(sql: &str) -> &str {
    let trimmed = sql.trim_end();
    trimmed.strip_suffix(';').unwrap_or(trimmed).trim_end()
}

/// Hold a report to its shape — a single read, and a chart only with both of
/// its axes — whichever syntax it was written in.
pub fn validate_report_declaration(
    declaration: ReportDeclaration,
) -> Result<CompiledReport, String> {
    let ReportDeclaration {
        name,
        title,
        entity,
        chart,
        x,
        y,
        help,
        sql,
    } = declaration;

    if !is_read_only(&sql) {
        return Err("sql: is not a SELECT or WITH query".to_string());
    }
    if has_statement_break(&sql) {
        return Err("sql: contains more than one statement".to_string());
    }

    if let Some(chart) = chart.as_deref() {
        if !REPORT_CHART_TYPES.contains(&chart) {
            return Err(format!("has unknown chart type \"{chart}\""));
        }
    }
    // A chart with one axis renders nothing and reports no error, which is
    // worse than not being a chart.
    if let Some(chart) = chart.as_deref() {
        if x.is_none() || y.is_none() {
            return Err(format!("declares chart: {chart} but not both x: and y:"));
        }
    }

    Ok(CompiledReport {
        title: title.unwrap_or_else(|| spaced(&name)),
        name,
        entity,
        chart,
        x,
        y,
        help,
        sql,
    })
}

/// A name with its separators opened out — the fallback title.
fn spaced(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    let mut in_run = false;
    for ch in name.chars() {
        if ch == '_' || ch == '-' {
            if !in_run {
                out.push(' ');
                in_run = true;
            }
        } else {
            out.push(ch);
            in_run = false;
        }
    }
    out
}

/// Compile report declarations read from either syntax.
pub fn compile_report_declarations<F: FnMut(String)>(
    declarations: &[ReportDeclaration],
    entity_names: &[String],
    mut warn: F,
) -> Vec<CompiledReport> {
    let mut accumulator = ReportAccumulator::new(entity_names);
    for declaration in declarations {
        let context = format!("report {}", declaration.name);
        accumulator.add(declaration.clone(), &context, &mut warn);
    }
    accumulator.reports
}

/// The per-report checks in declaration order: validate, refuse a duplicate
/// name, ungroup a report naming an entity the model lacks.
struct ReportAccumulator<'a> {
    known: HashSet<&'a str>,
    seen: HashSet<String>,
    reports: Vec<CompiledReport>,
}

impl<'a> ReportAccumulator<'a> {
    fn new(entity_names: &'a [String]) -> Self {
        Self {
            known: entity_names.iter().map(String::as_str).collect(),
            seen: HashSet::new(),
            reports: Vec::new(),
        }
    }

    fn add<F: FnMut(String)>(
        &mut self,
        declaration: ReportDeclaration,
        context: &str,
        warn: &mut F,
    ) {
        let mut report = match validate_report_declaration(declaration) {
            Ok(report) => report,
            Err(reason) => {
                warn(format!("report {reason} — skipped: {context}"));
                return;
            }
        };

        // The checker reports a duplicate name as EML292. Reaching here with
        // one means the model was not checked, and two rows under one key would
        // make whichever the seed wrote last the only one anybody could open.
        if self.seen.contains(&report.name) {
            warn(format!(
                "report \"{}\" is declared more than once — keeping the first",
                report.name
            ));
            return;
        }

        if let Some(entity) = report.entity.as_deref() {
            if !self.known.contains(entity) {
                warn(format!(
                    "report \"{}\" names entity \"{entity}\", which the model does not declare — ungrouped",
                    report.name
                ));
                report.entity = None;
            }
        }

        self.seen.insert(report.name.clone());
        self.reports.push(report);
    }
}

pub struct ReportsSeedOptions<'a> {
    pub project_name: &'a str,
    pub reports: &'a [CompiledReport],
    /// Model entity name → the `bus_` table it became.
    pub table_for_entity: &'a HashMap<String, String>,
}

pub fn build_reports_seed_sql(options: &ReportsSeedOptions) -> String {
    let ReportsSeedOptions {
        project_name,
        reports,
        table_for_entity,
    } = options;
    let mut out: Vec<String> = Vec::new();

    out.push(format!("-- Model-declared reports for {project_name}."));
    out.push("--".to_string());
    out.push(
        "-- Generated by @appwithai/generator — do not edit by hand; regenerate instead."
            .to_string(),
    );
    out.push(
        "-- Applied by `cargo loco task seed_reports` and by `cargo loco db seed`.".to_string(),
    );
    out.push("--".to_string());
    out.push(
        "-- One row per report the model declares. Every statement is `ON CONFLICT DO NOTHING`"
            .to_string(),
    );
    out.push(
        "-- over a deterministic id and a unique name, so applying this file twice is a"
            .to_string(),
    );
    out.push("-- no-op and regenerating never duplicates a report.".to_string());
    out.push("--".to_string());
    out.push("-- sql_text is a query the model's author wrote, stored verbatim. It is".to_string());
    out.push(
        "-- refused unless it is a single SELECT or WITH — here, and again by the".to_string(),
    );
    out.push("-- backend before it runs.".to_string());
    out.push(String::new());

    if reports.is_empty() {
        out.push("-- This model declares no reports, so there is nothing to seed.".to_string());
        out.push(
            "-- The file is still emitted: src/tasks/seed_reports.rs embeds it with".to_string(),
        );
        out.push(
            "-- include_str!, which is resolved at compile time, so a crate generated".to_string(),
        );
        out.push("-- without it would not build.".to_string());
        out.push(String::new());
        return out.join("\n");
    }

    for (index, report) in reports.iter().enumerate() {
        let id = Uuid::new_v5(
            &NAMESPACE,
            format!("{project_name}:report:{}", report.name).as_bytes(),
        )
        .to_string();
        let table = report
            .entity
            .as_deref()
            .and_then(|entity| table_for_entity.get(entity));
        out.push(insert(
            "sys_report",
            &[
                ("sys_report_id", text(id)),
                ("name", text(report.name.clone())),
                ("title", text(report.title.clone())),
                ("entity_name", opt(report.entity.as_deref())),
                ("table_name", opt(table.map(String::as_str))),
                ("chart", opt(report.chart.as_deref())),
                ("x_axis", opt(report.x.as_deref())),
                ("y_axis", opt(report.y.as_deref())),
                ("help", opt(report.help.as_deref())),
                ("sql_text", text(report.sql.clone())),
                // Declaration order, which is the order the author wrote the
                // questions in and the only ordering the model expresses.
                (
                    "sort_order",
                    Sql::Int(i64::try_from(index + 1).unwrap_or(i64::MAX)),
                ),
                ("created_at", now()),
                ("updated_at", now()),
            ],
        ));
    }

    out.push(String::new());
    out.join("\n")
}

fn opt(value: Option<&str>) -> Sql {
    value.map_or(Sql::Null, text)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn report(name: &str, sql: &str) -> ReportDeclaration {
        ReportDeclaration {
            name: name.to_string(),
            sql: sql.to_string(),
            ..ReportDeclaration::default()
        }
    }

    /// The specification's own example.
    fn pipeline_by_owner() -> ReportDeclaration {
        ReportDeclaration {
            title: Some("Pipeline by owner".to_string()),
            entity: Some("Opportunity".to_string()),
            chart: Some("bar".to_string()),
            x: Some("owner".to_string()),
            y: Some("total".to_string()),
            help: Some("What each rep is carrying, for the weekly review.".to_string()),
            ..report(
                "pipeline-by-owner",
                "SELECT u.first_name AS owner, SUM(o.amount) AS total FROM bus_opportunity o \
                 JOIN bus_user u ON u.id = o.owner_id WHERE o.deleted_at IS NULL GROUP BY 1 \
                 ORDER BY total DESC",
            )
        }
    }

    #[test]
    fn keeps_every_key_of_the_specifications_own_example() {
        let compiled = validate_report_declaration(pipeline_by_owner()).expect("valid");
        assert_eq!(compiled.name, "pipeline-by-owner");
        assert_eq!(compiled.title, "Pipeline by owner");
        assert_eq!(compiled.entity.as_deref(), Some("Opportunity"));
        assert_eq!(compiled.chart.as_deref(), Some("bar"));
        assert_eq!(compiled.x.as_deref(), Some("owner"));
        assert_eq!(compiled.y.as_deref(), Some("total"));
        assert!(compiled.sql.starts_with("SELECT u.first_name"));
        assert!(compiled.sql.ends_with("ORDER BY total DESC"));
    }

    #[test]
    fn a_write_is_refused_however_it_is_dressed_up() {
        for sql in [
            "DELETE FROM bus_account",
            "UPDATE bus_account SET name = 'x'",
            "INSERT INTO bus_account (id) VALUES (1)",
            "selection_of(1)",
            "SELECT 1; DROP TABLE bus_account",
        ] {
            assert!(
                validate_report_declaration(report("r1", sql)).is_err(),
                "{sql} should be refused"
            );
        }
    }

    #[test]
    fn a_semicolon_inside_a_literal_is_an_ordinary_character() {
        let compiled =
            validate_report_declaration(report("r1", "SELECT ';' AS sep FROM bus_account;"))
                .expect("one statement");
        assert!(compiled.sql.contains("';'"));
    }

    #[test]
    fn a_chart_missing_an_axis_or_of_an_unknown_kind_is_refused() {
        let one_axis = ReportDeclaration {
            chart: Some("bar".to_string()),
            x: Some("owner".to_string()),
            ..report("r1", "SELECT 1")
        };
        assert!(validate_report_declaration(one_axis).is_err());
        let donut = ReportDeclaration {
            chart: Some("donut".to_string()),
            x: Some("a".to_string()),
            y: Some("b".to_string()),
            ..report("r1", "SELECT 1")
        };
        assert!(validate_report_declaration(donut).is_err());
    }

    #[test]
    fn an_unknown_entity_loses_the_grouping_but_keeps_the_report() {
        let declared = ReportDeclaration {
            entity: Some("Ghost".to_string()),
            ..report("r1", "SELECT 1")
        };
        let mut warnings = Vec::new();
        let reports = compile_report_declarations(&[declared], &["Account".to_string()], |m| {
            warnings.push(m)
        });
        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0].entity, None);
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn a_duplicate_name_keeps_the_first_and_says_so() {
        let first = ReportDeclaration {
            title: Some("First".to_string()),
            ..report("r1", "SELECT 1")
        };
        let second = ReportDeclaration {
            title: Some("Second".to_string()),
            ..report("r1", "SELECT 2")
        };
        let mut warnings = Vec::new();
        let reports = compile_report_declarations(&[first, second], &[], |m| warnings.push(m));
        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0].title, "First");
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn a_name_with_no_title_is_opened_out_into_one() {
        let compiled =
            validate_report_declaration(report("open_deals_by_stage", "SELECT 1")).unwrap();
        assert_eq!(compiled.title, "open deals by stage");
    }

    fn seeded(project_name: &str) -> String {
        let reports = compile_report_declarations(
            &[pipeline_by_owner()],
            &["Opportunity".to_string()],
            |_| {},
        );
        let mut tables = HashMap::new();
        tables.insert("Opportunity".to_string(), "bus_opportunity".to_string());
        build_reports_seed_sql(&ReportsSeedOptions {
            project_name,
            reports: &reports,
            table_for_entity: &tables,
        })
    }

    #[test]
    fn the_seed_resolves_the_entity_to_its_table() {
        assert!(seeded("acme").contains("'Opportunity', 'bus_opportunity'"));
    }

    #[test]
    fn a_model_with_no_reports_still_gets_a_seed_file() {
        // `src/tasks/seed_reports.rs` embeds this file with include_str!, so a
        // crate emitted without it does not compile — and parity cannot see
        // that, because both generators would emit the same nothing.
        let sql = build_reports_seed_sql(&ReportsSeedOptions {
            project_name: "acme",
            reports: &[],
            table_for_entity: &HashMap::new(),
        });
        assert!(sql.contains("declares no reports"));
        assert!(!sql.contains("INSERT INTO sys_report"));
    }

    #[test]
    fn every_statement_is_re_runnable() {
        let sql = seeded("acme");
        let inserts = sql.matches("INSERT INTO sys_report").count();
        assert_eq!(inserts, 1);
        let guarded = sql
            .lines()
            .filter(|line| line.trim() == "ON CONFLICT DO NOTHING;")
            .count();
        assert_eq!(guarded, inserts);
    }

    #[test]
    fn the_ids_are_stable_across_runs_and_scoped_to_the_project() {
        assert_eq!(seeded("acme"), seeded("acme"));
        assert_ne!(seeded("acme"), seeded("other"));
    }

    #[test]
    fn a_quote_in_the_query_does_not_escape_the_literal() {
        let reports = compile_report_declarations(
            &[report("r1", "SELECT 1 WHERE name = 'O''Brien'")],
            &[],
            |_| {},
        );
        let sql = build_reports_seed_sql(&ReportsSeedOptions {
            project_name: "acme",
            reports: &reports,
            table_for_entity: &HashMap::new(),
        });
        assert!(sql.contains("'SELECT 1 WHERE name = ''O''''Brien'''"));
    }
}
