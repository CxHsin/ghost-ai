"use client";

import { FolderKanban, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={[
        "pointer-events-none absolute inset-y-0 left-0 z-20 w-full max-w-80 p-3 transition duration-200 ease-out sm:p-4",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
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
          <TabsList variant="line" className="h-auto w-full gap-2 rounded-xl bg-subtle p-1">
            <TabsTrigger
              value="my-projects"
              className="rounded-lg px-3 py-2 text-copy-secondary data-active:bg-surface data-active:text-copy-primary"
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className="rounded-lg px-3 py-2 text-copy-secondary data-active:bg-surface data-active:text-copy-primary"
            >
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="mt-4 min-h-0 flex-1">
            <ProjectPlaceholder label="No personal projects yet" />
          </TabsContent>

          <TabsContent value="shared" className="mt-4 min-h-0 flex-1">
            <ProjectPlaceholder label="No shared projects yet" />
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border px-4 py-4">
          <Button className="w-full justify-center">
            <Plus />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}
