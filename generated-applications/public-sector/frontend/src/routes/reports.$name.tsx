/**
 * `/reports/$name` — one report, run against the live data.
 *
 * The chart the model declares comes first when there is one; the rows always
 * follow, because a chart summarises and a reader checking a number needs the
 * row behind it. Rows are paged here rather than on the server: a report is one
 * statement, capped at 5,000 rows by the backend, and running it again to fetch
 * page two could answer a different question than page one did.
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Download, FileBarChart, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { ReportChart } from "@/components/reports/report-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api-client";
import { useReportRun } from "@/hooks/use-reports";

export const Route = createFileRoute("/reports/$name")({
  component: ReportPage,
});

const pageStyle = { maxWidth: 1200, margin: "0 auto", padding: "24px 32px" } as const;
const PAGE_SIZE = 100;

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

/** How a result cell reads. Dates stay as the database wrote them: unambiguous. */
function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return numberFormat.format(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** RFC 4180: quote every field, double any quote inside it. */
function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [columns.map(cell).join(","), ...rows.map((row) => columns.map((c) => cell(row[c])).join(","))].join("\r\n");
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportPage() {
  const { name } = Route.useParams();
  const { data: result, isLoading, isFetching, error, refetch } = useReportRun(name);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil((result?.rows.length ?? 0) / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = useMemo(
    () => result?.rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) ?? [],
    [result, current]
  );

  const report = result?.report;
  const numeric = useMemo(() => {
    const columns = new Set<string>();
    for (const column of result?.columns ?? []) {
      if (result?.rows.some((row) => typeof row[column] === "number")) columns.add(column);
    }
    return columns;
  }, [result]);

  return (
    <Box style={pageStyle}>
      <VStack gap={5}>
        <Link to="/reports" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} aria-hidden="true" /> All reports
        </Link>

        {isLoading && (
          <VStack gap={3}>
            <Skeleton height={36} width={360} />
            <Skeleton height={20} width={600} />
            <Skeleton height={320} />
          </VStack>
        )}

        {error && !isLoading && (
          <EmptyState
            title="This report could not be run"
            description={getErrorMessage(error)}
            icon={<FileBarChart size={32} />}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {result && report && (
          <>
            <HStack align="start" justify="between" gap={4} className="flex-wrap">
              <VStack gap={1} className="min-w-0">
                <Heading level={1}>{report.title}</Heading>
                {report.help && (
                  <Text size="sm" color="secondary">
                    {report.help}
                  </Text>
                )}
                <Text size="xs" color="secondary">
                  {result.rowCount.toLocaleString()} {result.rowCount === 1 ? "row" : "rows"} ·{" "}
                  {result.durationMs} ms
                </Text>
              </VStack>
              <HStack gap={2}>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw size={14} aria-hidden="true" /> {isFetching ? "Running…" : "Run again"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download(report.name, toCsv(result.columns, result.rows))}
                  disabled={result.rows.length === 0}
                >
                  <Download size={14} aria-hidden="true" /> CSV
                </Button>
              </HStack>
            </HStack>

            {result.truncated && (
              <Card className="border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                This report returned more rows than the 5,000 the server sends. The first 5,000, in
                the report's own order, are shown and exported.
              </Card>
            )}

            {report.chart && report.xAxis && report.yAxis && result.rows.length > 0 && (
              <Card className="p-4">
                <ReportChart kind={report.chart} rows={result.rows} x={report.xAxis} y={report.yAxis} />
              </Card>
            )}

            {result.rows.length === 0 ? (
              <EmptyState
                title="No rows"
                description="The report ran and nothing in the data matches it yet."
                icon={<FileBarChart size={32} />}
              />
            ) : (
              <Card className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {result.columns.map((column) => (
                        <TableHead key={column} className={numeric.has(column) ? "text-right" : undefined}>
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((row, index) => (
                      <TableRow key={(current - 1) * PAGE_SIZE + index}>
                        {result.columns.map((column) => (
                          <TableCell
                            key={column}
                            className={numeric.has(column) ? "text-right tabular-nums" : undefined}
                          >
                            {display(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {pages > 1 && (
              <HStack align="center" justify="between">
                <Text size="sm" color="secondary">
                  Rows {((current - 1) * PAGE_SIZE + 1).toLocaleString()}–
                  {Math.min(current * PAGE_SIZE, result.rows.length).toLocaleString()} of{" "}
                  {result.rows.length.toLocaleString()}
                </Text>
                <HStack gap={2}>
                  <Button variant="outline" size="sm" onClick={() => setPage(current - 1)} disabled={current === 1}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(current + 1)}
                    disabled={current === pages}
                  >
                    Next
                  </Button>
                </HStack>
              </HStack>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
}
