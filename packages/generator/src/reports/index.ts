/**
 * `%%report` directives → the reports a generated application ships with.
 *
 * `%%report` is the directive this repository parsed and then dropped. The
 * checker reads it (`language/checker.ts`), holds it to its shape — EML290 to
 * EML296 — and puts it in `model.reports`; neither generator here had a case
 * for it, so a model carrying reports produced an application with none, byte
 * for byte the application it would have produced with the directives deleted.
 * The questions were declared, validated, and then answered by nothing.
 *
 * Two other readers compile the same directive. `app-and-report-with-ai-tanstack`
 * turns each one into a saved query, a report definition and, where `chart:` is
 * set, a chart in the Enterprise Reporting platform — a separate product with
 * its own database, reached through its own compose file. `app-with-ai-tanstack`
 * carries them into the NestJS application it generates. This is the third
 * reading and the same one as the second: the model's own questions, answered
 * against the generated application's own database, served by the Loco backend
 * at `/api/reports`. All three come from one directive, so a model written for
 * any of them is already written for the others.
 *
 * Nothing here invents a report. A model that declares none generates an
 * application whose reports list is empty, and says so.
 *
 * The Rust mirror is `crates/appwithai-gen/src/reports.rs`, and the two must
 * agree; `bun run parity` is what says they do.
 */

/** The chart types `%%report chart:` may name. Mirrors `appwithai-language.json`. */
import type { ReportDeclaration } from "../model/records";

export const REPORT_CHART_TYPES = ["bar", "line", "pie", "area"] as const;

export type ReportChartType = (typeof REPORT_CHART_TYPES)[number];

const CHART_TYPE_SET: ReadonlySet<string> = new Set(REPORT_CHART_TYPES);

/** One `%%report`, as the generated application will store it. */
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
 * The keys `%%report` understands, in the order a value scan has to stop at.
 *
 * `sql:` is deliberately absent: it is split off the line first, because SQL
 * contains both spaces and colons and a key/value scan would shred it.
 */
const KEYS = ["title", "entity", "chart", "x", "y", "help"] as const;

/**
 * A report may only read.
 *
 * The query is authored in the model and run, verbatim, against the generated
 * application's own database — so the directive is an execution path from a
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
 * Read one `%%report` line.
 *
 * Exported for the tests, which assert the reading against lines taken from the
 * published models rather than against a fixture written to match this code.
 */
export function parseReportDirective(line: string): CompiledReport | { error: string } {
  const declaration = readReportDeclaration(line);
  return "error" in declaration ? declaration : validateReportDeclaration(declaration);
}

/**
 * Read one `%%report` line into a declaration, checking only its shape: that it
 * is the directive, and that it has a name and a `sql:` clause. What the query
 * may do is `validateReportDeclaration`'s question.
 */
export function readReportDeclaration(line: string): ReportDeclaration | { error: string } {
  // Anchored, and a run of `%%` is allowed for the same reason `hooks/index.ts`
  // allows it: older generated flowcharts emitted `%%%%`. A `%%` line that
  // merely mentions a report in prose is prose — see CLAUDE.md, "Every
  // directive parser anchors at ^%%".
  const directive = line.trim().match(/^%%+report\s+(.+)$/is);
  if (!directive?.[1]) return { error: "not a %%report directive" };
  const rest = directive[1];

  const split = rest.match(/^(.*?)\bsql:\s*(.+)$/is);
  if (!split?.[2]) return { error: "has no sql: clause" };
  const head = split[1] ?? "";
  const sql = split[2].trim();

  const nameMatch = head.match(/^([A-Za-z_][\w-]*)\s*/);
  if (!nameMatch?.[1]) return { error: "has no name" };
  const name = nameMatch[1];
  const keys = head.slice(nameMatch[0].length);

  // Each value runs to the next key or the end of the head. Written as one
  // lookahead over the whole key set so that `help:` — which is a sentence and
  // may contain any of the other words — stops only at a real key.
  const read = (key: string): string | undefined => {
    const stop = KEYS.join("|");
    const found = keys.match(new RegExp(`\\b${key}:\\s*(.*?)(?=\\s+(?:${stop}):|$)`, "is"));
    return found?.[1]?.trim() || undefined;
  };

  const declaration: ReportDeclaration = { name, sql };
  for (const key of KEYS) {
    const value = read(key);
    if (value !== undefined) declaration[key] = value;
  }
  return declaration;
}

/**
 * Hold a report declaration to its shape: a single read, and a chart only with
 * both of its axes. The same checks for a report written in either syntax.
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
 * Compile every `%%report` line in a model into the reports the generated
 * application ships with. A line that is not a single read is refused here,
 * before it can reach a seed file.
 */
export function compileReports(
  source: string,
  entityNames: string[],
  warn: (message: string) => void = () => {}
): CompiledReport[] {
  const accumulator = reportAccumulator(entityNames, warn);

  for (const line of source.split("\n")) {
    if (!/^\s*%%+report\b/i.test(line)) continue;

    const declaration = readReportDeclaration(line);
    if ("error" in declaration) {
      warn(`%%report ${declaration.error} — skipped: ${line.trim().slice(0, 120)}`);
      continue;
    }
    accumulator.add(declaration, line.trim().slice(0, 120));
  }

  return accumulator.reports();
}

/** Every `%%report` line in a model, read but not validated — the reports it declares. */
export function readReportDirectives(
  source: string,
  warn: (message: string) => void = () => {}
): ReportDeclaration[] {
  const declarations: ReportDeclaration[] = [];
  for (const line of source.split("\n")) {
    if (!/^\s*%%+report\b/i.test(line)) continue;
    const declaration = readReportDeclaration(line);
    if ("error" in declaration) {
      warn(`%%report ${declaration.error} — skipped: ${line.trim().slice(0, 120)}`);
      continue;
    }
    declarations.push(declaration);
  }
  return declarations;
}

/** Compile report declarations read from either syntax. */
export function compileReportDeclarations(
  declarations: ReportDeclaration[],
  entityNames: string[],
  warn: (message: string) => void = () => {}
): CompiledReport[] {
  const accumulator = reportAccumulator(entityNames, warn);
  for (const declaration of declarations) accumulator.add(declaration, `report ${declaration.name}`);
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
        warn(`%%report ${parsed.error} — skipped: ${context}`);
        return;
      }

      // The checker reports a duplicate name as EML292. Reaching here with one
      // means the model was not checked, and two rows under one key would make
      // whichever the seed wrote last the only one anybody could open.
      if (byName.has(parsed.name)) {
        warn(`%%report "${parsed.name}" is declared more than once — keeping the first`);
        return;
      }

      if (parsed.entity && !known.has(parsed.entity)) {
        warn(
          `%%report "${parsed.name}" names entity "${parsed.entity}", which the model does not declare — ungrouped`
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
