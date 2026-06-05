import {
  getWorkspaceCounts,
  isWorkspaceNameTaken,
  jsonError,
  requireWorkspaceMembership,
} from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { updateWorkspaceSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId);
  if ("error" in access) return access.error;

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) return jsonError("Not found", 404);

  const counts = await getWorkspaceCounts(workspaceId);
  const canManage = access.membership.role === "ADMIN" || access.membership.role === "OWNER";

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerId: workspace.ownerId,
    role: access.membership.role,
    ...counts,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    members: workspace.memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: membership.user,
    })),
    ...(canManage ? { invitations: workspace.invitations } : {}),
  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const parsed = updateWorkspaceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  if (await isWorkspaceNameTaken(access.session.user.id, parsed.data.name, workspaceId)) {
    return jsonError("A workspace with this name already exists.", 409);
  }

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: { name: parsed.data.name },
  });

  const counts = await getWorkspaceCounts(workspaceId);

  return NextResponse.json({
    ...workspace,
    ...counts,
    role: access.membership.role,
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[workspaceId]">) {
  const { workspaceId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId, "OWNER");
  if ("error" in access) return access.error;

  await db.workspace.delete({ where: { id: workspaceId } });
  return NextResponse.json({ ok: true });
}
