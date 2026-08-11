"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/common/RoleBadge";
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
import { signOut } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { disconnectRealtimeSocket } from "@/lib/use-issue-realtime";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@prisma/client";
import {
  ChevronDown,
  Check,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MailPlus,
  MessageSquare,
  Plus,
  Puzzle,
  Settings,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SidebarWorkspace = {
  id: string;
  name: string;
  role: MemberRole;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string | ((workspaceId: string | null) => string);
  match: (pathname: string, workspaceId: string | null) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: (workspaceId) => (workspaceId ? `/workspaces/${workspaceId}` : "/workspaces"),
    match: (pathname, workspaceId) =>
      workspaceId !== null && pathname === `/workspaces/${workspaceId}`,
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: (workspaceId) =>
      workspaceId ? `/workspaces/${workspaceId}/projects` : "/workspaces",
    match: (pathname, workspaceId) =>
      workspaceId !== null && pathname.startsWith(`/workspaces/${workspaceId}/projects`),
  },
  {
    label: "Members",
    icon: Users,
    href: (workspaceId) =>
      workspaceId ? `/workspaces/${workspaceId}/members` : "/workspaces",
    match: (pathname, workspaceId) =>
      workspaceId !== null && pathname.startsWith(`/workspaces/${workspaceId}/members`),
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    match: (pathname) => pathname === "/settings" || pathname === "/profile",
  },
];

type ProjectNavItem = {
  label: string;
  icon: LucideIcon;
  href: (projectId: string) => string;
  match: (pathname: string, projectId: string) => boolean;
};

const projectNavItems: ProjectNavItem[] = [
  {
    label: "Feedbacks",
    icon: MessageSquare,
    href: (projectId) => `/projects/${projectId}`,
    match: (pathname, projectId) => pathname === `/projects/${projectId}`,
  },
  {
    label: "Widgets",
    icon: Puzzle,
    href: (projectId) => `/projects/${projectId}/widgets`,
    match: (pathname, projectId) => pathname.startsWith(`/projects/${projectId}/widgets`),
  },
  {
    label: "Settings",
    icon: Settings,
    href: (projectId) => `/projects/${projectId}/settings`,
    match: (pathname, projectId) => pathname.startsWith(`/projects/${projectId}/settings`),
  },
];

const DEFAULT_AVATAR_IMAGE = "https://github.com/maxleiter.png";

function workspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

function getWorkspaceIdFromPath(pathname: string) {
  const match = pathname.match(/^\/workspaces\/([^/]+)/);
  return match?.[1] ?? null;
}

function getProjectIdFromPath(pathname: string) {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function InviteMembersDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: SidebarWorkspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setEmail("");
    setEmails([]);
    setError("");
    setSubmitting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  }

  function addEmail() {
    const nextEmail = email.trim().toLowerCase();
    setError("");

    if (!nextEmail) return;
    if (!isValidEmail(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (emails.includes(nextEmail)) {
      setError("This email is already in the invite list.");
      return;
    }

    setEmails((current) => [...current, nextEmail]);
    setEmail("");
  }

  async function sendInvites() {
    if (!workspace) return;
    if (emails.length === 0) {
      setError("Add at least one email address.");
      return;
    }

    setSubmitting(true);
    setError("");

    const failed: string[] = [];

    for (const inviteEmail of emails) {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, email: inviteEmail }),
      });

      if (!response.ok) {
        failed.push(inviteEmail);
      }
    }

    setSubmitting(false);

    if (failed.length > 0) {
      setEmails(failed);
      toast.error(
        "Some invites failed",
        `${failed.length} ${failed.length === 1 ? "email" : "emails"} could not be invited.`,
      );
      return;
    }

    toast.success(
      "Invites sent",
      `${emails.length} ${emails.length === 1 ? "member was" : "members were"} invited to ${workspace.name}.`,
    );
    router.refresh();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Add teammates to {workspace?.name ?? "this workspace"} by email.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground" htmlFor="invite-member-email">
              Email address
            </label>
            <div className="flex gap-2">
              <Input
                id="invite-member-email"
                type="email"
                value={email}
                placeholder="teammate@example.com"
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={addEmail} aria-label="Add email">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          <div className="max-h-44 overflow-y-auto rounded-lg border border-sidebar-border bg-muted/30 p-3">
            {emails.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center px-3 text-center text-sm text-muted-foreground">
                Added email addresses will appear here.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {emails.map((inviteEmail) => (
                  <span
                    key={inviteEmail}
                    className="inline-flex max-w-full items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary"
                  >
                    <span className="min-w-0 truncate">{inviteEmail}</span>
                    <button
                      type="button"
                      className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15 hover:text-primary"
                      onClick={() => setEmails((current) => current.filter((item) => item !== inviteEmail))}
                      aria-label={`Remove ${inviteEmail}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={sendInvites} disabled={submitting || emails.length === 0}>
            {submitting ? "Sending..." : "Send invites"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  workspaces,
  user,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  workspaces: SidebarWorkspace[];
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = getWorkspaceIdFromPath(pathname);
  const projectId = getProjectIdFromPath(pathname);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [inviteMembersOpen, setInviteMembersOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0] ?? null,
    [workspaces, workspaceId],
  );
  const canInviteMembers = currentWorkspace?.role === "OWNER";

  const closeMobile = useCallback(() => onCloseMobile(), [onCloseMobile]);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        profileMenuRef.current?.contains(target) ||
        profileTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setProfileMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  const userInitials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    disconnectRealtimeSocket();
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link href="/workspaces" className="flex min-w-0 items-center">
          <span className="text-lg font-semibold text-foreground">Highlight</span>
        </Link>
      </div>

      <div className="shrink-0 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-primary bg-primary px-3 py-2 text-left shadow-[var(--control-shadow)] transition-colors hover:bg-primary/90"
              >
                {currentWorkspace ? (
                  <>
                    <Avatar className="size-7 rounded-lg border border-white/30 bg-white text-primary">
                      <AvatarFallback className="rounded-lg bg-white text-xs font-semibold text-primary">
                        {workspaceInitial(currentWorkspace.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                      {currentWorkspace.name}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-sm text-white/80">Select workspace</span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-white/80" />
              </button>
            }
          />
          <DropdownMenuContent align="start" sideOffset={8} className="w-64 rounded-xl border-border bg-popover p-1.5 shadow-xl">
            {workspaces.length === 0 ? (
              <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                Create a workspace
              </DropdownMenuItem>
            ) : (
              workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => router.push(`/workspaces/${workspace.id}`)}
                  className={cn(
                    "items-center gap-2.5 rounded-lg px-3 py-2.5",
                    workspace.id === currentWorkspace?.id &&
                      "bg-primary/10 text-primary data-highlighted:bg-primary/10 data-highlighted:text-primary",
                  )}
                >
                  <Avatar className="size-7 rounded-lg border border-primary/15 bg-primary/10 text-primary">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                      {workspaceInitial(workspace.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{workspace.name}</span>
                    <RoleBadge role={workspace.role} className="shrink-0" />
                  </span>
                  {workspace.id === currentWorkspace?.id ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/workspaces")} className="rounded-lg px-3 py-2.5 text-[13px] font-medium">
              All workspaces
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {projectId ? (
          <>
            <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70">
              Project
            </p>
            {projectNavItems.map((item) => {
              const active = item.match(pathname, projectId);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href(projectId)}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        ) : (
          navItems.map((item) => {
            const href =
              typeof item.href === "function" ? item.href(workspaceId) : item.href;
            const active = item.match(pathname, workspaceId);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      <div className="shrink-0 space-y-3 p-3">
        {canInviteMembers ? (
          <div className="rounded-md border border-sidebar-border bg-card p-3">
            <p className="text-sm font-semibold text-foreground">Invite your team</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Collaborate on projects and get feedback together.
            </p>
            <AvatarGroup className="mt-3">
              {[0, 1, 2].map((index) => (
                <Avatar key={index} className="size-7 border border-border ring-2 ring-card">
                  <AvatarImage
                    src={DEFAULT_AVATAR_IMAGE}
                    alt={`Team member ${String.fromCharCode(65 + index)}`}
                  />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {String.fromCharCode(65 + index)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2"
              onClick={() => {
                if (!currentWorkspace) return;
                router.push(`/workspaces/${currentWorkspace.id}/members?invite=1`);
              }}
            >
              <MailPlus className="h-4 w-4" />
              Invite Members
            </Button>
          </div>
        ) : null}

        <div className="relative">
          <button
            ref={profileTriggerRef}
            type="button"
            aria-expanded={profileMenuOpen}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-md border border-sidebar-border px-3 py-2 text-left transition-colors hover:bg-muted/40"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <Avatar className="size-8">
              {user.image ? <AvatarImage src={user.image} alt={user.name ?? "User"} /> : null}
              <AvatarFallback className="text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          {profileMenuOpen ? (
            <div
              ref={profileMenuRef}
              className="absolute bottom-0 left-full z-50 ml-2 w-56 overflow-hidden rounded-lg border border-sidebar-border bg-popover p-1 shadow-xl outline-none"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setProfileMenuOpen(false);
                  router.push("/profile");
                }}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setProfileMenuOpen(false);
                  router.push("/settings");
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none transition-colors hover:bg-accent"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <InviteMembersDialog
        workspace={currentWorkspace}
        open={inviteMembersOpen}
        onOpenChange={setInviteMembersOpen}
      />
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-60 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
