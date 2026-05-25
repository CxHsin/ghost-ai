"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense";
import { useState } from "react";
import { LoaderCircle, WifiOff } from "lucide-react";

import { BaseCanvas } from "@/components/editor/base-canvas";

interface EditorCanvasRoomProps {
  roomId: string;
}

function CanvasLoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/90 px-4 py-3 text-sm text-copy-secondary">
        <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
        Connecting to the shared canvas...
      </div>
    </div>
  );
}

function CanvasErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-6">
      <div className="max-w-md rounded-3xl border border-state-error/40 bg-surface/95 p-6 text-center shadow-xl shadow-black/25">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-state-error/10 text-state-error">
          <WifiOff className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-copy-primary">
          Canvas connection failed
        </h2>
        <p className="mt-2 text-sm leading-7 text-copy-muted">{message}</p>
      </div>
    </div>
  );
}

function CanvasRoomContent() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useErrorListener((error) => {
    setErrorMessage(error.message || "Live collaboration is temporarily unavailable.");
  });

  if (errorMessage) {
    return <CanvasErrorState message={errorMessage} />;
  }

  return <BaseCanvas />;
}

export function EditorCanvasRoom({ roomId }: EditorCanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <ClientSideSuspense fallback={<CanvasLoadingState />}>
          {() => <CanvasRoomContent />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
