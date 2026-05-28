"use client";

import { useAuth } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

const MAX_VISIBLE_COLLABORATORS = 5;

interface PresenceParticipant {
  connectionId: number;
  info: {
    avatar?: string;
    color?: string;
    id?: string;
    name?: string;
  };
  presence: {
    cursor: {
      x: number;
      y: number;
    } | null;
  };
}

function getParticipantName(participant: PresenceParticipant) {
  const trimmedName = participant.info.name?.trim();

  return trimmedName && trimmedName.length > 0 ? trimmedName : "Ghost User";
}

function getParticipantInitials(participant: PresenceParticipant) {
  const parts = getParticipantName(participant).split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return getParticipantName(participant).slice(0, 2).toUpperCase();
}

function CollaboratorAvatar({ participant }: { participant: PresenceParticipant }) {
  const label = getParticipantName(participant);
  const avatarUrl = participant.info.avatar?.trim();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={label}
        className="size-9 rounded-full object-cover ring-2 ring-base/85"
      />
    );
  }

  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold text-copy-primary ring-2 ring-base/85">
      {getParticipantInitials(participant)}
    </div>
  );
}

function CollaboratorOverflowChip({ count }: { count: number }) {
  return (
    <div className="ml-[-0.75rem] flex size-9 items-center justify-center rounded-full border border-surface-border bg-surface text-[11px] font-semibold text-copy-secondary ring-2 ring-base/85">
      +{count}
    </div>
  );
}

function LiveCursor({ participant }: { participant: PresenceParticipant }) {
  if (!participant.presence.cursor) {
    return null;
  }

  const color = participant.info.color?.trim() || "var(--accent-primary)";

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${participant.presence.cursor.x}px, ${participant.presence.cursor.y}px)`,
      }}
    >
      <div className="relative">
        <svg
          width="18"
          height="22"
          viewBox="0 0 18 22"
          fill="none"
          aria-hidden="true"
          className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.38)]"
        >
          <path
            d="M3 2L14.5 10.5L8.75 11.75L11.5 19.5L8.5 20.5L5.75 12.75L2 17V2Z"
            fill={color}
            stroke="rgba(8, 8, 9, 0.92)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="absolute left-4 top-0 max-w-40 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg shadow-black/30"
          style={{ backgroundColor: color }}
        >
          {getParticipantName(participant)}
        </div>
      </div>
    </div>
  );
}

interface CanvasPresenceOverlayProps {
  showPresenceBadge?: boolean;
}

export function CanvasPresenceOverlay({
  showPresenceBadge = true,
}: CanvasPresenceOverlayProps) {
  const { userId } = useAuth();
  const others = useOthers() as readonly PresenceParticipant[];
  const collaborators = others.filter((participant) => participant.info.id !== userId);
  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS);
  const overflowCount = collaborators.length - visibleCollaborators.length;

  return (
    <>
      {showPresenceBadge ? (
        <div className="pointer-events-none absolute right-4 top-4 z-20">
          {visibleCollaborators.length > 0 ? (
            <div className="flex items-center rounded-full border border-surface-border bg-surface/92 px-2 py-2 shadow-2xl shadow-black/30 backdrop-blur-sm">
              <div className="flex items-center">
                {visibleCollaborators.map((participant, index) => (
                  <div
                    key={participant.connectionId}
                    className={index === 0 ? "" : "ml-[-0.75rem]"}
                  >
                    <CollaboratorAvatar participant={participant} />
                  </div>
                ))}
                {overflowCount > 0 ? (
                  <CollaboratorOverflowChip count={overflowCount} />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {collaborators.map((participant) => (
          <LiveCursor
            key={participant.connectionId}
            participant={participant}
          />
        ))}
      </div>
    </>
  );
}
