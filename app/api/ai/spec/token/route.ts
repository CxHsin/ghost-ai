import {
  createSpecRunPublicToken,
  findOwnedSpecTaskRun,
  hasTriggerSecretKey,
  parseSpecTokenInput,
  requireSpecTokenUserId,
} from "@/lib/spec-generation-api";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTriggerSecretKey()) {
    return jsonError(
      500,
      "TRIGGER_NOT_CONFIGURED",
      "Spec run tokens are not available right now.",
    );
  }

  const userId = await requireSpecTokenUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedInput = parseSpecTokenInput(payload);

  if (parsedInput.error) {
    return parsedInput.error;
  }

  if (!parsedInput.input) {
    return jsonError(400, "INVALID_REQUEST", "Request body is invalid.");
  }

  const taskRun = await findOwnedSpecTaskRun(parsedInput.input.runId, userId);

  if (!taskRun) {
    return jsonError(404, "TASK_RUN_NOT_FOUND", "Task run not found.");
  }

  try {
    const token = await createSpecRunPublicToken(taskRun.runId);

    return jsonData({
      runId: taskRun.runId,
      token,
    });
  } catch (error) {
    console.error("Spec token route failed.", error);

    return jsonError(
      500,
      "TOKEN_ISSUE_FAILED",
      "Unable to create a spec run token right now.",
    );
  }
}
