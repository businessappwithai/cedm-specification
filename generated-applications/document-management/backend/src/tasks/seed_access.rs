//! `cargo loco task seed_access` — the roles and restrictions the model's access rules declared.
//!
//! Two halves, and they are separate because only one of them can be SQL.
//!
//! **The rules** are `seed/access.sql`, generated from the model: roles into
//! `sys_role`, per-operation restrictions into `sys_operation_access`, and
//! per-transition restrictions into `sys_transition_access`. All deterministic
//! UUIDv5 keys, all `ON CONFLICT DO NOTHING`, so applying the file twice is a
//! no-op.
//!
//! **The accounts** are here in Rust, because a credential row needs an argon2
//! digest and SQL cannot produce one. One account per role the model named, so
//! the application can actually demonstrate its own authorization: the
//! administrator bypasses every restriction, so an application whose only
//! account is the administrator cannot show what a single access rule
//! did.
//!
//! **Why a seed rather than a migration**, for the same reason the dictionary
//! is: it is re-runnable. A model that gains a restriction must be able to top
//! up a database that has already migrated, which a migration recorded as
//! applied could never do.
//!
//! Rows are marked `is_model_managed`. A rule added inside the running
//! application is unmarked, so regeneration can replace what it owns without
//! discarding what an administrator added.
//!
//! **A `(table_name, operation)` pair with no rows is unrestricted.** That is
//! what makes the rules additive: a model declaring no access rules leaves
//! every operation exactly as open as it was, and `seed/access.sql` is then a
//! comment header and nothing else.

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use sea_orm::ConnectionTrait;
use uuid::Uuid;

/// The generated access rules. Regenerate rather than edit.
const ACCESS_SQL: &str = include_str!("../../seed/access.sql");

/// The password every seeded role account gets, overridable with
/// `ROLE_ACCOUNT_PASSWORD`.
///
/// These are demonstration accounts for a generated application, and the
/// default matches `ADMIN_PASSWORD`'s so there is one password to remember
/// while trying the thing out. Set the variable — or delete the accounts —
/// before this runs anywhere real.
const DEFAULT_ROLE_PASSWORD: &str = "admin";

/// Written to `sys_user.password_hash`, which is NOT NULL but is not a
/// credential in this stack. Same convention as `ensure_admin`: a value that
/// parses as no hash format, so nothing can authenticate against it.
const SYS_USER_PASSWORD_DISABLED: &str = "!";

/// One demonstration account: email, display name, and the role it holds.
///
/// The administrator is deliberately absent — `ensure_admin` owns that account
/// and reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` for it. Seeding it twice would
/// give two tasks a claim on one password.
struct RoleAccount {
    email: &'static str,
    name: &'static str,
    role_name: &'static str,
    description: &'static str,
}

const ROLE_ACCOUNTS: &[RoleAccount] = &[RoleAccount {
    email: "user@document-management.example.com",
    name: "User",
    role_name: "User",
    description: "Holds User and nothing else",
}];

pub struct SeedAccess;

#[async_trait]
impl Task for SeedAccess {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_access".to_string(),
            detail: "Install the roles and access rules the model declares".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &Vars) -> Result<()> {
        // One call for the whole file, so a failure part-way leaves the tables
        // untouched rather than half seeded.
        ctx.db.execute_unprepared(ACCESS_SQL).await?;

        let pool = ctx.db.get_postgres_connection_pool();

        let (operations, transitions): (i64, i64) = sqlx::query_as(
            r"SELECT (SELECT COUNT(*) FROM sys_operation_access WHERE is_model_managed),
                     (SELECT COUNT(*) FROM sys_transition_access WHERE is_model_managed)",
        )
        .fetch_one(pool)
        .await
        .map_err(|err| Error::Message(format!("counting access rules: {err}")))?;

        println!(
            "✓ Access rules installed ({operations} operation rule(s), {transitions} transition rule(s))"
        );

        if ROLE_ACCOUNTS.is_empty() {
            return Ok(());
        }

        let password = std::env::var("ROLE_ACCOUNT_PASSWORD")
            .unwrap_or_else(|_| DEFAULT_ROLE_PASSWORD.to_string());
        // Hashed once rather than per account: argon2 is deliberately slow, and
        // every demonstration account shares the one password anyway.
        let hashed = loco_rs::hash::hash_password(&password)
            .map_err(|err| Error::Message(format!("hashing role account password: {err}")))?;

        for account in ROLE_ACCOUNTS {
            let role: Option<(Uuid,)> =
                sqlx::query_as("SELECT sys_role_id FROM sys_role WHERE name = $1")
                    .bind(account.role_name)
                    .fetch_optional(pool)
                    .await
                    .map_err(|err| {
                        Error::Message(format!("looking up role {}: {err}", account.role_name))
                    })?;
            // `seed/access.sql` creates every role this list names, so a miss
            // means the file was not applied. Skip rather than fail: the rules
            // are the point of the task and they are already in.
            let Some((role_id,)) = role else {
                println!(
                    "  ! role \"{}\" not found — skipping {}",
                    account.role_name, account.email
                );
                continue;
            };

            let (sys_user_id,): (Uuid,) = sqlx::query_as(
                r"INSERT INTO sys_user (
                       sys_user_id, name, email, password_hash, description,
                       is_system_user, is_sales_rep, login_failure_count, is_locked,
                       is_account_verified, default_sys_role_id,
                       entity_type, is_active, created_by, updated_by, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1, $2, $3, $4,
                           FALSE, FALSE, 0, FALSE, TRUE, $5,
                           'D', TRUE, 'system', 'system', NOW(), NOW())
                   ON CONFLICT (email) DO UPDATE
                       SET name = EXCLUDED.name,
                           description = EXCLUDED.description,
                           default_sys_role_id = EXCLUDED.default_sys_role_id,
                           updated_at = NOW()
                   RETURNING sys_user_id",
            )
            .bind(account.name)
            .bind(account.email)
            .bind(SYS_USER_PASSWORD_DISABLED)
            .bind(account.description)
            .bind(role_id)
            .fetch_one(pool)
            .await
            .map_err(|err| Error::Message(format!("upserting {}: {err}", account.email)))?;

            sqlx::query(
                r"INSERT INTO sys_user_roles (
                       sys_user_roles_id, sys_user_id, sys_role_id,
                       entity_type, is_active, created_by, updated_by, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1, $2, 'D', TRUE, 'system', 'system', NOW(), NOW())
                   ON CONFLICT (sys_user_id, sys_role_id) DO NOTHING",
            )
            .bind(sys_user_id)
            .bind(role_id)
            .execute(pool)
            .await
            .map_err(|err| {
                Error::Message(format!(
                    "granting {} to {}: {err}",
                    account.role_name, account.email
                ))
            })?;

            // The credential row. Unlike `ensure_admin`, a re-run does NOT
            // reset the password: resetting the administrator's is a documented
            // recovery path invoked deliberately, where quietly resetting an
            // account somebody changed during `cargo loco db seed` is not.
            sqlx::query(
                r"INSERT INTO users (pid, email, password, api_key, name, sys_user_id)
                   VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
                   ON CONFLICT (email) DO UPDATE
                       SET name = EXCLUDED.name,
                           sys_user_id = EXCLUDED.sys_user_id,
                           updated_at = NOW()",
            )
            .bind(account.email)
            .bind(&hashed)
            .bind(format!("lo-{}", Uuid::new_v4()))
            .bind(account.name)
            .bind(sys_user_id)
            .execute(pool)
            .await
            .map_err(|err| {
                Error::Message(format!(
                    "upserting credentials for {}: {err}",
                    account.email
                ))
            })?;
        }

        println!(
            "✓ {} role account(s) seeded — password \"{password}\"",
            ROLE_ACCOUNTS.len()
        );
        for account in ROLE_ACCOUNTS {
            println!("    {} ({})", account.email, account.role_name);
        }
        Ok(())
    }
}
