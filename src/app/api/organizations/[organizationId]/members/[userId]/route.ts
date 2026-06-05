import { jsonError, requireOrgMembership, requireSession } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { updateMemberRoleSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/organizations/[organizationId]/members/[userId]">,
) {
  const { organizationId, userId } = await ctx.params;
  const access = await requireOrgMembership(organizationId, "OWNER");
  if ("error" in access) return access.error;

  const parsed = updateMemberRoleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const target = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  if (!target) return jsonError("Member not found", 404);
  if (target.role === "OWNER") return jsonError("Cannot change the workspace owner role", 400);

  const membership = await db.membership.update({
    where: { userId_organizationId: { userId, organizationId } },
    data: { role: parsed.data.role },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    id: membership.id,
    role: membership.role,
    createdAt: membership.createdAt,
    user: membership.user,
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/organizations/[organizationId]/members/[userId]">,
) {
  const { organizationId, userId } = await ctx.params;

  const target = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  if (!target) return jsonError("Member not found", 404);
  if (target.role === "OWNER") return jsonError("Cannot remove the workspace owner", 400);

  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  if (userId === authResult.session.user.id) {
    await db.membership.delete({ where: { userId_organizationId: { userId, organizationId } } });
    return NextResponse.json({ ok: true });
  }

  const access = await requireOrgMembership(organizationId, "ADMIN");
  if ("error" in access) return access.error;

  if (access.membership.role === "ADMIN" && target.role === "ADMIN") {
    return jsonError("Admins cannot remove other admins", 403);
  }

  await db.membership.delete({ where: { userId_organizationId: { userId, organizationId } } });
  return NextResponse.json({ ok: true });
}
