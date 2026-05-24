import { Bot, FileText, Share2 } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const AUTH_FEATURES = [
  {
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
    icon: Bot,
  },
  {
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
    icon: Share2,
  },
  {
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
    icon: FileText,
  },
];

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-base text-copy-primary">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-surface-border bg-surface lg:block">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_top_left,var(--accent-primary-dim),transparent_42%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]"
          />

          <div className="relative flex min-h-screen flex-col px-16 py-14 xl:px-20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand shadow-[0_0_0_1px_var(--accent-primary-dim)]" />
              <span className="text-xl font-semibold tracking-tight text-copy-primary">
                Ghost AI
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="max-w-[32rem] space-y-10">
                <div className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-copy-muted">
                    {eyebrow}
                  </p>
                  <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-copy-primary">
                    {title}
                  </h1>
                  <p className="max-w-md text-base leading-7 text-copy-secondary">
                    {description}
                  </p>
                </div>

                <div className="space-y-6">
                  {AUTH_FEATURES.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-brand-dim text-brand">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-base font-medium text-copy-primary">{title}</h2>
                        <p className="max-w-md text-sm leading-7 text-copy-muted">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-copy-faint">(c) 2026 Ghost AI. All rights reserved.</p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[32rem] space-y-6">
            <div className="space-y-3 lg:hidden">
              <div className="inline-flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand shadow-[0_0_0_1px_var(--accent-primary-dim)]" />
                <span className="text-2xl font-semibold tracking-tight text-copy-primary">
                  Ghost AI
                </span>
              </div>
              <p className="text-sm uppercase tracking-[0.24em] text-copy-muted">{eyebrow}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
