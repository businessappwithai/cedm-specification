/**
 * email:batch parity: one batch through the Node worker and the Rust worker,
 * each into its own local SMTP sink (parity/smtp-sink.py), then compared —
 * the job result, every message (recipient, subject, rendered HTML,
 * attachment name and bytes; XLSX/PDF by content, D-22) and the audit row.
 *
 *   DATABASE_URL=… bun rust/parity/email-batch.ts
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "pg";
import { pdfText, xlsxCells } from "./compare";

const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const bin = join(import.meta.dir, "..", "target", "debug", "ers-backend-cli");
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const now = "2026-09-23T10:00:00.000Z";

await db.query(
  `INSERT INTO email_templates (id, name, subject, body, html_body, column_mappings, created_at, updated_at)
   VALUES ('parity-et-1', 'parity', 'Report {{_reportName}} for {{name}}',
           'plain', '<p>Hi {{name}} ({{_recipientNumber}}/{{_totalRecipients}}), you owe {{due}}.{{#if due}} Pay soon.{{/if}}</p>',
           '{"name":"customer","due":"amount"}', $1, $1)
   ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject, html_body = EXCLUDED.html_body, column_mappings = EXCLUDED.column_mappings`,
  [now]
);
for (const [id, sql] of [
  ["parity-q-recipients", "SELECT customer, 'buyer' || id || '@example.test' AS email, amount FROM orders WHERE id <= 3 ORDER BY id"],
  ["parity-q-norecipients", "SELECT customer, 'x@example.test' AS email FROM orders WHERE id < 0"],
]) {
  await db.query(
    `INSERT INTO saved_queries (id, name, data_source_id, sql_content, created_by, created_at, updated_at)
     VALUES ($1, $1, 'parity-ds', $2, $3, $4, $4) ON CONFLICT (id) DO UPDATE SET sql_content = EXCLUDED.sql_content`,
    [id, sql, ADMIN, now]
  );
}

async function sink(port: number) {
  const dir = mkdtempSync(join(tmpdir(), "ers-smtp-"));
  const proc = spawn("python3", ["-W", "ignore", join(import.meta.dir, "smtp-sink.py"), String(port), dir], { stdio: "inherit" });
  await new Promise((r) => setTimeout(r, 800));
  return { dir, stop: () => proc.kill() };
}

type Msg = { to: string[]; subject: string; html: string; attachments: { filename: string; contentType: string; data: string }[] };
async function messages(dir: string) {
  const all: Msg[] = readdirSync(dir).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  all.sort((a, b) => a.to[0].localeCompare(b.to[0]));
  const out: string[] = [];
  for (const m of all) {
    out.push(`to ${m.to.join(",")} | ${m.subject} | ${m.html}`);
    for (const a of m.attachments) {
      const bytes = Buffer.from(a.data, "base64");
      out.push(`  ${a.filename.replace(/_\d+\./, "_T.")} ${a.contentType}`);
      const body = a.filename.endsWith(".xlsx")
        ? await xlsxCells(bytes)
        : a.filename.endsWith(".pdf")
          ? pdfText(bytes)
          : [bytes.toString("utf8")];
      out.push(...body.map((l) => `    ${l}`));
    }
  }
  return out;
}

async function auditRow() {
  const { rows } = await db.query(
    "SELECT details FROM audit_log WHERE action = 'email_batch' ORDER BY created_at DESC LIMIT 1"
  );
  const d = JSON.parse(rows[0]?.details ?? "{}");
  delete d.attachmentPath;
  return JSON.stringify(d);
}

let failed = 0;
const cases = [
  { name: "csv", queryId: "parity-q-limited", recipients: "parity-q-recipients", format: "csv" },
  { name: "xlsx", queryId: "parity-q-limited", recipients: "parity-q-recipients", format: "xlsx" },
  { name: "pdf", queryId: "parity-q-limited", recipients: "parity-q-recipients", format: "pdf" },
  { name: "no recipients", queryId: "parity-q-limited", recipients: "parity-q-norecipients", format: "csv" },
  { name: "missing email column", queryId: "parity-q-limited", recipients: "parity-q-recipients", format: "csv", column: "mail" },
];
let port = 2600;
for (const c of cases) {
  const column = c.column ?? "email";
  const n = await sink(++port);
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_SECURE = "false";
  delete process.env.SMTP_USER;
  // A fresh module per case: the Node mailer caches its transport.
  const { processEmailBatchJob } = await import(`../../src/lib/jobs/workers/email-batch-worker.ts?case=${port}`);
  const node = await processEmailBatchJob({
    type: "email:batch", queryId: c.queryId, emailTemplateId: "parity-et-1", recipientQueryId: c.recipients,
    recipientEmailColumn: column, userId: ADMIN, format: c.format, reportName: "Weekly Orders",
  });
  const nodeAudit = await auditRow();
  n.stop();
  const r = await sink(++port);
  const out = spawnSync(bin, ["task", "email_batch", `query_id:${c.queryId}`, "template_id:parity-et-1",
    `recipient_query_id:${c.recipients}`, `column:${column}`, `user_id:${ADMIN}`, `format:${c.format}`, "report_name:Weekly Orders"], {
    cwd: join(import.meta.dir, ".."), encoding: "utf8",
    env: { ...process.env, SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), SMTP_SECURE: "false" },
  });
  const rust = JSON.parse(out.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  const rustAudit = await auditRow();
  r.stop();
  const [a, b] = [await messages(n.dir), await messages(r.dir)];
  const pick = (x: Record<string, unknown>) => JSON.stringify({ success: x.success, rowCount: x.rowCount, emailsSent: x.emailsSent, error: x.error });
  let problem: string | null = null;
  if (pick(node) !== pick(rust)) problem = `result\n    node: ${pick(node)}\n    rust: ${pick(rust)}`;
  else if (nodeAudit !== rustAudit) problem = `audit\n    node: ${nodeAudit}\n    rust: ${rustAudit}`;
  else {
    const i = a.findIndex((l, k) => l !== b[k]);
    if (i >= 0 || a.length !== b.length) {
      const k = i >= 0 ? i : Math.min(a.length, b.length);
      problem = `message line ${k} of ${a.length}/${b.length}\n    node: ${a[k]}\n    rust: ${b[k]}`;
    }
  }
  if (problem) {
    failed++;
    console.log(`✗ ${c.name}: ${problem}`);
  } else {
    console.log(`✓ ${c.name}: ${node.emailsSent} sent, ${a.length} message lines equal`);
  }
}
await db.end();
process.exit(failed ? 1 : 0);
