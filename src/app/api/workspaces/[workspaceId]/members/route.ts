import { requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]/members">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId);
  if ("error" in access) return access.error;

  const memberships = await db.membership.findMany({
    where: { workspaceId },
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
