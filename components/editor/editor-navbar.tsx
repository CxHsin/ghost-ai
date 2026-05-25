"use client";

import { UserButton } from "@clerk/nextjs";
import { type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  actions?: ReactNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  subtitle?: string;
  title?: string;
}

export function EditorNavbar({
  actions,
  isSidebarOpen,
  onToggleSidebar,
  subtitle = "Workspace",
  title = "Ghost AI Workspace",
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface/95 px-5 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
        >
          <SidebarIcon />
        </Button>

        <div className="min-w-0">
          <p className="truncate text-base font-medium text-copy-primary">{title}</p>
          <p className="truncate text-xs text-copy-faint">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {actions}
        <UserButton />
      </div>
    </header>
  );
}
