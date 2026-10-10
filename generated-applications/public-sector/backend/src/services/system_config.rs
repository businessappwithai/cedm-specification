//! Configuration an operator can change without a redeploy.
//!
//! The app has two configuration layers and this resolves between them:
//!
//! 1. a `sys_system` row — active, and with a non-empty value;
//! 2. Loco's own `settings` block in `config/*.yaml`, which is resolved from
//!    the environment at boot;
//! 3. the compiled default the call site passes.
//!
//! The first layer is the new one. The second is where a deployment states
//! what it wants and is the right place for it; the problem it cannot solve is
//! changing a value while the app runs, which in a container means a redeploy
//! to edit a URL. A row here overrides the deployment, an empty or inactive row
//! falls through to it, and a key with no row at all behaves exactly as it did
//! before this table existed.
//!
//! **The key is the settings block's own name.** `ai_base_url` is one setting
//! with two places to write it, not two settings — a translation table between
//! a `SCREAMING_CASE` row and a `snake_case` setting would be one more thing to
//! keep in step, and an operator reading `config/development.yaml` beside the
//! admin screen would see two different words for the same knob.
//!
//! Values needed *before* the database answers — the connection string, the
//! listen address, the environment name — deliberately have no row and are read
//! from configuration only. A setting that has to be read to open the
//! connection cannot live behind the connection.
//!
//! Generated: 2026-10-09T15:30:07.539Z
//! Project: public-sector

use std::sync::Arc;
use std::time::Duration;

use moka::future::Cache;
use serde_json::Value;
use sqlx::PgPool;

/// The whole table, as one cached snapshot.
///
/// One entry rather than one per key: the table is a handful of rows, every
/// request that reads a setting reads it on a path that must not touch the
/// database, and a per-key cache would issue a query per miss on startup for no
/// saving. `invalidate` after a write to `/api/sys/system` is what refreshes it.
const SNAPSHOT_KEY: &str = "sys_system";

#[derive(Clone, Debug)]
struct Setting {
    value: String,
    is_active: bool,
}

#[derive(Clone)]
pub struct SystemConfig {
    pool: PgPool,
    settings: Cache<&'static str, Arc<std::collections::HashMap<String, Setting>>>,
}

impl SystemConfig {
    #[must_use]
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            settings: Cache::builder()
                .max_capacity(1)
                // A ceiling, not the invalidation mechanism — a dictionary write
                // to `sys_system` invalidates explicitly. This only bounds
                // staleness if some future write path forgets to, and bounds it
                // at a minute because a setting is changed to take effect now.
                .time_to_live(Duration::from_secs(60))
                .build(),
        }
    }

    /// Resolve a key: row, then settings block, then the caller's default.
    ///
    /// Never fails. A database that cannot be read leaves the settings block
    /// and the default, which is the behaviour the app had before the table —
    /// refusing to serve a request because the *optional* configuration layer
    /// is unreachable would be a strict downgrade.
    pub async fn get(&self, settings_block: Option<&Value>, key: &str, default: &str) -> String {
        if let Some(value) = self.row(key).await {
            return value;
        }
        if let Some(value) = settings_block
            .and_then(|block| block.get(key))
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
        {
            return value.to_string();
        }
        default.to_string()
    }

    /// The same resolution, reporting "not configured" rather than substituting.
    ///
    /// Separate from `get` because an empty string is a real answer for some
    /// settings and "switch the feature off" for others: the AI add-on is
    /// unconfigured when its URL is empty, and answering 503 is different from
    /// answering with an empty base URL.
    pub async fn get_optional(&self, settings_block: Option<&Value>, key: &str) -> Option<String> {
        if let Some(value) = self.row(key).await {
            return Some(value);
        }
        settings_block
            .and_then(|block| block.get(key))
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
    }

    /// Drop the snapshot. Called after any write to `/api/sys/system`.
    pub async fn invalidate(&self) {
        self.settings.invalidate(SNAPSHOT_KEY).await;
    }

    /// The active, non-empty row for a key, if there is one.
    async fn row(&self, key: &str) -> Option<String> {
        let snapshot = self.snapshot().await?;
        snapshot
            .get(key)
            .filter(|setting| setting.is_active && !setting.value.is_empty())
            .map(|setting| setting.value.clone())
    }

    async fn snapshot(&self) -> Option<Arc<std::collections::HashMap<String, Setting>>> {
        if let Some(hit) = self.settings.get(SNAPSHOT_KEY).await {
            return Some(hit);
        }

        let rows: Vec<(String, Option<String>, bool)> =
            sqlx::query_as("SELECT config_key, config_value, is_active FROM sys_system")
                .fetch_all(&self.pool)
                .await
                .map_err(|err| {
                    // Not an error the caller can act on: the resolver falls through to
                    // the settings block. Recorded because a table that has stopped
                    // answering explains an operator's change not taking effect, and
                    // nothing else in the request would mention it.
                    crate::log_event!(dictionary_config_unreadable, error = %err);
                })
                .ok()?;

        let map = rows
            .into_iter()
            .map(|(key, value, is_active)| {
                (
                    key,
                    Setting {
                        value: value.unwrap_or_default(),
                        is_active,
                    },
                )
            })
            .collect::<std::collections::HashMap<_, _>>();

        let snapshot = Arc::new(map);
        self.settings
            .insert(SNAPSHOT_KEY, Arc::clone(&snapshot))
            .await;
        Some(snapshot)
    }
}
