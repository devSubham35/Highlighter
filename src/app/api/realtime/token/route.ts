import { jsonError, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { createRealtimeToken } from "@/lib/realtime";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = (await req.json()) as { projectId?: unknown; issueId?: unknown };
  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const issueId = typeof body.issueId === "string" ? body.issueId : undefined;
  if (!projectId) return jsonError("projectId is required", 400);

  const report = issueId
    ? await db.report.findFirst({
        where: {
          id: issueId,
          projectId,
          project: { workspace: { memberships: { some: { userId: authResult.session.user.id } } } },
        },
        select: { id: true },
      })
    : null;

  if (issueId && !report) return jsonError("Not found", 404);

  if (!issueId) {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspace: { memberships: { some: { userId: authResult.session.user.id } } },
      },
      select: { id: true },
    });
    if (!project) return jsonError("Not found", 404);
  }

  const entry = createRealtimeToken({
    projectId,
    issueId,
    userId: authResult.session.user.id,
  });

  return NextResponse.json({
    token: entry.token,
    expiresAt: new Date(entry.expiresAt).toISOString(),
  });
}
