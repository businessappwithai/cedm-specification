import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppWindow,
  ArrowRight,
  Columns,
  Database,
  FileText,
  Hash,
  Home,
  Layers,
  LayoutList,
  RefreshCw,
  Settings,
  ShieldCheck,
  Table2,
} from "lucide-react";
import { ADSidebar } from "@/components/admin/ad-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";
import { Box, Grid, HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

interface CountResponse {
  meta: { total: number };
}

function AdminDashboardPage() {
  const {
    data: tablesRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "tables-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/tables", { limit: 1 }),
  });
  const { data: columnsRes } = useQuery({
    queryKey: ["admin", "columns-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/columns", { limit: 1 }),
  });
  const { data: windowsRes } = useQuery({
    queryKey: ["admin", "windows-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/windows", { limit: 1 }),
  });
  const { data: tabsRes } = useQuery({
    queryKey: ["admin", "tabs-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/tabs", { limit: 1 }),
  });
  const { data: fieldsRes } = useQuery({
    queryKey: ["admin", "fields-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/fields", { limit: 1 }),
  });
  const { data: refsRes } = useQuery({
    queryKey: ["admin", "references-count"],
    queryFn: () => apiClient.get<CountResponse>("/sys/references", { limit: 1 }),
  });

  const stats = [
    { label: "Tables", count: tablesRes?.meta?.total || 0, icon: Table2, color: "text-blue-600" },
    {
      label: "Columns",
      count: columnsRes?.meta?.total || 0,
      icon: Columns,
      color: "text-indigo-600",
    },
    {
      label: "Windows",
      count: windowsRes?.meta?.total || 0,
      icon: AppWindow,
      color: "text-violet-600",
    },
    { label: "Tabs", count: tabsRes?.meta?.total || 0, icon: Layers, color: "text-purple-600" },
    {
      label: "Fields",
      count: fieldsRes?.meta?.total || 0,
      icon: LayoutList,
      color: "text-pink-600",
    },
    {
      label: "References",
      count: refsRes?.meta?.total || 0,
      icon: Hash,
      color: "text-emerald-600",
    },
  ];

  const windows = [
    {
      title: "Table and Column",
      description: "Browse database tables and their column definitions in master/detail view",
      icon: Database,
      to: "/admin/tables" as const,
    },
    {
      title: "Window, Tab and Field",
      description: "Manage application windows with nested tabs and field configurations",
      icon: AppWindow,
      to: "/admin/windows" as const,
    },
    {
      title: "Element",
      description: "Manage system elements — column names, print names, and descriptions",
      icon: FileText,
      to: "/admin/elements" as const,
    },
    {
      title: "Reference",
      description: "Manage data types, validation rules, and lookup definitions",
      icon: Hash,
      to: "/admin/references" as const,
    },
    {
      title: "Field Layout Manager",
      description: "Customize field order, visibility, and grouping with drag-and-drop",
      icon: LayoutList,
      to: "/admin/fields" as const,
    },
    {
      title: "Business Rules",
      description: "Configure validation rules, callouts, and business logic",
      icon: Settings,
      to: "/admin/rules" as const,
    },
    {
      title: "Report Designs",
      description: "Lay out printable documents for each entity — a design puts a Print button on its records",
      icon: FileText,
      to: "/admin/reports" as const,
    },
    {
      title: "Audit Log",
      description: "Immutable tamper-proof audit trail of all user and system actions",
      icon: ShieldCheck,
      to: "/admin/audit" as const,
    },
  ];

  return (
    <ADSidebar>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b border-border bg-card px-8 py-8">
          <HStack align="start" justify="between">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
              >
                <Home size={14} />
                Back to Dashboard
              </Link>
              <Heading level={1} color="primary" className="text-4xl tracking-tight font-display">
                Application Dictionary
              </Heading>
              <Text color="secondary" block className="mt-2 max-w-xl">
                Manage entities, field layouts, and application configuration
              </Text>
            </div>
            <Button variant="outline" size="default" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </HStack>
        </header>

        <Box grow scrollable paddingInline={8} paddingBlock={8} className="space-y-8">
          {/* Stats Grid */}
          <Grid columns={2} gap={4}>
            {stats.map((stat) => (
              <div key={stat.label} className="border border-border rounded-lg p-4 bg-card">
                <HStack align="center" gap={2} className="mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <Text size="xs" weight="medium" color="secondary" uppercase>
                    {stat.label}
                  </Text>
                </HStack>
                <Text weight="bold" color="primary" block className="text-3xl tabular-nums">{stat.count}</Text>
              </div>
            ))}
          </Grid>

          {/* Window Cards */}
          <div>
            <Heading level={2} className="mb-4">Dictionary Windows</Heading>
            <Grid columns={1} gap={4}>
              {windows.map((win) => (
                <Link key={win.to} to={win.to}>
                  <Card className="group hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <HStack align="start" justify="between">
                        <win.icon className="h-6 w-6 text-primary" />
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </HStack>
                      <CardTitle className="text-lg">{win.title}</CardTitle>
                      <CardDescription>{win.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </Grid>
          </div>
        </Box>
      </div>
    </ADSidebar>
  );
}
