"use client";

import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
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
import {
  createOrganizationFormSchema,
  type CreateOrganizationFormData,
} from "@/lib/validations";
import { toast } from "@/lib/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const methods = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { name: "", inviteEmail: "" },
    mode: "onSubmit",
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      methods.reset();
    }
  }

  async function onSubmit(data: CreateOrganizationFormData) {
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        inviteEmail: data.inviteEmail?.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      const message = body?.error ?? "Could not create workspace. Please try again.";
      methods.setError("name", { message });
      toast.error("Workspace creation failed", message);
      return;
    }

    const created = (await response.json()) as { name?: string };
    methods.reset();
    onOpenChange(false);
    toast.success(
      "Workspace created",
      created.name ? `"${created.name}" is ready to use.` : undefined,
    );
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton>
        <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace for your team. Workspace names must be unique.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <RHFTextField name="name" label="Name" placeholder="Acme Corp" required />
            <RHFTextField
              name="inviteEmail"
              label="Invite users email"
              type="email"
              placeholder="colleague@example.com"
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={methods.formState.isSubmitting}>
              <Plus className="h-4 w-4" />
              {methods.formState.isSubmitting ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
