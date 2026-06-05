import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function canAccessReport(userId: string, reportId: string) {
  return db.report.findFirst({
    where: {
      id: reportId,
      project: { organization: { memberships: { some: { userId } } } },
    },
  });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]/comments">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reportId } = await ctx.params;

  if (!(await canAccessReport(session.user.id, reportId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await db.comment.findMany({
    where: { reportId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]/comments">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reportId } = await ctx.params;

  if (!(await canAccessReport(session.user.id, reportId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = createCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await db.comment.create({
    data: { reportId, authorId: session.user.id, content: parsed.data.content },
    include: { author: true },
  });

  return NextResponse.json(comment, { status: 201 });
}
