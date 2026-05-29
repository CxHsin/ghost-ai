import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk";

const projectRef = process.env.TRIGGER_PROJECT_REF ?? "proj_your_project_ref";

export default defineConfig({
  project: projectRef,
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 10_000,
      factor: 2,
    },
  },
  build: {
    extensions: [
      prismaExtension({
        mode: "modern",
      }),
    ],
  },
});
