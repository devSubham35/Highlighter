"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/common/GoogleIcon";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, type LoginFormData } from "@/lib/validations";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const invitedEmail = searchParams.get("email") ?? "";
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: invitedEmail,
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");

    const result = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setError(result.error.message ?? "Unable to sign in.");
      return;
    }

    router.push(inviteToken ? `/invite/${encodeURIComponent(inviteToken)}` : "/workspaces");
  };

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-tight text-foreground">Welcome back 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to Highlight.</p>

      <form className="mt-7" onSubmit={methods.handleSubmit(onSubmit)}>
        <fieldset disabled={methods.formState.isSubmitting} className="m-0 min-w-0 space-y-5 border-0 p-0">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                className="h-11 rounded-md pl-10"
                {...methods.register("email")}
              />
            </div>
            {methods.formState.errors.email ? (
              <p className="text-xs text-destructive">{methods.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-11 rounded-md px-10"
                {...methods.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPassword((value) => !value)}
                disabled={methods.formState.isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link className="text-xs font-medium text-primary hover:underline" href="#">
                Forgot password?
              </Link>
            </div>
            {methods.formState.errors.password ? (
              <p className="text-xs text-destructive">{methods.formState.errors.password.message}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-11 w-full">
            <span>{methods.formState.isSubmitting ? "Signing in..." : "Sign in"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="h-11 w-full font-medium">
            <GoogleIcon />
            Continue with Google
          </Button>
        </fieldset>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          className="font-medium text-primary hover:underline"
          href={inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(invitedEmail)}` : "/register"}
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
