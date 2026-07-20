import { WorkspaceOverviewView } from "@/components/workspaces/WorkspaceOverviewView";
import { canAccessAllWorkspaceProjects, projectAccessWhere } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, formatDistanceToNow, startOfMonth, subMonths } from "date-fns";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { parseReportMetadata, type ActivityEntry } from "@/lib/report-metadata";
import type { IssuePriority, IssueType, ReportStatus } from "@/types";

const SERVER_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const SERVER_PRIORITY_LABELS: Record<IssuePriority, string> = {
  NONE: "No priority",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const SERVER_TYPE_LABELS: Record<IssueType, string> = {
  BUG: "Bug",
  TASK: "Task",
  FEATURE: "Feature",
  IMPROVEMENT: "Improvement",
  STORY: "Story",
};

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: { some: { userId: session!.user.id } },
    },
    select: {
      id: true,
      name: true,
      memberships: {
        where: { userId: session!.user.id },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!workspace) notFound();

  const role = workspace.memberships[0]?.role ?? "MEMBER";
  const canSeeAll = canAccessAllWorkspaceProjects(role);
  const projectWhere = canSeeAll
    ? { workspaceId: workspace.id }
    : { workspaceId: workspace.id, ...projectAccessWhere(session!.user.id) };
  const reportWhere = { project: projectWhere };

  const chartStart = startOfMonth(subMonths(new Date(), 5));

  const [
    activeProjects,
    totalReports,
    memberCount,
    resolvedReports,
    recentReports,
    visibleProjects,
    latestReports,
    teamMemberships,
  ] = await Promise.all([
    db.project.count({ where: { ...projectWhere, archived: false } }),
    db.report.count({ where: reportWhere }),
    db.membership.count({ where: { workspaceId: workspace.id } }),
    db.report.count({ where: { ...reportWhere, status: { in: ["RESOLVED", "CLOSED"] } } }),
    db.report.findMany({
      where: {
        ...reportWhere,
        createdAt: { gte: chartStart },
      },
      select: {
        createdAt: true,
        status: true,
      },
    }),
    db.project.findMany({
      where: projectWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        reports: {
          select: { status: true, updatedAt: true },
        },
      },
    }),
    db.report.findMany({
      where: reportWhere,
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
      },
    }),
    db.membership.findMany({
      where: { workspaceId: workspace.id, suspended: false },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: {
        role: true,
        lastActiveAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ]);

  const issueGraph = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(subMonths(new Date(), 5 - index));
    const key = format(date, "yyyy-MM");
    return {
      key,
      label: format(date, "MMM"),
      reported: 0,
      resolved: 0,
    };
  });

  const issueGraphMap = new Map(issueGraph.map((item) => [item.key, item]));

  recentReports.forEach((report) => {
    const key = format(report.createdAt, "yyyy-MM");
    const bucket = issueGraphMap.get(key);
    if (!bucket) return;

    bucket.reported += 1;
    if (report.status === "RESOLVED" || report.status === "CLOSED") {
      bucket.resolved += 1;
    }
  });

  const projectStats = visibleProjects.map((project) => {
    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    project.reports.forEach((report) => {
      statusCounts[report.status] += 1;
    });

    return {
      id: project.id,
      name: project.name,
      totalTickets: project.reports.length,
      statusCounts,
      lastUpdatedAt: new Date(
        Math.max(
          project.updatedAt.getTime(),
          ...project.reports.map((report) => report.updatedAt.getTime()),
        ),
      ).toISOString(),
    };
  });

  const teamMembers = teamMemberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    image: membership.user.image,
    role: membership.role,
    lastActiveLabel: membership.lastActiveAt
      ? `${formatDistanceToNow(membership.lastActiveAt)} ago`
      : "Recently active",
  }));

  const recentIssues = latestReports.slice(0, 5).map((report) => {
    const metadata = parseReportMetadata(report.metadata);
    return {
      id: report.id,
      title: report.title,
      projectId: report.project.id,
      projectName: report.project.name,
      status: report.status,
      priority: metadata.priority ?? "NONE",
      type: metadata.type ?? "IMPROVEMENT",
      reporterName: metadata.reporterName ?? "Anonymous",
      createdAtLabel: `${formatDistanceToNow(report.createdAt)} ago`,
    };
  });

  const recentActivity = latestReports
    .flatMap((report) => {
      const metadata = parseReportMetadata(report.metadata);
      const log = metadata.activityLog?.length
        ? metadata.activityLog
        : [
            {
              id: "reported",
              kind: "reported",
              at: report.createdAt.toISOString(),
              actorName: metadata.reporterName ?? "Anonymous",
            } satisfies ActivityEntry,
          ];

      return log.map((entry) => ({
        id: `${report.id}-${entry.id}`,
        kind: entry.kind,
        actorName: entry.actorName ?? metadata.reporterName ?? "Highlighter",
        action: activityLabel(entry, report.title),
        projectName: report.project.name,
        at: entry.at,
        timeLabel: `${formatDistanceToNow(new Date(entry.at))} ago`,
      }));
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);

  return (
    <WorkspaceOverviewView
      workspaceName={workspace.name}
      currentUserName={session!.user.name}
      role={role}
      stats={{
        activeProjects,
        totalReports,
        memberCount,
        resolvedReports,
      }}
      issueGraph={issueGraph}
      projectStats={projectStats}
      projectIds={visibleProjects.map((project) => project.id)}
      recentIssues={recentIssues}
      recentActivity={recentActivity}
      teamMembers={teamMembers}
    />
  );
}

function activityLabel(entry: ActivityEntry, issueTitle: string) {
  if (entry.kind === "status" && entry.toStatus) {
    return `moved ${issueTitle} to ${SERVER_STATUS_LABELS[entry.toStatus]}`;
  }
  if (entry.kind === "priority" && entry.toPriority) {
    return `set ${issueTitle} priority to ${SERVER_PRIORITY_LABELS[entry.toPriority]}`;
  }
  if (entry.kind === "type" && entry.toIssueType) {
    return `changed ${issueTitle} to ${SERVER_TYPE_LABELS[entry.toIssueType]}`;
  }
  if (entry.kind === "assignment") {
    const assignee = entry.toAssigneeNames?.[0] ?? "a teammate";
    return `assigned ${issueTitle} to ${assignee}`;
  }
  if (entry.kind === "reported") {
    return `created ${issueTitle}`;
  }
  return `updated ${issueTitle}`;
}
