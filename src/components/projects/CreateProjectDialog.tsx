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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createProjectFormSchema,
  type CreateProjectFormData,
} from "@/lib/validations";
import { toast } from "@/lib/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function CreateProjectDialog({
  workspaceId,
  open: controlledOpen,
  onOpenChange,
}: {
  workspaceId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const open = controlledOpen ?? uncontrolledOpen;

  const methods = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      websiteUrl: "",
      name: "",
    },
    mode: "onSubmit",
  });

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      methods.reset();
      setServerError("");
    }
  }

  async function onSubmit(data: CreateProjectFormData) {
    setServerError("");

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        workspaceId,
      }),
    });

    if (!response.ok) {
      const message = "Could not create project. Check the website URL and try again.";
      setServerError(message);
      toast.error("Project creation failed", message);
      return;
    }

    const created = (await response.json()) as { name?: string };
    methods.reset();
    handleOpenChange(false);
    toast.success(
      "Project created",
      created.name ? `"${created.name}" is ready to collect feedback.` : undefined,
    );
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" size="sm">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />
      <DialogContent showCloseButton>
        <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Connect a website to start collecting visual feedback.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <RHFTextField
              name="websiteUrl"
              label="Website URL"
              type="text"
              placeholder="https://example.com"
              labelClassName="text-xs"
              required
            />
            <RHFTextField
              name="name"
              label="Display name"
              placeholder="Marketing site"
              labelClassName="text-xs"
              required
            />
            {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={methods.formState.isSubmitting}>
              <Plus className="h-4 w-4" />
              {methods.formState.isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
