/**
 * report:generate CSV parity: the same report through the Node worker and the
 * Rust worker, compared byte for byte. Timestamp/date/JSON columns differ by
 * design (MIGRATION_PLAN.md §9, D-3) and are reported as such.
 *
 *   bun rust/parity/report-csv.ts
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pdfText, xlsxCells } from "./compare";

const { generateReport } = await import("../../src/lib/jobs/workers/report-worker");
const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const bin = join(import.meta.dir, "..", "target", "debug", "ers-backend-cli");
let failed = 0;

for (const [reportId, knownDifference] of [
  ["parity-r-total", null],
  ["parity-r-limited", null],
  ["parity-r-orders", "D-3"],
] as const) {
  const node = await generateReport({ type: "report:generate", reportId, userId: ADMIN, format: "csv" });
  const r = spawnSync(bin, ["task", "generate_report", `report_id:${reportId}`, `user_id:${ADMIN}`, "format:csv"], {
    cwd: join(import.meta.dir, ".."),
    encoding: "utf8",
    env: { ...process.env, JOB_OUTPUT_PATH: join(process.cwd(), "job-outputs") },
  });
  const rust = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
  const a = node.outputLocation ? readFileSync(node.outputLocation, "utf8") : "";
  const b = rust.outputLocation ? readFileSync(rust.outputLocation, "utf8") : "";
  if (a === b && node.rowCount === rust.rowCount) {
    console.log(`✓ ${reportId}: ${node.rowCount} rows, ${a.length} bytes identical`);
  } else if (knownDifference) {
    const la = a.split("\n");
    const lb = b.split("\n");
    const i = la.findIndex((l, k) => l !== lb[k]);
    console.log(`~ ${reportId} (documented difference ${knownDifference}) first differing line ${i}:\n    node: ${la[i]}\n    rust: ${lb[i]}`);
  } else {
    failed++;
    console.log(`✗ ${reportId}\n  node: ${JSON.stringify(node)}\n  rust: ${JSON.stringify(rust)}\n${a.slice(0, 300)}\n---\n${b.slice(0, 300)}`);
  }
}
// xlsx and pdf: the same report through both workers, compared as files
// that cannot be byte-identical (D-22).
for (const reportId of ["parity-r-total", "parity-r-limited"]) {
  for (const format of ["xlsx", "pdf"] as const) {
    const node = await generateReport({ type: "report:generate", reportId, userId: ADMIN, format });
    const r = spawnSync(bin, ["task", "generate_report", `report_id:${reportId}`, `user_id:${ADMIN}`, `format:${format}`], {
      cwd: join(import.meta.dir, ".."),
      encoding: "utf8",
      env: { ...process.env, JOB_OUTPUT_PATH: join(process.cwd(), "job-outputs") },
    });
    const rust = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
    if (!node.outputLocation || !rust.outputLocation) {
      failed++;
      console.log(`✗ ${reportId} ${format}\n  node: ${JSON.stringify(node)}\n  rust: ${JSON.stringify(rust)}`);
      continue;
    }
    const read = async (p: string) =>
      format === "xlsx" ? xlsxCells(readFileSync(p)) : pdfText(readFileSync(p));
    const [a, b] = [await read(node.outputLocation), await read(rust.outputLocation)];
    const i = a.findIndex((l, k) => l !== b[k]);
    if (i < 0 && a.length === b.length && node.rowCount === rust.rowCount) {
      console.log(`✓ ${reportId} ${format}: ${node.rowCount} rows, ${a.length} ${format === "xlsx" ? "cells" : "strings"} equal`);
    } else {
      failed++;
      const k = i >= 0 ? i : Math.min(a.length, b.length);
      console.log(`✗ ${reportId} ${format}: item ${k} of ${a.length}/${b.length}\n    node: ${a[k]}\n    rust: ${b[k]}`);
    }
  }
}
process.exit(failed ? 1 : 0);
