"use client";

import { Download, LayoutTemplate, X } from "lucide-react";

import {
  type CanvasTemplate,
  CANVAS_TEMPLATES,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type CanvasEdge, type CanvasNode } from "@/types/canvas";

interface StarterTemplatesModalProps {
  onImport: (template: CanvasTemplate) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface Bounds {
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  width: number;
}

const PREVIEW_HEIGHT = 172;
const PREVIEW_PADDING = 22;
const PREVIEW_WIDTH = 296;
const NODE_CORNER_RADIUS = 14;
const PREVIEW_NODE_ALPHA = 0.66;
const PREVIEW_EDGE_ALPHA = 0.22;

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((segment) => `${segment}${segment}`)
          .join("")
      : normalized;
  const parsed = Number.parseInt(value, 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTemplateBounds(nodes: CanvasNode[]): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const width = node.width ?? 0;
    const height = node.height ?? 0;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return {
      minX: 0,
      minY: 0,
      maxX: PREVIEW_WIDTH,
      maxY: PREVIEW_HEIGHT,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
    };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function getScaledNodeFrame(node: CanvasNode, bounds: Bounds) {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  const availableWidth = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const availableHeight = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(
    availableWidth / bounds.width,
    availableHeight / bounds.height,
  );
  const offsetX = (PREVIEW_WIDTH - bounds.width * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - bounds.height * scale) / 2;

  return {
    x: offsetX + (node.position.x - bounds.minX) * scale,
    y: offsetY + (node.position.y - bounds.minY) * scale,
    width: width * scale,
    height: height * scale,
  };
}

function getNodeCenter(node: CanvasNode, bounds: Bounds) {
  const frame = getScaledNodeFrame(node, bounds);

  return {
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
  };
}

function PreviewEdge({
  bounds,
  edge,
  nodeById,
}: {
  bounds: Bounds;
  edge: CanvasEdge;
  nodeById: Map<string, CanvasNode>;
}) {
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const source = getNodeCenter(sourceNode, bounds);
  const target = getNodeCenter(targetNode, bounds);

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={`rgba(240, 240, 244, ${PREVIEW_EDGE_ALPHA})`}
      strokeWidth={1.35}
      strokeLinecap="round"
    />
  );
}

function PreviewNode({
  bounds,
  node,
}: {
  bounds: Bounds;
  node: CanvasNode;
}) {
  const frame = getScaledNodeFrame(node, bounds);
  const { color, shape } = node.data;
  const fill = withAlpha(color.fill, PREVIEW_NODE_ALPHA);
  const stroke = withAlpha(color.text, 0.14);
  const inset = Math.max(4, Math.min(frame.width, frame.height) * 0.08);
  const x = frame.x;
  const y = frame.y;
  const width = frame.width;
  const height = frame.height;

  if (shape === "circle") {
    return (
      <ellipse
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
      />
    );
  }

  if (shape === "pill") {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
      />
    );
  }

  if (shape === "diamond") {
    return (
      <polygon
        points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    );
  }

  if (shape === "hexagon") {
    return (
      <polygon
        points={`${x + width * 0.22},${y} ${x + width * 0.78},${y} ${x + width},${y + height / 2} ${x + width * 0.78},${y + height} ${x + width * 0.22},${y + height} ${x},${y + height / 2}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    );
  }

  if (shape === "cylinder") {
    const topHeight = Math.max(10, height * 0.18);

    return (
      <>
        <rect
          x={x}
          y={y + topHeight / 2}
          width={width}
          height={height - topHeight}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.1}
        />
        <ellipse
          cx={x + width / 2}
          cy={y + topHeight / 2}
          rx={width / 2}
          ry={topHeight / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.1}
        />
        <ellipse
          cx={x + width / 2}
          cy={y + height - topHeight / 2}
          rx={width / 2}
          ry={topHeight / 2}
          fill={fill}
          fillOpacity={0.7}
          stroke={stroke}
          strokeWidth={1.1}
        />
      </>
    );
  }

  return (
    <rect
      x={x + inset * 0.15}
      y={y + inset * 0.1}
      width={Math.max(width - inset * 0.3, 8)}
      height={Math.max(height - inset * 0.2, 8)}
      rx={NODE_CORNER_RADIUS}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.1}
    />
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getTemplateBounds(template.nodes);
  const nodeById = new Map(template.nodes.map((node) => [node.id, node]));

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-surface-border bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <svg
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
        className="aspect-[1.72] w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`template-grid-${template.id}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.1" fill="rgba(80, 80, 96, 0.28)" />
          </pattern>
          <radialGradient id={`template-glow-${template.id}`} cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="rgba(100, 87, 249, 0.14)" />
            <stop offset="55%" stopColor="rgba(0, 200, 212, 0.06)" />
            <stop offset="100%" stopColor="rgba(8, 8, 9, 0)" />
          </radialGradient>
        </defs>
        <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#080809" />
        <rect
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          fill={`url(#template-grid-${template.id})`}
        />
        <rect
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          fill={`url(#template-glow-${template.id})`}
        />
        {template.edges.map((edge) => (
          <PreviewEdge
            key={edge.id}
            bounds={bounds}
            edge={edge}
            nodeById={nodeById}
          />
        ))}
        {template.nodes.map((node) => (
          <PreviewNode key={node.id} bounds={bounds} node={node} />
        ))}
      </svg>
    </div>
  );
}

export function StarterTemplatesModal({
  onImport,
  onOpenChange,
  open,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[47%] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[2rem] border border-surface-border bg-surface p-0 text-copy-primary shadow-[0_32px_120px_rgba(0,0,0,0.46)] sm:max-w-[76rem]"
      >
        <div className="relative px-7 pb-5 pt-7 sm:px-10 sm:pb-6 sm:pt-8">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute right-5 top-5 rounded-full border border-surface-border bg-transparent text-copy-muted hover:border-surface-border-subtle hover:bg-subtle/50 hover:text-copy-primary sm:right-8 sm:top-6"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>

          <DialogHeader className="max-w-[58rem] gap-3">
            <DialogTitle className="flex items-center gap-3 text-[2.2rem] font-semibold tracking-[-0.035em] text-copy-primary sm:text-[2.4rem]">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-accent-dim text-brand">
                <LayoutTemplate className="h-5 w-5" />
              </span>
              Import Template
            </DialogTitle>
            <DialogDescription className="max-w-[52rem] !text-copy-secondary text-[1.02rem] leading-8 sm:text-[1.06rem]">
              Choose a starter template to pre-populate your canvas. Any existing
              nodes will be replaced
              <span className="mx-2 inline-flex items-center rounded-lg border border-surface-border bg-base/70 px-2 py-0.5 text-[0.86rem] leading-none text-copy-secondary align-middle">
                ⌘Z
              </span>
              to undo.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-t border-surface-border/80 px-7 pb-7 pt-6 sm:px-10 sm:pb-9 sm:pt-7">
          <ScrollArea className="max-h-[70vh] pr-1">
            <div className="grid gap-5 pb-1 md:grid-cols-2 xl:grid-cols-3">
              {CANVAS_TEMPLATES.map((template) => (
                <section
                  key={template.id}
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-surface-border bg-[#131318]",
                    "shadow-[0_18px_44px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.02)]",
                  )}
                >
                  <div className="px-0 pt-0">
                    <TemplatePreview template={template} />
                  </div>

                  <div className="flex flex-1 flex-col border-t border-surface-border px-6 pb-5 pt-5">
                    <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-copy-primary">
                      {template.name}
                    </h3>
                    <p className="mt-3 min-h-28 text-[0.98rem] leading-8 text-copy-secondary">
                      {template.description}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className={cn(
                        "mt-4 h-12 rounded-2xl border-surface-border bg-transparent text-copy-primary",
                        "hover:border-surface-border-subtle hover:bg-subtle/55",
                      )}
                      onClick={() => handleImport(template)}
                    >
                      <Download className="h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
