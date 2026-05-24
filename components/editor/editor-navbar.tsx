"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface/95 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
        >
          <SidebarIcon />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <p className="text-sm font-medium text-copy-secondary">Ghost AI Workspace</p>
      </div>

      <div className="flex flex-1 items-center justify-end">
        <UserButton />
      </div>
    </header>
  );
}
