//! `exceljs` workbooks: one sheet, a styled header row, data rows, and the
//! column-width rule of whichever Node writer this replaces.
use rust_xlsxwriter::{Color, Format, FormatBorder, FormatPattern, Workbook, Worksheet, XlsxError};
use serde_json::Value;

use super::cell_text;

/// The colours a report theme sets; `None` is ExcelJS's default look.
#[derive(Debug, Clone, Default)]
pub struct Theme {
    pub header_bold: bool,
    pub header_text: Option<u32>,
    pub header_fill: Option<u32>,
    pub row_text: Option<u32>,
    pub row_fill: Option<u32>,
    pub alt_text: Option<u32>,
    pub alt_fill: Option<u32>,
    pub border: Option<u32>,
}

impl Theme {
    /// The workers' look: a bold header on `FFE0E0E0`, plain rows.
    #[must_use]
    pub fn worker() -> Self {
        Self {
            header_bold: true,
            header_fill: Some(0x00E0_E0E0),
            ..Self::default()
        }
    }
}

/// How column widths are chosen — the Node writers differ.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Widths {
    /// Report and email workers: `min(max(10, longest) + 2, 50)`.
    Capped,
    /// Export route and export worker: an empty cell counts as 10;
    /// `longest < 10 ? 10 : longest + 2`.
    Grown,
    /// NL report generation: from the header alone,
    /// `max(12, min(30, header.length + 4))`.
    Header,
}

/// Excel refuses `[]:*?/\` in a sheet name and more than 31 characters;
/// ExcelJS would throw on the first and truncate the second.
fn sheet_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if "[]:*?/\\".contains(c) { ' ' } else { c })
        .take(31)
        .collect();
    let trimmed = cleaned.trim().trim_matches('\'').to_string();
    if trimmed.is_empty() {
        "Sheet1".into()
    } else {
        trimmed
    }
}

fn format(bold: bool, text: Option<u32>, fill: Option<u32>, border: Option<u32>) -> Format {
    let mut f = Format::new();
    if bold {
        f = f.set_bold();
    }
    if let Some(c) = text {
        f = f.set_font_color(Color::RGB(c));
    }
    if let Some(c) = fill {
        f = f
            .set_pattern(FormatPattern::Solid)
            .set_background_color(Color::RGB(c));
    }
    if let Some(c) = border {
        f = f.set_border(FormatBorder::Thin).set_border_color(Color::RGB(c));
    }
    f
}

/// One workbook as bytes. `rows` are already in header order.
///
/// # Errors
/// On a writer error (none are expected for valid input).
pub fn write(
    sheet: &str,
    headers: &[String],
    rows: &[Vec<Value>],
    theme: &Theme,
    widths: Widths,
) -> Result<Vec<u8>, XlsxError> {
    let mut wb = Workbook::new();
    add_table(&mut wb, sheet, headers, rows, theme, widths)?;
    wb.save_to_buffer()
}

/// A sheet holding a styled table, added to `wb`.
///
/// # Errors
/// On a writer error.
pub fn add_table<'a>(
    wb: &'a mut Workbook,
    sheet: &str,
    headers: &[String],
    rows: &[Vec<Value>],
    theme: &Theme,
    widths: Widths,
) -> Result<&'a mut Worksheet, XlsxError> {
    let ws = wb.add_worksheet();
    ws.set_name(sheet_name(sheet))?;
    if headers.is_empty() {
        return Ok(ws);
    }
    let head = format(
        theme.header_bold,
        theme.header_text,
        theme.header_fill,
        theme.border,
    );
    let plain = format(false, theme.row_text, theme.row_fill, theme.border);
    let alt = format(false, theme.alt_text, theme.alt_fill, theme.border);
    let mut longest: Vec<usize> = headers.iter().map(|h| h.chars().count()).collect();
    for (c, h) in headers.iter().enumerate() {
        let col = u16::try_from(c).unwrap_or(u16::MAX);
        ws.write_string_with_format(0, col, h, &head)?;
    }
    for (r, row) in rows.iter().enumerate() {
        let fmt = if r % 2 == 1 { &alt } else { &plain };
        let rr = u32::try_from(r + 1).unwrap_or(u32::MAX);
        for (c, v) in row.iter().enumerate().take(headers.len()) {
            let col = u16::try_from(c).unwrap_or(u16::MAX);
            // `cell.value ? String(cell.value).length : …` — every falsy
            // value (empty, 0, false) is "empty" to both Node writers.
            let falsy = match v {
                Value::Null => true,
                Value::String(s) => s.is_empty(),
                Value::Bool(b) => !b,
                Value::Number(n) => n.as_f64().is_some_and(|f| f == 0.0),
                _ => false,
            };
            let len = if falsy { 0 } else { cell_text(v).chars().count() };
            let len = if len == 0 && widths == Widths::Grown {
                10
            } else {
                len
            };
            longest[c] = longest[c].max(len);
            match v {
                Value::Number(n) => {
                    ws.write_number_with_format(rr, col, n.as_f64().unwrap_or_default(), fmt)?;
                }
                Value::Bool(b) => {
                    ws.write_boolean_with_format(rr, col, *b, fmt)?;
                }
                Value::Null => {
                    ws.write_blank(rr, col, fmt)?;
                }
                other => {
                    ws.write_string_with_format(rr, col, cell_text(other), fmt)?;
                }
            }
        }
    }
    for (c, l) in longest.iter().enumerate() {
        let header_len = headers[c].chars().count();
        #[allow(clippy::cast_precision_loss)]
        let w = match widths {
            Widths::Capped => ((*l).max(10) + 2).min(50),
            Widths::Grown if *l < 10 => 10,
            Widths::Grown => l + 2,
            Widths::Header => (header_len + 4).clamp(12, 30),
        } as f64;
        ws.set_column_width(u16::try_from(c).unwrap_or(u16::MAX), w)?;
    }
    Ok(ws)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn writes_a_readable_workbook() {
        let bytes = write(
            "Report: Q1/2026",
            &["id".into(), "name".into()],
            &[vec![json!(1), json!("a")], vec![json!(2), Value::Null]],
            &Theme::worker(),
            Widths::Capped,
        )
        .unwrap();
        assert_eq!(&bytes[..2], b"PK");
        assert_eq!(sheet_name("Report: Q1/2026"), "Report  Q1 2026");
        assert_eq!(sheet_name(""), "Sheet1");
    }
}
