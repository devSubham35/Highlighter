import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspaces = await db.workspace.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      memberships: {
        where: { userId: session.user.id },
        select: { role: true },
        take: 1,
      },
    },
  });
  const sidebarWorkspaces = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    role: workspace.memberships[0]?.role ?? "VIEWER",
  }));

  return (
    <DashboardShell user={session.user} workspaces={sidebarWorkspaces}>
      {children}
    </DashboardShell>
  );
}
