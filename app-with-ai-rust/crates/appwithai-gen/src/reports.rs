//! `%%report` → `seed/reports.sql`, the questions a generated application ships with.
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

use std::collections::{HashMap, HashSet};

use uuid::Uuid;

use crate::dictionary::{insert, now, text, Sql, NAMESPACE};

/// The chart types `%%report chart:` may name. Mirrors `appwithai-language.json`.
pub const REPORT_CHART_TYPES: &[&str] = &["bar", "line", "pie", "area"];

/// The keys `%%report` understands, in the order a value scan has to stop at.
///
/// `sql:` is deliberately absent: it is split off the line first, because SQL
/// contains both spaces and colons and a key/value scan would shred it.
const KEYS: &[&str] = &["title", "entity", "chart", "x", "y", "help"];

/// One `%%report`, as the generated application will store it.
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

/// Read one `%%report` line.
///
/// `Err` carries the reason, which the caller turns into a warning naming the
/// line — silence is what this whole module exists to fix.
pub fn parse_report_directive(line: &str) -> Result<CompiledReport, String> {
    let trimmed = line.trim();
    // Anchored, and a run of `%%` is allowed for the same reason `hooks.rs`
    // allows it: older generated flowcharts emitted `%%%%`. A `%%` line that
    // merely mentions a report in prose is prose.
    let rest = match strip_directive(trimmed) {
        Some(rest) if !rest.trim().is_empty() => rest.trim().to_string(),
        _ => return Err("not a %%report directive".to_string()),
    };

    let (head, sql) = match split_sql(&rest) {
        Some(split) => split,
        None => return Err("has no sql: clause".to_string()),
    };

    let (name, keys) = match split_name(&head) {
        Some(split) => split,
        None => return Err("has no name".to_string()),
    };

    if !is_read_only(&sql) {
        return Err("sql: is not a SELECT or WITH query".to_string());
    }
    if has_statement_break(&sql) {
        return Err("sql: contains more than one statement".to_string());
    }

    let chart = read_key(&keys, "chart");
    if let Some(chart) = chart.as_deref() {
        if !REPORT_CHART_TYPES.contains(&chart) {
            return Err(format!("has unknown chart type \"{chart}\""));
        }
    }
    let x = read_key(&keys, "x");
    let y = read_key(&keys, "y");
    // A chart with one axis renders nothing and reports no error, which is
    // worse than not being a chart.
    if let Some(chart) = chart.as_deref() {
        if x.is_none() || y.is_none() {
            return Err(format!("declares chart: {chart} but not both x: and y:"));
        }
    }

    Ok(CompiledReport {
        title: read_key(&keys, "title").unwrap_or_else(|| spaced(&name)),
        name,
        entity: read_key(&keys, "entity"),
        chart,
        x,
        y,
        help: read_key(&keys, "help"),
        sql,
    })
}

/// `%%report` / `%%%%report`, case-insensitively, followed by whitespace.
fn strip_directive(line: &str) -> Option<&str> {
    let after_percent = line.trim_start_matches('%');
    if line.len() - after_percent.len() < 2 {
        return None;
    }
    let lowered = after_percent.to_ascii_lowercase();
    if !lowered.starts_with("report") {
        return None;
    }
    let rest = &after_percent["report".len()..];
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    Some(rest)
}

/// Split the head from `sql:` — the last such key, case-insensitively.
///
/// Non-greedy in the TypeScript, so the *first* `sql:` wins there; matched here
/// by scanning forward for the earliest occurrence on a word boundary.
fn split_sql(rest: &str) -> Option<(String, String)> {
    let lowered = rest.to_ascii_lowercase();
    let bytes = lowered.as_bytes();
    let mut from = 0;
    while let Some(found) = lowered[from..].find("sql:") {
        let at = from + found;
        let preceded_by_word =
            at > 0 && (bytes[at - 1].is_ascii_alphanumeric() || bytes[at - 1] == b'_');
        if !preceded_by_word {
            let head = rest[..at].to_string();
            let sql = rest[at + "sql:".len()..].trim().to_string();
            if sql.is_empty() {
                return None;
            }
            return Some((head, sql));
        }
        from = at + 1;
    }
    None
}

/// The leading identifier, and whatever keys follow it.
fn split_name(head: &str) -> Option<(String, String)> {
    let start = head.trim_start();
    let mut chars = start.char_indices();
    let first = chars.next()?.1;
    if !first.is_ascii_alphabetic() && first != '_' {
        return None;
    }
    let end = start
        .char_indices()
        .find(|(_, ch)| !(ch.is_ascii_alphanumeric() || *ch == '_' || *ch == '-'))
        .map_or(start.len(), |(index, _)| index);
    Some((start[..end].to_string(), start[end..].to_string()))
}

/// Each value runs to the next key or the end of the head.
///
/// `help:` is a sentence and may contain any of the other words, so a value
/// stops only at a real key — one preceded by whitespace and followed by a
/// colon, scanned over the whole key set rather than one key at a time.
fn read_key(keys: &str, key: &str) -> Option<String> {
    let lowered = keys.to_ascii_lowercase();
    let needle = format!("{key}:");
    let bytes = lowered.as_bytes();
    let mut from = 0;
    let start = loop {
        let found = from + lowered[from..].find(&needle)?;
        let preceded_ok = found == 0 || bytes[found - 1].is_ascii_whitespace();
        if preceded_ok {
            break found + needle.len();
        }
        from = found + 1;
    };

    let tail = &keys[start..];
    let tail_lower = &lowered[start..];
    let mut end = tail.len();
    for other in KEYS {
        let other_needle = format!("{other}:");
        let mut scan = 0;
        while let Some(found) = tail_lower[scan..].find(&other_needle) {
            let at = scan + found;
            let preceded_ok = at > 0 && tail_lower.as_bytes()[at - 1].is_ascii_whitespace();
            if preceded_ok && at < end {
                end = at;
                break;
            }
            scan = at + 1;
        }
    }
    let value = tail[..end].trim();
    if value.is_empty() {
        None
    } else {
        Some(value.to_string())
    }
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

/// Compile every `%%report` in the document.
///
/// `entity_names` is what an `entity:` key is resolved against: a report naming
/// an entity the model does not declare is kept, but loses the grouping,
/// because the query is still a valid question about the database even when the
/// label on it is wrong.
pub fn compile_reports<F: FnMut(String)>(
    source: &str,
    entity_names: &[String],
    mut warn: F,
) -> Vec<CompiledReport> {
    let known: HashSet<&str> = entity_names.iter().map(String::as_str).collect();
    let mut seen: HashSet<String> = HashSet::new();
    let mut out: Vec<CompiledReport> = Vec::new();

    for line in source.lines() {
        if strip_directive(line.trim()).is_none() {
            continue;
        }

        let mut report = match parse_report_directive(line) {
            Ok(report) => report,
            Err(reason) => {
                let shown: String = line.trim().chars().take(120).collect();
                warn(format!("%%report {reason} — skipped: {shown}"));
                continue;
            }
        };

        // The checker reports a duplicate name as EML292. Reaching here with
        // one means the model was not checked, and two rows under one key would
        // make whichever the seed wrote last the only one anybody could open.
        if seen.contains(&report.name) {
            warn(format!(
                "%%report \"{}\" is declared more than once — keeping the first",
                report.name
            ));
            continue;
        }

        if let Some(entity) = report.entity.as_deref() {
            if !known.contains(entity) {
                warn(format!(
                    "%%report \"{}\" names entity \"{entity}\", which the model does not declare — ungrouped",
                    report.name
                ));
                report.entity = None;
            }
        }

        seen.insert(report.name.clone());
        out.push(report);
    }

    out
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
        "-- One row per `%%report` directive. Every statement is `ON CONFLICT DO NOTHING`"
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
        out.push(
            "-- This model declares no %%report directives, so there is nothing to seed."
                .to_string(),
        );
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

    const LINE: &str = "%%report pipeline-by-owner title: Pipeline by owner entity: Opportunity chart: bar x: owner y: total help: What each rep is carrying, for the weekly review. sql: SELECT u.first_name AS owner, SUM(o.amount) AS total FROM bus_opportunity o JOIN bus_user u ON u.id = o.owner_id WHERE o.deleted_at IS NULL GROUP BY 1 ORDER BY total DESC";

    #[test]
    fn reads_every_key_off_the_specifications_own_example() {
        let report = parse_report_directive(LINE).expect("the spec's example parses");
        assert_eq!(report.name, "pipeline-by-owner");
        assert_eq!(report.title, "Pipeline by owner");
        assert_eq!(report.entity.as_deref(), Some("Opportunity"));
        assert_eq!(report.chart.as_deref(), Some("bar"));
        assert_eq!(report.x.as_deref(), Some("owner"));
        assert_eq!(report.y.as_deref(), Some("total"));
        assert_eq!(
            report.help.as_deref(),
            Some("What each rep is carrying, for the weekly review.")
        );
        assert!(report.sql.starts_with("SELECT u.first_name"));
        assert!(report.sql.ends_with("ORDER BY total DESC"));
    }

    #[test]
    fn a_help_sentence_containing_a_key_word_is_not_cut_short() {
        // "chart" and "entity" appear inside the sentence. A value stops only
        // at a real key — one preceded by whitespace and followed by a colon.
        let line = "%%report r1 help: The chart the entity team asks for sql: SELECT 1";
        let report = parse_report_directive(line).expect("parses");
        assert_eq!(
            report.help.as_deref(),
            Some("The chart the entity team asks for")
        );
    }

    #[test]
    fn a_write_is_refused_however_it_is_dressed_up() {
        for sql in [
            "DELETE FROM bus_account",
            "UPDATE bus_account SET name = 'x'",
            "INSERT INTO bus_account (id) VALUES (1)",
            "selection_of(1)",
        ] {
            let line = format!("%%report r1 sql: {sql}");
            assert!(
                parse_report_directive(&line).is_err(),
                "{sql} should be refused"
            );
        }
    }

    #[test]
    fn a_second_statement_behind_a_select_is_refused() {
        let line = "%%report r1 sql: SELECT 1; DROP TABLE bus_account";
        assert!(parse_report_directive(line).is_err());
    }

    #[test]
    fn a_semicolon_inside_a_literal_is_an_ordinary_character() {
        let line = "%%report r1 sql: SELECT ';' AS sep FROM bus_account;";
        let report = parse_report_directive(line).expect("one statement");
        assert!(report.sql.contains("';'"));
    }

    #[test]
    fn a_chart_missing_an_axis_is_refused_rather_than_rendered_blank() {
        let line = "%%report r1 chart: bar x: owner sql: SELECT 1";
        assert!(parse_report_directive(line).is_err());
        let unknown = "%%report r1 chart: donut x: a y: b sql: SELECT 1";
        assert!(parse_report_directive(unknown).is_err());
    }

    #[test]
    fn prose_mentioning_the_directive_is_not_compiled() {
        let source = "%% a %%report directive names a question\n%%reporting is not this\n";
        let reports = compile_reports(source, &[], |_| {});
        assert!(reports.is_empty());
    }

    #[test]
    fn an_unknown_entity_loses_the_grouping_but_keeps_the_report() {
        let source = "%%report r1 entity: Ghost sql: SELECT 1";
        let mut warnings = Vec::new();
        let reports = compile_reports(source, &["Account".to_string()], |m| warnings.push(m));
        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0].entity, None);
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn a_duplicate_name_keeps_the_first_and_says_so() {
        let source =
            "%%report r1 title: First sql: SELECT 1\n%%report r1 title: Second sql: SELECT 2";
        let mut warnings = Vec::new();
        let reports = compile_reports(source, &[], |m| warnings.push(m));
        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0].title, "First");
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn a_name_with_no_title_is_opened_out_into_one() {
        let report = parse_report_directive("%%report open_deals_by_stage sql: SELECT 1").unwrap();
        assert_eq!(report.title, "open deals by stage");
    }

    fn seeded() -> String {
        let reports = compile_reports(LINE, &["Opportunity".to_string()], |_| {});
        let mut tables = HashMap::new();
        tables.insert("Opportunity".to_string(), "bus_opportunity".to_string());
        build_reports_seed_sql(&ReportsSeedOptions {
            project_name: "acme",
            reports: &reports,
            table_for_entity: &tables,
        })
    }

    #[test]
    fn the_seed_resolves_the_entity_to_its_table() {
        let sql = seeded();
        assert!(sql.contains("'Opportunity', 'bus_opportunity'"));
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
        assert!(sql.contains("declares no %%report directives"));
        assert!(!sql.contains("INSERT INTO sys_report"));
    }

    #[test]
    fn every_statement_is_re_runnable() {
        let sql = seeded();
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
        assert_eq!(seeded(), seeded());
        let reports = compile_reports(LINE, &[], |_| {});
        let other = build_reports_seed_sql(&ReportsSeedOptions {
            project_name: "other",
            reports: &reports,
            table_for_entity: &HashMap::new(),
        });
        assert_ne!(seeded(), other);
    }

    #[test]
    fn a_quote_in_the_query_does_not_escape_the_literal() {
        let reports = compile_reports(
            "%%report r1 sql: SELECT 1 WHERE name = 'O''Brien'",
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
