import { requireProjectAccess, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { publishIssueEvent, toIssueRealtimePayload } from "@/lib/realtime";
import { appendActivityLog, mergeReportMetadata, parseReportMetadata } from "@/lib/report-metadata";
import { updateReportSchema, updateReportStatusSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

async function requireReport(reportId: string, mode: "read" | "write" = "read") {
  const session = await requireSession();
  if ("error" in session) return { error: "Unauthorized" as const };

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { project: true },
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

function sameStringSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId, "read");
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }
  return NextResponse.json(access.report);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId, "write");
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
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
  const actorName = access.session.user.name ?? access.session.user.email;
  const clientProvidedActivity = Array.isArray(parsed.data.metadata?.activityLog);
  let nextMetadata = parsed.data.metadata
    ? mergeReportMetadata(existingMetadata, parsed.data.metadata)
    : undefined;

  const nextAssigneeIds = parsed.data.metadata?.assigneeIds;
  if (nextMetadata && nextAssigneeIds) {
    const previousAssigneeIds = existingMetadata.assigneeIds ?? [];
    const assignmentChanged = !sameStringSet(previousAssigneeIds, nextAssigneeIds);

    if (assignmentChanged) {
      const validAssigneeCount = await db.membership.count({
        where: {
          workspaceId: access.report.project.workspaceId,
          userId: { in: nextAssigneeIds },
          suspended: false,
          OR: [
            { role: { in: ["OWNER", "ADMIN"] } },
            { projectMemberships: { some: { projectId: access.report.projectId } } },
          ],
        },
      });
      if (validAssigneeCount !== new Set(nextAssigneeIds).size) {
        return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
      }

      const assignees = await db.user.findMany({
        where: { id: { in: nextAssigneeIds } },
        select: { id: true, name: true, email: true },
      });
      const assigneeNameById = new Map(
        assignees.map((assignee) => [assignee.id, assignee.name || assignee.email]),
      );

      if (!clientProvidedActivity) {
        nextMetadata = appendActivityLog(nextMetadata, {
          kind: "assignment",
          actorName,
          fromAssigneeIds: previousAssigneeIds,
          toAssigneeIds: nextAssigneeIds,
          toAssigneeNames: nextAssigneeIds
            .map((id) => assigneeNameById.get(id))
            .filter((name): name is string => Boolean(name)),
        });
      }
    }
  }

  const previousType = existingMetadata.type ?? "IMPROVEMENT";
  const nextType = parsed.data.metadata?.type;
  if (nextMetadata && !clientProvidedActivity && nextType && nextType !== previousType) {
    nextMetadata = appendActivityLog(nextMetadata, {
      kind: "type",
      actorName,
      fromIssueType: previousType,
      toIssueType: nextType,
    });
  }

  const previousPriority = existingMetadata.priority ?? "NONE";
  const nextPriority = parsed.data.metadata?.priority;
  if (nextMetadata && !clientProvidedActivity && nextPriority && nextPriority !== previousPriority) {
    nextMetadata = appendActivityLog(nextMetadata, {
      kind: "priority",
      actorName,
      fromPriority: previousPriority,
      toPriority: nextPriority,
    });
  }

  const previousStatus = access.report.status;
  const nextStatus = parsed.data.status;
  if (!clientProvidedActivity && nextStatus && nextStatus !== previousStatus) {
    nextMetadata ??= existingMetadata;
    nextMetadata = appendActivityLog(nextMetadata, {
      kind: "status",
      actorName,
      fromStatus: previousStatus,
      toStatus: nextStatus,
    });
  }

  const report = await db.report.update({
    where: { id: reportId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(nextMetadata ? { metadata: nextMetadata } : {}),
    },
  });

  const changed = {
    ...(parsed.data.status ? { status: true } : {}),
    ...(parsed.data.description !== undefined ? { description: true } : {}),
    ...(parsed.data.metadata?.type ? { type: parsed.data.metadata.type } : {}),
    ...(parsed.data.metadata?.priority ? { priority: parsed.data.metadata.priority } : {}),
    ...(parsed.data.metadata?.assigneeIds ? { assigneeIds: parsed.data.metadata.assigneeIds } : {}),
    ...(parsed.data.metadata ? { metadata: true } : {}),
  };
  const issuePayload = toIssueRealtimePayload(report);

  publishIssueEvent({
    type: "issue.updated",
    projectId: report.projectId,
    issueId: report.id,
    issue: issuePayload,
    changed,
  });
  publishIssueEvent({
    type: "issue:updated",
    projectId: report.projectId,
    issueId: report.id,
    issue: issuePayload,
    changed,
  });
  if (parsed.data.metadata?.assigneeIds) {
    publishIssueEvent({
      type: "issue:assigned",
      projectId: report.projectId,
      issueId: report.id,
      issue: issuePayload,
      assigneeIds: parsed.data.metadata.assigneeIds,
      actorId: access.session.user.id,
      actorName,
    });
  }
  if (parsed.data.status) {
    publishIssueEvent({
      type: "issue:status_changed",
      projectId: report.projectId,
      issueId: report.id,
      issue: issuePayload,
      status: parsed.data.status,
      previousStatus,
      actorId: access.session.user.id,
      actorName,
    });
  }
  if (parsed.data.metadata?.priority) {
    publishIssueEvent({
      type: "issue:priority_changed",
      projectId: report.projectId,
      issueId: report.id,
      issue: issuePayload,
      priority: parsed.data.metadata.priority,
      actorId: access.session.user.id,
      actorName,
    });
  }
  if (parsed.data.metadata?.type) {
    publishIssueEvent({
      type: "issue:type_changed",
      projectId: report.projectId,
      issueId: report.id,
      issue: issuePayload,
      issueType: parsed.data.metadata.type,
      actorId: access.session.user.id,
      actorName,
    });
  }

  return NextResponse.json(report);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId, "write");
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : access.error === "Forbidden" ? 403 : 404 });
  }

  await db.report.delete({ where: { id: reportId } });
  publishIssueEvent({
    type: "issue.deleted",
    projectId: access.report.projectId,
    issueId: reportId,
  });
  return NextResponse.json({ ok: true });
}
