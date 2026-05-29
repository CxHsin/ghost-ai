import {
  createDesignRunPublicToken,
  findOwnedTaskRun,
  hasTriggerSecretKey,
  parseDesignTokenInput,
  requireDesignTokenUserId,
} from "@/lib/design-agent-api";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTriggerSecretKey()) {
    return jsonError(
      500,
      "TRIGGER_NOT_CONFIGURED",
      "Design run tokens are not available right now.",
    );
  }

  const userId = await requireDesignTokenUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedInput = parseDesignTokenInput(payload);

  if (parsedInput.error) {
    return parsedInput.error;
  }

  if (!parsedInput.input) {
    return jsonError(400, "INVALID_REQUEST", "Request body is invalid.");
  }

  const taskRun = await findOwnedTaskRun(parsedInput.input.runId, userId);

  if (!taskRun) {
    return jsonError(404, "TASK_RUN_NOT_FOUND", "Task run not found.");
  }

  try {
    const token = await createDesignRunPublicToken(taskRun.runId);

    return jsonData({
      runId: taskRun.runId,
      token,
    });
  } catch (error) {
    console.error("Design token route failed.", error);

    return jsonError(
      500,
      "TOKEN_ISSUE_FAILED",
      "Unable to create a design run token right now.",
    );
  }
}
