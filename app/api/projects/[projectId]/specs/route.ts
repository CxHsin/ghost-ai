import { prisma } from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectAccessStatus,
} from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/project-api";
import { getSpecDownloadFileName } from "@/lib/spec-artifacts";

export const runtime = "nodejs";

interface ProjectSpecsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: ProjectSpecsRouteContext,
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { projectId } = await context.params;
  const access = await getProjectAccessStatus(projectId, identity);

  if (access.kind === "not_found") {
    return jsonError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (access.kind === "forbidden") {
    return jsonError(
      403,
      "FORBIDDEN",
      "You do not have access to this project.",
    );
  }

  const specs = await prisma.projectSpec.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      id: true,
    },
  });

  return jsonData({
    specs: specs.map((spec) => ({
      createdAt: spec.createdAt.toISOString(),
      filename: getSpecDownloadFileName(spec.id),
      id: spec.id,
    })),
  });
}
