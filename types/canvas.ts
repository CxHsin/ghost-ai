import { type Edge, type Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";
export const DEFAULT_CANVAS_NODE_COLOR_INDEX = 0;
export const CANVAS_CONNECTION_DOT_SIZE_PX = 6;
export const CANVAS_CONNECTION_GAP_PX = 1;
export const CANVAS_NODE_OUTER_BOUNDS_PADDING_PX = 12;
export const EMPTY_CANVAS_EDGE_LABEL_HINT = "Add label";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export const NODE_COLORS = [
  { fill: "#252528", text: "#F2F2F2" },
  { fill: "#153D68", text: "#79BBFF" },
  { fill: "#3B2154", text: "#C98FFF" },
  { fill: "#4A2904", text: "#FFB54D" },
  { fill: "#4A1D24", text: "#FF7B86" },
  { fill: "#4C2238", text: "#FF78B3" },
  { fill: "#123F23", text: "#7EE787" },
  { fill: "#0B3B34", text: "#2CE6C7" },
] as const;

export const SHAPE_DEFAULT_SIZES = {
  rectangle: { width: 220, height: 108 },
  diamond: { width: 180, height: 180 },
  circle: { width: 140, height: 140 },
  pill: { width: 220, height: 96 },
  cylinder: { width: 220, height: 132 },
  hexagon: { width: 220, height: 190 },
} as const;

export const SHAPE_MIN_SIZES = {
  rectangle: { width: 140, height: 72 },
  diamond: { width: 120, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 140, height: 68 },
  cylinder: { width: 140, height: 88 },
  hexagon: { width: 140, height: 122 },
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

export interface CanvasEdgeData extends Record<string, unknown> {
  label: string;
}

export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;

export function getDefaultCanvasNodeColor(): CanvasNodeColor {
  return NODE_COLORS[DEFAULT_CANVAS_NODE_COLOR_INDEX];
}

export function createCanvasNodeId(shape: CanvasNodeShape): string {
  return `${shape}-${crypto.randomUUID()}`;
}
