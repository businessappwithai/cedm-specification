"use client";

/**
 * Enhanced dashboard widget card with cross-filtering support.
 * Renders charts, reports, and metrics with WASM optimizations.
 */

import { useQuery } from "@tanstack/react-query";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { useDuckDB } from "@/components/duckdb/DuckDBProvider";
import { DataTable } from "@/components/reporting/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { ChartConfig, ChartType, DashboardWidget, DataMapping } from "@/types/database";
import type { ActiveFilter } from "@/types/filters";
import { useDashboardState } from "./DashboardState";

/**
 * The columns a report widget shows. `/api/reports/:id/data` returns rows and
 * no column list, and this used to read only that list — so a report widget
 * rendered its row count and pager around a table with no columns. Same order
 * of preference as the report viewer: the data's own column list, then the
 * report's visible `column_config`, then the keys of the first row.
 */
function reportWidgetColumns(
  dataColumns: unknown,
  columnConfig: unknown,
  rows: Record<string, unknown>[]
): { field: string; header: string }[] {
  const label = (field: string) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (Array.isArray(dataColumns) && dataColumns.length > 0) {
    return dataColumns
      .map((col: Record<string, unknown>) => {
        const field = String(col.field ?? col.accessorKey ?? col.name ?? "");
        return { field, header: String(col.header ?? label(field)) };
      })
      .filter((col) => col.field);
  }

  try {
    const config = typeof columnConfig === "string" ? JSON.parse(columnConfig) : columnConfig;
    if (Array.isArray(config)) {
      const visible = config
        .filter((col: Record<string, unknown>) => col.visible !== false && col.field)
        .map((col: Record<string, unknown>) => ({
          field: String(col.field),
          header: String(col.header ?? label(String(col.field))),
        }));
      if (visible.length > 0) return visible;
    }
  } catch {
    // fall through to the row's own keys
  }

  const first = rows[0];
  return first ? Object.keys(first).map((field) => ({ field, header: label(field) })) : [];
}

interface WidgetCardProps {
  widget: DashboardWidget;
  /** Height available to the widget body, in px; charts fill it. */
  height?: number;
  onFilterApply?: (filter: Omit<ActiveFilter, "id" | "affectedWidgets">) => void;
}

export function WidgetCard({ widget, height, onFilterApply }: WidgetCardProps) {
  const { getFilteredQuery } = useDashboardState();
  const { executeQuery, status: duckdbStatus } = useDuckDB();

  const isWasmEnabled =
    isFeatureEnabled("wasmEnabled") &&
    isFeatureEnabled("crossFilterEnabled") &&
    duckdbStatus === "ready";

  // Fetch chart definition if this is a chart widget
  const { data: chartDef, isLoading: isLoadingChart } = useQuery({
    queryKey: ["chart", widget.chart_id],
    queryFn: async () => {
      if (!widget.chart_id) return null;
      const res = await fetch(`/api/charts/${widget.chart_id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load chart`);
      const data = await res.json();
      return data.data;
    },
    enabled: widget.widget_type === "chart" && !!widget.chart_id,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Base query for reports (saved query SQL)
  const { data: reportDef } = useQuery({
    queryKey: ["report-def", widget.report_id],
    queryFn: async () => {
      if (!widget.report_id) return null;
      const res = await fetch(`/api/reports/${widget.report_id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load report`);
      const data = await res.json();
      return data.data;
    },
    enabled: widget.widget_type === "report" && !!widget.report_id,
    staleTime: 300000,
  });

  // Determine the query to use (apply cross-filters if enabled)
  const baseQuery = reportDef?.query?.sql ?? "SELECT * FROM data";
  const widgetId = widget.id.toString();
  const filteredQuery = isWasmEnabled ? getFilteredQuery(widgetId, baseQuery) : baseQuery;

  // Fetch report data (server-side or WASM)
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ["report-data-for-widget", widget.report_id, filteredQuery],
    queryFn: async () => {
      if (!widget.report_id) return null;

      // Use DuckDB-Wasm if enabled and available
      if (isWasmEnabled && reportDef?.dataset_id) {
        // Query executes locally in DuckDB
        const result = await executeQuery(filteredQuery);
        return {
          data: {
            rows: result.rows,
            columns: result.columns.map((c) => ({
              field: c.name,
              header: c.name,
              type: c.type,
            })),
          },
        };
      }

      // Fallback to server-side
      const res = await fetch(`/api/reports/${widget.report_id}/data?pageSize=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load report data`);
      const data = await res.json();
      return data;
    },
    enabled: widget.widget_type === "report" && !!widget.report_id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch chart data (server-side or WASM)
  const { data: chartData } = useQuery({
    queryKey: ["chart-data-for-widget", widget.chart_id, filteredQuery],
    queryFn: async () => {
      if (!widget.chart_id) return null;

      // Use DuckDB-Wasm if enabled and available
      if (isWasmEnabled && chartDef?.dataset_id) {
        const result = await executeQuery(filteredQuery);
        return { data: result.rows };
      }

      // Fallback to server-side
      const res = await fetch(`/api/charts/${widget.chart_id}/data`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load chart data`);
      const data = await res.json();
      return data;
    },
    enabled: widget.widget_type === "chart" && !!widget.chart_id,
    staleTime: 30000,
  });

  const isLoading = widget.widget_type === "chart" ? isLoadingChart : isLoadingReport;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-3 w-full px-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Render widget content based on type
  switch (widget.widget_type) {
    case "chart":
      if (!chartData || !chartDef) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No chart data available
          </div>
        );
      }
      try {
        const chartConfig: ChartConfig = chartDef.chart_config
          ? JSON.parse(chartDef.chart_config)
          : undefined;
        const dataMapping: DataMapping = chartDef.data_mapping
          ? JSON.parse(chartDef.data_mapping)
          : undefined;

        return (
          <ChartRenderer
            data={
              chartData.data?.rows ??
              (Array.isArray(chartData.data) ? chartData.data : null) ??
              chartData.rows ??
              []
            }
            chartType={chartDef.chart_type as ChartType}
            // The widget's card header already names the chart; a second title
            // inside it would repeat the name and take height from the plot.
            chartConfig={chartConfig ? { ...chartConfig, title: undefined } : chartConfig}
            dataMapping={dataMapping}
            height={Math.max(160, height ?? 250)}
            onDataClick={(data) => {
              // Broadcast filter when user clicks chart element
              if (onFilterApply && data) {
                onFilterApply({
                  sourceWidgetId: widgetId,
                  column: data.column ?? data.field ?? "value",
                  values: Array.isArray(data.value) ? data.value : [data.value],
                  operator: "in",
                });
              }
            }}
          />
        );
      } catch (error) {
        console.error("Error rendering chart:", error);
        return (
          <div className="flex items-center justify-center h-full text-destructive text-sm">
            Error rendering chart
          </div>
        );
      }

    case "report":
      if (!reportData) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No report data available
          </div>
        );
      }
      try {
        const rows: Record<string, unknown>[] = reportData.data?.rows ?? reportData.rows ?? [];

        return (
          <div className="overflow-auto h-full">
            <DataTable
              data={rows}
              columns={reportWidgetColumns(
                reportData.data?.columns ?? reportData.columns,
                reportDef?.column_config,
                rows
              ).map((col) => ({
                accessorKey: col.field,
                header: col.header,
                cell: ({ getValue }: { getValue: () => unknown }) => {
                  const value = getValue();
                  if (value === null || value === undefined) {
                    return <span className="text-tremor-content">-</span>;
                  }
                  return String(value);
                },
              }))}
              pageSize={10}
            />
          </div>
        );
      } catch (error) {
        console.error("Error rendering report:", error);
        return (
          <div className="flex items-center justify-center h-full text-destructive text-sm">
            Error rendering report
          </div>
        );
      }

    case "metric": {
      const config = widget.widget_config ? JSON.parse(widget.widget_config) : {};
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl font-bold">{config.value || "--"}</div>
            <div className="text-tremor-content">{config.label || "Metric"}</div>
          </div>
        </div>
      );
    }

    case "text": {
      const textConfig = widget.widget_config ? JSON.parse(widget.widget_config) : {};
      return (
        <div className="p-2 h-full overflow-auto">
          <p className="text-tremor-default text-tremor-content">
            {textConfig.content || "Text widget"}
          </p>
        </div>
      );
    }

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Unknown widget type: {widget.widget_type}
        </div>
      );
  }
}
