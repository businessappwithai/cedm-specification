/**
 * `POST /api/reports/:id/export` parity, every format, both backends.
 *
 *   NODE_URL=… RUST_URL=… DATABASE_URL=… bun rust/parity/report-export.ts
 *
 * CSV must be byte-identical and HTML identical apart from the export time.
 * XLSX and PDF cannot be (exceljs and jsPDF embed creation times and their
 * own producer strings; MIGRATION_PLAN.md §9, D-22), so an XLSX is compared
 * cell by cell — value, font colour and weight, fill, column width — and a
 * PDF by the text it draws, in order. Timestamp/JSON cells differ by design
 * (D-3) and are reported as such. Uses the session cache run.ts writes.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { pdfText, xlsxCells } from "./compare";

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

const now = "2026-09-23T10:00:00.000Z";
const theme = JSON.stringify({
  headerBackgroundColor: "#1e293b",
  headerTextColor: "#fff",
  headerFontWeight: "bold",
  rowBackgroundColor: "#ffffff",
  rowTextColor: "#334155",
  alternatingRowBackgroundColor: "#f1f5f9",
  alternatingRowTextColor: "#0f172a",
  borderColor: "#cbd5e1",
});
const columns = JSON.stringify([
  { field: "customer", header: "Customer", visible: true },
  { field: "amount", header: "Amount, EUR", visible: true },
  { field: "qty", header: "Qty", visible: false },
  { field: "paid", header: "Paid", visible: true },
  { field: "note", header: "Note", visible: true },
]);
await db.query(
  `INSERT INTO saved_queries (id, name, data_source_id, sql_content, created_by, created_at, updated_at)
   VALUES ('parity-q-export', 'parity-q-export', 'parity-ds',
           'SELECT id, customer, amount, qty, paid, CASE WHEN id % 7 = 0 THEN ''has "quotes", commas'' END AS note FROM orders ORDER BY id;',
           $1, $2, $2)
   ON CONFLICT (id) DO UPDATE SET sql_content = EXCLUDED.sql_content`,
  [ADMIN, now]
);
for (const [id, cfg, colorTheme, template, formats] of [
  ["parity-r-export-themed", columns, theme, '{"field1":"customer"}', null],
  ["parity-r-export-plain", "[]", null, null, '["csv","pdf","xlsx","html"]'],
  ["parity-r-export-csv-only", "[]", null, null, '{"xlsx":false,"pdf":false}'],
] as const) {
  await db.query(
    `INSERT INTO report_definitions (id, name, saved_query_id, column_config, color_theme, filename_template, export_formats, created_by, created_at, updated_at)
     VALUES ($1, $1, 'parity-q-export', $2, $3, $4, $5, $6, $7, $7)
     ON CONFLICT (id) DO UPDATE SET column_config = EXCLUDED.column_config, color_theme = EXCLUDED.color_theme,
       filename_template = EXCLUDED.filename_template, export_formats = EXCLUDED.export_formats`,
    [id, cfg, colorTheme, template, formats, ADMIN, now]
  );
}

type Got = { status: number; type: string | null; disposition: string | null; bytes: Buffer };
async function post(base: string, id: string, body: unknown, as = "admin"): Promise<Got> {
  const res = await fetch(`${base}/api/reports/${id}/export`, {
    method: "POST",
    headers: { cookie: cookies[as] ?? "", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    type: res.headers.get("content-type"),
    disposition: res.headers.get("content-disposition"),
    bytes: Buffer.from(await res.arrayBuffer()),
  };
}

let failed = 0;
let documented = 0;
const cases: [string, string, unknown, string?, string?][] = [
  ["themed csv", "parity-r-export-themed", { format: "csv" }],
  ["themed xlsx", "parity-r-export-themed", { format: "xlsx" }],
  ["themed pdf", "parity-r-export-themed", { format: "pdf" }],
  ["themed html", "parity-r-export-themed", { format: "html" }],
  ["plain csv (default format)", "parity-r-export-plain", {}],
  ["plain xlsx", "parity-r-export-plain", { format: "xlsx" }],
  ["plain pdf", "parity-r-export-plain", { format: "pdf" }],
  ["format not enabled", "parity-r-export-csv-only", { format: "xlsx" }],
  ["unknown format", "parity-r-export-plain", { format: "docx" }],
  ["unknown report", "parity-nope", { format: "csv" }],
  ["timestamps and JSON (D-3)", "parity-r-orders", { format: "csv" }, "admin", "D-3"],
  ["denied table, as analyst", "parity-r-nospace", { format: "csv" }, "analyst", "D-4"],
  ["unauthenticated", "parity-r-export-plain", { format: "csv" }, "none"],
];
for (const [name, id, body, as = "admin", known] of cases) {
  const [n, r] = [await post(NODE_URL, id, body, as), await post(RUST_URL, id, body, as)];
  let problem: string | null = null;
  if (n.status !== r.status) problem = `status node=${n.status} rust=${r.status}`;
  else if (n.type !== r.type) problem = `content-type node=${n.type} rust=${r.type}`;
  else if (n.disposition !== r.disposition) problem = `disposition node=${n.disposition} rust=${r.disposition}`;
  else {
    const type = n.type ?? "";
    let a: string[];
    let b: string[];
    if (type.includes("spreadsheetml")) [a, b] = [await xlsxCells(n.bytes), await xlsxCells(r.bytes)];
    else if (type.includes("pdf")) [a, b] = [pdfText(n.bytes), pdfText(r.bytes)];
    else {
      const strip = (x: Buffer) =>
        x.toString("utf8").replace(/<strong>Exported:<\/strong> [^<]*/, "<strong>Exported:</strong> T").split("\n");
      [a, b] = [strip(n.bytes), strip(r.bytes)];
    }
    const i = a.findIndex((l, k) => l !== b[k]);
    if (i >= 0 || a.length !== b.length) {
      const k = i >= 0 ? i : Math.min(a.length, b.length);
      problem = `item ${k} of ${a.length}/${b.length}\n    node: ${a[k]}\n    rust: ${b[k]}`;
    }
  }
  if (problem && known) {
    documented++;
    console.log(`~ ${name} (documented difference ${known}): ${problem}`);
  } else if (problem) {
    failed++;
    console.log(`✗ ${name}: ${problem}`);
  } else {
    console.log(`✓ ${name}${n.type ? `  (${n.type}, ${n.bytes.length}/${r.bytes.length} bytes)` : ""}`);
  }
}
console.log(`\n${cases.length - failed - documented}/${cases.length} equivalent, ${documented} documented, ${failed} failure(s)`);
await db.end();
process.exit(failed ? 1 : 0);
