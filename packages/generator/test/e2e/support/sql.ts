/**
 * A very small reader for the SQL the generator emits.
 *
 * Not a SQL parser — it understands exactly the shape the seed builders write:
 * `INSERT INTO <table> (<columns>) VALUES (<values>) ON CONFLICT ...;`, one
 * statement per `;` at end of line. That is enough to assert row counts,
 * referential integrity *within the file*, and that every id is the
 * deterministic UUIDv5 the seed promises — none of which needs a database.
 *
 * The one subtlety is quoting: a BPMN document or a JDM graph is a single
 * quoted value full of commas, parentheses and `''` escapes, so values are
 * split by a scanner that tracks quote state rather than by `split(",")`.
 */

export interface InsertStatement {
  table: string;
  columns: string[];
  /** Raw SQL literals, in `columns` order — `'x'`, `NULL`, `TRUE`, `10`. */
  values: string[];
  /** Whether the statement is idempotent. */
  onConflict: boolean;
  row: Record<string, string>;
}

/** Every `INSERT` in a seed file, in file order. */
export function parseInserts(sql: string): InsertStatement[] {
  const statements: InsertStatement[] = [];
  const pattern = /INSERT INTO\s+(\w+)\s*\(([^)]*)\)\s*\n?VALUES\s*\(/g;
  for (let match = pattern.exec(sql); match !== null; match = pattern.exec(sql)) {
    const table = match[1] as string;
    const columns = (match[2] as string).split(",").map((c) => c.trim());
    const { values, end } = readTuple(sql, pattern.lastIndex);
    const tail = sql.slice(end, sql.indexOf(";", end) + 1);
    const row: Record<string, string> = {};
    columns.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });
    statements.push({ table, columns, values, onConflict: /ON CONFLICT/i.test(tail), row });
    pattern.lastIndex = end;
  }
  return statements;
}

/** Read a parenthesised, comma-separated tuple starting just after its `(`. */
function readTuple(sql: string, start: number): { values: string[]; end: number } {
  const values: string[] = [];
  let current = "";
  let depth = 0;
  let quoted = false;
  let i = start;
  for (; i < sql.length; i++) {
    const ch = sql[i] as string;
    if (quoted) {
      if (ch === "'") {
        // `''` is an escaped quote, not the end of the literal.
        if (sql[i + 1] === "'") {
          current += "''";
          i++;
          continue;
        }
        quoted = false;
      }
      current += ch;
      continue;
    }
    if (ch === "'") {
      quoted = true;
      current += ch;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") {
      if (depth === 0) {
        values.push(current.trim());
        return { values, end: i + 1 };
      }
      depth--;
    }
    if (ch === "," && depth === 0) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current.trim());
  return { values, end: i };
}

/** The text of a SQL string literal, or `undefined` for `NULL`. */
export function text(literal: string | undefined): string | undefined {
  if (literal === undefined || literal.toUpperCase() === "NULL") return undefined;
  if (!literal.startsWith("'")) return literal;
  return literal.slice(1, -1).replace(/''/g, "'");
}

/** Statements inserting into one table, in file order. */
export function rowsOf(statements: InsertStatement[], table: string): InsertStatement[] {
  return statements.filter((s) => s.table === table);
}

/** A version-5 UUID — what the deterministic dictionary ids must all be. */
export const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
