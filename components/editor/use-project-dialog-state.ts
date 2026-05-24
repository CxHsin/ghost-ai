"use client";

import { useMemo, useState } from "react";

import {
  INITIAL_OWNED_PROJECTS,
  INITIAL_SHARED_PROJECTS,
  type MockProject,
} from "@/components/editor/mock-projects";

type DialogMode = "create" | "rename" | "delete" | null;

interface ProjectFormState {
  name: string;
  slugPreview: string;
}

function createSlugPreview(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "project-slug";
}

export function useProjectDialogState() {
  const [ownedProjects, setOwnedProjects] =
    useState<MockProject[]>(INITIAL_OWNED_PROJECTS);
  const [sharedProjects] = useState<MockProject[]>(INITIAL_SHARED_PROJECTS);
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProjectFormState>({
    name: "",
    slugPreview: "project-slug",
  });
  const [isLoading, setIsLoading] = useState(false);

  const selectedProject = useMemo(
    () => ownedProjects.find((project) => project.id === selectedProjectId) ?? null,
    [ownedProjects, selectedProjectId],
  );

  function closeDialog() {
    setActiveDialog(null);
    setSelectedProjectId(null);
    setFormState({
      name: "",
      slugPreview: "project-slug",
    });
    setIsLoading(false);
  }

  function updateName(name: string) {
    setFormState({
      name,
      slugPreview: createSlugPreview(name),
    });
  }

  function openCreateDialog() {
    setSelectedProjectId(null);
    setFormState({
      name: "",
      slugPreview: "project-slug",
    });
    setActiveDialog("create");
  }

  function openRenameDialog(projectId: string) {
    const project = ownedProjects.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    setSelectedProjectId(project.id);
    setFormState({
      name: project.name,
      slugPreview: project.slug,
    });
    setActiveDialog("rename");
  }

  function openDeleteDialog(projectId: string) {
    const project = ownedProjects.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    setSelectedProjectId(project.id);
    setFormState({
      name: project.name,
      slugPreview: project.slug,
    });
    setActiveDialog("delete");
  }

  function submitCreate() {
    const name = formState.name.trim();

    if (!name) {
      return;
    }

    setIsLoading(true);

    setOwnedProjects((current) => [
      {
        id: `owned-${Date.now()}`,
        name,
        slug: createSlugPreview(name),
        isOwned: true,
      },
      ...current,
    ]);

    closeDialog();
  }

  function submitRename() {
    const name = formState.name.trim();

    if (!name || !selectedProjectId) {
      return;
    }

    setIsLoading(true);

    setOwnedProjects((current) =>
      current.map((project) =>
        project.id === selectedProjectId
          ? {
              ...project,
              name,
              slug: createSlugPreview(name),
            }
          : project,
      ),
    );

    closeDialog();
  }

  function submitDelete() {
    if (!selectedProjectId) {
      return;
    }

    setIsLoading(true);

    setOwnedProjects((current) =>
      current.filter((project) => project.id !== selectedProjectId),
    );

    closeDialog();
  }

  return {
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
  };
}
