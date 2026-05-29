import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { persistGeneratedSpec } from "@/lib/spec-artifacts";
import {
  type GenerateSpecPayload,
  type SpecGenerationCanvasEdge,
  type SpecGenerationCanvasNode,
  generateSpecPayloadSchema,
} from "@/types/tasks";

const MODEL_ID = "gemini-2.5-flash";

export const generateSpec = task({
  id: "generate-spec",
  run: async (payload: GenerateSpecPayload): Promise<string> => {
    const parsedPayload = generateSpecPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      const message = "Spec generation received an invalid payload.";

      logger.error(message, {
        issues: parsedPayload.error.issues,
      });
      await updateRunMetadata("failed", message, 0);

      throw new Error(message);
    }

    const input = parsedPayload.data;

    logger.info("Starting spec generation run", {
      chatMessageCount: input.chatHistory.length,
      edgeCount: input.edges.length,
      nodeCount: input.nodes.length,
      projectId: input.projectId,
      roomId: input.roomId,
    });

    try {
      await updateRunMetadata(
        "started",
        "Ghost AI is preparing the technical specification.",
        0,
      );
      await updateRunMetadata(
        "processing",
        "Ghost AI is drafting the technical specification.",
        input.nodes.length + input.edges.length,
      );

      const markdown = await generateMarkdownSpec(input);
      const normalizedMarkdown = markdown.trim();

      if (normalizedMarkdown.length === 0) {
        throw new Error("Spec generation returned empty Markdown.");
      }

      const persistedSpec = await persistGeneratedSpec({
        markdown: normalizedMarkdown,
        projectId: input.projectId,
      });

      metadata.set("specId", persistedSpec.id);

      await updateRunMetadata(
        "completed",
        "Technical specification generated.",
        countWords(normalizedMarkdown),
      );

      return normalizedMarkdown;
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Ghost AI could not generate the technical specification.";

      logger.error("Spec generation task failed", {
        message,
        projectId: input.projectId,
        roomId: input.roomId,
      });

      await updateRunMetadata("failed", message, 0);

      throw error;
    }
  },
});

async function generateMarkdownSpec(input: GenerateSpecPayload) {
  const apiKey = getGoogleAiApiKey();

  if (!apiKey) {
    throw new Error(
      "A Google Generative AI API key is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY.",
    );
  }

  const result = await generateText({
    model: createGoogleGenerativeAI({
      apiKey,
    })(MODEL_ID),
    system: [
      "You are Ghost AI, a senior system design specification writer.",
      "Generate a clear Markdown technical specification from the provided canvas graph and room chat context.",
      "Return Markdown only. Do not wrap the response in a code fence.",
      "Prefer concrete architecture detail from the canvas over speculation.",
      "If important implementation details are unknown, include them under an Open Questions section.",
      "Use concise sections that are useful for engineering handoff.",
    ].join("\n"),
    prompt: [
      "Project context:",
      `Project ID: ${input.projectId}`,
      `Room ID: ${input.roomId}`,
      "",
      "Canvas graph:",
      JSON.stringify(
        {
          edges: input.edges.map(summarizeEdgeForPrompt),
          nodes: input.nodes.map(summarizeNodeForPrompt),
        },
        null,
        2,
      ),
      "",
      "Chat history:",
      formatChatHistory(input.chatHistory),
      "",
      "Write a Markdown technical specification with these sections where applicable:",
      "# Technical Specification",
      "## Overview",
      "## Goals",
      "## Architecture",
      "## Components",
      "## Data Flow",
      "## External Dependencies",
      "## Operational Concerns",
      "## Risks",
      "## Open Questions",
    ].join("\n"),
  });

  return result.text;
}

function summarizeNodeForPrompt(node: SpecGenerationCanvasNode) {
  return {
    id: node.id,
    label: node.data.label.trim(),
    position: node.position,
    shape: node.data.shape,
    size: {
      height: node.height ?? null,
      width: node.width ?? null,
    },
  };
}

function summarizeEdgeForPrompt(edge: SpecGenerationCanvasEdge) {
  return {
    id: edge.id,
    label: edge.data?.label?.trim() ?? "",
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? null,
    target: edge.target,
    targetHandle: edge.targetHandle ?? null,
  };
}

function formatChatHistory(chatHistory: GenerateSpecPayload["chatHistory"]) {
  if (chatHistory.length === 0) {
    return "No chat history was provided.";
  }

  return chatHistory
    .map((message) => {
      const sender = message.sender.trim();
      const content = message.content.trim();

      return `- ${message.role} (${sender}): ${content}`;
    })
    .join("\n");
}

async function updateRunMetadata(
  phase: "completed" | "failed" | "processing" | "started",
  message: string,
  detailCount: number,
) {
  metadata.set("detailCount", detailCount);
  metadata.set("phase", phase);
  metadata.set("statusMessage", message);
  await metadata.flush();
}

function countWords(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean);

  return words.length;
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
