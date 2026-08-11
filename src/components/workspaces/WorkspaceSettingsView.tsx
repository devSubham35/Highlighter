"use client";

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
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceSettingsView({
  workspace,
  canDelete,
}: {
  workspace: { id: string; name: string };
  canDelete: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmed = confirmation === workspace.name;

  async function deleteWorkspace() {
    if (!confirmed || deleting) return;

    setDeleting(true);
    const response = await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      toast.error("Workspace deletion failed", "Refresh the page and try again.");
      return;
    }

    setConfirmOpen(false);
    toast.success("Workspace deleted", `${workspace.name} has been permanently deleted.`);
    router.push("/workspaces");
    router.refresh();
  }

  if (!canDelete) {
    return (
      <section className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">No permission to delete workspace</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-100/80">
              Only the workspace owner can delete this workspace.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[18px] border border-destructive/30 bg-card shadow-sm dark:bg-surface-elevated">
        <div className="border-b border-destructive/20 bg-destructive/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Delete workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This permanently deletes the workspace, its projects, reports, invitations, and member access.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-border bg-muted/25 p-4">
            <p className="text-sm font-medium text-foreground">
              To confirm, type <span className="font-semibold">{workspace.name}</span> below.
            </p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={workspace.name}
              className="mt-3 bg-white dark:bg-background"
              aria-label="Workspace deletion confirmation"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              This action cannot be undone. Deleted workspace data cannot be recovered from the dashboard.
            </p>
            <Button
              type="button"
              variant="destructive"
              disabled={!confirmed || deleting}
              onClick={() => setConfirmOpen(true)}
              className="text-white hover:text-white sm:shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              Delete workspace
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {workspace.name}?</DialogTitle>
            <DialogDescription>
              This is the final confirmation. The workspace and all related data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted-foreground">
              You are about to delete <span className="font-semibold text-foreground">{workspace.name}</span>. This
              action cannot be undone.
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={deleteWorkspace}
              className="text-white hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
