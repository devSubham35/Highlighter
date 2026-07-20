import { jsonError, requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { createInvitationToken, invitationUrl } from "@/lib/invitation-token";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/invitations/[invitationId]">) {
  const { invitationId } = await ctx.params;
  const body = (await req.json()) as { action?: string };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      projects: { include: { project: { select: { id: true, name: true } } } },
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invitation) return jsonError("Invitation not found", 404);

  const access = await requireWorkspaceMembership(invitation.workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  if (body.action === "resend") {
    if (invitation.status !== "PENDING" && invitation.status !== "EXPIRED") {
      return jsonError("Only pending or expired invitations can be resent.", 400);
    }

    const token = createInvitationToken(invitation.id);
    const updated = await db.invitation.update({
      where: { id: invitation.id },
      data: {
        token,
        status: "PENDING",
        expiresAt: addDays(new Date(), 7),
        resentAt: new Date(),
      },
      include: {
        projects: { include: { project: { select: { id: true, name: true } } } },
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
    const inviteUrl = invitationUrl(token, req.nextUrl.origin);
    const projects = updated.projects.map((item) => item.project.name);

    try {
      await sendInvitationEmail({
        to: updated.email,
        invitationUrl: inviteUrl,
        workspaceName: updated.workspace.name,
        inviterName: updated.invitedBy.name ?? updated.invitedBy.email,
        inviterEmail: updated.invitedBy.email,
        role: updated.role,
        projects,
        expiresAt: updated.expiresAt,
        message: updated.message,
      });
    } catch (error) {
      return NextResponse.json(
        {
          ...updated,
          invitationUrl: inviteUrl,
          deliveryError: error instanceof Error ? error.message : "Unknown SMTP delivery error",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...updated,
      invitationUrl: inviteUrl,
      emailPreview: {
        subject: `Reminder: accept your invitation to ${updated.workspace.name}`,
        workspaceName: updated.workspace.name,
        role: updated.role,
        projects,
        expiresAt: updated.expiresAt,
        message: updated.message,
      },
    });
  }

  if (body.action === "cancel") {
    if (invitation.status !== "PENDING") return jsonError("Only pending invitations can be cancelled.", 400);
    const updated = await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "revoke") {
    if (invitation.status === "ACCEPTED") return jsonError("Accepted invitations cannot be revoked.", 400);
    const updated = await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return jsonError("Unsupported invitation action.", 400);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/invitations/[invitationId]">) {
  const { invitationId } = await ctx.params;

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) return jsonError("Invitation not found", 404);

  const access = await requireWorkspaceMembership(invitation.workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
