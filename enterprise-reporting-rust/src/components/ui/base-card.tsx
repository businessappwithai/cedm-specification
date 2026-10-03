import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui's **base** Card (https://ui.shadcn.com/docs/components/base/card),
 * ported from the registry source (`registry/bases/base/ui/card.tsx` plus the
 * `cn-card*` rules of its Vega style) to this project's Tailwind 3.
 *
 * It sits beside `card.tsx` rather than replacing it. The Tremor card pads each
 * slot itself (`p-6`, `p-6 pt-0`) and ~100 screens pass padding overrides that
 * assume that; this one spaces its slots with one `--card-spacing` variable
 * and a flex `gap`, which is what lets a card fill a fixed-height grid cell
 * and let its content take the rest. New composed surfaces (the dashboard
 * first) use this one.
 *
 * Colours, radius, elevation and the heading face come from the theme tokens,
 * so it follows the selected design theme (Tremor or Astryx) like everything
 * else: `rounded-lg` is `--radius-lg`, `shadow-tremor-card` and
 * `font-heading` are variables too.
 *
 * - `size="sm"` tightens `--card-spacing` from 1.5rem to 1rem.
 * - `CardAction` sits top-right of the header; the header's grid makes room
 *   for it only when it is present.
 * - `border-b` on the header / `border-t` on the footer adds the matching
 *   padding, as in shadcn.
 */

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-[var(--card-spacing)] overflow-hidden rounded-lg bg-card py-[var(--card-spacing)] text-sm text-card-foreground shadow-tremor-card ring-1 ring-tremor-ring",
        "[--card-spacing:1.5rem] data-[size=sm]:[--card-spacing:1rem] has-[>img:first-child]:pt-0",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header grid auto-rows-min items-start gap-1 px-[var(--card-spacing)]",
        "has-[[data-slot=card-action]]:grid-cols-[1fr_auto] has-[[data-slot=card-description]]:grid-rows-[auto_auto]",
        "[&.border-b]:pb-[var(--card-spacing)]",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base font-medium leading-normal text-tremor-content-strong group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[var(--card-spacing)]", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-[var(--card-spacing)] [&.border-t]:pt-[var(--card-spacing)]",
        className
      )}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
