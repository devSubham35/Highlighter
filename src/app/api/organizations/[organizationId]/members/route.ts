import { jsonError, requireOrgMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/organizations/[organizationId]/members">) {
  const { organizationId } = await ctx.params;
  const access = await requireOrgMembership(organizationId);
  if ("error" in access) return access.error;

  const memberships = await db.membership.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: membership.user,
    })),
  );
}
