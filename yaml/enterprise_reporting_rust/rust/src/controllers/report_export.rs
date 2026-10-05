//! `POST /api/reports/{id}/export` — twin of
//! `src/routes/api/reports/$id/export.ts`: the report's rows (at most
//! `EXPORT_PAGE_SIZE`, default 10000) as CSV, XLSX, PDF or a self-contained
//! HTML page, laid out and coloured the way the Node route does.
//!
//! Node parity (MIGRATION_PLAN.md §9, P-11): a colour the report theme does
//! not set falls back to light grey everywhere — text included — so an
//! unthemed XLSX or PDF export has grey-on-grey cells. Both files are
//! equivalent rather than byte-identical to `exceljs` / `jsPDF` (D-22).
use axum::{
    body::{Body, Bytes},
    extract::{Path, State},
    http::{header, StatusCode},
    response::Response,
    routing::post,
};
use loco_rs::prelude::*;
use serde_json::{json, Map, Value};

use super::support::{active_data_source, find_by_id, has_limit, parse_body};
use crate::{
    auth::CurrentSession,
    common::{db::pool, js, response},
    datasources::get_connection,
    permissions::runnable_query::{decide_query_run, QueryRunDecision},
    render::{cell_text, hex_rgb, pdf, xlsx},
};

fn failed() -> Response {
    response::error(
        StatusCode::INTERNAL_SERVER_ERROR,
        "SERVER_ERROR",
        "Failed to export report",
    )
}

/// `isValidHexColor`.
fn valid_hex(c: Option<&str>) -> Option<&str> {
    c.filter(|c| {
        let h = c.strip_prefix('#').unwrap_or("");
        c.starts_with('#') && matches!(h.len(), 3 | 6) && h.chars().all(|x| x.is_ascii_hexdigit())
    })
}

/// `buildFilename`: the report name, then the first row's values of the
/// template's `field1` / `field2` when truthy.
fn filename(name: &str, template: Option<&str>, first: Option<&Map<String, Value>>, ext: &str) -> String {
    let mut out = name.to_string();
    if let (Some(t), Some(first)) = (template, first) {
        if let Ok(t) = serde_json::from_str::<Value>(t) {
            for key in ["field1", "field2"] {
                let field = t
                    .get(key)
                    .and_then(js::text)
                    .filter(|f| js::truthy(Some(&json!(f))));
                if let Some(v) = field.and_then(|f| first.get(&f)).filter(|v| js::truthy(Some(v))) {
                    out.push_str(&cell_text(v));
                }
            }
        }
    }
    format!("{out}.{ext}")
}

fn file(content_type: &str, name: &str, body: Vec<u8>) -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{name}\""),
        )
        .body(Body::from(body))
        .unwrap_or_else(|_| failed())
}

/// The theme colour, or Node's light-grey fallback (`hexToRGB` / `hexToARGB`).
fn theme_rgb(theme: &Value, key: &str) -> u32 {
    hex_rgb(theme.get(key).and_then(Value::as_str), 0x00E0_E0E0)
}

fn theme_pdf_rgb(theme: &Value, key: &str) -> pdf::Rgb {
    let raw = theme.get(key).and_then(Value::as_str);
    // hexToRGB takes 3 or 6 digits only, else 240,240,240.
    let v = match raw.map(|h| h.replacen('#', "", 1).len()) {
        Some(3 | 6) => hex_rgb(raw, 0x00F0_F0F0),
        _ => 0x00F0_F0F0,
    };
    #[allow(clippy::cast_possible_truncation)]
    ((v >> 16) as u8, (v >> 8) as u8, v as u8)
}

struct Table {
    headers: Vec<String>,
    /// Each header's field: the first column (visible or not) with that header.
    fields: Vec<String>,
    rows: Vec<Map<String, Value>>,
}

impl Table {
    fn value<'a>(&self, row: &'a Map<String, Value>, col: usize) -> &'a Value {
        row.get(&self.fields[col]).unwrap_or(&Value::Null)
    }
}

fn build_table(raw: &[Value], column_config: Option<&str>) -> Table {
    let config: Vec<Value> = column_config
        .and_then(|c| serde_json::from_str::<Value>(c).ok())
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    let objects: Vec<Map<String, Value>> = raw.iter().filter_map(|r| r.as_object().cloned()).collect();
    let field_of = |header: &str| {
        config
            .iter()
            .find(|c| c.get("header").and_then(js::text).as_deref() == Some(header))
            .and_then(|c| c.get("field").and_then(js::text))
            .filter(|f| !f.is_empty())
            .unwrap_or_else(|| header.to_string())
    };
    let visible: Vec<&Value> = config.iter().filter(|c| js::truthy(c.get("visible"))).collect();
    // No visible column means the result's own columns, as the viewer does.
    // Otherwise a report whose config marks nothing visible exports a file of
    // empty lines while the same report shows its rows on screen.
    if visible.is_empty() {
        let headers: Vec<String> = objects
            .first()
            .map(|r| r.keys().cloned().collect())
            .unwrap_or_default();
        let fields = headers.iter().map(|h| field_of(h)).collect();
        return Table {
            headers,
            fields,
            rows: objects,
        };
    }
    let headers: Vec<String> = visible
        .iter()
        .map(|c| c.get("header").map(crate::render::cell_text).unwrap_or_default())
        .collect();
    let rows = objects
        .iter()
        .map(|row| {
            let mut out = Map::new();
            for c in &visible {
                if let Some(f) = c.get("field").and_then(js::text) {
                    if let Some(v) = row.get(&f) {
                        out.insert(f, v.clone());
                    }
                }
            }
            out
        })
        .collect();
    let fields = headers.iter().map(|h| field_of(h)).collect();
    Table {
        headers,
        fields,
        rows,
    }
}

fn csv(t: &Table) -> String {
    let mut lines = vec![t.headers.join(",")];
    for row in &t.rows {
        let line: Vec<String> = (0..t.headers.len())
            .map(|i| {
                let s = cell_text(t.value(row, i));
                if s.contains(',') || s.contains('"') || s.contains('\n') {
                    format!("\"{}\"", s.replace('"', "\"\""))
                } else {
                    s
                }
            })
            .collect();
        lines.push(line.join(","));
    }
    lines.join("\n")
}

fn workbook(t: &Table, theme: &Value) -> Result<Vec<u8>, String> {
    let weight = theme.get("headerFontWeight").and_then(Value::as_str);
    let style = xlsx::Theme {
        header_bold: matches!(weight, Some("bold" | "700")),
        header_text: Some(theme_rgb(theme, "headerTextColor")),
        header_fill: Some(theme_rgb(theme, "headerBackgroundColor")),
        row_text: Some(theme_rgb(theme, "rowTextColor")),
        row_fill: Some(theme_rgb(theme, "rowBackgroundColor")),
        alt_text: Some(theme_rgb(theme, "alternatingRowTextColor")),
        alt_fill: Some(theme_rgb(theme, "alternatingRowBackgroundColor")),
        border: Some(theme_rgb(theme, "borderColor")),
    };
    // Node writes a missing value as "" (a string cell).
    let rows: Vec<Vec<Value>> = t
        .rows
        .iter()
        .map(|r| {
            (0..t.headers.len())
                .map(|i| match t.value(r, i) {
                    Value::Null => json!(""),
                    v => v.clone(),
                })
                .collect()
        })
        .collect();
    xlsx::write("Report Data", &t.headers, &rows, &style, xlsx::Widths::Grown).map_err(|e| e.to_string())
}

/// The Node route's hand-drawn landscape table, cell for cell.
fn document(t: &Table, title: &str, theme: &Value) -> Vec<u8> {
    let mut doc = pdf::Pdf::a4(true);
    let (page_w, page_h) = (doc.width(), doc.height());
    let (margin, table_top, row_h, pad) = (10.0, 30.0, 7.0, 2.0);
    doc.font(true, 16.0);
    doc.text(margin, 15.0, title, (0, 0, 0));
    doc.font(false, 8.0);
    doc.text(
        margin,
        22.0,
        &format!("Generated: {}", pdf::locale_now()),
        (0, 0, 0),
    );
    #[allow(clippy::cast_precision_loss)]
    let col_w = (page_w - 2.0 * margin) / t.headers.len() as f64;
    let head_bg = theme_pdf_rgb(theme, "headerBackgroundColor");
    let head_fg = theme_pdf_rgb(theme, "headerTextColor");
    let head_bold = matches!(
        theme.get("headerFontWeight").and_then(Value::as_str),
        Some("bold" | "700")
    );
    let cell = |doc: &mut pdf::Pdf, x: f64, y: f64, text: &str, bg: pdf::Rgb, fg: pdf::Rgb, bold: bool| {
        doc.rect(x, y - row_h + pad, col_w, row_h, bg);
        doc.font(bold, 8.0);
        let shown = doc.fit(text, col_w - 2.0 * pad);
        doc.text(x + pad, y, &shown, fg);
    };
    let heading = |doc: &mut pdf::Pdf, y: f64| {
        for (i, h) in t.headers.iter().enumerate() {
            #[allow(clippy::cast_precision_loss)]
            cell(doc, margin + i as f64 * col_w, y, h, head_bg, head_fg, head_bold);
        }
    };
    let mut y = table_top;
    heading(&mut doc, y);
    y += row_h;
    for (r, row) in t.rows.iter().enumerate() {
        let alt = r % 2 == 1;
        let bg = theme_pdf_rgb(
            theme,
            if alt {
                "alternatingRowBackgroundColor"
            } else {
                "rowBackgroundColor"
            },
        );
        let fg = theme_pdf_rgb(
            theme,
            if alt {
                "alternatingRowTextColor"
            } else {
                "rowTextColor"
            },
        );
        if y > page_h - margin {
            doc.add_page();
            y = table_top;
            heading(&mut doc, y);
            y += row_h;
        }
        for i in 0..t.headers.len() {
            let text = cell_text(t.value(row, i));
            #[allow(clippy::cast_precision_loss)]
            cell(&mut doc, margin + i as f64 * col_w, y, &text, bg, fg, false);
        }
        y += row_h;
    }
    let pages = doc.page_count();
    for p in 1..=pages {
        doc.set_page(p);
        doc.font(false, 8.0);
        doc.text_centered(
            page_w / 2.0,
            page_h - 5.0,
            &format!("Page {p} of {pages} | Total rows: {}", t.rows.len()),
            (0, 0, 0),
        );
    }
    doc.finish()
}

fn script_json(v: &Value) -> String {
    js::stringify(v).replace('<', "\\u003c").replace('>', "\\u003e")
}

fn html(t: &Table, title: &str, theme: &Value, exported_by: &str) -> String {
    let c = |k: &str, d: &'static str| {
        valid_hex(theme.get(k).and_then(Value::as_str))
            .unwrap_or(d)
            .to_string()
    };
    let (header_bg, header_text) = (
        c("headerBackgroundColor", "#1e293b"),
        c("headerTextColor", "#ffffff"),
    );
    let (row_bg, row_text) = (c("rowBackgroundColor", "#ffffff"), c("rowTextColor", "#334155"));
    let (alt_bg, alt_text) = (
        c("alternatingRowBackgroundColor", "#f8fafc"),
        c("alternatingRowTextColor", "#334155"),
    );
    let border = c("borderColor", "#e2e8f0");
    let data = script_json(&Value::Array(t.rows.iter().cloned().map(Value::Object).collect()));
    let headers = script_json(&json!(t.headers));
    let name = title.replace('"', "&quot;");
    let time = pdf::locale_now();
    let total = t.rows.len();
    // One pass over the template, so text substituted in (a report name,
    // a cell value) is never itself scanned for placeholders.
    let values = [
        ("borderColor", border.as_str()),
        ("headerBg", header_bg.as_str()),
        ("headerText", header_text.as_str()),
        ("rowBg", row_bg.as_str()),
        ("rowText", row_text.as_str()),
        ("altRowBg", alt_bg.as_str()),
        ("altRowText", alt_text.as_str()),
        ("reportName", name.as_str()),
        ("exportTime", time.as_str()),
        ("exportedBy", exported_by),
        ("totalRows", &total.to_string()),
        ("headersJson", headers.as_str()),
        ("dataJson", data.as_str()),
    ];
    let template = include_str!("report_export.html");
    let mut out = String::with_capacity(template.len() + data.len());
    let mut rest = template;
    while let Some(start) = rest.find("{{") {
        out.push_str(&rest[..start]);
        let after = &rest[start + 2..];
        match after.find("}}").and_then(|end| {
            let key = &after[..end];
            values.iter().find(|(k, _)| *k == key).map(|(_, v)| (end, *v))
        }) {
            Some((end, v)) => {
                out.push_str(v);
                rest = &after[end + 2..];
            }
            None => {
                out.push_str("{{");
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

/// Is `format` enabled by the report's `export_formats` (a list, or a map of
/// format → false)? Unparsable means enabled.
fn format_enabled(export_formats: Option<&str>, format: &Value) -> bool {
    let Some(parsed) = export_formats.and_then(|f| serde_json::from_str::<Value>(f).ok()) else {
        return true;
    };
    match parsed {
        Value::Array(a) => a.contains(format),
        Value::Object(o) => js::text(format).and_then(|f| o.get(&f).cloned()) != Some(Value::Bool(false)),
        _ => true,
    }
}

async fn export(
    CurrentSession(session): CurrentSession,
    State(ctx): State<AppContext>,
    Path(id): Path<String>,
    body: Bytes,
) -> Result<Response> {
    let Some(session) = session else {
        return Ok(response::unauthorized());
    };
    let Some(body) = parse_body(&body) else {
        return Ok(failed());
    };
    let format = body.get("format").cloned().unwrap_or_else(|| json!("csv"));
    let db = pool(&ctx);
    let report = match find_by_id(db, "report_definitions", &id).await {
        Ok(Some(r)) => r,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Report not found",
            ))
        }
        Err(_) => return Ok(failed()),
    };
    let s = |k: &str| report.get(k).and_then(Value::as_str).map(str::to_string);
    if !format_enabled(s("export_formats").as_deref(), &format) {
        let Some(f) = format.as_str() else {
            return Ok(failed());
        };
        return Ok(response::error(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            &format!("{} export is not enabled for this report", f.to_uppercase()),
        ));
    }
    let Some(query_id) = s("saved_query_id").filter(|q| !q.is_empty()) else {
        return Ok(response::error(
            StatusCode::BAD_REQUEST,
            "NO_QUERY",
            "Report has no associated query",
        ));
    };
    let query = match find_by_id(db, "saved_queries", &query_id).await {
        Ok(Some(q)) => q,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "QUERY_NOT_FOUND",
                "Associated query not found",
            ))
        }
        Err(_) => return Ok(failed()),
    };
    let sql = query
        .get("sql_content")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let ds_id = query
        .get("data_source_id")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let ds = match active_data_source(db, ds_id).await {
        Ok(Some(d)) => d,
        Ok(None) => {
            return Ok(response::error(
                StatusCode::NOT_FOUND,
                "DATASOURCE_NOT_FOUND",
                "Data source not found",
            ))
        }
        Err(_) => return Ok(failed()),
    };
    if let QueryRunDecision::Refused(m) = decide_query_run(db, &session.user.id, sql, ds_id).await {
        return Ok(response::error(StatusCode::FORBIDDEN, "FORBIDDEN", &m));
    }
    let max_rows = std::env::var("EXPORT_PAGE_SIZE")
        .ok()
        .and_then(|v| crate::common::pagination::js_parse_int(&v))
        .unwrap_or(10000);
    let base = sql.strip_suffix(';').unwrap_or(sql).trim();
    let limited = if has_limit(base) {
        base.to_string()
    } else {
        format!("{base} LIMIT {max_rows}")
    };
    let raw = match get_connection(&ds).await {
        Ok(conn) => match conn.fetch_json(&limited).await {
            Ok(r) => r,
            Err(e) => {
                tracing::error!(error = %e, "Error exporting report");
                return Ok(failed());
            }
        },
        Err(e) => {
            tracing::error!(error = %e, "Error exporting report");
            return Ok(failed());
        }
    };

    let table = build_table(&raw, s("column_config").as_deref());
    let name = s("name")
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "report".into());
    let title = s("name")
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "Report".into());
    let template = s("filename_template");
    let theme = s("color_theme")
        .and_then(|t| serde_json::from_str::<Value>(&t).ok())
        .filter(Value::is_object)
        .unwrap_or_else(|| json!({}));
    let first_raw = raw.first().and_then(Value::as_object);
    let first = table.rows.first();
    Ok(match format.as_str() {
        Some("csv") => file(
            "text/csv",
            &filename(&name, template.as_deref(), first_raw, "csv"),
            csv(&table).into_bytes(),
        ),
        Some("xlsx") => match workbook(&table, &theme) {
            Ok(bytes) => file(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                &filename(&name, template.as_deref(), first, "xlsx"),
                bytes,
            ),
            Err(e) => {
                tracing::error!(error = %e, "Error exporting report");
                failed()
            }
        },
        Some("pdf") => file(
            "application/pdf",
            &filename(&name, template.as_deref(), first, "pdf"),
            document(&table, &title, &theme),
        ),
        Some("html") => file(
            "text/html; charset=utf-8",
            &filename(&name, template.as_deref(), first, "html"),
            html(&table, &title, &theme, &session.user.email).into_bytes(),
        ),
        _ => response::error(StatusCode::BAD_REQUEST, "INVALID_FORMAT", "Invalid export format"),
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/reports")
        .add("/{id}/export", post(export))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn visible_columns_in_config_order() {
        let raw = vec![json!({"a": 1, "b": "x,y", "c": null})];
        let t = build_table(
            &raw,
            Some(
                r#"[{"field":"b","header":"B","visible":true},{"field":"a","header":"A","visible":false},{"field":"c","header":"C","visible":true}]"#,
            ),
        );
        assert_eq!(t.headers, vec!["B", "C"]);
        assert_eq!(csv(&t), "B,C\n\"x,y\",");
    }

    #[test]
    fn no_visible_column_exports_the_result_columns() {
        // A config with nothing marked visible — the shape a reporting pack
        // wrote before its columns were written as ColumnDefinitions — must
        // export what the viewer shows, not a file of empty lines.
        let raw = vec![json!({"bucket": "active", "records": 2})];
        let t = build_table(
            &raw,
            Some(r#"[{"field":"bucket","label":"Status"},{"field":"records","label":"Records"}]"#),
        );
        assert_eq!(t.headers, vec!["bucket", "records"]);
        assert_eq!(csv(&t), "bucket,records\nactive,2");
    }

    #[test]
    fn filenames_and_formats() {
        let first = json!({"region": "EU", "year": 2026});
        assert_eq!(
            filename(
                "Sales",
                Some(r#"{"field1":"region","field2":"year"}"#),
                first.as_object(),
                "csv"
            ),
            "SalesEU2026.csv"
        );
        assert!(format_enabled(Some(r#"["csv","pdf"]"#), &json!("pdf")));
        assert!(!format_enabled(Some(r#"{"xlsx":false}"#), &json!("xlsx")));
        assert!(format_enabled(Some("not json"), &json!("xlsx")));
    }
}
