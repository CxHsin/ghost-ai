"use client";

import { Bot, Compass, Share2, SidebarOpen } from "lucide-react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { type ProjectListItem } from "@/components/editor/project-list-item";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { cn } from "@/lib/utils";

interface WorkspaceProject {
  id: string;
  name: string;
  roomId: string;
}

interface EditorWorkspaceShellProps {
  canManageAccess: boolean;
  currentProject: WorkspaceProject;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

export function EditorWorkspaceShell({
  canManageAccess,
  currentProject,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceShellProps) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
    activeDialog,
    closeDialog,
    errorMessage,
    formState,
    isLoading,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    selectedProject,
    submitCreate,
    submitDelete,
    submitRename,
    updateName,
  } = useProjectActions({
    activeProjectId: currentProject.id,
    ownedProjects,
    sharedProjects,
  });

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        title={currentProject.name}
        subtitle="Workspace"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="rounded-2xl"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 />
              Share
            </Button>
            <Button
              variant="default"
              size="sm"
              type="button"
              className="rounded-2xl"
              onClick={() => setIsAiSidebarOpen((current) => !current)}
              aria-pressed={isAiSidebarOpen}
            >
              <SidebarOpen />
              AI
            </Button>
          </>
        }
      />

      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar
          activeProjectId={currentProject.id}
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreateProject={openCreateDialog}
          onClose={() => setIsSidebarOpen(false)}
          onDeleteProject={openDeleteDialog}
          onRenameProject={openRenameDialog}
        />

        <div className="relative flex flex-1 overflow-hidden p-3 pt-4 sm:p-4">
          <main className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-surface-border bg-surface/50 px-6 py-10">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,200,212,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(100,87,249,0.12),transparent_28%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(42,42,48,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(42,42,48,0.4)_1px,transparent_1px)] bg-[size:74px_74px]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,9,0.2),rgba(8,8,9,0.72))]" />
            </div>

            <div className="relative flex max-w-3xl flex-col items-center text-center">
              <div className="flex size-22 items-center justify-center rounded-3xl border border-surface-border bg-elevated/90 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <Compass className="h-10 w-10 text-brand" />
              </div>
              <p className="mt-8 text-xs font-medium tracking-[0.38em] text-copy-faint uppercase">
                Workspace Shell
              </p>
              <h1 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-copy-primary sm:text-3xl">
                Canvas and collaboration tooling land here next.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-copy-muted">
                This room is ready for the shared architecture canvas, durable AI
                workflows, and real-time presence. For now, the shell is wired with
                project context and navigation only.
              </p>
            </div>
          </main>

          <aside
            className={cn(
              "pointer-events-none absolute inset-y-4 right-4 z-10 hidden w-[21rem] overflow-hidden rounded-3xl border border-surface-border bg-surface/95 shadow-2xl shadow-black/25 backdrop-blur-sm transition-all duration-300 ease-out lg:flex lg:flex-col",
              isAiSidebarOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-[calc(100%+1rem)] opacity-0",
            )}
            aria-hidden={!isAiSidebarOpen}
          >
            <div
              className={cn(
                "pointer-events-auto flex h-full flex-col transition-transform duration-300 ease-out",
                isAiSidebarOpen ? "translate-x-0" : "translate-x-6",
              )}
            >
              <div className="border-b border-surface-border px-5 py-4">
                <h2 className="text-xl font-semibold tracking-tight text-copy-primary">
                  AI Copilot
                </h2>
                <p className="mt-1 text-sm text-copy-faint">Placeholder panel</p>
              </div>

              <div className="flex flex-1 flex-col gap-4 px-5 py-5">
                <div className="rounded-3xl border border-surface-border bg-subtle/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-copy-primary">
                        Chat surface pending
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-copy-muted">
                        The toggle is wired. Messaging and generation are intentionally
                        out of scope here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto rounded-3xl border border-dashed border-surface-border-subtle bg-base/40 p-5">
                  <p className="text-xs font-medium tracking-[0.3em] text-copy-faint uppercase">
                    Future Hooks
                  </p>
                  <p className="mt-4 text-sm leading-8 text-copy-muted">
                    Prompt composer, run status, and architecture guidance will attach
                    to this sidebar.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ProjectDialogs
        activeDialog={activeDialog}
        currentProjectName={selectedProject?.name ?? null}
        errorMessage={errorMessage}
        isLoading={isLoading}
        onClose={closeDialog}
        onCreate={submitCreate}
        onDelete={submitDelete}
        onRename={submitRename}
        onNameChange={updateName}
        projectName={formState.name}
        roomIdPreview={formState.roomIdPreview}
      />
      <ShareDialog
        canManageAccess={canManageAccess}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        projectId={currentProject.id}
        projectName={currentProject.name}
      />
    </div>
  );
}
