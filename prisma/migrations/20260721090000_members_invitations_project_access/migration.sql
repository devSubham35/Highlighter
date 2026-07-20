-- Extend workspace RBAC and invitation lifecycle.
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'VIEWER';
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'REVOKED';

ALTER TABLE "memberships"
  ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resentAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "project_memberships" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_memberships_membershipId_projectId_key"
  ON "project_memberships"("membershipId", "projectId");

CREATE INDEX IF NOT EXISTS "project_memberships_projectId_idx"
  ON "project_memberships"("projectId");

ALTER TABLE "project_memberships"
  ADD CONSTRAINT "project_memberships_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_memberships"
  ADD CONSTRAINT "project_memberships_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "invitation_projects" (
  "id" TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  CONSTRAINT "invitation_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invitation_projects_invitationId_projectId_key"
  ON "invitation_projects"("invitationId", "projectId");

CREATE INDEX IF NOT EXISTS "invitation_projects_projectId_idx"
  ON "invitation_projects"("projectId");

ALTER TABLE "invitation_projects"
  ADD CONSTRAINT "invitation_projects_invitationId_fkey"
  FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invitation_projects"
  ADD CONSTRAINT "invitation_projects_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
