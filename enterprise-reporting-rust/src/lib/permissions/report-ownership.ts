/**
 * May this caller change how a report is configured?
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * The routes under `/api/reports/:id/filters` authenticated their caller and
 * then stopped asking questions. Every one of them resolved the report by id
 * alone, so any signed-in user could attach a filter to **anybody's** report,
 * rewrite one, or delete every filter on it with a single DELETE.
 *
 * That is not a read of somebody else's data, which is what the rest of this
 * review was mostly about — it is an unauthorized write to their configuration.
 * A filter decides which rows a report returns, so changing one silently
 * changes what its readers see, and deleting them all widens a report that was
 * deliberately narrowed.
 *
 * ── The rule ───────────────────────────────────────────────────────────────
 *
 * The report's creator, or an administrator. `report_definitions.created_by` is
 * nullable — rows predate the column — and a report nobody owns is treated as
 * administrator-only rather than as everybody's, because the alternative is the
 * behaviour this replaces.
 */

import { getDb } from "@/lib/db/config";
import { isAdmin } from "@/lib/permissions/permissions";

export interface ReportWriteDecision {
  allowed: boolean;
  status?: 403 | 404;
  message?: string;
}

export async function canConfigureReport(
  userId: string,
  reportId: string
): Promise<ReportWriteDecision> {
  const db = getDb();

  const report = await db
    .selectFrom("report_definitions")
    .select(["id", "created_by"])
    .where("id", "=", reportId)
    .executeTakeFirst();

  if (!report) {
    return { allowed: false, status: 404, message: "Report not found" };
  }

  if (report.created_by && report.created_by === userId) {
    return { allowed: true };
  }

  if (await isAdmin(userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    status: 403,
    message: "You can only change the configuration of reports you created.",
  };
}
