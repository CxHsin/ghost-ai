"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useOthers,
  useSelf,
} from "@liveblocks/react";
import {
  Bot,
  FileText,
  LoaderCircle,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SpecsPanel } from "@/components/editor/specs-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type AiChatMessage,
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  GHOST_AI_USER_ID,
  GHOST_AI_USER_NAME,
  parseAiChatMessage,
  parseAiStatusMessage,
  type AiStatusMessage,
} from "@/types/tasks";
import { type CanvasSnapshot } from "@/types/canvas";

interface AiSidebarProps {
  canvasSnapshot: CanvasSnapshot;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

interface ActiveDesignRun {
  prompt: string;
  publicToken: string;
  runId: string;
}

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

interface DesignTriggerResponse {
  runId: string;
}

interface DesignTokenResponse {
  runId: string;
  token: string;
}

interface ObservedRunShape {
  error?: {
    message?: string;
  };
  isCompleted: boolean;
  isSuccess: boolean;
  metadata?: Record<string, unknown>;
  output?: unknown;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const ACTIVE_AI_PHASES = new Set<AiStatusMessage["phase"]>(["started", "processing"]);
const ACTIVE_STATUS_STALE_MS = 45_000;
const STATUS_PHASE_LABELS: Record<AiStatusMessage["phase"], string> = {
  started: "Queued",
  processing: "Working",
  completed: "Completed",
  failed: "Failed",
};
const chatTimestampFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function AiSidebar({
  canvasSnapshot,
  isOpen,
  onClose,
  projectId,
  roomId,
}: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const hasEnsuredStatusFeedRef = useRef(false);
  const hasEnsuredChatFeedRef = useRef(false);
  const reportedRunIdsRef = useRef<Set<string>>(new Set());
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: statusFeedMessages = [] } = useFeedMessages(AI_STATUS_FEED_ID);
  const { messages: chatFeedMessages = [] } = useFeedMessages(AI_CHAT_FEED_ID);
  const others = useOthers();
  const self = useSelf((me) => ({
    id: me.id,
    name: me.info.name,
  }));
  const [now, setNow] = useState(() => Date.now());
  const { error: realtimeRunError, run: realtimeRun } = useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: Boolean(activeRun?.runId && activeRun?.publicToken),
    stopOnCompletion: true,
  });

  const latestStatusMessage = useMemo(() => {
    let latestMessage: AiStatusMessage | null = null;

    for (const message of statusFeedMessages) {
      const parsedMessage = parseAiStatusMessage(message.data);

      if (!parsedMessage) {
        continue;
      }

      if (
        latestMessage === null ||
        parsedMessage.timestamp >= latestMessage.timestamp
      ) {
        latestMessage = parsedMessage;
      }
    }

    return latestMessage;
  }, [statusFeedMessages]);

  const chatMessages = useMemo(() => {
    return chatFeedMessages
      .map((message) => {
        const parsedMessage = parseAiChatMessage(message.data);

        if (!parsedMessage) {
          return null;
        }

        return {
          content: parsedMessage.content,
          id: message.id,
          role: parsedMessage.role,
          runId: parsedMessage.runId,
          sender: parsedMessage.sender,
          timestamp: parsedMessage.timestamp,
        };
      })
      .filter((message) => message !== null)
      .sort((left, right) => {
        if (left.timestamp !== right.timestamp) {
          return left.timestamp - right.timestamp;
        }

        return left.id.localeCompare(right.id);
      });
  }, [chatFeedMessages]);
  const specChatHistory = useMemo<AiChatMessage[]>(
    () =>
      chatMessages.map((message) => ({
        content: message.content,
        kind: "chat",
        role: message.role,
        ...(message.runId ? { runId: message.runId } : {}),
        sender: message.sender,
        timestamp: message.timestamp,
      })),
    [chatMessages],
  );

  const isGhostAiThinking = useMemo(
    () =>
      others.some(
        (participant) =>
          participant.id === GHOST_AI_USER_ID &&
          participant.presence.thinking === true,
      ),
    [others],
  );

  const hasFreshActiveStatusMessage = useMemo(() => {
    if (!latestStatusMessage || !ACTIVE_AI_PHASES.has(latestStatusMessage.phase)) {
      return false;
    }

    return now - latestStatusMessage.timestamp <= ACTIVE_STATUS_STALE_MS;
  }, [latestStatusMessage, now]);

  const isAiThinking = isGhostAiThinking || hasFreshActiveStatusMessage;
  const isRunActive =
    activeRun !== null &&
    (realtimeRun === undefined || !realtimeRun.isCompleted);
  const isComposerDisabled = isSubmittingPrompt || isRunActive;
  const canSend = draft.trim().length > 0 && !isComposerDisabled;
  const showActiveStatusStrip = isSubmittingPrompt || isRunActive;
  const emptyStateDescription = useMemo(
    () => "Use this room chat to coordinate prompts, note decisions, and share design direction with collaborators.",
    [],
  );

  const appendChatMessage = useCallback(
    async ({
      content,
      role,
      runId,
      sender,
    }: {
      content: string;
      role: "assistant" | "system" | "user";
      runId?: string;
      sender: string;
    }) => {
      const timestamp = Date.now();

      await createFeed(AI_CHAT_FEED_ID).catch(() => {
        // Another participant may have already created the room chat feed.
      });

      await createFeedMessage(
        AI_CHAT_FEED_ID,
        {
          content,
          kind: "chat",
          role,
          ...(runId ? { runId } : {}),
          sender,
          timestamp,
        },
        {
          createdAt: timestamp,
          id: crypto.randomUUID(),
        },
      );
    },
    [createFeed, createFeedMessage],
  );

  useEffect(() => {
    if (hasEnsuredStatusFeedRef.current) {
      return;
    }

    hasEnsuredStatusFeedRef.current = true;

    void createFeed(AI_STATUS_FEED_ID).catch(() => {
      // Another participant or the backend may have already created the feed.
    });
  }, [createFeed]);

  useEffect(() => {
    if (hasEnsuredChatFeedRef.current) {
      return;
    }

    hasEnsuredChatFeedRef.current = true;

    void createFeed(AI_CHAT_FEED_ID).catch(() => {
      // Another participant may have already created the room chat feed.
    });
  }, [createFeed]);

  useEffect(() => {
    if (!latestStatusMessage || !ACTIVE_AI_PHASES.has(latestStatusMessage.phase)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [latestStatusMessage]);

  useEffect(() => {
    const textarea = composerRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${Math.max(nextHeight, 72)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [draft]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

  useEffect(() => {
    const currentRunId = activeRun?.runId;

    if (!currentRunId || !realtimeRun?.isCompleted) {
      return;
    }

    if (reportedRunIdsRef.current.has(currentRunId)) {
      return;
    }

    reportedRunIdsRef.current.add(currentRunId);

    void appendChatMessage({
      content: getCompletionMessage(realtimeRun, activeRun.prompt),
      role: realtimeRun.isSuccess ? "assistant" : "system",
      runId: currentRunId,
      sender: realtimeRun.isSuccess ? GHOST_AI_USER_NAME : "System",
    }).finally(() => {
      setActiveRun((current) =>
        current?.runId === currentRunId ? null : current,
      );
    });
  }, [activeRun, appendChatMessage, realtimeRun]);

  useEffect(() => {
    const currentRunId = activeRun?.runId;

    if (!currentRunId || !realtimeRunError) {
      return;
    }

    if (reportedRunIdsRef.current.has(currentRunId)) {
      return;
    }

    reportedRunIdsRef.current.add(currentRunId);

    void appendChatMessage({
      content:
        getErrorMessage(realtimeRunError) ||
        "Unable to observe the latest Ghost AI run.",
      role: "system",
      runId: currentRunId,
      sender: "System",
    }).finally(() => {
      setActiveRun((current) =>
        current?.runId === currentRunId ? null : current,
      );
    });
  }, [activeRun, appendChatMessage, realtimeRunError]);

  function handlePromptSelect(prompt: string) {
    setDraft(prompt);
    composerRef.current?.focus();
  }

  async function handleSend() {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || isComposerDisabled) {
      return;
    }

    setIsSubmittingPrompt(true);
    setSendError(null);

    try {
      await appendChatMessage({
        content: trimmedDraft,
        role: "user",
        sender: self?.name?.trim() || "Anonymous collaborator",
      });

      setDraft("");

      const { runId } = await postJson<DesignTriggerResponse>("/api/ai/design", {
        projectId,
        prompt: trimmedDraft,
        roomId,
      });
      const { token } = await postJson<DesignTokenResponse>("/api/ai/design/token", {
        runId,
      });

      setActiveRun({
        prompt: trimmedDraft,
        publicToken: token,
        runId,
      });
    } catch (error) {
      const message =
        getErrorMessage(error) ||
        "Unable to start Ghost AI right now. Try again in a moment.";

      setSendError(message);

      await appendChatMessage({
        content: message,
        role: "system",
        sender: "System",
      }).catch(() => {
        // Keep the inline error as a fallback when feed writes fail too.
      });
    } finally {
      setIsSubmittingPrompt(false);
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isComposerDisabled) {
      return;
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  function getStatusMessageText(statusMessage: AiStatusMessage) {
    if (statusMessage.text?.trim()) {
      return statusMessage.text.trim();
    }

    switch (statusMessage.phase) {
      case "started":
        return "Ghost AI has started working in this room.";
      case "processing":
        return "Ghost AI is actively updating the shared workspace.";
      case "completed":
        return "Ghost AI finished the latest room activity.";
      case "failed":
        return "Ghost AI could not complete the latest room activity.";
    }
  }

  function getChatTimestamp(timestamp: number) {
    return chatTimestampFormatter.format(timestamp);
  }

  function getChatRoleLabel(role: "assistant" | "system" | "user") {
    switch (role) {
      case "assistant":
        return "Ghost AI";
      case "system":
        return "System";
      case "user":
        return "Collaborator";
    }
  }

  return (
    <aside
      className={cn(
        "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-full max-w-[22rem] p-2.5 transition-all duration-300 ease-out lg:flex lg:flex-col sm:max-w-[21.5rem] sm:p-3",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div
        className={cn(
          "pointer-events-auto flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-surface-border bg-base/95 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-sm transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-6",
        )}
      >
        <div className="flex min-h-[4.9rem] items-start justify-between gap-4 border-b border-surface-border px-4 py-4">
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-ai/16 text-ai-text">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-copy-primary">
                  AI Workspace
                </h2>
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-xs text-copy-muted">
                    Collaborate with Ghost AI
                  </p>
                  {isAiThinking ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ai/25 bg-ai/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ai-text">
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                      Working
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            className="mt-0.5 shrink-0 rounded-full border border-surface-border bg-subtle text-copy-secondary shadow-none hover:bg-elevated hover:text-copy-primary"
            onClick={onClose}
            aria-label="Close AI workspace"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="px-4 py-3.5">
            <div className="rounded-[1.35rem] border border-surface-border/55 bg-surface/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.2)]">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-px !rounded-[1.05rem] bg-base/90 p-px">
                <TabsTrigger
                  value="architect"
                className="!h-8 min-w-0 !rounded-full !border-0 !bg-transparent px-4.5 py-0 text-[0.8rem] font-semibold text-copy-muted !shadow-none transition-[background-color,color,box-shadow] duration-150 after:content-none hover:bg-surface/70 hover:text-copy-secondary data-[state=active]:!bg-ai data-[state=active]:!text-copy-primary data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.18)] data-[state=active]:after:content-none"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Architect
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                className="!h-8 min-w-0 !rounded-full !border-0 !bg-transparent px-4.5 py-0 text-[0.8rem] font-semibold text-copy-muted !shadow-none transition-[background-color,color,box-shadow] duration-150 after:content-none hover:bg-surface/70 hover:text-copy-secondary data-[state=active]:!bg-ai data-[state=active]:!text-copy-primary data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.18)] data-[state=active]:after:content-none"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Specs
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1 flex-col border-t border-surface-border-subtle px-4 py-4">
            <ScrollArea className="min-h-0 flex-1 pr-2">
              {chatMessages.length === 0 ? (
                <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface/60 px-5 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-ai/16 text-ai-text">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                    Start the room chat
                  </h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-6 text-copy-muted">
                    {emptyStateDescription}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-surface-border bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:border-ai/40 hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => handlePromptSelect(prompt)}
                        disabled={isComposerDisabled}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  {chatMessages.map((message) => {
                    const isUser = message.role === "user";
                    const isOwnMessage = isUser && self?.name === message.sender;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                            isUser
                              ? "border border-state-success/35 bg-state-success text-base"
                              : message.role === "assistant"
                                ? "border border-surface-border bg-elevated text-copy-primary"
                                : "border border-state-error/30 bg-state-error/10 text-copy-primary",
                            isOwnMessage ? "border-2" : "",
                          )}
                        >
                          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-copy-faint">
                            <span>{message.sender}</span>
                            <span className="text-copy-faint/70">
                              {getChatRoleLabel(message.role)}
                            </span>
                            <span className="text-copy-faint/70">
                              {getChatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap leading-6">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 rounded-3xl border border-surface-border bg-surface/80 p-3">
              {showActiveStatusStrip ? (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-state-success/30 bg-elevated px-3 py-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-state-success/12 text-state-success">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-state-success">
                      {latestStatusMessage && ACTIVE_AI_PHASES.has(latestStatusMessage.phase)
                        ? STATUS_PHASE_LABELS[latestStatusMessage.phase]
                        : isSubmittingPrompt
                          ? "Starting"
                          : "Working"}
                    </p>
                    <p className="truncate text-xs text-copy-secondary">
                      {latestStatusMessage && ACTIVE_AI_PHASES.has(latestStatusMessage.phase)
                        ? getStatusMessageText(latestStatusMessage)
                        : "Ghost AI is starting this run."}
                    </p>
                  </div>
                </div>
              ) : null}
              <Textarea
                ref={composerRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (sendError) {
                    setSendError(null);
                  }
                }}
                onKeyDown={handleComposerKeyDown}
                placeholder="Share a prompt idea, decision, or note with everyone in the room..."
                disabled={isComposerDisabled}
                className="min-h-[4.5rem] max-h-40 resize-none rounded-2xl border-surface-border bg-base/70 px-3 py-3 text-sm text-copy-primary placeholder:text-copy-faint focus-visible:border-state-success focus-visible:ring-state-success/20"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {sendError ? (
                    <p className="text-xs text-state-error">{sendError}</p>
                  ) : (
                    <p className="text-xs text-copy-faint">
                      Enter to send. Shift + Enter for a new line.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-2xl bg-state-success px-3 text-base hover:bg-state-success/90"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                >
                  {isComposerDisabled ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      {isSubmittingPrompt ? "Starting..." : "Running..."}
                    </>
                  ) : (
                    <>
                      <SendHorizonal />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1 flex-col border-t border-surface-border-subtle px-4 py-4">
            <SpecsPanel
              canvasSnapshot={canvasSnapshot}
              chatHistory={specChatHistory}
              projectId={projectId}
              roomId={roomId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );

}

function getCompletionMessage(run: ObservedRunShape, prompt: string) {
  const outputMessage =
    typeof run.output === "object" &&
    run.output !== null &&
    "message" in run.output &&
    typeof run.output.message === "string" &&
    run.output.message.trim().length > 0
      ? run.output.message.trim()
      : null;
  const metadataMessage =
    typeof run.metadata?.statusMessage === "string" &&
    run.metadata.statusMessage.trim().length > 0
      ? run.metadata.statusMessage.trim()
      : null;

  if (run.isSuccess) {
    return outputMessage ?? metadataMessage ?? `Ghost AI finished the prompt: "${prompt}".`;
  }

  const errorMessage =
    typeof run.error?.message === "string" && run.error.message.trim().length > 0
      ? run.error.message.trim()
      : null;

  return (
    errorMessage ??
    metadataMessage ??
    `Ghost AI could not complete the prompt: "${prompt}".`
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return null;
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
        : "Request failed.",
    );
  }

  if (!payload || !("data" in payload) || payload.data === undefined) {
    throw new Error("Response payload is invalid.");
  }

  return payload.data;
}
