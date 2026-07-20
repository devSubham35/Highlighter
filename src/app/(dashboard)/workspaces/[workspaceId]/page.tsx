import { WorkspaceOverviewView } from "@/components/workspaces/WorkspaceOverviewView";
import { canAccessAllWorkspaceProjects, projectAccessWhere } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, endOfMonth, format, formatDistanceToNow, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { parseReportMetadata, type ActivityEntry } from "@/lib/report-metadata";
import type { IssuePriority, IssueType, ReportStatus } from "@/types";

type OverviewRange = "7d" | "30d" | "90d" | "1y";
const overviewRanges: OverviewRange[] = ["7d", "30d", "90d", "1y"];

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
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const range = parseOverviewRange(query.range);
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

  const issueGraphs = Object.fromEntries(
    overviewRanges.map((item) => [item, createIssueGraph(item)]),
  ) as Record<OverviewRange, ReturnType<typeof createIssueGraph>>;
  const chartStart = issueGraphs["1y"][0]?.start ?? startOfMonth(subMonths(new Date(), 11));

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

  recentReports.forEach((report) => {
    overviewRanges.forEach((item) => {
      const bucket = issueGraphs[item].find(
        (point) => report.createdAt >= point.start && report.createdAt <= point.end,
      );
      if (!bucket) return;

      bucket.reported += 1;
      incrementIssueGraphStatus(bucket, report.status);
    });
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
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      currentUserName={session!.user.name}
      role={role}
      stats={{
        activeProjects,
        totalReports,
        memberCount,
        resolvedReports,
      }}
      selectedRange={range}
      issueGraphs={Object.fromEntries(
        overviewRanges.map((item) => [
          item,
          issueGraphs[item].map(({ start, end, ...point }) => point),
        ]),
      ) as Record<
        OverviewRange,
        Array<{
          key: string;
          label: string;
          reported: number;
          open: number;
          inProgress: number;
          resolved: number;
          closed: number;
        }>
      >}
      projectStats={projectStats}
      projectIds={visibleProjects.map((project) => project.id)}
      issueProjects={visibleProjects.map((project) => ({
        id: project.id,
        name: project.name,
      }))}
      recentIssues={recentIssues}
      recentActivity={recentActivity}
      teamMembers={teamMembers}
    />
  );
}

function parseOverviewRange(value: string | string[] | undefined): OverviewRange {
  const input = Array.isArray(value) ? value[0] : value;
  return input === "7d" || input === "30d" || input === "90d" || input === "1y"
    ? input
    : "30d";
}

function createIssueGraph(range: OverviewRange) {
  const now = new Date();

  if (range === "1y") {
    const year = now.getFullYear();
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(year, index, 1);
      return {
        key: format(start, "yyyy-MM"),
        label: format(start, "MMM"),
        start,
        end: endOfMonth(start),
        reported: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      };
    });
  }

  if (range === "90d") {
    return Array.from({ length: 3 }, (_, index) => {
      const start = startOfMonth(subMonths(now, 2 - index));
      return {
        key: format(start, "yyyy-MM"),
        label: format(start, "MMM"),
        start,
        end: endOfMonth(start),
        reported: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      };
    });
  }

  const config =
    range === "7d"
      ? { bucketCount: 7, bucketDays: 1 }
      : { bucketCount: 6, bucketDays: 5 };
  const firstDay =
    range === "7d"
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfDay(subDays(now, config.bucketCount * config.bucketDays - 1));

  return Array.from({ length: config.bucketCount }, (_, index) => {
    const start = addDays(firstDay, index * config.bucketDays);
    const end = index === config.bucketCount - 1 ? now : new Date(addDays(start, config.bucketDays).getTime() - 1);
    return {
      key: format(start, "yyyy-MM-dd"),
      label: config.bucketDays === 1 ? format(start, "EEE") : format(start, "MMM d"),
      start,
      end,
      reported: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };
  });
}

function incrementIssueGraphStatus(
  bucket: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  },
  status: ReportStatus,
) {
  if (status === "OPEN") bucket.open += 1;
  if (status === "IN_PROGRESS") bucket.inProgress += 1;
  if (status === "RESOLVED") bucket.resolved += 1;
  if (status === "CLOSED") bucket.closed += 1;
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
