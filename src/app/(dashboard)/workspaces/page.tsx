import { WorkspacesView } from "@/components/workspaces/WorkspacesView";
import { canAccessAllWorkspaceProjects, projectAccessWhere } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const workspacesData = await db.workspace.findMany({
    where: { memberships: { some: { userId: session!.user.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      memberships: {
        take: 4,
        orderBy: { createdAt: "asc" },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });
  const currentMemberships = await db.membership.findMany({
    where: {
      userId: session!.user.id,
      workspaceId: { in: workspacesData.map((workspace) => workspace.id) },
    },
    select: { workspaceId: true, role: true },
  });
  const roleByWorkspaceId = new Map(
    currentMemberships.map((membership) => [membership.workspaceId, membership.role]),
  );

  const workspaces = await Promise.all(
    workspacesData.map(async (workspace) => {
      const role = roleByWorkspaceId.get(workspace.id) ?? "VIEWER";
      const projectWhere = canAccessAllWorkspaceProjects(role)
        ? { workspaceId: workspace.id, archived: false }
        : { workspaceId: workspace.id, archived: false, ...projectAccessWhere(session!.user.id) };

      return {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
        projectCount: await db.project.count({ where: projectWhere }),
        memberCount: workspace._count.memberships,
        members: workspace.memberships.map((membership) => ({
          id: membership.user.id,
          name: membership.user.name,
          image: membership.user.image,
        })),
      };
    }),
  );

  return <WorkspacesView workspaces={workspaces} />;
}
