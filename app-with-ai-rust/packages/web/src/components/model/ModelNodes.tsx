/**
 * How each kind of model element is drawn.
 *
 * Every node draws to the box `layout.ts` gave it — the layout is computed
 * before anything renders, so a node that sized itself would overlap its
 * neighbours. Handles sit on the sides the view's direction flows through.
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  type Node,
  type NodeProps,
  Position,
  type Edge,
} from "@xyflow/react";
import { memo } from "react";
import { END_LABEL, type ViewEdge, type ViewNode } from "@/lib/model-view/graph";
import {
  ENTITY_FIELD_LIMIT,
  ENTITY_HEADER,
  FIELD_HEIGHT,
} from "@/lib/model-view/layout";
import { cn } from "@/lib/utils";
import type { FlowDirection } from "@appwithai/generator/model-yaml";

export interface ModelNodeData extends Record<string, unknown> {
  element: ViewNode;
  direction: FlowDirection;
  width: number;
  height: number;
  selected: boolean;
}

export interface ModelEdgeData extends Record<string, unknown> {
  element: ViewEdge;
  selected: boolean;
}

export type ModelFlowNode = Node<ModelNodeData, "model">;
export type ModelFlowEdge = Edge<ModelEdgeData, "model">;

const SIDES: Record<FlowDirection, { in: Position; out: Position }> = {
  down: { in: Position.Top, out: Position.Bottom },
  up: { in: Position.Bottom, out: Position.Top },
  right: { in: Position.Left, out: Position.Right },
  left: { in: Position.Right, out: Position.Left },
};

function Handles({ direction }: { direction: FlowDirection }) {
  const sides = SIDES[direction];
  return (
    <>
      <Handle type="target" position={sides.in} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
      <Handle type="source" position={sides.out} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
    </>
  );
}

const RING = "ring-2 ring-primary ring-offset-2 ring-offset-background";

function EntityCard({ data }: { data: ModelNodeData }) {
  const { element, width, height, selected } = data;
  const shown = element.fields.slice(0, ENTITY_FIELD_LIMIT);
  const hidden = element.fields.length - shown.length;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        selected && RING
      )}
      style={{ width, height }}
      title={element.detail}
    >
      <div
        className="flex items-center border-b border-border bg-muted/60 px-3 font-semibold text-sm"
        style={{ height: ENTITY_HEADER }}
      >
        <span className="truncate">{element.label}</span>
      </div>
      {element.tags.length > 0 && (
        <div className="flex h-[22px] items-center gap-1 overflow-hidden px-3">
          {element.tags.map((tag) => (
            <span
              key={tag}
              className="truncate rounded bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="px-3 pb-2 font-mono text-[11px]">
        {shown.map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-2"
            style={{ height: FIELD_HEIGHT }}
          >
            <span className="w-16 shrink-0 truncate text-muted-foreground">{field.type}</span>
            <span className="min-w-0 flex-1 truncate">{field.name}</span>
            {field.badges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "shrink-0 rounded px-1 text-[9px] font-semibold uppercase",
                  badge === "PK"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : badge === "FK"
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        ))}
        {hidden > 0 && (
          <div className="text-muted-foreground" style={{ height: FIELD_HEIGHT }}>
            + {hidden} more {hidden === 1 ? "column" : "columns"}
          </div>
        )}
      </div>
    </div>
  );
}

const SHAPE: Partial<Record<ViewNode["kind"], string>> = {
  state: "rounded-xl border-border bg-card",
  final: "rounded-xl border-2 border-double border-foreground/60 bg-card",
  "saga-start": "rounded-full border-emerald-500/60 bg-emerald-500/10",
  "saga-end": "rounded-full border-border bg-muted",
  start: "rounded-full border-emerald-500/60 bg-emerald-500/10",
  end: "rounded-full border-rose-500/60 bg-rose-500/10",
  "saga-step": "rounded-md border-border bg-card",
  expression: "rounded-md border-violet-500/50 bg-violet-500/10",
  function: "rounded-md border-dashed border-violet-500/60 bg-card",
  hook: "rounded-md border-sky-500/50 bg-sky-500/10",
  "flow-step": "rounded-md border-dashed border-border bg-muted/40",
};

function ModelNodeView({ data }: NodeProps<ModelFlowNode>) {
  const { element, direction, width, height, selected } = data;

  if (element.kind === "entity") {
    return (
      <>
        <Handles direction={direction} />
        <EntityCard data={data} />
      </>
    );
  }

  if (element.kind === "initial") {
    return (
      <>
        <Handles direction={direction} />
        <div
          className={cn("rounded-full bg-foreground", selected && RING)}
          style={{ width, height }}
          title="initial state"
        />
      </>
    );
  }

  if (element.kind === "decision") {
    return (
      <>
        <Handles direction={direction} />
        <div className="relative flex items-center justify-center" style={{ width, height }}>
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
          >
            <polygon
              points={`${width / 2},1 ${width - 1},${height / 2} ${width / 2},${height - 1} 1,${height / 2}`}
              className={cn(
                "fill-amber-500/10 stroke-amber-500/70",
                selected && "stroke-primary"
              )}
              strokeWidth={selected ? 3 : 1.5}
            />
          </svg>
          <span className="relative max-w-[70%] text-center text-xs leading-tight">
            {element.label}
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <Handles direction={direction} />
      <div
        className={cn(
          "flex flex-col items-center justify-center border px-3 text-center",
          SHAPE[element.kind] ?? "rounded-md border-border bg-card",
          selected && RING
        )}
        style={{ width, height }}
      >
        <span className="line-clamp-2 text-xs font-medium leading-tight">{element.label}</span>
        {element.detail && (
          <span className="truncate text-[10px] text-muted-foreground">{element.detail}</span>
        )}
        {element.tags.includes("initial") && (
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">initial</span>
        )}
      </div>
    </>
  );
}

function ModelEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<ModelFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });
  const element = data?.element;
  const selected = data?.selected ?? false;
  const endLabel = (end: ViewEdge["sourceEnd"], x: number, y: number, position: Position) => {
    if (!end) return null;
    const dx = position === Position.Left ? -18 : position === Position.Right ? 18 : 14;
    const dy = position === Position.Top ? -12 : position === Position.Bottom ? 12 : -10;
    return (
      <div
        className="nodrag nopan pointer-events-none absolute rounded bg-background px-1 font-mono text-[10px] text-muted-foreground"
        style={{ transform: `translate(-50%, -50%) translate(${x + dx}px, ${y + dy}px)` }}
      >
        {END_LABEL[end]}
      </div>
    );
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={element?.sourceEnd ? undefined : markerEnd}
        className={cn(selected ? "!stroke-primary" : "!stroke-muted-foreground/50")}
        style={{
          strokeWidth: selected ? 2.5 : 1.25,
          strokeDasharray: element?.ownership ? undefined : element?.sourceEnd ? "5 3" : undefined,
        }}
        interactionWidth={16}
      />
      <EdgeLabelRenderer>
        {element?.label && (
          <div
            className={cn(
              "nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded border bg-background px-1.5 py-0.5 text-[10px]",
              selected ? "border-primary text-foreground" : "border-border text-muted-foreground"
            )}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {element.label}
          </div>
        )}
        {endLabel(element?.sourceEnd, sourceX, sourceY, sourcePosition)}
        {endLabel(element?.targetEnd, targetX, targetY, targetPosition)}
      </EdgeLabelRenderer>
    </>
  );
}

export const modelNodeTypes = { model: memo(ModelNodeView) };
export const modelEdgeTypes = { model: memo(ModelEdgeView) };
