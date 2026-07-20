-- CreateTable
CREATE TABLE "report_comment_reactions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_comment_reactions_commentId_userId_key" ON "report_comment_reactions"("commentId", "userId");

-- CreateIndex
CREATE INDEX "report_comment_reactions_userId_idx" ON "report_comment_reactions"("userId");

-- AddForeignKey
ALTER TABLE "report_comment_reactions" ADD CONSTRAINT "report_comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "report_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_comment_reactions" ADD CONSTRAINT "report_comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
