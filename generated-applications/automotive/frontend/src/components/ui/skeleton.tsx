/**
 * Skeleton — shadcn surface over Astryx `Skeleton`.
 *
 * shadcn's version is a bare `<div>` sized entirely by Tailwind classes
 * (`h-4 w-32`). Astryx takes explicit `width`/`height`. `className` is still
 * forwarded so existing sizing classes keep working through the Tailwind
 * bridge during Phase B; the explicit props are there for callers written
 * after the swap.
 */
import { Skeleton as AstryxSkeleton } from "@astryxdesign/core/Skeleton";

export interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return <AstryxSkeleton className={className} width={width} height={height} />;
}

export default Skeleton;
