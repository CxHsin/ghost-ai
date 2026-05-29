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
    <div className="space-y-2.5">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(
            "rounded-2xl border px-4 py-3.5 transition-[background-color,border-color,box-shadow]",
            project.id === activeProjectId
              ? "border-brand/20 bg-gradient-to-r from-brand-dim via-brand-dim to-brand-dim/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,200,212,0.06)]"
              : "border-transparent bg-transparent hover:bg-elevated/45",
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
                    project.id === activeProjectId ? "bg-brand" : "bg-copy-faint/70",
                  )}
                />
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    project.id === activeProjectId ? "text-copy-primary" : "text-copy-secondary",
                  )}
                >
                  {project.name}
                </p>
              </div>
              <p
                className={cn(
                  "mt-1 truncate font-mono text-xs",
                  project.id === activeProjectId ? "text-copy-muted" : "text-copy-faint",
                )}
              >
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
          "pointer-events-none absolute inset-y-0 left-0 z-20 w-full max-w-[22rem] p-2.5 transition duration-200 ease-out sm:max-w-[21.5rem] sm:p-3",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="pointer-events-auto flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-surface-border bg-surface/96 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <div className="flex min-h-[4.9rem] items-start justify-between gap-4 border-b border-surface-border px-4 py-4">
            <div className="min-w-0 pt-0.5">
              <h2 className="text-lg font-medium tracking-tight text-copy-primary">Projects</h2>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="mt-0.5 rounded-full border border-surface-border bg-subtle text-copy-secondary shadow-none hover:bg-elevated hover:text-copy-primary"
              onClick={onClose}
              aria-label="Close projects sidebar"
            >
              <X />
            </Button>
          </div>

          <Tabs
            defaultValue="my-projects"
            className="flex min-h-0 flex-1 flex-col px-3 py-3.5"
          >
            <TabsList
              variant="default"
              className="h-auto w-full gap-1 rounded-full! border border-transparent bg-subtle/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <TabsTrigger
                value="my-projects"
                className="h-9! min-w-0 rounded-full! border! border-transparent bg-transparent! px-4 py-0 text-sm font-semibold text-copy-secondary shadow-none! transition-[background-color,border-color,color,box-shadow] after:hidden hover:text-copy-primary data-[state=active]:border-transparent! data-[state=active]:bg-base! data-[state=active]:text-copy-primary! data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_6px_14px_rgba(0,0,0,0.26)] data-[state=active]:after:hidden"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="h-9! min-w-0 rounded-full! border! border-transparent bg-transparent! px-4 py-0 text-sm font-semibold text-copy-secondary shadow-none! transition-[background-color,border-color,color,box-shadow] after:hidden hover:text-copy-primary data-[state=active]:border-transparent! data-[state=active]:bg-base! data-[state=active]:text-copy-primary! data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_6px_14px_rgba(0,0,0,0.26)] data-[state=active]:after:hidden"
              >
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-3 min-h-0 flex-1">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={ownedProjects}
                emptyLabel="No personal projects yet"
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
              />
            </TabsContent>

            <TabsContent value="shared" className="mt-3 min-h-0 flex-1">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={sharedProjects}
                emptyLabel="No shared projects yet"
                onDeleteProject={onDeleteProject}
                onRenameProject={onRenameProject}
              />
            </TabsContent>
          </Tabs>

          <div className="border-t border-surface-border px-4 py-4">
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
