import { removeCollaboratorFromProject } from "@/lib/project-collaborators";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/project-api";

interface DeleteCollaboratorRouteContext {
  params: Promise<{
    email: string;
    projectId: string;
  }>;
}

export async function DELETE(
  _request: Request,
  context: DeleteCollaboratorRouteContext,
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { email, projectId } = await context.params;
  const result = await removeCollaboratorFromProject(projectId, identity, email);

  if (result.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (result.kind === "collaborator_not_found") {
    return jsonError(404, "COLLABORATOR_NOT_FOUND", "Collaborator not found.");
  }

  if (result.kind === "forbidden") {
    return jsonError(
      403,
      "FORBIDDEN",
      "Only the project owner can remove collaborators.",
    );
  }

  if (result.kind === "unauthorized") {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return jsonData({
    removedEmail: result.email,
  });
}
