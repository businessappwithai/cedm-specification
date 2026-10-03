/**
 * `%%report` reaches the generated application.
 *
 * The defect this covers: the checker read `%%report`, held it to its shape and
 * put it in `model.reports`, and neither generator here had a case for it — so
 * a model's questions were declared, validated, and answered by nothing.
 *
 * The cases are taken from `examples/drug-discovery.eml.mmd`, the model this
 * repository is validated against, rather than from fixtures written to match
 * the parser: a fixture that matches the parser proves only that the parser
 * matches itself. The seed assertions are the other half — what the compiler
 * reads is only useful if it survives into `seed/reports.sql`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReportsSeedSql } from "../../generators/tanstack-astryx-loco/reports-seed";
import { parseModel } from "../../pipeline/parse-model";
import { type CompiledReport, compileReports, parseReportDirective } from "../index";

const MODEL_PATH = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.mmd");
const MODEL = readFileSync(MODEL_PATH, "utf8");

describe("parseReportDirective", () => {
  it("reads every key off a real directive, and keeps the SQL whole", () => {
    const line = MODEL.split("\n").find((l) =>
      l.startsWith("%%report compounds-by-registration-status")
    );
    expect(line, "the corpus model must carry this report").toBeDefined();

    const report = parseReportDirective(line as string);
    expect("error" in report).toBe(false);
    if ("error" in report) return;

    expect(report.name).toBe("compounds-by-registration-status");
    expect(report.title).toBe("Compounds by registration status");
    expect(report.entity).toBe("Compound");
    expect(report.chart).toBe("bar");
    expect(report.x).toBe("registration_status");
    expect(report.y).toBe("compounds");
    // The help sentence contains "review", and the SQL contains colons and
    // spaces. A scan that stopped at a word rather than at a key would
    // truncate the first; one that split on ":" would shred the second.
    expect(report.help).toContain("still in review");
    expect(report.sql).toMatch(/^SELECT registration_status/);
    expect(report.sql).toMatch(/ORDER BY compounds DESC$/);
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
      const parsed = parseReportDirective(`%%report r1 sql: ${sql}`);
      expect("error" in parsed, `${sql} should be refused`).toBe(true);
    }
  });

  it("treats a semicolon inside a literal as an ordinary character", () => {
    const parsed = parseReportDirective("%%report r1 sql: SELECT ';' AS sep FROM bus_compound;");
    expect("error" in parsed).toBe(false);
  });

  it("refuses a chart that names only one axis", () => {
    expect("error" in parseReportDirective("%%report r1 chart: bar x: a sql: SELECT 1")).toBe(true);
    expect(
      "error" in parseReportDirective("%%report r1 chart: donut x: a y: b sql: SELECT 1")
    ).toBe(true);
  });
});

describe("compileReports", () => {
  it("compiles every report the corpus model declares", () => {
    const declared = MODEL.split("\n").filter((line) => line.startsWith("%%report")).length;
    expect(declared).toBeGreaterThan(0);

    const reports = compileReports(MODEL, ["Compound", "DeviationReport"], () => {});
    expect(reports).toHaveLength(declared);
  });

  it("does not compile prose that merely mentions the directive", () => {
    const source = "%% a %%report directive names a question\n%%reporting is not this\n";
    expect(compileReports(source, [], () => {})).toHaveLength(0);
  });

  it("keeps a report naming an unknown entity, but drops the grouping", () => {
    const warnings: string[] = [];
    const reports = compileReports("%%report r1 entity: Ghost sql: SELECT 1", ["Compound"], (m) =>
      warnings.push(m)
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]?.entity).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });

  it("keeps the first of a duplicated name and says so", () => {
    const warnings: string[] = [];
    const reports = compileReports(
      "%%report r1 title: First sql: SELECT 1\n%%report r1 title: Second sql: SELECT 2",
      [],
      (m) => warnings.push(m)
    );
    expect(reports).toHaveLength(1);
    expect(reports[0]?.title).toBe("First");
    expect(warnings).toHaveLength(1);
  });
});

describe("the model pipeline", () => {
  it("carries the corpus model's reports through parseModel", () => {
    // The gap this closes: the directive was parsed by the checker and dropped
    // by the generator, so `ParsedModel` is where it has to arrive.
    const model = parseModel(MODEL);
    const declared = MODEL.split("\n").filter((line) => line.startsWith("%%report")).length;
    expect(model.reports).toHaveLength(declared);

    // Every entity: named by the corpus model resolves — an unresolved one
    // would be silently ungrouped, which is the failure that reads as "the
    // report list has no headings".
    for (const report of model.reports) {
      if (report.entity) {
        expect(model.entities.map((entity) => entity.name)).toContain(report.entity);
      }
    }
  });
});

describe("buildReportsSeedSql", () => {
  const reports: CompiledReport[] = compileReports(MODEL, ["Compound"], () => {});
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
    expect(empty).toContain("declares no %%report directives");
    expect(empty).not.toContain("INSERT INTO sys_report");
  });

  it("escapes a quote in a query rather than ending the literal", () => {
    const quoted = compileReports("%%report r1 sql: SELECT 1 WHERE a = 'O''Brien'", [], () => {});
    const out = buildReportsSeedSql({
      projectName: "acme",
      reports: quoted,
      tableForEntity: new Map(),
    });
    expect(out).toContain("'SELECT 1 WHERE a = ''O''''Brien'''");
  });
});
