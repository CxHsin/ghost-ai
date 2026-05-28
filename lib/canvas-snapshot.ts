import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeData,
  type CanvasNodeShape,
  type CanvasSnapshot,
  type CanvasSnapshotEdge,
  type CanvasSnapshotEdgeMarker,
  type CanvasSnapshotEdgeStyle,
  type CanvasSnapshotNode,
} from "@/types/canvas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isCanvasNodeShape(value: unknown): value is CanvasNodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as CanvasNodeShape);
}

function isCanvasNodeColor(value: unknown): value is CanvasNodeColor {
  if (!isRecord(value)) {
    return false;
  }

  return NODE_COLORS.some(
    (color) => color.fill === value.fill && color.text === value.text,
  );
}

function isCanvasNodeData(value: unknown): value is CanvasNodeData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    isCanvasNodeShape(value.shape) &&
    isCanvasNodeColor(value.color)
  );
}

function isCanvasSnapshotNode(value: unknown): value is CanvasSnapshotNode {
  if (!isRecord(value) || value.type !== CANVAS_NODE_TYPE) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    !isRecord(value.position) ||
    !isFiniteNumber(value.position.x) ||
    !isFiniteNumber(value.position.y) ||
    !isNullableFiniteNumber(value.width) ||
    !isNullableFiniteNumber(value.height)
  ) {
    return false;
  }

  return isCanvasNodeData(value.data);
}

function isCanvasSnapshotEdgeMarker(
  value: unknown,
): value is CanvasSnapshotEdgeMarker {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.type === "string" &&
    isNullableString(value.color) &&
    isNullableFiniteNumber(value.width) &&
    isNullableFiniteNumber(value.height)
  );
}

function isCanvasSnapshotEdgeStyle(value: unknown): value is CanvasSnapshotEdgeStyle {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.stroke) &&
    isNullableString(value.strokeLinecap) &&
    isNullableString(value.strokeLinejoin) &&
    isNullableFiniteNumber(value.strokeWidth)
  );
}

function isCanvasSnapshotEdge(value: unknown): value is CanvasSnapshotEdge {
  if (!isRecord(value) || value.type !== CANVAS_EDGE_TYPE) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.source !== "string" ||
    typeof value.target !== "string" ||
    !isNullableString(value.sourceHandle) ||
    !isNullableString(value.targetHandle) ||
    (value.markerEnd !== null && !isCanvasSnapshotEdgeMarker(value.markerEnd)) ||
    (value.style !== null && !isCanvasSnapshotEdgeStyle(value.style))
  ) {
    return false;
  }

  return isRecord(value.data) && typeof value.data.label === "string";
}

export function serializeCanvasNode(node: CanvasNode): CanvasSnapshotNode {
  return {
    id: node.id,
    type: CANVAS_NODE_TYPE,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    width: node.width ?? null,
    height: node.height ?? null,
    data: {
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
    },
  };
}

export function serializeCanvasEdge(edge: CanvasEdge): CanvasSnapshotEdge {
  return {
    id: edge.id,
    type: CANVAS_EDGE_TYPE,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    data: {
      label: edge.data?.label ?? "",
    },
    markerEnd:
      edge.markerEnd && typeof edge.markerEnd === "object"
        ? {
            type:
              typeof edge.markerEnd.type === "string"
                ? edge.markerEnd.type
                : String(edge.markerEnd.type),
            color: edge.markerEnd.color ?? null,
            width: edge.markerEnd.width ?? null,
            height: edge.markerEnd.height ?? null,
          }
        : null,
    style: edge.style
      ? {
          stroke:
            typeof edge.style.stroke === "string" ? edge.style.stroke : null,
          strokeLinecap:
            typeof edge.style.strokeLinecap === "string"
              ? edge.style.strokeLinecap
              : null,
          strokeLinejoin:
            typeof edge.style.strokeLinejoin === "string"
              ? edge.style.strokeLinejoin
              : null,
          strokeWidth:
            typeof edge.style.strokeWidth === "number"
              ? edge.style.strokeWidth
              : null,
        }
      : null,
  };
}

export function createCanvasSnapshot(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): CanvasSnapshot {
  return {
    nodes: nodes.map(serializeCanvasNode),
    edges: edges.map(serializeCanvasEdge),
  };
}

export function parseCanvasSnapshot(payload: unknown): CanvasSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    return null;
  }

  if (
    !payload.nodes.every((node) => isCanvasSnapshotNode(node)) ||
    !payload.edges.every((edge) => isCanvasSnapshotEdge(edge))
  ) {
    return null;
  }

  return {
    nodes: payload.nodes,
    edges: payload.edges,
  };
}
