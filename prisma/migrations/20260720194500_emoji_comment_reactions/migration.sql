-- AlterTable
ALTER TABLE "report_comment_reactions" ADD COLUMN "emoji" TEXT NOT NULL DEFAULT '👍';

-- DropIndex
DROP INDEX "report_comment_reactions_commentId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "report_comment_reactions_commentId_userId_emoji_key" ON "report_comment_reactions"("commentId", "userId", "emoji");
