import { db } from "@/lib/db";
import { jsonError } from "@/lib/api/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invitations/token/[token]">) {
  const { token } = await ctx.params;

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { id: true, name: true } },
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
    organization: invitation.organization,
  });
}
