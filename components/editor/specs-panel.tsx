"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  Download,
  FileText,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type CanvasSnapshot } from "@/types/canvas";
import { type AiChatMessage } from "@/types/tasks";

interface SpecsPanelProps {
  canvasSnapshot: CanvasSnapshot;
  chatHistory: AiChatMessage[];
  projectId: string;
  roomId: string;
}

interface ProjectSpecListItem {
  createdAt: string;
  filename: string;
  id: string;
}

interface ProjectSpecsResponse {
  specs?: ProjectSpecListItem[];
}

interface SpecTriggerResponse {
  runId: string;
}

interface SpecTokenResponse {
  runId: string;
  token: string;
}

interface ActiveSpecRun {
  publicToken: string;
  runId: string;
}

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

interface ObservedRunShape {
  error?: {
    message?: string;
  };
  isCompleted: boolean;
  isSuccess: boolean;
  metadata?: Record<string, unknown>;
}

type AsyncStatus = "error" | "idle" | "loading" | "success";

const specDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SpecsPanel({
  canvasSnapshot,
  chatHistory,
  projectId,
  roomId,
}: SpecsPanelProps) {
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([]);
  const [listStatus, setListStatus] = useState<AsyncStatus>("loading");
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [activeSpecRun, setActiveSpecRun] = useState<ActiveSpecRun | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecListItem | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<AsyncStatus>("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const { error: realtimeRunError, run: realtimeRun } = useRealtimeRun(
    activeSpecRun?.runId,
    {
      accessToken: activeSpecRun?.publicToken,
      enabled: Boolean(activeSpecRun?.runId && activeSpecRun?.publicToken),
      stopOnCompletion: true,
    },
  );
  const isGeneratingSpec =
    isStartingGeneration ||
    (activeSpecRun !== null &&
      (realtimeRun === undefined || !realtimeRun.isCompleted));
  const canGenerateSpec =
    !isGeneratingSpec &&
    canvasSnapshot.nodes.length > 0;

  useEffect(() => {
    const abortController = new AbortController();

    fetch(getSpecsListUrl(projectId), {
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { data?: ProjectSpecsResponse }
          | { error?: { message?: string } }
          | null;

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload && payload.error?.message
              ? payload.error.message
              : `Unable to load generated specs. HTTP ${response.status}.`,
          );
        }

        const nextSpecs =
          payload && "data" in payload && Array.isArray(payload.data?.specs)
            ? payload.data.specs
            : [];

        setSpecs(nextSpecs);
        setListStatus("success");
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSpecs([]);
        setListError(getErrorMessage(error) ?? "Unable to load generated specs.");
        setListStatus("error");
      });

    return () => {
      abortController.abort();
    };
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (!previewOpen || !selectedSpec) {
      return;
    }

    const abortController = new AbortController();

    fetch(getSpecDownloadUrl(projectId, selectedSpec.id), {
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getFetchErrorMessage(response));
        }

        setPreviewMarkdown(await response.text());
        setPreviewStatus("success");
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPreviewError(getErrorMessage(error) ?? "Unable to load this spec.");
        setPreviewStatus("error");
      });

    return () => {
      abortController.abort();
    };
  }, [previewOpen, projectId, selectedSpec]);

  useEffect(() => {
    const currentRunId = activeSpecRun?.runId;

    if (!currentRunId || !realtimeRun?.isCompleted) {
      return;
    }

    const completionTimeout = window.setTimeout(() => {
      if (realtimeRun.isSuccess) {
        setGenerateError(null);
        setListStatus("loading");
        setListError(null);
        setRefreshKey((current) => current + 1);
      } else {
        setGenerateError(getSpecRunErrorMessage(realtimeRun));
      }

      setActiveSpecRun((current) =>
        current?.runId === currentRunId ? null : current,
      );
    }, 0);

    return () => {
      window.clearTimeout(completionTimeout);
    };
  }, [activeSpecRun, realtimeRun]);

  useEffect(() => {
    const currentRunId = activeSpecRun?.runId;

    if (!currentRunId || !realtimeRunError) {
      return;
    }

    const errorTimeout = window.setTimeout(() => {
      setGenerateError(
        getErrorMessage(realtimeRunError) ||
          "Unable to observe the latest spec generation run.",
      );
      setActiveSpecRun((current) =>
        current?.runId === currentRunId ? null : current,
      );
    }, 0);

    return () => {
      window.clearTimeout(errorTimeout);
    };
  }, [activeSpecRun, realtimeRunError]);

  function openPreview(spec: ProjectSpecListItem) {
    setSelectedSpec(spec);
    setPreviewMarkdown(null);
    setPreviewError(null);
    setPreviewStatus("loading");
    setPreviewOpen(true);
  }

  function closePreview(open: boolean) {
    setPreviewOpen(open);

    if (!open) {
      setSelectedSpec(null);
      setPreviewMarkdown(null);
      setPreviewError(null);
    }
  }

  async function generateSpec() {
    if (!canGenerateSpec) {
      return;
    }

    setIsStartingGeneration(true);
    setGenerateError(null);

    try {
      const { runId } = await postJson<SpecTriggerResponse>("/api/ai/spec", {
        chatHistory,
        edges: canvasSnapshot.edges,
        nodes: canvasSnapshot.nodes,
        roomId,
      });
      const { token } = await postJson<SpecTokenResponse>("/api/ai/spec/token", {
        runId,
      });

      setActiveSpecRun({
        publicToken: token,
        runId,
      });
    } catch (error) {
      setGenerateError(
        getErrorMessage(error) ||
          "Unable to start spec generation right now.",
      );
    } finally {
      setIsStartingGeneration(false);
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-3xl border border-surface-border bg-surface/80 p-3">
          <Button
            type="button"
            className="w-full rounded-2xl bg-ai text-copy-primary hover:bg-ai/90"
            onClick={() => void generateSpec()}
            disabled={!canGenerateSpec}
          >
            {isGeneratingSpec ? (
              <>
                <LoaderCircle className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles />
                Generate Spec
              </>
            )}
          </Button>
          <p className="mt-2 text-xs leading-5 text-copy-faint">
            {canvasSnapshot.nodes.length === 0
              ? "Add at least one node before generating a spec."
              : isGeneratingSpec
                ? "Ghost AI is turning the current canvas into Markdown."
                : "Creates a Markdown spec from the current canvas."}
          </p>
          {generateError ? (
            <p className="mt-2 rounded-2xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-xs leading-5 text-copy-primary">
              {generateError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-copy-primary">
              Generated Specs
            </h3>
            <p className="mt-1 text-xs text-copy-faint">
              {listStatus === "loading"
                ? "Loading latest files"
                : `${specs.length} ${specs.length === 1 ? "file" : "files"}`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-2xl"
            onClick={() => {
              setListStatus("loading");
              setListError(null);
              setRefreshKey((current) => current + 1);
            }}
            disabled={listStatus === "loading"}
          >
            {listStatus === "loading" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RefreshCcw />
            )}
            Refresh
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-2">
          <SpecListState
            error={listError}
            onOpenPreview={openPreview}
            projectId={projectId}
            specs={specs}
            status={listStatus}
          />
        </ScrollArea>
      </div>

      <Dialog open={previewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-h-[min(46rem,calc(100vh-2rem))] max-w-[min(54rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-3xl border border-surface-border bg-base p-0 text-copy-primary shadow-2xl shadow-black/30">
          <DialogHeader className="border-b border-surface-border px-5 py-4">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold text-copy-primary">
                  {selectedSpec?.filename ?? "Specification"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-copy-faint">
                  {selectedSpec ? formatSpecDate(selectedSpec.createdAt) : ""}
                </DialogDescription>
              </div>
              {selectedSpec ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-2xl"
                >
                  <a
                    href={getSpecDownloadUrl(projectId, selectedSpec.id)}
                    download={selectedSpec.filename}
                  >
                    <Download />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(min(46rem,100vh-2rem)-8.5rem)]">
            <div className="px-5 py-5">
              <PreviewContent
                error={previewError}
                markdown={previewMarkdown}
                status={previewStatus}
              />
            </div>
          </ScrollArea>

          <DialogFooter className="mx-0 mb-0 rounded-none border-t border-surface-border bg-surface/80 px-5 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-2xl">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SpecListState({
  error,
  onOpenPreview,
  projectId,
  specs,
  status,
}: {
  error: string | null;
  onOpenPreview: (spec: ProjectSpecListItem) => void;
  projectId: string;
  specs: ProjectSpecListItem[];
  status: AsyncStatus;
}) {
  if (status === "loading") {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface/60 text-copy-muted">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        Loading specs
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-3xl border border-state-error/30 bg-state-error/10 p-4 text-sm leading-6 text-copy-primary">
        {error ?? "Unable to load generated specs."}
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface/60 px-5 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-ai/16 text-ai-text">
          <FileText className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-copy-primary">
          No specs yet
        </h3>
        <p className="mt-2 max-w-[16rem] text-sm leading-6 text-copy-muted">
          Generated Markdown files will appear here for preview and download.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-2">
      {specs.map((spec) => (
        <div
          key={spec.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-surface-border bg-elevated p-3"
        >
          <button
            type="button"
            className="min-w-0 text-left"
            onClick={() => onOpenPreview(spec)}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-copy-primary">
              <FileText className="h-4 w-4 shrink-0 text-ai-text" />
              <span className="truncate">{spec.filename}</span>
            </span>
            <span className="mt-1 block text-xs text-copy-faint">
              {formatSpecDate(spec.createdAt)}
            </span>
          </button>
          <Button
            asChild
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
          >
            <a
              href={getSpecDownloadUrl(projectId, spec.id)}
              download={spec.filename}
              aria-label={`Download ${spec.filename}`}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}

function PreviewContent({
  error,
  markdown,
  status,
}: {
  error: string | null;
  markdown: string | null;
  status: AsyncStatus;
}) {
  if (status === "loading") {
    return (
      <div className="flex min-h-[22rem] items-center justify-center text-sm text-copy-muted">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        Loading preview
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-state-error/30 bg-state-error/10 p-4 text-sm leading-6 text-copy-primary">
        {error ?? "Unable to load this spec."}
      </div>
    );
  }

  if (!markdown) {
    return null;
  }

  return <MarkdownPreview markdown={markdown} />;
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div className="space-y-4 text-sm leading-7 text-copy-secondary">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "code":
            return (
              <pre
                key={index}
                className="overflow-x-auto rounded-2xl border border-surface-border bg-surface p-4 font-mono text-xs leading-6 text-copy-primary"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "heading":
            return (
              <Heading key={index} level={block.level}>
                {renderInlineMarkdown(block.text)}
              </Heading>
            );
          case "list":
            return block.ordered ? (
              <ol
                key={index}
                className="list-decimal space-y-2 pl-5 marker:text-copy-faint"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={index}
                className="list-disc space-y-2 pl-5 marker:text-copy-faint"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          case "paragraph":
            return (
              <p key={index} className="whitespace-pre-wrap">
                {renderInlineMarkdown(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

function Heading({
  children,
  level,
}: {
  children: ReactNode;
  level: 1 | 2 | 3;
}) {
  const className = cn(
    "font-semibold text-copy-primary",
    level === 1 && "text-xl",
    level === 2 && "text-lg",
    level === 3 && "text-base",
  );

  if (level === 1) {
    return <h1 className={className}>{children}</h1>;
  }

  if (level === 2) {
    return <h2 className={className}>{children}</h2>;
  }

  return <h3 className={className}>{children}</h3>;
}

type MarkdownBlock =
  | {
      kind: "code";
      text: string;
    }
  | {
      kind: "heading";
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      items: string[];
      kind: "list";
      ordered: boolean;
    }
  | {
      kind: "paragraph";
      text: string;
    };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let isOrderedList = false;
  let codeLines: string[] = [];
  let isCodeBlock = false;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      kind: "paragraph",
      text: paragraphLines.join("\n"),
    });
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      kind: "list",
      ordered: isOrderedList,
    });
    listItems = [];
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();

      if (isCodeBlock) {
        blocks.push({
          kind: "code",
          text: codeLines.join("\n"),
        });
        codeLines = [];
        isCodeBlock = false;
      } else {
        isCodeBlock = true;
      }

      continue;
    }

    if (isCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      continue;
    }

    const unorderedMatch = /^\s*[-*]\s+(.+)$/.exec(line);
    const orderedMatch = /^\s*\d+\.\s+(.+)$/.exec(line);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextOrdered = Boolean(orderedMatch);

      if (listItems.length > 0 && isOrderedList !== nextOrdered) {
        flushList();
      }

      isOrderedList = nextOrdered;
      listItems.push((orderedMatch?.[1] ?? unorderedMatch?.[1] ?? "").trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  if (isCodeBlock) {
    blocks.push({
      kind: "code",
      text: codeLines.join("\n"),
    });
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkdown(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-xl border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-xs text-copy-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-copy-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

async function getFetchErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    if (payload?.error?.message) {
      return payload.error.message;
    }
  }

  return "Unable to load this spec.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return null;
}

function getSpecRunErrorMessage(run: ObservedRunShape) {
  const errorMessage =
    typeof run.error?.message === "string" && run.error.message.trim().length > 0
      ? run.error.message.trim()
      : null;
  const metadataMessage =
    typeof run.metadata?.statusMessage === "string" &&
    run.metadata.statusMessage.trim().length > 0
      ? run.metadata.statusMessage.trim()
      : null;

  return (
    errorMessage ??
    metadataMessage ??
    "Spec generation failed before a Markdown file was saved."
  );
}

async function postJson<TResponse>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: TResponse;
      }
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new Error(
      payload && "error" in payload && payload.error?.message
        ? payload.error.message
        : `Request failed with status ${response.status}.`,
    );
  }

  if (!payload || !("data" in payload) || payload.data === undefined) {
    throw new Error("Response payload is invalid.");
  }

  return payload.data;
}

function formatSpecDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return specDateFormatter.format(date);
}

function getSpecsListUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/specs`;
}

function getSpecDownloadUrl(projectId: string, specId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(
    specId,
  )}/download`;
}
