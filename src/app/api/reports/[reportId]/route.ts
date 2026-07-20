import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishIssueEvent, toIssueRealtimePayload } from "@/lib/realtime";
import { appendActivityLog, mergeReportMetadata, parseReportMetadata } from "@/lib/report-metadata";
import { updateReportSchema, updateReportStatusSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function requireReport(reportId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" as const };

  const report = await db.report.findFirst({
    where: {
      id: reportId,
      project: { workspace: { memberships: { some: { userId: session.user.id } } } },
    },
    include: { project: true },
  });

  if (!report) return { error: "Not found" as const };
  return { session, report };
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }
  return NextResponse.json(access.report);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  const body = await req.json();
  const parsed = updateReportSchema.safeParse(body);
  if (!parsed.success) {
    const legacy = updateReportStatusSchema.safeParse(body);
    if (!legacy.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const report = await db.report.update({
      where: { id: reportId },
      data: legacy.data,
    });
    publishIssueEvent({
      type: "issue.updated",
      projectId: report.projectId,
      issueId: report.id,
      issue: toIssueRealtimePayload(report),
      changed: { status: true },
    });
    return NextResponse.json(report);
  }

  const existingMetadata = parseReportMetadata(access.report.metadata);
  let nextMetadata = parsed.data.metadata
    ? mergeReportMetadata(existingMetadata, parsed.data.metadata)
    : undefined;

  const nextAssigneeIds = parsed.data.metadata?.assigneeIds;
  if (nextMetadata && nextAssigneeIds) {
    const previousAssigneeIds = existingMetadata.assigneeIds ?? [];
    const assignmentChanged =
      previousAssigneeIds.length !== nextAssigneeIds.length ||
      previousAssigneeIds.some((id) => !nextAssigneeIds.includes(id));

    if (assignmentChanged) {
      const assignees = await db.user.findMany({
        where: { id: { in: nextAssigneeIds } },
        select: { id: true, name: true, email: true },
      });
      const assigneeNameById = new Map(
        assignees.map((assignee) => [assignee.id, assignee.name || assignee.email]),
      );

      nextMetadata = appendActivityLog(nextMetadata, {
        kind: "assignment",
        actorName: access.session.user.name ?? access.session.user.email,
        fromAssigneeIds: previousAssigneeIds,
        toAssigneeIds: nextAssigneeIds,
        toAssigneeNames: nextAssigneeIds
          .map((id) => assigneeNameById.get(id))
          .filter((name): name is string => Boolean(name)),
      });
    }
  }

  const report = await db.report.update({
    where: { id: reportId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(nextMetadata ? { metadata: nextMetadata } : {}),
    },
  });

  publishIssueEvent({
    type: "issue.updated",
    projectId: report.projectId,
    issueId: report.id,
    issue: toIssueRealtimePayload(report),
    changed: {
      ...(parsed.data.status ? { status: true } : {}),
      ...(parsed.data.description !== undefined ? { description: true } : {}),
      ...(parsed.data.metadata?.type ? { type: parsed.data.metadata.type } : {}),
      ...(parsed.data.metadata?.priority ? { priority: parsed.data.metadata.priority } : {}),
      ...(parsed.data.metadata?.assigneeIds ? { assigneeIds: parsed.data.metadata.assigneeIds } : {}),
      ...(parsed.data.metadata ? { metadata: true } : {}),
    },
  });

  return NextResponse.json(report);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  await db.report.delete({ where: { id: reportId } });
  publishIssueEvent({
    type: "issue.deleted",
    projectId: access.report.projectId,
    issueId: reportId,
  });
  return NextResponse.json({ ok: true });
}
