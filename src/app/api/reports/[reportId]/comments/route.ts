import { requireProjectAccess, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { publishIssueEvent } from "@/lib/realtime";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

async function requireReport(reportId: string, mode: "read" | "write" = "read") {
  const session = await requireSession();
  if ("error" in session) return { error: "Unauthorized" as const };

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, projectId: true },
  });

  if (!report) return { error: "Not found" as const };
  const access = await requireProjectAccess(report.projectId, mode);
  if ("error" in access) {
    if (access.error.status === 401) return { error: "Unauthorized" as const };
    if (access.error.status === 403) return { error: "Forbidden" as const };
    return { error: "Not found" as const };
  }
  return { session: access.session, report };
}

function toCommentPayload(comment: {
  id: string;
  reportId: string;
  body: string;
  createdAt: Date | string;
  reactionCount: number;
  reactedByMe: boolean;
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }>;
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}) {
  return {
    ...comment,
    createdAt:
      comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
  };
}

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
  commentId: string;
  emoji: string;
  count: bigint | number;
  reactedByMe: boolean;
};

function rowToComment(
  row: CommentRow,
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }> = [],
) {
  const reactionCount = reactions.reduce((total, reaction) => total + reaction.count, 0);
  return toCommentPayload({
    id: row.id,
    reportId: row.reportId,
    body: row.body,
    createdAt: row.createdAt,
    reactionCount,
    reactedByMe: reactions.some((reaction) => reaction.reactedByMe),
    reactions,
    author: {
      id: row.authorId,
      name: row.authorName,
      email: row.authorEmail,
      image: row.authorImage,
    },
  });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]/comments">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  const comments = await db.$queryRaw<CommentRow[]>(Prisma.sql`
    SELECT
      c."id",
      c."reportId",
      c."body",
      c."createdAt",
      u."id" AS "authorId",
      u."name" AS "authorName",
      u."email" AS "authorEmail",
      u."image" AS "authorImage"
    FROM "report_comments" c
    INNER JOIN "users" u ON u."id" = c."authorId"
    WHERE c."reportId" = ${reportId}
    ORDER BY c."createdAt" ASC
  `);

  if (comments.length === 0) return NextResponse.json([]);

  const reactions = await db.$queryRaw<ReactionRow[]>(Prisma.sql`
    SELECT
      r."commentId",
      r."emoji",
      COUNT(*) AS "count",
      BOOL_OR(r."userId" = ${access.session.user.id}) AS "reactedByMe"
    FROM "report_comment_reactions" r
    WHERE r."commentId" IN (${Prisma.join(comments.map((comment) => comment.id))})
    GROUP BY r."commentId", r."emoji"
    ORDER BY MIN(r."createdAt") ASC
  `);
  const reactionsByCommentId = new Map<string, Array<{ emoji: string; count: number; reactedByMe: boolean }>>();
  for (const reaction of reactions) {
    const group = reactionsByCommentId.get(reaction.commentId) ?? [];
    group.push({
      emoji: reaction.emoji,
      count: Number(reaction.count),
      reactedByMe: reaction.reactedByMe,
    });
    reactionsByCommentId.set(reaction.commentId, group);
  }

  return NextResponse.json(
    comments.map((comment) => rowToComment(comment, reactionsByCommentId.get(comment.id))),
  );
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]/comments">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId, "write");
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  const parsed = createCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const commentId = crypto.randomUUID();
  const [comment] = await db.$queryRaw<CommentRow[]>(Prisma.sql`
    INSERT INTO "report_comments" ("id", "reportId", "authorId", "body", "createdAt", "updatedAt")
    VALUES (${commentId}, ${reportId}, ${access.session.user.id}, ${parsed.data.body}, NOW(), NOW())
    RETURNING
      "id",
      "reportId",
      "body",
      "createdAt",
      ${access.session.user.id} AS "authorId",
      ${access.session.user.name ?? ""} AS "authorName",
      ${access.session.user.email} AS "authorEmail",
      ${access.session.user.image ?? null} AS "authorImage"
  `);
  const payload = rowToComment(comment);

  publishIssueEvent({
    type: "issue.comment_created",
    projectId: access.report.projectId,
    issueId: reportId,
    comment: payload,
  });

  return NextResponse.json(payload, { status: 201 });
}
