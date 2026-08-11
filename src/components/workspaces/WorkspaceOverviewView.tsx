"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

export type WorkspaceProjectStats = {
  id: string;
  name: string;
  totalTickets: number;
  statusCounts: Record<ReportStatus, number>;
  lastUpdatedAt: string;
};

export type WorkspaceIssueProject = {
  id: string;
  name: string;
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

type OverviewRange = "7d" | "30d" | "90d" | "1y";

const STATUS_SEGMENTS: Array<{
  status: ReportStatus;
  className: string;
  dotClassName: string;
  softClassName: string;
}> = [
  {
    status: "OPEN",
    className: "bg-primary",
    dotClassName: "bg-primary",
    softClassName: "bg-primary/10 text-primary dark:bg-primary/15",
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
  workspaceId,
  workspaceName,
  currentUserName,
  role,
  stats,
  selectedRange,
  issueGraphs,
  projectStats,
  projectIds,
  issueProjects,
  recentIssues,
  recentActivity,
  teamMembers,
}: {
  workspaceId: string;
  workspaceName: string;
  currentUserName: string;
  role: MemberRole;
  stats: WorkspaceOverviewStats;
  selectedRange: OverviewRange;
  issueGraphs: Record<OverviewRange, WorkspaceIssueGraphPoint[]>;
  projectStats: WorkspaceProjectStats[];
  projectIds: string[];
  issueProjects: WorkspaceIssueProject[];
  recentIssues: WorkspaceRecentIssue[];
  recentActivity: WorkspaceRecentActivity[];
  teamMembers: WorkspaceTeamMember[];
}) {
  const [liveStats, setLiveStats] = useState(stats);
  const [activeRange, setActiveRange] = useState<OverviewRange>(selectedRange);
  const [liveIssueGraphs, setLiveIssueGraphs] = useState(issueGraphs);
  const [liveProjectStats, setLiveProjectStats] = useState(projectStats);
  const [liveRecentIssues, setLiveRecentIssues] = useState(recentIssues);
  const [issueProjectPickerOpen, setIssueProjectPickerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLiveStats(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [stats]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setActiveRange(selectedRange);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedRange]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLiveIssueGraphs(issueGraphs);
    });
    return () => {
      cancelled = true;
    };
  }, [issueGraphs]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLiveProjectStats(projectStats);
    });
    return () => {
      cancelled = true;
    };
  }, [projectStats]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLiveRecentIssues(recentIssues);
    });
    return () => {
      cancelled = true;
    };
  }, [recentIssues]);

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
      setLiveIssueGraphs((current) => mapGraphRanges(current, (graph) => incrementGraphBucket(graph, event.issue.createdAt, event.issue.status)));
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
      setLiveIssueGraphs((current) =>
        mapGraphRanges(current, (graph) =>
          graph.map((point) =>
            point.key === findGraphPointKey(graph, event.issue.createdAt)
              ? {
                  ...point,
                  ...moveGraphStatusCount(point, event.previousStatus, event.status),
                }
              : point,
          ),
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
  const liveIssueGraph = liveIssueGraphs[activeRange] ?? [];
  const totalRecentReports = liveIssueGraph.reduce((sum, item) => sum + item.reported, 0);
  const totalRecentResolved = liveIssueGraph.reduce((sum, item) => sum + item.resolved + item.closed, 0);
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
    <div className="-mx-1 w-auto max-w-none px-2 pt-4 pb-4 md:-mx-4 md:-mt-2 md:px-3 md:pt-5">
      {projectIds.map((projectId) => (
        <WorkspaceOverviewRealtimeBridge key={projectId} projectId={projectId} onEvent={handleRealtimeEvent} />
      ))}

      <div className="space-y-5">
        <section className="overflow-hidden rounded-[18px] border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md dark:bg-surface-elevated">
          <div className="relative p-6 sm:p-7">
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border/70 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <RoleBadge
                    role={role}
                    className="h-7 min-h-7 border-primary bg-primary px-3 text-[10px] text-primary-foreground shadow-none dark:border-primary dark:bg-primary dark:text-primary-foreground"
                  />
                  <span className="inline-flex h-7 min-h-7 items-center gap-2 rounded-full bg-muted/70 px-3 py-0 text-xs font-semibold leading-none text-foreground dark:bg-white/10">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {workspaceName}
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                  Welcome back, {currentUserName} 👋
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Here is what is happening across your feedback workspace today.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/workspaces/${workspaceId}/projects?create=project`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </a>
                <button
                  type="button"
                  onClick={() => setIssueProjectPickerOpen(true)}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-primary/20 bg-white/80 px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/60 dark:bg-white/5"
                >
                  <FileText className="h-4 w-4" />
                  Create Issue
                </button>
              </div>
            </div>
          </div>
        </section>

        <CreateIssueProjectDialog
          open={issueProjectPickerOpen}
          onOpenChange={setIssueProjectPickerOpen}
          projects={issueProjects}
          onContinue={(projectId) => {
            setIssueProjectPickerOpen(false);
            router.push(`/projects/${projectId}?create=issue`);
          }}
          onCreateProject={() => {
            setIssueProjectPickerOpen(false);
            router.push(`/workspaces/${workspaceId}/projects?create=project`);
          }}
        />

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

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="space-y-5 xl:col-span-3">
            <IssueAnalyticsCard
              selectedRange={activeRange}
              onRangeChange={setActiveRange}
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

          <aside className="space-y-5 xl:col-span-1">
            <RecentActivityPanel activities={recentActivity} />
            <TeamWidget members={teamMembers} />
            <RecentIssuesCard workspaceId={workspaceId} issues={liveRecentIssues} />
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

function CreateIssueProjectDialog({
  open,
  onOpenChange,
  projects,
  onContinue,
  onCreateProject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WorkspaceIssueProject[];
  onContinue: (projectId: string) => void;
  onCreateProject: () => void;
}) {
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!open) {
        setProjectId("");
        return;
      }
      setProjectId((current) => current || projects[0]?.id || "");
    });
    return () => {
      cancelled = true;
    };
  }, [open, projects]);

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>Select the project where this issue should be created.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-2">
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">No projects available</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a project first, then add issues to it.
              </p>
            </div>
          ) : (
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-foreground">Project</span>
              <Combobox
                value={projectId}
                onValueChange={setProjectId}
                options={projectOptions}
                placeholder="Select project"
                searchPlaceholder="Search projects..."
                emptyMessage="No projects found"
                className="w-full"
              />
            </label>
          )}
        </DialogBody>
        <DialogFooter>
          {projects.length === 0 ? (
            <Button type="button" onClick={onCreateProject}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={!projectId} onClick={() => onContinue(projectId)}>
                Continue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <section className="group rounded-[18px] border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:bg-surface-elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
          className="w-1.5 rounded-full bg-primary/20 transition-colors group-hover:bg-primary/60"
          style={{ height: `${Math.max(value, 12)}%` }}
        />
      ))}
    </div>
  );
}

function IssueAnalyticsCard({
  selectedRange,
  onRangeChange,
  graph,
  totalReported,
  totalResolved,
}: {
  selectedRange: OverviewRange;
  onRangeChange: (range: OverviewRange) => void;
  graph: WorkspaceIssueGraphPoint[];
  totalReported: number;
  totalResolved: number;
}) {
  const filters: Array<{ value: OverviewRange; label: string }> = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
  ];

  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Issue Trends</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalReported} reported, {totalResolved} resolved in the last 6 months
          </p>
        </div>
        <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border/70 bg-white/80 p-1 text-xs shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onRangeChange(filter.value)}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center rounded-full px-3 font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10",
                selectedRange === filter.value &&
                  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {STATUS_SEGMENTS.map((segment) => (
          <LegendDot
            key={segment.status}
            className={segment.dotClassName}
            label={ISSUE_STATUS_LABELS[segment.status]}
          />
        ))}
      </div>
      <IssueTrendChart graph={graph} />
    </section>
  );
}

function IssueTrendChart({ graph }: { graph: WorkspaceIssueGraphPoint[] }) {
  const chartData = graph.map((point) => ({
    label: point.label,
    open: point.open,
    inProgress: point.inProgress,
    resolved: point.resolved,
    closed: point.closed,
  }));
  const chartConfig = {
    open: {
      label: ISSUE_STATUS_LABELS.OPEN,
      color: "var(--primary)",
    },
    inProgress: {
      label: ISSUE_STATUS_LABELS.IN_PROGRESS,
      color: "#F59E0B",
    },
    resolved: {
      label: ISSUE_STATUS_LABELS.RESOLVED,
      color: "#22C55E",
    },
    closed: {
      label: ISSUE_STATUS_LABELS.CLOSED,
      color: "#64748B",
    },
  } satisfies ChartConfig;

  return (
    <div className="mt-4 rounded-2xl bg-linear-to-b from-primary/5 to-transparent px-1 pt-2">
      <ChartContainer config={chartConfig} className="h-[190px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          barGap={3}
          barCategoryGap="28%"
          margin={{ top: 8, right: 6, bottom: 0, left: -18 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="2 8" strokeLinecap="round" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={18}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={34} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="open" fill="var(--color-open)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="inProgress" fill="var(--color-inProgress)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="resolved" fill="var(--color-resolved)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="closed" fill="var(--color-closed)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
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
    <a
      href={`/projects/${project.id}`}
      className="grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-primary/10 lg:grid-cols-[minmax(14rem,1fr)_minmax(18rem,1.4fr)_8rem_7rem]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 rounded-xl">
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
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
    </a>
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

function RecentIssuesCard({
  workspaceId,
  issues,
}: {
  workspaceId: string;
  issues: WorkspaceRecentIssue[];
}) {
  return (
    <section className="rounded-[18px] border border-border/80 bg-card p-5 shadow-sm dark:bg-surface-elevated">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Recent Issues</h2>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground"
          render={<a href={`/workspaces/${workspaceId}/projects`} />}
        >
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
            <a
              key={issue.id}
              href={`/projects/${issue.projectId}?issue=${issue.id}`}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-transparent px-3 py-2.5 transition-all hover:border-primary/20 hover:bg-primary/10"
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
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card opacity-0 transition-opacity group-hover:opacity-100">
                  <Send className="h-4 w-4" />
                </span>
              </div>
            </a>
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
  const key = findGraphPointKey(graph, createdAt);
  return graph.map((point) =>
    point.key === key
      ? {
          ...point,
          reported: point.reported + 1,
          ...incrementGraphStatusCount(point, status),
        }
      : point,
  );
}

function incrementGraphStatusCount(point: WorkspaceIssueGraphPoint, status: ReportStatus) {
  return {
    open: point.open + (status === "OPEN" ? 1 : 0),
    inProgress: point.inProgress + (status === "IN_PROGRESS" ? 1 : 0),
    resolved: point.resolved + (status === "RESOLVED" ? 1 : 0),
    closed: point.closed + (status === "CLOSED" ? 1 : 0),
  };
}

function moveGraphStatusCount(
  point: WorkspaceIssueGraphPoint,
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
) {
  const next = {
    open: point.open,
    inProgress: point.inProgress,
    resolved: point.resolved,
    closed: point.closed,
  };
  const keys: Record<ReportStatus, keyof typeof next> = {
    OPEN: "open",
    IN_PROGRESS: "inProgress",
    RESOLVED: "resolved",
    CLOSED: "closed",
  };

  next[keys[previousStatus]] = Math.max(next[keys[previousStatus]] - 1, 0);
  next[keys[nextStatus]] += 1;
  return next;
}

function mapGraphRanges(
  graphs: Record<OverviewRange, WorkspaceIssueGraphPoint[]>,
  mapper: (graph: WorkspaceIssueGraphPoint[]) => WorkspaceIssueGraphPoint[],
) {
  return {
    "7d": mapper(graphs["7d"]),
    "30d": mapper(graphs["30d"]),
    "90d": mapper(graphs["90d"]),
    "1y": mapper(graphs["1y"]),
  };
}

function findGraphPointKey(graph: WorkspaceIssueGraphPoint[], createdAt: string) {
  const dayKey = createdAt.slice(0, 10);
  const monthKey = createdAt.slice(0, 7);
  return graph.find((point) => point.key === dayKey || point.key === monthKey)?.key ?? graph.at(-1)?.key;
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
