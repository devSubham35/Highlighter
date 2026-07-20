"use client";

import { ContentContainer } from "@/components/common/ContentContainer";
import { Badge } from "@/components/ui/badge";
import { ISSUE_STATUS_LABELS } from "@/lib/issue-options";
import type { IssueRealtimeEvent } from "@/lib/realtime";
import { useIssueRealtime } from "@/lib/use-issue-realtime";
import type { ReportStatus } from "@/types";
import { FileText, FolderKanban, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
};

const STATUS_SEGMENTS: Array<{
  status: ReportStatus;
  className: string;
  dotClassName: string;
}> = [
  { status: "OPEN", className: "bg-info", dotClassName: "bg-info" },
  { status: "IN_PROGRESS", className: "bg-warning", dotClassName: "bg-warning" },
  { status: "RESOLVED", className: "bg-success", dotClassName: "bg-success" },
  { status: "CLOSED", className: "bg-muted-foreground", dotClassName: "bg-muted-foreground" },
];

export function WorkspaceOverviewView({
  workspaceName,
  role,
  stats,
  issueGraph,
  projectStats,
  projectIds,
}: {
  workspaceName: string;
  role: string;
  stats: WorkspaceOverviewStats;
  issueGraph: WorkspaceIssueGraphPoint[];
  projectStats: WorkspaceProjectStats[];
  projectIds: string[];
}) {
  const [liveStats, setLiveStats] = useState(stats);
  const [liveIssueGraph, setLiveIssueGraph] = useState(issueGraph);
  const [liveProjectStats, setLiveProjectStats] = useState(projectStats);

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
      if (!cancelled) setLiveIssueGraph(issueGraph);
    });
    return () => {
      cancelled = true;
    };
  }, [issueGraph]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLiveProjectStats(projectStats);
    });
    return () => {
      cancelled = true;
    };
  }, [projectStats]);

  function handleRealtimeEvent(event: IssueRealtimeEvent) {
    if (event.type === "issue.created") {
      setLiveStats((current) => ({
        ...current,
        totalReports: current.totalReports + 1,
        resolvedReports: isResolvedStatus(event.issue.status)
          ? current.resolvedReports + 1
          : current.resolvedReports,
      }));
      setLiveIssueGraph((current) => incrementGraphBucket(current, event.issue.createdAt, event.issue.status));
      setLiveProjectStats((current) => incrementProjectStatus(current, event.projectId, event.issue.status));
      return;
    }

    if (event.type === "issue:status_changed") {
      setLiveStats((current) => ({
        ...current,
        resolvedReports: applyResolvedDelta(
          current.resolvedReports,
          event.previousStatus,
          event.status,
        ),
      }));
      setLiveIssueGraph((current) =>
        current.map((point) => {
          if (point.key !== event.issue.createdAt.slice(0, 7)) return point;
          return {
            ...point,
            resolved: applyResolvedDelta(point.resolved, event.previousStatus, event.status),
          };
        }),
      );
      setLiveProjectStats((current) =>
        current.map((project) => {
          if (project.id !== event.projectId) return project;
          return {
            ...project,
            statusCounts: moveProjectStatusCount(
              project.statusCounts,
              event.previousStatus,
              event.status,
            ),
          };
        }),
      );
    }
  }

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const maxGraphValue = Math.max(...liveIssueGraph.map((item) => item.reported), 1);
  const totalRecentReports = liveIssueGraph.reduce((sum, item) => sum + item.reported, 0);
  const totalRecentResolved = liveIssueGraph.reduce((sum, item) => sum + item.resolved, 0);
  const totalProjectTickets = liveProjectStats.reduce((sum, project) => sum + project.totalTickets, 0);
  const totalStatusCounts = liveProjectStats.reduce<Record<ReportStatus, number>>(
    (totals, project) => {
      STATUS_SEGMENTS.forEach((segment) => {
        totals[segment.status] += project.statusCounts[segment.status];
      });
      return totals;
    },
    { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
  );

  return (
    <ContentContainer>
      <div className="space-y-6">
        {projectIds.map((projectId) => (
          <WorkspaceOverviewRealtimeBridge
            key={projectId}
            projectId={projectId}
            onEvent={handleRealtimeEvent}
          />
        ))}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {workspaceName}
              </h1>
              <Badge className="h-6 px-2.5 text-[11px] font-medium">
                {roleLabel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer support and product feedback management.
            </p>
          </div>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewKpiCard
              label="Projects"
              value={liveStats.activeProjects}
              description="Active projects"
              icon={FolderKanban}
            />
            <OverviewKpiCard
              label="Reports"
              value={liveStats.totalReports}
              description="Total reports"
              icon={FileText}
            />
            <OverviewKpiCard
              label="Members"
              value={liveStats.memberCount}
              description="Team members"
              icon={Users}
            />
          </div>

          <div className="mt-4">
            <section className="rounded-2xl border border-sidebar-border bg-card p-4 dark:bg-surface-elevated">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Issue trend</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalRecentReports} reported, {totalRecentResolved} resolved in the last 6 months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Reported
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Resolved
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-muted/20 px-4 py-4">
                <div className="grid h-48 grid-cols-[2rem_1fr] gap-3">
                  <div className="flex flex-col justify-between text-right text-[10px] text-muted-foreground">
                    <span>{maxGraphValue}</span>
                    <span>{Math.ceil(maxGraphValue / 2)}</span>
                    <span>0</span>
                  </div>
                  <div className="grid grid-rows-[1fr_1.5rem]">
                    <div className="relative">
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2].map((line) => (
                          <span key={line} className="h-px w-full bg-border/70" />
                        ))}
                      </div>
                      <div className="relative z-10 flex h-full items-end gap-4">
                        {liveIssueGraph.map((item) => {
                          const reportedHeight = Math.max((item.reported / maxGraphValue) * 100, item.reported > 0 ? 8 : 0);
                          const resolvedHeight = Math.max((item.resolved / maxGraphValue) * 100, item.resolved > 0 ? 8 : 0);

                          return (
                            <div key={item.key} className="flex h-full flex-1 items-end justify-center gap-1.5">
                                <GraphTooltip
                                  title={item.label}
                                  label="Reported"
                                  value={item.reported}
                                  dotClassName="bg-primary"
                                  triggerClassName="w-4 rounded-t-md bg-primary"
                                  triggerStyle={{ height: `${reportedHeight}%` }}
                                />
                                <GraphTooltip
                                  title={item.label}
                                  label="Resolved"
                                  value={item.resolved}
                                  dotClassName="bg-success"
                                  triggerClassName="w-4 rounded-t-md bg-success"
                                  triggerStyle={{ height: `${resolvedHeight}%` }}
                                />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-4 border-t border-border/70 pt-2">
                      {liveIssueGraph.map((item) => (
                        <span key={item.key} className="flex-1 text-center text-[11px] text-muted-foreground">
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_SEGMENTS.map((segment) => (
              <div
                key={segment.status}
                className="rounded-2xl border border-sidebar-border bg-card p-4 dark:bg-surface-elevated"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {ISSUE_STATUS_LABELS[segment.status]}
                  </p>
                  <span className={`h-2.5 w-2.5 rounded-full ${segment.dotClassName}`} />
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {totalStatusCounts[segment.status]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Across all projects</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-2xl border border-sidebar-border bg-card p-4 dark:bg-surface-elevated lg:w-1/2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Project status overview</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalProjectTickets} tickets across all visible projects
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {STATUS_SEGMENTS.map((segment) => (
                  <span key={segment.status} className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${segment.dotClassName}`} />
                    {ISSUE_STATUS_LABELS[segment.status]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {liveProjectStats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sidebar-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No projects available.
                </div>
              ) : (
                <div className="overflow-visible rounded-xl border border-sidebar-border bg-card">
                  <div className="grid grid-cols-[minmax(12rem,1.1fr)_minmax(18rem,2fr)_4.5rem] border-b border-sidebar-border bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Project</span>
                    <span>Status distribution</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="divide-y divide-sidebar-border">
                    {liveProjectStats.map((project) => (
                      <ProjectStatusRow key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </ContentContainer>
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

function OverviewKpiCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof FolderKanban;
}) {
  return (
    <div className="rounded-2xl border border-sidebar-border bg-card p-4 dark:bg-surface-elevated">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function isResolvedStatus(status: ReportStatus) {
  return status === "RESOLVED" || status === "CLOSED";
}

function applyResolvedDelta(
  current: number,
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
) {
  if (previousStatus === nextStatus) return current;
  if (isResolvedStatus(previousStatus) && !isResolvedStatus(nextStatus)) {
    return Math.max(current - 1, 0);
  }
  if (!isResolvedStatus(previousStatus) && isResolvedStatus(nextStatus)) {
    return current + 1;
  }
  return current;
}

function incrementGraphBucket(
  graph: WorkspaceIssueGraphPoint[],
  createdAt: string,
  status: ReportStatus,
) {
  const key = createdAt.slice(0, 7);
  return graph.map((point) => {
    if (point.key !== key) return point;
    return {
      ...point,
      reported: point.reported + 1,
      resolved: isResolvedStatus(status) ? point.resolved + 1 : point.resolved,
    };
  });
}

function ProjectStatusRow({ project }: { project: WorkspaceProjectStats }) {
  const visibleSegments = STATUS_SEGMENTS.filter(
    (segment) => project.statusCounts[segment.status] > 0,
  );

  return (
    <div className="grid grid-cols-[minmax(12rem,1.1fr)_minmax(18rem,2fr)_4.5rem] items-center gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {project.totalTickets === 0 ? "No tickets yet" : "All project tickets"}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex h-3 rounded-full bg-muted">
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
                  triggerClassName={`${segment.className} h-full transition-[width] duration-300 ${first ? "rounded-l-full" : ""} ${last ? "rounded-r-full" : ""}`}
                  triggerStyle={{ width: `${(count / project.totalTickets) * 100}%` }}
                />
              );
            })
          )}
        </div>
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

      <p className="text-right text-sm font-semibold text-foreground">{project.totalTickets}</p>
    </div>
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
        <span className="font-medium text-foreground">{count}</span>{" "}
        {ISSUE_STATUS_LABELS[status]}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg border border-sidebar-border bg-white px-3 py-2 text-foreground shadow-xl dark:bg-surface-elevated group-hover:block">
        <span className="block min-w-32">
          <span className="block truncate text-xs font-semibold text-foreground">{projectName}</span>
          <span className="mt-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
              {ISSUE_STATUS_LABELS[status]}
            </span>
            <span className="font-semibold text-foreground">{count}</span>
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
    <span
      className={`group relative block shrink-0 outline-none ${triggerClassName}`}
      style={triggerStyle}
      tabIndex={0}
    >
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg border border-sidebar-border bg-white px-3 py-2 text-foreground opacity-100 shadow-xl dark:bg-surface-elevated group-hover:block group-focus-visible:block"
      >
        <div className="min-w-32">
          <p className="truncate text-xs font-semibold text-foreground">{title}</p>
          <div className="mt-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
              {label}
            </span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
        </div>
      </span>
    </span>
  );
}

function incrementProjectStatus(
  projectStats: WorkspaceProjectStats[],
  projectId: string,
  status: ReportStatus,
) {
  return projectStats.map((project) => {
    if (project.id !== projectId) return project;
    const statusCounts = { ...project.statusCounts };
    statusCounts[status] += 1;

    return {
      ...project,
      totalTickets: project.totalTickets + 1,
      statusCounts,
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
