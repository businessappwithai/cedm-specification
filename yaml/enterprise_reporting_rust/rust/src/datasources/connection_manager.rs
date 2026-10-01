//! Connections to users' databases (`src/lib/db/connection-manager.ts`).
//!
//! Pooled by data-source id and health-checked (`SELECT 1`) before reuse. The
//! stored `connection_config` is AES-256-GCM encrypted with the same key the
//! Node service uses.
//!
//! Hostnames resolve to IPv4 explicitly because Docker DNS returns IPv6 first
//! and that path fails against Neon pooler endpoints. When TLS is on, the
//! hostname — not the IP — is what TLS needs for SNI; sqlx takes SNI from the
//! connect host, so for TLS connections the hostname is kept, and Neon hosts
//! additionally carry `options=endpoint=<id>`, which Neon accepts in place of
//! SNI.
use std::{
    collections::HashMap,
    hash::{Hash, Hasher},
    str::FromStr,
    sync::LazyLock,
    time::Duration,
};

use serde::Deserialize;
use serde_json::Value;
use sqlx::{
    mysql::{MySqlConnectOptions, MySqlPool, MySqlPoolOptions, MySqlSslMode},
    postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode},
    AssertSqlSafe, Executor,
};
use tokio::sync::Mutex;

use crate::{
    common::db::{mysql_row_to_json, pg_row_to_json},
    security::encryption,
};

#[derive(Debug, thiserror::Error)]
pub enum ConnectionError {
    #[error(
        "SQLite data sources are no longer supported. Please use PostgreSQL, MySQL, or SQL Server instead."
    )]
    Sqlite,
    #[error(
        "SQL Server data sources are not served by the Rust backend (PostgreSQL only; MIGRATION_PLAN.md §7)"
    )]
    MssqlNotPorted,
    #[error("Unsupported database client type: {0}")]
    Unsupported(String),
    #[error("Invalid connection string: cannot parse URL")]
    BadConnectionString,
    #[error("connection config could not be decrypted")]
    Decrypt(#[from] encryption::EncryptionError),
    #[error("connection config is not valid JSON")]
    BadConfig,
    #[error(transparent)]
    Db(#[from] sqlx::Error),
}

/// The columns of `data_sources` a connection needs.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct DataSourceRow {
    pub id: String,
    pub name: String,
    pub client_type: String,
    pub connection_config: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConnectionConfig {
    host: Option<String>,
    port: Option<Value>,
    database: Option<String>,
    user: Option<String>,
    password: Option<String>,
    connection_string: Option<String>,
    ssl: Option<Value>,
}

impl ConnectionConfig {
    fn port(&self, default: u16) -> u16 {
        match &self.port {
            Some(Value::Number(n)) => n.as_u64().and_then(|p| u16::try_from(p).ok()).unwrap_or(default),
            Some(Value::String(s)) => s.parse().unwrap_or(default),
            _ => default,
        }
    }

    fn ssl_on(&self) -> bool {
        match &self.ssl {
            Some(Value::Bool(b)) => *b,
            Some(Value::Object(_)) => true,
            _ => false,
        }
    }
}

/// The message node-pg would put in `error.message`: the server's own text
/// for a database error, sqlx's description otherwise.
#[must_use]
pub fn db_error_message(e: &sqlx::Error) -> String {
    e.as_database_error()
        .map_or_else(|| e.to_string(), |d| d.message().to_string())
}

/// A pooled connection to one user database.
#[derive(Debug, Clone)]
pub enum UserDb {
    Pg(PgPool),
    MySql(MySqlPool),
}

impl UserDb {
    /// Run one statement and return its rows as JSON objects, typed the way
    /// the Node drivers type them (MIGRATION_PLAN.md §4.4).
    ///
    /// The statement runs inside a **read-only transaction that is always
    /// rolled back**. The analyser refuses data-modifying SQL before it gets
    /// here; this is the second line, enforced by the database itself, for
    /// whatever the analyser does not model (a volatile function that writes,
    /// say). Rolling back also discards any session setting the statement
    /// changed (`set_config(…, false)`), so nothing leaks to the next caller
    /// of the pooled connection. The Node service runs user SQL on a plain
    /// read-write connection (MIGRATION_PLAN.md §9, D-7).
    ///
    /// # Errors
    /// On any database error, including the database refusing a write.
    pub async fn fetch_json(&self, sql: &str) -> Result<Vec<Value>, sqlx::Error> {
        // User SQL by design: every caller has passed it through
        // `decideQueryRun` / `validateQueryAccess` first.
        match self {
            Self::Pg(p) => {
                let mut tx = p.begin().await?;
                sqlx::query("SET TRANSACTION READ ONLY").execute(&mut *tx).await?;
                let rows = sqlx::query(AssertSqlSafe(sql))
                    .persistent(false)
                    .fetch_all(&mut *tx)
                    .await;
                tx.rollback().await?;
                Ok(rows?.iter().map(pg_row_to_json).collect())
            }
            Self::MySql(p) => {
                let mut conn = p.acquire().await?;
                sqlx::query("START TRANSACTION READ ONLY")
                    .execute(&mut *conn)
                    .await?;
                let rows = sqlx::query(AssertSqlSafe(sql))
                    .persistent(false)
                    .fetch_all(&mut *conn)
                    .await;
                sqlx::query("ROLLBACK").execute(&mut *conn).await?;
                Ok(rows?.iter().map(mysql_row_to_json).collect())
            }
        }
    }

    async fn ping(&self) -> bool {
        match self {
            Self::Pg(p) => p.execute("SELECT 1").await.is_ok(),
            Self::MySql(p) => p.execute("SELECT 1").await.is_ok(),
        }
    }

    async fn close(&self) {
        match self {
            Self::Pg(p) => p.close().await,
            Self::MySql(p) => p.close().await,
        }
    }
}

static POOLS: LazyLock<Mutex<HashMap<String, (u64, UserDb)>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

fn config_fingerprint(ds: &DataSourceRow) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    ds.client_type.hash(&mut h);
    ds.connection_config.hash(&mut h);
    h.finish()
}

async fn resolve_ipv4(host: &str) -> Option<String> {
    let addrs = tokio::net::lookup_host((host, 0)).await.ok()?;
    addrs
        .filter(std::net::SocketAddr::is_ipv4)
        .map(|a| a.ip().to_string())
        .next()
}

fn is_local(host: &str) -> bool {
    matches!(host, "localhost" | "127.0.0.1" | "::1")
}

/// Neon's endpoint id from a hostname such as
/// `ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech`.
fn neon_endpoint(host: &str) -> Option<String> {
    if !host.ends_with(".neon.tech") {
        return None;
    }
    let first = host.split('.').next()?;
    Some(first.trim_end_matches("-pooler").to_string())
}

async fn pg_options(cfg: &ConnectionConfig) -> Result<PgConnectOptions, ConnectionError> {
    let (host, port, database, user, password, tls) = if let Some(cs) = &cfg.connection_string {
        let url = parse_connection_url(cs).ok_or(ConnectionError::BadConnectionString)?;
        let tls = !is_local(&url.host);
        (
            url.host,
            url.port.unwrap_or(5432),
            url.database,
            url.user,
            url.password,
            tls,
        )
    } else {
        (
            cfg.host.clone().unwrap_or_default(),
            cfg.port(5432),
            cfg.database.clone().unwrap_or_default(),
            cfg.user.clone().unwrap_or_default(),
            cfg.password.clone().unwrap_or_default(),
            cfg.ssl_on(),
        )
    };

    let mut opts = PgConnectOptions::new()
        .port(port)
        .database(&database)
        .username(&user)
        .password(&password)
        .options([("statement_timeout", "60000")]);
    if tls {
        // rejectUnauthorized: false — encrypted, certificate not verified.
        opts = opts.host(&host).ssl_mode(PgSslMode::Require);
        if let Some(ep) = neon_endpoint(&host) {
            opts = opts.options([("endpoint", ep.as_str())]);
        }
    } else {
        let target = resolve_ipv4(&host).await.unwrap_or(host);
        opts = opts.host(&target).ssl_mode(PgSslMode::Disable);
    }
    Ok(opts)
}

async fn build_pg(cfg: &ConnectionConfig) -> Result<UserDb, ConnectionError> {
    let opts = pg_options(cfg).await?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .min_connections(0)
        .idle_timeout(Duration::from_secs(300))
        .acquire_timeout(Duration::from_secs(30))
        .connect_lazy_with(opts);
    Ok(UserDb::Pg(pool))
}

fn build_mysql(cfg: &ConnectionConfig) -> UserDb {
    let opts = MySqlConnectOptions::new()
        .host(cfg.host.as_deref().unwrap_or("localhost"))
        .port(cfg.port(3306))
        .database(cfg.database.as_deref().unwrap_or_default())
        .username(cfg.user.as_deref().unwrap_or_default())
        .password(cfg.password.as_deref().unwrap_or_default())
        .ssl_mode(if cfg.ssl_on() {
            MySqlSslMode::Required
        } else {
            MySqlSslMode::Preferred
        });
    UserDb::MySql(
        MySqlPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(30))
            .connect_lazy_with(opts),
    )
}

struct ParsedUrl {
    host: String,
    port: Option<u16>,
    database: String,
    user: String,
    password: String,
}

/// Enough of WHATWG URL parsing for `postgres://user:pass@host:port/db?…`.
fn parse_connection_url(s: &str) -> Option<ParsedUrl> {
    let rest = s.split_once("://")?.1;
    let rest = rest.split(['?', '#']).next()?;
    let (auth, hostpath) = match rest.rsplit_once('@') {
        Some((a, h)) => (Some(a), h),
        None => (None, rest),
    };
    let (hostport, path) = hostpath.split_once('/').unwrap_or((hostpath, ""));
    let (host, port) = if let Some(stripped) = hostport.strip_prefix('[') {
        let (h, p) = stripped.split_once(']')?;
        (
            h.to_string(),
            p.strip_prefix(':').and_then(|p| u16::from_str(p).ok()),
        )
    } else {
        match hostport.rsplit_once(':') {
            Some((h, p)) => (h.to_string(), Some(u16::from_str(p).ok()?)),
            None => (hostport.to_string(), None),
        }
    };
    if host.is_empty() {
        return None;
    }
    let decode = |v: &str| {
        percent_encoding::percent_decode_str(v)
            .decode_utf8_lossy()
            .to_string()
    };
    let (user, password) = match auth {
        Some(a) => match a.split_once(':') {
            Some((u, p)) => (decode(u), decode(p)),
            None => (decode(a), String::new()),
        },
        None => (String::new(), String::new()),
    };
    Some(ParsedUrl {
        host,
        port,
        database: path.to_string(),
        user,
        password,
    })
}

async fn build(ds: &DataSourceRow) -> Result<UserDb, ConnectionError> {
    let plain = encryption::decrypt(&ds.connection_config)?;
    let cfg: ConnectionConfig = serde_json::from_str(&plain).map_err(|_| ConnectionError::BadConfig)?;
    match ds.client_type.as_str() {
        "pg" => build_pg(&cfg).await,
        "mysql" => Ok(build_mysql(&cfg)),
        "mssql" => Err(ConnectionError::MssqlNotPorted),
        "sqlite3" => Err(ConnectionError::Sqlite),
        other => Err(ConnectionError::Unsupported(other.to_string())),
    }
}

/// A healthy pooled connection for this data source, built on first use and
/// rebuilt when the stored config changes or the health check fails.
///
/// # Errors
/// See [`ConnectionError`].
pub async fn get_connection(ds: &DataSourceRow) -> Result<UserDb, ConnectionError> {
    let fp = config_fingerprint(ds);
    let existing = POOLS.lock().await.get(&ds.id).cloned();
    if let Some((cached_fp, db)) = existing {
        if cached_fp == fp && db.ping().await {
            return Ok(db);
        }
        db.close().await;
    }
    let db = build(ds).await?;
    POOLS.lock().await.insert(ds.id.clone(), (fp, db.clone()));
    Ok(db)
}

/// `testConnection` + `ConnectionTestService.validateConfig` for PostgreSQL:
/// `(connected, message, latency_ms)`, with Node's user-facing messages.
/// MySQL and SQL Server are outside the Rust backend's scope
/// (MIGRATION_PLAN.md §1).
pub async fn test_connection(client_type: &str, config: &Value) -> (bool, String, Option<u128>) {
    let ty = client_type.trim().to_lowercase();
    if ty.is_empty() {
        return (false, "Database type is required".into(), None);
    }
    let cfg: ConnectionConfig = serde_json::from_value(config.clone()).unwrap_or_default();
    match ty.as_str() {
        "pg" | "postgres" | "postgresql" => {}
        "sqlite" | "sqlite3" => return (false, ConnectionError::Sqlite.to_string(), None),
        "mysql" | "mssql" | "sqlserver" => {
            return (
                false,
                format!("{ty} data sources are not served by the Rust backend (PostgreSQL only)"),
                None,
            )
        }
        _ => return (false, format!("Unsupported database type: {client_type}"), None),
    }
    if let Some(cs) = &cfg.connection_string {
        if cs.trim().is_empty() {
            return (false, "Connection string cannot be empty".into(), None);
        }
    } else {
        let missing: Vec<&str> = [
            ("host", &cfg.host),
            ("database", &cfg.database),
            ("user", &cfg.user),
        ]
        .into_iter()
        .filter(|(_, v)| v.as_deref().is_none_or(str::is_empty))
        .map(|(k, _)| k)
        .collect();
        if !missing.is_empty() {
            return (
                false,
                format!("Missing required fields: {}", missing.join(", ")),
                None,
            );
        }
    }

    let start = std::time::Instant::now();
    let result = async {
        use sqlx::{ConnectOptions, Connection};
        let opts = pg_options(&cfg).await?;
        // One direct connection: a pool would retry a refused connection
        // until its acquire timeout, where Node reports it at once.
        let mut conn = tokio::time::timeout(Duration::from_secs(30), opts.connect())
            .await
            .map_err(|_| ConnectionError::Db(sqlx::Error::PoolTimedOut))??;
        let r = async {
            (&mut conn).execute("SELECT 1").await?;
            if let Err(e) = (&mut conn)
                .execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1")
                .await
            {
                return Err(sqlx::Error::Protocol(format!(
                    "Schema access failed: {e}. The user may not have permissions to query information_schema."
                )));
            }
            Ok(())
        }
        .await;
        let _ = conn.close().await;
        r.map_err(ConnectionError::from)
    }
    .await;
    let latency = start.elapsed().as_millis();
    match result {
        Ok(()) => (
            true,
            format!("Connection successful ({latency}ms)"),
            Some(latency),
        ),
        Err(e) => (false, friendly_error(&e, latency), None),
    }
}

/// Node's error mapping in `testConnection`.
fn friendly_error(e: &ConnectionError, elapsed_ms: u128) -> String {
    use std::io::ErrorKind;
    // node-pg's `error.message` is the server's own text.
    let message = match e {
        ConnectionError::Db(err) => db_error_message(err),
        other => other.to_string(),
    };
    let io_kind = match e {
        ConnectionError::Db(sqlx::Error::Io(io)) => Some(io.kind()),
        _ => None,
    };
    let upper = message.to_uppercase();
    if matches!(e, ConnectionError::Db(sqlx::Error::PoolTimedOut))
        || io_kind == Some(ErrorKind::TimedOut)
        || upper.contains("TIMEOUT")
        || upper.contains("TIMED OUT")
    {
        return format!(
            "Connection timeout ({elapsed_ms}ms). The database server may be unreachable, the network may be blocking the connection, or the SSL/TLS handshake is taking too long. Check: (1) DNS resolution, (2) firewall rules, (3) network connectivity to the database host."
        );
    }
    if io_kind == Some(ErrorKind::ConnectionRefused) || upper.contains("CONNECTION REFUSED") {
        return "Connection refused. The database server rejected the connection. Check: (1) host and port are correct, (2) database server is running and accepting connections.".into();
    }
    if upper.contains("FAILED TO LOOKUP ADDRESS")
        || upper.contains("NAME OR SERVICE NOT KNOWN")
        || upper.contains("GETADDRINFO")
    {
        return "Host not found. DNS resolution failed for the database host. Check: (1) hostname is spelled correctly, (2) DNS resolution is working, (3) network connectivity to DNS servers.".into();
    }
    if upper.contains("SCHEMA ACCESS") {
        return message
            .trim_start_matches("encountered unexpected or invalid data: ")
            .to_string();
    }
    if upper.contains("AUTHENTICATION") || upper.contains("PASSWORD") {
        return "Authentication failed. The database rejected the credentials. Check: (1) username and password are correct, (2) user has access to the specified database.".into();
    }
    message
}

/// Drop a data source's pool (after an update or delete).
pub async fn close_connection(data_source_id: &str) {
    if let Some((_, db)) = POOLS.lock().await.remove(data_source_id) {
        db.close().await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_connection_strings() {
        let u = parse_connection_url("postgresql://us%40er:p%3Ass@db.example.com:6543/app?sslmode=require")
            .unwrap();
        assert_eq!(
            (u.host.as_str(), u.port, u.database.as_str()),
            ("db.example.com", Some(6543), "app")
        );
        assert_eq!((u.user.as_str(), u.password.as_str()), ("us@er", "p:ss"));
        let u = parse_connection_url("postgres://localhost/x").unwrap();
        assert_eq!((u.host.as_str(), u.port), ("localhost", None));
        assert!(parse_connection_url("not a url").is_none());
    }

    #[test]
    fn neon_endpoint_from_pooler_host() {
        assert_eq!(
            neon_endpoint("ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech").as_deref(),
            Some("ep-cool-darkness-123456")
        );
        assert_eq!(neon_endpoint("db.example.com"), None);
    }
}

/// Against a real PostgreSQL when `ERS_TEST_PG_URL` is set (CI's service
/// container, or a local database); skipped otherwise.
#[cfg(test)]
mod pg_tests {
    use super::UserDb;

    async fn db() -> Option<UserDb> {
        let url = std::env::var("ERS_TEST_PG_URL").ok()?;
        Some(UserDb::Pg(
            sqlx::postgres::PgPoolOptions::new()
                .max_connections(1)
                .connect(&url)
                .await
                .ok()?,
        ))
    }

    #[tokio::test]
    async fn user_sql_cannot_write_or_leak_session_settings() {
        let Some(db) = db().await else { return };
        db.fetch_json("SELECT 1").await.unwrap();
        // The database itself refuses a write the analyser might miss.
        // nextval() writes, and is a plain SELECT to any analyser.
        let UserDb::Pg(pool) = &db else { unreachable!() };
        sqlx::query("CREATE SEQUENCE IF NOT EXISTS ers_ro_probe")
            .execute(pool)
            .await
            .unwrap();
        let err = db.fetch_json("SELECT nextval('ers_ro_probe')").await.unwrap_err();
        assert!(err.to_string().contains("read-only"), "{err}");
        // A session setting changed inside the statement does not survive it.
        db.fetch_json("SELECT pg_catalog.set_config('default_transaction_read_only', 'off', false)")
            .await
            .unwrap();
        let rows = db
            .fetch_json("SELECT current_setting('default_transaction_read_only') AS v")
            .await
            .unwrap();
        assert_eq!(rows[0]["v"], "off"); // the server default, not something the last caller left behind
        let rows = db
            .fetch_json("SELECT current_setting('x.y', true) AS v")
            .await
            .unwrap();
        assert!(rows[0]["v"].is_null() || rows[0]["v"] == "", "{rows:?}");
    }
}
