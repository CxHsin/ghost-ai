"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  CANVAS_CONNECTION_DOT_SIZE_PX,
  CANVAS_EDGE_TYPE,
  EMPTY_CANVAS_EDGE_LABEL_HINT,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const EDGE_ENDPOINT_OFFSET = CANVAS_CONNECTION_DOT_SIZE_PX / 2;
const EDGE_HIT_STROKE_WIDTH = 18;
const EDGE_REST_STROKE = "rgba(240, 240, 244, 0.52)";
const EDGE_ACTIVE_STROKE = "rgba(240, 240, 244, 0.92)";
const EDGE_LABEL_MIN_WIDTH_PX = 40;
const EDGE_LABEL_HORIZONTAL_PADDING_PX = 18;

function offsetCoordinate(
  x: number,
  y: number,
  position: Position,
): { x: number; y: number } {
  switch (position) {
    case Position.Top:
      return { x, y: y - EDGE_ENDPOINT_OFFSET };
    case Position.Right:
      return { x: x + EDGE_ENDPOINT_OFFSET, y };
    case Position.Bottom:
      return { x, y: y + EDGE_ENDPOINT_OFFSET };
    case Position.Left:
    default:
      return { x: x - EDGE_ENDPOINT_OFFSET, y };
  }
}

export function CanvasEdge({
  data,
  id,
  markerEnd,
  selected,
  sourcePosition = Position.Bottom,
  sourceX,
  sourceY,
  style,
  targetPosition = Position.Top,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const measureRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelWidth, setLabelWidth] = useState(EDGE_LABEL_MIN_WIDTH_PX);
  const label = data?.label ?? "";
  const isActive = selected || isHovered || isEditing;
  const shouldShowEmptyHint = isActive && !isEditing && label.trim().length === 0;

  const source = offsetCoordinate(sourceX, sourceY, sourcePosition);
  const target = offsetCoordinate(targetX, targetY, targetPosition);
  const [path, labelX, labelY] = getSmoothStepPath({
    sourcePosition,
    sourceX: source.x,
    sourceY: source.y,
    targetPosition,
    targetX: target.x,
    targetY: target.y,
  });

  const edgeStyle = useMemo(
    () => ({
      ...style,
      stroke: isActive ? EDGE_ACTIVE_STROKE : EDGE_REST_STROKE,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      strokeWidth: isActive ? 1.8 : 1.5,
      transition:
        "stroke 140ms ease, stroke-width 140ms ease, opacity 140ms ease",
    }),
    [isActive, style],
  );

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [isEditing]);

  useLayoutEffect(() => {
    const measure = measureRef.current;

    if (!measure) {
      return;
    }

    const nextWidth = Math.max(
      EDGE_LABEL_MIN_WIDTH_PX,
      Math.ceil(measure.getBoundingClientRect().width) +
        EDGE_LABEL_HORIZONTAL_PADDING_PX,
    );

    setLabelWidth(nextWidth);
  }, [isEditing, label]);

  const stopInteraction = (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={edgeStyle} />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={EDGE_HIT_STROKE_WIDTH}
        className="react-flow__edge-interaction"
        onDoubleClick={(event) => {
          stopInteraction(event);
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute left-0 top-0 z-20"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <span
            ref={measureRef}
            className="invisible absolute whitespace-pre px-2 py-1 text-xs font-medium"
          >
            {label || EMPTY_CANVAS_EDGE_LABEL_HINT}
          </span>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={label}
              aria-label="Edge label"
              style={{ width: labelWidth }}
              onBlur={() => setIsEditing(false)}
              onChange={(event) => {
                reactFlow.updateEdgeData(id, { label: event.target.value });
              }}
              onClick={stopInteraction}
              onDoubleClick={stopInteraction}
              onMouseDown={stopInteraction}
              onPointerDown={stopInteraction}
              onWheel={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  stopInteraction(event);
                  setIsEditing(false);
                }
              }}
              className="pointer-events-auto nodrag nopan nowheel rounded-full border border-surface-border bg-elevated/95 px-2.5 py-1 text-center text-xs font-medium text-copy-primary shadow-lg shadow-black/35 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/50"
            />
          ) : label.trim().length > 0 || shouldShowEmptyHint ? (
            <button
              type="button"
              onClick={stopInteraction}
              onDoubleClick={(event) => {
                stopInteraction(event);
                setIsEditing(true);
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " " ||
                  event.key === "F2"
                ) {
                  stopInteraction(event);
                  setIsEditing(true);
                }
              }}
              onMouseDown={stopInteraction}
              onPointerDown={stopInteraction}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="pointer-events-auto nodrag nopan nowheel inline-flex min-h-7 items-center justify-center rounded-full border border-surface-border bg-surface/92 px-2.5 py-1 text-xs font-medium shadow-lg shadow-black/35 transition"
              style={{
                color: shouldShowEmptyHint
                  ? "var(--text-muted)"
                  : "var(--text-primary)",
                opacity: shouldShowEmptyHint ? 0.88 : 1,
              }}
            >
              {label.trim().length > 0 ? label : EMPTY_CANVAS_EDGE_LABEL_HINT}
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

CanvasEdge.displayName = CANVAS_EDGE_TYPE;
