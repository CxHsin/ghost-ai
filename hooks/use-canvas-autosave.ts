"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createCanvasSnapshot } from "@/lib/canvas-snapshot";
import {
  type CanvasEdge,
  type CanvasSaveIndicatorState,
  type CanvasNode,
} from "@/types/canvas";

const AUTOSAVE_DEBOUNCE_MS = 1200;

interface UseCanvasAutosaveOptions {
  enabled: boolean;
  edges: CanvasEdge[];
  nodes: CanvasNode[];
  projectId: string;
  treatInitialSnapshotAsSaved?: boolean;
}

interface ErrorResponseBody {
  error?: {
    message?: string;
  };
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ErrorResponseBody | null;

  return payload?.error?.message ?? fallbackMessage;
}

function createSnapshotSignature(nodes: CanvasNode[], edges: CanvasEdge[]) {
  return JSON.stringify(createCanvasSnapshot(nodes, edges));
}

export function useCanvasAutosave({
  enabled,
  edges,
  nodes,
  projectId,
  treatInitialSnapshotAsSaved = false,
}: UseCanvasAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<CanvasSaveIndicatorState>("idle");
  const hasInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const resetStatusTimeoutRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const latestEdgesRef = useRef(edges);
  const latestNodesRef = useRef(nodes);

  const clearStatusResetTimeout = useCallback(() => {
    if (resetStatusTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(resetStatusTimeoutRef.current);
    resetStatusTimeoutRef.current = null;
  }, []);

  const scheduleStatusReset = useCallback(
    (nextStatus: Extract<CanvasSaveIndicatorState, "saved" | "error">) => {
      clearStatusResetTimeout();
      setSaveStatus(nextStatus);
      resetStatusTimeoutRef.current = window.setTimeout(() => {
        resetStatusTimeoutRef.current = null;
        if (isMountedRef.current) {
          setSaveStatus("idle");
        }
      }, 1400);
    },
    [clearStatusResetTimeout],
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearStatusResetTimeout();
    };
  }, [clearStatusResetTimeout]);

  useEffect(() => {
    latestNodesRef.current = nodes;
    latestEdgesRef.current = edges;
  }, [edges, nodes]);

  const saveSnapshot = useCallback(
    async (serializedSnapshot: string) => {
      clearStatusResetTimeout();
      setSaveStatus("saving");

      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: serializedSnapshot,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to save canvas changes."),
        );
      }

      lastSavedSnapshotRef.current = serializedSnapshot;
      scheduleStatusReset("saved");
    },
    [clearStatusResetTimeout, projectId, scheduleStatusReset],
  );

  const triggerSave = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const serializedSnapshot = createSnapshotSignature(
      latestNodesRef.current,
      latestEdgesRef.current,
    );

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      scheduleStatusReset("saved");
      return;
    }

    try {
      await saveSnapshot(serializedSnapshot);
    } catch {
      if (isMountedRef.current) {
        scheduleStatusReset("error");
      }
    }
  }, [enabled, saveSnapshot, scheduleStatusReset]);

  useEffect(() => {
    if (!enabled) {
      hasInitializedRef.current = false;
      lastSavedSnapshotRef.current = null;
      clearStatusResetTimeout();
      return;
    }

    const serializedSnapshot = createSnapshotSignature(nodes, edges);

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (treatInitialSnapshotAsSaved) {
        lastSavedSnapshotRef.current = serializedSnapshot;
        return;
      }
    }

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      return;
    }

    const abortController = new AbortController();
    const saveTimeout = window.setTimeout(async () => {
      try {
        await saveSnapshot(serializedSnapshot);
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        if (isMountedRef.current) {
          scheduleStatusReset("error");
        }
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(saveTimeout);
    };
  }, [
    clearStatusResetTimeout,
    edges,
    enabled,
    nodes,
    saveSnapshot,
    scheduleStatusReset,
    treatInitialSnapshotAsSaved,
  ]);

  return {
    saveStatus: enabled ? saveStatus : "idle",
    triggerSave,
  };
}
