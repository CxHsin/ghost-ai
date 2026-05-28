import {
  deleteOwnedProject,
  jsonData,
  jsonError,
  parseRenameProjectName,
  readProjectBody,
  renameOwnedProject,
  requireAuthenticatedUserId,
} from "@/lib/project-api";

interface ProjectRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { userId } = await requireAuthenticatedUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const { error, name } = parseRenameProjectName(payload);

  if (error || !name) {
    return Response.json(error, { status: 400 });
  }

  const { projectId } = await context.params;
  const result = await renameOwnedProject(projectId, userId, name);

  if (result.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (result.kind === "forbidden") {
    return jsonError(
      403,
      "FORBIDDEN",
      "Only the project owner can update this project.",
    );
  }

  return jsonData({ project: result.project });
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { userId } = await requireAuthenticatedUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { projectId } = await context.params;
  const result = await deleteOwnedProject(projectId, userId);

  if (result.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (result.kind === "forbidden") {
    return jsonError(
      403,
      "FORBIDDEN",
      "Only the project owner can delete this project.",
    );
  }

  return jsonData({ deletedProjectId: projectId });
}
