import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Filter,
  Home,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityLabel } from "@/components/admin/use-dictionary-entities";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { Box, Grid, HStack, Text, VStack } from "@/components/ui/layout";

export const Route = createFileRoute("/admin/audit")({
  component: AuditLogPage,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEvent {
  id: string;
  immudb_key?: string;
  timestamp: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  session_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  before_value?: Record<string, unknown>;
  after_value?: Record<string, unknown>;
  changed_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  source?: string;
  success: boolean;
  error_message?: string;
  request_id?: string;
  correlation_id?: string;
}

interface AuditResponse {
  data: AuditEvent[];
  meta: { total: number; page: number; limit: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_COLORS: Record<string, string> = {
  ENTITY_CREATE: "bg-green-100 text-green-800",
  ENTITY_UPDATE: "bg-blue-100 text-blue-800",
  ENTITY_DELETE: "bg-red-100 text-red-800",
  AUTH_LOGIN: "bg-purple-100 text-purple-800",
  AUTH_LOGOUT: "bg-gray-100 text-gray-700",
  AUTH_LOGIN_FAILED: "bg-red-100 text-red-800",
  SYS_FIELD_UPDATE: "bg-yellow-100 text-yellow-800",
  SYS_TABLE_CHANGE: "bg-yellow-100 text-yellow-800",
  AI_SQL_EXECUTED: "bg-indigo-100 text-indigo-800",
};

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action] ?? "bg-gray-100 text-gray-700";
  const label = action.replace(/_/g, " ");
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

function sourceBadge(source?: string) {
  const map: Record<string, string> = {
    WEB_UI: "bg-sky-100 text-sky-700",
    API: "bg-orange-100 text-orange-700",
    AGENT: "bg-violet-100 text-violet-700",
    SYSTEM: "bg-gray-100 text-gray-600",
  };
  const cls = map[source ?? ""] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {source ?? "—"}
    </span>
  );
}

function JsonDiff({
  before,
  after,
}: {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  if (!before && !after)
    return <Text size="xs" color="secondary" block className="italic">No change data</Text>;
  const allKeys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  return (
    <Grid columns={2} gap={4} className="text-xs">
      <div>
        <Text weight="semibold" color="secondary" block className="mb-1">Before</Text>
        <pre className="bg-red-50 border border-red-100 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap text-red-900">
          {before ? JSON.stringify(before, null, 2) : "—"}
        </pre>
      </div>
      <div>
        <Text weight="semibold" color="secondary" block className="mb-1">After</Text>
        <pre className="bg-green-50 border border-green-100 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap text-green-900">
          {after ? JSON.stringify(after, null, 2) : "—"}
        </pre>
      </div>
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// Verify button
// ---------------------------------------------------------------------------

function VerifyButton({ id, immudbKey }: { id: string; immudbKey?: string }) {
  const [result, setResult] = useState<{ verified: boolean; reason?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ verified: boolean; reason?: string }>(
        `/audit/${id}/verify`
      );
      setResult(res);
    } catch {
      setResult({ verified: false, reason: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!immudbKey) return <Text size="xs" color="secondary">—</Text>;

  if (result) {
    if (result.verified) {
      return (
        <Text size="xs" className="flex items-center gap-1 text-green-700">
          <ShieldCheck size={14} />
          Verified
        </Text>
      );
    }
    const isOffline =
      result.reason?.toLowerCase().includes("not connected") ||
      result.reason?.toLowerCase().includes("not found");
    return isOffline ? (
      <Text size="xs" color="secondary" className="flex items-center gap-1" title={result.reason}>
        <Shield size={14} />
        Offline
      </Text>
    ) : (
      <Text size="xs" color="danger" className="flex items-center gap-1" title={result.reason}>
        <ShieldAlert size={14} />
        Tampered?
      </Text>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs gap-1"
      onClick={verify}
      disabled={loading}
    >
      <Shield size={12} />
      {loading ? "…" : "Verify"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Row detail drawer
// ---------------------------------------------------------------------------

function DetailRow({ event }: { event: AuditEvent }) {
  return (
    <tr>
      <td colSpan={9} className="bg-muted/20 border-b border-border px-6 py-4">
        <div className="space-y-4">
          <Grid columns={2} gap={4} className="text-xs">
            <div className="space-y-1">
              <p>
                <Text weight="medium" color="secondary">ID:</Text>{" "}
                <span className="font-mono">{event.id}</span>
              </p>
              {event.immudb_key && (
                <p>
                  <Text weight="medium" color="secondary">immudb key:</Text>{" "}
                  <span className="font-mono">{event.immudb_key}</span>
                </p>
              )}
              {event.session_id && (
                <p>
                  <Text weight="medium" color="secondary">Session:</Text>{" "}
                  {event.session_id}
                </p>
              )}
              {event.request_id && (
                <p>
                  <Text weight="medium" color="secondary">Request ID:</Text>{" "}
                  {event.request_id}
                </p>
              )}
              {event.correlation_id && (
                <p>
                  <Text weight="medium" color="secondary">Correlation:</Text>{" "}
                  {event.correlation_id}
                </p>
              )}
            </div>
            <div className="space-y-1">
              {event.ip_address && (
                <p>
                  <Text weight="medium" color="secondary">IP:</Text> {event.ip_address}
                </p>
              )}
              {event.user_agent && (
                <p>
                  <Text weight="medium" color="secondary">UA:</Text>{" "}
                  <Text truncate className="block max-w-sm">{event.user_agent}</Text>
                </p>
              )}
              {event.changed_fields && event.changed_fields.length > 0 && (
                <p>
                  <Text weight="medium" color="secondary">Changed:</Text>{" "}
                  {event.changed_fields.join(", ")}
                </p>
              )}
              {event.error_message && (
                <Text color="danger" block>
                  <Text weight="medium">Error:</Text> {event.error_message}
                </Text>
              )}
            </div>
          </Grid>
          <JsonDiff before={event.before_value} after={event.after_value} />
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

/** Page sizes offered in the footer. The API caps `limit` at 500. */
const PAGE_SIZES = [25, 50, 100, 250] as const;
const DEFAULT_PAGE_SIZE = 50;

function AuditLogPage() {
  const entityLabel = useEntityLabel();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    user_email: "",
    action: "",
    entity_type: "",
    entity_id: "",
    source: "",
    success: "",
    search: "",
  });
  const [applied, setApplied] = useState({ ...filters });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only the current page is fetched — the audit table grows without bound, so
  // the server does the LIMIT/OFFSET and returns the total alongside it.
  const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
  if (applied.from) params.from = applied.from;
  if (applied.to) params.to = applied.to;
  if (applied.user_email) params.user_email = applied.user_email;
  if (applied.action) params.action = applied.action;
  if (applied.entity_type) params.entity_type = applied.entity_type;
  if (applied.entity_id) params.entity_id = applied.entity_id;
  if (applied.source) params.source = applied.source;
  if (applied.success) params.success = applied.success;
  if (applied.search) params.search = applied.search;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["audit-log", params],
    queryFn: () => apiClient.get<AuditResponse>("/audit", params),
    // Hold the previous page while the next one loads. Without this the table
    // blanks between pages and `total` briefly reads 0, which the clamp below
    // would take as "the result shrank" and bounce you back to page 1.
    placeholderData: keepPreviousData,
  });

  const { data: entityTypes } = useQuery({
    queryKey: ["audit-entity-types"],
    queryFn: () => apiClient.get<string[]>("/audit/entity-types"),
  });

  const records = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  // Page maths follows the limit the server actually applied, not the one we
  // asked for — it clamps out-of-range values, and guessing would drift.
  const effectiveLimit = data?.meta?.limit ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));
  const currentPage = Math.min(page, totalPages);
  const firstRow = total === 0 ? 0 : (currentPage - 1) * effectiveLimit + 1;
  const lastRow = Math.min(total, firstRow + records.length - 1);
  const hasFilters = Object.values(applied).some((v) => v !== "");

  // Deleting or filtering can shrink the result past the page being viewed.
  // Snap back rather than showing an empty table with a live page number.
  // Only ever against a settled response: clamping mid-fetch reads the empty
  // in-flight state as "one page" and bounces every navigation back to 1.
  useEffect(() => {
    if (!data || isFetching) return;
    if (page > totalPages) setPage(totalPages);
  }, [data, isFetching, page, totalPages]);

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(1);
  };
  const clearFilters = () => {
    const empty = Object.fromEntries(Object.keys(filters).map((k) => [k, ""])) as typeof filters;
    setFilters(empty);
    setApplied(empty);
    setPage(1);
  };

  const ipt =
    "h-8 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring";
  const sel = `${ipt} min-w-[130px]`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <HStack align="center" gap={2} paddingInline={4} paddingBlock={2} className="border-b border-border bg-background">
        <Button
          size="sm"
          variant={showFilters ? "default" : "outline"}
          className="gap-1.5 text-xs h-8"
          onClick={() => setShowFilters((p) => !p)}
        >
          <Filter size={14} />
          Filters{hasFilters ? ` (${Object.values(applied).filter((v) => v !== "").length})` : ""}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </Button>
        <Text size="xs" color="secondary" className="ml-auto">
          {total.toLocaleString()} {total === 1 ? "record" : "records"}
        </Text>
      </HStack>

      {/* Filter bar */}
      {showFilters && (
        <Box paddingInline={4} paddingBlock={3} border="default" borderSide="bottom" className="bg-muted/10 space-y-3">
          <HStack wrap gap={2} align="center">
            <input
              type="text"
              placeholder="Search…"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className={`${ipt} min-w-[180px]`}
            />
            <input
              type="text"
              placeholder="User email…"
              value={filters.user_email}
              onChange={(e) => setFilters((p) => ({ ...p, user_email: e.target.value }))}
              className={`${ipt} min-w-[160px]`}
            />
            <select
              value={filters.action}
              onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
              className={sel}
            >
              <option value="">All actions</option>
              {[
                "ENTITY_CREATE",
                "ENTITY_UPDATE",
                "ENTITY_DELETE",
                "AUTH_LOGIN",
                "AUTH_LOGOUT",
                "AUTH_LOGIN_FAILED",
                "SYS_FIELD_UPDATE",
                "SYS_TABLE_CHANGE",
                "AI_SQL_EXECUTED",
              ].map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters((p) => ({ ...p, entity_type: e.target.value }))}
              className={sel}
            >
              <option value="">All entities</option>
              {(entityTypes ?? []).map((t) => (
                <option key={t} value={t}>
                  {entityLabel(t)}
                </option>
              ))}
            </select>
            <select
              value={filters.source}
              onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
              className={sel}
            >
              <option value="">All sources</option>
              {["WEB_UI", "API", "AGENT", "SYSTEM"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.success}
              onChange={(e) => setFilters((p) => ({ ...p, success: e.target.value }))}
              className={sel}
            >
              <option value="">Success / Failure</option>
              <option value="true">Success only</option>
              <option value="false">Failures only</option>
            </select>
          </HStack>
          <HStack wrap gap={2} align="center">
            <label className="text-xs text-muted-foreground">
              From
              <input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                className={`${ipt} ml-2`}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              To
              <input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                className={`${ipt} ml-2`}
              />
            </label>
            <input
              type="text"
              placeholder="Entity ID…"
              value={filters.entity_id}
              onChange={(e) => setFilters((p) => ({ ...p, entity_id: e.target.value }))}
              className={`${ipt} min-w-[160px]`}
            />
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={applyFilters}>
              <Search size={14} />
              Apply
            </Button>
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </HStack>
        </Box>
      )}

      {/* Breadcrumb */}
      <HStack align="center" gap={1.5} paddingInline={4} paddingBlock={2} className="border-b border-border bg-background text-sm">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Home size={14} />
          <span>Dashboard</span>
        </Link>
        <Text color="secondary">/</Text>
        <Link to="/admin" className="text-muted-foreground hover:text-primary transition-colors">
          Admin
        </Link>
        <Text color="secondary">/</Text>
        <Text weight="medium" color="primary">Audit Log</Text>
        {hasFilters && (
          <Text size="xs" color="secondary" className="ml-1">
            ({total.toLocaleString()} filtered)
          </Text>
        )}
      </HStack>

      {/* Table */}
      <Box grow scrollable>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <VStack align="center" justify="center" className="h-64 text-muted-foreground">
            <Text size="lg" block>
              {hasFilters ? "No records match your filters" : "No audit records yet"}
            </Text>
            <Text size="sm" block className="mt-1">
              {hasFilters
                ? "Try adjusting filters"
                : "Audit events will appear here as users interact with the app"}
            </Text>
          </VStack>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                  Timestamp
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Changed</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Verify</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {records.map((ev) => (
                <React.Fragment key={ev.id}>
                  <tr
                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                    tabIndex={0}
                    aria-expanded={expandedId === ev.id}
                    onClick={() => setExpandedId((prev) => (prev === ev.id ? null : ev.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId((prev) => (prev === ev.id ? null : ev.id));
                      }
                    }}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {format(parseISO(ev.timestamp), "dd MMM HH:mm:ss")}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-xs leading-tight">
                        <Text weight="medium" truncate block className="max-w-[140px]">
                          {ev.user_name ?? ev.user_id ?? "—"}
                        </Text>
                        {ev.user_email && (
                          <Text color="secondary" truncate block className="max-w-[140px]">
                            {ev.user_email}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{actionBadge(ev.action)}</td>
                    <td className="px-4 py-2 text-xs">
                      {ev.entity_type && <Text weight="medium">{entityLabel(ev.entity_type)}</Text>}
                      {ev.entity_id && (
                        <Text color="secondary" truncate className="block font-mono max-w-[120px]">
                          {ev.entity_id}
                        </Text>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {ev.changed_fields && ev.changed_fields.length > 0 ? (
                        <span
                          className="truncate block max-w-[120px]"
                          title={ev.changed_fields.join(", ")}
                        >
                          {ev.changed_fields.join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{sourceBadge(ev.source)}</td>
                    <td className="px-4 py-2">
                      {ev.success ? (
                        <Text color="success" size="xs" weight="medium">✓ OK</Text>
                      ) : (
                        <span
                          className="text-red-600 text-xs font-medium"
                          title={ev.error_message ?? ""}
                        >
                          ✗ Failed
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <VerifyButton id={ev.id} immudbKey={ev.immudb_key} />
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {expandedId === ev.id ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </td>
                  </tr>
                  {expandedId === ev.id && <DetailRow key={`${ev.id}-detail`} event={ev} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Box>

      {/* Pagination. Always rendered: the row range and the page-size control
          are useful on a single page too, and an audit trail only grows. */}
      <HStack wrap align="center" justify="between" gap={2} paddingInline={4} paddingBlock={2} className="border-t border-border bg-background text-xs text-muted-foreground">
        <span className={isFetching ? "opacity-60" : undefined}>
          {total === 0
            ? "No records"
            : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
        </span>

        <HStack align="center" gap={3}>
          <label className="flex items-center gap-1.5">
            <span>Rows</span>
            <select
              className="swiss-input h-7 w-auto px-2 text-xs"
              value={effectiveLimit}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <span className="tabular-nums">
            Page {currentPage} of {totalPages}
          </span>

          <HStack gap={1}>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </Button>
          </HStack>
        </HStack>
      </HStack>
    </div>
  );
}
