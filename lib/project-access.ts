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

interface ProjectIdentity {
  primaryEmail: string | null;
  userId: string | null;
}

export async function getCurrentProjectIdentity(): Promise<ProjectIdentity> {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()]);

  return {
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

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: accessConditions,
    },
    select: WORKSPACE_PROJECT_SELECT,
  });
}

export type { ProjectIdentity };
