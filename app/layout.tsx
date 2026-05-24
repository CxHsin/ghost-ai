import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Real-time collaborative system design workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base text-copy-primary">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              borderRadius: "0.75rem",
              colorBackground: "var(--bg-surface)",
              colorBorder: "var(--border-default)",
              colorDanger: "var(--state-error)",
              colorForeground: "var(--text-primary)",
              colorInput: "var(--bg-subtle)",
              colorInputForeground: "var(--text-primary)",
              colorMuted: "var(--bg-subtle)",
              colorMutedForeground: "var(--text-muted)",
              colorNeutral: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--bg-base)",
              colorRing: "var(--accent-primary)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              fontFamily: "var(--font-geist-sans)",
              fontFamilyButtons: "var(--font-geist-sans)",
              fontFamilyMono: "var(--font-geist-mono)",
            },
            elements: {
              rootBox: "w-full font-sans",
              cardBox: "w-full max-w-[28rem]",
              card: "rounded-3xl border border-surface-border bg-surface font-sans shadow-none",
              headerTitle: "text-copy-primary text-3xl font-semibold tracking-tight",
              headerSubtitle: "text-copy-secondary",
              socialButtonsBlockButton:
                "border border-surface-border bg-subtle text-copy-primary shadow-none transition-colors hover:bg-elevated",
              socialButtonsBlockButtonText: "text-copy-primary font-medium",
              dividerLine: "bg-surface-border",
              dividerText: "text-copy-muted",
              formFieldLabel: "text-copy-primary",
              formFieldInput:
                "border border-surface-border bg-subtle font-sans text-copy-primary shadow-none placeholder:text-copy-muted focus:border-brand focus:ring-0",
              formButtonPrimary:
                "bg-brand text-base font-medium text-black shadow-none hover:bg-brand/90",
              footerActionText: "text-copy-secondary",
              footerActionLink: "text-brand hover:text-brand",
              identityPreviewText: "text-copy-muted",
              identityPreviewEditButton: "text-brand hover:text-brand",
              formResendCodeLink: "text-brand hover:text-brand",
              otpCodeFieldInput:
                "border border-surface-border bg-subtle text-copy-primary shadow-none",
              alertText: "text-copy-primary",
              alertClerkError: "border border-[var(--state-error)]/30 bg-surface",
              footer: "bg-transparent",
              footerPageLink: "text-brand hover:text-brand",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
