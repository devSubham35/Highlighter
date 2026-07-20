import { requireProjectAccess, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { publishIssueEvent } from "@/lib/realtime";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const toggleReactionSchema = z.object({
  emoji: z.string().trim().min(1).max(64),
});

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

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/reports/[reportId]/comments/[commentId]/reactions">,
) {
  const { reportId, commentId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  const [comment] = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "report_comments"
    WHERE "id" = ${commentId}
      AND "reportId" = ${reportId}
  `);
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = toggleReactionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const emoji = parsed.data.emoji;

  const [existing] = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "report_comment_reactions"
    WHERE "commentId" = ${commentId}
      AND "userId" = ${access.session.user.id}
      AND "emoji" = ${emoji}
  `);

  const reactedByUser = !existing;
  if (existing) {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "report_comment_reactions"
      WHERE "id" = ${existing.id}
    `);
  } else {
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "report_comment_reactions" ("id", "commentId", "userId", "emoji", "createdAt")
      VALUES (${crypto.randomUUID()}, ${commentId}, ${access.session.user.id}, ${emoji}, NOW())
    `);
  }

  const [reaction] = await db.$queryRaw<Array<{
    count: bigint | number;
    users: Array<{ id: string; name: string | null; email: string }> | null;
  }>>(Prisma.sql`
    SELECT
      COUNT(r.*) AS "count",
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', u."id",
            'name', COALESCE(u."name", u."email"),
            'email', u."email"
          )
          ORDER BY r."createdAt" ASC
        ) FILTER (WHERE r."id" IS NOT NULL),
        '[]'::json
      ) AS "users"
    FROM "report_comment_reactions" r
    INNER JOIN "users" u ON u."id" = r."userId"
    WHERE r."commentId" = ${commentId}
      AND r."emoji" = ${emoji}
  `);
  const count = Number(reaction?.count ?? 0);
  const users = (reaction?.users ?? []).map((user) => ({
    id: user.id,
    name: user.name || user.email,
    email: user.email,
  }));

  publishIssueEvent({
    type: "issue.comment_reaction_updated",
    projectId: access.report.projectId,
    issueId: reportId,
    commentId,
    userId: access.session.user.id,
    emoji,
    count,
    reactedByUser,
    users,
  });

  return NextResponse.json({
    commentId,
    emoji,
    count,
    reactedByMe: reactedByUser,
    users,
  });
}
