//! The one page parser. Every list endpoint paginates in SQL (CLAUDE.md:
//! "Server-side pagination is mandatory").
use serde::Deserialize;
use serde_json::{json, Value};

#[derive(Debug, Default, Deserialize)]
pub struct PageQuery {
    pub page: Option<String>,
    #[serde(rename = "pageSize")]
    pub page_size: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Page {
    /// 0-based, as the Node routes use it.
    pub page: i64,
    pub page_size: i64,
}

/// JavaScript `parseInt(s, 10)` for the inputs a query string carries:
/// leading whitespace, an optional sign, then digits up to the first non-digit.
/// `None` where parseInt would give `NaN`.
#[must_use]
pub fn js_parse_int(s: &str) -> Option<i64> {
    let t = s.trim_start();
    let (neg, digits) = match t.as_bytes().first() {
        Some(b'-') => (true, &t[1..]),
        Some(b'+') => (false, &t[1..]),
        _ => (false, t),
    };
    let end = digits.find(|c: char| !c.is_ascii_digit()).unwrap_or(digits.len());
    if end == 0 {
        return None;
    }
    let n: i64 = digits[..end].parse().ok()?;
    Some(if neg { -n } else { n })
}

impl Page {
    /// `page` defaults to 0 and `pageSize` to `default_size`; `max_size` caps it
    /// where the Node twin caps it (`Math.min(..., 1000)`) and is `None` where
    /// it does not.
    ///
    /// Node passes `NaN` and negatives straight to SQL and fails with a 500;
    /// here a value parseInt cannot read falls back to the default and a
    /// negative clamps to 0/1 (MIGRATION_PLAN.md §9, P-2).
    #[must_use]
    pub fn from_query(q: &PageQuery, default_size: i64, max_size: Option<i64>) -> Self {
        let page = q.page.as_deref().and_then(js_parse_int).unwrap_or(0).max(0);
        let mut page_size = q
            .page_size
            .as_deref()
            .and_then(js_parse_int)
            .unwrap_or(default_size)
            .max(1);
        if let Some(max) = max_size {
            page_size = page_size.min(max);
        }
        Self { page, page_size }
    }

    #[must_use]
    pub const fn offset(&self) -> i64 {
        self.page * self.page_size
    }

    /// `{ total, page, pageSize }` — the shape `/api/queries` and `/api/jobs` use.
    #[must_use]
    pub fn meta(&self, total: i64) -> Value {
        json!({ "total": total, "page": self.page, "pageSize": self.page_size })
    }

    /// `{ total, page, pageSize, totalPages }` — reports, charts, dashboards.
    #[must_use]
    pub fn meta_with_pages(&self, total: i64) -> Value {
        let total_pages = (total + self.page_size - 1) / self.page_size;
        json!({ "total": total, "page": self.page, "pageSize": self.page_size, "totalPages": total_pages })
    }
}

/// `MAX_PAGE_SIZE`, default 1000 (`src/lib/config/pagination.ts`).
#[must_use]
pub fn max_page_size() -> i64 {
    std::env::var("MAX_PAGE_SIZE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1000)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn q(page: Option<&str>, size: Option<&str>) -> PageQuery {
        PageQuery {
            page: page.map(String::from),
            page_size: size.map(String::from),
            search: None,
        }
    }

    #[test]
    fn parse_int_matches_javascript() {
        assert_eq!(js_parse_int("20"), Some(20));
        assert_eq!(js_parse_int(" 7abc"), Some(7));
        assert_eq!(js_parse_int("-3"), Some(-3));
        assert_eq!(js_parse_int("abc"), None);
        assert_eq!(js_parse_int(""), None);
        assert_eq!(js_parse_int("2.9"), Some(2));
    }

    #[test]
    fn defaults_and_cap() {
        let p = Page::from_query(&q(None, None), 20, None);
        assert_eq!((p.page, p.page_size, p.offset()), (0, 20, 0));
        let p = Page::from_query(&q(Some("3"), Some("5000")), 50, Some(1000));
        assert_eq!((p.page, p.page_size, p.offset()), (3, 1000, 3000));
    }

    #[test]
    fn total_pages_is_ceil() {
        let p = Page::from_query(&q(None, Some("20")), 20, None);
        assert_eq!(p.meta_with_pages(41)["totalPages"], 3);
        assert_eq!(p.meta_with_pages(0)["totalPages"], 0);
    }
}
