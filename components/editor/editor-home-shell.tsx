"use client";

import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export function EditorHomeShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="max-w-md rounded-3xl border border-surface-border bg-surface px-8 py-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand">
              Clerk Ready
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-copy-primary">
              Your account controls are live.
            </h1>
            <p className="mt-3 text-sm leading-6 text-copy-secondary">
              Use the top-right menu to manage your profile or sign out after your first signup.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
