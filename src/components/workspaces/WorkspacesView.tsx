"use client";

import { ContentContainer } from "@/components/common/ContentContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { avatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

const MAX_VISIBLE_MEMBERS = 4;

function MemberAvatar({
  member,
  className,
}: {
  member: WorkspaceMemberPreview;
  className?: string;
}) {
  const colors = avatarColor(member.id);
  const initial = member.name.slice(0, 1).toUpperCase();

  return (
    <Avatar className={className}>
      {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
      <AvatarFallback className={cn("text-xs font-semibold", colors.bg, colors.text)}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}

function MemberAvatarStack({
  members,
  totalCount,
}: {
  members: WorkspaceMemberPreview[];
  totalCount: number;
}) {
  if (totalCount === 0) return null;

  const visible = members.slice(0, MAX_VISIBLE_MEMBERS);
  const overflow = Math.max(0, totalCount - visible.length);

  return (
    <div className="flex items-center">
      {visible.map((member, index) => (
        <MemberAvatar
          key={member.id}
          member={member}
          className={cn(
            "size-10 border border-border",
            index > 0 && "-ml-3.5",
          )}
        />
      ))}
      {overflow > 0 ? (
        <div
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border",
            "bg-muted text-xs font-semibold text-muted-foreground",
            visible.length > 0 && "-ml-3.5",
          )}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: WorkspaceListItem }) {
  return (
    <Link href={`/workspaces/${workspace.id}`} className="group block h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-4 border border-sidebar-border/50 p-5 shadow-none transition-all",
          "hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm",
          "dark:bg-surface-elevated dark:hover:border-primary/20 dark:hover:bg-white/5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <MemberAvatarStack members={workspace.members} totalCount={workspace.memberCount} />
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{workspace.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true }).replace(/^about /, "")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border/60 pt-4">
          <Badge variant="info" className="h-6 gap-1.5 px-2.5 text-[11px]">
            <FolderKanban className="h-3.5 w-3.5" />
            {workspace.projectCount} {workspace.projectCount === 1 ? "project" : "projects"}
          </Badge>
          <Badge variant="purple" className="h-6 gap-1.5 px-2.5 text-[11px]">
            <Users className="h-3.5 w-3.5" />
            {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
          </Badge>
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
            <Button type="button" onClick={() => setCreateOpen(true)}>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
