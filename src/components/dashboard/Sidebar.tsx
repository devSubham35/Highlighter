"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { avatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  CreditCard,
  FileText,
  FolderKanban,
  Highlighter,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Puzzle,
  ScrollText,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

export type SidebarWorkspace = {
  id: string;
  name: string;
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
    label: "Reports",
    icon: FileText,
    href: "/dashboard",
    match: () => false,
  },
  {
    label: "Members",
    icon: Users,
    href: "/settings",
    match: () => false,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    match: (pathname) => pathname === "/settings" || pathname === "/profile",
  },
  {
    label: "Billing",
    icon: CreditCard,
    href: "/settings",
    match: () => false,
  },
  {
    label: "Audit log",
    icon: ScrollText,
    href: "/settings",
    match: () => false,
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

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0] ?? null,
    [workspaces, workspaceId],
  );

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

  const userInitials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userColors = avatarColor(user.email ?? user.name ?? "user");

  function handleLogout() {
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Highlighter className="h-4 w-4" />
        </div>
        <span className="truncate text-sm font-semibold text-foreground">Highlighter</span>
      </div>

      <div className="shrink-0 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2.5 rounded-md border border-sidebar-border bg-card px-2.5 text-left transition-colors hover:bg-muted/40"
              >
                {currentWorkspace ? (
                  <>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                        avatarColor(currentWorkspace.id).bg,
                        avatarColor(currentWorkspace.id).text,
                      )}
                    >
                      {workspaceInitial(currentWorkspace.name)}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {currentWorkspace.name}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-sm text-muted-foreground">Select workspace</span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            {workspaces.length === 0 ? (
              <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                Create a workspace
              </DropdownMenuItem>
            ) : (
              workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => router.push(`/workspaces/${workspace.id}`)}
                  className="gap-2"
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
                      avatarColor(workspace.id).bg,
                      avatarColor(workspace.id).text,
                    )}
                  >
                    {workspaceInitial(workspace.name)}
                  </div>
                  <span className="truncate">{workspace.name}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/workspaces")}>
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
        <div className="rounded-md border border-sidebar-border bg-card p-3">
          <p className="text-xs font-semibold text-foreground">Invite your team</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Collaborate on projects and triage feedback together.
          </p>
          <div className="mt-3 flex items-center">
            {[0, 1, 2].map((index) => (
              <Avatar
                key={index}
                className={cn("size-7 border border-border", index > 0 && "-ml-2")}
              >
                <AvatarFallback
                  className={cn(
                    "text-[10px] font-semibold",
                    avatarColor(`invite-${index}`).bg,
                    avatarColor(`invite-${index}`).text,
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-8 w-full rounded-md text-xs"
            onClick={() => router.push("/settings")}
          >
            Invite members
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-md border border-transparent px-1 py-1.5 text-left transition-colors hover:border-sidebar-border hover:bg-muted/40"
              >
                <Avatar className="size-8">
                  {user.image ? <AvatarImage src={user.image} alt={user.name ?? "User"} /> : null}
                  <AvatarFallback
                    className={cn("text-xs font-semibold", userColors.bg, userColors.text)}
                  >
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
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive data-highlighted:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
