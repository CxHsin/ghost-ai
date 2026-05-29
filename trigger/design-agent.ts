import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { MarkerType } from "@xyflow/react";

import {
  clearGhostAiPresence,
  publishAiStatusMessage,
  setGhostAiPresence,
} from "@/lib/ai-room-signals";
import {
  ensureLiveblocksRoomExists,
  getLiveblocksClient,
} from "@/lib/liveblocks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  SHAPE_DEFAULT_SIZES,
  SHAPE_MIN_SIZES,
  createCanvasNodeId,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";
import {
  designAgentActionSchema,
  designAgentPlanSchema,
  type DesignAgentAction,
} from "@/types/tasks";

const MODEL_ID = "gemini-2.5-flash";
const DEFAULT_CURSOR_POSITION = { x: 220, y: 140 };
const GRID_SIZE_PX = 40;
const NODE_SPACING_PX = 72;

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectId?: string;
}

export interface DesignAgentResult {
  accepted: true;
  roomId: string;
  projectId?: string;
  prompt: string;
  actionCount: number;
  message: string;
}

interface CanvasSnapshotForModel {
  edges: Array<{
    id: string;
    label: string;
    source: string;
    target: string;
  }>;
  nodes: Array<{
    colorIndex: number;
    height: number | null | undefined;
    id: string;
    label: string;
    position: {
      x: number;
      y: number;
    };
    shape: CanvasNodeShape;
    width: number | null | undefined;
  }>;
}

interface AppliedActionCounts {
  addedEdges: number;
  addedNodes: number;
  deletedEdges: number;
  deletedNodes: number;
  movedNodes: number;
  resizedNodes: number;
  updatedNodes: number;
}

interface RawActionRecord extends Record<string, unknown> {
  payload?: unknown;
  type?: unknown;
}

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload): Promise<DesignAgentResult> => {
    const roomId = payload.roomId;
    const projectId = payload.projectId ?? payload.roomId;

    logger.info("Starting design agent run", {
      projectId,
      roomId,
      promptLength: payload.prompt.length,
    });

    await ensureLiveblocksRoomExists(roomId);

    await updateRunMetadata("started", "Ghost AI is reviewing the design request.", 0);
    await publishAiStatusMessage(roomId, {
      phase: "started",
      text: "Ghost AI is reviewing the design request.",
    });

    const initialSnapshot = await readCanvasSnapshot(roomId);
    await setGhostAiPresence(roomId, {
      cursor: getCanvasFocusPoint(initialSnapshot.nodes),
      thinking: true,
    });

    try {
      const plan = await generateDesignPlan(payload.prompt, initialSnapshot);

      await updateRunMetadata(
        "processing",
        `Ghost AI is applying ${plan.actions.length} canvas updates.`,
        plan.actions.length,
      );
      await publishAiStatusMessage(roomId, {
        phase: "processing",
        text: `Ghost AI is applying ${plan.actions.length} canvas updates.`,
      });

      const counts = await applyDesignPlan(roomId, plan.actions);
      const totalAppliedChanges = getTotalAppliedChanges(counts);

      if (totalAppliedChanges === 0) {
        throw new Error(
          "Ghost AI could not turn the request into valid canvas changes.",
        );
      }

      const completionMessage = `${plan.summary} ${formatAppliedCounts(counts)}`.trim();

      const finalSnapshot = await readCanvasSnapshot(roomId);
      await setGhostAiPresence(roomId, {
        cursor: getCanvasFocusPoint(finalSnapshot.nodes),
        thinking: false,
      });

      await updateRunMetadata("completed", completionMessage, plan.actions.length);
      await publishAiStatusMessage(roomId, {
        phase: "completed",
        text: completionMessage,
      });

      return {
        accepted: true,
        roomId,
        projectId,
        prompt: payload.prompt,
        actionCount: plan.actions.length,
        message: completionMessage,
      };
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Ghost AI could not complete the design update.";

      logger.error("Design agent task failed", {
        message,
        projectId,
        roomId,
      });

      await updateRunMetadata("failed", message, 0);
      await publishAiStatusMessage(roomId, {
        phase: "failed",
        text: message,
      });

      throw error;
    } finally {
      await clearGhostAiPresence(roomId);
    }
  },
});

async function generateDesignPlan(
  prompt: string,
  snapshot: CanvasSnapshotForModel,
) {
  const apiKey = getGoogleAiApiKey();

  if (!apiKey) {
    throw new Error(
      "A Google Generative AI API key is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY.",
    );
  }

  const result = await generateObject({
    model: createGoogleGenerativeAI({
      apiKey,
    })(MODEL_ID),
    schemaName: "design_agent_plan",
    schemaDescription:
      "A compact canvas update plan with a short summary and a minimal ordered list of valid canvas actions.",
    schema: designAgentPlanSchema,
    experimental_repairText: async ({ text }) =>
      repairDesignPlanText(text),
    system: [
      "You are Ghost AI, a collaborative system-design canvas planner.",
      "Return JSON only. Do not wrap it in markdown fences.",
      "Use only these node shapes: rectangle, diamond, circle, pill, cylinder, hexagon.",
      "Use only these color indexes: 0-7.",
      "Prefer editing existing nodes when the request clearly references them.",
      "Only delete nodes or edges when the user explicitly requests removal or replacement.",
      "Keep diagrams readable: snap conceptually to a 40px grid, leave at least 72px between node bounds, and avoid overlapping nodes.",
      "Use exact existing node IDs from the provided canvas when referring to current nodes.",
      "For new edges, connect by sourceNodeId and targetNodeId after the nodes exist.",
      "Keep the action list minimal and ordered exactly as it should be applied.",
    ].join("\n"),
    prompt: [
      "User request:",
      prompt,
      "",
      "Current canvas:",
      JSON.stringify(snapshot, null, 2),
      "",
      "Return actions that satisfy the request while preserving a clean system diagram.",
    ].join("\n"),
  });

  return result.object;
}

async function readCanvasSnapshot(roomId: string): Promise<CanvasSnapshotForModel> {
  let snapshot: CanvasSnapshotForModel = { nodes: [], edges: [] };

  await mutateFlow<CanvasNode, CanvasEdge>(
    {
      client: getLiveblocksClient(),
      roomId,
    },
    (flow) => {
      snapshot = {
        nodes: flow.nodes.map((node) => ({
          colorIndex: getNodeColorIndex(node.data.color),
          height: node.height,
          id: node.id,
          label: typeof node.data.label === "string" ? node.data.label : "",
          position: {
            x: node.position.x,
            y: node.position.y,
          },
          shape: node.data.shape,
          width: node.width,
        })),
        edges: flow.edges.map((edge) => ({
          id: edge.id,
          label:
            edge.data && typeof edge.data.label === "string" ? edge.data.label : "",
          source: edge.source,
          target: edge.target,
        })),
      };
    },
  );

  return snapshot;
}

async function applyDesignPlan(roomId: string, actions: DesignAgentAction[]) {
  const counts: AppliedActionCounts = {
    addedEdges: 0,
    addedNodes: 0,
    deletedEdges: 0,
    deletedNodes: 0,
    movedNodes: 0,
    resizedNodes: 0,
    updatedNodes: 0,
  };

  await mutateFlow<CanvasNode, CanvasEdge>(
    {
      client: getLiveblocksClient(),
      roomId,
      edges: {
        sync: {
          "*": {
            label: "atomic",
          },
        },
      },
      nodes: {
        sync: {
          "*": {
            color: "atomic",
          },
        },
      },
    },
    (flow) => {
      for (const action of actions) {
        switch (action.type) {
          case "add_node": {
            const nodeId = createUniqueNodeId(
              action.nodeId?.trim() || createCanvasNodeId(action.shape),
              flow.nodes,
            );
            const size = resolveNodeSize(action.shape, action.size);
            const position = findAvailablePosition(
              flow.nodes,
              snapPosition(action.position),
              size,
            );

            flow.addNode({
              id: nodeId,
              type: CANVAS_NODE_TYPE,
              position,
              width: size.width,
              height: size.height,
              data: {
                color: resolveNodeColor(action.colorIndex),
                label: action.label?.trim() || "",
                shape: action.shape,
              },
            });
            counts.addedNodes += 1;
            break;
          }

          case "move_node": {
            if (!flow.getNode(action.nodeId)) {
              break;
            }

            flow.updateNode(action.nodeId, {
              position: snapPosition(action.position),
            });
            counts.movedNodes += 1;
            break;
          }

          case "resize_node": {
            const existingNode = flow.getNode(action.nodeId);

            if (!existingNode) {
              break;
            }

            const size = resolveNodeSize(existingNode.data.shape, action.size);
            flow.updateNode(action.nodeId, {
              height: size.height,
              width: size.width,
            });
            counts.resizedNodes += 1;
            break;
          }

          case "update_node_data": {
            const existingNode = flow.getNode(action.nodeId);

            if (!existingNode) {
              break;
            }

            const nextShape = action.shape ?? existingNode.data.shape;
            const currentSize = {
              height:
                typeof existingNode.height === "number"
                  ? existingNode.height
                  : SHAPE_DEFAULT_SIZES[nextShape].height,
              width:
                typeof existingNode.width === "number"
                  ? existingNode.width
                  : SHAPE_DEFAULT_SIZES[nextShape].width,
            };
            const clampedSize = resolveNodeSize(nextShape, currentSize);

            flow.updateNode(action.nodeId, {
              height: clampedSize.height,
              width: clampedSize.width,
            });
            flow.updateNodeData(action.nodeId, {
              ...(action.colorIndex !== undefined
                ? { color: resolveNodeColor(action.colorIndex) }
                : {}),
              ...(action.label !== undefined ? { label: action.label.trim() } : {}),
              ...(action.shape !== undefined ? { shape: action.shape } : {}),
            });
            counts.updatedNodes += 1;
            break;
          }

          case "delete_node": {
            if (!flow.getNode(action.nodeId)) {
              break;
            }

            const connectedEdgeIds = flow.edges
              .filter(
                (edge) =>
                  edge.source === action.nodeId || edge.target === action.nodeId,
              )
              .map((edge) => edge.id);

            if (connectedEdgeIds.length > 0) {
              flow.removeEdges(connectedEdgeIds);
              counts.deletedEdges += connectedEdgeIds.length;
            }

            flow.removeNode(action.nodeId);
            counts.deletedNodes += 1;
            break;
          }

          case "add_edge": {
            if (
              !flow.getNode(action.sourceNodeId) ||
              !flow.getNode(action.targetNodeId)
            ) {
              break;
            }

            const edgeId = createUniqueEdgeId(
              action.edgeId?.trim() || `edge-${crypto.randomUUID()}`,
              flow.edges,
            );

            flow.addEdge({
              id: edgeId,
              type: CANVAS_EDGE_TYPE,
              source: action.sourceNodeId,
              sourceHandle: action.sourceHandle ?? null,
              target: action.targetNodeId,
              targetHandle: action.targetHandle ?? null,
              data: {
                label: action.label?.trim() || "",
              },
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
            });
            counts.addedEdges += 1;
            break;
          }

          case "delete_edge": {
            if (!flow.getEdge(action.edgeId)) {
              break;
            }

            flow.removeEdge(action.edgeId);
            counts.deletedEdges += 1;
            break;
          }
        }
      }
    },
  );

  return counts;
}

function findAvailablePosition(
  nodes: readonly CanvasNode[],
  requestedPosition: { x: number; y: number },
  size: { height: number; width: number },
) {
  let candidate = requestedPosition;
  let attempts = 0;

  while (
    attempts < 24 &&
    nodes.some((node) =>
      rectanglesIntersect(
        {
          x: candidate.x,
          y: candidate.y,
          width: size.width,
          height: size.height,
        },
        {
          x: node.position.x,
          y: node.position.y,
          width:
            typeof node.width === "number"
              ? node.width
              : SHAPE_DEFAULT_SIZES[node.data.shape].width,
          height:
            typeof node.height === "number"
              ? node.height
              : SHAPE_DEFAULT_SIZES[node.data.shape].height,
        },
      ),
    )
  ) {
    attempts += 1;
    candidate = {
      x: requestedPosition.x + attempts * (size.width + NODE_SPACING_PX),
      y: requestedPosition.y + (attempts % 2) * (size.height + NODE_SPACING_PX),
    };
  }

  return candidate;
}

function rectanglesIntersect(
  a: { height: number; width: number; x: number; y: number },
  b: { height: number; width: number; x: number; y: number },
) {
  return !(
    a.x + a.width + NODE_SPACING_PX <= b.x ||
    b.x + b.width + NODE_SPACING_PX <= a.x ||
    a.y + a.height + NODE_SPACING_PX <= b.y ||
    b.y + b.height + NODE_SPACING_PX <= a.y
  );
}

function resolveNodeColor(colorIndex: number | undefined): CanvasNodeColor {
  if (colorIndex === undefined) {
    return NODE_COLORS[0];
  }

  return NODE_COLORS[colorIndex] ?? NODE_COLORS[0];
}

function resolveNodeSize(
  shape: CanvasNodeShape,
  size:
    | {
        height: number;
        width: number;
      }
    | undefined,
) {
  const fallback = SHAPE_DEFAULT_SIZES[shape];
  const minimum = SHAPE_MIN_SIZES[shape];

  return {
    height: Math.max(size?.height ?? fallback.height, minimum.height),
    width: Math.max(size?.width ?? fallback.width, minimum.width),
  };
}

function snapPosition(position: { x: number; y: number }) {
  return {
    x: Math.round(position.x / GRID_SIZE_PX) * GRID_SIZE_PX,
    y: Math.round(position.y / GRID_SIZE_PX) * GRID_SIZE_PX,
  };
}

function createUniqueNodeId(nodeId: string, nodes: readonly CanvasNode[]) {
  if (!nodes.some((node) => node.id === nodeId)) {
    return nodeId;
  }

  return `${nodeId}-${crypto.randomUUID().slice(0, 8)}`;
}

function createUniqueEdgeId(edgeId: string, edges: readonly CanvasEdge[]) {
  if (!edges.some((edge) => edge.id === edgeId)) {
    return edgeId;
  }

  return `${edgeId}-${crypto.randomUUID().slice(0, 8)}`;
}

function getNodeColorIndex(color: CanvasNodeColor) {
  const index = NODE_COLORS.findIndex(
    (candidate) =>
      candidate.fill === color.fill && candidate.text === color.text,
  );

  return index >= 0 ? index : 0;
}

function getCanvasFocusPoint(
  nodes: ReadonlyArray<CanvasSnapshotForModel["nodes"][number]>,
) {
  if (nodes.length === 0) {
    return DEFAULT_CURSOR_POSITION;
  }

  const bounds = nodes.reduce(
    (accumulator, node) => {
      const width = node.width ?? SHAPE_DEFAULT_SIZES[node.shape].width;
      const height = node.height ?? SHAPE_DEFAULT_SIZES[node.shape].height;

      return {
        bottom: Math.max(accumulator.bottom, node.position.y + height),
        left: Math.min(accumulator.left, node.position.x),
        right: Math.max(accumulator.right, node.position.x + width),
        top: Math.min(accumulator.top, node.position.y),
      };
    },
    {
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
    },
  );

  return {
    x: bounds.left + (bounds.right - bounds.left) / 2,
    y: bounds.top + (bounds.bottom - bounds.top) / 2,
  };
}

function formatAppliedCounts(counts: AppliedActionCounts) {
  const parts: string[] = [];

  if (counts.addedNodes > 0) {
    parts.push(`Added ${counts.addedNodes} node${counts.addedNodes === 1 ? "" : "s"}.`);
  }

  if (counts.updatedNodes > 0) {
    parts.push(
      `Updated ${counts.updatedNodes} node${counts.updatedNodes === 1 ? "" : "s"}.`,
    );
  }

  if (counts.movedNodes > 0) {
    parts.push(`Moved ${counts.movedNodes} node${counts.movedNodes === 1 ? "" : "s"}.`);
  }

  if (counts.resizedNodes > 0) {
    parts.push(
      `Resized ${counts.resizedNodes} node${counts.resizedNodes === 1 ? "" : "s"}.`,
    );
  }

  if (counts.deletedNodes > 0) {
    parts.push(
      `Deleted ${counts.deletedNodes} node${counts.deletedNodes === 1 ? "" : "s"}.`,
    );
  }

  if (counts.addedEdges > 0) {
    parts.push(`Added ${counts.addedEdges} edge${counts.addedEdges === 1 ? "" : "s"}.`);
  }

  if (counts.deletedEdges > 0) {
    parts.push(
      `Deleted ${counts.deletedEdges} edge${counts.deletedEdges === 1 ? "" : "s"}.`,
    );
  }

  return parts.join(" ");
}

function getTotalAppliedChanges(counts: AppliedActionCounts) {
  return (
    counts.addedEdges +
    counts.addedNodes +
    counts.deletedEdges +
    counts.deletedNodes +
    counts.movedNodes +
    counts.resizedNodes +
    counts.updatedNodes
  );
}

async function updateRunMetadata(
  phase: "completed" | "failed" | "processing" | "started",
  message: string,
  actionCount: number,
) {
  metadata.set("actionCount", actionCount);
  metadata.set("phase", phase);
  metadata.set("statusMessage", message);
  await metadata.flush();
}

function getGoogleAiApiKey() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;

  if (typeof apiKey !== "string") {
    return null;
  }

  const trimmedApiKey = apiKey.trim();

  return trimmedApiKey.length > 0 ? trimmedApiKey : null;
}

async function repairDesignPlanText(text: string) {
  const candidates = extractJsonCandidates(text);

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate);

    if (parsed === null) {
      continue;
    }

    const normalized = normalizeDesignPlanCandidate(parsed);

    if (normalized === null) {
      continue;
    }

    return JSON.stringify(normalized);
  }

  return null;
}

function extractJsonCandidates(text: string) {
  const candidates = [text.trim()];
  const fencedBlocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];

  for (const block of fencedBlocks) {
    if (block[1]) {
      candidates.push(block[1].trim());
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1).trim());
  }

  return [...new Set(candidates.filter((candidate) => candidate.length > 0))];
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeDesignPlanCandidate(candidate: unknown) {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const rawActions = Array.isArray(record.actions) ? record.actions : [];
  const actions = rawActions
    .map((action) => normalizeActionCandidate(action))
    .filter((action): action is DesignAgentAction => action !== null);

  const summary =
    typeof record.summary === "string" && record.summary.trim().length > 0
      ? record.summary.trim()
      : actions.length > 0
        ? "Ghost AI prepared a canvas update plan."
        : "Ghost AI reviewed the request and found no valid canvas updates.";

  const validation = designAgentPlanSchema.safeParse({
    actions,
    summary,
  });

  return validation.success ? validation.data : null;
}

function normalizeActionCandidate(candidate: unknown) {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as RawActionRecord;
  const payloadRecord = normalizeActionPayload(record.payload);
  const mergedRecord = {
    ...payloadRecord,
    ...record,
  } satisfies Record<string, unknown>;
  const type = normalizeActionType(mergedRecord.type);

  if (!type) {
    return null;
  }

  switch (type) {
    case "add_node":
      return parseAction({
        type,
        nodeId: normalizeOptionalString(mergedRecord.nodeId ?? mergedRecord.id),
        label: normalizeOptionalString(mergedRecord.label),
        shape: normalizeString(mergedRecord.shape),
        colorIndex: normalizeOptionalInteger(
          mergedRecord.colorIndex ?? mergedRecord.color,
        ),
        position: normalizePosition(
          mergedRecord.position ?? {
            x: mergedRecord.x,
            y: mergedRecord.y,
          },
        ),
        size: normalizeOptionalSize(
          mergedRecord.size ?? {
            width: mergedRecord.width,
            height: mergedRecord.height,
          },
        ),
      });
    case "move_node":
      return parseAction({
        type,
        nodeId: normalizeString(mergedRecord.nodeId ?? mergedRecord.id),
        position: normalizePosition(
          mergedRecord.position ?? {
            x: mergedRecord.x,
            y: mergedRecord.y,
          },
        ),
      });
    case "resize_node":
      return parseAction({
        type,
        nodeId: normalizeString(mergedRecord.nodeId ?? mergedRecord.id),
        size: normalizeOptionalSize(
          mergedRecord.size ?? {
            width: mergedRecord.width,
            height: mergedRecord.height,
          },
        ),
      });
    case "update_node_data":
      return parseAction({
        type,
        nodeId: normalizeString(mergedRecord.nodeId ?? mergedRecord.id),
        label: normalizeOptionalString(mergedRecord.label),
        shape: normalizeOptionalString(mergedRecord.shape),
        colorIndex: normalizeOptionalInteger(
          mergedRecord.colorIndex ?? mergedRecord.color,
        ),
      });
    case "delete_node":
      return parseAction({
        type,
        nodeId: normalizeString(mergedRecord.nodeId ?? mergedRecord.id),
      });
    case "add_edge":
      return parseAction({
        type,
        edgeId: normalizeOptionalString(mergedRecord.edgeId ?? mergedRecord.id),
        label: normalizeOptionalString(mergedRecord.label),
        sourceNodeId: normalizeString(mergedRecord.sourceNodeId ?? mergedRecord.source),
        targetNodeId: normalizeString(mergedRecord.targetNodeId ?? mergedRecord.target),
        sourceHandle: normalizeOptionalNullableString(mergedRecord.sourceHandle),
        targetHandle: normalizeOptionalNullableString(mergedRecord.targetHandle),
      });
    case "delete_edge":
      return parseAction({
        type,
        edgeId: normalizeString(mergedRecord.edgeId ?? mergedRecord.id),
      });
    default:
      return null;
  }
}

function normalizeActionPayload(payload: unknown) {
  if (typeof payload === "string") {
    const parsedPayload = tryParseJson(payload);

    if (
      typeof parsedPayload === "object" &&
      parsedPayload !== null &&
      !Array.isArray(parsedPayload)
    ) {
      return parsedPayload as Record<string, unknown>;
    }
  }

  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {};
}

function normalizeActionType(value: unknown) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "addNode":
      return "add_node";
    case "moveNode":
      return "move_node";
    case "resizeNode":
      return "resize_node";
    case "updateNodeData":
      return "update_node_data";
    case "deleteNode":
      return "delete_node";
    case "addEdge":
      return "add_edge";
    case "deleteEdge":
      return "delete_edge";
    default:
      return normalized;
  }
}

function parseAction(candidate: unknown) {
  const validation = designAgentActionSchema.safeParse(candidate);

  return validation.success ? validation.data : null;
}

function normalizePosition(candidate: unknown) {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const x = normalizeFiniteNumber(record.x);
  const y = normalizeFiniteNumber(record.y);

  if (x === null || y === null) {
    return null;
  }

  return { x, y };
}

function normalizeOptionalSize(candidate: unknown) {
  if (candidate === undefined) {
    return undefined;
  }

  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return undefined;
  }

  const record = candidate as Record<string, unknown>;
  const width = normalizeFiniteNumber(record.width);
  const height = normalizeFiniteNumber(record.height);

  if (width === null || height === null || width <= 0 || height <= 0) {
    return undefined;
  }

  return { width, height };
}

function normalizeFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function normalizeOptionalInteger(value: unknown) {
  const normalized = normalizeFiniteNumber(value);

  return normalized === null ? undefined : Math.trunc(normalized);
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeOptionalString(value: unknown) {
  return normalizeString(value) ?? undefined;
}

function normalizeOptionalNullableString(value: unknown) {
  if (value === null) {
    return null;
  }

  return normalizeString(value) ?? undefined;
}
