import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";
import { db } from "@/lib/db";
import { sendPasswordResetOTPEmail } from "@/lib/email";

const PASSWORD_RESET_OTP_EXPIRES_IN = 5 * 60;

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  plugins: [
    emailOTP({
      expiresIn: PASSWORD_RESET_OTP_EXPIRES_IN,
      otpLength: 6,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "forget-password") return;
        await sendPasswordResetOTPEmail({
          to: email,
          otp,
          expiresInMinutes: PASSWORD_RESET_OTP_EXPIRES_IN / 60,
        });
      },
    }),
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
