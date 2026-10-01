import { Skeleton } from "@/components/ui/skeleton";
import { Grid, HStack } from "@/components/ui/layout";

function QuickAccessCardSkeleton() {
  return (
    <div className="swiss-card p-6 space-y-4">
      <HStack align="start" justify="between" gap={4}>
        <HStack align="center" gap={3} grow>
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </HStack>
      </HStack>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-2 border-t border-border/50">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Grid columns={1} gap={4}>
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed-length placeholder list rendered from Array.from — it has no data, never reorders, and the index is the only identity there is
        <QuickAccessCardSkeleton key={i} />
      ))}
    </Grid>
  );
}
