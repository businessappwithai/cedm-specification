import { Skeleton } from "@/components/ui/skeleton";
import { Grid, VStack } from "@/components/ui/layout";

function StatCardSkeleton() {
  return (
    <VStack padding={6} justify="between" className="border-t border-b border-border border-r bg-card">
      <div className="space-y-5">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-12" />
      </div>
      <Skeleton className="h-3 w-20 mt-3" />
    </VStack>
  );
}

export function StatsRowSkeleton() {
  return (
    <Grid columns={6} gap={0} className="border-l border-r border-border">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed-length placeholder list rendered from Array.from — it has no data, never reorders, and the index is the only identity there is
        <StatCardSkeleton key={i} />
      ))}
    </Grid>
  );
}
