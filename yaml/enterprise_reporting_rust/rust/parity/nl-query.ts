/**
 * `/api/nl-query/*` and `/api/voice/{transcribe,synthesize}` parity.
 *
 * Needs pgvector's `nl_query_embeddings` / `nl_schema_embeddings` in the
 * parity source (`scripts/init-postgres.ts` has the DDL), and no embedding,
 * speech-to-text or text-to-speech server: both backends then take the
 * hash-embedding fallback and the "service unavailable" paths, which is what
 * makes their output deterministic. Cases that write reset first, before each
 * backend's call, so both see the same starting state.
 *
 *   DATABASE_URL=… PARITY_SOURCE_URL=… bun rust/parity/nl-query.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const cachePath = join(import.meta.dir, ".session-cache.json");
if (!existsSync(cachePath)) {
  console.error("Run parity/run.ts once first: it signs in and caches the sessions this script uses.");
  process.exit(2);
}
const cookies = JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, string>;
const config = new Client({ connectionString: process.env.DATABASE_URL });
const source = new Client({ connectionString: process.env.PARITY_SOURCE_URL });
await config.connect();
await source.connect();

async function reset() {
  await config.query("DELETE FROM nl_query_context WHERE nl_question LIKE 'parity nl %'");
  await source.query("DELETE FROM nl_query_embeddings WHERE data_source_id = 'parity-ds'");
  await source.query("DELETE FROM nl_schema_embeddings WHERE data_source_id = 'parity-ds'");
}

/** Ids, timestamps and durations differ run to run; everything else must not. */
const VOLATILE = /^(id|created_at|updated_at|executionTimeMs|execution_time_ms|timestamp|resolvedAt|duration)$/;
function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, VOLATILE.test(k) && x != null ? "<v>" : normalize(x)])
    );
  }
  return v;
}

type Case = {
  name: string;
  method?: string;
  path: string;
  body?: unknown;
  form?: () => FormData;
  as?: string;
  fresh?: boolean;
  /** SQL on the config database whose rows are compared after the call. */
  after?: string;
  known?: string;
};
const q = (sql: string) => sql;
const cases: Case[] = [
  { name: "history unauthenticated", path: "/api/nl-query/history", as: "none" },
  { name: "history empty", path: "/api/nl-query/history?data_source_id=parity-ds&search=parity%20nl" },
  {
    name: "history save missing fields",
    method: "POST",
    path: "/api/nl-query/history",
    body: { nl_question: "parity nl x" },
  },
  {
    name: "history save",
    method: "POST",
    path: "/api/nl-query/history",
    body: { nl_question: "parity nl orders", generated_sql: "SELECT * FROM orders", data_source_id: "parity-ds", row_count: 3 },
    fresh: true,
    after: q(
      "SELECT nl_question, generated_sql, data_source_id, user_id, role_name, schema_context, rbac_context, row_count, execution_time_ms, was_successful, created_by FROM nl_query_context WHERE nl_question LIKE 'parity nl %'"
    ),
  },
  { name: "history lists the saved row", path: "/api/nl-query/history?data_source_id=parity-ds&search=parity%20nl&scope=mine" },
  { name: "history role scope, paged", path: "/api/nl-query/history?search=parity%20nl&limit=1&offset=0" },
  { name: "history bad limit", path: "/api/nl-query/history?limit=abc&search=parity%20nl" },
  { name: "history as analyst", path: "/api/nl-query/history?search=parity%20nl", as: "analyst" },
  { name: "schema by query", path: "/api/nl-query/schema?data_source_id=parity-ds" },
  { name: "schema by body", method: "POST", path: "/api/nl-query/schema", body: { dataSourceId: "parity-ds" } },
  { name: "schema missing id", path: "/api/nl-query/schema" },
  { name: "schema unknown", path: "/api/nl-query/schema?data_source_id=nope" },
  { name: "schema as analyst", path: "/api/nl-query/schema?data_source_id=parity-ds", as: "analyst" },
  { name: "execute missing fields", method: "POST", path: "/api/nl-query/execute", body: { query: "x" } },
  {
    name: "execute unknown data source",
    method: "POST",
    path: "/api/nl-query/execute",
    body: { query: "x", data_source_id: "nope" },
  },
  {
    name: "execute select",
    method: "POST",
    path: "/api/nl-query/execute",
    body: { query: "parity nl all orders", data_source_id: "parity-ds", generated_sql: "SELECT id, customer FROM orders ORDER BY id" },
    fresh: true,
  },
  {
    name: "execute as analyst, permitted",
    method: "POST",
    path: "/api/nl-query/execute",
    body: { query: "parity nl orders", data_source_id: "parity-ds", generated_sql: "SELECT id FROM orders ORDER BY id" },
    as: "analyst",
    fresh: true,
  },
  {
    name: "execute as analyst, forbidden table",
    method: "POST",
    path: "/api/nl-query/execute",
    body: { query: "parity nl salaries", data_source_id: "parity-ds", generated_sql: "SELECT * FROM hr_salaries" },
    as: "analyst",
    fresh: true,
  },
  {
    name: "execute a write",
    method: "POST",
    path: "/api/nl-query/execute",
    body: { query: "parity nl mark paid", data_source_id: "parity-ds", generated_sql: "UPDATE orders SET paid = paid" },
    as: "analyst",
    fresh: true,
    known: "D-26",
  },
  { name: "rag-store missing fields", method: "POST", path: "/api/nl-query/rag-store", body: { data_source_id: "parity-ds" } },
  {
    name: "rag-store unknown data source",
    method: "POST",
    path: "/api/nl-query/rag-store",
    body: { data_source_id: "nope", natural_language_query: "a", generated_sql: "SELECT 1" },
  },
  {
    name: "rag-store",
    method: "POST",
    path: "/api/nl-query/rag-store",
    body: { data_source_id: "parity-ds", natural_language_query: "parity nl unpaid orders", generated_sql: "SELECT * FROM orders WHERE NOT paid", row_count: 2 },
    fresh: true,
  },
  {
    name: "rag-context",
    method: "POST",
    path: "/api/nl-query/rag-context",
    body: { query: "parity nl unpaid orders", data_source_id: "parity-ds" },
  },
  {
    name: "rag-context budget and top-k",
    method: "POST",
    path: "/api/nl-query/rag-context",
    body: { query: "customer orders", data_source_id: "parity-ds", context_budget: 200, top_k_queries: 1 },
  },
  { name: "rag-context missing fields", method: "POST", path: "/api/nl-query/rag-context", body: {} },
  { name: "voice unauthenticated", method: "POST", path: "/api/nl-query/voice", form: () => new FormData(), as: "none" },
  { name: "voice without audio", method: "POST", path: "/api/nl-query/voice", form: () => new FormData() },
  { name: "voice not multipart", method: "POST", path: "/api/nl-query/voice", body: { audio: "x" } },
  {
    name: "voice with no ASR server",
    method: "POST",
    path: "/api/nl-query/voice",
    form: () => {
      const f = new FormData();
      f.append("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "a.webm");
      return f;
    },
  },
  {
    name: "transcribe with no ASR server",
    method: "POST",
    path: "/api/voice/transcribe",
    form: () => {
      const f = new FormData();
      f.append("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "a.webm");
      return f;
    },
  },
  { name: "transcribe without audio", method: "POST", path: "/api/voice/transcribe", form: () => new FormData() },
  { name: "synthesize without text", method: "POST", path: "/api/voice/synthesize", body: {} },
  { name: "synthesize with no TTS server", method: "POST", path: "/api/voice/synthesize", body: { text: "hello" } },
  { name: "synthesize unauthenticated", method: "POST", path: "/api/voice/synthesize", body: { text: "hello" }, as: "none" },
];

async function call(base: string, c: Case): Promise<string> {
  if (c.fresh) await reset();
  const headers: Record<string, string> = { cookie: cookies[c.as ?? "admin"] ?? "" };
  let body: BodyInit | undefined;
  if (c.form) body = c.form();
  else if (c.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(c.body);
  }
  const res = await fetch(`${base}${c.path}`, { method: c.method ?? "GET", headers, body });
  const text = await res.text();
  let shown: string;
  try {
    shown = JSON.stringify(normalize(JSON.parse(text)));
  } catch {
    shown = `${res.headers.get("content-type")} ${text.slice(0, 200)}`;
  }
  // `execute` stores the embedding after responding; let it land.
  await Bun.sleep(300);
  let after = "";
  if (c.after) after = ` | ${JSON.stringify((await config.query(c.after)).rows)}`;
  return `${res.status} ${shown}${after}`;
}

await reset();
let failed = 0;
let known = 0;
for (const c of cases) {
  const a = await call(NODE_URL, c);
  const b = await call(RUST_URL, c);
  if (a === b) console.log(`✓ ${c.name}  (${a.length} bytes)`);
  else if (c.known) {
    known++;
    console.log(`~ ${c.name}  (documented difference ${c.known})\n    node=${a.slice(0, 300)}\n    rust=${b.slice(0, 300)}`);
  } else {
    failed++;
    const k = [...a].findIndex((ch, j) => ch !== b[j]);
    console.log(`✗ ${c.name}\n    node=…${a.slice(Math.max(0, k - 80), k + 300)}\n    rust=…${b.slice(Math.max(0, k - 80), k + 300)}`);
  }
}
await reset();
await config.end();
await source.end();
console.log(`\n${cases.length - failed - known}/${cases.length} identical, ${known} documented, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);
