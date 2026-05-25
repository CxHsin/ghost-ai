import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLOR_PALETTE = [
  "#00C8D4",
  "#52A8FF",
  "#8B82FF",
  "#BF7AF0",
  "#F75F8F",
  "#FF6166",
  "#FF990A",
  "#62C073",
  "#0AC7B4",
] as const;

const globalForLiveblocks = globalThis as {
  liveblocks?: Liveblocks;
};

interface EnsureLiveblocksProjectRoomOptions {
  roomId: string;
  ownerId: string;
  userId: string;
}

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set.");
  }

  return new Liveblocks({
    secret,
  });
}

export function hasLiveblocksSecret() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  return typeof secret === "string" && secret.trim().length > 0;
}

export function getLiveblocksClient() {
  if (process.env.NODE_ENV === "production") {
    return createLiveblocksClient();
  }

  return globalForLiveblocks.liveblocks ??= createLiveblocksClient();
}

export function getCursorColorForUserId(userId: string) {
  let hash = 0;

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return CURSOR_COLOR_PALETTE[Math.abs(hash) % CURSOR_COLOR_PALETTE.length];
}

export async function ensureLiveblocksProjectRoom({
  roomId,
  ownerId,
  userId,
}: EnsureLiveblocksProjectRoomOptions) {
  const liveblocks = getLiveblocksClient();

  const room = await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
    usersAccesses: {
      [ownerId]: ["room:write"],
      [userId]: ["room:write"],
    },
  });

  const missingUsersAccesses: Record<string, ["room:write"]> = {};

  if (!hasWriteAccess(room.usersAccesses[ownerId])) {
    missingUsersAccesses[ownerId] = ["room:write"];
  }

  if (!hasWriteAccess(room.usersAccesses[userId])) {
    missingUsersAccesses[userId] = ["room:write"];
  }

  if (Object.keys(missingUsersAccesses).length === 0) {
    return room;
  }

  return liveblocks.updateRoom(roomId, {
    usersAccesses: missingUsersAccesses,
  });
}

function hasWriteAccess(access: readonly string[] | undefined) {
  return Array.isArray(access) && access.includes("room:write");
}
