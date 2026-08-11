import { BreadcrumbHeader } from "@/components/common/BreadcrumbHeader";
import { ContentContainer } from "@/components/common/ContentContainer";
import { WorkspaceSettingsView } from "@/components/workspaces/WorkspaceSettingsView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      deletedAt: null,
      memberships: { some: { userId: session.user.id, suspended: false } },
    },
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

  if (!workspace) notFound();

  const role = workspace.memberships[0]?.role ?? "VIEWER";

  return (
    <ContentContainer>
      <div className="space-y-6">
        <BreadcrumbHeader
          items={[
            { label: "Workspaces", href: "/workspaces" },
            { label: workspace.name, href: `/workspaces/${workspace.id}` },
            { label: "Workspace Settings" },
          ]}
          description="Manage destructive settings for this workspace."
        />
        <WorkspaceSettingsView
          workspace={{ id: workspace.id, name: workspace.name }}
          canDelete={role === "OWNER"}
        />
      </div>
    </ContentContainer>
  );
}
