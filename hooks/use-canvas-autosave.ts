"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createCanvasSnapshot } from "@/lib/canvas-snapshot";
import {
  type CanvasEdge,
  type CanvasSaveIndicatorState,
  type CanvasNode,
} from "@/types/canvas";

const AUTOSAVE_DEBOUNCE_MS = 1200;
const SAVE_REQUEST_TIMEOUT_MS = 12_000;

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

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ErrorResponseBody | null;

  return payload?.error?.message ?? fallbackMessage;
}

function createSnapshotSignature(nodes: CanvasNode[], edges: CanvasEdge[]) {
  const snapshot = createCanvasSnapshot(nodes, edges);
  const stableSnapshot = {
    nodes: [...snapshot.nodes].sort((left, right) => left.id.localeCompare(right.id)),
    edges: [...snapshot.edges].sort((left, right) => left.id.localeCompare(right.id)),
  };

  return JSON.stringify(stableSnapshot);
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
  const inFlightSnapshotRef = useRef<string | null>(null);
  const latestEdgesRef = useRef(edges);
  const latestNodesRef = useRef(nodes);
  const activeSaveRequestIdRef = useRef(0);

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

  const snapshotSignature = createSnapshotSignature(nodes, edges);

  const saveSnapshot = useCallback(
    async (serializedSnapshot: string, signal?: AbortSignal) => {
      if (inFlightSnapshotRef.current === serializedSnapshot) {
        return;
      }

      const saveRequestId = activeSaveRequestIdRef.current + 1;
      activeSaveRequestIdRef.current = saveRequestId;
      inFlightSnapshotRef.current = serializedSnapshot;
      clearStatusResetTimeout();
      setSaveStatus("saving");
      const requestAbortController = new AbortController();
      let didTimeout = false;
      let removeAbortListener: (() => void) | null = null;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        requestAbortController.abort();
      }, SAVE_REQUEST_TIMEOUT_MS);

      if (signal) {
        const handleAbort = () => {
          requestAbortController.abort();
        };

        if (signal.aborted) {
          handleAbort();
        } else {
          signal.addEventListener("abort", handleAbort, { once: true });
          removeAbortListener = () => {
            signal.removeEventListener("abort", handleAbort);
          };
        }
      }

      let response: Response;

      try {
        response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          signal: requestAbortController.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: serializedSnapshot,
          cache: "no-store",
        });
      } catch (error) {
        window.clearTimeout(timeoutId);
        removeAbortListener?.();
        if (inFlightSnapshotRef.current === serializedSnapshot) {
          inFlightSnapshotRef.current = null;
        }

        if (didTimeout) {
          throw new Error("Saving canvas changes timed out.");
        }

        if (
          isAbortError(error) &&
          isMountedRef.current &&
          activeSaveRequestIdRef.current === saveRequestId
        ) {
          setSaveStatus("idle");
        }

        throw error;
      }

      window.clearTimeout(timeoutId);
      removeAbortListener?.();

      if (!response.ok) {
        if (inFlightSnapshotRef.current === serializedSnapshot) {
          inFlightSnapshotRef.current = null;
        }

        throw new Error(
          await readErrorMessage(response, "Failed to save canvas changes."),
        );
      }

      if (
        !isMountedRef.current ||
        signal?.aborted ||
        activeSaveRequestIdRef.current !== saveRequestId
      ) {
        if (inFlightSnapshotRef.current === serializedSnapshot) {
          inFlightSnapshotRef.current = null;
        }

        return;
      }

      inFlightSnapshotRef.current = null;
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
      inFlightSnapshotRef.current = null;
      clearStatusResetTimeout();
      queueMicrotask(() => {
        if (isMountedRef.current) {
          setSaveStatus("idle");
        }
      });
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (treatInitialSnapshotAsSaved) {
        lastSavedSnapshotRef.current = snapshotSignature;
        return;
      }
    }

    if (lastSavedSnapshotRef.current === snapshotSignature) {
      return;
    }

    if (inFlightSnapshotRef.current === snapshotSignature) {
      return;
    }

    const abortController = new AbortController();
    const saveTimeout = window.setTimeout(async () => {
      try {
        await saveSnapshot(snapshotSignature, abortController.signal);
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
    enabled,
    saveSnapshot,
    scheduleStatusReset,
    snapshotSignature,
    treatInitialSnapshotAsSaved,
  ]);

  return {
    saveStatus: enabled ? saveStatus : "idle",
    triggerSave,
  };
}
