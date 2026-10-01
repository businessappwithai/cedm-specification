"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GridLayout, { type Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Move, Settings, X } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardWidget } from "@/types/database";

const ResponsiveGridLayout = WidthProvider(GridLayout);

interface ActiveFilter {
  sourceWidgetId: string;
  column: string;
  values: unknown[];
  operator: "eq" | "in" | "range";
}

interface DashboardGridProps {
  widgets: (DashboardWidget & {
    title?: string;
  })[];
  /** One item per widget — see `resolveDashboardLayout`. */
  layout: Layout[];
  isEditing?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  onRemoveWidget?: (widgetId: string) => void;
  onConfigureWidget?: (widgetId: string) => void;
  onFilterApply?: (filter: Omit<ActiveFilter, "id" | "affectedWidgets">) => void;
}

const WIDGET_TYPE_LABELS: Record<string, string> = {
  chart: "Chart",
  report: "Report",
  metric: "Metric",
  text: "Text",
};

/** Tracks an element's content height, so a chart can fill its grid cell. */
function useContentHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(Math.floor(entry.contentRect.height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

/**
 * One widget, composed from the shadcn base Card: the title and widget type in
 * the header, the controls in `CardAction`, and a content slot that takes the
 * rest of the grid cell (`flex-1 min-h-0`) instead of a hard-coded height.
 */
function WidgetTile({
  widget,
  isEditing,
  isDragging,
  onRemoveWidget,
  onConfigureWidget,
  onFilterApply,
}: {
  widget: DashboardGridProps["widgets"][number];
  isEditing: boolean;
  isDragging: boolean;
} & Pick<DashboardGridProps, "onRemoveWidget" | "onConfigureWidget" | "onFilterApply">) {
  const [contentRef, contentHeight] = useContentHeight<HTMLDivElement>();
  const typeLabel = WIDGET_TYPE_LABELS[widget.widget_type] ?? widget.widget_type;

  return (
    <Card
      size="sm"
      className={cn(
        "h-full gap-3 transition-shadow hover:shadow-tremor-dropdown",
        isDragging && "cursor-grabbing",
        isEditing && "ring-2 ring-tremor-brand"
      )}
    >
      <CardHeader className="border-b border-tremor-border">
        <CardTitle className="truncate">{widget.title || typeLabel}</CardTitle>
        <CardDescription>{typeLabel}</CardDescription>
        <CardAction
          className={cn(
            "flex items-center gap-1 transition-opacity",
            // Revealed on hover or keyboard focus; always shown while editing.
            isEditing
              ? "opacity-100"
              : "opacity-0 focus-within:opacity-100 group-hover/card:opacity-100"
          )}
        >
          {isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="drag-handle h-7 w-7 cursor-grab"
              title="Drag to move"
              aria-label="Drag to move"
            >
              <Move className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Configure widget"
            aria-label="Configure widget"
            onClick={() => onConfigureWidget?.(widget.id)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Remove widget"
            aria-label="Remove widget"
            onClick={() => onRemoveWidget?.(widget.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent ref={contentRef} className="min-h-0 flex-1 overflow-hidden">
        <WidgetCard widget={widget} height={contentHeight} onFilterApply={onFilterApply} />
      </CardContent>
    </Card>
  );
}

export function DashboardGrid({
  widgets,
  layout,
  isEditing = false,
  onLayoutChange,
  onRemoveWidget,
  onConfigureWidget,
  onFilterApply,
}: DashboardGridProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      onLayoutChange?.(newLayout);
    },
    [onLayoutChange]
  );

  return (
    <ResponsiveGridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={100}
      containerPadding={[0, 0]}
      margin={[16, 16]}
      isDraggable={isEditing}
      isResizable
      onLayoutChange={handleLayoutChange}
      onDragStart={() => setIsDragging(true)}
      onDragStop={() => setIsDragging(false)}
      onResizeStart={() => setIsDragging(true)}
      onResizeStop={() => setIsDragging(false)}
      draggableHandle=".drag-handle"
      resizeHandles={isEditing ? ["s", "e", "se", "sw", "n", "ne", "nw", "w"] : ["se"]}
      useCSSTransforms
    >
      {widgets.map((widget) => (
        <section
          key={widget.id}
          className="widget-container relative"
          aria-label={widget.title || WIDGET_TYPE_LABELS[widget.widget_type] || "Widget"}
        >
          <WidgetTile
            widget={widget}
            isEditing={isEditing}
            isDragging={isDragging}
            onRemoveWidget={onRemoveWidget}
            onConfigureWidget={onConfigureWidget}
            onFilterApply={onFilterApply}
          />
        </section>
      ))}
    </ResponsiveGridLayout>
  );
}
