//! Who may change a report, chart or dashboard: its creator or an admin.
//!
//! This is `canConfigureReport` (`src/lib/permissions/report-ownership.ts`),
//! which Node applies to report filter links only. Node's report, chart and
//! dashboard PUT/PATCH/DELETE routes check nothing beyond a session, so any
//! signed-in user can rewrite or delete anyone's report. Here every write goes
//! through this (MIGRATION_PLAN.md §9, D-12).
use sqlx::PgPool;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WriteDecision {
    Allowed,
    NotFound,
    Forbidden,
}

/// `isAdmin(userId)` (`src/lib/permissions/permissions.ts`): a role named
/// admin/administrator, or one carrying `*` or `admin:*`.
///
/// # Errors
/// On a database error.
pub async fn is_admin(pool: &PgPool, user_id: &str) -> Result<bool, sqlx::Error> {
    let roles: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT r.name, r.permissions FROM user_roles ur INNER JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(roles.iter().any(|(name, perms)| {
        let n = name.to_lowercase();
        if n == "admin" || n == "administrator" {
            return true;
        }
        serde_json::from_str::<Vec<String>>(perms.as_deref().unwrap_or("[]"))
            .is_ok_and(|p| p.iter().any(|x| x == "*" || x == "admin:*"))
    }))
}

/// The resource tables this applies to. A closed set, so the table name is
/// never request input.
#[derive(Debug, Clone, Copy)]
pub enum Owned {
    Report,
    Chart,
    Dashboard,
}

impl Owned {
    const fn table(self) -> &'static str {
        match self {
            Self::Report => "report_definitions",
            Self::Chart => "chart_definitions",
            Self::Dashboard => "dashboard_layouts",
        }
    }
}

/// # Errors
/// On a database error.
pub async fn can_modify(
    pool: &PgPool,
    what: Owned,
    id: &str,
    user_id: &str,
) -> Result<WriteDecision, sqlx::Error> {
    let owner: Option<Option<String>> = sqlx::query_scalar(sqlx::AssertSqlSafe(format!(
        "SELECT created_by FROM {} WHERE id = $1",
        what.table()
    )))
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some(owner) = owner else {
        return Ok(WriteDecision::NotFound);
    };
    if owner.as_deref() == Some(user_id) || is_admin(pool, user_id).await? {
        return Ok(WriteDecision::Allowed);
    }
    Ok(WriteDecision::Forbidden)
}
