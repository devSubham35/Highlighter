import { jsonError, projectAccessWhere, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { createRealtimeToken } from "@/lib/realtime";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = (await req.json()) as { projectId?: unknown; issueId?: unknown; workspaceId?: unknown };
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : undefined;
  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const issueId = typeof body.issueId === "string" ? body.issueId : undefined;

  if (!workspaceId && !projectId && !issueId) {
    const entry = createRealtimeToken({ userId: authResult.session.user.id });
    return NextResponse.json({
      token: entry.token,
      expiresAt: new Date(entry.expiresAt).toISOString(),
    });
  }

  if (workspaceId) {
    const membership = await db.membership.findFirst({
      where: {
        workspaceId,
        userId: authResult.session.user.id,
        suspended: false,
        workspace: { deletedAt: null },
      },
      select: { id: true },
    });
    if (!membership) return jsonError("Not found", 404);
  }

  if (!projectId && issueId) return jsonError("projectId is required for issue rooms", 400);
  const scopedProjectId = projectId ?? undefined;

  const report = issueId
    ? await db.report.findFirst({
        where: {
          id: issueId,
          projectId: scopedProjectId,
          project: projectAccessWhere(authResult.session.user.id),
        },
        select: { id: true },
      })
    : null;

  if (issueId && !report) return jsonError("Not found", 404);

  if (!issueId) {
    const project = await db.project.findFirst({
      where: {
        id: scopedProjectId,
        ...projectAccessWhere(authResult.session.user.id),
      },
      select: { id: true },
    });
    if (!project) return jsonError("Not found", 404);
  }

  const entry = createRealtimeToken({
    projectId: projectId ?? undefined,
    workspaceId,
    issueId,
    userId: authResult.session.user.id,
  });

  return NextResponse.json({
    token: entry.token,
    expiresAt: new Date(entry.expiresAt).toISOString(),
  });
}
