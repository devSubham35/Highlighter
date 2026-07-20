import { requireProjectAccess, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { publishIssueEvent } from "@/lib/realtime";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

type CommentRow = {
  id: string;
  reportId: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorImage: string | null;
};

type ReactionRow = {
  emoji: string;
  count: bigint | number;
  reactedByMe: boolean;
};

async function requireReport(reportId: string) {
  const session = await requireSession();
  if ("error" in session) return { error: "Unauthorized" as const };

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, projectId: true },
  });

  if (!report) return { error: "Not found" as const };
  const access = await requireProjectAccess(report.projectId, "write");
  if ("error" in access) {
    if (access.error.status === 401) return { error: "Unauthorized" as const };
    if (access.error.status === 403) return { error: "Forbidden" as const };
    return { error: "Not found" as const };
  }
  return { session: access.session, report };
}

function rowToComment(
  row: CommentRow,
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }> = [],
) {
  const reactionCount = reactions.reduce((total, reaction) => total + reaction.count, 0);
  return {
    id: row.id,
    reportId: row.reportId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    reactionCount,
    reactedByMe: reactions.some((reaction) => reaction.reactedByMe),
    reactions,
    author: {
      id: row.authorId,
      name: row.authorName,
      email: row.authorEmail,
      image: row.authorImage,
    },
  };
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/reports/[reportId]/comments/[commentId]">,
) {
  const { reportId, commentId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  const parsed = updateCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [comment] = await db.$queryRaw<CommentRow[]>(Prisma.sql`
    UPDATE "report_comments" c
    SET "body" = ${parsed.data.body}, "updatedAt" = NOW()
    FROM "users" u
    WHERE c."id" = ${commentId}
      AND c."reportId" = ${reportId}
      AND u."id" = c."authorId"
    RETURNING
      c."id",
      c."reportId",
      c."body",
      c."createdAt",
      u."id" AS "authorId",
      u."name" AS "authorName",
      u."email" AS "authorEmail",
      u."image" AS "authorImage"
  `);

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reactions = await db.$queryRaw<ReactionRow[]>(Prisma.sql`
    SELECT
      r."emoji",
      COUNT(*) AS "count",
      BOOL_OR(r."userId" = ${access.session.user.id}) AS "reactedByMe"
    FROM "report_comment_reactions" r
    WHERE r."commentId" = ${commentId}
    GROUP BY r."emoji"
    ORDER BY MIN(r."createdAt") ASC
  `);

  const payload = rowToComment(
    comment,
    reactions.map((reaction) => ({
      emoji: reaction.emoji,
      count: Number(reaction.count),
      reactedByMe: reaction.reactedByMe,
    })),
  );
  publishIssueEvent({
    type: "issue.comment_updated",
    projectId: access.report.projectId,
    issueId: reportId,
    comment: payload,
  });

  return NextResponse.json(payload);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/reports/[reportId]/comments/[commentId]">,
) {
  const { reportId, commentId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  const deleted = await db.$executeRaw(Prisma.sql`
    DELETE FROM "report_comments"
    WHERE "id" = ${commentId}
      AND "reportId" = ${reportId}
  `);

  if (deleted === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  publishIssueEvent({
    type: "issue.comment_deleted",
    projectId: access.report.projectId,
    issueId: reportId,
    commentId,
  });

  return NextResponse.json({ ok: true });
}
