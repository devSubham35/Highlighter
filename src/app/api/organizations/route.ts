import {
  getOrganizationCounts,
  getSession,
  isOrganizationNameTaken,
  jsonError,
  requireSession,
  slugify,
} from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { createOrganizationSchema } from "@/lib/validations";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const organizations = await db.organization.findMany({
    where: { memberships: { some: { userId: authResult.session.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { userId: authResult.session.user.id },
        select: { role: true },
      },
      _count: {
        select: {
          projects: { where: { archived: false } },
          memberships: true,
        },
      },
    },
  });

  return NextResponse.json(
    organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      ownerId: organization.ownerId,
      role: organization.memberships[0]?.role ?? "MEMBER",
      projectCount: organization._count.projects,
      memberCount: organization._count.memberships,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  if (await isOrganizationNameTaken(authResult.session.user.id, parsed.data.name)) {
    return jsonError("A workspace with this name already exists.", 409);
  }

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const organization = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      ownerId: authResult.session.user.id,
      memberships: { create: { userId: authResult.session.user.id, role: "OWNER" } },
    },
  });

  const inviteEmail = typeof body.inviteEmail === "string" ? body.inviteEmail.trim() : "";
  if (inviteEmail) {
    await db.invitation.create({
      data: {
        organizationId: organization.id,
        email: inviteEmail,
        role: "MEMBER",
        invitedById: authResult.session.user.id,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  const counts = await getOrganizationCounts(organization.id);

  return NextResponse.json({ ...organization, ...counts, role: "OWNER" }, { status: 201 });
}
