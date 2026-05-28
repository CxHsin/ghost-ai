"use client";

import { Bot, Download, FileText, SendHorizonal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  role: "assistant" | "user";
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const DEMO_SPEC_SNIPPET =
  "Service boundaries, data flow notes, deployment assumptions, and rollout considerations will appear here once spec generation is wired.";

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const canSend = draft.trim().length > 0;
  const emptyStateDescription = useMemo(
    () => "Prompt Ghost AI to sketch a system, expand a flow, or help organize the workspace.",
    [],
  );

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
  }, [messages]);

  function handlePromptSelect(prompt: string) {
    setDraft(prompt);
    composerRef.current?.focus();
  }

  function handleSend() {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: trimmedDraft,
      role: "user",
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content:
        "Ghost AI UI is ready here. Architecture generation and room-aware execution will plug into this thread in a later unit.",
      role: "assistant",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    handleSend();
  }

  return (
    <aside
      className={cn(
        "pointer-events-none absolute inset-y-4 right-4 z-10 hidden w-[21.5rem] overflow-hidden rounded-3xl border border-surface-border bg-base/95 shadow-2xl shadow-black/25 backdrop-blur-sm transition-all duration-300 ease-out lg:flex lg:flex-col",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1rem)] opacity-0",
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "pointer-events-auto flex h-full flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-6",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-ai/16 text-ai-text">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-copy-primary">
                  AI Workspace
                </h2>
                <p className="truncate text-xs text-copy-muted">
                  Collaborate with Ghost AI
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="shrink-0 rounded-full border border-surface-border bg-subtle text-copy-secondary shadow-none hover:bg-elevated hover:text-copy-primary"
            onClick={onClose}
            aria-label="Close AI workspace"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="border-b border-surface-border px-5 py-3">
            <TabsList className="grid h-14 w-full grid-cols-2 rounded-[1.125rem] border border-surface-border bg-base/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <TabsTrigger
                value="architect"
                className="!h-full rounded-[0.95rem] !border border-transparent !bg-transparent px-3.5 py-0 text-[0.8rem] font-semibold text-copy-muted !shadow-none transition-[background-color,border-color,color] duration-150 hover:text-copy-secondary data-[state=active]:!border-surface-border-subtle data-[state=active]:!bg-elevated data-[state=active]:!text-copy-primary data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Architect
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="!h-full rounded-[0.95rem] !border border-transparent !bg-transparent px-3.5 py-0 text-[0.8rem] font-semibold text-copy-muted !shadow-none transition-[background-color,border-color,color] duration-150 hover:text-copy-secondary data-[state=active]:!border-surface-border-subtle data-[state=active]:!bg-elevated data-[state=active]:!text-copy-primary data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <FileText className="h-3.5 w-3.5" />
                Specs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1 flex-col px-5 py-4">
            <ScrollArea className="min-h-0 flex-1 pr-2">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface/60 px-5 py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-ai/16 text-ai-text">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                    Start a design conversation
                  </h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-6 text-copy-muted">
                    {emptyStateDescription}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-surface-border bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:border-ai/40 hover:bg-elevated"
                        onClick={() => handlePromptSelect(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isUser ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm",
                            isUser
                              ? "border-2 border-brand/50 bg-brand-dim text-copy-primary"
                              : "border border-surface-border bg-elevated text-ai-text",
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 rounded-3xl border border-surface-border bg-surface/80 p-3">
              <Textarea
                ref={composerRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask Ghost AI to map services, flows, or specs..."
                className="min-h-[4.5rem] max-h-40 resize-none rounded-2xl border-surface-border bg-base/70 px-3 py-3 text-sm text-copy-primary placeholder:text-copy-faint focus-visible:border-ai focus-visible:ring-ai/20"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-copy-faint">Enter to send. Shift + Enter for a new line.</p>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-2xl bg-ai px-3 text-copy-primary hover:bg-ai/90"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <SendHorizonal />
                  Send
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1 flex-col px-5 py-4">
            <div className="flex flex-1 flex-col gap-4">
              <Button
                type="button"
                className="w-full rounded-2xl bg-ai text-copy-primary hover:bg-ai/90"
              >
                <Sparkles />
                Generate Spec
              </Button>

              <div className="rounded-3xl border border-surface-border bg-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-subtle text-ai-text">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-copy-primary">
                          Checkout Platform Draft
                        </h3>
                        <p className="mt-1 text-xs text-copy-faint">Demo preview</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-2xl"
                      >
                        <Download />
                        Download
                      </Button>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-copy-muted">
                      {DEMO_SPEC_SNIPPET}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
