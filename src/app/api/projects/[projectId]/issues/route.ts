import { requireProjectAccess } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { publishIssueEvent, toIssueRealtimePayload } from "@/lib/realtime";
import { createIssueSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]/issues">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId, "write");
  if ("error" in access) return access.error;

  const project = await db.project.findFirst({
    where: { id: projectId },
    select: {
      id: true,
      workspaceId: true,
      _count: { select: { reports: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = createIssueSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assigneeIds = parsed.data.assigneeIds;
  if (assigneeIds.length > 0) {
    const validAssigneeCount = await db.membership.count({
      where: {
        workspaceId: project.workspaceId,
        userId: { in: assigneeIds },
        OR: [
          { role: { in: ["OWNER", "ADMIN"] } },
          { projectMemberships: { some: { projectId } } },
        ],
      },
    });
    if (validAssigneeCount !== new Set(assigneeIds).size) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const reporterName = access.session.user.name ?? access.session.user.email;
  const assignees = assigneeIds.length
    ? await db.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const assigneeNameById = new Map(
    assignees.map((assignee) => [assignee.id, assignee.name || assignee.email]),
  );

  const metadata = {
    type: parsed.data.type,
    priority: parsed.data.priority,
    assigneeIds,
    reporterName,
    reporterId: access.session.user.id,
    issueNumber: project._count.reports + 1,
    activityLog: [
      {
        id: crypto.randomUUID(),
        kind: "reported",
        at: now,
        actorName: reporterName,
        issueType: parsed.data.type,
      },
      ...(parsed.data.priority !== "NONE"
        ? [
            {
              id: crypto.randomUUID(),
              kind: "priority",
              at: now,
              actorName: reporterName,
              fromPriority: "NONE",
              toPriority: parsed.data.priority,
            },
          ]
        : []),
      ...(assigneeIds.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              kind: "assignment",
              at: now,
              actorName: reporterName,
              fromAssigneeIds: [],
              toAssigneeIds: assigneeIds,
              toAssigneeNames: assigneeIds
                .map((id) => assigneeNameById.get(id))
                .filter((name): name is string => Boolean(name)),
            },
          ]
        : []),
    ],
  };

  const report = await db.report.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      severity: "MEDIUM",
      pageUrl: parsed.data.pageUrl,
      metadata,
    },
  });
  const issue = toIssueRealtimePayload(report);

  publishIssueEvent({
    type: "issue.created",
    projectId,
    issueId: report.id,
    issue,
  });

  return NextResponse.json(issue, { status: 201 });
}
