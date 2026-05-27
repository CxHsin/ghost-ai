"use client";

import { Redo2, Undo2, ZoomIn, ZoomOut, ScanSearch } from "lucide-react";

interface CanvasControlsProps {
  canRedo: boolean;
  canUndo: boolean;
  onFitView: () => void;
  onRedo: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

interface ControlButtonProps {
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ControlButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full text-copy-secondary transition hover:bg-subtle hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-copy-secondary"
    >
      {children}
    </button>
  );
}

export function CanvasControls({
  canRedo,
  canUndo,
  onFitView,
  onRedo,
  onUndo,
  onZoomIn,
  onZoomOut,
}: CanvasControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/92 px-2 py-2 shadow-2xl shadow-black/35 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <ControlButton ariaLabel="Zoom out" onClick={onZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </ControlButton>
          <ControlButton ariaLabel="Fit view" onClick={onFitView}>
            <ScanSearch className="h-4 w-4" />
          </ControlButton>
          <ControlButton ariaLabel="Zoom in" onClick={onZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </ControlButton>
        </div>
        <div className="h-6 w-px bg-border-default" />
        <div className="flex items-center gap-1">
          <ControlButton
            ariaLabel="Undo"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 className="h-4 w-4" />
          </ControlButton>
          <ControlButton
            ariaLabel="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 className="h-4 w-4" />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
