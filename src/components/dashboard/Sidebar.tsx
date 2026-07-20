"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  CreditCard,
  FileText,
  FolderKanban,
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
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    label: "Projects",
    icon: FolderKanban,
    href: (workspaceId) =>
      workspaceId ? `/workspaces/${workspaceId}/projects` : "/workspaces",
    match: (pathname, workspaceId) =>
      workspaceId !== null && pathname.startsWith(`/workspaces/${workspaceId}/projects`),
  },
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: (workspaceId) => (workspaceId ? `/workspaces/${workspaceId}` : "/workspaces"),
    match: (pathname, workspaceId) =>
      workspaceId !== null && pathname === `/workspaces/${workspaceId}`,
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
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

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
          <Image
            src="/assets/logo_light.png"
            alt="Highlighter_logo_light"
            width={1136}
            height={160}
            priority
            className="h-10 w-auto max-w-35 object-contain dark:hidden"
          />
          <Image
            src="/assets/logo_dark.png"
            alt="Highlighter_logo_dark"
            width={1136}
            height={160}
            priority
            className="hidden h-10 w-auto max-w-35 object-contain dark:block"
          />
        </Link>
      </div>

      <div className="shrink-0 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border border-sidebar-border bg-card px-2.5 text-left transition-colors hover:bg-muted/40"
              >
                {currentWorkspace ? (
                  <>
                    <Avatar className="size-7 rounded-md">
                      <AvatarImage src={DEFAULT_AVATAR_IMAGE} alt={currentWorkspace.name} />
                      <AvatarFallback className="rounded-md text-xs font-semibold">
                        {workspaceInitial(currentWorkspace.name)}
                      </AvatarFallback>
                    </Avatar>
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
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src={DEFAULT_AVATAR_IMAGE} alt={workspace.name} />
                    <AvatarFallback className="rounded-md text-[10px] font-semibold">
                      {workspaceInitial(workspace.name)}
                    </AvatarFallback>
                  </Avatar>
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
            className="mt-3 h-8 w-full rounded-md text-xs"
            onClick={() => router.push("/settings")}
          >
            Invite members
          </Button>
        </div>

        <div className="relative">
          <button
            ref={profileTriggerRef}
            type="button"
            aria-expanded={profileMenuOpen}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-sidebar-border px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <Avatar className="size-8">
              <AvatarImage src={user.image ?? DEFAULT_AVATAR_IMAGE} alt={user.name ?? "User"} />
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted"
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted"
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none transition-colors hover:bg-muted"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
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
