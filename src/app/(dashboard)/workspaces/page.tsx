import { WorkspacesView } from "@/components/workspaces/WorkspacesView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizations = await db.organization.findMany({
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
          projects: { where: { archived: false } },
          memberships: true,
        },
      },
    },
  });

  const workspaces = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    createdAt: org.createdAt.toISOString(),
    projectCount: org._count.projects,
    memberCount: org._count.memberships,
    members: org.memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      image: membership.user.image,
    })),
  }));

  return <WorkspacesView workspaces={workspaces} />;
}
