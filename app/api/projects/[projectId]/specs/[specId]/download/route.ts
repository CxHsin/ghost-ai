import { prisma } from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectAccessStatus,
} from "@/lib/project-access";
import { jsonError } from "@/lib/project-api";
import {
  SPEC_MARKDOWN_CONTENT_TYPE,
  getSpecDownloadFileName,
  readSpecMarkdownBlob,
} from "@/lib/spec-artifacts";

export const runtime = "nodejs";

interface ProjectSpecDownloadRouteContext {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: ProjectSpecDownloadRouteContext,
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { projectId, specId } = await context.params;
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

  const spec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      filePath: true,
      id: true,
    },
  });

  if (!spec) {
    return jsonError(404, "SPEC_NOT_FOUND", "Specification not found.");
  }

  try {
    const blob = await readSpecMarkdownBlob(spec.filePath);

    if (blob.kind === "not_configured") {
      return jsonError(
        500,
        "BLOB_NOT_CONFIGURED",
        "Spec downloads are not available right now.",
      );
    }

    if (blob.kind === "not_found") {
      return jsonError(404, "SPEC_FILE_NOT_FOUND", "Specification file not found.");
    }

    return new Response(blob.markdown, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${getSpecDownloadFileName(spec.id)}"`,
        "Content-Type": SPEC_MARKDOWN_CONTENT_TYPE,
      },
    });
  } catch (error) {
    console.error("Spec download route failed.", error);

    return jsonError(
      502,
      "SPEC_DOWNLOAD_FAILED",
      "Unable to download the specification right now.",
    );
  }
}
