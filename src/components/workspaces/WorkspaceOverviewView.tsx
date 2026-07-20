import { ContentContainer } from "@/components/common/ContentContainer";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

export type WorkspaceOverviewStats = {
  activeProjects: number;
  totalReports: number;
  memberCount: number;
  resolvedReports: number;
};

export function WorkspaceOverviewView({
  workspaceId,
  workspaceName,
  role,
  stats,
}: {
  workspaceId: string;
  workspaceName: string;
  role: string;
  stats: WorkspaceOverviewStats;
}) {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <ContentContainer>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {workspaceName}
              </h1>
              <Badge variant="success" className="h-6 px-2.5 text-[11px] font-medium">
                {roleLabel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer support and product feedback management.
            </p>
          </div>
          <Button
            render={<Link href={`/workspaces/${workspaceId}/projects`} />}
            size="sm"
            className="rounded-md"
          >
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Projects"
            value={stats.activeProjects}
            subtitle="Active projects"
            icon={FolderKanban}
            iconBgClassName="bg-emerald-500/10"
            iconClassName="text-emerald-600"
          />
          <StatsCard
            label="Reports"
            value={stats.totalReports}
            subtitle="Total reports"
            icon={FileText}
            iconBgClassName="bg-blue-500/10"
            iconClassName="text-blue-600"
          />
          <StatsCard
            label="Members"
            value={stats.memberCount}
            subtitle="Team members"
            icon={Users}
            iconBgClassName="bg-amber-500/10"
            iconClassName="text-amber-600"
          />
          <StatsCard
            label="Resolved"
            value={stats.resolvedReports}
            subtitle="Reports resolved"
            icon={CheckCircle2}
            iconBgClassName="bg-emerald-500/10"
            iconClassName="text-emerald-600"
          />
        </div>
      </div>
    </ContentContainer>
  );
}
