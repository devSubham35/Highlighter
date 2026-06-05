"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { registerFormSchema, type RegisterFormData } from "@/lib/validations";

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
      <h1 className="text-2xl font-semibold text-foreground">Sign up</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create an account to get started.</p>

      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="mt-6 space-y-4">
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

      <p className="mt-6 text-sm text-muted-foreground">
        Have an account?{" "}
        <Link className="text-primary hover:underline" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
