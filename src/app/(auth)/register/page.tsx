"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterFormData } from "@/lib/validations";
import { ArrowRight, EyeOff, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError("");

    const result = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setError(result.error.message ?? "Unable to create account.");
      return;
    }

    router.push("/workspaces");
  };

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-tight text-foreground">Create account ✨</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join Highlighter and start tracking issues.</p>

      <form className="mt-7 space-y-4" onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className="h-11 rounded-md pl-10"
              {...methods.register("name")}
            />
          </div>
          {methods.formState.errors.name ? (
            <p className="text-xs text-destructive">{methods.formState.errors.name.message}</p>
          ) : null}
        </div>

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
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              className="h-11 rounded-md px-10"
              {...methods.register("password")}
            />
            <EyeOff className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {methods.formState.errors.password ? (
            <p className="text-xs text-destructive">{methods.formState.errors.password.message}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={methods.formState.isSubmitting}>
          <span>{methods.formState.isSubmitting ? "Creating account..." : "Create account"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full font-medium">
          <span className="text-base leading-none">G</span>
          Continue with Google
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
