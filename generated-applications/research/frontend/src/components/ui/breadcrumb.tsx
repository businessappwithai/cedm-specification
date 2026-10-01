/**
 * Breadcrumb — shadcn surface over Astryx `Breadcrumbs`.
 *
 * Close to a straight rename: both compose a list of items. The shadcn
 * separator and ellipsis parts render nothing, because Astryx draws its own
 * separators — leaving them in place means the admin shell's breadcrumb markup
 * does not have to change.
 */
import type { ReactNode } from "react";
import { BreadcrumbItem as AstryxItem, Breadcrumbs } from "@astryxdesign/core/Breadcrumbs";

interface PartProps extends React.HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function Breadcrumb({ children, className }: PartProps) {
  return <Breadcrumbs className={className}>{children}</Breadcrumbs>;
}

export function BreadcrumbList({ children }: PartProps) {
  return <>{children}</>;
}

export function BreadcrumbItem({ children }: PartProps) {
  return <>{children}</>;
}

export function BreadcrumbLink({ children, href }: PartProps & { href?: string; asChild?: boolean }) {
  return <AstryxItem href={href}>{children}</AstryxItem>;
}

export function BreadcrumbPage({ children }: PartProps) {
  return <AstryxItem isCurrent>{children}</AstryxItem>;
}

/** Astryx renders separators itself. */
export function BreadcrumbSeparator(_props: PartProps) {
  return null;
}

export function BreadcrumbEllipsis(_props: PartProps) {
  return null;
}

export default Breadcrumb;
