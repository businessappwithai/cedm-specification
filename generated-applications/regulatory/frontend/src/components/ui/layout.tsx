/**
 * Layout and typography primitives — the Astryx implementation.
 *
 * Same prop surface as the NestJS stack's `layout.tsx`, which renders these
 * with Tailwind classes. The shared screens under `components/admin/*`,
 * `components/forms/*`, `components/tables/*` and `routes/*` compose these
 * instead of naming classes, so one set of screens renders under both stacks
 * and this stack needs no Tailwind at all.
 *
 * Everything here is a thin translation of the shared vocabulary onto Astryx's:
 * `align`/`justify` become `vAlign`/`hAlign`, and the spacing steps are already
 * Astryx's `SpacingStep` values — that is why the shared type is exactly those
 * eleven numbers rather than Tailwind's fuller scale.
 */
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { Grid as AstryxGrid } from "@astryxdesign/core/Grid";
import { HStack as AstryxHStack } from "@astryxdesign/core/HStack";
import { VStack as AstryxVStack } from "@astryxdesign/core/VStack";
import { Heading as AstryxHeading } from "@astryxdesign/core/Heading";
import { Text as AstryxText } from "@astryxdesign/core/Text";

export type Space = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = "start" | "center" | "end" | "between" | "around";

export interface StackProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  children?: ReactNode;
  gap?: Space;
  padding?: Space;
  paddingInline?: Space;
  paddingBlock?: Space;
  align?: Align;
  justify?: Justify;
  grow?: boolean;
  wrap?: boolean;
  fullWidth?: boolean;
  as?: ElementType;
}

// `Justify` needs no translation: the shared vocabulary was chosen to match
// Astryx's `justifyContent` names exactly (start/center/end/between/around).

/**
 * `grow` has no Astryx prop — it is the parent's flex behaviour, not the
 * child's layout — so it stays an inline style. This is the one place the
 * translation is not a rename.
 */
const GROW: React.CSSProperties = { flex: 1 };

/**
 * Narrow the leftover HTML attributes to what Astryx's `BaseProps` accepts.
 *
 * `BaseProps` omits a long list of rarely-used HTML attributes (`title`,
 * `color`, `lang`, `popover`, …) that `HTMLAttributes` declares, so spreading
 * the rest wholesale does not typecheck. These are the ones call sites actually
 * pass; anything else is dropped rather than smuggled through with a cast.
 */
function passThrough(rest: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (
      key === "className" ||
      key === "id" ||
      key === "role" ||
      key === "onClick" ||
      key.startsWith("data-") ||
      key.startsWith("aria-")
    ) {
      out[key] = value;
    }
  }
  return out;
}

export function HStack({
  children,
  gap,
  padding,
  paddingInline,
  paddingBlock,
  align,
  justify,
  grow,
  wrap,
  fullWidth,
  style,
  as: _as,
  ...rest
}: StackProps) {
  return (
    <AstryxHStack
      gap={gap}
      padding={padding}
      paddingInline={paddingInline}
      paddingBlock={paddingBlock}
      vAlign={align}
      hAlign={justify}
      wrap={wrap ? "wrap" : undefined}
      width={fullWidth ? "100%" : undefined}
      style={grow ? { ...GROW, ...style } : style}
      {...passThrough(rest)}
    >
      {children}
    </AstryxHStack>
  );
}

export function VStack({
  children,
  gap,
  padding,
  paddingInline,
  paddingBlock,
  align,
  justify,
  grow,
  wrap,
  fullWidth,
  style,
  as: _as,
  ...rest
}: StackProps) {
  return (
    <AstryxVStack
      gap={gap}
      padding={padding}
      paddingInline={paddingInline}
      paddingBlock={paddingBlock}
      // A column's cross axis is horizontal, so the shared `align` maps to
      // `hAlign` here and to `vAlign` on the row above — the same reversal
      // Tailwind's `items-*` performs implicitly.
      hAlign={align}
      vAlign={justify}
      wrap={wrap ? "wrap" : undefined}
      width={fullWidth ? "100%" : undefined}
      style={grow ? { ...GROW, ...style } : style}
      {...passThrough(rest)}
    >
      {children}
    </AstryxVStack>
  );
}

export interface GridProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  children?: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: Space;
  padding?: Space;
  paddingInline?: Space;
  paddingBlock?: Space;
  fullWidth?: boolean;
}

export function Grid({
  children,
  columns = 1,
  gap,
  padding,
  paddingInline,
  paddingBlock,
  fullWidth,
  ...rest
}: GridProps) {
  // Astryx's `Grid` takes gaps but not padding — it is a track definition, not
  // a box. Wrapping in a padded `VStack` keeps the padding props working
  // without pretending the grid itself has an inner edge.
  const grid = (
    <AstryxGrid
      columns={columns}
      gap={gap}
      width={fullWidth ? "100%" : undefined}
      {...passThrough(rest)}
    >
      {children}
    </AstryxGrid>
  );
  const padded = padding !== undefined || paddingInline !== undefined || paddingBlock !== undefined;
  return padded ? (
    <AstryxVStack padding={padding} paddingInline={paddingInline} paddingBlock={paddingBlock}>
      {grid}
    </AstryxVStack>
  ) : (
    grid
  );
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export type TextSize = "xs" | "sm" | "base" | "lg" | "xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor = "primary" | "secondary" | "accent" | "success" | "warning" | "danger";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  children?: ReactNode;
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  block?: boolean;
  truncate?: boolean;
  uppercase?: boolean;
  as?: ElementType;
}

/** The shared scale onto Astryx's — `xs` is Astryx's `xsm`. */
const SIZE = {
  xs: "xsm",
  sm: "sm",
  base: "base",
  lg: "lg",
  xl: "xl",
} as const;

/**
 * Astryx's `TextColor` has no success/warning/danger, so those three resolve
 * through the `Icon` palette's semantic names instead, applied as a colour
 * variable. The alternative — dropping them to `primary` — would render a
 * validation error in body-text colour, which is the one case where the colour
 * is the message.
 */
const SEMANTIC_COLOR: Record<"success" | "warning" | "danger", string> = {
  success: "var(--astryx-color-text-success, #0D8626)",
  warning: "var(--astryx-color-text-warning, #E9AF08)",
  danger: "var(--astryx-color-text-error, #E3193B)",
};

const ASTRYX_COLOR = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
} as const;

const UPPERCASE: React.CSSProperties = { textTransform: "uppercase", letterSpacing: "0.05em" };
/**
 * Astryx's `WordBreak` is `break-word | break-all` — it has no ellipsis mode,
 * so truncation is CSS here rather than a prop.
 */
const TRUNCATE: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function Text({
  children,
  size,
  weight,
  color,
  block,
  truncate,
  uppercase,
  style,
  // Astryx's `Text` picks its own element from `type`; there is no `as`
  // escape hatch, so this is accepted for call-site compatibility and
  // dropped rather than forwarded into a prop that does not exist.
  as: _as,
  ...rest
}: TextProps) {
  const semantic = color && color in SEMANTIC_COLOR ? SEMANTIC_COLOR[color as never] : undefined;
  const merged: React.CSSProperties = {
    ...(uppercase ? UPPERCASE : null),
    ...(truncate ? TRUNCATE : null),
    ...(semantic ? { color: semantic } : null),
    ...style,
  };

  return (
    <AstryxText
      size={size ? SIZE[size] : undefined}
      weight={weight}
      color={color && color in ASTRYX_COLOR ? ASTRYX_COLOR[color as never] : undefined}
      display={block ? "block" : undefined}
      style={merged}
      {...passThrough(rest)}
    >
      {children}
    </AstryxText>
  );
}

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "color"> {
  children?: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  color?: TextColor;
  /** Small-caps section labels — the shape most admin sub-headings take. */
  uppercase?: boolean;
  truncate?: boolean;
}

export function Heading({
  children,
  level,
  color,
  uppercase,
  truncate,
  style,
  ...rest
}: HeadingProps) {
  const semantic = color && color in SEMANTIC_COLOR ? SEMANTIC_COLOR[color as never] : undefined;
  const merged: React.CSSProperties = {
    ...(uppercase ? UPPERCASE : null),
    ...(truncate ? TRUNCATE : null),
    ...(semantic ? { color: semantic } : null),
    ...style,
  };
  return (
    <AstryxHeading level={level} style={merged} {...passThrough(rest)}>
      {children}
    </AstryxHeading>
  );
}

const SPACER: React.CSSProperties = { flex: 1 };

/** Pushes siblings apart in a flex container. */
export function Spacer() {
  return <div style={SPACER} />;
}

// ---------------------------------------------------------------------------
// Box — the non-flex container
// ---------------------------------------------------------------------------

/**
 * A plain block with spacing, a border, a radius and a background.
 *
 * `HStack` / `VStack` / `Grid` cover elements that lay their children out.
 * `Box` covers the rest — the `<div className="mb-2 p-4 border rounded-lg
 * bg-card">` shape, which is most of them. Without it there is no way to say
 * "padded, bordered card" without naming a Tailwind class, and Phase C cannot
 * finish.
 *
 * **Every value is semantic, never a palette entry.** `bg="subtle"` rather than
 * `bg-gray-50`, `border="default"` rather than `border-gray-200`. That is the
 * point of the port: a hardcoded shade survives a theme switch unchanged, and
 * this app ships seven themes.
 */
export type BoxBackground = "none" | "surface" | "subtle" | "muted" | "accent" | "inverse";
export type BoxBorder = "none" | "default" | "strong" | "accent";
export type BoxSide = "all" | "top" | "bottom" | "start" | "end" | "block" | "inline";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "full";
export type BoxWidth = "auto" | "full" | "fit" | "min" | "sm" | "md" | "lg" | "xl";

export interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  children?: ReactNode;
  padding?: Space;
  paddingInline?: Space;
  paddingBlock?: Space;
  margin?: Space;
  marginTop?: Space;
  marginBottom?: Space;
  marginInline?: Space;
  bg?: BoxBackground;
  border?: BoxBorder;
  /** Which edges the border is drawn on. @default "all" */
  borderSide?: BoxSide;
  radius?: BoxRadius;
  width?: BoxWidth;
  /**
   * A ceiling, not a size. Separate from `width` because `w-full max-w-md` is
   * two different constraints on one element, and collapsing them onto a single
   * prop silently drops one.
   */
  maxWidth?: BoxWidth;
  fullHeight?: boolean;
  /** Scroll rather than clip when the content overflows. */
  scrollable?: boolean;
  grow?: boolean;
  as?: ElementType;
}

/**
 * Theme tokens with a literal fallback.
 *
 * Astryx publishes these as CSS custom properties, so the active theme drives
 * them at runtime. The fallbacks cover the moment before the stylesheet applies
 * and anyone rendering a component in isolation.
 */
const BACKGROUND: Record<BoxBackground, string | undefined> = {
  none: undefined,
  surface: "var(--astryx-color-background-primary, light-dark(#FFFFFF, #1C1E21))",
  subtle: "var(--astryx-color-background-secondary, light-dark(#F5F6F7, #242629))",
  muted: "var(--astryx-color-background-tertiary, light-dark(#EBEDF0, #2C2F33))",
  accent: "var(--astryx-color-background-accent, light-dark(#E7F0FE, #17293F))",
  inverse: "var(--astryx-color-background-inverse, light-dark(#0A1317, #DFE2E5))",
};

const BORDER_COLOR: Record<BoxBorder, string | undefined> = {
  none: undefined,
  default: "var(--astryx-color-border-primary, light-dark(#DFE2E5, #3A3D42))",
  strong: "var(--astryx-color-border-secondary, light-dark(#A4B0BC, #6F747C))",
  accent: "var(--astryx-color-border-accent, light-dark(#0064E0, #2694FE))",
};

const RADIUS: Record<BoxRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  full: "9999px",
};

const WIDTH: Record<BoxWidth, string | undefined> = {
  auto: undefined,
  full: "100%",
  fit: "fit-content",
  min: "0",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
};

/** Astryx's spacing steps in rem, matching `SpacingStep`. */
function rem(step: Space): string {
  return `${step * 0.25}rem`;
}

/** Inline object literals in JSX open with two braces, which Handlebars eats. */
function merge(computed: React.CSSProperties, incoming?: React.CSSProperties) {
  return incoming ? { ...computed, ...incoming } : computed;
}

function boxStyle(p: BoxProps): React.CSSProperties {
  const s: React.CSSProperties = {};

  if (p.padding !== undefined) s.padding = rem(p.padding);
  if (p.paddingInline !== undefined) s.paddingInline = rem(p.paddingInline);
  if (p.paddingBlock !== undefined) s.paddingBlock = rem(p.paddingBlock);
  if (p.margin !== undefined) s.margin = rem(p.margin);
  if (p.marginTop !== undefined) s.marginTop = rem(p.marginTop);
  if (p.marginBottom !== undefined) s.marginBottom = rem(p.marginBottom);
  if (p.marginInline !== undefined) s.marginInline = rem(p.marginInline);

  if (p.bg && p.bg !== "none") s.background = BACKGROUND[p.bg];

  if (p.border && p.border !== "none") {
    const rule = `1px solid ${BORDER_COLOR[p.border]}`;
    switch (p.borderSide ?? "all") {
      case "top":
        s.borderTop = rule;
        break;
      case "bottom":
        s.borderBottom = rule;
        break;
      case "start":
        s.borderInlineStart = rule;
        break;
      case "end":
        s.borderInlineEnd = rule;
        break;
      case "block":
        s.borderBlock = rule;
        break;
      case "inline":
        s.borderInline = rule;
        break;
      default:
        s.border = rule;
    }
  }

  if (p.radius) s.borderRadius = RADIUS[p.radius];
  if (p.width) s.width = WIDTH[p.width];
  if (p.maxWidth) s.maxWidth = WIDTH[p.maxWidth];
  if (p.fullHeight) s.height = "100%";
  if (p.scrollable) s.overflow = "auto";
  if (p.grow) s.flex = 1;

  return s;
}

export function Box({
  children,
  className,
  style,
  as: Element = "div",
  padding,
  paddingInline,
  paddingBlock,
  margin,
  marginTop,
  marginBottom,
  marginInline,
  bg,
  border,
  borderSide,
  radius,
  width,
  maxWidth,
  fullHeight,
  scrollable,
  grow,
  ...rest
}: BoxProps) {
  const computed = boxStyle({
    padding,
    paddingInline,
    paddingBlock,
    margin,
    marginTop,
    marginBottom,
    marginInline,
    bg,
    border,
    borderSide,
    radius,
    width,
    maxWidth,
    fullHeight,
    scrollable,
    grow,
  });
  return (
    <Element className={className} style={merge(computed, style)} {...rest}>
      {children}
    </Element>
  );
}
