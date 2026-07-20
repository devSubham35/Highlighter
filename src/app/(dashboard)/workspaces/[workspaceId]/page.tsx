import { WorkspaceOverviewView } from "@/components/workspaces/WorkspaceOverviewView";
import { canAccessAllWorkspaceProjects, projectAccessWhere } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, startOfMonth, subMonths } from "date-fns";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

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

  const [activeProjects, totalReports, memberCount, resolvedReports, recentReports, visibleProjects] = await Promise.all([
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
        reports: {
          select: { status: true },
        },
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
    const openTickets = project.reports.filter((report) => report.status === "OPEN").length;
    const resolvedTickets = project.reports.filter(
      (report) => report.status === "RESOLVED" || report.status === "CLOSED",
    ).length;

    return {
      id: project.id,
      name: project.name,
      openTickets,
      resolvedTickets,
      totalTickets: project.reports.length,
    };
  });

  return (
    <WorkspaceOverviewView
      workspaceName={workspace.name}
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
    />
  );
}
