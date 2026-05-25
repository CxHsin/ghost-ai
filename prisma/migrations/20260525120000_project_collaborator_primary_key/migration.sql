-- Drop the old unique index before promoting the same columns to the table's primary key.
DROP INDEX "ProjectCollaborator_projectId_email_key";

-- Add a composite primary key for the collaborator join table.
ALTER TABLE "ProjectCollaborator"
ADD CONSTRAINT "ProjectCollaborator_pkey" PRIMARY KEY ("projectId", "email");
