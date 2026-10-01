//! `extractTablesStrict` / `extractColumns` from `src/lib/sql/antlr-validator.ts`.
//!
//! The access decision rests on this, so it is a real parse and a failure to
//! determine the tables is an error the caller must treat as a denial.
//! `SELECT * FROM(hr_salaries)` — one space removed — named no tables to the
//! regular expression this replaced, and was therefore trusted.
use std::{collections::BTreeSet, ops::ControlFlow};

use regex::Regex;
use sqlparser::{
    ast::{Expr, ObjectName, Query, SelectItem, SetExpr, Statement, Visit, Visitor},
    dialect::{Dialect, MsSqlDialect, MySqlDialect, PostgreSqlDialect},
    parser::Parser,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TableExtraction {
    Ok(Vec<String>),
    Err(String),
}

fn dialect_for(client_type: &str) -> Box<dyn Dialect> {
    match client_type {
        "mysql" => Box::new(MySqlDialect {}),
        "mssql" => Box::new(MsSqlDialect {}),
        _ => Box::new(PostgreSqlDialect {}),
    }
}

/// One `WITH` scope on the walk: the CTEs a query defines and how many of
/// them are visible at the current point.
struct Frame {
    query: *const Query,
    ctes: Vec<(String, *const Query)>,
    recursive: bool,
    visible: usize,
}

#[derive(Default)]
struct Collector {
    frames: Vec<Frame>,
    relations: Vec<String>,
    columns: Vec<String>,
    has_wildcard: bool,
    has_from: bool,
    writes: Option<String>,
    statement_depth: usize,
}

fn last_part(name: &ObjectName) -> Option<String> {
    name.0.last().and_then(|p| p.as_ident()).map(|i| i.value.clone())
}

impl Collector {
    /// Does `name` name a CTE that is in scope here?
    ///
    /// Scope is what matters. `WITH hr AS (SELECT * FROM hr) SELECT * FROM hr`
    /// reads the real `hr` inside the CTE body, where the (non-recursive) CTE is
    /// not yet visible. An unscoped "drop every CTE name from the list" let that
    /// query through checked against nothing.
    fn is_visible_cte(&self, name: &str) -> bool {
        let name = name.to_lowercase();
        self.frames
            .iter()
            .any(|f| f.ctes[..f.visible].iter().any(|(n, _)| *n == name))
    }
}

impl Visitor for Collector {
    type Break = ();

    fn pre_visit_statement(&mut self, statement: &Statement) -> ControlFlow<Self::Break> {
        let nested = self.statement_depth > 0;
        self.statement_depth += 1;
        let write = match statement {
            Statement::Insert(_) => Some("INSERT"),
            Statement::Update { .. } => Some("UPDATE"),
            Statement::Delete(_) => Some("DELETE"),
            Statement::Merge { .. } => Some("MERGE"),
            Statement::Truncate { .. } => Some("TRUNCATE"),
            Statement::Drop { .. } => Some("DROP"),
            Statement::Copy { .. } => Some("COPY"),
            Statement::Call(_) => Some("CALL"),
            // Anything else nested (under EXPLAIN, say) that is not a query.
            Statement::Query(_) => None,
            _ if nested => Some("a nested statement"),
            _ => None,
        };
        if let Some(w) = write {
            self.writes.get_or_insert_with(|| w.to_string());
        }
        ControlFlow::Continue(())
    }

    fn post_visit_statement(&mut self, _statement: &Statement) -> ControlFlow<Self::Break> {
        self.statement_depth -= 1;
        ControlFlow::Continue(())
    }

    fn pre_visit_relation(&mut self, relation: &ObjectName) -> ControlFlow<Self::Break> {
        if let Some(n) = last_part(relation) {
            // A single-part name can be a CTE; a qualified one never is.
            if !(relation.0.len() == 1 && self.is_visible_cte(&n)) {
                self.relations.push(n);
            }
        }
        ControlFlow::Continue(())
    }

    fn pre_visit_query(&mut self, query: &Query) -> ControlFlow<Self::Break> {
        let ptr: *const Query = query;
        // Entering CTE i of the enclosing WITH: only earlier CTEs are visible
        // (and itself, when the WITH is RECURSIVE).
        if let Some(top) = self.frames.last_mut() {
            if let Some(i) = top.ctes.iter().position(|(_, q)| std::ptr::eq(*q, ptr)) {
                top.visible = if top.recursive { i + 1 } else { i };
            }
        }
        let (ctes, recursive) = query.with.as_ref().map_or((Vec::new(), false), |w| {
            (
                w.cte_tables
                    .iter()
                    .map(|c| (c.alias.name.value.to_lowercase(), std::ptr::addr_of!(*c.query)))
                    .collect(),
                w.recursive,
            )
        });
        let visible = ctes.len();
        self.frames.push(Frame {
            query: ptr,
            ctes,
            recursive,
            visible,
        });

        match query.body.as_ref() {
            SetExpr::Select(select) => {
                if !select.from.is_empty() {
                    self.has_from = true;
                }
                if select.into.is_some() {
                    self.writes.get_or_insert_with(|| "SELECT … INTO".to_string());
                }
                if select
                    .projection
                    .iter()
                    .any(|i| matches!(i, SelectItem::Wildcard(_) | SelectItem::QualifiedWildcard(..)))
                {
                    self.has_wildcard = true;
                }
            }
            SetExpr::Insert(_) | SetExpr::Update(_) | SetExpr::Delete(_) | SetExpr::Merge(_) => {
                self.writes
                    .get_or_insert_with(|| "a data-modifying CTE".to_string());
            }
            _ => {}
        }
        ControlFlow::Continue(())
    }

    fn post_visit_query(&mut self, query: &Query) -> ControlFlow<Self::Break> {
        let ptr: *const Query = query;
        if self.frames.last().is_some_and(|f| std::ptr::eq(f.query, ptr)) {
            self.frames.pop();
        }
        // Leaving CTE i: the rest of the enclosing query sees every CTE.
        if let Some(top) = self.frames.last_mut() {
            if top.ctes.iter().any(|(_, q)| std::ptr::eq(*q, ptr)) {
                top.visible = top.ctes.len();
            }
        }
        ControlFlow::Continue(())
    }

    fn pre_visit_expr(&mut self, expr: &Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(i) => self.columns.push(i.value.clone()),
            Expr::CompoundIdentifier(parts) => {
                if let Some(last) = parts.last() {
                    self.columns.push(last.value.clone());
                }
            }
            _ => {}
        }
        ControlFlow::Continue(())
    }
}

/// What a statement reads, as far as an access decision needs to know.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Analysis {
    /// Real tables (in-scope CTE references excluded), last name part only,
    /// first-seen order, deduplicated.
    pub tables: Vec<String>,
    /// Every column name referenced anywhere (last part of `t.col`), deduplicated.
    pub columns: Vec<String>,
    /// A `*` or `t.*` in some projection.
    pub has_wildcard: bool,
}

/// Parse and analyse. `Err` — unparseable, a data-modifying statement, or a
/// FROM that names nothing — is always a denial for the caller.
///
/// # Errors
/// See above; the message says which.
pub fn analyse(sql: &str, client_type: &str) -> Result<Analysis, String> {
    if sql.trim().is_empty() {
        return Err("empty query".into());
    }
    let dialect = dialect_for(client_type);
    let statements: Vec<Statement> = Parser::parse_sql(dialect.as_ref(), sql).map_err(|e| e.to_string())?;

    let mut c = Collector::default();
    for st in &statements {
        let _ = st.visit(&mut c);
    }
    if let Some(w) = c.writes {
        return Err(format!("contains {w}, which is not read-only"));
    }

    let mut seen = BTreeSet::new();
    let tables: Vec<String> = c
        .relations
        .into_iter()
        .filter(|n| seen.insert(n.clone()))
        .collect();
    // A FROM that resolved to no name is an unanswered question, and an
    // unanswered access question is a denial — the same rule as a failed parse.
    if tables.is_empty() && c.has_from {
        return Err("reads from a source this analyser could not identify".into());
    }
    let mut seen = BTreeSet::new();
    let columns = c
        .columns
        .into_iter()
        .filter(|n| seen.insert(n.to_lowercase()))
        .collect();
    Ok(Analysis {
        tables,
        columns,
        has_wildcard: c.has_wildcard,
    })
}

/// The tables a statement reads — [`analyse`] reduced to Node's
/// `extractTablesStrict` shape.
#[must_use]
pub fn extract_tables_strict(sql: &str, client_type: &str) -> TableExtraction {
    match analyse(sql, client_type) {
        Ok(a) => TableExtraction::Ok(a.tables),
        Err(e) => TableExtraction::Err(e),
    }
}

const AGGREGATES: [&str; 14] = [
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "STDDEV",
    "VARIANCE",
    "SUBSTRING",
    "UPPER",
    "LOWER",
    "TRIM",
    "LENGTH",
    "COALESCE",
    "NULLIF",
];

/// The selected column identifiers, as the Node regex extracts them. Used only
/// for column restrictions, never to decide table access.
#[must_use]
pub fn extract_columns(sql: &str) -> Vec<String> {
    static SELECT: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    static ITEM: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let select = SELECT.get_or_init(|| {
        Regex::new(r"(?is)SELECT\s+(DISTINCT\s+)?(.+?)(?:\bFROM\b|$)").expect("static regex")
    });
    let item = ITEM.get_or_init(|| Regex::new(r"^\s*(\w+(?:\.\w+)?)").expect("static regex"));

    let mut columns: Vec<String> = Vec::new();
    if let Some(caps) = select.captures(sql) {
        let part = caps.get(2).map_or("", |m| m.as_str());
        for piece in part.split(',') {
            if let Some(m) = item.captures(piece).and_then(|c| c.get(1)) {
                let col = m.as_str();
                if col != "*"
                    && col != "DISTINCT"
                    && !AGGREGATES.contains(&col.to_uppercase().as_str())
                    && !columns.iter().any(|c| c == col)
                {
                    columns.push(col.to_string());
                }
            }
        }
    }
    columns
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ok(sql: &str) -> Vec<String> {
        match extract_tables_strict(sql, "pg") {
            TableExtraction::Ok(t) => t,
            TableExtraction::Err(e) => panic!("{sql}: {e}"),
        }
    }

    #[test]
    fn simple_and_joined() {
        assert_eq!(ok("SELECT * FROM users"), vec!["users"]);
        assert_eq!(
            ok("SELECT u.id FROM public.users u JOIN orders o ON o.user_id = u.id"),
            vec!["users", "orders"]
        );
    }

    /// The regex this replaced saw no table here and trusted the query.
    /// PostgreSQL rejects `FROM(t)` as a syntax error, and so does this
    /// parser (in every dialect) — which makes it a denial, never a pass
    /// (MIGRATION_PLAN.md §9, D-4).
    #[test]
    fn from_without_space_is_never_trusted() {
        assert!(matches!(
            extract_tables_strict("SELECT * FROM(hr_salaries)", "pg"),
            TableExtraction::Err(_)
        ));
        assert!(matches!(
            extract_tables_strict("SELECT * FROM(hr_salaries)", "mysql"),
            TableExtraction::Err(_)
        ));
        assert_eq!(
            ok("SELECT * FROM (hr_salaries h JOIN x ON x.id = h.id)"),
            vec!["hr_salaries", "x"]
        );
    }

    #[test]
    fn subquery_tables_are_found() {
        assert_eq!(
            ok("SELECT * FROM a WHERE id IN (SELECT a_id FROM secret)"),
            vec!["a", "secret"]
        );
    }

    #[test]
    fn cte_names_excluded() {
        assert_eq!(
            ok("WITH recent AS (SELECT * FROM orders) SELECT * FROM recent"),
            vec!["orders"]
        );
    }

    /// Review finding: a CTE named after a real table hid that table from the
    /// access check. The CTE body reads the real table (the CTE is not in
    /// scope inside its own non-recursive body), and so does a sibling
    /// subquery outside the WITH.
    #[test]
    fn cte_shadowing_does_not_hide_the_real_table() {
        assert_eq!(
            ok("WITH hr_salaries AS (SELECT * FROM hr_salaries) SELECT * FROM hr_salaries, ok_t"),
            vec!["hr_salaries", "ok_t"]
        );
        assert_eq!(
            ok("SELECT * FROM hr, (WITH hr AS (SELECT 1 AS a) SELECT * FROM hr) x"),
            vec!["hr"]
        );
        // Later CTEs see earlier ones; the main body sees all of them.
        assert_eq!(
            ok("WITH a AS (SELECT * FROM t), b AS (SELECT * FROM a) SELECT * FROM b"),
            vec!["t"]
        );
        // A qualified name is never a CTE.
        assert_eq!(
            ok("WITH users AS (SELECT 1) SELECT * FROM public.users"),
            vec!["users"]
        );
        // RECURSIVE: the CTE is visible in its own body.
        assert_eq!(
            ok("WITH RECURSIVE r AS (SELECT id FROM t UNION ALL SELECT id + 1 FROM r) SELECT * FROM r"),
            vec!["t"]
        );
    }

    /// Review finding: `WITH d AS (DELETE …) SELECT …` passed the read-only
    /// check (it starts with WITH) and needed only a select grant.
    #[test]
    fn data_modifying_statements_are_refused() {
        for sql in [
            "WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d",
            "WITH u AS (UPDATE t SET a = 1 RETURNING *) SELECT * FROM u",
            "WITH i AS (INSERT INTO t VALUES (1) RETURNING *) SELECT * FROM i",
            "SELECT * INTO new_t FROM t",
            "EXPLAIN ANALYZE DELETE FROM t",
        ] {
            assert!(
                matches!(extract_tables_strict(sql, "pg"), TableExtraction::Err(_)),
                "{sql}"
            );
        }
        assert!(matches!(
            extract_tables_strict("EXPLAIN SELECT * FROM t", "pg"),
            TableExtraction::Ok(_)
        ));
    }

    #[test]
    fn columns_and_wildcards_are_collected() {
        let a = analyse(
            "SELECT h.salary, name FROM hr h WHERE COUNT(bonus) > 1 ORDER BY x.y",
            "pg",
        )
        .unwrap();
        assert_eq!(a.columns, vec!["salary", "name", "bonus", "y"]);
        assert!(!a.has_wildcard);
        assert!(analyse("SELECT h.* FROM hr h", "pg").unwrap().has_wildcard);
    }

    #[test]
    fn no_from_is_ok_and_empty() {
        assert_eq!(ok("SELECT 1"), Vec::<String>::new());
    }

    #[test]
    fn unparseable_is_err() {
        assert!(matches!(
            extract_tables_strict("SELECT * FROM", "pg"),
            TableExtraction::Err(_)
        ));
        assert!(matches!(
            extract_tables_strict("SELEC 1", "pg"),
            TableExtraction::Err(_)
        ));
        assert!(matches!(
            extract_tables_strict("  ", "pg"),
            TableExtraction::Err(_)
        ));
    }

    #[test]
    fn derived_table_only_is_denied() {
        assert!(matches!(
            extract_tables_strict("SELECT * FROM (SELECT 1) t", "pg"),
            TableExtraction::Err(_)
        ));
    }

    #[test]
    fn columns_like_node() {
        assert_eq!(
            extract_columns("SELECT u.id, name, COUNT(*) FROM users u"),
            vec!["u.id", "name"]
        );
        assert_eq!(extract_columns("SELECT * FROM t"), Vec::<String>::new());
    }
}
