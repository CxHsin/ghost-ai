import { type Edge, type Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";
export const DEFAULT_CANVAS_NODE_COLOR_INDEX = 0;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const SHAPE_DEFAULT_SIZES = {
  rectangle: { width: 220, height: 108 },
  diamond: { width: 180, height: 180 },
  circle: { width: 140, height: 140 },
  pill: { width: 220, height: 96 },
  cylinder: { width: 220, height: 132 },
  hexagon: { width: 220, height: 128 },
} as const;

export type CanvasNodeShape = (typeof NODE_SHAPES)[number];
export type CanvasNodeColor = (typeof NODE_COLORS)[number];
export type CanvasShapeSize = (typeof SHAPE_DEFAULT_SIZES)[CanvasNodeShape];

export interface CanvasShapeDragPayload {
  height: number;
  shape: CanvasNodeShape;
  width: number;
}

export interface CanvasNodeData extends Record<string, unknown> {
  color: CanvasNodeColor;
  label: string;
  shape: CanvasNodeShape;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<Record<string, never>, typeof CANVAS_EDGE_TYPE>;

let canvasNodeCounter = 0;

export function getDefaultCanvasNodeColor(): CanvasNodeColor {
  return NODE_COLORS[DEFAULT_CANVAS_NODE_COLOR_INDEX];
}

export function createCanvasNodeId(shape: CanvasNodeShape): string {
  canvasNodeCounter += 1;

  return `${shape}-${Date.now()}-${canvasNodeCounter}`;
}
