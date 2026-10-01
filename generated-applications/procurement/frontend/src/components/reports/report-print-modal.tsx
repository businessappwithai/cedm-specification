/**
 * Render one record through its entity's saved report design.
 *
 * This is the half that makes a design worth drawing: the designer stores a
 * layout, and this hands that layout and a record to the same library to
 * produce the printable document. If nothing has been designed for the entity,
 * the button that opens this never appears — an empty print dialog is worse
 * than no print button.
 *
 * The record is passed as both the top-level bindings and a one-element
 * `records` collection, because a layout may bind either a field directly or a
 * content section repeating over a collection, and a designer has no way to
 * know which the author chose.
 */

import { useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReportPrintModalProps {
  open: boolean;
  onClose: () => void;
  layout: Record<string, unknown>;
  data: Record<string, unknown>;
  entityLabel?: string;
}

interface AnkaRenderer {
  exportToPdf?: (fileName: string) => Promise<void>;
}

export function ReportPrintModal({
  open,
  onClose,
  layout,
  data,
  entityLabel,
}: ReportPrintModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<AnkaRenderer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const element = containerRef.current;
    let disposed = false;
    setFailed(false);

    void (async () => {
      try {
        const anka = await import("ankareport");
        const factory =
          (anka as { render?: unknown }).render ??
          (anka as { default?: { render?: unknown } }).default?.render;

        if (typeof factory !== "function") {
          setFailed(true);
          return;
        }
        if (disposed) return;

        rendererRef.current = (factory as (options: unknown) => AnkaRenderer)({
          element,
          layout,
          data: { ...data, records: [data] },
        });
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      rendererRef.current = null;
      while (element.firstChild) element.removeChild(element.firstChild);
    };
  }, [open, layout, data]);

  const exportPdf = () => {
    void rendererRef.current?.exportToPdf?.(`${entityLabel ?? "report"}.pdf`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold">
            {entityLabel ? `Print — ${entityLabel}` : "Print Report"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportPdf} disabled={failed}>
              <Printer className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6">
          {failed ? (
            <p className="text-sm text-muted-foreground">
              The report renderer could not be loaded, so this document cannot be shown.
            </p>
          ) : null}
          <div ref={containerRef} className="w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
