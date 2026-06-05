import { jsonError, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { acceptInvitationSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const parsed = acceptInvitationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const invitation = await db.invitation.findUnique({
    where: { token: parsed.data.token },
    include: { workspace: true },
  });

  if (!invitation) return jsonError("Invitation not found", 404);
  if (invitation.status !== "PENDING") return jsonError("Invitation is no longer valid", 400);
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return jsonError("Invitation has expired", 400);
  }

  const userEmail = authResult.session.user.email?.toLowerCase();
  if (!userEmail || userEmail !== invitation.email.toLowerCase()) {
    return jsonError("This invitation was sent to a different email address", 403);
  }

  const existingMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: authResult.session.user.id,
        workspaceId: invitation.workspaceId,
      },
    },
  });

  if (existingMembership) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    return jsonError("You are already a member of this workspace", 409);
  }

  const [membership] = await db.$transaction([
    db.membership.create({
      data: {
        userId: authResult.session.user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    workspace: invitation.workspace,
    membership: {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: membership.user,
    },
  });
}
