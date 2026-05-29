import { currentUser } from "@clerk/nextjs/server";

import { EditorHomeShell } from "@/components/editor/editor-home-shell";
import {
  listProjectsForOwner,
  listSharedProjectsForCollaboratorEmail,
  requireAuthenticatedUserId,
} from "@/lib/project-api";

export default async function EditorPage() {
  const [{ userId }, user] = await Promise.all([
    requireAuthenticatedUserId(),
    currentUser(),
  ]);

  const collaboratorEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const ownedProjects = userId ? await listProjectsForOwner(userId) : [];
  const sharedProjects = collaboratorEmail
    ? await listSharedProjectsForCollaboratorEmail(collaboratorEmail)
    : [];

  return (
    <EditorHomeShell
      ownedProjects={ownedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        roomId: project.id,
        isOwned: true,
      }))}
      sharedProjects={sharedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        roomId: project.id,
        isOwned: false,
      }))}
    />
  );
}
