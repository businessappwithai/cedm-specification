//! `resolveRBACContext` / `detectRBACDrift`
//! (`src/lib/monitoring/rbac-workflow-context.ts`) and the report worker's
//! `validateSQLColumnsAgainstRBAC`, for scheduled NL reports.
use std::collections::HashSet;

use serde_json::{json, Map, Value};
use sqlx::{PgPool, Row};

/// `getAccessibleResourceIds(ctx, "data_source", "view")`: `None` means "no
/// filtering" — an `admin` role, no matching roles, or no grants at all.
async fn accessible_data_source_ids(
    db: &PgPool,
    roles: &[String],
) -> Result<Option<Vec<String>>, sqlx::Error> {
    if roles.iter().any(|r| r.to_lowercase() == "admin") {
        return Ok(None);
    }
    let role_ids: Vec<String> = sqlx::query_scalar("SELECT id FROM roles WHERE name = ANY($1)")
        .bind(roles)
        .fetch_all(db)
        .await?;
    if role_ids.is_empty() {
        return Ok(None);
    }
    let ids: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT resource_id FROM resource_permissions WHERE resource_type = 'data_source' \
           AND role_id = ANY($1) AND permission_level IN ('view', 'edit', 'execute', 'admin')",
    )
    .bind(&role_ids)
    .fetch_all(db)
    .await?;
    Ok(if ids.is_empty() { None } else { Some(ids) })
}

/// `getUserAccessibleEntities`: `(entity_name, column_restrictions, row_filter)`.
/// A system admin (`admin:*`) gets none — "everything".
pub(crate) async fn accessible_entities(
    db: &PgPool,
    user_id: &str,
    ds_id: &str,
) -> Result<Vec<(String, Option<String>, Option<String>)>, String> {
    let perms: Vec<Option<String>> = sqlx::query_scalar(
        "SELECT r.permissions FROM user_roles ur INNER JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())?;
    for p in perms {
        // JSON.parse(r.permissions) throws on a malformed role, as in Node.
        let list: Vec<String> =
            serde_json::from_str(p.as_deref().unwrap_or("null")).map_err(|e| e.to_string())?;
        if list.iter().any(|x| x == "admin:*") {
            return Ok(Vec::new());
        }
    }
    let rows = sqlx::query(
        "SELECT p.entity_name, p.column_restrictions, p.row_filter FROM ds_entity_permissions p \
         WHERE p.data_source_id = $1 AND p.ds_role_id IN ( \
           SELECT r.id FROM ds_user_roles ur INNER JOIN ds_roles r ON ur.ds_role_id = r.id \
           WHERE ur.data_source_id = $1 AND ur.user_id = $2 AND r.is_active = true)",
    )
    .bind(ds_id)
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows
        .iter()
        .map(|r| {
            (
                r.get("entity_name"),
                r.get("column_restrictions"),
                r.get("row_filter"),
            )
        })
        .collect())
}

/// `resolveRBACContext(userId, { roles })` — the snapshot a definition stores.
///
/// # Errors
/// On a database error or a malformed role.
pub async fn resolve_context(db: &PgPool, user_id: &str) -> Result<Value, String> {
    let roles: Vec<String> = sqlx::query_scalar(
        "SELECT r.name FROM user_roles ur INNER JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1",
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())?;
    let filter = accessible_data_source_ids(db, &roles)
        .await
        .map_err(|e| e.to_string())?;
    let data_sources: Vec<(String, String)> = match &filter {
        None => {
            sqlx::query_as("SELECT id, name FROM data_sources WHERE is_active = true")
                .fetch_all(db)
                .await
        }
        Some(ids) => {
            sqlx::query_as("SELECT id, name FROM data_sources WHERE is_active = true AND id = ANY($1)")
                .bind(ids)
                .fetch_all(db)
                .await
        }
    }
    .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for (id, name) in data_sources {
        let mut tables: Vec<String> = Vec::new();
        let mut columns = Map::new();
        let mut filters = Map::new();
        for (table, restrictions, row_filter) in accessible_entities(db, user_id, &id).await? {
            if !tables.contains(&table) {
                tables.push(table.clone());
            }
            match restrictions {
                Some(r) => match serde_json::from_str::<Vec<String>>(&r) {
                    Ok(list) => {
                        let entry = columns.entry(table.clone()).or_insert_with(|| json!([]));
                        if let Some(existing) = entry.as_array_mut() {
                            if existing.is_empty() && !list.is_empty() {
                                *existing = list.iter().map(|c| json!(c)).collect();
                            } else {
                                for c in list {
                                    if !existing.contains(&json!(c)) {
                                        existing.push(json!(c));
                                    }
                                }
                            }
                        }
                    }
                    Err(_) => {
                        columns.insert(table.clone(), json!([]));
                    }
                },
                None => {
                    columns.insert(table.clone(), json!([]));
                }
            }
            if let Some(f) = row_filter.filter(|f| !f.is_empty()) {
                filters.insert(table, json!(f));
            }
        }
        out.push(json!({
            "id": id,
            "name": name,
            "allowedTables": tables,
            "allowedColumns": columns,
            "rowFilters": filters,
        }));
    }
    Ok(json!({
        "userId": user_id,
        "userRoles": roles,
        "accessibleDataSources": out,
        "resolvedAt": crate::common::time::now_iso(),
        "snapshotVersion": 1,
    }))
}

fn strings(v: Option<&Value>) -> Vec<String> {
    v.and_then(Value::as_array)
        .map(|a| a.iter().filter_map(|x| x.as_str().map(str::to_string)).collect())
        .unwrap_or_default()
}

/// `detectRBACDrift`: `Ok(())` to proceed (no drift, or only new access),
/// `Err(details)` to stop.
pub async fn detect_drift(db: &PgPool, snapshot: &Value, user_id: &str) -> Result<(), String> {
    let current = resolve_context(db, user_id)
        .await
        .map_err(|e| format!("Failed to resolve current RBAC context: {e}"))?;
    let empty = Vec::new();
    let snap_ds = snapshot
        .get("accessibleDataSources")
        .and_then(Value::as_array)
        .unwrap_or(&empty);
    let cur_ds = current["accessibleDataSources"]
        .as_array()
        .cloned()
        .unwrap_or_default();
    for s in snap_ds {
        let id = s.get("id").and_then(Value::as_str).unwrap_or_default();
        let name = s.get("name").and_then(Value::as_str).unwrap_or_default();
        let Some(c) = cur_ds.iter().find(|d| d["id"] == json!(id)) else {
            let exists = sqlx::query("SELECT id FROM data_sources WHERE id = $1")
                .bind(id)
                .fetch_optional(db)
                .await
                .ok()
                .flatten()
                .is_some();
            return Err(if exists {
                format!("Access to data source '{name}' ({id}) has been revoked.")
            } else {
                format!("Data source '{name}' ({id}) has been deleted.")
            });
        };
        let snap_tables = strings(s.get("allowedTables"));
        let cur_tables: HashSet<String> = strings(c.get("allowedTables")).into_iter().collect();
        let revoked: Vec<&String> = snap_tables.iter().filter(|t| !cur_tables.contains(*t)).collect();
        if !revoked.is_empty() {
            let list: Vec<&str> = revoked.iter().map(|t| t.as_str()).collect();
            return Err(format!(
                "Access to tables [{}] in data source '{name}' has been revoked.",
                list.join(", ")
            ));
        }
        for t in &snap_tables {
            let snap_cols = strings(s.get("allowedColumns").and_then(|m| m.get(t)));
            let cur_cols = strings(c.get("allowedColumns").and_then(|m| m.get(t)));
            if snap_cols.is_empty() && !cur_cols.is_empty() {
                return Err(format!(
                    "Column access for table '{t}' in data source '{name}' has been restricted."
                ));
            }
            let removed: Vec<&str> = snap_cols
                .iter()
                .filter(|col| !cur_cols.contains(col))
                .map(String::as_str)
                .collect();
            if !removed.is_empty() {
                return Err(format!(
                    "Access to columns [{}] in table '{t}' of data source '{name}' has been revoked.",
                    removed.join(", ")
                ));
            }
        }
    }
    Ok(())
}

/// `validateSQLColumnsAgainstRBAC`: every `table.column` the SQL names, for a
/// table the snapshot restricts, must be an allowed column.
///
/// # Errors
/// The refusal reason.
pub fn check_columns(sql: &str, data_source_id: &str, snapshot: &Value) -> Result<(), String> {
    let Some(list) = snapshot
        .get("accessibleDataSources")
        .and_then(Value::as_array)
        .filter(|l| !l.is_empty())
    else {
        return Ok(());
    };
    let Some(ds) = list
        .iter()
        .find(|d| d.get("id").and_then(Value::as_str) == Some(data_source_id))
    else {
        return Err(format!("Data source {data_source_id} not in RBAC snapshot"));
    };
    let normalized = sql.replace(['`', '"'], "");
    let upper = normalized.to_uppercase();
    let Some(columns) = ds.get("allowedColumns").and_then(Value::as_object) else {
        return Ok(());
    };
    for (table, allowed) in columns {
        let allowed = strings(Some(allowed));
        if allowed.is_empty() || !upper.contains(&table.to_uppercase()) {
            continue;
        }
        let set: HashSet<String> = allowed.iter().map(|c| c.to_uppercase()).collect();
        let re = regex::Regex::new(&format!(r"(?i)\b{}\s*\.\s*(\w+)", regex::escape(table)))
            .map_err(|e| e.to_string())?;
        for cap in re.captures_iter(&normalized) {
            if !set.contains(&cap[1].to_uppercase()) {
                return Err(format!(
                    "Column '{}' in table '{table}' is not permitted by your RBAC profile. Allowed columns: [{}]",
                    &cap[1],
                    allowed.join(", ")
                ));
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn column_restrictions() {
        let snap = json!({"accessibleDataSources": [{"id": "ds", "allowedColumns": {"orders": ["id", "amount"], "hr": []}}]});
        assert!(check_columns("SELECT orders.id, orders.amount FROM orders", "ds", &snap).is_ok());
        let err = check_columns("SELECT orders.customer FROM orders", "ds", &snap).unwrap_err();
        assert!(err.starts_with("Column 'customer' in table 'orders'"));
        assert!(check_columns("SELECT x FROM y", "other", &snap).is_err());
        assert!(check_columns("SELECT 1", "ds", &json!({})).is_ok());
    }
}
