"use client";

import { ProjectThumbnail } from "@/components/projects/ProjectThumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Archive, ImageIcon, MoreHorizontal, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProjectCardData = {
  id: string;
  name: string;
  websiteUrl: string | null;
  archived: boolean;
  openCount: number;
  imageCount: number;
  lastIssueAt: string | null;
};

function formatLastIssueBadge(lastIssueAt: string | null) {
  if (!lastIssueAt) return "No issues yet";
  return formatDistanceToNow(new Date(lastIssueAt), { addSuffix: true }).replace(/^about /, "");
}

export function ProjectCard({
  project,
  variant = "grid",
}: {
  project: ProjectCardData;
  variant?: "grid" | "list";
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lastIssueBadge = formatLastIssueBadge(project.lastIssueAt);

  async function archiveProject() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !project.archived }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("Could not update project.");
      return;
    }
    router.refresh();
  }

  async function deleteProject() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      setError("Could not delete project.");
      return;
    }
    setDeleteOpen(false);
    router.refresh();
  }

  const timeBadge = (
    <Badge variant="success" className="h-6 rounded-md px-2 text-[11px] font-medium">
      {lastIssueBadge}
    </Badge>
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setDeleteOpen(true)}
          className="gap-2 text-destructive data-highlighted:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={archiveProject} disabled={loading} className="gap-2">
          <Archive className="h-4 w-4" />
          {project.archived ? "Restore project" : "Archive project"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(`/projects/${project.id}/settings`)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const stats = (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ImageIcon className="h-4 w-4" />
        <span className="font-medium text-foreground">{project.imageCount}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span>Open</span>
        <span className="font-medium text-foreground">{project.openCount}</span>
      </span>
    </div>
  );

  const titleBlock = (
    <div className="min-w-0">
      <p className="truncate font-semibold text-foreground">{project.name}</p>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">
        {project.websiteUrl ?? "No website URL"}
      </p>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2">
      {stats}
      {menu}
    </div>
  );

  function navigateToProject() {
    router.push(`/projects/${project.id}`);
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={navigateToProject}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigateToProject();
          }
        }}
        className={cn(
          "cursor-pointer border border-sidebar-border/50 shadow-none transition-colors hover:bg-muted/30 dark:bg-[#1a1d21] dark:hover:bg-white/5",
          variant === "list" && "p-4",
          variant === "grid" && "gap-0 overflow-hidden p-0",
        )}
      >
        {variant === "grid" ? (
          <div className="flex flex-col">
            <div className="relative">
              <ProjectThumbnail
                websiteUrl={project.websiteUrl}
                className="h-36 w-full rounded-none border-0"
              />
              <div className="absolute top-2 right-2">{timeBadge}</div>
            </div>
            <div className="space-y-3 p-4">
              {titleBlock}
              {footer}
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <ProjectThumbnail websiteUrl={project.websiteUrl} className="h-12 w-12 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">{titleBlock}</div>
              <div className="flex shrink-0 items-center gap-3">
                {timeBadge}
                {stats}
                {menu}
              </div>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        )}
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton>
          <DialogHeader className="border-b-0 pb-4">
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{project.name}</span> and
              all of its reports. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="px-6 pt-2 text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deleteProject} disabled={loading}>
              {loading ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
