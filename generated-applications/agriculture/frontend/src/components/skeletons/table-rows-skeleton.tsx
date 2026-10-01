import { Skeleton } from "@/components/ui/skeleton";
import { Box } from "@/components/ui/layout";

export function TableRowsSkeleton({ cols = 5, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <Box border="default">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed-length placeholder list rendered from Array.from — it has no data, never reorders, and the index is the only identity there is
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed-length placeholder list rendered from Array.from — it has no data, never reorders, and the index is the only identity there is
          key={i}
          className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed-length placeholder list rendered from Array.from — it has no data, never reorders, and the index is the only identity there is
              key={j}
              className={`h-4 ${j === 0 ? "w-8" : j === cols - 1 ? "w-20" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </Box>
  );
}
