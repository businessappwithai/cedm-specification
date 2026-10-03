/**
 * One gate for "may this caller run this stored SQL, and is it safe to run?"
 *
 * ── Why this is a module rather than two calls at each site ────────────────
 *
 * A security review found that of the paths in this application that execute
 * SQL, only two asked whether the caller may read the tables involved:
 * `/api/sql/execute` and the NL-query pipeline. The report, chart, export and
 * saved-query routes each resolved a definition by id and ran its SQL behind a
 * session check alone — so any signed-in user could read any report's data by
 * naming its id, whatever `ds_entity_permissions` said.
 *
 * `CLAUDE.md` stated that every path executing SQL gates on
 * `validateQueryAccess`, and it was not true. That gap is the thing this file
 * exists to close: not because the check was missing — it was written, and it
 * was good — but because reaching it was left to each route to remember, and
 * four of them did not.
 *
 * So the two questions are asked together, once, and a new route that runs
 * stored SQL has one obvious thing to call.
 *
 * ── The two questions, and why both are asked at run time ──────────────────
 *
 *   read-only   `sql_content` is an ordinary column. Rows predate the
 *               validation now applied when a query is saved, and something
 *               other than these routes may have written one.
 *   access      Permissions change between saving a query and running it, and
 *               the person running one is frequently not the person who saved
 *               it. A query saved by someone who could read a table must not
 *               keep reading it for someone who cannot.
 */

import { validateQueryAccess } from "@/lib/permissions/query-access-validator";
import { isReadOnlyQuery } from "@/lib/sql/validator";
import type { SessionUser } from "@/lib/auth/session";
import type { User } from "@/types/database";

export interface QueryRunRefusal {
  status: 403;
  code: "FORBIDDEN";
  message: string;
}

export type QueryRunDecision = { ok: true } | ({ ok: false } & QueryRunRefusal);

/**
 * Decide whether `sqlContent` may be executed for `user` against `dataSourceId`.
 *
 * Returns a refusal rather than throwing or writing a response, so the caller
 * keeps control of its own response shape — the routes in this application do
 * not all use the same one.
 */
export async function decideQueryRun(
  user: SessionUser,
  sqlContent: string,
  dataSourceId: string
): Promise<QueryRunDecision> {
  if (!sqlContent?.trim()) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "This query is empty and was not run.",
    };
  }

  if (!isReadOnlyQuery(sqlContent)) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "This query is not a single read-only statement and was not run.",
    };
  }

  const access = await validateQueryAccess(user as unknown as User, sqlContent, dataSourceId);
  if (!access.allowed) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: access.reason || "You do not have access to every table in this query",
    };
  }

  return { ok: true };
}
