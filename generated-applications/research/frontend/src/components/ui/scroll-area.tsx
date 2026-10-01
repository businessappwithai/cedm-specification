/**
 * ScrollArea — native overflow, not a component.
 *
 * This is the one primitive in the set with no Astryx counterpart, and that is
 * deliberate on Astryx's side rather than a gap: its scrollable surfaces
 * (`Table`, `SideNav`, `Layer`) use native overflow, because since Radix
 * shipped, `scrollbar-width` and `scrollbar-color` became styleable in every
 * browser the generated app supports. Radix's ScrollArea exists to draw a
 * custom scrollbar over a hidden native one; there is nothing left for it to
 * fix.
 *
 * So this keeps the call surface — `<ScrollArea>` and `<ScrollBar>` are
 * imported by the admin shell and the sidebar — and implements it with the
 * native scroller. That also fixes a real Radix behaviour: a custom scrollbar
 * does not respond to the OS "always show scrollbars" accessibility setting.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Which axis may scroll. @default "vertical" */
  orientation?: "vertical" | "horizontal" | "both";
}

// Style objects live at module scope rather than inline in JSX: an inline
// style prop opens with two braces, which Handlebars reads as the start of an
// expression and refuses to render.
function scrollStyle(
  orientation: "vertical" | "horizontal" | "both",
  incoming?: React.CSSProperties
): React.CSSProperties {
  return {
    overflowY: orientation === "horizontal" ? "hidden" : "auto",
    overflowX: orientation === "vertical" ? "hidden" : "auto",
    // Thin, theme-coloured scrollbars — the effect Radix's custom bar was
    // there to produce, from two CSS properties.
    scrollbarWidth: "thin",
    ...incoming,
  };
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", style, ...props }, ref) => (
    <div ref={ref} className={className} style={scrollStyle(orientation, style)} {...props}>
      {children}
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

/**
 * The scrollbar is drawn by the browser, so there is nothing to render here.
 * Kept as an export because the shadcn call sites place it inside `ScrollArea`,
 * and removing it would mean editing them for no behavioural gain.
 */
export function ScrollBar(_props: {
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  return null;
}

export default ScrollArea;
