//! XLSX and PDF output for the export route and the report, export and
//! email-batch workers — what `exceljs` and `jspdf` produce on the Node side.
//!
//! The files are equivalent, not byte-identical: both libraries embed
//! creation times and their own producer strings, so parity compares cell
//! values and text content (MIGRATION_PLAN.md §9, D-22).
pub mod pdf;
pub mod xlsx;

use serde_json::Value;

/// `String(value)` for a table cell, `""` for null.
#[must_use]
pub fn cell_text(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::String(s) => s.clone(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n
            .as_f64()
            .map_or_else(|| n.to_string(), crate::monitoring::js::number_to_string),
        other => crate::common::js::stringify(other),
    }
}

/// An RGB colour from a theme's `#rgb` / `#rrggbb` (or `rrggbbaa` for ARGB
/// sources), with a fallback — `hexToRGB` / `hexToARGB`.
#[must_use]
pub fn hex_rgb(hex: Option<&str>, fallback: u32) -> u32 {
    let Some(h) = hex.map(|h| h.replacen('#', "", 1)) else {
        return fallback;
    };
    let expanded = match h.len() {
        3 => h.chars().flat_map(|c| [c, c]).collect::<String>(),
        6 => h,
        8 => h[2..].to_string(),
        _ => return fallback,
    };
    u32::from_str_radix(&expanded, 16).unwrap_or(fallback)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn colours_like_node() {
        assert_eq!(hex_rgb(Some("#abc"), 0), 0xAABBCC);
        assert_eq!(hex_rgb(Some("#1e293b"), 0), 0x1E293B);
        assert_eq!(hex_rgb(None, 0xE0E0E0), 0xE0E0E0);
        assert_eq!(hex_rgb(Some("#12345"), 0xF0F0F0), 0xF0F0F0);
    }
}
