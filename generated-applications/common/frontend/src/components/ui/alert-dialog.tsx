/**
 * AlertDialog — shadcn surface over Astryx `AlertDialog`.
 *
 * Astryx takes the whole confirmation as props (`title`, `description`,
 * `actionLabel`, `cancelLabel`, `onAction`) rather than as composed children.
 * The shadcn sub-components are therefore read, not rendered: `AlertDialog`
 * walks them for their text and the action handler, then hands the result to
 * Astryx.
 *
 * That keeps the destructive-confirm call sites (delete row, discard changes)
 * working untouched, which matters — these are the dialogs where a silent
 * rendering regression loses user data.
 */
import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { AlertDialog as AstryxAlertDialog } from "@astryxdesign/core/AlertDialog";

interface PartProps {
  children?: ReactNode;
  className?: string;
}

export function AlertDialogTrigger({ children }: PartProps & { asChild?: boolean }) {
  return <>{children}</>;
}

export function AlertDialogContent({ children }: PartProps) {
  return <>{children}</>;
}

export function AlertDialogHeader({ children }: PartProps) {
  return <>{children}</>;
}

export function AlertDialogFooter({ children }: PartProps) {
  return <>{children}</>;
}

export function AlertDialogTitle(_props: PartProps) {
  return null;
}

export function AlertDialogDescription(_props: PartProps) {
  return null;
}

export function AlertDialogAction(_props: PartProps & { onClick?: () => void }) {
  return null;
}

export function AlertDialogCancel(_props: PartProps & { onClick?: () => void }) {
  return null;
}

export interface AlertDialogProps {
  open?: boolean;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

/** Depth-first search for the first element of a given type. */
function find(children: ReactNode, target: unknown): ReactElement | undefined {
  let found: ReactElement | undefined;
  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) return;
    if (child.type === target) {
      found = child;
      return;
    }
    const nested = (child as ReactElement<{ children?: ReactNode }>).props.children;
    if (nested) found = find(nested, target);
  });
  return found;
}

function text(element: ReactElement | undefined, fallback: string): string {
  const content = (element?.props as { children?: ReactNode } | undefined)?.children;
  return typeof content === "string" ? content : fallback;
}

export function AlertDialog({ open, children, onOpenChange }: AlertDialogProps) {
  const action = find(children, AlertDialogAction);
  const cancel = find(children, AlertDialogCancel);
  const trigger = find(children, AlertDialogTrigger);
  const onAction = (action?.props as { onClick?: () => void } | undefined)?.onClick;

  // The shadcn form comes in two shapes. Controlled: the caller owns `open`.
  // Uncontrolled: an `AlertDialogTrigger` inside the dialog opens it. The
  // second was dropped, so a Delete button written that way was never drawn and
  // the screen had no way to delete anything.
  const [inner, setInner] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : inner;
  const setOpen = (next: boolean) => {
    if (!controlled) setInner(next);
    onOpenChange?.(next);
  };

  const triggerChild = (trigger?.props as { children?: ReactNode } | undefined)?.children;
  const triggerNode =
    !controlled && isValidElement(triggerChild)
      ? cloneElement(triggerChild as ReactElement<{ onClick?: () => void }>, {
          onClick: () => setOpen(true),
        })
      : null;

  return (
    <>
      {triggerNode}
      <AstryxAlertDialog
        isOpen={isOpen}
        onOpenChange={(next: boolean) => setOpen(next)}
        title={text(find(children, AlertDialogTitle), "Are you sure?")}
        description={text(find(children, AlertDialogDescription), "")}
        actionLabel={text(action, "Continue")}
        cancelLabel={text(cancel, "Cancel")}
        onAction={() => {
          onAction?.();
          // Astryx does not close on action; the shadcn call sites expect it to.
          setOpen(false);
        }}
      />
    </>
  );
}

export default AlertDialog;

/**
 * The destructive-confirm dialog the grids and the entity shell both use.
 *
 * Kept as a named export because those call sites import it directly, and it
 * maps onto Astryx more cleanly than the composed form does: Astryx already
 * takes the title, description and labels as props, so this is a straight
 * translation rather than a walk over children.
 *
 * `actionVariant="destructive"` replaces the red Tailwind classes the shadcn
 * version carried — the warning colour now comes from the active theme.
 */
export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Delete Record",
  description,
  itemName,
  onConfirm,
  isConfirming = false,
}: DeleteConfirmDialogProps) {
  return (
    <AstryxAlertDialog
      isOpen={open}
      onOpenChange={(next: boolean) => onOpenChange(next)}
      title={title}
      description={
        description ?? `Are you sure you want to delete ${itemName ?? "this record"}? This action cannot be undone.`
      }
      cancelLabel="Cancel"
      // The label doubles as the progress indicator, the same way the shadcn
      // version did — Astryx's action button has no loading state to drive.
      actionLabel={isConfirming ? "Deleting…" : "Delete"}
      actionVariant="destructive"
      onAction={() => {
        onConfirm();
        onOpenChange(false);
      }}
    />
  );
}
