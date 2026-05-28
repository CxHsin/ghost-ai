"use client";

import { UserButton } from "@clerk/nextjs";
import { type ReactNode } from "react";
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { type CanvasSaveIndicatorState } from "@/types/canvas";

interface EditorNavbarProps {
  actions?: ReactNode;
  isSidebarOpen: boolean;
  onOpenTemplates?: () => void;
  onSave?: () => void;
  onToggleSidebar: () => void;
  saveStatus?: CanvasSaveIndicatorState;
  showSaveButton?: boolean;
  showUserButton?: boolean;
  subtitle?: string;
  title?: string;
}

export function EditorNavbar({
  actions,
  isSidebarOpen,
  onOpenTemplates,
  onSave,
  onToggleSidebar,
  saveStatus = "idle",
  showSaveButton = false,
  showUserButton = true,
  subtitle = "Workspace",
  title = "Ghost AI Workspace",
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const saveButtonLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Error"
          : "Save";
  const saveButtonClassName =
    saveStatus === "saved"
      ? "text-state-success"
      : saveStatus === "error"
        ? "text-state-error"
        : saveStatus === "saving"
          ? "text-brand"
          : "text-copy-secondary";

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
        {showSaveButton ? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className={`rounded-2xl border-surface-border-subtle bg-base/60 ${saveButtonClassName}`}
            onClick={onSave}
            disabled={saveStatus === "saving"}
          >
            <Save className={saveStatus === "idle" ? "text-copy-faint" : ""} />
            {saveButtonLabel}
          </Button>
        ) : null}
        {onOpenTemplates ? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="rounded-2xl"
            onClick={onOpenTemplates}
          >
            <LayoutTemplate />
            Templates
          </Button>
        ) : null}
        {actions}
        {showUserButton ? <UserButton /> : null}
      </div>
    </header>
  );
}
