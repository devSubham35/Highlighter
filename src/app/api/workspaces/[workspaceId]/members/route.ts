import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/api/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]/members">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId);
  if ("error" in access) return access.error;

  const memberships = await db.membership.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      projectMemberships: { include: { project: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const invitations = access.membership.role === "OWNER"
    ? await db.invitation.findMany({
        where: { workspaceId, status: { not: "ACCEPTED" } },
        include: {
          invitedBy: { select: { id: true, name: true, email: true, image: true } },
          projects: { include: { project: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return NextResponse.json({
    currentUserRole: access.membership.role,
    members: memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      suspended: membership.suspended,
      lastActiveAt: membership.lastActiveAt,
      user: membership.user,
      projects: membership.projectMemberships.map((item) => item.project),
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status:
        invitation.status === "PENDING" && invitation.expiresAt < new Date()
          ? "EXPIRED"
          : invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      acceptedAt: invitation.acceptedAt,
      cancelledAt: invitation.cancelledAt,
      revokedAt: invitation.revokedAt,
      resentAt: invitation.resentAt,
      invitedBy: invitation.invitedBy,
      projects: invitation.projects.map((item) => item.project),
    })),
  });
}
