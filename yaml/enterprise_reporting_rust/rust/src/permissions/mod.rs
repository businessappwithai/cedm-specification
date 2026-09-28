pub mod ds_rbac;
pub mod ownership;
pub mod query_access;
pub mod runnable_query;

/// `hasPermission` (`src/lib/permissions/permissions.ts`): system-level RBAC
/// over `resource:action` strings.
#[must_use]
pub fn has_permission(permissions: &[String], roles: &[String], resource: &str, action: &str) -> bool {
    if roles.iter().any(|r| r.eq_ignore_ascii_case("admin")) {
        return true;
    }
    let wanted = [
        "*:*".to_string(),
        "admin:*".to_string(),
        format!("{resource}:*"),
        format!("{resource}:{action}"),
    ];
    permissions.iter().any(|p| wanted.contains(p))
}

#[cfg(test)]
mod tests {
    use super::has_permission;

    fn v(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| (*s).to_string()).collect()
    }

    #[test]
    fn wildcards_and_exact() {
        assert!(has_permission(&v(&["*:*"]), &[], "report", "view"));
        assert!(has_permission(&v(&["admin:*"]), &[], "report", "view"));
        assert!(has_permission(&v(&["report:*"]), &[], "report", "delete"));
        assert!(has_permission(&v(&["report:view"]), &[], "report", "view"));
        assert!(!has_permission(&v(&["report:view"]), &[], "report", "delete"));
        assert!(!has_permission(&v(&["chart:*"]), &[], "report", "view"));
        assert!(has_permission(&[], &v(&["Admin"]), "report", "view"));
    }
}
