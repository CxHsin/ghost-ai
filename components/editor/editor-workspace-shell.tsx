"use client";

import { Share2, Sparkles } from "lucide-react";
import { useState } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorCanvasRoom } from "@/components/editor/editor-canvas-room";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { type ProjectListItem } from "@/components/editor/project-list-item";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { cn } from "@/lib/utils";
import { type CanvasSaveIndicatorState } from "@/types/canvas";

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
  const [handleManualSave, setHandleManualSave] = useState<(() => void) | null>(null);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveIndicatorState>("idle");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openTemplatesRequest, setOpenTemplatesRequest] = useState(0);
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
        onOpenTemplates={() => setOpenTemplatesRequest((current) => current + 1)}
        onSave={() => handleManualSave?.()}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        saveStatus={saveStatus}
        showSaveButton
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
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              type="button"
              className={cn(
                "rounded-2xl",
                isAiSidebarOpen ? "shadow-[0_0_24px_rgba(0,200,212,0.18)]" : "",
              )}
              onClick={() => setIsAiSidebarOpen((current) => !current)}
              aria-pressed={isAiSidebarOpen}
            >
              <Sparkles />
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
          <main className="relative flex flex-1 overflow-hidden rounded-3xl border border-surface-border bg-surface/50">
            <EditorCanvasRoom
              isAiSidebarOpen={isAiSidebarOpen}
              onSaveActionChange={(action) => setHandleManualSave(() => action)}
              onSaveStatusChange={setSaveStatus}
              projectId={currentProject.id}
              roomId={currentProject.roomId}
              openTemplatesRequest={openTemplatesRequest}
            />
          </main>
          <AiSidebar isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />
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
