/**
 * The record changed while you were editing it: refresh, or overwrite.
 *
 * Opened when a save comes back 409 with a `conflict` (see `lib/concurrency.ts`).
 * It says who changed the record and when, lists each field that changed with
 * your value beside theirs, and states where the record's transaction stands.
 * Two ways out:
 *
 * - **Refresh to latest** discards your edits and loads the record as it now
 *   stands — the refusal already carries it, so nothing is fetched again.
 * - **Overwrite with my changes** re-sends your values naming the version the
 *   refusal reported. Offered only when the record is not in a final state; a
 *   further conflict reopens the dialog with the newer state.
 *
 * A record in a final state is a completed transaction and closed to every
 * save, so for `RECORD_FINAL` refresh is the only action, and the reason is
 * stated rather than left to be inferred from a missing button.
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { describeStatus, type ConcurrencyCode, type VersionConflict } from "@/lib/concurrency";
import { translate } from "@/lib/translations";

export interface ConflictDialogProps {
  open: boolean;
  code: ConcurrencyCode;
  conflict: VersionConflict;
  /** What the person tried to save. */
  mine: Record<string, unknown>;
  /** "Sales Order 100245" — what the screen calls the record. */
  recordName: string;
  /** Field name → label, for the comparison table. */
  labelOf?: (field: string) => string;
  busy?: boolean;
  onRefresh: () => void;
  onOverwrite: () => void;
  onClose: () => void;
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function when(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export function ConflictDialog({
  open,
  code,
  conflict,
  mine,
  recordName,
  labelOf = (field) => field,
  busy = false,
  onRefresh,
  onOverwrite,
  onClose,
}: ConflictDialogProps) {
  const isFinal = code === "RECORD_FINAL" || conflict.status?.isFinal === true;
  const status = describeStatus(conflict.status);
  const changedAt = when(conflict.changedAt);
  const fields = conflict.changedFields.filter(
    (field) => field !== "version" && field !== "updated_at"
  );

  const who = conflict.changedBy ?? translate("conflict.anotherUser");
  const headline = isFinal
    ? `${recordName} ${translate("conflict.isClosed")}`
    : `${recordName} ${translate("conflict.wasChangedBy")} ${who}${changedAt ? ` ${translate("conflict.at")} ${changedAt}` : ""}`;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFinal ? translate("conflict.titleFinal") : translate("conflict.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm" role="alert">
          <p>{headline}.</p>
          {status ? (
            <p>
              <strong>{translate("conflict.status")}:</strong> {status}
              {isFinal ? ` — ${translate("conflict.transactionComplete")}` : null}
            </p>
          ) : null}

          {!isFinal && fields.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{translate("conflict.comparison")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-1 pr-3">{translate("conflict.field")}</th>
                  <th scope="col" className="py-1 pr-3">{translate("conflict.yours")}</th>
                  <th scope="col" className="py-1">{translate("conflict.theirs")}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field} className="border-t">
                    <th scope="row" className="py-1 pr-3 font-medium">{labelOf(field)}</th>
                    <td className="py-1 pr-3">{display(mine[field])}</td>
                    <td className="py-1">{display(conflict.current[field])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {isFinal ? <p>{translate("conflict.finalExplained")}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onRefresh} disabled={busy}>
            {translate("conflict.refresh")}
          </Button>
          {!isFinal && conflict.overwritable ? (
            <Button variant="destructive" onClick={onOverwrite} disabled={busy} isLoading={busy}>
              {translate("conflict.overwrite")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConflictDialog;
