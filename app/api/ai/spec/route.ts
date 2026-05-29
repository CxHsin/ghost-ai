import {
  createSpecTaskRunRecord,
  hasTriggerSecretKey,
  isTaskRunConflictError,
  parseSpecTriggerInput,
  verifySpecTriggerAccess,
} from "@/lib/spec-generation-api";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTriggerSecretKey()) {
    return jsonError(
      500,
      "TRIGGER_NOT_CONFIGURED",
      "Spec generation is not available right now.",
    );
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedInput = parseSpecTriggerInput(payload);

  if (parsedInput.error) {
    return parsedInput.error;
  }

  if (!parsedInput.input) {
    return jsonError(400, "INVALID_REQUEST", "Request body is invalid.");
  }

  const access = await verifySpecTriggerAccess(parsedInput.input);

  if (access.kind === "unauthorized") {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  if (access.kind === "project_not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  try {
    const runId = await createSpecTaskRunRecord(access.userId, {
      ...parsedInput.input,
      projectId: access.project.id,
    });

    return jsonData({ runId }, 201);
  } catch (error) {
    if (isTaskRunConflictError(error)) {
      return jsonError(
        409,
        "TASK_RUN_CONFLICT",
        "A spec generation run with this ID already exists.",
      );
    }

    console.error("Spec trigger route failed.", error);

    return jsonError(
      500,
      "SPEC_TRIGGER_FAILED",
      "Unable to start spec generation right now.",
    );
  }
}
