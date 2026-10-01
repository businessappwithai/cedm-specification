/**
 * Card — shadcn surface over Astryx `Card`.
 *
 * shadcn splits a card into six composable parts (`CardHeader`, `CardTitle`,
 * …). Astryx ships one `Card`. The sub-parts are kept as plain semantic
 * wrappers so the many call sites that compose them keep rendering; they carry
 * no styling of their own, which is the point — spacing now comes from the
 * theme rather than from utility classes on each part.
 */
import type { ReactNode } from "react";
import { Card as AstryxCard } from "@astryxdesign/core/Card";

interface SectionProps {
  children?: ReactNode;
  className?: string;
}

export function Card({ children, className }: SectionProps) {
  return <AstryxCard className={className}>{children}</AstryxCard>;
}

export function CardHeader({ children, className }: SectionProps) {
  return <header className={className}>{children}</header>;
}

export function CardTitle({ children, className }: SectionProps) {
  return <h3 className={className}>{children}</h3>;
}

export function CardDescription({ children, className }: SectionProps) {
  return <p className={className}>{children}</p>;
}

export function CardContent({ children, className }: SectionProps) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className }: SectionProps) {
  return <footer className={className}>{children}</footer>;
}

export default Card;
