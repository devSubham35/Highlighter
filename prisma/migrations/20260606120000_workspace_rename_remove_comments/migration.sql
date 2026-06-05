-- Drop comments table and related foreign keys
DROP TABLE IF EXISTS "comments";

-- Rename organizations to workspaces
ALTER TABLE "organizations" RENAME TO "workspaces";

-- Rename foreign key columns
ALTER TABLE "memberships" RENAME COLUMN "organizationId" TO "workspaceId";
ALTER TABLE "projects" RENAME COLUMN "organizationId" TO "workspaceId";
ALTER TABLE "invitations" RENAME COLUMN "organizationId" TO "workspaceId";

-- Rename unique constraints on memberships
ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "memberships_userId_organizationId_key";
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_workspaceId_key" UNIQUE ("userId", "workspaceId");

-- Rename foreign key constraints
ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "memberships_organizationId_fkey";
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_organizationId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_organizationId_fkey";
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename indexes
DROP INDEX IF EXISTS "projects_organizationId_idx";
CREATE INDEX "projects_workspaceId_idx" ON "projects"("workspaceId");

DROP INDEX IF EXISTS "invitations_organizationId_idx";
CREATE INDEX "invitations_workspaceId_idx" ON "invitations"("workspaceId");
