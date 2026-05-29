import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { Prisma } from "@/app/generated/prisma/client";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborator-email";
import { prisma } from "@/lib/prisma";

const WORKSPACE_PROJECT_SELECT = {
  id: true,
  name: true,
  ownerId: true,
} satisfies Prisma.ProjectSelect;

const PROJECT_CANVAS_ACCESS_SELECT = {
  id: true,
  ownerId: true,
  canvasJsonPath: true,
} satisfies Prisma.ProjectSelect;

interface ProjectIdentity {
  avatarUrl: string | null;
  displayName: string | null;
  primaryEmail: string | null;
  userId: string | null;
}

export async function getCurrentProjectIdentity(): Promise<ProjectIdentity> {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()]);

  return {
    avatarUrl: user?.imageUrl ?? null,
    displayName:
      user?.fullName?.trim() ||
      user?.firstName?.trim() ||
      user?.username?.trim() ||
      null,
    primaryEmail: user?.primaryEmailAddress?.emailAddress
      ? normalizeCollaboratorEmail(user.primaryEmailAddress.emailAddress)
      : null,
    userId,
  };
}

export async function getAccessibleProject(
  projectId: string,
  identity: ProjectIdentity,
) {
  const accessWhere = buildProjectAccessWhere(projectId, identity);

  if (!accessWhere) {
    return null;
  }

  return prisma.project.findFirst({
    where: accessWhere,
    select: WORKSPACE_PROJECT_SELECT,
  });
}

export async function getAccessibleProjectCanvasRecord(
  projectId: string,
  identity: ProjectIdentity,
) {
  const accessWhere = buildProjectAccessWhere(projectId, identity);

  if (!accessWhere) {
    return null;
  }

  return prisma.project.findFirst({
    where: accessWhere,
    select: PROJECT_CANVAS_ACCESS_SELECT,
  });
}

export async function getProjectAccessStatus(
  projectId: string,
  identity: ProjectIdentity,
) {
  const existingProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
    },
  });

  if (!existingProject) {
    return {
      kind: "not_found",
    } as const;
  }

  const project = await getAccessibleProject(projectId, identity);

  if (!project) {
    return {
      kind: "forbidden",
    } as const;
  }

  return {
    kind: "success",
    project,
  } as const;
}

function buildProjectAccessWhere(
  projectId: string,
  identity: ProjectIdentity,
) {
  if (!identity.userId) {
    return null;
  }

  const accessConditions: Prisma.ProjectWhereInput[] = [
    {
      ownerId: identity.userId,
    },
  ];

  if (identity.primaryEmail) {
    accessConditions.push({
      collaborators: {
        some: {
          email: normalizeCollaboratorEmail(identity.primaryEmail),
        },
      },
    });
  }

  return {
    id: projectId,
    OR: accessConditions,
  } satisfies Prisma.ProjectWhereInput;
}

export type { ProjectIdentity };
