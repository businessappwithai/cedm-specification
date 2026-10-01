/**
 * `/api/logs/search` parity. Nothing in either backend writes
 * `logs.message_vector` (MIGRATION_PLAN.md §9, P-13), so this script seeds
 * logs whose vectors come from Node's own `generateLogEmbedding` and then
 * compares both backends' rankings, exactly — similarity values included,
 * which only match if the Rust embedding is bit-for-bit Node's.
 *
 *   DATABASE_URL=… bun rust/parity/log-search.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const { generateLogEmbedding } = await import("../../src/lib/embeddings/vector-embeddings");
const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const cachePath = join(import.meta.dir, ".session-cache.json");
if (!existsSync(cachePath)) {
  console.error("Run parity/run.ts once first: it signs in and caches the sessions this script uses.");
  process.exit(2);
}
const cookies = JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, string>;
const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const messages = [
  ["error", "database", "Database connection timeout after 30s"],
  ["info", "search", "database query executed"],
  ["warn", "auth", "Session expired for user"],
  ["info", "search", "search: Ünïcödé naïve café résumé 数据库"],
  ["info", "search", ""],
  ["error", "export", "Export failed: file too large"],
  ["info", "search", "database timeout"],
];
await db.query("DELETE FROM logs WHERE id LIKE 'parity-log-%'");
let i = 0;
for (const [level, component, message] of messages) {
  const vector = generateLogEmbedding(message, component, level);
  await db.query(
    `INSERT INTO logs (id, timestamp, level, message, component, user_id, message_vector)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [`parity-log-${i}`, `2026-09-23T10:0${i}:00.000Z`, level, message, component, ADMIN, JSON.stringify(vector)]
  );
  i++;
}
// Another user's log, and one of the admin's without a vector.
await db.query(
  `INSERT INTO logs (id, timestamp, level, message, component, user_id, message_vector)
   VALUES ('parity-log-other', 'x', 'info', 'database timeout', 'search', 'parity-analyst', $1),
          ('parity-log-novec', 'x', 'info', 'database timeout', 'search', $2, NULL)`,
  [JSON.stringify(generateLogEmbedding("database timeout", "search", "info")), ADMIN]
);

const cases: [string, unknown, string?][] = [
  ["database timeout", { query: "database timeout" }],
  ["low threshold, limit 3", { query: "database", threshold: 0.05, limit: 3 }],
  ["unicode", { query: "Ünïcödé café", threshold: 0.01 }],
  ["limit 0 means 10", { query: "timeout", threshold: 0.01, limit: 0 }],
  ["limit capped at 100", { query: "search", threshold: 0.0001, limit: 500 }],
  ["nothing above threshold", { query: "zebra", threshold: 0.99 }],
  ["no query", {}],
  ["as analyst", { query: "database timeout" }, "analyst"],
  ["unauthenticated", { query: "x" }, "none"],
];
let failed = 0;
for (const [name, body, as = "admin"] of cases) {
  const call = async (base: string) => {
    const res = await fetch(`${base}/api/logs/search`, {
      method: "POST",
      headers: { cookie: cookies[as] ?? "", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return `${res.status} ${await res.text()}`;
  };
  const [a, b] = [await call(NODE_URL), await call(RUST_URL)];
  if (a === b) console.log(`✓ ${name}  (${a.length} bytes)`);
  else {
    failed++;
    const k = [...a].findIndex((c, j) => c !== b[j]);
    console.log(`✗ ${name}\n    node: …${a.slice(Math.max(0, k - 60), k + 80)}\n    rust: …${b.slice(Math.max(0, k - 60), k + 80)}`);
  }
}
await db.query("DELETE FROM logs WHERE id LIKE 'parity-log-%'");
await db.end();
process.exit(failed ? 1 : 0);
