/**
 * Phase 7 parity: the last Node routes Rust took over —
 * `POST /api/report-generation/definitions` (dry run and create),
 * `POST /api/adk/analyze-intent`, CopilotKit's transcribe / tts / threads and
 * `POST /api/data-sources/upload` — compared response for response, row for
 * row, and **request for request against the model**: `parity/llm-stub.py`
 * records every call each backend makes, so the prompts are compared too.
 *
 * Needs the stub on :4199 and both backends started with MASTRA_URL,
 * AI_NL2SQL_BASE_URL and LLAMA_REASONING_URL pointing at it.
 *
 *   DATABASE_URL=… bun rust/parity/phase7.ts
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "pg";

const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const STUB = process.env.STUB_URL ?? "http://localhost:4199";
const cachePath = join(import.meta.dir, ".session-cache.json");
if (!existsSync(cachePath)) {
  console.error("Run parity/run.ts once first: it signs in and caches the sessions this script uses.");
  process.exit(2);
}
const cookies = JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, string>;
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// ── Fixture: entity metadata with a foreign key, so the dry run's schema text
//    and join paths have something to say. ────────────────────────────────────
async function seedMetadata() {
  await db.query("DELETE FROM metadata_entity_field WHERE id LIKE 'p7-%'");
  await db.query("DELETE FROM metadata_entity_header WHERE id LIKE 'p7-%'");
  await db.query(
    `INSERT INTO metadata_entity_header (id, data_source_id, entity_name, entity_schema, entity_type, schema_metadata, description, is_active, is_hidden, created_by, created_at, updated_at)
     VALUES ('p7-h-orders', 'parity-ds', 'orders', 'public', 'table', '{}', 'Customer orders', true, false, 'x', 'x', 'x'),
            ('p7-h-cust', 'parity-ds', 'customers', 'public', 'table', '{}', null, true, false, 'x', 'x', 'x'),
            ('p7-h-region', 'parity-ds', 'regions', 'public', 'table', '{}', null, true, false, 'x', 'x', 'x'),
            ('p7-h-off', 'parity-ds', 'retired', 'public', 'table', '{}', null, false, false, 'x', 'x', 'x')`
  );
  await db.query(
    `INSERT INTO metadata_entity_field (id, entity_header_id, field_name, data_type, is_foreign_key, foreign_key_table, foreign_key_column, description)
     VALUES ('p7-f-1', 'p7-h-orders', 'id', 'integer', false, null, null, 'Order number'),
            ('p7-f-2', 'p7-h-orders', 'customer_id', 'varchar', true, 'customers', null, null),
            ('p7-f-3', 'p7-h-orders', 'amount', 'numeric', false, null, null, null),
            ('p7-f-4', 'p7-h-cust', 'id', 'uuid', false, null, null, null),
            ('p7-f-5', 'p7-h-cust', 'region_id', 'varchar', true, 'regions', 'id', 'Sales region'),
            ('p7-f-6', 'p7-h-region', 'id', 'uuid', false, null, null, null),
            ('p7-f-7', 'p7-h-region', 'name', '', false, null, null, null),
            ('p7-f-8', 'p7-h-off', 'x', 'text', false, null, null, null)`
  );
}
await seedMetadata();

// The analyst may execute on the parity data source (resource grant), so the
// ADK pipeline reaches schema introspection for a non-admin and filters it.
await db.query("DELETE FROM resource_permissions WHERE id = 'p7-rp-exec'");

// ── Helpers ─────────────────────────────────────────────────────────────────
const VOLATILE =
  /^(id|intentId|createdAt|updatedAt|resolvedAt|threadId|executionId|execution_id|executionMs|execution_ms|filePath|file_path|duration|artifactId|definitionId|created_at|updated_at)$/;
function normalize(v: unknown, key = ""): unknown {
  if (Array.isArray(v)) return v.map((x) => normalize(x));
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, normalize(x, k)]));
  if (VOLATILE.test(key) && v !== null && v !== undefined && v !== "") return "<v>";
  return v;
}

async function stubLog(): Promise<unknown[]> {
  const log = (await (await fetch(`${STUB}/__log`)).json()) as {
    path: string;
    auth: string | null;
    body: Record<string, unknown>;
  }[];
  // A multipart body's size depends on the client's boundary string.
  for (const e of log) delete e.body?._multipart_bytes;
  return log.map((e) => normalize(e));
}

type Case = {
  name: string;
  method?: string;
  path: string;
  as?: string;
  body?: unknown;
  form?: () => FormData;
  raw?: string;
  before?: string[];
  /** Compared after the call; `$ID` is the id the response returned. */
  check?: string;
  known?: string;
  binary?: boolean;
};

const wav = (() => {
  const dir = tmpdir();
  const w = join(dir, "p7-tone.wav");
  const o = join(dir, "p7-tone.ogg");
  execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.3", "-ar", "8000", w], { stdio: "ignore" });
  execFileSync("ffmpeg", ["-y", "-i", w, o], { stdio: "ignore" });
  return { wav: readFileSync(w), ogg: readFileSync(o) };
})();

const cases: Case[] = [
  // Report-generation definitions: dry run
  {
    name: "dry run",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "parity-ds", nlQuery: "total by customer" },
  },
  {
    name: "dry run, SQL fails once and is retried with the error",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "parity-ds", nlQuery: "broken total by customer" },
  },
  {
    name: "dry run as analyst on a permitted table",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "parity-ds", nlQuery: "total by customer" },
    as: "analyst",
  },
  {
    name: "dry run as analyst, the model reads a forbidden table",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "parity-ds", nlQuery: "salaries" },
    as: "analyst",
    known: "D-35",
  },
  {
    name: "dry run, unknown data source",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "nope", nlQuery: "x" },
  },
  {
    name: "dry run, missing query",
    path: "/api/report-generation/definitions",
    body: { dryRun: true, dataSourceId: "parity-ds" },
  },
  {
    name: "dry run signed out",
    path: "/api/report-generation/definitions",
    body: { dryRun: true },
    as: "none",
  },
  // Report-generation definitions: create
  {
    name: "create, scheduled",
    path: "/api/report-generation/definitions",
    body: {
      title: "p7 scheduled",
      dataSourceId: "parity-ds",
      nlQuery: "orders",
      generatedSQL: "SELECT id, amount FROM orders ORDER BY id LIMIT 3",
      outputFormats: ["csv"],
      scheduleCron: "0 8 * * 1",
      scheduleTimezone: "Europe/Berlin",
      metricColumns: ["amount"],
      dateRangeFrom: "2026-01-01",
      recipients: [{ type: "email", value: "a@b.co" }],
    },
    before: ["DELETE FROM nl_report_definitions WHERE title LIKE 'p7 %'"],
    check:
      "SELECT title, created_by, data_source_id, nl_query, generated_sql, metric_columns, dimension_columns, filter_config, date_range_from::text, date_range_to, chart_type, output_formats, recipient_config, schedule_cron, schedule_timezone, schedule_enabled, rbac_snapshot_version, last_run_status IS NULL AS never_run FROM nl_report_definitions WHERE title LIKE 'p7 %'",
  },
  {
    name: "create and run now",
    path: "/api/report-generation/definitions",
    body: {
      title: "p7 run now",
      dataSourceId: "parity-ds",
      nlQuery: "orders",
      generatedSQL: "SELECT id, amount FROM orders ORDER BY id LIMIT 3",
      outputFormats: ["csv"],
    },
    before: ["DELETE FROM nl_report_definitions WHERE title LIKE 'p7 %'"],
    check:
      "SELECT title, schedule_cron, schedule_enabled, last_run_status FROM nl_report_definitions WHERE title LIKE 'p7 %'",
  },
  {
    name: "create, missing formats",
    path: "/api/report-generation/definitions",
    body: { title: "t", dataSourceId: "parity-ds", nlQuery: "q", generatedSQL: "SELECT 1" },
  },
  // ADK
  {
    name: "ADK: monitoring rule through the supervisor",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "  alert me every Monday if total order amount drops below 100  ", dataSourceId: "parity-ds", sessionId: "s1" },
    before: ["DELETE FROM adk_intents WHERE session_id LIKE 's%'", "DELETE FROM ds_schema_cache WHERE data_source_id = 'parity-ds'"],
    check:
      "SELECT user_id, session_id, raw_nl_request, request_source, intent_type, confidence::text, pipeline_status, error_message, report_definition_id, monitoring_rule_id FROM adk_intents WHERE session_id = 's1'",
  },
  {
    name: "ADK: the schema cache it wrote",
    known: "D-27",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "alert me hourly when order total is under 100", dataSourceId: "parity-ds", sessionId: "s1b" },
    before: ["DELETE FROM ds_schema_cache WHERE data_source_id = 'parity-ds'"],
    check: "SELECT schema_metadata, sample_data, embedding_data FROM ds_schema_cache WHERE data_source_id = 'parity-ds'",
  },
  {
    name: "ADK: ambiguous request asks for clarification",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "something vague", dataSourceId: "parity-ds", sessionId: "s2" },
    before: ["DELETE FROM adk_intents WHERE session_id = 's2'"],
    check: "SELECT intent_type, confidence::text, pipeline_status, error_message FROM adk_intents WHERE session_id = 's2'",
  },
  {
    name: "ADK: supervisor unreachable, direct SQL generation",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "unreachable: alert me daily if salaries rise above 5000", dataSourceId: "parity-ds", sessionId: "s3" },
  },
  {
    name: "ADK: analyst without execute permission",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "alert me every Monday if total order amount drops below 100", dataSourceId: "parity-ds", sessionId: "s4" },
    as: "analyst",
    before: ["DELETE FROM adk_intents WHERE session_id = 's4'"],
    check: "SELECT pipeline_status, error_message FROM adk_intents WHERE session_id = 's4'",
  },
  {
    name: "ADK: analyst with execute permission sees only permitted tables",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "alert me every Monday if total order amount drops below 100", dataSourceId: "parity-ds", sessionId: "s5" },
    as: "analyst",
    before: [
      "DELETE FROM resource_permissions WHERE id = 'p7-rp-exec'",
      "INSERT INTO resource_permissions (id, resource_type, resource_id, role_id, permission_level, created_at) VALUES ('p7-rp-exec', 'data_source', 'parity-ds', 'parity-analyst-role', 'execute', 'x')",
    ],
  },
  {
    name: "ADK: unknown data source",
    path: "/api/adk/analyze-intent",
    body: { nlRequest: "alert me every Monday if total order amount drops below 100", dataSourceId: "nope", sessionId: "s6" },
  },
  { name: "ADK: missing request", path: "/api/adk/analyze-intent", body: { nlRequest: "   ", dataSourceId: "parity-ds" } },
  { name: "ADK: missing data source", path: "/api/adk/analyze-intent", body: { nlRequest: "x" } },
  { name: "ADK: signed out", path: "/api/adk/analyze-intent", body: { nlRequest: "x" }, as: "none" },
  // CopilotKit
  {
    name: "transcribe a WAV",
    path: "/api/copilotkit/transcribe",
    form: () => {
      const f = new FormData();
      f.append("file", new Blob([wav.wav], { type: "audio/wav" }), "clip.wav");
      return f;
    },
  },
  {
    name: "transcribe Ogg (converted by ffmpeg)",
    path: "/api/copilotkit/transcribe",
    form: () => {
      const f = new FormData();
      f.append("audio", new Blob([wav.ogg], { type: "audio/ogg" }), "clip.ogg");
      return f;
    },
  },
  {
    name: "transcribe undecodable bytes",
    path: "/api/copilotkit/transcribe",
    form: () => {
      const f = new FormData();
      f.append("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "x.webm");
      return f;
    },
  },
  { name: "transcribe without a file", path: "/api/copilotkit/transcribe", form: () => new FormData() },
  { name: "transcribe, not multipart", path: "/api/copilotkit/transcribe", body: { x: 1 } },
  { name: "transcribe signed out", path: "/api/copilotkit/transcribe", form: () => new FormData(), as: "none" },
  { name: "tts", path: "/api/copilotkit/tts", body: { input: "hello", voice: "alloy" }, binary: true },
  { name: "tts, invalid JSON", path: "/api/copilotkit/tts", raw: "{" },
  { name: "threads list", method: "GET", path: "/api/copilotkit/threads" },
  { name: "threads create", path: "/api/copilotkit/threads", body: {} },
  { name: "threads signed out", method: "GET", path: "/api/copilotkit/threads", as: "none" },
  // Upload
  {
    name: "upload a .sqlite name",
    path: "/api/data-sources/upload",
    form: () => {
      const f = new FormData();
      f.append("file", new Blob([new Uint8Array([1])]), "Sales.SQLite3");
      return f;
    },
  },
  {
    name: "upload the wrong type",
    path: "/api/data-sources/upload",
    form: () => {
      const f = new FormData();
      f.append("file", new Blob([new Uint8Array([1])]), "sales.csv");
      return f;
    },
  },
  { name: "upload without a file", path: "/api/data-sources/upload", form: () => new FormData() },
  { name: "upload, not multipart", path: "/api/data-sources/upload", body: {} },
  { name: "upload signed out", path: "/api/data-sources/upload", form: () => new FormData(), as: "none" },
];

async function call(base: string, c: Case): Promise<string> {
  for (const sql of c.before ?? []) await db.query(sql);
  await fetch(`${STUB}/__reset`, { method: "POST" });
  const headers: Record<string, string> = {};
  const cookie = cookies[c.as ?? "admin"];
  if (cookie) headers.cookie = cookie;
  let body: BodyInit | undefined;
  if (c.form) body = c.form();
  else if (c.raw !== undefined) {
    headers["content-type"] = "application/json";
    body = c.raw;
  } else if (c.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(c.body);
  }
  const res = await fetch(`${base}${c.path}`, { method: c.method ?? "POST", headers, body });
  let shown: unknown;
  let id: string | undefined;
  if (c.binary && res.ok) {
    shown = `${res.headers.get("content-type")} ${Buffer.from(await res.arrayBuffer()).toString("hex")}`;
  } else {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { definition?: { id?: string } };
      id = parsed?.definition?.id;
      shown = normalize(parsed);
    } catch {
      shown = `${res.headers.get("content-type")} ${text.slice(0, 120)}`;
    }
  }
  const rows = c.check ? normalize((await db.query(c.check.replaceAll("$ID", id ?? ""))).rows) : undefined;
  const sent = await stubLog();
  return JSON.stringify({ status: res.status, body: shown, rows, sent });
}

let failed = 0;
let known = 0;
for (const c of cases) {
  const a = await call(NODE_URL, c);
  const b = await call(RUST_URL, c);
  if (a === b) console.log(`✓ ${c.name}  (${a.length} bytes)`);
  else if (c.known) {
    known++;
    console.log(`~ ${c.name}  (documented difference ${c.known})\n    node=${a.slice(0, 260)}\n    rust=${b.slice(0, 260)}`);
  } else {
    failed++;
    const k = [...a].findIndex((ch, j) => ch !== b[j]);
    console.log(`✗ ${c.name}\n    node=…${a.slice(Math.max(0, k - 120), k + 240)}\n    rust=…${b.slice(Math.max(0, k - 120), k + 240)}`);
  }
}

await db.query("DELETE FROM resource_permissions WHERE id = 'p7-rp-exec'");
await db.query("DELETE FROM nl_report_definitions WHERE title LIKE 'p7 %'");
await db.query("DELETE FROM adk_intents WHERE session_id LIKE 's%'");
await db.query("DELETE FROM metadata_entity_field WHERE id LIKE 'p7-%'");
await db.query("DELETE FROM metadata_entity_header WHERE id LIKE 'p7-%'");
await db.end();
console.log(`\n${cases.length - failed - known}/${cases.length} identical, ${known} documented, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);
