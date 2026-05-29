import { z } from "zod";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_SHAPES,
} from "@/types/canvas";

export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";
export const GHOST_AI_USER_ID = "ghost-ai";
export const GHOST_AI_USER_NAME = "Ghost AI";
export const GHOST_AI_USER_COLOR = "#8B82FF";

export const aiStatusPhaseSchema = z.enum([
  "started",
  "processing",
  "completed",
  "failed",
]);

export const aiStatusMessageSchema = z.object({
  kind: z.literal("status"),
  phase: aiStatusPhaseSchema,
  runId: z.string().trim().min(1).optional(),
  text: z.string().trim().min(1).optional(),
  timestamp: z.number().int().nonnegative(),
});

export type AiStatusPhase = z.infer<typeof aiStatusPhaseSchema>;
export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>;

export function parseAiStatusMessage(value: unknown) {
  const result = aiStatusMessageSchema.safeParse(value);

  return result.success ? result.data : null;
}

export const aiChatMessageSchema = z.object({
  content: z.string().trim().min(1),
  kind: z.literal("chat"),
  role: z.enum(["assistant", "system", "user"]),
  runId: z.string().trim().min(1).optional(),
  sender: z.string().trim().min(1),
  timestamp: z.number().int().nonnegative(),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export function parseAiChatMessage(value: unknown) {
  const result = aiChatMessageSchema.safeParse(value);

  return result.success ? result.data : null;
}

const nodePositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const nodeSizeSchema = z.object({
  height: z.number().positive().finite(),
  width: z.number().positive().finite(),
});

const nodeShapeSchema = z.enum(NODE_SHAPES);

const colorIndexSchema = z.number().int().min(0).max(7);

export const addNodeActionSchema = z.object({
  colorIndex: colorIndexSchema.optional(),
  label: z.string().trim().optional(),
  nodeId: z.string().trim().min(1).optional(),
  position: nodePositionSchema,
  shape: nodeShapeSchema,
  size: nodeSizeSchema.optional(),
  type: z.literal("add_node"),
});

export const moveNodeActionSchema = z.object({
  nodeId: z.string().trim().min(1),
  position: nodePositionSchema,
  type: z.literal("move_node"),
});

export const resizeNodeActionSchema = z.object({
  nodeId: z.string().trim().min(1),
  size: nodeSizeSchema,
  type: z.literal("resize_node"),
});

export const updateNodeDataActionSchema = z.object({
  colorIndex: colorIndexSchema.optional(),
  label: z.string().trim().optional(),
  nodeId: z.string().trim().min(1),
  shape: nodeShapeSchema.optional(),
  type: z.literal("update_node_data"),
});

export const deleteNodeActionSchema = z.object({
  nodeId: z.string().trim().min(1),
  type: z.literal("delete_node"),
});

export const addEdgeActionSchema = z.object({
  edgeId: z.string().trim().min(1).optional(),
  label: z.string().trim().optional(),
  sourceHandle: z.string().trim().min(1).nullable().optional(),
  sourceNodeId: z.string().trim().min(1),
  targetHandle: z.string().trim().min(1).nullable().optional(),
  targetNodeId: z.string().trim().min(1),
  type: z.literal("add_edge"),
});

export const deleteEdgeActionSchema = z.object({
  edgeId: z.string().trim().min(1),
  type: z.literal("delete_edge"),
});

export const designAgentActionSchema = z.discriminatedUnion("type", [
  addNodeActionSchema,
  moveNodeActionSchema,
  resizeNodeActionSchema,
  updateNodeDataActionSchema,
  deleteNodeActionSchema,
  addEdgeActionSchema,
  deleteEdgeActionSchema,
]);

export type DesignAgentAction = z.infer<typeof designAgentActionSchema>;

export const designAgentPlanSchema = z.object({
  actions: z.array(designAgentActionSchema).max(24),
  summary: z.string().trim().min(1),
});

export type DesignAgentPlan = z.infer<typeof designAgentPlanSchema>;

const canvasColorSchema = z.object({
  fill: z.string().trim().min(1),
  text: z.string().trim().min(1),
});

const optionalCanvasDimensionSchema = z
  .number()
  .finite()
  .nonnegative()
  .nullable()
  .optional();

export const specGenerationCanvasNodeSchema = z
  .object({
    data: z
      .object({
        color: canvasColorSchema.optional(),
        label: z.string().default(""),
        shape: nodeShapeSchema,
      })
      .passthrough(),
    height: optionalCanvasDimensionSchema,
    id: z.string().trim().min(1),
    position: nodePositionSchema,
    type: z.literal(CANVAS_NODE_TYPE).optional(),
    width: optionalCanvasDimensionSchema,
  })
  .passthrough();

export const specGenerationCanvasEdgeSchema = z
  .object({
    data: z
      .object({
        label: z.string().default(""),
      })
      .passthrough()
      .optional(),
    id: z.string().trim().min(1),
    source: z.string().trim().min(1),
    sourceHandle: z.string().trim().min(1).nullable().optional(),
    target: z.string().trim().min(1),
    targetHandle: z.string().trim().min(1).nullable().optional(),
    type: z.literal(CANVAS_EDGE_TYPE).optional(),
  })
  .passthrough();

export const generateSpecPayloadSchema = z.object({
  chatHistory: z.array(aiChatMessageSchema),
  edges: z.array(specGenerationCanvasEdgeSchema),
  nodes: z.array(specGenerationCanvasNodeSchema),
  projectId: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
});

export const specTriggerRequestSchema = generateSpecPayloadSchema.omit({
  projectId: true,
});

export const specTokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
export type SpecGenerationCanvasNode = z.infer<
  typeof specGenerationCanvasNodeSchema
>;
export type SpecGenerationCanvasEdge = z.infer<
  typeof specGenerationCanvasEdgeSchema
>;
export type SpecTriggerRequest = z.infer<typeof specTriggerRequestSchema>;
export type SpecTokenRequest = z.infer<typeof specTokenRequestSchema>;
