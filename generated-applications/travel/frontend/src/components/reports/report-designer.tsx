/**
 * The report layout designer for one entity.
 *
 * `ankareport` is a plain DOM library, not a React component, so it is created
 * once against a ref and torn down on unmount. It is imported dynamically for
 * two reasons: it is only ever reached from this screen, and it touches
 * `document` at module scope, which would break the server render every route
 * in this app goes through.
 *
 * The layout it produces is opaque to us on purpose. It is stored as JSONB in
 * `sys_report_designs.layout` and handed straight back to the same library to
 * render, so nothing here parses it, validates it, or has an opinion about its
 * shape. That is what lets the designer be upgraded without a migration.
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useReportDesign, useSaveReportDesign } from "@/components/admin/use-report-designs";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportDesignerProps {
  /** Physical table, e.g. `bus_compound`. */
  tableName: string;
  /** Display name for the design, e.g. `Compound`. */
  entityLabel: string;
  /** Column names offered in the data-source tree. */
  columns: string[];
}

/** Minimal shape of what we use; the library's own types are not published. */
interface AnkaDesigner {
  dispose?: () => void;
}

export function ReportDesigner({ tableName, entityLabel, columns }: ReportDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { data: design, isLoading } = useReportDesign(tableName);
  const save = useSaveReportDesign(tableName);

  // The designer is built once the existing layout has been fetched, so it
  // opens on what is already stored rather than on a blank page that would
  // overwrite it at the first save.
  const ready = !isLoading;

  // Held in a ref so the effect does not re-run — and rebuild the designer,
  // discarding unsaved work — every time the mutation object changes identity.
  const saveRef = useRef(save);
  saveRef.current = save;
  const designRef = useRef(design);
  designRef.current = design ?? null;

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const element = containerRef.current;
    let instance: AnkaDesigner | undefined;
    let disposed = false;

    void (async () => {
      try {
        const anka = await import("ankareport");
        // The package publishes `designer` as a named export; older builds put
        // it behind `default`. Accept either rather than assume.
        const factory =
          (anka as { designer?: unknown }).designer ??
          (anka as { default?: { designer?: unknown } }).default?.designer;

        if (typeof factory !== "function") {
          setLoadError("The report designer library did not expose a designer.");
          return;
        }
        if (disposed) return;

        instance = (factory as (options: unknown) => AnkaDesigner)({
          element,
          dataSource: columns.map((column) => ({ label: column, field: column })),
          layout: designRef.current?.layout ?? undefined,
          onSaveButtonClick: async (layout: Record<string, unknown>) => {
            setStatus("saving");
            try {
              await saveRef.current.mutateAsync({
                layout,
                name: `${entityLabel} Report`,
                existing: designRef.current ?? null,
              });
              setStatus("saved");
            } catch {
              setStatus("idle");
            }
          },
        });
      } catch {
        setLoadError("The report designer library could not be loaded.");
      }
    })();

    return () => {
      disposed = true;
      instance?.dispose?.();
      // Clear by node removal rather than innerHTML: the library attaches
      // listeners to the children it created.
      while (element.firstChild) element.removeChild(element.firstChild);
    };
    // `design` is deliberately absent — it is read through `designRef` so that
    // a refetch after saving does not tear the designer down mid-edit.
  }, [ready, tableName, entityLabel, columns]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{loadError}</p>
            <p className="text-muted-foreground mt-1">
              Any design already saved for {entityLabel} is untouched — this screen could not
              open it, and nothing was written.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {status !== "idle" && (
        <div className="px-4 py-2 text-sm border-b border-border text-muted-foreground">
          {status === "saving" ? "Saving report design…" : "Report design saved."}
        </div>
      )}
      {save.isError && (
        <div className="px-4 py-2 text-sm border-b border-border text-destructive">
          The design could not be saved.
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full min-h-[600px]" />
    </div>
  );
}
