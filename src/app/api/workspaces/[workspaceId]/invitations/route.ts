import { requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]/invitations">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const invitations = await db.invitation.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
