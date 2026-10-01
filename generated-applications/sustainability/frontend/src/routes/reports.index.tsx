/**
 * `/reports` — the reports the model declares.
 *
 * A report is a question the application's users ask often enough that the
 * model wrote down the query answering it (`reports:` in the model, `sys_report`
 * in the database). They are grouped by the entity each is about, because that
 * is how the model groups them and how a reader looks for one.
 *
 * Outside `/admin`: a report answers a business question, and the people who
 * ask it are the application's users, not its administrators.
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import { AreaChart, BarChart3, FileBarChart, LineChart, PieChart, Table2 } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Heading, HStack, Text, VStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api-client";
import { type ReportSummary, useReports } from "@/hooks/use-reports";

export const Route = createFileRoute("/reports/")({
  component: ReportsPage,
});

const pageStyle = { maxWidth: 1200, margin: "0 auto", padding: "24px 32px" } as const;

const CHART_ICONS = {
  bar: BarChart3,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
} as const;

/** "bus_support_case" or "SupportCase" → "Support Case". */
function entityHeading(report: ReportSummary): string {
  const raw = report.entityName ?? report.tableName?.replace(/^bus_/, "") ?? "";
  if (!raw) return "General";
  return raw
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReportsPage() {
  const { data: reports, isLoading, error } = useReports();

  const groups = useMemo(() => {
    const byEntity = new Map<string, ReportSummary[]>();
    for (const report of reports ?? []) {
      const heading = entityHeading(report);
      byEntity.set(heading, [...(byEntity.get(heading) ?? []), report]);
    }
    return [...byEntity.entries()]
      .map(([heading, items]) => ({
        heading,
        items: [...items].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
        ),
      }))
      .sort((a, b) => a.heading.localeCompare(b.heading));
  }, [reports]);

  return (
    <Box style={pageStyle}>
      <VStack gap={6}>
        <VStack gap={1}>
          <Heading level={1}>Reports</Heading>
          <Text size="sm" color="secondary">
            The questions this application answers, as its model defines them. Each report runs
            against the live data when you open it.
          </Text>
        </VStack>

        {isLoading && (
          <VStack gap={3}>
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </VStack>
        )}

        {error && (
          <EmptyState
            title="The reports could not be loaded"
            description={getErrorMessage(error)}
            icon={<FileBarChart size={32} />}
          />
        )}

        {!isLoading && !error && groups.length === 0 && (
          <EmptyState
            title="This model declares no reports"
            description="Reports are written in the model under `reports:`; regenerate the application after adding one."
            icon={<FileBarChart size={32} />}
          />
        )}

        {groups.map((group) => (
          <VStack key={group.heading} gap={2}>
            <HStack align="center" gap={2}>
              <Heading level={2} className="text-lg">
                {group.heading}
              </Heading>
              <Text size="sm" color="secondary">
                ({group.items.length})
              </Text>
            </HStack>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items.map((report) => {
                const ChartIcon = report.chart ? CHART_ICONS[report.chart] : Table2;
                return (
                  <Link
                    key={report.name}
                    to="/reports/$name"
                    params={{ name: report.name }}
                    className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Card className="h-full p-4 transition-colors hover:bg-muted/40">
                      <HStack align="start" gap={3}>
                        <span className="mt-0.5 text-primary">
                          <ChartIcon size={20} aria-hidden="true" />
                        </span>
                        <VStack gap={1} className="min-w-0">
                          <HStack align="center" gap={2}>
                            <Text weight="semibold">{report.title}</Text>
                            {report.chart && <Badge variant="secondary">{report.chart}</Badge>}
                          </HStack>
                          {report.help && (
                            <Text size="sm" color="secondary">
                              {report.help}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
}
