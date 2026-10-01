/**
 * Tooltip — shadcn surface over Astryx `Tooltip`.
 *
 * Radix splits this into Provider/Root/Trigger/Content; Astryx takes the
 * trigger as children and the text as a `content` prop. `TooltipContent`
 * therefore does not render — `Tooltip` reads its children as the content and
 * `TooltipTrigger` supplies the anchor.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Tooltip as AstryxTooltip } from "@astryxdesign/core/Tooltip";

/**
 * Structural parts accept the ordinary HTML attributes their Radix originals
 * did — `className`, `style`, `title`, `onClick`, `aria-*`. The classes are
 * inert once Phase C removes Tailwind, but the call sites in
 * `components/admin/*` pass them today and an adapter those call sites cannot
 * typecheck against is not a finished adapter.
 */
interface PartProps extends React.HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function TooltipProvider({
  children,
}: PartProps & {
  /**
   * Radix's open delay. Astryx's `Tooltip` owns its own timing, so this is
   * accepted and ignored rather than rejected — a provider-level delay is not
   * worth editing every call site to drop.
   */
  delayDuration?: number;
}) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: PartProps & { asChild?: boolean }) {
  return <>{children}</>;
}

export function TooltipContent(_props: PartProps & { side?: string }) {
  return null;
}

export interface TooltipProps {
  children?: ReactNode;
  content?: ReactNode;
  delayDuration?: number;
}

function extract(children: ReactNode, target: unknown): ReactNode | undefined {
  let found: ReactNode | undefined;
  Children.forEach(children, (child) => {
    if (found !== undefined || !isValidElement(child)) return;
    if (child.type === target) {
      found = (child as ReactElement<{ children?: ReactNode }>).props.children;
    }
  });
  return found;
}

export function Tooltip({ children, content, delayDuration }: TooltipProps) {
  const trigger = extract(children, TooltipTrigger) ?? children;
  const text = content ?? extract(children, TooltipContent);

  // Astryx requires content; with nothing to say, render the trigger bare
  // rather than an empty bubble.
  if (text === undefined || text === null) {
    return <>{trigger}</>;
  }

  return (
    <AstryxTooltip content={text} delay={delayDuration}>
      {trigger}
    </AstryxTooltip>
  );
}

export default Tooltip;
