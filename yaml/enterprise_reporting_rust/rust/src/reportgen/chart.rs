//! The report chart. Node draws it with ECharts (server-side SVG) and
//! rasterises it with `sharp`; here the same series are drawn natively — a
//! vector chart in the PDF and a real Excel chart in the workbook — so there
//! is no browser-grade renderer or font dependency (MIGRATION_PLAN.md §9,
//! D-23). Same data, same series and categories; not the same pixels.
use rust_xlsxwriter::{Chart, ChartType, Format, Workbook, XlsxError};
use serde_json::{Map, Value};

use crate::{
    monitoring::js::number,
    render::{cell_text, pdf::Pdf},
};

/// ECharts' default palette.
const PALETTE: [(u8, u8, u8); 9] = [
    (0x54, 0x70, 0xc6),
    (0x91, 0xcc, 0x75),
    (0xfa, 0xc8, 0x58),
    (0xee, 0x66, 0x66),
    (0x73, 0xc0, 0xde),
    (0x3b, 0xa2, 0x72),
    (0xfc, 0x84, 0x52),
    (0x9a, 0x60, 0xb4),
    (0xea, 0x7c, 0xcc),
];

#[derive(Debug, Clone, PartialEq)]
pub struct ChartData {
    pub kind: String,
    pub labels: Vec<String>,
    /// `(name, values)`; a pie has exactly one.
    pub series: Vec<(String, Vec<f64>)>,
}

/// `Number(v) || 0`.
fn value(v: Option<&Value>) -> f64 {
    let n = v.map_or(0.0, number);
    if n.is_nan() {
        0.0
    } else {
        n
    }
}

/// What `renderChartPng` plots: `None` for `chart_type = none` or no rows.
#[must_use]
pub fn select(
    rows: &[Map<String, Value>],
    columns: &[String],
    kind: &str,
    metrics: &[String],
    dimensions: &[String],
) -> Option<ChartData> {
    if kind == "none" || rows.is_empty() {
        return None;
    }
    let x = dimensions.first().or_else(|| columns.first())?.clone();
    let ys: Vec<String> = if metrics.is_empty() {
        columns.iter().filter(|c| **c != x).cloned().collect()
    } else {
        metrics.to_vec()
    };
    let label = |r: &Map<String, Value>| r.get(&x).map(cell_text).unwrap_or_default();
    if kind == "pie" {
        let y = ys.first().or_else(|| columns.get(1))?.clone();
        let slice: Vec<&Map<String, Value>> = rows.iter().take(20).collect();
        return Some(ChartData {
            kind: kind.into(),
            labels: slice.iter().map(|r| label(r)).collect(),
            series: vec![(y.clone(), slice.iter().map(|r| value(r.get(&y))).collect())],
        });
    }
    Some(ChartData {
        kind: kind.into(),
        labels: rows.iter().map(label).collect(),
        series: ys
            .iter()
            .map(|y| (y.clone(), rows.iter().map(|r| value(r.get(y))).collect()))
            .collect(),
    })
}

/// Round axis bounds and a 1/2/5 × 10ⁿ step giving about five intervals,
/// as ECharts' value axis chooses them.
fn nice_scale(lo: f64, hi: f64) -> (f64, f64, f64) {
    let span = if (hi - lo).abs() < f64::EPSILON {
        1.0
    } else {
        hi - lo
    };
    let raw = span / 5.0;
    let mag = 10_f64.powf(raw.log10().floor());
    let step = [1.0, 2.0, 5.0, 10.0]
        .iter()
        .map(|m| m * mag)
        .find(|s| *s >= raw)
        .unwrap_or(10.0 * mag);
    ((lo / step).floor() * step, (hi / step).ceil() * step, step)
}

/// A readable number for an axis tick.
fn tick(v: f64) -> String {
    if v.abs() >= 1_000_000.0 {
        format!("{:.1}M", v / 1_000_000.0)
    } else if v.abs() >= 10_000.0 {
        format!("{:.0}k", v / 1000.0)
    } else if v.fract() == 0.0 {
        format!("{v:.0}")
    } else {
        format!("{v:.1}")
    }
}

/// Draw the chart into the box `(x, y, w, h)` of `doc`.
pub fn draw_pdf(doc: &mut Pdf, data: &ChartData, (x, y, w, h): (f64, f64, f64, f64)) {
    let black = (51, 51, 51);
    // Legend along the top.
    doc.font(false, 8.0);
    let names: Vec<String> = if data.kind == "pie" {
        data.labels.clone()
    } else {
        data.series.iter().map(|(n, _)| n.clone()).collect()
    };
    let mut lx = x;
    for (i, n) in names.iter().enumerate() {
        let c = PALETTE[i % PALETTE.len()];
        doc.rect(lx, y + 1.0, 4.0, 2.5, c);
        doc.text(lx + 5.0, y + 3.4, n, black);
        lx += 9.0 + doc.text_width(n);
        if lx > x + w - 20.0 {
            break;
        }
    }
    let top = y + 8.0;
    if data.kind == "pie" {
        let values = &data.series[0].1;
        let total: f64 = values.iter().map(|v| v.max(0.0)).sum();
        let (cx, cy, r) = (x + w / 2.0, top + (h - 8.0) / 2.0, (h - 12.0) / 2.0 * 0.9);
        let mut start = -std::f64::consts::FRAC_PI_2;
        for (i, v) in values.iter().enumerate() {
            if total <= 0.0 || *v <= 0.0 {
                continue;
            }
            let sweep = v / total * std::f64::consts::TAU;
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let steps = ((sweep / 0.05).ceil() as usize).max(2);
            let mut pts = vec![(cx, cy)];
            for k in 0..=steps {
                #[allow(clippy::cast_precision_loss)]
                let a = start + sweep * k as f64 / steps as f64;
                pts.push((cx + r * a.cos(), cy + r * a.sin()));
            }
            doc.polygon(&pts, PALETTE[i % PALETTE.len()]);
            start += sweep;
        }
        return;
    }
    // Cartesian: grid like ECharts' (top 50, bottom 30, left 60, right 20 px
    // of a 900 x 450 canvas), scaled to the box.
    let (left, right, bottom) = (
        x + w * 60.0 / 900.0,
        x + w - w * 20.0 / 900.0,
        y + h - h * 30.0 / 450.0,
    );
    let plot_top = top + 4.0;
    let all = data.series.iter().flat_map(|(_, v)| v.iter().copied());
    let (lo, hi) = all.fold((0.0_f64, 0.0_f64), |(lo, hi), v| (lo.min(v), hi.max(v)));
    let (min, max, step) = nice_scale(lo, hi);
    let span = max - min;
    let to_y = |v: f64| bottom - (v - min) / span * (bottom - plot_top);
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let ticks = (span / step).round() as u32;
    for k in 0..=ticks {
        let v = min + step * f64::from(k);
        let gy = to_y(v);
        doc.line((left, gy), (right, gy), (224, 230, 241), 0.2);
        doc.font(false, 7.0);
        let t = tick(v);
        let tw = doc.text_width(&t);
        doc.text(left - tw - 1.5, gy + 1.0, &t, (110, 112, 121));
    }
    doc.line((left, bottom), (right, bottom), (110, 112, 121), 0.3);
    let n = data.labels.len().max(1);
    #[allow(clippy::cast_precision_loss)]
    let band = (right - left) / n as f64;
    // Category labels, thinned to what fits.
    doc.font(false, 7.0);
    let widest = data.labels.iter().map(|l| doc.text_width(l)).fold(0.0, f64::max) + 2.0;
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let every = ((widest / band).ceil() as usize).max(1);
    for (i, l) in data.labels.iter().enumerate().step_by(every) {
        #[allow(clippy::cast_precision_loss)]
        let cx = left + band * (i as f64 + 0.5);
        doc.text_centered(cx, bottom + 4.0, l, (110, 112, 121));
    }
    let series_n = data.series.len().max(1);
    for (s, (_, values)) in data.series.iter().enumerate() {
        let color = PALETTE[s % PALETTE.len()];
        match data.kind.as_str() {
            "bar" => {
                #[allow(clippy::cast_precision_loss)]
                let bw = band * 0.7 / series_n as f64;
                for (i, v) in values.iter().enumerate() {
                    #[allow(clippy::cast_precision_loss)]
                    let bx = left + band * i as f64 + band * 0.15 + bw * s as f64;
                    let (y0, y1) = (to_y(0.0_f64.max(min)), to_y(*v));
                    doc.rect(bx, y0.min(y1), bw, (y0 - y1).abs(), color);
                }
            }
            _ => {
                #[allow(clippy::cast_precision_loss)]
                let pts: Vec<(f64, f64)> = values
                    .iter()
                    .enumerate()
                    .map(|(i, v)| (left + band * (i as f64 + 0.5), to_y(*v)))
                    .collect();
                if data.kind == "area" {
                    let mut poly = pts.clone();
                    if let (Some(first), Some(last)) = (pts.first(), pts.last()) {
                        poly.push((last.0, bottom));
                        poly.push((first.0, bottom));
                    }
                    let soft = (
                        (u16::from(color.0) * 2 / 5 + 153) as u8,
                        (u16::from(color.1) * 2 / 5 + 153) as u8,
                        (u16::from(color.2) * 2 / 5 + 153) as u8,
                    );
                    doc.polygon(&poly, soft);
                }
                doc.polyline(&pts, color, 0.5);
            }
        }
    }
}

/// The workbook's "Chart" sheet: a native chart over a small data block
/// (the series as numbers, `Number(v) || 0` as ECharts plots them), then the
/// title and the "Generated" line at A30/A31 as in Node.
///
/// # Errors
/// On a writer error.
pub fn add_xlsx_sheet(
    wb: &mut Workbook,
    data: &ChartData,
    title: &str,
    generated: &str,
) -> Result<(), XlsxError> {
    let ws = wb.add_worksheet();
    ws.set_name("Chart")?;
    ws.write_string_with_format(29, 0, title, &Format::new().set_bold().set_font_size(14))?;
    ws.write_string(30, 0, generated)?;
    // Data block from row 34 (0-based 33): label column, one per series.
    let first = 34_u32;
    ws.write_string_with_format(first - 1, 0, "Chart data", &Format::new().set_bold())?;
    for (s, (name, _)) in data.series.iter().enumerate() {
        ws.write_string_with_format(
            first,
            u16::try_from(s + 1).unwrap_or(u16::MAX),
            name,
            &Format::new().set_bold(),
        )?;
    }
    for (i, l) in data.labels.iter().enumerate() {
        let r = first + 1 + u32::try_from(i).unwrap_or(u32::MAX - first - 1);
        ws.write_string(r, 0, l)?;
        for (s, (_, values)) in data.series.iter().enumerate() {
            ws.write_number(r, u16::try_from(s + 1).unwrap_or(u16::MAX), values[i])?;
        }
    }
    let last = first + u32::try_from(data.labels.len()).unwrap_or(0);
    let kind = match data.kind.as_str() {
        "line" => ChartType::Line,
        "area" => ChartType::Area,
        "pie" => ChartType::Pie,
        _ => ChartType::Column,
    };
    let mut chart = Chart::new(kind);
    for (s, (name, _)) in data.series.iter().enumerate() {
        let col = u16::try_from(s + 1).unwrap_or(u16::MAX);
        chart
            .add_series()
            .set_name(name.as_str())
            .set_categories(("Chart", first + 1, 0, last, 0))
            .set_values(("Chart", first + 1, col, last, col));
    }
    // A1:L28, as the Node image is anchored.
    chart.set_width(12 * 64).set_height(28 * 20);
    ws.insert_chart(0, 0, &chart)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn rows() -> Vec<Map<String, Value>> {
        vec![
            json!({"region": "EU", "sales": "10.5", "units": 3})
                .as_object()
                .unwrap()
                .clone(),
            json!({"region": "US", "sales": "x", "units": 4})
                .as_object()
                .unwrap()
                .clone(),
        ]
    }

    #[test]
    fn round_axis_ticks() {
        assert_eq!(nice_scale(0.0, 160.4), (0.0, 200.0, 50.0));
        assert_eq!(nice_scale(-3.0, 12.0), (-5.0, 15.0, 5.0));
    }

    #[test]
    fn selects_series_like_the_echarts_option() {
        let cols = vec!["region".to_string(), "sales".into(), "units".into()];
        let d = select(&rows(), &cols, "bar", &[], &[]).unwrap();
        assert_eq!(d.labels, vec!["EU", "US"]);
        assert_eq!(
            d.series,
            vec![
                ("sales".into(), vec![10.5, 0.0]),
                ("units".into(), vec![3.0, 4.0])
            ]
        );
        let p = select(&rows(), &cols, "pie", &["units".into()], &[]).unwrap();
        assert_eq!(p.series, vec![("units".into(), vec![3.0, 4.0])]);
        assert!(select(&rows(), &cols, "none", &[], &[]).is_none());
    }
}
