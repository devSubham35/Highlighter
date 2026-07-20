"use client";

import { ContentContainer } from "@/components/common/ContentContainer";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IssueRealtimeEvent } from "@/lib/realtime";
import { useIssueRealtime } from "@/lib/use-issue-realtime";
import type { ReportStatus } from "@/types";
import { CheckCircle2, FileText, FolderKanban, MoreHorizontal, Users } from "lucide-react";
import { useEffect, useState } from "react";

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
  openTickets: number;
  resolvedTickets: number;
  totalTickets: number;
};

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
      setLiveProjectStats((current) => incrementProjectStats(current, event.projectId, event.issue.status));
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
            openTickets: applyStatusDelta(project.openTickets, event.previousStatus, event.status, "OPEN"),
            resolvedTickets: applyResolvedDelta(project.resolvedTickets, event.previousStatus, event.status),
          };
        }),
      );
    }
  }

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const openReports = Math.max(liveStats.totalReports - liveStats.resolvedReports, 0);
  const resolutionRate =
    liveStats.totalReports > 0 ? Math.round((liveStats.resolvedReports / liveStats.totalReports) * 100) : 0;
  const activityItems = [
    {
      label: "Open feedback",
      value: openReports,
      detail: "Reports awaiting review",
      tone: "text-primary",
      bg: "bg-primary/10",
      icon: FileText,
    },
    {
      label: "Resolved reports",
      value: liveStats.resolvedReports,
      detail: `${resolutionRate}% resolution rate`,
      tone: "text-primary",
      bg: "bg-primary/10",
      icon: CheckCircle2,
    },
    {
      label: "Team members",
      value: liveStats.memberCount,
      detail: "Available collaborators",
      tone: "text-primary",
      bg: "bg-primary/10",
      icon: Users,
    },
  ];
  const maxGraphValue = Math.max(...liveIssueGraph.map((item) => item.reported), 1);
  const totalRecentReports = liveIssueGraph.reduce((sum, item) => sum + item.reported, 0);
  const totalRecentResolved = liveIssueGraph.reduce((sum, item) => sum + item.resolved, 0);
  const maxProjectTickets = Math.max(
    ...liveProjectStats.map((project) => Math.max(project.openTickets, project.resolvedTickets)),
    1,
  );
  const totalProjectOpenTickets = liveProjectStats.reduce((sum, project) => sum + project.openTickets, 0);
  const totalProjectResolvedTickets = liveProjectStats.reduce((sum, project) => sum + project.resolvedTickets, 0);

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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Projects"
              value={liveStats.activeProjects}
              subtitle="Active projects"
              trend="+12%"
              icon={FolderKanban}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Reports"
              value={liveStats.totalReports}
              subtitle="Total reports"
              trend="+25%"
              icon={FileText}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Members"
              value={liveStats.memberCount}
              subtitle="Team members"
              trend="+8%"
              icon={Users}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Resolved"
              value={liveStats.resolvedReports}
              subtitle="Reports resolved"
              trend={`${resolutionRate}%`}
              icon={CheckCircle2}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_1.4fr]">
            <section className="rounded-2xl border border-sidebar-border bg-card py-0 dark:bg-surface-elevated">
              <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Workspace activity</h2>
                <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="divide-y divide-sidebar-border">
                {activityItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                        <Icon className={`h-4.5 w-4.5 ${item.tone}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </section>

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
                <div className="grid h-44 grid-cols-[2rem_1fr] gap-3">
                  <div className="flex flex-col justify-between text-right text-[10px] text-muted-foreground">
                    <span>{maxGraphValue}</span>
                    <span>{Math.ceil(maxGraphValue / 2)}</span>
                    <span>0</span>
                  </div>
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
                          <div key={item.key} className="flex h-full flex-1 flex-col justify-end gap-2">
                            <div className="flex h-full items-end justify-center gap-1.5">
                              <div
                                className="w-4 rounded-t-md bg-primary"
                                title={`${item.reported} reported`}
                                style={{ height: `${reportedHeight}%` }}
                              />
                              <div
                                className="w-4 rounded-t-md bg-success"
                                title={`${item.resolved} resolved`}
                                style={{ height: `${resolvedHeight}%` }}
                              />
                            </div>
                            <span className="text-center text-[11px] text-muted-foreground">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-2xl border border-sidebar-border bg-card p-4 dark:bg-surface-elevated">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Project ticket stats</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalProjectOpenTickets} open, {totalProjectResolvedTickets} resolved across visible projects
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Open
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Resolved
                </span>
              </div>
            </div>

            <div className="mt-4">
              {liveProjectStats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sidebar-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No projects available.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl bg-muted/20 px-4 py-4">
                  <div className="grid h-64 min-w-[44rem] grid-cols-[2rem_1fr] gap-3">
                    <div className="flex flex-col justify-between text-right text-[10px] text-muted-foreground">
                      <span>{maxProjectTickets}</span>
                      <span>{Math.ceil(maxProjectTickets / 2)}</span>
                      <span>0</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex flex-col justify-between pb-9">
                        {[0, 1, 2].map((line) => (
                          <span key={line} className="h-px w-full bg-border/70" />
                        ))}
                      </div>

                      <div className="relative z-10 grid h-full grid-flow-col auto-cols-fr gap-4">
                        {liveProjectStats.map((project) => {
                          const openHeight = Math.max(
                            (project.openTickets / maxProjectTickets) * 100,
                            project.openTickets > 0 ? 8 : 0,
                          );
                          const resolvedHeight = Math.max(
                            (project.resolvedTickets / maxProjectTickets) * 100,
                            project.resolvedTickets > 0 ? 8 : 0,
                          );

                          return (
                            <div key={project.id} className="flex min-w-28 flex-col justify-end gap-2">
                              <div className="flex h-full items-end justify-center gap-2 pb-2">
                                <div className="flex min-w-8 flex-col items-center gap-1">
                                  <span className="text-[10px] font-semibold text-primary">{project.openTickets}</span>
                                  <div
                                    className="w-5 rounded-t-md bg-primary transition-[height] duration-300"
                                    title={`${project.name}: ${project.openTickets} open`}
                                    style={{ height: `${openHeight}%` }}
                                  />
                                </div>
                                <div className="flex min-w-8 flex-col items-center gap-1">
                                  <span className="text-[10px] font-semibold text-success">{project.resolvedTickets}</span>
                                  <div
                                    className="w-5 rounded-t-md bg-success transition-[height] duration-300"
                                    title={`${project.name}: ${project.resolvedTickets} resolved`}
                                    style={{ height: `${resolvedHeight}%` }}
                                  />
                                </div>
                              </div>
                              <div className="min-h-9 text-center">
                                <p className="truncate text-[11px] font-medium text-foreground" title={project.name}>
                                  {project.name}
                                </p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                  {project.totalTickets} total
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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

function applyStatusDelta(
  current: number,
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
  watchedStatus: ReportStatus,
) {
  if (previousStatus === nextStatus) return current;
  if (previousStatus === watchedStatus && nextStatus !== watchedStatus) {
    return Math.max(current - 1, 0);
  }
  if (previousStatus !== watchedStatus && nextStatus === watchedStatus) {
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

function incrementProjectStats(
  projectStats: WorkspaceProjectStats[],
  projectId: string,
  status: ReportStatus,
) {
  return projectStats.map((project) => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      totalTickets: project.totalTickets + 1,
      openTickets: status === "OPEN" ? project.openTickets + 1 : project.openTickets,
      resolvedTickets: isResolvedStatus(status) ? project.resolvedTickets + 1 : project.resolvedTickets,
    };
  });
}
