import { jsonError, requireSession } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const parsed = changePasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: parsed.data.revokeOtherSessions,
      },
      headers: await headers(),
    });
  } catch {
    return jsonError("Current password is incorrect", 400);
  }

  return NextResponse.json({ ok: true });
}
