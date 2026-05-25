import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 py-10">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-surface-border bg-surface px-8 py-10 text-center shadow-2xl shadow-black/30">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-dim text-brand">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-copy-primary">
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-copy-secondary">
          This workspace is unavailable or you do not have permission to open it.
        </p>
        <Button asChild className="mt-6">
          <Link href="/editor">Back to projects</Link>
        </Button>
      </div>
    </main>
  );
}
