ALTER TABLE "workspaces" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "workspaces_deletedAt_idx" ON "workspaces"("deletedAt");
