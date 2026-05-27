"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const VIEWPORT_ANIMATION_DURATION_MS = 180;

interface UseKeyboardShortcutsOptions {
  onRedo: () => void;
  onUndo: () => void;
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.closest('[contenteditable="true"]') !== null
  );
}

export function useKeyboardShortcuts({
  onRedo,
  onUndo,
  reactFlow,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const hasModifier = event.metaKey || event.ctrlKey;

      if (hasModifier && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          onRedo();
          return;
        }

        onUndo();
        return;
      }

      if (hasModifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION_MS });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION_MS });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRedo, onUndo, reactFlow]);
}
