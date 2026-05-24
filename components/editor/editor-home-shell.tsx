"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogState } from "@/components/editor/use-project-dialog-state";
import { Button } from "@/components/ui/button";

export function EditorHomeShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
    activeDialog,
    closeDialog,
    formState,
    isLoading,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    ownedProjects,
    selectedProject,
    sharedProjects,
    submitCreate,
    submitDelete,
    submitRename,
    updateName,
  } = useProjectDialogState();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreateProject={openCreateDialog}
          onClose={() => setIsSidebarOpen(false)}
          onDeleteProject={openDeleteDialog}
          onRenameProject={openRenameDialog}
        />

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="max-w-xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
              Create a project or open an existing one
            </h1>
            <p className="mt-4 text-base leading-7 text-copy-secondary">
              Start a new architecture workspace, or choose a project from the sidebar.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={openCreateDialog}>
                <Plus />
                New Project
              </Button>
            </div>
          </div>
        </main>
      </div>

      <ProjectDialogs
        activeDialog={activeDialog}
        currentProjectName={selectedProject?.name ?? null}
        isLoading={isLoading}
        onClose={closeDialog}
        onCreate={submitCreate}
        onDelete={submitDelete}
        onRename={submitRename}
        onNameChange={updateName}
        projectName={formState.name}
        slugPreview={formState.slugPreview}
      />
    </div>
  );
}
