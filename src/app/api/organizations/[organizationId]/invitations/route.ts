import { jsonError, requireOrgMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/organizations/[organizationId]/invitations">) {
  const { organizationId } = await ctx.params;
  const access = await requireOrgMembership(organizationId, "ADMIN");
  if ("error" in access) return access.error;

  const invitations = await db.invitation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
