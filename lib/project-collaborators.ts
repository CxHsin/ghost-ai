import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { Prisma } from "@/app/generated/prisma/client";
import { type ProjectIdentity } from "@/lib/project-access";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborator-email";
import { prisma } from "@/lib/prisma";

const PROJECT_OWNER_SELECT = {
  id: true,
  ownerId: true,
} satisfies Prisma.ProjectSelect;

const PROJECT_COLLABORATOR_SELECT = {
  createdAt: true,
  email: true,
} satisfies Prisma.ProjectCollaboratorSelect;

interface CollaboratorBody {
  email?: unknown;
}

interface CollaboratorSummary {
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
}

interface CollaboratorEmailResult {
  error: {
    error: {
      code: string;
      message: string;
    };
  } | null;
  email: string | null;
}

function getDisplayName(user: {
  firstName: string | null;
  fullName: string | null;
  lastName: string | null;
  username: string | null;
}) {
  if (user.fullName) {
    return user.fullName;
  }

  const joinedName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (joinedName.length > 0) {
    return joinedName;
  }

  return user.username;
}

async function enrichCollaborators(emails: string[]) {
  const normalizedEmails = Array.from(
    new Set(emails.map((email) => normalizeCollaboratorEmail(email))),
  );

  if (normalizedEmails.length === 0) {
    return new Map<string, { avatarUrl: string | null; displayName: string | null }>();
  }

  const client = await clerkClient();
  const response = await client.users.getUserList({
    emailAddress: normalizedEmails,
    limit: normalizedEmails.length,
  });

  const usersByEmail = new Map<
    string,
    { avatarUrl: string | null; displayName: string | null }
  >();

  for (const user of response.data) {
    for (const emailAddress of user.emailAddresses) {
      const normalizedEmail = normalizeCollaboratorEmail(emailAddress.emailAddress);

      if (!normalizedEmails.includes(normalizedEmail) || usersByEmail.has(normalizedEmail)) {
        continue;
      }

      usersByEmail.set(normalizedEmail, {
        avatarUrl: user.imageUrl ?? null,
        displayName: getDisplayName(user),
      });
    }
  }

  return usersByEmail;
}

async function listCollaboratorRows(projectId: string) {
  return prisma.projectCollaborator.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: PROJECT_COLLABORATOR_SELECT,
  });
}

async function buildCollaboratorSummaries(emails: string[]): Promise<CollaboratorSummary[]> {
  const enrichedUsers = await enrichCollaborators(emails);

  return emails.map((email) => {
    const normalizedEmail = normalizeCollaboratorEmail(email);
    const enrichedUser = enrichedUsers.get(normalizedEmail);

    return {
      avatarUrl: enrichedUser?.avatarUrl ?? null,
      displayName: enrichedUser?.displayName ?? null,
      email: normalizedEmail,
    };
  });
}

export async function listCollaboratorsForProject(
  projectId: string,
  identity: ProjectIdentity,
) {
  if (!identity.userId) {
    return { kind: "unauthorized" } as const;
  }

  const collaboratorEmail = identity.primaryEmail
    ? normalizeCollaboratorEmail(identity.primaryEmail)
    : null;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        {
          ownerId: identity.userId,
        },
        ...(collaboratorEmail
          ? [
              {
                collaborators: {
                  some: {
                    email: collaboratorEmail,
                  },
                },
              },
            ]
          : []),
      ],
    },
    select: PROJECT_OWNER_SELECT,
  });

  if (!project) {
    return { kind: "not_found" } as const;
  }

  const collaborators = await listCollaboratorRows(projectId);

  return {
    kind: "success",
    collaborators: await buildCollaboratorSummaries(
      collaborators.map((collaborator) => collaborator.email),
    ),
  } as const;
}

export async function inviteCollaboratorToProject(
  projectId: string,
  identity: ProjectIdentity,
  email: string,
) {
  if (!identity.userId) {
    return { kind: "unauthorized" } as const;
  }

  const normalizedEmail = normalizeCollaboratorEmail(email);
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: PROJECT_OWNER_SELECT,
  });

  if (!project) {
    return { kind: "not_found" } as const;
  }

  if (project.ownerId !== identity.userId) {
    return { kind: "forbidden" } as const;
  }

  if (
    identity.primaryEmail &&
    normalizeCollaboratorEmail(identity.primaryEmail) === normalizedEmail
  ) {
    return { kind: "self" } as const;
  }

  try {
    await prisma.projectCollaborator.create({
      data: {
        email: normalizedEmail,
        projectId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { kind: "duplicate" } as const;
    }

    throw error;
  }

  const [collaborator] = await buildCollaboratorSummaries([normalizedEmail]);

  return {
    kind: "success",
    collaborator,
  } as const;
}

export async function removeCollaboratorFromProject(
  projectId: string,
  identity: ProjectIdentity,
  email: string,
) {
  if (!identity.userId) {
    return { kind: "unauthorized" } as const;
  }

  const normalizedEmail = normalizeCollaboratorEmail(email);
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: PROJECT_OWNER_SELECT,
  });

  if (!project) {
    return { kind: "not_found" } as const;
  }

  if (project.ownerId !== identity.userId) {
    return { kind: "forbidden" } as const;
  }

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        email: normalizedEmail,
        projectId,
      },
    },
    select: {
      email: true,
    },
  });

  if (!collaborator) {
    return { kind: "collaborator_not_found" } as const;
  }

  await prisma.projectCollaborator.delete({
    where: {
      projectId_email: {
        email: normalizedEmail,
        projectId,
      },
    },
  });

  return {
    kind: "success",
    email: normalizedEmail,
  } as const;
}

export function parseCollaboratorEmail(payload: unknown): CollaboratorEmailResult {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return {
      error: {
        error: {
          code: "INVALID_REQUEST",
          message: "Request body must be a JSON object.",
        },
      },
      email: null,
    };
  }

  const body = payload as CollaboratorBody;

  if (typeof body.email !== "string") {
    return {
      error: {
        error: {
          code: "INVALID_REQUEST",
          message: "Collaborator email must be a string.",
        },
      },
      email: null,
    };
  }

  const normalizedEmail = normalizeCollaboratorEmail(body.email);

  return {
    error: null,
    email: normalizedEmail,
  };
}

export type { CollaboratorSummary };
