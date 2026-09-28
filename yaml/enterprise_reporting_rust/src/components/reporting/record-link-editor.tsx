/**
 * The record-link section of the report editor — administrators only.
 *
 * Configures the button that opens a report row's record in another
 * application. The gate that matters is on the server (`setReportRecordLink`
 * checks `isAdmin`); hiding this section is a courtesy so non-administrators
 * are not shown a control that would refuse them.
 */

import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  buildRecordUrl,
  DEFAULT_RECORD_LINK_LABEL,
  RECORD_LINK_PLACEHOLDER,
  type RecordLinkConfig,
  validateUrlTemplate,
} from "@/lib/reporting/record-link";
import { setReportRecordLink } from "@/server-fns/reports";

interface RecordLinkEditorProps {
  reportId: string;
  /** Columns available in the report, to choose the id column from. */
  columns: { id?: string; field: string; header?: string }[];
  initialConfig: RecordLinkConfig | null;
}

export function RecordLinkEditor({ reportId, columns, initialConfig }: RecordLinkEditorProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [idColumn, setIdColumn] = useState(initialConfig?.idColumn ?? "");
  const [urlTemplate, setUrlTemplate] = useState(initialConfig?.urlTemplate ?? "");
  const [label, setLabel] = useState(initialConfig?.label ?? "");
  const [openInNewTab, setOpenInNewTab] = useState(initialConfig?.openInNewTab ?? true);

  // Validated as the administrator types rather than only on save: the rule
  // (scheme allow-list, the {id} placeholder) is not guessable from an empty
  // box, and a rejection on save after filling three fields is a worse way to
  // learn it.
  const urlCheck = urlTemplate.trim() ? validateUrlTemplate(urlTemplate) : null;

  const preview =
    urlCheck?.ok && idColumn
      ? buildRecordUrl({ enabled: true, idColumn, urlTemplate }, "12345")
      : null;

  const save = useMutation({
    mutationFn: async (link: RecordLinkConfig | null) =>
      setReportRecordLink({ data: { id: reportId, link } }),
    onSuccess: () => toast.success("Record link saved"),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to save the record link"),
  });

  const canSave = !enabled || (Boolean(idColumn) && urlCheck?.ok === true);

  return (
    <div className="border-t pt-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Record Link
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Adds a button to a row's detail view that opens the same record in another application.
            Administrators only.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable record link" />
      </div>

      {enabled && (
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="record-link-column">Record id column</Label>
            <Select value={idColumn} onValueChange={setIdColumn}>
              <SelectTrigger id="record-link-column">
                <SelectValue placeholder="Which column holds the record's id?" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id || col.field} value={col.field}>
                    {col.header || col.field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="record-link-url">Destination URL</Label>
            <Input
              id="record-link-url"
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
              placeholder={`/app/bus_account/${RECORD_LINK_PLACEHOLDER}`}
              aria-invalid={urlCheck ? !urlCheck.ok : undefined}
            />
            <p className="text-xs text-muted-foreground mt-1">
              <code>{RECORD_LINK_PLACEHOLDER}</code> is replaced with the row's id. Use a path on
              this site (<code>/app/…</code>) or a full <code>https://</code> address.
            </p>
            {urlCheck && !urlCheck.ok && (
              <p className="text-xs text-destructive mt-1">{urlCheck.error}</p>
            )}
          </div>

          <div>
            <Label htmlFor="record-link-label">Button label (optional)</Label>
            <Input
              id="record-link-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={DEFAULT_RECORD_LINK_LABEL}
              maxLength={120}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="record-link-new-tab"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
            />
            <Label htmlFor="record-link-new-tab" className="font-normal">
              Open in a new tab
            </Label>
          </div>

          {preview && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-tremor-label text-tremor-content break-all">
                Example for a record with id <code>12345</code>: {preview}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          disabled={!canSave || save.isPending}
          onClick={() =>
            save.mutate(
              enabled
                ? {
                    enabled,
                    idColumn,
                    urlTemplate,
                    label: label.trim() || undefined,
                    openInNewTab,
                  }
                : // Disabling clears the stored config rather than saving a
                  // disabled one, so turning the feature off leaves no URL
                  // behind to be re-enabled by accident later.
                  null
            )
          }
        >
          {save.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {enabled ? "Save record link" : "Remove record link"}
        </Button>
      </div>
    </div>
  );
}
