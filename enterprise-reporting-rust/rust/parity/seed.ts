/**
 * Seed a config database with a fixed, deterministic fixture for the parity
 * suite (MIGRATION_PLAN.md §8), plus a small "user" database for the
 * data-source paths.
 *
 *   DATABASE_URL=postgresql://…/enterprise_config \
 *   PARITY_SOURCE_URL=postgresql://…/parity_source \
 *   ENCRYPTION_KEY=… bun rust/parity/seed.ts
 *
 * Run it against a database the Node service has bootstrapped (start Node
 * once) — the schema is bootstrap.ts's. Idempotent: rows are keyed by fixed ids.
 */
import bcrypt from "bcryptjs";
import { Client } from "pg";

const configUrl =
  process.env.DATABASE_URL ?? "postgresql://enterprise:password@localhost:5432/enterprise_config";
const sourceUrl =
  process.env.PARITY_SOURCE_URL ?? "postgresql://enterprise:password@localhost:5432/parity_source";
const { encrypt } = await import("../../src/lib/security/encryption");

// ── the user database a data source points at ──────────────────────────────
const source = new Client({ connectionString: sourceUrl });
await source.connect();
await source.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY, customer TEXT, amount NUMERIC(12,2), qty BIGINT,
    placed_at TIMESTAMPTZ, shipped DATE, paid BOOLEAN, meta JSONB);
  CREATE TABLE IF NOT EXISTS hr_salaries (id INT PRIMARY KEY, name TEXT, salary NUMERIC(12,2));
  TRUNCATE orders, hr_salaries;
`);
for (let i = 1; i <= 75; i++) {
  await source.query(
    "INSERT INTO orders VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      i,
      i % 7 === 0 ? `Customer, "${i}"` : `Customer ${i}`,
      (i * 13.37).toFixed(2),
      String(i * 1000000000),
      new Date(Date.UTC(2026, 0, 1, 12, i % 60, 0, 123)).toISOString(),
      `2026-02-${String((i % 28) + 1).padStart(2, "0")}`,
      i % 2 === 0,
      JSON.stringify({ tags: ["a", i], nested: { ok: true } }),
    ]
  );
}
await source.query("INSERT INTO hr_salaries VALUES (1,'Ada',100000.50),(2,'Bob',90000)");
await source.end();

// ── config database rows ───────────────────────────────────────────────────
const db = new Client({ connectionString: configUrl });
await db.connect();
const now = "2026-09-23T10:00:00.000Z";
const u = new URL(sourceUrl);
const dsConfig = encrypt(
  JSON.stringify({
    host: u.hostname,
    port: Number(u.port || 5432),
    database: u.pathname.slice(1),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: false,
  })
);

await db.query(
  `INSERT INTO data_sources (id, name, description, client_type, connection_config, is_active, is_inspected, created_by, created_at, updated_at)
   VALUES ('parity-ds', 'Parity Source', 'fixture', 'pg', $1, true, true, '1aa00cc2af0225000c5c114df3eebb69', $2, $2)
   ON CONFLICT (id) DO UPDATE SET connection_config = EXCLUDED.connection_config`,
  [dsConfig, now]
);

// An analyst who may read `orders` but not `hr_salaries`.
const analystHash = await bcrypt.hash("parity-analyst-pw", 10);
await db.query(
  `INSERT INTO users (id, email, password_hash, display_name, is_active, email_verified, created_at, updated_at)
   VALUES ('parity-analyst', 'analyst@parity.test', $1, 'Parity Analyst', true, true, $2, $2)
   ON CONFLICT (id) DO NOTHING`,
  [analystHash, now]
);
await db.query(
  `INSERT INTO auth_accounts (id, user_id, account_id, provider_id, password)
   VALUES ('parity-analyst-cred', 'parity-analyst', 'parity-analyst', 'credential', $1)
   ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password`,
  [analystHash]
);
await db.query(
  `INSERT INTO roles (id, name, description, permissions, created_at)
   VALUES ('parity-analyst-role', 'Analyst', 'parity', '["report:view","query:view","chart:view"]', $1)
   ON CONFLICT (id) DO NOTHING`,
  [now]
);
await db.query(
  `INSERT INTO user_roles (user_id, role_id) VALUES ('parity-analyst', 'parity-analyst-role') ON CONFLICT DO NOTHING`
);
await db.query(
  `INSERT INTO ds_roles (id, data_source_id, name, is_active, created_at, updated_at)
   VALUES ('parity-dsrole', 'parity-ds', 'Orders reader', true, $1, $1) ON CONFLICT (id) DO NOTHING`,
  [now]
);
await db.query(
  `INSERT INTO ds_user_roles (data_source_id, user_id, ds_role_id) VALUES ('parity-ds', 'parity-analyst', 'parity-dsrole') ON CONFLICT DO NOTHING`
);
await db.query(
  `INSERT INTO ds_entity_permissions (id, data_source_id, ds_role_id, entity_name, entity_type, permission_level, created_at, updated_at)
   VALUES ('parity-perm-orders', 'parity-ds', 'parity-dsrole', 'orders', 'table', 'select', $1, $1) ON CONFLICT (id) DO NOTHING`,
  [now]
);

const queries: [string, string, string][] = [
  ["parity-q-orders", "Orders", "SELECT * FROM orders ORDER BY id"],
  ["parity-q-limited", "Top orders", "SELECT id, amount FROM orders ORDER BY amount DESC LIMIT 5"],
  ["parity-q-salaries", "Salaries", "SELECT * FROM hr_salaries"],
  ["parity-q-nospace", "Salaries sneaky", "SELECT * FROM(hr_salaries)"],
  ["parity-q-write", "Bad write", "DELETE FROM orders"],
  ["parity-q-total", "Order total", "SELECT SUM(amount) AS total, COUNT(*) AS n FROM orders"],
  // Review finding D-10: a CTE named after the table it hides.
  ["parity-q-cte-shadow", "CTE shadow", "WITH hr_salaries AS (SELECT * FROM hr_salaries) SELECT * FROM hr_salaries, orders LIMIT 1"],
  // Review finding D-10: a data-modifying CTE behind a leading WITH.
  ["parity-q-cte-write", "CTE write", "WITH d AS (DELETE FROM orders WHERE id < 0 RETURNING *) SELECT * FROM d"],
];
for (let i = 0; i < 30; i++) queries.push([`parity-q-filler-${i}`, `Filler query ${i}`, "SELECT 1"]);
for (const [idx, [id, name, sql]] of queries.entries()) {
  const t = new Date(Date.parse(now) - idx * 60000).toISOString();
  await db.query(
    `INSERT INTO saved_queries (id, name, description, data_source_id, sql_content, is_validated, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, 'parity-ds', $4, false, '1aa00cc2af0225000c5c114df3eebb69', $5, $5)
     ON CONFLICT (id) DO UPDATE SET sql_content = EXCLUDED.sql_content`,
    [id, name, `desc for ${name}`, sql, t]
  );
}

const reports: [string, string | null][] = [
  ["parity-r-orders", "parity-q-orders"],
  ["parity-r-limited", "parity-q-limited"],
  ["parity-r-salaries", "parity-q-salaries"],
  ["parity-r-nospace", "parity-q-nospace"],
  ["parity-r-empty", null],
  ["parity-r-total", "parity-q-total"],
];
for (const [idx, [id, q]] of reports.entries()) {
  const t = new Date(Date.parse(now) - idx * 60000).toISOString();
  await db.query(
    `INSERT INTO report_definitions (id, name, saved_query_id, column_config, created_by, created_at, updated_at)
     VALUES ($1, $1, $2, '[]', '1aa00cc2af0225000c5c114df3eebb69', $3, $3) ON CONFLICT (id) DO NOTHING`,
    [id, q, t]
  );
}
for (let i = 0; i < 25; i++) {
  const t = new Date(Date.parse(now) - i * 60000).toISOString();
  await db.query(
    `INSERT INTO chart_definitions (id, name, saved_query_id, chart_type, chart_config, data_mapping, refresh_interval, created_by, created_at, updated_at)
     VALUES ($1, $2, 'parity-q-orders', 'bar', '{}', '{"xAxis":{"field":"id"},"yAxis":[{"field":"amount","label":"Amount"}]}', $3, '1aa00cc2af0225000c5c114df3eebb69', $4, $4)
     ON CONFLICT (id) DO UPDATE SET data_mapping = EXCLUDED.data_mapping`,
    [`parity-c-${i}`, `Chart ${i}`, i % 3 === 0 ? null : i * 10, t]
  );
  await db.query(
    `INSERT INTO dashboard_layouts (id, name, layout_config, is_public, created_by, created_at, updated_at)
     VALUES ($1, $2, '{"cols":12}', $3, '1aa00cc2af0225000c5c114df3eebb69', $4, $4) ON CONFLICT (id) DO NOTHING`,
    [`parity-d-${i}`, `Dashboard ${i}`, i % 2 === 0, t]
  );
  await db.query(
    `INSERT INTO job_definitions (id, name, job_type, target_id, schedule_cron, is_deleted, created_by, created_at, updated_at)
     VALUES ($1, $2, 'report', 'parity-r-orders', '0 9 * * *', $3, '1aa00cc2af0225000c5c114df3eebb69', $4, $4) ON CONFLICT (id) DO NOTHING`,
    [`parity-j-${i}`, `Job ${i}`, i % 5 === 0, t]
  );
}

// [id, cron, paused, upper bound, report, metric column, operator, threshold, owner]
const admin = "1aa00cc2af0225000c5c114df3eebb69";
const rules: [string, string, boolean, string | null, string, string, string, number, string][] = [
  ["parity-m-active", "*/5 * * * *", false, "150.5000", "parity-r-total", "total", "gt", 100, admin],
  ["parity-m-paused", "0 9 * * 1-5", true, null, "parity-r-total", "total", "gt", 100, admin],
  ["parity-m-tz", "0 9 * * *", false, "12.0000", "parity-r-total", "total", "gt", 100, admin],
  ["parity-m-pass", "0 * * * *", false, null, "parity-r-total", "TOTAL", "lt", 1e9, admin],
  ["parity-m-breach", "0 * * * *", false, null, "parity-r-total", "n", "gt", 70, admin],
  ["parity-m-between", "0 * * * *", false, "80.0000", "parity-r-total", "n", "between", 10, admin],
  ["parity-m-nocol", "0 * * * *", false, null, "parity-r-total", "nope", "gt", 1, admin],
  ["parity-m-noquery", "0 * * * *", false, null, "parity-r-empty", "total", "gt", 1, admin],
  ["parity-m-drift", "0 * * * *", false, null, "parity-r-total", "total", "gt", 1, "parity-analyst"],
];
for (const [idx, [id, cron, paused, upper, report, metric, op, threshold, owner]] of rules.entries()) {
  await db.query(
    `INSERT INTO monitoring_rules (id, name, report_definition_id, data_source_id, created_by, metric_column,
       threshold_operator, threshold_value, threshold_upper_bound, cron_expression, timezone, alert_channels,
       alert_recipients, rbac_snapshot, is_active, is_paused, created_at, updated_at)
     VALUES ($1, $1, $7, 'parity-ds', $10, $8, $9, $11, $2, $3, $4,
       '["in_app"]', '[{"type":"user","id":"1aa00cc2af0225000c5c114df3eebb69"},{"type":"role","id":"parity-analyst-role"}]',
       '{"roles":[]}', true, $5,
       TIMESTAMP '2026-09-23 10:00:00' - ($6 || ' minutes')::interval, TIMESTAMP '2026-09-23 10:00:00')
     ON CONFLICT (id) DO UPDATE SET report_definition_id = EXCLUDED.report_definition_id,
       metric_column = EXCLUDED.metric_column, threshold_operator = EXCLUDED.threshold_operator,
       threshold_value = EXCLUDED.threshold_value, threshold_upper_bound = EXCLUDED.threshold_upper_bound,
       created_by = EXCLUDED.created_by`,
    [id, upper, cron, idx === 2 ? "America/New_York" : "UTC", paused, String(idx), report, metric, op, owner, threshold]
  );
}

// ── Phase 2 fixtures: widgets, filters, logs, notifications ─────────────────
await db.query(
  `INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, report_id, chart_id, position_config, widget_config, created_at, updated_at)
   VALUES ('parity-w-1', 'parity-d-0', 'report', 'parity-r-orders', null, '{"x":0,"y":0,"w":6,"h":4}', '{"title":"Orders"}', $1, $1)
   ON CONFLICT (id) DO NOTHING`,
  [now]
);
await db.query(
  `INSERT INTO filter_definitions (id, name, description, data_source_id, filter_query, display_field, value_field, field_type, created_at, updated_at)
   VALUES ('parity-f-1', 'Customer', 'by customer', 'parity-ds', 'SELECT DISTINCT customer FROM orders', 'customer', 'customer', 'text', $1, $1),
          ('parity-f-2', 'Paid', null, 'parity-ds', 'SELECT DISTINCT paid FROM orders', 'paid', 'paid', 'boolean', $1, $1)
   ON CONFLICT (id) DO NOTHING`,
  [now]
);
await db.query(
  `INSERT INTO report_filters (id, report_id, filter_id, target_column, filter_order, created_at)
   VALUES ('parity-rf-1', 'parity-r-orders', 'parity-f-1', 'customer', 0, $1),
          ('parity-rf-2', 'parity-r-orders', 'parity-f-2', 'paid', 1, $1)
   ON CONFLICT (id) DO NOTHING`,
  [now]
);
// The demo dashboard lays its widget out the way the grid reads it.
await db.query(
  `UPDATE dashboard_layouts SET layout_config = '{"layouts":{"lg":[{"i":"parity-w-1","x":0,"y":0,"w":12,"h":9,"minW":2,"minH":2}]}}' WHERE id = 'parity-d-0'`
);
for (let i = 0; i < 6; i++) {
  const t = new Date(Date.parse(now) - i * 90_000).toISOString();
  await db.query(
    `INSERT INTO logs (id, timestamp, level, message, component, user_id, metadata)
     VALUES ($1, $2, $3, $4, 'parity-comp', '1aa00cc2af0225000c5c114df3eebb69', $5) ON CONFLICT (id) DO NOTHING`,
    [`parity-log-${i}`, t, i % 3 === 0 ? "error" : "info", `parity message ${i}`, i % 2 ? '{"k":1}' : null]
  );
  await db.query(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, created_at)
     VALUES ($1, '1aa00cc2af0225000c5c114df3eebb69', 'view', 'parity-comp', $2, '{"x":true}', $3) ON CONFLICT (id) DO NOTHING`,
    [`parity-audit-${i}`, i % 2 ? `resource-${i}-abcdefghij` : null, new Date(Date.parse(t) - 45_000).toISOString()]
  );
}
for (let i = 0; i < 4; i++) {
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, message, metadata, is_read, created_at, updated_at)
     VALUES ($1, 'parity-analyst', 'info', $2, 'hello', null, $3, TIMESTAMP '2026-09-23 10:00:00' - ($4 || ' minutes')::interval, TIMESTAMP '2026-09-23 10:00:00')
     ON CONFLICT (id) DO NOTHING`,
    [`parity-n-${i}`, `Notification ${i}`, i === 3, String(i)]
  );
}

await db.end();
console.log("parity fixture seeded");
