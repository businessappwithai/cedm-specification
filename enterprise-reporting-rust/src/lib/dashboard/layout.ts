/**
 * Resolving a dashboard's grid layout from what is stored.
 *
 * Two places hold a widget's position: the dashboard's `layout_config`
 * (`layouts.lg`, written by "Save Layout") and each widget's own
 * `position_config` (written when it is added, and again on save). This
 * reconciles them into exactly one grid item per widget, synchronously, so the
 * grid never mounts without one.
 *
 * It used to be a `useEffect` that copied the layout into state after render.
 * The grid mounted first with an empty layout, gave every widget
 * react-grid-layout's 1×1 default, and reported that through `onLayoutChange`,
 * which overwrote the saved layout: every widget rendered as a sliver and
 * "Save Layout" lit up on load. And a dashboard with a saved `layout_config`
 * ignored `position_config` entirely, so a widget added after the last save
 * also came up 1×1.
 */

import type { Layout } from "react-grid-layout";

export interface PositionedWidget {
  id: string;
  position_config?: unknown;
}

const DEFAULT_SIZE = { w: 4, h: 4, minW: 2, minH: 2 };

function parse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** A grid item from a stored position, or `undefined` if it has no usable size. */
function toItem(id: string, stored: unknown): Layout | undefined {
  if (!stored || typeof stored !== "object") return undefined;
  const p = stored as Record<string, unknown>;
  const w = num(p.w);
  const h = num(p.h);
  if (!w || !h) return undefined;
  return {
    i: id,
    x: num(p.x) ?? 0,
    y: num(p.y) ?? 0,
    w,
    h,
    minW: num(p.minW) ?? DEFAULT_SIZE.minW,
    minH: num(p.minH) ?? DEFAULT_SIZE.minH,
  };
}

/**
 * One grid item per widget: the dashboard's saved layout first, then the
 * widget's own position, then a default size placed below everything else.
 */
export function resolveDashboardLayout(
  layoutConfig: unknown,
  widgets: readonly PositionedWidget[]
): Layout[] {
  const config = parse(layoutConfig) as { layouts?: { lg?: unknown } } | undefined;
  const saved = Array.isArray(config?.layouts?.lg) ? (config.layouts.lg as unknown[]) : [];
  const savedById = new Map<string, unknown>();
  for (const entry of saved) {
    const i = (entry as { i?: unknown })?.i;
    if (typeof i === "string") savedById.set(i, entry);
  }

  const items = widgets.map(
    (widget) =>
      toItem(widget.id, savedById.get(widget.id)) ??
      toItem(widget.id, parse(widget.position_config))
  );

  // Unplaced widgets go under the placed ones rather than on top of them.
  let bottom = Math.max(0, ...items.map((item) => (item ? item.y + item.h : 0)));
  return items.map((item, index) => {
    if (item) return item;
    const placed = { i: widgets[index].id, x: 0, y: bottom, ...DEFAULT_SIZE };
    bottom += DEFAULT_SIZE.h;
    return placed;
  });
}

/** Applies the user's unsaved moves and resizes onto the resolved layout. */
export function applyLayoutEdits(base: Layout[], edits: Layout[] | null): Layout[] {
  if (!edits) return base;
  const byId = new Map(edits.map((item) => [item.i, item]));
  return base.map((item) => {
    const edit = byId.get(item.i);
    return edit ? { ...item, x: edit.x, y: edit.y, w: edit.w, h: edit.h } : item;
  });
}

/** Same widgets in the same places — ignoring order and min sizes. */
export function isSameLayout(a: readonly Layout[], b: readonly Layout[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((item) => [item.i, item]));
  return a.every((item) => {
    const other = byId.get(item.i);
    return (
      !!other &&
      other.x === item.x &&
      other.y === item.y &&
      other.w === item.w &&
      other.h === item.h
    );
  });
}
