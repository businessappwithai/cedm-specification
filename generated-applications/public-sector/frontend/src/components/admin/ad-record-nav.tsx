import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HStack, Text } from "@/components/ui/layout";

interface ADRecordNavProps {
  currentIndex: number;
  totalCount: number;
  page: number;
  pageSize: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}

export function ADRecordNav({
  currentIndex,
  totalCount,
  page,
  pageSize,
  canGoPrev,
  canGoNext,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: ADRecordNavProps) {
  const globalPosition = (page - 1) * pageSize + currentIndex + 1;

  return (
    <HStack align="center" gap={1}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onFirst}
        disabled={!canGoPrev}
      >
        <ChevronsLeft size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onPrev}
        disabled={!canGoPrev}
      >
        <ChevronLeft size={16} />
      </Button>

      <Text size="sm" color="secondary" className="px-2 min-w-[80px] text-center tabular-nums">
        {totalCount === 0 ? "0 of 0" : `${globalPosition} of ${totalCount}`}
      </Text>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onNext}
        disabled={!canGoNext}
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onLast}
        disabled={!canGoNext}
      >
        <ChevronsRight size={16} />
      </Button>
    </HStack>
  );
}
