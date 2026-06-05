"use client";

import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createOrganizationFormSchema,
  type CreateOrganizationFormData,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const methods = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { name: "" },
    mode: "onSubmit",
  });

  async function onSubmit(data: CreateOrganizationFormData) {
    setServerError("");

    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setServerError("Could not create organization. Please try again.");
      return;
    }

    methods.reset();
    router.refresh();
  }

  return (
    <Card className="max-w-md border border-sidebar-border shadow-sm dark:bg-[#1a1d21]">
      <CardHeader>
        <CardTitle>Create an organization</CardTitle>
        <CardDescription>Projects live inside an organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider
          methods={methods}
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <RHFTextField
              name="name"
              label="Organization name"
              placeholder="Acme Corp"
              required
            />
          </div>
          <Button type="submit" className="sm:mt-6" disabled={methods.formState.isSubmitting}>
            {methods.formState.isSubmitting ? "Creating..." : "Create"}
          </Button>
        </FormProvider>
        {serverError ? <p className="mt-3 text-sm text-destructive">{serverError}</p> : null}
      </CardContent>
    </Card>
  );
}
