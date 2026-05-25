"use client";

import { type NodeProps } from "@xyflow/react";

import { CANVAS_NODE_TYPE, type CanvasNode } from "@/types/canvas";

export function CanvasNode({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className="flex min-h-full min-w-full items-center justify-center rounded-2xl border px-4 py-3 text-center shadow-lg shadow-black/15 transition-colors"
      style={{
        backgroundColor: data.color.fill,
        borderColor: selected ? "var(--accent-primary)" : "var(--border-default)",
        color: data.color.text,
      }}
    >
      <span className="text-sm font-medium leading-6">
        {data.label.trim().length > 0 ? data.label : " "}
      </span>
    </div>
  );
}

CanvasNode.displayName = CANVAS_NODE_TYPE;
