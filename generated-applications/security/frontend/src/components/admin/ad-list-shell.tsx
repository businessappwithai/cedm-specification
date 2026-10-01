import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Plus, Search, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { DynamicTable } from "@/components/tables/dynamic-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FieldMetadata } from "@/hooks/use-entities";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";
import { ADToolbar } from "./ad-toolbar";
import {
  type ADLevel,
  buildAdminDetailUrl,
  buildAdminListUrl,
  type ParentContext,
} from "./ad-window-configs";
import { useBusTableName, WindowHelpDialog } from "./window-help-dialog";
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Filter builder — operators derived from field metadata (sys_reference_id)
// ---------------------------------------------------------------------------

interface FilterRow {
  id: string;
  column: string;
  operator: string;
  value: string;
}

function pluralLabel(label: string): string {
  if (label.endsWith("y") && !/[aeiou]y$/i.test(label)) return `${label.slice(0, -1)}ies`;
  if (
    label.endsWith("s") ||
    label.endsWith("sh") ||
    label.endsWith("ch") ||
    label.endsWith("x") ||
    label.endsWith("z")
  )
    return `${label}es`;
  return `${label}s`;
}

const FILTER_OPERATORS = {
  text: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "equals" },
    { value: "startsWith", label: "starts with" },
    { value: "endsWith", label: "ends with" },
  ],
  number: [
    { value: "equals", label: "=" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
  ],
  date: [
    { value: "equals", label: "on" },
    { value: "gt", label: "after" },
    { value: "gte", label: "on or after" },
    { value: "lt", label: "before" },
    { value: "lte", label: "on or before" },
  ],
  boolean: [{ value: "equals", label: "is" }],
  lookup: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "equals" },
  ],
} as const;

type FilterCategory = keyof typeof FILTER_OPERATORS;

function filterCategory(refId: number): FilterCategory {
  if (refId === 11 || refId === 12) return "number";
  if (refId === 15 || refId === 16) return "date";
  if (refId === 20) return "boolean";
  if (refId === 17 || refId === 18 || refId === 19) return "lookup";
  return "text";
}

function FilterValueInput({
  row,
  field,
  onChange,
}: {
  row: FilterRow;
  field: FieldMetadata | undefined;
  onChange: (v: string) => void;
}) {
  const cls =
    "h-8 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px]";
  const cat = field ? filterCategory(field.sys_reference_id) : "text";
  if (cat === "boolean")
    return (
      <select
        value={row.value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        style={{ minWidth: 100 }}
      >
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  if (cat === "date")
    return (
      <input
        type={field?.sys_reference_id === 16 ? "datetime-local" : "date"}
        value={row.value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  if (cat === "number")
    return (
      <input
        type="number"
        value={row.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value…"
        className={cls}
        style={{ minWidth: 120 }}
      />
    );
  return (
    <input
      type="text"
      value={row.value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value…"
      className={cls}
    />
  );
}

function FilterBuilder({
  fields,
  rows,
  onChange,
  onApply,
  onClear,
}: {
  fields: FieldMetadata[];
  rows: FilterRow[];
  onChange: (rows: FilterRow[]) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const searchable = fields.filter((f) => f.is_displayed_grid);
  const addRow = () => {
    const f = searchable[0];
    if (!f) return;
    const cat = filterCategory(f.sys_reference_id);
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        column: f.column_name,
        operator: FILTER_OPERATORS[cat][0].value,
        value: "",
      },
    ]);
  };
  const updateRow = (id: string, patch: Partial<FilterRow>) =>
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const u = { ...r, ...patch };
        if (patch.column && patch.column !== r.column) {
          const f2 = searchable.find((f) => f.column_name === patch.column);
          const cat = f2 ? filterCategory(f2.sys_reference_id) : "text";
          u.operator = FILTER_OPERATORS[cat][0].value;
          u.value = "";
        }
        return u;
      })
    );
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const sel =
    "h-8 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring";
  return (
    <Box paddingInline={4} paddingBlock={3} border="default" borderSide="bottom" className="bg-muted/10 space-y-2">
      {rows.length === 0 && (
        <Text size="xs" color="secondary" block className="italic py-1">
          No filters — click Add Filter to narrow results.
        </Text>
      )}
      {rows.map((row) => {
        const field = searchable.find((f) => f.column_name === row.column);
        const cat = field ? filterCategory(field.sys_reference_id) : "text";
        const ops = FILTER_OPERATORS[cat] as readonly { value: string; label: string }[];
        return (
          <div key={row.id} className="flex items-center gap-2 flex-wrap">
            <select
              value={row.column}
              onChange={(e) => updateRow(row.id, { column: e.target.value })}
              className={`${sel} min-w-[140px]`}
            >
              {searchable.map((f) => (
                <option key={f.column_name} value={f.column_name}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={row.operator}
              onChange={(e) => updateRow(row.id, { operator: e.target.value })}
              className={`${sel} min-w-[110px]`}
            >
              {ops.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <FilterValueInput
              row={row}
              field={field}
              onChange={(v) => updateRow(row.id, { value: v })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeRow(row.id)}
            >
              <X size={14} />
            </Button>
          </div>
        );
      })}
      <HStack align="center" gap={2} className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={addRow}
          disabled={!searchable.length}
        >
          <Plus size={12} />
          Add Filter
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onApply}
          disabled={!rows.length}
        >
          <Search size={14} />
          Apply
        </Button>
        {rows.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={onClear}
          >
            Clear All
          </Button>
        )}
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cache identity of a breadcrumb ancestor — one fetch per endpoint+id. */
function parentKey({ level, id }: ParentContext): string {
  return `${level.endpoint}|${id}`;
}

/** Collapse repeated ancestors so useQueries never receives a duplicate key. */
function dedupeParents(parentCtx: ParentContext[]): ParentContext[] {
  const seen = new Set<string>();
  return parentCtx.filter((p) => {
    const key = parentKey(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Build parent filter params from context — uses level.parentField from metadata */
function parentFilterParams(parentCtx: ParentContext[], level: ADLevel): Record<string, string> {
  if (!parentCtx.length || !level.parentField) return {};
  const { id } = parentCtx[parentCtx.length - 1];
  return { [level.parentField]: id };
}

// ---------------------------------------------------------------------------
// ADListShell
// ---------------------------------------------------------------------------

export interface ADListShellProps {
  level: ADLevel;
  /** Parent levels with their record IDs — drives URL construction and API filtering */
  parentContext: ParentContext[];
  dashboardHref?: string;
  /** If true, inserts an "Admin" breadcrumb link between Dashboard and the entity crumbs */
  showAdminCrumb?: boolean;
  /** If true, hides Create/Edit actions — list is display-only */
  viewOnly?: boolean;
}

export function ADListShell({
  level,
  parentContext,
  dashboardHref = "/dashboard",
  showAdminCrumb = false,
  viewOnly = false,
}: ADListShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingRows, setPendingRows] = useState<FilterRow[]>([]);
  const [appliedRows, setAppliedRows] = useState<FilterRow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  // The toolbar's Save submits the inline create form by id, through the
  // form's own submit handler. Without it the toolbar offered a Save while the
  // form was open and the button did nothing.
  const createFormId = useId();
  const [createErrors, setCreateErrors] = useState<string[]>([]);

  // The physical table behind this window, from the dictionary. Empty for the
  // admin windows, which are served from /sys/ and have no business window.
  const busTableName = useBusTableName(level.endpoint);

  // Fetch each parent record's display name for the breadcrumb.
  // A self-referencing hierarchy can put the same record in the trail twice, so
  // fetch each distinct endpoint+id once — duplicate keys in a single
  // useQueries call are dropped by React Query, which would shift every result
  // after the duplicate onto the wrong breadcrumb.
  const uniqueParents = dedupeParents(parentContext);
  const parentNameQueries = useQueries({
    queries: uniqueParents.map(({ level: l, id }) => ({
      queryKey: ["ad-parent-name", l.endpoint, id],
      queryFn: () => apiClient.get<AnyRecord>(`${l.endpoint}/${id}`),
      enabled: !!id,
    })),
  });
  const parentRecordByKey = new Map<string, AnyRecord | undefined>(
    uniqueParents.map((p, i) => [parentKey(p), parentNameQueries[i]?.data as AnyRecord | undefined])
  );
  const parentNames: string[] = parentContext.map((pc, i) => {
    const rec = parentRecordByKey.get(parentKey(pc));
    if (!rec) return parentContext[i].id;
    const pl = parentContext[i].level;
    if (pl.nameField === "first_name" && rec.last_name) {
      return `${rec.first_name ?? ""} ${rec.last_name ?? ""}`.trim();
    }
    return (rec[pl.nameField] as string) ?? parentContext[i].id;
  });

  // Build fetch params: parent filter + pagination + applied search filters
  const fetchParams: Record<string, unknown> = {
    page,
    limit: 100,
    ...parentFilterParams(parentContext, level),
  };
  for (const row of appliedRows) {
    if (row.column && row.operator && row.value !== "") {
      fetchParams[`filter.${row.column}`] = `${row.operator}:${row.value}`;
    }
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ad-list", level.endpoint, fetchParams],
    queryFn: () => apiClient.get<PaginatedResponse<AnyRecord>>(level.endpoint, fetchParams),
  });

  const records = data?.data ?? [];
  const totalCount = data?.meta?.total ?? 0;
  const activeFilterCount = appliedRows.filter((r) => r.value !== "").length;

  const createMutation = useMutation({
    mutationFn: (formData: AnyRecord) =>
      apiClient.post<AnyRecord>(level.endpoint, {
        ...formData,
        ...parentFilterParams(parentContext, level),
      }),
    onSuccess: (newRecord) => {
      const newId = newRecord[level.idField] as string;
      toast.success(`${level.label} created`);
      queryClient.invalidateQueries({ queryKey: ["ad-list", level.endpoint] });
      setIsCreating(false);
      setCreateErrors([]);
      if (newId) navigate({ to: buildAdminDetailUrl(parentContext, level, newId) as never });
    },
    onError: (err: any) => {
      const specific = Array.isArray(err?.errors) ? (err.errors as string[]) : null;
      const fallback = Array.isArray(err?.message)
        ? err.message.join(", ")
        : (err?.message ?? "Failed to create");
      setCreateErrors(specific ?? [fallback]);
      toast.error(specific?.[0] ?? fallback);
    },
  });

  // Breadcrumbs built purely from metadata + fetched parent names
  const crumbs: { label: string; href?: string }[] = [];
  for (let i = 0; i < parentContext.length; i++) {
    const { level: pl, id } = parentContext[i];
    const grandParentCtx = parentContext.slice(0, i);
    crumbs.push({ label: pluralLabel(pl.label), href: buildAdminListUrl(grandParentCtx, pl) });
    crumbs.push({ label: parentNames[i] ?? id, href: buildAdminDetailUrl(grandParentCtx, pl, id) });
  }
  crumbs.push({ label: pluralLabel(level.label) }); // current level — no link

  return (
    <div className="flex flex-col h-full">
      <ADToolbar
        onNew={
          viewOnly
            ? undefined
            : () => {
                setIsCreating(true);
                setSearchOpen(false);
              }
        }
        onRefresh={() => refetch()}
        onAdvancedSearchToggle={() => {
          setSearchOpen((p) => !p);
          if (searchOpen) setPendingRows([...appliedRows]);
        }}
        isAdvancedSearchOpen={searchOpen}
        advancedFilterCount={activeFilterCount}
        onSave={() =>
          (document.getElementById(createFormId) as HTMLFormElement | null)?.requestSubmit()
        }
        onUndo={() => {
          setIsCreating(false);
          setCreateErrors([]);
        }}
        isSaving={createMutation.isPending}
        isDeleting={false}
        hasChanges={isCreating}
        canCreate={!viewOnly}
        canDelete={false}
        isDetailView={false}
      />

      {searchOpen && !isCreating && (
        <FilterBuilder
          fields={level.gridFields}
          rows={pendingRows}
          onChange={setPendingRows}
          onApply={() => {
            setAppliedRows([...pendingRows]);
            setPage(1);
          }}
          onClear={() => {
            setPendingRows([]);
            setAppliedRows([]);
            setPage(1);
          }}
        />
      )}

      {/* Breadcrumb bar */}
      <HStack align="center" gap={1.5} paddingInline={4} paddingBlock={2} wrap className="border-b border-border bg-background text-sm">
        <Link
          to={dashboardHref as never}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Home size={14} />
          <span>Dashboard</span>
        </Link>
        {showAdminCrumb && (
          <span className="flex items-center gap-1.5">
            <Text color="secondary">/</Text>
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Admin
            </Link>
          </span>
        )}
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${c.href ?? i}`} className="flex items-center gap-1.5">
            <Text color="secondary">/</Text>
            {c.href ? (
              <Link
                to={c.href as never}
                className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]"
              >
                {c.label}
              </Link>
            ) : (
              <Text weight="medium" color="primary">{c.label}</Text>
            )}
          </span>
        ))}
        {activeFilterCount > 0 && (
          <Text size="xs" color="secondary" className="ml-1">({totalCount} filtered)</Text>
        )}
        <WindowHelpDialog
          tableName={busTableName}
          entityLabel={level.label}
        />
      </HStack>

      {/* Content */}
      <Box grow scrollable>
        {/* Inline create form */}
        {isCreating && (
          <Box padding={6} border="default" borderSide="bottom" className="bg-muted/10">
            <HStack align="center" justify="between" className="mb-4">
              <Heading level={3}>New {level.label}</Heading>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setCreateErrors([]);
                }}
              >
                <X size={16} />
              </Button>
            </HStack>
            <DynamicForm
              tableName={level.id}
              fields={level.formFields}
              initialData={{}}
              onSubmit={(fd) => createMutation.mutate(fd)}
              formId={createFormId}
              mode="create"
              isSaving={createMutation.isPending}
            />
            {createErrors.length > 0 && (
              <Box marginTop={3} radius="md" padding={3} border="default" className="border-destructive/50 bg-destructive/10">
                <Text size="sm" weight="medium" color="danger" block className="mb-1">Validation failed</Text>
                <ul className="text-xs text-destructive/90 space-y-0.5 list-disc list-inside">
                  {createErrors.map((e, i) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : records.length === 0 && !isCreating ? (
          <VStack align="center" justify="center" className="h-64 text-muted-foreground">
            <Text size="lg" block>
              {activeFilterCount > 0 ? "No records match your filters" : "No records found"}
            </Text>
            <Text size="sm" block className="mt-1">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : `Click + to create a new ${level.label.toLowerCase()}`}
            </Text>
          </VStack>
        ) : (
          <div className="p-4">
            <DynamicTable
              tableName={level.id}
              fields={level.gridFields || level.formFields}
              data={records}
              isLoading={isLoading}
              totalCount={totalCount}
              page={page}
              pageSize={100}
              onPageChange={setPage}
              onRowClick={
                viewOnly
                  ? undefined
                  : (row) => {
                      const id = String(row[level.idField]);
                      navigate({ to: buildAdminDetailUrl(parentContext, level, id) as never });
                    }
              }
            />
          </div>
        )}
      </Box>
    </div>
  );
}
