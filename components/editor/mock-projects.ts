"use client";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export const INITIAL_OWNED_PROJECTS: MockProject[] = [
  {
    id: "owned-1",
    name: "Platform Core",
    slug: "platform-core",
    isOwned: true,
  },
  {
    id: "owned-2",
    name: "Realtime Whiteboard",
    slug: "realtime-whiteboard",
    isOwned: true,
  },
];

export const INITIAL_SHARED_PROJECTS: MockProject[] = [
  {
    id: "shared-1",
    name: "Payments Collaboration",
    slug: "payments-collaboration",
    isOwned: false,
  },
];
