/**
 * The reports the model declares, as `/api/reports` serves them.
 *
 * A report is a question the application's users actually ask, written in the
 * model as the SQL that answers it and seeded into `sys_report`. The backend has
 * listed and run the model's `reports` all along; nothing in the frontend asked, so
 * every report a model declared was reachable only by someone who knew the URL
 * of the JSON. These hooks are the one owner of those two requests.
 *
 * The shapes mirror `controllers/report.rs` exactly — `describe` for a report,
 * `run` for its result. The query itself never reaches the browser.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export type ReportChart = "bar" | "line" | "pie" | "area";

/** One report, as `GET /api/reports` and `GET /api/reports/{name}` describe it. */
export interface ReportSummary {
  id: string;
  name: string;
  title: string;
  entityName: string | null;
  tableName: string | null;
  chart: ReportChart | null;
  xAxis: string | null;
  yAxis: string | null;
  help: string | null;
  sortOrder: number;
}

/** `GET /api/reports/{name}/run`. */
export interface ReportResult {
  report: ReportSummary;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  /** True when the report returned more than the server's 5,000-row cap. */
  truncated: boolean;
  durationMs: number;
}

interface ReportList {
  data: ReportSummary[];
  meta: { total: number };
}

export const reportKeys = {
  all: ["reports"] as const,
  list: () => [...reportKeys.all, "list"] as const,
  run: (name: string) => [...reportKeys.all, "run", name] as const,
};

export function useReports() {
  return useQuery({
    queryKey: reportKeys.list(),
    queryFn: async () => (await apiClient.get<ReportList>("/reports")).data,
  });
}

/**
 * Run one report. Not cached across visits: a report answers "what is true
 * now", and a stale answer presented as current is worse than a spinner.
 */
export function useReportRun(name: string) {
  return useQuery({
    queryKey: reportKeys.run(name),
    queryFn: () => apiClient.get<ReportResult>(`/reports/${encodeURIComponent(name)}/run`),
    staleTime: 0,
    gcTime: 0,
  });
}
