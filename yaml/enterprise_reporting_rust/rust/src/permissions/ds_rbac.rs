//! `checkEntityAccess` (`src/lib/permissions/ds-rbac.ts`) — **the one
//! implementation** of "may this user read this table of this data source".
//! Do not add a second reading of that fact (CLAUDE.md, RBAC).
use serde::Serialize;
use sqlx::{PgPool, Row};

/// Weakest to strongest; the strongest matching grant wins.
pub const LEVELS: [&str; 5] = ["select", "insert", "update", "delete", "all"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entity {
    pub name: String,
    pub schema: Option<String>,
    pub is_subquery: bool,
}

impl Entity {
    #[must_use]
    pub fn table(name: &str) -> Self {
        Self {
            name: name.to_string(),
            schema: None,
            is_subquery: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessCheck {
    pub entity: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_schema: Option<String>,
    pub has_access: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub granted_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permission_level: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column_restrictions: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_filter: Option<String>,
}

/// A `ds_entity_permissions` row, as far as the decision needs it.
#[derive(Debug, Clone)]
pub struct Grant {
    pub ds_role_id: String,
    pub entity_name: String,
    pub entity_schema: Option<String>,
    pub permission_level: String,
    pub column_restrictions: Option<String>,
    pub row_filter: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum AccessError {
    #[error(transparent)]
    Db(#[from] sqlx::Error),
    #[error("role permissions are not valid JSON")]
    BadRolePermissions,
    #[error("column_restrictions is not valid JSON")]
    BadColumnRestrictions,
}

fn level_rank(level: &str) -> isize {
    LEVELS
        .iter()
        .position(|l| *l == level)
        .and_then(|p| isize::try_from(p).ok())
        .unwrap_or(-1)
}

/// The pure half of the decision, separated so it can be tested without a
/// database: given the user's system-role permission lists, their active
/// data-source roles `(id, name)` and the grants for those roles.
///
/// # Errors
/// When a role's permissions or a grant's column restrictions are not JSON —
/// the Node implementation throws there, and its caller turns that into a
/// denial.
pub fn decide(
    system_role_permissions: &[String],
    ds_roles: &[(String, String)],
    grants: &[Grant],
    entities: &[Entity],
) -> Result<Vec<AccessCheck>, AccessError> {
    let mut is_system_admin = false;
    for raw in system_role_permissions {
        let perms: Vec<String> = serde_json::from_str(raw).map_err(|_| AccessError::BadRolePermissions)?;
        if perms.iter().any(|p| p == "admin:*") {
            is_system_admin = true;
        }
    }

    if is_system_admin {
        return Ok(entities
            .iter()
            .map(|e| AccessCheck {
                entity: e.name.clone(),
                entity_schema: e.schema.clone(),
                has_access: true,
                granted_by: Some("System Admin".into()),
                permission_level: Some("all".into()),
                column_restrictions: None,
                row_filter: None,
            })
            .collect());
    }

    let denied = |e: &Entity| AccessCheck {
        entity: e.name.clone(),
        entity_schema: e.schema.clone(),
        has_access: false,
        granted_by: None,
        permission_level: None,
        column_restrictions: None,
        row_filter: None,
    };

    if ds_roles.is_empty() {
        return Ok(entities.iter().map(denied).collect());
    }

    let mut out = Vec::with_capacity(entities.len());
    for e in entities {
        if e.is_subquery {
            out.push(AccessCheck {
                has_access: true,
                granted_by: Some("Subquery (no direct table access)".into()),
                ..denied(e)
            });
            continue;
        }
        let matching: Vec<&Grant> = grants
            .iter()
            .filter(|g| {
                let name_match = g.entity_name.to_lowercase() == e.name.to_lowercase();
                let schema_match = e.schema.as_ref().is_none_or(|s| {
                    g.entity_schema
                        .as_ref()
                        .is_some_and(|gs| gs.to_lowercase() == s.to_lowercase())
                });
                name_match && schema_match
            })
            .collect();
        let Some(first) = matching.first() else {
            out.push(denied(e));
            continue;
        };
        let mut best = *first;
        for g in &matching {
            if level_rank(&g.permission_level) > level_rank(&best.permission_level) {
                best = g;
            }
        }
        let granted_by = ds_roles
            .iter()
            .find(|(id, _)| *id == best.ds_role_id)
            .map(|(_, name)| name.clone());
        let column_restrictions = match &best.column_restrictions {
            Some(raw) if !raw.is_empty() => Some(
                serde_json::from_str::<Vec<String>>(raw).map_err(|_| AccessError::BadColumnRestrictions)?,
            ),
            _ => None,
        };
        out.push(AccessCheck {
            entity: e.name.clone(),
            entity_schema: e.schema.clone(),
            has_access: true,
            granted_by,
            permission_level: Some(best.permission_level.clone()),
            column_restrictions,
            row_filter: best.row_filter.clone().filter(|f| !f.is_empty()),
        });
    }
    Ok(out)
}

/// # Errors
/// On a database error or malformed stored JSON (see [`decide`]).
pub async fn check_entity_access(
    pool: &PgPool,
    user_id: &str,
    data_source_id: &str,
    entities: &[Entity],
) -> Result<Vec<AccessCheck>, AccessError> {
    let system: Vec<String> = sqlx::query_scalar(
        "SELECT roles.permissions FROM user_roles INNER JOIN roles ON user_roles.role_id = roles.id \
         WHERE user_roles.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let ds_roles: Vec<(String, String)> = sqlx::query(
        "SELECT ds_roles.id AS role_id, ds_roles.name AS role_name FROM ds_user_roles \
         INNER JOIN ds_roles ON ds_user_roles.ds_role_id = ds_roles.id \
         WHERE ds_user_roles.data_source_id = $1 AND ds_user_roles.user_id = $2 AND ds_roles.is_active = true",
    )
    .bind(data_source_id)
    .bind(user_id)
    .fetch_all(pool)
    .await?
    .iter()
    .map(|r| (r.get::<String, _>("role_id"), r.get::<String, _>("role_name")))
    .collect();

    let grants = if ds_roles.is_empty() {
        Vec::new()
    } else {
        let ids: Vec<String> = ds_roles.iter().map(|(id, _)| id.clone()).collect();
        sqlx::query(
            "SELECT ds_role_id, entity_name, entity_schema, permission_level, column_restrictions, row_filter \
             FROM ds_entity_permissions WHERE data_source_id = $1 AND ds_role_id = ANY($2)",
        )
        .bind(data_source_id)
        .bind(&ids)
        .fetch_all(pool)
        .await?
        .iter()
        .map(|r| Grant {
            ds_role_id: r.get("ds_role_id"),
            entity_name: r.get("entity_name"),
            entity_schema: r.get("entity_schema"),
            permission_level: r.get("permission_level"),
            column_restrictions: r.get("column_restrictions"),
            row_filter: r.get("row_filter"),
        })
        .collect()
    };

    decide(&system, &ds_roles, &grants, entities)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn grant(role: &str, name: &str, level: &str, cols: Option<&str>) -> Grant {
        Grant {
            ds_role_id: role.into(),
            entity_name: name.into(),
            entity_schema: None,
            permission_level: level.into(),
            column_restrictions: cols.map(String::from),
            row_filter: None,
        }
    }

    #[test]
    fn admin_bypass() {
        let r = decide(&[r#"["admin:*"]"#.into()], &[], &[], &[Entity::table("x")]).unwrap();
        assert!(r[0].has_access);
        assert_eq!(r[0].granted_by.as_deref(), Some("System Admin"));
    }

    #[test]
    fn star_star_alone_is_not_the_ds_bypass() {
        // Node checks for admin:* specifically here.
        let r = decide(&[r#"["*:*"]"#.into()], &[], &[], &[Entity::table("x")]).unwrap();
        assert!(!r[0].has_access);
    }

    #[test]
    fn no_ds_role_denies() {
        let r = decide(&[r#"["report:*"]"#.into()], &[], &[], &[Entity::table("users")]).unwrap();
        assert!(!r[0].has_access);
    }

    #[test]
    fn best_level_wins_and_case_insensitive() {
        let roles = vec![("r1".into(), "Reader".into()), ("r2".into(), "Owner".into())];
        let grants = vec![
            grant("r1", "Users", "select", Some(r#"["id"]"#)),
            grant("r2", "users", "all", None),
        ];
        let r = decide(
            &[],
            &roles,
            &grants,
            &[Entity::table("USERS"), Entity::table("other")],
        )
        .unwrap();
        assert!(r[0].has_access);
        assert_eq!(r[0].permission_level.as_deref(), Some("all"));
        assert_eq!(r[0].granted_by.as_deref(), Some("Owner"));
        assert!(r[0].column_restrictions.is_none());
        assert!(!r[1].has_access);
    }

    #[test]
    fn legacy_read_level_is_weakest_but_still_grants() {
        // "read" is not in the hierarchy (rank -1) but a matching row still grants,
        // exactly as the Node implementation behaves.
        let roles = vec![("r1".into(), "Reader".into())];
        let r = decide(
            &[],
            &roles,
            &[grant("r1", "t", "read", None)],
            &[Entity::table("t")],
        )
        .unwrap();
        assert!(r[0].has_access);
    }

    #[test]
    fn malformed_role_json_is_error() {
        assert!(decide(&["not json".into()], &[], &[], &[Entity::table("t")]).is_err());
    }
}
