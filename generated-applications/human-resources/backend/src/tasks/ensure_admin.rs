//! `cargo loco task ensure_admin` — create or refresh the administrator.
//!
//! The Rust counterpart of `ensureAdminUser()` in the NestJS stack's
//! `main.ts`, and it keeps the same `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars
//! and the same defaults — the stack-agnostic `tests/` suites read those
//! defaults to log in, so changing them here would silently break the
//! cross-stack parity oracle.
//!
//! **Two tables, one administrator.** `users` is the credential store for
//! Loco's native JWT auth (decision D1); `sys_user` is the dictionary's
//! identity, and `sys_user_roles` is what every access check reads. This task
//! writes both and links them through `users.sys_user_id`, because an admin
//! that can log in but has no role is indistinguishable from an ordinary user.
//!
//! Re-running is safe and is the intended way to reset a forgotten admin
//! password: the credential row is updated in place rather than duplicated.

use loco_rs::prelude::*;
use loco_rs::task::Vars;
use uuid::Uuid;

/// Defaults shared with the NestJS stack and with `tests/harness/config.ts`.
const DEFAULT_ADMIN_EMAIL: &str = "admin@admin.com";
const DEFAULT_ADMIN_PASSWORD: &str = "admin";

/// Written to `sys_user.password_hash`, which is NOT NULL but is no longer a
/// credential in this stack — `users.password` is.
///
/// Deliberately not a real hash and not a copy of the argon2 one: it parses as
/// no hash format, so nothing can ever authenticate against it, and the admin's
/// password is stored in exactly one place. The convention is the same `!` that
/// `/etc/shadow` uses for "login disabled".
const SYS_USER_PASSWORD_DISABLED: &str = "!";

pub struct EnsureAdmin;

#[async_trait]
impl Task for EnsureAdmin {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "ensure_admin".to_string(),
            detail: "Create or update the administrator from ADMIN_EMAIL / ADMIN_PASSWORD"
                .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, vars: &Vars) -> Result<()> {
        // CLI arguments win over the environment, so an operator can reset one
        // account without exporting a password into their shell history.
        let email = vars
            .cli_arg("email")
            .map(ToString::to_string)
            .or_else(|_| std::env::var("ADMIN_EMAIL"))
            .unwrap_or_else(|_| DEFAULT_ADMIN_EMAIL.to_string())
            .to_lowercase();
        let password = vars
            .cli_arg("password")
            .map(ToString::to_string)
            .or_else(|_| std::env::var("ADMIN_PASSWORD"))
            .unwrap_or_else(|_| DEFAULT_ADMIN_PASSWORD.to_string());
        let name = std::env::var("ADMIN_NAME").unwrap_or_else(|_| "Administrator".to_string());

        let pool = ctx.db.get_postgres_connection_pool();

        // The Administrator role comes from `seed_dictionary`. Failing loudly
        // here is right: silently creating a role would give it no `sys_access`
        // rows, so the admin would log in to an empty dictionary.
        let role: Option<(Uuid,)> =
            sqlx::query_as("SELECT sys_role_id FROM sys_role WHERE name = 'Administrator'")
                .fetch_optional(pool)
                .await
                .map_err(|err| Error::Message(format!("looking up Administrator role: {err}")))?;
        let Some((role_id,)) = role else {
            return Err(Error::Message(
                "no Administrator role — run `cargo loco task seed_dictionary` first".to_string(),
            ));
        };

        // `sys_user`: the dictionary identity. `email` is uniquely indexed, so
        // the conflict target is the natural key and the update covers a
        // re-run where the display name changed.
        let (sys_user_id,): (Uuid,) = sqlx::query_as(
            r"INSERT INTO sys_user (
                   sys_user_id, name, email, password_hash, description,
                   is_system_user, is_sales_rep, login_failure_count, is_locked,
                   is_account_verified, default_sys_role_id,
                   entity_type, is_active, created_by, updated_by, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3, 'Default system administrator',
                       TRUE, FALSE, 0, FALSE, TRUE, $4,
                       'D', TRUE, 'system', 'system', NOW(), NOW())
               ON CONFLICT (email) DO UPDATE
                   SET name = EXCLUDED.name,
                       default_sys_role_id = EXCLUDED.default_sys_role_id,
                       is_active = TRUE,
                       is_locked = FALSE,
                       updated_at = NOW()
               RETURNING sys_user_id",
        )
        .bind(&name)
        .bind(&email)
        .bind(SYS_USER_PASSWORD_DISABLED)
        .bind(role_id)
        .fetch_one(pool)
        .await
        .map_err(|err| Error::Message(format!("upserting sys_user: {err}")))?;

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
        .map_err(|err| Error::Message(format!("granting Administrator role: {err}")))?;

        // `users`: the credential store. Hashing goes through Loco's helper so
        // the digest is identical to the one `/api/auth/register` produces —
        // the login path has no idea this row came from a task.
        let hashed = loco_rs::hash::hash_password(&password)
            .map_err(|err| Error::Message(format!("hashing admin password: {err}")))?;

        let (created,): (bool,) = sqlx::query_as(
            r"INSERT INTO users (pid, email, password, api_key, name, sys_user_id)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
               ON CONFLICT (email) DO UPDATE
                   SET password = EXCLUDED.password,
                       name = EXCLUDED.name,
                       sys_user_id = EXCLUDED.sys_user_id,
                       updated_at = NOW()
               RETURNING (xmax = 0) AS created",
        )
        .bind(&email)
        .bind(&hashed)
        .bind(format!("lo-{}", Uuid::new_v4()))
        .bind(&name)
        .bind(sys_user_id)
        .fetch_one(pool)
        .await
        .map_err(|err| Error::Message(format!("upserting admin credentials: {err}")))?;

        println!(
            "{} administrator {email} (sys_user {sys_user_id}) with the Administrator role",
            if created { "Created" } else { "Updated" }
        );
        if password == DEFAULT_ADMIN_PASSWORD {
            println!(
                "  WARNING: using the default password. Set ADMIN_PASSWORD before deploying."
            );
        }

        Ok(())
    }
}
