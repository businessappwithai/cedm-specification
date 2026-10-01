/**
 * DropdownMenu — shadcn surface over Astryx `DropdownMenu`.
 *
 * Radix splits the menu into Root / Trigger / Content / Item and expects the
 * consumer to nest them. Astryx's `DropdownMenu` owns the trigger *and* the
 * popover: it renders a button from a `button` prop and the items as children.
 *
 * So `DropdownMenu` reads its `DropdownMenuTrigger` for the button's label and
 * icon, and passes everything inside `DropdownMenuContent` through as menu
 * children. Radix's structural parts (`Content`, `Group`, `Portal`) become
 * pass-throughs, because Astryx already portals the popover itself.
 *
 * Submenus are the one place this cannot be transparent: Radix builds them from
 * `Sub` + `SubTrigger` + `SubContent`, and Astryx's `DropdownMenuSubMenu` takes
 * the whole submenu as one component. `DropdownMenuSub` therefore reads its own
 * children the same way the root does.
 */
import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import {
  DropdownMenu as AstryxMenu,
  type DropdownMenuButtonProps,
  DropdownMenuCheckboxItem as AstryxCheckboxItem,
  DropdownMenuItem as AstryxItem,
  DropdownMenuRadioGroup as AstryxRadioGroup,
  DropdownMenuRadioItem as AstryxRadioItem,
  DropdownMenuSubMenu as AstryxSubMenu,
} from "@astryxdesign/core/DropdownMenu";
import { Divider } from "@astryxdesign/core/Divider";
import { Text } from "@astryxdesign/core/Text";

interface PartProps {
  children?: ReactNode;
  className?: string;
}

// Style objects live at module scope rather than inline in JSX: an inline
// style prop opens with two braces, which Handlebars reads as the start of an
// expression and refuses to render.
const LABEL_PADDING: React.CSSProperties = { padding: "0.375rem 0.75rem" };
const SHORTCUT_STYLE: React.CSSProperties = { marginInlineStart: "auto", opacity: 0.6 };

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

/**
 * Declarative only — the root reads it to build Astryx's trigger button.
 *
 * `aria-label` and `title` are read as well as `children`: Astryx's button
 * requires a `label`, and when the trigger is a glyph the only place an
 * accessible name can come from is the caller.
 */
export function DropdownMenuTrigger(
  _props: PartProps & { asChild?: boolean; "aria-label"?: string; title?: string }
) {
  return null;
}

/** Astryx portals its own popover, so these are structural pass-throughs. */
export function DropdownMenuContent({ children }: PartProps & { align?: string; sideOffset?: number }) {
  return <>{children}</>;
}

export function DropdownMenuGroup({ children }: PartProps) {
  return <>{children}</>;
}

export function DropdownMenuPortal({ children }: PartProps) {
  return <>{children}</>;
}

export interface DropdownMenuItemProps extends PartProps {
  onSelect?: (event: Event) => void;
  onClick?: () => void;
  disabled?: boolean;
  inset?: boolean;
}

export function DropdownMenuItem({ children, className, onSelect, onClick, disabled }: DropdownMenuItemProps) {
  return (
    <AstryxItem
      className={className}
      label={children}
      isDisabled={disabled}
      onClick={() => {
        onClick?.();
        // Radix hands `onSelect` the DOM event; Astryx has none to give, so a
        // synthetic one keeps the handler's signature honest rather than
        // passing undefined into code that reads `event.preventDefault()`.
        onSelect?.(new Event("select"));
      }}
    />
  );
}

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled,
}: PartProps & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <AstryxCheckboxItem
      label={children}
      // Astryx names the checked state `value`, not `isChecked`.
      value={checked === true}
      isDisabled={disabled}
      onChange={(next: boolean) => onCheckedChange?.(next)}
    />
  );
}

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: PartProps & { value?: string; onValueChange?: (value: string) => void }) {
  return (
    // `onChange` is required on Astryx's radio group, so it is always supplied
    // — an uncontrolled Radix radio group would otherwise fail to typecheck.
    <AstryxRadioGroup value={value} onChange={(next: string) => onValueChange?.(next)}>
      {children}
    </AstryxRadioGroup>
  );
}

export function DropdownMenuRadioItem({
  children,
  value,
  disabled,
}: PartProps & { value: string; disabled?: boolean }) {
  return <AstryxRadioItem value={value} label={children} isDisabled={disabled} />;
}

/** A section heading. Astryx has no menu-label part; `Text` is the closest. */
export function DropdownMenuLabel({ children, className }: PartProps & { inset?: boolean }) {
  return (
    <div className={className} style={LABEL_PADDING}>
      <Text size="sm" color="secondary">
        {children}
      </Text>
    </div>
  );
}

export function DropdownMenuSeparator({ className }: PartProps) {
  return <Divider className={className} />;
}

/**
 * A right-aligned keyboard hint. Radix styles this purely with classes, so it
 * stays a plain element — there is nothing in Astryx it maps onto, and Kbd
 * would render a key cap the shadcn call sites do not ask for.
 */
export function DropdownMenuShortcut({ children, className }: PartProps) {
  return (
    <span className={className} style={SHORTCUT_STYLE}>
      {children}
    </span>
  );
}

export function DropdownMenuSubTrigger(_props: PartProps & { inset?: boolean }) {
  return null;
}

export function DropdownMenuSubContent({ children }: PartProps) {
  return <>{children}</>;
}

export function DropdownMenuSub({ children }: PartProps) {
  const trigger = find(children, DropdownMenuSubTrigger);
  const label = (trigger?.props as { children?: ReactNode } | undefined)?.children;
  return (
    <AstryxSubMenu label={typeof label === "string" ? label : "More"}>
      {find(children, DropdownMenuSubContent)}
    </AstryxSubMenu>
  );
}

/**
 * Astryx's trigger button, built from whatever the caller put inside
 * `DropdownMenuTrigger`.
 *
 * `label` is required and typed `string` — Astryx has no `children`-as-label
 * escape hatch — so a non-string trigger goes into `icon` instead, with
 * `isIconOnly` so the button sizes for a glyph, and an accessible name taken
 * from the caller's `aria-label` or `title`.
 *
 * **The unwrapping is the part that matters.** Radix's `asChild` means "render
 * my child *as* the trigger", and in a shadcn call site that child is a
 * `<Button>`. Astryx owns the trigger and renders a `<button>` of its own, so
 * passing the child straight through puts one button inside another. That is
 * not merely invalid markup: the HTML parser hoists the inner button out of the
 * outer one, so the DOM React hydrates against is not the tree it rendered,
 * React discards the whole tree and re-renders it on the client, and every page
 * carrying the menu reports a hydration failure. Mounting the application shell
 * is what first rendered this adapter at all, which is how a defect that had
 * been generated into every application became visible.
 *
 * Unwrapping one level is the faithful reading of `asChild`, not a workaround:
 * the child's *content* becomes the trigger's content, and the props that say
 * how the trigger should look and be announced move onto Astryx's button, which
 * is the element that now carries them. `components/ui/button` already resolves
 * the same conflict the same way — a non-link `asChild` renders its children
 * rather than nesting them.
 *
 * A named function rather than an inline object because the JSX would open
 * with two braces, which Handlebars reads as the start of an expression.
 */
function triggerButton(trigger: ReactElement | undefined): DropdownMenuButtonProps {
  const props = (trigger?.props ?? {}) as {
    children?: ReactNode;
    asChild?: boolean;
    "aria-label"?: string;
    title?: string;
  };

  let content = props.children;
  let label = props["aria-label"] ?? props.title;
  let variant: DropdownMenuButtonProps["variant"];

  // A single element child is unwrapped when the caller said `asChild`, and
  // also when it is a bare `<button>` — nesting that is invalid whether or not
  // the Radix prop was written.
  const child = isValidElement(content) ? content : undefined;
  if (child && (props.asChild === true || child.type === "button")) {
    const childProps = child.props as {
      children?: ReactNode;
      variant?: DropdownMenuButtonProps["variant"];
      "aria-label"?: string;
      title?: string;
    };
    content = childProps.children;
    label = label ?? childProps["aria-label"] ?? childProps.title;
    variant = childProps.variant;
  }

  if (typeof content === "string") {
    return { label: content, variant };
  }

  return {
    label: label ?? "Open menu",
    icon: content,
    isIconOnly: true,
    variant: variant ?? "ghost",
  };
}

export interface DropdownMenuProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open, defaultOpen = false, onOpenChange }: DropdownMenuProps) {
  // Controlled when `open` is supplied, uncontrolled otherwise — the same
  // contract Radix offers, so existing call sites keep working either way.
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;

  const trigger = find(children, DropdownMenuTrigger);

  return (
    <AstryxMenu
      isMenuOpen={isOpen}
      onOpenChange={(next: boolean) => {
        if (open === undefined) setInternal(next);
        onOpenChange?.(next);
      }}
      button={triggerButton(trigger)}
      hasChevron={false}
    >
      {find(children, DropdownMenuContent) ?? children}
    </AstryxMenu>
  );
}

export default DropdownMenu;
