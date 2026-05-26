"use client";

import Link from "next/link";
import { FolderKanban, Pencil, Plus, Trash2, X } from "lucide-react";

import { type ProjectListItem } from "@/components/editor/project-list-item";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  activeProjectId?: string | null;
  isOpen: boolean;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  onCreateProject: () => void;
  onClose: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string) => void;
}

function ProjectPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-base/60 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-dim text-brand">
        <FolderKanban className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-copy-primary">{label}</h3>
      <p className="mt-2 max-w-56 text-sm leading-6 text-copy-muted">
        Projects will appear here once this workspace is connected to project data.
      </p>
    </div>
  );
}

function ProjectList({
  activeProjectId,
  emptyLabel,
  projects,
  onDeleteProject,
  onRenameProject,
}: {
  activeProjectId?: string | null;
  emptyLabel: string;
  projects: ProjectListItem[];
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string) => void;
}) {
  if (projects.length === 0) {
    return <ProjectPlaceholder label={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(
            "rounded-2xl border px-4 py-4 transition-colors",
            project.id === activeProjectId
              ? "border-brand bg-gradient-to-r from-brand-dim to-brand-dim/30 shadow-[0_0_0_1px_rgba(0,200,212,0.08)]"
              : "border-surface-border bg-base/60 hover:bg-elevated/80",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/editor/${project.id}`}
              className="min-w-0 flex-1 rounded-xl outline-none ring-brand transition focus-visible:ring-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "mt-0.5 size-2 shrink-0 rounded-full",
                    project.id === activeProjectId ? "bg-brand" : "bg-copy-faint",
                  )}
                />
                <p className="truncate text-sm font-medium text-copy-primary">
                  {project.name}
                </p>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-copy-muted">
                {project.roomId}
              </p>
            </Link>

            {project.isOwned ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRenameProject(project.id)}
                  aria-label={`Rename ${project.name}`}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeleteProject(project.id)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectSidebar({
  activeProjectId = null,
  isOpen,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onClose,
  onDeleteProject,
  onRenameProject,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close projects sidebar backdrop"
          className="absolute inset-0 z-10 bg-base/70 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          "pointer-events-none absolute inset-y-0 left-0 z-20 w-full max-w-[22rem] p-3 transition duration-200 ease-out sm:max-w-[23rem] sm:p-3.5",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="pointer-events-auto flex h-full flex-col rounded-[2rem] border border-surface-border bg-surface/95 shadow-xl shadow-black/25 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-xl font-semibold tracking-tight text-copy-primary">Projects</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close projects sidebar"
            >
              <X />
            </Button>
          </div>

          <Tabs
            defaultValue="my-projects"
            className="flex min-h-0 flex-1 flex-col px-4 py-4"
          >
            <TabsList
              variant="line"
              className="h-auto w-full gap-2 rounded-2xl border border-surface-border bg-subtle/80 p-1"
            >
              <TabsTrigger
                value="my-projects"
                className="rounded-xl px-3 py-2 text-sm text-copy-secondary data-active:bg-base data-active:text-copy-primary"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-xl px-3 py-2 text-sm text-copy-secondary data-active:bg-base data-active:text-copy-primary"
              >
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-4 min-h-0 flex-1">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={ownedProjects}
                emptyLabel="No personal projects yet"
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
              />
            </TabsContent>

            <TabsContent value="shared" className="mt-4 min-h-0 flex-1">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={sharedProjects}
                emptyLabel="No shared projects yet"
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
              />
            </TabsContent>
          </Tabs>

          <div className="border-t border-surface-border px-5 py-4">
            <Button className="h-10 w-full justify-center rounded-2xl text-sm" onClick={onCreateProject}>
              <Plus />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
