"use client";

import { FormProvider } from "@/components/common/hook-form/FormProvider";
import { RHFTextField } from "@/components/common/hook-form/RHFTextField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { createProjectFormSchema, type CreateProjectFormData } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ProjectGeneralSettings({
  project,
  workspaceId,
}: {
  project: {
    id: string;
    name: string;
    websiteUrl: string | null;
  };
  workspaceId: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const methods = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: project.name,
      websiteUrl: project.websiteUrl ?? "",
    },
  });

  async function onSubmit(data: CreateProjectFormData) {
    setSaveError("");
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const message = "Could not update project. Please try again.";
      setSaveError(message);
      toast.error("Project update failed", message);
      return;
    }

    toast.success("Project updated", "Your project settings were saved.");
    router.refresh();
  }

  async function deleteProject() {
    if (confirmName !== project.name) return;

    setDeleting(true);
    setDeleteError("");
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      const message = "Could not delete project.";
      setDeleteError(message);
      toast.error("Project deletion failed", message);
      return;
    }

    toast.success("Project deleted", `"${project.name}" was removed.`);
    router.push(`/workspaces/${workspaceId}/projects`);
    router.refresh();
  }

  const canDelete = confirmName === project.name;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">General</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your project configuration.</p>
      </div>

      <Card className="border border-sidebar-border shadow-sm dark:bg-surface-elevated">
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <RHFTextField name="name" label="Project name" placeholder="Marketing site" required />
            <RHFTextField
              name="websiteUrl"
              label="Website URL"
              type="text"
              placeholder="https://example.com"
              required
            />
            {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            <div>
              <Button
                type="submit"
                size="sm"
                disabled={methods.formState.isSubmitting}
              >
                {methods.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </FormProvider>

          <div className="border-t border-sidebar-border pt-6">
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete this project and all of its reports.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={() => {
                setConfirmName("");
                setDeleteError("");
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader className="border-b-0 pb-4">
            <DialogTitle>Delete Project?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{project.name}</span> and
              all of its reports. Type the project name to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6">
            <Label htmlFor="confirm-project-name">Project name</Label>
            <Input
              id="confirm-project-name"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={project.name}
              disabled={deleting}
            />
            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteProject}
              disabled={deleting || !canDelete}
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
