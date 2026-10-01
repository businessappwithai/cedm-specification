/**
 * Button — shadcn surface over Astryx `Button`.
 *
 * Astryx takes its content as a `label` prop and spells the disabled flag
 * `isDisabled`; shadcn callers pass children and `disabled`. Both are accepted
 * here so existing call sites keep working.
 *
 * `asChild` (Radix `Slot`) has no Astryx equivalent. Callers used it to render
 * a link that looks like a button, which Astryx expresses with `href`, so that
 * is what it maps to. A non-link `asChild` renders the children directly rather
 * than wrapping them in a button that would nest interactive elements.
 */
import { Children, isValidElement, type ReactNode } from "react";
import { Button as AstryxButton } from "@astryxdesign/core/Button";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

export interface ButtonProps {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  isLoading?: boolean;
  asChild?: boolean;
  href?: string;
  className?: string;
  /**
   * Forwarded to Astryx, which forwards it to the DOM. Not decorative: it was
   * declared here and dropped before, so every `type="submit"` rendered a plain
   * button — the login form could not be submitted by pressing Enter, and any
   * form relying on native submit did nothing at all.
   */
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  title?: string;
  /**
   * The accessible name of an icon-only button. Astryx names a button by its
   * `label`, so this becomes the label of a button that shows only an icon.
   * It was not declared here, so every icon-only button in the application
   * had no name — the navigation's collapse toggle included.
   */
  "aria-label"?: string;
}

/**
 * `<Icon /> Text` — the shape shadcn call sites write — as Astryx's `icon` and
 * `label`, or null for any other composition.
 *
 * Astryx lays `icon` out beside the label; children go inside the label's text
 * span, where an SVG is a block (Tailwind's preflight) and pushes the text onto
 * a second line the button's height then clips. That is how "Run again",
 * "Refresh" and "New Rule" rendered, each with an empty accessible name,
 * because the label passed alongside non-string children was "".
 */
function iconAndText(children: ReactNode): { icon: ReactNode; text: string } | null {
  const parts = Children.toArray(children);
  const [first, ...rest] = parts;
  if (!isValidElement(first) || rest.length === 0) return null;
  if (!rest.every((part) => typeof part === "string" || typeof part === "number")) return null;
  const text = rest.join("").trim();
  return text ? { icon: first, text } : null;
}

/** shadcn variant names → Astryx variant names. */
const VARIANTS: Record<Variant, string> = {
  default: "primary",
  destructive: "danger",
  outline: "secondary",
  secondary: "secondary",
  ghost: "ghost",
  link: "ghost",
};

const SIZES: Record<Size, "sm" | "md" | "lg"> = {
  default: "md",
  sm: "sm",
  lg: "lg",
  icon: "md",
};

export function Button({
  children,
  variant = "default",
  size = "default",
  disabled,
  isLoading,
  asChild,
  href,
  className,
  type = "button",
  onClick,
  title,
  "aria-label": ariaLabel,
}: ButtonProps) {
  // `asChild` without an href was composition we cannot express; render the
  // child rather than nesting it inside a button.
  if (asChild && !href) {
    return <>{children}</>;
  }

  const split = iconAndText(children);
  if (split) {
    return (
      <AstryxButton
        label={split.text}
        icon={split.icon}
        variant={VARIANTS[variant] as never}
        size={SIZES[size]}
        type={type}
        isDisabled={disabled}
        isLoading={isLoading}
        href={href}
        className={className}
        tooltip={title}
        clickAction={onClick}
      />
    );
  }

  // An icon and nothing else: Astryx draws it from `icon`, and names the button
  // from `label`. Passed as children it was laid out inside an empty label and
  // never drawn, so the sidebar's collapse toggle was a clickable blank.
  if (size === "icon" && isValidElement(children)) {
    return (
      <AstryxButton
        label={ariaLabel ?? title ?? ""}
        icon={children}
        variant={VARIANTS[variant] as never}
        size={SIZES[size]}
        type={type}
        isDisabled={disabled}
        isLoading={isLoading}
        isIconOnly
        href={href}
        className={className}
        tooltip={title ?? ariaLabel}
        clickAction={onClick}
      />
    );
  }

  return (
    <AstryxButton
      label={typeof children === "string" ? children : (ariaLabel ?? "")}
      variant={VARIANTS[variant] as never}
      size={SIZES[size]}
      type={type}
      isDisabled={disabled}
      isLoading={isLoading}
      isIconOnly={size === "icon"}
      href={href}
      className={className}
      tooltip={title}
      clickAction={onClick}
    >
      {typeof children === "string" ? undefined : children}
    </AstryxButton>
  );
}

export default Button;
