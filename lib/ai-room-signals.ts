import { LiveblocksError } from "@liveblocks/node";

import { getLiveblocksClient } from "@/lib/liveblocks";
import {
  AI_STATUS_FEED_ID,
  GHOST_AI_USER_COLOR,
  GHOST_AI_USER_ID,
  GHOST_AI_USER_NAME,
  aiStatusMessageSchema,
  type AiStatusMessage,
} from "@/types/tasks";

interface GhostAiPresenceState {
  cursor: {
    x: number;
    y: number;
  } | null;
  thinking: boolean;
}

const GHOST_AI_PRESENCE_TTL_SECONDS = 30;

export async function publishAiStatusMessage(
  roomId: string,
  message: Omit<AiStatusMessage, "kind" | "timestamp"> & {
    timestamp?: number;
  },
) {
  const liveblocks = getLiveblocksClient();
  const payload = aiStatusMessageSchema.parse({
    ...message,
    kind: "status",
    timestamp: message.timestamp ?? Date.now(),
  });

  await ensureFeed(roomId, AI_STATUS_FEED_ID);
  await liveblocks.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    data: payload,
  });
}

export async function setGhostAiPresence(
  roomId: string,
  state: GhostAiPresenceState,
) {
  const liveblocks = getLiveblocksClient();

  await liveblocks.setPresence(roomId, {
    userId: GHOST_AI_USER_ID,
    data: {
      cursor: state.cursor,
      thinking: state.thinking,
    },
    ttl: GHOST_AI_PRESENCE_TTL_SECONDS,
    userInfo: {
      color: GHOST_AI_USER_COLOR,
      name: GHOST_AI_USER_NAME,
    },
  });
}

export async function clearGhostAiPresence(roomId: string) {
  await setGhostAiPresence(roomId, {
    cursor: null,
    thinking: false,
  });
}

async function ensureFeed(roomId: string, feedId: string) {
  const liveblocks = getLiveblocksClient();

  try {
    await liveblocks.createFeed({
      roomId,
      feedId,
    });
  } catch (error) {
    if (isLiveblocksConflictError(error)) {
      return;
    }

    throw error;
  }
}

function isLiveblocksConflictError(error: unknown) {
  return error instanceof LiveblocksError && error.status === 409;
}
