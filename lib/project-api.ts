import { auth } from "@clerk/nextjs/server";

import { Prisma, type Project } from "@/app/generated/prisma/client";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborator-email";
import { prisma } from "@/lib/prisma";

const PROJECT_RESPONSE_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  canvasJsonPath: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessBody<T> {
  data: T;
}

interface RequireUserIdResult {
  userId: string | null;
}

interface ProjectBody {
  id?: unknown;
  name?: unknown;
}

interface ProjectNameResult {
  error: ApiErrorBody | null;
  name: string | null;
}

interface CreateProjectInputResult {
  error: ApiErrorBody | null;
  id: string | null;
  name: string | null;
}

type ProjectResponse = Prisma.ProjectGetPayload<{
  select: typeof PROJECT_RESPONSE_SELECT;
}>;

function createApiErrorBody(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  } satisfies ApiErrorBody;
}

export function jsonError(status: number, code: string, message: string) {
  const body = createApiErrorBody(code, message);

  return Response.json(body, { status });
}

export function jsonData<T>(data: T, status = 200) {
  const body = {
    data,
  } satisfies ApiSuccessBody<T>;

  return Response.json(body, { status });
}

export async function requireAuthenticatedUserId(): Promise<RequireUserIdResult> {
  const { userId } = await auth();

  return { userId };
}

export async function listProjectsForOwner(userId: string) {
  return prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: PROJECT_RESPONSE_SELECT,
  });
}

export async function createProjectForOwner(userId: string, name: string) {
  return prisma.project.create({
    data: {
      ownerId: userId,
      name,
    },
    select: PROJECT_RESPONSE_SELECT,
  });
}

export async function createProjectForOwnerWithId(
  userId: string,
  projectId: string,
  name: string,
) {
  return prisma.project.create({
    data: {
      id: projectId,
      ownerId: userId,
      name,
    },
    select: PROJECT_RESPONSE_SELECT,
  });
}

export async function listSharedProjectsForCollaboratorEmail(email: string) {
  return prisma.project.findMany({
    where: {
      collaborators: {
        some: {
          email: normalizeCollaboratorEmail(email),
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: PROJECT_RESPONSE_SELECT,
  });
}

export async function renameOwnedProject(
  projectId: string,
  userId: string,
  name: string,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ownerId: true,
    },
  });

  if (!project) {
    return { kind: "not_found" } as const;
  }

  if (project.ownerId !== userId) {
    return { kind: "forbidden" } as const;
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
    },
    select: PROJECT_RESPONSE_SELECT,
  });

  return {
    kind: "success",
    project: updatedProject,
  } as const;
}

export async function deleteOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ownerId: true,
    },
  });

  if (!project) {
    return { kind: "not_found" } as const;
  }

  if (project.ownerId !== userId) {
    return { kind: "forbidden" } as const;
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return { kind: "success" } as const;
}

export async function readProjectBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function parseCreateProjectName(payload: unknown): ProjectNameResult {
  const result = parseCreateProjectInput(payload);

  return {
    error: result.error,
    name: result.name,
  };
}

export function parseCreateProjectInput(
  payload: unknown,
): CreateProjectInputResult {
  if (!isProjectBody(payload)) {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Request body must be a JSON object.",
      ),
      id: null,
      name: null,
    };
  }

  if (payload.id !== undefined && typeof payload.id !== "string") {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Project id must be a string.",
      ),
      id: null,
      name: null,
    };
  }

  if (payload.name === undefined) {
    return {
      error: null,
      id: typeof payload.id === "string" ? payload.id : null,
      name: "Untitled Project",
    };
  }

  if (typeof payload.name !== "string") {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Project name must be a string.",
      ),
      id: null,
      name: null,
    };
  }

  const trimmedName = payload.name.trim();

  if (trimmedName.length === 0) {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Project name cannot be empty.",
      ),
      id: null,
      name: null,
    };
  }

  return {
    error: null,
    id: typeof payload.id === "string" ? payload.id : null,
    name: trimmedName,
  };
}

export function parseRenameProjectName(payload: unknown): ProjectNameResult {
  if (!isProjectBody(payload)) {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Request body must be a JSON object.",
      ),
      name: null,
    };
  }

  if (typeof payload.name !== "string") {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Project name must be a string.",
      ),
      name: null,
    };
  }

  const trimmedName = payload.name.trim();
  if (trimmedName.length === 0) {
    return {
      error: createApiErrorBody(
        "INVALID_REQUEST",
        "Project name cannot be empty.",
      ),
      name: null,
    };
  }

  return {
    error: null,
    name: trimmedName,
  };
}

function isProjectBody(payload: unknown): payload is ProjectBody {
  return (
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
  );
}

export type { Project, ProjectResponse };
