"use client";

import { ContentContainer } from "@/components/common/ContentContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CalendarDays, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_AVATAR_IMAGE = "https://github.com/maxleiter.png";

export type WorkspaceMemberPreview = {
  id: string;
  name: string;
  image: string | null;
};

export type WorkspaceListItem = {
  id: string;
  name: string;
  createdAt: string;
  projectCount: number;
  memberCount: number;
  members: WorkspaceMemberPreview[];
};

function workspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

function WorkspaceCard({ workspace }: { workspace: WorkspaceListItem }) {
  return (
    <Link href={`/workspaces/${workspace.id}`} className="group block h-full">
      <Card
        className={cn(
          "flex h-full min-h-[11.75rem] flex-col gap-0 rounded-xl border border-border/80 bg-card p-5 shadow-none",
          "dark:border-sidebar-border/70 dark:bg-surface-elevated",
        )}
      >
        <div className="flex items-start">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage src={DEFAULT_AVATAR_IMAGE} alt={workspace.name} />
            <AvatarFallback className="rounded-lg text-sm font-semibold">
              {workspaceInitial(workspace.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-5 min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{workspace.name}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-foreground/80" />
            Created {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true }).replace(/^about /, "")}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="info" className="h-6 gap-1.5 rounded-full px-2.5 text-[11px]">
              <FolderKanban className="h-3.5 w-3.5" />
              {workspace.projectCount} {workspace.projectCount === 1 ? "project" : "projects"}
            </Badge>
            <Badge variant="info" className="h-6 gap-1.5 rounded-full px-2.5 text-[11px]">
              <Users className="h-3.5 w-3.5" />
              {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
            </Badge>
          </div>
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-foreground">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function WorkspacesView({ workspaces }: { workspaces: WorkspaceListItem[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <ContentContainer>
      <div className="space-y-8">
        <PageHeader
          title="Workspaces"
          description="Select a workspace to manage projects and feedback."
          action={
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-md px-3"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          }
        />

        {workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sidebar-border bg-card px-6 py-16 text-center dark:bg-surface-elevated">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderKanban className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">No workspaces yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Create your first workspace to organize projects, invite teammates, and collect visual
              feedback.
            </p>
            <Button type="button" className="mt-6" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}

        <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    </ContentContainer>
  );
}
