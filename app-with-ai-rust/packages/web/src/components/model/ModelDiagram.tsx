/**
 * One model view, laid out by ELK and drawn by React Flow.
 *
 * Selection is by document path in both directions: a click reports the path
 * of what was clicked, and a `selectedPath` from outside — the cursor in the
 * YAML — highlights whatever element that path belongs to and brings it into
 * view.
 */

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { elementAt, type ModelView } from "@/lib/model-view/graph";
import { type Layout, layoutView } from "@/lib/model-view/layout";
import type { DocumentPath } from "@appwithai/generator/model-yaml";
import {
  type ModelFlowEdge,
  type ModelFlowNode,
  modelEdgeTypes,
  modelNodeTypes,
} from "./ModelNodes";

export interface ModelDiagramProps {
  view: ModelView;
  selectedPath?: DocumentPath;
  /** Whether the selection came from outside and should be brought into view. */
  revealSelection?: boolean;
  onSelectPath?: (path: DocumentPath) => void;
}

export function ModelDiagram(props: ModelDiagramProps) {
  return (
    <ReactFlowProvider>
      <Diagram {...props} />
    </ReactFlowProvider>
  );
}

function Diagram({ view, selectedPath, revealSelection, onSelectPath }: ModelDiagramProps) {
  const [layout, setLayout] = useState<{ key: string; layout: Layout } | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const flow = useReactFlow();

  useEffect(() => {
    let current = true;
    layoutView(view).then(
      (result) => {
        if (!current) return;
        setLayout({ key: view.key, layout: result });
        setLayoutError(null);
      },
      (error: unknown) => {
        if (current) setLayoutError(error instanceof Error ? error.message : String(error));
      }
    );
    return () => {
      current = false;
    };
  }, [view]);

  const selected = useMemo(
    () => (selectedPath && selectedPath.length ? elementAt(view, selectedPath) : {}),
    [view, selectedPath]
  );

  const nodes = useMemo<ModelFlowNode[]>(
    () =>
      (layout?.layout.nodes ?? []).map((placed) => ({
        id: placed.node.id,
        type: "model",
        position: { x: placed.x, y: placed.y },
        width: placed.width,
        height: placed.height,
        draggable: false,
        connectable: false,
        data: {
          element: placed.node,
          direction: view.direction,
          width: placed.width,
          height: placed.height,
          selected: selected.node?.id === placed.node.id,
        },
      })),
    [layout, view.direction, selected.node]
  );

  const edges = useMemo<ModelFlowEdge[]>(
    () =>
      view.edges.map((edge) => ({
        id: edge.id,
        type: "model",
        source: edge.source,
        target: edge.target,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: { element: edge, selected: selected.edge?.id === edge.id },
      })),
    [view.edges, selected.edge]
  );

  const laidOut = layout?.key === view.key;
  const focusId = selected.node?.id ?? selected.edge?.target;

  useEffect(() => {
    if (!laidOut || !revealSelection || !focusId) return;
    void flow.fitView({ nodes: [{ id: focusId }], duration: 250, maxZoom: 1.1, padding: 0.4 });
  }, [flow, laidOut, revealSelection, focusId]);

  if (layoutError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-destructive">
        The diagram could not be laid out: {layoutError}
      </div>
    );
  }
  if (!laidOut) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Laying out {view.title}
      </div>
    );
  }
  if (!nodes.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {view.kind === "entities" ? "The model declares no entities yet." : "Nothing to draw."}
      </div>
    );
  }

  return (
    <ReactFlow
      key={view.key}
      nodes={nodes}
      edges={edges}
      nodeTypes={modelNodeTypes}
      edgeTypes={modelEdgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      onNodeClick={(_, node) => onSelectPath?.(node.data.element.path)}
      onEdgeClick={(_, edge) => edge.data && onSelectPath?.(edge.data.element.path)}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} />
      <Controls showInteractive={false} />
      {view.kind === "entities" && <MiniMap pannable zoomable />}
    </ReactFlow>
  );
}
