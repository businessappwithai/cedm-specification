//! `validateQueryAccess` (`src/lib/permissions/query-access-validator.ts`).
//!
//! A query whose tables cannot be determined is **denied**: an access decision
//! that cannot be made is a refusal.
use serde::Serialize;
use sqlx::PgPool;

use super::ds_rbac::{check_entity_access, Entity};
use crate::sql::tables::analyse;

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct QueryAccess {
    pub allowed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub denied_tables: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub denied_columns: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip)]
    pub tables_accessed: Vec<String>,
}

fn deny(reason: String) -> QueryAccess {
    QueryAccess {
        allowed: false,
        reason: Some(reason),
        ..Default::default()
    }
}

/// # Panics
/// Never; database failures become a denial.
pub async fn validate_query_access(
    pool: &PgPool,
    user_id: &str,
    sql: &str,
    data_source_id: &str,
) -> QueryAccess {
    // Node parses with its default ("pg") dialect regardless of the data
    // source's client type; kept for parity.
    let analysis = match analyse(sql, "pg") {
        Ok(a) => a,
        Err(reason) => {
            return deny(format!(
                "This query could not be analysed for table access, so it was not run. \
                 Rewrite it in plain SELECT form, or save it as a report if it needs \
                 constructs the analyser does not cover. ({reason})"
            ))
        }
    };
    let tables = analysis.tables.clone();

    if tables.is_empty() {
        return QueryAccess {
            allowed: true,
            ..Default::default()
        };
    }

    let entities: Vec<Entity> = tables.iter().map(|t| Entity::table(t)).collect();
    let results = match check_entity_access(pool, user_id, data_source_id, &entities).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "[QueryAccess] Validation error");
            return deny("Access validation failed. Please try again or contact support.".into());
        }
    };

    let denied_tables: Vec<String> = results
        .iter()
        .filter(|r| !r.has_access)
        .map(|r| r.entity.clone())
        .collect();
    let denied_columns = if denied_tables.is_empty() {
        denied_columns(&analysis, &results)
    } else {
        Vec::new()
    };

    if !denied_tables.is_empty() {
        let reason = format!(
            "You don't have permission to access: {}",
            denied_tables.join(", ")
        );
        return QueryAccess {
            allowed: false,
            denied_tables: Some(denied_tables),
            reason: Some(reason),
            tables_accessed: tables,
            ..Default::default()
        };
    }
    if !denied_columns.is_empty() {
        let reason = format!(
            "You don't have permission to access columns: {}",
            denied_columns.join(", ")
        );
        return QueryAccess {
            allowed: false,
            denied_columns: Some(denied_columns),
            reason: Some(reason),
            tables_accessed: tables,
            ..Default::default()
        };
    }
    QueryAccess {
        allowed: true,
        tables_accessed: tables,
        ..Default::default()
    }
}

/// Columns a query references that a column restriction does not allow.
///
/// Node checked only columns written as `table.column`, so `SELECT salary
/// FROM hr`, `SELECT h.salary FROM hr h` and `SELECT COUNT(salary) …` all read
/// a restricted column (MIGRATION_PLAN.md §9, D-8). Here every column the
/// statement references anywhere must be in the allowed set, and `*` is
/// refused outright, whenever any table in the query carries a restriction.
/// A column that could belong to an unrestricted table in the same query is
/// refused too: without a schema there is no telling whose it is, and the safe
/// answer to an unanswerable access question is no.
fn denied_columns(
    analysis: &crate::sql::tables::Analysis,
    results: &[super::ds_rbac::AccessCheck],
) -> Vec<String> {
    let restricted: Vec<(&str, &Vec<String>)> = results
        .iter()
        .filter_map(|r| {
            r.column_restrictions
                .as_ref()
                .filter(|c| !c.is_empty())
                .map(|c| (r.entity.as_str(), c))
        })
        .collect();
    if restricted.is_empty() {
        return Vec::new();
    }
    let label = |col: &str| match restricted.as_slice() {
        [(entity, _)] => format!("{entity}.{col}"),
        _ => col.to_string(),
    };
    let mut denied = Vec::new();
    if analysis.has_wildcard {
        denied.push(label("*"));
    }
    for col in &analysis.columns {
        let allowed = restricted
            .iter()
            .any(|(_, cols)| cols.iter().any(|c| c.eq_ignore_ascii_case(col)));
        if !allowed {
            denied.push(label(col));
        }
    }
    denied
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::permissions::ds_rbac::AccessCheck;
    use crate::sql::tables::analyse;

    fn restricted(entity: &str, cols: &[&str]) -> AccessCheck {
        AccessCheck {
            entity: entity.into(),
            entity_schema: None,
            has_access: true,
            granted_by: None,
            permission_level: Some("select".into()),
            column_restrictions: Some(cols.iter().map(|c| (*c).to_string()).collect()),
            row_filter: None,
        }
    }

    /// Review finding: unqualified and aliased columns bypassed restrictions.
    #[test]
    fn restricted_columns_are_enforced_however_they_are_written() {
        let r = [restricted("hr", &["id", "name"])];
        for sql in [
            "SELECT salary FROM hr",
            "SELECT h.salary FROM hr h",
            "SELECT COUNT(salary) FROM hr",
            "SELECT id FROM hr WHERE salary > 10",
            "SELECT * FROM hr",
        ] {
            assert!(
                !denied_columns(&analyse(sql, "pg").unwrap(), &r).is_empty(),
                "{sql}"
            );
        }
        assert!(denied_columns(&analyse("SELECT h.id, name FROM hr h", "pg").unwrap(), &r).is_empty());
    }

    #[test]
    fn no_restrictions_means_no_column_check() {
        let mut r = restricted("hr", &[]);
        r.column_restrictions = None;
        assert!(denied_columns(&analyse("SELECT * FROM hr", "pg").unwrap(), &[r]).is_empty());
    }
}
