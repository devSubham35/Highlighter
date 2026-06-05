"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { loginFormSchema, type LoginFormData } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
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

    router.push("/workspaces");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Log in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and password.</p>

      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="mt-6 space-y-4">
          <RHFTextField
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <RHFTextField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="mt-5 w-full" disabled={methods.formState.isSubmitting}>
          {methods.formState.isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </FormProvider>

      <p className="mt-6 text-sm text-muted-foreground">
        No account?{" "}
        <Link className="text-primary hover:underline" href="/register">
          Sign up
        </Link>
      </p>
    </div>
  );
}
