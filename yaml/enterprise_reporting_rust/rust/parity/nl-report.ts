/**
 * NL report generation parity: each definition through the Node worker
 * (`executeReportGeneration`) and the Rust one (`generate_nl_report` task),
 * from the same starting state, then compared — the result, the artifact
 * rows, the files (CSV bytes; the XLSX "Data" sheet; the PDF's table pages —
 * the chart differs by design, D-23), the notification, the audit row and
 * the definition's final status.
 *
 *   DATABASE_URL=… bun rust/parity/nl-report.ts
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { pdfPages, xlsxCells } from "./compare";

const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const ANALYST = "parity-analyst";
const bin = join(import.meta.dir, "..", "target", "debug", "ers-backend-cli");
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { resolveRBACContext } = await import("../../src/lib/monitoring/rbac-workflow-context");
const { executeReportGeneration } = await import("../../src/lib/report-generation/report-generation-worker");
const analystSnapshot = await resolveRBACContext(ANALYST, { userId: ANALYST, roles: ["Analyst"], permissions: [] });

type Def = { id: string; by: string; sql: string; chart?: string; metrics?: string[]; dims?: string[]; formats?: string[]; known?: string };
const defs: Def[] = [
  { id: "parity-nl-admin", by: ADMIN, sql: "SELECT customer, amount, qty FROM orders ORDER BY id LIMIT 12", metrics: ["amount"], dims: ["customer"], formats: ["excel", "pdf", "csv"] },
  { id: "parity-nl-pie", by: ADMIN, sql: "SELECT paid, COUNT(*) AS n FROM orders GROUP BY paid ORDER BY paid;", chart: "pie", formats: ["csv", "excel"] },
  { id: "parity-nl-none", by: ADMIN, sql: "SELECT id, customer FROM orders ORDER BY id LIMIT 3", chart: "none", formats: ["pdf", "csv"] },
  { id: "parity-nl-analyst", by: ANALYST, sql: "SELECT id, amount FROM orders ORDER BY id LIMIT 5", formats: ["csv"] },
  { id: "parity-nl-denied", by: ANALYST, sql: "SELECT * FROM hr_salaries", formats: ["csv"], known: "D-2" },
  { id: "parity-nl-empty", by: ADMIN, sql: "SELECT id FROM orders WHERE id < 0", formats: ["csv"] },
  { id: "parity-nl-broken", by: ADMIN, sql: "SELECT nope FROM orders", formats: ["csv"] },
];

async function reset(d: Def) {
  await db.query("DELETE FROM generated_report_artifacts WHERE report_definition_id = $1", [d.id]);
  await db.query("DELETE FROM notifications WHERE metadata LIKE $1", [`%${d.id}%`]);
  await db.query(
    `INSERT INTO nl_report_definitions (id, title, created_by, data_source_id, nl_query, generated_sql, metric_columns,
       dimension_columns, chart_type, output_formats, recipient_config, schedule_enabled, rbac_snapshot, created_at, updated_at)
     VALUES ($1, $1, $2, 'parity-ds', 'parity', $3, $4, $5, $6, $7, '[]', false, $8, '2026-09-23 10:00:00', '2026-09-23 10:00:00')
     ON CONFLICT (id) DO UPDATE SET generated_sql = EXCLUDED.generated_sql, metric_columns = EXCLUDED.metric_columns,
       dimension_columns = EXCLUDED.dimension_columns, chart_type = EXCLUDED.chart_type, output_formats = EXCLUDED.output_formats,
       rbac_snapshot = EXCLUDED.rbac_snapshot, last_run_status = NULL, last_run_at = NULL`,
    [d.id, d.by, d.sql, JSON.stringify(d.metrics ?? []), JSON.stringify(d.dims ?? []), d.chart ?? "bar",
     JSON.stringify(d.formats ?? ["csv"]), JSON.stringify(d.by === ADMIN ? {} : analystSnapshot)]
  );
}

async function sideEffects(d: Def, result: { executionId?: string; artifacts?: { format: string; filePath: string }[] }) {
  const out: string[] = [];
  const def = await db.query("SELECT last_run_status, last_run_at IS NOT NULL AS stamped FROM nl_report_definitions WHERE id = $1", [d.id]);
  out.push(`definition ${JSON.stringify(def.rows[0])}`);
  const arts = await db.query(
    `SELECT format, row_count, chart_type, status, triggered_by, sql_executed, created_by FROM generated_report_artifacts
     WHERE report_definition_id = $1 ORDER BY format`, [d.id]);
  for (const a of arts.rows) out.push(`artifact ${JSON.stringify(a)}`);
  const notes = await db.query("SELECT user_id, type, title, message FROM notifications WHERE metadata LIKE $1", [`%${result.executionId}%`]);
  for (const n of notes.rows) out.push(`notification ${JSON.stringify(n)}`);
  const audit = await db.query(
    "SELECT details FROM audit_log WHERE action = 'report:generated' AND resource_id = $1 ORDER BY created_at DESC LIMIT 1", [d.id]);
  if (audit.rows[0]) {
    const det = JSON.parse(audit.rows[0].details);
    delete det.executionMs;
    out.push(`audit ${JSON.stringify(det)}`);
    await db.query("DELETE FROM audit_log WHERE action = 'report:generated' AND resource_id = $1", [d.id]);
  }
  for (const a of result.artifacts ?? []) {
    const bytes = readFileSync(a.filePath);
    if (a.format === "csv") out.push(`csv ${bytes.toString("utf8")}`);
    else if (a.format === "excel") out.push(...(await xlsxCells(bytes, "Data")).map((l) => `xlsx ${l}`));
    else out.push(...pdfPages(bytes).slice(1).flat().map((l) => `pdf ${l}`));
  }
  return out;
}

let failed = 0;
let documented = 0;
for (const d of defs) {
  await reset(d);
  const node = await executeReportGeneration({ reportDefinitionId: d.id, triggeredBy: "manual" });
  const a = await sideEffects(d, node);
  await reset(d);
  const r = spawnSync(bin, ["task", "generate_nl_report", `id:${d.id}`], {
    cwd: join(import.meta.dir, ".."),
    encoding: "utf8",
    env: { ...process.env, JOB_OUTPUT_PATH: join(process.cwd(), "job-outputs") },
  });
  const rust = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  const b = await sideEffects(d, rust);
  const summary = (x: { status?: string; rowCount?: number; errorMessage?: string; artifacts?: { format: string }[] }) =>
    JSON.stringify({ status: x.status, rowCount: x.rowCount, errorMessage: x.errorMessage, formats: (x.artifacts ?? []).map((f) => f.format) });
  let problem: string | null = null;
  if (summary(node) !== summary(rust)) problem = `result\n    node: ${summary(node)}\n    rust: ${summary(rust)}`;
  else {
    const i = a.findIndex((l, k) => l !== b[k]);
    if (i >= 0 || a.length !== b.length) {
      const k = i >= 0 ? i : Math.min(a.length, b.length);
      problem = `item ${k} of ${a.length}/${b.length}\n    node: ${a[k]}\n    rust: ${b[k]}`;
    }
  }
  if (problem && d.known) {
    documented++;
    console.log(`~ ${d.id} (documented difference ${d.known}): ${problem}`);
  } else if (problem) {
    failed++;
    console.log(`✗ ${d.id}: ${problem}`);
  } else {
    console.log(`✓ ${d.id}: ${node.status}, ${node.rowCount} rows, ${a.length} facts equal`);
  }
}
console.log(`\n${defs.length - failed - documented}/${defs.length} equal, ${documented} documented, ${failed} failure(s)`);
await db.query("DELETE FROM generated_report_artifacts WHERE report_definition_id LIKE 'parity-nl-%'");
await db.query("DELETE FROM nl_report_definitions WHERE id LIKE 'parity-nl-%'");
await db.end();
process.exit(failed ? 1 : 0);
