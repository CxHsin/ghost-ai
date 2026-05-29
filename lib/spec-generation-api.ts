import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import { jsonError } from "@/lib/project-api";
import { generateSpec } from "@/trigger/generate-spec";
import {
  type SpecTriggerRequest,
  specTokenRequestSchema,
  specTriggerRequestSchema,
} from "@/types/tasks";

interface ParsedInputResult<T> {
  error: Response | null;
  input: T | null;
}

export function parseSpecTriggerInput(
  payload: unknown,
): ParsedInputResult<SpecTriggerRequest> {
  const result = specTriggerRequestSchema.safeParse(payload);

  if (!result.success) {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        formatZodIssue(result.error.issues[0]?.message),
      ),
      input: null,
    };
  }

  return {
    error: null,
    input: result.data,
  };
}

export function parseSpecTokenInput(payload: unknown) {
  const result = specTokenRequestSchema.safeParse(payload);

  if (!result.success) {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        formatZodIssue(result.error.issues[0]?.message),
      ),
      input: null,
    };
  }

  return {
    error: null,
    input: result.data,
  };
}

export async function verifySpecTriggerAccess(input: SpecTriggerRequest) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return {
      kind: "unauthorized",
    } as const;
  }

  const project = await getAccessibleProject(input.roomId, identity);

  if (!project) {
    return {
      kind: "project_not_found",
    } as const;
  }

  return {
    kind: "success",
    project,
    userId: identity.userId,
  } as const;
}

export async function createSpecTaskRunRecord(
  userId: string,
  payload: SpecTriggerRequest & { projectId: string },
) {
  const runHandle = await generateSpec.trigger(payload, {
    tags: [`project:${payload.projectId}`, `user:${userId}`, "task:generate-spec"],
    metadata: {
      projectId: payload.projectId,
      roomId: payload.roomId,
      task: generateSpec.id,
      userId,
    },
  });

  await prisma.taskRun.create({
    data: {
      runId: runHandle.id,
      projectId: payload.projectId,
      userId,
    },
  });

  return runHandle.id;
}

export async function findOwnedSpecTaskRun(runId: string, userId: string) {
  return prisma.taskRun.findFirst({
    where: {
      runId,
      userId,
    },
    select: {
      projectId: true,
      runId: true,
      userId: true,
    },
  });
}

export async function createSpecRunPublicToken(runId: string) {
  return triggerAuth.createPublicToken({
    expirationTime: "1h",
    scopes: {
      read: {
        runs: [runId],
      },
    },
  });
}

export function isTaskRunConflictError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function hasTriggerSecretKey() {
  const secretKey = process.env.TRIGGER_SECRET_KEY;

  return typeof secretKey === "string" && secretKey.trim().length > 0;
}

export async function requireSpecTokenUserId() {
  const { userId } = await auth();

  return userId;
}

function formatZodIssue(message: string | undefined) {
  return message && message.trim().length > 0
    ? message
    : "Request body is invalid.";
}
