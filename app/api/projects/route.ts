import { Prisma } from "@/app/generated/prisma/client";

import {
  createProjectForOwner,
  createProjectForOwnerWithId,
  jsonData,
  jsonError,
  listProjectsForOwner,
  parseCreateProjectInput,
  readProjectBody,
  requireAuthenticatedUserId,
} from "@/lib/project-api";

export async function GET() {
  const { userId } = await requireAuthenticatedUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const projects = await listProjectsForOwner(userId);

  return jsonData({ projects });
}

export async function POST(request: Request) {
  const { userId } = await requireAuthenticatedUserId();

  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await readProjectBody(request);

  if (payload === null) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const { error, id, name } = parseCreateProjectInput(payload);

  if (error || !name) {
    return Response.json(error, { status: 400 });
  }

  try {
    const project = id
      ? await createProjectForOwnerWithId(userId, id, name)
      : await createProjectForOwner(userId, name);

    return jsonData({ project }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        409,
        "CONFLICT",
        "A project with this ID already exists.",
      );
    }

    throw error;
  }
}
