/**
 * Select — shadcn surface over Astryx `Selector`.
 *
 * This is the largest structural difference in the set. shadcn/Radix compose a
 * select out of five elements:
 *
 * ```tsx
 * <Select value={v} onValueChange={set}>
 *   <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="a">A</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * Astryx's `Selector` takes a flat `options` array instead. Rather than force
 * every call site to change in the same commit, `Select` walks its children,
 * collects the `SelectItem`s, and hands the resulting array to `Selector`. The
 * sub-components render nothing themselves — they exist purely as a
 * declarative description that this component reads.
 *
 * Phase C should replace these call sites with `Selector` directly; this
 * adapter is what buys the time to do that incrementally.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Selector } from "@astryxdesign/core/Selector";

interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "aria-label"?: string;
  className?: string;
  children?: ReactNode;
  onValueChange?: (value: string) => void;
}

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

export interface SelectItemProps extends PartProps {
  /** Radix marks unavailable options disabled; Astryx names it `isDisabled`. */
  disabled?: boolean;
  value: string;
  children?: ReactNode;
}

/** Declarative only — `Select` reads these; they render nothing on their own. */
export function SelectItem(_props: SelectItemProps) {
  return null;
}

export function SelectTrigger({ children }: PartProps) {
  return <>{children}</>;
}

export function SelectContent({ children }: PartProps) {
  return <>{children}</>;
}

export function SelectValue(_props: { placeholder?: string }) {
  return null;
}

export function SelectGroup({ children }: PartProps) {
  return <>{children}</>;
}

export function SelectLabel({ children }: PartProps) {
  return <>{children}</>;
}

/**
 * Depth-first walk for `SelectItem`s, since call sites nest them inside
 * `SelectContent` and sometimes `SelectGroup`.
 */
function collectOptions(children: ReactNode, found: SelectOption[] = []): SelectOption[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === SelectItem) {
      const props = child.props as SelectItemProps;
      found.push({
        value: props.value,
        label: typeof props.children === "string" ? props.children : props.value,
      });
      return;
    }
    const nested = (child as ReactElement<{ children?: ReactNode }>).props.children;
    if (nested) collectOptions(nested, found);
  });
  return found;
}

/** The placeholder lives on `SelectValue`, one or two levels down. */
function findPlaceholder(children: ReactNode): string | undefined {
  let placeholder: string | undefined;
  Children.forEach(children, (child) => {
    if (placeholder || !isValidElement(child)) return;
    if (child.type === SelectValue) {
      placeholder = (child.props as { placeholder?: string }).placeholder;
      return;
    }
    const nested = (child as ReactElement<{ children?: ReactNode }>).props.children;
    if (nested) placeholder = findPlaceholder(nested);
  });
  return placeholder;
}

export function Select({
  value,
  defaultValue,
  disabled,
  required,
  name,
  "aria-label": ariaLabel,
  className,
  children,
  onValueChange,
}: SelectProps) {
  const options = collectOptions(children);
  const placeholder = findPlaceholder(children);

  return (
    <Selector
      label={ariaLabel ?? name ?? placeholder ?? "Select"}
      isLabelHidden
      options={options}
      value={value ?? defaultValue}
      placeholder={placeholder}
      isDisabled={disabled}
      isRequired={required}
      htmlName={name}
      className={className}
      onChange={(next: string) => onValueChange?.(next)}
    />
  );
}

export default Select;
