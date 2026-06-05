import { jsonError, requireSession } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateUserProfileSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const user = await db.user.findUnique({
    where: { id: authResult.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return jsonError("User not found", 404);

  const workspaceCount = await db.membership.count({
    where: { userId: user.id },
  });

  return NextResponse.json({ ...user, workspaceCount });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const parsed = updateUserProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  await auth.api.updateUser({
    body: { name: parsed.data.name },
    headers: await headers(),
  });

  const user = await db.user.findUnique({
    where: { id: authResult.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user);
}
