import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";

import { Prisma } from "@/app/generated/prisma/client";
import { ensureLiveblocksProjectRoom } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import { jsonError } from "@/lib/project-api";
import {
  DesignAgentPayload,
  designAgentTask,
} from "@/trigger/design-agent";

interface DesignRequestBody {
  projectId?: unknown;
  prompt?: unknown;
  runId?: unknown;
  roomId?: unknown;
}

interface DesignTriggerInput {
  projectId: string;
  prompt: string;
  roomId: string;
}

interface DesignTokenInput {
  runId: string;
}

interface ParsedInputResult<T> {
  error: Response | null;
  input: T | null;
}

const DESIGN_TASK_ID = designAgentTask.id;

function isDesignRequestBody(payload: unknown): payload is DesignRequestBody {
  return (
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
  );
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
): ParsedInputResult<string> {
  if (typeof value !== "string") {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        `${fieldName} must be a string.`,
      ),
      input: null,
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        `${fieldName} cannot be empty.`,
      ),
      input: null,
    };
  }

  return {
    error: null,
    input: trimmedValue,
  };
}

export function parseDesignTriggerInput(
  payload: unknown,
): ParsedInputResult<DesignTriggerInput> {
  if (!isDesignRequestBody(payload)) {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        "Request body must be a JSON object.",
      ),
      input: null,
    };
  }

  const promptResult = parseRequiredString(payload.prompt, "Prompt");

  if (promptResult.error || !promptResult.input) {
    return {
      error: promptResult.error,
      input: null,
    };
  }

  const roomIdResult = parseRequiredString(payload.roomId, "Room ID");

  if (roomIdResult.error || !roomIdResult.input) {
    return {
      error: roomIdResult.error,
      input: null,
    };
  }

  const projectIdResult = parseRequiredString(payload.projectId, "Project ID");

  if (projectIdResult.error || !projectIdResult.input) {
    return {
      error: projectIdResult.error,
      input: null,
    };
  }

  return {
    error: null,
    input: {
      prompt: promptResult.input,
      roomId: roomIdResult.input,
      projectId: projectIdResult.input,
    },
  };
}

export function parseDesignTokenInput(
  payload: unknown,
): ParsedInputResult<DesignTokenInput> {
  if (!isDesignRequestBody(payload)) {
    return {
      error: jsonError(
        400,
        "INVALID_REQUEST",
        "Request body must be a JSON object.",
      ),
      input: null,
    };
  }

  const runIdResult = parseRequiredString(payload.runId, "Run ID");

  if (runIdResult.error || !runIdResult.input) {
    return {
      error: runIdResult.error,
      input: null,
    };
  }

  return {
    error: null,
    input: {
      runId: runIdResult.input,
    },
  };
}

export async function verifyDesignTriggerAccess(input: DesignTriggerInput) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return {
      kind: "unauthorized",
    } as const;
  }

  const project = await getAccessibleProject(input.projectId, identity);

  if (!project) {
    return {
      kind: "project_not_found",
    } as const;
  }

  if (project.id !== input.roomId) {
    return {
      kind: "room_mismatch",
      projectId: project.id,
      roomId: input.roomId,
    } as const;
  }

  return {
    kind: "success",
    project,
    userId: identity.userId,
  } as const;
}

export async function createDesignTaskRunRecord(
  userId: string,
  payload: DesignAgentPayload,
) {
  const runHandle = await designAgentTask.trigger(payload, {
    tags: [`project:${payload.projectId ?? payload.roomId}`, `user:${userId}`],
    metadata: {
      projectId: payload.projectId ?? payload.roomId,
      roomId: payload.roomId,
      userId,
    },
  });

  await prisma.taskRun.create({
    data: {
      runId: runHandle.id,
      projectId: payload.projectId ?? payload.roomId,
      userId,
    },
  });

  return runHandle.id;
}

export async function ensureDesignTaskRoom(
  ownerId: string,
  roomId: string,
  userId: string,
) {
  await ensureLiveblocksProjectRoom({
    roomId,
    ownerId,
    userId,
  });
}

export async function findOwnedTaskRun(runId: string, userId: string) {
  return prisma.taskRun.findFirst({
    where: {
      runId,
      userId,
    },
    select: {
      runId: true,
      projectId: true,
      userId: true,
    },
  });
}

export async function createDesignRunPublicToken(runId: string) {
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

export async function requireDesignTokenUserId() {
  const { userId } = await auth();

  return userId;
}

export { DESIGN_TASK_ID };
