/**
 * Report designs, read and written through the generic dictionary verbs.
 *
 * `sys_report_designs` is served by the same `/api/sys/{segment}` handler as
 * every other dictionary resource, so there is no `/report-designs/{table}`
 * route to address a design by the entity it belongs to — the segment is keyed
 * by `sys_report_design_id` like all the others. A table has exactly one
 * design (the unique index says so), so `?filter.table_name=` is an exact
 * lookup and the id it returns is what an update and a delete need.
 *
 * That indirection is deliberate rather than incidental. A bespoke controller
 * keyed by table name would be a second way to reach one table, with its own
 * authorisation to keep in step; the generic verbs already have one.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ReportDesign {
  sys_report_design_id: string;
  table_name: string;
  name: string;
  layout: Record<string, unknown> | null;
  updated_at?: string;
}

function rows<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Every design in the application, keyed by the table it belongs to. */
export function useReportDesigns() {
  return useQuery<Map<string, ReportDesign>>({
    queryKey: ["report-designs"],
    queryFn: async () => {
      const response = await apiClient.get<unknown>("/sys/report-designs", { limit: 500 });
      return new Map(rows<ReportDesign>(response).map((design) => [design.table_name, design]));
    },
  });
}

/** The one design for a table, or null if nobody has drawn one yet. */
export function useReportDesign(tableName: string | undefined) {
  return useQuery<ReportDesign | null>({
    queryKey: ["report-design", tableName],
    queryFn: async () => {
      const response = await apiClient.get<unknown>("/sys/report-designs", {
        "filter.table_name": tableName as string,
      });
      return rows<ReportDesign>(response)[0] ?? null;
    },
    enabled: !!tableName,
  });
}

/**
 * Save a table's layout, creating the design on first save.
 *
 * Create-or-update rather than an upsert endpoint, because the segment offers
 * the five generic verbs and nothing else. The existing row is read from the
 * cache the designer already populated, so the common path is one request.
 */
export function useSaveReportDesign(tableName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layout,
      name,
      existing,
    }: {
      layout: Record<string, unknown>;
      name: string;
      existing: ReportDesign | null;
    }) => {
      if (existing) {
        return apiClient.put<ReportDesign>(
          `/sys/report-designs/${existing.sys_report_design_id}`,
          { table_name: tableName, name, layout }
        );
      }
      return apiClient.post<ReportDesign>("/sys/report-designs", {
        table_name: tableName,
        name,
        layout,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report-design", tableName] });
      void queryClient.invalidateQueries({ queryKey: ["report-designs"] });
    },
  });
}
