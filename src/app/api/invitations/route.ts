import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteMemberSchema } from "@/lib/validations";
import { addDays } from "date-fns";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = inviteMemberSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: parsed.data.organizationId,
      },
    },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitation = await db.invitation.create({
    data: {
      ...parsed.data,
      invitedById: session.user.id,
      expiresAt: addDays(new Date(), 7),
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
