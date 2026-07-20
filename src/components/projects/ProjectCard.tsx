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
import { Archive, ImageIcon, MoreHorizontal, Settings } from "lucide-react";
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
  workspaceId?: string;
  variant?: "grid" | "list";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

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
      return false;
    }
    router.refresh();
    return true;
  }

  const timeBadge = (
    <Badge className="h-6 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground">
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
            className="shrink-0 text-muted-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            setArchiveConfirmOpen(true);
          }}
          disabled={loading}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          {project.archived ? "Restore project" : "Archive project"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/projects/${project.id}/settings`);
          }}
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
        <ImageIcon className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">{project.imageCount}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold text-primary">Open</span>
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
        onClick={navigateToProject}
        className={cn(
          "cursor-pointer border border-border/60 bg-muted/40 shadow-[var(--shadow-surface)] surface-interactive hover:bg-muted/40 dark:bg-muted/40 dark:hover:bg-muted/40",
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

      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent showCloseButton onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{project.archived ? "Restore project?" : "Archive project?"}</DialogTitle>
            <DialogDescription>
              {project.archived
                ? `This will move "${project.name}" back to active projects.`
                : `This will move "${project.name}" to archived projects. You can restore it later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const updated = await archiveProject();
                if (updated) setArchiveConfirmOpen(false);
              }}
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : project.archived
                  ? "Restore project"
                  : "Archive project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
