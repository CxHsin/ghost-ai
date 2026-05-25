import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import { type ProjectListItem } from "@/components/editor/project-list-item";
import {
  listProjectsForOwner,
  listSharedProjectsForCollaboratorEmail,
} from "@/lib/project-api";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

function toProjectListItem(
  project: {
    id: string;
    name: string;
  },
  isOwned: boolean,
): ProjectListItem {
  return {
    id: project.id,
    isOwned,
    name: project.name,
    roomId: project.id,
  };
}

export default async function EditorWorkspacePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const project = await getAccessibleProject(roomId, identity);

  if (!project) {
    return <AccessDenied />;
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    listProjectsForOwner(identity.userId),
    identity.primaryEmail
      ? listSharedProjectsForCollaboratorEmail(identity.primaryEmail)
      : [],
  ]);

  return (
    <EditorWorkspaceShell
      canManageAccess={project.ownerId === identity.userId}
      currentProject={{
        id: project.id,
        name: project.name,
        roomId: project.id,
      }}
      ownedProjects={ownedProjects.map((item) => toProjectListItem(item, true))}
      sharedProjects={sharedProjects.map((item) => toProjectListItem(item, false))}
    />
  );
}
