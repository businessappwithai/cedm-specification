"use server";

import { forwardToRust } from "@/lib/api/backend";
import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import { isAdmin } from "@/lib/permissions/permissions";
import {
  parseRecordLinkConfig,
  type RecordLinkConfig,
  serializeRecordLinkConfig,
  validateUrlTemplate,
} from "@/lib/reporting/record-link";
import { getDb } from "@/lib/db/config";
import { logAudit } from "@/lib/security/audit";
import {
  listReportsSchema,
  createReportSchema,
  updateReportSchema,
  getReportSchema,
  setReportRecordLinkSchema,
} from "@/lib/schemas/reports";

export const listReports = createServerFn({
  method: "GET",
})
  .inputValidator(listReportsSchema)
  .handler(async ({ data: input }) => {
    const _session = await requireAuth();
    const { page = 0, pageSize = 20 } = input;

    const db = getDb();
    const reports = await db
      .selectFrom("report_definitions")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(pageSize)
      .offset(page * pageSize)
      .execute();

    const countResult = await db
      .selectFrom("report_definitions")
      .select((eb) => eb.fn.count("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count || 0);

    return {
      items: reports,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  });

export const getReport = createServerFn({
  method: "GET",
})
  .inputValidator(getReportSchema)
  .handler(async ({ data: input }) => {
    const _session = await requireAuth();
    const { id } = input;

    const db = getDb();
    const report = await db
      .selectFrom("report_definitions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  });

export const createReport = createServerFn({
  method: "POST",
})
  .inputValidator(createReportSchema)
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const {
      name,
      description,
      savedQueryId,
      columnConfig,
      filterConfig,
      sortConfig,
      paginationConfig,
      exportFormats,
    } = input;

    const db = getDb();
    const id = randomUUID();

    await db
      .insertInto("report_definitions")
      .values({
        id,
        name,
        description: description || null,
        saved_query_id: savedQueryId || null,
        column_config: JSON.stringify(columnConfig || []),
        filter_config: filterConfig ? JSON.stringify(filterConfig) : null,
        sort_config: sortConfig ? JSON.stringify(sortConfig) : null,
        pagination_config: paginationConfig ? JSON.stringify(paginationConfig) : null,
        export_formats: JSON.stringify(exportFormats || ["csv", "xlsx", "pdf"]),
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();

    await logAudit({
      userId: session.user.id,
      action: "create",
      resourceType: "report",
      resourceId: id,
      details: { name },
    });

    return { id };
  });

export const updateReport = createServerFn({
  method: "POST",
})
  .inputValidator(updateReportSchema)
  .handler(async ({ data: input }) => {
    const session = await requireAuth();
    const { id, ...updates } = input;

    const db = getDb();
    await db
      .updateTable("report_definitions")
      .set({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute();

    await logAudit({
      userId: session.user.id,
      action: "update",
      resourceType: "report",
      resourceId: id,
      details: updates,
    });

    return { success: true };
  });

export const deleteReport = createServerFn({
  method: "POST",
})
  .inputValidator(getReportSchema)
  .handler(async ({ data: input }) => {
    const session = await requireAuth();
    const { id } = input;

    const db = getDb();
    await db.deleteFrom("report_definitions").where("id", "=", id).execute();

    await logAudit({
      userId: session.user.id,
      action: "delete",
      resourceType: "report",
      resourceId: id,
    });

    return { success: true };
  });

/**
 * Read the record link on a report.
 *
 * Not administrator-gated: every viewer of a report needs this to know whether
 * to draw the button. Configuring the link is the privileged action, not seeing
 * where it points — and the target application enforces its own access anyway,
 * so a link is not a grant.
 */
export const getReportRecordLink = createServerFn({ method: "GET" })
  .inputValidator(getReportSchema)
  .handler(async ({ data: input }) => {
    await requireAuth();

    const forwarded = await forwardToRust<{ config: RecordLinkConfig | null }>(
      "GET",
      `/api/reports/${encodeURIComponent(input.id)}/record-link`
    );
    if (forwarded) return forwarded;

    const db = getDb();
    const row = await db
      .selectFrom("report_definitions")
      .select("record_link_config")
      .where("id", "=", input.id)
      .executeTakeFirst();

    return { config: parseRecordLinkConfig(row?.record_link_config ?? null) };
  });

/**
 * Set (or clear) the record link on a report — administrators only.
 *
 * The gate is here rather than only in the UI. Hiding the form from
 * non-administrators is a courtesy; this is the check that means anything,
 * because a server function is reachable by anyone who can call it, not just by
 * whoever the screen was rendered for.
 *
 * The URL is validated before it is stored. It ends up in an `href` shown to
 * every viewer of the report, so an unvalidated template is stored XSS — see
 * src/lib/reporting/record-link.ts.
 */
export const setReportRecordLink = createServerFn({ method: "POST" })
  .inputValidator(setReportRecordLinkSchema)
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const forwarded = await forwardToRust<{ success: boolean; config: RecordLinkConfig | null }>(
      "PUT",
      `/api/reports/${encodeURIComponent(input.id)}/record-link`,
      { link: input.link }
    );
    if (forwarded) return forwarded;

    if (!(await isAdmin(session.user.id))) {
      throw new Error("FORBIDDEN: Only administrators can configure record links");
    }

    const db = getDb();

    // Clearing is spelled as `link: null` rather than as an empty template, so
    // "remove this" cannot be confused with "save a blank one".
    if (!input.link) {
      await db
        .updateTable("report_definitions")
        .set({ record_link_config: null, updated_at: new Date().toISOString() })
        .where("id", "=", input.id)
        .execute();

      await logAudit({
        userId: session.user.id,
        action: "update",
        resourceType: "report",
        resourceId: input.id,
        details: { operation: "clearRecordLink" },
      });

      return { success: true, config: null };
    }

    const validation = validateUrlTemplate(input.link.urlTemplate);
    if (!validation.ok) {
      throw new Error(`VALIDATION: ${validation.error}`);
    }

    if (!input.link.idColumn.trim()) {
      throw new Error("VALIDATION: Choose the column holding the record's id.");
    }

    const config: RecordLinkConfig = {
      enabled: input.link.enabled,
      idColumn: input.link.idColumn,
      urlTemplate: input.link.urlTemplate,
      label: input.link.label,
      openInNewTab: input.link.openInNewTab,
    };

    await db
      .updateTable("report_definitions")
      .set({
        record_link_config: serializeRecordLinkConfig(config),
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .execute();

    await logAudit({
      userId: session.user.id,
      action: "update",
      resourceType: "report",
      resourceId: input.id,
      // The template is recorded: who pointed a report at which external system
      // is exactly the question an audit of this feature would be asking.
      details: {
        operation: "setRecordLink",
        enabled: config.enabled,
        urlTemplate: config.urlTemplate,
      },
    });

    return { success: true, config };
  });
