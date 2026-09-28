import pkg from "node-sql-parser";

const { Parser } = pkg;

/**
 * SQL Validator with keyword allowlist/blocklist enforcement (D11)
 *
 * Validates SQL against:
 * 1. Forbidden keywords (DROP, DELETE, INSERT, etc.)
 * 2. Safe/allowed keywords only
 * 3. Basic syntax validation
 * 4. Injection pattern detection
 */

export interface SQLValidationResult {
  valid: boolean;
  errors: SQLValidationError[];
  warnings: SQLValidationWarning[];
  analysis?: {
    keywords: string[];
    hasSubquery: boolean;
    hasCTE: boolean;
    tables: string[];
  };
}

export interface SQLValidationError {
  message: string;
  severity: "error" | "critical";
  line?: number;
  column?: number;
}

export interface SQLValidationWarning {
  message: string;
  type: "security" | "performance" | "style";
}

// ALLOWED keywords (safe for SELECT queries)
const ALLOWED_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "IN",
  "LIKE",
  "ILIKE",
  "BETWEEN",
  "IS",
  "NULL",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "ON",
  "AS",
  "DISTINCT",
  "GROUP",
  "BY",
  "HAVING",
  "ORDER",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "FETCH",
  "ROWS",
  "NEXT",
  "ONLY",
  "WITH",
  "RECURSIVE",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "CAST",
  "OVER",
  "PARTITION",
  "WINDOW",
  "ROW",
  "ALL",
  "ANY",
  "EXISTS",
  "TRUE",
  "FALSE",
  "EXTRACT",
  "DATE_TRUNC",
  "NOW",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  // Aggregate functions
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "STDDEV",
  "VARIANCE",
  // String/utility functions
  "SUBSTRING",
  "LENGTH",
  "UPPER",
  "LOWER",
  "TRIM",
  "LTRIM",
  "RTRIM",
  "CONCAT",
  "COALESCE",
  "NULLIF",
  "ROUND",
  "FLOOR",
  "CEIL",
  "ABS",
]);

// FORBIDDEN keywords (hard block)
const FORBIDDEN_KEYWORDS = new Set([
  "DROP",
  "DELETE",
  "INSERT",
  "UPDATE",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "PRAGMA",
  "ATTACH",
  "DETACH",
  "GRANT",
  "REVOKE",
  "EXEC",
  "EXECUTE",
  "CALL",
  "INTO",
  "VALUES",
  "SET",
  "REPLACE",
  "UPSERT",
]);

// SQL injection patterns to detect
const INJECTION_PATTERNS = [
  /('\s*;|;.*?--)/i, // Comment escape
  /('\s*OR\s+'?\d+'?\s*=\s*'?\d+)/i, // OR 1=1
  /(-{2}.*?$)/m, // Comment injection
  /(\/\*.*?\*\/)/i, // Multiline comment
  /('.*?UNION.*?SELECT)/i, // UNION injection
  /xp_cmdshell/i, // MSSQL command exec
];

/**
 * Validate SQL with strict keyword allowlist
 */
export function validateSQLWithAllowlist(
  sql: string,
  _dialect: "postgres" | "mysql" | "sqlite" | "mssql" = "postgres"
): SQLValidationResult {
  const errors: SQLValidationError[] = [];
  const warnings: SQLValidationWarning[] = [];
  const analysis = {
    keywords: [] as string[],
    hasSubquery: false,
    hasCTE: false,
    tables: [] as string[],
  };

  // 1. Check for forbidden keywords (hard block)
  const forbiddenMatches = Array.from(FORBIDDEN_KEYWORDS).filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(sql)
  );

  for (const keyword of forbiddenMatches) {
    errors.push({
      message: `Forbidden keyword: ${keyword}. Only SELECT queries are allowed.`,
      severity: "critical",
    });
  }

  // 2. Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      errors.push({
        message: "Potential SQL injection pattern detected",
        severity: "critical",
      });
      break;
    }
  }

  // 3. Extract and validate keywords
  const keywordRegex = /\b([A-Z_]{2,})\b/gi;
  const foundKeywords = new Set<string>();

  for (
    let keywordMatch = keywordRegex.exec(sql);
    keywordMatch !== null;
    keywordMatch = keywordRegex.exec(sql)
  ) {
    const keyword = keywordMatch[1].toUpperCase();

    // Skip if already processed
    if (foundKeywords.has(keyword)) continue;
    foundKeywords.add(keyword);

    // Check if keyword is in allowlist
    if (!ALLOWED_KEYWORDS.has(keyword) && !isOperatorOrLiteral(keyword)) {
      // Could be an identifier, custom function, or unknown keyword
      // Log for analysis
      if (!/^[A-Z0-9_]+$/.test(keyword) || keyword.length > 30) {
        continue; // Probably an identifier
      }

      warnings.push({
        message: `Unknown keyword or function: ${keyword}. Verify this is a valid function or identifier.`,
        type: "style",
      });
    }

    if (ALLOWED_KEYWORDS.has(keyword)) {
      analysis.keywords.push(keyword);
    }
  }

  // 4. Check for subqueries
  analysis.hasSubquery = /\(\s*SELECT/i.test(sql);

  // 5. Check for CTEs
  analysis.hasCTE = /\bWITH\b/i.test(sql);

  // 6. Extract table names (basic regex, not perfect)
  const tableRegex = /FROM\s+([a-zA-Z_][a-zA-Z0-9_.]*)|JOIN\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi;
  for (
    let tableMatch = tableRegex.exec(sql);
    tableMatch !== null;
    tableMatch = tableRegex.exec(sql)
  ) {
    const table = (tableMatch[1] || tableMatch[2]).trim();
    if (table && !analysis.tables.includes(table)) {
      analysis.tables.push(table);
    }
  }

  // 7. Validate parentheses matching
  const parenCount = (sql.match(/\(/g) || []).length;
  const parenCloseCount = (sql.match(/\)/g) || []).length;
  if (parenCount !== parenCloseCount) {
    errors.push({
      message: "Mismatched parentheses",
      severity: "error",
    });
  }

  // 8. Performance warnings
  if (/SELECT\s+\*/i.test(sql)) {
    warnings.push({
      message: "SELECT * detected - consider selecting only needed columns",
      type: "performance",
    });
  }

  if (/SELECT\s+/i.test(sql) && !/LIMIT\s+\d+|FETCH\s+/i.test(sql)) {
    warnings.push({
      message: "Query without LIMIT - consider adding a limit for large tables",
      type: "performance",
    });
  }

  if (/LIKE\s+['"]%/i.test(sql)) {
    warnings.push({
      message: "LIKE with leading wildcard may prevent index usage",
      type: "performance",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    analysis,
  };
}

/**
 * Check if a word is an operator or literal keyword
 */
function isOperatorOrLiteral(word: string): boolean {
  const operatorsAndLiterals = ["TRUE", "FALSE", "NULL", "AND", "OR", "NOT", "IN", "LIKE"];
  return operatorsAndLiterals.includes(word);
}

/**
 * Validate that query is read-only (SELECT, WITH, EXPLAIN, SHOW, DESCRIBE)
 */
export function isReadOnlyQuery(sql: string): boolean {
  let trimmed = sql.trim();

  // Remove leading comments
  while (trimmed.startsWith("--") || trimmed.startsWith("/*")) {
    if (trimmed.startsWith("--")) {
      const newlineIdx = trimmed.indexOf("\n");
      trimmed = newlineIdx === -1 ? "" : trimmed.substring(newlineIdx + 1).trim();
    } else if (trimmed.startsWith("/*")) {
      const endIdx = trimmed.indexOf("*/");
      trimmed = endIdx === -1 ? "" : trimmed.substring(endIdx + 2).trim();
    }
  }

  const upper = trimmed.toUpperCase();
  return (
    upper.startsWith("SELECT") ||
    upper.startsWith("WITH") ||
    upper.startsWith("EXPLAIN") ||
    upper.startsWith("SHOW") ||
    upper.startsWith("DESCRIBE")
  );
}

/**
 * Every base table a statement reads, or a refusal.
 *
 * ── Why this exists beside `extractTables` ─────────────────────────────────
 *
 * `extractTables` below is a regular expression, and it is the reason the
 * data-source permission layer could be bypassed by removing a space.
 * `validateQueryAccess` treated an empty result as "no tables named, nothing to
 * check" and allowed the query — so every input the pattern failed to match
 * granted full access. All of these returned no tables at all: the table
 * wrapped in parentheses, a block comment standing in for the space after
 * FROM, and a table read through a subquery —
 *
 *     SELECT * FROM(hr_salaries)
 *     SELECT * FROM (SELECT * FROM hr_salaries) x
 *
 * and this one named the alias rather than the table behind it, so the check
 * ran against something that does not exist:
 *
 *     WITH a AS (SELECT * FROM hr_salaries) SELECT * FROM a
 *
 * Two changes follow, and the second matters more than the first:
 *
 *   - A real parse, so the shapes above resolve. `node-sql-parser` is already a
 *     dependency and already drives `validator.ts`.
 *   - **A failure to parse is a refusal, not an allowance.** That inversion is
 *     the actual fix. However good the parser, there will be a statement it
 *     cannot read, and the question "which tables does this touch?" having no
 *     answer can only mean the access decision cannot be made — which is a
 *     denial. The old code answered it with silence and read silence as yes.
 *
 * CTE names are removed from the result: they are aliases the statement defines
 * for itself, never tables a permission could be held on, and leaving them in
 * would deny every legitimate `WITH` query.
 */
export type TableExtraction = { ok: true; tables: string[] } | { ok: false; reason: string };

const PARSER_DIALECTS: Record<string, string> = {
  pg: "postgresql",
  mysql: "mysql",
  mssql: "transactsql",
};

/** Names a `WITH` clause binds, at any depth, so they can be excluded. */
function collectCteNames(node: unknown, into: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectCteNames(item, into);
    return;
  }
  const record = node as Record<string, unknown>;
  const withClause = record.with;
  if (Array.isArray(withClause)) {
    for (const cte of withClause) {
      const name = (cte as Record<string, unknown>)?.name;
      if (typeof name === "string") into.add(name.toLowerCase());
      // node-sql-parser also spells it { name: { value: "a" } }.
      const nested = (name as Record<string, unknown> | undefined)?.value;
      if (typeof nested === "string") into.add(nested.toLowerCase());
    }
  }
  for (const value of Object.values(record)) collectCteNames(value, into);
}

/**
 * Every `table` the parse tree names, at any depth.
 *
 * `parser.tableList()` is not sufficient on its own, and the case that proves
 * it is the one that motivated this whole function:
 *
 *     SELECT * FROM(hr_salaries)
 *
 * `tableList` returns nothing for that, while the AST plainly carries
 * `from[0].expr.expr[0].table === "hr_salaries"` — the list builder does not
 * descend into a parenthesised table reference. Trusting the list alone would
 * have reproduced the original bug behind a better parser: no tables found, so
 * nothing to check, so allowed.
 *
 * Walking for the `table` key catches the shapes the list misses, and the two
 * sources are unioned rather than chosen between.
 */
function collectTableNames(node: unknown, into: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectTableNames(item, into);
    return;
  }
  const record = node as Record<string, unknown>;
  const table = record.table;
  if (typeof table === "string" && table) into.add(table);
  for (const value of Object.values(record)) collectTableNames(value, into);
}

/**
 * Does any statement in this tree read from something?
 *
 * Distinguishes `SELECT 1`, which touches no data and so needs no permission,
 * from a statement carrying a FROM clause that the extractor could not resolve
 * to a name — which is an unanswered access question, and therefore a refusal.
 */
function hasFromClause(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) return node.some(hasFromClause);
  const record = node as Record<string, unknown>;
  if (record.from !== null && record.from !== undefined) {
    if (!Array.isArray(record.from) || record.from.length > 0) return true;
  }
  return Object.values(record).some(hasFromClause);
}

export function extractTablesStrict(sql: string, dialect: string = "pg"): TableExtraction {
  if (!sql?.trim()) return { ok: false, reason: "empty query" };

  let ast: unknown;
  let tableList: string[];
  try {
    const parser = new Parser();
    const database = PARSER_DIALECTS[dialect] ?? "postgresql";
    ast = parser.astify(sql, { database });
    tableList = parser.tableList(sql, { database }) as string[];
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "could not be parsed",
    };
  }

  const cteNames = new Set<string>();
  collectCteNames(ast, cteNames);

  const found = new Set<string>();
  for (const entry of tableList) {
    // `type::db::table`
    const parts = entry.split("::");
    const name = parts[parts.length - 1];
    if (name && name !== "null") found.add(name);
  }
  collectTableNames(ast, found);

  const tables: string[] = [];
  for (const name of found) {
    if (cteNames.has(name.toLowerCase())) continue;
    tables.push(name);
  }

  // A FROM clause that resolved to no name is an unanswered question, and an
  // unanswered access question is a denial — the same rule as a failed parse.
  if (tables.length === 0 && hasFromClause(ast)) {
    return { ok: false, reason: "reads from a source this analyser could not identify" };
  }

  return { ok: true, tables };
}

/**
 * Extract table names from SQL
 *
 * @deprecated For display only. This is a regular expression and it misses
 * table references that a database resolves perfectly well — see
 * `extractTablesStrict` above, which is what an access decision must use.
 */
export function extractTables(sql: string): string[] {
  const tables: string[] = [];
  const regex =
    /(?:FROM|JOIN)\s+([`"]?[a-zA-Z_][a-zA-Z0-9_.$]*[`"]?)(?:\s|$|,|JOIN|WHERE|GROUP|ORDER|LIMIT)/gi;

  for (let tableMatch = regex.exec(sql); tableMatch !== null; tableMatch = regex.exec(sql)) {
    const table = tableMatch[1].replace(/[`"]/g, "").trim();
    if (table && !tables.includes(table)) {
      tables.push(table);
    }
  }

  return tables;
}

/**
 * Extract column names from SQL (basic)
 */
export function extractColumns(sql: string): string[] {
  const columns: string[] = [];

  // Extract from SELECT clause (handles newlines and extra spaces)
  const selectMatch = sql.match(/SELECT\s+(DISTINCT\s+)?(.+?)(?:\bFROM\b|$)/is);
  if (selectMatch) {
    const selectPart = selectMatch[2];
    // Split by comma, then extract column names
    const items = selectPart.split(",");

    for (const item of items) {
      // Extract identifier before AS or whitespace
      const colMatch = item.match(/^\s*(\w+(?:\.\w+)?)/);
      if (colMatch) {
        const col = colMatch[1];
        if (
          col !== "*" &&
          col !== "DISTINCT" &&
          !isAggregateFunctionName(col) &&
          !columns.includes(col)
        ) {
          columns.push(col);
        }
      }
    }
  }

  return columns;
}

/**
 * Check if word is an aggregate function name
 */
function isAggregateFunctionName(word: string): boolean {
  const aggregates = [
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "STDDEV",
    "VARIANCE",
    "SUBSTRING",
    "UPPER",
    "LOWER",
    "TRIM",
    "LENGTH",
    "COALESCE",
    "NULLIF",
  ];
  return aggregates.includes(word.toUpperCase());
}
