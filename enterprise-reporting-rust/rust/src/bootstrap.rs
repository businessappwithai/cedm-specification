//! The seed half of `bootstrapSchema()` (`src/lib/db/bootstrap.ts`).
//!
//! The baseline migration carries the DDL; this carries the rows the Node
//! bootstrap writes after it — the administrator and NL-query accounts and
//! roles, the copy of every `users.password_hash` into Better Auth's
//! `auth_accounts`, and the help articles. Until this existed only Node wrote
//! them, so a Rust-only installation had a schema and nobody who could sign in
//! to it: the administrator was created as a side effect of the TanStack
//! server's first request reaching `getDb()`.
//!
//! Everything here is idempotent and keyed exactly as Node keys it (the same
//! fixed ids), so the two backends can bootstrap one database in either order,
//! or both at once, and converge on the same rows.
use std::time::Duration;

use rand::RngCore;
use serde::Deserialize;
use sqlx::postgres::PgPool;

use crate::{auth::better_auth as ba, common::time::now_iso};

/// The bootstrap administrator's id — the same fixed value `bootstrap.ts` uses.
pub const ADMIN_ID: &str = "1aa00cc2af0225000c5c114df3eebb69";
const ADMIN_ROLE_ID: &str = "admin-role-id";
const NLQUERY_USER_ID: &str = "nlquery0user00000000000000000000";
const NLQUERY_ROLE_ID: &str = "nlquery0role00000000000000000000";

const ADMIN_PERMISSIONS: &[&str] = &[
    "*:*",
    "admin:*",
    "user:*",
    "role:*",
    "data_source:*",
    "report:*",
    "dashboard:*",
    "chart:*",
    "query:*",
    "job:*",
    "audit:*",
    "nl_query:*",
    "filter:*",
    "monitoring_rule:*",
    "log:*",
    "setting:*",
    "queue:*",
    "metadata_entity:*",
];

/// Extracted from `src/lib/db/help-seed.ts` by `rust/parity/extract-help-articles.ts`.
const HELP_ARTICLES_JSON: &str = include_str!("../migration/help-articles.json");

#[derive(Debug, Deserialize)]
struct HelpArticle {
    id: String,
    category: String,
    icon: String,
    color: String,
    title: String,
    summary: String,
    content: String,
    keywords: String,
    sort_order: i32,
    is_published: i64,
}

/// `new Date().toISOString()`, which is what Node writes into these tables'
/// `VARCHAR` timestamp columns.
fn stamp() -> String {
    now_iso()
}

/// `resolveBootstrapPassword`: the environment's value when it is at least
/// eight characters, otherwise a random one printed once and never stored.
fn bootstrap_password(env_var: &str, label: &str) -> String {
    if let Ok(configured) = std::env::var(env_var) {
        if configured.len() >= 8 {
            return configured;
        }
        if !configured.is_empty() {
            tracing::warn!(
                "[bootstrap] {env_var} is shorter than 8 characters and was ignored. Generating a random password instead."
            );
        }
    }
    let mut bytes = [0u8; 18];
    rand::thread_rng().fill_bytes(&mut bytes);
    let generated = base64::Engine::encode(&base64::engine::general_purpose::URL_SAFE_NO_PAD, bytes);
    // Printed, not logged: this is the one place the password exists, and a
    // JSON log line is not where an operator looks for it.
    println!(
        "\n[bootstrap] No {env_var} set. Generated a random password for {label}:\n\n    {generated}\n\n\
         This is printed once and is not recoverable. Sign in and change it, or set {env_var} before first boot.\n"
    );
    generated
}

async fn bcrypt_hash(password: String) -> Result<String, String> {
    let cost = ba::bcrypt_cost();
    tokio::task::spawn_blocking(move || bcrypt::hash(password, cost))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

/// The bootstrap baseline DDL — every table, `ALTER` and index, all
/// `IF NOT EXISTS` — exactly as `before_run` applies it on every server boot.
///
/// A task needs it too: Loco builds a task's context without migrating, so a
/// seeder that runs before the server has ever started finds no tables. The
/// Node seeder never met this because its `getDb()` bootstrapped on first use.
///
/// # Errors
/// On a database error running the DDL.
pub async fn baseline(db: &PgPool) -> Result<(), String> {
    sqlx::raw_sql(sqlx::AssertSqlSafe(crate::migration::BASELINE_SQL))
        .execute(db)
        .await
        .map(|_| ())
        .map_err(|e| format!("bootstrap baseline: {e}"))
}

/// The accounts, the credential backfill and the help articles.
///
/// # Errors
/// On a database error writing the administrator's role or account — the
/// rows without which nobody can sign in. Help articles are best-effort.
pub async fn seed(db: &PgPool) -> Result<(), String> {
    seed_accounts(db).await?;
    backfill_credentials(db).await?;
    if let Err(e) = seed_help_articles(db).await {
        tracing::warn!(error = %e, "[bootstrap] help articles not seeded (non-fatal)");
    }
    Ok(())
}

async fn upsert_role(
    db: &PgPool,
    id: &str,
    name: &str,
    description: &str,
    permissions: &str,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO roles (id, name, description, permissions, created_at) VALUES ($1, $2, $3, $4, $5) \
         ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions",
    )
    .bind(id)
    .bind(name)
    .bind(description)
    .bind(permissions)
    .bind(stamp())
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| format!("role {name}: {e}"))
}

async fn seed_accounts(db: &PgPool) -> Result<(), String> {
    let admin_permissions = serde_json::to_string(ADMIN_PERMISSIONS).unwrap_or_default();
    upsert_role(
        db,
        ADMIN_ROLE_ID,
        "Administrator",
        "Full system administrator",
        &admin_permissions,
    )
    .await?;

    // The administrator only into an empty user table, exactly as Node does.
    let users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(db)
        .await
        .map_err(|e| format!("count users: {e}"))?;
    if users == 0 {
        let hash = bcrypt_hash(bootstrap_password("ADMIN_PASSWORD", "admin@admin.com")).await?;
        let now = stamp();
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, display_name, avatar_url, is_active, created_at, updated_at) \
             VALUES ($1, 'admin@admin.com', $2, 'System Administrator', NULL, TRUE, $3, $3) \
             ON CONFLICT (id) DO NOTHING",
        )
        .bind(ADMIN_ID)
        .bind(&hash)
        .bind(&now)
        .execute(db)
        .await
        .map_err(|e| format!("admin user: {e}"))?;
        sqlx::query(
            "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        )
        .bind(ADMIN_ID)
        .bind(ADMIN_ROLE_ID)
        .bind(&now)
        .execute(db)
        .await
        .map_err(|e| format!("admin role link: {e}"))?;
        tracing::info!("[bootstrap] Admin created: admin@admin.com");
    }

    upsert_role(
        db,
        NLQUERY_ROLE_ID,
        "NLQueryUser",
        "Access limited to natural language query only",
        r#"["nl_query:*"]"#,
    )
    .await?;

    // Asked first rather than `ON CONFLICT DO NOTHING`: resolving the password
    // may generate and print one, which must happen only on the boot that
    // actually creates the account.
    let exists = sqlx::query("SELECT 1 FROM users WHERE id = $1")
        .bind(NLQUERY_USER_ID)
        .fetch_optional(db)
        .await
        .map_err(|e| format!("nlquery lookup: {e}"))?
        .is_some();
    let now = stamp();
    if !exists {
        let hash = bcrypt_hash(bootstrap_password("NLQUERY_PASSWORD", "nlquery@nlquery.com")).await?;
        // A failure here is a warning in Node too: an installation that
        // already holds nlquery@nlquery.com under another id is not broken.
        if let Err(e) = sqlx::query(
            "INSERT INTO users (id, email, password_hash, display_name, avatar_url, is_active, created_at, updated_at) \
             VALUES ($1, 'nlquery@nlquery.com', $2, 'nlquery', NULL, TRUE, $3, $3) ON CONFLICT (id) DO NOTHING",
        )
        .bind(NLQUERY_USER_ID)
        .bind(&hash)
        .bind(&now)
        .execute(db)
        .await
        {
            tracing::warn!(error = %e, "[bootstrap] nlquery user insert warning");
        }
    }
    if let Err(e) = sqlx::query(
        "INSERT INTO user_roles (user_id, role_id, assigned_at) \
         SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM users WHERE id = $1) ON CONFLICT DO NOTHING",
    )
    .bind(NLQUERY_USER_ID)
    .bind(NLQUERY_ROLE_ID)
    .bind(&now)
    .execute(db)
    .await
    {
        tracing::warn!(error = %e, "[bootstrap] nlquery user_roles insert warning");
    }
    Ok(())
}

/// Every user with a password hash and no `credential` account gets one.
/// Better Auth reads `auth_accounts.password`, never `users.password_hash`.
async fn backfill_credentials(db: &PgPool) -> Result<(), String> {
    let done = sqlx::query(
        "INSERT INTO auth_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) \
         SELECT LEFT('cred_' || u.id, 255), u.id, u.id, 'credential', u.password_hash, NOW(), NOW() \
         FROM users u \
         WHERE u.password_hash IS NOT NULL \
           AND NOT EXISTS (SELECT 1 FROM auth_accounts a WHERE a.user_id = u.id AND a.provider_id = 'credential') \
         ON CONFLICT (id) DO NOTHING",
    )
    .execute(db)
    .await
    .map_err(|e| format!("credential backfill: {e}"))?
    .rows_affected();
    if done > 0 {
        tracing::info!("[bootstrap] Migrated {done} credential(s) into Better Auth");
    }
    Ok(())
}

async fn seed_help_articles(db: &PgPool) -> Result<(), String> {
    let articles: Vec<HelpArticle> =
        serde_json::from_str(HELP_ARTICLES_JSON).map_err(|e| format!("help-articles.json: {e}"))?;
    for a in &articles {
        sqlx::query(
            "INSERT INTO help_articles (id, category, icon, color, title, summary, content, keywords, sort_order, \
                is_published, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) \
             ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, icon = EXCLUDED.icon, \
                color = EXCLUDED.color, title = EXCLUDED.title, summary = EXCLUDED.summary, \
                content = EXCLUDED.content, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order, \
                is_published = EXCLUDED.is_published",
        )
        .bind(&a.id)
        .bind(&a.category)
        .bind(&a.icon)
        .bind(&a.color)
        .bind(&a.title)
        .bind(&a.summary)
        .bind(&a.content)
        .bind(&a.keywords)
        .bind(a.sort_order)
        .bind(a.is_published != 0)
        .execute(db)
        .await
        .map_err(|e| format!("help article {}: {e}", a.id))?;
    }
    Ok(())
}

/// Create the config database when the server is up and it is missing.
///
/// `DATABASE_URL` names a database something else is expected to create — a
/// `docker-entrypoint-initdb.d` script, which PostgreSQL runs only on the first
/// start of an *empty* data directory. A volume that predates the reporting
/// side never gets one, and Loco then fails at boot on `database "…" does not
/// exist`, from a container that restarts forever. The seeder this replaces
/// (`scripts/seed-reporting-pack.ts`) created it; so does this, from the
/// binary's `main`, before any command that connects.
///
/// Waits up to `wait` for the *server* (a refused connection means "not up
/// yet"); a missing database is a fact rather than something to wait for.
/// Never fatal: a role without CREATEDB gets one line, and boot then fails with
/// the connection error that names the database.
pub async fn ensure_database(uri: &str, wait: Duration) {
    let Ok(mut target) = url::Url::parse(uri) else {
        return;
    };
    let name = percent_encoding::percent_decode_str(target.path().trim_start_matches('/'))
        .decode_utf8_lossy()
        .to_string();
    if name.is_empty() || name == "postgres" {
        return;
    }
    target.set_path("/postgres");
    let deadline = tokio::time::Instant::now() + wait;
    let mut reported = false;
    let maintenance = loop {
        match sqlx::postgres::PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_secs(3))
            .connect(target.as_str())
            .await
        {
            Ok(pool) => break pool,
            Err(e) => {
                if tokio::time::Instant::now() >= deadline {
                    tracing::warn!(error = %e, "[bootstrap] postgres server not reachable; continuing");
                    return;
                }
                if !reported {
                    println!("[bootstrap] waiting for the postgres server…");
                    reported = true;
                }
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    };
    let exists = sqlx::query("SELECT 1 FROM pg_database WHERE datname = $1")
        .bind(&name)
        .fetch_optional(&maintenance)
        .await
        .map(|r| r.is_some())
        .unwrap_or(true);
    if !exists {
        println!("[bootstrap] database \"{name}\" does not exist — creating it");
        let ddl = format!("CREATE DATABASE \"{}\"", name.replace('"', "\"\""));
        match sqlx::raw_sql(sqlx::AssertSqlSafe(ddl)).execute(&maintenance).await {
            Ok(_) => println!("[bootstrap] database \"{name}\": created"),
            // 42P04: somebody else created it first — the outcome asked for.
            Err(e) if e.as_database_error().and_then(|d| d.code()).as_deref() == Some("42P04") => {}
            Err(e) => println!(
                "[bootstrap] could not create database \"{name}\" ({e}). Create it by hand — createdb {name} — or grant CREATEDB to this role."
            ),
        }
    }
    maintenance.close().await;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_extracted_help_articles_parse() {
        let articles: Vec<HelpArticle> = serde_json::from_str(HELP_ARTICLES_JSON).expect("parses");
        assert!(articles.len() >= 10, "{} articles", articles.len());
        assert!(articles.iter().any(|a| a.id == "getting-started"));
    }

    #[test]
    fn a_short_configured_password_is_replaced() {
        // The generated one is 24 url-safe characters (18 bytes).
        std::env::remove_var("ERS_TEST_BOOTSTRAP_PW");
        assert_eq!(bootstrap_password("ERS_TEST_BOOTSTRAP_PW", "x").len(), 24);
    }
}
