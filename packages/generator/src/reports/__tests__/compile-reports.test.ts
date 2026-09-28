/**
 * The model's `reports` reach the generated application.
 *
 * The defect this covers: the checker read the model's reports, held each to
 * its shape and put it in `model.reports`, and neither generator here had a
 * case for it — so a model's questions were declared, validated, and answered
 * by nothing.
 *
 * The cases are taken from `examples/drug-discovery.eml.yaml`, the model this
 * repository is validated against, rather than from fixtures written to match
 * the compiler: a fixture that matches the compiler proves only that the
 * compiler matches itself. The seed assertions are the other half — what the
 * compiler reads is only useful if it survives into `seed/reports.sql`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { buildReportsSeedSql } from "../../generators/tanstack-astryx-loco/reports-seed";
import { compileYaml } from "../../model/__tests__/compile-yaml";
import type { ReportDeclaration } from "../../model/records";
import {
  type CompiledReport,
  compileReportDeclarations,
  validateReportDeclaration,
} from "../index";

const MODEL_PATH = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.yaml");
const MODEL = readFileSync(MODEL_PATH, "utf8");
const DECLARED = (parseYaml(MODEL) as { reports: ReportDeclaration[] }).reports;

const report = (sql: string, extra: Partial<ReportDeclaration> = {}): ReportDeclaration => ({
  name: "r1",
  sql,
  ...extra,
});

describe("validateReportDeclaration", () => {
  it("keeps every key of a real declaration, and the SQL whole", () => {
    const declared = DECLARED.find((r) => r.name === "compounds-by-registration-status");
    expect(declared, "the corpus model must carry this report").toBeDefined();

    const compiled = validateReportDeclaration(declared as ReportDeclaration);
    expect("error" in compiled).toBe(false);
    if ("error" in compiled) return;

    expect(compiled.name).toBe("compounds-by-registration-status");
    expect(compiled.title).toBe("Compounds by registration status");
    expect(compiled.entity).toBe("Compound");
    expect(compiled.chart).toBe("bar");
    expect(compiled.x).toBe("registration_status");
    expect(compiled.y).toBe("compounds");
    expect(compiled.help).toContain("still in review");
    expect(compiled.sql).toMatch(/^SELECT registration_status/);
    expect(compiled.sql).toMatch(/ORDER BY compounds DESC$/);
  });

  it("refuses anything that is not a single read", () => {
    // The checker refuses these at authoring time (EML293). This is the second
    // guard, and it is what stops a write reaching a seed file at all.
    for (const sql of [
      "DELETE FROM bus_compound",
      "UPDATE bus_compound SET formula = 'x'",
      "INSERT INTO bus_compound (id) VALUES ('1')",
      "SELECT 1; DROP TABLE bus_compound",
      // Not a SELECT — a function whose name merely begins with one.
      "selection_of(1)",
    ]) {
      expect("error" in validateReportDeclaration(report(sql)), `${sql} should be refused`).toBe(
        true
      );
    }
  });

  it("treats a semicolon inside a literal as an ordinary character", () => {
    const compiled = validateReportDeclaration(report("SELECT ';' AS sep FROM bus_compound;"));
    expect("error" in compiled).toBe(false);
  });

  it("refuses a chart that names only one axis, or a chart it does not know", () => {
    expect("error" in validateReportDeclaration(report("SELECT 1", { chart: "bar", x: "a" }))).toBe(
      true
    );
    expect(
      "error" in validateReportDeclaration(report("SELECT 1", { chart: "donut", x: "a", y: "b" }))
    ).toBe(true);
  });

  it("titles a report from its name when the model gives no title", () => {
    const compiled = validateReportDeclaration(report("SELECT 1", { name: "open_by-site" }));
    expect("error" in compiled ? compiled.error : compiled.title).toBe("open by site");
  });
});

describe("compileReportDeclarations", () => {
  it("compiles every report the corpus model declares", () => {
    expect(DECLARED.length).toBeGreaterThan(0);
    const reports = compileReportDeclarations(DECLARED, ["Compound", "DeviationReport"]);
    expect(reports).toHaveLength(DECLARED.length);
  });

  it("keeps a report naming an unknown entity, but drops the grouping", () => {
    const warnings: string[] = [];
    const reports = compileReportDeclarations(
      [report("SELECT 1", { entity: "Ghost" })],
      ["Compound"],
      (m) => warnings.push(m)
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]?.entity).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });

  it("keeps the first of a duplicated name and says so", () => {
    const warnings: string[] = [];
    const reports = compileReportDeclarations(
      [report("SELECT 1", { title: "First" }), report("SELECT 2", { title: "Second" })],
      [],
      (m) => warnings.push(m)
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]?.title).toBe("First");
    expect(warnings).toHaveLength(1);
  });

  it("skips a report that is not a single read, and says so", () => {
    const warnings: string[] = [];
    const reports = compileReportDeclarations([report("DELETE FROM bus_compound")], [], (m) =>
      warnings.push(m)
    );
    expect(reports).toHaveLength(0);
    expect(warnings[0]).toMatch(/report r1 sql: is not a SELECT/);
  });
});

describe("the model compiler", () => {
  it("carries the corpus model's reports into the compiled model", () => {
    const model = compileYaml(MODEL);
    expect(model.reports).toHaveLength(DECLARED.length);

    // Every entity a report names resolves — an unresolved one would be
    // silently ungrouped, which is the failure that reads as "the report list
    // has no headings".
    for (const compiled of model.reports) {
      if (compiled.entity) {
        expect(model.entities.map((entity) => entity.name)).toContain(compiled.entity);
      }
    }
  });
});

describe("buildReportsSeedSql", () => {
  const reports: CompiledReport[] = compileReportDeclarations(DECLARED, ["Compound"]);
  const tableForEntity = new Map([["Compound", "bus_compound"]]);
  const sql = buildReportsSeedSql({ projectName: "acme", reports, tableForEntity });

  it("writes one re-runnable statement per report", () => {
    const inserts = sql.match(/INSERT INTO sys_report/g) ?? [];
    expect(inserts).toHaveLength(reports.length);
    const guarded = sql.split("\n").filter((line) => line.trim() === "ON CONFLICT DO NOTHING;");
    expect(guarded).toHaveLength(inserts.length);
  });

  it("resolves an entity to the table it became", () => {
    expect(sql).toContain("'Compound', 'bus_compound'");
  });

  it("is stable across runs and scoped to the project", () => {
    expect(buildReportsSeedSql({ projectName: "acme", reports, tableForEntity })).toBe(sql);
    expect(buildReportsSeedSql({ projectName: "other", reports, tableForEntity })).not.toBe(sql);
  });

  it("still writes a file for a model that declares no reports", () => {
    // `src/tasks/seed_reports.rs` embeds it with `include_str!`, so a crate
    // emitted without it does not compile — and the parity gate cannot see
    // that, because both generators would emit the same nothing.
    const empty = buildReportsSeedSql({
      projectName: "acme",
      reports: [],
      tableForEntity: new Map(),
    });
    expect(empty).toContain("declares no reports");
    expect(empty).not.toContain("INSERT INTO sys_report");
  });

  it("escapes a quote in a query rather than ending the literal", () => {
    const quoted = compileReportDeclarations([report("SELECT 1 WHERE a = 'O''Brien'")], []);
    const out = buildReportsSeedSql({
      projectName: "acme",
      reports: quoted,
      tableForEntity: new Map(),
    });
    expect(out).toContain("'SELECT 1 WHERE a = ''O''''Brien'''");
  });
});
