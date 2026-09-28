/**
 * A model's `reports` → the reports a generated application ships with.
 *
 * Reports were once validated by the checker and then answered by nothing:
 * neither generator compiled them, so a model carrying reports produced an
 * application with none. Each report is the model's own question, answered
 * against the generated application's own database and served by the Loco
 * backend at `/api/reports`.
 *
 * Nothing here invents a report. A model that declares none generates an
 * application whose reports list is empty, and says so.
 *
 * The Rust mirror is `crates/appwithai-gen/src/reports.rs`, and the two must
 * agree; `bun run parity` is what says they do.
 */

import type { ReportDeclaration } from "../model/records";

/** The chart types a report may name. Mirrors `appwithai-language.json`. */
export const REPORT_CHART_TYPES = ["bar", "line", "pie", "area"] as const;

export type ReportChartType = (typeof REPORT_CHART_TYPES)[number];

const CHART_TYPE_SET: ReadonlySet<string> = new Set(REPORT_CHART_TYPES);

/** One report, as the generated application will store it. */
export interface CompiledReport {
  /** Stable identifier — unique across the model, and the row's key. */
  name: string;
  /** What the report is called on screen. */
  title: string;
  /** The entity it is mainly about, when it is about one. Groups the list. */
  entity?: string;
  /** Absent means a table; present means a chart of this type beside it. */
  chart?: ReportChartType;
  /** Result columns the chart plots. Both required when `chart` is set. */
  x?: string;
  y?: string;
  /** Who asks this question and why — shown as the report's description. */
  help?: string;
  /** The query, exactly as it will be run. */
  sql: string;
}

/**
 * A report may only read.
 *
 * The query is authored in the model and run, verbatim, against the generated
 * application's own database — so a report is an execution path from a
 * document into SQL. The checker rejects a write at authoring time (`EML293`),
 * but a checker runs where the author is and this runs where the generator is:
 * a model that reached the generator without being checked, or one edited after
 * it was, would otherwise arrive here with `DELETE` in it.
 *
 * Refusing at compile time means the statement never reaches a seed file, so
 * there is nothing for the generated application to run even if its own guard
 * were wrong. The generated reader refuses again at query time; this is the
 * first of the two, not the only one.
 */
const READ_ONLY = /^\s*(?:with|select)\b/i;

/**
 * A statement separator outside of quotes — the way a `SELECT` smuggles a write.
 *
 * `SELECT 1; DROP TABLE bus_account` passes `READ_ONLY` and is not one query.
 * Semicolons *inside* string literals are ordinary characters, so the scan
 * tracks quoting rather than searching for the byte, and a single trailing
 * semicolon is allowed because it is how most people end a statement.
 */
function hasStatementBreak(sql: string): boolean {
  const body = sql.replace(/;\s*$/, "");
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      // Doubling is how both SQL quote styles escape themselves.
      if (ch === quote) {
        if (body[i + 1] === quote) i += 1;
        else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === ";") return true;
  }
  return false;
}

/**
 * Hold a report declaration to its shape: a single read, and a chart only with
 * both of its axes.
 */
export function validateReportDeclaration(
  declaration: ReportDeclaration
): CompiledReport | { error: string } {
  const { name, sql } = declaration;

  if (!READ_ONLY.test(sql)) return { error: `sql: is not a SELECT or WITH query` };
  if (hasStatementBreak(sql)) return { error: `sql: contains more than one statement` };

  const chartRaw = declaration.chart;
  if (chartRaw && !CHART_TYPE_SET.has(chartRaw)) {
    return { error: `has unknown chart type "${chartRaw}"` };
  }
  const chart = chartRaw as ReportChartType | undefined;
  const x = declaration.x;
  const y = declaration.y;
  if (chart && (!x || !y)) {
    return { error: `declares chart: ${chart} but not both x: and y:` };
  }

  return {
    name,
    title: declaration.title ?? name.replace(/[_-]+/g, " "),
    entity: declaration.entity,
    chart,
    x,
    y,
    help: declaration.help,
    sql,
  };
}

/**
 * Compile a model's reports into the reports the generated application ships
 * with. One that is not a single read is refused here, before it can reach a
 * seed file.
 */
export function compileReportDeclarations(
  declarations: ReportDeclaration[],
  entityNames: string[],
  warn: (message: string) => void = () => {}
): CompiledReport[] {
  const accumulator = reportAccumulator(entityNames, warn);
  for (const declaration of declarations)
    accumulator.add(declaration, `report ${declaration.name}`);
  return accumulator.reports();
}

/**
 * The per-report checks, applied in declaration order: validate, refuse a
 * duplicate name, and ungroup a report naming an entity the model lacks.
 */
function reportAccumulator(entityNames: string[], warn: (message: string) => void) {
  const known = new Set(entityNames);
  const byName = new Map<string, CompiledReport>();

  return {
    add(declaration: ReportDeclaration, context: string): void {
      const parsed = validateReportDeclaration(declaration);
      if ("error" in parsed) {
        warn(`${context} ${parsed.error} — skipped`);
        return;
      }

      // The checker reports a duplicate name as EML292. Reaching here with one
      // means the model was not checked, and two rows under one key would make
      // whichever the seed wrote last the only one anybody could open.
      if (byName.has(parsed.name)) {
        warn(`report "${parsed.name}" is declared more than once — keeping the first`);
        return;
      }

      if (parsed.entity && !known.has(parsed.entity)) {
        warn(
          `report "${parsed.name}" names entity "${parsed.entity}", which the model does not declare — ungrouped`
        );
        parsed.entity = undefined;
      }

      byName.set(parsed.name, parsed);
    },
    reports(): CompiledReport[] {
      return [...byName.values()];
    },
  };
}
