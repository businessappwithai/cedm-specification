//! `decideQueryRun` (`src/lib/permissions/runnable-query.ts`).
//!
//! **Every path that executes stored SQL goes through this**: report data,
//! chart data, exports, saved-query execution, workers. Both questions are
//! asked at run time rather than trusted from save time — `sql_content` is an
//! ordinary column, rows predate validation, and the person running a query is
//! frequently not the person who saved it.
use sqlx::PgPool;

use super::query_access::validate_query_access;
use crate::sql::validator::is_read_only_query;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QueryRunDecision {
    Ok,
    /// Always a 403 with code `FORBIDDEN`.
    Refused(String),
}

/// The checks that need no database, in Node's order.
#[must_use]
pub fn precheck(sql_content: &str) -> Option<QueryRunDecision> {
    if sql_content.trim().is_empty() {
        return Some(QueryRunDecision::Refused(
            "This query is empty and was not run.".into(),
        ));
    }
    if !is_read_only_query(sql_content) {
        return Some(QueryRunDecision::Refused(
            "This query is not a single read-only statement and was not run.".into(),
        ));
    }
    None
}

pub async fn decide_query_run(
    pool: &PgPool,
    user_id: &str,
    sql_content: &str,
    data_source_id: &str,
) -> QueryRunDecision {
    if let Some(refusal) = precheck(sql_content) {
        return refusal;
    }
    let access = validate_query_access(pool, user_id, sql_content, data_source_id).await;
    if !access.allowed {
        return QueryRunDecision::Refused(
            access
                .reason
                .unwrap_or_else(|| "You do not have access to every table in this query".into()),
        );
    }
    QueryRunDecision::Ok
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refuses_empty() {
        assert!(matches!(precheck("   "), Some(QueryRunDecision::Refused(m)) if m.contains("empty")));
    }

    #[test]
    fn refuses_write_sql() {
        assert!(matches!(
            precheck("DELETE FROM users"),
            Some(QueryRunDecision::Refused(_))
        ));
    }

    #[test]
    fn refuses_statement_break() {
        assert!(matches!(
            precheck("SELECT 1 LIMIT 1; DROP TABLE users"),
            Some(QueryRunDecision::Refused(_))
        ));
    }

    #[test]
    fn plain_select_goes_on_to_access_check() {
        assert_eq!(precheck("SELECT * FROM t"), None);
    }
}
