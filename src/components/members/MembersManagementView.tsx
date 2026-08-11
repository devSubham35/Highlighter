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
  ArrowDownAZ,
  CircleCheck,
  Clock,
  Copy,
  MailPlus,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserMinus,
  UserRoundCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
const menuIconClassName = "h-4 w-4";
const roleOptions = [
  { value: "ALL", label: "All roles", icon: <Users className={menuIconClassName} /> },
  ...roles.map((role) => ({
    value: role,
    label: roleLabel(role),
    icon: <ShieldCheck className={menuIconClassName} />,
  })),
];
const statusOptions = statuses.map((status) => ({
  value: status,
  label: status === "ALL" ? "All statuses" : status.charAt(0) + status.slice(1).toLowerCase(),
  icon:
    status === "ALL" ? (
      <SlidersHorizontal className={menuIconClassName} />
    ) : status === "ACTIVE" ? (
      <CircleCheck className={menuIconClassName} />
    ) : status === "PENDING" ? (
      <Clock className={menuIconClassName} />
    ) : (
      <XCircle className={menuIconClassName} />
    ),
}));
const sortOptions = [
  { value: "name", label: "Sort by", icon: <ArrowDownAZ className={menuIconClassName} /> },
  { value: "joined", label: "Recently joined", icon: <Clock className={menuIconClassName} /> },
];
const memberMenuItemClass =
  "gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-foreground data-highlighted:bg-primary/10 data-highlighted:text-primary";
const memberMenuDangerItemClass =
  "gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive";

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseInviteEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function invitationErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "Check the invitation details.";

  const payload = error as { message?: unknown; emails?: unknown };
  const message = typeof payload.message === "string" ? payload.message : "Check the invitation details.";
  const emails = Array.isArray(payload.emails)
    ? payload.emails.filter((email): email is string => typeof email === "string")
    : [];

  return emails.length > 0 ? `${message} ${emails.join(", ")}` : message;
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
  if (allCount === 0) {
    return <span className="text-sm text-muted-foreground">No projects yet</span>;
  }
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
  disabled = false,
}: {
  projects: Project[];
  selected: string[];
  onChange: (projectIds: string[]) => void;
  disabled?: boolean;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 text-sm font-medium text-muted-foreground shadow-[var(--control-shadow)]">
        No projects yet
      </div>
    );
  }

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
      disabled={disabled}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "joined">("name");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteEmailChips, setInviteEmailChips] = useState<string[]>([]);
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [inviteProjects, setInviteProjects] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingMemberAction, setPendingMemberAction] = useState<
    | { type: "suspend"; member: MemberRow }
    | { type: "remove"; member: MemberRow }
    | null
  >(null);
  const [pendingInvitationAction, setPendingInvitationAction] = useState<
    | { type: "cancel-remove"; invitation: InvitationRow }
    | null
  >(null);
  const [invitationActionPending, setInvitationActionPending] = useState(false);

  useEffect(() => {
    if (searchParams.get("invite") !== "1") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled && currentUser.canInvite) setInviteOpen(true);
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("invite");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    return () => {
      cancelled = true;
    };
  }, [currentUser.canInvite, pathname, router, searchParams]);

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

  const parsedEmails = useMemo(() => Array.from(new Set([...inviteEmailChips, ...parseInviteEmails(inviteEmails)])), [inviteEmailChips, inviteEmails]);

  function addInviteEmailChips() {
    if (submitting) return;
    const nextEmails = parseInviteEmails(inviteEmails);
    if (nextEmails.length === 0) return;

    setInviteEmailChips((current) => Array.from(new Set([...current, ...nextEmails])));
    setInviteEmails("");
  }

  function removeInviteEmailChip(email: string) {
    if (submitting) return;
    setInviteEmailChips((current) => current.filter((item) => item !== email));
  }

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
      toast.error("Invitation failed", invitationErrorMessage(payload.error));
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
    setInviteEmails("");
    setInviteEmailChips([]);
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

  async function confirmInvitationAction() {
    if (!pendingInvitationAction) return;
    setInvitationActionPending(true);
    const response = await fetch(`/api/invitations/${pendingInvitationAction.invitation.id}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);
    setInvitationActionPending(false);

    if (!response.ok) {
      toast.error(
        "Could not cancel invitation",
        typeof payload?.error === "string" ? payload.error : "Try again.",
      );
      return;
    }

    setInvitations((current) => current.filter((item) => item.id !== pendingInvitationAction.invitation.id));
    toast.success("Invitation cancelled and removed");
    setPendingInvitationAction(null);
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
            showSelectedCheck={false}
            aria-label="Filter by role"
            className="h-9 w-full sm:w-36"
          />
          <Combobox
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as (typeof statuses)[number])}
            options={statusOptions}
            searchable={false}
            showSelectedCheck={false}
            aria-label="Filter by status"
            className="h-9 w-full sm:w-40"
          />
          <Combobox
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "name" | "joined")}
            options={sortOptions}
            searchable={false}
            showSelectedCheck={false}
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
              <div key={row.member.id} className="grid grid-cols-1 gap-3 border-b border-sidebar-border px-4 py-2.5 last:border-b-0 lg:grid-cols-[minmax(260px,1.35fr)_120px_140px_minmax(220px,1fr)_48px] lg:items-center">
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
                {currentUser.canManage && row.member.role !== "OWNER" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg border border-border/70 bg-card text-muted-foreground shadow-sm hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-xl border-border bg-popover p-1.5 shadow-xl">
                      {roles.filter((role) => role !== "OWNER").map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => updateMember(row.member, { role })}
                          className={memberMenuItemClass}
                        >
                          <ShieldCheck className="h-4 w-4" /> Make {roleLabel(role)}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem
                        onClick={() => setPendingMemberAction({ type: "suspend", member: row.member })}
                        className={memberMenuItemClass}
                      >
                        <XCircle className="h-4 w-4" /> {row.member.status === "SUSPENDED" ? "Restore access" : "Suspend access"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPendingMemberAction({ type: "remove", member: row.member })} className={memberMenuDangerItemClass}>
                        <UserMinus className="h-4 w-4" /> Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span />
                )}
              </div>
            ) : (
              <div key={row.invitation.id} className="grid grid-cols-1 gap-3 border-b border-sidebar-border bg-muted/20 px-4 py-2.5 last:border-b-0 lg:grid-cols-[minmax(260px,1.35fr)_120px_140px_minmax(220px,1fr)_48px] lg:items-center">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{row.invitation.email}</p><p className="truncate text-xs text-muted-foreground">Invited by {row.invitation.invitedBy.name}</p></div>
                <div><RoleBadge role={row.invitation.role} /></div>
                <div>{statusBadge(row.invitation.status)}</div>
                <ProjectChips projects={row.invitation.projects} allCount={projects.length} />
                {currentUser.canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg border border-border/70 bg-card text-muted-foreground shadow-sm hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-xl border-border bg-popover p-1.5 shadow-xl">
                      {row.invitation.status === "PENDING" ? null : (
                        <DropdownMenuItem onClick={() => invitationAction(row.invitation, "resend")} className={memberMenuItemClass}><RefreshCcw className="h-4 w-4" /> Resend</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/invite/${encodeURIComponent(row.invitation.token)}`).then(() => toast.success("Invitation link copied"))} className={memberMenuItemClass}><Copy className="h-4 w-4" /> Copy link</DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1.5" />
                      {row.invitation.status === "PENDING" ? (
                        <DropdownMenuItem onClick={() => setPendingInvitationAction({ type: "cancel-remove", invitation: row.invitation })} className={memberMenuDangerItemClass}><XCircle className="h-4 w-4" /> Cancel and remove</DropdownMenuItem>
                      ) : null}
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

      <Dialog open={inviteOpen} onOpenChange={(open) => {
        if (submitting) return;
        setInviteOpen(open);
      }}>
        <DialogContent showCloseButton className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite members</DialogTitle>
            <DialogDescription>Invite one or more people to {workspace.name} with a role and project access.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium leading-none">Email addresses</label>
              <div className="flex h-24 flex-wrap content-start gap-2 overflow-y-auto rounded-md border border-input bg-card px-3 py-2 shadow-[var(--control-shadow)] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
                {inviteEmailChips.map((email) => (
                  <Badge key={email} variant="secondary" className="h-7 max-w-full gap-1.5 rounded-md px-2.5">
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => removeInviteEmailChip(email)}
                      disabled={submitting}
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={inviteEmails}
                  onChange={(event) => setInviteEmails(event.target.value)}
                  onBlur={addInviteEmailChips}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "," || event.key === ";") {
                      event.preventDefault();
                      addInviteEmailChips();
                    }
                  }}
                  placeholder={inviteEmailChips.length === 0 ? "alex@example.com, priya@example.com" : "Add another email"}
                  disabled={submitting}
                  className="h-7 min-w-48 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
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
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium leading-none">Project access</label>
                <ProjectPicker projects={projects} selected={inviteProjects} onChange={setInviteProjects} disabled={submitting} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium leading-none">Personal message</label>
              <Textarea
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder="Optional note for the invitation email"
                disabled={submitting}
                className="h-24 resize-none"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={sendInvite} disabled={submitting || parsedEmails.length === 0}>
              <UserRoundCheck className="h-4 w-4" />
              {submitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingMemberAction)}
        onOpenChange={(open) => {
          if (!open) setPendingMemberAction(null);
        }}
      >
        <DialogContent showCloseButton className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingMemberAction?.type === "remove"
                ? "Remove Member?"
                : pendingMemberAction?.member.status === "SUSPENDED"
                  ? "Restore member access?"
                  : "Suspend member access?"}
            </DialogTitle>
            <DialogDescription>
              {pendingMemberAction?.type === "remove"
                ? `${pendingMemberAction.member.user.name || pendingMemberAction.member.user.email} will lose access to ${workspace.name}.`
                : pendingMemberAction?.member.status === "SUSPENDED"
                  ? `${pendingMemberAction?.member.user.name || pendingMemberAction?.member.user.email} will regain access to this workspace.`
                  : `${pendingMemberAction?.member.user.name || pendingMemberAction?.member.user.email} will no longer be able to access this workspace until restored.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingMemberAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingMemberAction?.type === "remove" ? "destructive" : "default"}
              className={pendingMemberAction?.type === "remove" ? "text-white hover:text-white" : undefined}
              onClick={async () => {
                if (!pendingMemberAction) return;
                if (pendingMemberAction.type === "remove") {
                  await removeMember(pendingMemberAction.member);
                } else {
                  await updateMember(pendingMemberAction.member, {
                    suspended: pendingMemberAction.member.status !== "SUSPENDED",
                  });
                }
                setPendingMemberAction(null);
              }}
            >
              {pendingMemberAction?.type === "remove"
                ? "Remove Member"
                : pendingMemberAction?.member.status === "SUSPENDED"
                  ? "Restore access"
                  : "Suspend access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingInvitationAction)}
        onOpenChange={(open) => {
          if (invitationActionPending) return;
          if (!open) setPendingInvitationAction(null);
        }}
      >
        <DialogContent showCloseButton className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel and remove invitation?</DialogTitle>
            <DialogDescription>
              {pendingInvitationAction?.invitation.email} will no longer be able to use this invitation link, and the invitation will be removed from this list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={invitationActionPending}
              onClick={() => setPendingInvitationAction(null)}
            >
              Keep invitation
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="text-white hover:text-white"
              disabled={invitationActionPending}
              onClick={() => void confirmInvitationAction()}
            >
              {invitationActionPending ? "Cancelling..." : "Cancel and remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
