import { randomUUID } from "node:crypto";

import { get, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";

export const SPEC_MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

interface PersistGeneratedSpecInput {
  markdown: string;
  projectId: string;
}

export function getBlobReadWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (typeof token !== "string") {
    return null;
  }

  const trimmedToken = token.trim();

  return trimmedToken.length > 0 ? trimmedToken : null;
}

export function getSpecDownloadFileName(specId: string) {
  const safeSpecId = specId.replace(/[^a-zA-Z0-9_-]/g, "");

  return `ghost-ai-spec-${safeSpecId || "download"}.md`;
}

export async function persistGeneratedSpec({
  markdown,
  projectId,
}: PersistGeneratedSpecInput) {
  const blobToken = getBlobReadWriteToken();

  if (!blobToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  const specId = randomUUID();
  const normalizedMarkdown = markdown.trim();

  if (normalizedMarkdown.length === 0) {
    throw new Error("Cannot persist an empty generated specification.");
  }

  const blob = await put(
    `specs/${projectId}/${specId}.md`,
    normalizedMarkdown,
    {
      access: "private",
      addRandomSuffix: false,
      contentType: SPEC_MARKDOWN_CONTENT_TYPE,
      token: blobToken,
    },
  );

  return prisma.projectSpec.create({
    data: {
      id: specId,
      filePath: blob.url,
      projectId,
    },
    select: {
      createdAt: true,
      filePath: true,
      id: true,
      projectId: true,
    },
  });
}

export async function readSpecMarkdownBlob(filePath: string) {
  const blobToken = getBlobReadWriteToken();

  if (!blobToken) {
    return {
      kind: "not_configured",
    } as const;
  }

  const blob = await get(filePath, {
    access: "private",
    token: blobToken,
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200) {
    return {
      kind: "not_found",
    } as const;
  }

  return {
    kind: "success",
    markdown: await new Response(blob.stream).text(),
  } as const;
}
