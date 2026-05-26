"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Minus,
  Pill,
} from "lucide-react";
import { useCallback, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import {
  CANVAS_NODE_TYPE,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  createCanvasNodeId,
  getDefaultCanvasNodeColor,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type CanvasShapeDragPayload,
} from "@/types/canvas";

const SHAPE_DRAG_MIME_TYPE = "application/ghost-ai-canvas-shape";

const shapeIcons: Record<CanvasNodeShape, typeof Minus> = {
  rectangle: Minus,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

interface ShapePanelProps {
  onInsertShape: (shape: CanvasNodeShape) => void;
}

function ShapePanel({ onInsertShape }: ShapePanelProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, shape: CanvasNodeShape) => {
      const size = SHAPE_DEFAULT_SIZES[shape];
      const payload: CanvasShapeDragPayload = {
        shape,
        width: size.width,
        height: size.height,
      };

      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(
        SHAPE_DRAG_MIME_TYPE,
        JSON.stringify(payload),
      );
    },
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/92 px-3 py-2 shadow-2xl shadow-black/35 backdrop-blur-sm">
        {NODE_SHAPES.map((shape) => {
          const Icon = shapeIcons[shape];

          return (
            <button
              key={shape}
              type="button"
              draggable
              aria-label={`Add ${shape} shape`}
              onClick={() => onInsertShape(shape)}
              onDragStart={(event) => handleDragStart(event, shape)}
              className="flex size-11 items-center justify-center rounded-full border border-transparent bg-subtle/70 text-copy-secondary transition hover:border-surface-border-subtle hover:bg-subtle hover:text-copy-primary active:scale-95"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BaseCanvasFlow() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const {
    edges,
    nodes,
    onConnect,
    onDelete,
    onEdgesChange,
    onNodesChange,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  });

  const addShapeNode = useCallback(
    (shape: CanvasNodeShape, position: { x: number; y: number }) => {
      const size = SHAPE_DEFAULT_SIZES[shape];
      const newNode: CanvasNode = {
        id: createCanvasNodeId(shape),
        type: CANVAS_NODE_TYPE,
        position: {
          x: position.x - size.width / 2,
          y: position.y - size.height / 2,
        },
        width: size.width,
        height: size.height,
        data: {
          label: "",
          color: getDefaultCanvasNodeColor(),
          shape,
        },
      };

      onNodesChange([
        {
          type: "add",
          item: newNode,
        } satisfies NodeChange<CanvasNode>,
      ]);
    },
    [onNodesChange],
  );

  const handleInsertShape = useCallback(
    (shape: CanvasNodeShape) => {
      const canvasElement = canvasRef.current;

      if (!canvasElement) {
        return;
      }

      const bounds = canvasElement.getBoundingClientRect();
      const position = reactFlow.screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      });

      addShapeNode(shape, position);
    },
    [addShapeNode, reactFlow],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME_TYPE)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const rawPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE);

      if (!rawPayload) {
        return;
      }

      event.preventDefault();

      let payload: CanvasShapeDragPayload | null = null;

      try {
        payload = JSON.parse(rawPayload) as CanvasShapeDragPayload;
      } catch {
        return;
      }

      if (!payload || !NODE_SHAPES.includes(payload.shape)) {
        return;
      }

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addShapeNode(payload.shape, position);
    },
    [addShapeNode, reactFlow],
  );

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.4}
        className="bg-base"
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          pannable
          zoomable
          className="!rounded-2xl !border !border-surface-border !bg-surface/95"
          maskColor="rgba(8, 8, 9, 0.72)"
          nodeBorderRadius={16}
          nodeColor="#1f1f1f"
          nodeStrokeColor="#505060"
        />
        <Background
          color="rgba(80, 80, 96, 0.45)"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <ShapePanel onInsertShape={handleInsertShape} />
    </div>
  );
}

export function BaseCanvas() {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full overflow-hidden rounded-[inherit]">
        <BaseCanvasFlow />
      </div>
    </ReactFlowProvider>
  );
}
