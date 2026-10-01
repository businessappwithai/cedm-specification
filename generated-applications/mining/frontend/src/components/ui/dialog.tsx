/**
 * Dialog — shadcn surface over Astryx `Dialog`.
 *
 * Radix spells the open flag `open`; Astryx spells it `isOpen` and makes
 * `onOpenChange` required. The sub-components stay as semantic wrappers so the
 * many call sites composing header/title/footer keep rendering — spacing now
 * comes from the theme rather than from utility classes on each part.
 *
 * `DialogTrigger` renders its children in place. Radix used it to wire open
 * state automatically; Astryx has no equivalent, and call sites in this
 * codebase already drive `open` themselves, so the trigger is just its button.
 */
import type { ReactNode } from "react";
import { Dialog as AstryxDialog } from "@astryxdesign/core/Dialog";

interface SectionProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogProps {
  open?: boolean;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ open = false, children, onOpenChange }: DialogProps) {
  return (
    <AstryxDialog isOpen={open} onOpenChange={(next: boolean) => onOpenChange?.(next)}>
      {children}
    </AstryxDialog>
  );
}

export function DialogTrigger({ children }: SectionProps & { asChild?: boolean }) {
  return <>{children}</>;
}

export function DialogContent({ children, className }: SectionProps) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({ children, className }: SectionProps) {
  return <header className={className}>{children}</header>;
}

export function DialogTitle({ children, className }: SectionProps) {
  return <h2 className={className}>{children}</h2>;
}

export function DialogDescription({ children, className }: SectionProps) {
  return <p className={className}>{children}</p>;
}

export function DialogFooter({ children, className }: SectionProps) {
  return <footer className={className}>{children}</footer>;
}

export function DialogClose({ children }: SectionProps & { asChild?: boolean }) {
  return <>{children}</>;
}

export default Dialog;
