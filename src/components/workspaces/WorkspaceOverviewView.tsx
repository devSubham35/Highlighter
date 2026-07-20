"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/common/RoleBadge";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  issuePriorityIcon,
  issueTypeIcon,
  reportStatusIcon,
} from "@/lib/issue-options";
import { parseReportMetadata } from "@/lib/report-metadata";
import type { IssueRealtimeEvent } from "@/lib/realtime";
import { useIssueRealtime } from "@/lib/use-issue-realtime";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueType, ReportStatus } from "@/types";
import type { MemberRole } from "@prisma/client";
import {
  Activity,
  ArrowUpRight,
  Bell,
  FileText,
  FolderKanban,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export type WorkspaceOverviewStats = {
  activeProjects: number;
  totalReports: number;
  memberCount: number;
  resolvedReports: number;
};

export type WorkspaceIssueGraphPoint = {
  key: string;
  label: string;
  reported: number;
  resolved: number;
};

export type WorkspaceProjectStats = {
  id: string;
  name: string;
  totalTickets: number;
  statusCounts: Record<ReportStatus, number>;
  lastUpdatedAt: string;
};

export type WorkspaceRecentIssue = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: ReportStatus;
  priority: IssuePriority;
  type: IssueType;
  reporterName: string;
  createdAtLabel: string;
};

export type WorkspaceRecentActivity = {
  id: string;
  kind: string;
  actorName: string;
  action: string;
  projectName: string;
  at: string;
  timeLabel: string;
};

export type WorkspaceTeamMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: MemberRole;
  lastActiveLabel: string;
};

const STATUS_SEGMENTS: Array<{
  status: ReportStatus;
  className: string;
  dotClassName: string;
  softClassName: string;
}> = [
  {
    status: "OPEN",
    className: "bg-blue-600",
    dotClassName: "bg-blue-600",
    softClassName: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
  {
    status: "IN_PROGRESS",
    className: "bg-amber-500",
    dotClassName: "bg-amber-500",
    softClassName: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    status: "RESOLVED",
    className: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
    softClassName: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    status: "CLOSED",
    className: "bg-slate-500",
    dotClassName: "bg-slate-500",
    softClassName: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
];

export function WorkspaceOverviewView({
  workspaceName,
  currentUserName,
  role,
  stats,
  issueGraph,
  projectStats,
  projectIds,
  recentIssues,
  recentActivity,
  teamMembers,
}: {
  workspaceName: string;
  currentUserName: string;
  role: MemberRole;
  stats: WorkspaceOverviewStats;
  issueGraph: WorkspaceIssueGraphPoint[];
  projectStats: WorkspaceProjectStats[];
  projectIds: string[];
  recentIssues: WorkspaceRecentIssue[];
  recentActivity: WorkspaceRecentActivity[];
  teamMembers: WorkspaceTeamMember[];
}) {
  const [liveStats, setLiveStats] = useState(stats);
  const [liveIssueGraph, setLiveIssueGraph] = useState(issueGraph);
  const [liveProjectStats, setLiveProjectStats] = useState(projectStats);
  const [liveRecentIssues, setLiveRecentIssues] = useState(recentIssues);

  useEffect(() => setLiveStats(stats), [stats]);
  useEffect(() => setLiveIssueGraph(issueGraph), [issueGraph]);
  useEffect(() => setLiveProjectStats(projectStats), [projectStats]);
  useEffect(() => setLiveRecentIssues(recentIssues), [recentIssues]);

  function handleRealtimeEvent(event: IssueRealtimeEvent) {
    if (event.type === "issue.created") {
      const metadata = parseReportMetadata(event.issue.metadata);
      setLiveStats((current) => ({
        ...current,
        totalReports: current.totalReports + 1,
        resolvedReports: isResolvedStatus(event.issue.status)
          ? current.resolvedReports + 1
          : current.resolvedReports,
      }));
      setLiveIssueGraph((current) => incrementGraphBucket(current, event.issue.createdAt, event.issue.status));
      setLiveProjectStats((current) => incrementProjectStatus(current, event.projectId, event.issue.status));
      setLiveRecentIssues((current) =>
        [
          {
            id: event.issue.id,
            title: event.issue.title,
            projectId: event.projectId,
            projectName: projectStats.find((project) => project.id === event.projectId)?.name ?? "Project",
            status: event.issue.status,
            priority: metadata.priority ?? "NONE",
            type: metadata.type ?? "IMPROVEMENT",
            reporterName: metadata.reporterName ?? "Anonymous",
            createdAtLabel: "Just now",
          },
          ...current,
        ].slice(0, 5),
      );
      return;
    }

    if (event.type === "issue:status_changed") {
      setLiveStats((current) => ({
        ...current,
        resolvedReports: applyResolvedDelta(current.resolvedReports, event.previousStatus, event.status),
      }));
      setLiveIssueGraph((current) =>
        current.map((point) =>
          point.key === event.issue.createdAt.slice(0, 7)
            ? {
                ...point,
                resolved: applyResolvedDelta(point.resolved, event.previousStatus, event.status),
              }
            : point,
        ),
      );
      setLiveProjectStats((current) =>
        current.map((project) =>
          project.id === event.projectId
            ? {
                ...project,
                statusCounts: moveProjectStatusCount(project.statusCounts, event.previousStatus, event.status),
                lastUpdatedAt: new Date().toISOString(),
              }
            : project,
        ),
      );
      setLiveRecentIssues((current) =>
        current.map((issue) => (issue.id === event.issueId ? { ...issue, status: event.status } : issue)),
      );
      return;
    }

    if (event.type === "issue:priority_changed") {
      setLiveRecentIssues((current) =>
        current.map((issue) => (issue.id === event.issueId ? { ...issue, priority: event.priority } : issue)),
      );
      return;
    }

    if (event.type === "issue:type_changed") {
      setLiveRecentIssues((current) =>
        current.map((issue) => (issue.id === event.issueId ? { ...issue, type: event.issueType } : issue)),
      );
    }
  }

  const totalProjectTickets = liveProjectStats.reduce((sum, project) => sum + project.totalTickets, 0);
  const totalRecentReports = liveIssueGraph.reduce((sum, item) => sum + item.reported, 0);
  const totalRecentResolved = liveIssueGraph.reduce((sum, item) => sum + item.resolved, 0);
  const totalStatusCounts = useMemo(
    () =>
      liveProjectStats.reduce<Record<ReportStatus, number>>(
        (totals, project) => {
          STATUS_SEGMENTS.forEach((segment) => {
            totals[segment.status] += project.statusCounts[segment.status];
          });
          return totals;
        },
        { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
      ),
    [liveProjectStats],
  );
  const openIssues = totalStatusCounts.OPEN + totalStatusCounts.IN_PROGRESS;

  return (
    <div className="mx-auto w-full max-w-[1800px] px-6 py-6">
      {projectIds.map((projectId) => (
        <WorkspaceOverviewRealtimeBridge key={projectId} projectId={projectId} onEvent={handleRealtimeEvent} />
      ))}

      <div className="space-y-5">
        <section className="overflow-hidden rounded-[18px] border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md dark:bg-surface-elevated">
          <div className="relative p-6 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_32%),linear-gradient(135deg,rgba(79,70,229,0.08),rgba(34,197,94,0.07)_52%,transparent)]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge role={role} />
                  <span className="inline-flex h-6 min-h-6 items-center rounded-full border border-white/70 bg-white/70 px-3 py-0 text-[11px] font-medium leading-none text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/5">
                    {workspaceName}
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                  Welcome back, {currentUserName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Here is what is happening across your feedback workspace today.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <HeroStat label="Active projects" value={liveStats.activeProjects} />
                  <HeroStat label="Total reports" value={liveStats.totalReports} />
                  <HeroStat label="Waiting review" value={openIssues} />
                  <HeroStat label="Team members" value={liveStats.memberCount} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl bg-indigo-600 shadow-sm hover:bg-indigo-500">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
                <Button variant="outline" className="rounded-xl bg-white/80 dark:bg-white/5">
                  <FileText className="h-4 w-4" />
                  Create Issue
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Projects"
            value={liveStats.activeProjects}
            detail="+2 this week"
            subtitle="Active projects"
            icon={FolderKanban}
            spark={[24, 36, 32, 52, 60, 74, 88]}
          />
          <MetricCard
            label="Reports"
            value={liveStats.totalReports}
            detail="+25%"
            subtitle="Total captured reports"
            icon={FileText}
            spark={[18, 32, 46, 42, 68, 58, 86]}
          />
          <MetricCard
            label="Members"
            value={liveStats.memberCount}
            detail="+8%"
            subtitle="Active collaborators"
            icon={Users}
            spark={[28, 28, 40, 44, 48, 52, 64]}
          />
          <MetricCard
            label="Open Issues"
            value={openIssues}
            detail="-12%"
            subtitle="Needs team attention"
            icon={Bell}
            spark={[86, 72, 68, 64, 48, 42, 34]}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <IssueAnalyticsCard
              graph={liveIssueGraph}
              totalReported={totalRecentReports}
              totalResolved={totalRecentResolved}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STATUS_SEGMENTS.map((segment) => (
                <StatusSummaryCard
                  key={segment.status}
                  status={segment.status}
                  count={totalStatusCounts[segment.status]}
                  total={Math.max(totalProjectTickets, 1)}
                  dotClassName={segment.dotClassName}
                  softClassName={segment.softClassName}
                />
              ))}
            </div>

            <ProjectHealthOverview projectStats={liveProjectStats} totalTickets={totalProjectTickets} />
          </div>

          <aside className="space-y-5">
            <RecentActivityPanel activities={recentActivity} />
            <TeamWidget members={teamMembers} />
            <RecentIssuesCard issues={liveRecentIssues} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function WorkspaceOverviewRealtimeBridge({
  projectId,
  onEvent,
}: {
  projectId: string;
  onEvent: (event: IssueRealtimeEvent) => void;
}) {
  useIssueRealtime({
    enabled: Boolean(projectId),
    projectId,
    onEvent,
  });

  return null;
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  subtitle,
  icon: Icon,
  spark,
}: {
  label: string;
  value: number;
  detail: string;
  subtitle: string;
  icon: typeof FolderKanban;
  spark: number[];
}) {
  return (
    <section className="group rounded-[18px] border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:bg-surface-elevated dark:hover:border-indigo-500/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {detail}
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Sparkline values={spark} />
      </div>
    </section>
  );
}

function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-1.5 rounded-full bg-indigo-500/25 transition-colors group-hover:bg-indigo-500/60"
          style={{ height: `${Math.max(value, 12)}%` }}
        />
      ))}
    </div>
  );
}

function IssueAnalyticsCard({
  graph,
  totalReported,
  totalResolved,
}: {
  graph: WorkspaceIssueGraphPoint[];
  totalReported: number;
  totalResolved: number;
}) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Issue Trends</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalReported} reported, {totalResolved} resolved in the last 6 months
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-muted/30 p-1 text-xs">
          {["7 Days", "30 Days", "90 Days", "1 Year"].map((filter, index) => (
            <button
              key={filter}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground",
                index === 1 && "bg-card text-foreground shadow-sm",
              )}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <LegendDot className="bg-indigo-500" label="Reported" />
        <LegendDot className="bg-blue-600" label="Open" />
        <LegendDot className="bg-emerald-500" label="Resolved" />
        <LegendDot className="bg-slate-500" label="Closed" />
      </div>
      <IssueTrendChart graph={graph} />
    </section>
  );
}

function IssueTrendChart({ graph }: { graph: WorkspaceIssueGraphPoint[] }) {
  const width = 760;
  const height = 230;
  const paddingX = 34;
  const paddingTop = 18;
  const baseline = 176;
  const maxValue = Math.max(...graph.flatMap((point) => [point.reported, point.resolved]), 1);
  const points = graph.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(graph.length - 1, 1);
    const reportedY = baseline - (point.reported / maxValue) * (baseline - paddingTop);
    const resolvedY = baseline - (point.resolved / maxValue) * (baseline - paddingTop);
    return { ...point, x, reportedY, resolvedY };
  });
  const reportedLine = buildLinePath(points.map((point) => [point.x, point.reportedY]));
  const resolvedLine = buildLinePath(points.map((point) => [point.x, point.resolvedY]));
  const reportedArea = `${reportedLine} L ${points.at(-1)?.x ?? paddingX} ${baseline} L ${points[0]?.x ?? paddingX} ${baseline} Z`;

  return (
    <div className="mt-4 overflow-visible rounded-2xl bg-muted/20 p-4">
      <div className="relative overflow-visible">
        <svg className="h-[250px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img">
          <defs>
            <linearGradient id="reported-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((line) => (
            <line
              key={line}
              x1={paddingX}
              x2={width - paddingX}
              y1={paddingTop + line * (baseline - paddingTop)}
              y2={paddingTop + line * (baseline - paddingTop)}
              className="stroke-border"
              strokeWidth="1"
            />
          ))}
          <path d={reportedArea} fill="url(#reported-fill)" />
          <path d={reportedLine} fill="none" stroke="#4F46E5" strokeLinecap="round" strokeWidth="3" />
          <path d={resolvedLine} fill="none" stroke="#22C55E" strokeLinecap="round" strokeWidth="3" />
          {points.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.reportedY} r="4" fill="#4F46E5" />
              <circle cx={point.x} cy={point.resolvedY} r="4" fill="#22C55E" />
              <text x={point.x} y={baseline + 28} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute inset-0">
          {points.map((point) => (
            <ChartHoverPoint key={point.key} point={point} left={(point.x / width) * 100} top={(point.reportedY / height) * 100} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartHoverPoint({
  point,
  left,
  top,
}: {
  point: WorkspaceIssueGraphPoint;
  left: number;
  top: number;
}) {
  return (
    <span
      className="group absolute z-20 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-44 -translate-x-1/2 rounded-xl border border-border bg-white p-3 text-xs text-foreground opacity-100 shadow-xl dark:bg-neutral-950 group-hover:block">
        <span className="block font-semibold">{point.label}</span>
        <span className="mt-2 flex items-center justify-between">
          <LegendDot className="bg-indigo-500" label="Reported" />
          <span className="font-semibold">{point.reported}</span>
        </span>
        <span className="mt-1.5 flex items-center justify-between">
          <LegendDot className="bg-emerald-500" label="Resolved" />
          <span className="font-semibold">{point.resolved}</span>
        </span>
      </span>
    </span>
  );
}

function StatusSummaryCard({
  status,
  count,
  total,
  dotClassName,
  softClassName,
}: {
  status: ReportStatus;
  count: number;
  total: number;
  dotClassName: string;
  softClassName: string;
}) {
  const percent = Math.round((count / total) * 100);
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-elevated">
      <div className="flex items-start justify-between">
        <span className={cn("flex size-9 items-center justify-center rounded-xl", softClassName)}>
          {reportStatusIcon(status, 17)}
        </span>
        <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", dotClassName)} />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{ISSUE_STATUS_LABELS[status]}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-foreground">{count}</p>
        <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", dotClassName)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Across all projects</p>
    </section>
  );
}

function ProjectHealthOverview({
  projectStats,
  totalTickets,
}: {
  projectStats: WorkspaceProjectStats[];
  totalTickets: number;
}) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Project Health Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">{totalTickets} tickets across all visible projects</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {STATUS_SEGMENTS.map((segment) => (
            <LegendDot key={segment.status} className={segment.dotClassName} label={ISSUE_STATUS_LABELS[segment.status]} />
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y divide-border overflow-visible rounded-2xl border border-border">
        {projectStats.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No projects available.</div>
        ) : (
          projectStats.map((project) => <ProjectHealthRow key={project.id} project={project} />)
        )}
      </div>
    </section>
  );
}

function ProjectHealthRow({ project }: { project: WorkspaceProjectStats }) {
  const health = getProjectHealth(project);
  return (
    <button
      type="button"
      className="grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10 lg:grid-cols-[minmax(14rem,1fr)_minmax(18rem,1.4fr)_8rem_7rem]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 rounded-xl">
          <AvatarFallback className="rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {initials(project.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Updated {formatCompactDate(project.lastUpdatedAt)}</p>
        </div>
      </div>
      <div className="min-w-0">
        <SegmentedStatusBar project={project} />
        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
          {STATUS_SEGMENTS.map((segment) => (
            <StatusCountTooltip
              key={segment.status}
              projectName={project.name}
              status={segment.status}
              count={project.statusCounts[segment.status]}
              dotClassName={segment.dotClassName}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Health</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{health}%</p>
      </div>
      <div className="text-right lg:text-left">
        <p className="text-xs text-muted-foreground">Issues</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{project.totalTickets}</p>
      </div>
    </button>
  );
}

function SegmentedStatusBar({ project }: { project: WorkspaceProjectStats }) {
  const visibleSegments = STATUS_SEGMENTS.filter((segment) => project.statusCounts[segment.status] > 0);
  return (
    <div className="flex h-3 overflow-visible rounded-full bg-muted">
      {project.totalTickets === 0 ? (
        <span className="h-full w-full rounded-full bg-muted" />
      ) : (
        visibleSegments.map((segment, index) => {
          const count = project.statusCounts[segment.status];
          const first = index === 0;
          const last = index === visibleSegments.length - 1;
          return (
            <GraphTooltip
              key={segment.status}
              title={project.name}
              label={ISSUE_STATUS_LABELS[segment.status]}
              value={count}
              dotClassName={segment.dotClassName}
              triggerClassName={cn(segment.className, "h-full transition-[width] duration-300", first && "rounded-l-full", last && "rounded-r-full")}
              triggerStyle={{ width: `${(count / project.totalTickets) * 100}%` }}
            />
          );
        })
      )}
    </div>
  );
}

function RecentIssuesCard({ issues }: { issues: WorkspaceRecentIssue[] }) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Recent Issues</h2>
        <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 space-y-1.5">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No recent issues yet.
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-transparent px-3 py-2.5 transition-all hover:border-indigo-100 hover:bg-indigo-50/70 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10"
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {issueTypeIcon(issue.type)}
                    {ISSUE_TYPE_LABELS[issue.type]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
                    {issuePriorityIcon(issue.priority)}
                    {ISSUE_PRIORITY_LABELS[issue.priority]}
                  </span>
                  <Badge variant="outline" className="rounded-full bg-card px-2 py-0.5 text-[11px]">
                    {reportStatusIcon(issue.status, 14)}
                    {ISSUE_STATUS_LABELS[issue.status]}
                  </Badge>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-foreground">{issue.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {issue.projectName} - {issue.reporterName} - {issue.createdAtLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <Button variant="outline" size="icon-sm" className="rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RecentActivityPanel({ activities }: { activities: WorkspaceRecentActivity[] }) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-5 space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials(activity.actorName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{activity.actorName}</span> {activity.action}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.projectName} - {activity.timeLabel}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TeamWidget({ members }: { members: WorkspaceTeamMember[] }) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Team Online</h2>
          <p className="mt-1 text-xs text-muted-foreground">{members.length} collaborators available</p>
        </div>
        <AvatarGroup>
          {members.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="size-8 border-2 border-card">
              {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      </div>
      <div className="mt-4 space-y-2">
        {members.slice(0, 4).map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative">
                <Avatar className="size-7">
                  {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-[11px] text-muted-foreground">{member.lastActiveLabel}</p>
              </div>
            </div>
            <RoleBadge role={member.role} />
          </div>
        ))}
      </div>
    </section>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function StatusCountTooltip({
  projectName,
  status,
  count,
  dotClassName,
}: {
  projectName: string;
  status: ReportStatus;
  count: number;
  dotClassName: string;
}) {
  return (
    <span className="group relative min-w-0">
      <span className="block cursor-default truncate">
        <span className="font-medium text-foreground">{count}</span> {ISSUE_STATUS_LABELS[status]}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-52 -translate-x-1/2 rounded-xl border border-border bg-white px-3 py-2 text-foreground opacity-100 shadow-xl dark:bg-neutral-950 group-hover:block">
        <span className="block min-w-36">
          <span className="block truncate text-xs font-semibold">{projectName}</span>
          <span className="mt-1.5 flex items-center justify-between gap-4 text-xs">
            <LegendDot className={dotClassName} label={ISSUE_STATUS_LABELS[status]} />
            <span className="font-semibold">{count}</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function GraphTooltip({
  title,
  label,
  value,
  dotClassName,
  triggerClassName,
  triggerStyle,
}: {
  title: string;
  label: string;
  value: number;
  dotClassName: string;
  triggerClassName: string;
  triggerStyle: CSSProperties;
}) {
  return (
    <span className={cn("group relative block shrink-0 outline-none", triggerClassName)} style={triggerStyle} tabIndex={0}>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-52 -translate-x-1/2 rounded-xl border border-border bg-white px-3 py-2 text-foreground opacity-100 shadow-xl dark:bg-neutral-950 group-hover:block group-focus-visible:block">
        <span className="block min-w-36">
          <span className="block truncate text-xs font-semibold">{title}</span>
          <span className="mt-1.5 flex items-center justify-between gap-4 text-xs">
            <LegendDot className={dotClassName} label={label} />
            <span className="font-semibold">{value}</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function isResolvedStatus(status: ReportStatus) {
  return status === "RESOLVED" || status === "CLOSED";
}

function applyResolvedDelta(current: number, previousStatus: ReportStatus, nextStatus: ReportStatus) {
  if (previousStatus === nextStatus) return current;
  if (isResolvedStatus(previousStatus) && !isResolvedStatus(nextStatus)) return Math.max(current - 1, 0);
  if (!isResolvedStatus(previousStatus) && isResolvedStatus(nextStatus)) return current + 1;
  return current;
}

function incrementGraphBucket(graph: WorkspaceIssueGraphPoint[], createdAt: string, status: ReportStatus) {
  const key = createdAt.slice(0, 7);
  return graph.map((point) =>
    point.key === key
      ? {
          ...point,
          reported: point.reported + 1,
          resolved: isResolvedStatus(status) ? point.resolved + 1 : point.resolved,
        }
      : point,
  );
}

function incrementProjectStatus(projectStats: WorkspaceProjectStats[], projectId: string, status: ReportStatus) {
  return projectStats.map((project) => {
    if (project.id !== projectId) return project;
    const statusCounts = { ...project.statusCounts };
    statusCounts[status] += 1;
    return {
      ...project,
      totalTickets: project.totalTickets + 1,
      statusCounts,
      lastUpdatedAt: new Date().toISOString(),
    };
  });
}

function moveProjectStatusCount(
  counts: Record<ReportStatus, number>,
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
) {
  if (previousStatus === nextStatus) return counts;
  const nextCounts = { ...counts };
  nextCounts[previousStatus] = Math.max(nextCounts[previousStatus] - 1, 0);
  nextCounts[nextStatus] += 1;
  return nextCounts;
}

function getProjectHealth(project: WorkspaceProjectStats) {
  if (project.totalTickets === 0) return 100;
  const healthy = project.statusCounts.RESOLVED + project.statusCounts.CLOSED;
  const inMotion = project.statusCounts.IN_PROGRESS * 0.45;
  return Math.round(((healthy + inMotion) / project.totalTickets) * 100);
}

function buildLinePath(points: Array<[number, number]>) {
  if (points.length === 0) return "";
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "H";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / 86_400_000),
    "day",
  );
}
