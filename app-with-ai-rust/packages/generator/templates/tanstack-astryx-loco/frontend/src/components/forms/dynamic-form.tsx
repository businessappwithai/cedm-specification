"use client";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  FileText,
  Hash,
  HelpCircle,
  KeyRound,
  Link2,
  List,
  Lock,
  Mail,
  Phone,
  Table2,
  ToggleLeft,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { type FieldMetadata, useEntity, useFormFields, useRefList } from "@/hooks/use-entities";
import { apiClient } from "@/lib/api-client";
import { getFieldTypeColor, getFieldTypeLabel, validateFormData } from "@/lib/field-schema";
import { getFieldLabel } from "@/lib/i18n-fields";
import { useTranslations } from "@/lib/translations";
import { cn, referenceLabel } from "@/lib/utils";
import { Box, HStack, Heading, Text } from "@/components/ui/layout";

interface DynamicFormProps {
  tableName: string;
  fields?: FieldMetadata[];
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  /** Called whenever any field value changes — useful for parent to track dirty state */
  onChange?: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  isSaving?: boolean;
  mode?: "create" | "edit" | "view";
  readOnly?: boolean;
  serverErrors?: Record<string, string>;
  parentField?: string;
  readOnlyFields?: string[];
  /** Data from the immediate parent record — used to filter lookup dropdowns (e.g. filter columns by parent tab's sys_table_id) */
  parentContext?: Record<string, unknown>;
  /**
   * `id` of the rendered `<form>`, so a control outside it — a toolbar Save —
   * can submit it with `requestSubmit()` and go through the same validation and
   * normalisation as the form's own button.
   */
  formId?: string;
}

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
  PASSWORD: 29,
};

type FormValues = Record<string, unknown>;

/**
 * Fill in every Yes/No field the user never touched with `false`.
 *
 * TanStack Form only records a field once it changes, so a checkbox left alone
 * is missing from the value map rather than present and false. The dictionary
 * marks these columns NOT NULL, so the backend is right to reject the absence —
 * the form is what was lying about the answer.
 */
function applyBooleanDefaults(
  value: Record<string, unknown>,
  fields: FieldMetadata[] | undefined
): void {
  if (!fields) return;
  for (const field of fields) {
    if (field.sys_reference_id !== REFERENCE_TYPE.YES_NO) continue;
    const current = value[field.column_name];
    if (current === undefined || current === null || current === "") {
      value[field.column_name] = false;
    }
  }
}

function getFieldIcon(sysReferenceId: number) {
  switch (sysReferenceId) {
    case REFERENCE_TYPE.STRING:
      return Type;
    case REFERENCE_TYPE.INTEGER:
      return Hash;
    case REFERENCE_TYPE.AMOUNT:
      return Hash;
    case REFERENCE_TYPE.EMAIL:
      return Mail;
    case REFERENCE_TYPE.URL:
      return Link2;
    case REFERENCE_TYPE.PHONE:
      return Phone;
    case REFERENCE_TYPE.DATE:
    case REFERENCE_TYPE.DATETIME:
      return Calendar;
    case REFERENCE_TYPE.YES_NO:
      return ToggleLeft;
    case REFERENCE_TYPE.TEXT:
      return FileText;
    case REFERENCE_TYPE.PASSWORD:
      return KeyRound;
    case REFERENCE_TYPE.TABLE:
    case REFERENCE_TYPE.TABLE_DIRECT:
      return Table2;
    default:
      return sysReferenceId >= 1000 ? List : Type;
  }
}

/**
 * A lookup's label on the read-only detail view.
 *
 * Two sources, the same two the editable picker uses: a custom endpoint
 * (`/sys/references` and friends) or an ordinary business table named by
 * `ref_table_name`. Only the custom one was fetched here, so every lookup at a
 * business table fell through to `label = id` and the detail view rendered a
 * raw UUID — `Compound Id  9980b173-201c-…` where the grid two clicks away
 * showed the compound's SMILES. The grid was right because it reads
 * `ref_label_fields`; this read the singular `ref_label_field` and defaulted to
 * "name", which most entities do not have.
 */
function TableReferenceViewValue({ field, id }: { field: FieldMetadata; id: string }) {
  const customEndpoint = field.ref_endpoint || null;
  const referencedTableName = field.ref_table_name || null;
  const idField = field.ref_id_field || "id";

  const { data } = useQuery({
    queryKey: ["table-ref-view", customEndpoint, id],
    // `enabled` below guarantees a value here, but the callback's type cannot
    // know that; the guard says it instead of asserting it.
    queryFn: () =>
      customEndpoint
        ? apiClient.get<{ data: any[] }>(customEndpoint, { limit: 500 })
        : Promise.resolve({ data: [] }),
    enabled: !!customEndpoint && !!id,
  });

  // The one record, by id. This used to read the first page of the referenced
  // table (25 rows) and look for the record in it, so a city past the first
  // page showed as a raw id.
  const { data: one } = useEntity<any>(referencedTableName || "", id, {
    enabled: !!referencedTableName && !customEndpoint && !!id,
  });

  const records: any[] = customEndpoint ? ((data as any)?.data ?? []) : one ? [one] : [];
  const record = records.find((r: any) => String(r[idField]) === String(id));

  // Same precedence as the grid: the dictionary's list first, then the single
  // field, then "name". Kept in step with `dynamic-table.tsx` — a lookup that
  // reads one way in a list and another on the record it opens is worse than
  // either being wrong on its own.
  const labelFields: string[] = (field as any).ref_label_fields?.length
    ? (field as any).ref_label_fields
    : field.ref_label_field
      ? [field.ref_label_field]
      : ["name"];

  // Falls back to the id while the fetch is in flight, which is what it showed
  // before and is still better than an empty cell.
  const label = record ? referenceLabel(record, labelFields, id) : id;
  return <span>{label}</span>;
}

interface TableReferenceFieldProps {
  field: FieldMetadata;
  fieldApi: any;
  isDisabled: boolean;
  error: string | undefined;
  parentContext?: Record<string, unknown>;
  /** The entity the form edits, which the lookup endpoint is addressed by. */
  entityName: string;
  form: any;
}

function TableReferenceField({
  field,
  fieldApi,
  isDisabled,
  error,
  parentContext,
  entityName,
  form,
}: TableReferenceFieldProps) {
  const referencedTableName = field.ref_table_name || null;
  const idField = field.ref_id_field || "id";

  // The columns of this record that narrow the choices: a state is offered only
  // from the country already chosen, a city from its state. Their current values
  // go to the lookup endpoint, which does the narrowing — the list that comes
  // back is already the right one.
  const narrowedBy: string[] = (field as any).narrowed_by ?? [];
  const formValues = form.useStore((state: any) => state.values) as Record<string, unknown>;
  const controlValues: Record<string, string> = {};
  for (const control of narrowedBy) {
    const value = formValues?.[control];
    if (value !== undefined && value !== null && value !== "") controlValues[control] = String(value);
  }

  // Resolve filtered endpoint: append ref_filter_param=<parentContext[ref_filter_source]> when configured
  const filterValue =
    field.ref_filter_source && parentContext ? parentContext[field.ref_filter_source] : undefined;
  const customEndpoint = field.ref_endpoint
    ? field.ref_filter_param && filterValue != null
      ? `${field.ref_endpoint}?${field.ref_filter_param}=${encodeURIComponent(String(filterValue))}`
      : field.ref_endpoint
    : null;

  // Custom endpoint (e.g. /sys/references) — use apiClient directly
  const { data: customData, isLoading: isLoadingCustom } = useQuery({
    queryKey: ["table-ref-custom", customEndpoint],
    queryFn: () =>
      customEndpoint
        ? apiClient.get<{ data: any[] }>(customEndpoint, { limit: 500 })
        : Promise.resolve({ data: [] }),
    enabled: !!customEndpoint,
  });

  // A business table: the lookup endpoint returns every choice (a dropdown is
  // not paged, and a list page of 25 offered a fraction of them), narrowed by
  // the dictionary's rule for this column.
  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: ["lookup", entityName, field.column_name, controlValues],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        `/bus/${entityName}/lookup/${field.column_name}`,
        controlValues
      ),
    enabled: !!referencedTableName && !customEndpoint,
  });

  const isLoading = isLoadingCustom || isLoadingRecords;
  const tableRecords: any[] = customEndpoint
    ? ((customData as any)?.data ?? [])
    : ((records as any)?.data ?? []);

  // What a choice is called: the dictionary's identifier columns, joined — the
  // code and the name where an entity has both ("US · United States").
  const labelFields: string[] = (field as any).ref_label_fields?.length
    ? (field as any).ref_label_fields
    : field.ref_label_field
      ? [field.ref_label_field]
      : ["name"];

  // When a control changes, a choice that no longer belongs to it is cleared
  // rather than left selected: change the country and the state chosen for the
  // old one would otherwise stay on the record, and the server would refuse it.
  const currentChoice = fieldApi.state.value;
  const stillOffered = tableRecords.some((record) => String(record[idField]) === String(currentChoice));
  useEffect(() => {
    if (
      narrowedBy.length > 0 &&
      !isLoading &&
      currentChoice !== undefined &&
      currentChoice !== null &&
      currentChoice !== "" &&
      !stillOffered
    ) {
      fieldApi.handleChange("");
    }
  }, [narrowedBy.length, isLoading, currentChoice, stillOffered, fieldApi]);

  if (!referencedTableName && !customEndpoint) {
    return (
      <Input
        id={field.column_name}
        name={field.column_name}
        value={(fieldApi.state.value as string) || ""}
        onChange={(e) => fieldApi.handleChange(e.target.value)}
        onBlur={fieldApi.handleBlur}
        disabled={isDisabled}
        className={cn(error && "border-destructive")}
      />
    );
  }

  const currentValue = fieldApi.state.value;

  return isLoading ? (
    <Skeleton className="h-10 w-full" />
  ) : (
    <select
      id={field.column_name}
      name={field.column_name}
      value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ""}
      onChange={(e) => {
        const raw = e.target.value;
        // Preserve numeric IDs for sys_reference_id etc.
        const parsed = raw !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
        fieldApi.handleChange(parsed || raw);
      }}
      onBlur={fieldApi.handleBlur}
      disabled={isDisabled}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive"
      )}
    >
      <option value="">Select {field.name}...</option>
      {tableRecords.map((record: any) => {
        const optValue = record[idField];
        const optLabel = referenceLabel(record, labelFields, String(optValue));
        return (
          <option key={String(optValue)} value={String(optValue)}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}

function FieldTypeBadge({ field }: { field: FieldMetadata }) {
  const Icon = getFieldIcon(field.sys_reference_id);
  const typeLabel = getFieldTypeLabel(field.sys_reference_id);
  const colorClass = getFieldTypeColor(field.sys_reference_id);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        colorClass
      )}
    >
      <Icon className="h-3 w-3" />
      {typeLabel}
    </span>
  );
}

function FieldHelpPopover({ help, fieldName }: { help: string; fieldName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label={`Help for ${fieldName}`}
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Dismiss help"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <Box radius="lg" padding={3} border="default" className="absolute left-0 top-5 z-50 w-64 bg-popover shadow-lg text-popover-foreground">
            <HStack align="start" gap={2}>
              <HelpCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <Text size="xs" block className="leading-relaxed whitespace-pre-wrap">{help}</Text>
            </HStack>
          </Box>
        </>
      )}
    </div>
  );
}

function FieldConstraints({ field, charCount }: { field: FieldMetadata; charCount?: number }) {
  const hints: string[] = [];
  if (field.field_length && field.sys_reference_id !== REFERENCE_TYPE.YES_NO) {
    hints.push(`max ${field.field_length}`);
  }
  if (field.sys_reference_id === REFERENCE_TYPE.PASSWORD) {
    hints.push("min 6");
  }

  if (hints.length === 0 && charCount === undefined) return null;

  return (
    <HStack align="center" justify="between" className="mt-1">
      {hints.length > 0 && (
        <Text color="secondary" className="text-[10px]">{hints.join(" · ")}</Text>
      )}
      {charCount !== undefined && field.field_length && (
        <span
          className={cn(
            "text-[10px] font-mono",
            charCount > field.field_length
              ? "text-destructive font-semibold"
              : charCount > field.field_length * 0.8
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        >
          {charCount}/{field.field_length}
        </span>
      )}
    </HStack>
  );
}

interface FieldRendererProps {
  field: FieldMetadata;
  form: ReturnType<typeof useForm<FormValues>>;
  serverErrors?: Record<string, string>;
  zodErrors?: Record<string, string>;
  tableName: string;
  readOnlyFields?: string[];
  parentContext?: Record<string, unknown>;
}

function FieldRenderer({
  field,
  form,
  serverErrors = {},
  zodErrors = {},
  tableName,
  readOnlyFields = [],
  parentContext,
}: FieldRendererProps) {
  const isFormReadOnly = (form as any).readOnly || false;
  const formMode = (form as any).mode || "edit";
  const fieldLabel = getFieldLabel(tableName, (field as any).tab_name, field.name, field.name);
  const isDisabled =
    (field.is_read_only && formMode !== "create") || readOnlyFields.includes(field.column_name);
  const isReadOnly = isDisabled || isFormReadOnly;

  const { data: refListValues, isLoading: isLoadingRefList } = useRefList(
    field.sys_reference_id >= 1000 ? field.sys_reference_id : 0
  );

  return (
    <form.Field
      name={field.column_name}
      validators={{
        onChange: ({ value }: { value: unknown }) => {
          // `false` is an answer, not a blank. Testing falsiness made every
          // mandatory Yes/No field report "is required" the moment it was
          // unticked, which is the one state a checkbox spends most of its
          // life in.
          const isBlank =
            typeof value === "boolean" ? false : value === undefined || value === null || value === "";
          if (field.is_mandatory && isBlank) return `${fieldLabel} is required`;
          if (
            field.field_length &&
            typeof value === "string" &&
            value.length > field.field_length
          ) {
            return `${fieldLabel} must be at most ${field.field_length} characters`;
          }
          return undefined;
        },
      }}
    >
      {(fieldApi: any) => {
        const clientError = fieldApi.state.meta.errors?.[0] as string | undefined;
        const serverError = serverErrors?.[field.column_name];
        const zodError = zodErrors?.[field.column_name];
        const error = clientError || serverError || zodError;
        const currentValue = fieldApi.state.value;
        const charCount = typeof currentValue === "string" ? currentValue.length : undefined;

        const labelBlock = (
          <HStack align="center" gap={2} className="mb-1.5">
            <Label
              htmlFor={field.column_name}
              className={cn("text-sm font-medium", error && "text-destructive")}
            >
              {fieldLabel}
              {field.is_mandatory && <Text color="danger" className="ml-0.5">*</Text>}
            </Label>
            <FieldTypeBadge field={field} />
            {isDisabled && (
              <Text color="secondary" className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                <Lock size={10} /> Read-only
              </Text>
            )}
            {field.help && <FieldHelpPopover help={field.help} fieldName={fieldLabel} />}
          </HStack>
        );

        const errorBlock = error && (
          <HStack align="center" gap={1} className="mt-1.5 text-destructive">
            <AlertCircle size={14} />
            <Text size="xs" block>{error}</Text>
          </HStack>
        );

        const inputStyles = cn(
          error && "border-destructive ring-destructive/20",
          isDisabled && "bg-muted/50 cursor-not-allowed",
          field.is_mandatory && !error && "border-primary/30"
        );

        // ── VIEW MODE: render clean plain text, no inputs ──────────────
        const isRefField = field.sys_reference_id === 18 || field.sys_reference_id === 19;
        if (formMode === "view") {
          // TABLE/TABLE_DIRECT refs: show label lookup or "—"
          if (isRefField) {
            return (
              <div>
                <HStack align="center" gap={1.5} className="mb-0.5">
                  <Text size="xs" weight="medium" color="secondary">{fieldLabel}</Text>
                  {field.is_mandatory && <Text size="xs" className="text-red-400">*</Text>}
                  {field.help && <FieldHelpPopover help={field.help} fieldName={fieldLabel} />}
                </HStack>
                <div className="text-sm text-foreground font-medium min-h-[1.25rem]">
                  {!currentValue || currentValue === "" ? (
                    <span className="text-muted-foreground/60 italic">—</span>
                  ) : (
                    <TableReferenceViewValue field={field} id={String(currentValue)} />
                  )}
                </div>
              </div>
            );
          }

          const displayValue = (() => {
            if (currentValue === null || currentValue === undefined || currentValue === "")
              return "—";
            if (typeof currentValue === "boolean") return currentValue ? "Yes" : "No";
            if (field.sys_reference_id === 15 || field.sys_reference_id === 16) {
              const d = new Date(String(currentValue));
              return Number.isNaN(d.getTime()) ? String(currentValue) : d.toLocaleString();
            }
            return String(currentValue);
          })();

          return (
            <div>
              <HStack align="center" gap={1.5} className="mb-0.5">
                <Text size="xs" weight="medium" color="secondary">{fieldLabel}</Text>
                {field.is_mandatory && <Text size="xs" className="text-red-400">*</Text>}
                {field.help && <FieldHelpPopover help={field.help} fieldName={fieldLabel} />}
              </HStack>
              <div className="text-sm text-foreground font-medium min-h-[1.25rem]">
                {displayValue}
              </div>
            </div>
          );
        }

        // Static options list (inline enum — no DB fetch required)
        if (field.options && field.options.length > 0) {
          return (
            <div>
              {labelBlock}
              <select
                id={field.column_name}
                name={field.column_name}
                value={(currentValue as string) || ""}
                onChange={(e) => fieldApi.handleChange(e.target.value)}
                onBlur={fieldApi.handleBlur}
                disabled={isReadOnly}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  inputStyles
                )}
              >
                <option value="">Select {fieldLabel}...</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errorBlock}
            </div>
          );
        }

        // Reference list dropdown
        if (field.sys_reference_id >= 1000) {
          return (
            <div>
              {labelBlock}
              {isLoadingRefList ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  id={field.column_name}
                  name={field.column_name}
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    inputStyles
                  )}
                >
                  <option value="">Select {fieldLabel}...</option>
                  {refListValues?.map((refValue) => (
                    <option key={refValue.sys_ref_list_id} value={refValue.value}>
                      {refValue.name}
                    </option>
                  ))}
                </select>
              )}
              {errorBlock}
            </div>
          );
        }

        // Table or Table Direct reference
        if (
          field.sys_reference_id === REFERENCE_TYPE.TABLE ||
          field.sys_reference_id === REFERENCE_TYPE.TABLE_DIRECT
        ) {
          return (
            <div>
              {labelBlock}
              <TableReferenceField
                field={field}
                fieldApi={fieldApi}
                isDisabled={isReadOnly}
                error={error}
                parentContext={parentContext}
                entityName={tableName}
                form={form}
              />
              {errorBlock}
            </div>
          );
        }

        switch (field.sys_reference_id) {
          case REFERENCE_TYPE.TEXT:
            return (
              <div>
                {labelBlock}
                <Textarea
                  id={field.column_name}
                  name={field.column_name}
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                  rows={4}
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.YES_NO:
            return (
              <HStack align="center" gap={3} className="pt-6">
                <Checkbox
                  id={field.column_name}
                  checked={(currentValue as boolean) || false}
                  onCheckedChange={(checked) => fieldApi.handleChange(checked)}
                  disabled={isReadOnly}
                  className={cn(field.is_mandatory && "border-primary/50")}
                />
                <HStack align="center" gap={2}>
                  <Label htmlFor={field.column_name} className="text-sm">
                    {fieldLabel}
                  </Label>
                  <FieldTypeBadge field={field} />
                </HStack>
              </HStack>
            );

          case REFERENCE_TYPE.DATE:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="date"
                  value={(currentValue as string)?.split("T")[0] || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.DATETIME:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="datetime-local"
                  value={(currentValue as string)?.slice(0, 16) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.INTEGER:
          case REFERENCE_TYPE.AMOUNT:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="number"
                  step={field.sys_reference_id === REFERENCE_TYPE.AMOUNT ? 0.01 : 1}
                  value={(currentValue as number) ?? ""}
                  // `valueAsNumber || null` turned a legitimate 0 into null, so
                  // a required amount could not be set to zero and an optional
                  // one silently lost it. An empty input is NaN; that is the
                  // only value that means "cleared".
                  onChange={(e) =>
                    fieldApi.handleChange(
                      Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber
                    )
                  }
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.EMAIL:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="email"
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.URL:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="url"
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                  placeholder="https://..."
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.PHONE:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="tel"
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );

          case REFERENCE_TYPE.PASSWORD:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="password"
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  className={cn(inputStyles)}
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );

          default:
            return (
              <div>
                {labelBlock}
                <Input
                  id={field.column_name}
                  name={field.column_name}
                  type="text"
                  value={(currentValue as string) || ""}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  onBlur={fieldApi.handleBlur}
                  disabled={isReadOnly}
                  maxLength={field.field_length}
                  className={cn(inputStyles)}
                />
                <FieldConstraints field={field} charCount={charCount} />
                {errorBlock}
              </div>
            );
        }
      }}
    </form.Field>
  );
}

/** Subscribes to form value changes and notifies the parent via onChange.
 *  Skips the initial render so the parent isn't notified with the initial data. */
function FormChangeNotifier({
  form,
  onChange,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const values = form.useStore((state: any) => state.values);
  const isFirst = useRef(true);

  // The effect fires on value changes only, but it must call the *current*
  // `onChange`. Listing `onChange` as a dependency is what an exhaustive-deps
  // rule asks for and it is wrong here: parents pass an inline arrow, so its
  // identity changes every render, the effect re-runs every render, the parent
  // sets state, and React aborts with "Maximum update depth exceeded" — the
  // form crashed into the error boundary immediately after a successful save.
  // A ref keeps the callback fresh without making it a trigger.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onChangeRef.current(values);
  }, [values]);
  return null;
}

export function DynamicForm({
  tableName,
  fields: externalFields,
  initialData = {},
  onSubmit,
  onChange,
  isLoading: externalLoading = false,
  isSaving = false,
  mode = "create",
  readOnly = false,
  serverErrors = {},
  parentField,
  readOnlyFields = [],
  parentContext,
  formId,
}: DynamicFormProps) {
  const { t } = useTranslations();
  const {
    data: fetchedFields,
    isLoading: fieldsLoading,
    error,
  } = useFormFields(tableName, { enabled: !externalFields });
  const fields = externalFields || fetchedFields;
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});

  // Derive the entity PK column name from the table name (bus_patient → patient_id)
  // The dictionary knows which column is the key; guessing it from the table
  // name does not. `bus_vendor` + "_id" produced `vendor_id`, a column that
  // exists nowhere in this stack — every `bus_*` table's primary key is plain
  // `id` — so create mode invented that field, posted it, and the backend
  // rejected the whole request with "Unknown field 'vendor_id'". No record
  // could be created through the UI for any entity.
  const pkColumnName =
    fields?.find((f: FieldMetadata) => f.is_key)?.column_name ?? "id";

  const form = useForm<FormValues>({
    defaultValues: initialData,
    onSubmit: async ({ value }) => {
      if (readOnly || !onSubmit) return;

      // Auto-generate UUID for the entity PK in create mode
      if (mode === "create" && fields && !value[pkColumnName]) {
        value[pkColumnName] = crypto.randomUUID();
      }

      // An untouched checkbox never enters the form's value map at all, so a
      // mandatory NOT NULL boolean arrived absent and the backend rejected the
      // create with "'is_active' is required". The checkbox was on screen and
      // showed the right state — "no" — it just never said so. Both submit
      // paths need this, so both call it.
      applyBooleanDefaults(value, fields);


      // Zod validation
      if (fields) {
        const displayedFields = fields.filter((f) => {
          if (!f.is_displayed || f.column_name === parentField) return false;
          if (mode === "create" && f.column_name === pkColumnName) return false;
          return true;
        });
        const validation = validateFormData(
          displayedFields,
          value,
          mode === "view" ? "edit" : mode
        );
        if (!validation.success) {
          setZodErrors(validation.errors);
          toast.error("Please fix the validation errors");
          return;
        }
        setZodErrors({});
      }

      const filteredValues =
        mode === "edit" && fields
          ? Object.entries(value).reduce(
              (acc, [key, val]) => {
                if (
                  key === "id" ||
                  key === "created_at" ||
                  key === "updated_at" ||
                  key === "deleted_at"
                )
                  return acc;
                const field = fields.find((f: FieldMetadata) => f.column_name === key);
                const isUpdateable = field?.is_updateable !== false;
                const isVersionField = key === "version";
                if (isUpdateable || isVersionField) acc[key] = val;
                return acc;
              },
              {} as Record<string, unknown>
            )
          : value;

      await onSubmit(filteredValues);
    },
  });

  (form as any).readOnly = readOnly;
  (form as any).mode = mode;

  // Same reasoning as `FormChangeNotifier`: `form` is rebuilt by `useForm` on
  // every render, so depending on `form.setFieldValue` makes this effect run
  // every render, and each run writes to the store and schedules another one.
  // Only `initialData` should trigger it; the form is reached through a ref.
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      for (const [key, value] of Object.entries(initialData)) {
        formRef.current.setFieldValue(key, value);
      }
    }
  }, [initialData]);

  const isLoading = externalFields ? false : fieldsLoading;

  const groupedFields = useMemo(() => {
    if (!fields || fields.length === 0) return new Map();
    const displayFields = fields.filter((f) => {
      if (!f.is_displayed || f.column_name === parentField) return false;
      // Hide the entity's own PK field in create mode — it's auto-generated on submit
      if (mode === "create" && f.column_name === pkColumnName) return false;
      return true;
    });
    const groups: Map<string | null, FieldMetadata[]> = new Map();
    for (const field of displayFields) {
      const groupName = field.group_name || null;
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)?.push(field);
    }
    return groups;
  }, [fields, parentField, mode, pkColumnName]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !externalFields) {
    return (
      <Box radius="md" padding={4} className="bg-destructive/15 text-destructive">
        Failed to load form fields: {error.message}
      </Box>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <Box radius="md" bg="muted" padding={4} className="text-muted-foreground">
        No fields configured for this entity.
      </Box>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;

    const currentValues = form.state.values;
    const value = currentValues as Record<string, unknown>;

    // Auto-generate UUID for the entity PK in create mode
    if (mode === "create" && fields && !value[pkColumnName]) {
      value[pkColumnName] = crypto.randomUUID();
    }

      // An untouched checkbox never enters the form's value map at all, so a
    // mandatory NOT NULL boolean arrived absent and the backend rejected the
    // create with "'is_active' is required". The checkbox was on screen and
    // showed the right state — "no" — it just never said so. Both submit
    // paths need this, so both call it.
    applyBooleanDefaults(value, fields);


    // Zod validation
    if (fields) {
      const displayedFields = fields.filter((f) => {
        if (!f.is_displayed || f.column_name === parentField) return false;
        if (mode === "create" && f.column_name === pkColumnName) return false;
        return true;
      });
      const validation = validateFormData(displayedFields, value, mode === "view" ? "edit" : mode);
      if (!validation.success) {
        setZodErrors(validation.errors);
        toast.error("Please fix the validation errors");
        return;
      }
      setZodErrors({});
    }

    const filteredValues =
      mode === "edit" && fields
        ? Object.entries(value).reduce(
            (acc, [key, val]) => {
              if (
                key === "id" ||
                key === "created_at" ||
                key === "updated_at" ||
                key === "deleted_at"
              )
                return acc;
              const field = fields.find((f: FieldMetadata) => f.column_name === key);
              const isUpdateable = !field?.is_read_only;
              const isVersionField = key === "version";
              if (isUpdateable || isVersionField) acc[key] = val;
              return acc;
            },
            {} as Record<string, unknown>
          )
        : value;

    await onSubmit(filteredValues);
  };

  const requiredCount = fields.filter((f) => {
    if (!f.is_displayed || !f.is_mandatory || f.column_name === parentField) return false;
    if (mode === "create" && f.column_name === pkColumnName) return false;
    return true;
  }).length;
  const totalDisplayed = fields.filter((f) => {
    if (!f.is_displayed || f.column_name === parentField) return false;
    if (mode === "create" && f.column_name === pkColumnName) return false;
    return true;
  }).length;

  return (
    <form.Provider>
      {onChange && <FormChangeNotifier form={form} onChange={onChange} />}
      <form id={formId} onSubmit={handleFormSubmit} className="space-y-6">
        {/* Form summary bar */}
        <HStack align="center" justify="between">
          <HStack align="center" gap={3}>
            <Text size="xs" color="secondary">{totalDisplayed} fields</Text>
            {requiredCount > 0 && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <Text size="xs" weight="medium" className="text-red-500/80">
                  {requiredCount} required
                </Text>
              </>
            )}
            {Object.keys(zodErrors).length > 0 && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <Text size="xs" color="danger" weight="medium" className="inline-flex items-center gap-1">
                  <AlertCircle size={12} />
                  {Object.keys(zodErrors).length} validation{" "}
                  {Object.keys(zodErrors).length === 1 ? "error" : "errors"}
                </Text>
              </>
            )}
          </HStack>
          {!readOnly && onSubmit && (
            <form.Subscribe selector={(state: any) => [state.isSubmitting]}>
              {([isFormSubmitting]: any) => (
                <Button
                  type="submit"
                  disabled={isSaving || isFormSubmitting}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving || isFormSubmitting
                    ? "Saving..."
                    : mode === "create"
                      ? "Create"
                      : "Save"}
                </Button>
              )}
            </form.Subscribe>
          )}
        </HStack>

        {Array.from(groupedFields.entries()).map(([groupName, fieldsInGroup]) => {
          const groupColumns = fieldsInGroup[0]?.group_columns || 1;

          return (
            <div key={groupName || "ungrouped"} className="space-y-4">
              {groupName && (
                <div className="border-b border-primary/20 pb-2">
                  <Heading level={3} color="accent">{groupName}</Heading>
                  {fieldsInGroup[0]?.group_description && (
                    <Text size="xs" color="secondary" block className="mt-0.5">
                      {fieldsInGroup[0].group_description}
                    </Text>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "grid gap-x-6 gap-y-5",
                  groupColumns === 1 && "grid-cols-1",
                  groupColumns === 2 && "grid-cols-1 md:grid-cols-2",
                  groupColumns === 3 && "grid-cols-1 md:grid-cols-3",
                  groupColumns === 4 && "grid-cols-1 md:grid-cols-4"
                )}
              >
                {fieldsInGroup.map((field: FieldMetadata) => (
                  <div
                    key={field.sys_field_id}
                    className={cn(
                      field.col_span &&
                        field.col_span > 1 &&
                        `md:col-span-${Math.min(groupColumns, field.col_span)}`
                    )}
                  >
                    <FieldRenderer
                      field={field}
                      form={form}
                      serverErrors={serverErrors}
                      zodErrors={zodErrors}
                      tableName={tableName}
                      readOnlyFields={
                        mode === "edit" ? [...readOnlyFields, pkColumnName] : readOnlyFields
                      }
                      parentContext={parentContext}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!readOnly && onSubmit && (
          <HStack justify="end" gap={4} className="pt-2 border-t border-border">
            <form.Subscribe selector={(state: any) => [state.isSubmitting]}>
              {([isFormSubmitting]: any) => (
                <Button
                  type="submit"
                  disabled={isSaving || isFormSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving || isFormSubmitting
                    ? "Saving..."
                    : mode === "create"
                      ? "Create"
                      : "Save"}
                </Button>
              )}
            </form.Subscribe>
          </HStack>
        )}
      </form>
    </form.Provider>
  );
}
