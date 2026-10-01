/**
 * MobileSidebar — shadcn surface over Astryx `MobileNav`.
 *
 * The shadcn version is a Radix Dialog dressed as a drawer: a fixed overlay, a
 * hand-positioned panel, slide-in animation classes, and a close button the
 * call site never sees. `MobileNav` is that drawer as a component — it owns the
 * overlay, the slide, the focus trap, the Escape handler and the close affordance.
 *
 * So this is close to a straight delegation. The one thing worth keeping is the
 * `md:hidden` behaviour: the shadcn drawer was hidden on desktop by a Tailwind
 * class, and `MobileNav` has no viewport prop, so the call site's own
 * responsive logic (it only sets `open` on small screens) is what governs.
 * That was already true — the class was belt and braces — but it is now the
 * only mechanism, so it is stated here rather than left implicit.
 */
import type { ReactNode } from "react";
import { MobileNav } from "@astryxdesign/core/MobileNav";

export interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Rendered above the navigation content — a logo or a title. */
  header?: ReactNode;
}

export function MobileSidebar({ open, onOpenChange, children, header }: MobileSidebarProps) {
  return (
    <MobileNav isOpen={open} onOpenChange={onOpenChange} label="Navigation menu" side="start" header={header}>
      {children}
    </MobileNav>
  );
}

export default MobileSidebar;
