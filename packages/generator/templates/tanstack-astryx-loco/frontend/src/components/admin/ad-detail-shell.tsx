import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ExternalLink,
  FilePlus2,
  FileX2,
  History,
  Home,
  MessageSquare,
  Pencil,
  Printer,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { DynamicTable } from "@/components/tables/dynamic-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type FieldMetadata, refreshDropdowns, useEntityMetadata } from "@/hooks/use-entities";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";
import { ADRecordNav } from "./ad-record-nav";
import { ADToolbar } from "./ad-toolbar";
import {
  type ADChildTabConfig,
  type ADLevel,
  buildAdminDetailUrl,
  buildAdminListUrl,
  type ParentContext,
} from "./ad-window-configs";
import { DocStatusBadge } from "./doc-status-badge";
import { useBusTableName, WindowHelpDialog } from "./window-help-dialog";
import { useReportDesign } from "./use-report-designs";
import { ReportPrintModal } from "@/components/reports/report-print-modal";
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Inline child tab panel
// Row clicks navigate to the child's detail URL (metadata-derived)
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

interface ChildPanelProps {
  childTab: ADChildTabConfig;
  parentRecord: AnyRecord;
  selfLevel: ADLevel;
  parentContext: ParentContext[];
}

function ChildPanel({ childTab, parentRecord, selfLevel, parentContext }: ChildPanelProps) {
  const navigate = useNavigate();
  const childLevel = childTab.level;
  const parentId = parentRecord[selfLevel.idField] as string;

  // Context for child-level URLs includes all ancestors + this record
  const childParentCtx: ParentContext[] = [...parentContext, { level: selfLevel, id: parentId }];

  const params: Record<string, unknown> = { limit: 100 };
  if (childLevel.parentField) params[childLevel.parentField] = parentId;

  const { data, isLoading } = useQuery({
    queryKey: ["ad-child", childLevel.endpoint, parentId],
    queryFn: () => apiClient.get<PaginatedResponse<AnyRecord>>(childLevel.endpoint, params),
    enabled: !!parentId,
  });

  const records = data?.data ?? [];
  const totalCount = data?.meta?.total ?? 0;

  return (
    <div>
      {/* Child list link */}
      <HStack paddingInline={4} align="center" justify="between" className="pt-3 pb-1">
        <Text size="xs" weight="medium" color="secondary" uppercase>
          {totalCount} {childLevel.label}
          {totalCount !== 1 ? "s" : ""}
        </Text>
        <Link
          to={buildAdminListUrl(childParentCtx, childLevel) as never}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ExternalLink size={12} />
        </Link>
      </HStack>
      <div className="p-4">
        <DynamicTable
          tableName={childLevel.id}
          fields={childLevel.gridFields || childLevel.formFields}
          data={records}
          isLoading={isLoading}
          totalCount={totalCount}
          page={1}
          pageSize={100}
          onPageChange={() => {}}
          onRowClick={(row) => {
            const childId = String(row[childLevel.idField]);
            navigate({ to: buildAdminDetailUrl(childParentCtx, childLevel, childId) as never });
          }}
        />
      </div>
    </div>
  );
}

// Child tab trigger with live count badge
function ChildTabTrigger({
  childTab,
  parentId,
  isActive,
}: {
  childTab: ADChildTabConfig;
  parentId: string;
  isActive: boolean;
}) {
  const childLevel = childTab.level;
  const params: Record<string, unknown> = { limit: 1 };
  if (childLevel.parentField) params[childLevel.parentField] = parentId;

  const { data } = useQuery({
    queryKey: ["ad-child-count", childLevel.endpoint, parentId],
    queryFn: () => apiClient.get<PaginatedResponse<AnyRecord>>(childLevel.endpoint, params),
    enabled: !!parentId && childTab.badge === "count",
  });

  return (
    <TabsTrigger
      value={childTab.id}
      className={`rounded-none border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {childTab.label}
      {data?.meta?.total !== undefined && (
        <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
          {data.meta.total}
        </Badge>
      )}
    </TabsTrigger>
  );
}

// ---------------------------------------------------------------------------
// Notes on a record — what a person wanted to say about it
// ---------------------------------------------------------------------------

/** As the API returns it: the `sys_note` row, column names and all. */
interface RecordNote {
  sys_note_id: string;
  note: string;
  user_name?: string | null;
  user_email?: string | null;
  created_at: string;
}

/**
 * Notes sit above the audit trail, and the order is the argument.
 *
 * The trail records what the system observed and must not be editable; a note
 * is somebody's sentence about the same record. One list would make the history
 * writable, which is the one thing an audit trail may not be — so they are two
 * sections, two tables, and only the note is something a person chose to write.
 *
 * A note cannot be edited or deleted once left. That is not an omission: a note
 * somebody can quietly rewrite is worth about as much as a conversation nobody
 * remembers, and the API offers no update or delete path either.
 */
function EntityNotes({ entityType, recordId }: { entityType: string; recordId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["entity-notes", entityType, recordId],
    queryFn: () => apiClient.get<RecordNote[]>(`/records/${entityType}/${recordId}/notes`),
    staleTime: 30_000,
    retry: false,
  });

  const addNote = useMutation({
    mutationFn: (note: string) =>
      apiClient.post<RecordNote>(`/records/${entityType}/${recordId}/notes`, { note }),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["entity-notes", entityType, recordId] });
      toast.success("Note added");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Could not add the note");
    },
  });

  const notes = data ?? [];
  const trimmed = draft.trim();

  return (
    <Box className="px-6 py-4 border-t border-border">
      <HStack align="center" gap={2} className="mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <Text size="sm" weight="semibold">Notes</Text>
        {notes.length > 0 && <Badge variant="secondary">{notes.length}</Badge>}
      </HStack>

      <HStack align="start" gap={2} className="mb-3">
        <Textarea
          value={draft}
          // The Astryx Textarea does not forward `maxLength`, so the cap is
          // applied here. `sys_note.note` is TEXT and takes more, but a note
          // longer than this is a document rather than a remark.
          onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
          placeholder="Add a note about this record…"
          rows={2}
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          size="sm"
          disabled={!trimmed || addNote.isPending}
          onClick={() => addNote.mutate(trimmed)}
        >
          {addNote.isPending ? "Adding…" : "Add note"}
        </Button>
      </HStack>

      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : notes.length === 0 ? (
        <Text size="sm" color="secondary" className="italic">No notes yet.</Text>
      ) : (
        <ol className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.sys_note_id}
              className="rounded-md border border-border bg-muted/10 px-3 py-2"
            >
              <HStack align="center" gap={2} className="mb-1">
                <Text size="xs" weight="medium">
                  {note.user_name ?? note.user_email ?? "unknown"}
                </Text>
                <Text size="xs" color="secondary" className="ml-auto">
                  {new Date(note.created_at).toLocaleString()}
                </Text>
              </HStack>
              {/* Plain text: a note is whatever somebody typed. */}
              <Text size="sm" block className="whitespace-pre-wrap">{note.note}</Text>
            </li>
          ))}
        </ol>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The record's own audit trail
// ---------------------------------------------------------------------------

interface AuditEvent {
  id: string;
  timestamp: string;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  changed_fields?: string[];
  before_value?: Record<string, unknown> | null;
  after_value?: Record<string, unknown> | null;
}

interface AuditResponse {
  data: AuditEvent[];
  meta: { total: number; limit: number };
}

function auditActionIcon(action: string) {
  if (action.endsWith("CREATE")) return <FilePlus2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (action.endsWith("DELETE")) return <FileX2 className="h-3.5 w-3.5 text-red-500" />;
  return <Pencil className="h-3.5 w-3.5 text-blue-500" />;
}

function auditActionLabel(action: string): string {
  if (action.endsWith("CREATE")) return "Created";
  if (action.endsWith("DELETE")) return "Deleted";
  if (action.endsWith("UPDATE")) return "Updated";
  return action.replace(/_/g, " ");
}

/**
 * `/records/:entity/:id/history`, not `/audit`.
 *
 * The whole audit log is administrator-only and rightly so — it spans every
 * table and carries the before and after of every changed field. This asks only
 * for the record already on screen, gated on that entity's own `read`, so an
 * ordinary user sees the history of the thing they are looking at. Against
 * `/audit` they saw nothing at all, which reads as "this record has never been
 * touched" rather than "you may not see this".
 */
/**
 * Print this record, when somebody has designed a report for its entity.
 *
 * Absent rather than disabled when no design exists: a Print button that
 * opens an empty page teaches the reader that printing is broken, and there
 * is nothing they can do about it from here — drawing the design is an
 * administrator's job on a different screen.
 */
function RecordPrintButton({
  entityType,
  entityLabel,
  record,
}: {
  entityType: string;
  entityLabel: string;
  record: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { data: design } = useReportDesign(entityType);

  if (!design?.layout) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title={`Print this ${entityLabel}`}
      >
        <Printer size={14} className="mr-1.5" />
        Print
      </Button>
      {open && (
        <ReportPrintModal
          open={open}
          onClose={() => setOpen(false)}
          layout={design.layout}
          data={record}
          entityLabel={entityLabel}
        />
      )}
    </>
  );
}

function EntityAuditTrail({ entityType, recordId }: { entityType: string; recordId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["entity-audit", entityType, recordId],
    queryFn: () => apiClient.get<AuditResponse>(`/records/${entityType}/${recordId}/history`),
    staleTime: 30_000,
    retry: false,
  });

  const events = data?.data ?? [];

  if (isLoading) {
    return (
      <Box className="px-6 py-4 border-t border-border">
        <HStack align="center" gap={2} className="mb-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <Text size="sm" weight="semibold" color="secondary">Audit Trail</Text>
        </HStack>
        <VStack gap={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </VStack>
      </Box>
    );
  }

  // A table without `is_changelog` records nothing, and an empty "Audit Trail"
  // heading invites a reader to look for history that was never kept.
  if (events.length === 0) return null;

  return (
    <Box className="px-6 py-4 border-t border-border bg-muted/10">
      <HStack align="center" gap={2} className="mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <Text size="sm" weight="semibold">Audit Trail</Text>
        <Badge variant="secondary">{data?.meta?.total ?? events.length}</Badge>
      </HStack>

      <ol className="relative border-l border-border ml-1.5 space-y-0">
        {events.map((event) => {
          const isOpen = expanded === event.id;
          const changedFields = event.changed_fields ?? [];
          const hasDetail =
            changedFields.length > 0 || !!event.before_value || !!event.after_value;

          return (
            <li key={event.id} className="ml-4 pb-4">
              <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                {auditActionIcon(event.action)}
              </span>

              <HStack align="start" gap={2} className="flex-wrap">
                <Box className="flex-1 min-w-0">
                  <HStack align="center" gap={2}>
                    <Text size="sm" weight="medium">{auditActionLabel(event.action)}</Text>
                    {(event.user_name || event.user_email) && (
                      <Text size="xs" color="secondary">
                        by {event.user_name ?? event.user_email}
                      </Text>
                    )}
                    <Text size="xs" color="secondary" className="ml-auto">
                      {new Date(event.timestamp).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </Text>
                  </HStack>
                  {changedFields.length > 0 && (
                    <Text size="xs" color="secondary" block className="mt-0.5">
                      Changed: {changedFields.join(", ")}
                    </Text>
                  )}
                </Box>

                {hasDetail && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : event.id)}
                    className="text-[11px] text-primary hover:underline shrink-0"
                  >
                    {isOpen ? "Less" : "Details"}
                  </button>
                )}
              </HStack>

              {isOpen && (event.before_value || event.after_value) && (
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <Box>
                    <Text size="xs" weight="semibold" color="secondary" block className="mb-1">Before</Text>
                    <pre className="bg-muted border border-border rounded p-2 overflow-auto max-h-36 whitespace-pre-wrap text-[11px]">
                      {event.before_value ? JSON.stringify(event.before_value, null, 2) : "—"}
                    </pre>
                  </Box>
                  <Box>
                    <Text size="xs" weight="semibold" color="secondary" block className="mb-1">After</Text>
                    <pre className="bg-muted border border-border rounded p-2 overflow-auto max-h-36 whitespace-pre-wrap text-[11px]">
                      {event.after_value ? JSON.stringify(event.after_value, null, 2) : "—"}
                    </pre>
                  </Box>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ADDetailShell
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Summary Panel — shows highlight fields in the entity detail header
// ---------------------------------------------------------------------------

function SummaryRefValue({ field, id }: { field: FieldMetadata; id: string }) {
  const refTableFull = field.ref_table_name ?? "";
  const entity = refTableFull.startsWith("bus_") ? refTableFull.slice(4) : refTableFull;
  const { data } = useQuery({
    queryKey: ["summary-ref", refTableFull, id],
    queryFn: () => apiClient.get<AnyRecord>(`/bus/${entity}/${id}`),
    enabled: !!entity && !!id,
    staleTime: 30_000,
  });

  if (!data) return <Text size="xs" className="text-muted-foreground/60 italic">—</Text>;

  const displayValue: string = data.first_name
    ? `${String(data.first_name ?? "")} ${String(data.last_name ?? "")}`.trim()
    : data.name != null
      ? String(data.name)
      : `${id.slice(0, 8)}…`;

  return <span>{displayValue}</span>;
}

function SummaryFieldValue({ field, record }: { field: FieldMetadata; record: AnyRecord }) {
  const value = record[field.column_name];

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/60 italic">—</span>;
  }

  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;

  if (field.sys_reference_id === 15 || field.sys_reference_id === 16) {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) return <span>{d.toLocaleDateString()}</span>;
  }

  if (field.sys_reference_id === 18 || field.sys_reference_id === 19) {
    return <SummaryRefValue field={field} id={String(value)} />;
  }

  return <span>{String(value)}</span>;
}

function SummaryPanel({ fields, record }: { fields: FieldMetadata[]; record: AnyRecord }) {
  if (!fields.length) return null;
  return (
    <Box radius="lg" padding={3} border="default" className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/80 min-w-[200px] max-w-[340px] self-start">
      <HStack align="center" gap={1.5} className="mb-2 pb-1.5 border-b border-amber-200/60">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
        <Text size="xs" weight="semibold" uppercase className="text-amber-700 tracking-wide">
          Highlights
        </Text>
      </HStack>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.sys_field_id} className="flex items-baseline gap-2 min-w-0">
            <Text weight="medium" uppercase className="text-[10px] text-amber-600/70 shrink-0 tracking-wide">
              {f.name}
            </Text>
            <Text size="sm" weight="semibold" color="primary" truncate className="flex-1 text-right">
              <SummaryFieldValue field={f} record={record} />
            </Text>
          </div>
        ))}
      </div>
    </Box>
  );
}

export interface ADDetailShellProps {
  level: ADLevel;
  recordId: string;
  /** Ancestor levels with their IDs — drives breadcrumbs, URL construction, and sibling filtering */
  parentContext: ParentContext[];
  dashboardHref?: string;
  /** Whether the detail opens in view-only or edit mode. Defaults to 'edit' (admin behaviour).
   *  Set to 'view' for bus entity pages so users see read-only first, then click Edit. */
  initialMode?: "view" | "edit";
}

export function ADDetailShell({
  level,
  recordId,
  parentContext,
  dashboardHref = "/dashboard",
  initialMode = "view",
}: ADDetailShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<AnyRecord>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeChildTab, setActiveChildTab] = useState(() => level.childTabs?.[0]?.id ?? "");
  const [isEditing, setIsEditing] = useState(initialMode === "edit");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  /**
   * The business table this window sits on, or "" for a dictionary window.
   *
   * The physical name, not the route segment. `sys_report_designs.table_name`
   * is matched literally, so the segment `company` finds no design where
   * `bus_company` finds it — the Print button simply never appeared. The notes
   * and history routes resolve either form through the dictionary, but there
   * is no reason for one screen to hold two names for one table.
   */
  const busTableName = useBusTableName(level.endpoint);

  // Fetch entity metadata to resolve summary fields — skip for sys-level windows that supply static fields
  const hasDynamicFields = !level.formFields || level.formFields.length === 0;
  const { data: entityMeta } = useEntityMetadata(level.id, hasDynamicFields);
  const summaryFields: FieldMetadata[] = (entityMeta?.columns ?? []).filter(
    (c: any) => c.group_layout_type === "summary" && c.is_displayed
  ) as FieldMetadata[];

  // Fetch each parent record's display name for breadcrumbs.
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
  // Immediate parent record data — used to filter child lookup dropdowns
  const immediateParentData =
    parentContext.length > 0
      ? (parentRecordByKey.get(parentKey(parentContext[parentContext.length - 1])) ?? {})
      : {};
  const parentNames: string[] = parentContext.map((pc, i) => {
    const rec = parentRecordByKey.get(parentKey(pc));
    if (!rec) return parentContext[i].id;
    const pl = parentContext[i].level;
    if (pl.nameField === "first_name" && rec.last_name) {
      return `${rec.first_name ?? ""} ${rec.last_name ?? ""}`.trim();
    }
    return (rec[pl.nameField] as string) ?? parentContext[i].id;
  });

  // Build parent filter from metadata (level.parentField)
  const parentFilter: Record<string, unknown> = {};
  if (parentContext.length && level.parentField) {
    parentFilter[level.parentField] = parentContext[parentContext.length - 1].id;
  }

  const fetchParams = { page, limit: 100, ...parentFilter };

  // Fetch the sibling list for prev/next navigation
  const {
    data: listData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ad-detail-list", level.endpoint, fetchParams],
    queryFn: () => apiClient.get<PaginatedResponse<AnyRecord>>(level.endpoint, fetchParams),
  });

  const records = listData?.data ?? [];
  const totalCount = listData?.meta?.total ?? 0;
  const totalPages = listData?.meta?.totalPages ?? 1;

  // The record the URL names, fetched by id. The sibling page above exists for
  // prev/next and holds 100 rows; reading the record out of it meant any record
  // past the first page — a new one, in a table of any size — rendered "Record
  // not found" while the API served it.
  const {
    data: fetchedRecord,
    isLoading: isRecordLoading,
    refetch: refetchRecord,
  } = useQuery({
    queryKey: ["ad-detail-record", level.endpoint, recordId],
    queryFn: () => apiClient.get<AnyRecord>(`${level.endpoint}/${recordId}`),
  });

  // Where the record sits among the loaded siblings, or -1 when it is not on
  // this page. String comparison handles numeric ids (e.g. sys_reference_id)
  // against the URL's string param.
  const siblingIndex = records.findIndex((r) => String(r[level.idField]) === String(recordId));
  useEffect(() => {
    if (siblingIndex !== -1) setCurrentIndex(siblingIndex);
  }, [siblingIndex]);

  const currentRecord = fetchedRecord ?? null;
  const globalIndex = (page - 1) * 100 + currentIndex;
  const canGoPrev = globalIndex > 0;
  const canGoNext = globalIndex < totalCount - 1;

  // Reset form when record changes
  useEffect(() => {
    if (currentRecord) {
      setFormData(currentRecord);
      setHasChanges(false);
    }
  }, [currentRecord]);

  const saveMutation = useMutation({
    mutationFn: (data: AnyRecord) => apiClient.patch(`${level.endpoint}/${recordId}`, data),
    onSuccess: () => {
      toast.success("Saved");
      setHasChanges(false);
      setSaveErrors([]);
      if (initialMode === "view") setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["ad-detail-list", level.endpoint] });
      refetch();
      refetchRecord();
    },
    onError: (err: any) => {
      const specific = Array.isArray(err?.errors) ? (err.errors as string[]) : null;
      const fallback = Array.isArray(err?.message)
        ? err.message.join(", ")
        : (err?.message ?? "Save failed");
      setSaveErrors(specific ?? [fallback]);
      toast.error(specific?.[0] ?? fallback);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`${level.endpoint}/${recordId}`),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["ad-detail-list", level.endpoint] });
      navigate({ to: buildAdminListUrl(parentContext, level) as never });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed"),
  });

  // Record navigation — URL changes to reflect the selected sibling
  const navigateToIndex = useCallback(
    (idx: number, p: number) => {
      const record = records[idx];
      if (!record) return;
      setPage(p);
      setCurrentIndex(idx);
      navigate({
        to: buildAdminDetailUrl(parentContext, level, String(record[level.idField])) as never,
      });
    },
    [records, level, parentContext, navigate]
  );

  const goFirst = () => {
    setPage(1);
    navigateToIndex(0, 1);
  };
  const goPrev = () =>
    currentIndex > 0
      ? navigateToIndex(currentIndex - 1, page)
      : page > 1 && navigateToIndex(99, page - 1);
  const goNext = () =>
    currentIndex < records.length - 1
      ? navigateToIndex(currentIndex + 1, page)
      : page < totalPages && navigateToIndex(0, page + 1);
  const goLast = () => {
    setPage(totalPages);
    setCurrentIndex(0);
  };

  // Breadcrumbs — entirely from metadata + fetched parent names, zero hardcoded strings
  const crumbs: { label: string; href?: string }[] = [];
  for (let i = 0; i < parentContext.length; i++) {
    const { level: pl, id } = parentContext[i];
    const grandParentCtx = parentContext.slice(0, i);
    crumbs.push({ label: pluralLabel(pl.label), href: buildAdminListUrl(grandParentCtx, pl) });
    crumbs.push({ label: parentNames[i] ?? id, href: buildAdminDetailUrl(grandParentCtx, pl, id) });
  }
  crumbs.push({ label: pluralLabel(level.label), href: buildAdminListUrl(parentContext, level) });
  const currentName = currentRecord
    ? level.nameField === "first_name" && currentRecord.last_name
      ? `${currentRecord.first_name ?? ""} ${currentRecord.last_name ?? ""}`.trim()
      : ((currentRecord[level.nameField] as string) ?? recordId)
    : recordId;
  crumbs.push({ label: currentName }); // current record — no link

  const listHref = buildAdminListUrl(parentContext, level);

  return (
    <div className="flex flex-col h-full">
      <ADToolbar
        onSave={() => saveMutation.mutate(formData)}
        onDelete={() => deleteMutation.mutate()}
        onUndo={() => {
          if (currentRecord) {
            setFormData(currentRecord);
            setHasChanges(false);
          }
        }}
        onRefresh={() => {
          // The record, and every dropdown on the form read again from the API.
          refetch();
          refreshDropdowns(queryClient);
        }}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => {
          setIsEditing(false);
          if (currentRecord) {
            setFormData(currentRecord);
            setHasChanges(false);
          }
        }}
        isSaving={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
        hasChanges={hasChanges}
        canDelete={!!recordId && isEditing}
        canCreate={false}
        isEditing={isEditing}
        isDetailView={true}
      />

      {/* Header panel — breadcrumb + record identity + nav */}
      <Box border="default" borderSide="bottom" className="bg-gradient-to-r from-background to-muted/30">
        {/* Top row: breadcrumb trail */}
        <HStack align="center" gap={1.5} paddingInline={6} className="pt-4 pb-1 text-xs text-muted-foreground">
          <Link
            to={dashboardHref as never}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
          {crumbs.slice(0, -1).map((c, i) => (
            <span key={`${c.label}-${c.href ?? i}`} className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">/</span>
              {c.href ? (
                <Link
                  to={c.href as never}
                  className="hover:text-primary transition-colors truncate max-w-[180px]"
                >
                  {c.label}
                </Link>
              ) : (
                <Text truncate className="max-w-[240px]">{c.label}</Text>
              )}
            </span>
          ))}
        </HStack>

        {/* Bottom row: record name + status + nav + summary panel */}
        <HStack align="start" gap={4} paddingInline={6} className="pb-4 pt-1">
          {/* Left: title + nav */}
          <Box grow width="min">
            <HStack align="center" gap={3} wrap>
              <button type="button"
                onClick={() => navigate({ to: listHref as never })}
                className="text-xs text-primary hover:underline font-medium flex-shrink-0 flex items-center gap-1"
              >
                ← List
              </button>
              <span className="text-muted-foreground/40">|</span>
              <Heading level={1} color="primary" truncate>{currentName}</Heading>
              {!!currentRecord?.doc_status && currentRecord.doc_status !== "none" && (
                <DocStatusBadge
                  status={currentRecord.doc_status as string}
                  message={currentRecord.doc_status_message as string}
                />
              )}
              <WindowHelpDialog
                tableName={busTableName}
                entityLabel={level.label}
              />
              {busTableName && currentRecord && (
                <RecordPrintButton
                  entityType={busTableName}
                  entityLabel={level.label}
                  record={currentRecord}
                />
              )}
            </HStack>
            {/* A position is only shown when it is known: a record opened by
                URL from outside the loaded page has none on this page. */}
            {siblingIndex !== -1 && (
            <div className="mt-1.5">
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
            </div>
            )}
          </Box>
          {/* Right: Summary Panel */}
          {summaryFields.length > 0 && currentRecord && (
            <SummaryPanel fields={summaryFields} record={currentRecord} />
          )}
        </HStack>
      </Box>

      {/* Content */}
      <Box grow scrollable>
        {isLoading || isRecordLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : !currentRecord ? (
          <VStack align="center" justify="center" className="h-64 text-muted-foreground">
            <Text size="lg" block>Record not found</Text>
            <Button variant="link" onClick={() => navigate({ to: listHref as never })}>
              Back to list
            </Button>
          </VStack>
        ) : (
          <>
            {/* Detail form */}
            <Box padding={6} border="default" borderSide="bottom">
              <DynamicForm
                tableName={level.id}
                fields={level.formFields}
                initialData={currentRecord}
                onSubmit={(fd) => {
                  setFormData(fd);
                  setHasChanges(false);
                  saveMutation.mutate(fd);
                }}
                onChange={(fd) => {
                  setFormData(fd);
                  setHasChanges(true);
                  setSaveErrors([]);
                }}
                mode={isEditing ? "edit" : "view"}
                readOnly={!isEditing}
                isSaving={saveMutation.isPending}
                parentContext={immediateParentData}
              />
              {saveErrors.length > 0 && (
                <Box marginTop={3} radius="md" padding={3} border="default" className="border-destructive/50 bg-destructive/10">
                  <Text size="sm" weight="medium" color="danger" block className="mb-1">Validation failed</Text>
                  <ul className="text-xs text-destructive/90 space-y-0.5 list-disc list-inside">
                    {saveErrors.map((e, i) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>

            {/* Inline child tabs — row clicks navigate to child detail URL */}
            {level.childTabs && level.childTabs.length > 0 && (
              <Box border="default" borderSide="top">
                <Tabs value={activeChildTab} onValueChange={setActiveChildTab}>
                  <Box border="default" borderSide="bottom" className="bg-muted/30">
                    <TabsList className="h-auto p-0 bg-transparent rounded-none">
                      {level.childTabs.map((ct) => (
                        <ChildTabTrigger
                          key={ct.id}
                          childTab={ct}
                          parentId={recordId}
                          isActive={activeChildTab === ct.id}
                        />
                      ))}
                    </TabsList>
                  </Box>
                  {level.childTabs.map((ct) => (
                    <TabsContent key={ct.id} value={ct.id} className="m-0">
                      <ChildPanel
                        childTab={ct}
                        parentRecord={currentRecord}
                        selfLevel={level}
                        parentContext={parentContext}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </Box>
            )}

            {/* Below the child tabs, because they are about this record rather
                than about the records under it. Notes first: the trail is what
                the system observed, the notes are what people said, and only
                one of them is something a reader can add to.

                Business records only. `/api/records/*` resolves its entity
                through the dictionary, which knows `bus_*` tables and not `sys`
                segments — so on an admin window the calls would 404 and the
                notes panel would say "No notes yet", which claims something it
                does not know. The endpoint is what tells the two apart. */}
            {busTableName && (
              <>
                <EntityNotes entityType={busTableName} recordId={recordId} />
                <EntityAuditTrail entityType={busTableName} recordId={recordId} />
              </>
            )}
          </>
        )}
      </Box>
    </div>
  );
}
