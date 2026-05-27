"use client";

import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import {
  CanvasShape,
  getCanvasShapePadding,
} from "@/components/editor/canvas-shape";
import {
  CANVAS_CONNECTION_DOT_SIZE_PX,
  CANVAS_CONNECTION_GAP_PX,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  SHAPE_MIN_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
} from "@/types/canvas";

const EMPTY_NODE_LABEL_PLACEHOLDER = "Add label";
const HANDLE_POSITIONS = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;
const PX_PER_REM = 16;
const HANDLE_SIZE_REM = CANVAS_CONNECTION_DOT_SIZE_PX / PX_PER_REM;
const HANDLE_OFFSET_REM = CANVAS_CONNECTION_GAP_PX / PX_PER_REM;

function isSameCanvasNodeColor(
  left: CanvasNodeColor,
  right: CanvasNodeColor,
): boolean {
  return left.fill === right.fill && left.text === right.text;
}

function getHandleInset(position: Position): CSSProperties {
  switch (position) {
    case Position.Top:
      return {
        left: `calc(50% - ${HANDLE_SIZE_REM / 2}rem)`,
        top: `-${HANDLE_OFFSET_REM + HANDLE_SIZE_REM / 2}rem`,
      };
    case Position.Right:
      return {
        right: `-${HANDLE_OFFSET_REM + HANDLE_SIZE_REM / 2}rem`,
        top: `calc(50% - ${HANDLE_SIZE_REM / 2}rem)`,
      };
    case Position.Bottom:
      return {
        bottom: `-${HANDLE_OFFSET_REM + HANDLE_SIZE_REM / 2}rem`,
        left: `calc(50% - ${HANDLE_SIZE_REM / 2}rem)`,
      };
    case Position.Left:
    default:
      return {
        left: `-${HANDLE_OFFSET_REM + HANDLE_SIZE_REM / 2}rem`,
        top: `calc(50% - ${HANDLE_SIZE_REM / 2}rem)`,
      };
  }
}

export function CanvasNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredColorKey, setHoveredColorKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const canStartConnection = selected && !isEditing;
  const canEndConnection = !isEditing;
  const minimumSize = SHAPE_MIN_SIZES[data.shape];
  const shapePadding = getCanvasShapePadding(data.shape);
  const isLabelEmpty = data.label.trim().length === 0;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [data.label, isEditing]);

  const labelContent = isEditing ? (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center ${shapePadding}`}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={data.label}
        onBlur={() => setIsEditing(false)}
        onChange={(event) => {
          reactFlow.updateNodeData(id, { label: event.target.value });
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setIsEditing(false);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        aria-label="Node label"
        className="nodrag nopan nowheel max-h-full w-full resize-none overflow-hidden bg-transparent text-center text-sm font-medium leading-6 text-current outline-none"
      />
    </div>
  ) : (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center text-center ${shapePadding}`}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsEditing(true);
      }}
    >
      <span
        className={
          isLabelEmpty
            ? "max-w-full text-sm font-medium leading-6 opacity-60"
            : "max-w-full text-sm font-medium leading-6 break-words"
        }
      >
        {isLabelEmpty ? EMPTY_NODE_LABEL_PLACEHOLDER : data.label}
      </span>
    </div>
  );

  return (
    <div className="group relative h-full w-full">
      <NodeToolbar
        isVisible={selected}
        offset={18}
        position={Position.Top}
        className="nodrag nopan nowheel"
      >
        <div
          className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/95 px-2 py-1.5 shadow-2xl shadow-black/35 backdrop-blur-sm"
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          {NODE_COLORS.map((colorPair) => {
            const colorKey = `${colorPair.fill}-${colorPair.text}`;
            const isActive = isSameCanvasNodeColor(data.color, colorPair);
            const isHovered = hoveredColorKey === colorKey;

            return (
              <button
                key={colorKey}
                type="button"
                aria-label={`Set node color ${colorPair.fill}`}
                aria-pressed={isActive}
                onMouseEnter={() => setHoveredColorKey(colorKey)}
                onMouseLeave={() => setHoveredColorKey((currentKey) =>
                  currentKey === colorKey ? null : currentKey,
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  reactFlow.updateNodeData(id, { color: colorPair });
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="nodrag nopan nowheel flex size-7 items-center justify-center rounded-full border transition-all duration-150"
                style={{
                  backgroundColor: colorPair.fill,
                  borderColor: isActive
                    ? "var(--text-primary)"
                    : "var(--border-subtle)",
                  boxShadow:
                    isActive || isHovered
                      ? `0 0 0 1px ${colorPair.text}, 0 0 10px ${colorPair.text}33`
                      : "0 0 0 0 transparent",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span
                  className="block size-2.5 rounded-full border"
                  style={{
                    backgroundColor: colorPair.text,
                    borderColor: "rgba(8, 8, 9, 0.36)",
                    boxShadow:
                      isActive || isHovered
                        ? `0 0 6px ${colorPair.text}55`
                        : "0 0 0 transparent",
                  }}
                />
              </button>
            );
          })}
        </div>
      </NodeToolbar>
      <NodeResizer
        isVisible={selected && !isEditing}
        minWidth={minimumSize.width}
        minHeight={minimumSize.height}
        keepAspectRatio={data.shape === "circle"}
        color="var(--border-subtle)"
        handleClassName="!h-3 !w-3 shadow-sm shadow-black/50"
        handleStyle={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--accent-primary)",
          borderRadius: "999px",
        }}
        lineStyle={{
          borderColor: "var(--border-subtle)",
        }}
      />
      {HANDLE_POSITIONS.map(({ id: handleId, position }) => (
        <div key={handleId}>
          <Handle
            id={`${handleId}-target`}
            type="target"
            position={position}
            className="canvas-node-handle"
            style={{
              ...getHandleInset(position),
              pointerEvents: isEditing ? "none" : "auto",
              opacity: selected ? 1 : 0,
              transform: selected ? "scale(1)" : "scale(0.9)",
              zIndex: 20,
            }}
            isConnectable={!isEditing}
            isConnectableStart={canStartConnection}
            isConnectableEnd={canEndConnection}
          />
          <Handle
            id={`${handleId}-source`}
            type="source"
            position={position}
            className="canvas-node-handle"
            style={{
              ...getHandleInset(position),
              pointerEvents: isEditing ? "none" : "auto",
              opacity: selected ? 1 : 0,
              transform: selected ? "scale(1)" : "scale(0.9)",
              zIndex: 20,
            }}
            isConnectable={!isEditing}
            isConnectableStart={canStartConnection}
            isConnectableEnd={canEndConnection}
          />
        </div>
      ))}
      <CanvasShape
        color={data.color}
        labelContent={labelContent}
        selected={selected}
        shape={data.shape}
      />
    </div>
  );
}

CanvasNode.displayName = CANVAS_NODE_TYPE;
