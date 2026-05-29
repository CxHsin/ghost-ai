"use client";

import { LiveMap, LiveObject, type JsonObject, type LsonObject } from "@liveblocks/core";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useRedo,
  useUndo,
} from "@liveblocks/react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Minus,
  Pill,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  addEdge,
  type Connection,
  ConnectionLineType,
  ConnectionMode,
  type EdgeChange,
  type EdgeTypes,
  MiniMap,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasPresenceOverlay } from "@/components/editor/canvas-presence-overlay";
import { CanvasShape } from "@/components/editor/canvas-shape";
import { type CanvasTemplate } from "@/components/editor/starter-templates";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  createCanvasSnapshot,
  createStableCanvasSnapshotSignature,
} from "@/lib/canvas-snapshot";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  createCanvasNodeId,
  type CanvasSaveIndicatorState,
  getDefaultCanvasNodeColor,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type CanvasSnapshot,
  type CanvasShapeDragPayload,
} from "@/types/canvas";

const SHAPE_DRAG_MIME_TYPE = "application/ghost-ai-canvas-shape";
const LIVEBLOCKS_FLOW_STORAGE_KEY = "flow";
const VIEWPORT_ANIMATION_DURATION_MS = 180;
const LIVEBLOCKS_NODE_SYNC_CONFIG = {
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic",
  data: {
    color: "atomic",
  },
} as const;
const LIVEBLOCKS_EDGE_SYNC_CONFIG = {
  selected: false,
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic",
} as const;
const DRAG_PREVIEW_COLOR = {
  fill: "rgba(17, 17, 20, 0.88)",
  text: "var(--text-secondary)",
} as const;

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

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

interface DragPreviewState extends CanvasShapeDragPayload {
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
}

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

interface ShapePanelProps {
  onInsertShape: (shape: CanvasNodeShape) => void;
  onShapeDragEnd: () => void;
  onShapeDragStart: (
    event: React.DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape,
  ) => void;
}

function ShapePanel({
  onInsertShape,
  onShapeDragEnd,
  onShapeDragStart,
}: ShapePanelProps) {
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
              onDragEnd={onShapeDragEnd}
              onDragStart={(event) => onShapeDragStart(event, shape)}
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

function BaseCanvasFlow({
  isAiSidebarOpen,
  onCanvasSnapshotChange,
  onSaveActionChange,
  openTemplatesRequest,
  onSaveStatusChange,
  projectId,
}: {
  isAiSidebarOpen?: boolean;
  onCanvasSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveActionChange?: (action: () => void) => void;
  openTemplatesRequest?: number;
  onSaveStatusChange?: (status: CanvasSaveIndicatorState) => void;
  projectId: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const history = useHistory();
  const undo = useUndo();
  const redo = useRedo();
  const updateMyPresence = useUpdateMyPresence();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [hasResolvedInitialCanvasLoad, setHasResolvedInitialCanvasLoad] = useState(false);
  const previousOpenTemplatesRequestRef = useRef(openTemplatesRequest);
  const previousSnapshotSignatureRef = useRef<string | null>(null);
  const isDraggingShape = dragPreview !== null;
  const {
    edges,
    nodes,
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
  const roomHasCanvasContent = nodes.length > 0 || edges.length > 0;
  const [treatInitialSnapshotAsSaved, setTreatInitialSnapshotAsSaved] = useState(
    roomHasCanvasContent,
  );
  const { saveStatus, triggerSave } = useCanvasAutosave({
    enabled: hasResolvedInitialCanvasLoad || roomHasCanvasContent,
    edges,
    nodes,
    projectId,
    treatInitialSnapshotAsSaved,
  });
  const canvasSnapshot = useMemo(
    () => createCanvasSnapshot(nodes, edges),
    [edges, nodes],
  );

  useEffect(() => {
    onSaveActionChange?.(triggerSave);
  }, [onSaveActionChange, triggerSave]);

  useEffect(() => {
    if (!onCanvasSnapshotChange) {
      return;
    }

    const snapshotSignature = createStableCanvasSnapshotSignature(canvasSnapshot);

    if (snapshotSignature === previousSnapshotSignatureRef.current) {
      return;
    }

    previousSnapshotSignatureRef.current = snapshotSignature;
    onCanvasSnapshotChange(canvasSnapshot);
  }, [canvasSnapshot, onCanvasSnapshotChange]);

  const replaceCanvasSnapshot = useMutation(
    ({ storage }, snapshot: CanvasSnapshot) => {
      const flow = storage.get(
        LIVEBLOCKS_FLOW_STORAGE_KEY,
      ) as LiveObject<LsonObject> | undefined;

      if (!flow) {
        return;
      }

      history.pause();
      try {
        flow.set(
          "nodes",
          new LiveMap(
            snapshot.nodes.map((node) => [
              node.id,
              LiveObject.from(
                node as unknown as JsonObject,
                LIVEBLOCKS_NODE_SYNC_CONFIG,
              ),
            ]),
          ),
        );
        flow.set(
          "edges",
          new LiveMap(
            snapshot.edges.map((edge) => [
              edge.id,
              LiveObject.from(
                edge as unknown as JsonObject,
                LIVEBLOCKS_EDGE_SYNC_CONFIG,
              ),
            ]),
          ),
        );
      } finally {
        history.resume();
      }
    },
    [history],
  );

  const importTemplate = useMutation(
    (_context, template: CanvasTemplate) => {
      replaceCanvasSnapshot(createCanvasSnapshot(template.nodes, template.edges));
    },
    [replaceCanvasSnapshot],
  );

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

  const handleZoomIn = useCallback(() => {
    void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION_MS });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION_MS });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    void reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION_MS });
  }, [reactFlow]);

  const handleUndo = useCallback(() => {
    if (!canUndo) {
      return;
    }

    undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) {
      return;
    }

    redo();
  }, [canRedo, redo]);

  useKeyboardShortcuts({
    onRedo: handleRedo,
    onUndo: handleUndo,
    reactFlow,
  });

  useEffect(() => {
    if (!isDraggingShape) {
      return;
    }

    function handleWindowDragOver(event: DragEvent) {
      setDragPreview((currentPreview) => {
        if (!currentPreview) {
          return null;
        }

        return {
          ...currentPreview,
          x: event.clientX,
          y: event.clientY,
        };
      });
    }

    function clearDragPreview() {
      setDragPreview(null);
    }

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", clearDragPreview);
    window.addEventListener("dragend", clearDragPreview);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", clearDragPreview);
      window.removeEventListener("dragend", clearDragPreview);
    };
  }, [isDraggingShape]);

  useEffect(() => {
    if (!openTemplatesRequest) {
      return;
    }

    if (openTemplatesRequest === previousOpenTemplatesRequestRef.current) {
      return;
    }

    previousOpenTemplatesRequestRef.current = openTemplatesRequest;

    const openModalTimeout = window.setTimeout(() => {
      setIsTemplatesModalOpen(true);
    }, 0);

    return () => {
      window.clearTimeout(openModalTimeout);
    };
  }, [openTemplatesRequest]);

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null });
    };
  }, [updateMyPresence]);

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.key !== "Delete" && event.key !== "Backspace") ||
        isEditableEventTarget(event.target)
      ) {
        return;
      }

      const selectedNodes = reactFlow
        .getNodes()
        .filter((node) => node.selected) as CanvasNode[];
      const selectedEdges = reactFlow
        .getEdges()
        .filter((edge) => edge.selected) as CanvasEdge[];

      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        return;
      }

      event.preventDefault();

      onDelete({
        nodes: selectedNodes,
        edges: selectedEdges,
      });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDelete, reactFlow]);

  useEffect(() => {
    if (hasResolvedInitialCanvasLoad) {
      return;
    }

    if (roomHasCanvasContent) {
      const resolveInitialLoadTimeout = window.setTimeout(() => {
        setHasResolvedInitialCanvasLoad(true);
      }, 0);

      return () => {
        window.clearTimeout(resolveInitialLoadTimeout);
      };
    }

    let isCancelled = false;

    async function loadSavedCanvas() {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load the saved canvas state.");
        }

        const payload = (await response.json()) as {
          data: {
            canvas: CanvasSnapshot | null;
          };
        };

        if (isCancelled || !payload.data.canvas) {
          return;
        }

        setTreatInitialSnapshotAsSaved(true);
        replaceCanvasSnapshot(payload.data.canvas);

        window.requestAnimationFrame(() => {
          void reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION_MS });
        });
      } catch (error) {
        if (!isCancelled) {
          console.error("Saved canvas bootstrap failed.", error);
        }
      } finally {
        if (!isCancelled) {
          setHasResolvedInitialCanvasLoad(true);
        }
      }
    }

    void loadSavedCanvas();

    return () => {
      isCancelled = true;
    };
  }, [
    hasResolvedInitialCanvasLoad,
    projectId,
    reactFlow,
    roomHasCanvasContent,
    replaceCanvasSnapshot,
  ]);

  const handleShapeDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, shape: CanvasNodeShape) => {
      const size = SHAPE_DEFAULT_SIZES[shape];
      const payload: CanvasShapeDragPayload = {
        shape,
        width: size.width,
        height: size.height,
      };

      const dragImage = document.createElement("canvas");
      dragImage.width = 1;
      dragImage.height = 1;

      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(
        SHAPE_DRAG_MIME_TYPE,
        JSON.stringify(payload),
      );
      event.dataTransfer.setDragImage(dragImage, 0, 0);

      setDragPreview({
        anchorX: size.width / 2,
        anchorY: size.height / 2,
        ...payload,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const handleShapeDragEnd = useCallback(() => {
    setDragPreview(null);
  }, []);

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

  const handleConnect = useCallback(
    (connection: Connection) => {
      const [newEdge] = addEdge(
        {
          ...connection,
          id: `edge-${crypto.randomUUID()}`,
          type: CANVAS_EDGE_TYPE,
        },
        [],
      );

      if (!newEdge) {
        return;
      }

      const canvasEdge: CanvasEdge = {
        ...newEdge,
        data: {
          label: "",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "rgba(240, 240, 244, 0.92)",
          width: 16,
          height: 16,
        },
        type: CANVAS_EDGE_TYPE,
      };

      onEdgesChange([
        {
          type: "add",
          item: canvasEdge,
        } satisfies EdgeChange<CanvasEdge>,
      ]);
    },
    [onEdgesChange],
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
        x:
          event.clientX - (dragPreview?.anchorX ?? payload.width / 2) + payload.width / 2,
        y:
          event.clientY -
          (dragPreview?.anchorY ?? payload.height / 2) +
          payload.height / 2,
      });

      addShapeNode(payload.shape, position);
      setDragPreview(null);
    },
    [addShapeNode, dragPreview, reactFlow],
  );

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      importTemplate(template);
      setIsTemplatesModalOpen(false);
      window.requestAnimationFrame(() => {
        void reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION_MS });
      });
    },
    [importTemplate, reactFlow],
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const bounds = canvasRef.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      updateMyPresence({
        cursor: {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
      });
    },
    [updateMyPresence],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
        onConnect={handleConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.Bezier}
        connectionRadius={24}
        defaultEdgeOptions={{
          animated: false,
          interactionWidth: 24,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "rgba(240, 240, 244, 0.92)",
            width: 16,
            height: 16,
          },
          style: {
            stroke: "rgba(240, 240, 244, 0.56)",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.5,
          },
          type: CANVAS_EDGE_TYPE,
        }}
        deleteKeyCode={null}
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
          nodeColor="#79BBFF"
          nodeStrokeColor="#505060"
        />
        <Background
          color="rgba(80, 80, 96, 0.45)"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <CanvasPresenceOverlay showPresenceBadge={!isAiSidebarOpen} />
      {dragPreview ? (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            height: dragPreview.height,
            left: dragPreview.x - dragPreview.anchorX,
            top: dragPreview.y - dragPreview.anchorY,
            width: dragPreview.width,
          }}
        >
          <CanvasShape
            color={DRAG_PREVIEW_COLOR}
            preview
            shape={dragPreview.shape}
          />
        </div>
      ) : null}
      <CanvasControls
        canRedo={canRedo}
        canUndo={canUndo}
        onFitView={handleFitView}
        onRedo={handleRedo}
        onUndo={handleUndo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      <ShapePanel
        onInsertShape={handleInsertShape}
        onShapeDragEnd={handleShapeDragEnd}
        onShapeDragStart={handleShapeDragStart}
      />
      <StarterTemplatesModal
        open={isTemplatesModalOpen}
        onOpenChange={setIsTemplatesModalOpen}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

export function BaseCanvas({
  isAiSidebarOpen,
  onCanvasSnapshotChange,
  onSaveActionChange,
  openTemplatesRequest,
  onSaveStatusChange,
  projectId,
}: {
  isAiSidebarOpen?: boolean;
  onCanvasSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveActionChange?: (action: () => void) => void;
  openTemplatesRequest?: number;
  onSaveStatusChange?: (status: CanvasSaveIndicatorState) => void;
  projectId: string;
}) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full overflow-hidden rounded-[inherit]">
        <BaseCanvasFlow
          isAiSidebarOpen={isAiSidebarOpen}
          onCanvasSnapshotChange={onCanvasSnapshotChange}
          onSaveActionChange={onSaveActionChange}
          openTemplatesRequest={openTemplatesRequest}
          onSaveStatusChange={onSaveStatusChange}
          projectId={projectId}
        />
      </div>
    </ReactFlowProvider>
  );
}
