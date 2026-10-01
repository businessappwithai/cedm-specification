//! A small PDF writer: A4 pages, filled rectangles and text in the two
//! standard Helvetica faces (no embedded fonts), in `jsPDF`'s coordinate
//! system — millimetres, `y` measured down from the top, text placed on its
//! baseline. Enough for the tables the Node exports draw.
use std::fmt::Write as _;

const PT_PER_MM: f64 = 72.0 / 25.4;

/// Advance widths (1/1000 em) of Helvetica and Helvetica-Bold for 32..=126,
/// from the standard AFM files.
const HELVETICA: [u16; 95] = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556,
    556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278,
    500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469,
    556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500,
    278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const HELVETICA_BOLD: [u16; 95] = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556,
    556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278,
    556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584,
    556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556,
    333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

pub type Rgb = (u8, u8, u8);

#[derive(Debug)]
pub struct Pdf {
    width: f64,
    height: f64,
    pages: Vec<String>,
    current: usize,
    bold: bool,
    size: f64,
}

fn rgb_ops(c: Rgb) -> String {
    format!(
        "{:.3} {:.3} {:.3} rg",
        f64::from(c.0) / 255.0,
        f64::from(c.1) / 255.0,
        f64::from(c.2) / 255.0
    )
}

/// WinAnsi's 0x80–0x9F block: the characters Latin-1 leaves out, with their
/// Helvetica widths (the same in both weights, but for the bullet).
const WIN_ANSI_EXTRA: [(char, u8, u16); 27] = [
    ('€', 0x80, 556),
    ('‚', 0x82, 222),
    ('ƒ', 0x83, 556),
    ('„', 0x84, 333),
    ('…', 0x85, 1000),
    ('†', 0x86, 556),
    ('‡', 0x87, 556),
    ('ˆ', 0x88, 333),
    ('‰', 0x89, 1000),
    ('Š', 0x8A, 667),
    ('‹', 0x8B, 333),
    ('Œ', 0x8C, 1000),
    ('Ž', 0x8E, 611),
    ('\u{2018}', 0x91, 222),
    ('\u{2019}', 0x92, 222),
    ('\u{201C}', 0x93, 333),
    ('\u{201D}', 0x94, 333),
    ('•', 0x95, 350),
    ('–', 0x96, 556),
    ('—', 0x97, 1000),
    ('˜', 0x98, 333),
    ('™', 0x99, 1000),
    ('š', 0x9A, 500),
    ('›', 0x9B, 333),
    ('œ', 0x9C, 944),
    ('ž', 0x9E, 500),
    ('Ÿ', 0x9F, 667),
];

/// A character as a WinAnsi byte, `?` when it has none.
fn win_ansi(c: char) -> u8 {
    match u32::from(c) {
        n @ 32..=126 | n @ 160..=255 => u8::try_from(n).unwrap_or(b'?'),
        _ => WIN_ANSI_EXTRA
            .iter()
            .find(|(ch, ..)| *ch == c)
            .map_or(b'?', |(_, b, _)| *b),
    }
}

fn escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match win_ansi(c) {
            b'(' => out.push_str("\\("),
            b')' => out.push_str("\\)"),
            b'\\' => out.push_str("\\\\"),
            b @ 32..=126 => out.push(char::from(b)),
            b => {
                // Octal escape: WinAnsi bytes above 126, including 0x80–0x9F.
                let _ = write!(out, "\\{b:03o}");
            }
        }
    }
    out
}

impl Pdf {
    /// A4, portrait or landscape, with one empty page.
    #[must_use]
    pub fn a4(landscape: bool) -> Self {
        let (w, h) = if landscape { (297.0, 210.0) } else { (210.0, 297.0) };
        Self {
            width: w,
            height: h,
            pages: vec![String::new()],
            current: 0,
            bold: false,
            size: 16.0,
        }
    }

    #[must_use]
    pub fn width(&self) -> f64 {
        self.width
    }

    #[must_use]
    pub fn height(&self) -> f64 {
        self.height
    }

    #[must_use]
    pub fn page_count(&self) -> usize {
        self.pages.len()
    }

    pub fn add_page(&mut self) {
        self.pages.push(String::new());
        self.current = self.pages.len() - 1;
    }

    /// 1-based, as `doc.setPage`.
    pub fn set_page(&mut self, n: usize) {
        self.current = n.clamp(1, self.pages.len()) - 1;
    }

    pub fn font(&mut self, bold: bool, size: f64) {
        self.bold = bold;
        self.size = size;
    }

    /// The width of `s` in the current font, in millimetres.
    #[must_use]
    pub fn text_width(&self, s: &str) -> f64 {
        let table = if self.bold { &HELVETICA_BOLD } else { &HELVETICA };
        let units: u32 = s
            .chars()
            .map(|c| match win_ansi(c) {
                b @ 32..=126 => u32::from(table[usize::from(b - 32)]),
                b @ 0x80..=0x9F => WIN_ANSI_EXTRA
                    .iter()
                    .find(|(_, x, _)| *x == b)
                    .map_or(556, |(_, _, w)| u32::from(*w)),
                _ => 556,
            })
            .sum();
        f64::from(units) / 1000.0 * self.size / PT_PER_MM
    }

    fn ops(&mut self) -> &mut String {
        &mut self.pages[self.current]
    }

    /// A filled rectangle; `y` is its top edge.
    pub fn rect(&mut self, x: f64, y: f64, w: f64, h: f64, fill: Rgb) {
        let (px, py) = (x * PT_PER_MM, (self.height - y - h) * PT_PER_MM);
        let op = format!(
            "{} {px:.2} {py:.2} {:.2} {:.2} re f\n",
            rgb_ops(fill),
            w * PT_PER_MM,
            h * PT_PER_MM
        );
        self.ops().push_str(&op);
    }

    /// A straight line.
    pub fn line(&mut self, from: (f64, f64), to: (f64, f64), color: Rgb, width: f64) {
        let op = format!(
            "{} RG {:.2} w {:.2} {:.2} m {:.2} {:.2} l S\n",
            rgb_ops(color).trim_end_matches(" rg"),
            width * PT_PER_MM,
            from.0 * PT_PER_MM,
            (self.height - from.1) * PT_PER_MM,
            to.0 * PT_PER_MM,
            (self.height - to.1) * PT_PER_MM
        );
        self.ops().push_str(&op);
    }

    /// A connected line through `points`.
    pub fn polyline(&mut self, points: &[(f64, f64)], color: Rgb, width: f64) {
        for w in points.windows(2) {
            self.line(w[0], w[1], color, width);
        }
    }

    /// A filled polygon.
    pub fn polygon(&mut self, points: &[(f64, f64)], fill: Rgb) {
        let Some((first, rest)) = points.split_first() else {
            return;
        };
        let h = self.height;
        let mut op = format!(
            "{} {:.2} {:.2} m",
            rgb_ops(fill),
            first.0 * PT_PER_MM,
            (h - first.1) * PT_PER_MM
        );
        for p in rest {
            let _ = write!(op, " {:.2} {:.2} l", p.0 * PT_PER_MM, (h - p.1) * PT_PER_MM);
        }
        op.push_str(" h f\n");
        self.ops().push_str(&op);
    }

    /// Text with its baseline at `y`. Empty text draws nothing, as in jsPDF.
    pub fn text(&mut self, x: f64, y: f64, s: &str, color: Rgb) {
        if s.is_empty() {
            return;
        }
        let font = if self.bold { "F2" } else { "F1" };
        let op = format!(
            "BT /{font} {:.2} Tf {} {:.2} {:.2} Td ({}) Tj ET\n",
            self.size,
            rgb_ops(color),
            x * PT_PER_MM,
            (self.height - y) * PT_PER_MM,
            escape(s)
        );
        self.ops().push_str(&op);
    }

    /// Text centred on `x`.
    pub fn text_centered(&mut self, x: f64, y: f64, s: &str, color: Rgb) {
        let w = self.text_width(s);
        self.text(x - w / 2.0, y, s, color);
    }

    /// `s`, shortened with `...` until it fits `max` (jsPDF drawCell's loop).
    #[must_use]
    pub fn fit(&self, s: &str, max: f64) -> String {
        if self.text_width(s) <= max {
            return s.to_string();
        }
        let mut chars: Vec<char> = s.chars().collect();
        while !chars.is_empty() && self.text_width(&format!("{}...", chars.iter().collect::<String>())) > max
        {
            chars.pop();
        }
        format!("{}...", chars.iter().collect::<String>())
    }

    /// `s` split into lines no wider than `max`: at spaces where it can, and
    /// inside a word only when one word is wider than a line (what
    /// `splitTextToSize` does for `jspdf-autotable`'s wrapping cells).
    #[must_use]
    pub fn wrap(&self, s: &str, max: f64) -> Vec<String> {
        let mut lines = Vec::new();
        for paragraph in s.split('\n') {
            let mut line = String::new();
            for word in paragraph.split(' ') {
                let candidate = if line.is_empty() {
                    word.to_string()
                } else {
                    format!("{line} {word}")
                };
                if self.text_width(&candidate) <= max {
                    line = candidate;
                    continue;
                }
                if !line.is_empty() {
                    lines.push(std::mem::take(&mut line));
                }
                for c in word.chars() {
                    let next = format!("{line}{c}");
                    if !line.is_empty() && self.text_width(&next) > max {
                        lines.push(std::mem::take(&mut line));
                        line.push(c);
                    } else {
                        line = next;
                    }
                }
            }
            lines.push(line);
        }
        lines
    }

    /// The finished document.
    #[must_use]
    pub fn finish(self) -> Vec<u8> {
        let mut out: Vec<u8> = b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n".to_vec();
        let mut offsets: Vec<usize> = Vec::new();
        let n_pages = self.pages.len();
        // 1 catalog, 2 pages, 3 F1, 4 F2, then page/content pairs.
        let kids: Vec<String> = (0..n_pages).map(|i| format!("{} 0 R", 5 + 2 * i)).collect();
        let (w, h) = (self.width * PT_PER_MM, self.height * PT_PER_MM);
        let mut objects: Vec<Vec<u8>> = vec![
            b"<< /Type /Catalog /Pages 2 0 R >>".to_vec(),
            format!("<< /Type /Pages /Kids [{}] /Count {n_pages} >>", kids.join(" ")).into_bytes(),
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>".to_vec(),
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
                .to_vec(),
        ];
        for (i, content) in self.pages.iter().enumerate() {
            objects.push(
                format!(
                    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w:.2} {h:.2}] \
                     /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {} 0 R >>",
                    6 + 2 * i
                )
                .into_bytes(),
            );
            let mut stream = format!("<< /Length {} >>\nstream\n", content.len()).into_bytes();
            stream.extend_from_slice(content.as_bytes());
            stream.extend_from_slice(b"\nendstream");
            objects.push(stream);
        }
        for (i, body) in objects.iter().enumerate() {
            offsets.push(out.len());
            out.extend_from_slice(format!("{} 0 obj\n", i + 1).as_bytes());
            out.extend_from_slice(body);
            out.extend_from_slice(b"\nendobj\n");
        }
        let xref = out.len();
        let mut tail = format!("xref\n0 {}\n0000000000 65535 f \n", objects.len() + 1);
        for o in &offsets {
            let _ = writeln!(tail, "{o:010} 00000 n ");
        }
        let _ = write!(
            tail,
            "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n",
            objects.len() + 1
        );
        out.extend_from_slice(tail.as_bytes());
        out
    }
}

/// `new Date().toLocaleString()` in the server's zone, as Node (en-US)
/// prints it: `9/24/2026, 12:46:21 AM`.
#[must_use]
pub fn locale_now() -> String {
    chrono::Local::now()
        .format("%-m/%-d/%Y, %-I:%M:%S %p")
        .to_string()
}

/// How a `jspdf-autotable` table is drawn.
#[derive(Debug, Clone)]
pub struct TableStyle {
    pub margin: f64,
    pub font_size: f64,
    pub pad: f64,
    pub head_fill: Rgb,
    pub head_text: Rgb,
    pub alt_fill: Rgb,
    pub body_text: Rgb,
}

impl TableStyle {
    /// The workers': autotable's striped theme with a dark grey header.
    #[must_use]
    pub fn worker() -> Self {
        Self {
            margin: 14.0,
            font_size: 8.0,
            pad: 1.5,
            head_fill: (66, 66, 66),
            head_text: (255, 255, 255),
            alt_fill: (245, 245, 245),
            body_text: (80, 80, 80),
        }
    }
}

/// A grid of equal columns from `y`, with the header repeated on every
/// page and cells wrapped onto as many lines as they need (autotable's
/// default overflow). Column widths are equal rather than fitted to content,
/// so the layout is not autotable's, but every value is printed in full.
pub fn draw_table(doc: &mut Pdf, mut y: f64, headers: &[String], rows: &[Vec<String>], style: &TableStyle) {
    if headers.is_empty() {
        return;
    }
    let (margin, pad) = (style.margin, style.pad);
    let line_h = style.font_size * 0.45;
    #[allow(clippy::cast_precision_loss)]
    let col_w = (doc.width() - 2.0 * margin) / headers.len() as f64;
    let inner = col_w - 2.0 * pad;
    let height_of = |doc: &mut Pdf, cells: &[String], bold: bool| {
        doc.font(bold, style.font_size);
        let lines = cells
            .iter()
            .map(|c| doc.wrap(c, inner).len())
            .max()
            .unwrap_or(1)
            .max(1);
        #[allow(clippy::cast_precision_loss)]
        let h = lines as f64 * line_h + 2.0 * pad;
        h
    };
    let draw_row = |doc: &mut Pdf, y: f64, cells: &[String], bold: bool, fill: Option<Rgb>, fg: Rgb| -> f64 {
        let h = height_of(doc, cells, bold);
        for (i, cell) in cells.iter().enumerate() {
            #[allow(clippy::cast_precision_loss)]
            let x = margin + i as f64 * col_w;
            if let Some(f) = fill {
                doc.rect(x, y, col_w, h, f);
            }
            for (k, line) in doc.wrap(cell, inner).iter().enumerate() {
                #[allow(clippy::cast_precision_loss)]
                doc.text(x + pad, y + pad + (k as f64 + 1.0) * line_h - 0.8, line, fg);
            }
        }
        h
    };
    let head =
        |doc: &mut Pdf, y: f64| draw_row(doc, y, headers, true, Some(style.head_fill), style.head_text);
    y += head(doc, y);
    for (r, row) in rows.iter().enumerate() {
        let cells: Vec<String> = row.iter().take(headers.len()).cloned().collect();
        let h = height_of(doc, &cells, false);
        if y + h > doc.height() - margin {
            doc.add_page();
            y = margin;
            y += head(doc, y);
        }
        let fill = (r % 2 == 1).then_some(style.alt_fill);
        y += draw_row(doc, y, &cells, false, fill, style.body_text);
    }
}

/// The workers' PDF: a title and a "Generated" line when there is a title
/// (the export worker prints neither), then the table.
#[must_use]
pub fn worker_table(title: Option<&str>, headers: &[String], rows: &[Vec<String>]) -> Vec<u8> {
    let mut doc = Pdf::a4(false);
    let mut y = 14.0;
    if let Some(t) = title {
        doc.font(false, 16.0);
        doc.text(14.0, 20.0, t, (0, 0, 0));
        doc.font(false, 10.0);
        doc.text(14.0, 28.0, &format!("Generated: {}", locale_now()), (0, 0, 0));
        y = 35.0;
        if rows.is_empty() {
            doc.text(14.0, 40.0, "No data available", (0, 0, 0));
            return doc.finish();
        }
    }
    draw_table(&mut doc, y, headers, rows, &TableStyle::worker());
    doc.finish()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn measures_helvetica() {
        let mut d = Pdf::a4(false);
        d.font(false, 10.0);
        // "Hello" = 722+556+222+222+556 = 2278 units → 22.78 pt.
        assert!((d.text_width("Hello") - 22.78 / PT_PER_MM).abs() < 1e-9);
        let fitted = d.fit("abcdefghijklmnop", 10.0);
        assert!(fitted.ends_with("...") && d.text_width(&fitted) <= 10.0);
        assert!(d.text_width(&format!("{}x...", fitted.trim_end_matches("..."))) > 10.0 || fitted == "...");
        assert_eq!(d.fit("ab", 10.0), "ab");
        let lines = d.wrap("the quick brown fox jumps", 15.0);
        assert!(lines.len() > 1 && lines.iter().all(|l| d.text_width(l) <= 15.0));
        assert_eq!(lines.join(" "), "the quick brown fox jumps");
    }

    #[test]
    fn writes_a_well_formed_document() {
        let bytes = worker_table(
            Some("Report (Q1)"),
            &["a".into(), "b".into()],
            &(0..100)
                .map(|i| vec![i.to_string(), "x".into()])
                .collect::<Vec<_>>(),
        );
        let text = String::from_utf8_lossy(&bytes);
        assert!(text.starts_with("%PDF-1.4"));
        assert!(text.contains("(Report \\(Q1\\)) Tj"));
        assert!(text.contains("/Count 3"));
        assert!(text.trim_end().ends_with("%%EOF"));
    }
}
