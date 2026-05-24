import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const AUTH_FEATURES = [
  "AI Architecture Generation",
  "Real-time Collaboration",
  "Instant Spec Generation",
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
        <section className="hidden border-r border-surface-border bg-surface lg:block">
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

                <div className="space-y-3">
                  {AUTH_FEATURES.map((feature) => (
                    <p key={feature} className="text-base leading-7 text-copy-secondary">
                      {feature}
                    </p>
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
