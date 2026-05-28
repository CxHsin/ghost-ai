import { get, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import {
  getAccessibleProjectCanvasRecord,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

interface ProjectCanvasRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

function getBlobWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (typeof token !== "string") {
    return null;
  }

  const trimmedToken = token.trim();

  return trimmedToken.length > 0 ? trimmedToken : null;
}

export async function GET(
  _request: Request,
  context: ProjectCanvasRouteContext,
) {
  const blobWriteToken = getBlobWriteToken();

  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { projectId } = await context.params;
  const project = await getAccessibleProjectCanvasRecord(projectId, identity);

  if (!project) {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (!project.canvasJsonPath) {
    return jsonData({ canvas: null });
  }

  if (!blobWriteToken) {
    return jsonError(
      500,
      "BLOB_NOT_CONFIGURED",
      "Canvas persistence is not available right now.",
    );
  }

  const blob = await get(project.canvasJsonPath, {
    access: "private",
    token: blobWriteToken,
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200) {
    return jsonError(
      502,
      "CANVAS_LOAD_FAILED",
      "Unable to load the saved canvas state.",
    );
  }

  const payload = (await new Response(blob.stream).json().catch(() => null)) as unknown;
  const snapshot = parseCanvasSnapshot(payload);

  if (!snapshot) {
    return jsonError(
      502,
      "INVALID_CANVAS_BLOB",
      "Saved canvas data is invalid.",
    );
  }

  return jsonData({
    canvas: snapshot,
    canvasJsonPath: project.canvasJsonPath,
  });
}

export async function PUT(
  request: Request,
  context: ProjectCanvasRouteContext,
) {
  const blobWriteToken = getBlobWriteToken();

  if (!blobWriteToken) {
    return jsonError(
      500,
      "BLOB_NOT_CONFIGURED",
      "Canvas persistence is not available right now.",
    );
  }

  try {
    const identity = await getCurrentProjectIdentity();

    if (!identity.userId) {
      return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const payload = await readProjectBody(request);

    if (payload === null) {
      return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }

    const snapshot = parseCanvasSnapshot(payload);

    if (!snapshot) {
      return jsonError(
        400,
        "INVALID_CANVAS",
        "Canvas payload must include valid nodes and edges.",
      );
    }

    const { projectId } = await context.params;
    const project = await getAccessibleProjectCanvasRecord(projectId, identity);

    if (!project) {
      return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    const blob = await put(
      `canvas/${project.id}.json`,
      JSON.stringify(snapshot),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json; charset=utf-8",
        token: blobWriteToken,
      },
    );

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        canvasJsonPath: blob.url,
      },
    });

    return jsonData({
      canvasJsonPath: blob.url,
    });
  } catch (error) {
    console.error("Canvas autosave route failed.", error);

    return jsonError(
      500,
      "CANVAS_SAVE_FAILED",
      "Unable to save canvas changes right now.",
    );
  }
}
