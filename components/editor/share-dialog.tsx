"use client";

import { Link2, Trash2, UserRoundPlus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CollaboratorSummary {
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
}

interface ErrorResponseBody {
  error?: {
    message?: string;
  };
}

interface ShareDialogProps {
  canManageAccess: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ErrorResponseBody | null;

  return payload?.error?.message ?? fallbackMessage;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getCollaboratorLabel(collaborator: CollaboratorSummary) {
  return collaborator.displayName ?? collaborator.email;
}

function getCollaboratorInitials(collaborator: CollaboratorSummary) {
  const label = getCollaboratorLabel(collaborator);
  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

function CollaboratorAvatar({ collaborator }: { collaborator: CollaboratorSummary }) {
  if (collaborator.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={collaborator.avatarUrl}
        alt={getCollaboratorLabel(collaborator)}
        className="size-10 rounded-full border border-surface-border object-cover"
      />
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-surface-border bg-subtle text-xs font-medium text-copy-primary">
      {getCollaboratorInitials(collaborator)}
    </div>
  );
}

export function ShareDialog({
  canManageAccess,
  open,
  onOpenChange,
  projectId,
  projectName,
}: ShareDialogProps) {
  const copyTimeoutRef = useRef<number | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorSummary[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<"copied" | null>(null);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const sortedCollaborators = useMemo(
    () =>
      [...collaborators].sort((left, right) =>
        left.email.localeCompare(right.email),
      ),
    [collaborators],
  );

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const abortController = new AbortController();

    async function loadCollaborators() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`, {
          method: "GET",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, "Failed to load collaborators."),
          );
        }

        const payload = (await response.json()) as {
          data: {
            collaborators: CollaboratorSummary[];
          };
        };

        setCollaborators(payload.data.collaborators);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(getErrorMessage(error, "Failed to load collaborators."));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCollaborators();

    return () => {
      abortController.abort();
    };
  }, [open, projectId]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCopyFeedback(null);
      setEmail("");
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleCopyLink() {
    if (!canManageAccess) {
      return;
    }

    setIsCopying(true);
    setErrorMessage(null);

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`);
      setCopyFeedback("copied");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyFeedback(null);
      }, 1500);
    } catch {
      setErrorMessage("Failed to copy the project link.");
    } finally {
      setIsCopying(false);
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = email.trim();
    if (!nextEmail) {
      return;
    }

    setIsInviting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to invite collaborator."),
        );
      }

      const payload = (await response.json()) as {
        data: {
          collaborator: CollaboratorSummary;
        };
      };

      setCollaborators((current) => [...current, payload.data.collaborator]);
      setEmail("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to invite collaborator."));
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveCollaborator(collaboratorEmail: string) {
    setRemovingEmail(collaboratorEmail);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(collaboratorEmail)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to remove collaborator."),
        );
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.email !== collaboratorEmail),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to remove collaborator."));
    } finally {
      setRemovingEmail(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-3xl border border-surface-border bg-surface p-6 text-copy-primary shadow-2xl shadow-black/40 sm:max-w-xl"
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            Share Project
          </DialogTitle>
          <DialogDescription className="leading-6 text-copy-secondary">
            {canManageAccess
              ? `Invite collaborators to ${projectName} and manage project access.`
              : `View who currently has access to ${projectName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {canManageAccess ? (
            <div className="rounded-2xl border border-surface-border bg-base/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-copy-primary">Project link</p>
                  <p className="mt-1 text-sm leading-6 text-copy-muted">
                    Share direct access to this workspace with people you invite below.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleCopyLink}
                  disabled={isCopying}
                >
                  <Link2 />
                  {copyFeedback === "copied" ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          ) : null}

          {canManageAccess ? (
            <form onSubmit={handleInvite} className="space-y-3">
              <label
                htmlFor="share-collaborator-email"
                className="block text-sm font-medium text-copy-primary"
              >
                Invite by email
              </label>
              <div className="flex gap-3">
                <Input
                  id="share-collaborator-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="h-10 rounded-xl border-surface-border-subtle bg-base text-copy-primary placeholder:text-copy-faint"
                />
                <Button
                  type="submit"
                  className="shrink-0 rounded-xl"
                  disabled={isInviting || email.trim().length === 0}
                >
                  <UserRoundPlus />
                  Invite
                </Button>
              </div>
            </form>
          ) : null}

          <div className="rounded-2xl border border-surface-border bg-base/70">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-copy-muted" />
                <p className="text-sm font-medium text-copy-primary">
                  Collaborators
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-copy-faint">
                {sortedCollaborators.length}
              </p>
            </div>

            <ScrollArea className="max-h-72 px-4 py-3">
              {isLoading ? (
                <p className="py-6 text-sm text-copy-muted">Loading collaborators...</p>
              ) : sortedCollaborators.length === 0 ? (
                <div className="py-6 text-sm leading-6 text-copy-muted">
                  {canManageAccess
                    ? "No collaborators have been invited yet."
                    : "This project does not have any collaborators yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCollaborators.map((collaborator) => (
                    <div
                      key={collaborator.email}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface/80 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CollaboratorAvatar collaborator={collaborator} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-copy-primary">
                            {getCollaboratorLabel(collaborator)}
                          </p>
                          <p
                            className={cn(
                              "mt-1 truncate text-sm text-copy-muted",
                              collaborator.displayName ? "block" : "text-copy-secondary",
                            )}
                          >
                            {collaborator.email}
                          </p>
                        </div>
                      </div>

                      {canManageAccess ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={removingEmail === collaborator.email}
                          onClick={() => handleRemoveCollaborator(collaborator.email)}
                          aria-label={`Remove ${collaborator.email}`}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-state-error/30 bg-state-error/10 px-4 py-3 text-sm leading-6 text-copy-secondary">
              {errorMessage}
            </div>
          ) : null}

          {!canManageAccess ? (
            <div className="rounded-2xl border border-surface-border bg-subtle/40 px-4 py-3 text-sm leading-6 text-copy-muted">
              You have collaborator access. Only the project owner can invite or remove
              collaborators.
            </div>
          ) : null}
        </div>

        <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-subtle/60 px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
