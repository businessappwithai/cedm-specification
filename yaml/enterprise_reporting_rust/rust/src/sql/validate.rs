//! `validateSQL` (`src/lib/sql/validator.ts`) as `/api/sql/validate` uses it:
//! `{ isValid, errors, warnings }` with the same warning rules.
//!
//! Node's result also carries node-sql-parser's raw `ast` and sql-formatter's
//! `formattedSQL`; nothing in the frontend reads either, and neither can be
//! reproduced by another parser, so they are omitted — and a parse error's
//! wording is this parser's, not node-sql-parser's (MIGRATION_PLAN.md §9, D-14).
use regex::Regex;
use serde::Serialize;
use sqlparser::{
    dialect::{Dialect, MsSqlDialect, MySqlDialect, PostgreSqlDialect, SQLiteDialect},
    parser::Parser,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SqlError {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SqlWarning {
    pub message: &'static str,
    #[serde(rename = "type")]
    pub kind: &'static str,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Validation {
    pub is_valid: bool,
    pub errors: Vec<SqlError>,
    pub warnings: Vec<SqlWarning>,
}

fn re(p: &str) -> Regex {
    Regex::new(&format!("(?i){p}")).expect("static regex")
}

fn dialect(d: &str) -> Box<dyn Dialect> {
    match d {
        "mysql" => Box::new(MySqlDialect {}),
        "mssql" => Box::new(MsSqlDialect {}),
        "sqlite3" => Box::new(SQLiteDialect {}),
        _ => Box::new(PostgreSqlDialect {}),
    }
}

struct Rules {
    drop: Regex,
    truncate: Regex,
    delete: Regex,
    update: Regex,
    where_: Regex,
    inj1: Regex,
    inj2: Regex,
    select_star: Regex,
    select: Regex,
    limit: Regex,
    top: Regex,
    like: Regex,
    where_or: Regex,
    where_fn: Regex,
    line: Regex,
}

fn rules() -> &'static Rules {
    static R: std::sync::OnceLock<Rules> = std::sync::OnceLock::new();
    R.get_or_init(|| Rules {
        drop: re(r"\bDROP\s+(TABLE|DATABASE|INDEX|VIEW)\b"),
        truncate: re(r"\bTRUNCATE\b"),
        delete: re(r"\bDELETE\s+FROM\b"),
        update: re(r"\bUPDATE\b"),
        where_: re(r"\bWHERE\b"),
        inj1: re(r#"('|")\s*;\s*--"#),
        inj2: re(r"'\s*OR\s+'?\d+'?\s*=\s*'?\d+"),
        select_star: re(r"\bSELECT\s+\*"),
        select: re(r"\bSELECT\b"),
        limit: re(r"\bLIMIT\b"),
        top: re(r"\bTOP\b"),
        like: re(r#"\bLIKE\s+['"]%"#),
        where_or: re(r"\bWHERE\b.*\bOR\b"),
        where_fn: re(r"\bWHERE\b.*\b(UPPER|LOWER|TRIM|SUBSTRING|CAST|CONVERT)\s*\("),
        line: re(r"Line:\s*(\d+),\s*Column:\s*(\d+)"),
    })
}

fn warnings(sql: &str) -> Vec<SqlWarning> {
    let r = rules();
    let mut w = Vec::new();
    let mut push = |cond: bool, message, kind| {
        if cond {
            w.push(SqlWarning { message, kind });
        }
    };
    push(
        r.drop.is_match(sql),
        "DROP statement detected - this will permanently delete data",
        "security",
    );
    push(
        r.truncate.is_match(sql),
        "TRUNCATE statement detected - this will delete all rows",
        "security",
    );
    push(
        r.delete.is_match(sql) && !r.where_.is_match(sql),
        "DELETE without WHERE clause - this will delete all rows",
        "security",
    );
    push(
        r.update.is_match(sql) && !r.where_.is_match(sql),
        "UPDATE without WHERE clause - this will update all rows",
        "security",
    );
    push(
        r.inj1.is_match(sql) || r.inj2.is_match(sql),
        "Potential SQL injection pattern detected",
        "security",
    );
    push(
        r.select_star.is_match(sql),
        "SELECT * detected - consider selecting only needed columns",
        "performance",
    );
    push(
        r.select.is_match(sql) && !r.limit.is_match(sql) && !r.top.is_match(sql),
        "Query without LIMIT - consider adding a limit for large tables",
        "performance",
    );
    push(
        r.like.is_match(sql),
        "LIKE with leading wildcard may prevent index usage",
        "performance",
    );
    push(
        r.where_or.is_match(sql),
        "OR in WHERE clause may prevent optimal index usage - consider UNION",
        "performance",
    );
    push(
        r.where_fn.is_match(sql),
        "Function on column in WHERE clause may prevent index usage",
        "performance",
    );
    w
}

/// `validateSQL(sql, dialect)`.
#[must_use]
pub fn validate_sql(sql: &str, client_type: &str) -> Validation {
    match Parser::parse_sql(dialect(client_type).as_ref(), sql) {
        Ok(_) => Validation {
            is_valid: true,
            errors: vec![],
            warnings: warnings(sql),
        },
        Err(e) => {
            let message = e.to_string();
            let pos = rules().line.captures(&message);
            let n = |i| {
                pos.as_ref()
                    .and_then(|c| c.get(i))
                    .and_then(|m| m.as_str().parse().ok())
            };
            Validation {
                is_valid: false,
                errors: vec![SqlError {
                    line: n(1),
                    column: n(2),
                    message,
                }],
                warnings: vec![],
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kinds(sql: &str) -> Vec<&'static str> {
        validate_sql(sql, "pg")
            .warnings
            .iter()
            .map(|w| w.message)
            .collect()
    }

    #[test]
    fn warnings_like_node() {
        assert_eq!(
            kinds("SELECT * FROM users"),
            vec![
                "SELECT * detected - consider selecting only needed columns",
                "Query without LIMIT - consider adding a limit for large tables"
            ]
        );
        assert!(kinds("SELECT id FROM t LIMIT 5").is_empty());
        assert!(kinds("SELECT id FROM t WHERE a = 1 OR b = 2 LIMIT 1")
            .contains(&"OR in WHERE clause may prevent optimal index usage - consider UNION"));
        assert!(kinds("DELETE FROM t").contains(&"DELETE without WHERE clause - this will delete all rows"));
        assert!(kinds("SELECT id FROM t WHERE name LIKE '%x' LIMIT 1")
            .contains(&"LIKE with leading wildcard may prevent index usage"));
    }

    #[test]
    fn invalid_sql_has_position() {
        let v = validate_sql("SELECT * FROM(t)", "pg");
        assert!(!v.is_valid);
        assert_eq!((v.errors[0].line, v.errors[0].column), (Some(1), Some(16)));
    }
}
