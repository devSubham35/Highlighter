import { ContentContainer } from "@/components/common/ContentContainer";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3, FileText, FolderKanban, MoreHorizontal, Users } from "lucide-react";

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

export function WorkspaceOverviewView({
  workspaceName,
  role,
  stats,
  issueGraph,
}: {
  workspaceName: string;
  role: string;
  stats: WorkspaceOverviewStats;
  issueGraph: WorkspaceIssueGraphPoint[];
}) {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const openReports = Math.max(stats.totalReports - stats.resolvedReports, 0);
  const resolutionRate =
    stats.totalReports > 0 ? Math.round((stats.resolvedReports / stats.totalReports) * 100) : 0;
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
      value: stats.resolvedReports,
      detail: `${resolutionRate}% resolution rate`,
      tone: "text-primary",
      bg: "bg-primary/10",
      icon: CheckCircle2,
    },
    {
      label: "Team members",
      value: stats.memberCount,
      detail: "Available collaborators",
      tone: "text-primary",
      bg: "bg-primary/10",
      icon: Users,
    },
  ];
  const maxGraphValue = Math.max(...issueGraph.map((item) => item.reported), 1);
  const totalRecentReports = issueGraph.reduce((sum, item) => sum + item.reported, 0);
  const totalRecentResolved = issueGraph.reduce((sum, item) => sum + item.resolved, 0);

  return (
    <ContentContainer>
      <div className="space-y-6">
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
              value={stats.activeProjects}
              subtitle="Active projects"
              trend="+12%"
              icon={FolderKanban}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Reports"
              value={stats.totalReports}
              subtitle="Total reports"
              trend="+25%"
              icon={FileText}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Members"
              value={stats.memberCount}
              subtitle="Team members"
              trend="+8%"
              icon={Users}
              iconBgClassName="bg-primary/10"
              iconClassName="text-primary"
            />
            <StatsCard
              label="Resolved"
              value={stats.resolvedReports}
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
                      {issueGraph.map((item) => {
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
        </div>
      </div>
    </ContentContainer>
  );
}
