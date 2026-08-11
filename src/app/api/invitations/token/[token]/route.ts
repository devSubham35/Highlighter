import { db } from "@/lib/db";
import { jsonError } from "@/lib/api/helpers";
import { parseInvitationToken } from "@/lib/invitation-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invitations/token/[token]">) {
  const { token } = await ctx.params;
  if (!parseInvitationToken(token)) return jsonError("Invalid invitation token", 400);

  const invitation = await db.invitation.findFirst({
    where: { token, workspace: { deletedAt: null } },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
      projects: { include: { project: { select: { id: true, name: true } } } },
    },
  });

  if (!invitation) return jsonError("Invitation not found", 404);

  const expired = invitation.expiresAt < new Date();
  const valid = invitation.status === "PENDING" && !expired;

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: expired && invitation.status === "PENDING" ? "EXPIRED" : invitation.status,
    expiresAt: invitation.expiresAt,
    valid,
    workspace: invitation.workspace,
    invitedBy: invitation.invitedBy,
    projects: invitation.projects.map((item) => item.project),
    message: invitation.message,
    acceptedAt: invitation.acceptedAt,
    cancelledAt: invitation.cancelledAt,
    revokedAt: invitation.revokedAt,
    resentAt: invitation.resentAt,
  });
}
