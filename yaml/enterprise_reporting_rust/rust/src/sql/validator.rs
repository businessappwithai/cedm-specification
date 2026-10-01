//! `isReadOnlyQuery` / `hasStatementBreak` from `src/lib/sql/validator.ts`.
//!
//! Both halves matter: the leading keyword says the statement reads, and the
//! absence of a statement break says there is only the one.
//! `SELECT 1 LIMIT 1; DROP TABLE users` used to pass a prefix-only check.

/// Is there a `;` outside quotes, ignoring one trailing `;` and whitespace?
#[must_use]
pub fn has_statement_break(sql: &str) -> bool {
    // JS: sql.replace(/;\s*$/, "")
    let trimmed_end = sql.trim_end();
    let body = trimmed_end.strip_suffix(';').map_or(sql, |b| b);
    let bytes = body.as_bytes();
    let mut quote: Option<u8> = None;
    let mut i = 0;
    while i < bytes.len() {
        let ch = bytes[i];
        if let Some(q) = quote {
            if ch == q {
                // Doubling is how both SQL quote styles escape themselves.
                if bytes.get(i + 1) == Some(&q) {
                    i += 1;
                } else {
                    quote = None;
                }
            }
        } else if ch == b'\'' || ch == b'"' {
            quote = Some(ch);
        } else if ch == b';' {
            return true;
        }
        i += 1;
    }
    false
}

/// A single, read-only statement: leading comments stripped (alternating
/// `--` and `/* */`), then `SELECT | WITH | EXPLAIN | SHOW | DESCRIBE`, and no
/// statement break.
#[must_use]
pub fn is_read_only_query(sql: &str) -> bool {
    let mut s = sql.trim();
    loop {
        if let Some(rest) = s.strip_prefix("--") {
            let Some(nl) = rest.find('\n') else {
                return false;
            };
            s = rest[nl + 1..].trim();
            continue;
        }
        if s.starts_with("/*") {
            let Some(end) = s.find("*/") else {
                return false;
            };
            s = s[end + 2..].trim();
            continue;
        }
        break;
    }
    let upper = s.to_uppercase();
    let starts_read = ["SELECT", "WITH", "EXPLAIN", "SHOW", "DESCRIBE"]
        .iter()
        .any(|k| upper.starts_with(k));
    starts_read && !has_statement_break(s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_select_is_read_only() {
        assert!(is_read_only_query("SELECT * FROM users"));
        assert!(is_read_only_query("  select 1;  "));
        assert!(is_read_only_query("WITH x AS (SELECT 1) SELECT * FROM x"));
    }

    #[test]
    fn statement_break_refused() {
        assert!(!is_read_only_query("SELECT 1 LIMIT 1; DROP TABLE users"));
        assert!(has_statement_break("SELECT 1; SELECT 2"));
    }

    #[test]
    fn statement_break_inside_quotes_is_fine() {
        assert!(is_read_only_query("SELECT ';' AS semi"));
        assert!(is_read_only_query(r#"SELECT "a;b" FROM t"#));
        assert!(is_read_only_query("SELECT 'it''s; fine'"));
    }

    #[test]
    fn writes_refused() {
        assert!(!is_read_only_query("DELETE FROM users"));
        assert!(!is_read_only_query("UPDATE t SET a = 1"));
        assert!(!is_read_only_query(""));
    }

    #[test]
    fn alternating_leading_comments_are_stripped() {
        assert!(is_read_only_query("/* y */ -- x\n SELECT 1"));
        assert!(!is_read_only_query("-- x\n/* y */ DROP TABLE t"));
        assert!(!is_read_only_query("-- only a comment"));
        assert!(!is_read_only_query("/* unterminated SELECT 1"));
    }
}
