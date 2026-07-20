import { WorkspaceOverviewView } from "@/components/workspaces/WorkspaceOverviewView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  const [activeProjects, totalReports, memberCount, resolvedReports] = await Promise.all([
    db.project.count({ where: { workspaceId: workspace.id, archived: false } }),
    db.report.count({ where: workspaceFilter }),
    db.membership.count({ where: { workspaceId: workspace.id } }),
    db.report.count({ where: { ...workspaceFilter, status: "RESOLVED" } }),
  ]);

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
    />
  );
}
