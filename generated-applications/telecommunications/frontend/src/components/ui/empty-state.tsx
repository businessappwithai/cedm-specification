/**
 * EmptyState — shadcn-era local component over Astryx `EmptyState`.
 *
 * The generated list views render this for the zero-row case. Astryx requires
 * a `title`, so the adapter supplies a neutral default rather than rendering an
 * untitled state.
 */
import type { ReactNode } from "react";
import { EmptyState as AstryxEmptyState } from "@astryxdesign/core/EmptyState";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title = "Nothing to show", description, icon, action, className }: EmptyStateProps) {
  return (
    <AstryxEmptyState title={title} description={description} icon={icon} actions={action} className={className} />
  );
}

export default EmptyState;
