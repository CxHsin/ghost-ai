"use client";

import { type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProjectDialogsProps {
  activeDialog: "create" | "rename" | "delete" | null;
  currentProjectName: string | null;
  errorMessage: string | null;
  isLoading: boolean;
  onClose: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onRename: () => void;
  onNameChange: (value: string) => void;
  projectName: string;
  roomIdPreview: string;
}

function DialogShell({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: React.ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-3xl border border-surface-border bg-surface p-6 text-copy-primary shadow-2xl shadow-black/40 sm:max-w-md"
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="leading-6 text-copy-secondary">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function DialogError({ errorMessage }: { errorMessage: string | null }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-state-error/30 bg-state-error/10 px-4 py-3 text-sm leading-6 text-copy-secondary">
      {errorMessage}
    </div>
  );
}

export function ProjectDialogs({
  activeDialog,
  currentProjectName,
  errorMessage,
  isLoading,
  onClose,
  onCreate,
  onDelete,
  onRename,
  onNameChange,
  projectName,
  roomIdPreview,
}: ProjectDialogsProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>, action: () => void) {
    event.preventDefault();
    action();
  }

  return (
    <>
      <DialogShell
        open={activeDialog === "create"}
        onOpenChange={handleOpenChange}
        title="Create Project"
        description="Start a new architecture workspace with a project name and room ID preview."
      >
        <form onSubmit={(event) => handleSubmit(event, onCreate)} className="space-y-5">
          <DialogError errorMessage={errorMessage} />

          <div className="space-y-2">
            <label
              htmlFor="create-project-name"
              className="text-sm font-medium text-copy-primary"
            >
              Project name
            </label>
            <Input
              id="create-project-name"
              value={projectName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Architecture redesign"
              className="h-10 rounded-xl border-surface-border-subtle bg-base text-copy-primary placeholder:text-copy-faint"
            />
          </div>

          <div className="rounded-2xl border border-surface-border bg-base/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-copy-faint">
              Room ID preview
            </p>
            <p className="mt-2 font-mono text-sm text-brand">{roomIdPreview}</p>
          </div>

          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-subtle/60 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !projectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>

      <DialogShell
        open={activeDialog === "rename"}
        onOpenChange={handleOpenChange}
        title="Rename Project"
        description={
          currentProjectName
            ? `Rename ${currentProjectName}.`
            : "Rename the selected project."
        }
      >
        <form onSubmit={(event) => handleSubmit(event, onRename)} className="space-y-5">
          <DialogError errorMessage={errorMessage} />

          <div className="space-y-2">
            <label
              htmlFor="rename-project-name"
              className="text-sm font-medium text-copy-primary"
            >
              Project name
            </label>
            <Input
              id="rename-project-name"
              autoFocus
              value={projectName}
              onChange={(event) => onNameChange(event.target.value)}
              className="h-10 rounded-xl border-surface-border-subtle bg-base text-copy-primary"
            />
          </div>

          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-subtle/60 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !projectName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>

      <DialogShell
        open={activeDialog === "delete"}
        onOpenChange={handleOpenChange}
        title="Delete Project"
        description={
          currentProjectName
            ? `Delete ${currentProjectName}. This action cannot be undone.`
            : "Delete the selected project."
        }
      >
        <div className="space-y-5">
          <DialogError errorMessage={errorMessage} />

          <div className="rounded-2xl border border-state-error/30 bg-state-error/10 px-4 py-3 text-sm leading-6 text-copy-secondary">
            This is a destructive confirmation. No additional input is required.
          </div>

          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-subtle/60 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isLoading}>
              Delete Project
            </Button>
          </DialogFooter>
        </div>
      </DialogShell>
    </>
  );
}
