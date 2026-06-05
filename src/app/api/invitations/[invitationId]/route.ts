import { jsonError, requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/invitations/[invitationId]">) {
  const { invitationId } = await ctx.params;

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) return jsonError("Invitation not found", 404);

  const access = await requireWorkspaceMembership(invitation.workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  await db.invitation.delete({ where: { id: invitationId } });
  return NextResponse.json({ ok: true });
}
