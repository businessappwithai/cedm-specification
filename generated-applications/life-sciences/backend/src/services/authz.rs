//! Authorisation: the dictionary's table grants, plus the model's access rules.
//!
//! Generated: 2026-10-01T09:33:00.718Z
//! Project: life-sciences
//!
//! **The gap this closes.** `/api/bus/*` required a JWT and nothing else, so
//! any authenticated user could read or write any row in any table. The
//! dictionary already described who may see what — `/api/me/permissions` reads
//! `sys_access` to decide which windows to render — but that only ever reached
//! the navigation. The API did not consult it, so hiding a window hid the menu
//! entry and left the endpoint open: security by menu.
//!
//! This applies the same grant the UI already renders from, on the request
//! itself. The two now answer the same question from the same rows, which is
//! the point — a window a role cannot see is an entity it cannot call.
//!
//! **The model is Compiere's.** A role is granted a *window*; a window carries
//! tabs; a tab names a table. So a grant reaches a table through its window,
//! and `is_read_only` on the grant makes it a reader. `is_exclude` revokes.
//! A role flagged `is_master_role` bypasses the lookup entirely, which is what
//! makes the seeded administrator work before anyone has configured anything.
//!
//! **Row-level ownership is deliberately not here.** Filtering to
//! `created_by = me` is a different decision with different consequences — it
//! makes shared work invisible rather than forbidden, and on this schema most
//! entities are collaborative by design. Table-level access is the grant the
//! dictionary actually models, so it is the grant enforced. See
//! `docs/qa/` for the reasoning.
//!
//! # Three questions, three tables
//!
//! A request to change a record has to pass all of them, and they are
//! deliberately not merged:
//!
//! 1. **May this role reach the table at all?** `sys_access`, above — the
//!    dictionary's own grant, through window → tab → table.
//! 2. **May this role perform this operation on it?** `sys_operation_access`,
//!    written from the model's access rules. A `(table, operation)` pair
//!    with no rows is *unrestricted*, which is what keeps the directive
//!    additive: a model declaring none behaves exactly as it did before, and a
//!    database predating the migration that created the table keeps serving.
//! 3. **Does this move exist, and may this role make it?** `sys_workflow_transitions`
//!    and `sys_transition_access`.
//!
//! **Topology is enforced for everyone, the master role included; role rules
//! are bypassed by master.** An edge the diagram never drew is a move that does
//! not exist, not a permission an administrator lacks. Merging the two checks
//! is how topology enforcement comes to run only on the edges that happen to
//! carry a role rule — which is a bug this stack's sibling has already shipped
//! once.

use serde_json::{Map, Value};
use sqlx::{AssertSqlSafe, PgPool};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::models::_entities::users;

/// One operation an access rule can restrict.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Operation {
    Create,
    Read,
    Update,
    Delete,
}

impl Operation {
    /// The spelling stored in `sys_operation_access.operation`.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Create => "create",
            Self::Read => "read",
            Self::Update => "update",
            Self::Delete => "delete",
        }
    }

    /// Reading needs a read grant; everything else needs a write grant.
    #[must_use]
    pub const fn needs_write(self) -> bool {
        !matches!(self, Self::Read)
    }
}

/// Who is asking, resolved once per request.
///
/// One lookup rather than one per check. `table_access` used to re-query
/// `is_master_role` on every call and never fetched the role *names*, which the
/// access rules are written against.
#[derive(Clone, Debug, Default)]
pub struct Principal {
    pub sys_user_id: Option<Uuid>,
    /// Holds a role flagged `is_master_role` — bypasses every role rule.
    pub is_master: bool,
    /// Role names, normalised: lower case, spaces and hyphens as underscores.
    ///
    /// `sys_role.name` is title-cased for display (`Sales Manager`) and a
    /// directive writes the model's spelling (`sales_manager`). Folding both to
    /// one form here is what makes them the same role.
    pub roles: Vec<String>,
}

/// `Sales Manager`, `sales-manager` and `sales_manager` are one role.
#[must_use]
pub fn normalize_role(name: &str) -> String {
    let mut out = String::new();
    let mut pending = false;
    for ch in name.trim().to_lowercase().chars() {
        if ch.is_whitespace() || ch == '-' {
            pending = !out.is_empty();
            continue;
        }
        if pending {
            out.push('_');
            pending = false;
        }
        out.push(ch);
    }
    out
}

/// Resolve the caller's roles.
///
/// A user with no `sys_user` link holds nothing. That is not an error: the
/// account exists, it simply reaches nothing until an administrator grants it
/// something.
pub async fn principal(pool: &PgPool, user: &users::Model) -> AppResult<Principal> {
    let Some(sys_user_id) = user.sys_user_id else {
        return Ok(Principal::default());
    };

    let rows: Vec<(String, bool)> = sqlx::query_as(
        r"SELECT r.name, COALESCE(r.is_master_role, false)
            FROM sys_user_roles ur
            JOIN sys_role r ON r.sys_role_id = ur.sys_role_id
           WHERE ur.sys_user_id = $1
             AND COALESCE(ur.is_active, true) = true",
    )
    .bind(sys_user_id)
    .fetch_all(pool)
    .await
    // Not `unwrap_or_default()`: an empty role set is a real answer — an
    // account an administrator has granted nothing — and a failed query is
    // not that. Reporting the failure as "holds nothing" also quietly demotes
    // a master-role administrator, so the two must not be spelled the same.
    .map_err(|err| unreadable("the caller's roles", &err))?;

    Ok(Principal {
        sys_user_id: Some(sys_user_id),
        is_master: rows.iter().any(|(_, master)| *master),
        roles: rows.iter().map(|(name, _)| normalize_role(name)).collect(),
    })
}

/// What a user may do with one table.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Access {
    /// No grant reaches this table.
    None,
    /// Readable, but every write is refused.
    Read,
    /// Readable and writable.
    Write,
}

impl Access {
    #[must_use]
    pub const fn can_read(self) -> bool {
        matches!(self, Self::Read | Self::Write)
    }

    #[must_use]
    pub const fn can_write(self) -> bool {
        matches!(self, Self::Write)
    }
}

/// Resolve what a principal may do with `table_name`, from `sys_access`.
///
/// A principal with no `sys_user` link has no roles and therefore no grants.
/// That is `Access::None` rather than an error: the account exists, it simply
/// reaches nothing until an administrator grants it something.
pub async fn table_access(
    pool: &PgPool,
    principal: &Principal,
    table_name: &str,
) -> AppResult<Access> {
    let Some(sys_user_id) = principal.sys_user_id else {
        return Ok(Access::None);
    };

    if principal.is_master {
        return Ok(Access::Write);
    }

    // `bool_and` over `is_read_only`: a user holding two roles, one read-only
    // and one not, gets the more permissive of the two. Aggregating the other
    // way would make adding a role take access away.
    let granted: Option<bool> = sqlx::query_scalar(
        r"SELECT bool_and(COALESCE(a.is_read_only, false))
            FROM sys_access     a
            JOIN sys_user_roles ur ON ur.sys_role_id = a.sys_role_id
            JOIN sys_tab        tb ON tb.sys_window_id = a.sys_window_id
            JOIN sys_table      t  ON t.sys_table_id  = tb.sys_table_id
           WHERE ur.sys_user_id = $1
             AND t.table_name   = $2
             AND COALESCE(a.is_active,  true)  = true
             AND COALESCE(a.is_exclude, false) = false",
    )
    .bind(sys_user_id)
    .bind(table_name)
    .fetch_one(pool)
    .await?;

    Ok(match granted {
        None => Access::None,
        Some(true) => Access::Read,
        Some(false) => Access::Write,
    })
}

/// Refuse the request unless the principal may perform `op` on the table.
///
/// Two gates, in order. The dictionary's grant decides whether the table is
/// reachable at all; the model's access rules then decide whether this
/// particular operation on it is open to one of the roles held.
///
/// **No rows in `sys_operation_access` for the pair means unrestricted.** Not
/// denied — that reading would lock every user out of every existing model on
/// the first regeneration, and would take a database that predates the
/// migration creating the table out of service entirely.
pub async fn require_operation(
    pool: &PgPool,
    principal: &Principal,
    table_name: &str,
    op: Operation,
) -> AppResult<()> {
    let access = table_access(pool, principal, table_name).await?;
    let allowed = if op.needs_write() {
        access.can_write()
    } else {
        access.can_read()
    };
    if !allowed {
        return Err(forbidden(table_name, op.as_str()));
    }

    // The master role bypasses the model's rules, exactly as it bypasses the
    // dictionary's grants. Nothing else would let an administrator run an
    // application whose every operation the model restricted.
    if principal.is_master {
        return Ok(());
    }

    let permitted: Option<bool> = sqlx::query_scalar(
        r"SELECT bool_or(
                  lower(replace(replace(a.role_name, ' ', '_'), '-', '_')) = ANY($3)
                )
            FROM sys_operation_access a
           WHERE a.table_name = $1
             AND a.operation  = $2
             AND COALESCE(a.is_active, true) = true",
    )
    .bind(table_name)
    .bind(op.as_str())
    .bind(&principal.roles)
    .fetch_one(pool)
    .await
    .or_else(|err| {
        // A missing table means a database that has not run m0009. Unrestricted
        // is the honest answer there: the rules do not exist yet, so none apply.
        // Every other failure is refused — see `is_missing_relation`.
        if is_missing_relation(&err) {
            Ok(None)
        } else {
            Err(unreadable("sys_operation_access", &err))
        }
    })?;

    match permitted {
        // No rule rows: the pair is open.
        None => Ok(()),
        Some(true) => Ok(()),
        Some(false) => Err(restricted(table_name, op.as_str())),
    }
}

/// Refuse the request unless the principal may read the table.
pub async fn require_read(pool: &PgPool, principal: &Principal, table_name: &str) -> AppResult<()> {
    require_operation(pool, principal, table_name, Operation::Read).await
}

/// Which of `candidates` this principal may read, as one pair of queries.
///
/// The set-wise form of `require_read`, and it exists because the dashboard
/// asks the question about every entity at once. Asking per table would be two
/// queries each — sixty round trips on a seventeen-entity model, for a screen
/// that renders on every sign-in.
///
/// **It answers the same question as `require_read`, and that is a claim worth
/// holding rather than asserting.** The two gates are expressed here over a set
/// instead of a single name, which is a second statement of rules that already
/// exist above; `rbac::the_dashboard_scope_agrees_with_the_request_guard` drives
/// both over the whole dictionary and fails on the first table they disagree
/// about. Change one and that test tells you about the other.
///
/// The order below is the order `require_operation` applies:
///
/// 1. **`sys_access`** — the dictionary's grant, through role → window → tab →
///    table. A principal with no `sys_user` link holds no roles and so reaches
///    nothing, exactly as `table_access` returns `Access::None` for one.
/// 2. **`sys_operation_access`** — the model's `read` access rules. A table no
///    rule names is unrestricted; a table some rule names is readable only by a
///    role the rules name. Master bypasses this one, as it bypasses every role
///    rule.
///
/// Nothing the caller sends reaches the SQL: the candidate list comes from
/// `sys_table` and the roles from the principal, and both are bound.
pub async fn readable_tables(
    pool: &PgPool,
    principal: &Principal,
    candidates: &[String],
) -> AppResult<Vec<String>> {
    if candidates.is_empty() {
        return Ok(Vec::new());
    }

    // Gate 1. Master reaches every candidate; a principal with no dictionary
    // identity reaches none of them.
    let granted: Vec<String> = if principal.is_master {
        candidates.to_vec()
    } else {
        let Some(sys_user_id) = principal.sys_user_id else {
            return Ok(Vec::new());
        };
        sqlx::query_scalar(
            r"SELECT t.table_name
                FROM sys_access     a
                JOIN sys_user_roles ur ON ur.sys_role_id = a.sys_role_id
                JOIN sys_tab        tb ON tb.sys_window_id = a.sys_window_id
                JOIN sys_table      t  ON t.sys_table_id  = tb.sys_table_id
               WHERE ur.sys_user_id = $1
                 AND t.table_name = ANY($2)
                 AND COALESCE(a.is_active,  true)  = true
                 AND COALESCE(a.is_exclude, false) = false
               GROUP BY t.table_name",
        )
        .bind(sys_user_id)
        .bind(candidates)
        .fetch_all(pool)
        .await
        .map_err(|err| unreadable("sys_access", &err))?
    };

    if principal.is_master || granted.is_empty() {
        return Ok(granted);
    }

    // Gate 2. One row per candidate that a read rule names *and* this caller's
    // roles do not satisfy — the set to subtract. A candidate no rule names
    // produces no row here and stays readable, which is the additive default.
    let closed: Vec<String> = sqlx::query_scalar(
        r"SELECT a.table_name
            FROM sys_operation_access a
           WHERE a.table_name = ANY($1)
             AND a.operation  = 'read'
             AND COALESCE(a.is_active, true) = true
           GROUP BY a.table_name
          HAVING NOT bool_or(
                   lower(replace(replace(a.role_name, ' ', '_'), '-', '_')) = ANY($2)
                 )",
    )
    .bind(&granted)
    .bind(&principal.roles)
    .fetch_all(pool)
    .await
    .or_else(|err| {
        // Same exception as `require_operation`: a database that has not run
        // m0009 has no rules, so none apply. Every other failure is refused.
        if is_missing_relation(&err) {
            Ok(Vec::new())
        } else {
            Err(unreadable("sys_operation_access", &err))
        }
    })?;

    Ok(granted
        .into_iter()
        .filter(|table| !closed.contains(table))
        .collect())
}

/// Refuse the request unless the principal may write the table.
///
/// Kept for the callers whose verb is not one of the four — `Update` is the
/// conservative reading of "some write".
pub async fn require_write(
    pool: &PgPool,
    principal: &Principal,
    table_name: &str,
) -> AppResult<()> {
    require_operation(pool, principal, table_name, Operation::Update).await
}

/// Refuse a status change the state machine does not draw, or the caller's
/// roles may not make.
///
/// Two questions, and keeping them apart is the whole point of this function:
///
/// * **Does the move exist?** `sys_workflow_transitions` carries one row per
///   edge the model's state machine declares. A write moving
///   a record to a state no edge reaches is refused **for every caller, the
///   master role included** — an edge the diagram never drew is not a
///   permission an administrator lacks, it is a move that does not exist.
/// * **May this caller make it?** `sys_transition_access`, from the access rules. That
///   one the master role does bypass, like every other role rule.
///
/// A table with no edges at all has no state machine, so nothing is refused.
/// That is what makes this safe to call unconditionally from `update`.
pub async fn require_transition(
    pool: &PgPool,
    principal: &Principal,
    table_name: &str,
    id: Uuid,
    body: &Map<String, Value>,
) -> AppResult<()> {
    // The status columns this table's machines drive. Empty for a table with no
    // machine, which is the common case and costs one indexed lookup.
    let fields: Vec<String> = sqlx::query_scalar(
        r"SELECT DISTINCT status_field
            FROM sys_workflow_transitions
           WHERE table_name = $1
             AND COALESCE(is_active, true) = true",
    )
    .bind(table_name)
    .fetch_all(pool)
    .await
    .or_else(|err| {
        // Same reasoning as above: a database predating m0009 has no machines.
        // Anything else is refused, and this one matters most — an empty list
        // skips the loop entirely, so a swallowed error made every move the
        // diagram never drew legal, for every caller including master.
        if is_missing_relation(&err) {
            Ok(Vec::new())
        } else {
            Err(unreadable("sys_workflow_transitions", &err))
        }
    })?;

    for field in fields {
        // Only a column the request actually writes can be a transition.
        let Some(to_state) = body.get(&field).and_then(Value::as_str) else {
            continue;
        };

        // The value now. Both identifiers come from the dictionary and the
        // migration, never from the request, but they are checked anyway — a
        // format! into SQL should not depend on a table's contents being sane.
        if !is_identifier(table_name) || !is_identifier(&field) {
            continue;
        }
        // `AssertSqlSafe` because the two interpolated names are a dictionary
        // table and one of its columns, both checked above against the bare
        // identifier shape — never anything the request supplied.
        let from_state: Option<String> = sqlx::query_scalar(AssertSqlSafe(format!(
            r#"SELECT "{field}"::text FROM "{table_name}" WHERE id = $1"#
        )))
        .bind(id)
        .fetch_optional(pool)
        .await?
        .flatten();

        let Some(from_state) = from_state else {
            // A record with no state yet is entering the machine, not moving
            // through it. The seeded initial state is the model's business, not
            // this guard's.
            continue;
        };
        if from_state == to_state {
            continue;
        }

        let edge_exists: bool = sqlx::query_scalar(
            r"SELECT EXISTS (
                  SELECT 1 FROM sys_workflow_transitions
                   WHERE table_name   = $1
                     AND status_field = $2
                     AND from_state   = $3
                     AND to_state     = $4
                     AND COALESCE(is_active, true) = true)",
        )
        .bind(table_name)
        .bind(&field)
        .bind(&from_state)
        .bind(to_state)
        .fetch_one(pool)
        .await?;

        if !edge_exists {
            return Err(AppError::Validation {
                message: format!("'{from_state}' does not move to '{to_state}'"),
                errors: vec![format!(
                    "no transition on {table_name}.{field} from '{from_state}' to '{to_state}'"
                )],
            });
        }

        if principal.is_master {
            continue;
        }

        let permitted: Option<bool> = sqlx::query_scalar(
            r"SELECT bool_or(
                      lower(replace(replace(a.role_name, ' ', '_'), '-', '_')) = ANY($5)
                    )
                FROM sys_transition_access a
               WHERE a.table_name   = $1
                 AND a.status_field = $2
                 AND a.from_state   = $3
                 AND a.to_state     = $4
                 AND COALESCE(a.is_active, true) = true",
        )
        .bind(table_name)
        .bind(&field)
        .bind(&from_state)
        .bind(to_state)
        .bind(&principal.roles)
        .fetch_one(pool)
        .await
        .or_else(|err| {
            if is_missing_relation(&err) {
                Ok(None)
            } else {
                Err(unreadable("sys_transition_access", &err))
            }
        })?;

        if permitted == Some(false) {
            return Err(AppError::Forbidden(format!(
                "your role may not move {table_name}.{field} from '{from_state}' to '{to_state}'"
            )));
        }
    }

    Ok(())
}

/// A bare SQL identifier: what a generated table or column name looks like.
fn is_identifier(value: &str) -> bool {
    !value.is_empty()
        && value
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
        && !value.starts_with(|c: char| c.is_ascii_digit())
}

/// 403, not 404: the caller is authenticated and the table exists. Saying so
/// is not a disclosure — the dictionary is readable without a token by design,
/// because the frontend builds its navigation from it before anyone signs in.
/// Did this query fail only because the table is not there yet?
///
/// The permissive default these lookups carry — "no rows means no restriction"
/// — is deliberate and documented: it is what makes the access rules additive, and it
/// is what lets a database predating m0009 keep serving. It was applied to
/// *every* error, though, which is a different thing entirely: a timeout, a
/// dropped connection or a deadlock also produced "no rows", and so also
/// produced "allowed". A restriction that disappears under load is not a
/// restriction.
///
/// So the genuine case is separated from the rest. `42P01` is
/// `undefined_table`: the relation does not exist, the rules truly are absent,
/// and unrestricted is the honest answer. Anything else is refused — the gate
/// could not read its rules, and it must not guess.
fn is_missing_relation(err: &sqlx::Error) -> bool {
    matches!(err, sqlx::Error::Database(db) if db.code().as_deref() == Some("42P01"))
}

/// The gate could not read its own rules. Never an allow.
fn unreadable(what: &str, err: &sqlx::Error) -> AppError {
    AppError::Internal(anyhow::anyhow!(
        "authorization could not read {what}: {err}"
    ))
}

/// Refuse the request unless the caller may administer the Application Dictionary.
///
/// `/api/sys/*` reads are deliberately open — the frontend builds its navigation
/// from the dictionary before anyone signs in. The **writes** are a different
/// thing, and used to require only a token. That was a complete bypass of this
/// module: `sys_role` carries `is_master_role`, `sys_user_roles` is what grants
/// a role, and `sys_access` is the first of the three gates — so any account
/// that could register could promote a role to master, grant itself one, or
/// widen its own reach, and arrive back at `/api/bus/*` holding everything.
/// `sys_system` was reachable the same way, which put the AI endpoint URL —
/// where business data is sent — under the same open write.
///
/// The bar is the master role, because that is the actor the dictionary screens
/// were written for and the only administrator this schema models. A finer
/// grain would need a permission the dictionary does not yet carry, and
/// inventing one here would be a second answer to a question `sys_access`
/// already exists to ask.
pub fn require_dictionary_admin(principal: &Principal) -> AppResult<()> {
    if principal.is_master {
        return Ok(());
    }
    Err(AppError::Forbidden(
        "administering the Application Dictionary requires the master role".to_string(),
    ))
}

fn forbidden(table_name: &str, verb: &str) -> AppError {
    AppError::Forbidden(format!(
        "your role does not grant {verb} access to '{table_name}'"
    ))
}

/// The model said so, rather than the dictionary. Worth a different sentence:
/// an administrator looking at this can go and read the access rule.
fn restricted(table_name: &str, verb: &str) -> AppError {
    AppError::Forbidden(format!(
        "'{table_name}' restricts {verb} to roles your account does not hold"
    ))
}
