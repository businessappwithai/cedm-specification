"use client";

/**
 * Dynamic Table Component
 *
 * Renders a data table based on sys_field metadata from the Application Dictionary.
 * Columns are ordered by seq_no_grid which can be modified at runtime.
 *
 * Auto-generated component
 */

import { useQueries } from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type FieldMetadata, useGridFields } from "@/hooks/use-entities";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";
import { useTranslations } from "@/lib/translations";
import { CSV_EXPORT_LIMIT, csvFileName, downloadCsv, toCsv } from "@/lib/csv";
import { referenceLabel } from "@/lib/utils";
import { Box, HStack, Text } from "@/components/ui/layout";

// ============================================================================
// Types
// ============================================================================

interface DynamicTableProps {
  tableName: string;
  fields?: FieldMetadata[];
  data: Record<string, unknown>[];
  isLoading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  selectedId?: string;
}

// ============================================================================
// Reference Type Constants
// ============================================================================

const REFERENCE_TYPE = {
  STRING: 10,
  INTEGER: 11,
  AMOUNT: 12,
  ID: 13,
  TEXT: 14,
  DATE: 15,
  DATETIME: 16,
  LIST: 17,
  TABLE: 18,
  TABLE_DIRECT: 19,
  YES_NO: 20,
  URL: 24,
  EMAIL: 30,
  PHONE: 31,
};

// ============================================================================
// Cell Formatters
// ============================================================================

function formatCellValue(value: unknown, referenceId: number): string {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (referenceId) {
    case REFERENCE_TYPE.YES_NO:
      return value ? "Yes" : "No";

    case REFERENCE_TYPE.DATE:
      try {
        return format(new Date(value as string), "dd/MM/yyyy");
      } catch {
        return String(value);
      }

    case REFERENCE_TYPE.DATETIME:
      try {
        return format(new Date(value as string), "dd/MM/yyyy HH:mm:ss");
      } catch {
        return String(value);
      }

    case REFERENCE_TYPE.AMOUNT: {
      const numAmt = typeof value === "number" ? value : Number.parseFloat(String(value));
      return Number.isNaN(numAmt)
        ? String(value)
        : numAmt.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
    }

    case REFERENCE_TYPE.INTEGER: {
      const numInt = typeof value === "number" ? value : Number.parseInt(String(value), 10);
      return Number.isNaN(numInt) ? String(value) : numInt.toLocaleString();
    }

    case REFERENCE_TYPE.TEXT: {
      // Truncate long text
      const text = String(value);
      return text.length > 100 ? `${text.slice(0, 100)}...` : text;
    }

    case REFERENCE_TYPE.URL:
      return String(value);

    case REFERENCE_TYPE.EMAIL:
      return String(value);

    default:
      return String(value);
  }
}

// ============================================================================
// Column Generator
// ============================================================================

type LookupMap = Record<string, Record<string, string>>; // refTable → id → displayName

function generateColumns(
  fields: FieldMetadata[],
  lookupMap: LookupMap = {}
): ColumnDef<Record<string, unknown>>[] {
  return fields.map((field) => ({
    id: field.column_name,
    accessorKey: field.column_name,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          {field.name}
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue(field.column_name);
      const isLookup =
        field.sys_reference_id === REFERENCE_TYPE.TABLE ||
        field.sys_reference_id === REFERENCE_TYPE.TABLE_DIRECT;
      if (isLookup && value != null && field.ref_table_name) {
        const tableMap = lookupMap[field.ref_table_name];
        const displayName = tableMap?.[String(value)];
        return <Text truncate className="block max-w-[200px]">{displayName ?? String(value)}</Text>;
      }
      return (
        <Text truncate className="block max-w-[200px]">
          {formatCellValue(value, field.sys_reference_id)}
        </Text>
      );
    },
    enableSorting: true,
    enableFiltering: true,
  }));
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-4" data-testid="table-loading-skeleton">
      <HStack gap={2}>
        <Skeleton className="h-10 w-64" />
      </HStack>
      <Box radius="md" border="default">
        <Table data-testid="entity-table">
          <TableHeader>
            <TableRow>
              {[1, 2, 3, 4].map((i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {[1, 2, 3, 4].map((cell) => (
                  <TableCell key={cell}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </div>
  );
}

// ============================================================================
// Dynamic Table Component
// ============================================================================

export function DynamicTable({
  tableName,
  fields: externalFields,
  data,
  isLoading: dataLoading = false,
  totalCount = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange: _onPageSizeChange,
  onRowClick,
  onDelete: _onDelete,
  onView,
  onEdit,
  selectedId,
}: DynamicTableProps) {
  const { t } = useTranslations();
  const {
    data: fetchedFields,
    isLoading: fetchFieldsLoading,
    error,
  } = useGridFields(tableName, { enabled: !externalFields });
  const fields = externalFields || fetchedFields;
  const fieldsLoading = externalFields ? false : fetchFieldsLoading;

  // Collect unique lookup fields from the current data
  const lookupFieldDefs = useMemo(() => {
    if (!fields) return [];
    return fields.filter(
      (f) =>
        (f.sys_reference_id === REFERENCE_TYPE.TABLE ||
          f.sys_reference_id === REFERENCE_TYPE.TABLE_DIRECT) &&
        !!f.ref_table_name
    );
  }, [fields]);

  // For each lookup field, collect unique FK values from data
  const lookupQueries = useMemo(() => {
    return lookupFieldDefs
      .map((f) => {
        const uniqueIds = Array.from(
          new Set(
            data
              .map((row) => row[f.column_name])
              .filter((v) => v != null)
              .map(String)
          )
        );
        return { field: f, uniqueIds };
      })
      .filter((q) => q.uniqueIds.length > 0);
  }, [lookupFieldDefs, data]);

  // Several columns can point at the same referenced table — a compound with
  // both a `submitted_by` and an `approved_by` FK to bus_scientist, say. Fetch
  // each referenced table once: passing the same queryKey twice to useQueries
  // makes React Query drop the duplicate and warn, leaving a result slot that
  // does not line up with the field it was meant for.
  const lookupSources = useMemo(() => {
    const byTable = new Map<
      string,
      { field: (typeof lookupFieldDefs)[number]; endpoint: string }
    >();
    for (const { field } of lookupQueries) {
      const refTable = field.ref_table_name;
      if (!refTable || byTable.has(refTable)) continue;
      const entity = refTable.replace(/^bus_/, "");
      byTable.set(refTable, { field, endpoint: field.ref_endpoint ?? `/bus/${entity}` });
    }
    return Array.from(byTable.entries()).map(([refTable, v]) => ({ refTable, ...v }));
  }, [lookupQueries]);

  const lookupResults = useQueries({
    queries: lookupSources.map(({ refTable, endpoint }) => ({
      queryKey: ["lookup", refTable, endpoint],
      queryFn: () =>
        apiClient.get<PaginatedResponse<Record<string, unknown>>>(endpoint, { limit: 500 }),
      staleTime: 60_000,
    })),
  });

  // Build a lookup map: { refTableName: { id: displayName } }
  const lookupMap = useMemo<LookupMap>(() => {
    const map: LookupMap = {};
    lookupSources.forEach(({ field }, i) => {
      const result = lookupResults[i];
      if (!result?.data) return;
      const records = Array.isArray(result.data) ? result.data : ((result.data as any).data ?? []);
      const idField = field.ref_id_field ?? "id";
      // The dictionary describes a label as `ref_label_fields` — a list, so an
      // entity identified by more than one column reads properly. Honour it
      // before the single `ref_label_field`; defaulting straight to "name"
      // rendered a raw UUID for every table that names its records something
      // else (bus_experiment.title, say).
      const labelFields: string[] = (field as any).ref_label_fields?.length
        ? (field as any).ref_label_fields
        : field.ref_label_field
          ? [field.ref_label_field]
          : ["name"];
      const tableMap: Record<string, string> = {};
      for (const rec of records) {
        const id = String((rec as any)[idField] ?? "");
        if (id) tableMap[id] = referenceLabel(rec as Record<string, unknown>, labelFields, id);
      }
      if (field.ref_table_name) map[field.ref_table_name] = tableMap;
    });
    return map;
  }, [lookupSources, lookupResults]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle delete with confirmation
  const handleDeleteClick = useCallback((rowId: string) => {
    const row = data.find((r) => (r as any).id === rowId);
    const rowName = row
      ? (row as any).name || (row as any).title || (row as any).patient_name || `Record #${rowId}`
      : undefined;
    setRowToDelete({ id: rowId, name: rowName });
    setDeleteDialogOpen(true);
  }, [data]);

  /**
   * Download the list as CSV.
   *
   * The rows are fetched rather than read off the screen: `data` holds one page
   * and the point of the export is the list, so it asks the API for the first
   * CSV_EXPORT_LIMIT rows. Cells go through the same formatter and the same
   * lookup map the grid renders with, so a date, an enum-bound column and a
   * referenced record read in the file exactly as they read on screen — an
   * export of raw uuids and ISO timestamps would be a different document from
   * the one the reader asked for.
   */
  const handleExportCsv = async () => {
    if (!fields || fields.length === 0) return;
    setIsExporting(true);
    try {
      const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>(
        `/bus/${tableName}`,
        { page: 1, limit: CSV_EXPORT_LIMIT }
      );
      const rows = Array.isArray(response)
        ? (response as Record<string, unknown>[])
        : (response?.data ?? []);

      const headers = fields.map((field) => field.name);
      const body = rows.map((row) =>
        fields.map((field) => {
          const value = row[field.column_name];
          if (value === null || value === undefined) return "";

          const isLookup =
            field.sys_reference_id === REFERENCE_TYPE.TABLE ||
            field.sys_reference_id === REFERENCE_TYPE.TABLE_DIRECT;
          if (isLookup && field.ref_table_name) {
            const label = lookupMap[field.ref_table_name]?.[String(value)];
            return label ?? String(value);
          }

          // A dash is the table's way of drawing an empty cell; a CSV says the
          // same thing with an empty field, and a literal "-" would import as
          // data.
          const formatted = formatCellValue(value, field.sys_reference_id);
          return formatted === "-" ? "" : formatted;
        })
      );

      downloadCsv(csvFileName(tableName), toCsv(headers, body));

      if (totalCount > rows.length) {
        toast.success(`Exported ${rows.length} of ${totalCount} rows`, {
          description: `A download holds at most ${CSV_EXPORT_LIMIT} rows. Narrow the list with a filter to export the rest.`,
        });
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!rowToDelete || !_onDelete) return;

    setIsDeleting(true);
    try {
      await _onDelete(rowToDelete.id);
      setDeleteDialogOpen(false);
      setRowToDelete(null);

      // Show success toast (handled by the parent component's mutation)
    } catch (error) {
      // Show error toast
      const errorMessage =
        error instanceof Error ? error.message : t("common.unexpectedError" as any);
      toast.error(t("table.deleteFailed" as any), {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate columns from field metadata (ordered by seq_no_grid)
  const columns = useMemo(() => {
    const baseColumns = !fields ? [] : generateColumns(fields, lookupMap);

    // Add actions column FIRST if callbacks are provided
    if (onView || onEdit || _onDelete) {
      baseColumns.unshift({
        id: "actions",
        header: t("common.actions" as any),
        cell: ({ row }) => {
          // The primary key column is always 'id' in the database schema
          const rowId = row.original.id as string;

          return (
            <HStack gap={2}>
              {onView && (
                <button type="button"
                  onClick={() => onView(rowId)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </button>
              )}
              {onEdit && (
                <button type="button"
                  onClick={() => onEdit(rowId)}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Edit
                </button>
              )}
              {_onDelete && (
                <button type="button"
                  onClick={() => handleDeleteClick(rowId)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              )}
            </HStack>
          );
        },
        enableSorting: false,
        // enableFiltering is not supported in TanStack Table v8
      });
    }

    return baseColumns;
  }, [fields, onView, onEdit, _onDelete, handleDeleteClick, t, lookupMap]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  if (fieldsLoading || dataLoading) {
    return <TableSkeleton />;
  }

  if (error && !externalFields) {
    return (
      <Box radius="md" padding={4} className="bg-destructive/15 text-destructive">
        Failed to load table columns: {error.message}
      </Box>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <Box radius="md" bg="muted" padding={4} className="text-muted-foreground">
        No columns configured for grid display.
      </Box>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={rowToDelete?.name}
        onConfirm={confirmDelete}
        isConfirming={isDeleting}
      />

      {/* Search */}
      <HStack align="center" justify="between" gap={2}>
        <Box grow maxWidth="sm" className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </Box>
        {/* Record Count - Moved above table */}
        <HStack align="center" gap={3}>
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of{" "}
              {totalCount} entries
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting || !fields || fields.length === 0}
            data-testid="export-csv"
            aria-label="Download this list as CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "CSV"}
          </Button>
        </HStack>
      </HStack>

      {/* Table */}
      <Box radius="md" border="default" data-testid="entity-table-container">
        <Table data-testid="entity-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-700 hover:bg-slate-700">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-white font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // The primary key column is always 'id' in the database schema
                const rowId = row.original.id as string;
                const isSelected = selectedId === rowId;

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected && "selected"}
                    className={`${onRowClick ? "cursor-pointer hover:bg-primary/10" : ""} ${row.index % 2 === 1 ? "bg-primary/[0.04]" : ""} transition-colors`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow data-testid="no-results-row">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <HStack align="center" justify="end" gap={2}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <Text size="sm">
            Page {page} of {totalPages}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight size={16} />
          </Button>
        </HStack>
      )}
    </div>
  );
}
