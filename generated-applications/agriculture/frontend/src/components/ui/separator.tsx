/**
 * Separator — shadcn surface over Astryx `Divider`.
 *
 * A near-exact match; only the component name differs. `decorative` has no
 * Astryx counterpart because Divider is already non-semantic.
 */
import { Divider } from "@astryxdesign/core/Divider";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
}

export function Separator({ orientation = "horizontal", className }: SeparatorProps) {
  return <Divider orientation={orientation} className={className} />;
}

export default Separator;
