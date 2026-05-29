import {
  createDesignTaskRunRecord,
  ensureDesignTaskRoom,
  hasTriggerSecretKey,
  isTaskRunConflictError,
  parseDesignTriggerInput,
  verifyDesignTriggerAccess,
} from "@/lib/design-agent-api";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTriggerSecretKey()) {
    return jsonError(
      500,
      "TRIGGER_NOT_CONFIGURED",
      "Design task triggering is not available right now.",
    );
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedInput = parseDesignTriggerInput(payload);

  if (parsedInput.error) {
    return parsedInput.error;
  }

  if (!parsedInput.input) {
    return jsonError(400, "INVALID_REQUEST", "Request body is invalid.");
  }

  const access = await verifyDesignTriggerAccess(parsedInput.input);

  if (access.kind === "unauthorized") {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  if (access.kind === "project_not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (access.kind === "room_mismatch") {
    return jsonError(
      400,
      "ROOM_PROJECT_MISMATCH",
      "Room ID must match the requested project workspace.",
    );
  }

  try {
    await ensureDesignTaskRoom(
      access.project.ownerId,
      access.project.id,
      access.userId,
    );

    const runId = await createDesignTaskRunRecord(access.userId, {
      prompt: parsedInput.input.prompt,
      roomId: parsedInput.input.roomId,
      projectId: parsedInput.input.projectId,
    });

    return jsonData({ runId }, 201);
  } catch (error) {
    if (isTaskRunConflictError(error)) {
      return jsonError(
        409,
        "TASK_RUN_CONFLICT",
        "A design task run with this ID already exists.",
      );
    }

    console.error("Design trigger route failed.", error);

    return jsonError(
      500,
      "DESIGN_TRIGGER_FAILED",
      "Unable to start the design task right now.",
    );
  }
}
