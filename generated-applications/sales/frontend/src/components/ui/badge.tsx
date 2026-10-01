/**
 * Badge — shadcn surface over Astryx `Badge`.
 *
 * Astryx takes content as `label`; shadcn callers pass children.
 */
import type { ReactNode } from "react";
import { Badge as AstryxBadge } from "@astryxdesign/core/Badge";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "muted";

export interface BadgeProps {
  children?: ReactNode;
  variant?: Variant;
  className?: string;
}

/**
 * The generated admin UI leans on `success` / `warning` / `muted` for
 * doc_status chips, so those map to real Astryx intents rather than falling
 * back to the neutral default.
 */
const VARIANTS: Record<Variant, string> = {
  default: "primary",
  secondary: "neutral",
  destructive: "error",
  outline: "neutral",
  success: "success",
  warning: "warning",
  muted: "neutral",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return <AstryxBadge label={children} variant={VARIANTS[variant] as never} className={className} />;
}

export default Badge;
