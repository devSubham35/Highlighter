"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { loginFormSchema, type LoginFormData } from "@/lib/validations";
import { Highlighter } from "lucide-react";

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

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border border-sidebar-border shadow-lg dark:bg-[#1a1d21]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Highlighter className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Log in</CardTitle>
          <CardDescription>Open your issue reporting workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="space-y-4">
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link className="font-medium text-primary hover:underline" href="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
