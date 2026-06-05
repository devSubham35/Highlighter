import {
  getOrganizationCounts,
  isOrganizationNameTaken,
  jsonError,
  requireOrgMembership,
} from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { updateOrganizationSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/organizations/[organizationId]">) {
  const { organizationId } = await ctx.params;
  const access = await requireOrgMembership(organizationId);
  if ("error" in access) return access.error;

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
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

  if (!organization) return jsonError("Not found", 404);

  const counts = await getOrganizationCounts(organizationId);
  const canManage = access.membership.role === "ADMIN" || access.membership.role === "OWNER";

  return NextResponse.json({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    ownerId: organization.ownerId,
    role: access.membership.role,
    ...counts,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    members: organization.memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: membership.user,
    })),
    ...(canManage ? { invitations: organization.invitations } : {}),
  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/organizations/[organizationId]">) {
  const { organizationId } = await ctx.params;
  const access = await requireOrgMembership(organizationId, "ADMIN");
  if ("error" in access) return access.error;

  const parsed = updateOrganizationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  if (await isOrganizationNameTaken(access.session.user.id, parsed.data.name, organizationId)) {
    return jsonError("A workspace with this name already exists.", 409);
  }

  const organization = await db.organization.update({
    where: { id: organizationId },
    data: { name: parsed.data.name },
  });

  const counts = await getOrganizationCounts(organizationId);

  return NextResponse.json({
    ...organization,
    ...counts,
    role: access.membership.role,
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/organizations/[organizationId]">) {
  const { organizationId } = await ctx.params;
  const access = await requireOrgMembership(organizationId, "OWNER");
  if ("error" in access) return access.error;

  await db.organization.delete({ where: { id: organizationId } });
  return NextResponse.json({ ok: true });
}
