import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign in to Ghost AI."
      description="Enter your workspace and continue shaping your system design with your team."
    >
      <SignIn />
    </AuthShell>
  );
}
