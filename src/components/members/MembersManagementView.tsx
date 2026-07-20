"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { RoleBadge, roleLabel } from "@/components/common/RoleBadge";
import { MultiSelectCombobox } from "@/components/issues/MultiSelectCombobox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { MemberRole } from "@prisma/client";
import {
  Copy,
  MailPlus,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserMinus,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type Project = { id: string; name: string; websiteUrl?: string | null };
type UserSummary = { id: string; name: string; email: string; image?: string | null };
type MemberStatus = "ACTIVE" | "SUSPENDED";
type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED" | "REVOKED";

type MemberRow = {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  lastActiveAt: string | null;
  user: UserSummary;
  projects: Project[];
};

type InvitationRow = {
  id: string;
  email: string;
  token: string;
  role: MemberRole;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  revokedAt: string | null;
  resentAt: string | null;
  invitedBy: UserSummary;
  projects: Project[];
};

const roles: MemberRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
const statuses = ["ALL", "ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "CANCELLED", "REVOKED"] as const;
const allProjectsValue = "__all_projects__";
const roleOptions = [
  { value: "ALL", label: "All roles" },
  ...roles.map((role) => ({ value: role, label: roleLabel(role) })),
];
const statusOptions = statuses.map((status) => ({
  value: status,
  label: status === "ALL" ? "All statuses" : status.charAt(0) + status.slice(1).toLowerCase(),
}));
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "joined", label: "Recently joined" },
];

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadge(status: MemberStatus | InvitationStatus) {
  const variant =
    status === "ACTIVE" || status === "ACCEPTED"
      ? "success"
      : status === "PENDING"
        ? "warning"
        : status === "SUSPENDED" || status === "CANCELLED" || status === "REVOKED"
          ? "destructive"
          : "secondary";

  return (
    <Badge variant={variant} className="h-6 rounded-md px-2.5 text-[11px]">
      {status.replace("_", " ")}
    </Badge>
  );
}

function ProjectChips({ projects, allCount }: { projects: Project[]; allCount: number }) {
  if (projects.length === 0) {
    return <span className="text-sm text-muted-foreground">All projects</span>;
  }
  return (
    <div className="flex max-w-80 flex-wrap gap-1.5">
      {projects.slice(0, 3).map((project) => (
        <Badge key={project.id} variant="secondary" className="max-w-32 truncate rounded-md">
          {project.name}
        </Badge>
      ))}
      {projects.length > 3 ? <Badge variant="outline">+{projects.length - 3}</Badge> : null}
      {projects.length === allCount ? <Badge variant="outline">Full access</Badge> : null}
    </div>
  );
}

function ProjectPicker({
  projects,
  selected,
  onChange,
}: {
  projects: Project[];
  selected: string[];
  onChange: (projectIds: string[]) => void;
}) {
  const options = [
    { value: allProjectsValue, label: "All current projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];
  const values = selected.length === 0 ? [allProjectsValue] : selected;

  return (
    <MultiSelectCombobox
      values={values}
      onValuesChange={(nextValues) => {
        const choseAll = nextValues.includes(allProjectsValue);
        const previousWasAll = values.includes(allProjectsValue);
        const projectIds = nextValues.filter((value) => value !== allProjectsValue);

        if (choseAll && (!previousWasAll || projectIds.length === 0)) {
          onChange([]);
          return;
        }

        onChange(projectIds.length === projects.length ? [] : projectIds);
      }}
      options={options}
      placeholder="Select projects"
      searchPlaceholder="Search projects"
      emptyMessage="No projects found"
      ariaLabel="Project access"
      triggerClassName="h-10 bg-card shadow-[var(--control-shadow)]"
    />
  );
}

export function MembersManagementView({
  workspace,
  currentUser,
  projects,
  initialMembers,
  initialInvitations,
}: {
  workspace: { id: string; name: string };
  currentUser: { id: string; role: MemberRole; canManage: boolean; canInvite: boolean };
  projects: Project[];
  initialMembers: MemberRow[];
  initialInvitations: InvitationRow[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "joined">("name");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [inviteProjects, setInviteProjects] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const activeRows = members.map((member) => ({ kind: "member" as const, member }));
    const inviteRows = invitations.map((invitation) => ({ kind: "invitation" as const, invitation }));

    return [...activeRows, ...inviteRows]
      .filter((row) => {
        const name = row.kind === "member" ? row.member.user.name : row.invitation.email;
        const email = row.kind === "member" ? row.member.user.email : row.invitation.email;
        const role = row.kind === "member" ? row.member.role : row.invitation.role;
        const status = row.kind === "member" ? row.member.status : row.invitation.status;
        return (
          (!normalized || `${name} ${email}`.toLowerCase().includes(normalized)) &&
          (roleFilter === "ALL" || role === roleFilter) &&
          (statusFilter === "ALL" || status === statusFilter)
        );
      })
      .sort((a, b) => {
        const aDate = a.kind === "member" ? a.member.createdAt : a.invitation.createdAt;
        const bDate = b.kind === "member" ? b.member.createdAt : b.invitation.createdAt;
        if (sortBy === "joined") return new Date(bDate).getTime() - new Date(aDate).getTime();
        const aName = a.kind === "member" ? a.member.user.name : a.invitation.email;
        const bName = b.kind === "member" ? b.member.user.name : b.invitation.email;
        return aName.localeCompare(bName);
      });
  }, [invitations, members, query, roleFilter, sortBy, statusFilter]);

  const parsedEmails = useMemo(
    () => Array.from(new Set(inviteEmails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))),
    [inviteEmails],
  );

  async function sendInvite() {
    if (parsedEmails.length === 0) return;
    setSubmitting(true);
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        emails: parsedEmails,
        role: inviteRole,
        projectIds: inviteProjects,
        message: inviteMessage || undefined,
      }),
    });
    const payload = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      toast.error("Invitation failed", typeof payload.error === "string" ? payload.error : payload.error?.message ?? "Check the invitation details.");
      return;
    }
    setInvitations((current) => [
      ...payload.invitations.map((invitation: Omit<InvitationRow, "projects"> & { projects: Array<{ project: Project }> }) => ({
        ...invitation,
        projects: invitation.projects.map((item) => item.project),
      })),
      ...current,
    ]);
    if (payload.deliveryErrors?.length) {
      toast.error(
        "Some emails were not delivered",
        `${payload.delivered ?? 0} of ${payload.sent} invitation emails were sent.`,
      );
    } else {
      toast.success("Invitations sent", `${payload.sent} invitation ${payload.sent === 1 ? "email was" : "emails were"} delivered.`);
    }
    setInviteOpen(false);
    setPreview(false);
    setInviteEmails("");
    setInviteProjects([]);
    setInviteMessage("");
  }

  async function updateMember(member: MemberRow, data: { role?: MemberRole; suspended?: boolean; projectIds?: string[] }) {
    const response = await fetch(`/api/workspaces/${workspace.id}/members/${member.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error("Member update failed", typeof payload.error === "string" ? payload.error : "Try again.");
      return;
    }
    setMembers((current) => current.map((item) => (item.id === member.id ? { ...payload, status: payload.suspended ? "SUSPENDED" : "ACTIVE" } : item)));
    toast.success("Member updated");
  }

  async function removeMember(member: MemberRow) {
    if (!window.confirm(`Remove ${member.user.email} from ${workspace.name}?`)) return;
    const response = await fetch(`/api/workspaces/${workspace.id}/members/${member.user.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Could not remove member");
      return;
    }
    setMembers((current) => current.filter((item) => item.id !== member.id));
    toast.success("Member removed");
  }

  async function invitationAction(invitation: InvitationRow, action: "resend" | "cancel" | "revoke") {
    const response = await fetch(`/api/invitations/${invitation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error("Invitation update failed", typeof payload.error === "string" ? payload.error : "Try again.");
      return;
    }
    setInvitations((current) => current.map((item) => (item.id === invitation.id ? { ...item, ...payload, projects: payload.projects?.map((entry: { project: Project }) => entry.project) ?? item.projects } : item)));
    toast.success(action === "resend" ? "Invitation refreshed" : "Invitation updated");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Members</h1>
            <Badge className="h-6 px-2.5 text-[11px] font-medium">
              {members.length} active
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace roles, project access, and invitations.
          </p>
        </div>
        {currentUser.canInvite ? (
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus className="h-4 w-4" />
            Invite members
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-white p-3 dark:bg-surface-elevated lg:flex-row lg:items-center lg:justify-between">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search members"
            className="h-9 min-w-[240px] bg-white pr-9 dark:bg-background lg:w-96"
          />
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Combobox
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as MemberRole | "ALL")}
            options={roleOptions}
            searchable={false}
            aria-label="Filter by role"
            className="h-9 w-full sm:w-36"
          />
          <Combobox
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as (typeof statuses)[number])}
            options={statusOptions}
            searchable={false}
            aria-label="Filter by status"
            className="h-9 w-full sm:w-40"
          />
          <Combobox
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "name" | "joined")}
            options={sortOptions}
            searchable={false}
            aria-label="Sort members"
            className="h-9 w-full sm:w-40"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card dark:bg-surface-elevated">
        <div className="grid grid-cols-[minmax(260px,1.35fr)_120px_140px_minmax(220px,1fr)_48px] gap-3 border-b border-sidebar-border bg-muted/20 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground max-lg:hidden">
          <span>Person</span><span>Role</span><span>Status</span><span>Projects</span><span />
        </div>
        {visibleRows.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">No matches found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
          </div>
        ) : (
          visibleRows.map((row) =>
            row.kind === "member" ? (
              <div key={row.member.id} className="grid grid-cols-1 gap-3 border-b border-sidebar-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(260px,1.35fr)_120px_140px_minmax(220px,1fr)_48px] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    {row.member.user.image ? <AvatarImage src={row.member.user.image} alt="" /> : null}
                    <AvatarFallback>{initials(row.member.user.name || row.member.user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{row.member.user.name}</p><p className="truncate text-xs text-muted-foreground">{row.member.user.email}</p></div>
                </div>
                <div><RoleBadge role={row.member.role} /></div>
                <div>{statusBadge(row.member.status)}</div>
                <ProjectChips projects={row.member.projects} allCount={projects.length} />
                {currentUser.canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>} />
                    <DropdownMenuContent align="end">
                      {roles.filter((role) => role !== "OWNER").map((role) => (
                        <DropdownMenuItem key={role} onClick={() => updateMember(row.member, { role })}>
                          <ShieldCheck className="h-4 w-4" /> Make {roleLabel(role)}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateMember(row.member, { suspended: row.member.status !== "SUSPENDED" })}>
                        <XCircle className="h-4 w-4" /> {row.member.status === "SUSPENDED" ? "Restore access" : "Suspend access"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => removeMember(row.member)} className="text-destructive">
                        <UserMinus className="h-4 w-4" /> Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span />
                )}
              </div>
            ) : (
              <div key={row.invitation.id} className="grid grid-cols-1 gap-3 border-b border-sidebar-border bg-muted/20 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(260px,1.35fr)_120px_140px_minmax(220px,1fr)_48px] lg:items-center">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{row.invitation.email}</p><p className="truncate text-xs text-muted-foreground">Invited by {row.invitation.invitedBy.name}</p></div>
                <div><RoleBadge role={row.invitation.role} /></div>
                <div>{statusBadge(row.invitation.status)}</div>
                <ProjectChips projects={row.invitation.projects} allCount={projects.length} />
                {currentUser.canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>} />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => invitationAction(row.invitation, "resend")}><RefreshCcw className="h-4 w-4" /> Resend</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/invite/${encodeURIComponent(row.invitation.token)}`).then(() => toast.success("Invitation link copied"))}><Copy className="h-4 w-4" /> Copy link</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => invitationAction(row.invitation, "cancel")} className="text-destructive"><XCircle className="h-4 w-4" /> Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span />
                )}
              </div>
            ),
          )
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent showCloseButton className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite members</DialogTitle>
            <DialogDescription>Invite one or more people to {workspace.name} with a role and project access.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium leading-none">Email addresses</label>
              <Textarea value={inviteEmails} onChange={(event) => setInviteEmails(event.target.value)} placeholder="alex@example.com, priya@example.com" />
            </div>
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div>
                <label className="mb-2 block text-sm font-medium leading-none">Workspace role</label>
                <Combobox
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as MemberRole)}
                  options={roles.map((role) => ({ value: role, label: roleLabel(role) }))}
                  searchable={false}
                  aria-label="Invitation role"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium leading-none">Project access</label>
                <ProjectPicker projects={projects} selected={inviteProjects} onChange={setInviteProjects} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium leading-none">Personal message</label>
              <Textarea value={inviteMessage} onChange={(event) => setInviteMessage(event.target.value)} placeholder="Optional note for the invitation email" />
            </div>
            {preview ? (
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Invitation preview</p>
                <p className="mt-2 text-muted-foreground">{parsedEmails.length} recipient(s) will be invited as {roleLabel(inviteRole)} to {inviteProjects.length === 0 ? "all current projects" : `${inviteProjects.length} selected project(s)`}.</p>
                {inviteMessage ? <p className="mt-2 rounded-md bg-background p-3">{inviteMessage}</p> : null}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview((value) => !value)}>{preview ? "Hide preview" : "Preview"}</Button>
            <Button onClick={sendInvite} disabled={submitting || parsedEmails.length === 0}>
              <UserRoundCheck className="h-4 w-4" />
              {submitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
