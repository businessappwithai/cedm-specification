import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Database,
  FileText,
  Hash,
  Home,
  Info,
  Layers,
  Plus,
  Search,
  Shield,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { DynamicTable } from "@/components/tables/dynamic-table";
import { DeleteConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  type FieldMetadata,
  useFormFields,
  useGridFields,
  useTableMetadata,
} from "@/hooks/use-entities";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";
import { getFieldTypeColor, getFieldTypeLabel } from "@/lib/field-schema";
import { ADRecordNav } from "./ad-record-nav";
import { ADToolbar } from "./ad-toolbar";
import { WindowHelpDialog } from "./window-help-dialog";
import { Box, Grid, HStack, Heading, Text, VStack } from "@/components/ui/layout";

type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Filter builder types & helpers
// ---------------------------------------------------------------------------

interface FilterRow {
  id: string;
  column: string;
  operator: string;
  value: string;
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

function getFilterCategory(sysReferenceId: number): FilterCategory {
  if (sysReferenceId === 11 || sysReferenceId === 12) return "number";
  if (sysReferenceId === 15 || sysReferenceId === 16) return "date";
  if (sysReferenceId === 20) return "boolean";
  if (sysReferenceId === 17 || sysReferenceId === 18 || sysReferenceId === 19) return "lookup";
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
  const cat = field ? getFilterCategory(field.sys_reference_id) : "text";
  const refId = field?.sys_reference_id ?? 10;

  if (cat === "boolean") {
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
  }
  if (cat === "date") {
    return (
      <input
        type={refId === 16 ? "datetime-local" : "date"}
        value={row.value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  }
  if (cat === "number") {
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
  }
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
  const searchableFields = fields.filter((f) => f.is_displayed_grid && f.column_name !== "id");

  const addRow = () => {
    const first = searchableFields[0];
    if (!first) return;
    const cat = getFilterCategory(first.sys_reference_id);
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        column: first.column_name,
        operator: FILTER_OPERATORS[cat][0].value,
        value: "",
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<FilterRow>) => {
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        if (patch.column && patch.column !== r.column) {
          const f = searchableFields.find((f) => f.column_name === patch.column);
          const cat = f ? getFilterCategory(f.sys_reference_id) : "text";
          updated.operator = FILTER_OPERATORS[cat][0].value;
          updated.value = "";
        }
        return updated;
      })
    );
  };

  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const selectCls =
    "h-8 text-sm border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Box paddingInline={4} paddingBlock={3} border="default" borderSide="bottom" className="bg-muted/10 space-y-2">
      {rows.length === 0 && (
        <Text size="xs" color="secondary" block className="italic py-1">
          No filters — click Add Filter to narrow results.
        </Text>
      )}
      {rows.map((row) => {
        const field = searchableFields.find((f) => f.column_name === row.column);
        const cat = field ? getFilterCategory(field.sys_reference_id) : "text";
        const ops = FILTER_OPERATORS[cat] as readonly { value: string; label: string }[];
        return (
          <div key={row.id} className="flex items-center gap-2 flex-wrap">
            <select
              value={row.column}
              onChange={(e) => updateRow(row.id, { column: e.target.value })}
              className={`${selectCls} min-w-[140px]`}
            >
              {searchableFields.map((f) => (
                <option key={f.column_name} value={f.column_name}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={row.operator}
              onChange={(e) => updateRow(row.id, { operator: e.target.value })}
              className={`${selectCls} min-w-[110px]`}
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
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
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
          disabled={searchableFields.length === 0}
        >
          <Plus size={12} />
          Add Filter
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onApply}
          disabled={rows.length === 0}
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

interface EntityWindowShellProps {
  tableName: string;
  entityLabel: string;
}

function MetadataPanel({
  record,
  fields,
  tableName,
  entityLabel,
}: {
  record: AnyRecord;
  fields?: FieldMetadata[];
  tableName: string;
  entityLabel: string;
}) {
  const { data: tableMeta } = useTableMetadata(tableName);

  const displayedFields = fields?.filter((f) => f.is_displayed) ?? [];
  const fieldCount = displayedFields.length;
  const mandatoryCount = displayedFields.filter((f) => f.is_mandatory).length;
  const readOnlyCount = displayedFields.filter((f) => f.is_read_only).length;

  const typeDistribution = displayedFields.reduce(
    (acc, f) => {
      const label = getFieldTypeLabel(f.sys_reference_id);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Box scrollable border="default" borderSide="start" className="w-72 flex-shrink-0 bg-muted/20">
      <Box padding={4} border="default" borderSide="bottom" className="bg-gradient-to-r from-primary/10 to-primary/5">
        <HStack align="center" gap={2} className="mb-1">
          <Info className="w-4 h-4 text-primary" />
          <Heading level={3} uppercase color="accent">
            Record Info
          </Heading>
        </HStack>
      </Box>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <HStack align="start" gap={2}>
            <Tag className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <Text uppercase color="secondary" weight="medium" block className="text-[10px]">
                Entity
              </Text>
              <Text size="sm" weight="medium" color="primary" truncate block>{entityLabel}</Text>
            </div>
          </HStack>

          <HStack align="start" gap={2}>
            <Database className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <Text uppercase color="secondary" weight="medium" block className="text-[10px]">
                Table
              </Text>
              <Text size="sm" color="primary" block className="font-mono">{tableName}</Text>
            </div>
          </HStack>

          {tableMeta?.description && (
            <HStack align="start" gap={2}>
              <FileText className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <Text uppercase color="secondary" weight="medium" block className="text-[10px]">
                  Description
                </Text>
                <Text size="xs" color="secondary" block className="leading-relaxed">
                  {tableMeta.description}
                </Text>
              </div>
            </HStack>
          )}
        </div>

        <Box border="default" borderSide="top" className="pt-3">
          <Text uppercase color="secondary" weight="medium" block className="text-[10px] mb-2">
            Field Summary
          </Text>
          <Grid columns={2} gap={2}>
            <Box radius="lg" bg="accent" paddingBlock={1.5} className="px-2.5 text-center">
              <Text size="lg" weight="semibold" color="accent" block>{fieldCount}</Text>
              <p className="text-[10px] text-primary/70">Fields</p>
            </Box>
            <Box radius="lg" paddingBlock={1.5} className="bg-amber-500/10 px-2.5 text-center">
              <Text size="lg" weight="semibold" color="warning" block>{mandatoryCount}</Text>
              <p className="text-[10px] text-amber-600/70">Required</p>
            </Box>
            <Box radius="lg" bg="muted" paddingBlock={1.5} className="px-2.5 text-center">
              <Text size="lg" weight="semibold" color="secondary" block>{readOnlyCount}</Text>
              <p className="text-[10px] text-muted-foreground/70">Read-only</p>
            </Box>
            <Box radius="lg" paddingBlock={1.5} className="bg-emerald-500/10 px-2.5 text-center">
              <Text size="lg" weight="semibold" color="success" block>{fieldCount - readOnlyCount}</Text>
              <p className="text-[10px] text-emerald-600/70">Editable</p>
            </Box>
          </Grid>
        </Box>

        {Object.keys(typeDistribution).length > 0 && (
          <Box border="default" borderSide="top" className="pt-3">
            <HStack align="center" gap={1.5} className="mb-2">
              <Layers className="w-3 h-3 text-muted-foreground" />
              <Text uppercase color="secondary" weight="medium" block className="text-[10px]">
                Field Types
              </Text>
            </HStack>
            <HStack wrap gap={1}>
              {Object.entries(typeDistribution).map(([type, count]) => {
                const refId =
                  displayedFields.find((f) => getFieldTypeLabel(f.sys_reference_id) === type)
                    ?.sys_reference_id ?? 0;
                const colorClass = getFieldTypeColor(refId);
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
                  >
                    {type} <span className="opacity-70">({count})</span>
                  </span>
                );
              })}
            </HStack>
          </Box>
        )}

        {!!record.id && (
          <Box border="default" borderSide="top" className="pt-3 space-y-2">
            <Text uppercase color="secondary" weight="medium" block className="text-[10px]">
              Record Details
            </Text>
            <HStack align="start" gap={2}>
              <Hash className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <Text color="secondary" block className="text-[10px]">ID</Text>
                <Text size="xs" color="primary" truncate block className="font-mono">{String(record.id)}</Text>
              </div>
            </HStack>
            {!!record.created_at && (
              <HStack align="start" gap={2}>
                <Calendar className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <Text color="secondary" block className="text-[10px]">Created</Text>
                  <Text size="xs" color="primary" block>
                    {new Date(record.created_at as string).toLocaleString()}
                  </Text>
                </div>
              </HStack>
            )}
            {!!record.updated_at && (
              <HStack align="start" gap={2}>
                <Calendar className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <Text color="secondary" block className="text-[10px]">Updated</Text>
                  <Text size="xs" color="primary" block>
                    {new Date(record.updated_at as string).toLocaleString()}
                  </Text>
                </div>
              </HStack>
            )}
            {record.version != null && (
              <HStack align="start" gap={2}>
                <Shield className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <Text color="secondary" block className="text-[10px]">Version</Text>
                  <Text size="xs" color="primary" block className="font-mono">{String(record.version)}</Text>
                </div>
              </HStack>
            )}
          </Box>
        )}
      </div>
    </Box>
  );
}

export function EntityWindowShell({ tableName, entityLabel }: EntityWindowShellProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authNavigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      authNavigate({ to: "/auth/login" });
    }
  }, [authLoading, isAuthenticated, authNavigate]);

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [appliedRows, setAppliedRows] = useState<FilterRow[]>([]);
  const [pendingRows, setPendingRows] = useState<FilterRow[]>([]);
  const [formData, setFormData] = useState<AnyRecord>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: formFields, isLoading: isLoadingFields } = useFormFields(tableName);
  const { data: gridFields, isLoading: isLoadingGrid } = useGridFields(tableName);

  const activeFilterCount = appliedRows.length;

  const fetchParams: Record<string, unknown> = {
    page,
    limit: 100,
    ...Object.fromEntries(
      appliedRows
        .filter((r) => r.column && r.operator && r.value !== "")
        .map((r) => [`filter.${r.column}`, `${r.operator}:${r.value}`])
    ),
  };

  const {
    data: recordsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["entity-records", tableName, fetchParams],
    queryFn: () => apiClient.get<PaginatedResponse<AnyRecord>>(`/bus/${tableName}`, fetchParams),
  });

  const records = recordsData?.data || [];
  const totalCount = recordsData?.meta?.total || 0;
  const totalPages = recordsData?.meta?.totalPages || 1;

  const currentRecord = isCreating ? null : records[currentIndex] || null;
  const currentRecordId = currentRecord?.id as string | undefined;

  useEffect(() => {
    if (currentRecord && !isCreating) {
      setFormData(currentRecord);
      setHasChanges(false);
    }
  }, [currentRecord, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async (data: AnyRecord) => {
      if (isCreating) {
        return apiClient.post(`/bus/${tableName}`, data);
      }
      return apiClient.patch(`/bus/${tableName}/${currentRecordId}`, data, {
        headers: currentRecord?.version ? { "If-Match": `"${currentRecord.version}"` } : {},
      });
    },
    onSuccess: () => {
      toast.success(isCreating ? `${entityLabel} created` : `${entityLabel} saved`);
      setHasChanges(false);
      setIsCreating(false);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["entity-records", tableName] });
      refetch();
    },
    onError: (error: any) => {
      if (error.statusCode === 412) {
        toast.error("Record was modified by another user. Please refresh and try again.");
        return;
      }
      const msg = error?.message || "Save failed";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!currentRecordId) throw new Error("No record selected");
      return apiClient.delete(`/bus/${tableName}/${currentRecordId}`);
    },
    onSuccess: () => {
      toast.success(`${entityLabel} deleted`);
      setDeleteDialogOpen(false);
      setViewMode("list");
      queryClient.invalidateQueries({ queryKey: ["entity-records", tableName] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Delete failed");
    },
  });

  const globalIndex = (page - 1) * 100 + currentIndex;
  const canGoPrev = globalIndex > 0;
  const canGoNext = globalIndex < totalCount - 1;

  const goFirst = useCallback(() => {
    setPage(1);
    setCurrentIndex(0);
    setIsCreating(false);
  }, []);
  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else if (page > 1) {
      setPage(page - 1);
      setCurrentIndex(99);
    }
    setIsCreating(false);
  }, [currentIndex, page]);
  const goNext = useCallback(() => {
    if (currentIndex < records.length - 1) setCurrentIndex(currentIndex + 1);
    else if (page < totalPages) {
      setPage(page + 1);
      setCurrentIndex(0);
    }
    setIsCreating(false);
  }, [currentIndex, records.length, page, totalPages]);
  const goLast = useCallback(() => {
    setPage(totalPages);
    setCurrentIndex(0);
    setIsCreating(false);
  }, [totalPages]);

  const handleRowSelect = useCallback(
    (row: AnyRecord) => {
      const idx = records.findIndex((r) => r.id === row.id);
      if (idx !== -1) setCurrentIndex(idx);
      setViewMode("detail");
      setIsEditing(false);
    },
    [records]
  );

  const handleNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setViewMode("detail");
    setFormData({});
    setHasChanges(false);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (currentRecordId && !isCreating && viewMode === "detail") {
      setDeleteDialogOpen(true);
    }
  };

  const handleUndo = () => {
    if (currentRecord) setFormData(currentRecord);
    else setFormData({});
    setHasChanges(false);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (currentRecord) setFormData(currentRecord);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleAdvancedSearchApply = useCallback(() => {
    setAppliedRows([...pendingRows]);
    setPage(1);
    setCurrentIndex(0);
  }, [pendingRows]);

  const handleAdvancedSearchClear = useCallback(() => {
    setPendingRows([]);
    setAppliedRows([]);
    setPage(1);
    setCurrentIndex(0);
  }, []);

  const handleFormChange = useCallback(() => {
    if (!hasChanges) setHasChanges(true);
  }, [hasChanges]);

  const handleFormSubmit = async (data: AnyRecord) => {
    setFormData(data);
    saveMutation.mutate(data);
  };

  return (
    <div className="flex flex-col h-full">
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={(currentRecord?.name as string) || entityLabel}
        onConfirm={() => deleteMutation.mutate()}
        isConfirming={deleteMutation.isPending}
      />

      <ADToolbar
        onNew={handleNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onEdit={handleEdit}
        onCancelEdit={handleCancelEdit}
        onRefresh={() => refetch()}
        onAdvancedSearchToggle={() => setAdvancedSearchOpen((o) => !o)}
        advancedFilterCount={activeFilterCount}
        isAdvancedSearchOpen={advancedSearchOpen}
        isSaving={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
        hasChanges={hasChanges || isCreating}
        canDelete={!!currentRecordId && !isCreating && viewMode === "detail"}
        isEditing={isEditing || isCreating}
        isDetailView={viewMode === "detail" && !isCreating}
      />

      {advancedSearchOpen && (
        <FilterBuilder
          fields={gridFields ?? []}
          rows={pendingRows}
          onChange={setPendingRows}
          onApply={handleAdvancedSearchApply}
          onClear={handleAdvancedSearchClear}
        />
      )}

      <HStack align="center" justify="between" paddingInline={4} paddingBlock={2} className="border-b border-border bg-gradient-to-r from-indigo-100 to-sky-50">
        <HStack align="center" gap={3}>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          {viewMode === "detail" ? (
            <>
              <button type="button"
                onClick={() => {
                  setViewMode("list");
                  setIsCreating(false);
                  setIsEditing(false);
                  setHasChanges(false);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {entityLabel}
              </button>
              <span className="text-muted-foreground/40">/</span>
              <Text size="xs" weight="medium" color="primary">
                {isCreating
                  ? "New Record"
                  : (currentRecord?.name as string) || (currentRecord?.id as string) || ""}
              </Text>
            </>
          ) : (
            <>
              <Text size="xs" weight="medium" color="primary">{entityLabel}</Text>
              {totalCount > 0 && (
                <Text color="accent" weight="medium" className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px]">
                  {totalCount} records
                </Text>
              )}
            </>
          )}
          <WindowHelpDialog tableName={tableName} entityLabel={entityLabel} />
        </HStack>
        {viewMode === "detail" && !isCreating && (
          <ADRecordNav
            currentIndex={currentIndex}
            totalCount={totalCount}
            page={page}
            pageSize={100}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onFirst={goFirst}
            onPrev={goPrev}
            onNext={goNext}
            onLast={goLast}
          />
        )}
      </HStack>

      <Box grow scrollable>
        {isLoading || isLoadingFields || isLoadingGrid ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          records.length === 0 ? (
            <VStack align="center" justify="center" className="h-64 text-muted-foreground">
              <Database className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <Text size="lg" weight="medium" block>No records found</Text>
              <Text size="sm" block className="mt-1">Click + to create a new {entityLabel.toLowerCase()}</Text>
            </VStack>
          ) : (
            <div className="p-4">
              <DynamicTable
                tableName={tableName}
                fields={gridFields}
                data={records}
                isLoading={isLoading}
                totalCount={totalCount}
                page={page}
                pageSize={100}
                onPageChange={setPage}
                onRowClick={handleRowSelect}
              />
            </div>
          )
        ) : (
          <div className="flex h-full">
            <Box grow scrollable padding={6} onChange={handleFormChange}>
              <DynamicForm
                key={isCreating ? "new" : currentRecordId || "empty"}
                tableName={tableName}
                initialData={isCreating ? {} : currentRecord || {}}
                onSubmit={handleFormSubmit}
                mode={isCreating ? "create" : isEditing ? "edit" : "view"}
                readOnly={!isEditing && !isCreating}
                isSaving={saveMutation.isPending}
              />
            </Box>
            {!isCreating && currentRecord && (
              <MetadataPanel
                record={currentRecord}
                fields={formFields}
                tableName={tableName}
                entityLabel={entityLabel}
              />
            )}
          </div>
        )}
      </Box>
    </div>
  );
}
