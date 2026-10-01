//! `seed_reporting_pack` — load a generated application into the platform.
//!
//! The Rust port of `scripts/seed-reporting-pack.ts`, and the one every caller
//! runs now: the orchestrator's compose file, a generated application's own
//! compose file, and a direct run.
//!
//! ```text
//! REPORTING_PACK=pack.json APP_DATABASE_URL=postgresql://… \
//!   ers-backend-cli task seed_reporting_pack
//! ```
//!
//! It leaves the platform holding a working analytics workspace for whatever
//! application was just generated:
//!
//!   1. the application's database, registered as a data source with its
//!      connection details encrypted with this backend's own `encrypt`
//!   2. that database's schema, introspected and cached by the same
//!      `introspect_and_cache` the NL-query pipeline reads
//!   3. every saved query, report, chart, dashboard and widget in the pack,
//!      and one reporting role per `%%rbac` role, scoped to the tables it may
//!      read
//!
//! Idempotent by name, like the script: it runs on every `docker compose up`.
//!
//! A pack is derived, never invented — `buildReportingPack` in the generator
//! (`packages/generator/src/reporting/pack.ts`) builds it from the model. This
//! only writes it down, into the same eleven tables and in the same shapes as
//! the script did, so a database seeded by either reads the same.
use std::{collections::HashMap, time::Duration};

use loco_rs::prelude::*;
use serde::Deserialize;
use serde_json::json;
use sqlx::postgres::PgPool;

use crate::{
    bootstrap,
    common::{db::pool, time::now_iso},
    nlquery::schema_store::introspect_and_cache,
    security::encryption,
};

// --- The pack, as buildReportingPack emits it -------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedQuerySpec {
    pub key: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub sql: String,
}

#[derive(Debug, Deserialize)]
pub struct ColumnSpec {
    pub field: String,
    pub label: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportSpec {
    pub key: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub query_key: String,
    #[serde(default)]
    pub columns: Vec<ColumnSpec>,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
}

const fn default_page_size() -> i64 {
    50
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartSpec {
    pub key: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub query_key: String,
    pub chart_type: String,
    pub x_field: String,
    pub y_field: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardWidgetSpec {
    pub chart_key: Option<String>,
    pub report_key: Option<String>,
    #[serde(default)]
    pub title: String,
    pub x: i64,
    pub y: i64,
    pub w: i64,
    pub h: i64,
}

#[derive(Debug, Deserialize)]
pub struct DashboardSpec {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub widgets: Vec<DashboardWidgetSpec>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessRoleSpec {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub is_admin: bool,
    pub email: String,
    /// `bus_` tables this role may read. Empty means every table.
    #[serde(default)]
    pub tables: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct AccessSpec {
    #[serde(default)]
    pub roles: Vec<AccessRoleSpec>,
}

#[derive(Debug, Deserialize)]
pub struct ApplicationSpec {
    pub name: String,
    #[serde(default)]
    pub model: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSourceSpec {
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub client_type: String,
}

#[derive(Debug, Deserialize)]
pub struct ReportingPack {
    pub application: ApplicationSpec,
    #[serde(rename = "dataSource")]
    pub data_source: DataSourceSpec,
    #[serde(default)]
    pub queries: Vec<SavedQuerySpec>,
    #[serde(default)]
    pub reports: Vec<ReportSpec>,
    #[serde(default)]
    pub charts: Vec<ChartSpec>,
    #[serde(default)]
    pub dashboards: Vec<DashboardSpec>,
    /// Absent in a pack built before roles were derived; treated as none.
    pub access: Option<AccessSpec>,
}

// --- The task ----------------------------------------------------------------

pub struct SeedReportingPack;

#[async_trait]
impl Task for SeedReportingPack {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_reporting_pack".to_string(),
            detail:
                "Register a generated application's database as a data source and load its reporting pack \
                     (REPORTING_PACK=<pack.json> APP_DATABASE_URL=<url>)"
                    .to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        run(pool(ctx)).await.map_err(|e| {
            eprintln!("[seed] failed: {e}");
            Error::string(&e)
        })
    }
}

fn log(msg: &str) {
    println!("[seed] {msg}");
}

/// The format the script wrote into these tables' `VARCHAR` timestamps.
fn now() -> String {
    now_iso().replace('T', " ").chars().take(19).collect()
}

fn uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

async fn wait_for<F, Fut>(label: &str, seconds: u64, mut check: F) -> Result<(), String>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = bool>,
{
    let deadline = tokio::time::Instant::now() + Duration::from_secs(seconds);
    let mut reported = false;
    loop {
        if check().await {
            if reported {
                log(&format!("{label}: ready"));
            }
            return Ok(());
        }
        if tokio::time::Instant::now() >= deadline {
            return Err(format!("Timed out after {seconds}s waiting for {label}"));
        }
        if !reported {
            log(&format!("{label}: waiting…"));
            reported = true;
        }
        tokio::time::sleep(Duration::from_secs(2)).await;
    }
}

async fn connect(url: &str) -> Option<PgPool> {
    sqlx::postgres::PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(3))
        .connect(url)
        .await
        .ok()
}

/// The application's tables, not merely its database: it migrates itself on
/// start, so an empty database means "not migrated yet", and introspecting
/// then would cache a schema with no tables in it.
async fn app_schema_ready(url: &str) -> bool {
    let Some(p) = connect(url).await else {
        return false;
    };
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'bus\\_%'",
    )
    .fetch_one(&p)
    .await
    .unwrap_or(0);
    p.close().await;
    n > 0
}

/// Everything seeded is owned by the bootstrap administrator: rows with no
/// owner are invisible to every screen that filters by ownership.
///
/// By its fixed id first, and only then by age. "Oldest user" alone is wrong
/// on the second run: `created_at` is a `VARCHAR`, the bootstrap writes
/// `2026-09-26T07:50:00.000Z` and this seeder `2026-09-26 07:51:00`, and a
/// space sorts before `T` — so the first reporting account created here became
/// the "oldest", owned nothing, and every lookup by owner missed and inserted
/// the whole pack a second time.
async fn admin_user_id(db: &PgPool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT id FROM users ORDER BY (id = $1) DESC, created_at ASC LIMIT 1")
        .bind(bootstrap::ADMIN_ID)
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            "No users in the reporting database, and the bootstrap did not create one.".to_string()
        })
}

/// The connection config the platform stores for a `pg` data source.
///
/// # Errors
/// When `APP_DATABASE_URL` is not a URL — named, with the password masked,
/// because the parser's own message names neither.
pub fn connection_config(app_db_url: &str) -> Result<serde_json::Value, String> {
    let url = url::Url::parse(app_db_url).map_err(|_| {
        let masked = regex::Regex::new(r"://[^@]*@")
            .map(|re| re.replace(app_db_url, "://***@").to_string())
            .unwrap_or_default();
        format!(
            "APP_DATABASE_URL is not a URL the data source can be built from. \
             Expected postgresql://user:password@host:port/database, got {masked}"
        )
    })?;
    let decode = |s: &str| {
        percent_encoding::percent_decode_str(s)
            .decode_utf8_lossy()
            .to_string()
    };
    Ok(json!({
        "host": url.host_str().unwrap_or_default(),
        "port": url.port().unwrap_or(5432),
        "database": url.path().trim_start_matches('/'),
        "user": decode(url.username()),
        "password": decode(url.password().unwrap_or_default()),
        "ssl": false,
    }))
}

async fn find_id(db: &PgPool, sql: &str, a: &str, b: Option<&str>) -> Result<Option<String>, String> {
    let q = sqlx::query_scalar::<_, String>(sqlx::AssertSqlSafe(sql.to_string())).bind(a);
    let q = match b {
        Some(b) => q.bind(b.to_string()),
        None => q,
    };
    q.fetch_optional(db).await.map_err(|e| e.to_string())
}

async fn upsert_data_source(
    db: &PgPool,
    pack: &ReportingPack,
    app_db_url: &str,
    owner: &str,
) -> Result<String, String> {
    let config = connection_config(app_db_url)?;
    let encrypted = encryption::encrypt(&config.to_string()).map_err(|e| e.to_string())?;
    let stamp = now();
    let ds = &pack.data_source;
    if let Some(id) = find_id(db, "SELECT id FROM data_sources WHERE name = $1", &ds.name, None).await? {
        sqlx::query(
            "UPDATE data_sources SET description = $2, client_type = $3, connection_config = $4, is_active = TRUE, \
             updated_at = $5 WHERE id = $1",
        )
        .bind(&id)
        .bind(&ds.description)
        .bind(&ds.client_type)
        .bind(&encrypted)
        .bind(&stamp)
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;
        return Ok(id);
    }
    let id = uuid();
    sqlx::query(
        "INSERT INTO data_sources (id, name, description, client_type, connection_config, is_active, is_editable, \
            is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, FALSE, NULL, NULL, $6, $7, $7)",
    )
    .bind(&id)
    .bind(&ds.name)
    .bind(&ds.description)
    .bind(&ds.client_type)
    .bind(&encrypted)
    .bind(owner)
    .bind(&stamp)
    .execute(db)
    .await
    .map_err(|e| e.to_string())?;
    Ok(id)
}

async fn upsert_queries(
    db: &PgPool,
    pack: &ReportingPack,
    ds_id: &str,
    owner: &str,
) -> Result<HashMap<String, String>, String> {
    let mut ids = HashMap::new();
    let stamp = now();
    for q in &pack.queries {
        let existing = find_id(
            db,
            "SELECT id FROM saved_queries WHERE name = $1 AND created_by = $2",
            &q.name,
            Some(owner),
        )
        .await?;
        let id = if let Some(id) = existing {
            sqlx::query(
                "UPDATE saved_queries SET description = $2, data_source_id = $3, sql_content = $4, updated_at = $5 \
                 WHERE id = $1",
            )
            .bind(&id)
            .bind(&q.description)
            .bind(ds_id)
            .bind(&q.sql)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            let id = uuid();
            sqlx::query(
                "INSERT INTO saved_queries (id, name, description, data_source_id, sql_content, parameters_schema, \
                    is_validated, validation_result, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, NULL, FALSE, NULL, FALSE, NULL, NULL, $6, $7, $7)",
            )
            .bind(&id)
            .bind(&q.name)
            .bind(&q.description)
            .bind(ds_id)
            .bind(&q.sql)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };
        ids.insert(q.key.clone(), id);
    }
    Ok(ids)
}

async fn upsert_reports(
    db: &PgPool,
    pack: &ReportingPack,
    query_ids: &HashMap<String, String>,
    owner: &str,
) -> Result<HashMap<String, String>, String> {
    let mut ids = HashMap::new();
    let stamp = now();
    for r in &pack.reports {
        let Some(saved_query_id) = query_ids.get(&r.query_key) else {
            continue;
        };
        let columns = serde_json::to_string(
            &r.columns
                .iter()
                .map(|c| json!({ "field": c.field, "label": c.label }))
                .collect::<Vec<_>>(),
        )
        .unwrap_or_default();
        let pagination = json!({ "pageSize": r.page_size, "mode": "server" }).to_string();
        let exports = json!(["csv", "xlsx", "pdf"]).to_string();
        let existing = find_id(
            db,
            "SELECT id FROM report_definitions WHERE name = $1 AND created_by = $2",
            &r.name,
            Some(owner),
        )
        .await?;
        let id = if let Some(id) = existing {
            sqlx::query(
                "UPDATE report_definitions SET description = $2, saved_query_id = $3, column_config = $4, \
                 pagination_config = $5, export_formats = $6, updated_at = $7 WHERE id = $1",
            )
            .bind(&id)
            .bind(&r.description)
            .bind(saved_query_id)
            .bind(&columns)
            .bind(&pagination)
            .bind(&exports)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            let id = uuid();
            sqlx::query(
                "INSERT INTO report_definitions (id, name, description, saved_query_id, column_config, \
                    pagination_config, export_formats, filter_config, sort_config, filename_template, color_theme, \
                    is_public, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, NULL, FALSE, FALSE, NULL, NULL, $8, $9, $9)",
            )
            .bind(&id)
            .bind(&r.name)
            .bind(&r.description)
            .bind(saved_query_id)
            .bind(&columns)
            .bind(&pagination)
            .bind(&exports)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };
        ids.insert(r.key.clone(), id);
    }
    Ok(ids)
}

async fn upsert_charts(
    db: &PgPool,
    pack: &ReportingPack,
    query_ids: &HashMap<String, String>,
    owner: &str,
) -> Result<HashMap<String, String>, String> {
    let mut ids = HashMap::new();
    let stamp = now();
    for c in &pack.charts {
        let Some(saved_query_id) = query_ids.get(&c.query_key) else {
            continue;
        };
        let chart_config = json!({
            "title": { "text": c.name },
            "legend": { "show": true, "position": "bottom" },
            "tooltip": { "enabled": true },
        })
        .to_string();
        // The reader expects yAxis as a list: a chart may carry several series.
        let data_mapping = json!({
            "xAxis": { "field": c.x_field, "label": c.x_field },
            "yAxis": [{ "field": c.y_field, "label": c.y_field }],
        })
        .to_string();
        let existing = find_id(
            db,
            "SELECT id FROM chart_definitions WHERE name = $1 AND created_by = $2",
            &c.name,
            Some(owner),
        )
        .await?;
        let id = if let Some(id) = existing {
            sqlx::query(
                "UPDATE chart_definitions SET description = $2, saved_query_id = $3, chart_type = $4, \
                 chart_config = $5, data_mapping = $6, updated_at = $7 WHERE id = $1",
            )
            .bind(&id)
            .bind(&c.description)
            .bind(saved_query_id)
            .bind(&c.chart_type)
            .bind(&chart_config)
            .bind(&data_mapping)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            let id = uuid();
            sqlx::query(
                "INSERT INTO chart_definitions (id, name, description, saved_query_id, chart_type, chart_config, \
                    data_mapping, refresh_interval, color_theme, is_public, is_deleted, deleted_at, deleted_by, \
                    created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, FALSE, FALSE, NULL, NULL, $8, $9, $9)",
            )
            .bind(&id)
            .bind(&c.name)
            .bind(&c.description)
            .bind(saved_query_id)
            .bind(&c.chart_type)
            .bind(&chart_config)
            .bind(&data_mapping)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };
        ids.insert(c.key.clone(), id);
    }
    Ok(ids)
}

/// One widget placed on a dashboard: its id, and what it shows.
pub struct Placed<'a> {
    pub id: String,
    pub widget: &'a DashboardWidgetSpec,
    pub chart_id: Option<String>,
    pub report_id: Option<String>,
}

/// Widgets whose chart or report survived, each with the id both its row and
/// its layout entry carry.
///
/// react-grid-layout matches a layout entry to a tile by the tile's React key,
/// and the dashboard renders `key={widget.id}`; a layout keyed by anything else
/// matches no tile and the grid collapses every tile to one column by one row.
/// Widgets that did not survive are dropped *before* the layout is built, or
/// the layout leaves a gap where a tile was expected.
#[must_use]
pub fn place_widgets<'a>(
    d: &'a DashboardSpec,
    chart_ids: &HashMap<String, String>,
    report_ids: &HashMap<String, String>,
) -> Vec<Placed<'a>> {
    d.widgets
        .iter()
        .map(|w| Placed {
            id: uuid(),
            widget: w,
            chart_id: w.chart_key.as_ref().and_then(|k| chart_ids.get(k).cloned()),
            report_id: w.report_key.as_ref().and_then(|k| report_ids.get(k).cloned()),
        })
        .filter(|p| p.chart_id.is_some() || p.report_id.is_some())
        .collect()
}

#[must_use]
pub fn layout_of(placed: &[Placed<'_>]) -> serde_json::Value {
    json!({
        "cols": { "lg": 12, "md": 10, "sm": 6, "xs": 4 },
        "rowHeight": 100,
        "layouts": {
            "lg": placed.iter().map(|p| json!({
                "i": p.id, "x": p.widget.x, "y": p.widget.y, "w": p.widget.w, "h": p.widget.h,
            })).collect::<Vec<_>>(),
        },
    })
}

async fn upsert_dashboards(
    db: &PgPool,
    pack: &ReportingPack,
    chart_ids: &HashMap<String, String>,
    report_ids: &HashMap<String, String>,
    owner: &str,
) -> Result<usize, String> {
    let stamp = now();
    let mut widgets = 0;
    for d in &pack.dashboards {
        let placed = place_widgets(d, chart_ids, report_ids);
        let layout = layout_of(&placed).to_string();
        let existing = find_id(
            db,
            "SELECT id FROM dashboard_layouts WHERE name = $1 AND created_by = $2",
            &d.name,
            Some(owner),
        )
        .await?;
        let dashboard_id = if let Some(id) = existing {
            sqlx::query(
                "UPDATE dashboard_layouts SET description = $2, layout_config = $3, updated_at = $4 WHERE id = $1",
            )
            .bind(&id)
            .bind(&d.description)
            .bind(&layout)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            // Replaced rather than merged: positions are derived together, so a
            // half-updated set is a broken layout.
            sqlx::query("DELETE FROM dashboard_widgets WHERE dashboard_id = $1")
                .bind(&id)
                .execute(db)
                .await
                .map_err(|e| e.to_string())?;
            id
        } else {
            let id = uuid();
            sqlx::query(
                "INSERT INTO dashboard_layouts (id, name, description, layout_config, theme_config, refresh_config, \
                    is_public, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, NULL, NULL, FALSE, FALSE, NULL, NULL, $5, $6, $6)",
            )
            .bind(&id)
            .bind(&d.name)
            .bind(&d.description)
            .bind(&layout)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };
        for p in &placed {
            let w = p.widget;
            sqlx::query(
                "INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, report_id, chart_id, position_config, \
                    widget_config, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)",
            )
            .bind(&p.id)
            .bind(&dashboard_id)
            .bind(if p.chart_id.is_some() { "chart" } else { "report" })
            .bind(&p.report_id)
            .bind(&p.chart_id)
            // The same id the layout entry carries.
            .bind(json!({ "i": p.id, "x": w.x, "y": w.y, "w": w.w, "h": w.h }).to_string())
            .bind(json!({ "title": w.title }).to_string())
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            widgets += 1;
        }
    }
    Ok(widgets)
}

/// A reporting account, platform role and data-source role per model role.
///
/// *Not* the application's accounts: separate user tables, separate sign-ins,
/// and a role means something different on each side. The addresses differ on
/// purpose (`…@<app>.reports.example.com`) so nobody tries one password on both.
async fn upsert_access(db: &PgPool, pack: &ReportingPack, ds_id: &str, owner: &str) -> Result<usize, String> {
    let roles = pack
        .access
        .as_ref()
        .map(|a| a.roles.as_slice())
        .unwrap_or_default();
    if roles.is_empty() {
        return Ok(0);
    }
    let stamp = now();
    // The password every seeded account shares, and the one the application's
    // own seeded accounts use. bcrypt, as the platform's sign-in verifies.
    let password_hash = tokio::task::spawn_blocking(|| bcrypt::hash("admin", 10))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())?;
    let mut seeded = 0;

    for role in roles {
        // ── The platform account ──
        let user_id = if let Some(id) =
            find_id(db, "SELECT id FROM users WHERE email = $1", &role.email, None).await?
        {
            id
        } else {
            let id = uuid().replace('-', "");
            sqlx::query(
                "INSERT INTO users (id, email, password_hash, display_name, avatar_url, is_active, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, NULL, TRUE, $5, $5)",
            )
            .bind(&id)
            .bind(&role.email)
            .bind(&password_hash)
            .bind(&role.name)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            // Better Auth reads the credential from `auth_accounts`, never from
            // `users.password_hash`: without this row a correct password fails.
            sqlx::query(
                "INSERT INTO auth_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) \
                 VALUES (LEFT('cred_' || $1, 255), $1, $1, 'credential', $2, NOW(), NOW()) ON CONFLICT (id) DO NOTHING",
            )
            .bind(&id)
            .bind(&password_hash)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };

        // ── The platform role ── (an administrator keeps what bootstrap gave it)
        if !role.is_admin {
            let permissions =
                json!(["nl_query:*", "report:view", "chart:view", "dashboard:view"]).to_string();
            let role_id = if let Some(id) =
                find_id(db, "SELECT id FROM roles WHERE name = $1", &role.name, None).await?
            {
                sqlx::query("UPDATE roles SET description = $2, permissions = $3 WHERE id = $1")
                    .bind(&id)
                    .bind(&role.description)
                    .bind(&permissions)
                    .execute(db)
                    .await
                    .map_err(|e| e.to_string())?;
                id
            } else {
                let id = uuid().replace('-', "");
                sqlx::query(
                    "INSERT INTO roles (id, name, description, permissions, created_at) VALUES ($1, $2, $3, $4, $5)",
                )
                .bind(&id)
                .bind(&role.name)
                .bind(&role.description)
                .bind(&permissions)
                .bind(&stamp)
                .execute(db)
                .await
                .map_err(|e| e.to_string())?;
                id
            };
            sqlx::query("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
                .bind(&user_id)
                .bind(&role_id)
                .bind(&stamp)
                .execute(db)
                .await
                .map_err(|e| e.to_string())?;
        }

        // ── The data-source role ──
        let ds_role_id = if let Some(id) = find_id(
            db,
            "SELECT id FROM ds_roles WHERE data_source_id = $2 AND name = $1",
            &role.name,
            Some(ds_id),
        )
        .await?
        {
            sqlx::query(
                "UPDATE ds_roles SET description = $2, is_active = TRUE, updated_at = $3 WHERE id = $1",
            )
            .bind(&id)
            .bind(&role.description)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            let id = uuid();
            sqlx::query(
                "INSERT INTO ds_roles (id, data_source_id, name, description, is_active, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, TRUE, $5, $6, $6)",
            )
            .bind(&id)
            .bind(ds_id)
            .bind(&role.name)
            .bind(&role.description)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
            id
        };
        sqlx::query(
            "INSERT INTO ds_user_roles (data_source_id, user_id, ds_role_id, assigned_at) VALUES ($1, $2, $3, $4) \
             ON CONFLICT DO NOTHING",
        )
        .bind(ds_id)
        .bind(&user_id)
        .bind(&ds_role_id)
        .bind(&stamp)
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

        // ── What the role may read ── replaced rather than merged: the model is
        // the source of truth, so a permission removed there disappears here.
        sqlx::query("DELETE FROM ds_entity_permissions WHERE data_source_id = $1 AND ds_role_id = $2")
            .bind(ds_id)
            .bind(&ds_role_id)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
        // An empty list means the whole schema — what an administrator gets.
        for table in &role.tables {
            sqlx::query(
                "INSERT INTO ds_entity_permissions (id, data_source_id, ds_role_id, entity_name, entity_type, \
                    entity_schema, permission_level, column_restrictions, row_filter, created_by, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, 'table', 'public', 'select', NULL, NULL, $5, $6, $6)",
            )
            .bind(uuid())
            .bind(ds_id)
            .bind(&ds_role_id)
            .bind(table)
            .bind(owner)
            .bind(&stamp)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
        }
        seeded += 1;
    }
    Ok(seeded)
}

/// The whole seed, against the config database `db`.
///
/// # Errors
/// A readable message naming what is missing or what failed.
pub async fn run(db: &PgPool) -> Result<(), String> {
    let pack_path =
        std::env::var("REPORTING_PACK").unwrap_or_else(|_| "/pack/reporting-pack.json".to_string());
    let app_db_url = std::env::var("APP_DATABASE_URL").unwrap_or_default();
    let Ok(text) = std::fs::read_to_string(&pack_path) else {
        return Err(format!("No reporting pack at {pack_path}. Nothing to load."));
    };
    if app_db_url.is_empty() {
        return Err("APP_DATABASE_URL is unset — the data source has nowhere to point.".to_string());
    }
    let pack: ReportingPack = serde_json::from_str(&text).map_err(|e| format!("{pack_path}: {e}"))?;
    log(&format!(
        "pack: {} ({})",
        pack.application.name, pack.application.model
    ));

    wait_for("application database", 180, || async {
        connect(&app_db_url).await.is_some()
    })
    .await?;
    wait_for("application schema (bus_ tables)", 600, || {
        app_schema_ready(&app_db_url)
    })
    .await?;

    // The same schema and seed the server applies at boot, so a seeder that
    // starts before the server has tables to write and an administrator to own
    // what it writes.
    bootstrap::baseline(db).await?;
    bootstrap::seed(db).await?;
    let owner = admin_user_id(db).await?;

    let ds_id = upsert_data_source(db, &pack, &app_db_url, &owner).await?;
    log(&format!("data source: {}", pack.data_source.name));

    let app = connect(&app_db_url)
        .await
        .ok_or_else(|| "application database went away".to_string())?;
    let schema = introspect_and_cache(db, &ds_id, &app)
        .await
        .map_err(|e| e.to_string());
    app.close().await;
    let schema = schema?;
    let tables = schema
        .schema_info
        .get("tables")
        .and_then(serde_json::Value::as_array)
        .map_or(0, Vec::len);
    log(&format!("schema cached: {tables} tables"));
    let query_ids = upsert_queries(db, &pack, &ds_id, &owner).await?;
    log(&format!("saved queries: {}", query_ids.len()));
    let report_ids = upsert_reports(db, &pack, &query_ids, &owner).await?;
    log(&format!("reports: {}", report_ids.len()));
    let chart_ids = upsert_charts(db, &pack, &query_ids, &owner).await?;
    log(&format!("charts: {}", chart_ids.len()));
    let widgets = upsert_dashboards(db, &pack, &chart_ids, &report_ids, &owner).await?;
    log(&format!(
        "dashboards: {} ({widgets} widgets)",
        pack.dashboards.len()
    ));
    let accounts = upsert_access(db, &pack, &ds_id, &owner).await?;
    log(&format!("reporting roles: {accounts}"));
    log("done");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connection_config_decodes_credentials() {
        let c = connection_config("postgres://app%40x:p%2Fw@postgres:5433/crm").unwrap();
        assert_eq!(c["host"], "postgres");
        assert_eq!(c["port"], 5433);
        assert_eq!(c["database"], "crm");
        assert_eq!(c["user"], "app@x");
        assert_eq!(c["password"], "p/w");
        assert_eq!(c["ssl"], false);
    }

    #[test]
    fn a_bad_url_is_named_with_the_password_masked() {
        let e = connection_config("not a url").unwrap_err();
        assert!(e.contains("APP_DATABASE_URL"), "{e}");
    }

    #[test]
    fn the_layout_and_the_widgets_share_ids_and_drop_orphans() {
        let d: DashboardSpec = serde_json::from_value(json!({
            "name": "Overview",
            "widgets": [
                { "chartKey": "c1", "title": "A", "x": 0, "y": 0, "w": 6, "h": 3 },
                { "reportKey": "gone", "title": "B", "x": 6, "y": 0, "w": 6, "h": 3 },
                { "reportKey": "r1", "title": "C", "x": 0, "y": 3, "w": 12, "h": 4 }
            ]
        }))
        .unwrap();
        let charts = HashMap::from([("c1".to_string(), "chart-id".to_string())]);
        let reports = HashMap::from([("r1".to_string(), "report-id".to_string())]);
        let placed = place_widgets(&d, &charts, &reports);
        assert_eq!(placed.len(), 2);
        let layout = layout_of(&placed);
        let ids: Vec<_> = layout["layouts"]["lg"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| e["i"].as_str().unwrap().to_string())
            .collect();
        assert_eq!(ids, placed.iter().map(|p| p.id.clone()).collect::<Vec<_>>());
    }

    #[test]
    fn a_pack_without_access_parses() {
        let pack: ReportingPack = serde_json::from_value(json!({
            "application": { "name": "crm", "description": "", "model": "crm.eml.yaml", "databaseName": "crm" },
            "dataSource": { "name": "crm (application database)", "description": "", "clientType": "pg" },
            "queries": [], "reports": [], "charts": [], "dashboards": []
        }))
        .unwrap();
        assert!(pack.access.is_none());
    }
}
