import {
  ensureLiveblocksProjectRoom,
  getLiveblocksClient,
  getCursorColorForUserId,
  hasLiveblocksSecret,
} from "@/lib/liveblocks";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import { jsonError, readProjectBody } from "@/lib/project-api";

export const runtime = "nodejs";

interface LiveblocksAuthBody {
  room?: unknown;
}

export async function POST(request: Request) {
  try {
    if (!hasLiveblocksSecret()) {
      return jsonError(
        500,
        "LIVEBLOCKS_NOT_CONFIGURED",
        "LIVEBLOCKS_SECRET_KEY is not set on the server.",
      );
    }

    const identity = await getCurrentProjectIdentity();

    if (!identity.userId) {
      return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const payload = await readProjectBody(request);

    if (payload === null) {
      return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }

    const roomId = parseRequestedRoomId(payload);

    if (!roomId) {
      return jsonError(
        400,
        "INVALID_REQUEST",
        "Request body must include a room string.",
      );
    }

    const project = await getAccessibleProject(roomId, identity);

    if (!project) {
      return jsonError(
        403,
        "FORBIDDEN",
        "You do not have access to this project room.",
      );
    }

    await ensureLiveblocksProjectRoom({
      roomId: project.id,
      ownerId: project.ownerId,
      userId: identity.userId,
    });

    const session = getLiveblocksClient().prepareSession(identity.userId, {
      userInfo: {
        name: identity.displayName ?? identity.primaryEmail ?? "Ghost User",
        avatar: identity.avatarUrl ?? "",
        color: getCursorColorForUserId(identity.userId),
      },
    });

    session.allow(project.id, session.FULL_ACCESS);

    const { body, error, status } = await session.authorize();

    if (error) {
      console.error("Liveblocks session authorization failed.", error);

      return jsonError(
        status || 500,
        "LIVEBLOCKS_AUTH_FAILED",
        error.message || "Liveblocks session authorization failed.",
      );
    }

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected Liveblocks auth route failure.", error);

    return jsonError(
      500,
      "LIVEBLOCKS_AUTH_ROUTE_ERROR",
      error instanceof Error ? error.message : "Unexpected Liveblocks auth error.",
    );
  }
}

function parseRequestedRoomId(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload) ||
    !("room" in payload)
  ) {
    return null;
  }

  const room = (payload as LiveblocksAuthBody).room;

  if (typeof room !== "string") {
    return null;
  }

  const trimmedRoomId = room.trim();

  return trimmedRoomId.length > 0 ? trimmedRoomId : null;
}
