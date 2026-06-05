"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { registerFormSchema, type RegisterFormData } from "@/lib/validations";
import { Highlighter } from "lucide-react";

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

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border border-sidebar-border shadow-lg dark:bg-[#1a1d21]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Highlighter className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Create account</CardTitle>
          <CardDescription>Start collecting visual bug reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <RHFTextField name="name" label="Name" placeholder="Enter your name" required />
              <RHFTextField name="email" label="Email" type="email" placeholder="Enter your email" required />
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
              {methods.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </FormProvider>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
