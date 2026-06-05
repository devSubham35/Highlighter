import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrganizationSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createOrganizationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const organization = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      ownerId: session.user.id,
      memberships: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  return NextResponse.json(organization, { status: 201 });
}
