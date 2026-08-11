import { jsonError } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

const RESEND_COOLDOWN_MS = 3 * 60 * 1000;

function otpIdentifier(email: string) {
  return `forget-password-otp-${email}`;
}

export async function POST(req: NextRequest) {
  const parsed = passwordResetRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return jsonError("No account found with this email address.", 404);
  }

  const existing = await db.verification.findFirst({
    where: { identifier: otpIdentifier(email) },
    select: { createdAt: true },
  });
  if (existing) {
    const retryAt = existing.createdAt.getTime() + RESEND_COOLDOWN_MS;
    const retryAfter = Math.ceil((retryAt - Date.now()) / 1000);
    if (retryAfter > 0) {
      return NextResponse.json(
        {
          error: `Please wait ${Math.ceil(retryAfter / 60)} minute${retryAfter > 60 ? "s" : ""} before requesting another code.`,
          retryAfter,
          retryAt,
        },
        { status: 429 },
      );
    }
  }

  await auth.api.requestPasswordResetEmailOTP({
    body: { email },
    headers: await headers(),
  });

  return NextResponse.json({ success: true, retryAfter: RESEND_COOLDOWN_MS / 1000, retryAt: Date.now() + RESEND_COOLDOWN_MS });
}
