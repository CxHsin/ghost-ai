"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  CANVAS_NODE_OUTER_BOUNDS_PADDING_PX,
  type CanvasNodeShape,
} from "@/types/canvas";

interface CanvasShapeColor {
  fill: string;
  text: string;
}

interface CanvasShapeProps {
  className?: string;
  color: CanvasShapeColor;
  label?: string;
  labelContent?: ReactNode;
  preview?: boolean;
  selected?: boolean;
  shape: CanvasNodeShape;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((segment) => `${segment}${segment}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(value, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(base: string, tint: string, tintAmount: number) {
  const baseRgb = hexToRgb(base);
  const tintRgb = hexToRgb(tint);
  const amount = Math.max(0, Math.min(1, tintAmount));
  const blendChannel = (start: number, end: number) =>
    Math.round(start + (end - start) * amount);

  const r = blendChannel(baseRgb.r, tintRgb.r);
  const g = blendChannel(baseRgb.g, tintRgb.g);
  const b = blendChannel(baseRgb.b, tintRgb.b);

  return `rgb(${r}, ${g}, ${b})`;
}

export function getCanvasShapePadding(shape: CanvasNodeShape): string {
  switch (shape) {
    case "circle":
      return "px-8 py-8";
    case "diamond":
      return "px-9 py-9";
    case "hexagon":
      return "px-8 py-6";
    case "cylinder":
      return "px-7 py-7";
    case "pill":
      return "px-5 py-4";
    case "rectangle":
    default:
      return "px-4 py-3";
  }
}

function CanvasSvgShape({
  fill,
  shape,
  stroke,
}: {
  fill: string;
  shape: Extract<CanvasNodeShape, "diamond" | "hexagon" | "cylinder">;
  stroke: string;
}) {
  if (shape === "diamond") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M50 0 L100 50 L50 100 L0 50 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M25 0 H75 L100 50 L75 100 H25 L0 50 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const cylinderTopFill = mixHex(fill, "#FFFFFF", 0.04);
  const cylinderBottomFill = mixHex(fill, "#000000", 0.12);
  const cylinderBodyHighlight = withAlpha("#FFFFFF", 0.02);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="0"
        y="12"
        width="100"
        height="75"
        rx="2"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="2"
        y="14"
        width="96"
        height="71"
        fill={cylinderBodyHighlight}
        opacity="0.55"
      />
      <ellipse
        cx="50"
        cy="12"
        rx="50"
        ry="12"
        fill={cylinderTopFill}
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy="87"
        rx="50"
        ry="12"
        fill={cylinderBottomFill}
        stroke="none"
      />
      <ellipse
        cx="50"
        cy="87"
        rx="50"
        ry="12"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function CanvasShape({
  className,
  color,
  label,
  labelContent,
  preview = false,
  selected = false,
  shape,
}: CanvasShapeProps) {
  const borderColor = selected ? color.text : "var(--border-subtle)";
  const shapeBoundsStyle = {
    inset: `${CANVAS_NODE_OUTER_BOUNDS_PADDING_PX}px`,
  } as const;

  const sharedLabel = (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center text-center",
        getCanvasShapePadding(shape),
      )}
    >
      <span
        className={cn(
          "max-w-full text-sm font-medium leading-6 break-words",
          preview && "opacity-70",
        )}
      >
        {label?.trim().length ? label : " "}
      </span>
    </div>
  );

  const resolvedLabelContent = labelContent ?? sharedLabel;

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <div
          className={cn(
            "absolute shadow-lg shadow-black/15 transition-colors",
            shape === "rectangle" && "rounded-2xl",
            shape === "pill" && "rounded-[999px]",
            shape === "circle" && "rounded-full",
          )}
          style={{
            ...shapeBoundsStyle,
            backgroundColor: color.fill,
            border: `1px solid ${borderColor}`,
            color: color.text,
            boxShadow: selected
              ? `0 0 0 1px ${withAlpha(color.text, 0.28)}`
              : undefined,
          }}
        >
          {resolvedLabelContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full", className)}
    >
      <div
        className="absolute shadow-lg shadow-black/15 transition-colors"
        style={{
          ...shapeBoundsStyle,
          color: color.text,
          filter: selected
            ? `drop-shadow(0 0 10px ${withAlpha(color.text, 0.15)})`
            : undefined,
        }}
      >
        <CanvasSvgShape
          fill={color.fill}
          shape={shape}
          stroke={borderColor}
        />
        {resolvedLabelContent}
      </div>
    </div>
  );
}
