import {
  inviteCollaboratorToProject,
  listCollaboratorsForProject,
  parseCollaboratorEmail,
} from "@/lib/project-collaborators";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { jsonData, jsonError, readProjectBody } from "@/lib/project-api";

interface ProjectCollaboratorsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: ProjectCollaboratorsRouteContext,
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { projectId } = await context.params;
  const result = await listCollaboratorsForProject(projectId, identity);

  if (result.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (result.kind === "unauthorized") {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return jsonData({
    collaborators: result.collaborators,
  });
}

export async function POST(
  request: Request,
  context: ProjectCollaboratorsRouteContext,
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const { error, email } = parseCollaboratorEmail(payload);

  if (error || !email) {
    return Response.json(error, { status: 400 });
  }

  const { projectId } = await context.params;
  const result = await inviteCollaboratorToProject(projectId, identity, email);

  if (result.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (result.kind === "forbidden") {
    return jsonError(
      403,
      "FORBIDDEN",
      "Only the project owner can invite collaborators.",
    );
  }

  if (result.kind === "self") {
    return jsonError(
      400,
      "INVALID_COLLABORATOR",
      "The project owner already has access to this project.",
    );
  }

  if (result.kind === "duplicate") {
    return jsonError(
      409,
      "COLLABORATOR_EXISTS",
      "This collaborator already has access to the project.",
    );
  }

  if (result.kind === "unauthorized") {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return jsonData(
    {
      collaborator: result.collaborator,
    },
    201,
  );
}
