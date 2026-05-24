import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Get Started"
      title="Create your Ghost AI account."
      description="Sign up to create your first project and unlock the collaborative editor."
    >
      <SignUp />
    </AuthShell>
  );
}
