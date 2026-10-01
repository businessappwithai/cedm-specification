/**
 * Monitoring-evaluation parity: evaluate each fixture rule once with the Node
 * worker and once with the Rust worker, from the same starting state, and
 * compare the outcome and every row written — the execution, the rule's
 * counters, the in-app notifications and the audit entry.
 *
 *   bun rust/parity/monitoring.ts        (needs the fixture from seed.ts, and
 *                                         `cargo build` in rust/)
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Client } from "pg";

const RULES = [
  "parity-m-active", "parity-m-paused", "parity-m-pass", "parity-m-breach", "parity-m-between",
  "parity-m-nocol", "parity-m-noquery", "parity-m-drift",
];
const VOLATILE = new Set([
  "id", "executed_at", "created_at", "updated_at", "alert_sent_at", "execution_ms", "last_executed_at",
  "executionId", "triggeredAt",
]);

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { executeMonitoringEvaluation } = await import("../../src/lib/jobs/workers/monitoring-worker");

async function reset(id: string) {
  await db.query("DELETE FROM monitoring_executions WHERE monitoring_rule_id = $1", [id]);
  await db.query("DELETE FROM notifications WHERE metadata LIKE $1", [`%${id}%`]);
  await db.query("DELETE FROM audit_log WHERE details LIKE $1", [`%${id}%`]);
  await db.query(
    `UPDATE monitoring_rules SET is_paused = (id = 'parity-m-paused'), pause_reason = NULL, consecutive_breaches = 2,
       total_executions = 5, total_alerts_sent = 1, last_metric_value = NULL, last_execution_status = NULL WHERE id = $1`,
    [id]
  );
  // A previous execution so delta_pct is exercised.
  await db.query(
    `INSERT INTO monitoring_executions (id, monitoring_rule_id, executed_at, evaluation_status, metric_value)
     VALUES ('prev-' || $1, $1, TIMESTAMP '2026-01-01 00:00:00', 'PASS', 30000.1234)`,
    [id]
  );
}

function scrub(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => !VOLATILE.has(k))
        .map(([k, x]) => [k, typeof x === "string" && x.startsWith("{") ? scrub(JSON.parse(x)) : scrub(x)])
    );
  }
  return v;
}

async function snapshot(id: string) {
  const q = async (sql: string) => (await db.query(sql, [id])).rows;
  return scrub({
    executions: await q("SELECT * FROM monitoring_executions WHERE monitoring_rule_id = $1 AND id NOT LIKE 'prev-%'"),
    rule: await q(
      "SELECT is_paused, pause_reason, total_executions, last_execution_status, last_metric_value, consecutive_breaches, total_alerts_sent FROM monitoring_rules WHERE id = $1"
    ),
    notifications: await q("SELECT user_id, type, title, message, metadata FROM notifications WHERE metadata LIKE '%' || $1 || '%' ORDER BY user_id"),
    audit: await q("SELECT user_id, action, resource_type, resource_id, details FROM audit_log WHERE details LIKE '%' || $1 || '%'"),
  });
}

let failed = 0;
for (const id of RULES) {
  await reset(id);
  let node: unknown;
  try {
    node = await executeMonitoringEvaluation({ ruleId: id, triggeredBy: "manual" } as never);
  } catch (e) {
    node = { error: String(e) };
  }
  const nodeRows = await snapshot(id);

  await reset(id);
  const r = spawnSync(join(import.meta.dir, "..", "target", "debug", "ers-backend-cli"), ["task", "evaluate_rule", `rule_id:${id}`], {
    cwd: join(import.meta.dir, ".."),
    encoding: "utf8",
    env: process.env,
  });
  const line = r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop();
  const rust = line ? JSON.parse(line) : { error: r.stderr.slice(-400) };
  const rustRows = await snapshot(id);

  const a = JSON.stringify({ outcome: node, ...(nodeRows as object) });
  const b = JSON.stringify({ outcome: rust, ...(rustRows as object) });
  if (a === b) {
    console.log(`✓ ${id}  ${(node as { status?: string }).status}`);
  } else {
    failed++;
    console.log(`✗ ${id}\n  node: ${a}\n  rust: ${b}`);
  }
}
await db.end();
process.exit(failed ? 1 : 0);
