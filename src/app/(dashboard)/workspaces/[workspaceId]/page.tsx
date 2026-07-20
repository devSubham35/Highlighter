import { WorkspaceOverviewView } from "@/components/workspaces/WorkspaceOverviewView";
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

  const workspaceFilter = { project: { workspaceId: workspace.id } };

  const chartStart = startOfMonth(subMonths(new Date(), 5));

  const [activeProjects, totalReports, memberCount, resolvedReports, recentReports] = await Promise.all([
    db.project.count({ where: { workspaceId: workspace.id, archived: false } }),
    db.report.count({ where: workspaceFilter }),
    db.membership.count({ where: { workspaceId: workspace.id } }),
    db.report.count({ where: { ...workspaceFilter, status: "RESOLVED" } }),
    db.report.findMany({
      where: {
        ...workspaceFilter,
        createdAt: { gte: chartStart },
      },
      select: {
        createdAt: true,
        status: true,
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

  return (
    <WorkspaceOverviewView
      workspaceName={workspace.name}
      role={workspace.memberships[0]?.role ?? "MEMBER"}
      stats={{
        activeProjects,
        totalReports,
        memberCount,
        resolvedReports,
      }}
      issueGraph={issueGraph}
    />
  );
}
