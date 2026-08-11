"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Step = "email" | "otp" | "password" | "success";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cooldownKey(email: string) {
  return `highlight:password-reset-resend:${email}`;
}

function readCooldownUntil(email: string) {
  if (typeof window === "undefined" || !email) return 0;
  const value = window.localStorage.getItem(cooldownKey(email));
  const timestamp = value ? Number(value) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function writeCooldownUntil(email: string, retryAt: number) {
  if (typeof window === "undefined" || !email) return;
  window.localStorage.setItem(cooldownKey(email), String(retryAt));
}

function clearCooldown(email: string) {
  if (typeof window === "undefined" || !email) return;
  window.localStorage.removeItem(cooldownKey(email));
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function responseErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as { error?: unknown; message?: unknown };
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

async function postAuth(path: string, body: unknown) {
  const response = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function postPasswordResetRequest(body: unknown) {
  const response = await fetch("/api/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [cooldownUntil, setCooldownUntil] = useState(() => readCooldownUntil(normalizeEmail(initialEmail)));

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const cooldownLabel = `${Math.floor(cooldownRemaining / 60)}:${String(cooldownRemaining % 60).padStart(2, "0")}`;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  function close(nextOpen: boolean) {
    if (submitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStep("email");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setError("");
    }
  }

  async function requestOTP() {
    if (!normalizedEmail || submitting) return;
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (cooldownRemaining > 0) {
      setError(`Please wait ${cooldownLabel} before requesting another code.`);
      return;
    }

    setSubmitting(true);
    setError("");
    const { response, payload } = await postPasswordResetRequest({ email: normalizedEmail });
    setSubmitting(false);

    if (!response.ok) {
      const message = responseErrorMessage(payload, "Could not send reset code.");
      const retryAt = typeof payload?.retryAt === "number" ? payload.retryAt : 0;
      if (retryAt > Date.now()) {
        writeCooldownUntil(normalizedEmail, retryAt);
        setCooldownUntil(retryAt);
      }
      setError(message);
      toast.error("Could not send reset code", message);
      return;
    }

    const retryAt = typeof payload?.retryAt === "number" ? payload.retryAt : Date.now() + 3 * 60 * 1000;
    writeCooldownUntil(normalizedEmail, retryAt);
    setCooldownUntil(retryAt);
    setEmail(normalizedEmail);
    setStep("otp");
    toast.success("Reset code sent", "Check your email for the 6-digit code.");
  }

  async function verifyOTP() {
    if (submitting || !normalizedEmail || otp.length < 6) return;
    setSubmitting(true);
    setError("");
    const { response, payload } = await postAuth("/email-otp/check-verification-otp", {
      email: normalizedEmail,
      type: "forget-password",
      otp,
    });
    setSubmitting(false);

    if (!response.ok) {
      const message = responseErrorMessage(payload, "Invalid or expired verification code.");
      setError(message);
      toast.error("Code verification failed", message);
      return;
    }

    setStep("password");
  }

  async function resetPassword() {
    if (submitting || !normalizedEmail || otp.length < 6 || password.length < 8 || password !== confirmPassword) return;
    setSubmitting(true);
    setError("");
    const { response, payload } = await postAuth("/email-otp/reset-password", {
      email: normalizedEmail,
      otp,
      password,
    });
    setSubmitting(false);

    if (!response.ok) {
      const message = responseErrorMessage(payload, "Check the code and try again.");
      setError(message);
      toast.error("Password reset failed", message);
      return;
    }

    setStep("success");
    clearCooldown(normalizedEmail);
    toast.success("Password updated");
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "success" ? "Password updated" : "Reset password"}</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your account email and we will send a verification code."
              : step === "otp"
                ? "Enter the 6-digit code we sent to your email."
                : step === "password"
                  ? "Code verified. Choose a new password."
                  : "You can now sign in with your new password."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {step === "email" ? (
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-foreground">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    const nextEmail = event.target.value;
                    setEmail(nextEmail);
                    setCooldownUntil(readCooldownUntil(normalizeEmail(nextEmail)));
                    if (error) setError("");
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={submitting}
                  className="h-11 pl-10"
                />
              </div>
            </label>
          ) : null}

          {step === "email" && cooldownRemaining > 0 ? (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
              You can request another code in {cooldownLabel}.
            </p>
          ) : null}

          {step === "otp" ? (
            <>
              <label className="block space-y-2">
                <span className="block text-sm font-medium text-foreground">Verification code</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                      if (error) setError("");
                    }}
                    placeholder="6-digit code"
                    autoComplete="one-time-code"
                    disabled={submitting}
                    className="h-11 pl-10 tracking-[0.35em]"
                  />
                </div>
              </label>

              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary/85"
                disabled={submitting || cooldownRemaining > 0}
                onClick={requestOTP}
              >
                {cooldownRemaining > 0 ? `Resend code in ${cooldownLabel}` : "Resend code"}
              </Button>
            </>
          ) : null}

          {step === "password" ? (
            <>
              <label className="block space-y-2">
                <span className="block text-sm font-medium text-foreground">New password</span>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    disabled={submitting}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={submitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="block text-sm font-medium text-foreground">Confirm password</span>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={submitting}
                  className="h-11"
                />
                {passwordMismatch ? <span className="text-xs text-destructive">Passwords do not match.</span> : null}
              </label>
            </>
          ) : null}

          {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

          {step === "success" ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Your password has been reset successfully.
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          {step === "success" ? (
            <Button type="button" className="h-11" onClick={() => close(false)}>
              Back to sign in
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" className="h-11" onClick={() => close(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11"
                disabled={
                  submitting ||
                  (step === "email" && (!normalizedEmail || cooldownRemaining > 0)) ||
                  (step === "otp" && otp.length < 6) ||
                  (step === "password" && (password.length < 8 || password !== confirmPassword))
                }
                onClick={step === "email" ? requestOTP : step === "otp" ? verifyOTP : resetPassword}
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {step === "email" ? "Send code" : step === "otp" ? "Verify code" : "Reset password"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
