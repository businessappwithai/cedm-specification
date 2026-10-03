//! Files the report and export workers write, under `JOB_OUTPUT_PATH`
//! (default `./job-outputs`), as the Node workers do.
use std::path::PathBuf;

use serde_json::Value;

use crate::monitoring::js::number_to_string;

/// `JOB_OUTPUT_PATH`, normalised the way Node's `path.join` normalises it
/// (`./job-outputs` → `job-outputs`), so stored paths read the same from
/// both backends. A relative path resolves against each process's own
/// working directory, so an installation running both sets it absolute.
#[must_use]
pub fn output_dir() -> PathBuf {
    let raw = std::env::var("JOB_OUTPUT_PATH").unwrap_or_else(|_| "./job-outputs".into());
    let mut p = PathBuf::new();
    for c in std::path::Path::new(&raw).components() {
        if c != std::path::Component::CurDir {
            p.push(c);
        }
    }
    if p.as_os_str().is_empty() {
        PathBuf::from(".")
    } else {
        p
    }
}

/// `String(value)` for a cell. Timestamps are already ISO strings here; Node
/// passes `Date` objects and gets `Date#toString()` — a deliberate difference
/// (MIGRATION_PLAN.md §9, D-3).
fn cell(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::String(s) => s.clone(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.as_f64().map_or_else(|| n.to_string(), number_to_string),
        other => other.to_string(),
    }
}

/// CSV the way `report-worker.ts` / `export-worker.ts` join it: header row of
/// the first row's keys, `\n` line ends, no trailing newline, and a value
/// quoted only when it contains `,`, `"` or a newline. `quote_non_strings`
/// is the report worker's variant (it stringifies before testing); the export
/// worker tests strings only.
#[must_use]
pub fn to_csv(rows: &[Value], quote_non_strings: bool) -> String {
    let Some(first) = rows.first().and_then(Value::as_object) else {
        return String::new();
    };
    let headers: Vec<&String> = first.keys().collect();
    let mut lines = Vec::with_capacity(rows.len() + 1);
    lines.push(headers.iter().map(|h| h.as_str()).collect::<Vec<_>>().join(","));
    for row in rows {
        let line = headers
            .iter()
            .map(|h| {
                let v = row.get(h.as_str()).unwrap_or(&Value::Null);
                let s = cell(v);
                let eligible = quote_non_strings || v.is_string();
                if eligible && (s.contains(',') || s.contains('"') || s.contains('\n')) {
                    format!("\"{}\"", s.replace('"', "\"\""))
                } else {
                    s
                }
            })
            .collect::<Vec<_>>()
            .join(",");
        lines.push(line);
    }
    lines.join("\n")
}

/// The first row's keys and every row's values in that order, as the Node
/// writers build their tables.
#[must_use]
pub fn table(rows: &[Value]) -> (Vec<String>, Vec<Vec<Value>>) {
    let Some(first) = rows.first().and_then(Value::as_object) else {
        return (Vec::new(), Vec::new());
    };
    let headers: Vec<String> = first.keys().cloned().collect();
    let body = rows
        .iter()
        .map(|r| {
            headers
                .iter()
                .map(|h| r.get(h).cloned().unwrap_or(Value::Null))
                .collect()
        })
        .collect();
    (headers, body)
}

/// An XLSX or PDF file for a worker's rows. `title` is the report name the
/// report and email workers print (the export worker prints none) and name
/// the sheet after (the export worker's sheet is `Data`).
///
/// # Errors
/// An unsupported format, or a writer error.
pub fn render_file(format: &str, rows: &[Value], title: Option<&str>) -> Result<Vec<u8>, String> {
    use crate::render::{cell_text, pdf, xlsx};
    let (headers, body) = table(rows);
    match format {
        "xlsx" => {
            let widths = if title.is_some() {
                xlsx::Widths::Capped
            } else {
                xlsx::Widths::Grown
            };
            xlsx::write(
                title.unwrap_or("Data"),
                &headers,
                &body,
                &xlsx::Theme::worker(),
                widths,
            )
            .map_err(|e| e.to_string())
        }
        "pdf" => {
            let text: Vec<Vec<String>> = body.iter().map(|r| r.iter().map(cell_text).collect()).collect();
            Ok(pdf::worker_table(title, &headers, &text))
        }
        other => Err(format!("Unsupported format: {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn csv_matches_node_join() {
        let rows = vec![
            json!({"id": 1, "name": "a,b", "note": "say \"hi\"", "n": null, "x": 1.5}),
            json!({"id": 2, "name": "plain", "note": "", "n": "7", "x": 2.0}),
        ];
        assert_eq!(
            to_csv(&rows, true),
            "id,name,note,n,x\n1,\"a,b\",\"say \"\"hi\"\"\",,1.5\n2,plain,,7,2"
        );
        assert_eq!(to_csv(&[], true), "");
    }
}
