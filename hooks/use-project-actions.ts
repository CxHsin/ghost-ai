"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { type ProjectListItem } from "@/components/editor/project-list-item";

type DialogMode = "create" | "rename" | "delete" | null;

interface UseProjectActionsOptions {
  activeProjectId?: string | null;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

interface ProjectFormState {
  name: string;
  roomIdPreview: string;
}

interface ErrorResponseBody {
  error?: {
    code?: string;
    message?: string;
  };
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as ErrorResponseBody | null;

  return payload?.error?.message ?? fallbackMessage;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function slugifyProjectName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "project";
}

function createShortSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

function createRoomId(name: string, suffix: string) {
  return `${slugifyProjectName(name)}-${suffix}`;
}

export function useProjectActions({
  activeProjectId = null,
  ownedProjects,
  sharedProjects,
}: UseProjectActionsOptions) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createSuffix, setCreateSuffix] = useState(() => createShortSuffix());
  const [formState, setFormState] = useState<ProjectFormState>({
    name: "",
    roomIdPreview: createRoomId("", createShortSuffix()),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedProject = useMemo(
    () => ownedProjects.find((project) => project.id === selectedProjectId) ?? null,
    [ownedProjects, selectedProjectId],
  );

  function closeDialog() {
    setActiveDialog(null);
    setSelectedProjectId(null);
    setErrorMessage(null);
    setIsLoading(false);
  }

  function updateName(name: string) {
    setFormState((current) => ({
      ...current,
      name,
      roomIdPreview:
        activeDialog === "create"
          ? createRoomId(name, createSuffix)
          : current.roomIdPreview,
    }));
  }

  function openCreateDialog() {
    const suffix = createShortSuffix();

    setCreateSuffix(suffix);
    setSelectedProjectId(null);
    setErrorMessage(null);
    setFormState({
      name: "",
      roomIdPreview: createRoomId("", suffix),
    });
    setActiveDialog("create");
  }

  function openRenameDialog(projectId: string) {
    const project = ownedProjects.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    setErrorMessage(null);
    setSelectedProjectId(project.id);
    setFormState({
      name: project.name,
      roomIdPreview: project.roomId,
    });
    setActiveDialog("rename");
  }

  function openDeleteDialog(projectId: string) {
    const project = ownedProjects.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    setErrorMessage(null);
    setSelectedProjectId(project.id);
    setFormState({
      name: project.name,
      roomIdPreview: project.roomId,
    });
    setActiveDialog("delete");
  }

  async function submitCreate() {
    const name = formState.name.trim();

    if (!name) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formState.roomIdPreview,
          name,
        }),
      });

      if (!response.ok) {
        const message =
          response.status === 409
            ? await readErrorMessage(response, "A project with this ID already exists.")
            : await readErrorMessage(response, "Failed to create project.");

        throw new Error(message);
      }

      const payload = (await response.json()) as {
        data: {
          project: {
            id: string;
          };
        };
      };
      const createdRoomId = payload.data.project.id;

      closeDialog();
      router.push(`/editor/${createdRoomId}`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create project."));
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRename() {
    const name = formState.name.trim();

    if (!name || !selectedProjectId) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to rename project."));
      }

      closeDialog();
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to rename project."));
    } finally {
      setIsLoading(false);
    }
  }

  async function submitDelete() {
    if (!selectedProjectId) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete project."));
      }

      closeDialog();

      if (selectedProjectId === activeProjectId) {
        router.replace("/editor");
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to delete project."));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    activeDialog,
    closeDialog,
    errorMessage,
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
