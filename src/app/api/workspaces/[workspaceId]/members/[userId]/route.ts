import { canManageMembers, jsonError, requireSession, requireWorkspaceMembership } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { updateMemberRoleSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/workspaces/[workspaceId]/members/[userId]">,
) {
  const { workspaceId, userId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const parsed = updateMemberRoleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const target = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!target) return jsonError("Member not found", 404);
  if (target.role === "OWNER" && access.membership.role !== "OWNER") {
    return jsonError("Only owners can manage another owner.", 403);
  }
  if (target.role === "OWNER" && parsed.data.role) {
    return jsonError("Transfer ownership before changing the owner role.", 400);
  }
  if (parsed.data.role === "ADMIN" && access.membership.role !== "OWNER" && target.role === "ADMIN") {
    return jsonError("Admins cannot manage other admins.", 403);
  }

  const projectIds = parsed.data.projectIds ? Array.from(new Set(parsed.data.projectIds)) : null;
  if (projectIds) {
    const validCount = await db.project.count({
      where: { workspaceId, id: { in: projectIds } },
    });
    if (validCount !== projectIds.length) {
      return jsonError("One or more projects do not belong to this workspace.", 400);
    }
  }

  const membership = await db.$transaction(async (tx) => {
    const updated = await tx.membership.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: {
        role: parsed.data.role,
        suspended: parsed.data.suspended,
      },
    });

    if (projectIds) {
      await tx.projectMembership.deleteMany({ where: { membershipId: updated.id } });
      if (projectIds.length > 0) {
        await tx.projectMembership.createMany({
          data: projectIds.map((projectId) => ({ membershipId: updated.id, projectId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.membership.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        projectMemberships: { include: { project: { select: { id: true, name: true } } } },
      },
    });
  });

  return NextResponse.json({
    id: membership.id,
    role: membership.role,
    createdAt: membership.createdAt,
    suspended: membership.suspended,
    lastActiveAt: membership.lastActiveAt,
    user: membership.user,
    projects: membership.projectMemberships.map((item) => item.project),
  });
}

export async function PUT(
  _req: NextRequest,
  ctx: RouteContext<"/api/workspaces/[workspaceId]/members/[userId]">,
) {
  const { workspaceId, userId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId, "OWNER");
  if ("error" in access) return access.error;

  if (userId === access.session.user.id) return jsonError("You already own this workspace.", 400);

  const target = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!target) return jsonError("Member not found", 404);
  if (target.suspended) return jsonError("Cannot transfer ownership to a suspended member.", 400);

  const [newOwner] = await db.$transaction([
    db.membership.update({
      where: { id: target.id },
      data: { role: "OWNER" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    db.membership.update({
      where: { id: access.membership.id },
      data: { role: "ADMIN" },
    }),
    db.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: userId },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    owner: {
      id: newOwner.id,
      role: newOwner.role,
      createdAt: newOwner.createdAt,
      user: newOwner.user,
    },
  });
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/workspaces/[workspaceId]/members/[userId]">,
) {
  const { workspaceId, userId } = await ctx.params;
  const access = await requireWorkspaceMembership(workspaceId);
  if ("error" in access) return access.error;

  if (userId !== access.session.user.id && !canManageMembers(access.membership.role)) {
    return jsonError("Forbidden", 403);
  }

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      projectMemberships: { include: { project: { select: { id: true, name: true } } } },
    },
  });

  if (!membership) return jsonError("Member not found", 404);

  return NextResponse.json({
    id: membership.id,
    role: membership.role,
    createdAt: membership.createdAt,
    suspended: membership.suspended,
    lastActiveAt: membership.lastActiveAt,
    user: membership.user,
    projects: membership.projectMemberships.map((item) => item.project),
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/workspaces/[workspaceId]/members/[userId]">,
) {
  const { workspaceId, userId } = await ctx.params;

  const target = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!target) return jsonError("Member not found", 404);
  if (target.role === "OWNER") return jsonError("Cannot remove the workspace owner", 400);

  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  if (userId === authResult.session.user.id) {
    await db.membership.delete({ where: { userId_workspaceId: { userId, workspaceId } } });
    return NextResponse.json({ ok: true });
  }

  const access = await requireWorkspaceMembership(workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  if (access.membership.role === "ADMIN" && target.role === "ADMIN") {
    return jsonError("Admins cannot remove other admins", 403);
  }

  await db.membership.delete({ where: { userId_workspaceId: { userId, workspaceId } } });
  return NextResponse.json({ ok: true });
}
