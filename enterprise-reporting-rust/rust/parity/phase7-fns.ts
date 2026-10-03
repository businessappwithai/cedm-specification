/**
 * The Rust-only twins of Phase 7: the NL builder's server functions
 * (`admin-builder.ts`), the public share-page loaders and the dashboard
 * stats. Node serves these as server functions, which only Node can call, so
 * each step asserts what the Node function returns or writes.
 *
 * The NL builder's prompt is checked exactly: the context Rust sends to
 * Mastra must equal what Node's own `buildMastraContextPrompt` and
 * `getGraphContext` / `formatGraphContext` produce for the same schema —
 * imported and run here, against the same databases.
 *
 *   DATABASE_URL=… GRAPH_DATABASE_URL=… bun rust/parity/phase7-fns.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const STUB = process.env.STUB_URL ?? "http://localhost:4199";
const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const cookies = JSON.parse(readFileSync(join(import.meta.dir, ".session-cache.json"), "utf8")) as Record<string, string>;
if (!existsSync(join(import.meta.dir, ".session-cache.json"))) process.exit(2);
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  ${JSON.stringify(detail).slice(0, 600)}`}`);
}
async function api(method: string, path: string, as: string | null, body?: unknown) {
  const headers: Record<string, string> = {};
  if (as) headers.cookie = cookies[as] ?? "";
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${RUST_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: json as Record<string, unknown> };
}
const errorOf = (b: unknown) => (b as { error?: { message?: string } })?.error?.message;

async function cleanup() {
  await db.query("DELETE FROM nl_query_context WHERE id LIKE 'p7f-%'");
  await db.query("DELETE FROM nl_query_role_stats WHERE id LIKE 'p7f-%'");
  await db.query("DELETE FROM report_definitions WHERE name LIKE 'p7f %'");
  await db.query("DELETE FROM chart_definitions WHERE name LIKE 'p7f %'");
  await db.query("DELETE FROM saved_queries WHERE name LIKE 'p7f %'");
}
await cleanup();

// Context the prompt builder reads: a past successful query and role stats.
await db.query(
  `INSERT INTO nl_query_context (id, data_source_id, user_id, role_name, nl_question, generated_sql, schema_context, rbac_context, execution_time_ms, row_count, was_successful, created_at)
   VALUES ('p7f-ctx-1', 'parity-ds', $1, 'admin', 'orders per customer', 'SELECT customer, count(*) FROM orders GROUP BY customer', '{}', '{}', 12, 7, true, '2026-09-23T10:00:00.000Z')`,
  [ADMIN]
);
await db.query(
  `INSERT INTO nl_query_role_stats (id, role_name, data_source_id, total_queries, successful_queries, failed_queries, success_rate, avg_execution_time_ms, common_query_types, common_tables, updated_at)
   VALUES ('p7f-stats', 'admin', 'parity-ds', 4, 3, 1, 0.755, 12, '["AGGREGATE"]', '["orders"]', 'x')`
);

// ── nlBuildPreview ──────────────────────────────────────────────────────────
{
  await fetch(`${STUB}/__reset`, { method: "POST" });
  const r = await api("POST", "/api/nl-builder/preview", "admin", {
    nlDescription: "list every order with its customer and amount",
    dataSourceId: "parity-ds",
  });
  const b = r.body as { success?: boolean; sql?: string; confidence?: number; columns?: string[]; rows?: unknown[] };
  check(
    "preview: SQL from Mastra, 20 rows at most, read back",
    r.status === 200 &&
      b.success === true &&
      b.sql === "SELECT id, customer, amount FROM orders ORDER BY id" &&
      b.confidence === 0.88 &&
      JSON.stringify(b.columns) === '["id","customer","amount"]' &&
      (b.rows?.length ?? 0) === 20,
    r
  );
  const log = (await (await fetch(`${STUB}/__log`)).json()) as { path: string; body: Record<string, unknown> }[];
  const call = log.find((e) => e.path === "/api/nl-to-sql");
  const schema = call?.body.schema as { tables: { name: string }[] };
  check(
    "D-36: the model is given the real schema",
    !!schema && schema.tables.map((t) => t.name).includes("orders") && schema.tables.length >= 2,
    schema
  );
  // What Node's own libraries build from the same schema and question.
  const { buildMastraContextPrompt } = await import("../../src/lib/nlquery/nl-query-context-service");
  const { getGraphContext, formatGraphContext } = await import("../../src/lib/graph/rag");
  let expected = await buildMastraContextPrompt("parity-ds", "admin", "q", JSON.stringify(schema));
  const graph = formatGraphContext(await getGraphContext("parity-ds", "list every order with its customer and amount"));
  if (graph) expected = expected ? `${expected}\n\n${graph}` : graph;
  const sent = (call?.body.context as { contextFromSimilarQueries?: string })?.contextFromSimilarQueries;
  check("context prompt equals Node's (pgvector fallback + role stats + graph RAG)", sent === expected, { sent, expected });
  check("graph context is part of it", graph.includes("TABLE public.orders"), graph);
  check(
    "modelConfig as Node sends it",
    JSON.stringify(call?.body.modelConfig) === '{"reasoningModel":"qwen3.6","sttModel":"Qwen3-ASR","ttsModel":"Qwen3-TTS"}',
    call?.body.modelConfig
  );
  const audit = await db.query(
    "SELECT action, resource_type, details FROM audit_log WHERE user_id = $1 AND resource_type = 'nl_builder' ORDER BY created_at DESC LIMIT 1",
    [ADMIN]
  );
  check(
    "preview is audited",
    audit.rows[0]?.action === "preview" && JSON.parse(audit.rows[0].details).rowCount === 20,
    audit.rows[0]
  );
}
{
  const r = await api("POST", "/api/nl-builder/preview", "admin", { nlDescription: "x", dataSourceId: "nope" });
  check("preview: unknown data source", JSON.stringify(r.body) === '{"success":false,"error":"Data source not found"}', r);
  const a = await api("POST", "/api/nl-builder/preview", "analyst", { nlDescription: "x", dataSourceId: "parity-ds" });
  check("preview: not an admin → FORBIDDEN", a.status === 403 && errorOf(a.body) === "FORBIDDEN", a);
  const n = await api("POST", "/api/nl-builder/preview", null, { nlDescription: "x", dataSourceId: "parity-ds" });
  check("preview: signed out → UNAUTHORIZED", n.status === 401 && errorOf(n.body) === "UNAUTHORIZED", n);
}

// ── nlSaveReport / nlSaveChart / nlBuilderListDataSources ──────────────────
{
  const r = await api("POST", "/api/nl-builder/save-report", "admin", {
    name: "p7f report",
    dataSourceId: "parity-ds",
    sql: "SELECT id FROM orders",
    exportFormats: ["csv"],
  });
  const b = r.body as { success?: boolean; reportId?: string; savedQueryId?: string };
  const rows = await db.query(
    `SELECT q.sql_content, q.is_validated, q.created_by, r.column_config, r.export_formats, r.is_public, r.saved_query_id = q.id AS linked
     FROM report_definitions r JOIN saved_queries q ON q.id = r.saved_query_id WHERE r.id = $1`,
    [b.reportId]
  );
  check(
    "save-report: saved query + report definition",
    b.success === true &&
      JSON.stringify(rows.rows[0]) ===
        JSON.stringify({
          sql_content: "SELECT id FROM orders",
          is_validated: true,
          created_by: ADMIN,
          column_config: "[]",
          export_formats: '["csv"]',
          is_public: false,
          linked: true,
        }),
    { r, rows: rows.rows }
  );
  const c = await api("POST", "/api/nl-builder/save-chart", "admin", {
    name: "p7f chart",
    dataSourceId: "parity-ds",
    sql: "SELECT customer, amount FROM orders",
    chartType: "bar",
  });
  const cb = c.body as { success?: boolean; chartId?: string };
  const crow = await db.query("SELECT chart_type, chart_config, data_mapping FROM chart_definitions WHERE id = $1", [cb.chartId]);
  check(
    "save-chart: chart definition with Node's defaults",
    cb.success === true &&
      JSON.stringify(crow.rows[0]) ===
        JSON.stringify({ chart_type: "bar", chart_config: "{}", data_mapping: '{"xAxis":{"field":""},"yAxis":[]}' }),
    { c, rows: crow.rows }
  );
  const ds = await api("GET", "/api/nl-builder/data-sources", "admin");
  const expected = (
    await db.query(
      "SELECT id, name, client_type, description FROM data_sources WHERE is_active = true AND is_deleted = false ORDER BY name"
    )
  ).rows;
  check("data-sources: active, by name", JSON.stringify(ds.body) === JSON.stringify(expected), ds);
}

// ── Share pages and dashboard stats ────────────────────────────────────────
{
  await db.query("UPDATE report_definitions SET is_public = true WHERE name = 'p7f report'");
  const id = (await db.query("SELECT id FROM report_definitions WHERE name = 'p7f report'")).rows[0].id;
  const pub = await api("GET", `/api/share/report/${id}`, null);
  check(
    "share: a public report, named columns only, no session",
    JSON.stringify(pub.body) === JSON.stringify({ data: { id, name: "p7f report", description: null } }),
    pub
  );
  await db.query("UPDATE report_definitions SET is_public = false WHERE name = 'p7f report'");
  const priv = await api("GET", `/api/share/report/${id}`, null);
  check("share: a private report is null", JSON.stringify(priv.body) === '{"data":null}', priv);
  const chartId = (await db.query("SELECT id FROM chart_definitions WHERE name = 'p7f chart'")).rows[0].id;
  await db.query("UPDATE chart_definitions SET is_public = true WHERE id = $1", [chartId]);
  const chart = await api("GET", `/api/share/chart/${chartId}`, null);
  check(
    "share: a public chart carries its type",
    JSON.stringify(chart.body) === JSON.stringify({ data: { id: chartId, name: "p7f chart", description: null, chart_type: "bar" } }),
    chart
  );
  const bad = await api("GET", "/api/share/user/x", null);
  check("share: only report, chart, dashboard", bad.status === 404, bad);
  const stats = await api("GET", "/api/dashboard/stats", "analyst");
  const count = async (t: string) => Number((await db.query(`SELECT count(*) FROM ${t}`)).rows[0].count);
  const s = stats.body as Record<string, unknown>;
  check(
    "stats: counts as Node computes them",
    s.reports === (await count("report_definitions")) &&
      s.users === (await count("users")) &&
      s.dataSources === (await count("data_sources")) &&
      (s.recentActivity as unknown[]).length === 6 &&
      Array.isArray(s.recentExecutions),
    s
  );
  const anon = await api("GET", "/api/dashboard/stats", null);
  check("D-37: stats need a session", anon.status === 401, anon);
}

await cleanup();
await db.end();
console.log(`\n${passed}/${passed + failed} passed, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);
