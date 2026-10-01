/**
 * Tabs — shadcn surface over Astryx `TabList`.
 *
 * Radix splits tabs into Root / List / Trigger / Content and renders the
 * active panel itself. Astryx's `TabList` is only the tab strip — it reports
 * which tab is selected and leaves panel rendering to the caller.
 *
 * So `Tabs` keeps the selected value (controlled or uncontrolled), passes it to
 * `TabList`, and renders whichever `TabsContent` matches. That preserves the
 * Radix call shape while using Astryx for the part it actually provides.
 */
import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Tab, TabList } from "@astryxdesign/core/TabList";

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  className?: string;
  children?: ReactNode;
  onValueChange?: (value: string) => void;
}

export interface TabsTriggerProps {
  className?: string;
  value: string;
  children?: ReactNode;
  disabled?: boolean;
}

export interface TabsContentProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

/** Declarative only — `Tabs` reads these to build the strip. */
export function TabsTrigger(_props: TabsTriggerProps) {
  return null;
}

export function TabsList({ children }: { children?: ReactNode; className?: string }) {
  return <>{children}</>;
}

export function TabsContent({ children, className }: TabsContentProps) {
  return <div className={className}>{children}</div>;
}

function collectTriggers(children: ReactNode, found: TabsTriggerProps[] = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === TabsTrigger) {
      found.push(child.props as TabsTriggerProps);
      return;
    }
    const nested = (child as ReactElement<{ children?: ReactNode }>).props.children;
    if (nested) collectTriggers(nested, found);
  });
  return found;
}

export function Tabs({ value, defaultValue, className, children, onValueChange }: TabsProps) {
  // Astryx's `Tab` has no disabled state. Omitting a disabled trigger keeps the
  // gating intent — the user still cannot reach that panel — where rendering it
  // enabled would silently grant access the call site tried to withhold. The
  // cost is that the tab disappears instead of appearing greyed out; making it
  // visible-but-inert needs an upstream Astryx feature.
  const triggers = collectTriggers(children).filter((trigger) => !trigger.disabled);
  const [internal, setInternal] = useState(defaultValue ?? triggers[0]?.value ?? "");
  // Controlled when `value` is supplied, uncontrolled otherwise — the same
  // contract Radix offers, so existing call sites keep working either way.
  const active = value ?? internal;

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  const panels = Children.toArray(children).filter(
    (child): child is ReactElement<TabsContentProps> => isValidElement(child) && child.type === TabsContent
  );

  return (
    <div className={className}>
      <TabList value={active} onChange={select}>
        {triggers.map((trigger) => (
          <Tab
            key={trigger.value}
            value={trigger.value}
            label={typeof trigger.children === "string" ? trigger.children : trigger.value}
          />
        ))}
      </TabList>
      {panels.filter((panel) => panel.props.value === active)}
    </div>
  );
}

export default Tabs;
