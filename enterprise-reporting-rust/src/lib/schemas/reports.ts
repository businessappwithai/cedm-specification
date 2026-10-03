import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const listReportsSchema = paginationSchema;

export type ListReportsInput = z.infer<typeof listReportsSchema>;

export const createReportSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  savedQueryId: uuidSchema.optional(),
  columnConfig: z.array(z.unknown()).optional(),
  filterConfig: z.unknown().optional(),
  sortConfig: z.unknown().optional(),
  paginationConfig: z.unknown().optional(),
  exportFormats: z.array(z.enum(["csv", "xlsx", "pdf"])).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  columnConfig: z.array(z.unknown()).optional(),
  filterConfig: z.unknown().optional(),
  sortConfig: z.unknown().optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

/**
 * Setting a report's record link — see src/lib/reporting/record-link.ts.
 *
 * `link: null` clears it. The URL's *shape* is checked here; whether the scheme
 * is one a browser may safely follow is checked by `validateUrlTemplate` in the
 * server function, so that the same rule applies to every writer rather than
 * only to this one.
 */
export const setReportRecordLinkSchema = z.object({
  id: uuidSchema,
  link: z
    .object({
      enabled: z.boolean(),
      idColumn: z.string().min(1, "Choose the column holding the record's id").max(255),
      urlTemplate: z.string().min(1, "Enter a URL").max(2000),
      label: z.string().max(120).optional(),
      openInNewTab: z.boolean().optional(),
    })
    .nullable(),
});

export type SetReportRecordLinkInput = z.infer<typeof setReportRecordLinkSchema>;

export const getReportSchema = z.object({
  id: uuidSchema,
});

export type GetReportInput = z.infer<typeof getReportSchema>;
