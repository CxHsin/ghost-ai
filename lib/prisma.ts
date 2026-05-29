import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function isAccelerateUrl(databaseUrl: string) {
  return databaseUrl.startsWith("prisma+postgres://");
}

function isPrismaHostedPostgresUrl(databaseUrl: string) {
  try {
    const parsedUrl = new URL(databaseUrl);

    return parsedUrl.hostname.endsWith(".db.prisma.io");
  } catch {
    return false;
  }
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (isAccelerateUrl(databaseUrl)) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: isPrismaHostedPostgresUrl(databaseUrl) ? 1 : 10,
    maxLifetimeSeconds: isPrismaHostedPostgresUrl(databaseUrl) ? 60 : 0,
  });

  const adapter = new PrismaPg(pool, {
    onConnectionError: (error) => {
      console.error("Prisma pg connection error.", error);
    },
    onPoolError: (error) => {
      console.error("Prisma pg pool error.", error);
    },
  });

  return new PrismaClient({
    adapter,
  });
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalForPrisma.prisma ??= createPrismaClient());
