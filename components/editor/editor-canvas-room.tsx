"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
  useRoom,
  useStatus,
} from "@liveblocks/react/suspense";
import { useState } from "react";
import { LoaderCircle, WifiOff } from "lucide-react";

import { BaseCanvas } from "@/components/editor/base-canvas";
import { Button } from "@/components/ui/button";
import {
  type CanvasSaveIndicatorState,
  type CanvasSnapshot,
} from "@/types/canvas";

interface EditorCanvasRoomProps {
  isAiSidebarOpen?: boolean;
  onCanvasSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveActionChange?: (action: () => void) => void;
  onSaveStatusChange?: (status: CanvasSaveIndicatorState) => void;
  openTemplatesRequest?: number;
  projectId: string;
}

interface EditorRoomProviderProps {
  children: React.ReactNode;
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

interface CanvasErrorStateProps {
  message: string;
  onRetry: () => void;
}

function CanvasErrorState({ message, onRetry }: CanvasErrorStateProps) {
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
        <Button className="mt-5 rounded-2xl" onClick={onRetry} type="button">
          Retry connection
        </Button>
      </div>
    </div>
  );
}

export function EditorRoomProvider({ children, roomId }: EditorRoomProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          thinking: false,
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export function EditorCanvasRoom({
  isAiSidebarOpen,
  onCanvasSnapshotChange,
  onSaveActionChange,
  onSaveStatusChange,
  openTemplatesRequest,
  projectId,
}: EditorCanvasRoomProps) {
  return (
    <ClientSideSuspense fallback={<CanvasLoadingState />}>
      {() => (
        <CanvasRoomContent
          isAiSidebarOpen={isAiSidebarOpen}
          onCanvasSnapshotChange={onCanvasSnapshotChange}
          onSaveActionChange={onSaveActionChange}
          onSaveStatusChange={onSaveStatusChange}
          openTemplatesRequest={openTemplatesRequest}
          projectId={projectId}
        />
      )}
    </ClientSideSuspense>
  );
}

function CanvasRoomContent({
  isAiSidebarOpen,
  onCanvasSnapshotChange,
  onSaveActionChange,
  onSaveStatusChange,
  openTemplatesRequest,
  projectId,
}: {
  isAiSidebarOpen?: boolean;
  onCanvasSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveActionChange?: (action: () => void) => void;
  onSaveStatusChange?: (status: CanvasSaveIndicatorState) => void;
  openTemplatesRequest?: number;
  projectId: string;
}) {
  const room = useRoom();
  const status = useStatus();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useErrorListener((error) => {
    setErrorMessage(error.message || "Live collaboration is temporarily unavailable.");
  });

  const handleRetry = () => {
    setErrorMessage(null);
    room.reconnect();
  };

  if (errorMessage && status !== "connected") {
    return <CanvasErrorState message={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <BaseCanvas
      isAiSidebarOpen={isAiSidebarOpen}
      onCanvasSnapshotChange={onCanvasSnapshotChange}
      onSaveActionChange={onSaveActionChange}
      onSaveStatusChange={onSaveStatusChange}
      openTemplatesRequest={openTemplatesRequest}
      projectId={projectId}
    />
  );
}
