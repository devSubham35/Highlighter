import { BreadcrumbHeader } from "@/components/common/BreadcrumbHeader";
import { ContentContainer } from "@/components/common/ContentContainer";
import { MembersManagementView } from "@/components/members/MembersManagementView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function WorkspaceMembersPage({
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
      memberships: { some: { userId: session!.user.id, suspended: false } },
    },
    include: {
      projects: {
        where: { archived: false },
        select: { id: true, name: true, websiteUrl: true },
        orderBy: { name: "asc" },
      },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          projectMemberships: { include: { project: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        include: {
          invitedBy: { select: { id: true, name: true, email: true, image: true } },
          projects: { include: { project: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) notFound();

  const currentMembership = workspace.memberships.find(
    (membership) => membership.userId === session!.user.id,
  );
  if (!currentMembership) notFound();

  const canManage = currentMembership.role === "OWNER" || currentMembership.role === "ADMIN";
  const canInvite = currentMembership.role === "OWNER";
  const visibleInvitations = workspace.invitations.filter(
    (invitation) => invitation.status !== "ACCEPTED",
  );

  return (
    <ContentContainer>
      <div className="space-y-6">
        <BreadcrumbHeader
          items={[
            { label: "Workspaces", href: "/workspaces" },
            { label: workspace.name, href: `/workspaces/${workspace.id}` },
            { label: "Members" },
          ]}
        />
        <MembersManagementView
          workspace={{
            id: workspace.id,
            name: workspace.name,
          }}
          currentUser={{
            id: session!.user.id,
            role: currentMembership.role,
            canManage,
            canInvite,
          }}
          projects={workspace.projects}
          initialMembers={workspace.memberships.map((membership) => ({
            id: membership.id,
            role: membership.role,
            status: membership.suspended ? "SUSPENDED" : "ACTIVE",
            createdAt: membership.createdAt.toISOString(),
            lastActiveAt: membership.lastActiveAt?.toISOString() ?? null,
            user: membership.user,
            projects: membership.projectMemberships.map((item) => item.project),
          }))}
          initialInvitations={
            canInvite
              ? visibleInvitations.map((invitation) => ({
                  id: invitation.id,
                  email: invitation.email,
                  token: invitation.token,
                  role: invitation.role,
                  status:
                    invitation.status === "PENDING" && invitation.expiresAt < new Date()
                      ? "EXPIRED"
                      : invitation.status,
                  createdAt: invitation.createdAt.toISOString(),
                  expiresAt: invitation.expiresAt.toISOString(),
                  acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
                  cancelledAt: invitation.cancelledAt?.toISOString() ?? null,
                  revokedAt: invitation.revokedAt?.toISOString() ?? null,
                  resentAt: invitation.resentAt?.toISOString() ?? null,
                  invitedBy: invitation.invitedBy,
                  projects: invitation.projects.map((item) => item.project),
                }))
              : []
          }
        />
      </div>
    </ContentContainer>
  );
}
